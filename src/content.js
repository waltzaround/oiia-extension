// Content script that runs in the context of web pages
// This script can interact with the web page's DOM

// Function to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Audio player for OIIA sound
var oiiaAudio = window.oiiaAudio || null;
window.oiiaAudio = oiiaAudio;

// Function to create and play the OIIA audio
function playOiiaAudio() {
  // Check if audio already exists
  if (oiiaAudio) {
    // If it exists but is not playing, play it
    if (oiiaAudio.paused) {
      oiiaAudio.play();
    }
    return;
  }
  
  // Create new audio element
  oiiaAudio = new Audio(chrome.runtime.getURL('public/oiia.mp3'));
  oiiaAudio.loop = true; // Set to loop continuously
  
  // Add event listeners for error handling
  oiiaAudio.addEventListener('error', (e) => {
    console.error('Error playing OIIA audio:', e);
  });
  
  // Start playing
  oiiaAudio.play().catch(e => {
    console.error('Could not play OIIA audio automatically:', e);
    // Many browsers require user interaction before playing audio
    // We'll add a one-time click handler to the document to try again
    const playOnClick = () => {
      oiiaAudio.play().catch(err => console.error('Still could not play audio:', err));
      document.removeEventListener('click', playOnClick);
    };
    document.addEventListener('click', playOnClick);
  });
}

// Function to stop the OIIA audio
function stopOiiaAudio() {
  if (oiiaAudio) {
    oiiaAudio.pause();
    oiiaAudio.currentTime = 0;
  }
}

// Function to create a CSS animation for the rotating effect and strobing background
function injectStyles() {
  // Check if we've already injected the styles
  if (document.getElementById('oiia-styles')) {
    return;
  }
  
  // Create style element
  const styleEl = document.createElement('style');
  styleEl.id = 'oiia-styles';
  
  // Define the CSS for the rotation animation and strobing background
  styleEl.textContent = `
    @keyframes oiia-rotate-y {
      0% { transform: rotate3d(0, 1, 0, 0deg); }
      100% { transform: rotate3d(0, 1, 0, 360deg); }
    }
    
    @keyframes oiia-rotate-x {
      0% { transform: rotate3d(1, 0, 0, 0deg); }
      100% { transform: rotate3d(1, 0, 0, 360deg); }
    }
    
    @keyframes oiia-rotate-z {
      0% { transform: rotate3d(0, 0, 1, 0deg); }
      100% { transform: rotate3d(0, 0, 1, 360deg); }
    }
    
    @keyframes oiia-rotate-random {
      0% { transform: rotate3d(1, 1, 1, 0deg); }
      25% { transform: rotate3d(1, 0.5, 0.3, 90deg); }
      50% { transform: rotate3d(0.2, 1, 0.4, 180deg); }
      75% { transform: rotate3d(0.5, 0.2, 1, 270deg); }
      100% { transform: rotate3d(1, 1, 1, 360deg); }
    }
    
    .oiia-rotate {
      animation: oiia-rotate-y 0.3s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
    }
    
    .oiia-text-rotate {
      animation: oiia-rotate-random 0.5s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
      display: inline-block;
    }
    
    .oiia-text-rotate-x {
      animation: oiia-rotate-x 0.4s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
      display: inline-block;
    }
    
    .oiia-text-rotate-y {
      animation: oiia-rotate-y 0.3s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
      display: inline-block;
    }
    
    .oiia-text-rotate-z {
      animation: oiia-rotate-z 0.35s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
      display: inline-block;
    }
    
    @keyframes oiia-strobe-background {
      0% { background: linear-gradient(45deg, #ff0000, #ff7f00); }
      10% { background: linear-gradient(90deg, #ff7f00, #ffff00); }
      20% { background: linear-gradient(135deg, #ffff00, #00ff00); }
      30% { background: linear-gradient(180deg, #00ff00, #0000ff); }
      40% { background: linear-gradient(225deg, #0000ff, #4b0082); }
      50% { background: linear-gradient(270deg, #4b0082, #9400d3); }
      60% { background: linear-gradient(315deg, #9400d3, #ff0000); }
      70% { background: linear-gradient(360deg, #ff0000, #ff7f00); }
      80% { background: linear-gradient(45deg, #ff7f00, #ffff00); }
      90% { background: linear-gradient(90deg, #ffff00, #00ff00); }
      100% { background: linear-gradient(135deg, #00ff00, #0000ff); }
    }
    
    .oiia-body-effect {
      animation: oiia-strobe-background 12s linear infinite !important;
      background-size: 400% 400% !important;
      transition: all 0.5s ease !important;
    }
    
    .oiia-video-container {
      position: relative;
      display: inline-block;
    }
    
    .oiia-video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.7);
    }
  `;
  
  // Add the style element to the document head
  document.head.appendChild(styleEl);
}

// Function to apply the strobing gradient background to the body
function applyBodyEffect() {
  // Add the class to the body element
  document.body.classList.add('oiia-body-effect');
  
  // Store the original background for potential restoration
  if (!document.body.hasAttribute('data-original-background')) {
    document.body.setAttribute('data-original-background', document.body.style.background || '');
  }
}

// Function to randomly toggle rotation on an image
function toggleRotation(imgElement) {
  // Randomly decide whether to rotate or stop
  const shouldRotate = Math.random() > 0.5;
  
  if (shouldRotate) {
    imgElement.classList.add('oiia-rotate');
  } else {
    imgElement.classList.remove('oiia-rotate');
  }
  
  // Schedule the next toggle
  setTimeout(() => {
    toggleRotation(imgElement);
  }, getRandomInt(500, 3000)); // Random interval between 0.5 and 3 seconds
}

