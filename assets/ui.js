class Target {
    /**New Target to measure user's performance of Pomodoros.*/
    constructor(title, targethrs, freedays, perday, todos, progress) {
        this.target_title = title
        this.target_hrs = targethrs
        this.free_days = Math.round(freedays)
        this.per_day = Math.round(perday)
        this.todos = todos
        this.progress = Math.round(progress, 1)
    }
}

class SidepanelUI {
    constructor() {
        // All Target View
        this.allTargetInfo = document.querySelector('.all-target')

        // New Target View
        this.newTargetInfo = document.querySelector('.new-target')

        this.addActivityBtn = document.querySelector('.add-activity')
        this.targethrsInput = document.querySelector('#target-hrs')
        this.freedaysInput = document.querySelector('#free-days')
        this.perdayInput = document.querySelector('#per-day')

        this.addActivityBtn.addEventListener('click', this.addActivity)
        this.freedaysInput.addEventListener('change', () => this.checkFreedays())
        this.perdayInput.addEventListener('change', () => this.checkPerday())
    }

    saveNewTarget() {
        const titleInput = document.querySelector('#target-title')

        const table = this.newTargetInfo.querySelector('table')
        let activities = table.querySelectorAll('tr')
        let todos = ActivityUI.collectActivities(activities)
        if (todos.length === 0) {
            return null
        }
        else {
            return new Target(titleInput.value, this.targethrsInput.value,
                            this.freedaysInput.value, this.perdayInput.value,
                            todos, null)
        }
    }

    // Balance `free_days` and `per_day` depending on input:
    checkFreedays() {
        if (this.targethrsInput.value !== '') {
            this.perdayInput.value = (
                this.targethrsInput.value / (daysInMonth-this.freedaysInput.value)
            )
        }
    }
    checkPerday() {
        if (this.targethrsInput.value !== '') {
            this.freedaysInput.value = (
                daysInMonth - (this.targethrsInput.value/this.perdayInput.value)
            )
        }
    }

    addActivity(e) {
        /**Adds new `activity to 'new Target'*/
        const parent = e.target.closest('div'),
            activityType = parent.children[0],
            activityName = parent.children[1]
        const table = parent.previousElementSibling.firstElementChild

        if (activityName.value !== '') {
            new ActivityUI(table, `${activityType.value+activityName.value}`)
            activityName.value = ''
        }
    }

    applyTodosMods() {
        /**Collects `todos` for each pomodoro `target` listed in `Targets`.*/
        const targetTables = this.allTargetInfo.querySelectorAll('table')
        const targetObjs = {}
        targetTables.forEach(targetTable => {
            const title = targetTable.querySelector('th :nth-child(2)').innerText
            const activities = targetTable.querySelectorAll('tbody tr')

            let todos = ActivityUI.collectActivities(activities)
            if (todos.length > 0) {
                targetObjs[title] = todos
            }
        })
        this.hide()
        return targetObjs
    }

    clearFields() {
        /**Clear fields after save new Target.*/
        document.querySelector('#target-title').value = ''
        document.querySelector('.new-target table').innerHTML = ''
        document.querySelector('#target-hrs').value = ''
        document.querySelector('#per-day').value = ''
        document.querySelector('#free-days').value = ''
    }

    showNewTarget() {
        /**Shows `New Target` sidepanel.*/
        this.allTargetInfo.style.display = 'none'
        this.newTargetInfo.style.display = 'block'
        this.show()
    }

    showAllTarget() {
        /**Shows `Targets` sidepanel.*/
        this.newTargetInfo.style.display = 'none'
        this.allTargetInfo.style.display = 'block'
        this.show()
    }

    show() {
        document.getElementById('sidepanel').style.width = '301px'
    }

    hide() {
        document.getElementById('sidepanel').style.width = '0px'
    }
}

