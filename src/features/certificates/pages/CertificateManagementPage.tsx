/**
 * Certificate Management Page
 * Coordinator: create, edit draft, submit for approval
 * Admin: view all, approve, reject, issue, revoke
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/features/auth";
import {
  certificateService,
  CertificateRequest,
  CertType,
} from "../services/certificateService";
import {
  Award, Plus, Search, Eye, Edit3, Trash2, Send, CheckCircle2, XCircle,
  FileText, AlertCircle, X, Sparkles, Calendar, User,
  PenLine, Badge, RotateCcw,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    draft:            { label: "Draft",          color: "#6b7280" },
    pending_approval: { label: "Pending Review", color: "#f59e0b" },
    approved:         { label: "Approved",       color: "#8b5cf6" },
    issued:           { label: "Issued",         color: "#10b981" },
    rejected:         { label: "Rejected",       color: "#ef4444" },
    revoked:          { label: "Revoked",        color: "#dc2626" },
  };
  const c = cfg[status] || { label: status, color: "#6b7280" };
  return (
    <span style={{
      background: c.color + "22", color: c.color,
      border: `1px solid ${c.color}44`,
      padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
    }}>{c.label}</span>
  );
}

function CertificatePreview({ form }: { form: Partial<CertificateRequest> }) {
  const typeLabels: Record<string, string> = {
    participation: "OF PARTICIPATION",
    achievement:   "OF ACHIEVEMENT",
    merit:         "OF MERIT",
    excellence:    "OF EXCELLENCE",
    winner:        "— 1ST PLACE",
    runner_up:     "— RUNNER UP",
    special:       "OF SPECIAL RECOGNITION",
  };
  const label = typeLabels[form.certificateType || "participation"] || "OF PARTICIPATION";
  const fmtDate = form.eventDate
    ? new Date(form.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "_____________";

  return (
    <div style={{
      width: "100%", aspectRatio: "1.414 / 1",
      background: "linear-gradient(135deg, #fafafa 0%, #f3f0ff 60%, #fff8e7 100%)",
      borderRadius: 8, position: "relative", overflow: "hidden",
      fontFamily: "'Georgia', serif",
      boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      border: "4px solid #d97706",
    }}>
      {/* Inner border */}
      <div style={{ position: "absolute", inset: 10, border: "1px solid #7c3aed44", borderRadius: 4, pointerEvents: "none" }} />

      {/* BG gradient */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, #7c3aed08 0%, transparent 60%), radial-gradient(circle at 80% 50%, #d9770608 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Corner accents */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 50, height: 50, background: "linear-gradient(135deg, #7c3aed44, transparent)", borderRadius: "0 0 50px 0" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 50, height: 50, background: "linear-gradient(225deg, #d9770644, transparent)", borderRadius: "0 0 0 50px" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 50, height: 50, background: "linear-gradient(45deg, #d9770644, transparent)", borderRadius: "0 50px 0 0" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 50, height: 50, background: "linear-gradient(315deg, #7c3aed44, transparent)", borderRadius: "50px 0 0 0" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", padding: "4% 6%" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2%" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 900, fontFamily: "monospace", boxShadow: "0 4px 12px #7c3aed44" }}>{"</>"}</div>
            <div style={{ textAlign: "center", marginTop: 3 }}>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", color: "#7c3aed", fontFamily: "sans-serif" }}>CODING CLUB</div>
              <div style={{ fontSize: 6, color: "#6b7280", letterSpacing: "0.08em", fontFamily: "sans-serif" }}>GMRIT DEEMED TO BE UNIVERSITY</div>
              <div style={{ fontSize: 5.5, color: "#9ca3af", letterSpacing: "0.1em", fontFamily: "sans-serif" }}>LEARN · BUILD · COMPETE · GROW</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 900, fontFamily: "sans-serif", textAlign: "center", boxShadow: "0 4px 12px #1e3a8a44" }}>GMRIT</div>
            <div style={{ textAlign: "center", marginTop: 3 }}>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", color: "#1e3a8a", fontFamily: "sans-serif" }}>GMRIT</div>
              <div style={{ fontSize: 6, color: "#6b7280", fontFamily: "sans-serif" }}>DEEMED TO BE</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#1e3a8a", fontFamily: "sans-serif" }}>UNIVERSITY</div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "2%" }}>
          <div style={{ fontSize: "clamp(20px, 4.5vw, 38px)", fontWeight: 900, color: "#1e1b4b", letterSpacing: "0.06em", lineHeight: 1 }}>CERTIFICATE</div>
          <div style={{ fontSize: "clamp(8px, 1.2vw, 12px)", fontWeight: 700, color: "#d97706", letterSpacing: "0.3em", marginTop: "0.5%", fontFamily: "sans-serif" }}>{label}</div>
          <div style={{ width: 100, height: 2, background: "linear-gradient(90deg, transparent, #d97706, transparent)", margin: "1% auto 0" }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5%" }}>
          <p style={{ fontSize: "clamp(8px, 1.1vw, 12px)", color: "#374151", fontFamily: "sans-serif", margin: 0 }}>This is to certify that</p>
          <div style={{ borderBottom: "2px solid #d97706", padding: "0 30px 3px", minWidth: "45%" }}>
            <p style={{ fontSize: "clamp(12px, 2.2vw, 20px)", fontWeight: 700, color: "#1e1b4b", margin: 0 }}>{form.recipientName || "Recipient Name"}</p>
          </div>
          <p style={{ fontSize: "clamp(8px, 1.1vw, 12px)", color: "#374151", fontFamily: "sans-serif", margin: 0 }}>
            {form.achievementText ? form.achievementText : "has successfully participated in the"}
          </p>
          <div style={{ borderBottom: "1px solid #a78bfa", padding: "0 20px 2px", minWidth: "40%" }}>
            <p style={{ fontSize: "clamp(9px, 1.3vw, 13px)", fontWeight: 700, color: "#7c3aed", margin: 0 }}>{form.eventName || "Event Name"}</p>
          </div>
          <p style={{ fontSize: "clamp(7px, 1vw, 11px)", color: "#374151", fontFamily: "sans-serif", margin: 0, lineHeight: 1.6 }}>
            organized by the <strong>Coding Club, GMRIT Deemed to be University</strong>,<br />
            held on <span style={{ borderBottom: "1px solid #374151" }}>{fmtDate}</span> at <span style={{ borderBottom: "1px solid #374151" }}>{form.eventVenue || "___________"}</span>.
          </p>
          {form.customMessage && (
            <p style={{ fontSize: "clamp(6px, 0.9vw, 10px)", color: "#4b5563", fontStyle: "italic", margin: 0, maxWidth: "70%", fontFamily: "sans-serif" }}>{form.customMessage}</p>
          )}
        </div>

        {/* Signatories */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "1.5%" }}>
          {[
            { label: "DATE", value: form.eventDate ? new Date(form.eventDate).toLocaleDateString("en-IN") : "—", sub: "" },
            { label: "FACULTY COORDINATOR", value: form.facultyCoordinatorName || "—", sub: "CODING CLUB" },
            { label: "STUDENT COORDINATOR", value: form.studentCoordinatorName || "—", sub: "CODING CLUB" },
            { label: "AUTHORIZED SIGNATORY", value: form.authorizedSignatoryName || "—", sub: "GMRIT DU" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ borderTop: "1px solid #374151", paddingTop: 3, margin: "0 4px" }}>
                <div style={{ fontSize: 6, letterSpacing: "0.1em", color: "#374151", fontFamily: "sans-serif", fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 7, color: "#6b7280", fontFamily: "sans-serif", marginTop: 1 }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 5.5, color: "#9ca3af", fontFamily: "sans-serif" }}>{s.sub}</div>}
              </div>
            </div>
          ))}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 40, height: 40, background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 6, color: "#9ca3af", fontFamily: "sans-serif" }}>QR</div>
            <div style={{ fontSize: 5, color: "#9ca3af", fontFamily: "sans-serif", marginTop: 1 }}>CERT ID</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CERT_TYPES: { value: CertType; label: string }[] = [
  { value: "participation", label: "Participation" },
  { value: "achievement",   label: "Achievement" },
  { value: "merit",         label: "Merit" },
  { value: "excellence",    label: "Excellence" },
  { value: "winner",        label: "Winner — 1st Place" },
  { value: "runner_up",     label: "Runner Up" },
  { value: "special",       label: "Special Recognition" },
];