// Function to randomly toggle rotation on text elements
function toggleTextRotation(element) {
  // Skip if element no longer exists or OIIA is inactive
  if (!element || !document.body.contains(element) || !oiiaActive) {
    return;
  }
  
  // Randomly decide whether to rotate or stop
  const shouldRotate = Math.random() > 0.5;
  
  if (shouldRotate) {
    // Remove any existing rotation classes
    element.classList.remove('oiia-text-rotate');
    element.classList.remove('oiia-text-rotate-x');
    element.classList.remove('oiia-text-rotate-y');
    element.classList.remove('oiia-text-rotate-z');
    
    // Randomly select a rotation type
    const rotationType = getRandomInt(1, 4);
    switch (rotationType) {
      case 1:
        element.classList.add('oiia-text-rotate-x');
        break;
      case 2:
        element.classList.add('oiia-text-rotate-y');
        break;
      case 3:
        element.classList.add('oiia-text-rotate-z');
        break;
      case 4:
        element.classList.add('oiia-text-rotate');
        break;
    }
  } else {
    // Remove all rotation classes
    element.classList.remove('oiia-text-rotate');
    element.classList.remove('oiia-text-rotate-x');
    element.classList.remove('oiia-text-rotate-y');
    element.classList.remove('oiia-text-rotate-z');
  }
  
  // Store the timeout ID so we can clear it later
  const timeoutId = setTimeout(() => {
    toggleTextRotation(element);
  }, getRandomInt(500, 3000)); // Random interval between 0.5 and 3 seconds
  
  // Store the timeout ID on the element for cleanup
  if (!element.oiiaTextTimeouts) {
    element.oiiaTextTimeouts = [];
  }
  element.oiiaTextTimeouts.push(timeoutId);
}

// Function to find all SVG elements
function findAllSvgElements() {
  // Get all SVG elements
  const svgElements = Array.from(document.querySelectorAll('svg, use, symbol, path, object[type="image/svg+xml"], embed[type="image/svg+xml"]'));
  
  return svgElements;
}

// Function to find all image elements, including those that might be missed by standard selectors
function findAllImageElements() {
  // Standard image elements - use a more comprehensive selector
  const standardImages = Array.from(document.querySelectorAll('img, [loading="lazy"][src], [aria-hidden="true"][src]'));
  
  // Look for images in iframes or shadow DOM
  const iframes = document.querySelectorAll('iframe');
  let iframeImages = [];
  
  for (const iframe of iframes) {
    try {
      // Try to access iframe content if it's same-origin
      if (iframe.contentDocument) {
        const images = Array.from(iframe.contentDocument.querySelectorAll('img'));
        iframeImages = [...iframeImages, ...images];
      }
    } catch (e) {
      // Cross-origin iframe, can't access content
      console.log('Could not access iframe content:', e);
    }
  }
  
  // Look for elements with background images - more comprehensive approach
  const elementsWithBackgroundImage = [];
  const allElements = document.querySelectorAll('*');
  
  for (const element of allElements) {
    try {
      // Skip elements we don't want to process
      if (element.tagName.toLowerCase() === 'html' || 
          element.tagName.toLowerCase() === 'head' ||
          element.classList.contains('oiia-body-effect') ||
          element.getAttribute('data-oiia-processed') === 'true') {
        continue;
      }
      
      // Get computed style
      const style = window.getComputedStyle(element);
      
      // Check for background-image
      if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.includes('url(')) {
        elementsWithBackgroundImage.push(element);
        continue;
      }
      
      // Check for background shorthand that might contain an image
      if (style.background && style.background.includes('url(')) {
        elementsWithBackgroundImage.push(element);
        continue;
      }
      
      // Check for CSS custom properties that might be used for backgrounds
      const customProps = ['--background', '--bg', '--background-image', '--bg-image'];
      for (const prop of customProps) {
        const value = style.getPropertyValue(prop);
        if (value && value.includes('url(')) {
          elementsWithBackgroundImage.push(element);
          break;
        }
      }
    } catch (e) {
      console.error('Error checking for background image:', e);
    }
  }
  
  return {
    standardImages,
    iframeImages,
    elementsWithBackgroundImage
  };
}

// Function to find all text elements on the page
function findAllTextElements() {
  // Get all elements in the document
  const allElements = document.querySelectorAll('*');
  const textElements = [];
  
  // Filter for elements that contain text nodes directly
  for (const element of allElements) {
    // Skip elements we don't want to process
    if (element.tagName.toLowerCase() === 'html' || 
        element.tagName.toLowerCase() === 'head' ||
        element.tagName.toLowerCase() === 'script' ||
        element.tagName.toLowerCase() === 'style' ||
        element.classList.contains('oiia-body-effect') ||
        element.getAttribute('data-oiia-processed') === 'true' ||
        element.classList.contains('oiia-image') ||
        element.classList.contains('oiia-video-container')) {
      continue;
    }
    
    // Check if the element has direct text content (not just from child elements)
    let hasText = false;
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
        hasText = true;
        break;
      }
    }
    
    // If it has text and is visible, add it to our list
    if (hasText) {
      const style = window.getComputedStyle(element);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        textElements.push(element);
      }
    }
  }
  
  return textElements;
}

// Function to find all heading elements
function findAllHeadings() {
  // Get all heading elements
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingElements = [];
  
  // Process headings
  for (const heading of headings) {
    // Skip headings that have already been processed
    if (heading.getAttribute('data-oiia-processed') === 'true' ||
        heading.classList.contains('oiia-text-rotate') ||
        heading.classList.contains('oiia-text-rotate-x') ||
        heading.classList.contains('oiia-text-rotate-y') ||
        heading.classList.contains('oiia-text-rotate-z')) {
      continue;
    }
    
    // If it's visible, add it to our list
    const style = window.getComputedStyle(heading);
    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
      headingElements.push(heading);
    }
  }
  
  return headingElements;
}

// Function to process text elements
function processTextElements() {
  const textElements = findAllTextElements();
  console.log(`OIIA: Found ${textElements.length} text elements to process`);
  
  for (const element of textElements) {
    if (!element.classList.contains('oiia-text-rotate')) {
      // Mark as processed
      element.setAttribute('data-oiia-processed', 'true');
      
      // Apply the rotation class
      element.classList.add('oiia-text-rotate');
      
      // Start the random rotation toggle
      toggleTextRotation(element);
    }
  }
  
  return textElements.length;
}

// Function to process heading elements
function processHeadings() {
  const headings = findAllHeadings();
  console.log(`OIIA: Found ${headings.length} heading elements to process`);
  
  for (const element of headings) {
    if (!element.classList.contains('oiia-text-rotate') && 
        !element.classList.contains('oiia-text-rotate-x') && 
        !element.classList.contains('oiia-text-rotate-y') && 
        !element.classList.contains('oiia-text-rotate-z')) {
      // Mark as processed
      element.setAttribute('data-oiia-processed', 'true');
      
      // Apply the rotation class - for headings, prioritize the full 3D random rotation for more dramatic effect
      const rotationType = getRandomInt(1, 4);
      switch (rotationType) {
        case 1:
        case 2:
          // Higher chance of full 3D rotation for headings
          element.classList.add('oiia-text-rotate');
          break;
        case 3:
          element.classList.add('oiia-text-rotate-x');
          break;
        case 4:
          element.classList.add('oiia-text-rotate-z');
          break;
      }
      
      // Start the random rotation toggle
      toggleTextRotation(element);
    }
  }
  
  return headings.length;
}

