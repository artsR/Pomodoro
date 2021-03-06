const {ipcRenderer} = require('electron')

const messageDiv = document.querySelector('.info').children[2]
var chartOptions = {
    series: [],
    chart: {
        height: 320,
        type: 'radialBar',
        offsetY: -10
    },
    plotOptions: {
        radialBar: {
            startAngle: -135,
            endAngle: 135,
            track: {
                background: '#111',
            },
            hollow: {
                size: "35%"
            },
            dataLabels: {
                name: {
                    fontSize: '16px',
                    color: undefined,
                    offsetY: 115,
                },
                value: {
                    offsetY: 75,
                    fontSize: '22px',
                    color: '#ccc',
                    formatter: val => `${val}%`,
                },
            }
        }
    },
    fill: {
        type: 'gradient',
        gradient: {
            shade: 'dark',
            shadeIntensity: 0.15,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 65, 91]
        },
    },
    stroke: {
        dashArray: 3
    },
    labels: [],
}

// Datetime setting
const today = new Date()
const daysInMonth = getDaysInMonth(today.getFullYear(), today.getMonth()+1)

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate()
}
function setDate() {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    messageDiv.innerText = `${months[today.getMonth()]} ${today.getFullYear()}`
    messageDiv.className = 'alert alert-secondary'
}
setDate()

ipcRenderer.on('show-message', function() {
    TargetUI.showMessage('Data saved', 'success')
})

// Main Buttons
const newTarget = document.getElementById('new-target')
const allTarget = document.getElementById('all-target')
const refresh = document.getElementById('refresh')
const updateDropbox = document.getElementById('update')
const closeSidepanel = document.getElementById('close-sidepanel')
const applyTodosChanges = document.getElementById('apply-changes')
const applyDailyChanges = document.getElementById('apply-daily-data')
const saveNewTarget = document.getElementById('save-target')

const sidepanel = new SidepanelUI()


document.addEventListener('DOMContentLoaded', () => {
    TargetUI.showLoading()
    TargetUI.resetTargets()
    fetch(`http://127.0.0.1:5050/targets`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        TargetUI.displayAllTargets(data.targets, chartOptions)
        if (data.message) {
            message = JSON.parse(data.message)
            TargetUI.showMessage(message.text, message.type)
        }
    })
    .catch(err => {
        TargetUI.showMessage('Waiting for data...', 'danger')
        setTimeout(() => document.dispatchEvent(new Event('DOMContentLoaded')), 4000)
    })
})

newTarget.addEventListener('click', () => sidepanel.showNewTarget())

allTarget.addEventListener('click', () => sidepanel.showAllTarget())

closeSidepanel.addEventListener('click', sidepanel.hide)

refresh.addEventListener('click', () => {
    TargetUI.showLoading()
    fetch(`http://127.0.0.1:5050/refresh`)
    .then(response => response.json())
    .then(data => {
        TargetUI.resetTargets()
        TargetUI.displayAllTargets(data.targets, chartOptions)
        if (data.message) {
            message = JSON.parse(data.message)
            TargetUI.showMessage(message.text, message.type)
        }
    })
    .catch(err => console.log(err))
})

updateDropbox.addEventListener('click', () => {
    fetch(`http://127.0.1:5050/update_data`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        message = JSON.parse(data.message)
        TargetUI.showMessage(message.text, message.type)
    })
    .catch(err => console.log(err))
})

saveNewTarget.addEventListener('click', (e) => {
    e.preventDefault()
    let newTarget = sidepanel.saveNewTarget()
    if (newTarget === null) {
        TargetUI.showMessage('Missed required data!', 'danger')
    }
    else {
        sidepanel.clearFields()
        TargetUI.showLoading()
        TargetUI.resetTargets()
        fetch(`http://127.0.0.1:5050/new_target`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTarget)
        })
        .then(response => response.json())
        .then(data => {
            message = JSON.parse(data.message)
            TargetUI.showMessage(message.text, message.type)
            TargetUI.displayAllTargets(data.targets, chartOptions)
        })
        .catch(err => console.log(err))
    }
    sidepanel.hide()
})

