const random = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const makeMove = (x, y, who, state) => {
    const i = convertToNumber(x, y)
    state.fields[i].appendChild(who === 'x' ? createCross() : createCircle())
    state.board[x][y] = who
    state.freePlaces--
}

const gameFinished = (boardState, who, state) => {
    state.activity = FOR_ANIM_END
    const now = new Date()
    for (let i = 0; i < state.logs.length; i++) {
        const log = state.logs[i]
        if (log.numer_rundy === state.roundNumber)
        log.dlugosc_rundy = Math.round(now - state.startTime);
    }
    if (who === state.computer) {
        for (let i = state.logs.length - 1; i >= 0; i--) {
            const log = state.logs[i]
            if (log.typ_gracza === 'czlowiek') {
                log.blok_by_uratowal = state.betterBlock
                break
            }
        }
    }
    const soundPromise = duration => new Promise(resolve => setTimeout(() => resolve(), duration))

    let promisesArray = []
    if (boardState.line === COLUMN)
        promisesArray = animateColumn(boardState.number, state)
    else if (boardState.line === ROW)
        promisesArray = animateRow(boardState.number, state)
    else if (boardState.line === DIAGONAL)
        promisesArray = animateDiagonal(boardState.number, state)

    if (who === state.player || who === state.computer) {
        state.sound.play()
        promisesArray.push(soundPromise(1000 * state.sound.duration))
    }
    Promise.all(promisesArray).then(() => {
        state.activity = FOR_NEW_GAME
        displayGameFinish(state.roundNumber + 1)
        if (state.roundNumber === state.settings.round) {
            const items = state.logs
            const replacer = (key, value) => {
                if (value === true)
                    return 1
                else if (value === false)
                    return 0
                return value
            }
            const header = Object.keys(items[0])
            const csv = [
                header.join(','), // header row first
                ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
            ].join('\r\n')
            download('data.csv', csv.replace(/\"/g, ""))
        }
    })
}


const checkWin = board => {
    const returnPart = (countO, countX, y) => {
        if (countO === 3)
            return {
                winner: 'o',
                number: y
            }
        else if (countX === 3)
            return {
                winner: 'x',
                number: y
            }
        return {winner: '.'}
    }
    const checkLine = cond => {
        let occupied = 0
        for (let y = 0; y < 3; y++) {
            let countO = 0
            let countX = 0
            for (let x = 0; x < 3; x++) {
                occupied += board[x][y] !== '.'
                countO += cond(x, y, 'o')
                countX += cond(x, y, 'x')
            }
            const data = returnPart(countO, countX, y)
            if (data.winner !== '.')
                return data
        }
        return returnPart(0, 0, 0)
    }

    const checkDiagonal = () => {
        let countO = 0
        let countX = 0
        for (let i = 0; i < 3; i++) {
            countO += board[i][i] === 'o'
            countX += board[i][i] === 'x'
        }
        const data = returnPart(countO, countX, 0)
        if (data.winner !== '.')
            return data

        countO = 0
        countX = 0
        for (let i = 0; i < 3; i++) {
            countO += board[2 - i][i] === 'o'
            countX += board[2 - i][i] === 'x'
        }
        return returnPart(countO, countX, 1)
    }

    const rowResult = checkLine((x, y, c) => board[x][y] === c)
    if (rowResult.winner !== '.')
        return {...rowResult, line: ROW}

    const columnResult = checkLine((y, x, c) => board[x][y] === c)
    if (columnResult.winner !== '.')
        return {...columnResult, line: COLUMN}

    const diagonalResult = checkDiagonal()
    if (diagonalResult.winner !== '.')
        return {...diagonalResult, line: DIAGONAL}

    if (state.freePlaces === 0)
        return {winner: '-'}

    return {winner: '.'}
}

const checkIfFirstMove = state => {
    for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++)
            if (state.board[x][y] !== '.')
                return false
    return true
}

const randomFirstMove = () => {
    const number = random(0, 3)
    if (number === 0)
        return [0, 0]
    else if (number === 1)
        return [2, 0]
    else if (number === 2)
        return [2, 2]
    return [0, 2]
}

const hasWinningMove = (state, who) => {
    for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++)
            if (state.board[x][y] === '.') {
                state.board[x][y] = who
                const boardState = checkWin(state.board)
                state.board[x][y] = '.'
                if (boardState.winner === who)
                    return [x, y]
            }
    return [-1, -1]
}

const randomMove = state => {
    let possibleMoves = []
    for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++)
            if (state.board[x][y] === '.')
                possibleMoves.push(convertToNumber(x, y))
    const move = random(0, possibleMoves.length - 1)
    return convertToPair(possibleMoves[move])
}

const computerMove = state => {
    const updateState = (x, y) => {
        makeMove(x, y, state.computer, state)
        const boardState = checkWin(state.board)
        addComputerLog(state, {x: x, y: y, winner: boardState.winner})
        if (boardState.winner !== '.') {
            // state.isWaiting = false
            gameFinished(boardState, boardState.winner, state)
        } else {
            state.activity = FOR_MOVE
        }
    }

    let [x, y] = [-1, -1];

    if (checkIfFirstMove(state)) {
        [x, y] = randomFirstMove()
        updateState(x, y)
        return
    }

    [x, y] = hasWinningMove(state, state.computer)
    if (x !== -1) {
        updateState(x, y)
        return;
    }

    [x, y] = hasWinningMove(state, state.player)
    if (x !== -1) {
        updateState(x, y)
        return
    }

    [x, y] = randomMove(state)
    updateState(x, y)
}

