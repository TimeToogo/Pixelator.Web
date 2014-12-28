using System.Configuration;

namespace Pixelator.Web.Config
{
    public class ScheduleConfiguration : ConfigurationSection
    {
        [ConfigurationProperty("taskKey")]
        public string TaskKey
        {
            get { return (string)this["taskKey"]; }
            set { this["taskKey"] = value; }
        }
    }
}