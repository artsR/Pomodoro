const {remote, ipcRenderer} = require('electron')
const fs = require('fs')


document.addEventListener('DOMContentLoaded', () => {
    const settingsRaw = fs.readFileSync('settings.json')
    const day_start = JSON.parse(settingsRaw).day_start

    tmpDate = new Date(`1970-01-01 ${day_start}`)
    if (tmpDate && !isNaN(tmpDate) && day_start.length === 5) {
        document.querySelector('#day-start').value = day_start
    }
})

document.querySelector('#close').addEventListener('click', closeSettings)
document.querySelector('#cancel').addEventListener('click', closeSettings)
document.querySelector('#form-time').addEventListener('submit', (e) => {
    e.preventDefault()
    const inputTime = document.querySelector('#day-start').value

    if (inputTime !== '') {
        const settingsRaw = fs.readFileSync('settings.json')
        const settingsJSON = JSON.parse(settingsRaw)

        settingsJSON.day_start = inputTime
        fs.writeFileSync('settings.json', JSON.stringify(settingsJSON))
        showMessage()
    }
})


function closeSettings() {
    let win = remote.getCurrentWindow()
    win.close()
}

function showMessage() {
    ipcRenderer.send('show-message');console.log('settings')
}
