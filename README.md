# UPC-A Renderer

A lightweight, professional-quality UPC-A barcode generator for JavaScript. Generates GS1-compliant US retail barcodes with proper digit placement.

## Features

- **Professional UPC-A Layout**: First and last digits rendered small outside guard bars
- **Notched & Flat Styles**: Choose between retail-standard notched or flat barcode style
- **Flexible Input**: Accepts 11 or 12 digits, auto-calculates checksum
- **Canvas & SVG**: Render to Canvas or SVG with identical output
- **No Dependencies**: Pure JavaScript, no external libraries required
- **Export Options**: PNG data URL, Blob, or SVG string

## Demo

Try the [live demo](https://sqbiak.github.io/upc-a-renderer/) or visit [Bulk Barcodes Generator](https://bulkbarcodesgenerator.com/upc-a) for bulk generation.

## Installation

### CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/gh/sqbiak/upc-a-renderer@v1.0.0/upc-a-renderer.min.js"></script>
```

### Local

Download `upc-a-renderer.min.js` and include it in your project:

```html
<script src="upc-a-renderer.min.js"></script>
```

## Usage

### Basic Rendering

```javascript
// Render to canvas element
UPCARenderer.render('#my-canvas', '012345678905');

// Or pass canvas element directly
const canvas = document.getElementById('my-canvas');
UPCARenderer.render(canvas, '012345678905');
```

### With Options

```javascript
UPCARenderer.render(canvas, '012345678905', {
    moduleWidth: 2,          // Bar width in pixels
    height: 70,              // Main bar height in pixels
    guardExtend: 10,         // Guard bar extension (notched style)
    fontSize: 14,            // Middle digit font size
    smallDigitFontSize: 10,  // First/last digit font size
    textMargin: 2,           // Gap between bars and text
    quietZone: 9,            // Quiet zone in modules
    outerDigitGap: 2,        // Gap between outer digits and guards
    style: 'notched',        // 'notched' | 'flat'
    checksum: 'auto',        // 'auto' | 'validate' | 'recalculate'
    background: '#FFFFFF',
    foreground: '#000000',
    font: '"OCR-B", "Courier New", monospace'
});
```

### Export Functions

```javascript
// Get as PNG data URL
const dataUrl = UPCARenderer.toDataURL('012345678905');

// Get as PNG Blob (async)
const blob = await UPCARenderer.toBlob('012345678905');

// Get as SVG string
const svgString = UPCARenderer.toSVG('012345678905');

// Render to SVG element
UPCARenderer.renderSVG('#my-svg', '012345678905');
```

### Input Flexibility

```javascript
// 11 digits - checksum auto-calculated
UPCARenderer.render(canvas, '01234567890');  // → 012345678905

// 12 digits - validates existing checksum
UPCARenderer.render(canvas, '012345678905');

// Shorter codes - padded with leading zeros
UPCARenderer.render(canvas, '12345');  // → 000001234506
```

### Checksum Modes

```javascript
// Auto mode (default): accept if valid, recalculate if invalid
UPCARenderer.render(canvas, code, { checksum: 'auto' });

// Validate mode: throw error if checksum is wrong
UPCARenderer.render(canvas, code, { checksum: 'validate' });

// Recalculate mode: always replace last digit with correct checksum
UPCARenderer.render(canvas, code, { checksum: 'recalculate' });
```

### Validation API

```javascript
// Validate a UPC-A code
UPCARenderer.validate('012345678905');  // true
UPCARenderer.validate('012345678900');  // false (wrong checksum)

// Calculate check digit
UPCARenderer.calculateChecksum('01234567890');  // 5

// Format with hyphens
UPCARenderer.formatUPC('012345678905');  // "0-12345-67890-5"

// Get encoding info
UPCARenderer.encode('01234567890');
// { encoding: '10100110010...', fullCode: '012345678905' }
```

## UPC-A vs EAN-13

| Feature | UPC-A | EAN-13 |
|---------|-------|--------|
| Total Digits | 12 | 13 |
| Region | US & Canada | International |
| First Digit | Small, outside left guard | Small, outside left guard |
| Last Digit | Small, outside right guard | Under bars (right group) |
| Middle Digits | 5 + 5 | 6 + 6 |

## API Reference

### Methods

| Method | Description |
|--------|-------------|
| `render(canvas, code, options?)` | Render barcode to canvas |
| `renderSVG(svg, code, options?)` | Render barcode to SVG element |
| `toDataURL(code, options?)` | Get barcode as PNG data URL |
| `toBlob(code, options?)` | Get barcode as PNG Blob (async) |
| `toSVG(code, options?)` | Get barcode as SVG string |
| `encode(code, options?)` | Get binary encoding |
| `validate(code)` | Check if code is valid |
| `calculateChecksum(code11)` | Calculate check digit |
| `normalizeInput(code, options?)` | Normalize to 12-digit code |
| `formatUPC(code12)` | Format with hyphens |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `moduleWidth` | number | 2 | Width of single bar module (px) |
| `height` | number | 70 | Main bar height (px) |
| `guardExtend` | number | 10 | Guard bar extension (px) |
| `fontSize` | number | 14 | Middle digit font size |
| `smallDigitFontSize` | number | 10 | First/last digit font size |
| `textMargin` | number | 2 | Gap between bars and text |
| `quietZone` | number | 9 | Quiet zone width (modules) |
| `outerDigitGap` | number | 2 | Gap between outer digits and guards |
| `paddingLeft` | number | 0 | Extra left padding |
| `paddingRight` | number | 0 | Extra right padding |
| `paddingTop` | number | 0 | Extra top padding |
| `paddingBottom` | number | 0 | Extra bottom padding |
| `background` | string | '#FFFFFF' | Background color |
| `foreground` | string | '#000000' | Bar and text color |
| `font` | string | '"OCR-B"...' | Font family |
| `style` | string | 'notched' | 'notched' or 'flat' |
| `checksum` | string | 'auto' | Checksum handling mode |

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Related

- [Bulk Barcodes Generator](https://bulkbarcodesgenerator.com/) - Generate barcodes in bulk
- [EAN-13 Renderer](https://github.com/sqbiak/ean13-renderer) - Sister library for EAN-13 barcodes
