// ==UserScript==
// @name         Rakuten Image Downloader with Dynamic Prefix
// @namespace    http://tampermonkey.net/
// @version      1.3.0
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

    // Add at the top of the file, after 'use strict';
    const i18n = {
        en: {
            fileNamePrefix: 'File Name Prefix',
            prefixDescription: 'This prefix will be added to all downloaded image file names',
            selectAllImages: 'Select All Images',
            imagesAvailable: 'Images Available',
            downloadSelected: 'Download Selected Images',
            downloadAllImages: 'Download All Images',
            hideControls: 'Hide Controls'
        },
        ja: {
            fileNamePrefix: 'ファイル名プレフィックス',
            prefixDescription: 'このプレフィックスは、ダウンロードする全ての画像ファイル名に追加されます',
            selectAllImages: '全ての画像を選択',
            imagesAvailable: '枚の画像が利用可能',
            downloadSelected: '選択した画像をダウンロード',
            downloadAllImages: '全ての画像をダウンロード',
            hideControls: '閉じる'
        }
    };

    // Utility Module
    const Utils = {
        applyStyles: (element, styles) => Object.assign(element.style, styles),

        createStyledElement(type, styles, properties = {}) {
            const element = document.createElement(type);
            this.applyStyles(element, styles);
            Object.assign(element, properties);
            return element;
        },

        getFilePrefix() {
            const parts = window.location.pathname.split('/');
            return parts[parts.length - 2] || 'no-prefix';
        },

        getLanguage() {
            return document.documentElement.lang === 'ja' ? 'ja' : 'en';
        }
    };

    // Download Module
    const DownloadManager = {
        downloadImages(filePrefix, selectedIndices) {
            const images = document.querySelectorAll('span.sale_desc img');
            if (images.length === 0) {
                console.warn('No images found to download.');
                return;
            }
            images.forEach((img, i) => {
                if (selectedIndices.includes(i)) {
                    const [extension] = img.src.split('.').pop().split('?');
                    GM_download({
                        url: img.src,
                        name: `${filePrefix}-${i + 1}.${extension}`,
                        onerror: err => console.error('Download error:', err),
                    });
                }
            });
        }
    };

    // UI Components Module
    const UIComponents = {
        createThumbnail(img, index, enlargedPreview) {
            const thumbnailContainer = Utils.createStyledElement('div', {
                position: 'relative',
                width: '80px',
                height: '80px'
            });

            const checkboxContainer = Utils.createStyledElement('div', {
                position: 'absolute',
                top: '4px',
                left: '4px',
                zIndex: '1',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '3px',
                width: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: '0.6',
                transition: 'opacity 0.2s'
            });

            const checkbox = Utils.createStyledElement('input', {
                margin: '0',
                cursor: 'pointer',
                width: '12px',
                height: '12px',
                opacity: '0.8'
            }, {
                type: 'checkbox',
                checked: true
            });

            checkboxContainer.appendChild(checkbox);

            const thumbnail = Utils.createStyledElement('div', {
                width: '100%',
                height: '100%',
                backgroundImage: `url(${img.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '4px',
                border: '1px solid #eee',
                cursor: 'pointer',
                transition: 'all 0.2s'
            });

            // Add hover effects for the thumbnail container
            thumbnailContainer.addEventListener('mouseover', () => {
                checkboxContainer.style.opacity = '1';
                thumbnail.style.filter = 'brightness(1.1)';
            });

            thumbnailContainer.addEventListener('mouseout', () => {
                checkboxContainer.style.opacity = '0.6';
                thumbnail.style.filter = 'none';
            });

            const number = Utils.createStyledElement('div', {
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                opacity: '0.8'
            });
            number.textContent = index + 1;

            thumbnail.addEventListener('mouseover', () => this.handleThumbnailHover(thumbnail, img, enlargedPreview));
            thumbnail.addEventListener('mouseout', () => this.handleThumbnailOut(thumbnail, enlargedPreview));

            thumbnailContainer.appendChild(thumbnail);
            thumbnailContainer.appendChild(checkboxContainer);
            thumbnailContainer.appendChild(number);

            return thumbnailContainer;
        },

        handleThumbnailHover(thumbnail, img, enlargedPreview) {
            const enlargedImg = new Image();
            enlargedImg.src = img.src;
            enlargedImg.style.maxWidth = '800px';
            enlargedImg.style.maxHeight = '80vh';
            enlargedImg.style.objectFit = 'contain';

            enlargedPreview.innerHTML = '';
            enlargedPreview.appendChild(enlargedImg);
            enlargedPreview.style.display = 'block';
            thumbnail.style.transform = 'scale(1.05)';
        },

        handleThumbnailOut(thumbnail, enlargedPreview) {
            enlargedPreview.style.display = 'none';
            thumbnail.style.transform = 'scale(1)';
        },

        createPreviewComponents(images) {
            const previewContainer = Utils.createStyledElement('div', {
                position: 'fixed',
                bottom: '100px',
                right: '40px',
                display: 'none',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '400px',
                maxHeight: '80vh',
                overflow: 'auto',
                zIndex: '2147483646'
            });

            // Add prefix input field
            const prefixContainer = Utils.createStyledElement('div', {
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginBottom: '12px'
            });

            const prefixLabel = Utils.createStyledElement('label', {
                fontSize: '12px',
                color: '#666',
                fontWeight: 'bold'
            });
            prefixLabel.textContent = i18n[Utils.getLanguage()].fileNamePrefix;

            const prefixDescription = Utils.createStyledElement('div', {
                fontSize: '11px',
                color: '#888',
                marginBottom: '4px'
            });
            prefixDescription.textContent = i18n[Utils.getLanguage()].prefixDescription;

            const prefixInput = Utils.createStyledElement('input', {
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '13px',
                width: '100%',
                boxSizing: 'border-box'
            });
            prefixInput.value = Utils.getFilePrefix();

            prefixContainer.appendChild(prefixLabel);
            prefixContainer.appendChild(prefixDescription);
            prefixContainer.appendChild(prefixInput);

            // Add select all checkbox
            const selectAllContainer = Utils.createStyledElement('div', {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
            });

            const selectAllCheckbox = Utils.createStyledElement('input', {
                margin: '0',
                cursor: 'pointer',
                width: '16px',
                height: '16px',
                opacity: '0.8'
            }, {
                type: 'checkbox',
                checked: true
            });

            const selectAllLabel = Utils.createStyledElement('label', {
                fontSize: '13px',
                color: '#444',
                cursor: 'pointer',
                fontWeight: 'bold'
            });
            selectAllLabel.textContent = i18n[Utils.getLanguage()].selectAllImages;

            // Add click handler for the label
            selectAllLabel.addEventListener('click', () => {
                selectAllCheckbox.checked = !selectAllCheckbox.checked;
                const checkboxes = thumbnailsContainer.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                });
            });

            selectAllContainer.appendChild(selectAllCheckbox);
            selectAllContainer.appendChild(selectAllLabel);

            const header = Utils.createStyledElement('div', {
                borderBottom: '1px solid #eee',
                paddingBottom: '8px',
                marginBottom: '12px',
                fontSize: '14px',
                color: '#333',
                fontWeight: 'bold'
            });
            header.textContent = `${images.length} ${i18n[Utils.getLanguage()].imagesAvailable}`;

            const thumbnailsContainer = Utils.createStyledElement('div', {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '8px',
                marginBottom: '12px'
            });

            const enlargedPreview = Utils.createStyledElement('div', {
                position: 'fixed',
                display: 'none',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                zIndex: '2147483647',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            });

            // Add download selected button
            const downloadSelectedBtn = Utils.createStyledElement('button', {
                padding: '12px 16px',
                backgroundColor: '#BF0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                width: '100%',
                transition: 'background-color 0.3s'
            });
            downloadSelectedBtn.textContent = i18n[Utils.getLanguage()].downloadSelected;

            downloadSelectedBtn.addEventListener('mouseover', () => {
                downloadSelectedBtn.style.backgroundColor = '#d70000';
            });

            downloadSelectedBtn.addEventListener('mouseout', () => {
                downloadSelectedBtn.style.backgroundColor = '#BF0000';
            });

            downloadSelectedBtn.style.cursor = 'pointer';

            previewContainer.appendChild(prefixContainer);
            previewContainer.appendChild(selectAllContainer);
            previewContainer.appendChild(header);
            previewContainer.appendChild(thumbnailsContainer);
            previewContainer.appendChild(downloadSelectedBtn);

            return {
                previewContainer,
                thumbnailsContainer,
                enlargedPreview,
                prefixInput,
                selectAllCheckbox,
                downloadSelectedBtn
            };
        }
    };

    // Main App Module
    const App = {
        init() {
            console.log('Rakuten Image Download Script is running on', window.location.href);

            // Only run on item or soko Rakuten pages
            const urlRegex = /^https:\/\/(?:item|soko)\.rakuten\.co\.jp\/.*$/;
            if (!urlRegex.test(window.location.href)) {
                console.warn('URL does not match, script will not run.');
                return;
            }

            window.addEventListener('load', () => this.waitForContent(10));
        },

        waitForContent(maxRetries = 10) {
            const images = document.querySelectorAll('span.sale_desc img');
            if (images.length > 0) {
                this.addDownloadButton();
            } else if (maxRetries > 0) {
                setTimeout(() => this.waitForContent(maxRetries - 1), 1000);
            } else {
                console.warn('No images found after retries.');
            }
        },

        addDownloadButton() {
            const container = Utils.createStyledElement('div', {
                position: 'fixed',
                bottom: '40px',
                right: '40px',
                zIndex: '2147483647',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: '0.7',
                transition: 'all 0.3s ease',
                padding: '4px 4px 4px 12px',
                borderRadius: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
            });

            // Counter display
            const counter = Utils.createStyledElement('span', {
                fontSize: '12px',
                color: '#666',
                opacity: '0',
                transition: 'opacity 0.3s ease',
                order: '1',
            });
            const images = document.querySelectorAll('span.sale_desc img');
            counter.textContent = `${images.length} images`;

            // Main download button
            const downloadBtn = Utils.createStyledElement('button', {
                border: 'none',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#000000',
                width: '40px',
                height: '40px',
                fontSize: '18px',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                order: '2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }, {
                id: 'downloadImagesButton',
                title: i18n[Utils.getLanguage()].downloadAllImages,
                innerHTML: '⬇️'
            });

            // Close button
            const closeBtn = Utils.createStyledElement('button', {
                border: 'none',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#666',
                width: '24px',
                height: '24px',
                fontSize: '12px',
                cursor: 'pointer',
                opacity: '0',
                transition: 'opacity 0.3s ease',
                order: '3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }, {
                title: i18n[Utils.getLanguage()].hideControls,
                innerHTML: '✕'
            });

            const {
                previewContainer,
                thumbnailsContainer,
                enlargedPreview,
                prefixInput,
                selectAllCheckbox,
                downloadSelectedBtn
            } = UIComponents.createPreviewComponents(images);

            // Fix hover behavior
            let isHovering = false;

            container.addEventListener('mouseover', () => {
                container.style.opacity = '1';
                closeBtn.style.opacity = '1';
                counter.style.opacity = '1';
            });

            container.addEventListener('mouseout', () => {
                if (!isHovering) {
                    container.style.opacity = '0.7';
                    closeBtn.style.opacity = '0';
                    counter.style.opacity = '0';
                }
            });

            downloadBtn.addEventListener('mouseover', () => {
                isHovering = true;
                previewContainer.style.display = 'flex';
            });

            previewContainer.addEventListener('mouseover', () => {
                isHovering = true;
                container.style.opacity = '1';
                closeBtn.style.opacity = '1';
                counter.style.opacity = '1';
            });

            previewContainer.addEventListener('mouseleave', () => {
                isHovering = false;
                setTimeout(() => {
                    if (!isHovering) {
                        previewContainer.style.display = 'none';
                        container.style.opacity = '0.7';
                        closeBtn.style.opacity = '0';
                        counter.style.opacity = '0';
                    }
                }, 100);
            });

            downloadBtn.addEventListener('mouseleave', () => {
                isHovering = false;
                setTimeout(() => {
                    if (!isHovering) {
                        previewContainer.style.display = 'none';
                    }
                }, 100);
            });

            // Handle select all checkbox
            selectAllCheckbox.addEventListener('change', () => {
                const checkboxes = thumbnailsContainer.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                });
            });

            // Update select all checkbox state based on individual checkboxes
            function updateSelectAllState() {
                const checkboxes = thumbnailsContainer.querySelectorAll('input[type="checkbox"]');
                const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                selectAllCheckbox.checked = checkedCount === checkboxes.length;
                selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
            }

            // Handle download selected button
            downloadSelectedBtn.addEventListener('click', () => {
                const checkboxes = thumbnailsContainer.querySelectorAll('input[type="checkbox"]');
                const selectedIndices = Array.from(checkboxes)
                    .map((checkbox, index) => checkbox.checked ? index : -1)
                    .filter(index => index !== -1);

                if (selectedIndices.length > 0) {
                    DownloadManager.downloadImages(prefixInput.value, selectedIndices);
                }
            });

            images.forEach((img, index) => {
                const thumbnail = UIComponents.createThumbnail(img, index, enlargedPreview);
                if (thumbnail) {
                    const checkbox = thumbnail.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.addEventListener('change', updateSelectAllState);
                    }
                    thumbnailsContainer.appendChild(thumbnail);
                }
            });

            closeBtn.addEventListener('click', () => {
                container.remove();
                previewContainer.remove();
                enlargedPreview.remove();
            });

            container.appendChild(counter);
            container.appendChild(downloadBtn);
            container.appendChild(closeBtn);
            document.body.appendChild(container);
            document.body.appendChild(previewContainer);
            document.body.appendChild(enlargedPreview);
        }
    };

    // Start the app
    App.init();
})();