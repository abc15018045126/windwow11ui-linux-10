const { app, BrowserWindow, session } = require('electron');
const { startServer, setWindow } = require('./server');

let win;

function createWindow() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    callback({ responseHeaders: headers });
  });

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false, // It's good practice to disable webviewtag if not used
    }
  });

  // Start with a blank page. Navigation will be controlled remotely.
  win.loadURL('about:blank');

  const controls = {
    win: win,
    loadURL: (url) => {
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        win.loadURL(url);
      }
    },
    goBack: () => {
      if (win.webContents.canGoBack()) {
        win.webContents.goBack();
      }
    },
    goForward: () => {
      if (win.webContents.canGoForward()) {
        win.webContents.goForward();
      }
    },
    reload: () => {
      win.webContents.reload();
    }
  };

  // Pass the controls object to the server
  setWindow(controls);
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});
