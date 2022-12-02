const DEFAULT_GRID_SIZE = 16;
const DEFAULT_BRUSH_COLOR = '#ff69b4';
const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_MODE = 'color'; // color, rainbow, grayscale, eraser

let gridSize = DEFAULT_GRID_SIZE;
let selectedColor = DEFAULT_BRUSH_COLOR;
let bgColor = DEFAULT_BACKGROUND_COLOR;
let currentMode = DEFAULT_MODE;

const grid = document.getElementById('grid');
let isMousedown = false;
grid.addEventListener('mousedown', () => {isMousedown = true;});
window.addEventListener('mouseup', () => {isMousedown = false;});

// color pickers
const brushColorPicker = document.getElementById('brush-color');
const bgColorPicker = document.getElementById('bg-color');
brushColorPicker.value = selectedColor;
bgColorPicker.value = bgColor;
brushColorPicker.addEventListener('change', selectBrushColor);
bgColorPicker.addEventListener('change', selectBgColor);

const modeBtn = {
  color: document.getElementById('color'),
  rainbow: document.getElementById('rainbow'),
  grayscale: document.getElementById('grayscale'),
  eraser: document.getElementById('eraser')
}

for (const key in modeBtn) {
  modeBtn[key].addEventListener('click', changeMode);
}

const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', clear);

//// slider - grid size --> not working yet

const rainbowColors = ['#F1CEF4', '#E4CFFF', '#C1CCFF', '#B9E3FF', '#A6FFD3', '#BCFFA4', '#F8FF97', '#FFE5A8', '#E8CACA'];
const grayColors = ['#e6e6e6', '#bfbfbf', '#999999', '#737373', '#4d4d4d', '#262626', '#000000', '#262626', '#4d4d4d', '#737373', '#999999', '#bfbfbf'];
let colorCounter = 0;

/////// AGGIUSTARE QUESTA PARTE ///////////////
function changeCellColor(event) {
    const cell = event.target;

    if (!isMousedown) { // hover effect
        const cellColor = cell.style.backgroundColor;
        cell.addEventListener('mouseout', () => {
            cell.style.backgroundColor = cellColor;
        }, { once: true });
    }

    cell.style.backgroundColor = getColor(currentMode);
}


function getColor(mode) {

  if (mode === 'color') {
    return selectedColor;
  }

  if (mode === 'eraser') {
    return bgColor;
  }

  if (mode === 'rainbow') {
    return rainbowColors[colorCounter++ % rainbowColors.length];
  }

  if (mode === 'grayscale') {
    return grayColors[colorCounter++ % grayColors.length];
  }
}

/////// FINE PARTE DA AGGIUSTARE ///////////////

function createGrid() {
  for (let i = 0; i < (gridSize * gridSize); i++) {
    const cell = document.createElement('div');
    cell.addEventListener('mouseenter', changeCellColor);
    cell.style.backgroundColor = bgColor;
    cell.className = 'bg-cell';
    grid.appendChild(cell);
  };
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
}


function selectBrushColor(event) {
    selectedColor = event.target.value;
  }
  
  function selectBgColor(event) {
    newBgColor = event.target.value;
    bgColor =  newBgColor; // cambia variabile globale per le prossime volte
    document.querySelectorAll('.bg-cell').forEach(cell => cell.style.backgroundColor = newBgColor);
  }


function changeMode(event) {
  let newMode = event.target.id;

  if (currentMode === newMode) { return; };

  modeBtn[currentMode].classList.toggle('active');
  modeBtn[newMode].classList.toggle('active');
  currentMode = newMode;
}


function clear() {
  Array.from(grid.children).forEach(cell => cell.style.backgroundColor = bgColor);
}


createGrid();