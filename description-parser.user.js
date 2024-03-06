// ==UserScript==
// @name         Rakuten Details Extractor and Copier
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Extracts details from Rakuten item detail pages and copies them to the clipboard.
// @author       minyoon
// @match        https://item.rakuten.co.jp/*/*
// @grant        GM_setClipboard
// @license      MIT
// @homepageURL  https://github.com/minyoon/rakuten-parser
// @downloadURL  https://github.com/minyoon/rakuten-parser/raw/main/description-parser.user.js
// @updateURL    https://github.com/minyoon/rakuten-parser/raw/main/description-parser.user.js
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
        const itemDescElements = document.querySelectorAll('.item_desc');
        let details = [];

        itemDescElements.forEach(itemDesc => {
            let currentSectionHeader = ""; // To track the current section we are in
            const tables = itemDesc.querySelectorAll('table');
            tables.forEach(table => {
                const rows = Array.from(table.rows);
                rows.forEach(row => {
                    const th = row.querySelector('th');
                    const td = row.querySelector('td');

                    if (th && !td) { // If there's a <th> with no <td>, it's a section header
                        currentSectionHeader = th.textContent.trim();
                    } else if (td) {
                        let key, value;
                        if (th && td) { // If both <th> and <td> are present in the same row
                            key = th.textContent.trim();
                            value = td.innerHTML.trim().replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
                        } else if (!th && td && currentSectionHeader) { // If only <td> is present and we had a section header before
                            key = currentSectionHeader; // Use the last known section header as the key
                            value = td.innerHTML.trim().replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
                        }
                        if (key && value) {
                            details.push([key, value]);
                        }
                    }
                });
            });
        });

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

        let combinedDetails = {
            MetaContents: {},
            ItemDetails: {},
            ProductSpecs: {}
        };

        if (metaContents.length > 0) {
            metaContents.forEach(([key, value]) => {
                combinedDetails.MetaContents[key] = value;
            });
        }

        if (itemDetails.length > 0) {
            itemDetails.forEach(([key, value]) => {
                if (!combinedDetails.ItemDetails[key]) {
                    combinedDetails.ItemDetails[key] = [];
                }
                combinedDetails.ItemDetails[key].push(value);
            });
        }

        if (productSpecs.length > 0) {
            productSpecs.forEach(([key, value]) => {
                combinedDetails.ProductSpecs[key] = value;
            });
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
            // Checking if the JSON object has any contents
            if (Object.keys(combinedDetails.MetaContents).length > 0 || Object.keys(combinedDetails.ItemDetails).length > 0 || Object.keys(combinedDetails.ProductSpecs).length > 0) {
                const textToCopy = JSON.stringify(combinedDetails, null, 4); // Pretty print JSON
                copyToClipboard(textToCopy);
                alert('Details copied to clipboard as JSON.');
            } else {
                alert('No details found to copy.');
            }
        });

        document.body.appendChild(button);
    }

    addExtractAndCopyDetailsButton();
})();

