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
                UpdateDataList();
            }
        }

        UpdateDataList = function () {
            if (ImageFile != undefined) {
                InputDataList.PrependRootFile(ImageFile, "Picture");
            } else {
                InputDataList.Update([], []);
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

        SetUpDropZone(DataListDragDataArea, function (e) {
            HandleFileInput(e.target.files || e.dataTransfer.files);
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
            UpdateDataList();
        });
    });
});