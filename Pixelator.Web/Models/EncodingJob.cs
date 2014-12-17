using System;
using System.Collections.Generic;
using System.IO;
using Pixelator.Api;
using Directory = Pixelator.Api.Input.Directory;

namespace Pixelator.Web.Models
{
    class EncodingJob : TranscodingJob
    {
        private string _fileName;

        public EncodingJob()
        {
            Directories = new List<Directory>();
        }

        public ImageFormat Format { get; set; }

        public string FileName
        {
            get { return _fileName; }
            set
            {
                if (value != null && value.IndexOfAny(Path.GetInvalidFileNameChars()) != -1)
                {
                    throw new ArgumentException("Invalid file name");
                }

                _fileName = value;
            }
        }

        public EncryptionType? EncryptionAlgorithm { get; set; }
        public CompressionType? CompressionAlgorithm { get; set; }
        public CompressionLevel CompressionLevel { get; set; }
        public IList<Directory> Directories { get; set; }
    }
}