
    if (window.matchMedia('(min-width: 641px)').matches) {
        
        const observer = new MutationObserver(() => {
            const mortgageMode = document.querySelector('.ai-mode.active[data-mode="mortgage"]');
            const hints = document.querySelector('.ai-mode-hints');
            const messages = document.querySelector('.ai-messages-area');
            const modes = document.querySelector('.ai-modes');
            const attachmentName = document.querySelector('#ai-attachment-name');
        
            if (!hints || !messages || !modes) return;
        
            // Проверяем активную вкладку "Ипотека"
            if (mortgageMode) {
                hints.style.display = 'none';
                messages.style.display = 'none';
        
                modes.style.borderRadius = '15px';
                modes.style.marginBottom = '8px';
                modes.style.paddingBottom = '13px';
            } else {
                hints.style.display = '';
                messages.style.display = '';
        
                modes.style.borderRadius = '';
                modes.style.marginBottom = '';
                modes.style.paddingBottom = '';
            }
        
            // Проверяем наличие названия прикрепленного файла
            const hasAttachment = attachmentName && attachmentName.textContent.trim() !== '';
        
            if (hasAttachment) {
                hints.style.display = 'none';
        
                modes.style.borderRadius = '15px';
                modes.style.marginBottom = '8px';
                modes.style.paddingBottom = '13px';
            } else if (!mortgageMode) {
                hints.style.display = '';
                modes.style.borderRadius = '';
                modes.style.marginBottom = '';
                modes.style.paddingBottom = '';
            }
        });
        
        observer.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    
    }
    
    if (window.matchMedia('(max-width: 640px)').matches) {
        
        const observer = new MutationObserver(() => {
            const mortgageMode = document.querySelector('.ai-mode.active[data-mode="mortgage"]');
            const hints = document.querySelector('.ai-mode-hints');
            const messages = document.querySelector('.ai-messages-area');
            const modes = document.querySelector('.ai-modes');
            const attachmentName = document.querySelector('#ai-attachment-name');
        
            if (!hints || !messages || !modes) return;
        
            // Проверяем активную вкладку "Ипотека"
            if (mortgageMode) {
                hints.style.display = 'none';
                messages.style.display = 'none';
                modes.style.borderRadius = '25px';
            } else {
                hints.style.display = '';
                messages.style.display = '';
                modes.style.borderRadius = '';
            }
        
            // Проверяем наличие названия прикрепленного файла
            const hasAttachment = attachmentName && attachmentName.textContent.trim() !== '';
        
            if (hasAttachment) {
                hints.style.display = 'none';
                modes.style.borderRadius = '25px';
            } else if (!mortgageMode) {
                hints.style.display = '';
                modes.style.borderRadius = '';
            }
        });
        
        observer.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    
    }
