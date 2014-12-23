EncodingJob = function () {

    this.Files = [];

    this.RelativeDirectories = [];

    this.TranscodingConfiguration = undefined;

    this.FileName = undefined;

    this.Password = undefined;

    this.EmbeddedImage = undefined;
}

DecodingJob = function () {

    this.Files = [];

    this.RelativeDirectories = [];

    this.FileName = undefined;

    this.Password = undefined;
}

TranscodingConfiguration = function () {

    this.ImageFormat = undefined;

    this.CompressionLevel = undefined;

    this.CompressionAlgorithm = undefined;

    this.CompressionLevel = undefined;

    this.EncryptionAlgorithm = undefined;
}

//Container class for input files
File = function () {
    var This = this;

    this.RelativePath = "";

    this.Name = "";

    this.Data = undefined;

    this.GetFullPath = function () {
        if (This.RelativePath.substr(This.RelativePath.length - 1) === "\\") {
            return This.RelativePath + This.Name;
        }

        return This.RelativePath + "\\" + This.Name;
    }

    this.UpdateFromData = function () {
        This = File.FromFileData(This.Data);
    }
}

File.FromFileData = function (FileData) {
    var _File = new File();

    var FullRelativePath = GetFullRelativePath(FileData);
    _File.RelativePath = GetParentPath(FullRelativePath);
    _File.Name = FileData.name;
    _File.Data = FileData;
    _File.Length = FileData.size;

    return _File;
};

File.FromFileEntry = function (FileEntry, Data) {
    var _File = new File();

    var FullRelativePath = FormatRelativePath(FileEntry.fullPath);
    _File.RelativePath = GetParentPath(FullRelativePath);
    _File.Name = FileEntry.name;
    _File.Length = Data.size;
    _File.Data = Data;

    return _File;
};

File.FromServerResponse = function (ServerResponse) {
    var _File = new File();

    _File.RelativePath = ServerResponse.path;
    _File.Name = ServerResponse.name;
    _File.Length = ServerResponse.length;

    return _File;
};

Directory = function () {
    this.Path = "";
}

Directory.FromFileData = function (FileData) {
    var _Directory = new Directory();

    var FullRelativePath = GetFullRelativePath(FileData);
    _Directory.Path = GetParentPath(FileData);

    return _Directory;
}

Directory.FromPath = function (Path) {
    var _Directory = new Directory();
    
    _Directory.Path = Path;

    return _Directory;
}

Directory.FromDirectoryEntry = function (DirectoryEntry) {
    var _Directory = new Directory();

    _Directory.Path = FormatRelativePath(DirectoryEntry.fullPath);

    return _Directory;
}

Directory.FromServerResponse = function (ServerResponse) {
    var _Directory = new Directory();

    _Directory.Path = ServerResponse.path;

    return _Directory;
}

GetFullRelativePath = function (FileData) {
    return FormatRelativePath((FileData.relativePath || FileData.webkitRelativePath || FileData.mozRelativePath || ""));
}

FormatRelativePath = function (RelativePath) {
    var FormattedRelativePath = RelativePath;
    if (FormattedRelativePath[0] === "/")
        FormattedRelativePath = FormattedRelativePath.substr(1);
    if (FormattedRelativePath[FormattedRelativePath.length - 1] !== "/")
        FormattedRelativePath += "/";

    return FormattedRelativePath.replace(new RegExp("/", "g"), "\\");
}

GetParentPath = function (FullPath) {
    return FullPath.substr(0, FullPath.substr(0, FullPath.length - 1).lastIndexOf("\\") + 1);
}
