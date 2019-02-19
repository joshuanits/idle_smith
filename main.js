'use strict'

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// todo: make this into an actual thing. for now this works, so thats good enough.
var data = {
    bars: {
        bronze: {
            count: 0,
            baseSmeltingTime: 1,
            smeltingTime: 1,
            price: 1.5,
            name: '{bronze_bar}',
            xp: 1,
            unlocked: true
        },
        iron: {
            count: 0,
            smeltingTime: 3,
            price: 15,
            xp: 3,
            name: '{iron_bar}',
            unlocked: false
        },
        steel: {
            count: 0,
            smeltingTime: 10,
            price: 80,
            xp: 10,
            name: '{steel_bar}',
            unlocked: false
        }
    },
    items: {
        bronzeDagger: {
            count: 0,
            metal: 'bronze',
            barsRequired: 1,
            price: 1.5,
            name: '{bronze_metal} {dagger}',
            smithingItem: '{dagger}',
            unlocked: true,
            xp: 1,
            order: 0,
        },
        bronzeBoots: {
            count: 0,
            metal: 'bronze',
            barsRequired: 2,
            price: 3,
            name: '{bronze_metal} {boots}',
            smithingItem: '{boots}',
            unlocked: false,
            xp: 2,
            order: 1,
        },
        bronzeHelmet: {
            count: 0,
            metal: 'bronze',
            barsRequired: 3,
            price: 4.5,
            name: '{bronze_metal} {helmet}',
            smithingItem: '{helmet}',
            unlocked: false,
            xp: 3,
            order: 2,
        },
        bronzeShortsword: {
            count: 0,
            metal: 'bronze',
            barsRequired: 4,
            price: 6,
            name: '{bronze_metal} {shortsword}',
            smithingItem: '{shortsword}',
            unlocked: false,
            xp: 4,
            order: 3,
        },
        bronzePlatelegs: {
            count: 0,
            metal: 'bronze',
            barsRequired: 5,
            price: 7.5,
            name: '{bronze_metal} {platelegs}',
            smithingItem: '{platelegs}',
            unlocked: false,
            xp: 5,
            order: 4,
        },
        bronzeLongsword: {
            count: 0,
            metal: 'bronze',
            barsRequired: 6,
            price: 9,
            name: '{bronze_metal} {longsword}',
            smithingItem: '{longsword}',
            unlocked: false,
            xp: 6,
            order: 5,
        },
        bronzePlatebody: {
            count: 0,
            metal: 'bronze',
            barsRequired: 10,
            price: 15,
            name: '{bronze_metal} {platebody}',
            smithingItem: '{platebody}',
            unlocked: false,
            xp: 10,
            order: 6,
        }
    },
    level: 1,
    money: 1,
    ores: {
        bronze: {
            count: 0,
            price: 1,
            name: "{bronze_ore}",
            unlocked: true
        },
        iron: {
            count: 0,
            price: 10,
            name: "{iron_ore}",
            unlocked: false
        },
        steel: {
            count: 0,
            price: 50,
            name: "{steel_ore}",
            unlocked: false
        }
    },
    smelting: {
        active: false,
        bar: '',
        quantity: 0,
        time: 0,
        totalTime: 0
    },
    smithing: {
        active: false,
        metal: '',
        item: '',
        progress: 0,
        progressPerHit: 0
    },
    unlocks: {
        1: [
            "metals.bronze",
            "items.bronzeDagger"
        ],
        2: [
            "items.bronzeBoots"
        ],
        3: [
            "upgrades.bronzeSmeltingSpeed"
        ],
        4: [
            "items.bronzeHelmet"
        ],
        5: [],
        6: [],
        7: [
            "items.bronzeShortsword"
        ],
        8: [],
        9: [
            "items.bronzePlatelegs"
        ],
        10: [
            "items.bronzeLongsword",
            "items.bronzePlatebody"
        ]
    },
    upgrades: {
        bronzeSmeltingSpeed: {
            activate: () => {
                data.bars.bronze.smeltingTime = data.bars.bronze.baseSmeltingTime * Math.pow(0.75, data.upgrades.bronzeSmeltingSpeed.level)
            },
            description: "Reduces the time it takes to smelt bronze by 25% per level.",
            level: 0,
            name: "Bronze Smelting Speed", //TODO: dict this
            price: () => {
               return Math.pow(2, data.upgrades.bronzeSmeltingSpeed.level + 1)
            },
            unlocked: false,
        }
    },
    xp: 0,
}

