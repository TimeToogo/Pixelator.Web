var ProgressBarAnimationDuration = 100;

//Intialize progress bar with default value
IntializeProgressBar = function (ProgressBar) {
    ProgressBar.progressbar({
        value: 0
    });
    //UI fix
    ProgressBar.find(".ui-progressbar-value").addClass("ui-corner-right");
}

//Should be intialized per request to accurately track progress
CreateRequestProgressCallback = function (ProgressBar, event, ProgressTracker) {
    var PreviousPositionTracker = new Object();
    PreviousPositionTracker.Position = 0;
    return function (event) {
        CalculateProgressPercentageAndUpdateProgressBar(ProgressBar, event, ProgressTracker, PreviousPositionTracker);
    }
}

CalculateProgressPercentageAndUpdateProgressBar = function (ProgressBar, event, ProgressTracker, PreviousPositionTracker) {
    if (event.lengthComputable) {
        var CurrentPosition = (event.position || event.loaded);
        ProgressTracker.BytesUploaded = ProgressTracker.BytesUploaded + (CurrentPosition - PreviousPositionTracker.Position);
        PreviousPositionTracker.Position = CurrentPosition;
        var Done = ProgressTracker.BytesUploaded;
        var Total = ProgressTracker.TotalBytes;
        var Percentage = Math.floor((Done / Total) * 100);
        UpdateProgressBar(ProgressBar, Percentage);
    }
}

UpdateProgressBar = function (ProgressBar, Percentage) {
    var ProgressBarValue = ProgressBar.find(".ui-progressbar-value");
    if (!this.NextDuration)
        this.NextDuration = 0;

    if (ProgressBarValue.attr("width") != "100%" && Percentage == 100) {
        ProgressBarValue.animate(
        {
            width: "100%"
        }, { duration: ProgressBarAnimationDuration, queue: false });
        return;
    }

    if (((new Date()).getTime() < this.NextDuration && Percentage !== 100) || ProgressBarValue.attr("width") === "100%")
        return;

    this.NextDuration = (new Date()).getTime() + ProgressBarAnimationDuration;
    ProgressBarValue.animate(
    {
        width: Percentage.toString() + "%"
    }, { duration: ProgressBarAnimationDuration, queue: false });
}
