import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  AlertCircle,
  Bot,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { ApiError } from "../../services/api";
import { chatWithAI } from "../../services/ai";
import ReactMarkdown from "react-markdown";

interface AiChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Quais incidentes de alta gravidade estão abertos?",
  "Quais ocorrências precisam de atenção imediata?",
  "Resuma a situação atual da operação.",
];

export function AiChat({ isOpen, onClose }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const nextId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    inputRef.current?.focus();

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isLoading, isOpen]);

  function addMessage(role: ChatMessage["role"], content: string) {
    setMessages((current) => [
      ...current,
      {
        id: nextId.current++,
        role,
        content,
      },
    ]);
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const question = input.trim();

    if (!question || submittingRef.current) return;

    submittingRef.current = true;
    setInput("");
    setError("");
    setIsLoading(true);

    addMessage("user", question);

    try {
      const response = await chatWithAI(question);
      addMessage("assistant", response.answer);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError(
            "O limite gratuito da IA foi atingido. " +
              "Aguarde antes de tentar novamente.",
          );
        } else if (err.status === 504) {
          setError("A IA demorou para responder. Tente novamente mais tarde.");
        } else if (err.status === 503) {
          setError("O assistente está temporariamente indisponível.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Não foi possível obter uma resposta da IA.");
      }

      // Permite tentar a mesma pergunta novamente.
      setInput(question);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function clearConversation() {
    if (isLoading) return;

    setMessages([]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Fundo: clique fora fecha o painel. */}
      <button
        type="button"
        aria-label="Fechar painel do Logos AI"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="logos-ai-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Cabeçalho */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Sparkles size={21} />
            </div>

            <div>
              <h2
                id="logos-ai-title"
                className="font-semibold text-slate-900 dark:text-slate-100"
              >
                Logos AI
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Copiloto de resposta a incidentes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearConversation}
              disabled={isLoading || messages.length === 0}
              aria-label="Limpar conversa"
              title="Limpar conversa"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Trash2 size={18} />
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar Logos AI"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Histórico */}
        <div
          aria-label="Histórico da conversa"
          aria-live="polite"
          aria-relevant="additions"
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6"
        >
          {messages.length === 0 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center pt-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                  <Bot size={30} />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Como posso ajudar?
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Consulte incidentes, acompanhe indicadores e peça sugestões
                  para a operação logística.
                </p>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Perguntas sugeridas
                </p>

                <div className="space-y-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-slate-800"
                    >
                      <MessageCircle
                        size={17}
                        className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                      />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isUser
                      ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                  }`}
                >
                  {isUser ? <UserRound size={17} /> : <Bot size={17} />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    isUser
                      ? "rounded-tr-sm bg-blue-700 text-white"
                      : "rounded-tl-sm border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  <div className="min-w-0 break-words [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div
              role="status"
              className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400"
            >
              <Bot size={18} className="text-blue-600" />
              <LoaderCircle size={17} className="animate-spin" />
              Consultando o Logos AI...
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Campo de envio */}
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-end gap-2 rounded-xl border border-slate-300 p-2 focus-within:border-blue-600 dark:border-slate-700 dark:focus-within:border-blue-400">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={1000}
              rows={2}
              aria-label="Mensagem para o Logos AI"
              placeholder="Pergunte sobre os incidentes..."
              className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-slate-100"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Enviar mensagem"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isLoading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
            Enter para enviar · Shift+Enter para nova linha
          </p>

          <p className="mt-1 text-center text-[11px] text-slate-500 dark:text-slate-400">
            A IA pode cometer erros. Confira as recomendações.
          </p>
        </form>
      </aside>
    </div>
  );
}
