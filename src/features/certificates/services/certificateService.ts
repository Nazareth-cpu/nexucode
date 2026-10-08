/**
 * Certificate Client Service
 * Communicates with the server-side certificate API endpoints.
 */

import { getSupabaseClient } from "@/src/services/supabase";

async function resolveToken(token?: string): Promise<string | undefined> {
  if (token) return token;
  try {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    return data.session?.access_token || undefined;
  } catch {
    return undefined;
  }
}

async function authHeaders(token?: string): Promise<Record<string, string>> {
  const t = await resolveToken(token);
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

export type CertStatus = "draft" | "pending_approval" | "approved" | "issued" | "rejected" | "revoked";
export type CertType = "participation" | "achievement" | "merit" | "excellence" | "winner" | "runner_up" | "special";

export interface CertificateRequest {
  id: string;
  recipientName: string;
  recipientEmail: string;
  recipientCollegeId: string;
  recipientUserId?: string;
  eventId?: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  certificateType: CertType;
  achievementText: string;
  customMessage?: string;
  facultyCoordinatorName: string;
  studentCoordinatorName: string;
  authorizedSignatoryName: string;
  status: CertStatus;
  requestedBy: string;
  requestedByName: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  issuedAt?: string;
  verificationCode?: string;
  certificateNumber?: string;
}

export const certificateService = {
  async getAll(token?: string): Promise<CertificateRequest[]> {
    const res = await fetch("/api/certificates/all", { headers: await authHeaders(token) });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load certificates.");
    return res.json();
  },

  async getMine(token?: string): Promise<CertificateRequest[]> {
    const res = await fetch("/api/certificates/mine", { headers: await authHeaders(token) });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load certificates.");
    return res.json();
  },

  async getById(id: string, token?: string): Promise<CertificateRequest> {
    const res = await fetch(`/api/certificates/${id}`, { headers: await authHeaders(token) });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load certificate.");
    return res.json();
  },

  async verify(code: string): Promise<CertificateRequest | null> {
    const res = await fetch(`/api/certificates/verify/${code}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Verification failed.");
    return res.json();
  },

  async create(payload: Partial<CertificateRequest>, token?: string): Promise<CertificateRequest> {
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create request.");
    return data.request;
  },

  async update(id: string, updates: Partial<CertificateRequest>, token?: string): Promise<CertificateRequest> {
    const res = await fetch(`/api/certificates/${id}`, {
      method: "PATCH",
      headers: await authHeaders(token),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update.");
    return data.request;
  },

  async submit(id: string, token?: string): Promise<CertificateRequest> {
    const res = await fetch(`/api/certificates/${id}/submit`, {
      method: "POST",
      headers: await authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit.");
    return data.request;
  },

  async approve(id: string, token?: string): Promise<CertificateRequest> {
    const res = await fetch(`/api/certificates/${id}/approve`, {
      method: "POST",
      headers: await authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to approve.");
    return data.request;
  },

  async reject(id: string, reason: string, token?: string): Promise<CertificateRequest> {
    const res = await fetch(`/api/certificates/${id}/reject`, {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reject.");
    return data.request;
  },

  async issue(id: string, token?: string): Promise<CertificateRequest> {
    const res = await fetch(`/api/certificates/${id}/issue`, {
      method: "POST",
      headers: await authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to issue.");
    return data.request;
  },

  async revoke(id: string, reason: string, token?: string): Promise<CertificateRequest> {
    const res = await fetch(`/api/certificates/${id}/revoke`, {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to revoke.");
    return data.request;
  },

  async deleteRequest(id: string, token?: string): Promise<void> {
    const res = await fetch(`/api/certificates/${id}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete.");
    }
  },

  async getStats(token?: string): Promise<{ total: number; byStatus: Record<string, number> }> {
    const res = await fetch("/api/certificates/stats", { headers: await authHeaders(token) });
    if (!res.ok) throw new Error("Failed to load stats.");
    return res.json();
  },
};
