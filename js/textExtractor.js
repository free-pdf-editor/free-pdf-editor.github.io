// Extract text from PDF for editing
async function extractTextFromPDF() {
    if (!appState.pdfDoc) {
        updateStatus('No PDF loaded for text extraction');
        return false;
    }
    
    updateStatus('Extracting text from PDF...');
    appState.extractedTextItems = [];
    
    try {
        for (let i = 0; i < appState.totalPages; i++) {
            const pageNum = i + 1;
            const page = appState.pdfPages[i];
            const textContent = await page.getTextContent({ normalizeWhitespace: true });
            
            // Get the viewport with the same scale as used for rendering
            const scale = 1.5; // Make sure this matches the scale used in pdfLoader.js
            const viewport = page.getViewport({ scale: scale });
            
            // Store text items with their positions and styles
            textContent.items.forEach(item => {
                // Get the transform from the viewport
                const transform = viewport.transform;
                
                // Calculate font size from the transform matrix
                const fontSize = Math.sqrt(item.transform[2] * item.transform[2] + item.transform[3] * item.transform[3]) * scale;
                
                // Calculate the width of the text
                const width = item.width * scale;
                const height = fontSize * 1.2; // Approximate line height
                
                // Transform text coordinates from PDF space to canvas space
                // PDF coordinates have origin at bottom-left, canvas at top-left
                const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
                
                appState.extractedTextItems.push({
                    text: item.str,
                    x: x,
                    y: y - height, // Adjust for text baseline difference
                    fontSize: fontSize,
                    pageNum: pageNum,
                    width: width,
                    height: height,
                    fontFamily: item.fontName || 'Arial',
                    originalPosition: { x: x, y: y } // Store the original coordinates
                });
            });
        }
        
        console.log('Extracted text items:', appState.extractedTextItems);
        updateStatus(`Text extraction complete. Found ${appState.extractedTextItems.length} text elements.`);
        return true;
    } catch (error) {
        console.error('Error extracting text:', error);
        updateStatus('Error extracting text: ' + error.message);
        return false;
    }
}

// Initialize text edit functionality
function initEditTextToolHandlers() {
    appState.textEditMode = true;
    
    appState.fabricCanvases.forEach(canvas => {
        // Remove previous handlers to avoid duplicates
        canvas.off('mouse:down');
        
        canvas.on('mouse:down', function(options) {
            console.log('Canvas clicked, current tool:', appState.currentTool);
            if (appState.currentTool !== 'edit-text') return;
            
            const pointer = canvas.getPointer(options.e);
            console.log('Click position:', pointer, 'Page:', canvas.pageNum);
            
            // Log all text items on the current page for debugging
            const pageItems = appState.extractedTextItems.filter(item => item.pageNum === canvas.pageNum);
            console.log(`Found ${pageItems.length} text items on page ${canvas.pageNum}`);
            
            const clickedTextItem = findTextItemAtPosition(pointer, canvas.pageNum);
            console.log('Found text item:', clickedTextItem);
            
            if (clickedTextItem) {
                maskAndReplaceText(clickedTextItem, canvas);
            } else {
                console.log('No text item found at this position');
                updateStatus('No text found at this position. Try clicking on visible text.');
            }
        });
    });
    
    // Make sure to highlight text blocks when this tool is activated
    highlightTextBlocks();
    
    console.log('Text edit mode initialized on', appState.fabricCanvases.length, 'canvases');
}

// Find text item at the clicked position with improved accuracy
function findTextItemAtPosition(pointer, pageNum) {
    // Add more logging to diagnose
    console.log(`Finding text at (${pointer.x}, ${pointer.y}) on page ${pageNum}`);
    
    // Increased but reasonable tolerance for easier selection
    const tolerance = 15;
    
    // Sort by distance to prioritize closer items
    const pageItems = appState.extractedTextItems
        .filter(item => item.pageNum === pageNum)
        .map(item => {
            // Calculate the center point of the text item
            const centerX = item.x + (item.width / 2);
            const centerY = item.y + (item.height / 2);
            
            // Calculate distance from pointer to center of text item
            const distance = Math.sqrt(
                Math.pow(pointer.x - centerX, 2) + 
                Math.pow(pointer.y - centerY, 2)
            );
            
            return { ...item, distance };
        })
        .sort((a, b) => a.distance - b.distance);
    
    // First try with exact bounds
    let matchingItem = pageItems.find(item => 
        pointer.x >= item.x && 
        pointer.x <= item.x + item.width &&
        pointer.y >= item.y && 
        pointer.y <= item.y + item.height
    );
    
    // If not found, try with tolerance
    if (!matchingItem && pageItems.length > 0) {
        matchingItem = pageItems.find(item => 
            pointer.x >= (item.x - tolerance) && 
            pointer.x <= (item.x + item.width + tolerance) &&
            pointer.y >= (item.y - tolerance) && 
            pointer.y <= (item.y + item.height + tolerance)
        );
    }
    
    // If still not found, just get the closest one within a reasonable distance
    if (!matchingItem && pageItems.length > 0 && pageItems[0].distance < 50) {
        matchingItem = pageItems[0];
    }
    
    // Debug output
    if (!matchingItem) {
        const nearbyItems = pageItems.slice(0, 3);
        console.log('Closest items:', nearbyItems);
    }
    
    return matchingItem;
}

