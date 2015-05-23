using System;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Web.Http;
using Pixelator.Web.Config;
using Pixelator.Web.Filters;

namespace Pixelator.Web.Controllers.Api
{
#if!DEBUG
    [RequireHttps]
#endif
    public abstract class TranscoderController : ApiController
    {
        protected abstract DirectoryInfo JobDirectory { get; }
        private static readonly RNGCryptoServiceProvider _rngCrypto = new RNGCryptoServiceProvider();
        private readonly TranscodingConfiguration _transcodingConfiguration = Config.Configuration.Transcoding;
        private readonly ScheduleConfiguration _scheduleConfiguration = Config.Configuration.Schedule;

        protected TranscodingConfiguration TranscodingConfiguration
        {
            get { return _transcodingConfiguration; }
        }

        protected ScheduleConfiguration ScheduleConfiguration
        {
            get { return _scheduleConfiguration; }
        }

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
        public void CleanOldJobs(string key)
        {
            if (key != ScheduleConfiguration.TaskKey)
            {
                throw new HttpResponseException(HttpStatusCode.Forbidden);
            }

            TimeSpan oldJobExpiryInterval = TimeSpan.FromSeconds(TranscodingConfiguration.JobExpiryIntervalSeconds);

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