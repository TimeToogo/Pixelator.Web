$(document).ready(function () {
    var Container = window.SiteContainer;

    var Job = new DecodingJob();
    var ContentElement = $("#DecoderContent > .Wrapper");
    var OverlayElement = $("#Content > #ContentOverlay");
    var TitleElement = $("#DecoderHeader > #DecoderContentTitle");
    var SidebarElement = $("#Sidebar > #SidebarList");

    window.DecoderContainer = new TranscodingAjaxContainer(Job, Container, ContentElement, OverlayElement, TitleElement, SidebarElement);
    var DecoderContainer = window.DecoderContainer;
    DecoderContainer.PageTitlePrefix = Container.PageTitlePrefix;

    DecoderContainer.DefineWarnUserLeavingMessage("Your image will not be decoded and saved if you leave");

    DecoderContainer.DefineNextStepButton($("#ContinueButton"));
    DecoderContainer.DefinePreviousStepButton($("#BackButton"));

    DecoderContainer.DefineStep("/Decoder/ChooseImage", "Specify your picture", false, true);
    DecoderContainer.DefineStep("/Decoder/ChoosePassword", "Specify your password", true, true);
    DecoderContainer.DefineStep("/Decoder/Decode", "Decoding your image", false, false);
    DecoderContainer.DefineStep("/Decoder/ChooseDownloads", "Download your data", false, true);

    DecoderContainer.DefineCompletePage("/decoder/");
    DecoderContainer.OnComplete = function () {
        ga('send', 'event', 'Transcoding', 'Decoded Picture');
    };

    DecoderContainer.LoadStep(DecoderContainer.Steps[0]);
});