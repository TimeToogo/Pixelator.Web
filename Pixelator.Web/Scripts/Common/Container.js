AjaxContainer = function (ContentElement, ProgressElement, TitleElement) {
    var This = this;

    this.ContentElement = ContentElement;

    this.ProgressElement = ProgressElement;

    this.PageTitlePrefix = "";
    this.TitleElement = TitleElement;

    this.OnBeforeLoad = undefined;
    this.OnBeginLoad = undefined;

    this.Load = function () {
        AjaxContainer.prototype.Load.apply(This, arguments);
    }

    this.SetTitle = function () {
        AjaxContainer.prototype.SetTitle.apply(This, arguments);
    }

    this.DefineLoadButton = function () {
        AjaxContainer.prototype.DefineLoadButton.apply(This, arguments);
    }

    this.StoreHistoryState = function () {
        AjaxContainer.prototype.StoreHistoryState.apply(This, arguments);
    }

    this.LoadHistoryState = function () {
        AjaxContainer.prototype.LoadHistoryState.apply(This, arguments);
    }
}

AjaxContainer.prototype.Load = function (Url, Data, CompleteCallback, DontStoreState) {
    var This = this;

    if (this.OnBeforeLoad instanceof Function) {
        var Message = this.OnBeforeLoad();
        if (Message != undefined) {
            var Confirmed = confirm(Message);
            if (!Confirmed)
                return;
        }
    }

    if (this.OnBeginLoad instanceof Function)
        this.OnBeginLoad();

    This.ProgressElement.removeClass("Hidden");

    var _CompleteCallback = function () {
        This.ProgressElement.addClass("Hidden");
        if (CompleteCallback != undefined)
            CompleteCallback.apply(This, arguments);
    }

    $.ajax({
        url: Url,
        type: "POST",
        dataType: "html",
        data: Data,
        success: function(ResponseHtml) {
            This.ContentElement.empty();
            This.ContentElement.html(ResponseHtml);
            var Title = This.ContentElement.find("#Title").text();
            This.SetTitle(Title);
            if (!DontStoreState)
                This.StoreHistoryState(Data, Title, Url);
        },
        complete: _CompleteCallback
    });
}

AjaxContainer.prototype.SetTitle = function (Title) {
    document.title = this.PageTitlePrefix + Title;
    this.TitleElement.text(Title);
}

AjaxContainer.prototype.DefineLoadButton = function (ButtonElement, Url, Data, CompleteCallback) {
    var This = this;
    ButtonElement.click(function () {
        This.Load(Url, Data, CompleteCallback);
    });
}

AjaxContainer.prototype.StoreHistoryState = function (Data, Title, Url) {
    window.history.pushState({ Data: Data, Url: Url }, Title, Url);
}

AjaxContainer.prototype.LoadHistoryState = function (Event) {
    if (Event.state)
        this.Load(Event.state.Url, Event.state.Data, undefined, true);
}