// Pixel matrix visualization
class PixelMatrix {
    constructor() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.matrix = document.getElementById('pixel-matrix');
        if (!this.matrix) {
            console.error('Matrix element not found');
            return;
        }

        this.size = 8; // Default size is 8x8
        this.selectedValue = 255; // Default to white
        this.pixels = [];
        this.showValues = true;
        this.selectedPixel = null;
        
        // Create matrix immediately
        this.createMatrix();
        
        // Initialize controls after matrix is created
        this.initializeControls();
    }
    
    initializeControls() {
        // Matrix size control
        const matrixSizeSelect = document.getElementById('matrix-size');
        if (!matrixSizeSelect) {
            console.error('Matrix size select not found');
            return;
        }
        matrixSizeSelect.value = '8'; // Set default value
        matrixSizeSelect.addEventListener('change', () => {
            this.size = parseInt(matrixSizeSelect.value);
            this.createMatrix();
        });
        
        // Pixel value controls
        const pixelValueInput = document.getElementById('pixel-value-input');
        const selectedColor = document.getElementById('selected-color');
        // Fallback: if color-value does not exist, create it
        let colorValue = document.getElementById('color-value');
        if (!colorValue) {
            colorValue = document.createElement('div');
            colorValue.id = 'color-value';
            colorValue.style.display = 'none'; // Hide by default
            selectedColor.parentNode.appendChild(colorValue);
        }
        
        if (!pixelValueInput || !selectedColor || !colorValue) {
            console.error('Required control elements not found');
            return;
        }

        // Initialize color preview
        this.updateColorPreview = (value) => {
            const hex = value.toString(16).padStart(2, '0');
            const color = `#${hex}${hex}${hex}`;
            selectedColor.style.backgroundColor = color;
            colorValue.innerHTML = `RGB(${value}, ${value}, ${value})<br>HEX: ${color}`;
        };
        
        // Make selected color preview clickable
        selectedColor.style.cursor = 'pointer';
        selectedColor.addEventListener('click', () => {
            // Remove any existing color picker
            const existingPicker = document.querySelector('.color-picker-popup');
            if (existingPicker) {
                existingPicker.remove();
                return;
            }

            const colorPicker = document.createElement('div');
            colorPicker.className = 'color-picker-popup';
            
            // Create grayscale palette
            const shades = [0, 32, 64, 96, 128, 160, 192, 224, 255];
            const palette = document.createElement('div');
            palette.style.display = 'grid';
            palette.style.gridTemplateColumns = 'repeat(3, 1fr)';
            palette.style.gap = '5px';
            
            shades.forEach(shade => {
                const colorBox = document.createElement('div');
                colorBox.className = 'color-box';
                colorBox.style.backgroundColor = `rgb(${shade}, ${shade}, ${shade})`;
                
                colorBox.addEventListener('click', () => {
                    this.selectedValue = shade;
                    this.updateColorPreview(shade);
                    pixelValueInput.value = shade;
                    colorPicker.remove();
                });
                
                palette.appendChild(colorBox);
            });
            
            colorPicker.appendChild(palette);
            document.body.appendChild(colorPicker);
            
            // Position the color picker
            const rect = selectedColor.getBoundingClientRect();
            colorPicker.style.top = `${rect.bottom + window.scrollY + 5}px`;
            colorPicker.style.left = `${rect.left + window.scrollX}px`;
            
            // Close picker when clicking outside
            document.addEventListener('click', function closePicker(e) {
                if (!colorPicker.contains(e.target) && e.target !== selectedColor) {
                    colorPicker.remove();
                    document.removeEventListener('click', closePicker);
                }
            });
        });
        
        // Update color preview when value input changes
        pixelValueInput.addEventListener('input', () => {
            const value = Math.min(255, Math.max(0, parseInt(pixelValueInput.value) || 0));
            pixelValueInput.value = value;
            this.selectedValue = value;
            this.updateColorPreview(value);
            
            if (this.selectedPixel) {
                this.selectedPixel.dataset.value = value;
                this.selectedPixel.style.backgroundColor = selectedColor.style.backgroundColor;
                if (this.showValues) {
                    this.selectedPixel.textContent = value;
                    this.selectedPixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        });
        
        // Pattern generation
        const patternDropdown = document.querySelector('.dropdown-menu[aria-labelledby="patternDropdown"]');
        if (patternDropdown) {
            patternDropdown.addEventListener('click', (e) => {
                const pattern = e.target.dataset.pattern;
                if (pattern) {
                    switch (pattern) {
                        case 'random':
                            this.randomizeMatrix();
                            break;
                        case 'gradient':
                            this.createGradientPattern();
                            break;
                        case 'checkerboard':
                            this.createCheckerboardPattern();
                            break;
                        case 'diagonal':
                            this.createDiagonalGradientPattern();
                            break;
                        case 'circle':
                            this.createCirclePattern();
                            break;
                        case 'heart':
                            this.createHeartPattern();
                            break;
                        case 'arrow':
                            this.createArrowPattern();
                            break;
                        case 'plus':
                            this.createPlusPattern();
                            break;
                        case 'frame':
                            this.createFramePattern();
                            break;
                    }
                    // Update selected color to match the first pixel after pattern generation
                    const firstPixel = this.matrix.querySelector('[data-x="0"][data-y="0"]');
                    if (firstPixel) {
                        this.selectedValue = parseInt(firstPixel.dataset.value);
                        this.updateColorPreview(this.selectedValue);
                        pixelValueInput.value = this.selectedValue;
                    }
                }
            });
        }
        
        // Copy matrix button
        const copyButton = document.getElementById('copy-matrix');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                const matrixText = this.getMatrixString();
                navigator.clipboard.writeText(matrixText).then(() => {
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = '<i class="bi bi-check"></i> Kopirano!';
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                    }, 2000);
                });
            });
        }
        
        // Toggle values button
        const toggleButton = document.getElementById('toggle-values');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.showValues = !this.showValues;
                toggleButton.innerHTML = this.showValues ? 
                    '<i class="bi bi-eye-slash"></i> Sakrij vrijednosti' : 
                    '<i class="bi bi-eye"></i> Prikaži vrijednosti';
                this.updateMatrixValues();
            });
        }
        
        // Reset matrix button
        const resetButton = document.getElementById('reset-matrix');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetMatrix();
            });
        }
        
        // Random matrix button
        const randomButton = document.getElementById('random-matrix');
        if (randomButton) {
            randomButton.addEventListener('click', () => {
                this.randomizeMatrix();
            });
        }
        
        // Apply to all button
        const applyAllButton = document.getElementById('apply-all');
        if (applyAllButton) {
            applyAllButton.addEventListener('click', () => {
                const value = parseInt(pixelValueInput.value);
                if (!isNaN(value)) {
                    for (let y = 0; y < this.size; y++) {
                        for (let x = 0; x < this.size; x++) {
                            const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                            if (pixel) {
                                pixel.dataset.value = value;
                                const hex = value.toString(16).padStart(2, '0');
                                const color = `#${hex}${hex}${hex}`;
                                pixel.style.backgroundColor = color;
                                if (this.showValues) {
                                    pixel.textContent = value;
                                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Mathematical operations
        const brightnessButton = document.getElementById('brightness-matrix');
        const contrastButton = document.getElementById('contrast-matrix');
        
        if (brightnessButton) {
            brightnessButton.addEventListener('click', () => {
                const constant = parseInt(document.getElementById('matrix-constant-brightness').value) || 0;
                for (let y = 0; y < this.size; y++) {
                    for (let x = 0; x < this.size; x++) {
                        const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                        if (pixel) {
                            const value = parseInt(pixel.dataset.value);
                            const newValue = Math.min(255, Math.max(0, value + constant));
                            pixel.dataset.value = newValue;
                            const hex = newValue.toString(16).padStart(2, '0');
                            const color = `#${hex}${hex}${hex}`;
                            pixel.style.backgroundColor = color;
                            if (this.showValues) {
                                pixel.textContent = newValue;
                                pixel.style.color = newValue < 128 ? '#ffffff' : '#000000';
                            }
                        }
                    }
                }
            });
        }
        
        if (contrastButton) {
            contrastButton.addEventListener('click', () => {
                const factor = parseFloat(document.getElementById('matrix-constant-contrast').value) || 1;
                for (let y = 0; y < this.size; y++) {
                    for (let x = 0; x < this.size; x++) {
                        const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                        if (pixel) {
                            const value = parseInt(pixel.dataset.value);
                            const newValue = Math.min(255, Math.max(0, Math.round(factor * (value - 128) + 128)));
                            pixel.dataset.value = newValue;
                            const hex = newValue.toString(16).padStart(2, '0');
                            const color = `#${hex}${hex}${hex}`;
                            pixel.style.backgroundColor = color;
                            if (this.showValues) {
                                pixel.textContent = newValue;
                                pixel.style.color = newValue < 128 ? '#ffffff' : '#000000';
                            }
                        }
                    }
                }
            });
        }
        
        // Inversion button
        const inversionButton = document.getElementById('inversion-matrix');
        if (inversionButton) {
            inversionButton.addEventListener('click', () => {
                this.applyInversion();
            });
        }
        
        // Initial color preview
        this.updateColorPreview(this.selectedValue);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    createMatrix() {
        // Clear existing matrix
        this.matrix.innerHTML = '';
        
        // Set up grid
        this.matrix.style.display = 'grid';
        this.matrix.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.matrix.style.gap = '2px';
        this.matrix.style.backgroundColor = '#ddd';
        this.matrix.style.padding = '2px';
        this.pixels = [];
        
        // Create pixels
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = document.createElement('div');
                pixel.className = 'pixel';
                pixel.dataset.x = x;
                pixel.dataset.y = y;
                pixel.dataset.value = '255';
                pixel.style.backgroundColor = 'rgb(255, 255, 255)';
                pixel.style.cursor = 'pointer';
                pixel.style.position = 'relative';
                pixel.style.transition = 'all 0.2s ease';
                pixel.style.display = 'flex';
                pixel.style.alignItems = 'center';
                pixel.style.justifyContent = 'center';
                pixel.style.fontSize = '0.8em';
                pixel.style.color = '#000000';
                
                // Add hover event
                pixel.addEventListener('mouseover', () => {
                    if (pixel !== this.selectedPixel) {
                        pixel.style.transform = 'scale(1.1)';
                        pixel.style.zIndex = '1';
                    }
                });
                
                pixel.addEventListener('mouseout', () => {
                    if (pixel !== this.selectedPixel) {
                        pixel.style.transform = 'scale(1)';
                        pixel.style.zIndex = '0';
                    }
                });
                
                // Add click event
                pixel.addEventListener('click', () => {
                    if (this.selectedPixel) {
                        this.selectedPixel.style.border = 'none';
                        this.selectedPixel.style.transform = 'scale(1)';
                        this.selectedPixel.style.zIndex = '0';
                    }

                    this.selectedPixel = pixel;
                    pixel.style.border = '2px solid #007bff';
                    pixel.style.transform = 'scale(1.1)';
                    pixel.style.zIndex = '1';
                    
                    // Apply selected color to the clicked pixel
                    const selectedColor = document.getElementById('selected-color');
                    const value = this.selectedValue;
                    pixel.dataset.value = value;
                    pixel.style.backgroundColor = selectedColor.style.backgroundColor;
                    if (this.showValues) {
                        pixel.textContent = value;
                        pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                    }
                });
                
                this.matrix.appendChild(pixel);
                this.pixels.push(pixel);
            }
        }
        
        // Show values by default
        this.updateMatrixValues();
    }
    
    getMatrixString() {
        let matrixStr = '';
        for (let y = 0; y < this.size; y++) {
            const row = [];
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                row.push(pixel.dataset.value.padStart(3));
            }
            matrixStr += row.join('\t') + '\n';
        }
        return matrixStr;
    }
    
    resetMatrix() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                pixel.dataset.value = '255';
                pixel.style.backgroundColor = 'rgb(255, 255, 255)';
                if (this.showValues) {
                    pixel.textContent = '255';
                    pixel.style.color = '#000000';
                }
            }
        }
    }
    
    randomizeMatrix() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const value = Math.floor(Math.random() * 256);
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                pixel.dataset.value = value;
                pixel.style.backgroundColor = `rgb(${value}, ${value}, ${value})`;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
    }
    
    applyOperation(operation) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                const value = parseInt(pixel.dataset.value);
                const newValue = operation(value);
                pixel.dataset.value = newValue;
                const hex = newValue.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = newValue;
                    pixel.style.color = newValue < 128 ? '#ffffff' : '#000000';
                }
            }
        }
        // Update selected color after operation
        if (this.selectedPixel) {
            this.selectedValue = parseInt(this.selectedPixel.dataset.value);
            this.updateColorPreview(this.selectedValue);
            document.getElementById('pixel-value-input').value = this.selectedValue;
        }
    }
    
    updateMatrixValues() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (this.showValues) {
                    pixel.textContent = pixel.dataset.value;
                    pixel.style.color = parseInt(pixel.dataset.value) < 128 ? '#ffffff' : '#000000';
                } else {
                    pixel.textContent = '';
                }
            }
        }
    }
    
    createGradientPattern() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const value = Math.round((x / (this.size - 1)) * 255);
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                pixel.dataset.value = value;
                const hex = value.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
        // Update selected color after pattern
        this.selectedValue = 0;
        this.updateColorPreview(this.selectedValue);
        document.getElementById('pixel-value-input').value = this.selectedValue;
    }
    
    createCheckerboardPattern() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const value = ((x + y) % 2 === 0) ? 255 : 0;
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                pixel.dataset.value = value;
                const hex = value.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
        // Update selected color after pattern
        this.selectedValue = 255;
        this.updateColorPreview(this.selectedValue);
        document.getElementById('pixel-value-input').value = this.selectedValue;
    }
    
    createDiagonalGradientPattern() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const value = Math.round(((x + y) / ((this.size - 1) * 2)) * 255);
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                pixel.dataset.value = value;
                const hex = value.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
        // Update selected color after pattern
        this.selectedValue = 0;
        this.updateColorPreview(this.selectedValue);
        document.getElementById('pixel-value-input').value = this.selectedValue;
    }
    
    createCirclePattern() {
        const center = (this.size - 1) / 2;
        const maxDistance = Math.sqrt(2 * center * center);
        
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const distance = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
                const value = Math.round((1 - distance / maxDistance) * 255);
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                pixel.dataset.value = value;
                const hex = value.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
        // Update selected color after pattern
        this.selectedValue = 255;
        this.updateColorPreview(this.selectedValue);
        document.getElementById('pixel-value-input').value = this.selectedValue;
    }

    createHeartPattern() {
        // Reset matrix to white
        this.resetMatrix();
        
        // Define heart pattern for 8x8 matrix with gradient values
        const heartPattern = [
            [255, 255, 255, 255, 255, 255, 255, 255],
            [255, 128, 64, 255, 255, 64, 128, 255],
            [128, 32, 0, 32, 32, 0, 32, 128],
            [64, 0, 0, 0, 0, 0, 0, 64],
            [32, 0, 0, 0, 0, 0, 0, 32],
            [255, 64, 0, 0, 0, 0, 64, 255],
            [255, 255, 64, 0, 0, 64, 255, 255],
            [255, 255, 255, 32, 32, 255, 255, 255]
        ];
        
        // Apply pattern
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                const value = heartPattern[y][x];
                pixel.dataset.value = value;
                const hex = value.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
        // Update selected color after pattern
        this.selectedValue = 255;
        this.updateColorPreview(this.selectedValue);
        document.getElementById('pixel-value-input').value = this.selectedValue;
    }

    createArrowPattern() {
        // Reset matrix to white
        this.resetMatrix();
        
        // Define arrow pattern for 8x8 matrix
        const arrowPattern = [
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0]
        ];
        
        // Apply pattern
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                const value = arrowPattern[y][x] * 255;
                pixel.dataset.value = value;
                const hex = value.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
    }

    createPlusPattern() {
        // Reset matrix to white
        this.resetMatrix();
        
        // Define plus pattern for 8x8 matrix
        const plusPattern = [
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0]
        ];
        
        // Apply pattern
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                const value = plusPattern[y][x] * 255;
                pixel.dataset.value = value;
                const hex = value.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
    }

    createFramePattern() {
        // Reset matrix to white
        this.resetMatrix();
        
        // Define frame pattern for 8x8 matrix
        const framePattern = [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ];
        
        // Apply pattern
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                const value = framePattern[y][x] * 255;
                pixel.dataset.value = value;
                const hex = value.toString(16).padStart(2, '0');
                const color = `#${hex}${hex}${hex}`;
                pixel.style.backgroundColor = color;
                if (this.showValues) {
                    pixel.textContent = value;
                    pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                }
            }
        }
    }

    applyToAll(value) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (pixel) {
                    pixel.dataset.value = value;
                    const hex = value.toString(16).padStart(2, '0');
                    const color = `#${hex}${hex}${hex}`;
                    pixel.style.backgroundColor = color;
                    if (this.showValues) {
                        pixel.textContent = value;
                        pixel.style.color = value < 128 ? '#ffffff' : '#000000';
                    }
                }
            }
        }
        // Update selected color
        this.selectedValue = value;
        this.updateColorPreview(value);
        document.getElementById('pixel-value-input').value = value;
    }

    applyBrightness(constant) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (pixel) {
                    const value = parseInt(pixel.dataset.value);
                    const newValue = Math.min(255, Math.max(0, value + constant));
                    pixel.dataset.value = newValue;
                    const hex = newValue.toString(16).padStart(2, '0');
                    const color = `#${hex}${hex}${hex}`;
                    pixel.style.backgroundColor = color;
                    if (this.showValues) {
                        pixel.textContent = newValue;
                        pixel.style.color = newValue < 128 ? '#ffffff' : '#000000';
                    }
                }
            }
        }
        // Update selected color
        if (this.selectedPixel) {
            this.selectedValue = parseInt(this.selectedPixel.dataset.value);
            this.updateColorPreview(this.selectedValue);
            document.getElementById('pixel-value-input').value = this.selectedValue;
        }
    }

    applyContrast(factor) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (pixel) {
                    const value = parseInt(pixel.dataset.value);
                    const newValue = Math.min(255, Math.max(0, Math.round(factor * (value - 128) + 128)));
                    pixel.dataset.value = newValue;
                    const hex = newValue.toString(16).padStart(2, '0');
                    const color = `#${hex}${hex}${hex}`;
                    pixel.style.backgroundColor = color;
                    if (this.showValues) {
                        pixel.textContent = newValue;
                        pixel.style.color = newValue < 128 ? '#ffffff' : '#000000';
                    }
                }
            }
        }
        // Update selected color
        if (this.selectedPixel) {
            this.selectedValue = parseInt(this.selectedPixel.dataset.value);
            this.updateColorPreview(this.selectedValue);
            document.getElementById('pixel-value-input').value = this.selectedValue;
        }
    }

    applyInversion() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const pixel = this.matrix.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (pixel) {
                    const value = parseInt(pixel.dataset.value);
                    const newValue = 255 - value;
                    pixel.dataset.value = newValue;
                    const hex = newValue.toString(16).padStart(2, '0');
                    const color = `#${hex}${hex}${hex}`;
                    pixel.style.backgroundColor = color;
                    if (this.showValues) {
                        pixel.textContent = newValue;
                        pixel.style.color = newValue < 128 ? '#ffffff' : '#000000';
                    }
                }
            }
        }
        // Update selected color
        if (this.selectedPixel) {
            this.selectedValue = parseInt(this.selectedPixel.dataset.value);
            this.updateColorPreview(this.selectedValue);
            document.getElementById('pixel-value-input').value = this.selectedValue;
        }
    }
}

