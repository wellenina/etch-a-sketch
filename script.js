const DEFAULT_GRID_SIZE = 16;
const DEFAULT_BRUSH_COLOR = '#ff69b4';
const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_MODE = 'color';

let gridSize = DEFAULT_GRID_SIZE;
let currentMode = DEFAULT_MODE;

const grid = document.getElementById('grid');
let isDrawing = false;


//////// constructors /////////

function OneColorAction(futureColor) {
  this.cells = [];
  this.pastColors = [];
  this.futureColor = futureColor;

  this.undo = function() {
    for (let i = this.cells.length-1; i >= 0; i--) {
      this.cells[i].style.backgroundColor = this.pastColors[i];
    }
  };

  this.redo = function() {
    this.cells.forEach(cell => {
      cell.style.backgroundColor = this.futureColor;
    });
  };
};

function MultiColorAction() {
  this.cells = [];
  this.pastColors = [];
  this.futureColors = [];

  this.undo = function() {
    for (let i = this.cells.length-1; i >= 0; i--) {
      this.cells[i].style.backgroundColor = this.pastColors[i];
    }
  };

  this.redo = function() {
    this.cells.forEach((cell, index) => {
      cell.style.backgroundColor = this.futureColors[index];
    });
  };
};

function FillAction(pastColor, futureColor) {
  this.cells = []; // l'elenco delle celle modificate
  this.pastColor = pastColor;
  this.futureColor = futureColor;

  this.undo = function() {
    this.cells.forEach(cell => {
      cell.style.backgroundColor = this.pastColor;
    });
  };

  this.redo = function() {
    this.cells.forEach(cell => {
      cell.style.backgroundColor = this.futureColor;
    });
  };
};

const oneColorMode = {

  action: {},

  color: DEFAULT_BRUSH_COLOR,
  eraser: DEFAULT_BACKGROUND_COLOR,

  newColor: '',

  newAction(cell) {
    this.newColor = this[currentMode]; 
    this.action = new OneColorAction(this.newColor);
    this.storeChanges(cell);
  },

  storeChanges(cell) {
    this.action.cells.push(cell);
    this.action.pastColors.push(cell.style.backgroundColor);
    cell.style.backgroundColor = this.newColor;
},

  endAction() {
    history.push(this.action);
  }
};

const multiColorMode = { ////// rainbow/grey, light/darken

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
    this.storeChanges(cell);
  },

  storeChanges(cell) {
    this.action.cells.push(cell);
    this.action.pastColors.push(cell.style.backgroundColor);

  let newColor = '';

  if (currentMode === 'rainbow' || currentMode === 'grayscale') {
    newColor = this[currentMode];
    this.updateColor();
  } else {
    newColor = this.getBrightnessChange(cell.style.backgroundColor);
  };

  this.action.futureColors.push(newColor);
  cell.style.backgroundColor = newColor;
},

  endAction() {
    history.push(this.action);
  }
}

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
newColor: '',

action: {},

