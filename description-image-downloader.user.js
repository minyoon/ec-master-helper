// ==UserScript==
// @name         Rakuten Image Downloader with Dynamic Prefix
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Manually trigger image downloads on Rakuten item detail pages, using the item code as the file name prefix.
// @author       minyoon
// @homepageURL  https://github.com/minyoon/rakuten-parser
// @downloadURL  https://github.com/minyoon/rakuten-parser/raw/main/description-image-downloader.user.js
// @updateURL    https://github.com/minyoon/rakuten-parser/raw/main/description-image-downloader.user.js
// @match        https://item.rakuten.co.jp/*/*
// @match        https://soko.rms.rakuten.co.jp/*
// @grant        GM_download
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    console.log('Rakuten Image Download Script is running on', window.location.href);

    // Only run on item or soko Rakuten pages
    const urlRegex = /^https:\/\/(?:item|soko)\.rakuten\.co\.jp\/.*$/;
    if (!urlRegex.test(window.location.href)) {
        console.warn('URL does not match, script will not run.');
        return;
    }

    /** Applies multiple styles to a DOM element. */
    const applyStyles = (element, styles) => Object.assign(element.style, styles);

    /** Adds a subtle hover effect (opacity + slight scale) to an element. */
    function addHoverEffects(element) {
        element.addEventListener('mouseover', () => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1.05)';
        });
        element.addEventListener('mouseout', () => {
            element.style.opacity = '0.7';
            element.style.transform = 'scale(1)';
        });
    }

    /** Extracts the file prefix from the current URL path (the penultimate segment). */
    function getFilePrefix() {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 2] || 'no-prefix';
    }

    /** Handles the image downloads within <span class="sale_desc">. */
    function downloadImages(filePrefix) {
        const images = document.querySelectorAll('span.sale_desc img');
        if (images.length === 0) {
            console.warn('No images found to download.');
            return;
        }
        images.forEach((img, i) => {
            const [extension] = img.src.split('.').pop().split('?');
            GM_download({
                url: img.src,
                name: `${filePrefix}-${i + 1}.${extension}`,
                onerror: err => console.error('Download error:', err),
            });
        });
    }

    /** Creates and injects the "Download Images" + "X" buttons. */
    function addDownloadButton() {
        const container = document.createElement('div');
        container.id = 'buttonContainer';
        applyStyles(container, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '2147483647',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
        });

        // Common styles for both buttons
        const buttonBaseStyles = {
            border: 'none',
            borderRadius: '5px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
            opacity: '0.7',
            transition: 'opacity 0.3s ease, transform 0.2s ease',
            cursor: 'pointer',
        };

        // Main download button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadImagesButton';
        downloadBtn.textContent = 'Download Images';
        applyStyles(downloadBtn, {
            ...buttonBaseStyles,
            backgroundColor: '#bd0f00',
            color: 'white',
            padding: '8px 12px',
            fontSize: '14px',
        });
        addHoverEffects(downloadBtn);
        downloadBtn.addEventListener('click', () => {
            downloadImages(getFilePrefix());
        });

        // Close (X) button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'X';
        applyStyles(closeBtn, {
            ...buttonBaseStyles,
            backgroundColor: 'red',
            color: 'white',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '50%',
        });
        addHoverEffects(closeBtn);
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.remove();
        });

        container.append(downloadBtn, closeBtn);
        document.body.appendChild(container);
    }

    /**
     * Tries to find images in <span class="sale_desc"> up to `maxRetries` times,
     * then creates the button if found.
     */
    function waitForContent(maxRetries = 10) {
        const images = document.querySelectorAll('span.sale_desc img');
        if (images.length > 0) {
            addDownloadButton();
        } else if (maxRetries > 0) {
            setTimeout(() => waitForContent(maxRetries - 1), 1000);
        } else {
            console.warn('No images found after retries.');
        }
    }

    // Start the process after the page has fully loaded
    window.addEventListener('load', () => {
        waitForContent(10);
    });
})();
