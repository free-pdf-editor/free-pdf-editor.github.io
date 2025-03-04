// Set up eraser functionality
function setupEraser(canvas) {
    // Store the current selection
    appState.selectedObjects = [];
    canvas.getActiveObjects().forEach(obj => {
        appState.selectedObjects.push(obj);
    });
    
    // Clear previous mouse handlers
    canvas.off('mouse:down');
    
    // Add eraser functionality
    canvas.on('mouse:down', function(options) {
        if (appState.currentTool !== 'eraser') return;
        
        const pointer = canvas.getPointer(options.e);
        const objects = canvas.getObjects();
        
        for (let i = objects.length - 1; i >= 0; i--) {
            // For path objects or complex shapes, we need to check if the point is inside
            let objectToRemove = null;
            
            if (objects[i].containsPoint) {
                if (objects[i].containsPoint(pointer)) {
                    objectToRemove = objects[i];
                }
            } else {
                // Fallback for objects without containsPoint method
                const objectLeft = objects[i].left || 0;
                const objectTop = objects[i].top || 0;
                const objectWidth = objects[i].width || 0;
                const objectHeight = objects[i].height || 0;
                
                // Adjustment for scale and other transforms
                const scaleX = objects[i].scaleX || 1;
                const scaleY = objects[i].scaleY || 1;
                
                const scaledWidth = objectWidth * scaleX;
                const scaledHeight = objectHeight * scaleY;
                
                // Check if pointer is within object bounds
                if (pointer.x >= objectLeft && 
                    pointer.x <= objectLeft + scaledWidth && 
                    pointer.y >= objectTop && 
                    pointer.y <= objectTop + scaledHeight) {
                    objectToRemove = objects[i];
                }
            }
            
            // If we found an object to remove
            if (objectToRemove) {
                // Add to history before removing
                appState.objectsHistory.push({
                    canvas: canvas,
                    object: objectToRemove,
                    action: 'remove'
                });
                
                // Remove the object
                canvas.remove(objectToRemove);
                canvas.renderAll();
                updateStatus('Object erased');
                break;
            }
        }
    });
    
    // Add mouse move handler for continuous erasing
    canvas.on('mouse:move', function(options) {
        if (appState.currentTool !== 'eraser' || !options.e.buttons) return;
        
        const pointer = canvas.getPointer(options.e);
        const objects = canvas.getObjects();
        
        for (let i = objects.length - 1; i >= 0; i--) {
            let objectToRemove = null;
            
            if (objects[i].containsPoint) {
                if (objects[i].containsPoint(pointer)) {
                    objectToRemove = objects[i];
                }
            } else {
                const objectLeft = objects[i].left || 0;
                const objectTop = objects[i].top || 0;
                const objectWidth = objects[i].width || 0;
                const objectHeight = objects[i].height || 0;
                
                const scaleX = objects[i].scaleX || 1;
                const scaleY = objects[i].scaleY || 1;
                
                const scaledWidth = objectWidth * scaleX;
                const scaledHeight = objectHeight * scaleY;
                
                if (pointer.x >= objectLeft && 
                    pointer.x <= objectLeft + scaledWidth && 
                    pointer.y >= objectTop && 
                    pointer.y <= objectTop + scaledHeight) {
                    objectToRemove = objects[i];
                }
            }
            
            if (objectToRemove) {
                appState.objectsHistory.push({
                    canvas: canvas,
                    object: objectToRemove,
                    action: 'remove'
                });
                
                canvas.remove(objectToRemove);
                canvas.renderAll();
                break;
            }
        }
    });
}