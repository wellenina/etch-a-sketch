const DEFAULT_GRID_SIZE = 16;
const DEFAULT_BRUSH_COLOR = '#ff69b4';
const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_MODE = 'color'; // color, rainbow, grayscale, eraser

let gridSize = DEFAULT_GRID_SIZE;
let currentMode = DEFAULT_MODE;

const grid = document.getElementById('grid');
let isMousedown = false;
grid.addEventListener('mousedown', () => {isMousedown = true;});
window.addEventListener('mouseup', () => {isMousedown = false;});

// color pickers
const brushColorPicker = document.getElementById('brush-color');
const bgColorPicker = document.getElementById('bg-color');
brushColorPicker.value = DEFAULT_BRUSH_COLOR;
bgColorPicker.value = DEFAULT_BACKGROUND_COLOR;
brushColorPicker.addEventListener('change', selectBrushColor);
bgColorPicker.addEventListener('change', selectBgColor);

// mode buttons
const modeBtn = {
    color: document.getElementById('color'),
    rainbow: document.getElementById('rainbow'),
    grayscale: document.getElementById('grayscale'),
    eraser: document.getElementById('eraser')
}
for (const key in modeBtn) {
    modeBtn[key].addEventListener('click', changeMode);
}

const colorManager = {
    rainbowColors: ['#F1CEF4', '#E4CFFF', '#C1CCFF', '#B9E3FF', '#A6FFD3', '#BCFFA4', '#F8FF97', '#FFE5A8', '#E8CACA'],
    grayscaleColors: ['#e6e6e6', '#bfbfbf', '#999999', '#737373', '#4d4d4d', '#262626', '#000000', '#262626', '#4d4d4d', '#737373', '#999999', '#bfbfbf'],
    counter: 0,
  
    color: DEFAULT_BRUSH_COLOR,
    rainbow: '#F1CEF4',
    grayscale: '#e6e6e6',
    eraser: DEFAULT_BACKGROUND_COLOR,

    updateColor() {
        const colors = this[`${currentMode}Colors`];
        const nextColor = colors[this.counter++ % colors.length];
        setHoverCellColor(nextColor);
        this[currentMode] = nextColor;
        },

    resetColors() {
        this.counter = 0;
        this.rainbow = '#F1CEF4';
        this.grayscale = '#e6e6e6';
    }
}

  
const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', clear);

//// slider - grid size --> not working yet


function changeCellColor(event) {
    if (event.type === 'mouseenter' && !isMousedown) { return; };
    const cell = event.target;
    currentMode === 'eraser' ? cell.className = 'empty-cell' : cell.removeAttribute('class', 'empty-cell');
    cell.style.backgroundColor = colorManager[currentMode];
    if (currentMode === 'rainbow' || currentMode === 'grayscale') { colorManager.updateColor(); }
}


function setHoverCellColor(newColor) {
    const r = document.querySelector(':root');
    r.style.setProperty('--hover-cell-color', newColor);
}


function createGrid() {
    for (let i = 0; i < (gridSize * gridSize); i++) {
        const cell = document.createElement('div');
        ['mouseenter', 'mousedown'].forEach(event => cell.addEventListener(event, changeCellColor));
        cell.style.backgroundColor = DEFAULT_BACKGROUND_COLOR;
        cell.className = 'empty-cell';
        grid.appendChild(cell);
    };
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
}


function selectBrushColor(event) {
    const selectedColor = event.target.value;
    colorManager.color = selectedColor;
    if (currentMode === 'color') { setHoverCellColor(selectedColor); };
}

function selectBgColor(event) {
    newBgColor = event.target.value;
    colorManager.eraser =  newBgColor;
    if (currentMode === 'eraser') { setHoverCellColor(newBgColor); };
    document.querySelectorAll('.empty-cell').forEach(cell => cell.style.backgroundColor = newBgColor);
}


function changeMode(event) {
    let newMode = event.target.id;
    if (currentMode === newMode) { return; };

    modeBtn[currentMode].classList.toggle('active');
    modeBtn[newMode].classList.toggle('active');
    currentMode = newMode;
    colorManager.resetColors();
    setHoverCellColor(colorManager[currentMode]);
}


function clear() {
    Array.from(grid.children).forEach(cell => {cell.style.backgroundColor = colorManager.eraser; cell.className = 'empty-cell'} );
}


createGrid();