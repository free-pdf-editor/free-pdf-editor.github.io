// Initialize shape tool event handlers
function initShapeToolHandlers() {
    appState.fabricCanvases.forEach(canvas => {
        canvas.off('mouse:down');  // Remove previous handlers
        canvas.off('mouse:move');
        canvas.off('mouse:up');
        
        canvas.on('mouse:down', function(options) {
            if (!appState.currentTool || 
                (appState.currentTool !== 'red-box' && 
                 appState.currentTool !== 'red-arrow')) return;
            
            appState.isDrawing = true;
            const pointer = canvas.getPointer(options.e);
            appState.startX = pointer.x;
            appState.startY = pointer.y;
        });
        
        canvas.on('mouse:move', function(options) {
            if (!appState.isDrawing || 
                (appState.currentTool !== 'red-box' && 
                 appState.currentTool !== 'red-arrow')) return;
            
            const pointer = canvas.getPointer(options.e);
            
            // Remove any in-progress object
            if (appState.currentObject) {
                canvas.remove(appState.currentObject);
            }
            
            switch(appState.currentTool) {
                case 'red-box':
                    // Create red box
                    appState.currentObject = new fabric.Rect({
                        left: Math.min(appState.startX, pointer.x),
                        top: Math.min(appState.startY, pointer.y),
                        width: Math.abs(appState.startX - pointer.x),
                        height: Math.abs(appState.startY - pointer.y),
                        stroke: 'red',
                        strokeWidth: 2,
                        fill: 'transparent'
                    });
                    break;
                    
                case 'red-arrow':
                    // Draw line
                    const line = new fabric.Line([appState.startX, appState.startY, pointer.x, pointer.y], {
                        stroke: 'red',
                        strokeWidth: 2
                    });
                    
                    // Calculate arrow head points
                    const headLength = 15;
                    const angle = Math.atan2(pointer.y - appState.startY, pointer.x - appState.startX);
                    const angle1 = angle - Math.PI / 6;
                    const angle2 = angle + Math.PI / 6;
                    
                    const head1X = pointer.x - headLength * Math.cos(angle1);
                    const head1Y = pointer.y - headLength * Math.sin(angle1);
                    const head2X = pointer.x - headLength * Math.cos(angle2);
                    const head2Y = pointer.y - headLength * Math.sin(angle2);
                    
                    // Create arrow head
                    const head1 = new fabric.Line([pointer.x, pointer.y, head1X, head1Y], {
                        stroke: 'red',
                        strokeWidth: 2
                    });
                    
                    const head2 = new fabric.Line([pointer.x, pointer.y, head2X, head2Y], {
                        stroke: 'red',
                        strokeWidth: 2
                    });
                    
                    // Group line and arrow head
                    appState.currentObject = new fabric.Group([line, head1, head2], {
                        selectable: true
                    });
                    break;
            }
            
            if (appState.currentObject) {
                canvas.add(appState.currentObject);
                canvas.renderAll();
            }
        });
        
        canvas.on('mouse:up', function() {
            if (!appState.isDrawing || 
                (appState.currentTool !== 'red-box' && 
                 appState.currentTool !== 'red-arrow')) return;
            
            appState.isDrawing = false;
            
            if (appState.currentObject) {
                appState.objectsHistory.push({
                    canvas: canvas, 
                    object: appState.currentObject, 
                    action: 'add'
                });
                appState.currentObject = null;
            }
        });
    });
}
