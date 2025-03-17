// Popup script for handling UI interactions
document.addEventListener('DOMContentLoaded', function() {
  // Get the button elements
  const actionButton = document.getElementById('actionButton');
  
  // Variable to track OIIA state
  let oiiaActive = false;
  
  // Add click event listener to the main OIIA button
  actionButton.addEventListener('click', function() {
    if (oiiaActive) {
      // If OIIA is active, disable it
      disableOIIA();
    } else {
      // If OIIA is not active, enable it
      enableOIIA();
    }
  });
  
  // Function to enable OIIA mode
  function enableOIIA() {
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
      
      // Send the message directly to the content script (which is already loaded via manifest.json)
      chrome.tabs.sendMessage(activeTab.id, {
        action: "replaceWithOIIA"
      }, function(response) {
        // Check for error
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError.message);
          actionButton.textContent = 'Error';
          setTimeout(() => { actionButton.textContent = 'OIIA'; }, 1500);
          return;
        }
        
        // Handle successful response
        console.log("Replace response:", response);
        
        // Update button text and state
        actionButton.textContent = 'Disable OIIA';
        oiiaActive = true;
      });
    });
  }
  
  // Function to disable OIIA mode
  function disableOIIA() {
    // Update button text
    actionButton.textContent = 'Disabling...';
    
    // Get the active tab and send a message to the content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        console.error('No active tab found');
        actionButton.textContent = 'Error: No tab';
        setTimeout(() => { actionButton.textContent = 'Disable OIIA'; }, 1500);
        return;
      }
      
      const activeTab = tabs[0];
      
      // Send the message to disable OIIA
      chrome.tabs.sendMessage(activeTab.id, {
        action: "disableOIIA"
      }, function(response) {
        // Check for error
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError.message);
          actionButton.textContent = 'Error';
          setTimeout(() => { actionButton.textContent = 'Disable OIIA'; }, 1500);
          return;
        }
        
        // Handle successful response
        console.log("Disable response:", response);
        
        // Update button text and state
        actionButton.textContent = 'OIIA';
        oiiaActive = false;
      });
    });
  }
  
});
