const CLICK = 'click'
const DIV = 'div'
const CIRCLE = 'circle'
const CROSS_CONTAINER = 'cross-container'
const HORIZONTAL = 'horizontal'
const VERTICAL = 'vertical'
const ROW = 'ROW'
const COLUMN = 'COLUMN'
const DIAGONAL = 'DIAGONAL'
const FOR_MOVE = 0
const FOR_CLICK = 1
const FOR_ANIM_END = 2
const FOR_NEW_GAME = 3

const initState = () => {
    return {
        settings: undefined,
        sound: undefined,
        toLoad: 2,
        animationTime: 200,
        fields: document.getElementsByClassName('field'),
        board: [['.', '.', '.'], ['.', '.', '.'], ['.', '.', '.']],
        freePlaces: 9,
        player: 'x',
        computer: 'o',
        roundNumber: 0,
        activity: FOR_MOVE,

        // startTime: new Date(),
        firstBlock: true,
        firstBlockComputer: true,
        firstWin: true,
        betterBlock: false,
        logs: []
    }
}

const setAnimated = (object, time) => new Promise(resolve => {
    setTimeout(() => {
        object.classList.add('animated')
        resolve()
    }, time)
})

const removeAnimated = (object, time) => new Promise(resolve => {
    setTimeout(() => {
        object.classList.remove('animated')
        resolve()
    }, time)
})

const animate = async (object, time) => {
    for (let i = 0; i < 3; i++) {
        await setAnimated(object, time)
        await removeAnimated(object, time)
    }
}

const animateRow = (y, state) => {
    let promiseArray = []
    for (let x = 0; x < 3; x++)
        promiseArray.push(animate(state.fields[convertToNumber(x, y)], state.animationTime))
    return promiseArray
}

const animateColumn = (x, state) => {
    let promiseArray = []
    for (let y = 0; y < 3; y++)
        promiseArray.push(animate(state.fields[convertToNumber(x, y)], state.animationTime))
    return promiseArray
}

const animateDiagonal = (id, state) => {
    let promiseArray = []
    for (let i = 0; i < 3; i++) {
        const x = id === 0 ? i : 2 - i
        promiseArray.push(animate(state.fields[convertToNumber(x, i)], state.animationTime))
    }
    return promiseArray
}

const addFieldsListeners = (onClick, state) => {
    const fields = document.getElementsByClassName('field')
    for (let i = 0; i < fields.length; i++) {
        const item = fields[i]
        item.addEventListener(CLICK, () => {onClick(i, state)}, false)
    }
}

const cleanState = state => {
    state.board = [['.', '.', '.'], ['.', '.', '.'], ['.', '.', '.']]
    state.freePlaces = 9
    state.activity = state.roundNumber % 2 === 0 ? FOR_MOVE : FOR_CLICK
    state.startTime = new Date()
    state.firstBlock = true
    state.firstWin = true
    state.betterBlock = false
}

const addKeyboardListener = state => {
    document.addEventListener("keypress", event => {
        if (event.key === 'Enter') {
            if (state.activity === FOR_CLICK) {
                console.log("czekanie")
                computerMove(state)
            } else if (state.activity === FOR_NEW_GAME) {
                if (state.roundNumber !== state.settings.round) {
                    changeVisibility('blur', 'none')
                    for (const item of state.fields)
                        while (item.hasChildNodes())
                            item.removeChild(item.firstChild)
                    state.roundNumber++
                    cleanState(state)
                } else {
                    console.log("koniec")
                }
            }
        }
    });
}

const manageStartingMoment = state => {
    state.toLoad--
    if (state.toLoad === 0) {
        addFieldsListeners(fieldOnClick, state)
        addKeyboardListener(state)
        document.getElementsByClassName('blur')[0].style.display = 'none'
    }
}

const addStartButtonListener = state => {
    const getValue = id => {
        const elements = document.getElementsByName(id)
        if (elements.length === 1)
            return elements[0].value
        for (const item of elements)
            if (item.checked)
                return item.value
    }
    document.getElementById("start-button").addEventListener(CLICK, () => {
        changeVisibility('options-box', 'none')
        state.startTime = new Date()
        state.player = getValue('icon')
        state.computer = (state.player === 'x') ? 'o' : 'x'
        state.settings = {
            round: parseInt(getValue('rounds')),
            sex: getValue('sex'),
            id: getValue('id'),
            group: getValue('group'),
        }
        manageStartingMoment(state)
    })
}


// download('test.txt', 'Hello world!');

const state = initState()
addStartButtonListener(state)

new Audio('sound.wav').onloadeddata = event => {
    state.sound = event.currentTarget
    manageStartingMoment(state)
}