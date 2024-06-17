// ==UserScript==
// @name         Rakuten Image Downloader with Dynamic Prefix
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Manually trigger image downloads on Rakuten item detail pages, using the item code as the file name prefix.
// @author       minyoon
// @match        https://item.rakuten.co.jp/*/*
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/minyoon/rakuten-parser
// @downloadURL  https://github.com/minyoon/rakuten-parser/raw/main/description-image-downloader.user.js
// @updateURL    https://github.com/minyoon/rakuten-parser/raw/main/description-image-downloader.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Function to download an image as a blob
    async function downloadImage(imageUrl, index, filePrefix) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filePrefix}-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // Main function to download images
    async function downloadImagesUnderSaleDesc(filePrefix) {
        const images = document.querySelectorAll('span.sale_desc img');
        for (let index = 0; index < images.length; index++) {
            await downloadImage(images[index].src, index, filePrefix);
        }
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
