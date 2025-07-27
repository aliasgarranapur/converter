document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const previewGrid = document.getElementById('previewGrid');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const successModal = document.getElementById('successModal');
    const modalDownloadBtn = document.getElementById('modalDownloadBtn');
    const newConversionBtn = document.getElementById('newConversionBtn');
    const closeModal = document.querySelector('.close-modal');
    
    // Options elements
    const pageSizeSelect = document.getElementById('pageSize');
    const pageOrientationSelect = document.getElementById('pageOrientation');
    const marginSizeSelect = document.getElementById('marginSize');
    const customMarginGroup = document.getElementById('customMarginGroup');
    const customMarginInput = document.getElementById('customMargin');
    const imageFitSelect = document.getElementById('imageFit');
    const pageLayoutSelect = document.getElementById('pageLayout');
    const customLayoutGroup = document.getElementById('customLayoutGroup');
    const customColsInput = document.getElementById('customCols');
    const customRowsInput = document.getElementById('customRows');
    const borderStyleSelect = document.getElementById('borderStyle');
    const borderColorInput = document.getElementById('borderColor');
    const borderWidthInput = document.getElementById('borderWidth');
    const borderWidthValue = document.getElementById('borderWidthValue');
    const addPageNumbersCheckbox = document.getElementById('addPageNumbers');
    const addWatermarkCheckbox = document.getElementById('addWatermark');
    const watermarkOptions = document.getElementById('watermarkOptions');
    const watermarkTextInput = document.getElementById('watermarkText');
    const watermarkColorInput = document.getElementById('watermarkColor');
    const watermarkOpacityInput = document.getElementById('watermarkOpacity');
    const opacityValue = document.getElementById('opacityValue');
    const qualityInput = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    
    // Variables
    let files = [];
    let pdfBlob = null;
    
    // Event listeners for options
    marginSizeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customMarginGroup.classList.remove('hidden');
        } else {
            customMarginGroup.classList.add('hidden');
        }
    });
    
    pageLayoutSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customLayoutGroup.classList.remove('hidden');
        } else {
            customLayoutGroup.classList.add('hidden');
        }
    });
    
    borderWidthInput.addEventListener('input', function() {
        borderWidthValue.textContent = `${this.value}px`;
    });
    
    addWatermarkCheckbox.addEventListener('change', function() {
        if (this.checked) {
            watermarkOptions.classList.remove('hidden');
        } else {
            watermarkOptions.classList.add('hidden');
        }
    });
    
    watermarkOpacityInput.addEventListener('input', function() {
        opacityValue.textContent = this.value;
    });
    
    qualityInput.addEventListener('input', function() {
        qualityValue.textContent = `${this.value}%`;
    });
    
    // File handling
    fileInput.addEventListener('change', handleFiles);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        fileInput.files = droppedFiles;
        handleFiles();
    }
    
    function handleFiles() {
        files = Array.from(fileInput.files);
        if (files.length === 0) return;
        
        previewGrid.innerHTML = '';
        files.forEach((file, index) => {
            if (!file.type.match('image.*')) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.addEventListener('click', () => removeFile(index));
                
                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                previewGrid.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
        
        previewSection.style.display = 'block';
    }
    
    function removeFile(index) {
        files.splice(index, 1);
        
        // Update file input files (not directly mutable, so we need to create a new DataTransfer)
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        
        // Regenerate preview
        handleFiles();
        
        if (files.length === 0) {
            previewSection.style.display = 'none';
        }
    }
    
    clearAllBtn.addEventListener('click', function() {
        files = [];
        fileInput.value = '';
        previewGrid.innerHTML = '';
        previewSection.style.display = 'none';
    });
    
    // Conversion function
    convertBtn.addEventListener('click', async function() {
        if (files.length === 0) {
            alert('Please select at least one image to convert.');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        convertBtn.disabled = true;
        
        try {
            // Use jsPDF for PDF creation
            const { jsPDF } = window.jspdf;
            let pdf;
            
            // Get options
            const pageSize = pageSizeSelect.value;
            const orientation = pageOrientationSelect.value === 'auto' ? 
                (await getDominantOrientation()) : pageOrientationSelect.value;
            const margin = marginSizeSelect.value === 'custom' ? 
                parseInt(customMarginInput.value) : parseInt(marginSizeSelect.value);
            const imageFit = imageFitSelect.value;
            const pageLayout = pageLayoutSelect.value;
            const customCols = parseInt(customColsInput.value);
            const customRows = parseInt(customRowsInput.value);
            const borderStyle = borderStyleSelect.value;
            const borderColor = borderColorInput.value;
            const borderWidth = parseFloat(borderWidthInput.value);
            const addPageNumbers = addPageNumbersCheckbox.checked;
            const addWatermark = addWatermarkCheckbox.checked;
            const watermarkText = watermarkTextInput.value;
            const watermarkColor = watermarkColorInput.value;
            const watermarkOpacity = parseInt(watermarkOpacityInput.value) / 100;
            const quality = parseInt(qualityInput.value) / 100;
            
            // Initialize PDF
            if (pageSize === 'match') {
                // For match image size, we'll create a custom size for each page
                pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'mm'
                });
            } else {
                pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'mm',
                    format: pageSize
                });
            }
            
            let pageNumber = 1;
            
            // Process images based on layout
            if (pageLayout === 'single') {
                // One image per page
                for (const file of files) {
                    await addImageToPdf(pdf, file, {
                        pageSize,
                        orientation,
                        margin,
                        imageFit,
                        borderStyle,
                        borderColor,
                        borderWidth,
                        addPageNumbers,
                        pageNumber,
                        addWatermark,
                        watermarkText,
                        watermarkColor,
                        watermarkOpacity,
                        quality
                    });
                    
                    if (files.indexOf(file) < files.length - 1) {
                        pdf.addPage();
                    }
                    pageNumber++;
                }
            } else if (pageLayout === 'double') {
                // Two images per page (spread)
                for (let i = 0; i < files.length; i += 2) {
                    const file1 = files[i];
                    const file2 = i + 1 < files.length ? files[i + 1] : null;
                    
                    await addImagesToPdfGrid(pdf, [file1, file2], 2, 1, {
                        pageSize,
                        orientation,
                        margin,
                        imageFit,
                        borderStyle,
                        borderColor,
                        borderWidth,
                        addPageNumbers,
                        pageNumber,
                        addWatermark,
                        watermarkText,
                        watermarkColor,
                        watermarkOpacity,
                        quality
                    });
                    
                    if (i + 2 < files.length) {
                        pdf.addPage();
                    }
                    pageNumber++;
                }
            } else if (pageLayout === 'quad') {
                // Four images per page
                for (let i = 0; i < files.length; i += 4) {
                    const imageGroup = [];
                    for (let j = 0; j < 4; j++) {
                        if (i + j < files.length) {
                            imageGroup.push(files[i + j]);
                        }
                    }
                    
                    await addImagesToPdfGrid(pdf, imageGroup, 2, 2, {
                        pageSize,
                        orientation,
                        margin,
                        imageFit,
                        borderStyle,
                        borderColor,
                        borderWidth,
                        addPageNumbers,
                        pageNumber,
                        addWatermark,
                        watermarkText,
                        watermarkColor,
                        watermarkOpacity,
                        quality
                    });
                    
                    if (i + 4 < files.length) {
                        pdf.addPage();
                    }
                    pageNumber++;
                }
            } else if (pageLayout === 'custom') {
                // Custom grid layout
                const imagesPerPage = customCols * customRows;
                for (let i = 0; i < files.length; i += imagesPerPage) {
                    const imageGroup = [];
                    for (let j = 0; j < imagesPerPage; j++) {
                        if (i + j < files.length) {
                            imageGroup.push(files[i + j]);
                        }
                    }
                    
                    await addImagesToPdfGrid(pdf, imageGroup, customCols, customRows, {
                        pageSize,
                        orientation,
                        margin,
                        imageFit,
                        borderStyle,
                        borderColor,
                        borderWidth,
                        addPageNumbers,
                        pageNumber,
                        addWatermark,
                        watermarkText,
                        watermarkColor,
                        watermarkOpacity,
                        quality
                    });
                    
                    if (i + imagesPerPage < files.length) {
                        pdf.addPage();
                    }
                    pageNumber++;
                }
            }
            
            // Save the PDF
            pdfBlob = pdf.output('blob');
            
            // Enable download button
            downloadBtn.disabled = false;
            modalDownloadBtn.disabled = false;
            
            // Show success modal
            successModal.classList.add('show');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('An error occurred while generating the PDF. Please try again.');
        } finally {
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            convertBtn.disabled = false;
        }
    });
    
    async function getDominantOrientation() {
        // Sample the first few images to determine dominant orientation
        let portraitCount = 0;
        let landscapeCount = 0;
        const sampleSize = Math.min(5, files.length);
        
        for (let i = 0; i < sampleSize; i++) {
            const file = files[i];
            const img = await createImageBitmap(file);
            if (img.width > img.height) {
                landscapeCount++;
            } else {
                portraitCount++;
            }
            img.close();
        }
        
        return landscapeCount > portraitCount ? 'landscape' : 'portrait';
    }
    
    async function addImageToPdf(pdf, file, options) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    
                    let pageWidth, pageHeight;
                    
                    if (options.pageSize === 'match') {
                        // Match image size (convert pixels to mm)
                        const pxToMm = 25.4 / 96; // Assuming 96 DPI
                        pageWidth = imgWidth * pxToMm;
                        pageHeight = imgHeight * pxToMm;
                        
                        // Add some margin if specified
                        if (options.margin > 0) {
                            pageWidth += options.margin * 2;
                            pageHeight += options.margin * 2;
                        }
                        
                        // Create a new page with custom size
                        pdf.addPage([pageWidth, pageHeight], options.orientation);
                    } else {
                        // Get standard page dimensions
                        const dimensions = pdf.internal.pageSize;
                        pageWidth = dimensions.width;
                        pageHeight = dimensions.height;
                    }
                    
                    // Calculate available space (with margins)
                    const availableWidth = pageWidth - (options.margin * 2);
                    const availableHeight = pageHeight - (options.margin * 2);
                    
                    let width, height, x, y;
                    
                    if (options.imageFit === 'fill') {
                        // Fill the entire available space
                        width = availableWidth;
                        height = availableHeight;
                        x = options.margin;
                        y = options.margin;
                    } else if (options.imageFit === 'fit') {
                        // Fit the image while maintaining aspect ratio
                        const ratio = Math.min(
                            availableWidth / imgWidth,
                            availableHeight / imgHeight
                        );
                        width = imgWidth * ratio;
                        height = imgHeight * ratio;
                        x = options.margin + (availableWidth - width) / 2;
                        y = options.margin + (availableHeight - height) / 2;
                    } else { // actual size
                        // Convert pixels to mm (assuming 96 DPI)
                        const pxToMm = 25.4 / 96;
                        width = imgWidth * pxToMm;
                        height = imgHeight * pxToMm;
                        x = options.margin + (availableWidth - width) / 2;
                        y = options.margin + (availableHeight - height) / 2;
                    }
                    
                    // Add the image to the PDF
                    pdf.addImage(img, 'JPEG', x, y, width, height, null, 'FAST', 0, options.quality);
                    
                    // Add border if specified
                    if (options.borderStyle !== 'none') {
                        pdf.setDrawColor(options.borderColor);
                        pdf.setLineWidth(options.borderWidth);
                        
                        if (options.borderStyle === 'dashed') {
                            pdf.dashedLine(x, y, x + width, y, 1, 1);
                            pdf.dashedLine(x + width, y, x + width, y + height, 1, 1);
                            pdf.dashedLine(x + width, y + height, x, y + height, 1, 1);
                            pdf.dashedLine(x, y + height, x, y, 1, 1);
                        } else if (options.borderStyle === 'shadow') {
                            // Shadow effect
                            const shadowOffset = options.borderWidth * 2;
                            pdf.setFillColor(100, 100, 100);
                            pdf.rect(x + shadowOffset, y + shadowOffset, width, height, 'F');
                            pdf.setFillColor(255, 255, 255);
                            pdf.rect(x, y, width, height, 'F');
                        } else {
                            // Solid border
                            pdf.rect(x, y, width, height);
                        }
                    }
                    
                    // Add page number if specified
                    if (options.addPageNumbers) {
                        pdf.setFontSize(10);
                        pdf.setTextColor(100);
                        pdf.text(`Page ${options.pageNumber}`, pageWidth - options.margin - 10, pageHeight - options.margin - 5);
                    }
                    
                    // Add watermark if specified
                    if (options.addWatermark && options.watermarkText) {
                        pdf.setFontSize(48);
                        pdf.setTextColor(options.watermarkColor);
                        pdf.setGState(new pdf.GState({opacity: options.watermarkOpacity}));
                        
                        const textWidth = pdf.getStringUnitWidth(options.watermarkText) * 48 / pdf.internal.scaleFactor;
                        const centerX = (pageWidth - textWidth) / 2;
                        const centerY = pageHeight / 2;
                        
                        pdf.text(options.watermarkText, centerX, centerY, {angle: 45});
                        pdf.setGState(new pdf.GState({opacity: 1}));
                    }
                    
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    async function addImagesToPdfGrid(pdf, imageFiles, cols, rows, options) {
        const dimensions = pdf.internal.pageSize;
        const pageWidth = dimensions.width;
        const pageHeight = dimensions.height;
        
        // Calculate cell dimensions
        const cellWidth = (pageWidth - (options.margin * 2)) / cols;
        const cellHeight = (pageHeight - (options.margin * 2)) / rows;
        
        // Process each image in the grid
        for (let i = 0; i < imageFiles.length; i++) {
            if (!imageFiles[i]) continue;
            
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = options.margin + (col * cellWidth);
            const y = options.margin + (row * cellHeight);
            
            // Create a temporary PDF for the single image
            const tempPdf = new jsPDF({
                orientation: options.orientation,
                unit: 'mm',
                format: options.pageSize
            });
            
            // Add the image to the temporary PDF with the same options
            await addImageToPdf(tempPdf, imageFiles[i], {
                ...options,
                margin: 0, // No margin in grid cells
                addPageNumbers: false, // Don't add page numbers to individual cells
                addWatermark: false // Don't add watermark to individual cells
            });
            
            // Get the temporary PDF as an image
            const tempPdfBlob = tempPdf.output('blob');
            const tempPdfUrl = URL.createObjectURL(tempPdfBlob);
            
            // Add the temporary PDF as an image to the main PDF
            await new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    pdf.addImage(img, 'JPEG', x, y, cellWidth, cellHeight);
                    URL.revokeObjectURL(tempPdfUrl);
                    resolve();
                };
                img.src = tempPdfUrl;
            });
        }
        
        // Add page number if specified (for the entire page)
        if (options.addPageNumbers) {
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(`Page ${options.pageNumber}`, pageWidth - options.margin - 10, pageHeight - options.margin - 5);
        }
        
        // Add watermark if specified (for the entire page)
        if (options.addWatermark && options.watermarkText) {
            pdf.setFontSize(48);
            pdf.setTextColor(options.watermarkColor);
            pdf.setGState(new pdf.GState({opacity: options.watermarkOpacity}));
            
            const textWidth = pdf.getStringUnitWidth(options.watermarkText) * 48 / pdf.internal.scaleFactor;
            const centerX = (pageWidth - textWidth) / 2;
            const centerY = pageHeight / 2;
            
            pdf.text(options.watermarkText, centerX, centerY, {angle: 45});
            pdf.setGState(new pdf.GState({opacity: 1}));
        }
    }
    
    // Download functionality
    downloadBtn.addEventListener('click', function()
