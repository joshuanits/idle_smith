'use strict'

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// todo: make this into an actual thing. for now this works, so thats good enough.
var data = {
    money: 0,
    xp: 0,
    ores: {
        bronze: 1,
        iron: 2,
        steel: 3,
    },
    bars: {
        bronze: 0,
        iron: 0,
        steel: 0
    },
    smelting: {
        active: false,
        bar: '',
        quantity: 0,
        progress: 0
    }
}

// main game loop
const gameLoop = () => {
    if(mainWindow === null) return

    if(data.smelting.active) {
        data.smelting.progress += 3 / 100;
        if(data.smelting.progress >= 1) {
            // finish smelting
            data.bars[data.smelting.bar] += data.smelting.quantity

            data.smelting.active = false
            data.smelting.bar = ''
            data.smelting.quantity = 0
            data.smelting.progress = 0

            mainWindow.send('bars_updated', data.bars)
        }

        mainWindow.send('smelting_updated', data.smelting)
    }
}

ipcMain.on('smelting_start', (e, oreId) => {
    if(!data.smelting.active && data.ores[oreId] > 0) {
        data.smelting.active = true
        data.smelting.bar = oreId
        data.smelting.quantity = 1

        data.ores[oreId] -= 1

        mainWindow.send('ores_updated', data.ores)
    }
})

let mainWindow

const createWindow = () => {
    mainWindow = new BrowserWindow({
        show: false,
        frame: false
    })

    mainWindow.loadFile(path.join('html', 'index.html'))
    mainWindow.setMovable(true) // since the window is frameless need to make it so we can drag it around

    mainWindow.on('ready-to-show', () => {
        //mainWindow.maximize()
        mainWindow.show()
        mainWindow.send('ores_updated', data.ores)
        mainWindow.send('bars_updated', data.bars)
        mainWindow.send('smelting_updated', data.smelting)
        setInterval(gameLoop, 10)
    })

    mainWindow.on('closed', () => {
        clearInterval(gameLoop)
        mainWindow = null
    })
}

// window functions

app.on('ready', createWindow)

ipcMain.on('quit', () => {
    app.quit()
})

ipcMain.on('minimize', () => {
    mainWindow.minimize();
})

ipcMain.on('toggle_maximize', () => {
    if(mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
})