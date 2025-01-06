let customFont = null;

// Funções de exportação
function getCharacterWidthData(characters, ctx, fontSize, customFontName = 'CustomFont') {
    // Pegar os valores de padding
    const padding = {
        left: parseInt(document.getElementById('paddingLeft').value),
        right: parseInt(document.getElementById('paddingRight').value)
    };

    ctx.font = `${fontSize}px ${customFontName}`;
    
    const widthMap = new Map();
    
    [...new Set(characters)].forEach(char => {
        // Adicionar padding à largura do caractere
        const baseWidth = Math.ceil(ctx.measureText(char).width);
        const totalWidth = baseWidth + padding.left + padding.right;
        
        if (!widthMap.has(totalWidth)) {
            widthMap.set(totalWidth, []);
        }
        widthMap.get(totalWidth).push(char);
    });
    
    return Array.from(widthMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([width, chars]) => [width, chars.join('')]);
}

function generateConstructData(widthData, type, fontSize, characters) {
    // Pegar os valores de padding
    const padding = {
        top: parseInt(document.getElementById('paddingTop').value),
        right: parseInt(document.getElementById('paddingRight').value),
        bottom: parseInt(document.getElementById('paddingBottom').value),
        left: parseInt(document.getElementById('paddingLeft').value)
    };

    // Calcular altura e largura do caractere base incluindo padding
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    ctx.font = `${fontSize}px CustomFont`;
    const metrics = ctx.measureText('W');
    const baseCharWidth = Math.ceil(metrics.width);
    const baseCharHeight = fontSize;

    // Adicionar padding às dimensões
    const charWidth = baseCharWidth + padding.left + padding.right;
    const charHeight = baseCharHeight + padding.top + padding.bottom;
    
    // Cabeçalho com os valores exatos incluindo padding
    const header = `Character width: ${charWidth}\nCharacter height: ${charHeight}\nCharacter set: ${characters}\n\n`;

    if (type === 'construct3') {
        const constructData = JSON.stringify(widthData);
        return `${header}Copy the following JSON text and paste into the 'Spacing data' property of the SpriteFont. No extra coding is required!\n${constructData}\n\nThese are the details for building the character widths manually, with the SpriteFont 'Set character width' action.\n${widthData.map(([width, chars]) => `${width}\t"${chars}"`).join('\n')}`;
    } else if (type === 'construct2') {
        const c2Data = {
            c2array: true,
            size: [2, widthData.length, 1],
            data: [
                widthData.map(([width]) => [width]),
                widthData.map(([, chars]) => [chars])
            ]
        };
        const jsonData = JSON.stringify(c2Data);
        return `${header}Copy the following JSON text and paste into the Array.Load command INSIDE the default quotes.\n${jsonData}\n\nThese are the details for building the character widths manually, with the SpriteFont 'Set character width' action.\n${widthData.map(([width, chars]) => `${width}\t"${chars}"`).join('\n')}`;
    }
    return '';
}

