'use strict'

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// todo: make this into an actual thing. for now this works, so thats good enough.
var data = {
    bars: {},
    items: {},
    money: 10,
    ores: {},
    prices: {
        ore: {
            bronze: 1,
            iron: 5,
            steel: 50
        },
        smithing: {
            dagger: 1,
            boots: 2,
            hemlter: 3
        }
    },
    smelting: {
        active: false,
        bar: '',
        quantity: 0,
        progress: 0
    },
    smithing: {
        active: false,
        metal: '',
        item: '',
        progress: 0,
        progressPerHit: 0
    },
    unlocked: {
        metals: {},
        items: {}
    },
    xp: 0
}

let config = {
    metals: [
        'bronze',
        'iron',
        'steel'
    ],
    items: [
        'dagger',
        'boots',
        'helmets'
    ]
}

for(let metal of config.metals) {
    data.ores[metal] = 0
    data.bars[metal] = 0

    data.unlocked.metals[metal] = false
    data.unlocked.items[metal] = {}

    for(let item of config.items) {
        data.unlocked.items[metal][item] = false

        data.items[`${metal}_${item}`] = 0
    }
}

data.unlocked.metals.bronze = true
data.unlocked.items.bronze.dagger = true

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

            mainWindow.send('bars_updated')
        }

        mainWindow.send('smelting_updated')
    }
}

const addItem = (item) => {
    data.items[item] += 1

    mainWindow.send('items_updated')
}

const buyOre = (e, oreId, buyAmount) => {
    const orePrice = data.prices.ore[oreId]

    if(data.money >= orePrice * buyAmount) {
        data.money -= orePrice * buyAmount
        data.ores[oreId] += buyAmount

        mainWindow.send('money_updated', data.money)
        mainWindow.send('ores_updated', data.ores)
    }
}

const startSmelting = (e, oreId) => {
    console.log(oreId)
    if(!data.smelting.active && data.ores[oreId] > 0) {
        data.smelting.active = true
        data.smelting.bar = oreId
        data.smelting.quantity = 1

        data.ores[oreId] -= 1

        mainWindow.send('ores_updated')
        mainWindow.send('smelting_updated')
    }
}

const startSmithing = (e, metalId, itemId) => {
    const barCost = data.prices.smithing[itemId]

    if(!data.smithing.active && data.bars[metalId] >= barCost) {
        data.smithing.active = true
        data.smithing.metal = metalId
        data.smithing.item = itemId
        data.smithing.progressPerHit = 0.1 / barCost // todo: calculate this based on metal?

        data.bars[metalId] -= barCost

        mainWindow.send('bars_updated')
        mainWindow.send('smithing_updated')
    }
}

const smithingHit = () => {
    if(data.smithing.active) {
        data.smithing.progress += data.smithing.progressPerHit
        if(data.smithing.progress + data.smithing.progressPerHit - 0.000001 >= 1) {
            addItem(`${data.smithing.metal}_${data.smithing.item}`)

            data.smithing.active = false
            data.smithing.metal = ''
            data.smithing.item = ''
            data.smithing.progress = 0
            data.smithing.progressPerHit = 0

            mainWindow.send('smithing_finished')
        }

        mainWindow.send('smithing_updated')
    }
}

// buy ores
ipcMain.on('ores_buy', buyOre)

// when the player starts smelting
ipcMain.on('smelting_start', startSmelting)

ipcMain.on('smithing_start', startSmithing)

ipcMain.on('smithing_hit', smithingHit)

ipcMain.on('request_data', (e, dataKey) => {
    let keys = dataKey.split('.')
    let currentData = data

    for(let key of keys) {
        currentData = currentData[key]
    }

    e.returnValue = currentData
})

const updateAll = () => {
    mainWindow.send('bars_updated')
    mainWindow.send('ores_updated')
    mainWindow.send('smelting_updated')
    mainWindow.send('money_updated')
    mainWindow.send('smithing_updated')
    mainWindow.send('smithing_metals_updated')
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