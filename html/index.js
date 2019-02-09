'use strict'

const { ipcRenderer } = require('electron')

document.getElementById('close').addEventListener('click', () => {
    ipcRenderer.send('quit')
})

document.getElementById('minimize').addEventListener('click', () => {
    ipcRenderer.send('minimize')
})