$(document).ready(function() {
    window.EncoderContainer.RegisterStepLoader("/Encoder/ChooseData", function () {
        var Container = window.EncoderContainer;
        var DataListElement = $("#InputDataList");
        var UploadDataList = new DataList(DataListElement);
        var DataListDragDataArea = $("#DataListDragDataArea");
        var ErrorDialog = new TranscodingErrorDialog($("#ChooseDataErrorDialog"));
        var AddDirectoryButton = $("#AddDirectoryButton");

        var IsChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());

        var Files = Container.TranscodingJob.Files;
        var Directories = Container.TranscodingJob.RelativeDirectories;
        var MaxUploadSize = 20971520;
        var MaxUploadString = "20MB";
        var MaxFilesLimit = 10000;
        var MaxDirectoriesLimit = 1000;

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
                    return "Please add at least one file";

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

            var SelectedDirectories = UploadDataList.GetSelectedDirectories();
            Directories = RemoveFromArray(SelectedDirectories, Directories);

            UploadDataList.Update(Files, Directories);
        }

        UpdateDataList = function() {
            UploadDataList.Update(Files, Directories);
        }

        TriggerFileInput = function(FileInput) {
            FileInput.show();
            FileInput.focus();
            FileInput.click();
            FileInput.hide();
        }

        ResetFormElement = function(Element) {
            Element.wrap('<form>').closest('form').get(0).reset();
            Element.unwrap();
        }

        RemoveFromArray = function(RemoveArray, SourceArray) {
            var NewArray = [];
            for (var i = 0; i < SourceArray.length; i++) {
                var Element = SourceArray[i];
                if ($.inArray(Element, RemoveArray) === -1)
                    NewArray.push(Element);
            }

            return NewArray;
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
                return "Please add at least one file";

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
        };

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

        //Bind the drag and drop data area to appropriate event handlers
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
        DrageAreaDomElement.addEventListener("drop", function(e) {
            HandleDroppedData(e);
            DragChanged(e);
        });

        //Bind the remove selected button to respective method
        var RemoveSelectedButton = $("#RemoveSelectedButton");
        RemoveSelectedButton.click(RemoveSelectedData);
        $("#RemoveAllButton").click(function () {
            Files = [];
            Directories = [];
            UpdateDataList();
        });

        if (IsIOS()) {
            FileInput.removeAttr("multiple");
            RemoveSelectedButton.addClass("Hidden");
        }

        //Update data list, might have previously entered data
        UploadDataList.Update(Files, Directories);
    });
});