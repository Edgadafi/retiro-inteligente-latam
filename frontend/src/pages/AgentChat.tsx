import { useState } from "react";
import { sendAgentMessage, type ChatMessage } from "../lib/agent";

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await sendAgentMessage(next, "demo-gig-worker-001");
      setMessages([...next, { role: "assistant", content: res.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Agente de Ahorro</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Conectado vía MCP tools — monedero protegido en TEE
        </p>
      </div>

      <div className="bg-surface-elevated border border-border rounded-xl p-4 min-h-64 max-h-96 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-neutral-500 text-sm">
            Pregunta, por ejemplo: &quot;¿Cuánto tendría si ahorro $50 diarios por 20 años?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm ${m.role === "user" ? "text-white" : "text-neutral-300"}`}
          >
            <span className="text-xs uppercase text-neutral-500 mr-2">
              {m.role === "user" ? "Tú" : "Agente"}
            </span>
            {m.content}
          </div>
        ))}
        {loading && <p className="text-neutral-500 text-sm animate-pulse">Pensando…</p>}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta de ahorro…"
          className="flex-1 bg-surface-elevated border border-border rounded-lg px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-700 hover:bg-brand-500 px-5 py-3 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
