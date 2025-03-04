// Update status message
function updateStatus(message) {
    domElements.statusEl.textContent = message;
    console.log(message); // Also log to console for debugging
}

// Reset active state for all tool buttons
function resetToolButtons() {
    domElements.textToolBtn.classList.remove('active');
    domElements.imageToolBtn.classList.remove('active');
    domElements.redBoxToolBtn.classList.remove('active');
    domElements.redArrowToolBtn.classList.remove('active');
    domElements.eraserToolBtn.classList.remove('active');
    domElements.penToolBtn.classList.remove('active');
    domElements.textOptions.classList.remove('active');
	domElements.editTextToolBtn.classList.remove('active');
}

// Set active tool and update UI
function setActiveTool(tool) {
    appState.currentTool = tool;
    
    // Reset active state for all buttons
    resetToolButtons();
    
    // Reset drawing mode on all canvases
    appState.fabricCanvases.forEach(canvas => {
        canvas.isDrawingMode = false;
    });
    
    // Set appropriate cursor for all canvases
    appState.fabricCanvases.forEach(canvas => {
        canvas.wrapperEl.classList.remove('eraser-cursor', 'pen-cursor', 'text-cursor');
    });
    
    // Set active state for selected tool
    switch(tool) {
        case 'text':
            domElements.textToolBtn.classList.add('active');
            domElements.textOptions.classList.add('active');
            appState.fabricCanvases.forEach(canvas => {
                canvas.wrapperEl.classList.add('text-cursor');
            });
            break;
		case 'edit-text':
        domElements.editTextToolBtn.classList.add('active');
        domElements.textOptions.classList.add('active');
        appState.fabricCanvases.forEach(canvas => {
            canvas.wrapperEl.classList.add('text-cursor');
        });
        highlightTextBlocks();
        break;	
        case 'image':
            domElements.imageToolBtn.classList.add('active');
            if (tool === 'image') {
                domElements.imageInput.click();
            }
            break;
        case 'red-box':
            domElements.redBoxToolBtn.classList.add('active');
            break;
        case 'red-arrow':
            domElements.redArrowToolBtn.classList.add('active');
            break;
        case 'eraser':
            domElements.eraserToolBtn.classList.add('active');
            appState.fabricCanvases.forEach(canvas => {
                canvas.wrapperEl.classList.add('eraser-cursor');
                setupEraser(canvas);
            });
            break;
        case 'pen':
            domElements.penToolBtn.classList.add('active');
            appState.fabricCanvases.forEach(canvas => {
                canvas.wrapperEl.classList.add('pen-cursor');
                setupPen(canvas);
            });
            break;
    }
    
    updateStatus(`Tool: ${tool}`);
}

// Update text options
function updateTextOptions() {
    appState.fontFamily = domElements.fontFamilySelect.value;
    appState.fontSize = parseInt(domElements.fontSizeSelect.value);
    appState.fontColor = domElements.fontColorSelect.value;
    
    // If text is currently selected, update its properties
    appState.fabricCanvases.forEach(canvas => {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set({
                fontFamily: appState.fontFamily,
                fontSize: appState.fontSize,
                fill: appState.fontColor
            });
            canvas.renderAll();
        }
    });
}

// Undo last action
function undoLastAction() {
    if (appState.objectsHistory.length === 0) {
        updateStatus('Nothing to undo');
        return;
    }
    
    const lastAction = appState.objectsHistory.pop();
    
    if (lastAction.action === 'add') {
        lastAction.canvas.remove(lastAction.object);
    } else if (lastAction.action === 'remove') {
        lastAction.canvas.add(lastAction.object);
    } else if (lastAction.action === 'path') {
        // Handle path removal for free drawing
        const paths = lastAction.canvas.getObjects().filter(obj => obj.type === 'path');
        if (paths.length > 0) {
            lastAction.canvas.remove(paths[paths.length - 1]);
        }
    }
    
    lastAction.canvas.renderAll();
    updateStatus('Last action undone');
}

// Clear all annotations
function clearAllAnnotations() {
    if (confirm('Clear all annotations?')) {
        appState.fabricCanvases.forEach(canvas => {
            // Keep track of all objects for potential undo
            const objects = canvas.getObjects();
            objects.forEach(obj => {
                appState.objectsHistory.push({canvas: canvas, object: obj, action: 'remove'});
            });
            
            canvas.clear();
        });
        
        updateStatus('All annotations cleared');
    }
}

// Set up event listeners for Fabric canvas
function setupCanvasListeners(canvas, container) {
    // Event handler setup is now distributed across tool-specific files
    // This function sets up common event handlers for all canvases
    
    // Handle text selection to update font controls
    canvas.on('selection:created', function(options) {
        const activeObject = options.selected[0];
        if (activeObject && activeObject.type === 'i-text') {
            // Update font controls to match selected text
            domElements.fontFamilySelect.value = activeObject.fontFamily;
            domElements.fontSizeSelect.value = activeObject.fontSize;
            domElements.fontColorSelect.value = activeObject.fill;
            
            // Update local variables
            appState.fontFamily = activeObject.fontFamily;
            appState.fontSize = activeObject.fontSize;
            appState.fontColor = activeObject.fill;
            
            // Show text options
            domElements.textOptions.classList.add('active');
        }
    });
    
    canvas.on('selection:cleared', function() {
        // Reset to current tool view
        if (appState.currentTool === 'text') {
            domElements.textOptions.classList.add('active');
        } else {
            domElements.textOptions.classList.remove('active');
        }
    });
    
    // Enable object manipulation after placement
    canvas.on('object:modified', function(options) {
        updateStatus('Object modified');
    });
}
