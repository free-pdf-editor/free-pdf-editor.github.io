// Handle image input
function handleImageInput(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    appState.imageFile = file;
    updateStatus('Image loaded. Click on the canvas to place it.');
}

// Initialize image tool event handlers
function initImageToolHandlers() {
    appState.fabricCanvases.forEach(canvas => {
        canvas.off('mouse:down');  // Remove previous handlers
        
        canvas.on('mouse:down', function(options) {
            if (appState.currentTool !== 'image' || !appState.imageFile || appState.isImagePlacement) return;
            
            const pointer = canvas.getPointer(options.e);
            placeImage(canvas, pointer);
        });
    });
}

// Place image on canvas
function placeImage(canvas, pointer) {
    if (!appState.imageFile) return;
    appState.isImagePlacement = true;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        fabric.Image.fromURL(e.target.result, function(img) {
            // Calculate initial dimensions for the image
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            
            // Set initial size to 25% of canvas width while maintaining aspect ratio
            const maxWidth = canvasWidth * 0.25;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = height * ratio;
            }
            
            img.set({
                left: pointer.x,
                top: pointer.y,
                cornerSize: 10,
                cornerColor: 'blue',
                borderColor: 'blue',
                cornerStyle: 'circle',
                transparentCorners: false,
                lockUniScaling: false,
                hasControls: true,
                hasBorders: true,
                selectable: true
            });
            
            // Set the image's scaled dimensions
            img.scaleToWidth(width);
            
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            
            // Store for undo
            appState.objectsHistory.push({
                canvas: canvas, 
                object: img, 
                action: 'add'
            });
            
            // Reset tool after placing image
            appState.currentTool = null;
            resetToolButtons();
            appState.isImagePlacement = false;
            updateStatus('Image placed. You can now resize and move it.');
        });
    };
    reader.readAsDataURL(appState.imageFile);
}
