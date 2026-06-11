/* ================================================================
   Inline validation for the auth forms. Concrete error copy only —
   every message says what to do, not just "invalid".
   ================================================================ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailError(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your work email.";
  if (!EMAIL_RE.test(v)) {
    return "That doesn't look like an email — check for a typo, e.g. maya@ateliernorth.dk.";
  }
  return null;
}

export function passwordError(value: string): string | null {
  if (!value) return "Enter your password.";
  if (value.length < 8) {
    return `At least 8 characters — this one is ${value.length}.`;
  }
  return null;
}

export function requiredError(value: string, message: string): string | null {
  return value.trim() ? null : message;
}