// Function to manually toggle text rotation on/off for a specific element
function manualToggleTextRotation(element) {
  if (element.classList.contains('oiia-text-rotate') || 
      element.classList.contains('oiia-text-rotate-x') || 
      element.classList.contains('oiia-text-rotate-y') || 
      element.classList.contains('oiia-text-rotate-z')) {
    // Remove all rotation classes
    element.classList.remove('oiia-text-rotate');
    element.classList.remove('oiia-text-rotate-x');
    element.classList.remove('oiia-text-rotate-y');
    element.classList.remove('oiia-text-rotate-z');
    
    // Clear any existing timeouts
    if (element.oiiaTextTimeouts) {
      element.oiiaTextTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      delete element.oiiaTextTimeouts;
    }
  } else {
    // Apply a random rotation class
    const rotationType = getRandomInt(1, 4);
    switch (rotationType) {
      case 1:
        element.classList.add('oiia-text-rotate-x');
        break;
      case 2:
        element.classList.add('oiia-text-rotate-y');
        break;
      case 3:
        element.classList.add('oiia-text-rotate-z');
        break;
      case 4:
        element.classList.add('oiia-text-rotate');
        break;
    }
    toggleTextRotation(element);
  }
}

// Function to find all links and buttons without children
function findAllLinksAndButtons() {
  // Get all links and buttons
  const allLinks = document.querySelectorAll('a');
  const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"], .btn, [role="button"]');
  
  const linksAndButtons = [];
  
  // Process links
  for (const link of allLinks) {
    // Skip links that have already been processed
    if (link.getAttribute('data-oiia-processed') === 'true' ||
        link.classList.contains('oiia-text-rotate') ||
        link.classList.contains('oiia-text-rotate-x') ||
        link.classList.contains('oiia-text-rotate-y') ||
        link.classList.contains('oiia-text-rotate-z')) {
      continue;
    }
    
    // Check if the link has no element children or only has text nodes
    let hasOnlyTextNodes = true;
    for (const child of link.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        hasOnlyTextNodes = false;
        break;
      }
    }
    
    // If it only has text nodes and is visible, add it to our list
    if (hasOnlyTextNodes && link.textContent.trim().length > 0) {
      const style = window.getComputedStyle(link);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        linksAndButtons.push(link);
      }
    }
  }
  
  // Process buttons
  for (const button of allButtons) {
    // Skip buttons that have already been processed
    if (button.getAttribute('data-oiia-processed') === 'true' ||
        button.classList.contains('oiia-text-rotate') ||
        button.classList.contains('oiia-text-rotate-x') ||
        button.classList.contains('oiia-text-rotate-y') ||
        button.classList.contains('oiia-text-rotate-z')) {
      continue;
    }
    
    // Check if the button has no element children or only has text nodes
    let hasOnlyTextNodes = true;
    for (const child of button.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        hasOnlyTextNodes = false;
        break;
      }
    }
    
    // If it only has text nodes and is visible, add it to our list
    if (hasOnlyTextNodes && button.textContent.trim().length > 0) {
      const style = window.getComputedStyle(button);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        linksAndButtons.push(button);
      }
    }
  }
  
  return linksAndButtons;
}

// Function to process links and buttons
function processLinksAndButtons() {
  const linksAndButtons = findAllLinksAndButtons();
  console.log(`OIIA: Found ${linksAndButtons.length} links and buttons to process`);
  
  for (const element of linksAndButtons) {
    if (!element.classList.contains('oiia-text-rotate') && 
        !element.classList.contains('oiia-text-rotate-x') && 
        !element.classList.contains('oiia-text-rotate-y') && 
        !element.classList.contains('oiia-text-rotate-z')) {
      // Mark as processed
      element.setAttribute('data-oiia-processed', 'true');
      
      // Apply the rotation class
      const rotationType = getRandomInt(1, 4);
      switch (rotationType) {
        case 1:
          element.classList.add('oiia-text-rotate-x');
          break;
        case 2:
          element.classList.add('oiia-text-rotate-y');
          break;
        case 3:
          element.classList.add('oiia-text-rotate-z');
          break;
        case 4:
          element.classList.add('oiia-text-rotate');
          break;
      }
      
      // Start the random rotation toggle
      toggleTextRotation(element);
    }
  }
  
  return linksAndButtons.length;
}

// Global flag to track if OIIA mode is active
var oiiaActive = window.oiiaActive || false;
window.oiiaActive = oiiaActive;

// Global MutationObserver to catch dynamically loaded elements
var domObserver = window.domObserver || null;
window.domObserver = domObserver;