const EMPTY_FORM: Partial<CertificateRequest> = {
  recipientName: "",
  recipientEmail: "",
  recipientCollegeId: "",
  eventName: "",
  eventDate: "",
  eventVenue: "GMRIT Campus",
  certificateType: "participation",
  achievementText: "has successfully participated in the",
  customMessage: "We appreciate your enthusiasm, technical skills, and dedication in making this event a success.",
  facultyCoordinatorName: "",
  studentCoordinatorName: "",
  authorizedSignatoryName: "Principal, GMRIT DU",
};

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #ffffff0d" }}>
      <span style={{ color: "#a78bfa" }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 12, color: "#c4b5fd", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{title}</span>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, letterSpacing: "0.05em" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", background: "#ffffff0d", border: "1px solid #ffffff1a", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
    </div>
  );
}

export function CertificateManagementPage() {
  const { session, profile } = useAuth();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [modalNotice, setModalNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CertificateRequest["status"]>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<Partial<CertificateRequest>>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: string; type: "reject" | "revoke" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const isAdmin = profile?.role === "admin";
  const isCoordinator = profile?.role === "coordinator";
  const token = session?.access_token;

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = isAdmin
        ? await certificateService.getAll(token)
        : await certificateService.getMine(token);
      setRequests(data);
    } catch (e: any) { showNotice("error", e.message); }
    finally { setLoading(false); }
  }

  function showNotice(type: "success" | "error", msg: string) {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 5000);
  }

  function openCreate() {
    setEditingId(null); setForm(EMPTY_FORM); setModalNotice(null); setShowPreview(false); setIsFormOpen(true);
  }
  function openEdit(req: CertificateRequest) {
    setEditingId(req.id); setForm({ ...req }); setModalNotice(null); setShowPreview(false); setIsFormOpen(true);
  }
  function closeForm() {
    setIsFormOpen(false); setEditingId(null); setModalNotice(null); setShowPreview(false);
  }
  function setF(key: keyof CertificateRequest, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveDraft() {
    setSubmitting(true); setModalNotice(null);
    try {
      const payload = { ...form, requestedBy: session?.user.id || "", requestedByName: profile?.display_name || profile?.email || "Coordinator" };
      if (editingId) {
        await certificateService.update(editingId, payload, token);
        showNotice("success", "Draft updated.");
      } else {
        await certificateService.create(payload as any, token);
        showNotice("success", "Certificate request saved as draft.");
      }
      closeForm(); loadRequests();
    } catch (e: any) { setModalNotice({ type: "error", msg: e.message }); }
    finally { setSubmitting(false); }
  }

  async function handleSubmitForApproval() {
    setSubmitting(true); setModalNotice(null);
    try {
      let id = editingId;
      if (!id) {
        const payload = { ...form, requestedBy: session?.user.id || "", requestedByName: profile?.display_name || profile?.email || "Coordinator" };
        const created = await certificateService.create(payload as any, token);
        id = created.id;
      } else {
        await certificateService.update(id, form, token);
      }
      await certificateService.submit(id!, token);
      showNotice("success", "Certificate request submitted for admin approval.");
      closeForm(); loadRequests();
    } catch (e: any) { setModalNotice({ type: "error", msg: e.message }); }
    finally { setSubmitting(false); }
  }

  async function handleApprove(id: string) {
    try { await certificateService.approve(id, token); showNotice("success", "Approved."); loadRequests(); }
    catch (e: any) { showNotice("error", e.message); }
  }
  async function handleIssue(id: string) {
    try { await certificateService.issue(id, token); showNotice("success", "Certificate issued!"); loadRequests(); }
    catch (e: any) { showNotice("error", e.message); }
  }
  async function handleRejectOrRevoke() {
    if (!rejectModal) return;
    try {
      if (rejectModal.type === "reject") { await certificateService.reject(rejectModal.id, rejectReason, token); showNotice("success", "Request rejected."); }
      else { await certificateService.revoke(rejectModal.id, rejectReason, token); showNotice("success", "Certificate revoked."); }
      setRejectModal(null); setRejectReason(""); loadRequests();
    } catch (e: any) { showNotice("error", e.message); }
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    try { await certificateService.deleteRequest(id, token); showNotice("success", "Deleted."); loadRequests(); }
    catch (e: any) { showNotice("error", e.message); }
  }

  const filtered = requests.filter((r) => {
    const ms = !search || r.recipientName.toLowerCase().includes(search.toLowerCase()) || r.eventName.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "all" || r.status === statusFilter;
    return ms && mf;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base, #0a0a0f)", color: "#e2e8f0", fontFamily: "inherit", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={22} color="#fff" />
              </div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg, #c4b5fd, #fcd34d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Certificate Management
              </h1>
            </div>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
              {isAdmin ? "Review, approve, and issue certificates for Coding Club events" : "Create and submit certificate requests for admin approval"}
            </p>
          </div>
          {(isAdmin || isCoordinator) && (
            <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 15px #7c3aed44" }}>
              <Plus size={18} /> New Request
            </button>
          )}
        </div>

        {notice && (
          <div style={{ padding: "12px 20px", borderRadius: 10, marginBottom: 20, background: notice.type === "success" ? "#10b98122" : "#ef444422", border: `1px solid ${notice.type === "success" ? "#10b981" : "#ef4444"}44`, color: notice.type === "success" ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: 10 }}>
            {notice.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {notice.msg}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" as const }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by recipient or event..." style={{ width: "100%", padding: "10px 14px 10px 40px", background: "#ffffff0d", border: "1px solid #ffffff1a", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} style={{ padding: "10px 14px", background: "#ffffff0d", border: "1px solid #ffffff1a", borderRadius: 8, color: "#e2e8f0", fontSize: 14, cursor: "pointer", outline: "none" }}>
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="issued">Issued</option>
            <option value="rejected">Rejected</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            Loading certificate requests...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#64748b" }}>
            <Award size={48} color="#374151" style={{ margin: "0 auto 16px", display: "block" }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: "#475569", margin: "0 0 8px" }}>No certificate requests found</p>
            <p style={{ fontSize: 14, margin: 0 }}>
              {(isAdmin || isCoordinator) ? 'Click "New Request" to create your first certificate request.' : "No certificates issued yet."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((req) => (
              <div key={req.id}
                style={{ background: "#ffffff08", border: "1px solid #ffffff12", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, transition: "background 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff10")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff08")}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: req.status === "issued" ? "linear-gradient(135deg,#10b981,#059669)" : req.status === "rejected" || req.status === "revoked" ? "linear-gradient(135deg,#ef4444,#dc2626)" : req.status === "pending_approval" ? "linear-gradient(135deg,#f59e0b,#d97706)" : req.status === "approved" ? "linear-gradient(135deg,#8b5cf6,#7c3aed)" : "linear-gradient(135deg,#374151,#4b5563)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Award size={22} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" as const }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{req.recipientName}</span>
                    <StatusBadge status={req.status} />
                    {req.certificateNumber && <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{req.certificateNumber}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#94a3b8", flexWrap: "wrap" as const }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {req.eventName}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Badge size={12} /> {CERT_TYPES.find((t) => t.value === req.certificateType)?.label || req.certificateType}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={12} /> {req.requestedByName}</span>
                    {req.rejectionReason && <span style={{ color: "#f87171", display: "flex", alignItems: "center", gap: 4 }}><XCircle size={12} /> {req.rejectionReason}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" as const, justifyContent: "flex-end" }}>
                  {req.status === "draft" && (req.requestedBy === session?.user.id || isAdmin) && (
                    <button onClick={() => openEdit(req)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #ffffff1a", background: "#ffffff0d", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <Edit3 size={14} /> Edit
                    </button>
                  )}
                  {req.status === "draft" && (req.requestedBy === session?.user.id || isAdmin) && (
                    <button onClick={async () => { try { await certificateService.submit(req.id, token); showNotice("success", "Submitted for review."); loadRequests(); } catch (e: any) { showNotice("error", e.message); } }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                      <Send size={14} /> Submit
                    </button>
                  )}
                  {isAdmin && req.status === "pending_approval" && (
                    <button onClick={() => handleApprove(req.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  )}
                  {isAdmin && ["pending_approval", "approved"].includes(req.status) && (
                    <button onClick={() => { setRejectModal({ id: req.id, type: "reject" }); setRejectReason(""); }} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #ef444444", background: "#ef444411", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <XCircle size={14} /> Reject
                    </button>
                  )}
                  {isAdmin && req.status === "approved" && (
                    <button onClick={() => handleIssue(req.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                      <Sparkles size={14} /> Issue Certificate
                    </button>
                  )}
                  {isAdmin && req.status === "issued" && (
                    <button onClick={() => { setRejectModal({ id: req.id, type: "revoke" }); setRejectReason(""); }} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #dc262644", background: "#dc262611", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <RotateCcw size={14} /> Revoke
                    </button>
                  )}
                  {["draft", "rejected"].includes(req.status) && (req.requestedBy === session?.user.id || isAdmin) && (
                    <button onClick={() => handleDelete(req.id)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #ffffff0d", background: "transparent", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                  {req.status === "issued" && req.verificationCode && (
                    <a href={`/certificates/verify/${req.verificationCode}`} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #10b98144", background: "#10b98111", color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, textDecoration: "none" }}>
                      <Eye size={14} /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "20px 16px" }}>
          <div style={{ background: "#12121e", border: "1px solid #ffffff1a", borderRadius: 16, width: "100%", maxWidth: 1100, boxShadow: "0 25px 80px #00000088", marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid #ffffff0d" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Award size={20} color="#a78bfa" />
                <span style={{ fontWeight: 700, fontSize: 18, color: "#f1f5f9" }}>{editingId ? "Edit Certificate Request" : "New Certificate Request"}</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={() => setShowPreview(!showPreview)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #7c3aed44", background: "#7c3aed11", color: "#a78bfa", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <Eye size={14} /> {showPreview ? "Hide" : "Show"} Preview
                </button>
                <button onClick={closeForm} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #ffffff1a", background: "transparent", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {modalNotice && (
              <div style={{ margin: "16px 28px 0", padding: "12px 16px", borderRadius: 8, background: modalNotice.type === "success" ? "#10b98122" : "#ef444422", border: `1px solid ${modalNotice.type === "success" ? "#10b981" : "#ef4444"}44`, color: modalNotice.type === "success" ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                {modalNotice.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {modalNotice.msg}
              </div>
            )}

            <div style={{ display: "flex" }}>
              <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto", maxHeight: "80vh" }}>
                <SectionHeader icon={<User size={14} />} title="Recipient Details" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <FormField label="Recipient Full Name *" value={form.recipientName || ""} onChange={(v) => setF("recipientName", v)} placeholder="e.g. Ravi Kumar" />
                  <FormField label="Email Address" value={form.recipientEmail || ""} onChange={(v) => setF("recipientEmail", v)} placeholder="student@gmrit.edu.in" type="email" />
                  <FormField label="College ID" value={form.recipientCollegeId || ""} onChange={(v) => setF("recipientCollegeId", v)} placeholder="22MH1A0501" />
                </div>
                <SectionHeader icon={<Calendar size={14} />} title="Event Details" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <FormField label="Event Name *" value={form.eventName || ""} onChange={(v) => setF("eventName", v)} placeholder="Code Quest 2024" />
                  <FormField label="Event Date *" value={form.eventDate || ""} onChange={(v) => setF("eventDate", v)} type="date" />
                  <FormField label="Venue" value={form.eventVenue || ""} onChange={(v) => setF("eventVenue", v)} placeholder="GMRIT Campus" />
                </div>
                <SectionHeader icon={<Award size={14} />} title="Certificate Content" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, letterSpacing: "0.05em" }}>Certificate Type *</label>
                    <select value={form.certificateType || "participation"} onChange={(e) => setF("certificateType", e.target.value as CertType)} style={{ width: "100%", padding: "10px 14px", background: "#ffffff0d", border: "1px solid #ffffff1a", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none" }}>
                      {CERT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <FormField label="Achievement Text" value={form.achievementText || ""} onChange={(v) => setF("achievementText", v)} placeholder="has successfully participated in the" />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, letterSpacing: "0.05em" }}>Custom Message (optional)</label>
                    <textarea value={form.customMessage || ""} onChange={(e) => setF("customMessage", e.target.value)} rows={2} placeholder="We appreciate your enthusiasm..." style={{ width: "100%", padding: "10px 14px", background: "#ffffff0d", border: "1px solid #ffffff1a", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const }} />
                  </div>
                </div>
                <SectionHeader icon={<PenLine size={14} />} title="Signatories" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                  <FormField label="Faculty Coordinator" value={form.facultyCoordinatorName || ""} onChange={(v) => setF("facultyCoordinatorName", v)} placeholder="Dr. XYZ" />
                  <FormField label="Student Coordinator" value={form.studentCoordinatorName || ""} onChange={(v) => setF("studentCoordinatorName", v)} placeholder="Student Name" />
                  <FormField label="Authorized Signatory" value={form.authorizedSignatoryName || ""} onChange={(v) => setF("authorizedSignatoryName", v)} placeholder="Principal, GMRIT DU" />
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button onClick={closeForm} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #ffffff1a", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                  <button onClick={handleSaveDraft} disabled={submitting} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #ffffff2a", background: "#ffffff0d", color: "#e2e8f0", cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <FileText size={15} /> Save Draft
                  </button>
                  <button onClick={handleSubmitForApproval} disabled={submitting} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 15px #7c3aed44" }}>
                    <Send size={15} /> Submit for Approval
                  </button>
                </div>
              </div>
              {showPreview && (
                <div style={{ width: 440, borderLeft: "1px solid #ffffff0d", padding: "24px 20px", background: "#0d0d18", flexShrink: 0, overflowY: "auto" }}>
                  <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Live Preview</p>
                  <CertificatePreview form={form} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject / Revoke Modal */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#12121e", border: "1px solid #ffffff1a", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 25px 60px #00000088" }}>
            <h3 style={{ margin: "0 0 16px", color: "#f1f5f9", fontWeight: 700 }}>{rejectModal.type === "reject" ? "Reject Request" : "Revoke Certificate"}</h3>
            <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: 14 }}>Please provide a reason.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Enter reason..." style={{ width: "100%", padding: "10px 14px", background: "#ffffff0d", border: "1px solid #ffffff1a", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const, marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #ffffff1a", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleRejectOrRevoke} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
