$(document).ready(function() {
    window.EncoderContainer.RegisterStepLoader("/Encoder/ChooseData", function () {
        var Container = window.EncoderContainer;
        var DataListElement = $("#InputDataList");
        var UploadDataList = new DataList(DataListElement);
        var DataListDragDataArea = $("#DataListDragDataArea");
        var ErrorDialog = new TranscodingErrorDialog($("#ChooseDataErrorDialog"));
        var AddDirectoryButton = $("#AddDirectoryButton");
        var SpecifyPicture = $("#SpecifyPicture");

        var IsChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());

        var Files = Container.TranscodingJob.Files;
        var Directories = Container.TranscodingJob.RelativeDirectories;
        var EmbeddedImage = Container.TranscodingJob.EmbeddedImage;


        var MaxUploadSize = Container.TranscodingJob.GetMaximumDataSize();
        var MaxUploadString = SizeToApproxString(MaxUploadSize);
        var MaxFilesLimit = 10000;
        var MaxDirectoriesLimit = 1000;


        HandlePictureInput = function (Files) {
            if (Files[0] != undefined) {
                EmbeddedImage = File.FromFileData(Files[0]);

                var maxCoverImageSize = window.TranscodingConfig.MaxCoverImageSize;
                var exceedMaxSizeMessage = "The selected cover picture exceeds the maximum dimensions of "
                    + maxCoverImageSize.Width + " x " + maxCoverImageSize.Height + "px."
                    + " The picture will be resized to fit.";
                
                LoadImageDimensions(EmbeddedImage).done(function(Dimensions) {
                    if (Dimensions.Width > maxCoverImageSize.Width || Dimensions.Height > maxCoverImageSize.Height) {
                        ErrorDialog.Show(exceedMaxSizeMessage,"Large Cover Picture", function () {
                            ResizeImage(EmbeddedImage, maxCoverImageSize.Width, maxCoverImageSize.Height)
                                .fail(function() {
                                    EmbeddedImage = undefined;
                                    ErrorDialog.Show("An error occured while attempting to resize your picture. Please try a smaller picture.");
                                })
                                .always(UpdateDataList);
                        });
                    } else {
                        UpdateDataList();
                    }
                }).fail(function() {
                    UpdateDataList();
                });
            }
        }
        
        HandleFileInput = function(NewFiles) {
            //Warn user leaving when they enter data
            Container.ShouldWarnUserLeaving(true);

            DataListElement.css("cursor", "wait");

            var FileDatas = $(this).prop("files") || NewFiles;
            if (FileDatas.length == 0)
                return;
            var FileArrayResult = ValidateFileAmount(FileDatas.length);
            if (FileArrayResult !== true) {
                DisplayError(FileArrayResult);
                return;
            }

            //Get files and directories from input
            var NewFiles = [];
            var DirectoryPaths = [];
            for (var i = 0; i < FileDatas.length; i++) {
                var _File = File.FromFileData(FileDatas[i]);

                //Dont add file if it is a directory placeholder
                if (_File.Name != ".")
                    NewFiles.push(_File);

                if (_File.RelativePath == "" || DirectoryPaths.indexOf(_File.RelativePath) != -1)
                    continue;

                //Add relative directories from file to job
                var CurrentDirectory = _File.RelativePath;
                while (CurrentDirectory != "") {
                    //Check if duplicate
                    if (DirectoryPaths.indexOf(CurrentDirectory) == -1) {
                        DirectoryPaths.push(CurrentDirectory);
                    }

                    var SecondLastSlashIndex = CurrentDirectory.substring(0, CurrentDirectory.length - 1).lastIndexOf("\\");
                    if (SecondLastSlashIndex == -1)
                        break;
                    CurrentDirectory = CurrentDirectory.substring(0, SecondLastSlashIndex + 1);
                }
            }
            //Get directories from paths
            var NewDirectories = [];
            for (var DirectoryPathsKey in DirectoryPaths) {
                var _Directory = Directory.FromPath(DirectoryPaths[DirectoryPathsKey]);
                NewDirectories.push(_Directory);
            }

            AddToDataList(NewFiles, NewDirectories);

            //Reset if form input
            if ($(this).is("input"))
                ResetFormElement($(this));

            DataListElement.css("cursor", "default");
        }

        HandleDroppedData = function(e) {
            //Warn user leaving when they enter data
            Container.ShouldWarnUserLeaving(true);

            if (!IsChrome) {
                HandleFileInput(e.target.files || e.dataTransfer.files);
                return;
            }

            var Semaphore = 0;
            var SemaphoreTotal = 0;
            var FileCount = Files.length;
            var DirectoryCount = Directories.length;
            var Failed = false;
            var NewFiles = [];
            var NewDirectories = [];
            var AddFile = function(_File) {
                FileCount++;
                var ValidationResult = ValidateFileAmount(FileCount);
                if (ValidationResult !== true) {
                    DisplayError(ValidationResult);
                    ErrorCallback();
                }
                NewFiles.push(File.FromFileEntry(_File.Entry, _File.Data));
            };
            var AddDirectory = function(DirectoryEntry) {
                DirectoryCount++;
                var ValidationResult = ValidateDirectoryAmount(DirectoryCount);
                if (ValidationResult !== true) {
                    DisplayError(ValidationResult);
                    ErrorCallback();
                }
                NewDirectories.push(Directory.FromDirectoryEntry(DirectoryEntry));
            };
            var ErrorCallback = function() {
                Failed = true;
            };
            try {
                for (var i = 0; i < e.dataTransfer.items.length; i++) {
                    var Item = e.dataTransfer.items[i];
                    var Entry = Item.webkitGetAsEntry();
                    if (Entry.isFile) {
                        AddFile({ Entry: Entry, Data: Item.getAsFile() });
                    } else if (Entry.isDirectory) {
                        AddDirectory(Entry);
                        ReadDirectory(Entry, function(Contents) {
                            for (var Filei = 0; Filei < Contents.Files.length; Filei++) {
                                AddFile(Contents.Files[Filei]);
                            }
                            for (var Directoryi = 0; Directoryi < Contents.Directories.length; Directoryi++) {
                                AddDirectory(Contents.Directories[Directoryi]);
                            }
                            Semaphore++;
                        }, ErrorCallback);
                        SemaphoreTotal++;
                    }
                    if (Failed)
                        break;
                }
            } catch (ex) {
                ErrorCallback();
            }

            var AddNewData = function() {
                AddToDataList(NewFiles, NewDirectories);
            };

            var IsDone = function() {
                if (Failed) {
                    DisplayError("Could not add dropped data.");
                    return;
                }
                if (Semaphore == SemaphoreTotal)
                    AddNewData();
                else
                    setTimeout(IsDone, 100);
            };
            IsDone();
        }

        var ReadDirectory = function(Directory, DoneCallback, ErrorCallback) {
            var Contents = {
                Files: [],
                Directories: []
            };
            var Failed = false;
            var Semaphore = 0;
            var SemaphoreTotal = 0;
            var ReadDirectory = function(_Directory, _SuccessCallback, _ErrorCallback) {
                GetDirectoryContents(_Directory, function(DirectoryContents) {
                        for (var i = 0; i < DirectoryContents.length; i++) {
                            var Entry = DirectoryContents[i];
                            if (Entry.isFile) {
                                var HandleFileData = function(_Entry) {
                                    return function(FileData) {
                                        Contents.Files.push({
                                            Entry: _Entry,
                                            Data: FileData
                                        });
                                        Semaphore++;
                                    };
                                };
                                Entry.file(HandleFileData(Entry), _ErrorCallback);
                                SemaphoreTotal++;
                            } else if (Entry.isDirectory) {
                                Contents.Directories.push(Entry);
                                ReadDirectory(Entry, function() {
                                    Semaphore++;
                                }, _ErrorCallback);
                                SemaphoreTotal++;
                            }
                            if (Failed)
                                break;
                        }
                        if (!Failed)
                            _SuccessCallback();
                    },
                    _ErrorCallback);
            };
            var HandleError = function() {
                Failed = true;
            };
            ReadDirectory(Directory, function() {
                    Semaphore++;
                },
                HandleError);
            SemaphoreTotal++;

            var IsDone = function() {
                if (Failed) {
                    ErrorCallback();
                    return;
                }
                if (Semaphore === SemaphoreTotal)
                    DoneCallback(Contents);
                else
                    setTimeout(IsDone, 100);
            };
            IsDone();
        }

        var GetDirectoryContents = function(Directory, DoneCallback, ErrorCallback) {
            var Contents = [];
            var DirectoryReader = Directory.createReader();
            var ReadAllEntries = function(_DirectoryReader) {
                var HandleResult = function(Results) {
                    if (!Results.length) {
                        DoneCallback(Contents);
                    } else {
                        Contents = $.merge(Contents, Results);
                        ReadAllEntries(_DirectoryReader);
                    }
                };
                _DirectoryReader.readEntries(HandleResult, ErrorCallback);
            }
            ReadAllEntries(DirectoryReader);
        }

        AddToDataList = function(NewFiles, NewDirectories) {
            //Add directories and files arrays but backup old arrays
            var OldFiles = $.merge([], Files);
            Files = $.merge(Files, NewFiles);
            var OldDirectories = $.merge([], Directories);
            Directories = $.merge(Directories, NewDirectories);
            //If invalid rollback and display error
            var ValidationResult = (function() {
                if (Files.length === 0 && Directories.length === 0)
                    return "Please add at least one file to encode";

                var FilesAmountResult = ValidateFileAmount(Files.length);
                if (FilesAmountResult !== true)
                    return FilesAmountResult;

                var DirectoryAmountResult = ValidateDirectoryAmount(Directories.length);
                if (DirectoryAmountResult !== true)
                    return DirectoryAmountResult;

                var TotalSize = 0;
                for (var i = 0; i < Files.length; i++) {
                    TotalSize += Files[i].Length;
                }
                if (TotalSize > MaxUploadSize)
                    return "Data exceeds maximum upload limit (" + MaxUploadString + ")";

                var DupilicateDirectory = false;
                var EmptyDirectoryPath = false;
                var DirectoryPaths = [];
                for (var DirectoryKey in Directories) {
                    var DirectoryPath = Directories[DirectoryKey].Path;
                    if ($.inArray(DirectoryPath, DirectoryPaths) !== -1)
                        DupilicateDirectory = true;
                    if (DirectoryPath === "")
                        EmptyDirectoryPath = true;

                    DirectoryPaths.push(DirectoryPath);
                }

                if (DupilicateDirectory || EmptyDirectoryPath)
                    return "Duplicate folders are not allowed";

                var DuplicateFile = false;
                var EmptyFilePath = false;
                var FilePaths = [];
                for (var FileKey in Files) {
                    if (Files[FileKey] === EmbeddedImage) {
                        continue;
                    }
                    var FilePath = Files[FileKey].GetFullPath();
                    if ($.inArray(FilePath, FilePaths) !== -1)
                        DuplicateFile = true;
                    if (FilePath === "")
                        EmptyFilePath = true;
                    FilePaths.push(FilePath);
                }

                if (DuplicateFile || EmptyFilePath)
                    return "Duplicate files are not allowed";

                return true;
            })();
            if (ValidationResult !== true) {
                Files = OldFiles;
                Directories = OldDirectories;
                DisplayError(ValidationResult);
            }

            UpdateDataList();
        }

        RemoveSelectedData = function() {
            var SelectedFiles = UploadDataList.GetSelectedFiles();
            Files = RemoveFromArray(SelectedFiles, Files);

            for (var i = 0; i < SelectedFiles.length; i++) {
                if (SelectedFiles[i] === EmbeddedImage) {
                    EmbeddedImage = undefined;
                    break;
                }
            }

            var SelectedDirectories = UploadDataList.GetSelectedDirectories();
            Directories = RemoveFromArray(SelectedDirectories, Directories);

            UpdateDataList();
        }

        RemoveFromArray = function (RemoveArray, SourceArray) {
            var NewArray = [];
            for (var i = 0; i < SourceArray.length; i++) {
                var Element = SourceArray[i];
                if ($.inArray(Element, RemoveArray) === -1)
                    NewArray.push(Element);
            }

            return NewArray;
        }

        UpdateDataList = function () {
            Container.SaveToJob(Container.TranscodingJob);
            MaxUploadSize = Container.TranscodingJob.GetMaximumDataSize();
            MaxUploadString = SizeToApproxString(MaxUploadSize);

            if (Container.TranscodingJob.GetTotalDataSize() > window.TranscodingConfig.MaxDataSizes.AutoPixelStorage) {
                SpecifyPicture.prop("disabled", true).attr("title", "The select data exceeds the maximum size limit for a cover photo");
            } else {
                SpecifyPicture.prop("disabled", false).removeAttr("title");
            }

            UploadDataList.Update(Files, Directories);
            if (EmbeddedImage != undefined) {
                UploadDataList.PrependRootFile(EmbeddedImage, "Picture");
            }
        }

        ValidateFileAmount = function(Amount) {
            if (Amount > MaxFilesLimit)
                return "Files exceed the maximum limit (" + MaxFilesLimit.toString() + ")";

            return true;
        }

        ValidateDirectoryAmount = function(Amount) {
            if (Amount > MaxDirectoriesLimit)
                return "Folders exceed the maximum limit (" + MaxDirectoriesLimit.toString() + ")";

            return true;
        }

        DisplayError = function(ErrorMessage) {
            ErrorDialog.Show(ErrorMessage);
        }

        Container.CurrentPageIsValid = function() {
            if (Files.length === 0 && Directories.length === 0)
                return "Please add at least one file to encode";

            var FilesAmountResult = ValidateFileAmount(Files.length);
            if (FilesAmountResult !== true)
                return FilesAmountResult;

            var DirectoryAmountResult = ValidateDirectoryAmount(Directories.length);
            if (DirectoryAmountResult !== true)
                return DirectoryAmountResult;

            var TotalSize = 0;
            for (var i = 0; i < Files.length; i++) {
                TotalSize += Files[i].Length;
            }
            if (TotalSize > MaxUploadSize)
                return "Data exceeds maximum upload limit (" + MaxUploadString + ")";

            var DupilicateDirectory = false;
            var EmptyDirectoryPath = false;
            var DirectoryPaths = [];
            for (var DirectoryKey in Directories) {
                var DirectoryPath = Directories[DirectoryKey].Path;
                if ($.inArray(DirectoryPath, DirectoryPaths) !== -1)
                    DupilicateDirectory = true;
                if (DirectoryPath === "")
                    EmptyDirectoryPath = true;

                DirectoryPaths.push(DirectoryPath);
            }

            if (DupilicateDirectory || EmptyDirectoryPath)
                return "Duplicate folders are not allowed";

            var DuplicateFile = false;
            var EmptyFilePath = false;
            var FilePaths = [];
            for (var FileKey in Files) {
                var FilePath = Files[FileKey].GetFullPath();
                if ($.inArray(FilePath, FilePaths) !== -1)
                    DuplicateFile = true;
                if (FilePath === "")
                    EmptyFilePath = true;
                FilePaths.push(FilePath);
            }

            if (DuplicateFile || EmptyFilePath)
                return "Duplicate files are not allowed";

            return true;
        };
        Container.DisplayError = DisplayError;
        Container.SaveToJob = function(EncodingJob) {
            EncodingJob.Files = Files;
            EncodingJob.RelativeDirectories = Directories;
            EncodingJob.EmbeddedImage = EmbeddedImage;
        };

        var PictureInput = $("#PictureInput");
        SpecifyPicture.click(function () {
            TriggerFileInput(PictureInput);
        });
        PictureInput.change(function() {
            HandlePictureInput($(this).prop("files"));
            ResetFormElement($(this));
        });

        //Bind file input buttons
        var FileInput = $("#FilesInput");
        $("#AddFilesButton").click(function() {
            TriggerFileInput(FileInput);
        });
        FileInput.change(HandleFileInput);

        //Bind the directory input if not on chrome :(
        if (IsChrome) {
            var DirectoryInput = $("#DirectoryInput");
            AddDirectoryButton.click(function() {
                TriggerFileInput(DirectoryInput);
            });

            DirectoryInput.change(HandleFileInput);
        } else {
            AddDirectoryButton.prop("disabled", true);
            AddDirectoryButton.attr("title", AddDirectoryButton.attr("data-not-supported-tooltip"));
        }

        SetUpDropZone(DataListDragDataArea, HandleDroppedData);

        //Bind the remove selected button to respective method
        var RemoveSelectedButton = $("#RemoveSelectedButton");
        RemoveSelectedButton.click(RemoveSelectedData);
        $("#RemoveAllButton").click(function () {
            Files = [];
            Directories = [];
            EmbeddedImage = undefined;
            UpdateDataList();
        });

        if (IsIOS()) {
            FileInput.removeAttr("multiple");
        }

        //Update data list, might have previously entered data
        UpdateDataList();
    });
});