const checkIfWasBlock = (state, x, y, whoIsBlocked) => {
    const whoWas = state.board[x][y]
    state.board[x][y] = whoIsBlocked
    const result = checkWin(state.board)
    state.board[x][y] = whoWas
    return result.winner === whoIsBlocked
}

const checkFork = (state, x, y, who) => {
    for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0)
                continue
            const X = x + dx
            const Y = y + dy
            if (0 <= X && X < 3 && 0 <= Y && Y < 3 && state.board[X][Y] === who)
                return true
        }
    return false
}

const checkIfMissedWin = (state, x, y) => {
    state.board[x][y] = '.'
    const [x_p, y_p] = hasWinningMove(state, state.player)
    state.board[x][y] = state.player
    return x_p !== -1
}

const drawBoard = state => {
    let res = ''
    for (let y = 0; y < 3; y++)
        for (let x = 0; x < 3; x++)
            res += state.board[x][y]
    return res
}

const checkIfBlockingWasBetter = (state, X, Y) => {
    state.board[X][Y] = '.'
    let ans = false
    for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++)
            if (state.board[x][y] === '.' && (x !== X || y !== Y)) {
                state.board[x][y] = state.player
                const [x_p, y_p] = hasWinningMove(state, state.computer)
                if (x_p === -1) {
                    console.log('siemano')
                    ans = true
                    state.board[x][y] = '.'
                    break
                }
                state.board[x][y] = '.'
            }
    state.board[X][Y] = state.player
    return ans
}

const commonLog = (state, data) => {
    return {
        rodzaj_sesji: state.roundNumber === 0 ? 'treningowa' : 'testowa',
        numer_rundy: state.roundNumber,
        zaczynajacy: state.roundNumber % 2 === 0 ? 'czlowiek' : 'komputer',
        plansza: drawBoard(state),
        ruch: convertToNumber(data.x, data.y),
        remis: data.winner === '-',
        plansza_pelna: state.freePlaces === 0,
        czas_od_startu: Math.round(new Date() - state.startTime),
        dlugosc_rundy: 0,
        blok_by_uratowal: false
    }
}

const addPlayerLog = (state, data) => {
    const blockingMove = checkIfWasBlock(state, data.x, data.y, state.computer)
    const couldBeWinning = data.winner !== state.player && checkIfMissedWin(state, data.x, data.y)
    const playerCommonLog = commonLog(state, data)
    const playerLog = {
        ...playerCommonLog,
        id_gracza: state.settings.id,
        typ_gracza: 'czlowiek',
        plec: state.settings.sex === 'm' ? 'chlopiec' : 'dziewczynka',
        grupa: state.settings.group,
        wygrywajacy: data.winner === state.player,
        blokujacy: blockingMove,
        fork: checkFork(state, data.x, data.y, state.player),
        blok_forka: checkFork(state, data.x, data.y, state.computer),
        mogl_byc_blokiem: !data.winner === state.computer,
        mogl_byc_wygrywajcy: couldBeWinning,
        blok_przy_pierwszej: state.firstBlock && blockingMove,
        wygrana_przy_pierwszej: data.winner === state.player && state.firstWin,
    }
    state.logs.push(playerLog)
    if (blockingMove)
        state.firstBlock = false
    if (couldBeWinning)
        state.firstWin = false
    state.betterBlock = checkIfBlockingWasBetter(state, data.x, data.y)
}


const addComputerLog = (state, data) => {
    const blockingMove = checkIfWasBlock(state, data.x, data.y, state.player)
    const computerCommonLog = commonLog(state, data)
    const computerLog = {
        ...computerCommonLog,
        id_gracza: 0,
        typ_gracza: 'computer',
        plec: 0,
        grupa: 0,
        wygrywajacy: data.winner === state.computer,
        blokujacy: blockingMove,
        fork: checkFork(state, data.x, data.y, state.computer),
        blok_forka: checkFork(state, data.x, data.y, state.player),
        mogl_byc_blokiem: false,
        mogl_byc_wygrywajcy: data.winner === state.computer,
        blok_przy_pierwszej: state.firstBlockComputer && blockingMove,
        wygrana_przy_pierwszej: data.winner === state.computer,
    }
    state.logs.push(computerLog)
    console.log(state.logs[state.logs.length - 1])
    if (blockingMove)
        state.firstBlockComputer = false
}

const fieldOnClick = (i, state) => {
    if (state.activity !== FOR_MOVE)
        return;
    const [x, y] = convertToPair(i)
    if (state.board[x][y] === '.') {
        state.activity = FOR_CLICK
        makeMove(x, y, state.player, state)
        const boardState = checkWin(state.board)
        addPlayerLog(state, {x: x, y: y, winner: boardState.winner})
        if (boardState.winner !== '.') {
            gameFinished(boardState, boardState.winner, state)
        } else {
            // state.isWaiting = true
        }
    }
}