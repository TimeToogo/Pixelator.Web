$(document).ready(function() {
    window.DecoderContainer.RegisterStepLoader("/Decoder/ChooseImage", function() {
        var Container = window.DecoderContainer;
        var DecodingJob = Container.TranscodingJob;
        var ImageFile = DecodingJob.ImageFile;
        var Password = DecodingJob.Password;

        var ErrorDialog = new TranscodingErrorDialog($("#ChooseImageErrorDialog"));
        var ChooseImageButton = $("#ChooseImageButton");
        var RemoveImageButton = $("#RemoveImageButton");
        var FileInput = $("#FileInput");
        var DataListDragDataArea = $("#DataListDragDataArea");

        var InputDataList = new DataList($("#InputDataList"));

        TriggerFileInput = function(FileInput) {
            FileInput.show();
            FileInput.focus();
            FileInput.click();
            FileInput.hide();
        }

        HandleFileInput = function(Files) {
            Container.ShouldWarnUserLeaving(true);
            
            if (Files[0] != undefined) {
                ImageFile = File.FromFileData(Files[0]);
                UpdataDataList();
            }
        }

        ResetFormElement = function(Element) {
            Element.wrap('<form>').closest('form').get(0).reset();
            Element.unwrap();
        }

        UpdataDataList = function() {
            var Files = (ImageFile == undefined) ? [] : [ImageFile];
            InputDataList.Update(Files, []);
        }

        Container.CurrentPageIsValid = function() {
            if (ImageFile == undefined)
                return "Please specify your image";

            return true;
        };

        Container.DisplayError = function(ErrorMessage) {
            ErrorDialog.Show(ErrorMessage);
        };

        Container.SaveToJob = function(DecodingJob) {
            DecodingJob.ImageFile = ImageFile;
        };

        UpdataDataList();

        var DragChanged = function(e) {
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
            HandleFileInput(e.target.files || e.dataTransfer.files);
            DragChanged(e);
        });

        FileInput.change(function() {
            HandleFileInput($(this).prop("files"));
            ResetFormElement($(this));
        });
        ChooseImageButton.click(function() {
            TriggerFileInput(FileInput);
        });

        RemoveImageButton.click(function() {
            ImageFile = undefined;
            UpdataDataList();
        });
    });
});