// Function to set up the MutationObserver to catch dynamically loaded elements
function setupDynamicElementObserver() {
  // If observer already exists, disconnect it first
  if (domObserver) {
    domObserver.disconnect();
  }
  
  // Create a new observer
  domObserver = new MutationObserver((mutations) => {
    // Only process if OIIA mode is active
    if (!oiiaActive) return;
    
    let newElements = [];
    let elementsToRecheck = new Set();
    
    // Check each mutation
    mutations.forEach(mutation => {
      // If nodes were added
      if (mutation.type === 'childList') {
        // Check each added node
        mutation.addedNodes.forEach(node => {
          // If it's an element node
          if (node.nodeType === Node.ELEMENT_NODE) {
            // If it's an image, video, iframe, or SVG
            if (node.tagName && ['IMG', 'VIDEO', 'IFRAME', 'SVG'].includes(node.tagName.toUpperCase())) {
              if (!node.getAttribute('data-oiia-processed')) {
                newElements.push(node);
              }
            }
            
            // If it's a heading element
            if (node.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName.toUpperCase())) {
              if (!node.getAttribute('data-oiia-processed')) {
                const style = window.getComputedStyle(node);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                  // Apply rotation directly
                  node.setAttribute('data-oiia-processed', 'true');
                  // For headings, prioritize the full 3D random rotation
                  const rotationType = getRandomInt(1, 2) === 1 ? 4 : getRandomInt(1, 3);
                  switch (rotationType) {
                    case 1:
                      node.classList.add('oiia-text-rotate-x');
                      break;
                    case 2:
                      node.classList.add('oiia-text-rotate-y');
                      break;
                    case 3:
                      node.classList.add('oiia-text-rotate-z');
                      break;
                    case 4:
                      node.classList.add('oiia-text-rotate');
                      break;
                  }
                  toggleTextRotation(node);
                }
              }
            }
            
            // If it's a link or button without children
            if (node.tagName && ['A', 'BUTTON'].includes(node.tagName.toUpperCase())) {
              let hasOnlyTextNodes = true;
              for (const child of node.childNodes) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                  hasOnlyTextNodes = false;
                  break;
                }
              }
              
              if (hasOnlyTextNodes && node.textContent.trim().length > 0 && !node.getAttribute('data-oiia-processed')) {
                const style = window.getComputedStyle(node);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                  // Apply rotation directly
                  node.setAttribute('data-oiia-processed', 'true');
                  const rotationType = getRandomInt(1, 4);
                  switch (rotationType) {
                    case 1:
                      node.classList.add('oiia-text-rotate-x');
                      break;
                    case 2:
                      node.classList.add('oiia-text-rotate-y');
                      break;
                    case 3:
                      node.classList.add('oiia-text-rotate-z');
                      break;
                    case 4:
                      node.classList.add('oiia-text-rotate');
                      break;
                  }
                  toggleTextRotation(node);
                }
              }
            }
            
            // Also check for images, videos, iframes, and SVGs inside the added node
            try {
              const innerElements = node.querySelectorAll('img, [loading="lazy"][src], [aria-hidden="true"][src], video, iframe, svg, use, symbol, path, object[type="image/svg+xml"], embed[type="image/svg+xml"]');
              innerElements.forEach(el => {
                if (!el.getAttribute('data-oiia-processed')) {
                  newElements.push(el);
                }
              });
            } catch (e) {
              console.error('Error querying inner elements:', e);
            }
            
            // Check for elements with background images
            try {
              // Check the node itself for background images
              checkAndAddElementWithBackgroundImage(node, newElements);
              
              // Check all descendants for background images
              const allDescendants = node.querySelectorAll('*');
              allDescendants.forEach(descendant => {
                checkAndAddElementWithBackgroundImage(descendant, newElements);
              });
            } catch (e) {
              console.error('Error checking for background images:', e);
            }
          }
        });
      }
      
      // If attributes changed (could affect src, srcset, style, etc.)
      if (mutation.type === 'attributes') {
        const target = mutation.target;
        
        // Skip if already processed
        if (target.getAttribute('data-oiia-processed') === 'true') {
          return;
        }
        
        // If src or srcset attribute changed on an image
        if ((mutation.attributeName === 'src' || mutation.attributeName === 'srcset') && 
            target.tagName && target.tagName.toUpperCase() === 'IMG') {
          newElements.push(target);
        }
        
        // If style attribute changed, check for background images
        if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
          elementsToRecheck.add(target);
        }
        
        // If loading attribute was added (lazy loading)
        if (mutation.attributeName === 'loading' && target.hasAttribute('src')) {
          newElements.push(target);
        }
      }
    });
    
    // Process elements that had style or class changes to check for new background images
    if (elementsToRecheck.size > 0) {
      elementsToRecheck.forEach(element => {
        checkAndAddElementWithBackgroundImage(element, newElements);
      });
    }
    
    // If we found new elements, process them
    if (newElements.length > 0) {
      console.log(`OIIA: Found ${newElements.length} new elements to process`);
      processNewElements(newElements);
    }
  });
  
  // Start observing the entire document with all possible options
  domObserver.observe(document.documentElement, {
    childList: true,     // Watch for added/removed elements
    subtree: true,       // Watch the entire DOM tree
    attributes: true,    // Watch for attribute changes
    attributeFilter: ['src', 'srcset', 'style', 'class', 'loading', 'background', 'background-image'] // Only specific attributes
  });
  
  // Also set up a periodic check for any elements that might have been missed
  setInterval(() => {
    if (oiiaActive) {
      performFullPageScan();
    }
  }, 2000); // Check every 2 seconds
  
  console.log('OIIA: Dynamic element observer set up');
}

// Helper function to check if an element has a background image and add it to the list if not processed
function checkAndAddElementWithBackgroundImage(element, elementsList) {
  if (!element || !element.nodeType || element.nodeType !== Node.ELEMENT_NODE || 
      element.getAttribute('data-oiia-processed') === 'true' ||
      element.classList.contains('oiia-image') ||
      element.closest('.oiia-image') ||
      (element.parentNode && element.parentNode.classList.contains('oiia-video-container'))) {
    return;
  }
  
  try {
    const style = window.getComputedStyle(element);
    
    // Check for background-image
    if (style.backgroundImage && style.backgroundImage !== 'none' && 
        style.backgroundImage.includes('url(') && 
        !element.classList.contains('oiia-body-effect')) {
      elementsList.push(element);
      return;
    }
    
    // Check for background shorthand that might contain an image
    if (style.background && style.background.includes('url(')) {
      elementsList.push(element);
      return;
    }
    
    // Check for CSS custom properties that might be used for backgrounds
    const customProps = ['--background', '--bg', '--background-image', '--bg-image'];
    for (const prop of customProps) {
      const value = style.getPropertyValue(prop);
      if (value && value.includes('url(')) {
        elementsList.push(element);
        return;
      }
    }
  } catch (e) {
    console.error('Error checking element for background image:', e);
  }
}

// Function to perform a full page scan for any missed elements
function performFullPageScan() {
  console.log('OIIA: Performing full page scan for missed elements');
  
  // Get all unprocessed images
  const { standardImages, iframeImages, elementsWithBackgroundImage } = findAllImageElements();
  
  // Get all unprocessed videos and iframe elements
  const videoElements = Array.from(document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]'))
    .filter(el => !el.getAttribute('data-oiia-processed'));
  
  // Get all unprocessed SVG elements
  const svgElements = findAllSvgElements().filter(el => !el.getAttribute('data-oiia-processed'));
  
  // Process any unprocessed headings
  processHeadings();
  
  // Process any unprocessed links and buttons
  processLinksAndButtons();
  
  // Process any unprocessed text elements
  processTextElements();
  
  // Process any new elements
  let newElements = [
    ...standardImages,
    ...iframeImages,
    ...Array.from(elementsWithBackgroundImage),
    ...videoElements,
    ...svgElements
  ];
  
  if (newElements.length > 0) {
    console.log(`OIIA: Full page scan found ${newElements.length} new elements to process`);
    processNewElements(newElements);
  }
}

