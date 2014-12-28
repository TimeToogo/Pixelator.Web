using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Ionic.Zip;
using Pixelator.Api;
using Pixelator.Api.Configuration;
using Pixelator.Api.Exceptions;
using Pixelator.Api.Output;
using Pixelator.Api.Utility;
using Pixelator.Web.Filters;
using Pixelator.Web.Helpers;
using Pixelator.Web.Models;
using Directory = Pixelator.Api.Output.Directory;
using File = Pixelator.Api.Output.File;

namespace Pixelator.Web.Controllers.Api
{
    public class DecoderController : TranscoderController
    {
        private static readonly DirectoryInfo _decodingDirectory =
            new DirectoryInfo(HttpContext.Current.Server.MapPath("~/App_Data/Decoding"));

        private static readonly string _imageFileName = "image";

        protected override DirectoryInfo JobDirectory
        {
            get { return _decodingDirectory; }
        }

        [HttpPost]
        public async Task<HttpResponseMessage> Structure()
        {
            DecodingJob decodingJob;
            try
            {
                decodingJob = await BuildDecodingJob(Request);
            }
            catch
            {
                return new HttpResponseMessage(HttpStatusCode.BadRequest);
            }

            var guid = SecureGuid();
            Stream storageStream;
            try
            {
                storageStream = new FileStream(Path.Combine(CreateJobDirectory(guid).FullName, _imageFileName), FileMode.CreateNew);
                await decodingJob.File.CopyToAsync(storageStream);
                storageStream.Position = 0;
            }
            catch
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            }

            var image = await LoadImageDecoder(storageStream, decodingJob.Password);

            var request = Request.CreateResponse(HttpStatusCode.OK, new
            {
                id = guid,
                files = (from directory in image.Directories
                         from file in directory.Files
                         select new
                         {
                             path = directory.IsRootDirectory ? "" : directory.Path,
                             name = file.Name,
                             length = file.Length,
                         }).ToList(),
                directories = (from directory in image.Directories
                               where !directory.IsRootDirectory
                               select new { path = directory.Path }).ToList()
            });

            image.ImageStream.Close();

            return request;
        }

        private async Task<ImageDecoder> LoadImageDecoder(Stream file, string password)
        {
            string reason;
            try
            {
                return await ImageDecoder.LoadAsync(file, BuildConfiguration(password));
            }
            catch (InvalidPasswordException)
            {
                reason = "bad-password";
            }
            catch
            {
                reason = "invalid-image";
            }

            throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.BadRequest, new { reason }));
        }

        public class DownloadRequest
        {
            [Required]
            public Guid id { get; set; }

            public string password { get; set; }

            public string[] files { get; set; }

            public string[] directories { get; set; }
        }

        [HttpPost]
        [DownloadCookie(Name = "fileDownload", Value = "true")]
        public async Task<HttpResponseMessage> Download([FromBody]DownloadRequest downloadRequest)
        {
            if (!ModelState.IsValid)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, new
                {
                    errors = from state in ModelState
                             from error in state.Value.Errors
                             select error.ErrorMessage
                });
            }

            var jobDirectory = GetJobDirectory(downloadRequest.id);

            FileInfo imageFile;
            try
            {
                imageFile = jobDirectory.EnumerateFiles().Single();
            }
            catch
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            }
            
            var image = await LoadImageDecoder(imageFile.OpenRead(), downloadRequest.password);

            downloadRequest.files = downloadRequest.files ?? new string[0];
            downloadRequest.directories = downloadRequest.directories ?? new string[0];
            var filesLookup = new HashSet<string>(downloadRequest.files);
            var directoriesLookup = new HashSet<string>(downloadRequest.directories);
            var files = (from directory in image.Directories
                         from file in directory.Files
                         where filesLookup.Contains(Path.Combine(directory.Path, file.Name))
                         select file).ToList();
            var directories = (from directory in image.Directories
                               where directoriesLookup.Contains(directory.Path) && !directory.IsRootDirectory
                               select directory).ToList();

            if (files.Count != downloadRequest.files.Length || directories.Count != downloadRequest.directories.Length)
            {
                return new HttpResponseMessage(HttpStatusCode.BadRequest);
            }

            if (files.Count == 1 && directories.Count == 0)
            {
                return DecodedFileResponse(image, files[0]);
            }

            return DecodedDataAsZipFileResponse("data.zip", image, directories, files);
        }

        private HttpResponseMessage DecodedFileResponse(ImageDecoder image, File file)
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new PushStreamContent(async (outputStream, content, context) =>
                {
                    using (outputStream)
                    using (image.ImageStream)
                    {
                        await
                            image.DecodeAsync(new Directory[0], new[] { file }, new FileDataOutputHandler(async (directory, _file, stream) => await stream.CopyToAsync(outputStream)));
                    }
                })
                {
                    Headers =
                    {
                        ContentType = new MediaTypeHeaderValue("application/octet-stream"),
                        ContentDisposition = new ContentDispositionHeaderValue("attachment")
                        {
                            FileName = file.Name,
                            Size = file.Length
                        }
                    }
                }
            };
        }

        private static HttpResponseMessage DecodedDataAsZipFileResponse(string fileName, ImageDecoder image, IList<Directory> directories, IList<File> files)
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new PushStreamContent(async (outputStream, content, context) =>
                {
                    ZipOutputStream zipStream = new ZipOutputStream(outputStream);
                    try
                    {
                        await image.DecodeAsync(directories, files,
                            new FileDataOutputHandler(
                                (directory) =>
                                {
                                    if (!directory.IsRootDirectory)
                                    {
                                        zipStream.PutNextEntry(directory.Path);
                                    }
                                },
                                async (directory, file, stream) =>
                                {
                                    zipStream.PutNextEntry(Path.Combine(directory.Path, file.Name));
                                    await stream.CopyToAsync(zipStream);
                                }));
                    }
                    finally
                    {
                        image.ImageStream.Close();
                        zipStream.Close();
                    }
                })
                {
                    Headers =
                    {
                        ContentType = new MediaTypeHeaderValue("application/octet-stream"),
                        ContentDisposition = new ContentDispositionHeaderValue("attachment")
                        {
                            FileName = fileName
                        }
                    }
                }
            };
        }

        private DecodingConfiguration BuildConfiguration(string password)
        {
            return new DecodingConfiguration(
                password,
                new MemoryStorageProvider(),
                TranscodingConfiguration.BufferSize);
        }

        private async Task<DecodingJob> BuildDecodingJob(HttpRequestMessage request)
        {
            if (!request.Content.IsMimeMultipartContent())
            {
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            }

            var deodingJob = new DecodingJob();

            var provider = new MultipartFormDataMemoryStreamProvider();
            await Request.Content.ReadAsMultipartAsync(provider);

            var form = provider.FormData;

            deodingJob.Password = form["password"];
            deodingJob.File = provider.FileStreams.Single().Value;

            return deodingJob;
        }
    }
}