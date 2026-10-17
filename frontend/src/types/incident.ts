export type IncidentSeverity = "Alta" | "Média" | "Baixa";

export type IncidentStatus =
  | "Aberto"
  | "Em Investigação"
  | "Fechado"
  | "Inconclusivo";

export type IncidentCategory =
  | "Acidente com Veículo"
  | "Acidente com Vítimas"
  | "Condição Climática Atípica na Pista"
  | "Problema Mecânico"
  | "Bloqueio de Pista";

export interface Incident {
  id: number;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  truck_id: string | null;
  location: string | null;
  assigned_to: string | null;
  updated_by: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface IncidentPage {
  items: Incident[];
  total: number;
  skip: number;
  limit: number;
  total_pages: number;
}

export interface IncidentStats {
  total: number;
  by_severity: Record<IncidentSeverity, number>;
  by_status: Record<IncidentStatus, number>;
}
