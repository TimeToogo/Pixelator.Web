using System;
using System.IO;
using System.Text;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace Pixelator.Web
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Configure);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }
        
        protected void Application_Error(object sender, EventArgs e)
        {
            Exception exception = Server.GetLastError(); 
            StringBuilder builder = new StringBuilder();

            builder
                .AppendLine("----------")
                .AppendLine(DateTime.Now.ToString())
                .AppendFormat("Source:\t{0}", exception.Source)
                .AppendLine()
                .AppendFormat("Target:\t{0}", exception.TargetSite)
                .AppendLine()
                .AppendFormat("Type:\t{0}", exception.GetType().Name)
                .AppendLine()
                .AppendFormat("Message:\t{0}", exception.Message)
                .AppendLine()
                .AppendFormat("Stack:\t{0}", exception.StackTrace)
                .AppendLine();

            string filePath = Server.MapPath("~/App_Data/Error.log");

            using (StreamWriter writer = File.AppendText(filePath))
            {
                writer.Write(builder.ToString());
                writer.Flush();
            }
        }
    }
}
