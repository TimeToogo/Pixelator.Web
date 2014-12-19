using System.Web.Mvc;

namespace Pixelator.Web.Controllers
{
    public class ErrorController : BaseController
    {
        //
        // GET: /Error/

        public ViewResult Index()
        {
            return AppropriateView();
        }

        //
        // GET: /Error/NotFound/

        public ViewResult NotFound()
        {
            return AppropriateView();
        }
    }
}
