'use strict'

const { ipcRenderer } = require('electron')
const Dictionary = require('../Dictionary')

const dict = new Dictionary()

const buyOre = (event) => {
    const oreId = event.target.getAttribute('data-ore-id')
    ipcRenderer.send('ores_buy', oreId, 1)
}

const sellItem = (event) => {
    const itemId = event.target.parentNode.getAttribute('data-item-id')
    ipcRenderer.send('item_sell', itemId, 1)
}

const updateBarsList = () => {
    const bars = ipcRenderer.sendSync('request_data', 'bars')
    const unlockedMetals = ipcRenderer.sendSync('request_data', 'unlocked.metals')

    const barsList = document.getElementById('bars_list')

    var html = Object.keys(bars).reduce(function (html, key) {
        if(unlockedMetals[key])
            html += `<li>${dict.get(key, 'bar')}: ${bars[key]}</li>`
        return html
    }, '')

    barsList.innerHTML = html

    updateSmithingStartButton()
}

const updateItems = () => {
    const items = ipcRenderer.sendSync('request_data', 'items')

    const itemListHtml = Object.keys(items).reduce((html, key) => {
        if(items[key] > 0) {
            const nameParts = key.split('_')

            const metal = dict.get(nameParts[0], 'metal')
            const item = dict.get(nameParts[1])

            const itemPrice = ipcRenderer.sendSync('request_item_price', key)

            html += `<li data-item-id="${key}">${metal} ${item}: ${items[key]} <button class="btn btn-sell">Sell for ${itemPrice}gp</button></li>`
        }
        return html
    }, '')

    const itemList = document.getElementById('item_list')
    itemList.innerHTML = itemListHtml

    Array.from(document.getElementsByClassName('btn-sell')).forEach(element => {
        element.addEventListener('click', sellItem)
    })
}

const updateMoney = () => {
    const money = ipcRenderer.sendSync('request_data', 'money')

    const moneySpan = document.getElementById('money')
    moneySpan.innerHTML = money
}

const updateOresList = () => {
    // get the players ores from the main process
    const ores = ipcRenderer.sendSync('request_data', 'ores')
    const orePrices = ipcRenderer.sendSync('request_data', 'prices.ore')
    const unlockedMetals = ipcRenderer.sendSync('request_data', 'unlocked.metals')

    // the list of the ores the player has
    const oresList = document.getElementById('ore_list')
    oresList.innerHTML = Object.keys(ores).reduce(function (html, key) {
        if(unlockedMetals[key])
            html += `<li>${dict.get(key, 'ore')}: ${ores[key]} <button class="btn buy-ore-button" data-ore-id="${key}">Buy 1 (${orePrices[key]}gp)</button></li>`
        return html
    }, '')

    Array.from(document.getElementsByClassName('buy-ore-button')).forEach(element => {
        element.addEventListener('click', buyOre)
    });

    // the ores in the dropdown box for smelting
    var listHtml = Object.keys(ores).reduce(function (html, key) {
        if(ores[key] != 0) {
            html += `<option data-ore-id="${key}">${dict.get(key, 'ore')} (${ores[key]})</option>`
        }
        return html
    }, '')

    // button that the player clicks to start smelting. disable it if they don't have any ores
    const smeltingButton = document.getElementById('smelting_start')
    smeltingButton.disabled = listHtml ? false : true
    
    // drop down list of ores
    const smeltingSelect = document.getElementById('smelting_select')
    smeltingSelect.innerHTML = listHtml || '<option>None</option>' // if the list was empty, make it say none
}

const updateSmelting = () => {
    const smelting = ipcRenderer.sendSync('request_data', 'smelting')

    const smeltingText = document.getElementById('smelting_text')
    smeltingText.innerHTML = smelting.bar ? dict.get(smelting.bar, 'bar') : 'Nothing'

    const smeltingBar = document.getElementById('smelting_bar')
    const barWidth = smelting.progress * 100
    smeltingBar.setAttribute('style', `width:${barWidth}%`)
    smeltingBar.setAttribute('aria-valuenow', barWidth)
}

const updateSmithing = () => {
    const smithing = ipcRenderer.sendSync('request_data', 'smithing')

    const smithingText = document.getElementById('smithing_text')
    smithingText.innerHTML = smithing.active ? (`${dict.get(smithing.metal, 'metal')} ${dict.get(smithing.item)}`) : 'Nothing'

    const hitButton = document.getElementById('smithing_hit')
    hitButton.disabled = !smithing.active

    const smithingBar = document.getElementById('smithing_bar')
    const barWidth = smithing.progress * 100
    smithingBar.setAttribute('style', `width:${barWidth}%`)
    smithingBar.setAttribute('aria-valuenow', barWidth)
}

