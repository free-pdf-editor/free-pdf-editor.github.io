// Set up pen functionality
function setupPen(canvas) {
    // Enable drawing mode
    canvas.isDrawingMode = true;
    
    // Configure pen settings
    canvas.freeDrawingBrush.color = appState.penColor;
    canvas.freeDrawingBrush.width = appState.penWidth;
    
    // Store the path in history when drawing ends
    canvas.on('path:created', function(e) {
        appState.objectsHistory.push({
            canvas: canvas,
            object: e.path,
            action: 'path'
        });
    });
}

// Initialize pen tool event handlers
function initPenToolHandlers() {
    // Add event listeners for pen color and width controls
    // These could be added to the UI in future enhancements
    
    appState.fabricCanvases.forEach(canvas => {
        // Reset any previous drawing mode when switching to pen
        canvas.isDrawingMode = (appState.currentTool === 'pen');
    });
}

// Update pen color
function updatePenColor(color) {
    appState.penColor = color;
    
    // Update all canvases with the new pen color
    appState.fabricCanvases.forEach(canvas => {
        if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = color;
        }
    });
}

// Update pen width
function updatePenWidth(width) {
    appState.penWidth = width;
    
    // Update all canvases with the new pen width
    appState.fabricCanvases.forEach(canvas => {
        if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = width;
        }
    });
}
