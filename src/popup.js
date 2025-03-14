// Popup script for handling UI interactions
document.addEventListener('DOMContentLoaded', function() {
  // Get the button elements
  const actionButton = document.getElementById('actionButton');
  const toggleTextButton = document.getElementById('toggleTextButton');
  const textInput = document.getElementById('textInput');
  const textStatus = document.getElementById('textStatus');
  
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
  
  // Add click event listener to the toggle text button
  toggleTextButton.addEventListener('click', function() {
    const searchText = textInput.value.trim();
    
    if (!searchText) {
      textStatus.textContent = 'Please enter text to search for';
      setTimeout(() => { textStatus.textContent = ''; }, 2000);
      return;
    }
    
    toggleTextRotation(searchText);
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
          actionButton.textContent = 'Disable OIIA';
          oiiaActive = true;
        });
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
        setTimeout(() => { actionButton.textContent = 'OIIA'; }, 1500);
        return;
      }
      
      const activeTab = tabs[0];
      
      // Send the message to disable OIIA
      chrome.tabs.sendMessage(activeTab.id, {action: "disableOIIA"}, function(response) {
        // Check for error
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError.message);
          actionButton.textContent = 'Error';
          setTimeout(() => { actionButton.textContent = 'OIIA'; }, 1500);
          return;
        }
        
        // Handle successful response
        console.log("Disabled OIIA, response:", response);
        actionButton.textContent = 'OIIA';
        oiiaActive = false;
      });
    });
  }
  
  // Function to toggle text rotation for elements containing the specified text
  function toggleTextRotation(text) {
    // Update status
    textStatus.textContent = 'Toggling...';
    
    // Get the active tab and send a message to the content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        console.error('No active tab found');
        textStatus.textContent = 'Error: No tab';
        setTimeout(() => { textStatus.textContent = ''; }, 2000);
        return;
      }
      
      const activeTab = tabs[0];
      
      // Check if we can inject into this tab
      if (!activeTab.url || !activeTab.url.startsWith('http')) {
        console.error('Cannot inject into this page. Try a regular web page.');
        textStatus.textContent = 'Not supported';
        setTimeout(() => { textStatus.textContent = ''; }, 2000);
        return;
      }
      
      // First, inject the content script if it's not already there
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['src/content.js']
      }, function() {
        // After ensuring the content script is injected, send the message
        chrome.tabs.sendMessage(activeTab.id, {
          action: "toggleTextRotation",
          text: text
        }, function(response) {
          // Check for error
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError.message);
            textStatus.textContent = 'Error';
            setTimeout(() => { textStatus.textContent = ''; }, 2000);
            return;
          }
          
          // Handle successful response
          console.log("Toggle text rotation response:", response);
          
          if (response && response.found) {
            textStatus.textContent = 'Text found and toggled!';
          } else {
            textStatus.textContent = 'No matching text found';
          }
          
          setTimeout(() => { textStatus.textContent = ''; }, 2000);
        });
      });
    });
  }
});
