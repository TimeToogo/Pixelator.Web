using System.Reflection;
using System.Web.Mvc;

namespace Pixelator.Web.Filters
{
    public class AjaxOnlyAttribute : ActionMethodSelectorAttribute 
    {
        public override bool IsValidForRequest(ControllerContext ControllerContext, MethodInfo MethodInfo)
        {
            return ControllerContext.HttpContext.Request.IsAjaxRequest();
        }
    }
}