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

        HandleFileInput = function(Files) {
            Container.ShouldWarnUserLeaving(true);
            
            if (Files[0] != undefined) {
                ImageFile = File.FromFileData(Files[0]);
                ImageFile.Name = ImageFile.Name || "picture" + (ImageFile.GetExtensionFromType() ? "." + ImageFile.GetExtensionFromType() : "");
                UpdateDataList();
            }
        }

        UpdateDataList = function () {
            InputDataList.Update([], []);
            if (ImageFile != undefined) {
                InputDataList.PrependRootFile(ImageFile, "Picture");
            }
        }

        Container.CurrentPageIsValid = function() {
            if (ImageFile == undefined)
                return "Please specify your picture";

            return true;
        };

        Container.DisplayError = function(ErrorMessage) {
            ErrorDialog.Show(ErrorMessage);
        };

        Container.SaveToJob = function(DecodingJob) {
            DecodingJob.ImageFile = ImageFile;
        };

        UpdateDataList();

        SetUpDropZone(DataListDragDataArea, HandleFileInput, HandleFileInput);

        FileInput.change(function() {
            HandleFileInput($(this).prop("files"));
            ResetFormElement($(this));
        });
        ChooseImageButton.click(function() {
            TriggerFileInput(FileInput);
        });

        RemoveImageButton.click(function() {
            ImageFile = undefined;
            UpdateDataList();
        });

        if (IsIOS()) {
            ErrorDialog.Show("The picture decoder is not currently supported on iOS devices. "
                + "This is due to forced file conversions causing unnecessary data loss."
                + "You can still decode your picture by transferring the picture file to another device via email or other apps.",
                "iOS devices not supported");
        }
    });
});