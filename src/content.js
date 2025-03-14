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
    
    .oiia-rotate {
      animation: oiia-rotate-y 0.3s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
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
      animation: oiia-strobe-background 2s linear infinite !important;
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
    if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.includes('url(')) {
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
  
  // Find all types of images
  const { standardImages, iframeImages, elementsWithBackgroundImage } = findAllImageElements();
  
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
  
  console.log(`OIIA: Replaced ${numReplaced} elements`);
  
  // Return the number of elements replaced
  return numReplaced;
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

// Function to replace elements with OIIA images
function replaceElementsWithOIIA() {
  // Inject the styles for rotation and strobing background
  injectStyles();
  
  // Apply the strobing gradient background to the body
  applyBodyEffect();
  
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
  }
  
  // Return true to indicate that the response will be sent asynchronously
  return true;
});
