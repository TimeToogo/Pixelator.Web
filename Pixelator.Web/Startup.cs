using Microsoft.Owin;
using Owin;
using Pixelator.Web;

[assembly: OwinStartup(typeof(Startup))]
namespace Pixelator.Web
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {

        }
    }
}
