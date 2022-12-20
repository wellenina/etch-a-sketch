const DEFAULT_GRID_SIZE = 16;
const DEFAULT_BRUSH_COLOR = '#ff69b4';
const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_MODE = 'color';

let gridSize = DEFAULT_GRID_SIZE;
let currentMode = DEFAULT_MODE;

const grid = document.getElementById('grid');
let isDrawing = false;

// undo & redo
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');

let history = [];
let historyCounter = 0;

function initiateAction() {
  if (historyCounter === 0) {
    undoBtn.classList.toggle('disabled');
  };
  if (historyCounter < history.length) {
    history.splice(historyCounter);
    redoBtn.classList.toggle('disabled');
  };
}

undoBtn.addEventListener('click', () => {
    if (historyCounter === history.length) {
       redoBtn.classList.toggle('disabled');
    };
    history[--historyCounter].undo();
    if (historyCounter < 1) {
      undoBtn.classList.toggle('disabled');
    };
});

redoBtn.addEventListener('click', () => {
    history[historyCounter++].redo();
    if (undoBtn.className === 'disabled') { undoBtn.classList.toggle('disabled'); };
    if (historyCounter === history.length) {
      redoBtn.classList.toggle('disabled');
    };
});

function resetHistory() {
  history = [];
  historyCounter = 0;
  undoBtn.className = 'disabled';
  redoBtn.className = 'disabled';
}

// constructors for action objects
function OneColorAction(futureColor, mode) { //////////////////////
  this.cells = [];
  this.pastColors = [];
  this.futureColor = futureColor;
  this.pastClassNames = []; //////////////////////
  this.mode = mode; //////////////////////

  this.undo = function() {
    for (let i = this.cells.length-1; i >= 0; i--) {
      this.cells[i].style.backgroundColor = this.pastColors[i];
      this.cells[i].className = this.pastClassNames[i]; //////////////////////
    }
  };

  this.redo = function() {
    this.cells.forEach(cell => {
      cell.style.backgroundColor = this.futureColor;
      this.mode === 'eraser' ? cell.className = 'empty-cell' : cell.removeAttribute('class', 'empty-cell'); //////////////////////
    });
  };
};

function MultiColorAction() {
  this.cells = [];
  this.pastColors = [];
  this.futureColors = [];
  this.pastClassNames = []; //////////////////////

  this.undo = function() {
    for (let i = this.cells.length-1; i >= 0; i--) {
      this.cells[i].style.backgroundColor = this.pastColors[i];
      this.cells[i].className = this.pastClassNames[i]; //////////////////////
    }
  };

  this.redo = function() {
    this.cells.forEach((cell, index) => {
      cell.style.backgroundColor = this.futureColors[index];
      cell.removeAttribute('class', 'empty-cell'); //////////////////////
    });
  };
};

function FillAction(pastColor, futureColor, pastClassName) {
  this.cells = []; // l'elenco delle celle modificate
  this.pastColor = pastColor;
  this.futureColor = futureColor;
  this.pastClassName = pastClassName;

  this.undo = function() {
    this.cells.forEach(cell => {
      cell.style.backgroundColor = this.pastColor;
      cell.className = this.pastClassName; //////////////////////
    });
  };

  this.redo = function() {
    this.cells.forEach(cell => {
      cell.style.backgroundColor = this.futureColor;
      cell.removeAttribute('class', 'empty-cell'); //////////////////////
    });
  };
};

function BgColorAction(pastColor, futureColor) {
  this.pastColor = pastColor;
  this.futureColor = futureColor;

  this.undo = function() {
    document.querySelectorAll('.empty-cell').forEach(cell => cell.style.backgroundColor = this.pastColor);
  };

  this.redo = function() {
    document.querySelectorAll('.empty-cell').forEach(cell => cell.style.backgroundColor = this.futureColor);
  }
}



const oneColorMode = {
  action: {},

  color: DEFAULT_BRUSH_COLOR,
  eraser: DEFAULT_BACKGROUND_COLOR,

  newColor: '',

  newAction(cell) {
    this.newColor = this[currentMode]; 
    this.action = new OneColorAction(this.newColor, currentMode);
    this.applyAndStoreChanges(cell);
  },

  applyAndStoreChanges(cell) {
    this.action.cells.push(cell);
    this.action.pastColors.push(cell.style.backgroundColor);
    this.action.pastClassNames.push(cell.className); //////////////////////
    cell.style.backgroundColor = this.newColor;
    currentMode === 'eraser' ? cell.className = 'empty-cell' : cell.removeAttribute('class', 'empty-cell'); //////////////////////
},

  endAction() {
    history.push(this.action);
  }
};

