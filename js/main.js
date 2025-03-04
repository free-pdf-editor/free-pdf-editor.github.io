// Main script to initialize the PDF editor
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tools and event listeners
    initializeToolEventListeners();
});

// Initialize all event listeners for tools
function initializeToolEventListeners() {
    // Edit text tool button - Ensure this is properly connected
    domElements.editTextToolBtn.addEventListener('click', function() {
        setActiveTool('edit-text');
        
        // First extract text if needed, then initialize the edit text handlers
        if (!appState.extractedTextItems || appState.extractedTextItems.length === 0) {
            extractTextFromPDF().then(success => {
                if (success) {
                    initEditTextToolHandlers();
                }
            });
        } else {
            initEditTextToolHandlers();
        }
    });
    
    // PDF loading
    domElements.loadPdfBtn.addEventListener('click', function() {
        domElements.fileInput.click();
    });
    
    domElements.fileInput.addEventListener('change', loadPDF);
    
    // Tool selection
    domElements.textToolBtn.addEventListener('click', function() {
        setActiveTool('text');
        initTextToolHandlers();
    });
    
    domElements.imageToolBtn.addEventListener('click', function() {
        setActiveTool('image');
        initImageToolHandlers();
    });
    
    domElements.imageInput.addEventListener('change', handleImageInput);
    
    domElements.redBoxToolBtn.addEventListener('click', function() {
        setActiveTool('red-box');
        initShapeToolHandlers();
    });
    
    domElements.redArrowToolBtn.addEventListener('click', function() {
        setActiveTool('red-arrow');
        initShapeToolHandlers();
    });
    
    domElements.eraserToolBtn.addEventListener('click', function() {
        setActiveTool('eraser');
    });
    
    domElements.penToolBtn.addEventListener('click', function() {
        setActiveTool('pen');
        initPenToolHandlers();
    });
    
    // Text options
    domElements.fontFamilySelect.addEventListener('change', updateTextOptions);
    domElements.fontSizeSelect.addEventListener('change', updateTextOptions);
    domElements.fontColorSelect.addEventListener('change', updateTextOptions);
    
    // Undo and clear
    domElements.undoBtn.addEventListener('click', undoLastAction);
    domElements.clearBtn.addEventListener('click', clearAllAnnotations);
    
    // Save PDF
    domElements.savePdfBtn.addEventListener('click', savePDF);
    
    // Default status
    updateStatus('Ready - Select a PDF to load');
}

// Handle window resize
window.addEventListener('resize', function() {
    // Resize canvases if needed
    appState.fabricCanvases.forEach(canvas => {
        canvas.setDimensions({
            width: canvas.wrapperEl.parentNode.clientWidth,
            height: canvas.wrapperEl.parentNode.clientHeight
        });
        canvas.renderAll();
    });
});

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Z for undo
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoLastAction();
    }
    
    // Esc to clear selection
    if (e.key === 'Escape') {
        appState.fabricCanvases.forEach(canvas => {
            canvas.discardActiveObject();
            canvas.renderAll();
        });
    }
    
    // Delete or Backspace to remove selected objects
    if (e.key === 'Delete' || e.key === 'Backspace') {
        appState.fabricCanvases.forEach(canvas => {
            const activeObject = canvas.getActiveObject();
            if (activeObject) {
                if (activeObject.type !== 'i-text' || !activeObject.isEditing) {
                    // Add to history before removing
                    appState.objectsHistory.push({
                        canvas: canvas,
                        object: activeObject,
                        action: 'remove'
                    });
                    
                    canvas.remove(activeObject);
                    canvas.renderAll();
                }
            }
        });
    }
});
