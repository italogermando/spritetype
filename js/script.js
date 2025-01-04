let customFont = null;

async function requestFontAccess() {
    try {
        // Verifica se a API está disponível
        if (!('queryLocalFonts' in window)) {
            throw new Error('Seu navegador não suporta acesso às fontes locais.');
        }

        // Solicita permissão e acesso às fontes
        const fonts = await window.queryLocalFonts();
        
        // Remove duplicatas e organiza por família
        const uniqueFonts = Array.from(new Set(fonts.map(font => font.family)))
            .sort((a, b) => a.localeCompare(b));

        return uniqueFonts;
    } catch (error) {
        console.error('Erro ao acessar fontes:', error);
        alert('Não foi possível acessar as fontes do sistema. Certifique-se que está usando Chrome/Edge versão recente e que permitiu o acesso às fontes.');
        return [];
    }
}

// Função de preview que você já tinha
function generatePreview() {
    const previewCanvas = document.getElementById('previewCanvas');
    const ctx = previewCanvas.getContext('2d');
    
    if (!customFont) return;

    const fontSize = parseInt(document.getElementById('fontSize').value);
    const padding = {
        top: parseInt(document.getElementById('paddingTop').value),
        right: parseInt(document.getElementById('paddingRight').value),
        bottom: parseInt(document.getElementById('paddingBottom').value),
        left: parseInt(document.getElementById('paddingLeft').value)
    };
    const characters = document.getElementById('characters').value;
    const textColor = document.getElementById('textColor').value;
    const transparentBg = document.getElementById('transparentBg').checked;
    const showGrid = document.getElementById('showGrid').checked;

    // Configurar canvas
    ctx.font = `${fontSize}px CustomFont`;
    const metrics = ctx.measureText('W');
    const charHeight = fontSize;
    const charWidth = Math.ceil(metrics.width);
    
    // Calcular dimensões do grid
    const uniqueChars = [...new Set(characters)];
    const charsPerRow = Math.floor(Math.sqrt(uniqueChars.length));
    const rows = Math.ceil(uniqueChars.length / charsPerRow);
    
    // Definir tamanho do canvas
    const baseWidth = (charWidth + padding.left + padding.right) * charsPerRow;
    const baseHeight = (charHeight + padding.top + padding.bottom) * rows;
    
    previewCanvas.width = baseWidth;
    previewCanvas.height = baseHeight;
    
    // Limpar canvas
    ctx.clearRect(0, 0, baseWidth, baseHeight);
    
    if (!transparentBg) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
    }
    
    // Desenhar grid se ativado
    if (showGrid) {
        ctx.beginPath();
        const gridColorValue = document.getElementById('gridColor').value;
        const opacity = parseFloat(document.getElementById('gridOpacity').value) / 100;
        
        const r = parseInt(gridColorValue.slice(1, 3), 16);
        const g = parseInt(gridColorValue.slice(3, 5), 16);
        const b = parseInt(gridColorValue.slice(5, 7), 16);
        
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.lineWidth = 1;

        // Linhas verticais
        for (let i = 0; i <= charsPerRow; i++) {
            const x = i * (charWidth + padding.left + padding.right);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, baseHeight);
        }

        // Linhas horizontais
        for (let i = 0; i <= rows; i++) {
            const y = i * (charHeight + padding.top + padding.bottom);
            ctx.moveTo(0, y);
            ctx.lineTo(baseWidth, y);
        }

        ctx.stroke();
    }
    
    // Desenhar caracteres
    ctx.font = `${fontSize}px CustomFont`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    
    uniqueChars.forEach((char, i) => {
        const row = Math.floor(i / charsPerRow);
        const col = i % charsPerRow;
        const x = col * (charWidth + padding.left + padding.right) + padding.left;
        const y = row * (charHeight + padding.top + padding.bottom) + padding.top;
        
        ctx.fillText(char, x, y);
    });
}

