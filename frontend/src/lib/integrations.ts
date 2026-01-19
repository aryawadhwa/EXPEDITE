

export interface Integration {
    id: string;
    name: string;
    category: string;
    description: string;
    connected: boolean;
    logo: string;
}

export const integrations: Integration[] = [
    // Communication & Collaboration
    { id: "gmail", name: "Gmail", category: "Communication", description: "Send and receive emails", connected: false, logo: "https://cdn.simpleicons.org/gmail" },
    { id: "slack", name: "Slack", category: "Communication", description: "Send messages to channels", connected: false, logo: "https://cdn.simpleicons.org/slack" },
    { id: "discord", name: "Discord", category: "Communication", description: "Post to Discord servers", connected: false, logo: "https://cdn.simpleicons.org/discord" },
    { id: "telegram", name: "Telegram", category: "Communication", description: "Telegram bot integration", connected: false, logo: "https://cdn.simpleicons.org/telegram" },

    // Project Management
    { id: "jira", name: "Jira", category: "Project Management", description: "Manage Jira issues", connected: false, logo: "https://cdn.simpleicons.org/jira" },
    { id: "trello", name: "Trello", category: "Project Management", description: "Manage Trello cards", connected: false, logo: "https://cdn.simpleicons.org/trello" },
    { id: "notion", name: "Notion", category: "Project Management", description: "Access Notion pages", connected: false, logo: "https://cdn.simpleicons.org/notion" },
    { id: "asana", name: "Asana", category: "Project Management", description: "Manage Asana tasks", connected: false, logo: "https://cdn.simpleicons.org/asana" },

    // Developer Tools
    { id: "github", name: "GitHub", category: "Developer Tools", description: "Interact with repositories & issues", connected: false, logo: "https://cdn.simpleicons.org/github/white" },
    { id: "gitlab", name: "GitLab", category: "Developer Tools", description: "GitLab CI/CD and repos", connected: false, logo: "https://cdn.simpleicons.org/gitlab" },
    { id: "linear", name: "Linear", category: "Developer Tools", description: "Linear issue tracking", connected: false, logo: "https://cdn.simpleicons.org/linear" },

    // CRM & Sales
    { id: "hubspot", name: "HubSpot", category: "CRM", description: "Manage CRM contacts", connected: false, logo: "https://cdn.simpleicons.org/hubspot" },
    { id: "salesforce", name: "Salesforce", category: "CRM", description: "Salesforce integration", connected: false, logo: "https://cdn.simpleicons.org/salesforce" },
    { id: "pipedrive", name: "Pipedrive", category: "CRM", description: "Pipedrive sales pipeline", connected: false, logo: "https://cdn.simpleicons.org/pipedrive" },

    // Marketing
    { id: "twitter", name: "Twitter", category: "Social", description: "Post tweets & analyze", connected: false, logo: "https://cdn.simpleicons.org/x" },
    { id: "linkedin", name: "LinkedIn", category: "Social", description: "Professional network updates", connected: false, logo: "https://cdn.simpleicons.org/linkedin" },
    { id: "mailchimp", name: "Mailchimp", category: "Marketing", description: "Email marketing automation", connected: false, logo: "https://cdn.simpleicons.org/mailchimp" },

    // Storage & Files
    { id: "googledrive", name: "Google Drive", category: "Storage", description: "Access files and docs", connected: false, logo: "https://cdn.simpleicons.org/googledrive" },
    { id: "dropbox", name: "Dropbox", category: "Storage", description: "File storage and sharing", connected: false, logo: "https://cdn.simpleicons.org/dropbox" },
    { id: "onedrive", name: "OneDrive", category: "Storage", description: "Microsoft cloud storage", connected: false, logo: "https://cdn.simpleicons.org/onedrive" },

    // Search & Intelligence
    { id: "exa", name: "Exa Search", category: "Intelligence", description: "Neural search for AI", connected: false, logo: "https://www.google.com/s2/favicons?domain=exa.ai&sz=128" },
    { id: "google_search", name: "Google Search", category: "Intelligence", description: "Web search capabilities", connected: false, logo: "https://cdn.simpleicons.org/google" },
];
