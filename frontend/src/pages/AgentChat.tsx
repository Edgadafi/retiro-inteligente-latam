import { useEffect, useState } from "react";
import { CompassIcon } from "../components/ui/CompassIcon";
import { BodyText, DisplayH1, RitoLabel } from "../components/ui/RitoTypography";
import { sendAgentMessage, type ChatMessage } from "../lib/agent";
import { fetchHealth } from "../lib/onboarding";

const DEMO_USER = "demo-gig-worker-001";

const STARTERS = [
  "¿Cuánto tendría si ahorro $50 diarios por 20 años?",
  "¿Qué son los CETES y por qué rinden más que mi AFORE?",
  "¿Cómo funciona mi CLABE para depositar por SPEI?",
];

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<"openai" | "sandbox" | "offline">("offline");

  useEffect(() => {
    void fetchHealth()
      .then((h) => {
        const integrations = h.integrations as Record<string, boolean>;
        if (integrations.openai) setChatMode("openai");
        else if (integrations.agentChatSandbox) setChatMode("sandbox");
        else setChatMode("offline");
      })
      .catch(() => setChatMode("offline"));
  }, []);

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
      const res = await sendAgentMessage(next, DEMO_USER);
      setMessages([...next, { role: "assistant", content: res.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function sendStarter(text: string) {
    setInput(text);
  }

  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <CompassIcon size={40} variant="dark" pulse={loading} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <DisplayH1 as="h2" className="text-rito-frost !text-xl sm:!text-2xl">
            Rito — tu copiloto
          </DisplayH1>
          <BodyText className="text-rito-mist !text-sm mt-1">
            Chat con OpenAI + herramientas MCP. Tu monedero sigue protegido en TEE.
          </BodyText>
          {chatMode === "openai" && (
            <p className="text-rito-compass text-xs mt-2">OpenAI conectado · GPT + tools MCP</p>
          )}
          {chatMode === "sandbox" && (
            <p className="text-rito-amber text-xs mt-2">
              Modo demo sandbox — Rito responde sin OpenAI (quota 429 o AGENT_CHAT_SANDBOX_MODE)
            </p>
          )}
          {chatMode === "offline" && (
            <p className="text-rito-error text-xs mt-2">
              Chat no disponible — configura OPENAI_API_KEY o AGENT_CHAT_SANDBOX_MODE=true
            </p>
          )}
        </div>
      </div>

      <div className="bg-rito-elevated border border-rito-deep/50 rounded-xl p-4 min-h-64 max-h-96 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-rito-mist text-sm">
              Hola — soy Rito. Pregúntame sobre tu retiro, CETES o tu plan de ahorro.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendStarter(s)}
                  className="text-xs text-left px-3 py-2 rounded-lg border border-rito-ocean/30 text-rito-compass hover:border-rito-ocean/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm ${m.role === "user" ? "text-rito-frost" : "text-rito-mist"}`}
          >
            <RitoLabel className="text-rito-compass/70 mr-2 !inline !normal-case">
              {m.role === "user" ? "Tú" : "Rito"}
            </RitoLabel>
            {m.content}
          </div>
        ))}
        {loading && (
          <p className="text-rito-mist text-sm animate-pulse flex items-center gap-2">
            <CompassIcon size={16} variant="dark" pulse />
            Orientando tu norte…
          </p>
        )}
      </div>

      {error && <p className="text-rito-error text-sm">{error}</p>}

      <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta de ahorro…"
          disabled={chatMode === "offline"}
          className="flex-1 bg-rito-elevated border border-rito-deep/60 rounded-xl px-4 py-3 text-sm text-rito-frost focus:outline-none focus:border-rito-compass disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || chatMode === "offline"}
          className="bg-rito-ocean hover:bg-rito-compass text-rito-slate font-display font-medium px-5 py-3 rounded-xl text-sm disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
