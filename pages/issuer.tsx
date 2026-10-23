import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  FilePlus2,
  Ban,
  ShieldAlert,
  ScrollText,
  AlertTriangle,
  Download,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Badge } from "../components/Badge";
import {
  useCredentialsList,
  useIssue,
  useRevoke,
  useTamper,
} from "../helpers/useCredentials";
import styles from "./issuer.module.css";

const REASONS = [
  { value: "ISSUED_IN_ERROR", label: "Issued in error" },
  { value: "AWARD_WITHDRAWN", label: "Award withdrawn" },
  { value: "FRAUD_FOUND", label: "Fraud found" },
  { value: "HOLDER_REQUEST", label: "Holder request" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

export default function IssuerPage() {
  const list = useCredentialsList();
  const issue = useIssue();
  const revoke = useRevoke();
  const tamper = useTamper();

  const [activeTab, setActiveTab] = useState<"credentials" | "investigations">(
    "credentials",
  );
  const [studentName, setStudentName] = useState("");
  const [programme, setProgramme] = useState("");
  const [award, setAward] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [reason, setReason] = useState<Reason>("ISSUED_IN_ERROR");
  const [lastId, setLastId] = useState<string | null>(null);

  const copies = list.data?.copies || [];
  const incidents = list.data?.misuseIncidents || [];

  const downloadForensicReport = () => {
    const lines = [
      "============================================================",
      "   CHETICHECK FORENSIC INVESTIGATION & MISUSE REPORT",
      "============================================================",
      `Generated: ${new Date().toISOString()}`,
      `Authority: DEMO INSTITUTION / Riara University Registry`,
      "",
      `TOTAL ISSUED CREDENTIALS: ${list.data?.credentials.length || 0}`,
      `TOTAL APPLICATION COPIES: ${copies.length}`,
      `ACTIVE MISUSE INCIDENTS : ${incidents.length}`,
      "",
      "------------------------------------------------------------",
      "SECTION 1: FLAGGED MISUSE & REUSED COPIES",
      "------------------------------------------------------------",
    ];

    if (incidents.length === 0) {
      lines.push("No misuse incidents recorded.");
    } else {
      incidents.forEach((inc, i) => {
        lines.push(`INCIDENT #${i + 1}`);
        lines.push(`  Timestamp     : ${new Date(inc.detectedAt).toLocaleString()}`);
        lines.push(`  Copy ID       : ${inc.copyId}`);
        lines.push(`  Root Credential: ${inc.credentialId}`);
        lines.push(`  Student Name  : ${inc.studentName}`);
        lines.push(`  Recipient Tag : ${inc.recipientName}`);
        lines.push(`  Status        : ${inc.status}`);
        lines.push("  Mismatches Detected:");
        inc.mismatches.forEach((m) => lines.push(`    - ${m}`));
        lines.push("");
      });
    }

    lines.push("------------------------------------------------------------");
    lines.push("SECTION 2: ALL REGISTERED APPLICATION COPIES");
    lines.push("------------------------------------------------------------");
    copies.forEach((c) => {
      lines.push(
        `* [${c.copyId}] Target: ${c.recipientName} (${c.purpose}) - Status: ${c.deactivatedAt ? "DEACTIVATED" : "ACTIVE"}`,
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cheti-forensic-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    issue.mutate(
      {
        studentName,
        programme,
        award,
        graduationYear: Number(year),
      },
      {
        onSuccess: (res) => {
          setLastId(res.credentialId);
          setStudentName("");
          setProgramme("");
          setAward("");
        },
      },
    );
  };

  const canSubmit =
    studentName.trim().length >= 2 &&
    programme.trim().length >= 2 &&
    award.trim().length >= 2 &&
    Number(year) >= 1990;

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Issuer portal | ChetiCheck</title>
      </Helmet>

      <header className={styles.head}>
        <p className={styles.eyebrow}>DEMO INSTITUTION</p>
        <h1 className={styles.title}>Issuer Portal & Investigation Center</h1>
        <p className={styles.sub}>
          Issue tamper-evident credentials, track recipient-specific
          application copies, and inspect forensic misuse alerts when shared
          copies are altered.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <Button
            variant={activeTab === "credentials" ? "primary" : "secondary"}
            onClick={() => setActiveTab("credentials")}
          >
            Credentials & Issuance
          </Button>
          <Button
            variant={activeTab === "investigations" ? "primary" : "secondary"}
            onClick={() => setActiveTab("investigations")}
          >
            Investigations & Misuse ({incidents.length})
          </Button>
        </div>
      </header>

      {activeTab === "investigations" ? (
        <section className={styles.card}>
          <div className={styles.listHead}>
            <div>
              <h2 className={styles.h2}>
                <AlertTriangle
                  size={20}
                  strokeWidth={1.6}
                  style={{ color: "var(--error)" }}
                />{" "}
                Forensic Investigations & Misuse Incidents
              </h2>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
                ChetiCheck traces altered documents back to the specific
                recipient application copy they originated from.
              </p>
            </div>
            <Button variant="outline" onClick={downloadForensicReport}>
              <Download size={16} /> Download Forensic Report
            </Button>
          </div>

          {incidents.length === 0 ? (
            <p style={{ color: "var(--muted-foreground)", padding: "1rem 0" }}>
              Zero active misuse alerts detected across university credentials.
            </p>
          ) : (
            <ul className={styles.rows}>
              {incidents.map((inc) => (
                <li
                  key={inc.id}
                  className={styles.row}
                  style={{ borderLeft: "4px solid var(--error)" }}
                >
                  <div className={styles.rowMain}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span className={styles.mono}>{inc.copyId}</span>
                      <Badge variant="destructive">Misuse Flagged</Badge>
                    </div>
                    <span className={styles.rowName}>
                      {inc.studentName} &middot; Target:{" "}
                      <strong>{inc.recipientName}</strong>
                    </span>
                    <div style={{ fontSize: "0.85rem", color: "var(--error)", marginTop: 4 }}>
                      {inc.mismatches.join(" | ")}
                    </div>
                    <span className={styles.rowMeta}>
                      Flagged on {new Date(inc.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.rowActions}>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/verify/${inc.copyId}`}>View In Verifier</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-family-display)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>
              Registered Application Copies ({copies.length})
            </h3>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.88rem", marginBottom: "1rem" }}>
              Every labeled copy created by graduates for external job applications.
            </p>
            <ul className={styles.rows}>
              {copies.map((c) => (
                <li key={c.copyId} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.mono}>{c.copyId}</span>
                    <span className={styles.rowName}>
                      Recipient: <strong>{c.recipientName}</strong> ({c.purpose})
                    </span>
                    <span className={styles.rowMeta}>
                      Created {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.rowActions}>
                    {c.deactivatedAt ? (
                      <Badge variant="warning">Deactivated</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/verify/${c.copyId}`}>Test</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.card}>
            <h2 className={styles.h2}>
              <FilePlus2 size={20} strokeWidth={1.6} /> Issue a credential
            </h2>
            <form className={styles.form} onSubmit={submit}>
              <label className={styles.field}>
                <span>Student name</span>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Wanjiku Kamau"
                  maxLength={120}
                />
              </label>
              <label className={styles.field}>
                <span>Award</span>
                <Input
                  value={award}
                  onChange={(e) => setAward(e.target.value)}
                  placeholder="e.g. Bachelor of Science"
                  maxLength={160}
                />
              </label>
              <label className={styles.field}>
                <span>Programme</span>
                <Input
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  placeholder="e.g. Computer Science"
                  maxLength={160}
                />
              </label>
              <label className={styles.field}>
                <span>Graduation year</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min={1990}
                  max={2100}
                />
              </label>
              <div className={styles.submitRow}>
                <Button type="submit" disabled={!canSubmit || issue.isPending}>
                  {issue.isPending ? "Signing..." : "Sign and issue"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStudentName("Grace Muthoni Kariuki");
                    setAward("Bachelor of Science");
                    setProgramme("Computer Science");
                    setYear("2026");
                  }}
                >
                  Fill demo certificate
                </Button>
                {issue.isError && (
                  <span className={styles.error}>
                    {issue.error instanceof Error
                      ? issue.error.message
                      : "Could not issue"}
                  </span>
                )}
              </div>
            </form>
            {lastId && (
              <div className={styles.success}>
                Issued <span className={styles.mono}>{lastId}</span>.{" "}
                <Link to={`/credential/${lastId}`}>
                  Open the graduate view and QR
                </Link>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.listHead}>
              <h2 className={styles.h2}>Issued credentials</h2>
              <div
                className={styles.reasons}
                role="group"
                aria-label="Revoke reason"
              >
                <span className={styles.reasonLabel}>Revoke reason</span>
                {REASONS.map((r) => (
                  <Button
                    key={r.value}
                    size="sm"
                    variant={reason === r.value ? "secondary" : "outline"}
                    onClick={() => setReason(r.value)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>

            {list.isFetching && !list.data ? (
              <div className={styles.skeleton} aria-label="Loading" />
            ) : list.isError ? (
              <p className={styles.error}>Could not load credentials.</p>
            ) : (
              <ul className={styles.rows}>
                {list.data?.credentials.map((c) => (
                  <li key={c.credentialId} className={styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.mono}>{c.credentialId}</span>
                      <span className={styles.rowName}>{c.studentName}</span>
                      <span className={styles.rowMeta}>
                        {c.award}, {c.programme}, {c.graduationYear}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      {c.revokedAt ? (
                        <Badge variant="warning">Revoked</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/credential/${c.credentialId}`}>View</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/verify/${c.credentialId}`}>Verify</Link>
                      </Button>
                      {!c.revokedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={revoke.isPending}
                          onClick={() =>
                            revoke.mutate({
                              credentialId: c.credentialId,
                              reason,
                            })
                          }
                        >
                          <Ban size={14} /> Revoke
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={tamper.isPending}
                        onClick={() =>
                          tamper.mutate({ credentialId: c.credentialId })
                        }
                        title="Demo only: edits the stored record without re-signing"
                      >
                        <ShieldAlert size={14} /> Tamper demo
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className={styles.fine}>
              Tamper demo edits the stored year without re-signing, so the
              verify page shows Altered. It is irreversible for that record.
            </p>
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>
              <ScrollText size={20} strokeWidth={1.6} /> Audit log
            </h2>
            <ul className={styles.audit}>
              {list.data?.audit.map((a) => (
                <li key={a.id}>
                  <span className={styles.auditEvent}>{a.event}</span>
                  <span className={styles.mono}>{a.credentialId}</span>
                  <span className={styles.auditTime}>
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

