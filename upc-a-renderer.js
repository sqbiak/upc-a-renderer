/**
 * UPC-A Barcode Renderer
 *
 * A lightweight, professional-quality UPC-A barcode generator
 * with proper GS1-compliant digit placement.
 * Features flat and notched styles, flexible input handling.
 *
 * @version 1.0.0
 * @license Proprietary
 * @author ZenBlock
 * @copyright (c) 2024 ZenBlock. All Rights Reserved.
 *
 * PROPRIETARY LICENSE
 *
 * Copyright (c) 2024 ZenBlock. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * modification, distribution, or use of this software, via any medium,
 * is strictly prohibited without express written permission from ZenBlock.
 *
 * PERMITTED USE:
 * - Personal, non-commercial use is permitted free of charge
 * - Educational and evaluation purposes
 *
 * PROHIBITED WITHOUT LICENSE:
 * - Commercial use of any kind
 * - Redistribution or resale
 * - Modification for commercial purposes
 * - Inclusion in commercial products or services
 *
 * For commercial licensing inquiries, contact: sebastian.qbiak+license@gmail.com
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

(function (global, factory) {
    // UMD (Universal Module Definition)
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        global.UPCARenderer = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    // UPC-A encoding tables (same as EAN-13)
    // UPC-A always uses structure 'LLLLLL' (first digit = 0)
    const L_CODES = [
        '0001101', '0011001', '0010011', '0111101', '0100011',
        '0110001', '0101111', '0111011', '0110111', '0001011'
    ];
    const R_CODES = [
        '1110010', '1100110', '1101100', '1000010', '1011100',
        '1001110', '1010000', '1000100', '1001000', '1110100'
    ];

    const SVG_NS = 'http://www.w3.org/2000/svg';

    /**
     * Calculate UPC-A check digit
     * @param {string} code11 - 11-digit code (without check digit)
     * @returns {number} Check digit (0-9)
     */
    function calculateChecksum(code11) {
        code11 = String(code11).replace(/\D/g, '');
        if (code11.length < 11) {
            code11 = code11.padStart(11, '0');
        }
        code11 = code11.substring(0, 11);

        let sum = 0;
        for (let i = 0; i < 11; i++) {
            // Odd positions (0,2,4,6,8,10) multiply by 3
            // Even positions (1,3,5,7,9) multiply by 1
            sum += parseInt(code11[i]) * (i % 2 === 0 ? 3 : 1);
        }
        return (10 - (sum % 10)) % 10;
    }

    /**
     * Normalize input to 12-digit UPC-A code
     * @param {string} code - Input code (11 or 12 digits)
     * @param {object} options - Options with checksum mode
     * @returns {string} Normalized 12-digit code
     */
    function normalizeInput(code, options = {}) {
        code = String(code).replace(/\D/g, '');
        const checksumMode = options.checksum || 'auto';

        // Handle 11-digit input (no checksum)
        if (code.length === 11) {
            return code + calculateChecksum(code);
        }

        // Handle 12-digit input
        if (code.length === 12) {
            const providedCheck = parseInt(code[11]);
            const calculatedCheck = calculateChecksum(code.substring(0, 11));

            if (checksumMode === 'validate') {
                if (providedCheck !== calculatedCheck) {
                    throw new Error(`Invalid UPC-A checksum: expected ${calculatedCheck}, got ${providedCheck}`);
                }
                return code;
            } else if (checksumMode === 'recalculate') {
                return code.substring(0, 11) + calculatedCheck;
            } else {
                // 'auto' mode: accept if valid, recalculate if invalid
                return code.substring(0, 11) + calculatedCheck;
            }
        }

        // Handle shorter inputs (pad with leading zeros)
        if (code.length < 11) {
            code = code.padStart(11, '0');
            return code + calculateChecksum(code);
        }

        throw new Error('UPC-A requires 11 or 12 digits');
    }

    /**
     * Validate UPC-A code
     * @param {string} code - 11 or 12 digit code
     * @returns {boolean} True if valid
     */
    function validate(code) {
        code = String(code).replace(/\D/g, '');

        // Accept 11 digits (will calculate checksum)
        if (code.length === 11) return true;

        // Validate 12 digits with checksum
        if (code.length === 12) {
            return parseInt(code[11]) === calculateChecksum(code.substring(0, 11));
        }

        // Accept shorter codes (will be padded)
        if (code.length > 0 && code.length < 11) return true;

        return false;
    }

    /**
     * Format UPC-A with hyphens
     * @param {string} code12 - 12-digit UPC-A
     * @returns {string} Formatted: X-XXXXX-XXXXX-X
     */
    function formatUPC(code12) {
        code12 = String(code12).replace(/\D/g, '');
        if (code12.length !== 12) {
            code12 = normalizeInput(code12);
        }
        return code12.slice(0, 1) + '-' +
            code12.slice(1, 6) + '-' +
            code12.slice(6, 11) + '-' +
            code12.slice(11);
    }

    /**
     * Encode UPC-A to binary string
     * @param {string} code - 11 or 12 digit code
     * @param {object} options - Options
     * @returns {object} { encoding: string, fullCode: string }
     */
    function encode(code, options = {}) {
        const fullCode = normalizeInput(code, options);

        // UPC-A is essentially EAN-13 with leading 0
        // Always uses structure 'LLLLLL' (first EAN-13 digit = 0)
        let encoding = '101'; // Start guard

        // Left side: digits 0-5 of UPC-A (use L codes)
        for (let i = 0; i < 6; i++) {
            const digit = parseInt(fullCode[i]);
            encoding += L_CODES[digit];
        }

        encoding += '01010'; // Center guard

        // Right side: digits 6-11 of UPC-A (use R codes)
        for (let i = 6; i < 12; i++) {
            const digit = parseInt(fullCode[i]);
            encoding += R_CODES[digit];
        }

        encoding += '101'; // End guard

        return { encoding, fullCode };
    }

    /**
     * Default options
     */
    const DEFAULTS = {
        moduleWidth: 2,          // Width of single bar module in pixels
        height: 70,              // Main bar height in pixels
        guardExtend: 10,         // How much guard bars extend below main bars (notched style)
        fontSize: 14,            // Font size for middle digits
        smallDigitFontSize: 10,  // Font size for first/last digit (outside guards)
        textMargin: 2,           // Gap between bars and text
        quietZone: 9,            // Quiet zone width in modules (GS1 minimum is 9)
        outerDigitGap: 2,        // Gap between outer digits and guard bars
        paddingLeft: 0,          // Extra padding on left side
        paddingRight: 0,         // Extra padding on right side
        paddingTop: 0,           // Extra padding on top
        paddingBottom: 0,        // Extra padding on bottom
        background: '#FFFFFF',
        foreground: '#000000',
        font: '"OCR-B", "Courier New", monospace',
        style: 'notched',        // 'notched' | 'flat'
        checksum: 'auto'         // 'auto' | 'validate' | 'recalculate'
    };

    /**
     * Render UPC-A barcode to canvas
     * @param {HTMLCanvasElement|string} canvas - Canvas element or selector
     * @param {string} code - 11 or 12 digit UPC-A code
     * @param {object} options - Rendering options
     * @returns {HTMLCanvasElement} The canvas element
     */
    function render(canvas, code, options = {}) {
        // Get canvas element
        if (typeof canvas === 'string') {
            canvas = document.querySelector(canvas);
        }
        if (!canvas || !canvas.getContext) {
            throw new Error('Invalid canvas element');
        }

        // Merge options with defaults
        const opts = { ...DEFAULTS, ...options };
        const {
            moduleWidth, height, guardExtend, fontSize, smallDigitFontSize,
            textMargin, quietZone, outerDigitGap,
            paddingLeft, paddingRight, paddingTop, paddingBottom,
            background, foreground, font, style, checksum
        } = opts;

        // Encode the barcode
        const { encoding, fullCode } = encode(code, { checksum });

        // Calculate dimensions
        const barcodeWidth = encoding.length * moduleWidth; // 95 modules
        const guardHeight = style === 'notched' ? height + guardExtend : height;

        // Quiet zone in pixels
        const quietZonePx = quietZone * moduleWidth;

        // Space for outer digits (first and last)
        const outerDigitWidth = smallDigitFontSize * 0.7;
        const leftOuterSpace = outerDigitWidth + outerDigitGap;
        const rightOuterSpace = outerDigitWidth + outerDigitGap;

        const contentWidth = leftOuterSpace + quietZonePx + barcodeWidth + quietZonePx + rightOuterSpace;
        const contentHeight = guardHeight + fontSize + textMargin;
        const totalWidth = contentWidth + paddingLeft + paddingRight;
        const totalHeight = contentHeight + paddingTop + paddingBottom;

        // Set canvas size
        canvas.width = totalWidth;
        canvas.height = totalHeight;

        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Calculate offsets
        const barcodeStartX = paddingLeft + leftOuterSpace + quietZonePx;
        const offsetY = paddingTop;

        // Draw bars
        ctx.fillStyle = foreground;
        let x = barcodeStartX;

        for (let i = 0; i < encoding.length; i++) {
            // Guards: start (0-2), center (45-49), end (92-94)
            const isGuard = (i < 3) || (i >= 45 && i < 50) || (i >= 92);
            const barHeight = (style === 'notched' && isGuard) ? guardHeight : height;

            if (encoding[i] === '1') {
                ctx.fillRect(x, offsetY, moduleWidth, barHeight);
            }
            x += moduleWidth;
        }

        // Draw text
        const textY = offsetY + height + textMargin;

        // First digit (small, left of start guard)
        if (fontSize > 0) {
            ctx.fillStyle = foreground;
            ctx.font = `${smallDigitFontSize}px ${font}`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            // Align vertically with middle digits
            const smallDigitY = textY + (fontSize - smallDigitFontSize) / 2;
            ctx.fillText(fullCode[0], barcodeStartX - outerDigitGap, smallDigitY);

            // Left group (5 digits: index 1-5)
            ctx.font = `${fontSize}px ${font}`;
            ctx.textAlign = 'center';
            const leftStart = barcodeStartX + 3 * moduleWidth; // After start guard
            for (let i = 0; i < 5; i++) {
                const digitX = leftStart + (i + 0.5) * 7 * moduleWidth;
                ctx.fillText(fullCode[i + 1], digitX, textY);
            }

            // Right group (5 digits: index 6-10)
            const rightStart = barcodeStartX + 50 * moduleWidth; // After center guard
            for (let i = 0; i < 5; i++) {
                const digitX = rightStart + (i + 0.5) * 7 * moduleWidth;
                ctx.fillText(fullCode[i + 6], digitX, textY);
            }

            // Last digit (checksum, small, right of end guard)
            ctx.font = `${smallDigitFontSize}px ${font}`;
            ctx.textAlign = 'left';
            const endGuardX = barcodeStartX + encoding.length * moduleWidth;
            ctx.fillText(fullCode[11], endGuardX + outerDigitGap, smallDigitY);
        }

        return canvas;
    }

    /**
     * Render to new canvas and return as data URL
     * @param {string} code - 11 or 12 digit UPC-A code
     * @param {object} options - Rendering options
     * @returns {string} Data URL (PNG)
     */
    function toDataURL(code, options = {}) {
        const canvas = document.createElement('canvas');
        render(canvas, code, options);
        return canvas.toDataURL('image/png');
    }

    /**
     * Render to new canvas and return as Blob
     * @param {string} code - 11 or 12 digit UPC-A code
     * @param {object} options - Rendering options
     * @returns {Promise<Blob>} PNG Blob
     */
    function toBlob(code, options = {}) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            render(canvas, code, options);
            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create blob'));
            }, 'image/png');
        });
    }

    /**
     * Render UPC-A barcode to SVG element
     * @param {SVGElement|string} svg - SVG element or selector
     * @param {string} code - 11 or 12 digit UPC-A code
     * @param {object} options - Rendering options
     * @returns {SVGElement} The SVG element
     */
    function renderSVG(svg, code, options = {}) {
        if (typeof svg === 'string') {
            svg = document.querySelector(svg);
        }
        if (!svg) {
            throw new Error('Invalid SVG element');
        }

        const opts = { ...DEFAULTS, ...options };
        const {
            moduleWidth, height, guardExtend, fontSize, smallDigitFontSize,
            textMargin, quietZone, outerDigitGap,
            paddingLeft, paddingRight, paddingTop, paddingBottom,
            background, foreground, font, style, checksum
        } = opts;

        const { encoding, fullCode } = encode(code, { checksum });

        const barcodeWidth = encoding.length * moduleWidth;
        const guardHeight = style === 'notched' ? height + guardExtend : height;

        const quietZonePx = quietZone * moduleWidth;
        const outerDigitWidth = smallDigitFontSize * 0.7;
        const leftOuterSpace = outerDigitWidth + outerDigitGap;
        const rightOuterSpace = outerDigitWidth + outerDigitGap;

        const contentWidth = leftOuterSpace + quietZonePx + barcodeWidth + quietZonePx + rightOuterSpace;
        const contentHeight = guardHeight + fontSize + textMargin;
        const totalWidth = contentWidth + paddingLeft + paddingRight;
        const totalHeight = contentHeight + paddingTop + paddingBottom;

        svg.innerHTML = '';
        svg.setAttribute('xmlns', SVG_NS);
        svg.setAttribute('width', totalWidth);
        svg.setAttribute('height', totalHeight);
        svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

        // Background
        const bgRect = document.createElementNS(SVG_NS, 'rect');
        bgRect.setAttribute('width', totalWidth);
        bgRect.setAttribute('height', totalHeight);
        bgRect.setAttribute('fill', background);
        svg.appendChild(bgRect);

        const barcodeStartX = paddingLeft + leftOuterSpace + quietZonePx;
        const offsetY = paddingTop;

        // Bars
        let x = barcodeStartX;
        for (let i = 0; i < encoding.length; i++) {
            const isGuard = (i < 3) || (i >= 45 && i < 50) || (i >= 92);
            const barHeight = (style === 'notched' && isGuard) ? guardHeight : height;

            if (encoding[i] === '1') {
                const bar = document.createElementNS(SVG_NS, 'rect');
                bar.setAttribute('x', x);
                bar.setAttribute('y', offsetY);
                bar.setAttribute('width', moduleWidth);
                bar.setAttribute('height', barHeight);
                bar.setAttribute('fill', foreground);
                svg.appendChild(bar);
            }
            x += moduleWidth;
        }

        // Text (only if fontSize > 0)
        if (fontSize > 0) {
            const textY = offsetY + height + textMargin + fontSize;
            const smallDigitY = textY - (fontSize - smallDigitFontSize) / 2;

            // First digit (small, left of start guard)
            const firstDigit = document.createElementNS(SVG_NS, 'text');
            firstDigit.setAttribute('x', barcodeStartX - outerDigitGap);
            firstDigit.setAttribute('y', smallDigitY);
            firstDigit.setAttribute('text-anchor', 'end');
            firstDigit.setAttribute('font-family', font);
            firstDigit.setAttribute('font-size', smallDigitFontSize);
            firstDigit.setAttribute('fill', foreground);
            firstDigit.textContent = fullCode[0];
            svg.appendChild(firstDigit);

            // Left group (5 digits: index 1-5)
            const leftStart = barcodeStartX + 3 * moduleWidth;
            for (let i = 0; i < 5; i++) {
                const digitX = leftStart + (i + 0.5) * 7 * moduleWidth;
                const digit = document.createElementNS(SVG_NS, 'text');
                digit.setAttribute('x', digitX);
                digit.setAttribute('y', textY);
                digit.setAttribute('text-anchor', 'middle');
                digit.setAttribute('font-family', font);
                digit.setAttribute('font-size', fontSize);
                digit.setAttribute('fill', foreground);
                digit.textContent = fullCode[i + 1];
                svg.appendChild(digit);
            }

            // Right group (5 digits: index 6-10)
            const rightStart = barcodeStartX + 50 * moduleWidth;
            for (let i = 0; i < 5; i++) {
                const digitX = rightStart + (i + 0.5) * 7 * moduleWidth;
                const digit = document.createElementNS(SVG_NS, 'text');
                digit.setAttribute('x', digitX);
                digit.setAttribute('y', textY);
                digit.setAttribute('text-anchor', 'middle');
                digit.setAttribute('font-family', font);
                digit.setAttribute('font-size', fontSize);
                digit.setAttribute('fill', foreground);
                digit.textContent = fullCode[i + 6];
                svg.appendChild(digit);
            }

            // Last digit (checksum, small, right of end guard)
            const lastDigit = document.createElementNS(SVG_NS, 'text');
            const endGuardX = barcodeStartX + encoding.length * moduleWidth;
            lastDigit.setAttribute('x', endGuardX + outerDigitGap);
            lastDigit.setAttribute('y', smallDigitY);
            lastDigit.setAttribute('text-anchor', 'start');
            lastDigit.setAttribute('font-family', font);
            lastDigit.setAttribute('font-size', smallDigitFontSize);
            lastDigit.setAttribute('fill', foreground);
            lastDigit.textContent = fullCode[11];
            svg.appendChild(lastDigit);
        }

        return svg;
    }

    /**
     * Render to new SVG and return as string
     * @param {string} code - 11 or 12 digit UPC-A code
     * @param {object} options - Rendering options
     * @returns {string} SVG string
     */
    function toSVG(code, options = {}) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        renderSVG(svg, code, options);
        return new XMLSerializer().serializeToString(svg);
    }

    // Public API
    return {
        render,
        renderSVG,
        toDataURL,
        toBlob,
        toSVG,
        encode,
        validate,
        calculateChecksum,
        normalizeInput,
        formatUPC,
        version: '1.0.0',
        DEFAULTS
    };

}));
