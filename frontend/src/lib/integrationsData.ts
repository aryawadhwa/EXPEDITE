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
        description: "Google Calendar is a time management tool providing scheduling features, event reminders, and integration with email and other apps for streamlined organization",
        status: "connect"
    },
    {
        id: "google_sheets",
        name: "Google Sheets",
        category: "Document & File Management",
        description: "Google Sheets is a cloud-based spreadsheet tool enabling real-time collaboration, data analysis, and integration with other Google Workspace apps",
        status: "connect"
    },
    {
        id: "github",
        name: "GitHub",
        category: "Developer Tools & Infrastructure",
        description: "GitHub is a code hosting platform for version control and collaboration, offering Git-based repository management, issue tracking, and continuous integration features",
        status: "connect"
    },
    {
        id: "telegram",
        name: "Telegram",
        category: "Communication & Collaboration",
        description: "Telegram is a cloud-based messaging app with a focus on security and speed. Build bots to send messages, manage chats, and interact with users.",
        status: "connect"
    },
    {
        id: "gmail",
        name: "Gmail",
        category: "Communication & Collaboration",
        description: "Gmail is Google’s email service, featuring spam protection, search functions, and seamless integration with other G Suite apps for productivity",
        status: "connect"
    },
    {
        id: "jira",
        name: "Jira",
        category: "Project Management & Productivity",
        description: "A tool for bug tracking, issue tracking, and agile project management.",
        status: "connect"
    },
    {
        id: "google_drive",
        name: "Google Drive",
        category: "Document & File Management",
        description: "Google Drive is a cloud storage solution for uploading, sharing, and collaborating on files across devices, with robust search and offline access",
        status: "connect"
    },
    {
        id: "airtable",
        name: "Airtable",
        category: "Project Management & Productivity",
        description: "Airtable merges spreadsheet functionality with database power, enabling teams to organize projects, track tasks, and collaborate through customizable views, automation, and integrations for data management",
        status: "connect"
    },
    {
        id: "twitter",
        name: "Twitter",
        category: "Marketing & Social Media",
        description: "Twitter, Inc. was an American social media company based in San Francisco, California, which operated and was named for named for its flagship social media network prior to its rebrand as X.",
        status: "connect"
    },
    {
        id: "canva",
        name: "Canva",
        category: "Marketing & Social Media",
        description: "Canva offers a drag-and-drop design suite for creating social media graphics, presentations, and marketing materials with prebuilt templates and a vast element library",
        status: "connect"
    },
    {
        id: "eventbrite",
        name: "Eventbrite",
        category: "Finance & Accounting",
        description: "Eventbrite enables organizers to plan, promote, and manage events, selling tickets and providing attendee tools for conferences, concerts, and gatherings",
        status: "connect"
    },
    {
        id: "google_slides",
        name: "Google Slides",
        category: "Document & File Management",
        description: "Google Slides is a cloud-based presentation editor with real-time collaboration, template gallery, and integration with other Google Workspace apps",
        status: "connect"
    },
    {
        id: "instagram",
        name: "Instagram",
        category: "Marketing & Social Media",
        description: "Instagram is a social media platform for sharing photos, videos, and stories. Only supports Instagram Business and Creator accounts, not Instagram Personal accounts.",
        status: "connect"
    },
    {
        id: "mailchimp",
        name: "Mailchimp",
        category: "Marketing & Social Media",
        description: "Mailchimp is an email marketing and automation platform providing campaign templates, audience segmentation, and performance analytics to drive engagement and conversions",
        status: "connect"
    },
    {
        id: "webflow",
        name: "Webflow",
        category: "Developer Tools & Infrastructure",
        description: "Webflow is a no-code website design and hosting platform, letting users build responsive sites, launch online stores, and maintain content without coding",
        status: "connect"
    },
    {
        id: "youtube",
        name: "Youtube",
        category: "Marketing & Social Media",
        description: "YouTube is a video-sharing platform with user-generated content, live streaming, and monetization opportunities, widely used for marketing, education, and entertainment",
        status: "connect"
    },
    {
        id: "slack",
        name: "Slack",
        category: "Communication & Collaboration",
        description: "Slack is a channel-based messaging platform. With Slack, people can work together more effectively, connect all their software tools and services, and find the information they need to do their best work — all within a secure, enterprise-grade environment.",
        status: "connect"
    },
    {
        id: "twitter_custom",
        name: "Twitter",
        category: "custom_trigger",
        description: "Custom Twitter triggers",
        status: "connect"
    },
    {
        id: "fireflies",
        name: "Fireflies",
        category: "Specialized Tools",
        description: "Fireflies.ai helps your team transcribe, summarize, search, and analyze voice conversations.",
        status: "connect"
    },
    {
        id: "elevenlabs",
        name: "Elevenlabs",
        category: "Specialized Tools",
        description: "Create natural AI voices instantly in any language - perfect for video creators, developers, and businesses.",
        status: "connect"
    },
    {
        id: "metaads",
        name: "Metaads",
        category: "Marketing & Social Media",
        description: "Meta Ads API",
        status: "connect"
    },
    {
        id: "linear",
        name: "Linear",
        category: "Project Management & Productivity",
        description: "Linear is a streamlined issue tracking and project planning tool for modern teams, featuring fast workflows, keyboard shortcuts, and GitHub integrations",
        status: "connect"
    },
    {
        id: "linkedin",
        name: "Linkedin",
        category: "Marketing & Social Media",
        description: "LinkedIn is a professional networking platform enabling job seekers, companies, and thought leaders to connect, share content, and discover business opportunities",
        status: "connect"
    },
    {
        id: "notion",
        name: "Notion",
        category: "Project Management & Productivity",
        description: "Notion centralizes notes, docs, wikis, and tasks in a unified workspace, letting teams build custom workflows for collaboration and knowledge management",
        status: "connect"
    },
    {
        id: "gong",
        name: "Gong",
        category: "Specialized Tools",
        description: "Gong is a platform for video meetings, call recording, and team collaboration.",
        status: "connect"
    },
    {
        id: "cal",
        name: "Cal",
        category: "HR & People Operations",
        description: "Cal simplifies meeting coordination by providing shareable booking pages, calendar syncing, and availability management to streamline the scheduling process",
        status: "connect"
    },
    {
        id: "calendly",
        name: "Calendly",
        category: "HR & People Operations",
        description: "Calendly is an appointment scheduling tool that automates meeting invitations, availability checks, and reminders, helping individuals and teams avoid email back-and-forth",
        status: "connect"
    },
    {
        id: "attio",
        name: "Attio",
        category: "Sales & CRM",
        description: "Attio is a fully customizable workspace for your team's relationships and workflows.",
        status: "connect"
    },
    {
        id: "google_docs",
        name: "Google Docs",
        category: "Document & File Management",
        description: "Google Docs is a cloud-based word processor with real-time collaboration, version history, and integration with other Google Workspace apps",
        status: "connect"
    },
    {
        id: "google_ads",
        name: "Google Ads",
        category: "Marketing & Social Media",
        description: "Google Ads, is an online advertising platform developed by Google, where advertisers bid to display brief advertisements, service offerings, product listings, and videos to web users.",
        status: "connect"
    },
    {
        id: "reddit",
        name: "Reddit",
        category: "Marketing & Social Media",
        description: "Reddit is a social news platform with user-driven communities (subreddits), offering content sharing, discussions, and viral marketing opportunities for brands",
        status: "connect"
    },
    {
        id: "affinity",
        name: "Affinity",
        category: "Sales & CRM",
        description: "Affinity helps private capital investors to find, manage, and close more deals",
        status: "connect"
    },
    {
        id: "shopify",
        name: "Shopify",
        category: "Finance & Accounting",
        description: "Shopify is an e-commerce platform enabling merchants to create online stores, manage products, and process payments with themes, apps, and integrated marketing tools",
        status: "connect"
    },
    {
        id: "agencyzoom",
        name: "Agencyzoom",
        category: "HR & People Operations",
        description: "AgencyZoom is for the P&C insurance agent that's looking to increase sales, boost retention and analyze agency & producer performance.",
        status: "connect"
    },
    {
        id: "ahrefs",
        name: "Ahrefs",
        category: "Marketing & Social Media",
        description: "Ahrefs is an SEO and marketing platform offering site audits, keyword research, content analysis, and competitive insights to improve search rankings and drive organic traffic",
        status: "connect"
    },
    {
        id: "amplitude",
        name: "Amplitude",
        category: "Developer Tools & Infrastructure",
        description: "Amplitude Inc. is an American publicly trading company that develops digital analytics software.",
        status: "connect"
    },
    {
        id: "apollo",
        name: "Apollo",
        category: "Marketing & Social Media",
        description: "Apollo provides CRM and lead generation capabilities, helping businesses discover contacts, manage outreach, and track sales pipelines for consistent customer relationship development",
        status: "connect"
    },
    {
        id: "asana",
        name: "Asana",
        category: "Project Management & Productivity",
        description: "Tool to help teams organize, track, and manage their work.",
        status: "connect"
    },
    {
        id: "ashby",
        name: "Ashby",
        category: "HR & People Operations",
        description: "Ashby delivers an applicant tracking system for modern teams, offering features like job postings, candidate management, and data-driven hiring insights to streamline the recruitment process",
        status: "connect"
    },
    {
        id: "bamboohr",
        name: "Bamboohr",
        category: "HR & People Operations",
        description: "BambooHR is an American technology company that provides human resources software as a service.",
        status: "connect"
    },
    {
        id: "benchmark_email",
        name: "Benchmark email",
        category: "Marketing & Social Media",
        description: "Benchmark Email is a comprehensive email marketing platform offering tools for creating, sending, and analyzing email campaigns.",
        status: "connect"
    },
    {
        id: "better_stack",
        name: "Better stack",
        category: "Developer Tools & Infrastructure",
        description: "Better Stack provides monitoring, logging, and incident management solutions to help teams ensure the reliability and performance of their applications.",
        status: "connect"
    },
    {
        id: "bitbucket",
        name: "Bitbucket",
        category: "Developer Tools & Infrastructure",
        description: "Bitbucket is a Git-based code hosting and collaboration platform supporting private and public repositories, enabling teams to manage and review code through pull requests and integrations",
        status: "connect"
    },
    {
        id: "blackbaud",
        name: "Blackbaud",
        category: "Finance & Accounting",
        description: "Blackbaud offers cloud-based software for nonprofits, schools, and healthcare institutions, supporting fundraising, financial management, and donor engagement in mission-driven organizations",
        status: "connect"
    },
    {
        id: "borneo",
        name: "Borneo",
        category: "HR & People Operations",
        description: "Borneo is a data security and privacy platform designed for sensitive data discovery and remediation.",
        status: "connect"
    },
    {
        id: "box",
        name: "Box",
        category: "Document & File Management",
        description: "Cloud content management and file sharing service for businesses.",
        status: "connect"
    },
    {
        id: "brandfetch",
        name: "Brandfetch",
        category: "Marketing & Social Media",
        description: "Brandfetch offers an API that retrieves company logos, brand colors, and other visual assets, helping marketers and developers maintain consistent branding across apps",
        status: "connect"
    },
    {
        id: "discord",
        name: "Discord",
        category: "Communication & Collaboration",
        description: "An instant messaging and VoIP social platform.",
        status: "connect"
    },
    {
        id: "salesforce",
        name: "Salesforce",
        category: "Sales & CRM",
        description: "Salesforce is a leading CRM platform integrating sales, service, marketing, and analytics to build customer relationships and drive business growth",
        status: "connect"
    },
    {
        id: "builtwith",
        name: "Builtwith",
        category: "Marketing & Social Media",
        description: "BuiltWith is a web technology profiler that provides insights into the technologies used by websites, including analytics, hosting, and content management systems.",
        status: "connect"
    },
    {
        id: "canny",
        name: "Canny",
        category: "Project Management & Productivity",
        description: "Canny is a customer feedback management platform that helps teams collect, analyze, and prioritize user feedback to build better products.",
        status: "connect"
    },
    {
        id: "canvas",
        name: "Canvas",
        category: "Specialized Tools",
        description: "Canvas is a learning management system supporting online courses, assignments, grading, and collaboration, widely used by schools and universities for virtual classrooms",
        status: "connect"
    },
    {
        id: "capsule_crm",
        name: "Capsule crm",
        category: "Sales & CRM",
        description: "Capsule CRM is a simple yet powerful CRM platform designed to help businesses manage customer relationships, sales pipelines, and tasks efficiently.",
        status: "connect"
    },
    {
        id: "chatwork",
        name: "Chatwork",
        category: "Communication & Collaboration",
        description: "Chatwork is a team communication platform featuring group chats, file sharing, and task management, aiming to enhance collaboration and productivity for businesses",
        status: "connect"
    },
    {
        id: "clickup",
        name: "Clickup",
        category: "Project Management & Productivity",
        description: "ClickUp unifies tasks, docs, goals, and chat in a single platform, allowing teams to plan, organize, and collaborate across projects with customizable workflows",
        status: "connect"
    },
    {
        id: "clockify",
        name: "Clockify",
        category: "Project Management & Productivity",
        description: "Clockify is a free time tracking software that allows individuals and teams to track work hours across projects.",
        status: "connect"
    },
    {
        id: "close",
        name: "Close",
        category: "Sales & CRM",
        description: "Close is a CRM platform designed to help businesses manage and streamline their sales processes, including calling, email automation, and predictive dialers.",
        status: "connect"
    },
    {
        id: "coda",
        name: "Coda",
        category: "Project Management & Productivity",
        description: "Collaborative workspace platform that transforms documents into powerful tools for team productivity and project management",
        status: "connect"
    },
    {
        id: "confluence",
        name: "Confluence",
        category: "Project Management & Productivity",
        description: "A tool for team collaboration and knowledge management.",
        status: "connect"
    },
    {
        id: "contentful",
        name: "Contentful",
        category: "Developer Tools & Infrastructure",
        description: "Contentful is a headless CMS allowing developers to create, manage, and distribute content across multiple channels and devices with an API-first approach",
        status: "connect"
    },
    {
        id: "datadog",
        name: "Datadog",
        category: "Developer Tools & Infrastructure",
        description: "Datadog offers monitoring, observability, and security for cloud-scale applications, unifying metrics, logs, and traces to help teams detect issues and optimize performance",
        status: "connect"
    },
    {
        id: "dialpad",
        name: "Dialpad",
        category: "Communication & Collaboration",
        description: "Dialpad is a cloud-based business phone system and contact center platform that enables voice, video, messages and meetings across your existing devices",
        status: "connect"
    },
    {
        id: "digital_ocean",
        name: "Digital ocean",
        category: "Developer Tools & Infrastructure",
        description: "DigitalOcean is a cloud infrastructure provider offering scalable compute platforms with a user-friendly interface.",
        status: "connect"
    },
    {
        id: "dropbox",
        name: "Dropbox",
        category: "Document & File Management",
        description: "Dropbox is a cloud storage service offering file syncing, sharing, and collaboration across devices with version control and robust integrations",
        status: "connect"
    },
    {
        id: "dropbox_sign",
        name: "Dropbox sign",
        category: "Document & File Management",
        description: "Dropbox Sign (formerly HelloSign) offers electronic signature and document workflow solutions, simplifying how businesses collect legally binding signatures online",
        status: "connect"
    },
    {
        id: "dynamics365",
        name: "Dynamics365",
        category: "HR & People Operations",
        description: "Dynamics 365 from Microsoft combines CRM, ERP, and productivity apps to streamline sales, marketing, customer service, and operations in one integrated platform",
        status: "connect"
    },
    {
        id: "brex",
        name: "Brex",
        category: "Finance & Accounting",
        description: "Brex provides corporate credit cards, spend management, and financial tools tailored for startups and tech businesses to optimize cash flow, accounting, and growth",
        status: "connect"
    },
    {
        id: "excel",
        name: "Excel",
        category: "Document & File Management",
        description: "Microsoft Excel is a powerful spreadsheet application for data analysis, calculations, and visualization, enabling users to organize and process data with formulas, charts, and pivot tables",
        status: "connect"
    },
    {
        id: "facebook",
        name: "Facebook",
        category: "Marketing & Social Media",
        description: "Facebook is a social media and advertising platform used by individuals and businesses to connect, share content, and promote products or services. Only supports Facebook Pages, not Facebook Personal accounts.",
        status: "connect"
    },
    {
        id: "figma",
        name: "Figma",
        category: "Developer Tools & Infrastructure",
        description: "A collaborative interface design tool.",
        status: "connect"
    },
    {
        id: "folk",
        name: "Folk",
        category: "Sales & CRM",
        description: "folk is a next-generation CRM designed for teams to manage and nurture their relationships efficiently.",
        status: "connect"
    },
    {
        id: "formsite",
        name: "Formsite",
        category: "Document & File Management",
        description: "Formsite helps users create online forms and surveys with drag-and-drop tools, secure data capture, and integrations to simplify workflows",
        status: "connect"
    },
    {
        id: "freshbooks",
        name: "Freshbooks",
        category: "Finance & Accounting",
        description: "FreshBooks is a cloud-based accounting software service designed for small and medium-sized businesses, offering features like invoicing, expense tracking, and time management.",
        status: "connect"
    },
    {
        id: "freshdesk",
        name: "Freshdesk",
        category: "Sales & CRM",
        description: "Freshdesk provides customer support software with ticketing, knowledge base, and automation features for efficient helpdesk operations and better customer experiences",
        status: "connect"
    },
    {
        id: "freshservice",
        name: "Freshservice",
        category: "Sales & CRM",
        description: "Freshservice is a cloud-based IT service management (ITSM) solution with incident management, asset management, and IT service automation capabilities",
        status: "connect"
    },
    {
        id: "gitlab",
        name: "Gitlab",
        category: "Developer Tools & Infrastructure",
        description: "A web-based DevOps lifecycle tool that provides a Git repository manager providing wiki, issue-tracking, and CI/CD pipeline features.",
        status: "connect"
    },
    {
        id: "google_analytics",
        name: "Google Analytics",
        category: "Developer Tools & Infrastructure",
        description: "Google Analytics tracks and reports website traffic, user behavior, and conversion data, enabling marketers to optimize online performance and customer journeys",
        status: "connect"
    },
    {
        id: "gorgias",
        name: "Gorgias",
        category: "Sales & CRM",
        description: "Gorgias is a helpdesk and live chat platform specializing in e-commerce, offering automated support, order management, and unified customer communication",
        status: "connect"
    },
    {
        id: "google_classroom",
        name: "Google Classroom",
        category: "Document & File Management",
        description: "Google Classroom is a free web service developed by Google for schools that aims to simplify creating, distributing, and grading assignments",
        status: "connect"
    },
    {
        id: "google_tasks",
        name: "Google Tasks",
        category: "Document & File Management",
        description: "Google Tasks provides a simple to-do list and task management system integrated into Gmail and Google Calendar for quick and easy tracking",
        status: "connect"
    },
    {
        id: "gosquared",
        name: "Gosquared",
        category: "Marketing & Social Media",
        description: "GoSquared provides real-time web analytics and customer engagement tools to help businesses understand and interact with their website visitors.",
        status: "connect"
    },
    {
        id: "gumroad",
        name: "Gumroad",
        category: "Finance & Accounting",
        description: "Gumroad simplifies selling digital goods, physical products, and memberships by offering a streamlined checkout, marketing tools, and direct payout options",
        status: "connect"
    },
    {
        id: "harvest",
        name: "Harvest",
        category: "Project Management & Productivity",
        description: "Harvest is a time-tracking and invoicing tool designed for teams and freelancers, helping them log billable hours, manage projects, and streamline payments",
        status: "connect"
    },
    {
        id: "google_maps",
        name: "Google Maps",
        category: "Document & File Management",
        description: "Integrate Google Maps to access location data, geocoding, directions, and mapping services in your application.",
        status: "connect"
    },
    {
        id: "heyreach",
        name: "Heyreach",
        category: "Marketing & Social Media",
        description: "HeyReach is a multichannel outreach platform designed to help businesses and professionals engage with their audience effectively.",
        status: "connect"
    },
    {
        id: "hubspot",
        name: "Hubspot",
        category: "Sales & CRM",
        description: "HubSpot is an inbound marketing, sales, and customer service platform integrating CRM, email automation, and analytics to facilitate lead nurturing and seamless customer experiences",
        status: "connect"
    },
    {
        id: "hunter",
        name: "Hunter",
        category: "Marketing & Social Media",
        description: "Hunter is an email marketing company specializing in lead generation and data enrichment.",
        status: "connect"
    },
    {
        id: "insighto_ai",
        name: "Insighto ai",
        category: "Sales & CRM",
        description: "Insighto.ai is an AI-powered communication platform that enables businesses to create and deploy conversational AI chatbots and voice agents for enhanced customer engagement across multiple channels.",
        status: "connect"
    },
    {
        id: "instantly",
        name: "Instantly",
        category: "Marketing & Social Media",
        description: "Instantly is a platform designed to streamline cold email outreach by automating campaigns, managing leads, and enhancing email deliverability.",
        status: "connect"
    },
    {
        id: "intercom",
        name: "Intercom",
        category: "Sales & CRM",
        description: "Intercom provides live chat, messaging, and customer engagement tools, enabling businesses to drive conversions, handle support, and personalize communication at scale",
        status: "connect"
    },
    {
        id: "jotform",
        name: "Jotform",
        category: "Document & File Management",
        description: "Jotform is an online form builder that allows users to create and manage forms for various purposes, including data collection, surveys, and more.",
        status: "connect"
    },
    {
        id: "kibana",
        name: "Kibana",
        category: "Developer Tools & Infrastructure",
        description: "Kibana is a visualization and analytics platform for Elasticsearch, offering dashboards, data exploration, and monitoring capabilities for gaining insights from data",
        status: "connect"
    },
    {
        id: "kit",
        name: "Kit",
        category: "Specialized Tools",
        description: "Kit is a platform that allows creators to automate tasks and developers to build apps for the Kit App Store.",
        status: "connect"
    },
    {
        id: "klaviyo",
        name: "Klaviyo",
        category: "Marketing & Social Media",
        description: "Klaviyo is a data-driven email and SMS marketing platform that allows e-commerce brands to deliver targeted messages, track conversions, and scale customer relationships",
        status: "connect"
    },
    {
        id: "lemlist",
        name: "Lemlist",
        category: "Marketing & Social Media",
        description: "lemlist is a prospecting tool that automates multichannel outreach, enabling users to find leads with valid contact information and reach them across email, LinkedIn, or calls with personalized messages.",
        status: "connect"
    },
    {
        id: "lever",
        name: "Lever",
        category: "HR & People Operations",
        description: "Lever is an applicant tracking system combining sourcing, CRM functionalities, and analytics, helping companies scale recruiting efforts with a collaborative approach",
        status: "connect"
    },
    {
        id: "lodgify",
        name: "Lodgify",
        category: "Specialized Tools",
        description: "Lodgify is an all-in-one vacation rental software that enables property owners and managers to create bookable websites, synchronize property data across multiple channels, and manage guest reservations and communications from a single platform.",
        status: "connect"
    },
    {
        id: "mailcoach",
        name: "Mailcoach",
        category: "Marketing & Social Media",
        description: "Mailcoach is an email marketing platform that allows users to manage email campaigns and subscriber lists efficiently.",
        status: "connect"
    },
    {
        id: "mailerlite",
        name: "Mailerlite",
        category: "Marketing & Social Media",
        description: "MailerLite is an email marketing service that offers tools for creating and managing email campaigns, automating workflows, and building landing pages.",
        status: "connect"
    },
    {
        id: "mapbox",
        name: "Mapbox",
        category: "Specialized Tools",
        description: "Mapbox is a platform that provides mapping, navigation, and location data services for developers to integrate into their applications.",
        status: "connect"
    },
    {
        id: "heygen",
        name: "Heygen",
        category: "Marketing & Social Media",
        description: "HeyGen is an innovative video platform that harnesses the power of generative AI to streamline your video creation process",
        status: "connect"
    },
    {
        id: "miro",
        name: "Miro",
        category: "Project Management & Productivity",
        description: "Miro is a collaborative online whiteboard enabling teams to brainstorm ideas, design wireframes, plan workflows, and manage projects visually",
        status: "connect"
    },
    {
        id: "mixpanel",
        name: "Mixpanel",
        category: "Developer Tools & Infrastructure",
        description: "Mixpanel is a product analytics platform tracking user interactions and engagement, providing cohort analysis, funnels, and A/B testing to improve user experiences",
        status: "connect"
    },
    {
        id: "monday",
        name: "Monday",
        category: "Project Management & Productivity",
        description: "monday.com is a customizable work management platform for project planning, collaboration, and automation, supporting agile, sales, marketing, and more",
        status: "connect"
    },
    {
        id: "moneybird",
        name: "Moneybird",
        category: "Finance & Accounting",
        description: "Moneybird is an online invoicing and accounting platform designed for small businesses and freelancers, offering features like invoicing, expense tracking, and financial reporting.",
        status: "connect"
    },
    {
        id: "moz",
        name: "Moz",
        category: "Marketing & Social Media",
        description: "Moz is an SEO software suite providing keyword research, site audits, rank tracking, and competitive insights to boost organic search visibility",
        status: "connect"
    },
    {
        id: "new_relic",
        name: "New relic",
        category: "Developer Tools & Infrastructure",
        description: "New Relic is a comprehensive observability platform that helps developers and operations teams monitor, debug, and improve their entire stack, including applications, infrastructure, and customer experience.",
        status: "connect"
    },
    {
        id: "omnisend",
        name: "Omnisend",
        category: "Marketing & Social Media",
        description: "Omnisend is a marketing automation platform for ecommerce businesses, focusing on email and SMS marketing.",
        status: "connect"
    },
    {
        id: "open_sea",
        name: "Open sea",
        category: "Specialized Tools",
        description: "OpenSea is the world's first and largest NFT marketplace for NFTs and crypto collectibles.",
        status: "connect"
    },
    {
        id: "outlook",
        name: "Outlook",
        category: "Communication & Collaboration",
        description: "Outlook is Microsoft's email and calendaring platform integrating contacts and scheduling, enabling users to manage communications and events in a unified workspace",
        status: "connect"
    },
    {
        id: "pagerduty",
        name: "Pagerduty",
        category: "Developer Tools & Infrastructure",
        description: "Integrate PagerDuty to manage incidents, schedules, and alerts directly from your application.",
        status: "connect"
    },
    {
        id: "pingdom",
        name: "Pingdom",
        category: "Developer Tools & Infrastructure",
        description: "Pingdom is a web performance monitoring service that allows users to monitor the uptime and performance of websites, servers, and applications.",
        status: "connect"
    },
    {
        id: "pipedrive",
        name: "Pipedrive",
        category: "Sales & CRM",
        description: "Pipedrive is a sales management tool built around pipeline visualization, lead tracking, activity reminders, and automation to keep deals progressing",
        status: "connect"
    },
    {
        id: "pipeline_crm",
        name: "Pipeline crm",
        category: "Sales & CRM",
        description: "Pipeline CRM is a sales-focused customer relationship management tool designed to help teams track leads, manage deals, and streamline workflows.",
        status: "connect"
    },
    {
        id: "polygon",
        name: "Polygon",
        category: "Specialized Tools",
        description: "Polygon.io provides real-time and historical market data APIs for stocks, options, forex, and cryptocurrencies.",
        status: "connect"
    },
    {
        id: "postgrid",
        name: "Postgrid",
        category: "Specialized Tools",
        description: "PostGrid provides APIs for automating direct mail and address verification services, enabling businesses to send letters, postcards, and checks, as well as verify and standardize addresses in real-time.",
        status: "connect"
    },
    {
        id: "posthog",
        name: "Posthog",
        category: "Developer Tools & Infrastructure",
        description: "PostHog is an open-source product analytics platform tracking user interactions and behaviors to help teams refine features, improve funnels, and reduce churn",
        status: "connect"
    },
    {
        id: "postmark",
        name: "Postmark",
        category: "Specialized Tools",
        description: "Postmark is an email delivery service that enables developers to send transactional emails with high deliverability and detailed analytics.",
        status: "connect"
    },
    {
        id: "microsoft_teams",
        name: "Microsoft teams",
        category: "Communication & Collaboration",
        description: "Microsoft Teams integrates chat, video meetings, and file storage within Microsoft 365, providing virtual collaboration and communication for distributed teams",
        status: "connect"
    },
    {
        id: "pushbullet",
        name: "Pushbullet",
        category: "Communication & Collaboration",
        description: "Pushbullet enables seamless sharing of notifications and files across devices.",
        status: "connect"
    },
    {
        id: "quickbooks",
        name: "Quickbooks",
        category: "Finance & Accounting",
        description: "Quickbooks is a cloud-based accounting software that helps you manage your finances, track your income and expenses, and get insights into your business",
        status: "connect"
    },
    {
        id: "recallai",
        name: "Recallai",
        category: "Specialized Tools",
        description: "The universal API for meeting bots & conversation data.",
        status: "connect"
    },
    {
        id: "recruitee",
        name: "Recruitee",
        category: "HR & People Operations",
        description: "Recruitee is a collaborative hiring software that streamlines recruitment processes, enabling teams to source, interview, and hire candidates efficiently.",
        status: "connect"
    },
    {
        id: "refiner",
        name: "Refiner",
        category: "Marketing & Social Media",
        description: "Refiner is a customer feedback and survey tool designed to help businesses collect and analyze user insights.",
        status: "connect"
    },
    {
        id: "remarkety",
        name: "Remarkety",
        category: "Marketing & Social Media",
        description: "Remarkety is an AI-powered marketing automation platform designed for eCommerce, enabling personalized email, SMS, and social campaigns based on customer behavior.",
        status: "connect"
    },
    {
        id: "reply",
        name: "Reply",
        category: "Sales & CRM",
        description: "Reply.io is a sales engagement platform that automates multichannel outreach, enabling users to create and manage email campaigns, track replies, and monitor performance directly within their platform.",
        status: "connect"
    },
    {
        id: "resend",
        name: "Resend",
        category: "Specialized Tools",
        description: "The universal API for sending emails.",
        status: "connect"
    },
    {
        id: "respond_io",
        name: "Respond io",
        category: "Communication & Collaboration",
        description: "AI-powered customer conversation management software.",
        status: "connect"
    },
    {
        id: "retellai",
        name: "Retellai",
        category: "Specialized Tools",
        description: "RetellAI captures calls and transcripts, enabling businesses to analyze conversations, extract insights, and enhance customer interactions in one centralized platform",
        status: "connect"
    },
    {
        id: "rocketlane",
        name: "Rocketlane",
        category: "Project Management & Productivity",
        description: "Collaborative customer onboarding and implementation platform for professional services teams.",
        status: "connect"
    },
    {
        id: "safetyculture",
        name: "Safetyculture",
        category: "Project Management & Productivity",
        description: "SafetyCulture is a platform that empowers teams to improve workplace safety, quality, and efficiency through digital inspections and audits.",
        status: "connect"
    },
    {
        id: "salesmate",
        name: "Salesmate",
        category: "Sales & CRM",
        description: "Salesmate is an AI-powered CRM platform designed to help businesses engage leads, close deals faster, nurture relationships, and provide seamless support through a unified, intuitive interface.",
        status: "connect"
    },
    {
        id: "semrush",
        name: "Semrush",
        category: "Marketing & Social Media",
        description: "Semrush is a popular SEO tool suite that specializes in keyword research, competitor analysis, and Google Ad campaign optimization.",
        status: "connect"
    },
    {
        id: "sendbird",
        name: "Sendbird",
        category: "Communication & Collaboration",
        description: "Sendbird is a platform that provides chat, voice, and video APIs to help businesses build in-app communication features.",
        status: "connect"
    },
    {
        id: "sendgrid",
        name: "Sendgrid",
        category: "Marketing & Social Media",
        description: "SendGrid is a cloud-based email delivery platform providing transactional and marketing email services, with APIs for integration, analytics, and scalability",
        status: "connect"
    },
    {
        id: "sendlane",
        name: "Sendlane",
        category: "Marketing & Social Media",
        description: "Sendlane is a cloud-based marketing automation platform that helps eCommerce businesses engage customers through personalized email and SMS campaigns.",
        status: "connect"
    },
    {
        id: "sendloop",
        name: "Sendloop",
        category: "Marketing & Social Media",
        description: "Sendloop is an all-in-one email marketing solution for SaaS, e-commerce, application, and small business owners.",
        status: "connect"
    },
    {
        id: "sentry",
        name: "Sentry",
        category: "Developer Tools & Infrastructure",
        description: "Integrate Sentry to manage your error tracking and monitoring.",
        status: "connect"
    },
    {
        id: "productboard",
        name: "Productboard",
        category: "Project Management & Productivity",
        description: "Productboard is a product management platform that gathers feedback, prioritizes features, and aligns roadmaps based on customer insights and strategic goals",
        status: "connect"
    },
    {
        id: "share_point",
        name: "Share point",
        category: "Document & File Management",
        description: "SharePoint is a Microsoft platform for document management and intranets, enabling teams to collaborate, store, and organize content securely and effectively",
        status: "connect"
    },
    {
        id: "shortcut",
        name: "Shortcut",
        category: "Project Management & Productivity",
        description: "Shortcut aligns product development work with company objectives so teams can execute with a shared purpose.",
        status: "connect"
    },
    {
        id: "slackbot",
        name: "Slackbot",
        category: "Communication & Collaboration",
        description: "Slackbot automates responses and reminders within Slack, assisting with tasks like onboarding, FAQs, and notifications to streamline team productivity",
        status: "connect"
    },
    {
        id: "snowflake",
        name: "Snowflake",
        category: "Developer Tools & Infrastructure",
        description: "Snowflake is a cloud-based data warehouse offering elastic scaling, secure data sharing, and SQL analytics across multiple cloud environments",
        status: "connect"
    },
    {
        id: "square",
        name: "Square",
        category: "Finance & Accounting",
        description: "Square provides payment processing, POS systems, invoicing, and e-commerce tools, enabling sellers to accept card payments and manage their business",
        status: "connect"
    },
    {
        id: "strava",
        name: "Strava",
        category: "Specialized Tools",
        description: "Strava is a social fitness network and app designed for cyclists and runners.",
        status: "connect"
    },
    {
        id: "stripe",
        name: "Stripe",
        category: "Developer Tools & Infrastructure",
        description: "Stripe offers online payment infrastructure, fraud prevention, and APIs enabling businesses to accept and manage payments globally",
        status: "connect"
    },
    {
        id: "supabase",
        name: "Supabase",
        category: "Developer Tools & Infrastructure",
        description: "Supabase is an open-source backend-as-a-service providing a Postgres database, authentication, storage, and real-time subscription APIs for building modern applications",
        status: "connect"
    },
    {
        id: "survey_monkey",
        name: "Survey monkey",
        category: "Document & File Management",
        description: "SurveyMonkey is an online survey development platform that enables users to create, distribute, and analyze surveys for various purposes.",
        status: "connect"
    },
    {
        id: "tally",
        name: "Tally",
        category: "Document & File Management",
        description: "Tally is a form-building platform that allows users to create forms, collect responses, and integrate with various tools and services.",
        status: "connect"
    },
    {
        id: "telnyx",
        name: "Telnyx",
        category: "Specialized Tools",
        description: "Telnyx is a communications platform offering voice, messaging, and data services through a global private network.",
        status: "connect"
    },
    {
        id: "ticketmaster",
        name: "Ticketmaster",
        category: "Specialized Tools",
        description: "Ticketmaster provides APIs for event discovery, inventory management, and ticketing solutions.",
        status: "connect"
    },
    {
        id: "ticktick",
        name: "Ticktick",
        category: "Project Management & Productivity",
        description: "TickTick is a cross-platform task management and to-do list application designed to help users organize their tasks and schedules efficiently.",
        status: "connect"
    },
    {
        id: "tiktok",
        name: "Tiktok",
        category: "Marketing & Social Media",
        description: "TikTok short-form video platform + creation tools + social sharing",
        status: "connect"
    },
    {
        id: "timecamp",
        name: "Timecamp",
        category: "Project Management & Productivity",
        description: "TimeCamp is a time tracking solution designed to help businesses of all sizes track time for projects to maximize their profits.",
        status: "connect"
    },
    {
        id: "timely",
        name: "Timely",
        category: "Project Management & Productivity",
        description: "Timely is an automatic time-tracking platform capturing activity across applications, calendars, and devices, creating detailed timesheets for billing or productivity insights",
        status: "connect"
    },
    {
        id: "todoist",
        name: "Todoist",
        category: "Project Management & Productivity",
        description: "Todoist is a task management tool allowing users to create to-do lists, set deadlines, and collaborate on projects with reminders and cross-platform syncing",
        status: "connect"
    },
    {
        id: "trello",
        name: "Trello",
        category: "Project Management & Productivity",
        description: "A web-based, kanban-style, list-making application.",
        status: "connect"
    },
    {
        id: "uptimerobot",
        name: "Uptimerobot",
        category: "Developer Tools & Infrastructure",
        description: "UptimeRobot is a service that monitors the uptime and performance of websites, applications, and services, providing real-time alerts and detailed logs.",
        status: "connect"
    },
    {
        id: "servicenow",
        name: "Servicenow",
        category: "Sales & CRM",
        description: "Servicenow provides IT Service Management Transform service management to boost productivity and maximize ROI",
        status: "connect"
    },
    {
        id: "whatsapp",
        name: "Whatsapp",
        category: "Communication & Collaboration",
        description: "Enables interaction with customers through the WhatsApp Business API for messaging and automation. Only supports WhatsApp Business accounts, not WhatsApp Personal accounts.",
        status: "connect"
    },
    {
        id: "workable",
        name: "Workable",
        category: "HR & People Operations",
        description: "Workable is an all-in-one HR software platform that streamlines hiring, employee data management, time tracking, and payroll.",
        status: "connect"
    },
    {
        id: "wrike",
        name: "Wrike",
        category: "Project Management & Productivity",
        description: "Wrike is a project management and collaboration tool offering customizable workflows, Gantt charts, reporting, and resource management to boost team productivity",
        status: "connect"
    },
    {
        id: "xero",
        name: "Xero",
        category: "Finance & Accounting",
        description: "Xero is a cloud-based accounting software for small businesses, providing invoicing, bank reconciliation, bookkeeping, and financial reporting in real time",
        status: "connect"
    },
    {
        id: "zendesk",
        name: "Zendesk",
        category: "Sales & CRM",
        description: "Zendesk provides customer support software with ticketing, live chat, and knowledge base features, enabling efficient helpdesk operations and customer engagement",
        status: "connect"
    },
    {
        id: "zoho",
        name: "Zoho",
        category: "Sales & CRM",
        description: "Zoho is a suite of cloud applications including CRM, email marketing, and collaboration tools, enabling businesses to automate and scale operations",
        status: "connect"
    },
    {
        id: "zoho_bigin",
        name: "Zoho bigin",
        category: "Sales & CRM",
        description: "Zoho Bigin is a simplified CRM solution from Zoho tailored for small businesses, focusing on pipeline tracking and relationship management",
        status: "connect"
    },
    {
        id: "zoho_books",
        name: "Zoho books",
        category: "Finance & Accounting",
        description: "Zoho Books handles accounting, invoicing, and expense tracking, offering real-time collaboration and integrations within the Zoho ecosystem",
        status: "connect"
    },
    {
        id: "zoho_inventory",
        name: "Zoho inventory",
        category: "Finance & Accounting",
        description: "Zoho Inventory helps businesses track stock, manage orders, and sync inventory across multiple sales channels, streamlining supply chain operations",
        status: "connect"
    },
    {
        id: "zoho_invoice",
        name: "Zoho invoice",
        category: "Finance & Accounting",
        description: "Zoho Invoice simplifies billing, recurring payments, and expense management, helping freelancers and small businesses send professional invoices",
        status: "connect"
    },
    {
        id: "zoho_mail",
        name: "Zoho mail",
        category: "Communication & Collaboration",
        description: "Zoho Mail is a secure and ad-free email hosting platform with collaboration tools, calendar integration, and extensive administrative controls",
        status: "connect"
    },
    {
        id: "zoom",
        name: "Zoom",
        category: "Communication & Collaboration",
        description: "Zoom is a video conferencing and online meeting platform featuring breakout rooms, screen sharing, and integrations with various enterprise tools",
        status: "connect"
    },
    {
        id: "zoominfo",
        name: "Zoominfo",
        category: "Sales & CRM",
        description: "AgencyZoom is for the P&C insurance agent that's looking to increase sales, boost retention and analyze agency & producer performance.",
        status: "connect"
    },
    {
        id: "brevo",
        name: "Brevo",
        category: "Marketing & Social Media",
        description: "Brevo (formerly Sendinblue) is an all-in-one email and SMS marketing platform that provides transactional messaging, marketing automation, contact management, and CRM tools to help businesses communicate and engage with their customers.",
        status: "connect"
    },
    {
        id: "webex",
        name: "Webex",
        category: "Communication & Collaboration",
        description: "Webex is a Cisco-powered video conferencing and collaboration platform offering online meetings, webinars, screen sharing, and team messaging",
        status: "connect"
    },
    {
        id: "microsoft_clarity",
        name: "Microsoft clarity",
        category: "Developer Tools & Infrastructure",
        description: "Microsoft Clarity is a free user behavior analytics tool that captures heatmaps, session recordings, and engagement metrics to help improve website experiences",
        status: "connect"
    },
    {
        id: "one_drive",
        name: "One drive",
        category: "Document & File Management",
        description: "OneDrive is Microsoft’s cloud storage solution enabling users to store, sync, and share files across devices, offering offline access, real-time collaboration, and enterprise-grade security",
        status: "connect"
    },
    {
        id: "prisma",
        name: "Prisma",
        category: "Developer Tools & Infrastructure",
        description: "Prisma Data Platform provides database tools including Accelerate (global database cache), Optimize (AI-driven query analysis), and Prisma Postgres (managed PostgreSQL). Manage workspaces, projects, environments, and API keys programmatically.",
        status: "connect"
    }
];
