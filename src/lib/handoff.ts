type AssertionMessage = {
  type: "secret-tinder:assertion";
  version: 1;
  assertion: string;
};

export function isAssertionMessage(value: unknown): value is AssertionMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return message.type === "secret-tinder:assertion" && message.version === 1 &&
    typeof message.assertion === "string" && message.assertion.length <= 2000 &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(message.assertion);
}
