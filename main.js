'use strict'

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        show: false,
        frame: false
    })

    mainWindow.loadFile(path.join("html", "index.html"))

    mainWindow.on('ready-to-show', () => {
        //mainWindow.maximize()
        mainWindow.show()
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.on('ready', createWindow)

ipcMain.on('quit', () => {
    app.quit()
})

ipcMain.on('minimize', () => {
    mainWindow.minimize();
})