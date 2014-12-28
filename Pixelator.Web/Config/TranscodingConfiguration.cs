using System.Configuration;

namespace Pixelator.Web.Config
{
    public class TranscodingConfiguration : ConfigurationSection
    {
        [ConfigurationProperty("iterationCount")]
        [IntegerValidator(MinValue = 0)]
        public int IterationCount
        {
            get { return (int)(this["iterationCount"]); }
            set { this["iterationCount"] = value; }
        }

        [ConfigurationProperty("bufferSize")]
        [IntegerValidator(MinValue = 0)]
        public int BufferSize
        {
            get { return (int)(this["bufferSize"]); }
            set { this["bufferSize"] = value; }
        }

        [ConfigurationProperty("fileGroupSize")]
        [IntegerValidator(MinValue = 0)]
        public int FileGroupSize
        {
            get { return (int)(this["fileGroupSize"]); }
            set { this["fileGroupSize"] = value; }
        }

        [ConfigurationProperty("jobExpiryIntervalSeconds")]
        [IntegerValidator(MinValue = 0)]
        public int JobExpiryIntervalSeconds
        {
            get { return (int)(this["jobExpiryIntervalSeconds"]); }
            set { this["jobExpiryIntervalSeconds"] = value; }
        }

        [ConfigurationProperty("embeddedPictureLimits")]
        public EmbeddedPictureElement EmbeddedPictureLimits
        {
            get { return (EmbeddedPictureElement)this["embeddedPictureLimits"]; }
            set { this["embeddedPictureLimits"] = value; }
        }

        [ConfigurationProperty("encodedDataLimits")]
        public EncodedDataElement EncodedDataLimits
        {
            get { return (EncodedDataElement)this["encodedDataLimits"]; }
            set { this["encodedDataLimits"] = value; }
        }

        public class EmbeddedPictureElement : ConfigurationElement
        {
            [ConfigurationProperty("width")]
            [IntegerValidator(MinValue = 0)]
            public int Width
            {
                get { return (int)(this["width"]); }
                set { this["width"] = value; }
            }

            [ConfigurationProperty("height")]
            [IntegerValidator(MinValue = 0)]
            public int Height
            {
                get { return (int)(this["height"]); }
                set { this["height"] = value; }
            }

            [ConfigurationProperty("bytes")]
            [IntegerValidator(MinValue = 0)]
            public int Bytes
            {
                get { return (int)(this["bytes"]); }
                set { this["bytes"] = value; }
            }
        }

        public class EncodedDataElement : ConfigurationElement
        {
            [ConfigurationProperty("rawStorage")]
            [IntegerValidator(MinValue = 0)]
            public int RawStorage
            {
                get { return (int)(this["rawStorage"]); }
                set { this["rawStorage"] = value; }
            }

            [ConfigurationProperty("autoPixelStorage")]
            [IntegerValidator(MinValue = 0)]
            public int AutoPixelStorage
            {
                get { return (int)(this["autoPixelStorage"]); }
                set { this["autoPixelStorage"] = value; }
            }

            [ConfigurationProperty("highPixelStorage")]
            [IntegerValidator(MinValue = 0)]
            public int HighPixelStorage
            {
                get { return (int)(this["highPixelStorage"]); }
                set { this["highPixelStorage"] = value; }
            }

            [ConfigurationProperty("mediumPixelStorage")]
            [IntegerValidator(MinValue = 0)]
            public int MediumPixelStorage
            {
                get { return (int)(this["mediumPixelStorage"]); }
                set { this["mediumPixelStorage"] = value; }
            }

            [ConfigurationProperty("lowPixelStorage")]
            [IntegerValidator(MinValue = 0)]
            public int LowPixelStorage
            {
                get { return (int)(this["lowPixelStorage"]); }
                set { this["lowPixelStorage"] = value; }
            }
        }
    }
}