// Grayscale image manipulation
class GrayscaleImage {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.brightness = 128;
        this.contrast = 0;
        this.isInverted = false;
        
        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        // Add file input
        this.addFileInput();
    }
    
    addFileInput() {
        const container = this.canvas.parentElement;
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.className = 'form-control mb-3';
        fileInput.id = 'image-upload';
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = 'Učitaj sliku:';
        
        container.insertBefore(label, this.canvas);
        container.insertBefore(fileInput, this.canvas);
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Resize image to fit canvas
                        const scale = Math.min(
                            this.canvas.width / img.width,
                            this.canvas.height / img.height
                        );
                        const width = img.width * scale;
                        const height = img.height * scale;
                        
                        // Clear canvas and draw image
                        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                        this.ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert to grayscale
                        this.convertToGrayscale();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    convertToGrayscale() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.updateImage();
    }
    
    updateImage() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            let value = data[i]; // R, G, and B are the same in grayscale
            
            // Apply brightness
            value += this.brightness - 128;
            
            // Apply contrast
            const factor = (259 * (this.contrast + 255)) / (255 * (259 - this.contrast));
            value = factor * (value - 128) + 128;
            
            // Apply inversion if needed
            if (this.isInverted) {
                value = 255 - value;
            }
            
            // Clamp values between 0 and 255
            value = Math.max(0, Math.min(255, value));
            
            // Update all color channels (R, G, B)
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    setBrightness(value) {
        this.brightness = parseInt(value);
        this.updateImage();
    }
    
    setContrast(value) {
        this.contrast = parseInt(value);
        this.updateImage();
    }
    
    toggleInversion() {
        this.isInverted = !this.isInverted;
        this.updateImage();
    }
}

