import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  LoaderCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { ApiError } from "../../services/api";
import { deleteIncident, getIncident } from "../../services/incidents";
import type { Incident } from "../../types/incident";

interface IncidentDeleteModalProps {
  incident: Incident;
  onClose: () => void;
  onDeleted: () => void;
}

export function IncidentDeleteModal({
  incident,
  onClose,
  onDeleted,
}: IncidentDeleteModalProps) {
  const queryClient = useQueryClient();

  const [currentIncident, setCurrentIncident] = useState<Incident>(incident);
  const [conflict, setConflict] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [reloadError, setReloadError] = useState("");

  async function refreshQueries() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["incidents"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["incident-stats"],
      }),
    ]);
  }

  const mutation = useMutation({
    mutationFn: () =>
      deleteIncident(currentIncident.id, currentIncident.version),

    onSuccess: async () => {
      await refreshQueries();
      onDeleted();
    },

    onError: async (error) => {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setConflict(true);
        }

        if (error.status === 404) {
          await refreshQueries();
        }
      }
    },
  });

  const isBusy = mutation.isPending || reloading;

  async function reloadIncident() {
    if (isBusy) return;

    setReloading(true);
    setReloadError("");

    try {
      const latest = await getIncident(currentIncident.id);

      setCurrentIncident(latest);
      setConflict(false);
      mutation.reset();

      await refreshQueries();
    } catch (error) {
      setReloadError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível recarregar o incidente.",
      );
    } finally {
      setReloading(false);
    }
  }

  const notFound =
    mutation.error instanceof ApiError && mutation.error.status === 404;

  const genericError =
    mutation.isError && !conflict && !notFound
      ? mutation.error instanceof ApiError
        ? mutation.error.message
        : "Não foi possível excluir o incidente."
      : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6">
      <div className="flex min-h-full items-center justify-center">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-incident-title"
          aria-describedby="delete-incident-description"
          className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2 text-red-700">
                <AlertTriangle size={22} />
              </div>

              <h2
                id="delete-incident-title"
                className="text-lg font-semibold text-slate-900"
              >
                Excluir incidente?
              </h2>
            </div>

            <button
              type="button"
              aria-label="Fechar confirmação"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <p
            id="delete-incident-description"
            className="mt-4 text-sm text-slate-600"
          >
            Você está prestes a excluir o incidente abaixo. Essa operação não
            poderá ser desfeita.
          </p>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">
              #{currentIncident.id} — {currentIncident.title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Status: {currentIncident.status}
              {" · "}
              Criticidade: {currentIncident.severity}
              {" · "}
              Versão: {currentIncident.version}
            </p>
          </div>

          {conflict && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <p>
                Este incidente foi alterado por outro analista. A exclusão não
                foi realizada. Recarregue os dados e confirme novamente.
              </p>

              <button
                type="button"
                onClick={() => void reloadIncident()}
                disabled={isBusy}
                className="mt-3 flex items-center gap-2 rounded-lg bg-amber-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                <RefreshCw size={15} />
                {reloading ? "Recarregando..." : "Recarregar incidente"}
              </button>
            </div>
          )}

          {notFound && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
            >
              Este incidente já foi excluído ou não existe mais. A listagem foi
              atualizada.
            </p>
          )}

          {(genericError || reloadError) && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {genericError || reloadError}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {notFound ? "Fechar" : "Cancelar"}
            </button>

            {!notFound && (
              <button
                type="button"
                disabled={isBusy || conflict}
                onClick={() => mutation.mutate()}
                className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}

                {mutation.isPending ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
