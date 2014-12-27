using System.Collections.Generic;
using System.Web.Optimization;

namespace Pixelator.Web
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            //JS

            bundles.Add(new ScriptBundle("~/Bundles/Js/Common")
               .IncludeDirectory("~/Scripts/Common/", "*.js", searchSubdirectories: false));

            bundles.Add(new ScriptBundle("~/Bundles/Js/Common/Transcoding")
                .IncludeDirectory("~/Scripts/Common/", "*.js", searchSubdirectories: true));

            bundles.Add(new ScriptBundle("~/Bundles/Js/Encoder") { Orderer = new NonOrderingBundleOrderer() }
               .Include("~/Scripts/Encoder/Index.js")
               .IncludeDirectory("~/Scripts/Encoder/", "*.js", searchSubdirectories: true));

            bundles.Add(new ScriptBundle("~/Bundles/Js/Decoder") { Orderer = new NonOrderingBundleOrderer() }
               .Include("~/Scripts/Decoder/Index.js")
               .IncludeDirectory("~/Scripts/Decoder/", "*.js", searchSubdirectories: true));

            bundles.Add(new ScriptBundle("~/Bundles/Js/Jquery")
                .Include("~/Scripts/Referenced/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/Bundles/Js/JqueryUI")
                .Include("~/Scripts/Referenced/jquery-ui-{version}.js"));

            bundles.Add(new ScriptBundle("~/Bundles/Js/Plugins")
                .Include("~/Scripts/Referenced/canvas-to-blob.js")
                .Include("~/Scripts/Referenced/jquery.cookie.js")
                .Include("~/Scripts/Referenced/jquery.fileDownload.js"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/Bundles/Js/Modernizr").Include(
                        "~/Scripts/Referenced/modernizr-*"));

            //CSS

            bundles.Add(new StyleBundle("~/Bundles/Css/Common")
                .IncludeDirectory("~/Content/Css/Common/", "*.css", searchSubdirectories: false));

            bundles.Add(new StyleBundle("~/Bundles/Css/Common/Transcoding")
                .IncludeDirectory("~/Content/Css/Common/Transcoding/", "*.css", searchSubdirectories: true)
                .IncludeDirectory("~/Content/Css/Encoder/", "*.css", searchSubdirectories: true)
                .IncludeDirectory("~/Content/Css/Decoder/", "*.css", searchSubdirectories: true));

            //Have to make the path of the bundle same as the actual css path so image urls resolve properly
            bundles.Add(new StyleBundle("~/Content/themes/base/Bundle")
                .IncludeDirectory("~/Content/themes/base/", "*.css"));
        }

        private class NonOrderingBundleOrderer : IBundleOrderer
        {
            public IEnumerable<BundleFile> OrderFiles(BundleContext context, IEnumerable<BundleFile> files)
            {
                return files;
            }
        }
    }
}