// Create a mask over existing text and add editable text on top
function maskAndReplaceText(textItem, canvas) {
    console.log('Creating edit text at:', textItem);
    
    // Create white rectangle to mask the original text
    const padding = 4;
    const mask = new fabric.Rect({
        left: textItem.x - padding,
        top: textItem.y - padding,
        width: textItem.width + (padding * 2),
        height: textItem.height + (padding * 2),
        fill: 'white',
        selectable: false
    });
    
    // FIXED POSITIONING: Use the original position coordinates and apply proper baseline adjustment
    // This is the key fix - we position the text exactly at the position provided by PDF.js
    const textObject = new fabric.IText(textItem.text, {
        left: textItem.x,
        top: textItem.y, // Use the pre-calculated y position that includes baseline adjustment
        fontFamily: textItem.fontFamily || appState.fontFamily,
        fontSize: textItem.fontSize || appState.fontSize,
        fill: appState.fontColor || '#000000',
        editable: true,
        originX: 'left',
        originY: 'top'
    });
    
    // Add to canvas
    canvas.add(mask);
    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    
    // Make sure mask is behind text
    mask.moveTo(0);
    textObject.moveTo(1);
    
    // Start editing immediately
    textObject.enterEditing();
    textObject.hiddenTextarea.focus();
    
    // Add to history
    appState.objectsHistory.push({
        canvas: canvas, 
        object: textObject, 
        action: 'add'
    });
    
    updateStatus('Editing text: ' + textItem.text);
    
    // Ensure canvas is rendered
    canvas.renderAll();
}

// Highlight text blocks to show they're editable
function highlightTextBlocks() {
    if (!appState.extractedTextItems || appState.extractedTextItems.length === 0) {
        console.log('No text elements available, attempting extraction');
        extractTextFromPDF().then(success => {
            if (success) {
                showHighlights();
            } else {
                updateStatus('Failed to extract text for highlighting');
            }
        });
    } else {
        showHighlights();
    }
}

function showHighlights() {
    updateStatus('Highlighting text blocks for editing...');
    
    // Clear any existing highlights first
    appState.fabricCanvases.forEach(canvas => {
        const highlights = canvas.getObjects().filter(obj => 
            obj.highlightRect === true
        );
        
        highlights.forEach(highlight => {
            canvas.remove(highlight);
        });
    });
    
    // Make sure we have text items to highlight
    if (!appState.extractedTextItems || appState.extractedTextItems.length === 0) {
        updateStatus('No text elements to highlight');
        return;
    }
    
    console.log(`Highlighting ${appState.extractedTextItems.length} text elements across all pages`);
    
    // Temporarily show highlight rectangles around text elements
    appState.fabricCanvases.forEach(canvas => {
        const pageNum = canvas.pageNum;
        const pageTextItems = appState.extractedTextItems.filter(item => item.pageNum === pageNum);
        
        console.log(`Page ${pageNum}: ${pageTextItems.length} text items to highlight`);
        
        pageTextItems.forEach(item => {
            // More visible highlight with brighter color
            const rect = new fabric.Rect({
                left: item.x,
                top: item.y,
                width: Math.max(item.width, 10), // Ensure minimum width
                height: Math.max(item.height, 10), // Ensure minimum height
                fill: 'rgba(0, 200, 255, 0.3)',
                stroke: 'rgba(0, 150, 255, 0.8)',
                strokeWidth: 1,
                selectable: false,
                highlightRect: true
            });
            
            canvas.add(rect);
        });
        
        canvas.renderAll();
    });
    
    // Remove highlights after a reasonable time
    setTimeout(() => {
        appState.fabricCanvases.forEach(canvas => {
            const highlights = canvas.getObjects().filter(obj => 
                obj.highlightRect === true
            );
            
            highlights.forEach(highlight => {
                canvas.remove(highlight);
            });
            
            canvas.renderAll();
        });
        
        updateStatus('Text edit mode active. Click on text to edit.');
    }, 5000);
}

// Log extracted text in a more readable format for debugging
function debugExtractedText() {
    if (!appState.extractedTextItems || appState.extractedTextItems.length === 0) {
        console.log('No extracted text items available');
        return;
    }
    
    for (let i = 1; i <= appState.totalPages; i++) {
        const pageItems = appState.extractedTextItems.filter(item => item.pageNum === i);
        console.log(`===== Page ${i}: ${pageItems.length} text items =====`);
        pageItems.forEach((item, index) => {
            console.log(`Item ${index + 1}: "${item.text}" at (${Math.round(item.x)}, ${Math.round(item.y)}), size: ${Math.round(item.fontSize)}px`);
        });
    }
}

// Expose functions to be accessible from other files
window.pdfeditTools = window.pdfeditTools || {};
Object.assign(window.pdfeditTools, {
    extractTextFromPDF,
    initEditTextToolHandlers,
    highlightTextBlocks,
    debugExtractedText
});