const updateSmithingItems = () => {
    const smithingBarSelect = document.getElementById('smithing_bar_select')
    const metalId = smithingBarSelect.children[smithingBarSelect.selectedIndex].getAttribute('data-bar-id')

    const unlockedItems = ipcRenderer.sendSync('request_data', `unlocked.items.${metalId}`)

    if(metalId !== null) {
        const smithingItemListHtml = Object.keys(unlockedItems).reduce(function (html, key) {
            if(unlockedItems[key]) html += `<option data-item-id="${key}">${dict.get(key)}</option>`
            return html
        }, '')
    
        const smithingItemSelect = document.getElementById('smithing_item_select')
        smithingItemSelect.innerHTML = smithingItemListHtml || '<option>----</option>'
    }

    updateSmithingStartButton()
}

const updateSmithingMetals = () => {
    const unlockedMetals = ipcRenderer.sendSync('request_data', 'unlocked.metals')

    const smithingBarListHtml = Object.keys(unlockedMetals).reduce(function (html, key) {
        if(unlockedMetals[key]) html += `<option data-bar-id="${key}">${dict.get(key, 'metal')}</option>`
        return html
    }, '')

    const smithingBarSelect = document.getElementById('smithing_bar_select')
    smithingBarSelect.innerHTML = smithingBarListHtml || '<option>----</option>'

    updateSmithingItems()
}

const updateSmithingStartButton = () => {
    const smithingBarSelect = document.getElementById('smithing_bar_select')
    const metalId = smithingBarSelect.children[smithingBarSelect.selectedIndex].getAttribute('data-bar-id')

    const smithingItemSelect = document.getElementById('smithing_item_select')
    const itemId = smithingItemSelect.children[smithingItemSelect.selectedIndex].getAttribute('data-item-id')

    const barAmount = ipcRenderer.sendSync('request_data', `bars.${metalId}`)
    const requiredAmount = ipcRenderer.sendSync('request_data', `prices.smithing.${itemId}`)
    const smithingActive = ipcRenderer.sendSync('request_data', `smithing.active`)

    const smithingStartButton = document.getElementById('smithing_start')
    smithingStartButton.innerHTML = `Start Smithing ${requiredAmount !== null ? `(${requiredAmount} bar${requiredAmount > 1 ? 's' : ''})` : ''}`
    smithingStartButton.disabled = barAmount < requiredAmount || requiredAmount === null || smithingActive
}

const updateXp = () => {
    const currentXp = ipcRenderer.sendSync('request_data', 'xp')
    const currentLevel = ipcRenderer.sendSync('request_data', 'level')
    const currentLevelXp = ipcRenderer.sendSync('request_level_xp', currentLevel)
    const nextLevelXp = ipcRenderer.sendSync('request_level_xp', currentLevel + 1)

    document.getElementById('current_xp').innerHTML = currentXp - currentLevelXp
    document.getElementById('current_level').innerHTML = currentLevel
    document.getElementById('next_level_xp').innerHTML = nextLevelXp - currentLevelXp
}

// close button
document.getElementById('close').addEventListener('click', () => ipcRenderer.send('quit'))

// minimize button
document.getElementById('minimize').addEventListener('click', () => ipcRenderer.send('minimize'))

// maximize button
document.getElementById('maximize').addEventListener('click', () => ipcRenderer.send('toggle_maximize'))

document.getElementById('smelting_start').addEventListener('click', () => {
    const oreSelect = document.getElementById('smelting_select')
    const oreId = oreSelect.children[oreSelect.selectedIndex].getAttribute('data-ore-id')

    ipcRenderer.send('smelting_start', oreId, 1)
})

document.getElementById('smithing_start').addEventListener('click', () => {
    const smithingBarSelect = document.getElementById('smithing_bar_select')
    const metalId = smithingBarSelect.children[smithingBarSelect.selectedIndex].getAttribute('data-bar-id')

    const smithingItemSelect = document.getElementById('smithing_item_select')
    const itemId = smithingItemSelect.children[smithingItemSelect.selectedIndex].getAttribute('data-item-id')

    ipcRenderer.send('smithing_start', metalId, itemId)
})

document.getElementById('smithing_hit').addEventListener('click', () => ipcRenderer.send('smithing_hit'))

document.getElementById('smithing_bar_select').addEventListener('change', updateSmithingItems)

document.getElementById('smithing_item_select').addEventListener('change', updateSmithingStartButton)

// sent when the number of ores the player has changes
ipcRenderer.on('ores_updated', updateOresList)

// sent every tick while smelting
ipcRenderer.on('smelting_updated', updateSmelting)

// sent when the number of bars the player has changes
ipcRenderer.on('bars_updated', updateBarsList)

// sent when the players money changes
ipcRenderer.on('money_updated', updateMoney)

// sent whenever the players current unlocks changes 
ipcRenderer.on('smithing_metals_updated', updateSmithingMetals)

// sent whenever the player hits the metal
ipcRenderer.on('smithing_updated', updateSmithing)

// sent when smithing finishes
ipcRenderer.on('smithing_finished', updateSmithingStartButton)

// sent whenever the players items change
ipcRenderer.on('items_updated', updateItems)

// sent when the players xp changes
ipcRenderer.on('xp_updated', updateXp)