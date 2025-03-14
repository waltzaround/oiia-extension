// Popup script for handling UI interactions
document.addEventListener('DOMContentLoaded', function() {
  // Get the button element
  const actionButton = document.getElementById('actionButton');
  
  // Add click event listener to the button
  actionButton.addEventListener('click', function() {
    // Update button text
    actionButton.textContent = 'Replacing...';
    
    // Get the active tab and send a message to the content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        console.error('No active tab found');
        actionButton.textContent = 'Error: No tab';
        setTimeout(() => { actionButton.textContent = 'OIIA'; }, 1500);
        return;
      }
      
      const activeTab = tabs[0];
      
      // Check if we can inject into this tab
      if (!activeTab.url || !activeTab.url.startsWith('http')) {
        console.error('Cannot inject into this page. Try a regular web page.');
        actionButton.textContent = 'Not supported';
        setTimeout(() => { actionButton.textContent = 'OIIA'; }, 1500);
        return;
      }
      
      // First, inject the content script if it's not already there
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['src/content.js']
      }, function() {
        // After ensuring the content script is injected, send the message
        chrome.tabs.sendMessage(activeTab.id, {action: "replaceWithOIIA"}, function(response) {
          // Check for error
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError.message);
            actionButton.textContent = 'Error';
            setTimeout(() => { actionButton.textContent = 'OIIA'; }, 1500);
            return;
          }
          
          // Handle successful response
          console.log("Message sent to content script, response:", response);
          actionButton.textContent = 'Done!';
          setTimeout(() => { actionButton.textContent = 'OIIA'; }, 1500);
        });
      });
    });
  });
});
