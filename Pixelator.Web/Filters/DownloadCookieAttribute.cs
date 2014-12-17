using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http.Filters;

namespace Pixelator.Web.Filters
{
    public class DownloadCookieAttribute : ActionFilterAttribute
    {
        public string Name { get; set; }
        public string Value { get; set; }

        public override Task OnActionExecutedAsync(HttpActionExecutedContext actionExecutedContext,
            CancellationToken cancellationToken)
        {
            if (actionExecutedContext.Response != null && actionExecutedContext.Response.IsSuccessStatusCode)
            {
                actionExecutedContext.Response.Headers.AddCookies(new[]
                {
                    new CookieHeaderValue("fileDownload", "true")
                    {
                        Path = "/"
                    }
                });
            }
            return Task.FromResult(0);
        }
    }
}