const multiColorMode = {
  rainbowColors: ['#F1CEF4', '#E4CFFF', '#C1CCFF', '#B9E3FF', '#A6FFD3', '#BCFFA4', '#F8FF97', '#FFE5A8', '#E8CACA'],
  grayscaleColors: ['#e6e6e6', '#bfbfbf', '#999999', '#737373', '#4d4d4d', '#262626', '#000000', '#262626', '#4d4d4d', '#737373', '#999999', '#bfbfbf'],
  counter: 1,

  rainbow: '',
  grayscale: '',

  updateColor() {
    const colors = this[`${currentMode}Colors`];
    const nextColor = colors[this.counter++ % colors.length];
    setHoverCellColor(nextColor);
    this[currentMode] = nextColor;
  },

  resetColors() {
    this.counter = 1;
    this.rainbow = '#F1CEF4';
    this.grayscale = '#e6e6e6';
  },

  getBrightnessChange(colorStr) {
    let amount = 20; // lighten
    if (currentMode === 'darken') { amount *= -1; };
    const rgbArr = colorStr.substring(4, colorStr.length-1).split(', ');
    const rgbChanged = rgbArr.map(value => parseInt(value) + amount);
    return `rgb(${rgbChanged.join()})`;
  },

  action: {},

  newAction(cell) {
    this.action = new MultiColorAction();
    this.applyAndStoreChanges(cell);
  },

  applyAndStoreChanges(cell) {
    this.action.cells.push(cell);
    this.action.pastColors.push(cell.style.backgroundColor);
    this.action.pastClassNames.push(cell.className); //////////////////////

  let newColor = '';

  if (currentMode === 'rainbow' || currentMode === 'grayscale') {
    newColor = this[currentMode];
    this.updateColor();
  } else {
    newColor = this.getBrightnessChange(cell.style.backgroundColor);
  };

  this.action.futureColors.push(newColor);
  cell.style.backgroundColor = newColor;
  cell.removeAttribute('class', 'empty-cell'); //////////////////////
},

  endAction() {
    history.push(this.action);
  }
}

// 2 dimensional representation of the grid
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

// bucket tool
const bucket = {
  currentColor: '',
  newColor: '',
  classname: '',

  action: {},

  fill(target) {
    this.currentColor = target.style.backgroundColor;
    this.newColor = oneColorMode.color;
    this.classname = target.className;

    this.action = new FillAction(this.currentColor, this.newColor, this.classname);
    this.action.cells.push(target);

    target.style.backgroundColor = this.newColor;
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
    const toBeFilled = this.getNearbyCells(target).filter(cell => cell.style.backgroundColor === this.currentColor);
    
    if (!toBeFilled.length) { // if there are no more cells to be filled
      history.push(this.action);
      historyCounter++;
      return;
    }

    toBeFilled.forEach(cell => {
      this.action.cells.push(cell);
      cell.style.backgroundColor = this.newColor;
      cell.removeAttribute('class', 'empty-cell');
    });
    this.fillNearbyCells(...toBeFilled);
  }
}

grid.addEventListener('click', (event) => {
  if (event.target === grid) { return; };
  if (currentMode === 'fill') { bucket.fill(event.target); }
});


// mouse events for 'drawing' modes
grid.addEventListener('mousedown', (event) => {
    if (event.target === grid) { return; };
    initiateAction();
    if (currentMode === 'fill') { return; };
    isDrawing = true;
    if (currentMode === 'color' || currentMode === 'eraser') {
      oneColorMode.newAction(event.target);
    } else {
      multiColorMode.newAction(event.target);
    }
});

grid.addEventListener('mouseover', (event) => {
    if (event.target === grid) { return; };
    if (!isDrawing) { return; };
    if (currentMode === 'color' || currentMode === 'eraser') {
      oneColorMode.applyAndStoreChanges(event.target);
    } else {
      multiColorMode.applyAndStoreChanges(event.target);
    }
});

window.addEventListener('mouseup', () => {
  if (!isDrawing) { return; };
  isDrawing = false;
    if (currentMode === 'color' || currentMode === 'eraser') {
      oneColorMode.endAction();
    } else {
      multiColorMode.endAction();
    }
  historyCounter++;
});


////////// per mobile, DA TESTARE: ////////////////
grid.addEventListener('touchstart', initiateAction);
grid.addEventListener('touchstart', () => {console.log('the grid has been touch-started!!');}) ////////// TEST!!

grid.addEventListener('touchmove', getTouchedCell);

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


// color pickers
const brushColorPicker = document.getElementById('brush-color');
const bgColorPicker = document.getElementById('bg-color');
brushColorPicker.value = DEFAULT_BRUSH_COLOR;
bgColorPicker.value = DEFAULT_BACKGROUND_COLOR;
brushColorPicker.addEventListener('change', selectBrushColor);
bgColorPicker.addEventListener('change', selectBgColor);

function selectBrushColor(event) {
  const selectedColor = event.target.value;
  oneColorMode.color = selectedColor;
  if (currentMode === 'color' || currentMode === 'fill') { setHoverCellColor(selectedColor); };
}

function selectBgColor(event) {
  initiateAction();
  const currentBgColor = oneColorMode.eraser;
  const newBgColor = event.target.value;
  const action = new BgColorAction(currentBgColor, newBgColor);
  history.push(action);
  historyCounter++;
  
  oneColorMode.eraser =  newBgColor;
  if (currentMode === 'eraser') { setHoverCellColor(newBgColor); };
  document.querySelectorAll('.empty-cell').forEach(cell => cell.style.backgroundColor = newBgColor);
}