function generateGodotBMFont(characters, fontSize, canvas) {
    const pages = [{
        id: 0,
        file: "spritefont.png"
    }];
    
    const padding = {
        top: parseInt(document.getElementById('paddingTop').value),
        right: parseInt(document.getElementById('paddingRight').value),
        bottom: parseInt(document.getElementById('paddingBottom').value),
        left: parseInt(document.getElementById('paddingLeft').value)
    };

    const chars = [];
    const uniqueChars = [...new Set(characters)];
    const charsPerRow = Math.floor(Math.sqrt(uniqueChars.length));
    
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px CustomFont`;
    
    const charHeight = fontSize;
    const baseCharWidth = Math.ceil(ctx.measureText('W').width);
    
    uniqueChars.forEach((char, i) => {
        const row = Math.floor(i / charsPerRow);
        const col = i % charsPerRow;
        const x = col * (baseCharWidth + padding.left + padding.right);
        const y = row * (charHeight + padding.top + padding.bottom);
        
        const metrics = ctx.measureText(char);
        const width = Math.ceil(metrics.width);
        
        chars.push({
            id: char.charCodeAt(0),
            x: x + padding.left,
            y: y + padding.top,
            width: width,
            height: charHeight,
            xoffset: 0,
            yoffset: 0,
            xadvance: width,
            page: 0,
            chnl: 0
        });
    });

    const bmfontData = {
        pages,
        chars,
        info: {
            face: "CustomFont",
            size: fontSize,
            bold: 0,
            italic: 0,
            charset: "",
            unicode: 1,
            stretchH: 100,
            smooth: 1,
            aa: 1,
            padding: [padding.top, padding.right, padding.bottom, padding.left],
            spacing: [0, 0]
        },
        common: {
            lineHeight: fontSize,
            base: fontSize,
            scaleW: canvas.width,
            scaleH: canvas.height,
            pages: 1,
            packed: 0,
            alphaChnl: 0,
            redChnl: 0,
            greenChnl: 0,
            blueChnl: 0
        }
    };

    // Converter para o formato .fnt
    let fntContent = '';
    fntContent += `info face="CustomFont" size=${fontSize} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=1 aa=1 padding=${padding.top},${padding.right},${padding.bottom},${padding.left} spacing=0,0\n`;
    fntContent += `common lineHeight=${fontSize} base=${fontSize} scaleW=${canvas.width} scaleH=${canvas.height} pages=1 packed=0 alphaChnl=0 redChnl=0 greenChnl=0 blueChnl=0\n`;
    fntContent += `page id=0 file="spritefont.png"\n`;
    fntContent += `chars count=${chars.length}\n`;
    
    chars.forEach(char => {
        fntContent += `char id=${char.id} x=${char.x} y=${char.y} width=${char.width} height=${char.height} xoffset=${char.xoffset} yoffset=${char.yoffset} xadvance=${char.xadvance} page=${char.page} chnl=${char.chnl}\n`;
    });

    return { fntContent, bmfontData };
}

function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadCanvas() {
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');
    
    const fontSize = parseInt(document.getElementById('fontSize').value);
    const padding = {
        top: parseInt(document.getElementById('paddingTop').value),
        right: parseInt(document.getElementById('paddingRight').value),
        bottom: parseInt(document.getElementById('paddingBottom').value),
        left: parseInt(document.getElementById('paddingLeft').value)
    };
    
    downloadCtx.font = `${fontSize}px CustomFont`;
    const metrics = downloadCtx.measureText('W');
    const charHeight = fontSize;
    const charWidth = Math.ceil(metrics.width);
    
    const characters = document.getElementById('characters').value;
    const uniqueChars = [...new Set(characters)];
    const charsPerRow = Math.floor(Math.sqrt(uniqueChars.length));
    const rows = Math.ceil(uniqueChars.length / charsPerRow);
    
    downloadCanvas.width = (charWidth + padding.left + padding.right) * charsPerRow;
    downloadCanvas.height = (charHeight + padding.top + padding.bottom) * rows;
    
    downloadCtx.clearRect(0, 0, downloadCanvas.width, downloadCanvas.height);
    
    if (!document.getElementById('transparentBg').checked) {
        downloadCtx.fillStyle = '#ffffff';
        downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
    }
    
    downloadCtx.font = `${fontSize}px CustomFont`;
    downloadCtx.fillStyle = document.getElementById('textColor').value;
    downloadCtx.textBaseline = 'top';
    
    uniqueChars.forEach((char, i) => {
        const row = Math.floor(i / charsPerRow);
        const col = i % charsPerRow;
        const x = col * (charWidth + padding.left + padding.right) + padding.left;
        const y = row * (charHeight + padding.top + padding.bottom) + padding.top;
        
        downloadCtx.fillText(char, x, y);
    });
    
    const link = document.createElement('a');
    link.download = 'spritefont.png';
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
}

function createInputSpinner(inputElement, suffix = null) {
    const value = inputElement.value;
    const min = inputElement.min;
    const max = inputElement.max;
    const id = inputElement.id;
    const classes = inputElement.className;

    const wrapper = document.createElement('div');
    wrapper.className = 'input-spinner';

    const newInput = document.createElement('input');
    newInput.type = 'number';
    newInput.value = value;
    newInput.min = min;
    newInput.max = max;
    newInput.id = id;
    newInput.className = classes;

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

    if (suffix) {
        const suffixSpan = document.createElement('span');
        suffixSpan.className = 'suffix';
        suffixSpan.textContent = suffix;
        wrapper.appendChild(suffixSpan);
    }

    wrapper.appendChild(newInput);
    wrapper.appendChild(spinnerButtons);
    inputElement.replaceWith(wrapper);

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

async function requestFontAccess() {
    try {
        if (!('queryLocalFonts' in window)) {
            throw new Error('Seu navegador não suporta acesso às fontes locais.');
        }

        const fonts = await window.queryLocalFonts();
        const uniqueFonts = Array.from(new Set(fonts.map(font => font.family)))
            .sort((a, b) => a.localeCompare(b));

        return uniqueFonts;
    } catch (error) {
        console.error('Erro ao acessar fontes:', error);
        alert('Não foi possível acessar as fontes do sistema. Certifique-se que está usando Chrome/Edge versão recente e que permitiu o acesso às fontes.');
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const systemFontsSelect = document.getElementById('systemFonts');
    const loadFontsButton = document.createElement('button');
    const previewCanvas = document.getElementById('previewCanvas');
    const ctx = previewCanvas.getContext('2d');
    const downloadBtn = document.getElementById('download');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fontFile');
    const uploadDefault = document.getElementById('uploadDefault');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const fileName = uploadSuccess.querySelector('.file-name');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const showGrid = document.getElementById('showGrid');
    const gridControls = document.getElementById('gridControls');
    const textColor = document.getElementById('textColor');
    const textColorHex = document.getElementById('textColorHex');
    const modal = document.getElementById('exportModal');

    // Verificar se elementos críticos existem
    if (!modal) {
        console.error('Modal não encontrado');
        return;
    }

    const closeModal = modal.querySelector('.close-modal');
    const exportOptions = modal.querySelectorAll('.export-option');

    let zoomLevel = 1;
    let systemFontsData = [];

    // Configuração inicial
    loadFontsButton.className = 'btn btn-primary';
    loadFontsButton.textContent = 'Loading System Fonts';
    systemFontsSelect.parentNode.insertBefore(loadFontsButton, systemFontsSelect);
    systemFontsSelect.style.display = 'none';

    // Controles
    const controls = {
        fontFile: fileInput,
        fontSize: document.getElementById('fontSize'),
        paddingTop: document.getElementById('paddingTop'),
        paddingRight: document.getElementById('paddingRight'),
        paddingBottom: document.getElementById('paddingBottom'),
        paddingLeft: document.getElementById('paddingLeft'),
        lockProportion: document.getElementById('lockProportion'),
        characters: document.getElementById('characters'),
        textColor: textColor,
        transparentBg: document.getElementById('transparentBg'),
        zoomIn: document.getElementById('zoomIn'),
        zoomOut: document.getElementById('zoomOut'),
        zoomLevel: document.getElementById('zoomLevel'),
        showGrid: showGrid,
        gridColor: document.getElementById('gridColor'),
        gridOpacity: document.getElementById('gridOpacity'),
        gridOpacityValue: document.getElementById('gridOpacityValue')
    };

    // Configuração do botão de exportação
    downloadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export
    `;

    // Event Listeners do Modal
    downloadBtn.addEventListener('click', () => {
        if (!customFont) {
            alert('Please upload a font first.');
            return;
        }
        modal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Event Listeners de Exportação
    exportOptions.forEach(option => {
        option.addEventListener('click', async () => {
            const format = option.dataset.format;
            const fontSize = parseInt(controls.fontSize.value);
            const characters = controls.characters.value;
            
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            const widthData = getCharacterWidthData(characters, ctx, fontSize);
            
            switch(format) {
                case 'png':
                    downloadCanvas();
                    break;
                case 'json':
                    downloadFile(
                        JSON.stringify(widthData, null, 2),
                        'spritefont-data.json',
                        'application/json'
                    );
                    break;
                    case 'construct2':
                        case 'construct3': {
                            if (!customFont) {
                                alert('Please upload a font first.');
                                modal.classList.remove('active');
                                return;
                            }
                        
                            // Pegar os valores exatos que estão sendo usados
                            const currentFontSize = parseInt(controls.fontSize.value);
                            const currentCharacters = controls.characters.value;
                        
                            if (!currentFontSize || !currentCharacters) {
                                alert('Invalid font size or characters.');
                                modal.classList.remove('active');
                                return;
                            }
                        
                            // Criar novo ZIP
                            const zip = new JSZip();
                            
                            // Adicionar arquivo de texto com os valores exatos
                            const textContent = generateConstructData(widthData, format, currentFontSize, currentCharacters);
                        
                            zip.file("spritefont-data.txt", textContent);
                            
                            // Gerar e adicionar PNG
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Configurar canvas
                            const padding = {
                                top: parseInt(document.getElementById('paddingTop').value),
                                right: parseInt(document.getElementById('paddingRight').value),
                                bottom: parseInt(document.getElementById('paddingBottom').value),
                                left: parseInt(document.getElementById('paddingLeft').value)
                            };
                            
                            ctx.font = `${currentFontSize}px CustomFont`;
                            const metrics = ctx.measureText('W');
                            const charHeight = currentFontSize;
                            const charWidth = Math.ceil(metrics.width);
                            
                            const uniqueChars = [...new Set(currentCharacters)];
                            const charsPerRow = Math.floor(Math.sqrt(uniqueChars.length));
                            const rows = Math.ceil(uniqueChars.length / charsPerRow);
                            
                            canvas.width = (charWidth + padding.left + padding.right) * charsPerRow;
                            canvas.height = (charHeight + padding.top + padding.bottom) * rows;
                            
                            // Limpar e configurar fundo
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            if (!document.getElementById('transparentBg').checked) {
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                            }
                            
                            // Desenhar caracteres
                            ctx.font = `${currentFontSize}px CustomFont`;
                            ctx.fillStyle = document.getElementById('textColor').value;
                            ctx.textBaseline = 'top';
                            
                            uniqueChars.forEach((char, i) => {
                                const row = Math.floor(i / charsPerRow);
                                const col = i % charsPerRow;
                                const x = col * (charWidth + padding.left + padding.right) + padding.left;
                                const y = row * (charHeight + padding.top + padding.bottom) + padding.top;
                                ctx.fillText(char, x, y);
                            });
                            
                            // Converter canvas para blob e adicionar ao ZIP
                            const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                            zip.file("spritefont.png", pngBlob);
                            
                            // Gerar e baixar o ZIP
                            const zipBlob = await zip.generateAsync({type: "blob"});
                            const zipUrl = URL.createObjectURL(zipBlob);
                            const link = document.createElement('a');
                            link.href = zipUrl;
                            link.download = `spritefont-${format}.zip`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(zipUrl);
                            break;
                        }
                case 'godot': {
                    const zip = new JSZip();
                    
                    // Gerar e adicionar PNG
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Configurar canvas
                    const fontSize = parseInt(document.getElementById('fontSize').value);
                    const padding = {
                        top: parseInt(document.getElementById('paddingTop').value),
                        right: parseInt(document.getElementById('paddingRight').value),
                        bottom: parseInt(document.getElementById('paddingBottom').value),
                        left: parseInt(document.getElementById('paddingLeft').value)
                    };
                    
                    // Configurar dimensões e renderização
                    ctx.font = `${fontSize}px CustomFont`;
                    const metrics = ctx.measureText('W');
                    const charHeight = fontSize;
                    const charWidth = Math.ceil(metrics.width);
                    
                    const uniqueChars = [...new Set(characters)];
                    const charsPerRow = Math.floor(Math.sqrt(uniqueChars.length));
                    const rows = Math.ceil(uniqueChars.length / charsPerRow);
                    
                    canvas.width = (charWidth + padding.left + padding.right) * charsPerRow;
                    canvas.height = (charHeight + padding.top + padding.bottom) * rows;
                    
                    // Limpar e configurar fundo
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (!document.getElementById('transparentBg').checked) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    // Desenhar caracteres
                    ctx.font = `${fontSize}px CustomFont`;
                    ctx.fillStyle = document.getElementById('textColor').value;
                    ctx.textBaseline = 'top';
                    
                    uniqueChars.forEach((char, i) => {
                        const row = Math.floor(i / charsPerRow);
                        const col = i % charsPerRow;
                        const x = col * (charWidth + padding.left + padding.right) + padding.left;
                        const y = row * (charHeight + padding.top + padding.bottom) + padding.top;
                        ctx.fillText(char, x, y);
                    });
                    
                    // Gerar dados BMFont
                    const { fntContent } = generateGodotBMFont(characters, fontSize, canvas);
                    
                    // Adicionar arquivo .fnt
                    zip.file("spritefont.fnt", fntContent);
                    
                    // Converter canvas para blob e adicionar ao ZIP
                    const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    zip.file("spritefont.png", pngBlob);
                    
                    // Gerar e baixar o ZIP
                    const zipBlob = await zip.generateAsync({type: "blob"});
                    const zipUrl = URL.createObjectURL(zipBlob);
                    const link = document.createElement('a');
                    link.href = zipUrl;
                    link.download = 'spritefont-godot.zip';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(zipUrl);
                    break;
                }
            }
            
            modal.classList.remove('active');
        });
    });

// Inicializar spinners
const initializeSpinners = () => {
    // Spinner para font size
    const fontSizeSpinner = createInputSpinner(controls.fontSize, 'px');
    controls.fontSize = fontSizeSpinner.querySelector('input');

    // Spinners para padding
    const paddingIds = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
    paddingIds.forEach(id => {
        const input = document.getElementById(id);
        const spinner = createInputSpinner(input, 'px');
        controls[id] = spinner.querySelector('input');
    });

    // Adicionar eventos após criar os spinners
    [controls.fontSize, controls.paddingTop, controls.paddingRight,
    controls.paddingBottom, controls.paddingLeft].forEach(input => {
        if (input) {
            input.addEventListener('input', generatePreview);
            input.addEventListener('change', generatePreview);
        }
    });

    // Padding listeners para sincronização
    [controls.paddingTop, controls.paddingRight, controls.paddingBottom, controls.paddingLeft]
        .forEach(input => {
            if (input) {
                input.addEventListener('input', () => syncPadding(input));
            }
        });
};

// Chamar a função de inicialização
initializeSpinners();

    // Event Listeners de UI
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    showGrid.addEventListener('change', (e) => {
        gridControls.style.display = e.target.checked ? 'block' : 'none';
    });

    textColor.addEventListener('input', (e) => {
        textColorHex.textContent = e.target.value.toUpperCase();
    });

    // Funções auxiliares de UI
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

    function preventDefaults(e) {
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
        fileInput.dispatchEvent(new Event('change'));
    }

    // Event Listeners de Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Funções de Preview
    function updateZoomDisplay() {
        controls.zoomLevel.textContent = `${Math.round(zoomLevel * 100)}%`;
    }

    function syncPadding(changedInput) {
        if (controls.lockProportion && controls.lockProportion.checked) {
            const value = changedInput.value;
            [controls.paddingTop, controls.paddingRight, controls.paddingBottom, controls.paddingLeft]
                .forEach(input => {
                    if (input && input !== changedInput) {
                        input.value = value;
                    }
                });
        }
        generatePreview();
    }

function setupRealTimeUpdates() {
    // Zoom Controls
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

    // Event listeners para os controles de cor
    controls.textColor.addEventListener('input', () => {
        const colorValue = controls.textColor.value.toUpperCase();
        textColorHex.textContent = colorValue; // Atualize o texto hexadecimal
        generatePreview(); // Regenere o preview
    });

    controls.textColor.addEventListener('change', () => {
        const colorValue = controls.textColor.value.toUpperCase();
        textColorHex.textContent = colorValue;
        generatePreview();
    });

    // Checkbox controls
    controls.transparentBg.addEventListener('change', generatePreview);
    controls.showGrid.addEventListener('change', (e) => {
        gridControls.style.display = e.target.checked ? 'block' : 'none';
        generatePreview();
    });

    // Grid controls
    controls.gridColor.addEventListener('input', generatePreview);
    controls.gridOpacity.addEventListener('input', (e) => {
        controls.gridOpacityValue.textContent = `${e.target.value}%`;
        generatePreview();
    });

    // Characters text area
    controls.characters.addEventListener('input', generatePreview);

    // Lock proportion checkbox
    controls.lockProportion.addEventListener('change', () => {
        if (controls.lockProportion.checked) {
            // Sincroniza todos os paddings com o valor do top
            const value = controls.paddingTop.value;
            [controls.paddingRight, controls.paddingBottom, controls.paddingLeft]
                .forEach(input => input.value = value);
            generatePreview();
        }
    });
}

    // Chamar a função para configurar as atualizações em tempo real
    setupRealTimeUpdates();

    // Carregar fonte local
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
            const fontData = systemFontsData.find(f => f.family === selectedFont);
            
            if (!fontData) {
                throw new Error('Dados da fonte não encontrados');
            }

            const blob = await fontData.blob();
            
            if (customFont) {
                document.fonts.delete(customFont);
                if (customFont.url) {
                    URL.revokeObjectURL(customFont.url);
                }
            }

            const fontFace = new FontFace('CustomFont', `url(${URL.createObjectURL(blob)})`);
            customFont = await fontFace.load();
            document.fonts.add(customFont);

            generatePreview();
        } catch (error) {
            console.error('Erro ao carregar fonte:', error);
            alert(`Erro ao carregar a fonte: ${error.message}`);
        }
    });

    // Carregar fonte do arquivo
    controls.fontFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const fontUrl = URL.createObjectURL(file);
                
                if (customFont) {
                    document.fonts.delete(customFont);
                    URL.revokeObjectURL(customFont.url);
                }
                
                const fontFace = new FontFace('CustomFont', `url(${fontUrl})`);
                customFont = await fontFace.load();
                customFont.url = fontUrl;
                document.fonts.add(customFont);
                
                ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                generatePreview();
            } catch (error) {
                alert('Erro ao carregar a fonte. Certifique-se que é um arquivo .ttf ou .otf válido.');
                console.error(error);
            }
        }
    });

    // Função principal de geração do preview
    function generatePreview() {
        if (!customFont) return;

        const fontSize = parseInt(controls.fontSize.value);
        const padding = {
            top: parseInt(controls.paddingTop.value),
            right: parseInt(controls.paddingRight.value),
            bottom: parseInt(controls.paddingBottom.value),
            left: parseInt(controls.paddingLeft.value)
        };
        const characters = controls.characters.value;
        const textColor = controls.textColor.value;
        const transparentBg = controls.transparentBg.checked;
        const showGrid = controls.showGrid.checked;

        ctx.font = `${fontSize}px CustomFont`;
        const metrics = ctx.measureText('W');
        const charHeight = fontSize;
        const charWidth = Math.ceil(metrics.width);
        
        const uniqueChars = [...new Set(characters)];
        const charsPerRow = Math.floor(Math.sqrt(uniqueChars.length));
        const rows = Math.ceil(uniqueChars.length / charsPerRow);
        
        const baseWidth = (charWidth + padding.left + padding.right) * charsPerRow;
        const baseHeight = (charHeight + padding.top + padding.bottom) * rows;
        
        previewCanvas.width = baseWidth * zoomLevel;
        previewCanvas.height = baseHeight * zoomLevel;
        
        ctx.scale(zoomLevel, zoomLevel);
        ctx.clearRect(0, 0, baseWidth, baseHeight);
        
        if (!transparentBg) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, baseWidth, baseHeight);
        }
        
        if (showGrid) {
            ctx.beginPath();
            const gridColorValue = controls.gridColor.value;
            const opacity = parseFloat(controls.gridOpacity.value) / 100;
            
            const r = parseInt(gridColorValue.slice(1, 3), 16);
            const g = parseInt(gridColorValue.slice(3, 5), 16);
            const b = parseInt(gridColorValue.slice(5, 7), 16);
            
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.lineWidth = 1 / zoomLevel;

            for (let i = 0; i <= charsPerRow; i++) {
                const x = i * (charWidth + padding.left + padding.right);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, baseHeight);
            }

            for (let i = 0; i <= rows; i++) {
                const y = i * (charHeight + padding.top + padding.bottom);
                ctx.moveTo(0, y);
                ctx.lineTo(baseWidth, y);
            }

            ctx.stroke();
        }
        
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
});