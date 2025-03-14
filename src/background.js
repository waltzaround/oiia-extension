// Background service worker for Chrome Extension
// This script runs in the background and handles events

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Process messages from content scripts if needed
  console.log('Background script received message:', message);
  
  // Always return true for asynchronous response
  return true;
});
