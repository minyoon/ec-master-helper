// ==UserScript==
// @name         Rakuten Details Extractor and Copier
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Extracts details from Rakuten item detail pages and copies them to the clipboard.
// @author       minyoon
// @match        https://item.rakuten.co.jp/*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    function extractMetaContents() {
        const table = document.querySelector('table[style="margin-bottom:12px;"]');
        let contents = [];
        if (table) {
            const metaElements = table.querySelectorAll('meta[itemprop]');
            contents = Array.from(metaElements).map(meta => [
                meta.getAttribute('itemprop'),
                meta.getAttribute('content').trim()
            ]);
        }
        return contents;
    }

    function extractItemDetails() {
        const table = document.querySelector('.item_desc table');
        let details = [];
        if (table) {
            table.querySelectorAll('tbody tr').forEach(row => {
                const headingElement = row.querySelector('th');
                const dataElement = row.querySelector('td');
                if (headingElement && dataElement) { // Ensure both elements exist
                    const key = headingElement.textContent.trim();
                    let value = dataElement.innerHTML.trim(); // Use innerHTML to preserve HTML content
                    details.push([key, value]);
                } else {
                    // Optionally log an error or handle the case where elements are not found
                    console.error('Heading or data element not found in row:', row);
                }
            });
        }
        return details;
    }

    function extractProductSpecs() {
        const specs = [];
        const table = document.querySelector('table.container--3EIWt');
        if (table) {
            table.querySelectorAll('tbody tr').forEach(row => {
                const keyDiv = row.querySelector('td:first-child div.text-display--1Iony');
                const valueDiv = row.querySelector('td:nth-child(2) div.text-display--1Iony');
                if (keyDiv && valueDiv) {
                    const key = keyDiv.textContent.trim();
                    const value = valueDiv.textContent.trim();
                    specs.push([key, value]);
                }
            });
        }
        return specs;
    }

    function combineDetails() {
        const metaContents = extractMetaContents();
        const itemDetails = extractItemDetails();
        const productSpecs = extractProductSpecs();

        let combinedDetails = [];

        if (metaContents.length > 0) {
            combinedDetails.push(["=== Meta Contents ==="]);
            combinedDetails.push(...metaContents);
        }

        if (itemDetails.length > 0) {
            combinedDetails.push(["=== Item Details ==="]);
            combinedDetails.push(...itemDetails);
        }

        if (productSpecs.length > 0) {
            combinedDetails.push(["=== Product Specs ==="]);
            combinedDetails.push(...productSpecs);
        }

        return combinedDetails;
    }

    function copyToClipboard(text) {
        GM_setClipboard(text);
    }

    function addExtractAndCopyDetailsButton() {
        const button = document.createElement("button");
        button.textContent = "Extract and Copy Details";
        button.style.position = "fixed";
        button.style.top = "50px";
        button.style.right = "10px";
        button.style.zIndex = "10000";

        button.addEventListener("click", function() {
            const combinedDetails = combineDetails();
            if (combinedDetails.length > 0) {
                const textToCopy = combinedDetails.map(detail => detail.join(': ')).join('\n');
                copyToClipboard(textToCopy);
                alert('Details copied to clipboard.');
            } else {
                alert('No details found to copy.');
            }
        });

        document.body.appendChild(button);
    }

    addExtractAndCopyDetailsButton();
})();