// RGB Simulator
class RGBSimulator {
    constructor() {
        this.canvases = {
            red: document.getElementById('red-channel'),
            green: document.getElementById('green-channel'),
            blue: document.getElementById('blue-channel'),
            combined: document.getElementById('rgb-combined')
        };
        
        this.ctx = {
            red: this.canvases.red.getContext('2d'),
            green: this.canvases.green.getContext('2d'),
            blue: this.canvases.blue.getContext('2d'),
            combined: this.canvases.combined.getContext('2d')
        };
        
        this.intensities = {
            red: 255,
            green: 255,
            blue: 255
        };
        
        this.channels = {
            red: true,
            green: true,
            blue: true
        };
        
        // Set canvas sizes
        const size = 200;
        Object.values(this.canvases).forEach(canvas => {
            canvas.width = size;
            canvas.height = size;
        });
        
        // Initialize with sample image
        this.drawSampleImage();
    }
    
    drawSampleImage() {
        // Create a colorful pattern
        const gradient = this.ctx.combined.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, 'rgb(255, 0, 0)');
        gradient.addColorStop(0.5, 'rgb(0, 255, 0)');
        gradient.addColorStop(1, 'rgb(0, 0, 255)');
        
        // Draw on combined canvas
        this.ctx.combined.fillStyle = gradient;
        this.ctx.combined.fillRect(0, 0, 200, 200);
        