// Function to process newly added elements
function processNewElements(elements) {
  // Process each element
  elements.forEach(element => {
    try {
      if (!element || !element.tagName) return;
      
      const tagName = element.tagName.toLowerCase();
      
      // Skip if already processed
      if (element.getAttribute('data-oiia-processed') === 'true' ||
          element.classList.contains('oiia-image') ||
          element.closest('.oiia-image') ||
          (element.parentNode && element.parentNode.classList.contains('oiia-video-container'))) {
        return;
      }
      
      // Process based on element type
      if (tagName === 'img' || element.hasAttribute('src')) {
        processImage(element);
      } else if (tagName === 'video' || (tagName === 'iframe' && 
                (element.src && (element.src.includes('youtube') || element.src.includes('vimeo'))))) {
        processVideoOrIframe(element);
      } else if (tagName === 'svg' || ['use', 'symbol', 'path'].includes(tagName) || 
                (tagName === 'object' && element.type === 'image/svg+xml') ||
                (tagName === 'embed' && element.type === 'image/svg+xml')) {
        processSvgElement(element);
      } else {
        // Check if it has a background image
        const style = window.getComputedStyle(element);
        if (style.backgroundImage && style.backgroundImage !== 'none' && 
            style.backgroundImage.includes('url(') && 
            !element.classList.contains('oiia-body-effect')) {
          processBackgroundImage(element);
        }
      }
    } catch (e) {
      console.error('Error processing element:', e, element);
    }
  });
}

// Function to remove rgba background colors from all elements
function removeRgbaBackgrounds() {
  // Get all elements in the document
  const allElements = document.querySelectorAll('*');
  let count = 0;
  
  // Check each element for rgba background
  for (const element of allElements) {
    // Skip the body element as it has our special effect
    if (element === document.body || element.classList.contains('oiia-body-effect')) {
      continue;
    }
    
    // Get computed style
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    
    // Check if background color contains rgba
    if (backgroundColor && backgroundColor.includes('rgba(')) {
      // Store original background color for restoration if needed
      if (!element.hasAttribute('data-oiia-original-bg')) {
        element.setAttribute('data-oiia-original-bg', backgroundColor);
      }
      
      // Remove the background color
      element.style.backgroundColor = 'transparent';
      count++;
    }
  }
  
  console.log(`OIIA: Removed rgba backgrounds from ${count} elements`);
  return count;
}

// Function to restore rgba backgrounds when deactivating
function restoreRgbaBackgrounds() {
  // Get all elements with our data attribute
  const elementsToRestore = document.querySelectorAll('[data-oiia-original-bg]');
  let count = 0;
  
  // Restore each element's background
  for (const element of elementsToRestore) {
    const originalBg = element.getAttribute('data-oiia-original-bg');
    if (originalBg) {
      element.style.backgroundColor = originalBg;
      count++;
    }
    // Remove our data attribute
    element.removeAttribute('data-oiia-original-bg');
  }
  
  console.log(`OIIA: Restored rgba backgrounds to ${count} elements`);
  return count;
}

// Function to replace elements with OIIA images
function replaceElementsWithOIIA() {
  // Inject the styles for rotation and strobing background
  injectStyles();
  
  // Apply the strobing gradient background to the body
  applyBodyEffect();
  
  // Remove rgba backgrounds from all elements
  removeRgbaBackgrounds();
  
  // Start playing the OIIA audio
  playOiiaAudio();
  
  // Set the global flag to indicate OIIA mode is active
  oiiaActive = true;
  
  // Set up the MutationObserver to catch dynamically loaded elements
  setupDynamicElementObserver();
  
  // Find all types of images
  const { standardImages, iframeImages, elementsWithBackgroundImage } = findAllImageElements();
  
  console.log(`OIIA: Found ${standardImages.length} standard images, ${iframeImages.length} iframe images, and ${elementsWithBackgroundImage.length} elements with background images`);
  
  // Get videos and iframe elements
  const videoElements = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
  
  // Get all SVG elements using our specialized function
  const svgElements = findAllSvgElements();
  
  // If there are no elements, return
  if (standardImages.length === 0 && videoElements.length === 0 && 
      svgElements.length === 0 && iframeImages.length === 0 && 
      elementsWithBackgroundImage.length === 0) {
    console.log('OIIA: No elements found to replace');
    return 0;
  }
  
  // Replace ALL elements
  let numReplaced = 0;
  
  // Replace all standard images
  for (const imgElement of standardImages) {
    if (processImage(imgElement)) {
      numReplaced++;
    }
  }
  
  // Replace all iframe images (if accessible)
  for (const imgElement of iframeImages) {
    if (processImage(imgElement)) {
      numReplaced++;
    }
  }
  
  // Replace elements with background images
  for (const element of elementsWithBackgroundImage) {
    if (processBackgroundImage(element)) {
      numReplaced++;
    }
  }
  
  // Replace all video elements
  for (let i = 0; i < videoElements.length; i++) {
    // Get the element to replace
    const elementToReplace = videoElements[i];
    
    if (processVideoOrIframe(elementToReplace)) {
      numReplaced++;
    }
  }
  
  // Replace all SVG elements
  for (let i = 0; i < svgElements.length; i++) {
    const svgElement = svgElements[i];
    
    if (processSvgElement(svgElement)) {
      numReplaced++;
    }
  }
  
  // Additional fallback to catch any missed images
  const allPossibleImages = document.querySelectorAll('[src]');
  for (const element of allPossibleImages) {
    // Skip non-image elements and already processed elements
    if (element.tagName.toLowerCase() !== 'img' || 
        element.getAttribute('data-oiia-processed') === 'true' ||
        element.classList.contains('oiia-image')) {
      continue;
    }
    
    // Process any missed images
    if (processImage(element)) {
      numReplaced++;
    }
  }
  
  // Process all heading elements
  const numHeadings = processHeadings();
  console.log(`OIIA: Processed ${numHeadings} heading elements`);
  
  // Process all text elements
  const numTextElements = processTextElements();
  console.log(`OIIA: Processed ${numTextElements} text elements`);
  
  // Process all links and buttons without children
  const numLinksAndButtons = processLinksAndButtons();
  console.log(`OIIA: Processed ${numLinksAndButtons} links and buttons`);
  
  console.log(`OIIA: Replaced ${numReplaced} elements`);
  
  // Return the number of elements replaced
  return numReplaced;
}

