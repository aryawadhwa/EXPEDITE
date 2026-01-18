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

        // Reviews
        getPendingDrafts: async () => {
            const res = await fetchWithAuth("/reviews/pending");
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
    };
}

