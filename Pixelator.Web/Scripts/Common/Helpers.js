function IsIOS() {
    return (navigator.userAgent.match(/(iPod|iPhone|iPad)/));
};

function TriggerFileInput (FileInput) {
    FileInput.show();
    FileInput.focus();
    FileInput.click();
    FileInput.hide();
}

function ResetFormElement (Element) {
    Element.wrap('<form>').closest('form').get(0).reset();
    Element.unwrap();
}

function SetUpDropZone(DataListDragDataArea, HandleDroppedDataCallback) {
    var DragChanged = function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (e.type === "dragover")
            DataListDragDataArea.addClass("DragHover");
        else
            DataListDragDataArea.removeClass("DragHover");
    }
    var DrageAreaDomElement = DataListDragDataArea.get(0);
    DrageAreaDomElement.addEventListener("dragover", DragChanged);
    DrageAreaDomElement.addEventListener("dragleave", DragChanged);
    DrageAreaDomElement.addEventListener("drop", function (e) {
        HandleDroppedDataCallback(e);
        DragChanged(e);
    });
}

function SizeToApproxString(Size) {
    var FileSizeMeasures = ["B", "KB", "MB", "GB", "TB"];
    var CurrentSize = Size;
    var CurrentSizeMeasure = FileSizeMeasures[0];
    var MaxSize = 1024;

    for (var i = 1; i < FileSizeMeasures.length; i++) {
        if (CurrentSize >= MaxSize) {
            CurrentSizeMeasure = FileSizeMeasures[i];
            CurrentSize = CurrentSize / MaxSize;
        }
    }

    CurrentSize = Math.round(CurrentSize * 10) / 10;
    var ApproxSizeString = CurrentSize.toString() + " " + CurrentSizeMeasure;

    return ApproxSizeString;
}

function LoadImageDimensions(ImageFile) {
   return $.Deferred(function (Deferred) {
        var ImageURL = undefined;
        if (window.webkitURL) {
            ImageURL = window.webkitURL.createObjectURL(ImageFile.Data);
        } else if (window.URL && window.URL.createObjectURL) {
            ImageURL = window.URL.createObjectURL(ImageFile.Data);
        } else {
            Deferred.reject();
        }

        var _Image = new Image();
        _Image.onload = function () {
            Deferred.resolve({
                Width: this.width,
                Height: this.height
            });
        };

        _Image.src = ImageURL;
    }).promise();
}

function ResizeImage(ImageFile, MaxWidth, MaxHeight) {
    // FROM: http://stackoverflow.com/questions/10333971/html5-pre-resize-images-before-uploading
    return $.Deferred(function (Deferred) {
        try {
            var img = document.createElement("img");
            var canvas = document.createElement("canvas");
            var reader = new FileReader();

            reader.onload = function(e) {
                img.src = e.target.result;
                
                img.onload = function () {
                    debugger;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);

                    var MAX_WIDTH = MaxWidth;
                    var MAX_HEIGHT = MaxHeight;
                    var width = img.width;
                    var height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;

                    canvas.toBlob(function(blob) {
                        ImageFile.UpdateData(blob);
                        Deferred.resolve();
                    }, ImageFile.Data.type);
                }
            }

            reader.readAsDataURL(ImageFile.Data);
        } catch (Error) {
            Deferred.reject();
        }
    }).promise();
}