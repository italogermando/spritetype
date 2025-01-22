const enableKerning = document.getElementById('enableKerning');
    const kerningControls = document.getElementById('kerningControls');
    const kerningChar1 = document.getElementById('kerningChar1');
    const kerningChar2 = document.getElementById('kerningChar2');
    const kerningValue = document.getElementById('kerningValue');
    const addKerningPair = document.getElementById('addKerningPair');
    const kerningPairsList = document.getElementById('kerningPairsList');



        // Mapa para armazenar os pares de kerning
        const kerningPairs = new Map();

        enableKerning.addEventListener('change', (e) => {
            kerningControls.style.display = e.target.checked ? 'block' : 'none';
            generatePreview();
        });
    
        addKerningPair.addEventListener('click', () => {
            const char1 = kerningChar1.value;
            const char2 = kerningChar2.value;
            const value = parseInt(kerningValue.value);
    
            if (!char1 || !char2) {
                alert('Por favor, insira ambos os caracteres.');
                return;
            }
    
            const pairKey = `${char1}${char2}`;
            kerningPairs.set(pairKey, value);
            updateKerningPairsList();
            generatePreview();
    
            // Limpar inputs
            kerningChar1.value = '';
            kerningChar2.value = '';
            kerningValue.value = '0';
        });
    
        function updateKerningPairsList() {
            kerningPairsList.innerHTML = '';
            
            kerningPairs.forEach((value, pair) => {
                const pairElement = document.createElement('div');
                pairElement.className = 'kerning-pair';
                
                const charsSpan = document.createElement('span');
                charsSpan.className = 'kerning-pair-chars';
                charsSpan.textContent = `${pair[0]} ${pair[1]}`;
                
                const valueSpan = document.createElement('span');
                valueSpan.className = 'kerning-pair-value';
                valueSpan.textContent = `${value}px`;
                
                const removeButton = document.createElement('button');
                removeButton.className = 'kerning-pair-remove';
                removeButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                `;
                
                // Adicionar evento de clique diretamente no botão
                removeButton.addEventListener('click', () => {
                    kerningPairs.delete(pair);
                    updateKerningPairsList();
                    generatePreview();
                });
                
                pairElement.appendChild(charsSpan);
                pairElement.appendChild(valueSpan);
                pairElement.appendChild(removeButton);
                kerningPairsList.appendChild(pairElement);
            });
        }
    
        // Aplicar kerning durante o preview
        const applyKerning = (text, ctx, x, y) => {
            let currentX = x;
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                ctx.fillText(char, currentX, y);
                
                const metrics = ctx.measureText(char);
                currentX += metrics.width;
    
                if (i < text.length - 1) {
                    const nextChar = text[i + 1];
                    const pairKey = `${char}${nextChar}`;
                    
                    if (kerningPairs.has(pairKey)) {
                        currentX += kerningPairs.get(pairKey);
                    }
                }
            }
            
            return currentX - x; // Retorna a largura total
        };
    
    
    
        const kerningPreviewCanvas = document.getElementById('kerningPreviewCanvas');
        const kerningPreviewCtx = kerningPreviewCanvas.getContext('2d');
        const kerningPreviewText = document.getElementById('kerningPreviewText');
    
        function updateKerningPreview() {
            if (!customFont) return;
    
            const text = kerningPreviewText.value;
            const fontSize = parseInt(controls.fontSize.value);
            const padding = {
                top: parseInt(controls.paddingTop.value),
                right: parseInt(controls.paddingRight.value),
                bottom: parseInt(controls.paddingBottom.value),
                left: parseInt(controls.paddingLeft.value)
            };
            
            // Calcular dimensões do caractere base
            const metrics = ctx.measureText('W');
            const charHeight = fontSize;
            const charWidth = Math.ceil(metrics.width);
            const cellWidth = charWidth + padding.left + padding.right;
            const cellHeight = charHeight + padding.top + padding.bottom;
    
            // Calcular largura total com kerning
            let totalWidth = 0;
            for (let i = 0; i < text.length; i++) {
                totalWidth += cellWidth;
                
                if (enableKerning.checked && i < text.length - 1) {
                    const char = text[i];
                    const nextChar = text[i + 1];
                    const pairKey = `${char}${nextChar}`;
                    if (kerningPairs.has(pairKey)) {
                        totalWidth += kerningPairs.get(pairKey);
                    }
                }
            }
    
            // Configurar canvas
            const previewPadding = 20;
            kerningPreviewCanvas.width = totalWidth + (previewPadding * 2);
            kerningPreviewCanvas.height = cellHeight + (previewPadding * 2);
            kerningPreviewCtx.clearRect(0, 0, kerningPreviewCanvas.width, kerningPreviewCanvas.height);
    
            // Definir fundo se necessário
            if (!controls.transparentBg.checked) {
                kerningPreviewCtx.fillStyle = '#ffffff';
                kerningPreviewCtx.fillRect(0, 0, kerningPreviewCanvas.width, kerningPreviewCanvas.height);
            }
    
            // Desenhar caracteres do sprite
            let currentX = previewPadding;
            const characters = controls.characters.value;
            const charsPerRow = Math.floor(Math.sqrt([...new Set(characters)].length));
    
            // Desenhar linhas guia para visualizar o kerning
            if (enableKerning.checked) {
                kerningPreviewCtx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
                kerningPreviewCtx.lineWidth = 1;
                
                // Linha guia inicial
                kerningPreviewCtx.beginPath();
                kerningPreviewCtx.moveTo(currentX, 0);
                kerningPreviewCtx.lineTo(currentX, kerningPreviewCanvas.height);
                kerningPreviewCtx.stroke();
            }
    
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const charIndex = characters.indexOf(char);
                
                if (charIndex !== -1) {
                    const row = Math.floor(charIndex / charsPerRow);
                    const col = charIndex % charsPerRow;
                    
                    // Coordenadas do caractere no sprite
                    const srcX = col * cellWidth;
                    const srcY = row * cellHeight;
    
                    // Copiar do sprite para o preview
                    kerningPreviewCtx.drawImage(
                        previewCanvas,
                        srcX, srcY, cellWidth, cellHeight,
                        currentX, previewPadding, cellWidth, cellHeight
                    );
                }
    
                // Avançar para o próximo caractere
                currentX += cellWidth;
                
                // Aplicar kerning se necessário
                if (enableKerning.checked && i < text.length - 1) {
                    const nextChar = text[i + 1];
                    const pairKey = `${char}${nextChar}`;
                    if (kerningPairs.has(pairKey)) {
                        const kerningValue = kerningPairs.get(pairKey);
                        currentX += kerningValue;
    
                        // Linha guia para kerning
                        kerningPreviewCtx.beginPath();
                        kerningPreviewCtx.moveTo(currentX, 0);
                        kerningPreviewCtx.lineTo(currentX, kerningPreviewCanvas.height);
                        kerningPreviewCtx.stroke();
                    }
                }
            }
        }
    
        // Atualizar preview quando o texto mudar
        kerningPreviewText.addEventListener('input', updateKerningPreview);
    
        // Atualizar preview quando kerning for alterado
        enableKerning.addEventListener('change', updateKerningPreview);
        
        // Também atualizar quando um par de kerning for adicionado
        addKerningPair.addEventListener('click', () => {
            updateKerningPreview();
        });
    
        // Modificar a função existente para chamar o updateKerningPreview
        function updateKerningPairsList() {
            kerningPairsList.innerHTML = '';
            
            kerningPairs.forEach((value, pair) => {
                const pairElement = document.createElement('div');
                pairElement.className = 'kerning-pair';
                
                const charsSpan = document.createElement('span');
                charsSpan.className = 'kerning-pair-chars';
                charsSpan.textContent = `${pair[0]} ${pair[1]}`;
                
                const valueSpan = document.createElement('span');
                valueSpan.className = 'kerning-pair-value';
                valueSpan.textContent = `${value}px`;
                
                const removeButton = document.createElement('button');
                removeButton.className = 'kerning-pair-remove';
                removeButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                `;
                
                removeButton.addEventListener('click', () => {
                    kerningPairs.delete(pair);
                    updateKerningPairsList();
                    generatePreview();
                    updateKerningPreview(); // Atualizar o preview quando remover um par
                });
                
                pairElement.appendChild(charsSpan);
                pairElement.appendChild(valueSpan);
                pairElement.appendChild(removeButton);
                kerningPairsList.appendChild(pairElement);
            });
        }
    
    
    
    