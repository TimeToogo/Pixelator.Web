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