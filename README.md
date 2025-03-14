# OIIA Dance Party Chrome Extension

Transform any webpage into a wild dance party with this Chrome extension! OIIA Dance Party makes images, videos, text, headings, links, and buttons spin, rotate, and dance across your screen in a chaotic visual celebration.

## Features

- **3D Text Rotation**: Makes text elements rotate randomly on all three axes (X, Y, Z)
- **Image Replacement**: Replaces images with animated alternatives
- **Video Transformation**: Applies effects to videos and iframes
- **Interactive Elements**: Targets links and buttons without children for rotation effects
- **Heading Emphasis**: Applies dramatic rotation effects to heading elements (h1-h6)
- **Background Removal**: Removes rgba() backgrounds for enhanced visual effects
- **Dynamic Content Support**: Automatically processes new elements as they're added to the page
- **Audio Effects**: Includes audio for a complete sensory experience

## Installation (Development)

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/oiia-extension.git
   cd oiia-extension
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the directory containing the extension

5. The extension should now be installed and visible in your Chrome toolbar

## Usage

1. Click the OIIA Dance Party icon in your Chrome toolbar to open the popup
2. Click the "Activate" button to transform the current webpage
3. Click "Deactivate" to return the page to its original state

## Project Structure

- `manifest.json`: Extension configuration file
- `public/`: Contains static assets
  - `popup.html`: HTML for the extension popup
  - `images/`: Icons and images used by the extension
- `src/`: Source code
  - `content.js`: Content script that runs on webpages
  - `popup.js`: Script for the extension popup
  - `background.js`: Background service worker

## Development Guide

### Prerequisites

- Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript
- Familiarity with Chrome Extension API

### Making Changes

#### Modifying Visual Effects

The visual effects are defined in the `content.js` file. Look for the following sections:

- **CSS Animations**: Defined in the `injectStyles()` function
- **Text Rotation**: Controlled by the `toggleTextRotation()` function
- **Image Processing**: Handled by the `processImage()` function
- **Background Effects**: Managed by the `applyBodyEffect()` function

#### Adding New Features

1. **New Element Types**: To target new types of elements, create a new finder function (like `findAllHeadings()`) and a corresponding processor function.

2. **New Visual Effects**: Add new CSS animations in the `injectStyles()` function, then create functions to apply them to elements.

3. **UI Changes**: Modify the `popup.html` file to change the extension's user interface.

### Testing Your Changes

1. Make your code changes
2. Save the files
3. Go to `chrome://extensions/` in Chrome
4. Find the OIIA Dance Party extension and click the refresh icon
5. Test your changes on various websites

### Debugging

- Use `console.log()` statements in your code to debug issues
- Check the browser console (F12) for error messages
- For content script issues, inspect the console on the webpage where the extension is active
- For popup issues, right-click the popup and select "Inspect" to open DevTools

## Best Practices

- Follow Chrome Extension Manifest V3 guidelines
- Minimize DOM operations for better performance
- Clean up any changes when the extension is deactivated
- Test on various websites to ensure compatibility
- Use event listeners instead of polling where possible
- Implement proper error handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
