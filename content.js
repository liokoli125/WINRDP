class SmartStudyAssistant {
  constructor() {
    this.isActive = false;
    this.currentMode = null;
    this.overlay = null;
    this.apiKey = null;
    this.targetLang = 'en';
    this.init();
  }

  async init() {
    // Load settings
    const result = await chrome.storage.sync.get(['apiKey', 'targetLang']);
    this.apiKey = result.apiKey;
    this.targetLang = result.targetLang || 'en';
    
    // Create floating assistant
    this.createFloatingAssistant();
    
    // Load Tesseract.js for OCR
    this.loadTesseract();
  }

  createFloatingAssistant() {
    const assistant = document.createElement('div');
    assistant.id = 'smart-study-assistant';
    assistant.innerHTML = `
      <div class="assistant-header">
        <span>🧠 Study Assistant</span>
        <button class="close-btn">×</button>
      </div>
      <div class="assistant-body">
        <div class="mode-selector">
          <button class="mode-btn" data-mode="ocr">📸 OCR</button>
          <button class="mode-btn" data-mode="translate">🌐 Translate</button>
          <button class="mode-btn" data-mode="ai">🤖 AI Help</button>
        </div>
        <div class="result-area" id="resultArea">
          <p>Select text or use OCR to get started!</p>
        </div>
        <div class="action-buttons">
          <button id="processBtn">Process</button>
          <button id="clearBtn">Clear</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(assistant);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const assistant = document.getElementById('smart-study-assistant');
    
    // Close button
    assistant.querySelector('.close-btn').addEventListener('click', () => {
      this.toggleAssistant();
    });

    // Mode buttons
    assistant.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setMode(e.target.dataset.mode);
      });
    });

    // Action buttons
    document.getElementById('processBtn').addEventListener('click', () => {
      this.processContent();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      document.getElementById('resultArea').innerHTML = '<p>Ready for new content!</p>';
    });

    // Text selection
    document.addEventListener('mouseup', (e) => {
      if (this.isActive && this.currentMode) {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
          this.handleSelectedText(selectedText);
        }
      }
    });

    // OCR area selection
    document.addEventListener('click', (e) => {
      if (this.currentMode === 'ocr' && this.isActive) {
        this.startAreaSelection(e);
      }
    });
  }

  loadTesseract() {
    if (!window.Tesseract) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
      document.head.appendChild(script);
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    const resultArea = document.getElementById('resultArea');
    switch(mode) {
      case 'ocr':
        resultArea.innerHTML = '<p>Click on any area to scan text with OCR</p>';
        break;
      case 'translate':
        resultArea.innerHTML = '<p>Select text to translate</p>';
        break;
      case 'ai':
        resultArea.innerHTML = '<p>Select questions to get AI help</p>';
        break;
    }
  }

  async handleSelectedText(text) {
    const resultArea = document.getElementById('resultArea');
    
    switch(this.currentMode) {
      case 'translate':
        resultArea.innerHTML = '<p>Translating...</p>';
        const translation = await this.translateText(text);
        resultArea.innerHTML = `
          <div class="text-result">
            <h4>Original:</h4>
            <p>${text}</p>
            <h4>Translation:</h4>
            <p>${translation}</p>
          </div>
        `;
        break;
        
      case 'ai':
        resultArea.innerHTML = '<p>AI is thinking...</p>';
        const aiResponse = await this.getAIHelp(text);
        resultArea.innerHTML = `
          <div class="ai-result">
            <h4>Question:</h4>
            <p>${text}</p>
            <h4>AI Answer:</h4>
            <p>${aiResponse}</p>
          </div>
        `;
        break;
    }
  }

  async startAreaSelection(e) {
    // Create selection overlay
    const overlay = document.createElement('div');
    overlay.className = 'ocr-overlay';
    overlay.innerHTML = '<p>Click and drag to select area for OCR</p>';
    document.body.appendChild(overlay);
    
    // Simple area selection (you can enhance this)
    setTimeout(() => {
      this.performOCR(e.target);
      document.body.removeChild(overlay);
    }, 1000);
  }

  async performOCR(element) {
    if (!window.Tesseract) {
      document.getElementById('resultArea').innerHTML = '<p>OCR library loading...</p>';
      return;
    }

    const resultArea = document.getElementById('resultArea');
    resultArea.innerHTML = '<p>Scanning text...</p>';

    try {
      // Create canvas from element
      const canvas = await this.elementToCanvas(element);
      
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
      
      resultArea.innerHTML = `
        <div class="ocr-result">
          <h4>Extracted Text:</h4>
          <p>${text}</p>
          <button onclick="navigator.clipboard.writeText('${text}')">Copy Text</button>
        </div>
      `;
    } catch (error) {
      resultArea.innerHTML = '<p>OCR failed. Try selecting a different area.</p>';
    }
  }

  async elementToCanvas(element) {
    // Simple implementation - you might want to use html2canvas library
    const rect = element.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // This is a simplified version - in a real implementation,
    // you'd want to capture the actual visual content
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(element.textContent || 'Sample text', 10, 30);
    
    return canvas;
  }

  async translateText(text) {
    // Using Google Translate API (you'll need to implement your preferred translation service)
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${this.targetLang}`);
      const data = await response.json();
      return data.responseData.translatedText || 'Translation failed';
    } catch (error) {
      return 'Translation service unavailable';
    }
  }

  async getAIHelp(question) {
    if (!this.apiKey) {
      return 'Please set your AI API key in the extension popup';
    }

    try {
      // Example using OpenAI API - adjust for your preferred AI service
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful study assistant. Provide clear, accurate answers to academic questions.'
            },
            {
              role: 'user',
              content: question
            }
          ],
          max_tokens: 200
        })
      });

      const data = await response.json();
      return data.choices[0].message.content || 'AI service unavailable';
    } catch (error) {
      return 'AI service error. Check your API key.';
    }
  }

  toggleAssistant() {
    const assistant = document.getElementById('smart-study-assistant');
    this.isActive = !this.isActive;
    assistant.style.display = this.isActive ? 'block' : 'none';
  }

  processContent() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      this.handleSelectedText(selectedText);
    } else {
      document.getElementById('resultArea').innerHTML = '<p>Please select some text first</p>';
    }
  }
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!window.studyAssistant) {
    window.studyAssistant = new SmartStudyAssistant();
  }

  switch(request.action) {
    case 'startOCR':
      window.studyAssistant.setMode('ocr');
      window.studyAssistant.toggleAssistant();
      break;
    case 'startTranslate':
      window.studyAssistant.setMode('translate');
      window.studyAssistant.toggleAssistant();
      break;
    case 'startAI':
      window.studyAssistant.setMode('ai');
      window.studyAssistant.toggleAssistant();
      break;
    case 'toggleAssistant':
      window.studyAssistant.toggleAssistant();
      break;
  }
});