fill(target) {
  this.currentColor = target.style.backgroundColor;
  this.newColor = oneColorMode.color;

  this.action = new FillAction(this.currentColor, this.newColor);
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
  //const neighborhood = this.getNearbyCells(target);
  //const toBeFilled = neighborhood.filter(cell => cell.style.backgroundColor === this.currentColor);

  const toBeFilled = this.getNearbyCells(target).filter(cell => cell.style.backgroundColor === this.currentColor);
  
  if (!toBeFilled.length) { // se è vuoto, cioè non ci sono altre celle da riempire
    history.push(this.action);
    historyCounter++;
    return;
  }

  // se invece ci sono altre celle da riempire:
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

grid.addEventListener('mousedown', (event) => {
    if (event.target === grid) { console.log('mousedown on the grid!!'); return; }; ////////// TEST!!
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
      oneColorMode.storeChanges(event.target);
    } else {
      multiColorMode.storeChanges(event.target);
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

////////// DA TESTARE:
grid.addEventListener('touchstart', initiateAction);
grid.addEventListener('touchstart', () => {console.log('the grid has been touch-started!!');}) ////////// TEST!!

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
    fill: document.getElementById('fill'),
    eraser: document.getElementById('eraser')
}
for (const key in modeBtn) {
    modeBtn[key].addEventListener('click', changeMode);
}


document.getElementById('clear-btn').addEventListener('click', clear);

document.getElementById('slider').addEventListener('change', resizeGrid);



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


function setHoverCellColor(newColor) {
    const r = document.querySelector(':root');
    r.style.setProperty('--hover-cell-color', newColor);
}


function selectBrushColor(event) {
    const selectedColor = event.target.value;
    oneColorMode.color = selectedColor;
    if (currentMode === 'color' || currentMode === 'fill') { setHoverCellColor(selectedColor); };
}

function selectBgColor(event) {
    newBgColor = event.target.value;
    oneColorMode.eraser =  newBgColor;
    if (currentMode === 'eraser') { setHoverCellColor(newBgColor); };
    document.querySelectorAll('.empty-cell').forEach(cell => cell.style.backgroundColor = newBgColor);
}


function changeMode() {
    let newMode = this.id;
    if (currentMode === newMode) { return; };

    modeBtn[currentMode].classList.toggle('active-mode');
    modeBtn[newMode].classList.toggle('active-mode');
    currentMode = newMode;
    multiColorMode.resetColors();
    //setHoverCellColor(colorManager[currentMode]); DA AGGIUSTARE
}


function hasStartedDrawing() {
    return cellList.cells.some(cell => !cell.className);
}


function clear() {
    const text = 'Your painting will be permanently deleted,\nare you sure you want to proceed?';
    if (hasStartedDrawing() && confirm(text)) {
        cellList.cells.forEach(cell => {cell.style.backgroundColor = oneColorMode.eraser; cell.className = 'empty-cell'} );
    }
}


function resizeGrid(event) {
    const text = 'Resizing the grid will permanently delete your painting,\nare you sure you want to proceed?';
    if ((hasStartedDrawing() && confirm(text)) || !hasStartedDrawing()) {
        gridSize = event.target.value;
        document.getElementById('display-grid-size').textContent = `${gridSize} x ${gridSize}`;
        grid.replaceChildren();
        createGrid();
    }
}


createGrid();



//////////// undo & redo //////////////

// bottoni in partenza entrambi disabilitati:
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');

const history = [];
let historyCounter = 0;

//// al moousedown SULLA GRIGLIA per tutti:
function initiateAction() {
  if (historyCounter === 0) { // se partiamo da una situazione in cui non c'erano azioni da annullare
    undoBtn.classList.toggle('disabled'); // ABILITA UNDO
  };
  if (historyCounter < history.length) { // se ci sono posizioni future --> le cancella
    history.splice(historyCounter); // verificare gli indici!!
    // splice cancella dall'indice compreso
    redoBtn.classList.toggle('disabled');
  };
}

///////// verificare gli indici del counter ///////////
undoBtn.addEventListener('click', () => { // click UNDO
    if (historyCounter === history.length) { // è il 1° undo? cioè NON ci sono posizioni future?
       redoBtn.classList.toggle('disabled'); // allora abilita REDO
    };
    history[--historyCounter].undo(); // chiamo il metodo dell'oggetto che rappresenta l'ultima azione effettuata
    if (historyCounter < 1) { // se non ci sono più cambiamenti da annullare = il counter decrementato è 0
      undoBtn.classList.toggle('disabled'); // disabilita UNDO
    };
});
  
redoBtn.addEventListener('click', () => {
    history[historyCounter++].redo();
    if (undoBtn.className === 'disabled') { undoBtn.classList.toggle('disabled'); };
    if (historyCounter === history.length) { // NON ci sono altre posizioni future?
      redoBtn.classList.toggle('disabled'); // allora disabilito REDO
    };
});











