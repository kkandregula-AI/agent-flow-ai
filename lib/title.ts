export function deriveTitleFromPrompt(prompt: string) {
  if (!prompt) return 'AgentFlow Studio';
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  return cleaned.length > 60 ? `${cleaned.slice(0, 60)}…` : cleaned;
}