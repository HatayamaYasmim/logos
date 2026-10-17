import { apiRequest } from "./api";
import type {
  Incident,
  IncidentPage,
  IncidentStatus,
  CreateIncidentPayload,
  IncidentFilters,
  UpdateIncidentPayload,
} from "../types/incident";

export async function getIncidents(
  filters: IncidentFilters,
): Promise<IncidentPage> {
  const params = new URLSearchParams();

  params.set("skip", String(filters.skip));
  params.set("limit", String(filters.limit));

  if (filters.severity) {
    params.set("severity", filters.severity);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  return apiRequest<IncidentPage>(`/incidents?${params.toString()}`);
}

export async function getIncident(id: number): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}`);
}

export async function createIncident(
  data: CreateIncidentPayload,
): Promise<Incident> {
  return apiRequest<Incident>("/incidents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIncident(
  id: number,
  data: UpdateIncidentPayload,
): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateIncidentStatus(
  id: number,
  status: IncidentStatus,
  version: number,
): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, version }),
  });
}

export async function deleteIncident(
  id: number,
  version: number,
): Promise<void> {
  await apiRequest<void>(`/incidents/${id}?version=${version}`, {
    method: "DELETE",
  });
}
