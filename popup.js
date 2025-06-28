document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'targetLang'], function(result) {
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if (result.targetLang) {
      document.getElementById('targetLang').value = result.targetLang;
    }
  });

  // Feature buttons
  document.getElementById('ocrBtn').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'startOCR'});
      updateStatus('Starting OCR mode...');
    });
  });

  document.getElementById('translateBtn').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'startTranslate'});
      updateStatus('Translation mode activated');
    });
  });

  document.getElementById('aiBtn').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'startAI'});
      updateStatus('AI assistant ready');
    });
  });

  document.getElementById('toggleBtn').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleAssistant'});
    });
  });

  // Save settings
  document.getElementById('saveBtn').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const targetLang = document.getElementById('targetLang').value;
    
    chrome.storage.sync.set({
      apiKey: apiKey,
      targetLang: targetLang
    }, function() {
      updateStatus('Settings saved!');
      setTimeout(() => updateStatus('Ready to assist!'), 2000);
    });
  });

  function updateStatus(message) {
    document.getElementById('status').textContent = message;
  }
});
