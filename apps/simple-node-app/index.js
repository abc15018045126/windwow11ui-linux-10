const fs = require('fs');
const path = require('path');

// A simple app that logs a message and creates a file.
console.log('Hello from the simple-node-app!');
console.log('This app was launched successfully.');
console.log(`Arguments received: ${process.argv.slice(2).join(' ')}`);

// Create a log file in the app's directory to show it ran
const logMessage = `App ran at: ${new Date().toISOString()}\n`;
const logFilePath = path.join(__dirname, 'run.log');

fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
        console.error('Failed to write log file:', err);
        return;
    }
    console.log('Log file updated successfully.');
});

// Keep the app running for a few seconds to simulate work
setTimeout(() => {
    console.log('Simple node app finished.');
}, 5000);
