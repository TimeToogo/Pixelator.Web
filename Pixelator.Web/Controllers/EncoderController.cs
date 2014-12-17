using System.Web.Mvc;
using Pixelator.Web.Filters;

namespace Pixelator.Web.Controllers
{
    public class EncoderController : BaseController
    {
        //
        // GET/AJAX: /Encoder/

        public ViewResult Index()
        {
            return AppropriateView();
        }

        //
        // AJAX: /Encoder/ChooseData/

        [AjaxOnly]
        public ViewResult ChooseData()
        {
            return AjaxView();
        }

        //
        // AJAX: /Encoder/ChoosePassword/

        [AjaxOnly]
        public ViewResult ChoosePassword()
        {
            return AjaxView();
        }

        //
        // AJAX: /Encoder/Configure/

        [AjaxOnly]
        public ViewResult Configure()
        {
            return AjaxView();
        }

        //
        // AJAX: /Encoder/Create/

        [AjaxOnly]
        public ViewResult Create()
        {
            return AjaxView();
        }

        //
        // AJAX: /Encoder/Display/

        [AjaxOnly]
        public ViewResult Display()
        {
            return AjaxView();
        }
    }
}