// main game loop
const gameLoop = () => {
    if(mainWindow === null) return

    if(data.smelting.active) {
        data.smelting.time += 0.01;
        if(data.smelting.time >= data.smelting.totalTime) {
            // finish smelting
            data.bars[data.smelting.bar].count += data.smelting.quantity

            addXp(data.bars[data.smelting.bar].xp)

            data.smelting.active = false
            data.smelting.bar = ''
            data.smelting.quantity = 0
            data.smelting.time = 0

            mainWindow.send('bars_updated')
        }

        mainWindow.send('smelting_updated')
    }
}

const addItem = (item) => {
    data.items[item].count += 1

    mainWindow.send('items_updated')
}

const addXp = (xp) => {
    data.xp += xp

    while(data.xp >= getXpForLevel(data.level + 1)) {
        levelUp()
    }

    mainWindow.send("xp_updated")
}

const buyOre = (e, oreId, buyAmount) => {
    const orePrice = data.ores[oreId].price

    if(data.money >= orePrice * buyAmount) {
        data.money -= orePrice * buyAmount
        data.ores[oreId].count += buyAmount

        mainWindow.send('money_updated')
        mainWindow.send('ores_updated')
    }
}

const buyUpgrade = (e, upgradeId) => {
    const upgradePrice = data.upgrades[upgradeId].price()

    if(data.money >= upgradePrice) {
        data.money -= upgradePrice

        data.upgrades[upgradeId].level++
        data.upgrades[upgradeId].activate()

        mainWindow.send('money_updated')
        mainWindow.send('upgrades_updated')
    }
}

const levelUp = () => {
    data.level++
    
    data.unlocks[data.level].forEach((unlock) => {
        let obj = data
        let keys = unlock.split('.')

        for(let key of keys) {
            obj = obj[key]
        }

        obj.unlocked = true
    })

    updateAll()
}

// the amount of xp required for a level
const getXpForLevel = (level) => {
    const base = 1.15
    return Math.round(100 * (Math.pow(base, level - 1) - 1))
}

const sellItem = (e, itemId, quantity) => {
    if(data.items[itemId].count >= quantity) {
        data.items[itemId].count -= quantity
        data.money += data.items[itemId].price * quantity

        mainWindow.send('money_updated')
        mainWindow.send('items_updated')
    }
}

const startSmelting = (e, oreId) => {
    if(!data.smelting.active && data.ores[oreId].count > 0) {
        data.smelting.active = true
        data.smelting.bar = oreId
        data.smelting.quantity = 1
        data.smelting.totalTime = data.bars[oreId].smeltingTime
        data.ores[oreId].count -= 1

        mainWindow.send('ores_updated')
        mainWindow.send('smelting_updated')
    }
}

const startSmithing = (e, itemId) => {
    const metalId = data.items[itemId].metal
    const barCost = data.items[itemId].barsRequired

    if(!data.smithing.active && data.bars[metalId].count >= barCost) {
        data.smithing.active = true
        data.smithing.metal = metalId
        data.smithing.item = itemId
        data.smithing.progressPerHit = 0.1 / barCost // todo: calculate this based on metal?

        data.bars[metalId].count -= barCost

        mainWindow.send('bars_updated')
        mainWindow.send('smithing_updated')
    }
}

const smithingHit = () => {
    if(data.smithing.active) {
        data.smithing.progress += data.smithing.progressPerHit * 2
        if(data.smithing.progress + data.smithing.progressPerHit - 0.000001 >= 1) {
            addItem(data.smithing.item)
            addXp(data.items[data.smithing.item].xp)

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

ipcMain.on('item_sell', sellItem)

// buy ores
ipcMain.on('ores_buy', buyOre)

ipcMain.on('upgrade_buy', buyUpgrade)

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

ipcMain.on('request_level_xp', (e, level) => e.returnValue = getXpForLevel(level))

ipcMain.on('request_function', (e, dataKey, func) => {
    let currentData = data

    for(let key of dataKey.split(".")) {
        currentData = currentData[key]
    }
    e.returnValue = currentData[func]()
})

const updateAll = () => {
    mainWindow.send('bars_updated')
    mainWindow.send('items_updated')
    mainWindow.send('ores_updated')
    mainWindow.send('smelting_updated')
    mainWindow.send('money_updated')
    mainWindow.send('smithing_updated')
    mainWindow.send('smithing_metals_updated')
    mainWindow.send('upgrades_updated')
    mainWindow.send('xp_updated')
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
        mainWindow.maximize()
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

ipcMain.on('debug_log', (e, message) => {
    console.log(message || '!')
})