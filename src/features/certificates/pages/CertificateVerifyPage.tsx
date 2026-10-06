/**
 * Certificate Verification Page (Public)
 * Accessible via QR scan at /certificates/verify/:code
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { certificateService, CertificateRequest } from "../services/certificateService";
import { CheckCircle2, XCircle, Award, Shield, Calendar, MapPin, User, Hash, ExternalLink } from "lucide-react";

export function CertificateVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<CertificateRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    certificateService.verify(code).then((result) => {
      if (result) setCert(result);
      else setNotFound(true);
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [code]);

  const typeLabels: Record<string, string> = {
    participation: "OF PARTICIPATION", achievement: "OF ACHIEVEMENT", merit: "OF MERIT",
    excellence: "OF EXCELLENCE", winner: "— 1ST PLACE", runner_up: "— RUNNER UP", special: "OF SPECIAL RECOGNITION",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a0f 0%,#12082a 50%,#0a0a0f 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "inherit" }}>
      {loading ? (
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <p>Verifying certificate...</p>
        </div>
      ) : notFound ? (
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ width: 80, height: 80, borderRadius: 999, background: "#ef444422", border: "2px solid #ef444444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <XCircle size={40} color="#ef4444" />
          </div>
          <h1 style={{ color: "#f1f5f9", margin: "0 0 12px", fontSize: 24 }}>Certificate Not Found</h1>
          <p style={{ color: "#94a3b8", margin: "0 0 24px" }}>
            This certificate code is invalid, has been revoked, or does not exist in our records.
          </p>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
            <ExternalLink size={16} /> Go to Homepage
          </Link>
        </div>
      ) : cert ? (
        <div style={{ maxWidth: 680, width: "100%" }}>
          {/* Verified badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 999, background: "#10b98122", border: "2px solid #10b98144", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={26} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#10b981" }}>Certificate Verified</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>This is an authentic certificate issued by Coding Club, GMRIT DU</div>
            </div>
          </div>

          {/* Certificate card */}
          <div style={{ background: "linear-gradient(135deg,#1a1130,#12082a)", border: "1px solid #7c3aed44", borderRadius: 16, padding: 32, boxShadow: "0 20px 60px #00000088" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={24} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#f1f5f9" }}>CERTIFICATE</div>
                <div style={{ fontSize: 11, color: "#d97706", fontWeight: 700, letterSpacing: "0.2em" }}>{typeLabels[cert.certificateType] || cert.certificateType.toUpperCase()}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                {cert.certificateNumber && <div style={{ fontFamily: "monospace", fontSize: 13, color: "#64748b" }}>{cert.certificateNumber}</div>}
                <div style={{ fontSize: 11, color: "#64748b" }}>Issued {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("en-IN") : "—"}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { icon: <User size={16} />, label: "Recipient", value: cert.recipientName },
                { icon: <Hash size={16} />, label: "College ID", value: cert.recipientCollegeId || "—" },
                { icon: <Award size={16} />, label: "Event", value: cert.eventName },
                { icon: <Calendar size={16} />, label: "Date", value: cert.eventDate ? new Date(cert.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                { icon: <MapPin size={16} />, label: "Venue", value: cert.eventVenue },
                { icon: <Shield size={16} />, label: "Issued By", value: "Coding Club, GMRIT DU" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#ffffff06", border: "1px solid #ffffff0d", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#a78bfa" }}>{item.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{item.label}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 14 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {cert.achievementText && (
              <div style={{ marginTop: 20, padding: "14px 20px", background: "#7c3aed11", border: "1px solid #7c3aed44", borderRadius: 10, color: "#c4b5fd", fontSize: 14, fontStyle: "italic", textAlign: "center" }}>
                "{cert.achievementText}"
              </div>
            )}

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #ffffff0d", display: "flex", gap: 16, justifyContent: "space-between", flexWrap: "wrap" as const }}>
              {[
                { label: "Faculty Coordinator", value: cert.facultyCoordinatorName },
                { label: "Student Coordinator", value: cert.studentCoordinatorName },
                { label: "Authorized Signatory", value: cert.authorizedSignatoryName },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ borderTop: "1px solid #ffffff2a", paddingTop: 8, minWidth: 140 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#64748b", fontWeight: 600, textTransform: "uppercase" as const }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{s.value || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#475569" }}>
            Verification Code: <span style={{ fontFamily: "monospace", color: "#64748b" }}>{code}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
