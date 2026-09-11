export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentChatResponse {
  message: string;
  toolCalls?: Array<{ name: string; result: string }>;
}

export async function sendAgentMessage(
  messages: ChatMessage[],
  userId?: string,
): Promise<AgentChatResponse> {
  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, userId }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Error del agente");
  }
  return res.json() as Promise<AgentChatResponse>;
}
