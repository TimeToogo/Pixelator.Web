using System.Web.Configuration;

namespace Pixelator.Web.Config
{
    public static class Configuration
    {
        public static TranscodingConfiguration Transcoding
        {
            get { return (TranscodingConfiguration)WebConfigurationManager.GetWebApplicationSection("transcodingConfiguration"); }
        }

        public static ScheduleConfiguration Schedule
        {
            get { return (ScheduleConfiguration)WebConfigurationManager.GetWebApplicationSection("scheduleConfiguration"); }
        }
    }
}