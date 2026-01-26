import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = "http://localhost:8000/api/v1";

export function useApi() {
    const { getToken } = useAuth();

    const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
        const token = await getToken();
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        };
        return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    };

    return {
        // Missions
        createMission: async (objective: string) => {
            const res = await fetchWithAuth("/missions/", {
                method: "POST",
                body: JSON.stringify({ objective }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Failed to create mission');
            }
            return res.json();
        },

        listMissions: async () => {
            const res = await fetchWithAuth("/missions/");
            if (!res.ok) throw new Error('Failed to fetch missions');
            return res.json();
        },

        getMissionLogs: async (missionId: string) => {
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
        getPendingDrafts: async () => {
            const res = await fetchWithAuth("/reviews/pending");
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

        // Agents
        getAgents: async () => {
            const res = await fetchWithAuth("/agents/");
            if (!res.ok) throw new Error('Failed to fetch agents');
            return res.json();
        },

        createAgent: async (agent: any) => {
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

        updateAgent: async (id: string, updates: any) => {
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
    };
}

