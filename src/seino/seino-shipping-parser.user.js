// ==UserScript==
// @name         Seino Shipping Data Parser
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Parse shipping data from Seino KM2 system and provide download/copy functionality
// @author       Minyoon Jung (株式会社Ｊ　Ｕｎｉｔ)
// @match        https://net-n.seino.co.jp/km2/shukkaList.do*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @updateURL    https://github.com/minyoon/ec-master-helper/raw/main/src/seino/seino-shipping-parser.user.js
// @downloadURL  https://github.com/minyoon/ec-master-helper/raw/main/src/seino/seino-shipping-parser.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Add CSS for the UI
    GM_addStyle(`
        .shipping-parser-ui {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #fff;
            border: 2px solid #006600;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            min-width: 250px;
        }

        .shipping-parser-ui h3 {
            margin: 0 0 10px 0;
            color: #006600;
            font-size: 14px;
        }

        .shipping-parser-ui button {
            display: block;
            width: 100%;
            margin: 5px 0;
            padding: 8px 12px;
            background: #006600;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .shipping-parser-ui button:hover {
            background: #004400;
        }

        .shipping-parser-ui .status {
            margin-top: 10px;
            font-size: 11px;
            color: #666;
        }

        .shipping-parser-ui .close-btn {
            position: absolute;
            top: 5px;
            right: 10px;
            background: none;
            border: none;
            color: #999;
            font-size: 16px;
            cursor: pointer;
            width: auto;
            margin: 0;
            padding: 0;
        }

        .shipping-parser-ui .close-btn:hover {
            color: #666;
        }
    `);

    // Shipping data parser functions
    function parseShippingData() {
        const shippingData = [];
        const seenTrackingNumbers = new Set();

        const rows = document.querySelectorAll('table tr');

        rows.forEach((row, index) => {
            if (index < 10) return;

            const cells = row.querySelectorAll('td');
            if (cells.length < 6) return;

            const shippingCell = cells[1];
            if (!shippingCell) return;

            const cellText = shippingCell.textContent || shippingCell.innerText;

            const dateMatch = cellText.match(/(\d{4}\/\d{2}\/\d{2})/);
            const trackingMatch = cellText.match(/(\d{10})/);
            const idMatch = cellText.match(/(\d{8}-\d{10}|JP\d{4})/);

            const trackingNumber = trackingMatch ? trackingMatch[1] : null;

            if (trackingNumber && seenTrackingNumbers.has(trackingNumber)) {
                return;
            }

            if (trackingNumber) {
                seenTrackingNumbers.add(trackingNumber);
            }

            if (dateMatch || trackingMatch || idMatch) {
                const shippingItem = {
                    shipmentDate: dateMatch ? dateMatch[1] : null,
                    trackingNumber: trackingNumber,
                    id: idMatch ? idMatch[1] : null,
                    rowIndex: index
                };

                if (shippingItem.shipmentDate || shippingItem.trackingNumber || shippingItem.id) {
                    shippingData.push(shippingItem);
                }
            }
        });

        return shippingData;
    }

    function parseDetailedShippingData() {
        const shippingData = [];
        const seenTrackingNumbers = new Set();

        const rows = document.querySelectorAll('table tr');

        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 6) return;

            const shippingCell = cells[1];
            if (!shippingCell) return;

            const cellText = shippingCell.textContent || shippingCell.innerText;

            const dateMatch = cellText.match(/(\d{4}\/\d{2}\/\d{2})/);
            const trackingMatch = cellText.match(/(\d{10})/);
            const idMatch = cellText.match(/(\d{8}-\d{10}|JP\d{4})/);

            const trackingNumber = trackingMatch ? trackingMatch[1] : null;

            if (trackingNumber && seenTrackingNumbers.has(trackingNumber)) {
                return;
            }

            if (trackingNumber) {
                seenTrackingNumbers.add(trackingNumber);
            }

            const destinationCell = cells[2];
            let address = '';
            let name = '';
            let telephone = '';

            if (destinationCell) {
                const destinationText = (destinationCell.textContent || destinationCell.innerText).trim();

                // Split by line breaks and clean up
                const lines = destinationText.split(/\n|\r\n|\r|<br\s*\/?>/i)
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                if (lines.length >= 3) {
                    // First line is usually address
                    address = lines[0];

                    // Second line might be building name or part of address
                    if (lines[1] && !lines[1].includes('Ｊ　Ｕｎｉｔ') && !lines[1].startsWith('TEL：')) {
                        address += ' ' + lines[1];
                    }

                    // Find the line with J Unit (name)
                    const nameLine = lines.find(line => line.includes('Ｊ　Ｕｎｉｔ'));
                    if (nameLine) {
                        name = nameLine.replace('Ｊ　Ｕｎｉｔ', '').trim();
                    }

                    // Find the line with TEL
                    const telLine = lines.find(line => line.startsWith('TEL：'));
                    if (telLine) {
                        telephone = telLine.replace('TEL：', '').trim();
                    }
                }
            }

            const quantityCell = cells[3];
            let quantity = '';
            if (quantityCell) {
                quantity = (quantityCell.textContent || quantityCell.innerText).trim();
                // Clean up quantity - remove any extra whitespace and newlines
                quantity = quantity.replace(/\s+/g, ' ').trim();
            }

            if (dateMatch || trackingMatch || idMatch) {
                const shippingItem = {
                    shipmentDate: dateMatch ? dateMatch[1] : null,
                    trackingNumber: trackingNumber,
                    id: idMatch ? idMatch[1] : null,
                    address: address,
                    name: name,
                    telephone: telephone,
                    quantity: quantity,
                    rowIndex: index
                };

                if (shippingItem.shipmentDate || shippingItem.trackingNumber || shippingItem.id) {
                    shippingData.push(shippingItem);
                }
            }
        });

        return shippingData;
    }

    function convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        csvRows.push(headers.join(','));

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    function downloadCSV(data, filename = 'shipping_data.csv') {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function copyToClipboard(data) {
        const jsonString = JSON.stringify(data, null, 2);

        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(jsonString);
            return true;
        } else if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(jsonString).then(() => {
                return true;
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                return false;
            });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = jsonString;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    // Global UI reference
    let currentUI = null;

    // Create UI
    function createUI() {
        const ui = document.createElement('div');
        ui.className = 'shipping-parser-ui';
        ui.innerHTML = `
            <button class="close-btn">×</button>
            <h3>🚚 Shipping Parser</h3>
            <button class="download-btn">📥 Download CSV</button>
            <button class="copy-btn">📋 Copy JSON</button>
            <button class="show-btn">👁️ Show Data</button>
            <div class="status">Ready to parse shipping data</div>
        `;

        // Add event listeners
        ui.querySelector('.close-btn').addEventListener('click', () => {
            ui.remove();
        });

        ui.querySelector('.download-btn').addEventListener('click', () => {
            const data = parseDetailedShippingData();
            if (data.length > 0) {
                downloadCSV(data, `shipping_data_${new Date().toISOString().slice(0,10)}.csv`);
                ui.querySelector('.status').textContent = `✅ Downloaded ${data.length} records`;
            } else {
                ui.querySelector('.status').textContent = '❌ No shipping data found';
            }
        });

        ui.querySelector('.copy-btn').addEventListener('click', () => {
            const data = parseDetailedShippingData();
            if (data.length > 0) {
                if (copyToClipboard(data)) {
                    ui.querySelector('.status').textContent = `✅ Copied ${data.length} records to clipboard`;
                } else {
                    ui.querySelector('.status').textContent = '❌ Failed to copy to clipboard';
                }
            } else {
                ui.querySelector('.status').textContent = '❌ No shipping data found';
            }
        });

        ui.querySelector('.show-btn').addEventListener('click', () => {
            const data = parseDetailedShippingData();
            if (data.length > 0) {
                console.table(data);
                ui.querySelector('.status').textContent = `✅ Found ${data.length} records (see console)`;
            } else {
                ui.querySelector('.status').textContent = '❌ No shipping data found';
            }
        });

        document.body.appendChild(ui);
        currentUI = ui;
    }

    // Initialize when page loads
    function init() {
        // Wait a bit for the page to load
        setTimeout(() => {
            createUI();
        }, 1000);
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();