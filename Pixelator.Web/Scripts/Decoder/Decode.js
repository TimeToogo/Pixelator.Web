$(document).ready(function() {
    window.DecoderContainer.RegisterStepLoader("/Decoder/Decode", function() {
        var Container = window.DecoderContainer;
        var DecodingJob = Container.TranscodingJob;

        var ErrorDialog = new TranscodingErrorDialog($("#DecodingErrorDialog"));
        var ProgressInfo = $("#ProgressInfo");
        var StatusElement = $("#ProgressInfo > #Status");
        var ProgressBarElement = $("#ProgressInfo > #ProgressBar");
        var DownloadIFrame = $("#DownloadIFrame");
        var Completed = false;

        var UpdateStatus = function(Status, ProgressBarValue) {
            StatusElement.text(Status);
            ProgressBarElement.progressbar("option", "value", ProgressBarValue);
        };
        var DisplayError = function(ErrorMessage, ClosedCallback) {
            ProgressInfo.addClass("Hidden");
            ErrorDialog.Show(ErrorMessage, "Could not decode image", function() {
                ProgressInfo.removeClass("Hidden");
                ClosedCallback();
            });
        };

        var SubmitJob = function(SuccessCallback, ErrorCallback) {
            IntializeProgressBar(ProgressBarElement);
            UpdateStatus("Intializing", false);

            var formData = new FormData();
            formData.append("password", DecodingJob.Password);
            formData.append("image", DecodingJob.ImageFile.Data);

            $.ajax({
                url: "/api/Decoder/Structure",
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
                        UpdateStatus("Decoding your data", false);
                    });
                }
            }).done(function(response) {
                DecodingJob.ID = response.id;
                $.each(response.files, function(key, fileInfo) {
                    DecodingJob.Files.push(File.FromServerResponse(fileInfo));
                });
                $.each(response.directories, function(key, directoryInfo) {
                    DecodingJob.RelativeDirectories.push(Directory.FromServerResponse(directoryInfo));
                });

                Completed = true;
                SuccessCallback();
            })
            .fail(function (xhr) {
                if (xhr.status === 404) {
                    ErrorCallback(undefined, "An error occured while uploading your picture");
                } else if (xhr.status === 400) {
                    ErrorCallback(JSON.parse(xhr.responseText).reason);
                } else {
                    ErrorCallback(undefined, "An unknown error occured while attempting to decode your picture");
                }
            });
        };

        Container.CurrentPageIsValid = function() {
            return Completed;
        };
        Container.DisplayError = DisplayError;
        Container.SaveToJob = function(_DecodingJob) {
            _DecodingJob = DecodingJob;
        };


        var TrancodingSuccessCallback = function() {
            Container.LoadNextStep();
        };

        var TrancodingErrorCallback = function (Reason, CustomMessage) {
            
            var RedirectUrl;
            var Message;
            switch (Reason) {
            case "invalid-image":
                RedirectUrl = "/Decoder/ChooseImage";
                Message = "The supplied file is not a decodable picture";
                break;
            case "bad-password":
                RedirectUrl = "/Decoder/ChoosePassword";
                Message = "Please verify you have entered the correct password";
                break;
            default:
                RedirectUrl = "/Decoder/ChooseImage";
                Message = "An error occurred while decoding your picture";
                if (CustomMessage) {
                    Message = CustomMessage;
                }
                break;
            }
            var Redirect = function() {
                Container.LoadStepByUrl(RedirectUrl);
            };
            DisplayError(Message, Redirect);
        };

        SubmitJob(TrancodingSuccessCallback, TrancodingErrorCallback);
    });
});