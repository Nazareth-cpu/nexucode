/**
 * Nexus Code — Certificate Server Engine
 *
 * Lifecycle: DRAFT → PENDING_APPROVAL → APPROVED → ISSUED | REJECTED | REVOKED
 *
 * Roles:
 *   Coordinator: create, edit draft, submit, view own
 *   Admin:       view all, approve, reject, issue, revoke
 *   Student:     view own issued certs (read-only)
 */

import crypto from "crypto";

export type CertificateStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "issued"
  | "rejected"
  | "revoked";

export type CertificateType =
  | "participation"
  | "achievement"
  | "merit"
  | "excellence"
  | "winner"
  | "runner_up"
  | "special";

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
  certificateType: CertificateType;
  achievementText: string;
  customMessage?: string;
  facultyCoordinatorName: string;
  studentCoordinatorName: string;
  authorizedSignatoryName: string;
  status: CertificateStatus;
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

let certificateStore: CertificateRequest[] = [];
let _certSeq = 1;

function genCertNumber(): string {
  const year = new Date().getFullYear();
  return `CC-${year}-${String(_certSeq++).padStart(4, "0")}`;
}

export const certificateServerEngine = {
  getAllRequests(): CertificateRequest[] {
    return [...certificateStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getRequestsByCoordinator(userId: string): CertificateRequest[] {
    return certificateStore
      .filter((r) => r.requestedBy === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getIssuedForUser(userId: string, email?: string): CertificateRequest[] {
    return certificateStore.filter(
      (r) =>
        r.status === "issued" &&
        (r.recipientUserId === userId || (email && r.recipientEmail === email))
    );
  },

  getById(id: string): CertificateRequest | null {
    return certificateStore.find((r) => r.id === id) ?? null;
  },

  verifyByCode(code: string): CertificateRequest | null {
    return certificateStore.find(
      (r) => r.status === "issued" && r.verificationCode === code
    ) ?? null;
  },

  createRequest(
    payload: Omit<CertificateRequest, "id" | "status" | "createdAt" | "updatedAt" | "verificationCode" | "certificateNumber" | "issuedAt">,
    role: string
  ): { success: boolean; request?: CertificateRequest; error?: string } {
    if (!["coordinator", "admin"].includes(role)) {
      return { success: false, error: "Only coordinators and admins can create certificate requests." };
    }
    if (!payload.recipientName?.trim()) return { success: false, error: "Recipient name is required." };
    if (!payload.eventName?.trim()) return { success: false, error: "Event name is required." };
    if (!payload.eventDate) return { success: false, error: "Event date is required." };
    const now = new Date().toISOString();
    const req: CertificateRequest = { ...payload, id: crypto.randomUUID(), status: "draft", createdAt: now, updatedAt: now };
    certificateStore.push(req);
    return { success: true, request: req };
  },

  updateRequest(id: string, updates: Partial<CertificateRequest>, requestorId: string, role: string): { success: boolean; request?: CertificateRequest; error?: string } {
    const idx = certificateStore.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: "Not found." };
    const req = certificateStore[idx];
    if (role !== "admin" && req.requestedBy !== requestorId) return { success: false, error: "Not authorized." };
    if (req.status !== "draft") return { success: false, error: "Only drafts can be edited." };
    const now = new Date().toISOString();
    certificateStore[idx] = { ...req, ...updates, id: req.id, status: req.status, requestedBy: req.requestedBy, createdAt: req.createdAt, updatedAt: now };
    return { success: true, request: certificateStore[idx] };
  },

  submitForApproval(id: string, requestorId: string): { success: boolean; request?: CertificateRequest; error?: string } {
    const idx = certificateStore.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: "Not found." };
    const req = certificateStore[idx];
    if (req.requestedBy !== requestorId) return { success: false, error: "Not authorized." };
    if (req.status !== "draft") return { success: false, error: "Only drafts can be submitted." };
    const now = new Date().toISOString();
    certificateStore[idx] = { ...req, status: "pending_approval", updatedAt: now };
    return { success: true, request: certificateStore[idx] };
  },

  approveRequest(id: string, adminId: string, adminName: string): { success: boolean; request?: CertificateRequest; error?: string } {
    const idx = certificateStore.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: "Not found." };
    const req = certificateStore[idx];
    if (req.status !== "pending_approval") return { success: false, error: "Only pending requests can be approved." };
    const now = new Date().toISOString();
    certificateStore[idx] = { ...req, status: "approved", reviewedBy: adminId, reviewedByName: adminName, reviewedAt: now, updatedAt: now };
    return { success: true, request: certificateStore[idx] };
  },

  rejectRequest(id: string, adminId: string, adminName: string, reason: string): { success: boolean; request?: CertificateRequest; error?: string } {
    const idx = certificateStore.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: "Not found." };
    const req = certificateStore[idx];
    if (!["pending_approval", "approved"].includes(req.status)) return { success: false, error: "Cannot reject this request." };
    if (!reason?.trim()) return { success: false, error: "Rejection reason is required." };
    const now = new Date().toISOString();
    certificateStore[idx] = { ...req, status: "rejected", reviewedBy: adminId, reviewedByName: adminName, reviewedAt: now, rejectionReason: reason, updatedAt: now };
    return { success: true, request: certificateStore[idx] };
  },

  issueCertificate(id: string, adminId: string, adminName: string): { success: boolean; request?: CertificateRequest; error?: string } {
    const idx = certificateStore.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: "Not found." };
    const req = certificateStore[idx];
    if (req.status !== "approved") return { success: false, error: "Only approved certificates can be issued." };
    const now = new Date().toISOString();
    certificateStore[idx] = { ...req, status: "issued", issuedAt: now, verificationCode: crypto.randomUUID(), certificateNumber: genCertNumber(), reviewedBy: adminId, reviewedByName: adminName, updatedAt: now };
    return { success: true, request: certificateStore[idx] };
  },

  revokeCertificate(id: string, adminId: string, reason: string): { success: boolean; request?: CertificateRequest; error?: string } {
    const idx = certificateStore.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: "Not found." };
    const req = certificateStore[idx];
    if (req.status !== "issued") return { success: false, error: "Only issued certs can be revoked." };
    if (!reason?.trim()) return { success: false, error: "Revocation reason required." };
    const now = new Date().toISOString();
    certificateStore[idx] = { ...req, status: "revoked", rejectionReason: reason, reviewedBy: adminId, updatedAt: now };
    return { success: true, request: certificateStore[idx] };
  },

  deleteRequest(id: string, requestorId: string, role: string): { success: boolean; error?: string } {
    const idx = certificateStore.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: "Not found." };
    const req = certificateStore[idx];
    if (role !== "admin" && req.requestedBy !== requestorId) return { success: false, error: "Not authorized." };
    if (!["draft", "rejected"].includes(req.status)) return { success: false, error: "Only drafts or rejected requests can be deleted." };
    certificateStore.splice(idx, 1);
    return { success: true };
  },

  getStats() {
    const byStatus = certificateStore.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    return { total: certificateStore.length, byStatus };
  },
};