// Function to disable OIIA mode
function disableOIIA() {
  // Set the global flag to indicate OIIA mode is inactive
  oiiaActive = false;
  
  // Disconnect the MutationObserver
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
  
  // Stop the audio
  stopOiiaAudio();
  
  // Remove the body effect
  document.body.classList.remove('oiia-body-effect');
  
  // Restore original backgrounds
  document.querySelectorAll('[data-original-background], [data-original-background-image], [data-computed-background-image]').forEach(element => {
    try {
      // If we have the computed background image, use that for restoration
      if (element.hasAttribute('data-computed-background-image') && 
          element.getAttribute('data-computed-background-image') !== 'none') {
        element.style.backgroundImage = element.getAttribute('data-computed-background-image');
      }
      
      // If we have the original background, restore that
      if (element.hasAttribute('data-original-background') && 
          element.getAttribute('data-original-background')) {
        element.style.background = element.getAttribute('data-original-background');
      }
      
      // If we have the original background image, restore that
      if (element.hasAttribute('data-original-background-image') && 
          element.getAttribute('data-original-background-image')) {
        element.style.backgroundImage = element.getAttribute('data-original-background-image');
      }
      
      // Remove all data attributes
      element.removeAttribute('data-original-background');
      element.removeAttribute('data-original-background-image');
      element.removeAttribute('data-original-background-color');
      element.removeAttribute('data-computed-background-image');
    } catch (e) {
      console.error('Error restoring background:', e);
    }
  });
  
  // Remove background overlays
  document.querySelectorAll('.oiia-background-overlay').forEach(overlay => {
    overlay.remove();
  });
  
  // Restore original images
  document.querySelectorAll('.oiia-image').forEach(img => {
    if (img.hasAttribute('data-original-src')) {
      img.src = img.getAttribute('data-original-src');
      img.removeAttribute('data-original-src');
    }
    if (img.hasAttribute('data-original-srcset')) {
      img.srcset = img.getAttribute('data-original-srcset');
      img.removeAttribute('data-original-srcset');
    }
    if (img.hasAttribute('data-original-sizes')) {
      img.sizes = img.getAttribute('data-original-sizes');
      img.removeAttribute('data-original-sizes');
    }
    img.classList.remove('oiia-image');
    img.classList.remove('oiia-rotate');
  });
  
  // Remove data-oiia-processed attributes
  document.querySelectorAll('[data-oiia-processed]').forEach(element => {
    element.removeAttribute('data-oiia-processed');
  });
  
  // Remove video overlays
  document.querySelectorAll('.oiia-video-container').forEach(container => {
    const video = container.querySelector('video, iframe');
    if (video) {
      container.parentNode.insertBefore(video, container);
      container.remove();
    }
  });
  
  // Remove text rotation
  document.querySelectorAll('.oiia-text-rotate, .oiia-text-rotate-x, .oiia-text-rotate-y, .oiia-text-rotate-z').forEach(element => {
    element.classList.remove('oiia-text-rotate');
    element.classList.remove('oiia-text-rotate-x');
    element.classList.remove('oiia-text-rotate-y');
    element.classList.remove('oiia-text-rotate-z');
    if (element.oiiaTextTimeouts) {
      element.oiiaTextTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      delete element.oiiaTextTimeouts;
    }
  });
  
  // Restore rgba backgrounds
  restoreRgbaBackgrounds();
  
  console.log('OIIA mode disabled');
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'replaceWithOIIA') {
    // Replace elements with OIIA images
    const numReplaced = replaceElementsWithOIIA();
    
    // Send response back to the popup
    sendResponse({ success: true, numReplaced: numReplaced });
  } else if (message.action === 'disableOIIA') {
    // Disable OIIA mode
    disableOIIA();
    
    // Send response back to the popup
    sendResponse({ success: true });
  } else if (message.action === 'toggleTextRotation') {
    // Toggle text rotation for elements containing the specified text
    if (message.text) {
      const textElements = findAllTextElements();
      let found = false;
      
      for (const element of textElements) {
        if (element.textContent.includes(message.text)) {
          manualToggleTextRotation(element);
          found = true;
        }
      }
      
      sendResponse({ success: true, found: found });
    } else {
      sendResponse({ success: false, error: 'No text specified' });
    }
  }
  
  // Return true to indicate that the response will be sent asynchronously
  return true;
});

// Function to process an image element
function processImage(imgElement) {
  // Skip if this is already an OIIA image or has been processed
  if (imgElement.classList.contains('oiia-image') || 
      imgElement.getAttribute('data-oiia-processed') === 'true') {
    return false;
  }
  
  // Mark as processed
  imgElement.setAttribute('data-oiia-processed', 'true');
  
  try {
    // Save the original src and srcset
    const originalSrc = imgElement.src || '';
    const originalSrcset = imgElement.srcset || '';
    
    // Get the URL for the OIIA image
    const oiiaImageUrl = chrome.runtime.getURL('public/oiia.png');
    
    // Change the image source
    imgElement.src = oiiaImageUrl;
    
    // Instead of just clearing srcset, replace it with our OIIA image
    // This ensures the browser won't try to use any of the original responsive images
    imgElement.srcset = `${oiiaImageUrl} 1x, ${oiiaImageUrl} 2x, ${oiiaImageUrl} 3x`;
    
    // Also set sizes attribute to ensure proper rendering
    if (imgElement.hasAttribute('sizes')) {
      imgElement.setAttribute('data-original-sizes', imgElement.getAttribute('sizes'));
    }
    imgElement.sizes = '100vw'; // Make it responsive to viewport width
    
    // Store original values as data attributes for potential restoration
    if (originalSrc) {
      imgElement.setAttribute('data-original-src', originalSrc);
    }
    if (originalSrcset) {
      imgElement.setAttribute('data-original-srcset', originalSrcset);
    }
    imgElement.classList.add('oiia-image');
    
    // Start the random rotation toggle for this image
    toggleRotation(imgElement);
    
    return true;
  } catch (e) {
    console.error('Error processing image:', e);
    return false;
  }
}

