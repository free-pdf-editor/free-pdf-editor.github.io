// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Global application state
const appState = {
    // PDF-related variables
    pdfDoc: null,
    pdfPages: [],
    currentPage: 1,
    totalPages: 0,
    pdfFile: null,
    pdfData: null,

    // Canvas-related variables
    fabricCanvases: [],
    objectsHistory: [],
    
    // Tool-related variables
    currentTool: null,
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentObject: null,
    
    // Text options
    fontFamily: 'Arial',
    fontSize: 16,
    fontColor: 'black',
    
    // Image-related variables
    imageFile: null,
    isImagePlacement: false,
    
    // Drawing-related variables
    penColor: 'black',
    penWidth: 2,
    
    // Eraser-related variables
    eraserWidth: 20,
    
    // Selected objects for various operations
    selectedObjects: [],
	
	// Text extraction variables
    extractedTextItems: [],
    textEditMode: false
};

// DOM Element references
const domElements = {
    // Button elements
    loadPdfBtn: document.getElementById('load-pdf'),
    fileInput: document.getElementById('file-input'),
    textToolBtn: document.getElementById('text-tool'),
    imageToolBtn: document.getElementById('image-tool'),
    imageInput: document.getElementById('image-input'),
    redBoxToolBtn: document.getElementById('red-box-tool'),
    redArrowToolBtn: document.getElementById('red-arrow-tool'),
    eraserToolBtn: document.getElementById('eraser-tool'),
    penToolBtn: document.getElementById('pen-tool'),
    undoBtn: document.getElementById('undo-button'),
    clearBtn: document.getElementById('clear-button'),
    savePdfBtn: document.getElementById('save-pdf'),
	editTextToolBtn: document.getElementById('edit-text-tool'),
    
    // Status and container elements
    statusEl: document.getElementById('status'),
    pdfContainer: document.getElementById('pdf-container'),
    canvasContainer: document.getElementById('canvas-container'),
    
    // Text options elements
    textOptions: document.getElementById('text-options'),
    fontFamilySelect: document.getElementById('font-family'),
    fontSizeSelect: document.getElementById('font-size'),
    fontColorSelect: document.getElementById('font-color')
};