// mode buttons
const modeBtn = {
    color: document.getElementById('color'),
    rainbow: document.getElementById('rainbow'),
    grayscale: document.getElementById('grayscale'),
    lighten: document.getElementById('lighten'),
    darken: document.getElementById('darken'),
    fill: document.getElementById('fill'),
    eraser: document.getElementById('eraser')
}
for (const key in modeBtn) {
    modeBtn[key].addEventListener('click', changeMode);
}

function changeMode() {
  let newMode = this.id;
  if (currentMode === newMode) { return; };

  modeBtn[currentMode].classList.toggle('active-mode');
  modeBtn[newMode].classList.toggle('active-mode');
  currentMode = newMode;
  multiColorMode.resetColors();
  //setHoverCellColor(colorManager[currentMode]); DA AGGIUSTARE ///////////////
}






function hasStartedDrawing() {
  return cellList.cells.some(cell => !cell.className);
}

document.getElementById('clear-btn').addEventListener('click', clear);
function clear() {
    const text = 'Your painting will be permanently deleted,\nare you sure you want to proceed?';
    if (hasStartedDrawing() && confirm(text)) {
        cellList.cells.forEach(cell => {cell.style.backgroundColor = oneColorMode.eraser; cell.className = 'empty-cell'} );
        resetHistory();
    }
}

document.getElementById('slider').addEventListener('change', resizeGrid);
function resizeGrid(event) {
  const text = 'Resizing the grid will permanently delete your painting,\nare you sure you want to proceed?';
  if ((hasStartedDrawing() && confirm(text)) || !hasStartedDrawing()) {
      gridSize = event.target.value;
      document.getElementById('display-grid-size').textContent = `${gridSize} x ${gridSize}`;
      grid.replaceChildren();
      createGrid();
      resetHistory();
  }
}


function createGrid() {
    for (let i = 0; i < (gridSize * gridSize); i++) {
        const cell = document.createElement('div');
        cell.style.backgroundColor = oneColorMode.eraser;
        cell.className = 'empty-cell';
        grid.appendChild(cell);
    };
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    cellList.update();
}

function setHoverCellColor(newColor) {
    const r = document.querySelector(':root');
    r.style.setProperty('--hover-cell-color', newColor);
}


createGrid();



// rotate left / right
document.getElementById('rotate-left').addEventListener('click', () => { rotate(-90);} );
document.getElementById('rotate-right').addEventListener('click', () => { rotate(90);} );

function RotateAction(direction) {
  this.direction = direction;

  this.undo = function() {
    rotateGrid(this.direction * -1);
  };
  this.redo = function() {
    rotateGrid(this.direction);
  };
}

function rotate(direction) {
  initiateAction();
  const action = new RotateAction(direction);
  rotateGrid(direction);
  history.push(action);
  historyCounter++;
}

function rotateGrid(direction) {
  let rotatedRows = [];

  if (direction < 0) {
    for (let i = 0; i < gridSize; i++) {
      rotatedRows.unshift([]);
      for (let j = 0; j < gridSize; j++) {
        rotatedRows[0].push(cellList.cellsInRows[j][i]);
      };
    };
  } else {
    for (let i = 0; i < gridSize; i++) {
      rotatedRows.push([]);
      for (let j = gridSize-1; j >= 0; j--) {
        rotatedRows[i].push(cellList.cellsInRows[j][i]);
      };
    };
  };
  cellList.cellsInRows = rotatedRows;
  let rotated = rotatedRows.flat();
  grid.replaceChildren(...rotated);
}


// flip horizontally / vertically
document.getElementById('flip-horizontal').addEventListener('click', () => { flip('horizontal');} );
document.getElementById('flip-vertical').addEventListener('click', () => { flip('vertical');} );

function FlipAction(direction) {
  this.direction = direction;

  this.undo = function() {
    flipGrid(this.direction);
  };
  this.redo = function() {
    flipGrid(this.direction);
  };
}

function flip(direction) {
  initiateAction();
  const action = new FlipAction(direction);
  flipGrid(direction);
  history.push(action);
  historyCounter++;
}

function flipGrid(direction) {
  if (direction === 'horizontal') {
    cellList.cellsInRows.reverse();
 } else {
   cellList.cellsInRows.forEach(row => row.reverse());
 };

 let reversed = cellList.cellsInRows.flat();
 grid.replaceChildren(...reversed);
}


// invert colors
document.getElementById('invert-colors').addEventListener('click', invertColors);

function InvertColorsAction() {
  this.undo = function() {
    invertCellsColors();
  };
  this.redo = function() {
    invertCellsColors();
  };
}

function invertColors() {
  initiateAction();
  const action = new InvertColorsAction();
  invertCellsColors();
  history.push(action);
  historyCounter++;
}

function invertCellsColors() {
  cellList.cells.map(cell => {
    if (cell.className === 'empty-cell') { return; };
    const colorStr = cell.style.backgroundColor;
    const rgbArr = colorStr.substring(4, colorStr.length-1).split(', ');
    const rgbInverted = rgbArr.map(value => 255 - parseInt(value));
    cell.style.backgroundColor = `rgb(${rgbInverted.join()})`;
  })
}