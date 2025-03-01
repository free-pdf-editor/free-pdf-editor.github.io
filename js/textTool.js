// Initialize text tool event handlers
function initTextToolHandlers() {
    appState.fabricCanvases.forEach(canvas => {
        canvas.off('mouse:down');  // Remove previous handlers
        
        canvas.on('mouse:down', function(options) {
            if (appState.currentTool !== 'text') return;
            
            appState.isDrawing = true;
            const pointer = canvas.getPointer(options.e);
            appState.startX = pointer.x;
            appState.startY = pointer.y;
            
            // Create empty text box with blinking cursor instead of placeholder text
            appState.currentObject = new fabric.IText('', {
                left: appState.startX,
                top: appState.startY,
                fontFamily: appState.fontFamily,
                fontSize: appState.fontSize,
                fill: appState.fontColor,
                width: 150,
                editable: true
            });
            
            canvas.add(appState.currentObject);
            canvas.setActiveObject(appState.currentObject);
            
            // Start editing immediately with blinking cursor
            appState.currentObject.enterEditing();
            appState.currentObject.hiddenTextarea.focus();
            
            // Add to history once text is created
            appState.objectsHistory.push({
                canvas: canvas, 
                object: appState.currentObject, 
                action: 'add'
            });
        });
    });
}
