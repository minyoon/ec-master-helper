// ==UserScript==
// @name         Rakuten Image Downloader with Dynamic Prefix
// @namespace    http://tampermonkey.net/
// @version      1.0.8
// @description  Manually trigger image downloads on Rakuten item detail pages, using the item code as the file name prefix.
// @author       minyoon
// @match        https://item.rakuten.co.jp/*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @license      MIT
// @homepageURL  https://github.com/minyoon/rakuten-parser
// @downloadURL  https://github.com/minyoon/rakuten-parser/raw/main/description-image-downloader.user.js
// @updateURL    https://github.com/minyoon/rakuten-parser/raw/main/description-image-downloader.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Function to download an image using GM_download
    function downloadImage(imageUrl, fileName) {
        GM_download({
            url: imageUrl,
            name: fileName,
            onerror: function(error) {
                console.error('Download error:', error);
            }
        });
    }

    // Function to get the file extension from a URL
    function getFileExtension(url) {
        const parts = url.split('.');
        return parts[parts.length - 1].split('?')[0]; // Split by '?' to remove any query parameters
    }

    // Main function to download images
    function downloadImagesUnderSaleDesc(filePrefix) {
        const images = document.querySelectorAll('span.sale_desc img');
        images.forEach((img, index) => {
            const imageUrl = img.src;
            const fileExtension = getFileExtension(imageUrl);
            const fileName = `${filePrefix}-${index + 1}.${fileExtension}`;
            downloadImage(imageUrl, fileName);
        });
    }

    // Function to add a download button to the page
    function addDownloadButton() {
        // Parse last part of the URL
        const urlParts = window.location.pathname.split('/');
        const filePrefix = urlParts[urlParts.length - 2]; // The second last part of the URL path

        // Create the button
        const button = document.createElement("button");
        button.textContent = "Download Images";
        button.style.position = "fixed";
        button.style.top = "10px";
        button.style.right = "10px";
        button.style.zIndex = "10000";

        // Add click event listener to trigger the download process with dynamic prefix
        button.addEventListener("click", function() {
            downloadImagesUnderSaleDesc(filePrefix);
        });

        // Append the button to the body
        document.body.appendChild(button);
    }

    // URL check to see if the script should make the button available
    const urlRegex = /https:\/\/item\.rakuten\.co.jp\/[\w-]+\/[\w-]+\/?(\?.*)?$/;
    if (urlRegex.test(window.location.href)) {
        addDownloadButton();
    }
})();

// Note: The warning about "Permissions Policy feature join-ad-interest-group" is related to browser security policies for ad targeting
// and is not directly connected to the functionality of this userscript.