class TargetUI {
    addTargetToList(target) {
        // Always visible summary of target in Targets Sidepanel
        const targetsContainer = document.querySelector('.all-target')
        const targetTable = document.createElement('table'),
            targetHeader = document.createElement('tr'),
            targetHeaderInfo = document.createElement('th'),
            targetHeaderDelete = document.createElement('th'),
            targetCollapse = document.createElement('span'),
            targetName = document.createElement('span'),
            targetProgress = document.createElement('span'),
            targetRemove = document.createElement('span')

        targetHeader.appendChild(targetHeaderInfo)
        targetHeader.appendChild(targetHeaderDelete)

        targetHeaderInfo.appendChild(targetCollapse)
        targetHeaderInfo.appendChild(targetName)
        targetHeaderInfo.appendChild(targetProgress)
        targetHeaderInfo.className = 'header'
        targetHeaderDelete.appendChild(targetRemove)
        targetHeaderDelete.style.textAlign = 'right'
        targetCollapse.innerHTML = '<i class="fa fa-cogs"></i>'
        targetName.innerText = target.target_title
        targetProgress.innerText = `${target.progress}/${target.target_hrs}`
        targetProgress.style.color = TargetUI.getProgressColor(
            target.progress/target.target_hrs
        )
        targetRemove.className = 'remove-activity'
        targetRemove.innerHTML = '<i class="fa fa-trash-o"></i>'

        // Showed/Hidden, more detailed part in Targets Sidepanel
        const tbody = document.createElement('tbody')
        tbody.className = 'collapse'

        for (let name of target.todos) {
            new ActivityUI(tbody, name)
        }

        targetTable.appendChild(targetHeader)
        targetTable.appendChild(tbody)
        targetsContainer.insertAdjacentElement('afterbegin', targetTable)

        targetCollapse.addEventListener('click', () => this.collapseTarget(tbody))
        targetRemove.addEventListener('click', () => {
            const wants_delete = confirm("Do you want to delete this target?")
            if (wants_delete) {
                this.removeTarget(targetsContainer, targetTable)
            }
        })
    }

    collapseTarget(tbody) {
        /**Shows/Hides details (activities) for given Target.*/
        tbody.className = tbody.classList.contains('show') ? 'collapse' : 'collapse show'
    }

    removeTarget(parent, targetTable) {
        parent.removeChild(targetTable)
    }

    addTargetToInfoPanel(target, color) {
        /**Renders free_days and per_day information for Target in `.info-panel`.*/
        const tabsContainer = document.querySelector('#target-tabs')
        const tabBtn = document.createElement('button'),
            tabCircle = document.createElement('span'),
            tabHrs = document.createElement('span'),
            tabDays = document.createElement('span')

        tabsContainer.appendChild(tabBtn)
        tabBtn.appendChild(tabCircle)
        tabBtn.appendChild(tabHrs)
        tabBtn.appendChild(tabDays)

        tabBtn.type = 'button'
        tabBtn.dataset.title = target.target_title
        tabBtn.dataset.progress = target.progress
        tabBtn.dataset.target = target.target_hrs
        tabBtn.title = target.target_title
        tabCircle.className = 'circle'
        tabCircle.style.background = color
        tabHrs.className = 'badge'
        tabHrs.innerText = target.per_day === 0 ? 'X' : target.per_day
        tabHrs.title = 'hrs/day'
        tabDays.className = 'badge'
        tabDays.innerText = target.free_days
        tabDays.title = 'free days'

        if (target.per_day === 0) {
            tabHrs.classList.add('target-fail')
        }
        if (target.progress/target.target_hrs >= 1) {
            tabDays.classList.add('target-done')
        }

        tabBtn.addEventListener('click', () => this.showControls(tabBtn))
    }

    addTargetToChart(target, options) {
        /**Adds Target's data to chart's `options`. It doesn't render Chart.*/
        options.series.push(Math.round(target.progress / target.target_hrs * 100))
        options.labels.push(target.target_title)
    }

    showControls(activeBtn) {
        /**Shows controller to change `per_day` and `free_days`.*/
        const panelBtns = document.querySelectorAll('.info-panel .tabs button')
        const controlsNav = document.querySelector('.info-panel .content')

        panelBtns.forEach(btn => {
            btn.classList.remove('active')
        })
        activeBtn.classList.add('active')
        controlsNav.style.transform = 'scale(1)'
        controlsNav.style.opacity = '1'
    }