// Function to process a video or iframe element
function processVideoOrIframe(element) {
  // Skip if this video already has an OIIA overlay
  if (element.parentNode.classList.contains('oiia-video-container') ||
      element.getAttribute('data-oiia-processed') === 'true') {
    return false;
  }
  
  // Mark as processed
  element.setAttribute('data-oiia-processed', 'true');
  
  // Get the dimensions of the video
  const rect = element.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  // Create a container to wrap the video
  const container = document.createElement('div');
  container.className = 'oiia-video-container';
  container.style.width = width + 'px';
  container.style.height = height + 'px';
  
  // Create an overlay for the OIIA image
  const overlay = document.createElement('div');
  overlay.className = 'oiia-video-overlay';
  
  // Create the OIIA image
  const imgElement = document.createElement('img');
  imgElement.src = chrome.runtime.getURL('public/oiia.png');
  imgElement.style.maxWidth = '80%';
  imgElement.style.maxHeight = '80%';
  imgElement.alt = 'OIIA';
  imgElement.className = 'oiia-image';
  
  // Add the image to the overlay
  overlay.appendChild(imgElement);
  
  // Try to pause the video if it's playing
  if (element.tagName.toLowerCase() === 'video' && !element.paused) {
    try {
      element.pause();
    } catch (e) {
      console.error('Could not pause video:', e);
    }
  }
  
  // Insert the container before the video
  element.parentNode.insertBefore(container, element);
  
  // Move the video into the container
  container.appendChild(element);
  
  // Add the overlay to the container
  container.appendChild(overlay);
  
  // Start the random rotation toggle for this image
  toggleRotation(imgElement);
  
  return true;
}

// Function to process an SVG element
function processSvgElement(svgElement) {
  // Skip if this SVG has already been processed
  if (svgElement.getAttribute('data-oiia-processed') === 'true' || 
      !svgElement.parentNode || // Skip if no parent node (might be detached)
      svgElement.closest('.oiia-image')) { // Skip if inside an OIIA image
    return false;
  }
  
  // Mark as processed to avoid duplicates
  svgElement.setAttribute('data-oiia-processed', 'true');
  
  // Get dimensions
  const svgRect = svgElement.getBoundingClientRect();
  
  // Skip very small SVGs (likely decorative or part of larger SVGs)
  if (svgRect.width < 10 || svgRect.height < 10) {
    return false;
  }
  
  // Create a container for the new image
  const container = document.createElement('div');
  container.style.display = 'inline-block';
  container.style.width = svgRect.width + 'px';
  container.style.height = svgRect.height + 'px';
  
  // Create an image element
  const imgElement = document.createElement('img');
  imgElement.src = chrome.runtime.getURL('public/oiia.png');
  imgElement.style.maxWidth = '100%';
  imgElement.style.height = 'auto';
  imgElement.alt = 'OIIA';
  imgElement.className = 'oiia-image';
  
  // Add the image to the container
  container.appendChild(imgElement);
  
  // Replace the SVG with the container if possible
  try {
    if (svgElement.tagName.toLowerCase() === 'svg') {
      svgElement.parentNode.replaceChild(container, svgElement);
    } else {
      // For other SVG-related elements, try to replace or hide them
      const parent = svgElement.parentNode;
      if (parent && parent.tagName.toLowerCase() !== 'svg') {
        // If parent is not an SVG, we can replace it
        parent.insertBefore(container, svgElement);
        svgElement.style.display = 'none';
      }
    }
    
    // Start the random rotation toggle for this image
    toggleRotation(imgElement);
    
    return true;
  } catch (e) {
    console.error('Could not replace SVG element:', e);
    return false;
  }
}

// Function to process an element with a background image
function processBackgroundImage(element) {
  // Skip if already processed
  if (element.getAttribute('data-oiia-processed') === 'true') {
    return false;
  }
  
  // Mark as processed
  element.setAttribute('data-oiia-processed', 'true');
  
  try {
    // Get computed style to ensure we capture the actual background
    const computedStyle = window.getComputedStyle(element);
    
    // Save original background properties
    const originalBackground = element.style.background || '';
    const originalBackgroundImage = element.style.backgroundImage || '';
    const originalBackgroundColor = element.style.backgroundColor || '';
    
    // Store original values for potential restoration
    element.setAttribute('data-original-background', originalBackground);
    element.setAttribute('data-original-background-image', originalBackgroundImage);
    element.setAttribute('data-original-background-color', originalBackgroundColor);
    element.setAttribute('data-computed-background-image', computedStyle.backgroundImage);
    
    // Create a container if needed
    let container = element;
    
    // If the element has children, create a relative container
    if (element.children.length > 0 && computedStyle.position === 'static') {
      element.style.position = 'relative';
    }
    
    // Create an overlay with the OIIA image
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '9999';
    overlay.classList.add('oiia-background-overlay');
    
    // Create the OIIA image
    const imgElement = document.createElement('img');
    imgElement.src = chrome.runtime.getURL('public/oiia.png');
    imgElement.style.maxWidth = '80%';
    imgElement.style.maxHeight = '80%';
    imgElement.alt = 'OIIA';
    imgElement.className = 'oiia-image';
    
    // Add the image to the overlay
    overlay.appendChild(imgElement);
    
    // Add the overlay to the container
    container.appendChild(overlay);
    
    // Remove all background images
    element.style.backgroundImage = 'none';
    
    // If background shorthand is used, we need to preserve color but remove image
    if (computedStyle.background.includes('url(')) {
      // Extract background color if present
      const bgColor = computedStyle.backgroundColor;
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        element.style.background = bgColor;
      } else {
        element.style.background = 'none';
      }
    }
    
    // Start the random rotation toggle for this image
    toggleRotation(imgElement);
    
    return true;
  } catch (e) {
    console.error('Error processing background image:', e);
    return false;
  }
}

