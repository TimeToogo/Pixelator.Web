$(document).ready(function() {
    window.EncoderContainer.RegisterStepLoader("/Encoder/Display", function() {
        var Container = window.EncoderContainer;
        var EncodingJob = Container.TranscodingJob;

        var Image = $("#EncodedImage");

        Container.CurrentPageIsValid = function () {
            return true;
        }

        Container.DisplayError = function (ErrorMessage, ClosedCallback) {

        }

        Image.attr("src", "/api/Encoder/Download/" + EncodingJob.ID);
    });
});