TranscodingErrorDialog = function (ErrorDialogElement) {
    var This = this;

    this.ErrorDialogElement = ErrorDialogElement;
    this.ErrorOverlayElement = ErrorDialogElement.find(".ErrorOverlay");
    this.ErrorTitleElement = ErrorDialogElement.find(".ErrorHeader");
    this.ErrorMessageElement = ErrorDialogElement.find(".ErrorMessage");
    this.OKButtonElement = ErrorDialogElement.find(".ErrorButtons > .OKButton");
    this.ClosedCallback = undefined;

    this.Show = function (ErrorMessage, ErrorTitle, ClosedCallback) {
        if (ErrorTitle != undefined)
            This.ErrorTitleElement.text(ErrorTitle);
        This.ErrorMessageElement.text(ErrorMessage);
        This.ClosedCallback = ClosedCallback;

        This.ErrorDialogElement.removeClass("Hidden");
    }

    this.Close = function () {
        This.ErrorDialogElement.addClass("Hidden");

        if (This.ClosedCallback != undefined)
            This.ClosedCallback();
    }

    this.OKButtonElement.click(this.Close);
}