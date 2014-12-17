DataList = function (DataListElement) {

    this.DataListElement = DataListElement;

    this.Update = function (Files, Directories) {
        //Empty list
        DataListElement.empty();
        
        var OrderedDirectories = Directories.sort(function (a, b) {
            if (a.Path < b.Path)
                return -1;
            if (a.Path > b.Path)
                return 1;
            return 0;
        });

        var OrderedFiles = Files.sort(function (a, b) {
            if (a.Name < b.Name)
                return -1;
            if (a.Name > b.Name)
                return 1;
            return 0;
        });
        
        //Create file dictionary (associative array key (File relative path) => Array of files)
        var FileDictionary = {};
        //Keep list of root files to append last
        var RootFiles = [];
        for (var FileKey = 0; FileKey < OrderedFiles.length; FileKey++) {
            var File = OrderedFiles[FileKey];
            //Append to array if root file
            if (File.RelativePath == "") {
                RootFiles.push(File);
                continue;
            }
            
            if (File.RelativePath in FileDictionary)
                FileDictionary[File.RelativePath].push(File);
            else
                FileDictionary[File.RelativePath] = [File];
        }
        
        //Creates the files and directory elements and organizes the files into their respective directories
        var DirectoryElements = [];
        for (var i = 0; i < OrderedDirectories.length; i++) {
            var Directory = OrderedDirectories[i];
            //Create the directory element
            var DirectoryElement = CreateDirectoryElement(Directory, GetDirectorySize(Directory, Files));
            //Append appropriate files
            var FilesInDirectory = FileDictionary[Directory.Path];
            if (FilesInDirectory != undefined)
                for (var FileKey = 0; FileKey < FilesInDirectory.length; FileKey++) {
                    GetDirectoryListFromDirectoryElement(DirectoryElement)
                            .append(CreateFileElement(FilesInDirectory[FileKey]));
            }

            DirectoryElements.push(DirectoryElement);
        }
        
        //Organize directories into heirarchy
        for (var i = 0; i < OrderedDirectories.length; i++) {
            var Directory = OrderedDirectories[i];
            //Intialize ParentDirectory as object
            //Get the longest path which Directory.Path starts with
            var ParentDirectory = {};
            ParentDirectory.Path = "";
            //Find the correct elements
            var RelativeList = undefined;
            var ParentList = undefined;
            for (var PathsKey = 0; PathsKey < Directories.length; PathsKey++) {
                var OtherDirectory = Directories[PathsKey];
                if (Directory.Path.length > OtherDirectory.Path.length) {
                    if (Directory.Path.indexOf(OtherDirectory.Path) == 0 && OtherDirectory != Directory && OtherDirectory.Path.length > ParentDirectory.Path.length)
                        ParentDirectory = OtherDirectory;
                }

                if (RelativeList == undefined || ParentList == undefined) {
                    var DirectoryElement = DirectoryElements[PathsKey];
                    var CurrentDirectory = DirectoryElement.data("Directory");
                    if (CurrentDirectory == Directory)
                        RelativeList = DirectoryElement;
                    if (CurrentDirectory == ParentDirectory)
                        ParentList = DirectoryElement;
                }
            }

            //Prepend child to parent (directories should be infront of files)
            if (ParentList != undefined) {
                GetDirectoryListFromDirectoryElement(ParentList)
                    .prepend(RelativeList);
            }
                //Append to file list if no parent (root)
            else {
                DataListElement.append(RelativeList);
            }
        }
        
        //Append root files
        for (var i = 0; i < RootFiles.length; i++) {
            var File = RootFiles[i];
            DataListElement.append(CreateFileElement(File));
        }
       
        //Add seperators
        DataListElement.find("div.Display").each(function () {
            var SeperatorElement = CreateSeperatorElement();
            $(this).after(SeperatorElement);
        });
       
        //Make items selectable
        var SelectableElement = DataListElement.parent();
        SelectableElement.selectable({
            filter: "div.Display"
        });
       
        var SelectableObject = SelectableElement.data("ui-selectable");
        SelectableElement.selectable("option", "selected", ElementSelectionEventFunction(SelectableObject));
        SelectableElement.selectable("option", "unselected", ElementSelectionEventFunction(SelectableObject));
       
        //Allow mouse events to passed through selectable elements
        var _mouseStart = SelectableObject["_mouseStart"];
        SelectableObject["_mouseStart"] = function (e) {
            _mouseStart.call(this, e);
            this.helper.css({
                "pointer-events": "none"
            });
        };
        
        //Hide the non root directories
        DataListElement.children().find("ul.DirectoryList").addClass("Hidden");
        //Make all directories toggle visibility
        var DirectoriesLists = DataListElement.find("li.Directory > div.Display");
        DirectoriesLists.click(function () {
            $(this).parent().toggleClass("Open");
            GetDirectoryListFromDirectoryElement($(this).parent()).toggleClass("Hidden");
        });
    }

    var CreateFileElement = function (File) {
        FileElement = $("<li>").addClass("File").data("File", File)
            .append($("<div>").addClass("Display")
                .append($("<span>").addClass("FileName").append(File.Name))
                .append($("<span>").addClass("MetaData").append(SizeToApproxString(File.Length))));

        return FileElement;
    }

    var CreateDirectoryElement = function (Directory, Size) {
        DirectoryElement = $("<li>").addClass("Directory").data("Directory", Directory)
            .append($("<div>").addClass("Display")
                .append($("<span>").addClass("DirectoryName").append(GetDirectoryName(Directory.Path)))
                .append($("<span>").addClass("MetaData").append(SizeToApproxString(Size))))
            .append($("<ul>").addClass("DirectoryList"));

        return DirectoryElement;
    }

    var CreateSeperatorElement = function () {
        SeperatorElement = $("<div>").addClass("Seperator");

        return SeperatorElement;
    }

    var GetDirectoryListFromDirectoryElement = function (DirectoryElement) {
        return DirectoryElement.children("ul.DirectoryList").first();
    }

    var GetDirectoryName = function (Directory) {
        //Remove trailing slash
        var DirectoryName = Directory;
        if (DirectoryName.lastIndexOf("\\") + 1 == DirectoryName.length)
            DirectoryName = DirectoryName.substring(0, DirectoryName.lastIndexOf("\\"));
        //Remove all previous directories
        if (DirectoryName.indexOf("\\") != -1)
            DirectoryName = DirectoryName.substring(DirectoryName.lastIndexOf("\\") + 1);

        return DirectoryName;
    }

    GetDirectorySize = function (Directory, Files) {
        var Size = 0;
        for (var FileKey in Files) {
            var File = Files[FileKey];
            if (File.RelativePath.indexOf(Directory.Path) === 0) {
                Size += File.Length;
            }
        }

        return Size;
    }

    var GetChildrenElementsDisplay = function (Element) {
        return GetDirectoryListFromDirectoryElement(Element).find("li > div.Display");
    }

    //This selects all children of a directory when selected
    var ElementSelectionEventFunction = function (SelectableElementObject) {
        var CurrentlySelecting = false;
        return function (Event, Element) {
            if (CurrentlySelecting)
                return;
            CurrentlySelecting = true;
            var SelecteeElement = $(Element.selected || Element.unselected).parent();
            //If element is a directory
            if (SelecteeElement.hasClass("Directory")) {
                //Manually select children
                var ChildrenElements = GetChildrenElementsDisplay(SelecteeElement);
                if (Event.type == "selectableselected") {
                    SelectSelectableElements(SelectableElementObject, ChildrenElements);
                }
                else if (Event.type == "selectableunselected") {
                }
            }
                //If element is file
            else if (SelecteeElement.hasClass("file")) {
                //Do nothing
            }

            CurrentlySelecting = false;
        };
    }

    //Retrives all the selected files from a data list
    this.GetSelectedFiles = function () {
        var SelectedFiles = [];
        DataListElement.find(".ui-selected").each(function (Key, SelectedElement) {
            var ListElement = $(SelectedElement).parent("li");
            //Add to array if file element
            if (ListElement.hasClass("File")) {
                //Add the file object stored as data with the element
                SelectedFiles.push(ListElement.data("File"));
            }
        });

        return SelectedFiles;
    }

    //Retrives all the selected directories from a data list
    this.GetSelectedDirectories = function () {
        var SelectedDirectories = [];
        DataListElement.find(".ui-selected").each(function (Key, SelectedElement) {
            var ListElement = $(SelectedElement).parent("li");
            //Add to array if directory element
            if (ListElement.hasClass("Directory")) {
                //Add the directory object stored as data with the element
                SelectedDirectories.push(ListElement.data("Directory"));
            }
        });

        return SelectedDirectories;
    }

    SelectSelectableElements = function (SelectableElementObject, Elements) {
        $(Elements).not(".ui-selected").addClass("ui-selecting");
        SelectableElementObject._mouseStop(null);
    }

    DeselectSelectableElements = function (SelectableElementObject, Elements) {
        $(Elements).removeClass("ui-selected").addClass("ui-unselecting");
        SelectableElementObject._mouseStop(null);
    }

    ToggleSelectableElements = function (SelectableElementObject, Elements) {
        $(Elements).not(".ui-selected").addClass("ui-selecting");
        $(Elements).filter(".ui-selected").removeClass("ui-selected").addClass("ui-unselecting");
        SelectableElementObject._mouseStop(null);
    }

    SizeToApproxString = function (Size) {
        var FileSizeMeasures = ["B", "KB", "MB", "GB", "TB"];
        var CurrentSize = Size;
        var CurrentSizeMeasure = FileSizeMeasures[0];
        var MaxSize = 1024;
        //Loop though the different FileSizeMeasures until an appropriate measure
        for (var i = 1; i < FileSizeMeasures.length; i++) {
            if (CurrentSize >= MaxSize) {
                CurrentSizeMeasure = FileSizeMeasures[i];
                CurrentSize = CurrentSize / MaxSize;
            }
        }
        //Round to one decimal place
        CurrentSize = Math.round(CurrentSize * 10) / 10;
        //Format and return string
        var ApproxSizeString = CurrentSize.toString() + " " + CurrentSizeMeasure;

        return ApproxSizeString;
    }
}