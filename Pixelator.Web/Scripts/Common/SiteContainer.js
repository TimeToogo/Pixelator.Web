//Show bad browser dialog if unsupported features
$(document).ready(function () {
    var BadBrowser = $("#BadBrowser");
    var M = Modernizr;
    if (!M.filereader || !M.draganddrop || !M.history || !M.json || !window.FormData) {
        BadBrowser.removeClass("Hidden");
    }

    $("header nav a").filter(function () {
        return $(this).attr("href") === window.location.pathname;
    }).addClass("active");

    var ContentElement = $("#Content > .Wrapper");
    var OverlayElement = $("#Content > #ContentOverlay");
    var TitleElement = $("#Content > #ContentTitle");

    var Container = new AjaxContainer(ContentElement, OverlayElement, TitleElement);
    window.onpopstate = Container.LoadHistoryState;
    Container.PageTitlePrefix = document.title + " - ";
    Container.StoreHistoryState(undefined, document.title, window.location.pathname);

    window.SiteContainer = Container;
});