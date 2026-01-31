import { useAuth } from "@clerk/clerk-react";
import { useMemo, useCallback } from "react";

const API_BASE_URL = "http://localhost:8000/api/v1";

interface Attachment {
  asset_id: string;
  filename: string;
  content_type?: string;
}

interface Agent {
  id?: string;
  _id?: string;
  name: string;
  role: string;
  capabilities: string[];
  system_prompt?: string;
  status: "active" | "inactive" | "training";
}

export interface Mission {
    id?: string;
    _id?: string;
    objective: string;
    status: string;
    created_at: string;
    prospects_count?: number;
    drafts_count?: number;
}

interface MissionLog {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  type: "success" | "error" | "thinking" | "info";
  metadata?: Record<string, unknown>;
}

export function useApi() {
    const { getToken } = useAuth();
    
    // Stable fetch wrapper
    const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = await getToken();
        // ... implementation
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        };
        return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    }, [getToken]);

    return useMemo(() => ({
        // Generic GET method
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get: async <T = any>(url: string): Promise<T> => {
            const res = await fetchWithAuth(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        },

        // User
        getUser: async () => {
            const res = await fetchWithAuth("/users/me");
            return res.json();
        },

        // Missions
        createMission: async (objective: string, attachments: Attachment[] = [], autonomous: boolean = false) => {
            const res = await fetchWithAuth("/missions/", {
                method: "POST",
                body: JSON.stringify({ objective, attachments, autonomous }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Failed to create mission');
            }
            return res.json();
        },

        listMissions: async (): Promise<Mission[]> => {
            const res = await fetchWithAuth("/missions/");
            if (!res.ok) throw new Error('Failed to fetch missions');
            return res.json();
        },

        getMissionLogs: async (missionId: string): Promise<MissionLog[]> => {
            const res = await fetchWithAuth(`/missions/${missionId}/logs`);
            if (!res.ok) throw new Error('Failed to fetch mission logs');
            return res.json();
        },

        chatWithMission: async (missionId: string, message: string) => {
            const res = await fetchWithAuth(`/missions/${missionId}/chat`, {
                method: "POST",
                body: JSON.stringify({ message }),
            });
            if (!res.ok) throw new Error('Failed to send message');
            return res.json();
        },

        deleteMission: async (missionId: string) => {
            const res = await fetchWithAuth(`/missions/${missionId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error('Failed to delete mission');
            return res.json();
        },

        stopMission: async (missionId: string) => {
            const res = await fetchWithAuth(`/missions/${missionId}/stop`, {
                method: "PATCH",
            });
            if (!res.ok) throw new Error('Failed to stop mission');
            return res.json();
        },

        // Reviews
        getPendingDrafts: async (missionId?: string) => {
            const params = missionId ? `?mission_id=${missionId}` : '';
            const res = await fetchWithAuth(`/reviews/pending${params}`);
            if (!res.ok) throw new Error('Failed to fetch pending drafts');
            return res.json();
        },

        clearAllDrafts: async () => {
            const res = await fetchWithAuth("/reviews/pending", {
                method: "DELETE",
            });
            if (!res.ok) throw new Error('Failed to clear drafts');
            return res.json();
        },

        approveDraft: async (id: string, subject?: string, body?: string) => {
            const params = new URLSearchParams();
            if (subject) params.append("subject", subject);
            if (body) params.append("body", body);
            const res = await fetchWithAuth(`/reviews/${id}/approve?${params}`, {
                method: "POST",
            });
            return res.json();
        },

        rejectDraft: async (id: string, feedback: string) => {
            const res = await fetchWithAuth(`/reviews/${id}/reject?feedback=${encodeURIComponent(feedback)}`, {
                method: "POST",
            });
            if (!res.ok) throw new Error('Failed to reject draft');
            return res.json();
        },

        regenerateDraft: async (id: string) => {
            const res = await fetchWithAuth(`/reviews/${id}/regenerate`, {
                method: "POST",
            });
            if (!res.ok) throw new Error('Failed to regenerate draft');
            return res.json();
        },

        // Attachment management for drafts
        getAvailableAssets: async (draftId: string) => {
            const res = await fetchWithAuth(`/reviews/${draftId}/available-assets`);
            if (!res.ok) throw new Error('Failed to get assets');
            return res.json();
        },

        updateDraftAttachments: async (draftId: string, assetIds: string[]) => {
            const res = await fetchWithAuth(`/reviews/${draftId}/attachments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ asset_ids: assetIds }),
            });
            if (!res.ok) throw new Error('Failed to update attachments');
            return res.json();
        },

        // Integrations
        connectTool: async (tool: string, params?: Record<string, string>) => {
            const res = await fetchWithAuth("/integrations/connect", {
                method: "POST",
                body: JSON.stringify({ tool, params }),
            });
            // Handle error status by throwing, so it can be caught
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Connect failed");
            }
            return res.json();
        },

        getIntegrations: async () => {
            const res = await fetchWithAuth("/integrations/");
            if (!res.ok) throw new Error('Failed to fetch integrations');
            return res.json();
        },

        disconnectTool: async (tool: string) => {
            const res = await fetchWithAuth(`/integrations/${tool}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error('Failed to disconnect tool');
            return res.json();
        },

        getToolStatus: async (tool: string) => {
            const res = await fetchWithAuth(`/integrations/${tool}/status`);
            if (!res.ok) return { status: "INACTIVE" };
            return res.json();
        },

        // Execute pending action after OAuth callback
        executePendingAction: async (actionId: string) => {
            const res = await fetchWithAuth(`/missions/pending-action/${actionId}/execute`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to execute pending action");
            }
            return res.json();
        },

        // Agents
        getAgents: async (): Promise<Agent[]> => {
            const res = await fetchWithAuth("/agents/");
            if (!res.ok) throw new Error('Failed to fetch agents');
            return res.json();
        },

        createAgent: async (agent: Agent) => {
            const res = await fetchWithAuth("/agents/", {
                method: "POST",
                body: JSON.stringify(agent),
            });
            if (!res.ok) throw new Error('Failed to create agent');
            return res.json();
        },

        getAgent: async (id: string) => {
            const res = await fetchWithAuth(`/agents/${id}`);
            if (!res.ok) throw new Error('Failed to fetch agent');
            return res.json();
        },

        updateAgent: async (id: string, updates: Partial<Agent>) => {
            const res = await fetchWithAuth(`/agents/${id}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update agent');
            return res.json();
        },

        deleteAgent: async (id: string) => {
            const res = await fetchWithAuth(`/agents/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error('Failed to delete agent');
            return res.json();
        },
        // Assets
        uploadAsset: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);

            const token = await getToken();
            const res = await fetch(`${API_BASE_URL}/assets/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Note: Do NOT set Content-Type here, let browser set it with boundary
                },
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            return res.json();
        },

        getAssets: async () => {
            try {
                const res = await fetchWithAuth("/assets/");
                if (!res.ok) return [];
                return res.json();
            } catch {
                return [];
            }
        },

        deleteAsset: async (id: string) => {
            const res = await fetchWithAuth(`/assets/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error('Failed to delete asset');
            return res.json();
        },

        // Get text content from an asset (for RAG)
        getAssetContent: async (id: string) => {
            const res = await fetchWithAuth(`/assets/${id}/content`);
            if (!res.ok) throw new Error('Failed to get asset content');
            return res.json();
        },

        // Build RAG context from multiple assets
        buildRagContext: async (assetIds: string[], maxChars: number = 8000) => {
            const res = await fetchWithAuth("/assets/context", {
                method: "POST",
                body: JSON.stringify({ asset_ids: assetIds, max_chars: maxChars }),
            });
            if (!res.ok) throw new Error('Failed to build RAG context');
            return res.json();
        },

        // Email Timeline
        getEmailTimeline: async (startDate?: string, endDate?: string) => {
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);

                const res = await fetchWithAuth(`/timeline?${params}`);
                if (!res.ok) {
                    // Return empty array if no timeline data yet
                    if (res.status === 404) return [];
                    throw new Error('Failed to fetch email timeline');
                }
                return res.json();
            } catch (error) {
                console.error('Email timeline fetch error:', error);
                return []; // Return empty array on error
            }
        },

        getThreadDetails: async (threadId: string) => {
            const res = await fetchWithAuth(`/timeline/threads/${threadId}`);
            if (!res.ok) throw new Error('Failed to fetch thread details');
            return res.json();
        },

        // Contact History
        getContactHistory: async (skip = 0, limit = 50) => {
            const res = await fetchWithAuth(`/contacts/history?skip=${skip}&limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch contact history');
            return res.json();
        },

        checkDuplicates: async (emails: string[]) => {
            const res = await fetchWithAuth('/contacts/check-duplicates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails })
            });
            if (!res.ok) throw new Error('Failed to check duplicates');
            return res.json();
        },

        recordContact: async (contactData: { email: string, name?: string, mission_id: string, thread_id?: string }) => {
            const res = await fetchWithAuth('/contacts/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            if (!res.ok) throw new Error('Failed to record contact');
            return res.json();
        },

        getContactStats: async () => {
            const res = await fetchWithAuth('/contacts/stats');
            if (!res.ok) throw new Error('Failed to fetch contact stats');
            return res.json();
        },

        // Settings
        getSettings: async () => {
            const res = await fetchWithAuth('/settings/');
            if (!res.ok) throw new Error('Failed to fetch settings');
            return res.json();
        },

        updateSettings: async (settings: {
            email_notifications?: boolean;
            daily_digest_time?: string;
            auto_approve_low_risk?: boolean;
            personalization_threshold?: number;
            daily_sending_limit?: number;
        }) => {
            const res = await fetchWithAuth('/settings/', {
                method: 'PATCH',
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error('Failed to update settings');
            return res.json();
        },

        // Scraper methods
        scrapeEmails: async (url: string, maxDepth = 2, maxPages = 30) => {
            const res = await fetchWithAuth('/scraper/scrape-emails', {
                method: 'POST',
                body: JSON.stringify({ url, max_depth: maxDepth, max_pages: maxPages }),
            });
            if (!res.ok) throw new Error('Failed to scrape emails');
            return res.json();
        },

        scrapeJobs: async (jobTitle: string, location = 'United States', maxResults = 50, sources?: string[]) => {
            const res = await fetchWithAuth('/scraper/scrape-jobs', {
                method: 'POST',
                body: JSON.stringify({ 
                    job_title: jobTitle, 
                    location, 
                    max_results: maxResults,
                    sources 
                }),
            });
            if (!res.ok) throw new Error('Failed to scrape jobs');
            return res.json();
        },

        researchCompany: async (companyName: string, companyWebsite?: string) => {
            const res = await fetchWithAuth('/scraper/research-company', {
                method: 'POST',
                body: JSON.stringify({ 
                    company_name: companyName, 
                    company_website: companyWebsite 
                }),
            });
            if (!res.ok) throw new Error('Failed to research company');
            return res.json();
        },

        getScraperStatus: async () => {
            const res = await fetchWithAuth('/scraper/scraper/status');
            if (!res.ok) throw new Error('Failed to get scraper status');
            return res.json();
        },

        // Sales Agent methods
        startSalesConversation: async (missionId: string, prospectInfo: {
            name?: string;
            company?: string;
            title?: string;
            context?: string;
        }) => {
            const res = await fetchWithAuth('/sales-agent/conversations/start', {
                method: 'POST',
                body: JSON.stringify({
                    mission_id: missionId,
                    prospect_name: prospectInfo.name,
                    prospect_company: prospectInfo.company,
                    prospect_title: prospectInfo.title,
                    prospect_context: prospectInfo.context,
                    salesperson_name: 'Alex',
                    conversation_purpose: 'Qualify prospect and schedule demo',
                }),
            });
            if (!res.ok) throw new Error('Failed to start conversation');
            return res.json();
        },

        sendSalesMessage: async (conversationId: string, message: string) => {
            const res = await fetchWithAuth('/sales-agent/conversations/message', {
                method: 'POST',
                body: JSON.stringify({ conversation_id: conversationId, message }),
            });
            if (!res.ok) throw new Error('Failed to send message');
            return res.json();
        },

        getSalesConversationStage: async (conversationId: string) => {
            const res = await fetchWithAuth(`/sales-agent/conversations/${conversationId}/stage`);
            if (!res.ok) throw new Error('Failed to get conversation stage');
            return res.json();
        },

        getSalesConversationSummary: async (conversationId: string) => {
            const res = await fetchWithAuth(`/sales-agent/conversations/${conversationId}/summary`);
            if (!res.ok) throw new Error('Failed to get conversation summary');
            return res.json();
        },

        handleSalesObjection: async (conversationId: string, objection: string) => {
            const res = await fetchWithAuth(`/sales-agent/conversations/${conversationId}/handle-objection?objection=${encodeURIComponent(objection)}`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to handle objection');
            return res.json();
        },

        endSalesConversation: async (conversationId: string) => {
            const res = await fetchWithAuth(`/sales-agent/conversations/${conversationId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to end conversation');
            return res.json();
        },

        getSalesAgentCapabilities: async () => {
            const res = await fetchWithAuth('/sales-agent/agent/capabilities');
            if (!res.ok) throw new Error('Failed to get agent capabilities');
            return res.json();
        },

        configureSalesAgent: async (config: {
            salesperson_name?: string;
            salesperson_role?: string;
            company_name?: string;
            conversation_purpose?: string;
            temperature?: number;
        }) => {
            const res = await fetchWithAuth('/sales-agent/agent/configure', {
                method: 'POST',
                body: JSON.stringify(config),
            });
            if (!res.ok) throw new Error('Failed to configure agent');
            return res.json();
        },

        // Email Verification methods
        verifyEmail: async (email: string, validationLevel: 'regex' | 'mx' | 'mx_blacklist' | 'smtp' = 'mx') => {
            const res = await fetchWithAuth('/scraper/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email, validation_level: validationLevel }),
            });
            if (!res.ok) throw new Error('Failed to verify email');
            return res.json();
        },

        verifyEmailsBatch: async (emails: string[], validationLevel: 'regex' | 'mx' | 'mx_blacklist' | 'smtp' = 'mx') => {
            const res = await fetchWithAuth('/scraper/verify-emails-batch', {
                method: 'POST',
                body: JSON.stringify({ emails, validation_level: validationLevel }),
            });
            if (!res.ok) throw new Error('Failed to verify emails');
            return res.json();
        },

        // Bulk draft operations for job seeker workflow
        createBulkDrafts: async (missionId: string, prospectIds: string[]) => {
            const res = await fetchWithAuth(`/missions/${missionId}/create-bulk-drafts`, {
                method: 'POST',
                body: JSON.stringify({ prospect_ids: prospectIds }),
            });
            if (!res.ok) throw new Error('Failed to create bulk drafts');
            return res.json();
        },

        approveAllDrafts: async (missionId?: string) => {
            const params = missionId ? `?mission_id=${missionId}` : '';
            const res = await fetchWithAuth(`/reviews/approve-all${params}`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to approve all drafts');
            return res.json();
        },
    }), [fetchWithAuth, getToken]);
}
