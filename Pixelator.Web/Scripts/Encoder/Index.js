$(document).ready(function () {
    var Container = window.SiteContainer;

    var Job = new EncodingJob();
    var ContentElement = $("#EncoderContent > .Wrapper");
    var OverlayElement = $("#Content > #ContentOverlay");
    var TitleElement = $("#EncoderHeader > #EncoderContentTitle");
    var SidebarElement = $("#Sidebar > #SidebarList");

    window.EncoderContainer = new TranscodingAjaxContainer(Job, Container, ContentElement, OverlayElement, TitleElement, SidebarElement);
    var EncoderContainer = window.EncoderContainer;
    EncoderContainer.PageTitlePrefix = Container.PageTitlePrefix;

    EncoderContainer.DefineWarnUserLeavingMessage("Your picture will not be saved if you leave");

    EncoderContainer.DefineNextStepButton($("#ContinueButton"));
    EncoderContainer.DefinePreviousStepButton($("#BackButton"));

    EncoderContainer.DefineStep("/Encoder/ChooseData", "Specify your data", false, true);
    EncoderContainer.DefineStep("/Encoder/ChoosePassword", "Choose a password", true, true);
    EncoderContainer.DefineStep("/Encoder/Configure", "Configure your picture", true, true);
    EncoderContainer.DefineStep("/Encoder/Create", "Creating your picture", false, false);
    EncoderContainer.DefineStep("/Encoder/Display", "Here's your picture", false, true);

    EncoderContainer.DefineCompletePage("/encoder/");
    EncoderContainer.OnComplete = function () {
        ga('send', 'event', 'Transcoding', 'Encoded Picture');
    };

    EncoderContainer.LoadStep(EncoderContainer.Steps[0]);
    
});