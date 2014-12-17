using System.Web.Http;

namespace Pixelator.Web
{
    public class WebApiConfig
    {
        public static void Configure(HttpConfiguration Configuration)
        {
            Configuration.Routes.MapHttpRoute(
                name: "Api",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { action = "Index", id = RouteParameter.Optional }
            );
        }
    }
}