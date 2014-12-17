$(document).ready(function() {
    window.DecoderContainer.RegisterStepLoader("/Decoder/ChooseDownloads", function() {
        var Container = window.DecoderContainer;

        var DecodingJob = Container.TranscodingJob;
        var Files = DecodingJob.Files;
        var Directories = DecodingJob.RelativeDirectories;

        var DownloadingOverlay = $("#DownloadingOverlay");
        var DownloadingDialog = $("#DownloadingDialog");
        var DownloadingProgressBar = $("#DownloadingProgressBar");

        var NoDownloadWarningOverlay = $("#NoDownloadWarningOverlay");
        var NoDownloadWarningDialog = $("#NoDownloadWarningDialog");
        var NoDownloadWarningDialogYesButton = $("#NoDownloadWarningDialog .YesButton");
        var NoDownloadWarningDialogNoButton = $("#NoDownloadWarningDialog .NoButton");

        var DownloadAllButton = $("#DownloadAllButton");
        var DownloadSelectedButton = $("#DownloadSelectedButton");

        var DataListElement = $("#DownloadDataList");
        var DownloadDataList = new DataList(DataListElement);

        var HasDownloaded = false;
        var IsProceeding = false;
        var IsDownloading = false;
        var DownloadIFrame = $("#DownloadIFrame");

        GetDownloadRequestData = function(files, directories) {
            var data = {
                id: DecodingJob.ID,
                password: DecodingJob.Password,
                files: [],
                directories: []
            }

            $.each(files, function(key, file) {
                data.files.push(file.GetFullPath());
            });
            $.each(directories, function(key, directory) {
                data.directories.push(directory.Path);
            });

            return data;
        };

        DownloadAllData = function(Callback) {
            $.fileDownload("/api/Decoder/Download/", {
                cookieName: "fileDownload",
                httpMethod: "POST",
                data: GetDownloadRequestData(DecodingJob.Files, DecodingJob.RelativeDirectories)
            }).done(Callback);
        }

        DownloadSelectedData = function(Callback) {
            var SelectedFiles = DownloadDataList.GetSelectedFiles();
            var SelectedDirectories = DownloadDataList.GetSelectedDirectories();
            if (SelectedFiles.length === 0 && SelectedDirectories.length === 0) {
                Callback();
                return;
            }

            $.fileDownload("/api/Decoder/Download/", {
                cookieName: "fileDownload",
                httpMethod: "POST",
                data: GetDownloadRequestData(SelectedFiles, SelectedDirectories)
            }).done(Callback);
        }

        ShowDownloadingDialog = function() {
            DownloadingOverlay.removeClass("Hidden");
            DownloadingDialog.removeClass("Hidden");
        }

        CloseDownloadingDialog = function() {
            DownloadingOverlay.addClass("Hidden");
            DownloadingDialog.addClass("Hidden");
        }

        ShowWarningDialog = function() {
            NoDownloadWarningOverlay.removeClass("Hidden");
            NoDownloadWarningDialog.removeClass("Hidden");
        }

        CloseWarningDialog = function() {
            NoDownloadWarningOverlay.addClass("Hidden");
            NoDownloadWarningDialog.addClass("Hidden");
        }

        CanLeavePage = function() {
            if (IsDownloading)
                return "IsDownloading";
            if (!HasDownloaded && !IsProceeding)
                return "HasDownloaded";

            return true;
        }

        DisplayError = function(Error) {
            switch (Error) {
            case "IsDownloading":
                //Should not happen due to downloading dialog
                break;
            case "HasDownloaded":
                ShowWarningDialog();
                break;
            default:
                break;
            }
        }

        SaveToJob = function(DecodingJob) {}

        $(document).ready(function() {

            Container.CurrentPageIsValid = CanLeavePage;
            Container.DisplayError = DisplayError;
            Container.SaveToJob = SaveToJob;

            IntializeProgressBar(DownloadingProgressBar);
            DownloadingProgressBar.progressbar("option", "value", false);

            NoDownloadWarningDialogYesButton.click(function() {
                IsProceeding = true;
                CloseWarningDialog();
                Container.LoadNextStep();
            });
            NoDownloadWarningDialogNoButton.click(CloseWarningDialog);

            var CreateDownloadStartedCallback = function(Callback) {
                return function() {
                    IsDownloading = false;
                    HasDownloaded = true;
                    CloseDownloadingDialog();
                    if (Callback != undefined)
                        Callback();
                }
            };

            var BeginDownload = function(DownloadFunction, DownloadStartedCallback) {
                IsDownloading = true;
                ShowDownloadingDialog();
                DownloadFunction(CreateDownloadStartedCallback(DownloadStartedCallback));
            };


            DownloadDataList.Update(Files, Directories);

            if (Files.length === 1 && Directories.length === 0) {
                BeginDownload(DownloadAllData, Container.LoadNextStep);
                return;
            }

            DownloadAllButton.click(function() {
                BeginDownload(DownloadAllData);
            });
            DownloadSelectedButton.click(function() {
                BeginDownload(DownloadSelectedData);
            });
        });
    });
});