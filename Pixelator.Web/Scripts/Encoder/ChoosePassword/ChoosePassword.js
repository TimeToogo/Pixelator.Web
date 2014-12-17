$(document).ready(function() {
    window.EncoderContainer.RegisterStepLoader("/Encoder/ChoosePassword", function() {
        var Container = window.EncoderContainer;
        var Password = Container.TranscodingJob.Password;
        var PasswordEntropy = undefined;

        var PasswordInput = $("#PasswordInput");

        var PasswordStrengthMeterBar = $("#PasswordStrengthMeter > #Bar");

        var PasswordStrengthInfoValueLabel = $("#PasswordStrengthInfo > .Value");

        var PasswordInfos = $("#PasswordInfo > .PasswordDescription");
        var NoPasswordInfo = $("#NoPasswordInfo");
        var CommonPasswordInfo = $("#CommonPasswordInfo");
        var WeakPasswordInfo = $("#WeakPasswordInfo");
        var MediumPasswordInfo = $("#MediumPasswordInfo");
        var StrongPasswordInfo = $("#StrongPasswordInfo");
        var VeryStrongPasswordInfo = $("#VeryStrongPasswordInfo");

        var AdvancedPasswordInfoButton = $("#AdvancedPasswordInfoButton");
        var AdvancedPasswordInfo = $("#AdvancedPasswordInfo");
        var CharacterSetValueLabel = $("#CharacterSet > .Value");
        var EntropyPerCharacterValueLabel = $("#EntropyPerCharacter > .Value");
        var TotalEntropyValueLabel = $("#TotalEntropy > .Value");

        var WeakPasswordEntropy = 50; //Less than
        var MediumPasswordEntropy = 85; //Less than
        var StrongPasswordEntropy = 110; //Less than
        var MaxPasswordEntropy = 130; //For measuring percentage

        //Calculates the percentage of the PasswordEntropy over the MaxPasswordEntropy but smoothes the numbers as the divisor changes at 25% intervals
        CalculatePasswordEntropyBarPercentage = function(PasswordEntropy) {
            if (PasswordEntropy < WeakPasswordEntropy)
                return PasswordEntropy / WeakPasswordEntropy * 25;

            else if (PasswordEntropy < MediumPasswordEntropy)
                return (PasswordEntropy - WeakPasswordEntropy) / (MediumPasswordEntropy - WeakPasswordEntropy) * 25 + 25;

            else if (PasswordEntropy < StrongPasswordEntropy)
                return (PasswordEntropy - MediumPasswordEntropy) / (StrongPasswordEntropy - MediumPasswordEntropy) * 25 + 50;

            else {
                var Percentage = (PasswordEntropy - StrongPasswordEntropy) / (MaxPasswordEntropy - StrongPasswordEntropy) * 25 + 75;
                if (Percentage > 100)
                    Percentage = 100;

                return Percentage;
            }
        }

        UpdatePasswordStrength = function(EntropyInfo, IsCommonPassword) {
            var UpdateStrengthMeter = function(Class, Width) {
                PasswordStrengthMeterBar.removeClass();
                PasswordStrengthMeterBar.addClass(Class);
                PasswordStrengthMeterBar.css("width", Width.toString() + "%");
            };

            var UpdateStrengthLabel = function(Strength) {
                PasswordStrengthInfoValueLabel.text(Strength);
            };

            var UpdateVisibleInfo = function(VisibleInfo) {
                PasswordInfos.addClass("Hidden");
                VisibleInfo.removeClass("Hidden");
            };

            var UpdateAdvancedInfo = function(EntropyInfo) {
                CharacterSetValueLabel.text(EntropyInfo.SetLength);
                EntropyPerCharacterValueLabel.text(EntropyInfo.EntropyPerCharacter.toFixed(2));
                TotalEntropyValueLabel.text(EntropyInfo.TotalEntropy.toFixed(2));
            };

            var NoPasswordUpdate = function() {
                UpdateStrengthMeter(undefined, 0);
                UpdateStrengthLabel("No password");
                UpdateVisibleInfo(NoPasswordInfo);
            };

            var CommonPasswordUpdate = function() {
                UpdateStrengthMeter("Common", 0);
                UpdateStrengthLabel("Predictable");
                UpdateVisibleInfo(CommonPasswordInfo);
            };

            var WeakPasswordUpdate = function(PasswordEntropy) {
                UpdateStrengthMeter("Weak", CalculatePasswordEntropyBarPercentage(PasswordEntropy));
                UpdateStrengthLabel("Weak");
                UpdateVisibleInfo(WeakPasswordInfo);
            };

            var MediumPasswordUpdate = function(PasswordEntropy) {
                UpdateStrengthMeter("Medium", CalculatePasswordEntropyBarPercentage(PasswordEntropy));
                UpdateStrengthLabel("Medium");
                UpdateVisibleInfo(MediumPasswordInfo);
            };

            var StrongPasswordUpdate = function(PasswordEntropy) {
                UpdateStrengthMeter("Strong", CalculatePasswordEntropyBarPercentage(PasswordEntropy));
                UpdateStrengthLabel("Strong");
                UpdateVisibleInfo(StrongPasswordInfo);
            };

            var VeryStrongPasswordUpdate = function(PasswordEntropy) {
                UpdateStrengthMeter("VeryStrong", CalculatePasswordEntropyBarPercentage(PasswordEntropy));
                UpdateStrengthLabel("Very Strong");
                UpdateVisibleInfo(VeryStrongPasswordInfo);
            };

            var PasswordEntropy = EntropyInfo.TotalEntropy;

            if (PasswordEntropy == 0)
                NoPasswordUpdate();
            else if (IsCommonPassword)
                CommonPasswordUpdate();
            else if (PasswordEntropy < WeakPasswordEntropy)
                WeakPasswordUpdate(PasswordEntropy);
            else if (PasswordEntropy < MediumPasswordEntropy)
                MediumPasswordUpdate(PasswordEntropy);
            else if (PasswordEntropy < StrongPasswordEntropy)
                StrongPasswordUpdate(PasswordEntropy);
            else
                VeryStrongPasswordUpdate(PasswordEntropy);

            UpdateAdvancedInfo(EntropyInfo);
        }

        UpdatePassword = function(_Password) {
            Password = _Password;
            var PasswordEntropyInfo = CalculatePasswordEntropyInfo(Password);
            var _IsCommonPassword = IsCommonPassword(Password);

            UpdatePasswordStrength(PasswordEntropyInfo, _IsCommonPassword);
        }

        Container.CurrentPageIsValid = function() {
            return true;
        };

        Container.DisplayError = function() {

        };

        Container.SaveToJob = function(EncodingJob) {
            EncodingJob.Password = Password;
        };

        if (Password == undefined)
            Password = "";

        UpdatePassword(Password);
        PasswordInput.val(Password);
        PasswordInput.bind('keydown keyup', function() {
            UpdatePassword(PasswordInput.val());
        });

        AdvancedPasswordInfoButton.click(function() {
            AdvancedPasswordInfo.toggleClass("Hidden");
        });
    });
});