// Seu código de fontes do sistema
document.addEventListener('DOMContentLoaded', async () => {
    const systemFontsSelect = document.getElementById('systemFonts');
    const loadFontsButton = document.createElement('button');
    loadFontsButton.className = 'btn btn-primary';
    loadFontsButton.textContent = 'Carregar Fontes do Sistema';
    
    systemFontsSelect.parentNode.insertBefore(loadFontsButton, systemFontsSelect);
    systemFontsSelect.style.display = 'none';

    let systemFontsData = [];

    loadFontsButton.addEventListener('click', async () => {
        try {
            const fonts = await window.queryLocalFonts();
            systemFontsData = fonts;

            if (fonts.length > 0) {
                systemFontsSelect.innerHTML = '<option value="">Escolha uma fonte...</option>';
                
                const uniqueFamilies = [...new Set(fonts.map(f => f.family))].sort();
                
                uniqueFamilies.forEach(family => {
                    const option = document.createElement('option');
                    option.value = family;
                    option.textContent = family;
                    option.style.fontFamily = family;
                    systemFontsSelect.appendChild(option);
                });

                systemFontsSelect.style.display = 'block';
                loadFontsButton.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao listar fontes:', error);
            alert('Erro ao carregar lista de fontes do sistema.');
        }
    });

    systemFontsSelect.addEventListener('change', async function() {
        const selectedFont = this.value;
        if (!selectedFont) return;

        try {
            console.log('Fonte selecionada:', selectedFont);
            
            const fontData = systemFontsData.find(f => f.family === selectedFont);
            
            if (!fontData) {
                throw new Error('Dados da fonte não encontrados');
            }

            console.log('Dados da fonte encontrados:', fontData);

            const blob = await fontData.blob();
            const fontUrl = URL.createObjectURL(blob);
            console.log('URL da fonte criada:', fontUrl);

            if (customFont) {
                document.fonts.delete(customFont);
                if (customFont.url) {
                    URL.revokeObjectURL(customFont.url);
                }
            }

            const fontFace = new FontFace('CustomFont', `url(${fontUrl})`);
            console.log('FontFace criada, aguardando carregamento...');
            
            customFont = await fontFace.load();
            customFont.url = fontUrl;
            console.log('Fonte carregada com sucesso');
            
            document.fonts.add(customFont);
            console.log('Fonte adicionada ao documento');

            generatePreview();
            console.log('Preview gerado');

        } catch (error) {
            console.error('Erro detalhado ao carregar fonte:', error);
            alert(`Erro ao carregar a fonte: ${error.message}`);
        }
    });
});

// Função atualizada para aceitar sufixo
function createInputSpinner(inputElement, suffix = null) {
    // Pega o valor atual e os atributos do input original
    const value = inputElement.value;
    const min = inputElement.min;
    const max = inputElement.max;
    const id = inputElement.id;
    const classes = inputElement.className;

    // Cria o wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'input-spinner';

    // Clona o input e mantém os atributos importantes
    const newInput = document.createElement('input');
    newInput.type = 'number';
    newInput.value = value;
    newInput.min = min;
    newInput.max = max;
    newInput.id = id;
    newInput.className = classes;

    // Cria os botões de spinner
    const spinnerButtons = document.createElement('div');
    spinnerButtons.className = 'spinner-buttons';
    spinnerButtons.innerHTML = `
        <button type="button" class="spinner-button">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 15l-6-6-6 6"/>
            </svg>
        </button>
        <button type="button" class="spinner-button">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
            </svg>
        </button>
    `;

    // Adiciona o sufixo se foi especificado
    if (suffix) {
        const suffixSpan = document.createElement('span');
        suffixSpan.className = 'suffix';
        suffixSpan.textContent = suffix;
        wrapper.appendChild(suffixSpan);
    }

    // Monta a estrutura
    wrapper.appendChild(newInput);
    wrapper.appendChild(spinnerButtons);
    inputElement.replaceWith(wrapper);

    // Adiciona os event listeners nos botões
    const buttons = spinnerButtons.querySelectorAll('.spinner-button');
    buttons.forEach((button, index) => {
        let intervalId;
        const isUp = index === 0;

        button.addEventListener('mousedown', () => {
            if(isUp) {
                newInput.stepUp();
            } else {
                newInput.stepDown();
            }
            
            newInput.dispatchEvent(new Event('change'));
            newInput.dispatchEvent(new Event('input'));

            intervalId = setInterval(() => {
                if(isUp) {
                    newInput.stepUp();
                } else {
                    newInput.stepDown();
                }
                newInput.dispatchEvent(new Event('change'));
                newInput.dispatchEvent(new Event('input'));
            }, 100);
        });

        ['mouseup', 'mouseleave'].forEach(event => {
            button.addEventListener(event, () => {
                if(intervalId) clearInterval(intervalId);
            });
        });
    });

    return wrapper;
}

// Aplicando nos inputs
document.addEventListener('DOMContentLoaded', () => {
    // Para o tamanho da fonte (com sufixo px)
    const fontSizeInput = document.getElementById('fontSize');
    createInputSpinner(fontSizeInput, 'px');

    // Para os paddings (com sufixo px)
    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(id => {
        const paddingInput = document.getElementById(id);
        createInputSpinner(paddingInput, 'px');
    });
});
        
        // Menu Toggle para Mobile
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    
        // Show/Hide Grid Controls
        const showGrid = document.getElementById('showGrid');
        const gridControls = document.getElementById('gridControls');
        
        showGrid.addEventListener('change', (e) => {
            gridControls.style.display = e.target.checked ? 'block' : 'none';
        });
    
        // Atualizar valor hex da cor
        const textColor = document.getElementById('textColor');
        const textColorHex = document.getElementById('textColorHex');
        
        textColor.addEventListener('input', (e) => {
            textColorHex.textContent = e.target.value.toUpperCase();
        });
    
        // Mantém o script original
        document.addEventListener('DOMContentLoaded', () => {
            const previewCanvas = document.getElementById('previewCanvas');
            const ctx = previewCanvas.getContext('2d');
            const preview = document.querySelector('.preview');
            const downloadBtn = document.getElementById('download');
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('fontFile');
            const uploadDefault = document.getElementById('uploadDefault');
            const uploadSuccess = document.getElementById('uploadSuccess');
            const fileName = uploadSuccess.querySelector('.file-name');
            let customFont = null;
            let zoomLevel = 1;
    
            // Controles
            const controls = {
                fontFile: document.getElementById('fontFile'),
                fontSize: document.getElementById('fontSize'),
                paddingTop: document.getElementById('paddingTop'),
                paddingRight: document.getElementById('paddingRight'),
                paddingBottom: document.getElementById('paddingBottom'),
                paddingLeft: document.getElementById('paddingLeft'),
                lockProportion: document.getElementById('lockProportion'),
                characters: document.getElementById('characters'),
                textColor: document.getElementById('textColor'),
                transparentBg: document.getElementById('transparentBg'),
                zoomIn: document.getElementById('zoomIn'),
                zoomOut: document.getElementById('zoomOut'),
                zoomLevel: document.getElementById('zoomLevel'),
                showGrid: document.getElementById('showGrid'),
                gridColor: document.getElementById('gridColor'),
                gridOpacity: document.getElementById('gridOpacity'),
                gridOpacityValue: document.getElementById('gridOpacityValue'),
            };
    
            controls.gridColor.addEventListener('input', generatePreview);
            controls.gridOpacity.addEventListener('input', (e) => {
                controls.gridOpacityValue.textContent = `${e.target.value}%`;
                generatePreview();
            });

             // Atualiza a interface quando um arquivo é selecionado
    function handleFileSelect(file) {
        if (file) {
            fileName.textContent = file.name;
            uploadDefault.style.display = 'none';
            uploadSuccess.style.display = 'flex';
        } else {
            uploadDefault.style.display = 'flex';
            uploadSuccess.style.display = 'none';
        }
    }

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        fileInput.files = files;
        handleFileSelect(files[0]);
        // Dispara o evento change para ativar o handler existente
        fileInput.dispatchEvent(new Event('change'));
    }

    
            // Zoom controls
            controls.zoomIn.addEventListener('click', () => {
                zoomLevel = Math.min(zoomLevel + 0.25, 3);
                updateZoomDisplay();
                generatePreview();
            });
    
            controls.zoomOut.addEventListener('click', () => {
                zoomLevel = Math.max(zoomLevel - 0.25, 0.25);
                updateZoomDisplay();
                generatePreview();
            });
    
            function updateZoomDisplay() {
                controls.zoomLevel.textContent = `${Math.round(zoomLevel * 100)}%`;
            }
    
            // Função para sincronizar padding
            function syncPadding(changedInput) {
                if (controls.lockProportion.checked) {
                    const value = changedInput.value;
                    [controls.paddingTop, controls.paddingRight, controls.paddingBottom, controls.paddingLeft]
                        .forEach(input => {
                            input.value = value;
                        });
                }
                generatePreview();
            }
    
            // Adicionar listeners para atualização em tempo real
            [controls.fontSize, controls.paddingTop, controls.paddingRight, 
            controls.paddingBottom, controls.paddingLeft, controls.textColor, 
            controls.transparentBg, controls.showGrid]
                .forEach(control => {
                    control.addEventListener('input', generatePreview);
                    control.addEventListener('change', generatePreview);
                });
    
            controls.characters.addEventListener('input', generatePreview);
    
            // Padding listeners
            [controls.paddingTop, controls.paddingRight, controls.paddingBottom, controls.paddingLeft]
                .forEach(input => {
                    input.addEventListener('input', () => syncPadding(input));
                });
    
            // Carregar fonte
            controls.fontFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const fontName = 'CustomFont';
            const fontUrl = URL.createObjectURL(file);
            
            // Remove a fonte anterior se existir
            if (customFont) {
                document.fonts.delete(customFont);
                // Revoga a URL anterior para liberar memória
                URL.revokeObjectURL(customFont.url);
            }
            
            const fontFace = new FontFace(fontName, `url(${fontUrl})`);
            customFont = await fontFace.load();
            document.fonts.add(customFont);
            
            // Limpa o canvas antes de gerar o novo preview
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            generatePreview();
        } catch (error) {
            alert('Erro ao carregar a fonte. Certifique-se que é um arquivo .ttf ou .otf válido.');
            console.error(error);
        }
    }
});
    
            // Download handler
            downloadBtn.addEventListener('click', () => {
                if (!customFont) {
                    alert('Por favor, faça upload de uma fonte primeiro.');
                    return;
                }
    
                const link = document.createElement('a');
                link.download = 'spritefont.png';
                
                // Create a new canvas for the download (without zoom)
                const downloadCanvas = document.createElement('canvas');
                const downloadCtx = downloadCanvas.getContext('2d');
                
                // Get current settings
                const fontSize = parseInt(controls.fontSize.value);
                const padding = {
                    top: parseInt(controls.paddingTop.value),
                    right: parseInt(controls.paddingRight.value),
                    bottom: parseInt(controls.paddingBottom.value),
                    left: parseInt(controls.paddingLeft.value)
                };
                
                // Configure canvas
                downloadCtx.font = `${fontSize}px CustomFont`;
                const metrics = downloadCtx.measureText('W');
                const charHeight = fontSize;
                const charWidth = Math.ceil(metrics.width);
                
                // Calculate dimensions
                const characters = controls.characters.value;
                const uniqueChars = [...new Set(characters)];
                const charsPerRow = Math.floor(Math.sqrt(uniqueChars.length));
                const rows = Math.ceil(uniqueChars.length / charsPerRow);
                
                // Set canvas size (without zoom)
                downloadCanvas.width = (charWidth + padding.left + padding.right) * charsPerRow;
                downloadCanvas.height = (charHeight + padding.top + padding.bottom) * rows;
                
                // Clear canvas
                downloadCtx.clearRect(0, 0, downloadCanvas.width, downloadCanvas.height);
                
                if (!controls.transparentBg.checked) {
                    downloadCtx.fillStyle = '#ffffff';
                    downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
                }
                
                // Draw characters
                downloadCtx.font = `${fontSize}px CustomFont`;
                downloadCtx.fillStyle = controls.textColor.value;
                downloadCtx.textBaseline = 'top';
                
                uniqueChars.forEach((char, i) => {
                    const row = Math.floor(i / charsPerRow);
                    const col = i % charsPerRow;
                    const x = col * (charWidth + padding.left + padding.right) + padding.left;
                    const y = row * (charHeight + padding.top + padding.bottom) + padding.top;
                    
                    downloadCtx.fillText(char, x, y);
                });
                
                link.href = downloadCanvas.toDataURL('image/png');
                link.click();
            });
        });