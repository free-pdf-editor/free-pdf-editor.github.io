// Save the PDF with annotations
async function savePDF() {
    if (!appState.pdfDoc || appState.fabricCanvases.length === 0) {
        updateStatus('No PDF loaded to save');
        return;
    }
    
    updateStatus('Preparing PDF for export...');
    
    try {
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: [
                appState.pdfPages[0].view[2], // Use original PDF width
                appState.pdfPages[0].view[3]  // Use original PDF height
            ]
        });
        
        // Process pages sequentially to avoid race conditions
        await processPageSequentially(pdf);
        
    } catch (error) {
        console.error('Error saving PDF:', error);
        updateStatus('Error saving PDF: ' + error.message);
    }
}

// Process pages one by one in sequence rather than in parallel
async function processPageSequentially(pdf) {
    // Process each page in sequence instead of parallel
    for (let i = 0; i < appState.fabricCanvases.length; i++) {
        updateStatus(`Processing page ${i + 1} of ${appState.fabricCanvases.length}...`);
        await processPage(pdf, i);
    }
    
    // Save the PDF when all pages are processed
    const fileName = appState.pdfFile.name.replace('.pdf', '_annotated.pdf');
    pdf.save(fileName);
    updateStatus('PDF saved as ' + fileName);
}

// Process a single page
async function processPage(pdf, pageIndex) {
    const canvas = appState.fabricCanvases[pageIndex];
    const pdfPage = appState.pdfPages[pageIndex];
    
    // Add a new page for pages after the first
    if (pageIndex > 0) {
        // Get page dimensions from the PDF itself to maintain consistent sizing
        const viewport = pdfPage.getViewport({ scale: 1.0 });
        pdf.addPage([viewport.width, viewport.height]);
    }
    
    // Get the viewport for the PDF page with scale 1.0 (original size)
    const originalViewport = pdfPage.getViewport({ scale: 1.0 });
    
    // Get the viewport with the same scale as used for rendering (1.5)
    const renderViewport = pdfPage.getViewport({ scale: 1.5 });
    
    // Set PDF page dimensions to match original PDF
    pdf.setPage(pageIndex + 1);
    
    // Use the original PDF dimensions (not the scaled viewport)
    pdf.internal.pageSize.width = originalViewport.width;
    pdf.internal.pageSize.height = originalViewport.height;
    
    // Create a temporary canvas for the PDF content at rendering scale
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = renderViewport.width;
    tempCanvas.height = renderViewport.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Ensure PDF page is completely rendered
    await pdfPage.render({
        canvasContext: tempCtx,
        viewport: renderViewport
    }).promise;
    
    // Create a merged canvas to combine PDF content and annotations
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = renderViewport.width;
    mergedCanvas.height = renderViewport.height;
    const mergedCtx = mergedCanvas.getContext('2d');
    
    // Draw the PDF content with high quality settings
    mergedCtx.imageSmoothingEnabled = true;
    mergedCtx.imageSmoothingQuality = 'high';
    mergedCtx.drawImage(tempCanvas, 0, 0);
    
    // Force a complete rendering of all fabric objects
    canvas.renderAll();
    
    // Wait for any animations or rendering to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get the fabric canvas content as an image
    return new Promise((resolve, reject) => {
        try {
            const fabricImage = new Image();
            fabricImage.onload = function() {
                // Draw the annotations on top of the PDF content
                mergedCtx.drawImage(fabricImage, 0, 0);
                
                // Get the final combined image at high quality
                const mergedImage = mergedCanvas.toDataURL('image/png', 1.0);
                
                // Add the combined image to the PDF with correct scaling
                try {
                    pdf.addImage(
                        mergedImage, 
                        'PNG', 
                        0, 
                        0, 
                        pdf.internal.pageSize.width, 
                        pdf.internal.pageSize.height, 
                        `page-${pageIndex + 1}`, 
                        'FAST'
                    );
                    resolve();
                } catch (err) {
                    console.error('Error adding image to PDF:', err);
                    reject(err);
                }
            };
            
            fabricImage.onerror = function(error) {
                console.error('Error loading fabric canvas image:', error);
                reject(error);
            };
            
            // Convert the fabric canvas to a high-quality image
            fabricImage.src = canvas.toDataURL('image/png', 1.0);
        } catch (error) {
            console.error('Error in processPage:', error);
            reject(error);
        }
    });
}
