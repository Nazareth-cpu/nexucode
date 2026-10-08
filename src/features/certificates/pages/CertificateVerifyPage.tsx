/**
 * Certificate Verification Page (Public)
 * Accessible via QR scan at /certificates/verify/:code
 *
 * Renders the actual certificate_template.png with all dynamic
 * fields overlaid at precise positions, exactly matching the
 * Elegant Purple-Gold Coding Certificate design.
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { certificateService, CertificateRequest } from "../services/certificateService";
import { CheckCircle2, XCircle, ExternalLink, Download } from "lucide-react";

/* ─────────────────────────────────────────────
   Certificate template overlay component
   Uses /public/certificate_template.png as the
   full background; every dynamic field is
   absolutely positioned over the correct zone.
───────────────────────────────────────────── */
function IssuedCertificate({ cert, verifyCode }: { cert: CertificateRequest; verifyCode: string }) {
  const typeLabels: Record<string, string> = {
    participation: "OF PARTICIPATION",
    achievement:   "OF ACHIEVEMENT",
    merit:         "OF MERIT",
    excellence:    "OF EXCELLENCE",
    winner:        "— 1ST PLACE",
    runner_up:     "— RUNNER UP",
    special:       "OF SPECIAL RECOGNITION",
  };
  const label = typeLabels[cert.certificateType] || "OF PARTICIPATION";

  const fmtDate = cert.eventDate
    ? new Date(cert.eventDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";
  const shortDate = cert.eventDate
    ? new Date(cert.eventDate).toLocaleDateString("en-IN")
    : "—";

  const verifyUrl = `${window.location.origin}/certificates/verify/${verifyCode}`;
  // QR code via Google Chart API — no extra dependency needed
  const qrSrc = `https://chart.googleapis.com/chart?cht=qr&chs=100x100&chl=${encodeURIComponent(verifyUrl)}&choe=UTF-8`;

  return (
    <div
      id="issued-certificate"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1414/1000",
        userSelect: "none",
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 16px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Template background ── */}
      <img
        src="/certificate_template.png"
        alt="Certificate"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "fill", display: "block",
        }}
      />

      {/* ── Certificate type subtitle (overlay only when NOT participation) ── */}
      {label !== "OF PARTICIPATION" && (
        <div style={{
          position: "absolute", top: "37.5%", left: "50%",
          transform: "translateX(-50%)",
          fontSize: "clamp(7px, 1.15vw, 14px)", fontWeight: 800,
          color: "#c9a227", letterSpacing: "0.25em",
          fontFamily: "'Georgia', serif", whiteSpace: "nowrap",
          background: "rgba(250,246,240,0.97)", padding: "1px 10px",
        }}>
          {label}
        </div>
      )}

      {/* ── Recipient name (first underline ~47%) ── */}
      <div style={{
        position: "absolute", top: "47%", left: "50%",
        transform: "translateX(-50%)",
        fontSize: "clamp(11px, 1.7vw, 22px)", fontWeight: 700,
        color: "#16115c", fontFamily: "'Georgia', serif",
        whiteSpace: "nowrap", maxWidth: "56%",
        textAlign: "center", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {cert.recipientName}
      </div>

      {/* ── Event name (second underline ~57.5%) ── */}
      <div style={{
        position: "absolute", top: "57.5%", left: "50%",
        transform: "translateX(-50%)",
        fontSize: "clamp(9px, 1.3vw, 16px)", fontWeight: 700,
        color: "#16115c", fontFamily: "'Georgia', serif",
        whiteSpace: "nowrap", maxWidth: "56%",
        textAlign: "center", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {cert.eventName}
      </div>

      {/* ── "held on" date (~70.5%) ── */}
      <div style={{
        position: "absolute", top: "70.5%", left: "33%",
        fontSize: "clamp(6px, 0.9vw, 11px)", fontWeight: 600,
        color: "#16115c", fontFamily: "sans-serif",
      }}>
        {fmtDate}
      </div>

      {/* ── "at" venue (~70.5%) ── */}
      <div style={{
        position: "absolute", top: "70.5%", left: "58%",
        fontSize: "clamp(6px, 0.9vw, 11px)", fontWeight: 600,
        color: "#16115c", fontFamily: "sans-serif",
      }}>
        {cert.eventVenue}
      </div>

      {/* ── Footer: Date value ── */}
      <div style={{
        position: "absolute", top: "82%", left: "10.5%",
        transform: "translateX(-50%)",
        fontSize: "clamp(5px, 0.65vw, 8px)", color: "#1a1060",
        fontFamily: "sans-serif", textAlign: "center", whiteSpace: "nowrap", fontWeight: 600,
      }}>
        {shortDate}
      </div>

      {/* ── Footer: Faculty Coordinator name ── */}
      <div style={{
        position: "absolute", top: "82%", left: "30%",
        transform: "translateX(-50%)",
        fontSize: "clamp(5px, 0.65vw, 8px)", color: "#1a1060",
        fontFamily: "sans-serif", textAlign: "center", whiteSpace: "nowrap", fontWeight: 600,
      }}>
        {cert.facultyCoordinatorName || "—"}
      </div>

      {/* ── Footer: Student Coordinator name ── */}
      <div style={{
        position: "absolute", top: "82%", left: "51%",
        transform: "translateX(-50%)",
        fontSize: "clamp(5px, 0.65vw, 8px)", color: "#1a1060",
        fontFamily: "sans-serif", textAlign: "center", whiteSpace: "nowrap", fontWeight: 600,
      }}>
        {cert.studentCoordinatorName || "—"}
      </div>

      {/* ── Footer: Authorized Signatory name ── */}
      <div style={{
        position: "absolute", top: "82%", left: "71%",
        transform: "translateX(-50%)",
        fontSize: "clamp(5px, 0.65vw, 8px)", color: "#1a1060",
        fontFamily: "sans-serif", textAlign: "center", whiteSpace: "nowrap", fontWeight: 600,
      }}>
        {cert.authorizedSignatoryName || "—"}
      </div>

      {/* ── QR code (bottom-right corner ~75% top, ~87% left) ── */}
      <img
        src={qrSrc}
        alt="Verification QR Code"
        style={{
          position: "absolute", top: "75%", right: "2.5%",
          width: "clamp(40px, 8%, 80px)", height: "auto",
          imageRendering: "pixelated",
        }}
      />

      {/* ── Certificate ID below QR ── */}
      <div style={{
        position: "absolute", top: "92%", right: "2.5%",
        fontSize: "clamp(3px, 0.45vw, 5.5px)", color: "#4b5563",
        fontFamily: "monospace", textAlign: "center",
        width: "clamp(40px, 8%, 80px)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {cert.certificateNumber}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page component
───────────────────────────────────────────── */
export function CertificateVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<CertificateRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    certificateService
      .verify(code)
      .then((result) => {
        if (result) setCert(result);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0a0a0f 0%,#12082a 50%,#0a0a0f 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "inherit",
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <p>Verifying certificate...</p>
        </div>
      ) : notFound ? (
        /* ── Not found ── */
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div
            style={{
              width: 80, height: 80, borderRadius: 999,
              background: "#ef444422", border: "2px solid #ef444444",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <XCircle size={40} color="#ef4444" />
          </div>
          <h1 style={{ color: "#f1f5f9", margin: "0 0 12px", fontSize: 24 }}>
            Certificate Not Found
          </h1>
          <p style={{ color: "#94a3b8", margin: "0 0 24px" }}>
            This certificate code is invalid, has been revoked, or does not
            exist in our records.
          </p>
          <Link
            to="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 8,
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
              color: "#fff", textDecoration: "none", fontWeight: 600,
            }}
          >
            <ExternalLink size={16} /> Go to Homepage
          </Link>
        </div>
      ) : cert ? (
        /* ── Verified certificate ── */
        <div style={{ width: "100%", maxWidth: 960 }}>

          {/* Verified badge */}
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 12, marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 48, height: 48, borderRadius: 999,
                background: "#10b98122", border: "2px solid #10b98144",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <CheckCircle2 size={26} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#10b981" }}>
                Certificate Verified
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                This is an authentic certificate issued by Coding Club, GMRIT DU
              </div>
            </div>
          </div>

          {/* The actual certificate */}
          <IssuedCertificate cert={cert} verifyCode={code!} />

          {/* Footer info row */}
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 20, flexWrap: "wrap", gap: 12,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
              Verification Code:{" "}
              <span style={{ fontFamily: "monospace", color: "#64748b" }}>{code}</span>
            </p>
            {cert.certificateNumber && (
              <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                Certificate No:{" "}
                <span style={{ fontFamily: "monospace", color: "#a78bfa" }}>
                  {cert.certificateNumber}
                </span>
              </p>
            )}
            <button
              onClick={() => window.print()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8, border: "1px solid #ffffff1a",
                background: "#ffffff0d", color: "#94a3b8", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
              }}
            >
              <Download size={14} /> Print / Save PDF
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
