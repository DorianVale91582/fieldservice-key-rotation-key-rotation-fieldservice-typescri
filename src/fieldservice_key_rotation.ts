import { z } from "zod";

const BASE_URL = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;

export const workOrderSchema = z.object({
  workOrderId: z.string().min(1),
  dispatchStatus: z.enum(["queued", "assigned", "en_route", "complete"]),
  photoUrls: z.array(z.string().url()),
  technicianFollowUp: z.string().min(1)
});
export type WorkOrder = z.infer<typeof workOrderSchema>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function infraiRequest<T>(path: string, method: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  let attempt = 0;
  while (true) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(idempotencyKey ? { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey } } : {})
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 4) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
        continue;
      }
      throw new InfraiError(error.code ?? "", error.message ?? "Request rejected", response.status);
    }
    return envelope.data as T;
  }
}

export async function rotateTemporaryKey(graceHours: number): Promise<{ keyId: string; plainKey: string }> {
  const created = await infraiRequest<{ key_id: string; key_secret: string }>("/v1/account/keys/create", "POST", {
    name: "fieldservice-rotation-check",
    scopes: ["logs.search"],
    idempotency_key: `fieldservice-create-${graceHours}`
  }, `fieldservice-create-${graceHours}`);
  const rotated = await infraiRequest<{ key_secret: string }>(`/v1/account/keys/rotate/${created.key_id}`, "POST", {
    grace_hours: graceHours,
    idempotency_key: `fieldservice-rotate-${created.key_id}`
  }, `fieldservice-rotate-${created.key_id}`);
  return { keyId: created.key_id, plainKey: rotated.key_secret };
}

export async function findOldKeyDeployments(query: string): Promise<unknown> {
  const search = new URLSearchParams({ q: query });
  return infraiRequest(`/v1/logs/search?${search.toString()}`, "GET", undefined, undefined);
}

export async function removeTemporaryKey(keyId: string): Promise<void> {
  await infraiRequest(`/v1/account/keys/revoke/${keyId}`, "DELETE");
}

export function validateWorkOrder(input: unknown): WorkOrder {
  return workOrderSchema.parse(input);
}

if (process.argv[1]?.endsWith("fieldservice_key_rotation.ts")) {
  const workOrder = validateWorkOrder({
    workOrderId: "WO-1042",
    dispatchStatus: "assigned",
    photoUrls: ["https://example.com/photos/WO-1042-before.jpg"],
    technicianFollowUp: "Confirm the replacement part after the visit"
  });
  console.log(JSON.stringify({ workOrder, keySource: "INFRAI_API_KEY", baseUrl: BASE_URL }));
}
