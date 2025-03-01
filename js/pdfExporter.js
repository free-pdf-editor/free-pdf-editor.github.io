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
            unit: 'pt'
        });
        
        // For each page
        for (let i = 0; i < appState.fabricCanvases.length; i++) {
            const canvas = appState.fabricCanvases[i];
            const pdfPage = appState.pdfPages[i];
            
            if (i > 0) {
                // Add a new page for pages after the first
                pdf.addPage();
            }
            
            // Get the viewport for the PDF page
            const viewport = pdfPage.getViewport({ scale: 1.5 });
            
            // Set PDF page dimensions
            pdf.setPage(i + 1);
            pdf.internal.pageSize.setWidth(viewport.width);
            pdf.internal.pageSize.setHeight(viewport.height);
            
            // Render the PDF page onto a hidden canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = viewport.width;
            tempCanvas.height = viewport.height;
            const ctx = tempCanvas.getContext('2d');
            
            // Render PDF page
            await pdfPage.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            // Add the PDF page to the new PDF
            const pageImage = tempCanvas.toDataURL('image/png');
            pdf.addImage(pageImage, 'PNG', 0, 0, viewport.width, viewport.height);
            
            // Create a merged canvas with PDF and annotations
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = viewport.width;
            mergedCanvas.height = viewport.height;
            const mergedCtx = mergedCanvas.getContext('2d');
            
            // First draw the PDF page
            mergedCtx.drawImage(tempCanvas, 0, 0);
            
            // Then draw the annotations
            const fabricCanvas = canvas;
            fabricCanvas.renderAll();
            const fabricImage = fabricCanvas.toDataURL('image/png');
            
            // Create an image element to draw the fabric canvas
            const img = new Image();
            img.onload = function() {
                mergedCtx.drawImage(img, 0, 0);
                
                // Add the merged image to the PDF
                const mergedImage = mergedCanvas.toDataURL('image/png');
                
                // Clear the previous image (if we're not on the first page)
                if (i > 0) {
                    pdf.setPage(i + 1);
                }
                
                // Add the annotated image
                pdf.addImage(mergedImage, 'PNG', 0, 0, viewport.width, viewport.height);
                
                // Save PDF when all pages are processed
                if (i === appState.fabricCanvases.length - 1) {
                    const fileName = appState.pdfFile.name.replace('.pdf', '_annotated.pdf');
                    pdf.save(fileName);
                    updateStatus('PDF saved as ' + fileName);
                }
            };
            img.src = fabricImage;
        }
    } catch (error) {
        console.error('Error saving PDF:', error);
        updateStatus('Error saving PDF: ' + error.message);
    }
}
