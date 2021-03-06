﻿using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Pixelator.Api;
using Pixelator.Api.Configuration;
using Pixelator.Api.Utility;
using Pixelator.Web.Filters;
using Pixelator.Web.Helpers;
using Pixelator.Web.Models;
using Directory = Pixelator.Api.Input.Directory;
using File = Pixelator.Api.Input.File;

namespace Pixelator.Web.Controllers.Api
{
    public class EncoderController : TranscoderController
    {
        private static readonly DirectoryInfo _encodingDirectory =
            new DirectoryInfo(HttpContext.Current.Server.MapPath("~/App_Data/Encoding"));

        protected override DirectoryInfo JobDirectory
        {
            get { return _encodingDirectory; }
        }

        [HttpPost]
        public async Task<HttpResponseMessage> Encode()
        {
            EncodingJob encodingJob = null;
            string badRequestMessage = null;
            try
            {
                encodingJob = await BuildEncodingJob(Request);
            }
            catch (BadRequestException exception)
            {
                badRequestMessage = exception.Message;
            }
            catch {}
            if (encodingJob == null)
            {
                return new HttpResponseMessage(HttpStatusCode.BadRequest)
                {
                    Content = new StringContent(badRequestMessage)
                };
            }

            EncryptionConfiguration encryptionConfiguration = null;
            CompressionConfiguration compressionConfiguration = null;

            if (encodingJob.HasPassword)
            {
                encryptionConfiguration = new EncryptionConfiguration(
                    encodingJob.EncryptionAlgorithm.Value,
                    TranscodingConfiguration.IterationCount);
            }

            if (encodingJob.CompressionAlgorithm.HasValue)
            {
                compressionConfiguration = new CompressionConfiguration(encodingJob.CompressionAlgorithm.Value,
                    encodingJob.CompressionLevel);
            }

            var imageEncoder = new ImageEncoder(encodingJob.Format, encryptionConfiguration, compressionConfiguration, encodingJob.EmbeddedImage);
            imageEncoder.AddDirectories(encodingJob.Directories);

            imageEncoder.Metadata.Add("creation-date", DateTime.UtcNow.ToString("s", CultureInfo.InvariantCulture));

            var guid = SecureGuid();
            try
            {
                DirectoryInfo jobDirectory = CreateJobDirectory(guid);
                var outputPath = Path.Combine(jobDirectory.FullName, encodingJob.FileName + "." + imageEncoder.Extension);
                using (Stream file = new FileStream(outputPath, FileMode.CreateNew))
                {
                    await imageEncoder.SaveAsync(file, BuildConfiguration(encodingJob.Password));
                }
            }
            catch
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            }

            return Request.CreateResponse(HttpStatusCode.OK, new { id = guid.ToString() });
        }