// Function to set up the MutationObserver to catch dynamically loaded elements
function setupDynamicElementObserver() {
  // If observer already exists, disconnect it first
  if (domObserver) {
    domObserver.disconnect();
  }
  
  // Create a new observer
  domObserver = new MutationObserver((mutations) => {
    // Only process if OIIA mode is active
    if (!oiiaActive) return;
    
    let newElements = [];
    let elementsToRecheck = new Set();
    let newElementsWithRgbaBackground = [];
    
    // Check each mutation
    mutations.forEach(mutation => {
      // If nodes were added
      if (mutation.type === 'childList') {
        // Check each added node
        mutation.addedNodes.forEach(node => {
          // If it's an element node
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for rgba background
            try {
              const style = window.getComputedStyle(node);
              const backgroundColor = style.backgroundColor;
              
              if (backgroundColor && backgroundColor.includes('rgba(') && 
                  node !== document.body && !node.classList.contains('oiia-body-effect')) {
                newElementsWithRgbaBackground.push(node);
              }
              
              // Also check all descendants for rgba backgrounds
              const allDescendants = node.querySelectorAll('*');
              allDescendants.forEach(descendant => {
                if (descendant !== document.body && !descendant.classList.contains('oiia-body-effect')) {
                  const descendantStyle = window.getComputedStyle(descendant);
                  const descendantBgColor = descendantStyle.backgroundColor;
                  
                  if (descendantBgColor && descendantBgColor.includes('rgba(')) {
                    newElementsWithRgbaBackground.push(descendant);
                  }
                }
              });
            } catch (e) {
              console.error('Error checking for rgba backgrounds:', e);
            }
            
            // If it's an image, video, iframe, or SVG
            if (node.tagName && ['IMG', 'VIDEO', 'IFRAME', 'SVG'].includes(node.tagName.toUpperCase())) {
              if (!node.getAttribute('data-oiia-processed')) {
                newElements.push(node);
              }
            }
            
            // If it's a heading element
            if (node.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName.toUpperCase())) {
              if (!node.getAttribute('data-oiia-processed')) {
                const style = window.getComputedStyle(node);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                  // Apply rotation directly
                  node.setAttribute('data-oiia-processed', 'true');
                  // For headings, prioritize the full 3D random rotation
                  const rotationType = getRandomInt(1, 2) === 1 ? 4 : getRandomInt(1, 3);
                  switch (rotationType) {
                    case 1:
                      node.classList.add('oiia-text-rotate-x');
                      break;
                    case 2:
                      node.classList.add('oiia-text-rotate-y');
                      break;
                    case 3:
                      node.classList.add('oiia-text-rotate-z');
                      break;
                    case 4:
                      node.classList.add('oiia-text-rotate');
                      break;
                  }
                  toggleTextRotation(node);
                }
              }
            }
            
            // If it's a link or button without children
            if (node.tagName && ['A', 'BUTTON'].includes(node.tagName.toUpperCase())) {
              let hasOnlyTextNodes = true;
              for (const child of node.childNodes) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                  hasOnlyTextNodes = false;
                  break;
                }
              }
              
              if (hasOnlyTextNodes && node.textContent.trim().length > 0 && !node.getAttribute('data-oiia-processed')) {
                const style = window.getComputedStyle(node);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                  // Apply rotation directly
                  node.setAttribute('data-oiia-processed', 'true');
                  const rotationType = getRandomInt(1, 4);
                  switch (rotationType) {
                    case 1:
                      node.classList.add('oiia-text-rotate-x');
                      break;
                    case 2:
                      node.classList.add('oiia-text-rotate-y');
                      break;
                    case 3:
                      node.classList.add('oiia-text-rotate-z');
                      break;
                    case 4:
                      node.classList.add('oiia-text-rotate');
                      break;
                  }
                  toggleTextRotation(node);
                }
              }
            }
            
            // Also check for images, videos, iframes, and SVGs inside the added node
            try {
              const innerElements = node.querySelectorAll('img, [loading="lazy"][src], [aria-hidden="true"][src], video, iframe, svg, use, symbol, path, object[type="image/svg+xml"], embed[type="image/svg+xml"]');
              innerElements.forEach(el => {
                if (!el.getAttribute('data-oiia-processed')) {
                  newElements.push(el);
                }
              });
            } catch (e) {
              console.error('Error querying inner elements:', e);
            }
            
            // Check for elements with background images
            try {
              // Check the node itself for background images
              checkAndAddElementWithBackgroundImage(node, newElements);
              
              // Check all descendants for background images
              const allDescendants = node.querySelectorAll('*');
              allDescendants.forEach(descendant => {
                checkAndAddElementWithBackgroundImage(descendant, newElements);
              });
            } catch (e) {
              console.error('Error checking for background images:', e);
            }
          }
        });
      }
      
      // If attributes changed (could affect src, srcset, style, etc.)
      if (mutation.type === 'attributes') {
        const target = mutation.target;
        
        // Skip if already processed
        if (target.getAttribute('data-oiia-processed') === 'true') {
          return;
        }
        
        // If src or srcset attribute changed on an image
        if ((mutation.attributeName === 'src' || mutation.attributeName === 'srcset') && 
            target.tagName && target.tagName.toUpperCase() === 'IMG') {
          newElements.push(target);
        }
        
        // If style attribute changed, check for background images and rgba backgrounds
        if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
          elementsToRecheck.add(target);
          
          // Check for rgba background
          try {
            if (target !== document.body && !target.classList.contains('oiia-body-effect')) {
              const style = window.getComputedStyle(target);
              const backgroundColor = style.backgroundColor;
              
              if (backgroundColor && backgroundColor.includes('rgba(')) {
                newElementsWithRgbaBackground.push(target);
              }
            }
          } catch (e) {
            console.error('Error checking for rgba background:', e);
          }
        }
        
        // If loading attribute was added (lazy loading)
        if (mutation.attributeName === 'loading' && target.hasAttribute('src')) {
          newElements.push(target);
        }
      }
    });
    
    // Process elements that had style or class changes to check for new background images
    if (elementsToRecheck.size > 0) {
      elementsToRecheck.forEach(element => {
        checkAndAddElementWithBackgroundImage(element, newElements);
      });
    }
    
    // Process elements with rgba backgrounds
    if (newElementsWithRgbaBackground.length > 0) {
      for (const element of newElementsWithRgbaBackground) {
        const style = window.getComputedStyle(element);
        const backgroundColor = style.backgroundColor;
        
        if (backgroundColor && backgroundColor.includes('rgba(')) {
          // Store original background color for restoration if needed
          if (!element.hasAttribute('data-oiia-original-bg')) {
            element.setAttribute('data-oiia-original-bg', backgroundColor);
          }
          
          // Remove the background color
          element.style.backgroundColor = 'transparent';
        }
      }
      console.log(`OIIA: Removed rgba backgrounds from ${newElementsWithRgbaBackground.length} new elements`);
    }
    
    // If we found new elements, process them
    if (newElements.length > 0) {
      console.log(`OIIA: Found ${newElements.length} new elements to process`);
      processNewElements(newElements);
    }
  });
  
  // Start observing the entire document with all possible options
  domObserver.observe(document.documentElement, {
    childList: true,     // Watch for added/removed elements
    subtree: true,       // Watch the entire DOM tree
    attributes: true,    // Watch for attribute changes
    attributeFilter: ['src', 'srcset', 'style', 'class', 'loading', 'background', 'background-image'] // Only specific attributes
  });
  
  // Also set up a periodic check for any elements that might have been missed
  setInterval(() => {
    if (oiiaActive) {
      performFullPageScan();
    }
  }, 2000); // Check every 2 seconds
  
  console.log('OIIA: Dynamic element observer set up');
}
