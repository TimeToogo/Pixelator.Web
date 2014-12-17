using System.Web.Mvc;

namespace Pixelator.Web.Controllers
{
    public class WhatIsThisController : BaseController
    {
        //
        // GET/AJAX: /WhatIsThis/

        public ViewResult Index()
        {
            return AppropriateView();
        }
    }
}
