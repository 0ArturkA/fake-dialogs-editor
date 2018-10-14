const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        resizable: false
    });

    mainWindow.loadFile(path.resolve(__dirname, 'app', 'pages', 'main.html'));

    if (process.env.NODE_ENV === 'production') {
        mainWindow.setMenu(null);
    }

    mainWindow.on('closed', () => app.quit());
});

ipcMain.on('loadPage', (event, arg) => {
    mainWindow.loadFile(path.resolve(__dirname, 'app', 'pages', arg));
});