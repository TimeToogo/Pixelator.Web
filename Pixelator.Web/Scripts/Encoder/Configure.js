$(document).ready(function() {
    window.EncoderContainer.RegisterStepLoader("/Encoder/Configure", function() {
        var Container = window.EncoderContainer;
        var Password = Container.TranscodingJob.Password;
        var FileName = Container.TranscodingJob.FileName;
        var Configuration = Container.TranscodingJob.TranscodingConfiguration;

        var ErrorDialog = new TranscodingErrorDialog($("#ConfigureImageErrorDialog"));

        var AllConfiguration = $("#AdvancedConfiguration");
        var EncryptionConfiguration = $("#EncryptionConfiguration");
        var NonEncryptionConfiguration = $("#NonEncryptionConfiguration");

        var ImageFormatSelect = $("#ImageFormat");
        var CompressionLevelSelect = $("#CompressionLevel");
        var CompressionAlgorithmSelect = $("#CompressionAlgorithm");
        var EncryptionAlgorithmSelect = $("#EncryptionAlgorithm");
        var PixelStorageLevelSelect = $("#PixelStorageLevel");

        Container.CurrentPageIsValid = function() {
            if (FileName != undefined && FileName.length !== 0) {
                return true;
            }

            return "Please specify a valid file name";
        };

        Container.DisplayError = function(ErrorMessage) {
            ErrorDialog.Show(ErrorMessage);
        };

        Container.SaveToJob = function(EncodingJob) {
            EncodingJob.FileName = FileName;
            EncodingJob.TranscodingConfiguration = Configuration;
        };

        UpdateDataList();

        var FileNameInput = $("#FileNameInput");
        FileNameInput.val(FileName);
        FileNameInput.keyup(function() {
            FileName = FileNameInput.val();
        });

        if (Configuration == undefined)
            Configuration = new TranscodingConfiguration();

        $("#AdvancedConfigurationButton").click(function() {
            AllConfiguration.toggleClass("Hidden");
        });

        if (Configuration.ImageFormat != undefined)
            ImageFormatSelect.val(Configuration.ImageFormat);
        else {
            var ImageFormatOptionValue = undefined;
            if (Container.TranscodingJob.EmbeddedImage != undefined) {
                var ImageFormat = Container.TranscodingJob.EmbeddedImage.Name.split(".").pop().toUpperCase();
                var ImageFormatOptionValue = ImageFormatSelect.children("option").filter(function () {
                    return this.value.toUpperCase() === ImageFormat;
                }).attr("value");
            }
            ImageFormatOptionValue = ImageFormatOptionValue || ImageFormatSelect.children("option").first().attr("value");

            Configuration.ImageFormat = ImageFormatOptionValue;
            ImageFormatSelect.val(ImageFormatOptionValue);
        }
        ImageFormatSelect.change(function() {
            Configuration.ImageFormat = ImageFormatSelect.val();
        });

        if (Configuration.PixelStorageLevel != undefined)
            PixelStorageLevelSelect.val(Configuration.PixelStorageLevel);
        else
            Configuration.PixelStorageLevel = PixelStorageLevelSelect.val();
        PixelStorageLevelSelect.change(function () {
            Configuration.PixelStorageLevel = PixelStorageLevelSelect.val();
        });

        if (Configuration.CompressionLevel != undefined)
            CompressionLevelSelect.val(Configuration.CompressionLevel);
        else
            Configuration.CompressionLevel = CompressionLevelSelect.val();
        CompressionLevelSelect.change(function() {
            Configuration.CompressionLevel = CompressionLevelSelect.val();
            CompressionAlgorithmSelect.prop("disabled", Configuration.CompressionLevel === "None");
        });

        if (Configuration.CompressionAlgorithm != undefined)
            CompressionAlgorithmSelect.val(Configuration.CompressionAlgorithm);
        else
            Configuration.CompressionAlgorithm = CompressionAlgorithmSelect.val();
        CompressionAlgorithmSelect.change(function() {
            Configuration.CompressionAlgorithm = CompressionAlgorithmSelect.val();
        });

        if (Password.length === 0) {
            EncryptionConfiguration.addClass("Hidden");
            NonEncryptionConfiguration.removeClass("Hidden");

            Configuration.EncryptionAlgorithm = undefined;
        } else {
            EncryptionConfiguration.removeClass("Hidden");
            NonEncryptionConfiguration.addClass("Hidden");

            if (Configuration.EncryptionAlgorithm != undefined)
                EncryptionAlgorithmSelect.val(Configuration.EncryptionAlgorithm);
            else
                Configuration.EncryptionAlgorithm = EncryptionAlgorithmSelect.val();
            EncryptionAlgorithmSelect.change(function() {
                Configuration.EncryptionAlgorithm = EncryptionAlgorithmSelect.val();
            });
        }
    });
});