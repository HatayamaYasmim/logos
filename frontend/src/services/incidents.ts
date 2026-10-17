import { apiRequest } from "./api";
import type {
  Incident,
  IncidentPage,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from "../types/incident";

export interface IncidentFilters {
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  status?: IncidentStatus;
  skip: number;
  limit: number;
}

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
