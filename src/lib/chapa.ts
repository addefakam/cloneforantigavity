/**
 * Chapa Payment Gateway Integration
 *
 * Handles payment initialization, verification, and webhook processing
 * for GHMS subscription payments via Chapa (Ethiopian payment gateway).
 *
 * Supported methods: Telebirr, CBE Birr, Amole, EBirr, HelloCash, Bank Cards
 */

const CHAPA_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.chapa.co/v1"
    : "https://api.chapa.co/v1"; // Chapa uses same URL for test & live; key determines mode

function getSecretKey(): string {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) throw new Error("CHAPA_SECRET_KEY is not configured");
  return key;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// ── Types ──

export interface ChapaInitRequest {
  amount: number;
  currency?: string; // defaults to "ETB"
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  webhook_url: string;
  custom_description?: string;
}

export interface ChapaInitResponse {
  status: string;
  message: string;
  data: {
    checkout_url: string;
    tx_ref: string;
  };
}

export interface ChapaVerifyResponse {
  status: string;
  message: string;
  data: {
    amount: number;
    currency: string;
    reference: string;
    tx_ref: string;
    status: "pending" | "success" | "failed";
    payment_method: string;
    paid_at?: string;
    customer: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
  };
}

export interface ChapaWebhookPayload {
  event: string;
  data: {
    id: string;
    tx_ref: string;
    amount: number;
    currency: string;
    status: string;
    reference: string;
    payment_method: string;
    paid_at: string;
    created_at: string;
    updated_at: string;
    customer: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
  };
}

/**
 * Generate a unique transaction reference for Chapa.
 * Format: ghms-sub-{subscriptionId}-{timestamp}
 */
export function generateTxRef(subscriptionId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ghms-sub-${subscriptionId.substring(0, 8)}-${timestamp}${random}`;
}

/**
 * Initialize a Chapa payment (redirect-based checkout).
 * Returns the checkout URL the user should be redirected to.
 */
export async function initializePayment(
  params: ChapaInitRequest
): Promise<ChapaInitResponse> {
  const secretKey = getSecretKey();

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || "ETB",
      email: params.email,
      first_name: params.first_name,
      last_name: params.last_name,
      phone_number: params.phone_number,
      tx_ref: params.tx_ref,
      callback_url: params.callback_url,
      return_url: params.return_url,
      webhook_url: params.webhook_url,
      custom_description: params.custom_description,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Chapa] Initialize failed:", response.status, errorBody);
    throw new Error(
      `Chapa payment initialization failed: ${response.status} - ${errorBody}`
    );
  }

  return response.json() as Promise<ChapaInitResponse>;
}

/**
 * Verify a Chapa transaction by its tx_ref.
 * Used by the webhook handler and for manual verification.
 */
export async function verifyPayment(
  txRef: string
): Promise<ChapaVerifyResponse> {
  const secretKey = getSecretKey();

  const response = await fetch(
    `${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Chapa] Verify failed:", response.status, errorBody);
    throw new Error(
      `Chapa payment verification failed: ${response.status} - ${errorBody}`
    );
  }

  return response.json() as Promise<ChapaVerifyResponse>;
}

/**
 * Build the callback/return URL for Chapa redirect after payment.
 */
export function getReturnUrl(subscriptionId: string): string {
  return `${getAppUrl()}/my-subscription?chapa=success&sub=${subscriptionId.substring(0, 8)}`;
}

/**
 * Build the webhook URL that Chapa will POST to after payment.
 */
export function getWebhookUrl(): string {
  return `${getAppUrl()}/api/chapa/webhook`;
}

/**
 * Extract subscription ID prefix from a Chapa tx_ref.
 * tx_ref format: ghms-sub-{subIdPrefix}-{timestamp}{random}
 */
export function extractSubscriptionIdPrefix(txRef: string): string | null {
  // Pattern: ghms-sub-XXXXXXXX-YYYYYY
  const match = txRef.match(/^ghms-sub-([a-f0-9]+)-/i);
  return match ? match[1] : null;
}
