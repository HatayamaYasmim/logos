import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  LogOut,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../contexts/auth-context";
import { ThemeToggle } from "../components/ThemeToggle";
import { IncidentCreateModal } from "../components/incidents/IncidentCreateModal";
import { IncidentDeleteModal } from "../components/incidents/IncidentDeleteModal";
import { IncidentEditModal } from "../components/incidents/IncidentEditModal";
import { IncidentTable } from "../components/incidents/IncidentTable";

import { ApiError, apiRequest } from "../services/api";
import { getIncident, getIncidents } from "../services/incidents";

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

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm " +
  "text-slate-900 outline-none focus:border-blue-600 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 " +
  "dark:focus:border-blue-400";

export default function DashboardPage() {
  const { email, logout } = useAuth();

  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [category, setCategory] = useState<IncidentCategory | "">("");
  const [status, setStatus] = useState<IncidentStatus | "">("");
  const [page, setPage] = useState(1);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(
    null,
  );

  const [editOpenError, setEditOpenError] = useState("");
  const [openingEditId, setOpeningEditId] = useState<number | null>(null);

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

  const isRefreshing = statsQuery.isFetching || incidentsQuery.isFetching;

  function changeFilters() {
    setPage(1);
  }

  async function refreshData() {
    if (isRefreshing) return;

    const toastId = toast.loading("Atualizando dados...");

    try {
      const [statsResult, incidentsResult] = await Promise.all([
        statsQuery.refetch(),
        incidentsQuery.refetch(),
      ]);

      if (statsResult.isError || incidentsResult.isError) {
        toast.error("Não foi possível atualizar os dados.", { id: toastId });
        return;
      }

      toast.success("Dados atualizados com sucesso!", { id: toastId });
    } catch {
      toast.error("Não foi possível conectar ao servidor.", { id: toastId });
    }
  }

  async function openEdit(incident: Incident) {
    if (openingEditId !== null) return;

    setOpeningEditId(incident.id);
    setEditOpenError("");

    try {
      const latest = await getIncident(incident.id);

      setEditingIncident(latest);
      setSelectedIncident(null);
    } catch (error) {
      setEditOpenError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar o incidente atualizado.",
      );
    } finally {
      setOpeningEditId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Cabeçalho */}
      <header className="border-b border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">Logos</h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Central de Resposta a Incidentes
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Analista: {email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void refreshData()}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-1.5 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? "animate-spin" : ""}
              />
              Atualizar
            </button>

            <ThemeToggle />

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Visão geral */}
        <section>
          <h2 className="text-2xl font-semibold">Visão geral da operação</h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Acompanhe as prioridades e o andamento dos incidentes.
          </p>

          {statsQuery.isPending ? (
            <p
              role="status"
              className="mt-6 text-slate-500 dark:text-slate-400"
            >
              Carregando indicadores...
            </p>
          ) : statsQuery.isError ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
            >
              Não foi possível carregar os indicadores.
              <button
                type="button"
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
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.label}
                      </p>

                      <Icon
                        size={20}
                        className="text-slate-500 dark:text-slate-400"
                      />
                    </div>

                    <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Incidentes */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Incidentes em operação
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Filtre e acompanhe os registros da frota.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Plus size={18} />
                Novo incidente
              </button>
            </div>

            {/* Filtros */}
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
                  className={selectClass}
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
                  className={selectClass}
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
                  className={selectClass}
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

          {/* Tabela */}
          {incidentsQuery.isError ? (
            <div role="alert" className="p-8 text-center">
              <p className="text-red-700 dark:text-red-400">
                Não foi possível carregar os incidentes.
              </p>

              <button
                type="button"
                onClick={() => void incidentsQuery.refetch()}
                className="mt-3 rounded-lg bg-blue-700 px-4 py-1.5 text-sm text-white hover:bg-blue-800 dark:bg-blue-600"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {editOpenError && (
                <div
                  role="alert"
                  className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                >
                  {editOpenError}
                </div>
              )}

              <IncidentTable
                incidents={result?.items ?? []}
                isLoading={incidentsQuery.isPending}
                onSelect={(incident) => {
                  setEditOpenError("");
                  setSelectedIncident(incident);
                }}
                onEdit={(incident) => {
                  void openEdit(incident);
                }}
                editingIncidentId={openingEditId}
                onDelete={(incident) => {
                  setDeletingIncident(incident);
                }}
              />
            </>
          )}

          {/* Paginação */}
          {!incidentsQuery.isPending && !incidentsQuery.isError && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5 text-sm dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">
                {result?.total ?? 0} incidentes encontrados
                {incidentsQuery.isFetching ? " · Atualizando..." : ""}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || incidentsQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Anterior
                </button>

                <span className="text-slate-600 dark:text-slate-300">
                  Página {page} de {Math.max(totalPages, 1)}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || incidentsQuery.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modal de detalhes */}
      {selectedIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
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
            className="w-full max-w-xl rounded-xl bg-white p-6 text-slate-900 shadow-xl dark:border dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="incident-dialog-title" className="text-xl font-bold">
                  {selectedIncident.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Incidente #{selectedIncident.id}
                </p>
              </div>

              <button
                type="button"
                aria-label="Fechar detalhes"
                onClick={() => setSelectedIncident(null)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">
                  Criticidade
                </dt>
                <dd className="font-medium">{selectedIncident.severity}</dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                <dd className="font-medium">{selectedIncident.status}</dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400">
                  Categoria
                </dt>
                <dd className="font-medium">{selectedIncident.category}</dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400">Veículo</dt>
                <dd className="font-medium">
                  {selectedIncident.truck_id ?? "Não informado"}
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="text-slate-500 dark:text-slate-400">
                  Localização
                </dt>
                <dd className="font-medium">
                  {selectedIncident.location ?? "Não informada"}
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="text-slate-500 dark:text-slate-400">
                  Descrição
                </dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {selectedIncident.description}
                </dd>
              </div>

              <div className="col-span-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">
                  Última atualização
                </dt>

                <dd className="font-medium">
                  {selectedIncident.updated_by ?? "Não informado"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Modal de cadastro */}
      {isCreateModalOpen && (
        <IncidentCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            setIsCreateModalOpen(false);
            setPage(1);
          }}
        />
      )}

      {/* Modal de edição */}
      {editingIncident && (
        <IncidentEditModal
          key={editingIncident.id}
          incident={editingIncident}
          onClose={() => setEditingIncident(null)}
          onUpdated={() => {
            setEditingIncident(null);
            setSelectedIncident(null);
          }}
        />
      )}

      {/* Modal de exclusão */}
      {deletingIncident && (
        <IncidentDeleteModal
          key={deletingIncident.id}
          incident={deletingIncident}
          onClose={() => setDeletingIncident(null)}
          onDeleted={() => {
            setDeletingIncident(null);
          }}
        />
      )}
    </div>
  );
}
