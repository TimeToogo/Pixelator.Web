using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Pixelator.Web.Models
{
    public class UploadedFile
    {
        public string Directory { get; set; }
        public string Name { get; set; }
        public Stream Stream { get; set; }
    }
}