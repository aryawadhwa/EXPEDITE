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
            return res.json();
        },

        listMissions: async () => {
            const res = await fetchWithAuth("/missions/");
            return res.json();
        },

        getMissionLogs: async (missionId: string) => {
            const res = await fetchWithAuth(`/missions/${missionId}/logs`);
            return res.json();
        },

        chatWithMission: async (missionId: string, message: string) => {
            const res = await fetchWithAuth(`/missions/${missionId}/chat`, {
                method: "POST",
                body: JSON.stringify({ message }),
            });
            return res.json();
        },

        deleteMission: async (missionId: string) => {
            const res = await fetchWithAuth(`/missions/${missionId}`, {
                method: "DELETE",
            });
            return res.json();
        },

        stopMission: async (missionId: string) => {
            const res = await fetchWithAuth(`/missions/${missionId}/stop`, {
                method: "PATCH",
            });
            return res.json();
        },

        // Reviews
        getPendingDrafts: async () => {
            const res = await fetchWithAuth("/reviews/pending");
            return res.json();
        },

        clearAllDrafts: async () => {
            const res = await fetchWithAuth("/reviews/pending", {
                method: "DELETE",
            });
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
            return res.json();
        },

        regenerateDraft: async (id: string) => {
            const res = await fetchWithAuth(`/reviews/${id}/regenerate`, {
                method: "POST",
            });
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
            return res.json();
        },

        disconnectTool: async (tool: string) => {
            const res = await fetchWithAuth(`/integrations/${tool}`, {
                method: "DELETE",
            });
            return res.json();
        },

        // Agents
        getAgents: async () => {
            const res = await fetchWithAuth("/agents/");
            return res.json();
        },

        createAgent: async (agent: any) => {
            const res = await fetchWithAuth("/agents/", {
                method: "POST",
                body: JSON.stringify(agent),
            });
            return res.json();
        },

        getAgent: async (id: string) => {
            const res = await fetchWithAuth(`/agents/${id}`);
            return res.json();
        },

        updateAgent: async (id: string, updates: any) => {
            const res = await fetchWithAuth(`/agents/${id}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            });
            return res.json();
        },

        deleteAgent: async (id: string) => {
            const res = await fetchWithAuth(`/agents/${id}`, {
                method: "DELETE",
            });
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
            return res.json();
        },
    };
}

