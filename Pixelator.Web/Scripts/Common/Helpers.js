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

function CreateFileDataURL(File) {
    if (window.webkitURL) {
        return window.webkitURL.createObjectURL(File.Data);
    } else if (window.URL && window.URL.createObjectURL) {
        return window.URL.createObjectURL(File.Data);
    }
}

function LoadImageDimensions(ImageFile) {
   return $.Deferred(function (Deferred) {
       var ImageURL = CreateFileDataURL(ImageFile);
       if (!ImageURL) {
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
    return $.Deferred(function (Deferred) {
        try {
            loadImage(
                ImageFile.Data,
                function (canvas) {
                    if (canvas.type === "error") {
                        Deferred.reject();
                    } else {
                        canvas.toBlob(function (blob) {
                            ImageFile.UpdateData(blob);
                            Deferred.resolve();
                        }, ImageFile.Data.type);
                    }
                },
                {
                    maxWidth: MaxWidth,
                    maxHeight: MaxHeight,
                    canvas: true
                }
            );
        } catch (Error) {
            Deferred.reject();
        }
    }).promise();
}