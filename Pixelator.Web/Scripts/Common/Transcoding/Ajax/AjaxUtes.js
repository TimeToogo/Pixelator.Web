function XHRWithProgress(onBegin, onProgress, onComplete) {
    var xhr = $.ajaxSettings.xhr();

    onBegin();
    xhr.upload.addEventListener("progress", function (event) {
        if (event.lengthComputable) {
            var percentComplete = (event.position || event.loaded) / event.total * 100;
            onProgress(percentComplete);
            if (percentComplete >= 100) {
                onComplete();
            }
        }
    }, false);

    return xhr;
}