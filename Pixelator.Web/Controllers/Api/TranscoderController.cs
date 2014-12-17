using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Web.Configuration;
using System.Web.Http;

namespace Pixelator.Web.Controllers.Api
{
    public abstract class TranscoderController : ApiController
    {
        protected abstract DirectoryInfo JobDirectory { get; }
        private static readonly RNGCryptoServiceProvider _rngCrypto = new RNGCryptoServiceProvider();

        protected string GetJobPath(Guid id)
        {
            return Path.Combine(JobDirectory.FullName, id.ToString());
        }

        protected DirectoryInfo CreateJobDirectory(Guid id)
        {
            return Directory.CreateDirectory(GetJobPath(id));
        }

        protected DirectoryInfo GetJobDirectory(Guid id)
        {
            var jobDirectory = new DirectoryInfo(GetJobPath(id));
            if (!jobDirectory.Exists)
            {
                throw new HttpResponseException(HttpStatusCode.NotFound);
            }

            return jobDirectory;
        }

        protected Guid SecureGuid()
        {
            var bytes = new byte[16];
            _rngCrypto.GetBytes(bytes);
            return new Guid(bytes);
        }

        [HttpGet]
        public void CleanOldJobs()
        {
            if (!Request.IsLocal())
            {
                throw new HttpResponseException(HttpStatusCode.Forbidden);
            }

            TimeSpan oldJobExpiryInterval = TimeSpan.FromSeconds(int.Parse(WebConfigurationManager.AppSettings["JobExpiryIntervalSeconds"]));

            foreach (DirectoryInfo jobDirectory in JobDirectory.EnumerateDirectories("*", SearchOption.TopDirectoryOnly))
            {
                if (DateTime.UtcNow - jobDirectory.CreationTimeUtc > oldJobExpiryInterval)
                {
                    try
                    {
                        jobDirectory.Delete(true);
                    }
                    catch
                    {
                    }
                }
            }
        }
    }
}