import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Phone validation ──
// Accepts international formats: +251912345678, +1 555-123-4567, etc.
// Allows spaces, dashes, dots, parentheses as visual separators.
// Minimum 7 digits, maximum 15 digits (E.164 standard).
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

export function isValidPhone(phone: string): boolean {
  if (!phone || !phone.trim()) return false;
  const cleaned = phone.replace(/[\s\-().]/g, "");
  // Must start with + or digit, 7-15 digits total
  if (!PHONE_REGEX.test(phone.trim())) return false;
  const digits = cleaned.replace(/^\+/, "");
  return digits.length >= 7 && digits.length <= 15;
}

// ── Email validation (RFC 5322 simplified) ──
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return true; // email is optional — only validate if provided
  return EMAIL_REGEX.test(email.trim());
}
