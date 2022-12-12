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

['mousedown', 'mouseover'].forEach(type => grid.addEventListener(type, (event) => {
    if (event.type === 'mouseover' && !isMousedown) { return; };
    changeCellColor(event.target);
}));


grid.addEventListener('touchmove', getTouchedCell);

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
    lighten: document.getElementById('lighten'),
    darken: document.getElementById('darken'),
    eraser: document.getElementById('eraser'),
    fill: document.getElementById('fill')
}
for (const key in modeBtn) {
    modeBtn[key].addEventListener('click', changeMode);
}

const colorManager = {
    rainbowColors: ['#F1CEF4', '#E4CFFF', '#C1CCFF', '#B9E3FF', '#A6FFD3', '#BCFFA4', '#F8FF97', '#FFE5A8', '#E8CACA'],
    grayscaleColors: ['#e6e6e6', '#bfbfbf', '#999999', '#737373', '#4d4d4d', '#262626', '#000000', '#262626', '#4d4d4d', '#737373', '#999999', '#bfbfbf'],
    counter: 0,
  
    color: DEFAULT_BRUSH_COLOR,
    rainbow: '',
    grayscale: '',
    lighten: 'antiquewhite',
    darken: 'indianred',
    eraser: DEFAULT_BACKGROUND_COLOR,
    fill: '',

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
        this.fill = this.color;
    }
}



document.getElementById('clear-btn').addEventListener('click', clear);

document.getElementById('slider').addEventListener('change', resizeGrid);

const cellList = {
    cells: [],
    cellsInRows: [],
  
    update() {
      this.cells = Array.from(grid.children);
      this.cellsInRows = [];
      for (let i = 0; i < gridSize; i++) {
        this.cellsInRows.push(this.cells.slice(i*gridSize, i*gridSize+gridSize));
      };
    }
  }


  const bucket = {

    currentColor: '',
  
    fill(target) {
      this.currentColor = target.style.backgroundColor;
  
      //se il colore del secchiello è lo stesso del quadratino, non fare niente:
      //if (this.currentColor === colorManager.color) { return; };
  
      target.style.backgroundColor = colorManager.color;
      target.removeAttribute('class', 'empty-cell');
      this.fillNearbyCells(target);
    },

    getNearbyCells(cells) {
        let totalNearbyCells = [];
      
        for (const cell of cells) {
            const index = cellList.cells.indexOf(cell);
            const yIndex = Math.floor(index/gridSize);
            const xIndex = index%gridSize;
            const rowAbove = cellList.cellsInRows[yIndex-1];
            const row = cellList.cellsInRows[yIndex];
            const rowBelow = cellList.cellsInRows[yIndex+1];
      
            const nearbyCells = [];
            if (rowAbove != undefined) { nearbyCells.push(rowAbove[xIndex]); };
            nearbyCells.push(row[xIndex-1], row[xIndex +1]);
            if (rowBelow != undefined) { nearbyCells.push(rowBelow[xIndex]); };
      
            totalNearbyCells = totalNearbyCells.concat(nearbyCells.filter(cell => cell != undefined && !totalNearbyCells.includes(cell)));
        };
      
        return totalNearbyCells;
      },

    fillNearbyCells(...target) {
        const neighborhood = this.getNearbyCells(target);
        const toBeFilled = neighborhood.filter(cell => cell.style.backgroundColor === this.currentColor);
        
        if (toBeFilled.length) { // cioè se è maggiore di 0, quindi non è vuoto
          toBeFilled.forEach(cell => {
            cell.style.backgroundColor = colorManager.color;
            cell.removeAttribute('class', 'empty-cell');
            });
          this.fillNearbyCells(...toBeFilled);
        };
      }
  }

grid.addEventListener('click', (event) => {
    if (currentMode === 'fill') {
        bucket.fill(event.target);
    }
})


function createGrid() {
    for (let i = 0; i < (gridSize * gridSize); i++) {
        const cell = document.createElement('div');
        cell.style.backgroundColor = colorManager.eraser;
        cell.className = 'empty-cell';
        grid.appendChild(cell);
    };
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    cellList.update();
}

// to get the same result as a 'mouseover' event on mobile devices:
function getTouchedCell(event) {
    if (event.touches.length > 1) { return; };
    event.preventDefault();

    const gridX = grid.getBoundingClientRect().x;
    const gridY = grid.getBoundingClientRect().y;
    const cellSize= grid.getBoundingClientRect().width / gridSize;
    
    const horizontalIndex = Math.floor((event.touches[0].clientX - gridX) / cellSize);
    const verticalIndex = Math.floor((event.touches[0].clientY - gridY) / cellSize);
    changeCellColor(cellList.cellsInRows[verticalIndex][horizontalIndex]);
}


function changeCellColor(cell) {
    if (currentMode === 'fill') { return; };
    if (currentMode === 'lighten' || currentMode === 'darken') { changeBrightness(cell); return; }
    currentMode === 'eraser' ? cell.className = 'empty-cell' : cell.removeAttribute('class', 'empty-cell');
    cell.style.backgroundColor = colorManager[currentMode];
    if (currentMode === 'rainbow' || currentMode === 'grayscale') { colorManager.updateColor(); }
}


function changeBrightness(cell) {
    let amount = 20; // lighten
    if (currentMode === 'darken') { amount *= -1; };
    const colorStr = cell.style.backgroundColor;
    const rgbArr = colorStr.substring(4, colorStr.length-1).split(', ');
    const rgbChanged = rgbArr.map(value => parseInt(value) + amount);
    cell.style.backgroundColor = `rgb(${rgbChanged.join()})`;
}


function setHoverCellColor(newColor) {
    const r = document.querySelector(':root');
    r.style.setProperty('--hover-cell-color', newColor);
}


function selectBrushColor(event) {
    const selectedColor = event.target.value;
    colorManager.color = selectedColor;
    if (currentMode === 'color' || currentMode === 'fill') { setHoverCellColor(selectedColor); };
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
    cellList.cells.forEach(cell => {cell.style.backgroundColor = colorManager.eraser; cell.className = 'empty-cell'} );
}


function resizeGrid(event) {
    const text = 'Resizing the grid will delete your painting,\nare you sure you want to proceed?';
    const hasStartedDrawing = cellList.cells.some(cell => !cell.className);

    if ((hasStartedDrawing && confirm(text)) || !hasStartedDrawing) {
        gridSize = event.target.value;
        document.getElementById('display-grid-size').textContent = `${gridSize} x ${gridSize}`;
        grid.replaceChildren();
        createGrid();
    }
}


createGrid();