    static applyDailyMods() {
        /**Set changed value of `per_day`/`free_days` made with controller.*/
        const targetActive = document.querySelector('.info-panel button.active')
        const title = targetActive.dataset.title
        const per_day = parseInt(targetActive.querySelector('span:nth-child(2)').innerText)
        const free_days = parseInt(targetActive.querySelector('span:nth-child(3)').innerText)

        targetActive.classList.remove('active')

        // Hide controlls:
        document.querySelector('.info-panel .content').style.opacity = '0'
        setTimeout(() => {
            document.querySelector('.info-panel .content').style.transform = 'scale(0)'
        }, 1000)

        return {
            title,
            per_day,
            free_days
        }
    }

    static getAllTargets(targetsObj) {
        /**Unpacks targets received as list of objects.*/
        let targets = []
        targetsObj.forEach((targetObj, i) => {
            if (targetObj.length === 0 || targetObj === undefined) {
                return []
            }
            else {
                const target = new Target(targetObj.title, targetObj.targethrs,
                                        targetObj.freedays, targetObj.perday,
                                        targetObj.todos, targetObj.progress)
                targets.push(target)
            }
        })
        return targets
    }

    static displayAllTargets(targetsObj, options) {
        /**Displays targets received from server.*/
        const targets = TargetUI.getAllTargets(targetsObj)
        targets.forEach((target, i) => {
            const ui = new TargetUI
            let targetColor = TargetUI.getTargetColor(i)
            ui.addTargetToChart(target, options)
            ui.addTargetToList(target)
            ui.addTargetToInfoPanel(target, targetColor)
        })
        document.querySelector('#chart').innerHTML = ''
        var chart = new ApexCharts(document.querySelector("#chart"), options)
        chart.render()
    }

    static showMessage(message, messageType) {
        const messageDiv = document.querySelector('.info').children[2]

        messageDiv.innerText = message
        messageDiv.className = `alert alert-${messageType}`

        setTimeout(setDate, 5000)
    }

    static showLoading() {
        document.querySelector('#chart').innerHTML = `
            <img src="./gif/Ripple-1s-200px.gif"/>
        `
    }

    static resetTargets() {
        chartOptions.series = []
        chartOptions.labels = []
        document.querySelector('#target-tabs').innerHTML = ''
        document.querySelectorAll('.all-target table').forEach((table) => {
            table.parentNode.removeChild(table)
        })
    }

    static getProgressColor(level){
        /** Gets color value pertinent to the provided performance `level`.*/
        const steps = [.2, .55, .85, Infinity],
            colors = ['--danger', '--orange', '--yellow', '--success']
        let variableName = colors[steps.findIndex(step => step > level)],
            styles = window.getComputedStyle(document.body)
        return styles.getPropertyValue(variableName)
    }

    static getTargetColor(number) {
        const targetColors = ['#0065b4', '#00dd92', '#faad19', '#f94444', '#735aca']
        let idx = number % targetColors.length
        return targetColors[idx]
    }
}

class ActivityUI {
    /**Add new activity to the <table> in new Target.*/
    constructor(parent, activityName) {
        this.parent = parent
        this.addActivityToNewTarget(activityName)
    }

    addActivityToNewTarget(name) {
        const newActivity = document.createElement('tr')
        newActivity.className = 'alert-success'

        const activityName = document.createElement('td'),
            activityRemove = document.createElement('td'),
            spanRemove = document.createElement('span')

        activityName.appendChild(document.createTextNode(`${name}`))
        spanRemove.className = 'remove-activity'
        spanRemove.innerHTML = '<i class="fa fa-remove"></i>'
        activityRemove.style.textAlign = 'right'
        activityRemove.appendChild(spanRemove)

        newActivity.appendChild(activityName)
        newActivity.appendChild(activityRemove)

        this.parent.appendChild(newActivity)
        spanRemove.addEventListener('click', () => this.removeFromTarget(newActivity))
    }

    removeFromTarget(newActivity) {
        this.parent.removeChild(newActivity)
    }

    static collectActivities(activityTRs) {
        /** Collect activities (todos) for given Target.*/
        let todos = []
        activityTRs.forEach(todo => {
            todos.push(todo.querySelector('td').innerText)
        })
        return todos
    }
}
