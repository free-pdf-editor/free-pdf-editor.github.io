// Load PDF file
async function loadPDF(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    appState.pdfFile = file;
    
    // Clear previous canvases
    domElements.pdfContainer.innerHTML = '';
    appState.fabricCanvases = [];
    appState.pdfPages = [];
    appState.objectsHistory = [];
    appState.extractedTextItems = []; // Clear any previously extracted text
    
    updateStatus('Loading PDF...');
    
    const fileReader = new FileReader();
    fileReader.onload = async function(event) {
        try {
            const typedArray = new Uint8Array(event.target.result);
            appState.pdfData = typedArray;
            
            // Load the PDF document
            appState.pdfDoc = await pdfjsLib.getDocument({data: typedArray}).promise;
            appState.totalPages = appState.pdfDoc.numPages;
            
            // Render all pages of the PDF
            for (let pageNum = 1; pageNum <= appState.totalPages; pageNum++) {
                await renderPage(pageNum);
            }
            
            updateStatus(`PDF loaded: ${file.name} (${appState.totalPages} pages)`);
            
            // Extract text after loading for text editing features
            await extractTextFromPDF();
        } catch (error) {
            console.error('Error loading PDF:', error);
            updateStatus('Error loading PDF: ' + error.message);
        }
    };
    
    fileReader.readAsArrayBuffer(file);
}

// Render a single PDF page
async function renderPage(pageNum) {
    try {
        // Get the page
        const page = await appState.pdfDoc.getPage(pageNum);
        appState.pdfPages.push(page);
        
        // Get the viewport with consistent scale (1.5)
        const scale = 1.5;
        const viewport = page.getViewport({scale: scale});
        
        // Create a container for this page
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.style.width = `${viewport.width}px`;
        pageContainer.style.height = `${viewport.height}px`;
        pageContainer.dataset.pageNum = pageNum;
        domElements.pdfContainer.appendChild(pageContainer);
        
        // Create canvas for PDF rendering
        const pdfCanvas = document.createElement('canvas');
        pdfCanvas.className = 'pdf-canvas';
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        pageContainer.appendChild(pdfCanvas);
        
        // Render PDF page to canvas with high quality settings
        const ctx = pdfCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Create a container for fabric canvas
        const fabricCanvasContainer = document.createElement('div');
        fabricCanvasContainer.className = 'fabric-canvas-container';
        fabricCanvasContainer.style.width = `${viewport.width}px`;
        fabricCanvasContainer.style.height = `${viewport.height}px`;
        pageContainer.appendChild(fabricCanvasContainer);
        
        // Create fabric.js canvas for annotations
        const fCanvas = new fabric.Canvas(null, {
            containerClass: '',
            width: viewport.width,
            height: viewport.height,
            selection: true,
            preserveObjectStacking: true
        });
        
        // Set Fabric canvas element and append to container
        fCanvas.initialize(document.createElement('canvas'), {
            width: viewport.width,
            height: viewport.height,
        });
        fabricCanvasContainer.appendChild(fCanvas.wrapperEl);
        
        // Store page number for reference
        fCanvas.pageNum = pageNum;
        appState.fabricCanvases.push(fCanvas);
        
        // Ensure canvas is properly sized
        fCanvas.setWidth(viewport.width);
        fCanvas.setHeight(viewport.height);
        
        // Add event listeners for this canvas
        setupCanvasListeners(fCanvas, pageContainer);
        
    } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
        updateStatus(`Error rendering page ${pageNum}: ${error.message}`);
    }
}
