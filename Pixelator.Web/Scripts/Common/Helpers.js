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
        HandleDroppedDataCallback(e.target.files || e.dataTransfer.files, e.dataTransfer ? e.dataTransfer.items : undefined);
        DragChanged(e);
    });
}

function SetUpPasteZone(PasteElement, PasteCallback) {
    PasteElement.on("paste", function (e) {
        var items = (e.clipboardData || e.originalEvent.clipboardData).items;
        var fileItems = [];
        var files = [];
        for (var i = 0; i < items.length; i++) {
            var file = items[i].getAsFile();
            if (file) {
                files.push(file);
                fileItems.push(items[i]);
            }
        }

        PasteCallback(files, fileItems);
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
            loadImage.parseMetaData(
                ImageFile.Data,
                function (data) {
                    var originalOrientation = data.exif ? data.exif.get('Orientation') : undefined;

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
                            canvas: true,
                            orientation: originalOrientation
                        }
                    );
                },
                {
                    maxMetaDataSize: 262144,
                    disableImageHead: false
                }
            );
        } catch (Error) {
            Deferred.reject();
        }
    }).promise();
}