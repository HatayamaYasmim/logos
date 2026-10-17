import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Activity,
  ClipboardList,
  RefreshCw,
  X,
} from "lucide-react";

import { apiRequest } from "../services/api";
import { getIncidents } from "../services/incidents";
import { IncidentTable } from "../components/incidents/IncidentTable";

import { LogOut } from "lucide-react";
import { useAuth } from "../contexts/auth-context";

import type {
  Incident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStats,
  IncidentStatus,
} from "../types/incident";

const categories: IncidentCategory[] = [
  "Acidente com Veículo",
  "Acidente com Vítimas",
  "Condição Climática Atípica na Pista",
  "Problema Mecânico",
  "Bloqueio de Pista",
];

const severities: IncidentSeverity[] = ["Alta", "Média", "Baixa"];

const statuses: IncidentStatus[] = [
  "Aberto",
  "Em Investigação",
  "Fechado",
  "Inconclusivo",
];

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const { email, logout } = useAuth();
  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [category, setCategory] = useState<IncidentCategory | "">("");
  const [status, setStatus] = useState<IncidentStatus | "">("");
  const [page, setPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );

  const skip = (page - 1) * PAGE_SIZE;

  const statsQuery = useQuery({
    queryKey: ["incident-stats"],
    queryFn: () => apiRequest<IncidentStats>("/incidents/stats"),
  });

  const incidentsQuery = useQuery({
    queryKey: ["incidents", severity, category, status, page],
    queryFn: () =>
      getIncidents({
        severity: severity || undefined,
        category: category || undefined,
        status: status || undefined,
        skip,
        limit: PAGE_SIZE,
      }),
  });

  const stats = statsQuery.data;
  const result = incidentsQuery.data;
  const totalPages = result?.total_pages ?? 0;

  const changeFilters = () => setPage(1);

  function refreshData() {
    void statsQuery.refetch();
    void incidentsQuery.refetch();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">Logos</h1>
            <p className="text-sm text-slate-500">
              Central de Resposta a Incidentes
            </p>
            <p className="mt-1 text-xs text-slate-500">Analista: {email}</p>
          </div>

          <button
            type="button"
            onClick={refreshData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 transition-colors hover:bg-red-50"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section>
          <h2 className="text-2xl font-semibold">Visão geral da operação</h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe as prioridades e o andamento dos incidentes.
          </p>

          {statsQuery.isPending ? (
            <p role="status" className="mt-6">
              Carregando indicadores...
            </p>
          ) : statsQuery.isError ? (
            <div
              role="alert"
              className="mt-6 rounded-xl bg-red-50 p-5 text-red-700"
            >
              Não foi possível carregar os indicadores.
              <button
                onClick={() => void statsQuery.refetch()}
                className="ml-3 underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Total de incidentes",
                  value: stats?.total ?? 0,
                  icon: ClipboardList,
                },
                {
                  label: "Alta criticidade",
                  value: stats?.by_severity["Alta"] ?? 0,
                  icon: AlertTriangle,
                },
                {
                  label: "Em investigação",
                  value: stats?.by_status["Em Investigação"] ?? 0,
                  icon: Activity,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <Icon size={20} className="text-slate-500" />
                    </div>
                    <p className="mt-5 text-3xl font-bold">{item.value}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold">Incidentes em operação</h2>
            <p className="mt-1 text-sm text-slate-500">
              Filtre e acompanhe os registros da frota.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm">
                Criticidade
                <select
                  aria-label="Filtrar por criticidade"
                  value={severity}
                  onChange={(event) => {
                    setSeverity(event.target.value as IncidentSeverity | "");
                    changeFilters();
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">Todas</option>
                  {severities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Categoria
                <select
                  aria-label="Filtrar por categoria"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as IncidentCategory | "");
                    changeFilters();
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">Todas</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Status
                <select
                  aria-label="Filtrar por status"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as IncidentStatus | "");
                    changeFilters();
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">Todos</option>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {incidentsQuery.isError ? (
            <div role="alert" className="p-8 text-center">
              <p className="text-red-700">
                Não foi possível carregar os incidentes.
              </p>
              <button
                onClick={() => void incidentsQuery.refetch()}
                className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-white"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <IncidentTable
              incidents={result?.items ?? []}
              isLoading={incidentsQuery.isPending}
              onSelect={setSelectedIncident}
            />
          )}

          {!incidentsQuery.isPending && !incidentsQuery.isError && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5 text-sm">
              <p className="text-slate-500">
                {result?.total ?? 0} incidentes encontrados
                {incidentsQuery.isFetching ? " · Atualizando..." : ""}
              </p>

              <div className="flex items-center gap-3">
                <button
                  disabled={page <= 1 || incidentsQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <span>
                  Página {page} de {Math.max(totalPages, 1)}
                </span>

                <button
                  disabled={page >= totalPages || incidentsQuery.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {selectedIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedIncident(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-dialog-title"
            className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="incident-dialog-title" className="text-xl font-bold">
                  {selectedIncident.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Incidente #{selectedIncident.id}
                </p>
              </div>
              <button
                aria-label="Fechar detalhes"
                onClick={() => setSelectedIncident(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Criticidade</dt>
                <dd className="font-medium">{selectedIncident.severity}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium">{selectedIncident.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Categoria</dt>
                <dd className="font-medium">{selectedIncident.category}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Veículo</dt>
                <dd className="font-medium">
                  {selectedIncident.truck_id ?? "Não informado"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Localização</dt>
                <dd className="font-medium">
                  {selectedIncident.location ?? "Não informada"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Descrição</dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {selectedIncident.description}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
