'use strict'

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// todo: make this into an actual thing. for now this works, so thats good enough.
var data = {
    money: 10,
    xp: 0,
    ores: {
        bronze: 0,
        iron: 0,
        steel: 0,
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
    },
    unlocked: {
        metals: {
            bronze: true,
            iron: true,
            steel: false
        },
        items: {
            bronze: {
                dagger: true,
                boots: false,
                hemlet: false,
            },
            iron: {
                dagger: false,
                boots: false,
                hemlet: false,
            }
        }
    },
    prices: {
        ore: {
            bronze: 1,
            iron: 5,
            steel: 50
        }
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

// when the player starts smelting
ipcMain.on('smelting_start', (e, oreId) => {
    if(!data.smelting.active && data.ores[oreId] > 0) {
        data.smelting.active = true
        data.smelting.bar = oreId
        data.smelting.quantity = 1

        data.ores[oreId] -= 1

        mainWindow.send('ores_updated', data.ores)
    }
})

// buy ores
ipcMain.on('ores_buy', (e, oreId, buyAmount) => {
    const orePrice = data.prices.ore[oreId]

    if(data.money >= orePrice * buyAmount) {
        data.money -= orePrice * buyAmount
        data.ores[oreId] += buyAmount

        mainWindow.send('money_updated', data.money)
        mainWindow.send('ores_updated', data.ores)
    }
})

ipcMain.on('request_data', (e, dataKey) => {
    let keys = dataKey.split('.')
    let currentData = data

    for(let key of keys) {
        currentData = currentData[key]
    }

    e.returnValue = currentData
})

const updateAll = () => {
    mainWindow.send('smithing_metals_updated', data.unlocked)
    mainWindow.send('ores_updated')
    mainWindow.send('bars_updated', data.bars)
    mainWindow.send('smelting_updated', data.smelting)
    mainWindow.send('money_updated', data.money)
}

// mostly boring electron stuff

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
        updateAll()
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