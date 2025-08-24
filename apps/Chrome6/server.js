const express = require('express');
const path = require('path');
const WebSocket = require('ws');

let controls = null;

function setWindow(ctrls) {
  controls = ctrls;
}

function startServer() {
  const app = express();
  const port = 3001;
  app.use(express.static(path.join(__dirname, 'public')));
  app.listen(port, () => console.log(`HTTP 服务器: http://localhost:${port}`));

  // Input and Command WebSocket
  const wssInput = new WebSocket.Server({ port: 8083 });
  console.log("输入/命令 WebSocket: ws://localhost:8083");
  global.wssInput = wssInput;

  wssInput.on('connection', (ws) => {
    if (controls) {
      const [w, h] = controls.win.getSize();
      ws.send(JSON.stringify({ type: 'size', width: w, height: h }));
    }

    ws.on('message', (msg) => {
      try {
        const event = JSON.parse(msg.toString());
        if (!controls) return;

        switch (event.type) {
          case 'input':
            controls.win.webContents.sendInputEvent(event.payload);
            break;
          case 'navigate':
            controls.loadURL(event.url);
            break;
          case 'action':
            handleAction(event.command);
            break;
        }
      } catch (err) {
        console.error('解析输入消息失败:', err);
      }
    });
  });

  function handleAction(command) {
    if (!controls) return;
    switch (command) {
      case 'goBack':
        controls.goBack();
        break;
      case 'goForward':
        controls.goForward();
        break;
      case 'reload':
        controls.reload();
        break;
    }
  }

  // Screenshot WebSocket
  const wssFrame = new WebSocket.Server({ port: 8084 });
  console.log("截图 WebSocket: ws://localhost:8084");

  wssFrame.on('connection', (ws) => {
    const interval = setInterval(async () => {
      if (!controls || ws.readyState !== WebSocket.OPEN) return;
      try {
        const image = await controls.win.webContents.capturePage();
        const buffer = image.toPNG();
        ws.send(buffer);
      } catch (err) {
        // Errors are expected if the window is closed or busy
      }
    }, 200);

    ws.on('close', () => clearInterval(interval));
  });
}

module.exports = { startServer, setWindow };
