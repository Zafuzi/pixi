const {
    app,
    BrowserWindow,
    session,
    ipcMain
} = require('electron');

try {
    require('electron-reloader')(module);
} catch (e) {
    console.log(e);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 900,
        autoHideMenuBar: true,
        backgroundColor: "#fff",
        fullscreenable: true,
        webPreferences: {
            nodeIntegration: false
        }
    })

    win.loadFile('index.html')
    win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})