        // Split into channels
        this.updateChannels();
    }
    
    updateChannels() {
        const imageData = this.ctx.combined.getImageData(0, 0, 200, 200);
        const data = imageData.data;
        
        // Create separate image data for each channel
        const redData = new ImageData(200, 200);
        const greenData = new ImageData(200, 200);
        const blueData = new ImageData(200, 200);
        
        for (let i = 0; i < data.length; i += 4) {
            // Red channel
            redData.data[i] = data[i] * (this.intensities.red / 255);
            redData.data[i + 1] = 0;
            redData.data[i + 2] = 0;
            redData.data[i + 3] = 255;
            
            // Green channel
            greenData.data[i] = 0;
            greenData.data[i + 1] = data[i + 1] * (this.intensities.green / 255);
            greenData.data[i + 2] = 0;
            greenData.data[i + 3] = 255;
            
            // Blue channel
            blueData.data[i] = 0;
            blueData.data[i + 1] = 0;
            blueData.data[i + 2] = data[i + 2] * (this.intensities.blue / 255);
            blueData.data[i + 3] = 255;
        }
        
        // Draw channels if enabled
        if (this.channels.red) {
            this.ctx.red.putImageData(redData, 0, 0);
        } else {
            this.ctx.red.clearRect(0, 0, 200, 200);
        }
        
        if (this.channels.green) {
            this.ctx.green.putImageData(greenData, 0, 0);
        } else {
            this.ctx.green.clearRect(0, 0, 200, 200);
        }
        
        if (this.channels.blue) {
            this.ctx.blue.putImageData(blueData, 0, 0);
        } else {
            this.ctx.blue.clearRect(0, 0, 200, 200);
        }
    }
    
    setIntensity(channel, value) {
        this.intensities[channel] = parseInt(value);
        this.updateChannels();
    }
    
    toggleChannel(channel) {
        this.channels[channel] = !this.channels[channel];
        this.updateChannels();
    }
    
    reset() {
        this.intensities = {
            red: 255,
            green: 255,
            blue: 255
        };
        this.channels = {
            red: true,
            green: true,
            blue: true
        };
        
        // Reset sliders
        document.getElementById('red-intensity').value = 255;
        document.getElementById('green-intensity').value = 255;
        document.getElementById('blue-intensity').value = 255;
        
        // Reset toggles
        document.getElementById('red-toggle').checked = true;
        document.getElementById('green-toggle').checked = true;
        document.getElementById('blue-toggle').checked = true;
        
        this.updateChannels();
    }
}

// Inicijalizacija glavnih modula kad je DOM spreman
// (event listenere za kontrole matrice NE dodavati ovdje, to je već u klasi)
document.addEventListener('DOMContentLoaded', () => {
    new PixelMatrix();
    new GrayscaleImage('grayscale-canvas');
    new RGBSimulator();
}); 