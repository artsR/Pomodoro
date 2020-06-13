const {app, BrowserWindow, Tray, Menu, screen} = require('electron')
const path = require('path')
const url = require('url')



let tray
let mainWindow


app.whenReady().then(() => {
    createTray()
    createWindow()
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    // Reopen the app on macOS:
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
app.allowRendererProcessReuse = false


function createTray() {
    tray = new Tray(path.join(__dirname, '/assets/icons/png/old-thunderbird-v2-icon.png'))
    tray.on('click', (event) => toggleWindow())

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click() {
                app.quit()
            }
        },
        {
            label: 'Settings',
            click() {
                createSettingsWindow()
            }
        },
    ])
    tray.setContextMenu(contextMenu)
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 604,
        height: 300,
        show: false,
        transparent: true,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    })
    mainWindow.loadURL(//'http://127.0.0.1:3000/main.html'
        url.format({
            pathname: path.join(__dirname, 'main.html'),
            protocol: 'file:',
            slashes: true,
        })
    )
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

function toggleWindow() {
    mainWindow.isVisible() ? mainWindow.hide() : showWindow()
}

function showWindow() {
    const mainWindowWidth = mainWindow.getBounds().width
    const screenWidth = screen.getPrimaryDisplay().size.width

    const coordX =  screenWidth - mainWindowWidth - 10
    const coordY = 40

    const position = {x: coordX, y: coordY}
    mainWindow.setPosition(position.x, position.y, false)
    mainWindow.show()
    mainWindow.focus()
}
// ipcMain.on('show-window', () => showWindow())
