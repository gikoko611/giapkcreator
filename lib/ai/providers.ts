export type ProviderId = "groq" | "gemini" | "cohere" | "openrouter" | "ollama-cloud" | "custom";

export type ProviderDefinition = {
  id: ProviderId;
  name: string;
  endpoint: string;
  authHeader: "bearer" | "google-key";
  endpointHint: string;
  modelHint: string;
};

export const AI_PROVIDERS: ProviderDefinition[] = [
  { id: "groq", name: "Groq", endpoint: "https://api.groq.com/openai/v1", authHeader: "bearer", endpointHint: "https://api.groq.com/openai/v1", modelHint: "Provider dashboard မှ model ID ထည့်ပါ" },
  { id: "gemini", name: "Gemini", endpoint: "https://generativelanguage.googleapis.com/v1beta", authHeader: "google-key", endpointHint: "https://generativelanguage.googleapis.com/v1beta", modelHint: "ဥပမာ: gemini-2.5-flash" },
  { id: "cohere", name: "Cohere", endpoint: "https://api.cohere.com/v1", authHeader: "bearer", endpointHint: "https://api.cohere.com/v1", modelHint: "Provider dashboard မှ model ID ထည့်ပါ" },
  { id: "openrouter", name: "OpenRouter", endpoint: "https://openrouter.ai/api/v1", authHeader: "bearer", endpointHint: "https://openrouter.ai/api/v1", modelHint: "ဥပမာ: provider/model-name" },
  { id: "ollama-cloud", name: "Ollama Cloud", endpoint: "https://ollama.com/v1", authHeader: "bearer", endpointHint: "https://ollama.com/v1", modelHint: "Ollama Cloud ထဲရှိ model tag ထည့်ပါ" },
  { id: "custom", name: "Custom API", endpoint: "", authHeader: "bearer", endpointHint: "OpenAI-compatible HTTPS API base URL", modelHint: "သင့် API က လက်ခံသော model ID" },
];

export type AISettings = { providerId: ProviderId; model: string; endpoint: string };

export const DEFAULT_AI_SETTINGS: AISettings = { providerId: "groq", model: "", endpoint: AI_PROVIDERS[0].endpoint };
export const PROVIDER_SETTINGS_KEY = "giapkcreator.ai.preferences.v1";

export function getProvider(id: ProviderId): ProviderDefinition {
  return AI_PROVIDERS.find((provider) => provider.id === id) ?? AI_PROVIDERS[0];
}

export function getConnectionTestUrl(providerId: ProviderId, endpoint: string): string {
  const base = endpoint.trim().replace(/\/+$/, "");
  return base ? `${base}/models` : "";
}

export function isValidHttpUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
