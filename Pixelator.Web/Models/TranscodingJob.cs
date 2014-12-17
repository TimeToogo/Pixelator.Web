using System;

namespace Pixelator.Web.Models
{
    public class TranscodingJob
    {
        public string Password { get; set; }

        public bool HasPassword { get { return !String.IsNullOrEmpty(Password);  } }
    }
}