applyTodosChanges.addEventListener('click', () => {
    const targetObjs = sidepanel.applyTodosMods()
    fetch(`http://127.0.0.1:5050/edit_targets`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(targetObjs)
    })
    .then(response => response.json())
    .then(data => {
        TargetUI.resetTargets()
        TargetUI.displayAllTargets(data.targets, chartOptions)
        message = JSON.parse(data.message)
        TargetUI.showMessage(message.text, 'success')
    })
    .catch(err => console.log(err))
})

applyDailyChanges.addEventListener('click', () => {
    const targetObj = TargetUI.applyDailyMods()
    fetch(`http://127.0.0.1:5050/edit_daily`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(targetObj)
    })
    .then(response => response.json())
    .then(data => {
        TargetUI.showLoading()
        TargetUI.resetTargets()
        TargetUI.displayAllTargets(data.targets, chartOptions)
        if (data.message) {
            message = JSON.parse(data.message)
            TargetUI.showMessage(message.text, message.type)
        }
    })
    .catch(err => console.log(err))
})

// ** Controls buttons Events (per day, free days)
document.querySelector('#freedays-plus').addEventListener('click', () => {
    const targetToMod = document.querySelector('.info-panel button.active')
    const targetName = targetToMod.dataset.title

    const targetValue = targetToMod.querySelector('span:nth-child(3)')
    const counterpart = targetToMod.querySelector('span:nth-child(2)')

    if (targetValue.innerText < 25) {
        targetValue.innerText = Number(targetValue.innerText) + 1
        let hrs_left = targetToMod.dataset.target - targetToMod.dataset.progress,
            days_left = daysInMonth - new Date().getDate()

        counterpart.innerText = Math.round(
            hrs_left / (days_left - targetValue.innerText)
        )
    }
})
document.querySelector('#freedays-minus').addEventListener('click', () => {
    const targetToMod = document.querySelector('.info-panel button.active')
    const targetName = targetToMod.dataset.title

    const targetValue = targetToMod.querySelector('span:nth-child(3)')
    const counterpart = targetToMod.querySelector('span:nth-child(2)')

    if (targetValue.innerText > 0) {
        targetValue.innerText = Number(targetValue.innerText) - 1
        let hrs_left = targetToMod.dataset.target - targetToMod.dataset.progress,
            days_left = daysInMonth - new Date().getDate()

        counterpart.innerText = Math.round(
            hrs_left / (days_left - targetValue.innerText)
        )
    }
})
document.querySelector('#perday-plus').addEventListener('click', () => {
    const targetToMod = document.querySelector('.info-panel button.active')
    const targetName = targetToMod.dataset.title

    const targetValue = targetToMod.querySelector('span:nth-child(2)')
    const counterpart = targetToMod.querySelector('span:nth-child(3)')

    if (targetValue.innerText < 20) {
        targetValue.innerText = Number(targetValue.innerText) + 1
        let hrs_left = targetToMod.dataset.target - targetToMod.dataset.progress,
            days_left = daysInMonth - new Date().getDate()

        counterpart.innerText = Math.round(
            days_left - (hrs_left/targetValue.innerText)
        )
    }
})
document.querySelector('#perday-minus').addEventListener('click', () => {
    const targetToMod = document.querySelector('.info-panel button.active')
    const targetName = targetToMod.dataset.title

    const targetValue = targetToMod.querySelector('span:nth-child(2)')
    const counterpart = targetToMod.querySelector('span:nth-child(3)')

    if (targetValue.innerText > 0) {
        targetValue.innerText = Number(targetValue.innerText) - 1
        let hrs_left = targetToMod.dataset.target - targetToMod.dataset.progress,
            days_left = daysInMonth - new Date().getDate()

        counterpart.innerText = Math.round(
            days_left - (hrs_left/targetValue.innerText)
        )
    }
})
