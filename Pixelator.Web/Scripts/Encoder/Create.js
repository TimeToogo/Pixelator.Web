$(document).ready(function() {
    window.EncoderContainer.RegisterStepLoader("/Encoder/Create", function() {
        var Container = window.EncoderContainer;
        var EncodingJob = Container.TranscodingJob;

        var ErrorDialog = new TranscodingErrorDialog($("#CreatingImageErrorDialog"));
        var ProgressInfo = $("#ProgressInfo");
        var StatusElement = $("#ProgressInfo > #Status");
        var ProgressBarElement = $("#ProgressInfo > #ProgressBar");
        var DownloadIFrame = $("#DownloadIFrame");

        var Completed = false;

        UpdateStatus = function(Status, ProgressBarValue) {
            StatusElement.text(Status);
            ProgressBarElement.progressbar("option", "value", ProgressBarValue);
        };

        DisplayError = function(ErrorMessage, ClosedCallback) {
            ProgressInfo.addClass("Hidden");
            ErrorDialog.Show(ErrorMessage, "Could not encode data", function() {
                ProgressInfo.removeClass("Hidden");
                ClosedCallback();
            });
        };

        SubmitJob = function(SuccessCallback, ErrorCallback) {

            IntializeProgressBar(ProgressBarElement);
            UpdateStatus("Intializing", false);
            var formData = new FormData();
            formData.append("file-name", EncodingJob.FileName);
            formData.append("password", EncodingJob.Password);
            formData.append("image-format", EncodingJob.TranscodingConfiguration.ImageFormat);
            formData.append("encryption-algorithm", EncodingJob.TranscodingConfiguration.EncryptionAlgorithm);
            formData.append("compression-algorithm", EncodingJob.TranscodingConfiguration.CompressionAlgorithm);
            formData.append("compression-level", EncodingJob.TranscodingConfiguration.CompressionLevel);

            $.each(EncodingJob.RelativeDirectories, function(index, directory) {
                formData.append("directories[]", directory.Path);
            });

            $.each(EncodingJob.Files, function(index, file) {
                formData.append("files[" + index + "]", file.Data);
                formData.append("files[" + index + "].name", file.Name);
                formData.append("files[" + index + "].directory", file.RelativePath);
            });

            var ErrorCallbackWrapper = function() {
                ErrorCallback("An unexpected error occured while encoding your data");
            }

            $.ajax({
                url: "/api/Encoder/Encode",
                type: "post",
                dataType: "json",
                contentType: false,
                processData: false,
                data: formData,
                enctype: "multipart/form-data",
                xhr: function() {
                    return XHRWithProgress(function() {
                        UpdateStatus("Uploading", 0.1);
                    }, function(percentComplete) {
                        UpdateProgressBar(ProgressBarElement, percentComplete);
                    }, function() {
                        UpdateStatus("Encoding your data", false);
                    });
                }
            }).done(function (data) {
                EncodingJob.ID = data.id;
                SuccessCallback();
            })
            .fail(ErrorCallbackWrapper);
        };

        LoadCompletePage = function() {
            Container.Complete();
        };

        Container.CurrentPageIsValid = function() {
            return Completed;
        };
        Container.DisplayError = DisplayError;
        Container.SaveToJob = function(EncodingJob) {
            Container.EncodingJob = EncodingJob;
        };



        var TrancodingErrorCallback = function (ErrorMessage) {
            DisplayError(ErrorMessage, Container.LoadPreviousStep);
        };

        var TrancodingSuccessCallback = function () {
            Completed = true;
            if (IsIOS()) {
                Container.LoadNextStep();
            } else {
                UpdateStatus("Starting download", false);
                $.fileDownload("/api/Encoder/Download/" + EncodingJob.ID, {
                    cookieName: "fileDownload"
                }).done(function () { LoadCompletePage(); })
                .fail(function () { TrancodingErrorCallback(); });
            }
        };

        SubmitJob(TrancodingSuccessCallback, TrancodingErrorCallback);
    });
});