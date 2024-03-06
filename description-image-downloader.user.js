// ==UserScript==
// @name         Rakuten Image Downloader with Dynamic Prefix
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Manually trigger image downloads on Rakuten item detail pages, using the item code as the file name prefix.
// @author       minyoon
// @match        https://item.rakuten.co.jp/*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Delay function
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Function to fetch image as Blob and then download it
    async function downloadImageAsBlob(imageUrl, index, filePrefix) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const fileExtension = imageUrl.split('.').pop().split(/#|\?/)[0];

            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;

            downloadLink.download = `${filePrefix}-${index + 1}.${fileExtension}`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    }

    // Main function to download images
    async function downloadImagesUnderSaleDesc(filePrefix, delayMs) {
        const images = document.querySelectorAll('span.sale_desc img');
        for (let index = 0; index < images.length; index++) {
            await downloadImageAsBlob(images[index].src, index, filePrefix);
            await delay(delayMs);
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
            downloadImagesUnderSaleDesc(filePrefix, 100);
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

