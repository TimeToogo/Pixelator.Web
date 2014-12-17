$(document).ready(function() {
    window.DecoderContainer.RegisterStepLoader("/Decoder/ChoosePassword", function() {
        var Container = window.DecoderContainer;
        var Password = Container.TranscodingJob.Password;

        var PasswordInput = $("#PasswordInput");

        var UpdatePassowrd = function(_Password) {
            Password = _Password;
        }

        Container.CurrentPageIsValid = function() {
            return true;
        };

        Container.DisplayError = function() {

        };

        Container.SaveToJob = function(DecodingJob) {
            DecodingJob.Password = Password;
        };

        if (Password == undefined)
            Password = "";

        UpdatePassowrd(Password);
        PasswordInput.val(Password);
        PasswordInput.keyup(function() {
            UpdatePassowrd(PasswordInput.val());
        });
    });
});
