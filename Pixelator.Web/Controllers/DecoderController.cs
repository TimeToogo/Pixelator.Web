using System.Web.Mvc;
using Pixelator.Web.Filters;

namespace Pixelator.Web.Controllers
{
    public class DecoderController : BaseController
    {
        //
        // GET/AJAX: /Decoder/

        public ViewResult Index()
        {
            return AppropriateView();
        }

        //
        // AJAX: /Decoder/ChooseImage/

        [AjaxOnly]
        public ViewResult ChooseImage()
        {
            return AjaxView();
        }

        //
        // AJAX: /Decoder/ChoosePassword/

        [AjaxOnly]
        public ViewResult ChoosePassword()
        {
            return AjaxView();
        }

        //
        // AJAX: /Decoder/Decode/

        [AjaxOnly]
        public ViewResult Decode()
        {
            return AjaxView();
        }

        //
        // AJAX: /Decoder/ChooseDownloads/

        [AjaxOnly]
        public ViewResult ChooseDownloads()
        {
            return AjaxView();
        }
    }
}
