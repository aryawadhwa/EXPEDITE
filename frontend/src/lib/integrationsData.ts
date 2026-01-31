export interface Integration {
    id: string;
    name: string;
    category: string;
    description: string;
    logo?: string;
    status: "connected" | "pending" | "connect";
    connectedAs?: string;
}

export const integrations: Integration[] = [
    {
        id: "google_calendar",
        name: "Google Calendar",
        category: "Document & File Management",
        description: "Scheduling",
        logo: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
        status: "connect"
    },
    {
        id: "google_sheets",
        name: "Google Sheets",
        category: "Document & File Management",
        description: "Spreadsheets",
        logo: "https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg",
        status: "connect"
    },
    {
        id: "github",
        name: "GitHub",
        category: "Developer Tools & Infrastructure",
        description: "Code Hosting",
        logo: "https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg",
        status: "connect"
    },
    {
        id: "telegram",
        name: "Telegram",
        category: "Communication & Collaboration",
        description: "Messaging",
        logo: "https://www.google.com/s2/favicons?domain=telegram.org&sz=128",
        status: "connect"
    },
    {
        id: "gmail",
        name: "Gmail",
        category: "Communication & Collaboration",
        description: "Email",
        logo: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
        status: "connect"
    },
    {
        id: "jira",
        name: "Jira",
        category: "Project Management & Productivity",
        description: "Issue Tracking",
        logo: "https://www.google.com/s2/favicons?domain=jira.com&sz=128",
        status: "connect"
    },
    {
        id: "google_drive",
        name: "Google Drive",
        category: "Document & File Management",
        description: "File Storage",
        logo: "https://www.google.com/s2/favicons?domain=drive.google.com&sz=128",
        status: "connect"
    },
    {
        id: "airtable",
        name: "Airtable",
        category: "Project Management & Productivity",
        description: "Database",
        logo: "https://www.google.com/s2/favicons?domain=airtable.com&sz=128",
        status: "connect"
    },
    {
        id: "twitter",
        name: "Twitter",
        category: "Marketing & Social Media",
        description: "Social Media",
        logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
        status: "connect"
    },
    {
        id: "canva",
        name: "Canva",
        category: "Marketing & Social Media",
        description: "Design",
        logo: "https://www.google.com/s2/favicons?domain=canva.com&sz=128",
        status: "connect"
    },
    {
        id: "eventbrite",
        name: "Eventbrite",
        category: "Finance & Accounting",
        description: "Events",
        logo: "https://www.google.com/s2/favicons?domain=eventbrite.com&sz=128",
        status: "connect"
    },
    {
        id: "google_slides",
        name: "Google Slides",
        category: "Document & File Management",
        description: "Presentations",
        logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Slides_logo_%282014-2020%29.svg",
        status: "connect"
    },
    {
        id: "instagram",
        name: "Instagram",
        category: "Marketing & Social Media",
        description: "Social Media",
        logo: "https://www.google.com/s2/favicons?domain=instagram.com&sz=128",
        status: "connect"
    },
    {
        id: "mailchimp",
        name: "Mailchimp",
        category: "Marketing & Social Media",
        description: "Email Marketing",
        logo: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=128",
        status: "connect"
    },
    {
        id: "webflow",
        name: "Webflow",
        category: "Developer Tools & Infrastructure",
        description: "Website Builder",
        logo: "https://www.google.com/s2/favicons?domain=webflow.com&sz=128",
        status: "connect"
    },
    {
        id: "youtube",
        name: "Youtube",
        category: "Marketing & Social Media",
        description: "Video Hosting",
        logo: "https://www.google.com/s2/favicons?domain=youtube.com&sz=128",
        status: "connect"
    },
    {
        id: "slack",
        name: "Slack",
        category: "Communication & Collaboration",
        description: "Messaging",
        logo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
        status: "connect"
    },
    {
        id: "twitter_custom",
        name: "Twitter",
        category: "custom_trigger",
        description: "Custom Trigger",
        logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
        status: "connect"
    },
    {
        id: "fireflies",
        name: "Fireflies",
        category: "Specialized Tools",
        description: "Meeting Intelligence",
        logo: "https://www.google.com/s2/favicons?domain=fireflies.ai&sz=128",
        status: "connect"
    },
    {
        id: "elevenlabs",
        name: "Elevenlabs",
        category: "Specialized Tools",
        description: "Voice AI",
        logo: "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=128",
        status: "connect"
    },
    {
        id: "metaads",
        name: "Metaads",
        category: "Marketing & Social Media",
        description: "Advertising",
        logo: "https://www.google.com/s2/favicons?domain=meta.com&sz=128",
        status: "connect"
    },
    {
        id: "linear",
        name: "Linear",
        category: "Project Management & Productivity",
        description: "Issue Tracking",
        logo: "https://www.google.com/s2/favicons?domain=linear.app&sz=128",
        status: "connect"
    },
    {
        id: "linkedin",
        name: "Linkedin",
        category: "Marketing & Social Media",
        description: "Professional Networking",
        logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
        status: "connect"
    },
    {
        id: "notion",
        name: "Notion",
        category: "Project Management & Productivity",
        description: "Workspace",
        logo: "https://www.google.com/s2/favicons?domain=notion.so&sz=128",
        status: "connect"
    },
    {
        id: "gong",
        name: "Gong",
        category: "Specialized Tools",
        description: "Revenue Intelligence",
        logo: "https://www.google.com/s2/favicons?domain=gong.io&sz=128",
        status: "connect"
    },
    {
        id: "cal",
        name: "Cal",
        category: "HR & People Operations",
        description: "Scheduling",
        logo: "https://www.google.com/s2/favicons?domain=cal.com&sz=128",
        status: "connect"
    },
    {
        id: "calendly",
        name: "Calendly",
        category: "HR & People Operations",
        description: "Scheduling",
        logo: "https://www.google.com/s2/favicons?domain=calendly.com&sz=128",
        status: "connect"
    },
    {
        id: "attio",
        name: "Attio",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://www.google.com/s2/favicons?domain=attio.com&sz=128",
        status: "connect"
    },
    {
        id: "google_docs",
        name: "Google Docs",
        category: "Document & File Management",
        description: "Documents",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg",
        status: "connect"
    },
    {
        id: "google_ads",
        name: "Google Ads",
        category: "Marketing & Social Media",
        description: "Advertising",
        logo: "https://www.google.com/s2/favicons?domain=ads.google.com&sz=128",
        status: "connect"
    },
    {
        id: "reddit",
        name: "Reddit",
        category: "Marketing & Social Media",
        description: "Community",
        logo: "https://www.vectorlogo.zone/logos/reddit/reddit-icon.svg",
        status: "connect"
    },
    {
        id: "affinity",
        name: "Affinity",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://www.google.com/s2/favicons?domain=affinity.co&sz=128",
        status: "connect"
    },
    {
        id: "shopify",
        name: "Shopify",
        category: "Finance & Accounting",
        description: "E-commerce",
        logo: "https://www.google.com/s2/favicons?domain=shopify.com&sz=128",
        status: "connect"
    },
    {
        id: "agencyzoom",
        name: "Agencyzoom",
        category: "HR & People Operations",
        description: "AgencyZoom is for the P&C insurance agent that's looking to increase sales, boost retention and analyze agency & producer performance.",
        logo: "https://www.google.com/s2/favicons?domain=agencyzoom.com&sz=128",
        status: "connect"
    },
    {
        id: "ahrefs",
        name: "Ahrefs",
        category: "Marketing & Social Media",
        description: "SEO",
        logo: "https://www.google.com/s2/favicons?domain=ahrefs.com&sz=128",
        status: "connect"
    },
    {
        id: "amplitude",
        name: "Amplitude",
        category: "Developer Tools & Infrastructure",
        description: "Analytics",
        logo: "https://www.google.com/s2/favicons?domain=amplitude.com&sz=128",
        status: "connect"
    },
    {
        id: "apollo",
        name: "Apollo",
        category: "Marketing & Social Media",
        description: "Sales Intelligence",
        logo: "https://www.google.com/s2/favicons?domain=apollo.io&sz=128",
        status: "connect"
    },
    {
        id: "asana",
        name: "Asana",
        category: "Project Management & Productivity",
        description: "Project Management",
        logo: "https://www.google.com/s2/favicons?domain=asana.com&sz=128",
        status: "connect"
    },
    {
        id: "ashby",
        name: "Ashby",
        category: "HR & People Operations",
        description: "Recruiting",
        logo: "https://www.google.com/s2/favicons?domain=ashbyhq.com&sz=128",
        status: "connect"
    },
    {
        id: "bamboohr",
        name: "Bamboohr",
        category: "HR & People Operations",
        description: "HR Software",
        logo: "https://www.google.com/s2/favicons?domain=bamboohr.com&sz=128",
        status: "connect"
    },
    {
        id: "benchmark_email",
        name: "Benchmark email",
        category: "Marketing & Social Media",
        description: "Email Marketing",
        logo: "https://www.google.com/s2/favicons?domain=benchmarkemail.com&sz=128",
        status: "connect"
    },
    {
        id: "better_stack",
        name: "Better stack",
        category: "Developer Tools & Infrastructure",
        description: "Monitoring",
        logo: "https://www.google.com/s2/favicons?domain=betterstack.com&sz=128",
        status: "connect"
    },
    {
        id: "bitbucket",
        name: "Bitbucket",
        category: "Developer Tools & Infrastructure",
        description: "Code Hosting",
        logo: "https://www.google.com/s2/favicons?domain=bitbucket.org&sz=128",
        status: "connect"
    },
    {
        id: "blackbaud",
        name: "Blackbaud",
        category: "Finance & Accounting",
        description: "Nonprofit Cloud",
        logo: "https://www.google.com/s2/favicons?domain=blackbaud.com&sz=128",
        status: "connect"
    },
    {
        id: "borneo",
        name: "Borneo",
        category: "HR & People Operations",
        description: "Data Privacy",
        logo: "https://www.google.com/s2/favicons?domain=borneo.io&sz=128",
        status: "connect"
    },
    {
        id: "box",
        name: "Box",
        category: "Document & File Management",
        description: "Cloud Content",
        logo: "https://www.google.com/s2/favicons?domain=box.com&sz=128",
        status: "connect"
    },
    {
        id: "brandfetch",
        name: "Brandfetch",
        category: "Marketing & Social Media",
        description: "Brand Assets",
        logo: "https://www.google.com/s2/favicons?domain=brandfetch.com&sz=128",
        status: "connect"
    },
    {
        id: "discord",
        name: "Discord",
        category: "Communication & Collaboration",
        description: "Messaging",
        logo: "https://www.google.com/s2/favicons?domain=discord.com&sz=128",
        status: "connect"
    },
    {
        id: "salesforce",
        name: "Salesforce",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
        status: "connect"
    },
    {
        id: "builtwith",
        name: "Builtwith",
        category: "Marketing & Social Media",
        description: "Tech Profiler",
        logo: "https://www.google.com/s2/favicons?domain=builtwith.com&sz=128",
        status: "connect"
    },
    {
        id: "canny",
        name: "Canny",
        category: "Project Management & Productivity",
        description: "User Feedback",
        logo: "https://www.google.com/s2/favicons?domain=canny.io&sz=128",
        status: "connect"
    },
    {
        id: "canvas",
        name: "Canvas",
        category: "Specialized Tools",
        description: "LMS",
        logo: "https://www.google.com/s2/favicons?domain=instructure.com&sz=128",
        status: "connect"
    },
    {
        id: "capsule_crm",
        name: "Capsule crm",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://www.google.com/s2/favicons?domain=capsulecrm.com&sz=128",
        status: "connect"
    },
    {
        id: "chatwork",
        name: "Chatwork",
        category: "Communication & Collaboration",
        description: "Team Chat",
        logo: "https://www.google.com/s2/favicons?domain=chatwork.com&sz=128",
        status: "connect"
    },
    {
        id: "clickup",
        name: "Clickup",
        category: "Project Management & Productivity",
        description: "Productivity",
        logo: "https://www.google.com/s2/favicons?domain=clickup.com&sz=128",
        status: "connect"
    },
    {
        id: "clockify",
        name: "Clockify",
        category: "Project Management & Productivity",
        description: "Time Tracking",
        logo: "https://www.google.com/s2/favicons?domain=clockify.me&sz=128",
        status: "connect"
    },
    {
        id: "close",
        name: "Close",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://www.google.com/s2/favicons?domain=close.com&sz=128",
        status: "connect"
    },
    {
        id: "coda",
        name: "Coda",
        category: "Project Management & Productivity",
        description: "Docs & Makers",
        logo: "https://www.google.com/s2/favicons?domain=coda.io&sz=128",
        status: "connect"
    },
    {
        id: "confluence",
        name: "Confluence",
        category: "Project Management & Productivity",
        description: "Collaboration",
        logo: "https://www.google.com/s2/favicons?domain=atlassian.com&sz=128",
        status: "connect"
    },
    {
        id: "contentful",
        name: "Contentful",
        category: "Developer Tools & Infrastructure",
        description: "Headless CMS",
        logo: "https://www.google.com/s2/favicons?domain=contentful.com&sz=128",
        status: "connect"
    },
    {
        id: "datadog",
        name: "Datadog",
        category: "Developer Tools & Infrastructure",
        description: "Monitoring",
        logo: "https://www.google.com/s2/favicons?domain=datadoghq.com&sz=128",
        status: "connect"
    },
    {
        id: "dialpad",
        name: "Dialpad",
        category: "Communication & Collaboration",
        description: "Identify Intelligence",
        logo: "https://www.google.com/s2/favicons?domain=dialpad.com&sz=128",
        status: "connect"
    },
    {
        id: "digital_ocean",
        name: "Digital ocean",
        category: "Developer Tools & Infrastructure",
        description: "Cloud Infrastructure",
        logo: "https://www.google.com/s2/favicons?domain=digitalocean.com&sz=128",
        status: "connect"
    },
    {
        id: "dropbox",
        name: "Dropbox",
        category: "Document & File Management",
        description: "Cloud Storage",
        logo: "https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg",
        status: "connect"
    },
    {
        id: "dropbox_sign",
        name: "Dropbox sign",
        category: "Document & File Management",
        description: "eSignatures",
        logo: "https://www.google.com/s2/favicons?domain=hellosign.com&sz=128",
        status: "connect"
    },
    {
        id: "dynamics365",
        name: "Dynamics365",
        category: "HR & People Operations",
        description: "ERP & CRM",
        logo: "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
        status: "connect"
    },
    {
        id: "brex",
        name: "Brex",
        category: "Finance & Accounting",
        description: "Spend Management",
        logo: "https://www.google.com/s2/favicons?domain=brex.com&sz=128",
        status: "connect"
    },
    {
        id: "excel",
        name: "Excel",
        category: "Document & File Management",
        description: "Spreadsheets",
        logo: "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
        status: "connect"
    },
    {
        id: "facebook",
        name: "Facebook",
        category: "Marketing & Social Media",
        description: "Social Media",
        logo: "https://www.google.com/s2/favicons?domain=facebook.com&sz=128",
        status: "connect"
    },
    {
        id: "figma",
        name: "Figma",
        category: "Developer Tools & Infrastructure",
        description: "Design",
        logo: "https://www.google.com/s2/favicons?domain=figma.com&sz=128",
        status: "connect"
    },
    {
        id: "folk",
        name: "Folk",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://www.google.com/s2/favicons?domain=folk.app&sz=128",
        status: "connect"
    },
    {
        id: "formsite",
        name: "Formsite",
        category: "Document & File Management",
        description: "Forms",
        logo: "https://www.google.com/s2/favicons?domain=formsite.com&sz=128",
        status: "connect"
    },
    {
        id: "freshbooks",
        name: "Freshbooks",
        category: "Finance & Accounting",
        description: "Accounting",
        logo: "https://www.google.com/s2/favicons?domain=freshbooks.com&sz=128",
        status: "connect"
    },
    {
        id: "freshdesk",
        name: "Freshdesk",
        category: "Sales & CRM",
        description: "Customer Support",
        logo: "https://www.google.com/s2/favicons?domain=freshdesk.com&sz=128",
        status: "connect"
    },
    {
        id: "freshservice",
        name: "Freshservice",
        category: "Sales & CRM",
        description: "IT Service Management",
        logo: "https://www.google.com/s2/favicons?domain=freshservice.com&sz=128",
        status: "connect"
    },
    {
        id: "gitlab",
        name: "Gitlab",
        category: "Developer Tools & Infrastructure",
        description: "DevOps",
        logo: "https://www.google.com/s2/favicons?domain=gitlab.com&sz=128",
        status: "connect"
    },
    {
        id: "google_analytics",
        name: "Google Analytics",
        category: "Developer Tools & Infrastructure",
        description: "Analytics",
        logo: "https://www.google.com/s2/favicons?domain=analytics.google.com&sz=128",
        status: "connect"
    },
    {
        id: "gorgias",
        name: "Gorgias",
        category: "Sales & CRM",
        description: "E-commerce Support",
        logo: "https://www.google.com/s2/favicons?domain=gorgias.com&sz=128",
        status: "connect"
    },
    {
        id: "google_classroom",
        name: "Google Classroom",
        category: "Document & File Management",
        description: "Education",
        logo: "https://www.google.com/s2/favicons?domain=classroom.google.com&sz=128",
        status: "connect"
    },
    {
        id: "google_tasks",
        name: "Google Tasks",
        category: "Document & File Management",
        description: "Task Management",
        logo: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Google_Tasks_2021.svg",
        status: "connect"
    },
    {
        id: "gosquared",
        name: "Gosquared",
        category: "Marketing & Social Media",
        description: "Analytics",
        logo: "https://www.google.com/s2/favicons?domain=gosquared.com&sz=128",
        status: "connect"
    },
    {
        id: "gumroad",
        name: "Gumroad",
        category: "Finance & Accounting",
        description: "E-commerce",
        logo: "https://www.google.com/s2/favicons?domain=gumroad.com&sz=128",
        status: "connect"
    },
    {
        id: "harvest",
        name: "Harvest",
        category: "Project Management & Productivity",
        description: "Time Tracking",
        logo: "https://www.google.com/s2/favicons?domain=getharvest.com&sz=128",
        status: "connect"
    },
    {
        id: "google_maps",
        name: "Google Maps",
        category: "Document & File Management",
        description: "Maps",
        logo: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg",
        status: "connect"
    },
    {
        id: "heyreach",
        name: "Heyreach",
        category: "Marketing & Social Media",
        description: "Outreach",
        logo: "https://www.google.com/s2/favicons?domain=heyreach.io&sz=128",
        status: "connect"
    },
    {
        id: "hubspot",
        name: "Hubspot",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=128",
        status: "connect"
    },
    {
        id: "hunter",
        name: "Hunter",
        category: "Marketing & Social Media",
        description: "Email Marketing",
        logo: "https://www.google.com/s2/favicons?domain=hunter.io&sz=128",
        status: "connect"
    },
    {
        id: "insighto_ai",
        name: "Insighto ai",
        category: "Sales & CRM",
        description: "Conversational AI",
        logo: "https://www.google.com/s2/favicons?domain=insighto.ai&sz=128",
        status: "connect"
    },
    {
        id: "instantly",
        name: "Instantly",
        category: "Marketing & Social Media",
        description: "Cold Email",
        logo: "https://www.google.com/s2/favicons?domain=instantly.ai&sz=128",
        status: "connect"
    },
    {
        id: "intercom",
        name: "Intercom",
        category: "Sales & CRM",
        description: "Customer Support",
        logo: "https://www.google.com/s2/favicons?domain=intercom.com&sz=128",
        status: "connect"
    },
    {
        id: "jotform",
        name: "Jotform",
        category: "Document & File Management",
        description: "Forms",
        logo: "https://www.google.com/s2/favicons?domain=jotform.com&sz=128",
        status: "connect"
    },
    {
        id: "kibana",
        name: "Kibana",
        category: "Developer Tools & Infrastructure",
        description: "Visualization",
        logo: "https://www.google.com/s2/favicons?domain=elastic.co&sz=128",
        status: "connect"
    },
    {
        id: "kit",
        name: "Kit",
        category: "Specialized Tools",
        description: "Creator Tools",
        logo: "https://www.google.com/s2/favicons?domain=kit.com&sz=128",
        status: "connect"
    },
    {
        id: "klaviyo",
        name: "Klaviyo",
        category: "Marketing & Social Media",
        description: "Marketing Automation",
        logo: "https://www.google.com/s2/favicons?domain=klaviyo.com&sz=128",
        status: "connect"
    },
    {
        id: "lemlist",
        name: "Lemlist",
        category: "Marketing & Social Media",
        description: "Outreach",
        logo: "https://www.google.com/s2/favicons?domain=lemlist.com&sz=128",
        status: "connect"
    },
    {
        id: "lever",
        name: "Lever",
        category: "HR & People Operations",
        description: "ATS",
        logo: "https://www.google.com/s2/favicons?domain=lever.co&sz=128",
        status: "connect"
    },
    {
        id: "lodgify",
        name: "Lodgify",
        category: "Specialized Tools",
        description: "Vacation Rentals",
        logo: "https://www.google.com/s2/favicons?domain=lodgify.com&sz=128",
        status: "connect"
    },
    {
        id: "mailcoach",
        name: "Mailcoach",
        category: "Marketing & Social Media",
        description: "Email Marketing",
        logo: "https://www.google.com/s2/favicons?domain=mailcoach.app&sz=128",
        status: "connect"
    },
    {
        id: "mailerlite",
        name: "Mailerlite",
        category: "Marketing & Social Media",
        description: "Email Marketing",
        logo: "https://www.google.com/s2/favicons?domain=mailerlite.com&sz=128",
        status: "connect"
    },
    {
        id: "mapbox",
        name: "Mapbox",
        category: "Specialized Tools",
        description: "Maps",
        logo: "https://www.google.com/s2/favicons?domain=mapbox.com&sz=128",
        status: "connect"
    },
    {
        id: "heygen",
        name: "Heygen",
        category: "Marketing & Social Media",
        description: "Video AI",
        logo: "https://www.google.com/s2/favicons?domain=heygen.com&sz=128",
        status: "connect"
    },
    {
        id: "miro",
        name: "Miro",
        category: "Project Management & Productivity",
        description: "Whiteboard",
        logo: "https://www.google.com/s2/favicons?domain=miro.com&sz=128",
        status: "connect"
    },
    {
        id: "mixpanel",
        name: "Mixpanel",
        category: "Developer Tools & Infrastructure",
        description: "Analytics",
        logo: "https://www.google.com/s2/favicons?domain=mixpanel.com&sz=128",
        status: "connect"
    },
    {
        id: "monday",
        name: "Monday",
        category: "Project Management & Productivity",
        description: "Work Management",
        logo: "https://www.google.com/s2/favicons?domain=monday.com&sz=128",
        status: "connect"
    },
    {
        id: "moneybird",
        name: "Moneybird",
        category: "Finance & Accounting",
        description: "Accounting",
        logo: "https://www.google.com/s2/favicons?domain=moneybird.com&sz=128",
        status: "connect"
    },
    {
        id: "moz",
        name: "Moz",
        category: "Marketing & Social Media",
        description: "SEO",
        logo: "https://www.google.com/s2/favicons?domain=moz.com&sz=128",
        status: "connect"
    },
    {
        id: "new_relic",
        name: "New relic",
        category: "Developer Tools & Infrastructure",
        description: "Observability",
        logo: "https://www.google.com/s2/favicons?domain=newrelic.com&sz=128",
        status: "connect"
    },
    {
        id: "omnisend",
        name: "Omnisend",
        category: "Marketing & Social Media",
        description: "Marketing Automation",
        logo: "https://www.google.com/s2/favicons?domain=omnisend.com&sz=128",
        status: "connect"
    },
    {
        id: "open_sea",
        name: "Open sea",
        category: "Specialized Tools",
        description: "NFT Marketplace",
        logo: "https://www.google.com/s2/favicons?domain=opensea.io&sz=128",
        status: "connect"
    },
    {
        id: "outlook",
        name: "Outlook",
        category: "Communication & Collaboration",
        description: "Email & Calendar",
        logo: "https://www.google.com/s2/favicons?domain=outlook.com&sz=128",
        status: "connect"
    },
    {
        id: "pagerduty",
        name: "Pagerduty",
        category: "Developer Tools & Infrastructure",
        description: "Incident Management",
        logo: "https://www.google.com/s2/favicons?domain=pagerduty.com&sz=128",
        status: "connect"
    },
    {
        id: "pingdom",
        name: "Pingdom",
        category: "Developer Tools & Infrastructure",
        description: "Monitoring",
        logo: "https://www.google.com/s2/favicons?domain=pingdom.com&sz=128",
        status: "connect"
    },
    {
        id: "pipedrive",
        name: "Pipedrive",
        category: "Sales & CRM",
        description: "Sales CRM",
        logo: "https://www.google.com/s2/favicons?domain=pipedrive.com&sz=128",
        status: "connect"
    },
    {
        id: "pipeline_crm",
        name: "Pipeline crm",
        category: "Sales & CRM",
        description: "Sales CRM",
        logo: "https://www.google.com/s2/favicons?domain=pipelinecrm.com&sz=128",
        status: "connect"
    },
    {
        id: "polygon",
        name: "Polygon",
        category: "Specialized Tools",
        description: "Financial Data",
        logo: "https://www.google.com/s2/favicons?domain=polygon.io&sz=128",
        status: "connect"
    },
    {
        id: "postgrid",
        name: "Postgrid",
        category: "Specialized Tools",
        description: "Mail Automation",
        logo: "https://www.google.com/s2/favicons?domain=postgrid.com&sz=128",
        status: "connect"
    },
    {
        id: "posthog",
        name: "Posthog",
        category: "Developer Tools & Infrastructure",
        description: "Product Analytics",
        logo: "https://www.google.com/s2/favicons?domain=posthog.com&sz=128",
        status: "connect"
    },
    {
        id: "postmark",
        name: "Postmark",
        category: "Specialized Tools",
        description: "Email Delivery",
        logo: "https://www.google.com/s2/favicons?domain=postmarkapp.com&sz=128",
        status: "connect"
    },
    {
        id: "microsoft_teams",
        name: "Microsoft teams",
        category: "Communication & Collaboration",
        description: "Collaboration",
        logo: "https://www.google.com/s2/favicons?domain=teams.microsoft.com&sz=128",
        status: "connect"
    },
    {
        id: "pushbullet",
        name: "Pushbullet",
        category: "Communication & Collaboration",
        description: "Notifications",
        logo: "https://www.google.com/s2/favicons?domain=pushbullet.com&sz=128",
        status: "connect"
    },
    {
        id: "quickbooks",
        name: "Quickbooks",
        category: "Finance & Accounting",
        description: "Accounting",
        logo: "https://www.google.com/s2/favicons?domain=quickbooks.intuit.com&sz=128",
        status: "connect"
    },
    {
        id: "recallai",
        name: "Recallai",
        category: "Specialized Tools",
        description: "Meeting Bots",
        logo: "https://www.google.com/s2/favicons?domain=recall.ai&sz=128",
        status: "connect"
    },
    {
        id: "recruitee",
        name: "Recruitee",
        category: "HR & People Operations",
        description: "Hiring Software",
        logo: "https://www.google.com/s2/favicons?domain=recruitee.com&sz=128",
        status: "connect"
    },
    {
        id: "refiner",
        name: "Refiner",
        category: "Marketing & Social Media",
        description: "User Surveys",
        logo: "https://www.google.com/s2/favicons?domain=refiner.io&sz=128",
        status: "connect"
    },
    {
        id: "remarkety",
        name: "Remarkety",
        category: "Marketing & Social Media",
        description: "Marketing Automation",
        logo: "https://www.google.com/s2/favicons?domain=remarkety.com&sz=128",
        status: "connect"
    },
    {
        id: "reply",
        name: "Reply",
        category: "Sales & CRM",
        description: "Sales Engagement",
        logo: "https://www.google.com/s2/favicons?domain=reply.io&sz=128",
        status: "connect"
    },
    {
        id: "resend",
        name: "Resend",
        category: "Specialized Tools",
        description: "Email API",
        logo: "https://www.google.com/s2/favicons?domain=resend.com&sz=128",
        status: "connect"
    },
    {
        id: "respond_io",
        name: "Respond io",
        category: "Communication & Collaboration",
        description: "Conversation Management",
        logo: "https://www.google.com/s2/favicons?domain=respond.io&sz=128",
        status: "connect"
    },
    {
        id: "retellai",
        name: "Retellai",
        category: "Specialized Tools",
        description: "Voice Analytics",
        logo: "https://www.google.com/s2/favicons?domain=retellai.com&sz=128",
        status: "connect"
    },
    {
        id: "rocketlane",
        name: "Rocketlane",
        category: "Project Management & Productivity",
        description: "Customer Onboarding",
        logo: "https://www.google.com/s2/favicons?domain=rocketlane.com&sz=128",
        status: "connect"
    },
    {
        id: "safetyculture",
        name: "Safetyculture",
        category: "Project Management & Productivity",
        description: "Workplace Safety",
        logo: "https://www.google.com/s2/favicons?domain=safetyculture.com&sz=128",
        status: "connect"
    },
    {
        id: "salesmate",
        name: "Salesmate",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://www.google.com/s2/favicons?domain=salesmate.io&sz=128",
        status: "connect"
    },
    {
        id: "semrush",
        name: "Semrush",
        category: "Marketing & Social Media",
        description: "SEO Suite",
        logo: "https://www.google.com/s2/favicons?domain=semrush.com&sz=128",
        status: "connect"
    },
    {
        id: "sendbird",
        name: "Sendbird",
        category: "Communication & Collaboration",
        description: "Chat API",
        logo: "https://www.google.com/s2/favicons?domain=sendbird.com&sz=128",
        status: "connect"
    },
    {
        id: "sendgrid",
        name: "Sendgrid",
        category: "Marketing & Social Media",
        description: "Email Delivery",
        logo: "https://www.google.com/s2/favicons?domain=sendgrid.com&sz=128",
        status: "connect"
    },
    {
        id: "sendlane",
        name: "Sendlane",
        category: "Marketing & Social Media",
        description: "Marketing Automation",
        logo: "https://www.google.com/s2/favicons?domain=sendlane.com&sz=128",
        status: "connect"
    },
    {
        id: "sendloop",
        name: "Sendloop",
        category: "Marketing & Social Media",
        description: "Email Marketing",
        logo: "https://www.google.com/s2/favicons?domain=sendloop.com&sz=128",
        status: "connect"
    },
    {
        id: "sentry",
        name: "Sentry",
        category: "Developer Tools & Infrastructure",
        description: "Error Tracking",
        logo: "https://www.google.com/s2/favicons?domain=sentry.io&sz=128",
        status: "connect"
    },
    {
        id: "productboard",
        name: "Productboard",
        category: "Project Management & Productivity",
        description: "Product Management",
        logo: "https://www.google.com/s2/favicons?domain=productboard.com&sz=128",
        status: "connect"
    },
    {
        id: "share_point",
        name: "Share point",
        category: "Document & File Management",
        description: "Document Management",
        logo: "https://www.google.com/s2/favicons?domain=sharepoint.com&sz=128",
        status: "connect"
    },
    {
        id: "shortcut",
        name: "Shortcut",
        category: "Project Management & Productivity",
        description: "Project Management",
        logo: "https://www.google.com/s2/favicons?domain=shortcut.com&sz=128",
        status: "connect"
    },
    {
        id: "slackbot",
        name: "Slackbot",
        category: "Communication & Collaboration",
        description: "Automation",
        logo: "https://www.google.com/s2/favicons?domain=slack.com&sz=128",
        status: "connect"
    },
    {
        id: "snowflake",
        name: "Snowflake",
        category: "Developer Tools & Infrastructure",
        description: "Data Warehouse",
        logo: "https://www.google.com/s2/favicons?domain=snowflake.com&sz=128",
        status: "connect"
    },
    {
        id: "square",
        name: "Square",
        category: "Finance & Accounting",
        description: "Payments",
        logo: "https://www.google.com/s2/favicons?domain=squareup.com&sz=128",
        status: "connect"
    },
    {
        id: "strava",
        name: "Strava",
        category: "Specialized Tools",
        description: "Fitness Tracking",
        logo: "https://www.google.com/s2/favicons?domain=strava.com&sz=128",
        status: "connect"
    },
    {
        id: "stripe",
        name: "Stripe",
        category: "Developer Tools & Infrastructure",
        description: "Payments",
        logo: "https://www.google.com/s2/favicons?domain=stripe.com&sz=128",
        status: "connect"
    },
    {
        id: "supabase",
        name: "Supabase",
        category: "Developer Tools & Infrastructure",
        description: "Backend as a Service",
        logo: "https://www.google.com/s2/favicons?domain=supabase.com&sz=128",
        status: "connect"
    },
    {
        id: "survey_monkey",
        name: "Survey monkey",
        category: "Document & File Management",
        description: "Surveys",
        logo: "https://www.google.com/s2/favicons?domain=surveymonkey.com&sz=128",
        status: "connect"
    },
    {
        id: "tally",
        name: "Tally",
        category: "Document & File Management",
        description: "Form Builder",
        logo: "https://www.google.com/s2/favicons?domain=tally.so&sz=128",
        status: "connect"
    },
    {
        id: "telnyx",
        name: "Telnyx",
        category: "Specialized Tools",
        description: "Communications",
        logo: "https://www.google.com/s2/favicons?domain=telnyx.com&sz=128",
        status: "connect"
    },
    {
        id: "ticketmaster",
        name: "Ticketmaster",
        category: "Specialized Tools",
        description: "Event Ticketing",
        logo: "https://www.google.com/s2/favicons?domain=ticketmaster.com&sz=128",
        status: "connect"
    },
    {
        id: "ticktick",
        name: "Ticktick",
        category: "Project Management & Productivity",
        description: "Task Management",
        logo: "https://www.google.com/s2/favicons?domain=ticktick.com&sz=128",
        status: "connect"
    },
    {
        id: "tiktok",
        name: "Tiktok",
        category: "Marketing & Social Media",
        description: "Social Video",
        logo: "https://www.google.com/s2/favicons?domain=tiktok.com&sz=128",
        status: "connect"
    },
    {
        id: "timecamp",
        name: "Timecamp",
        category: "Project Management & Productivity",
        description: "Time Tracking",
        logo: "https://www.google.com/s2/favicons?domain=timecamp.com&sz=128",
        status: "connect"
    },
    {
        id: "timely",
        name: "Timely",
        category: "Project Management & Productivity",
        description: "Automatic Time Tracking",
        logo: "https://www.google.com/s2/favicons?domain=timelyapp.com&sz=128",
        status: "connect"
    },
    {
        id: "todoist",
        name: "Todoist",
        category: "Project Management & Productivity",
        description: "Task Management",
        logo: "https://www.google.com/s2/favicons?domain=todoist.com&sz=128",
        status: "connect"
    },
    {
        id: "trello",
        name: "Trello",
        category: "Project Management & Productivity",
        description: "Project Management",
        logo: "https://www.google.com/s2/favicons?domain=trello.com&sz=128",
        status: "connect"
    },
    {
        id: "uptimerobot",
        name: "Uptimerobot",
        category: "Developer Tools & Infrastructure",
        description: "Uptime Monitoring",
        logo: "https://www.google.com/s2/favicons?domain=uptimerobot.com&sz=128",
        status: "connect"
    },
    {
        id: "servicenow",
        name: "Servicenow",
        category: "Sales & CRM",
        description: "ITSM",
        logo: "https://www.google.com/s2/favicons?domain=servicenow.com&sz=128",
        status: "connect"
    },
    {
        id: "whatsapp",
        name: "Whatsapp",
        category: "Communication & Collaboration",
        description: "Messaging",
        logo: "https://www.google.com/s2/favicons?domain=whatsapp.com&sz=128",
        status: "connect"
    },
    {
        id: "workable",
        name: "Workable",
        category: "HR & People Operations",
        description: "HR Software",
        logo: "https://www.google.com/s2/favicons?domain=workable.com&sz=128",
        status: "connect"
    },
    {
        id: "wrike",
        name: "Wrike",
        category: "Project Management & Productivity",
        description: "Project Management",
        logo: "https://www.google.com/s2/favicons?domain=wrike.com&sz=128",
        status: "connect"
    },
    {
        id: "xero",
        name: "Xero",
        category: "Finance & Accounting",
        description: "Accounting",
        logo: "https://www.google.com/s2/favicons?domain=xero.com&sz=128",
        status: "connect"
    },
    {
        id: "zendesk",
        name: "Zendesk",
        category: "Sales & CRM",
        description: "Customer Support",
        logo: "https://www.google.com/s2/favicons?domain=zendesk.com&sz=128",
        status: "connect"
    },
    {
        id: "zoho",
        name: "Zoho",
        category: "Sales & CRM",
        description: "Business Suite",
        logo: "https://www.google.com/s2/favicons?domain=zoho.com&sz=128",
        status: "connect"
    },
    {
        id: "zoho_bigin",
        name: "Zoho bigin",
        category: "Sales & CRM",
        description: "CRM",
        logo: "https://www.google.com/s2/favicons?domain=bigin.zoho.com&sz=128",
        status: "connect"
    },
    {
        id: "zoho_books",
        name: "Zoho books",
        category: "Finance & Accounting",
        description: "Accounting",
        logo: "https://www.google.com/s2/favicons?domain=books.zoho.com&sz=128",
        status: "connect"
    },
    {
        id: "zoho_inventory",
        name: "Zoho inventory",
        category: "Finance & Accounting",
        description: "Inventory Management",
        logo: "https://www.google.com/s2/favicons?domain=inventory.zoho.com&sz=128",
        status: "connect"
    },
    {
        id: "zoho_invoice",
        name: "Zoho invoice",
        category: "Finance & Accounting",
        description: "Invoicing",
        logo: "https://www.google.com/s2/favicons?domain=invoice.zoho.com&sz=128",
        status: "connect"
    },
    {
        id: "zoho_mail",
        name: "Zoho mail",
        category: "Communication & Collaboration",
        description: "Email Hosting",
        logo: "https://www.google.com/s2/favicons?domain=mail.zoho.com&sz=128",
        status: "connect"
    },
    {
        id: "zoom",
        name: "Zoom",
        category: "Communication & Collaboration",
        description: "Video Conferencing",
        logo: "https://www.google.com/s2/favicons?domain=zoom.us&sz=128",
        status: "connect"
    },
    {
        id: "zoominfo",
        name: "Zoominfo",
        category: "Sales & CRM",
        description: "B2B Database",
        logo: "https://www.google.com/s2/favicons?domain=zoominfo.com&sz=128",
        status: "connect"
    },
    {
        id: "brevo",
        name: "Brevo",
        category: "Marketing & Social Media",
        description: "Marketing Platform",
        logo: "https://www.google.com/s2/favicons?domain=brevo.com&sz=128",
        status: "connect"
    },
    {
        id: "webex",
        name: "Webex",
        category: "Communication & Collaboration",
        description: "Video Conferencing",
        logo: "https://www.google.com/s2/favicons?domain=webex.com&sz=128",
        status: "connect"
    },
    {
        id: "microsoft_clarity",
        name: "Microsoft clarity",
        category: "Developer Tools & Infrastructure",
        description: "Behavior Analytics",
        logo: "https://www.google.com/s2/favicons?domain=clarity.microsoft.com&sz=128",
        status: "connect"
    },
    {
        id: "one_drive",
        name: "One drive",
        category: "Document & File Management",
        description: "Cloud Storage",
        logo: "https://www.google.com/s2/favicons?domain=onedrive.com&sz=128",
        status: "connect"
    },
    {
        id: "prisma",
        name: "Prisma",
        category: "Developer Tools & Infrastructure",
        description: "Database ORM",
        logo: "https://www.google.com/s2/favicons?domain=prisma.io&sz=128",
        status: "connect"
    },
];
