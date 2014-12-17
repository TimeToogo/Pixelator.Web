TranscodingAjaxContainer = function (TranscodingJob, ParentContainer, ContentElement, ProgressElement, TitleElement, SidbarListElement) {
    var This = this;

    AjaxContainer.call(this, ContentElement, ProgressElement, TitleElement);

    this.ParentContainer = ParentContainer;

    this.CompleteUrl = undefined;

    this.SidbarListElement = SidbarListElement;

    this.TranscodingJob = TranscodingJob;

    this.Steps = [];
    this.StepLoaders = {};
    this.CurrentStep = undefined;

    this.BackButtons = [];
    this.NextButtons = [];

    //Events
    this.SaveToJob = function () { };
    this.CurrentPageIsValid = function () { };
    this.DisplayError = function () { };

    this.LoadStep = function () {
        TranscodingAjaxContainer.prototype.LoadStep.apply(This, arguments);
    }

    this.LoadStepByUrl = function () {
        TranscodingAjaxContainer.prototype.LoadStepByUrl.apply(This, arguments);
    }

    this.DefineStep = function () {
        TranscodingAjaxContainer.prototype.DefineStep.apply(This, arguments);
    }

    this.RegisterStepLoader = function () {
        TranscodingAjaxContainer.prototype.RegisterStepLoader.apply(This, arguments);
    }

    this.LoadNextStep = function () {
        TranscodingAjaxContainer.prototype.LoadNextStep.apply(This, arguments);
    }

    this.LoadPreviousStep = function () {
        TranscodingAjaxContainer.prototype.LoadPreviousStep.apply(This, arguments);
    }

    this.DefineNextStepButton = function () {
        TranscodingAjaxContainer.prototype.DefineNextStepButton.apply(This, arguments);
    }

    this.DefinePreviousStepButton = function () {
        TranscodingAjaxContainer.prototype.DefinePreviousStepButton.apply(This, arguments);
    }

    this.SetCurrentStep = function () {
        TranscodingAjaxContainer.prototype.SetCurrentStep.apply(This, arguments);
    }

    this.DefineCompletePage = function () {
        TranscodingAjaxContainer.prototype.DefineCompletePage.apply(This, arguments);
    }

    this.DefineWarnUserLeavingMessage = function () {
        TranscodingAjaxContainer.prototype.DefineWarnUserLeavingMessage.apply(This, arguments);
    }

    this.ShouldWarnUserLeaving = function () {
        TranscodingAjaxContainer.prototype.ShouldWarnUserLeaving.apply(This, arguments);
    }

    this.Complete = function () {
        TranscodingAjaxContainer.prototype.Complete.apply(This, arguments);
    }

    this.Dispose = function () {
        TranscodingAjaxContainer.prototype.Dispose.apply(This, arguments);
    }
    this.ParentContainer.OnBeginLoad = this.Dispose;
}

TranscodingAjaxContainer.prototype = Object.create(AjaxContainer.prototype);

TranscodingAjaxContainer.prototype.LoadStep = function (Step) {
    var This = this;
    This.ProgressElement.removeClass("Hidden");

    var OnLoadComplete = function () {
        This.ProgressElement.addClass("Hidden");
    }

    var OnLoadSuccess = function (ResponseHtml) {
        This.SaveToJob(This.TranscodingJob);
        This.ContentElement.empty();
        This.ContentElement.html(ResponseHtml);
        var Title = This.ContentElement.find("#Title").text();
        This.SetTitle(Title);
        This.SetCurrentStep(This.Steps.indexOf(Step));

        var stepLoader = This.StepLoaders[Step.Url];
        if (stepLoader != undefined) {
            stepLoader();
        }
    };

    $.ajax({
        url: Step.Url,
        type: "POST",
        dataType: "html",
        success: OnLoadSuccess,
        complete: OnLoadComplete
    });
}

TranscodingAjaxContainer.prototype.LoadStepByUrl = function (Url) {
    for (var i = 0; i < this.Steps.length; i++) {
        var Step = this.Steps[i];
        if (Step.Url == Url) {
            this.LoadStep(Step);
            return;
        }
    }
}

TranscodingAjaxContainer.prototype.DefineStep = function (Url, Name, SupportsBack, SupportsNext) {
    this.SidbarListElement.append(
        $("<li>").addClass("Step").append(
            Name));

    this.Steps.push({ Url: Url, Name: Name, SupportsBack: SupportsBack, SupportsNext: SupportsNext });
}

TranscodingAjaxContainer.prototype.RegisterStepLoader = function (Url, Loader) {
    this.StepLoaders[Url] = Loader;
}

TranscodingAjaxContainer.prototype.LoadNextStep = function () {
    var ValidationResult = this.CurrentPageIsValid();
    if (ValidationResult === true) {
        var NextStep = this.Steps[this.Steps.indexOf(this.CurrentStep) + 1];
        if (NextStep == undefined) {
            this.Complete();
            return;
        }
        this.LoadStep(NextStep);
    }
    else
        this.DisplayError(ValidationResult === false ? "Cannot continue as input is invalid" : ValidationResult, function () {});
}

TranscodingAjaxContainer.prototype.LoadPreviousStep = function () {
    var PreviousStep = this.Steps[this.Steps.indexOf(this.CurrentStep) - 1];
    if (PreviousStep == undefined) {
        window.history.go(-1);
        return;
    }
    this.LoadStep(PreviousStep);
}

TranscodingAjaxContainer.prototype.DefineNextStepButton = function (ButtonElement) {
    var This = this;
    this.NextButtons.push(ButtonElement);
    ButtonElement.click(this.LoadNextStep);
}

TranscodingAjaxContainer.prototype.DefinePreviousStepButton = function (ButtonElement) {
    var This = this;
    this.BackButtons.push(ButtonElement);
    ButtonElement.click(this.LoadPreviousStep);
}

TranscodingAjaxContainer.prototype.SetCurrentStep = function (Index) {
    var Step = this.Steps[Index];
    this.SidbarListElement.find("li").removeClass("Current");
    this.SidbarListElement.find("li:contains(" + Step.Name + ")").addClass("Current");
    for (var i = 0; i < this.BackButtons.length; i++)
        this.BackButtons[i].prop("disabled", !Step.SupportsBack);
    for (var i = 0; i < this.NextButtons.length; i++)
        this.NextButtons[i].prop("disabled", !Step.SupportsNext);

    this.CurrentStep = Step;
}

TranscodingAjaxContainer.prototype.DefineCompletePage = function (Url) {
    this.CompleteUrl = Url;
}

TranscodingAjaxContainer.prototype.DefineWarnUserLeavingMessage = function (Message) {
    this.WarnUserLeavingFunction = function () {
        return Message;
    };
}

TranscodingAjaxContainer.prototype.ShouldWarnUserLeaving = function (ShouldWarn) {
    var WarnFunction = ShouldWarn ? this.WarnUserLeavingFunction : function () { return false; };

    window.onbeforeunload = WarnFunction;
    this.ParentContainer.OnBeforeLoad = WarnFunction;
}

TranscodingAjaxContainer.prototype.Complete = function () {
    this.Dispose();
    this.ParentContainer.Load(this.CompleteUrl);
}

TranscodingAjaxContainer.prototype.Dispose = function () {
    window.onbeforeunload = undefined;
    this.ParentContainer.OnBeforeLoad = undefined;
    this.ParentContainer.OnBeginLoad = undefined;
    this.LoadNextStep = undefined;
    this.LoadPreviousStep = undefined;
    this.Steps = undefined;
    this.StepLoaders = undefined;
}