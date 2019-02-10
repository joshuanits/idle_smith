'use strict'

const { ipcRenderer } = require('electron')
const Dictionary = require('../Dictionary')

const dict = new Dictionary()

let orePrices = {}

// close button
document.getElementById('close').addEventListener('click', () => {
    ipcRenderer.send('quit')
})

// minimize button
document.getElementById('minimize').addEventListener('click', () => {
    ipcRenderer.send('minimize')
})

// maximize button
document.getElementById('maximize').addEventListener('click', () => {
    ipcRenderer.send('toggle_maximize')
})

document.getElementById('smelting_start').addEventListener('click', () => {
    const oreSelect = document.getElementById('smelting_select')
    const oreId = oreSelect.children[oreSelect.selectedIndex].getAttribute('data-ore-id')

    ipcRenderer.send('smelting_start', oreId, 1)
})

const buyOre = (event) => {
    const oreId = event.target.getAttribute('data-ore-id')
    ipcRenderer.send("ores_buy", oreId, 1)
}

const updateOrePrices = () => {
    Array.from(document.getElementsByClassName('ore-price')).forEach((element) => {
        const id = element.parentElement.getAttribute('data-ore-id')

        element.innerHTML = orePrices.hasOwnProperty(id) ? orePrices[id] : 0
    })
}

ipcRenderer.on('ores_updated', (e, ores) => {
    // the list of the ores the player has
    const oresList = document.getElementById('ore_list')
    oresList.innerHTML = Object.keys(ores).reduce(function (html, key) {
        html += `<li>${dict.get(key, 'ore')}: ${ores[key]} <button class="btn buy-ore-button" data-ore-id="${key}">Buy 1 (<span class="ore-price"></span>gp)</button></li>`
        return html
    }, '')

    updateOrePrices()

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

})

ipcRenderer.on('smelting_updated', (e, smelting) => {
    const smeltingText = document.getElementById('smelting_text')
    smeltingText.innerHTML = smelting.bar ? dict.get(smelting.bar, 'bar') : "Nothing"

    const smeltingBar = document.getElementById('smelting_bar')
    const barWidth = smelting.progress * 100
    smeltingBar.setAttribute('style', `width:${barWidth}%`)
    smeltingBar.setAttribute('aria-valuenow', barWidth)
})

ipcRenderer.on('bars_updated', (e, bars) => {
    const barsList = document.getElementById('bars_list')

    var html = Object.keys(bars).reduce(function (html, key) {
        html += `<li>${dict.get(key, 'bar')}: ${bars[key]}</li>`
        return html
    }, '')

    barsList.innerHTML = html
})

ipcRenderer.on('money_updated', (e, money) => {
    const moneySpan = document.getElementById('money')
    moneySpan.innerHTML = money
})

ipcRenderer.on('ores_price_updated', (e, prices) => {
    orePrices = prices
    updateOrePrices()
})