// Content script that runs in the context of web pages
// This script can interact with the web page's DOM

// Global variables - consolidated at the top to avoid duplicate declarations
let oiiaActive = false;
let domObserver = null;
let audioElement = null;
let catInterval = null;
let catImages = [];

// Function to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to create and play the OIIA audio
function playOiiaAudio() {
  // Check if audio already exists
  if (audioElement) {
    // If it exists but is not playing, play it
    if (audioElement.paused) {
      audioElement.play();
    }
    return;
  }
  
  // Create new audio element
  audioElement = new Audio(chrome.runtime.getURL('public/oiia.mp3'));
  audioElement.loop = true; // Set to loop continuously
  
  // Add event listeners for error handling
  audioElement.addEventListener('error', (e) => {
    console.error('Error playing OIIA audio:', e);
  });
  
  // Start playing
  audioElement.play().catch(e => {
    console.error('Could not play OIIA audio automatically:', e);
    // Many browsers require user interaction before playing audio
    // We'll add a one-time click handler to the document to try again
    const playOnClick = () => {
      audioElement.play().catch(err => console.error('Still could not play audio:', err));
      document.removeEventListener('click', playOnClick);
    };
    document.addEventListener('click', playOnClick);
  });
}

// Function to stop the OIIA audio
function stopOiiaAudio() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
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
      0% { transform: rotate3d(0, 1, 0, 0deg) scale(1); }
      25% { transform: rotate3d(0, 1, 0, 90deg) scale(1.1); }
      50% { transform: rotate3d(0, 1, 0, 180deg) scale(0.9); }
      75% { transform: rotate3d(0, 1, 0, 270deg) scale(1.1); }
      100% { transform: rotate3d(0, 1, 0, 360deg) scale(1); }
    }
    
    @keyframes oiia-rotate-x {
      0% { transform: rotate3d(1, 0, 0, 0deg) scale(1); }
      25% { transform: rotate3d(1, 0, 0, 90deg) scale(1.1); }
      50% { transform: rotate3d(1, 0, 0, 180deg) scale(0.95); }
      75% { transform: rotate3d(1, 0, 0, 270deg) scale(1.05); }
      100% { transform: rotate3d(1, 0, 0, 360deg) scale(1); }
    }
    
    @keyframes oiia-rotate-z {
      0% { transform: rotate3d(0, 0, 1, 0deg) scale(1); }
      25% { transform: rotate3d(0, 0, 1, 90deg) scale(1.1); }
      50% { transform: rotate3d(0, 0, 1, 180deg) scale(0.9); }
      75% { transform: rotate3d(0, 0, 1, 270deg) scale(1.05); }
      100% { transform: rotate3d(0, 0, 1, 360deg) scale(1); }
    }
    
    @keyframes oiia-rotate-random {
      0% { transform: rotate3d(1, 1, 1, 0deg) scale(1); }
      20% { transform: rotate3d(1, 0.5, 0.3, 72deg) scale(1.15); }
      40% { transform: rotate3d(0.2, 1, 0.4, 144deg) scale(0.9); }
      60% { transform: rotate3d(0.5, 0.2, 1, 216deg) scale(1.1); }
      80% { transform: rotate3d(0.8, 0.8, 0.2, 288deg) scale(0.95); }
      100% { transform: rotate3d(1, 1, 1, 360deg) scale(1); }
    }
    
    @keyframes oiia-pulse-scale {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    
    @keyframes oiia-crazy-scale {
      0% { transform: scale(1) rotate(0deg); }
      20% { transform: scale(1.2) rotate(72deg); }
      40% { transform: scale(0.9) rotate(144deg); }
      60% { transform: scale(1.1) rotate(216deg); }
      80% { transform: scale(0.95) rotate(288deg); }
      100% { transform: scale(1) rotate(360deg); }
    }
    
    .oiia-rotate {
      animation: oiia-rotate-y 0.8s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
    }
    
    .oiia-text-rotate {
      animation: oiia-rotate-random 1.2s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
      display: inline-block;
    }
    
    .oiia-text-rotate-x {
      animation: oiia-rotate-x 1s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
      display: inline-block;
    }
    
    .oiia-text-rotate-y {
      animation: oiia-rotate-y 0.9s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
      display: inline-block;
    }
    
    .oiia-text-rotate-z {
      animation: oiia-rotate-z 1.1s linear infinite;
      transform-style: preserve-3d;
      backface-visibility: visible;
      display: inline-block;
    }
    
    .oiia-pulse-scale {
      animation: oiia-pulse-scale 1.5s ease-in-out infinite;
      display: inline-block;
    }
    
    .oiia-crazy-scale {
      animation: oiia-crazy-scale 1.8s linear infinite;
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
    
    .oiia-cat-image {
      position: fixed !important;
      z-index: 9999 !important;
      pointer-events: none !important;
      transition: all 0.5s ease !important;
      transform-origin: center center !important;
      max-width: 150px !important;
      max-height: 150px !important;
    }
    
    @keyframes oiia-cat-scale {
      0% { transform: rotate3d(0, 1, 0, 0deg) scale(1); }
      20% { transform: rotate3d(0, 1, 0, 72deg) scale(1.8); }
      40% { transform: rotate3d(0, 1, 0, 144deg) scale(0.5); }
      60% { transform: rotate3d(0, 1, 0, 216deg) scale(1.6); }
      80% { transform: rotate3d(0, 1, 0, 288deg) scale(0.7); }
      100% { transform: rotate3d(0, 1, 0, 360deg) scale(1); }
    }
    
    @keyframes oiia-cat-bounce {
      0% { transform: scale(1) translateY(0); }
      25% { transform: scale(1.4) translateY(-20px); }
      50% { transform: scale(0.8) translateY(0); }
      75% { transform: scale(1.2) translateY(-10px); }
      100% { transform: scale(1) translateY(0); }
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
  try {
    // Skip if already processed for rotation
    if (element.getAttribute('data-oiia-rotation-processed') === 'true') {
      return;
    }
    
    // Mark as processed for rotation
    element.setAttribute('data-oiia-rotation-processed', 'true');
    
    // Apply random animation duration for varied effect
    const animationDuration = (Math.random() * 0.4 + 0.2).toFixed(2); // Between 0.2s and 0.6s
    element.style.animationDuration = `${animationDuration}s`;
    
    // Randomly choose animation direction
    if (Math.random() > 0.5) {
      element.style.animationDirection = 'alternate';
    }
    
    // Apply random transform origin for more chaotic effect
    const origins = ['center center', 'top left', 'top right', 'bottom left', 'bottom right', 'center top', 'center bottom'];
    const randomOrigin = origins[Math.floor(Math.random() * origins.length)];
    element.style.transformOrigin = randomOrigin;
    
    // Randomly decide what type of effect to apply
    const effectType = Math.random();
    
    // Remove any existing animation classes
    element.classList.remove('oiia-text-rotate');
    element.classList.remove('oiia-text-rotate-x');
    element.classList.remove('oiia-text-rotate-y');
    element.classList.remove('oiia-text-rotate-z');
    element.classList.remove('oiia-pulse-scale');
    element.classList.remove('oiia-crazy-scale');
    
    if (effectType < 0.6) { // 60% chance for rotation with scale
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
    } else if (effectType < 0.8) { // 20% chance for pulse scale
      element.classList.add('oiia-pulse-scale');
    } else if (effectType < 0.95) { // 15% chance for crazy scale
      element.classList.add('oiia-crazy-scale');
    } // 5% chance for no effect (brief pause)
    
    // Store the timeout ID so we can clear it later
    const timeoutId = setTimeout(() => {
      toggleTextRotation(element);
    }, getRandomInt(500, 3000)); // Random interval between 0.5 and 3 seconds
    
    // Store the timeout ID on the element for cleanup
    if (!element.oiiaTextTimeouts) {
      element.oiiaTextTimeouts = [];
    }
    element.oiiaTextTimeouts.push(timeoutId);
  } catch (e) {
    console.error('Error toggling text rotation:', e);
  }
}

// Helper function to safely check if an element has a class
function hasClass(element, className) {
  return element && element.classList && element.classList.contains(className);
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
          hasClass(element, 'oiia-body-effect') ||
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
        hasClass(element, 'oiia-body-effect') ||
        element.getAttribute('data-oiia-processed') === 'true' ||
        hasClass(element, 'oiia-image') ||
        hasClass(element, 'oiia-video-container')) {
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
        hasClass(heading, 'oiia-text-rotate') ||
        hasClass(heading, 'oiia-text-rotate-x') ||
        hasClass(heading, 'oiia-text-rotate-y') ||
        hasClass(heading, 'oiia-text-rotate-z')) {
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
    if (!hasClass(element, 'oiia-text-rotate')) {
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
    if (!hasClass(element, 'oiia-text-rotate') && 
        !hasClass(element, 'oiia-text-rotate-x') && 
        !hasClass(element, 'oiia-text-rotate-y') && 
        !hasClass(element, 'oiia-text-rotate-z')) {
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
  if (hasClass(element, 'oiia-text-rotate') || 
      hasClass(element, 'oiia-text-rotate-x') || 
      hasClass(element, 'oiia-text-rotate-y') || 
      hasClass(element, 'oiia-text-rotate-z')) {
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
        hasClass(link, 'oiia-text-rotate') ||
        hasClass(link, 'oiia-text-rotate-x') ||
        hasClass(link, 'oiia-text-rotate-y') ||
        hasClass(link, 'oiia-text-rotate-z')) {
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
        hasClass(button, 'oiia-text-rotate') ||
        hasClass(button, 'oiia-text-rotate-x') ||
        hasClass(button, 'oiia-text-rotate-y') ||
        hasClass(button, 'oiia-text-rotate-z')) {
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
    if (!hasClass(element, 'oiia-text-rotate') && 
        !hasClass(element, 'oiia-text-rotate-x') && 
        !hasClass(element, 'oiia-text-rotate-y') && 
        !hasClass(element, 'oiia-text-rotate-z')) {
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

// Function to add a random cat image to the page
function addRandomCat() {
  try {
    // Create a new image element
    const catImage = document.createElement('img');
    
    // Set random position (avoiding edges)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxWidth = viewportWidth - 150;
    const maxHeight = viewportHeight - 150;
    
    const left = Math.floor(Math.random() * maxWidth);
    const top = Math.floor(Math.random() * maxHeight);
    
    // Set attributes
    catImage.className = 'oiia-cat-image';
    catImage.style.left = `${left}px`;
    catImage.style.top = `${top}px`;
    
    // Apply random animation duration for varied scaling effect
    const animationDuration = (Math.random() * 0.3 + 0.1).toFixed(2); // Between 0.1s and 0.4s
    catImage.style.animationDuration = `${animationDuration}s`;
    
    // Randomly choose animation direction
    if (Math.random() > 0.5) {
      catImage.style.animationDirection = 'alternate';
    }
    
    // Apply random animation type
    const animations = ['oiia-cat-scale', 'oiia-cat-bounce', 'oiia-crazy-scale', 'oiia-pulse-scale'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    catImage.style.animation = `${randomAnimation} ${animationDuration}s linear infinite`;
    
    // Apply random transform origin for more chaotic effect
    const origins = ['center center', 'top left', 'top right', 'bottom left', 'bottom right', 'center top', 'center bottom'];
    const randomOrigin = origins[Math.floor(Math.random() * origins.length)];
    catImage.style.transformOrigin = randomOrigin;
    
    // Try to get the OIIA image URL with error handling
    let imageUrl = '';
    try {
      imageUrl = chrome.runtime.getURL('public/oiia.png');
    } catch (runtimeError) {
      console.warn('OIIA: Chrome runtime error, using fallback image path', runtimeError);
      // Fallback to a relative path if chrome.runtime is unavailable
      imageUrl = 'public/oiia.png';
    }
    
    catImage.src = imageUrl;
    
    // Add error handling for the image
    catImage.onerror = function() {
      console.log('OIIA: Error loading image, removing cat');
      if (catImage.parentNode) {
        catImage.parentNode.removeChild(catImage);
      }
      // Remove from the array
      const index = catImages.indexOf(catImage);
      if (index > -1) {
        catImages.splice(index, 1);
      }
    };
    
    // Add to the document
    document.body.appendChild(catImage);
    
    // Store the cat image reference
    catImages.push(catImage);
    
    console.log('OIIA: Added a random OIIA image');
    
    return catImage;
  } catch (error) {
    console.error('OIIA: Error adding OIIA image:', error);
    return null;
  }
}

// Function to remove a random cat image
function removeRandomCat() {
  if (catImages.length > 0) {
    // Get a random index
    const randomIndex = Math.floor(Math.random() * catImages.length);
    
    // Get the cat image to remove
    const catImage = catImages[randomIndex];
    
    // Remove from the array
    catImages.splice(randomIndex, 1);
    
    // Remove from the DOM
    if (catImage && catImage.parentNode) {
      catImage.parentNode.removeChild(catImage);
      console.log('OIIA: Removed a random cat image');
    }
  }
}

// Function to start the cat image interval
function startCatImageInterval() {
  // Clear any existing interval
  if (catInterval) {
    clearInterval(catInterval);
  }
  
  // Start with a few cats
  for (let i = 0; i < 3; i++) {
    addRandomCat();
  }
  
  // Set up an interval to add/remove cats
  catInterval = setInterval(() => {
    // 50% chance to add a cat, 50% chance to remove a cat
    if (Math.random() > 0.5) {
      addRandomCat();
    } else {
      removeRandomCat();
    }
    
    // Limit the number of cats on screen
    if (catImages.length > 10) {
      removeRandomCat();
    }
    
    // Occasionally move existing cats
    if (Math.random() > 0.7 && catImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * catImages.length);
      const catImage = catImages[randomIndex];
      
      if (catImage) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxWidth = viewportWidth - 150;
        const maxHeight = viewportHeight - 150;
        
        const left = Math.floor(Math.random() * maxWidth);
        const top = Math.floor(Math.random() * maxHeight);
        
        catImage.style.left = `${left}px`;
        catImage.style.top = `${top}px`;
      }
    }
  }, 2000); // Every 2 seconds
  
  console.log('OIIA: Cat image interval started');
}

// Function to stop the cat image interval and remove all cats
function stopCatImageInterval() {
  // Clear the interval
  if (catInterval) {
    clearInterval(catInterval);
    catInterval = null;
  }
  
  // Remove all cat images
  catImages.forEach(catImage => {
    if (catImage && catImage.parentNode) {
      catImage.parentNode.removeChild(catImage);
    }
  });
  
  // Clear the array
  catImages = [];
  
  console.log('OIIA: Cat image interval stopped and all cats removed');
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
                  node !== document.body && !hasClass(node, 'oiia-body-effect')) {
                newElementsWithRgbaBackground.push(node);
              }
              
              // Also check all descendants for rgba backgrounds
              const allDescendants = node.querySelectorAll('*');
              allDescendants.forEach(descendant => {
                if (descendant !== document.body && !hasClass(descendant, 'oiia-body-effect')) {
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
                  // For headings, prioritize the full 3D random rotation for more dramatic effect
                  const rotationType = getRandomInt(1, 4);
                  switch (rotationType) {
                    case 1:
                    case 2:
                      // Higher chance of full 3D rotation for headings
                      node.classList.add('oiia-text-rotate');
                      break;
                    case 3:
                      node.classList.add('oiia-text-rotate-x');
                      break;
                    case 4:
                      node.classList.add('oiia-text-rotate-z');
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
            if (target !== document.body && !hasClass(target, 'oiia-body-effect')) {
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

// Helper function to check if an element has a background image and add it to the list if not processed
function checkAndAddElementWithBackgroundImage(element, elementsList) {
  if (!element || !element.nodeType || element.nodeType !== Node.ELEMENT_NODE || 
      element.getAttribute('data-oiia-processed') === 'true' ||
      hasClass(element, 'oiia-image') ||
      element.closest('.oiia-image') ||
      (element.parentNode && hasClass(element.parentNode, 'oiia-video-container'))) {
    return;
  }
  
  try {
    const style = window.getComputedStyle(element);
    
    // Check for background-image
    if (style.backgroundImage && style.backgroundImage !== 'none' && 
        style.backgroundImage.includes('url(') && 
        !hasClass(element, 'oiia-body-effect')) {
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
      if (element.getAttribute('data-oiia-processed') === 'true') {
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
            !hasClass(element, 'oiia-body-effect')) {
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
    if (element === document.body || hasClass(element, 'oiia-body-effect')) {
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
  
  // Start the cat image interval
  startCatImageInterval();
  
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
        hasClass(element, 'oiia-image')) {
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
  
  // Disconnect the observer if it exists
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
  
  // Stop the audio
  stopOiiaAudio();
  
  // Stop the cat image interval and remove all cats
  stopCatImageInterval();
  
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
  if (hasClass(imgElement, 'oiia-image') || 
      imgElement.getAttribute('data-oiia-processed') === 'true') {
    return false;
  }
  
  // Mark as processed
  imgElement.setAttribute('data-oiia-processed', 'true');
  
  try {
    // Save the original src and srcset
    const originalSrc = imgElement.src || '';
    const originalSrcset = imgElement.srcset || '';
    
    // Try to get the OIIA image URL with error handling
    let oiiaImageUrl = '';
    try {
      oiiaImageUrl = chrome.runtime.getURL('public/oiia.png');
    } catch (runtimeError) {
      console.warn('OIIA: Chrome runtime error, using fallback image path', runtimeError);
      // Fallback to a relative path if chrome.runtime is unavailable
      oiiaImageUrl = 'public/oiia.png';
    }
    
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
  if (element.parentNode && hasClass(element.parentNode, 'oiia-video-container') ||
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
  
  // Try to get the OIIA image URL with error handling
  let oiiaImageUrl = '';
  try {
    oiiaImageUrl = chrome.runtime.getURL('public/oiia.png');
  } catch (runtimeError) {
    console.warn('OIIA: Chrome runtime error, using fallback image path', runtimeError);
    // Fallback to a relative path if chrome.runtime is unavailable
    oiiaImageUrl = 'public/oiia.png';
  }
  
  imgElement.src = oiiaImageUrl;
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
  
  // Try to get the OIIA image URL with error handling
  let oiiaImageUrl = '';
  try {
    oiiaImageUrl = chrome.runtime.getURL('public/oiia.png');
  } catch (runtimeError) {
    console.warn('OIIA: Chrome runtime error, using fallback image path', runtimeError);
    // Fallback to a relative path if chrome.runtime is unavailable
    oiiaImageUrl = 'public/oiia.png';
  }
  
  imgElement.src = oiiaImageUrl;
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
        parent.replaceChild(container, svgElement);
      } else {
        // Otherwise, just hide it and place our image on top
        svgElement.style.visibility = 'hidden';
        if (parent) {
          parent.insertBefore(container, svgElement);
        }
      }
    }
    
    // Start the random rotation toggle for this image
    toggleRotation(imgElement);
    
    return true;
  } catch (e) {
    console.error('Error processing SVG element:', e);
    return false;
  }
}

// Function to process an element with a background image
function processBackgroundImage(element) {
  // Skip if this element has already been processed
  if (element.getAttribute('data-oiia-processed') === 'true') {
    return false;
  }
  
  // Mark as processed
  element.setAttribute('data-oiia-processed', 'true');
  
  try {
    // Get the computed style
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;
    
    // Skip if there's no background image or it's already an OIIA image
    if (!backgroundImage || backgroundImage === 'none' || backgroundImage.includes('oiia.png')) {
      return false;
    }
    
    // Store the original background image
    element.setAttribute('data-original-background-image', backgroundImage);
    
    // Set the new background image
    const oiiaImageUrl = chrome.runtime.getURL('public/oiia.png');
    element.style.backgroundImage = `url("${oiiaImageUrl}")`;
    
    // Adjust background properties for better display
    element.style.backgroundSize = 'contain';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundPosition = 'center';
    
    // Add a class for potential additional styling
    element.classList.add('oiia-background');
    
    // Start the random rotation toggle for this element
    toggleRotation(element);
    
    return true;
  } catch (e) {
    console.error('Error processing background image:', e);
    return false;
  }
}

// Function to restore the original state of the page
function restoreOriginalState() {
  console.log('OIIA: Restoring original state');
  
  // Set the global flag to indicate OIIA mode is inactive
  oiiaActive = false;
  
  // Disconnect the observer if it exists
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
  
  // Stop all audio
  stopOiiaAudio();
  
  // Stop the cat image interval and remove all cats
  stopCatImageInterval();
  
  // Remove the strobing gradient background from the body
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
