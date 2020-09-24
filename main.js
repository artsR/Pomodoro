const {app, BrowserWindow, Tray, Menu, ipcMain, screen} = require('electron')
const path = require('path')
const url = require('url')
const {PythonShell} = require('python-shell')



let tray
let mainWindow
let pyshell


app.whenReady().then(() => {
    runServer()
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

ipcMain.on('show-message', () => {
    mainWindow.webContents.send('show-message')
})


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
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, '/assets/main.html'),
            protocol: 'file:',
            slashes: true,
        })
    )
    mainWindow.on('closed', () => {
        mainWindow = null
        pyshell.kill('SIGINT')
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

function createSettingsWindow() {
    let settingsWindow = new BrowserWindow({
        width: 400,
        height: 200,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true
        }
    })
    settingsWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, '/assets/settings.html'),
            protocol: 'file',
            slashes: true,
        })
    )
    settingsWindow.on('close', () => {
        settingsWindow = null
    })
    settingsWindow.show()
}

function runServer() {
    let FILE_TO_EXEC = 'server.py'

    let options = {
        scriptPath: path.join(__dirname, './pomodoro/'),
    }
    pyshell = PythonShell.run(`${FILE_TO_EXEC}`, options, err => console.log(err))

    // pyshell = require('child_process').execFile(path.join(__dirname, 'pomodoro', 'server'))
}
