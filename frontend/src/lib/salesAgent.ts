/**
 * Sales Agent API Client
 * SalesGPT-inspired conversational AI for sales automation
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('clerk-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ConversationStage =
  | 'introduction'
  | 'qualification'
  | 'value_proposition'
  | 'needs_analysis'
  | 'solution_presentation'
  | 'objection_handling'
  | 'close'
  | 'end_conversation';

export interface StartConversationRequest {
  mission_id: string;
  prospect_name?: string;
  prospect_company?: string;
  prospect_title?: string;
  prospect_context?: string;
  salesperson_name?: string;
  conversation_purpose?: string;
}

export interface StartConversationResponse {
  success: boolean;
  conversation_id: string;
  stage: ConversationStage;
  message: string;
  prospect_info: {
    name: string;
    company: string;
    title: string;
    context: string;
  };
}

export interface SendMessageRequest {
  conversation_id: string;
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  conversation_id: string;
  stage: ConversationStage;
  message: string;
  should_end: boolean;
}

export interface ConversationStageResponse {
  conversation_id: string;
  stage: ConversationStage;
  stage_description: string;
}

export interface ConversationSummary {
  success: boolean;
  summary: {
    conversation_id: string;
    current_stage: ConversationStage;
    message_count: number;
    prospect_info: Record<string, any>;
    tools_used: string[];
    metadata: Record<string, any>;
  };
}

export interface HandleObjectionRequest {
  objection: string;
}

export interface HandleObjectionResponse {
  success: boolean;
  conversation_id: string;
  objection: string;
  response: string;
}

export interface AgentCapabilities {
  model: string;
  features: {
    stage_awareness: boolean;
    context_understanding: boolean;
    objection_handling: boolean;
    product_knowledge: boolean;
    multi_channel: boolean;
    personalization: boolean;
  };
  conversation_stages: ConversationStage[];
  supported_channels: string[];
  languages: string[];
  max_conversation_length: number;
}

export interface AgentConfigRequest {
  salesperson_name?: string;
  salesperson_role?: string;
  company_name?: string;
  conversation_purpose?: string;
  temperature?: number;
}

export interface AgentConfigResponse {
  success: boolean;
  message: string;
  config: Record<string, any>;
}

/**
 * Start a new AI sales conversation
 */
export async function startConversation(
  request: StartConversationRequest
): Promise<StartConversationResponse> {
  const response = await apiClient.post('/sales-agent/conversations/start', {
    mission_id: request.mission_id,
    prospect_name: request.prospect_name,
    prospect_company: request.prospect_company,
    prospect_title: request.prospect_title,
    prospect_context: request.prospect_context,
    salesperson_name: request.salesperson_name || 'Alex',
    conversation_purpose: request.conversation_purpose || 'Qualify prospect and schedule demo',
  });
  return response.data;
}

/**
 * Send a message to the sales agent
 */
export async function sendMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await apiClient.post('/sales-agent/conversations/message', {
    conversation_id: request.conversation_id,
    message: request.message,
  });
  return response.data;
}

/**
 * Get current conversation stage
 */
export async function getConversationStage(
  conversationId: string
): Promise<ConversationStageResponse> {
  const response = await apiClient.get(`/sales-agent/conversations/${conversationId}/stage`);
  return response.data;
}

/**
 * Get conversation summary for analytics
 */
export async function getConversationSummary(
  conversationId: string
): Promise<ConversationSummary> {
  const response = await apiClient.get(`/sales-agent/conversations/${conversationId}/summary`);
  return response.data;
}

/**
 * Handle a specific objection
 */
export async function handleObjection(
  conversationId: string,
  objection: string
): Promise<HandleObjectionResponse> {
  const response = await apiClient.post(
    `/sales-agent/conversations/${conversationId}/handle-objection`,
    null,
    { params: { objection } }
  );
  return response.data;
}

/**
 * End a conversation
 */
export async function endConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/sales-agent/conversations/${conversationId}`);
  return response.data;
}

/**
 * Get agent capabilities
 */
export async function getAgentCapabilities(): Promise<AgentCapabilities> {
  const response = await apiClient.get('/sales-agent/agent/capabilities');
  return response.data;
}

/**
 * Configure a custom sales agent
 */
export async function configureAgent(
  config: AgentConfigRequest
): Promise<AgentConfigResponse> {
  const response = await apiClient.post('/sales-agent/agent/configure', config);
  return response.data;
}

/**
 * Helper: Get stage display name
 */
export function getStageDisplayName(stage: ConversationStage): string {
  const names: Record<ConversationStage, string> = {
    introduction: 'Introduction',
    qualification: 'Qualification',
    value_proposition: 'Value Proposition',
    needs_analysis: 'Needs Analysis',
    solution_presentation: 'Solution Presentation',
    objection_handling: 'Objection Handling',
    close: 'Closing',
    end_conversation: 'Ended',
  };
  return names[stage] || stage;
}

/**
 * Helper: Get stage color for UI
 */
export function getStageColor(stage: ConversationStage): string {
  const colors: Record<ConversationStage, string> = {
    introduction: 'blue',
    qualification: 'purple',
    value_proposition: 'indigo',
    needs_analysis: 'cyan',
    solution_presentation: 'green',
    objection_handling: 'yellow',
    close: 'orange',
    end_conversation: 'gray',
  };
  return colors[stage] || 'gray';
}
