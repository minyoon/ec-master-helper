// ==UserScript==
// @name         Rakuten Details Extractor and Copier
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Extracts details from Rakuten item detail pages and copies them to the clipboard.
// @author       Minyoon Jung (株式会社Ｊ　Ｕｎｉｔ)
// @match        https://item.rakuten.co.jp/*/*
// @grant        GM_setClipboard
// @updateURL    https://github.com/minyoon/ec-master-helper/raw/main/src/rakuten/description-parser.user.js
// @downloadURL  https://github.com/minyoon/ec-master-helper/raw/main/src/rakuten/description-parser.user.js
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

        // Helper function to clean and format value content
        const formatContent = (content) => content.trim().replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');

        itemDescElements.forEach(itemDesc => {
            let currentSectionHeader = ""; // To keep track of the current section

            itemDesc.querySelectorAll('table').forEach(table => {
                table.querySelectorAll('tr').forEach(row => {
                    const th = row.querySelector('th');
                    const td = row.querySelector('td');

                    // Determine the key based on row content
                    let key = th ? th.textContent.trim() : currentSectionHeader;
                    let value = "";

                    // Handling for section headers or detail rows
                    if (th && !td) {
                        currentSectionHeader = key; // Update section header when a new one is found
                    } else if (td) {
                        // For image-containing cells, concatenate image URLs; otherwise, format the cell content
                        const images = td.querySelectorAll('img');
                        value = images.length > 0
                            ? Array.from(images).map(img => img.src).join(', ')
                        : formatContent(td.innerHTML);

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
