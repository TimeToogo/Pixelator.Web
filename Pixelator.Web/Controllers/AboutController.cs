using System.Web.Mvc;

namespace Pixelator.Web.Controllers
{
    public class AboutController : BaseController
    {
        //
        // GET/AJAX: /About/

        public ViewResult Index()
        {
            return AppropriateView();
        }
    }
}
