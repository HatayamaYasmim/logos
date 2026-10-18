import { apiRequest } from "./api";

export interface AIResponse {
  answer: string;
}

export async function analyzeIncident(incidentId: number): Promise<AIResponse> {
  return apiRequest<AIResponse>(`/ai/incidents/${incidentId}/analyze`, {
    method: "POST",
  });
}

export async function chatWithAI(question: string): Promise<AIResponse> {
  return apiRequest<AIResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
