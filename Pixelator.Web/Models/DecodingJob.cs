using System.IO;

namespace Pixelator.Web.Models
{
    class DecodingJob : TranscodingJob
    {
        public Stream File { get; set; }
    }
}