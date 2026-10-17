
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle, X } from "lucide-react";

import { ApiError } from "../../services/api";
import {
  createIncident,
} from "../../services/incidents";

import {
  IncidentForm,
  type IncidentFormValues,
} from "./IncidentForm";
import type { CreateIncidentPayload } from "../../types/incident";

interface IncidentCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const initialValues: IncidentFormValues = {
  title: "",
  description: "",
  category: "Problema Mecânico",
  severity: "Média",
  truck_id: "",
  location: "",
};

export function IncidentCreateModal({
  onClose,
  onCreated,
}: IncidentCreateModalProps) {
  const queryClient = useQueryClient();

  const [values, setValues] = useState<IncidentFormValues>({
    ...initialValues,
  });

  const mutation = useMutation({
    mutationFn: createIncident,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["incidents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["incident-stats"],
        }),
      ]);

      onCreated();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mutation.isPending) return;

    const payload: CreateIncidentPayload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      severity: values.severity,
      truck_id: values.truck_id.trim() || null,
      location: values.location.trim() || null,
    };

    mutation.mutate(payload);
  }

  const errorMessage = mutation.error
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : "Não foi possível cadastrar o incidente."
    : null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !mutation.isPending
        ) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-incident-title"
          className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl"
        >
          {/* Cabeçalho */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2
                id="create-incident-title"
                className="text-xl font-bold text-slate-900"
              >
                Novo incidente
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registre uma nova ocorrência da operação.
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar formulário"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <IncidentForm
              values={values}
              onChange={setValues}
              disabled={mutation.isPending}
            />

            {/* Erros */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle
                  size={18}
                  className="shrink-0"
                />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {mutation.isPending && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                {mutation.isPending
                  ? "Salvando..."
                  : "Cadastrar incidente"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
