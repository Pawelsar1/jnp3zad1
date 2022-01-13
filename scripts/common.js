const convertToNumber = (x, y) => 3 * y + x
const convertToPair = i => [i % 3, Math.floor(i / 3)]
const changeVisibility = (name, prop) => document.getElementsByClassName(name)[0].style.display = prop

const createCircle = () => {
    let circle = document.createElement(DIV)
    circle.classList.add(CIRCLE)
    return circle
}

const createCross = () => {
    let cross = document.createElement(DIV)
    cross.classList.add(CROSS_CONTAINER)

    let horizontal = document.createElement(DIV)
    horizontal.classList.add(HORIZONTAL)
    cross.appendChild(horizontal)

    let vertical = document.createElement(DIV)
    vertical.classList.add(VERTICAL)
    cross.appendChild(vertical)
    return cross
}

const displayGameFinish = roundNumber => {
    changeVisibility('blur', 'flex')
    document.getElementById('round-counter').innerText = 'Runda: ' + roundNumber
}

function download(filename, text) {
    const csv = document.createElement('a');
    csv.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    csv.setAttribute('download', filename);
    csv.style.display = 'none';
    document.body.appendChild(csv);
    csv.click();
    document.body.removeChild(csv);
}
