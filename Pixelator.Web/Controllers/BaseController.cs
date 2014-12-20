using System.Web.Mvc;

namespace Pixelator.Web.Controllers
{
#if!DEBUG
    [RequireHttps]
#endif
    public abstract class BaseController : Controller
    {
        protected ViewResult AjaxView()
        {
            ViewResult viewResult = View();
            viewResult.MasterName = "_AjaxLayout";

            return viewResult;
        }

        protected ViewResult AppropriateView()
        {
            if (Request.IsAjaxRequest())
            {
                return AjaxView();
            }

            return View();
        }
    }
}
