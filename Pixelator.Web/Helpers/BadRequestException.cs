using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Pixelator.Web.Helpers
{
    public class BadRequestException : Exception
    {
        public BadRequestException(string message) : base(message)
        {
        }
    }
}