        [HttpPost, HttpGet]
        [DownloadCookie(Name = "fileDownload", Value = "true")]
        public HttpResponseMessage Download([FromUri]Guid id)
        {
            var jobDirectory = GetJobDirectory(id);

            FileInfo imageFile;
            try
            {
                imageFile = jobDirectory.EnumerateFiles().Single();
            }
            catch
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            }

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new PushStreamContent(async (outputStream, content, context) =>
                {
                    using (Stream fileStream = imageFile.OpenRead(), output1 = outputStream)
                    {
                        await fileStream.CopyToAsync(output1);
                    }
                })
                {
                    Headers =
                    {
                        ContentType = new MediaTypeHeaderValue("application/octet-stream"),
                        ContentDisposition = new ContentDispositionHeaderValue("attachment")
                        {
                            FileName = imageFile.Name,
                            Size = imageFile.Length
                        }
                    }
                }
            };
        }

        private EncodingConfiguration BuildConfiguration(string password)
        {
            return new EncodingConfiguration(
                password,
                new MemoryStorageProvider(),
                TranscodingConfiguration.BufferSize,
                TranscodingConfiguration.FileGroupSize);
        }

        private async Task<EncodingJob> BuildEncodingJob(HttpRequestMessage request)
        {
            if (!request.Content.IsMimeMultipartContent())
            {
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            }

            var encodingJob = new EncodingJob();

            var provider = new MultipartFormDataMemoryStreamProvider();
            await Request.Content.ReadAsMultipartAsync(provider);

            var form = provider.FormData;

            encodingJob.FileName = form["file-name"];
            encodingJob.Password = form["password"];
            encodingJob.Format = (ImageFormat)Enum.Parse(typeof(ImageFormat), form["image-format"]);
            encodingJob.EncryptionAlgorithm = encodingJob.HasPassword ? (EncryptionType)Enum.Parse(typeof(EncryptionType), form["encryption-algorithm"]) : (EncryptionType?) null;
            encodingJob.CompressionAlgorithm = ParseNullableEnum<CompressionType>(form["compression-algorithm"]);
            encodingJob.CompressionLevel = (CompressionLevel) Enum.Parse(typeof (CompressionLevel), form["compression-level"]);

            var directoryInput = form.GetValues("directories[]") ?? new string [0];
            if (directoryInput == null)
            {
                return null;
            }

            Dictionary<string, List<File>> directories = directoryInput.ToDictionary(directory => directory, directory => new List<File>());

            KeyValuePair<string, Stream> embeddedImageUpload = provider.FileStreams.FirstOrDefault(file => file.Key == "embedded-image");
            if (embeddedImageUpload.Key != null)
            {
                int maxFileSize = TranscodingConfiguration.EmbeddedPictureLimits.Bytes;
                if (embeddedImageUpload.Value.Length > maxFileSize)
                {
                    throw new BadRequestException("The selected cover picture exceeds the maximum file size of " + FileSize.Format(maxFileSize));
                }

                var pixelStorage = (EmbeddedImage.PixelStorage)Enum.Parse(typeof(EmbeddedImage.PixelStorage), form["pixel-storage-level"]);
                encodingJob.EmbeddedImage = new EmbeddedImage(Image.FromStream(embeddedImageUpload.Value), pixelStorage);

                var maxHeight = TranscodingConfiguration.EmbeddedPictureLimits.Height;
                var maxWidth = TranscodingConfiguration.EmbeddedPictureLimits.Width;
                if (encodingJob.EmbeddedImage.Image.Height > maxHeight || encodingJob.EmbeddedImage.Image.Width > maxWidth)
                {
                    throw new BadRequestException("The selected cover picture exceeds the maximum size of " + maxWidth + " x " + maxHeight + "px");
                }
            }

            foreach (var file in provider.FileStreams)
            {
                if (file.Key == "embedded-image")
                {
                    continue;
                }
                var key = file.Key;
                var name = form[key + ".name"];
                var directory = form[key + ".directory"];
                if (!directories.ContainsKey(directory))
                {
                    directories.Add(directory, new List<File>());
                }

                directories[directory].Add(new File(name, file.Value));
            }

            foreach (var directory in directories)
            {
                encodingJob.Directories.Add(new Directory(directory.Key, directory.Value));
            }

            long encodedFilesLength = encodingJob.Directories
                .SelectMany(directory => directory.Files)
                .Sum(file => file.Length);

            var maxEncodedDataSize =
                GetMaxDataSizeFor(encodingJob.EmbeddedImage == null
                    ? (EmbeddedImage.PixelStorage?) null
                    : encodingJob.EmbeddedImage.EmbeddedPixelStorage);
            if (encodedFilesLength > maxEncodedDataSize)
            {
                throw new BadRequestException("The selected files exceeds the maximum data size of " + FileSize.Format(maxEncodedDataSize) + " for the specified configuration");
            }

            return encodingJob;
        }

        private int GetMaxDataSizeFor(EmbeddedImage.PixelStorage? storage)
        {
            switch (storage)
            {
                case null:
                    return TranscodingConfiguration.EncodedDataLimits.RawStorage;
                case EmbeddedImage.PixelStorage.Auto:
                    return TranscodingConfiguration.EncodedDataLimits.AutoPixelStorage;
                case EmbeddedImage.PixelStorage.High:
                    return TranscodingConfiguration.EncodedDataLimits.HighPixelStorage;
                case EmbeddedImage.PixelStorage.Medium:
                    return TranscodingConfiguration.EncodedDataLimits.MediumPixelStorage;
                case EmbeddedImage.PixelStorage.Low:
                    return TranscodingConfiguration.EncodedDataLimits.LowPixelStorage;
                default:
                    throw new ArgumentOutOfRangeException("storage");
            }
        }

        private static TEnum? ParseNullableEnum<TEnum>(string value) where TEnum : struct
        {
            if (value == null)
            {
                return null;
            }

            TEnum result;
            return Enum.TryParse(value, out result) ? result : (TEnum?) null;
        }
    }
}