(function(global) {
    "use strict";

    var DEFAULT_CONTAINER_ID = "panorama-viewer";
    var DEFAULT_FALLBACK_IMAGE = "";
    var activeViewer = null;

    function resolveImageSource(imageSource, fallbackImage) {
        if (typeof imageSource === "string" && imageSource.trim()) {
            return imageSource.trim();
        }

        if (typeof fallbackImage === "string" && fallbackImage.trim()) {
            return fallbackImage.trim();
        }

        throw new Error("A panorama image source is required.");
    }

    function initPanoramaViewer(imageSource, options) {
        var settings = options || {};
        var containerId = settings.containerId || DEFAULT_CONTAINER_ID;
        var fallbackImage = settings.fallbackImage || DEFAULT_FALLBACK_IMAGE;
        var panoramaImage = resolveImageSource(imageSource, fallbackImage);

        if (!global.pannellum || typeof global.pannellum.viewer !== "function") {
            throw new Error("Pannellum is not available.");
        }

        if (activeViewer && typeof activeViewer.destroy === "function") {
            activeViewer.destroy();
        }

        activeViewer = global.pannellum.viewer(containerId, {
            type: "equirectangular",
            panorama: panoramaImage,
            autoLoad: true,
            showControls: true
        });

        return activeViewer;
    }

    global.initPanoramaViewer = initPanoramaViewer;
})(window);
