chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Study Assistant installed');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {action: 'toggleAssistant'});
});
