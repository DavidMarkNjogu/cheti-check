import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  Plus,
  Ban,
  Download,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import {
  useCredentialsList,
  useCopies,
  useCreateCopy,
  useDeactivateCopy,
  useMisuseAlerts,
} from "../helpers/useCredentials";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Badge } from "../components/Badge";
import styles from "./wallet.module.css";

export default function WalletPage() {
  const { data: listData, isLoading } = useCredentialsList();
  const createCopyMutation = useCreateCopy();
  const deactivateCopyMutation = useDeactivateCopy();

  const [recipientName, setRecipientName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Find Grace Muthoni Kariuki's credential or fallback to first credential
  const rootCredential =
    listData?.credentials.find((c) =>
      c.studentName.toLowerCase().includes("grace"),
    ) || listData?.credentials[0];

  const credentialId = rootCredential?.credentialId || "";

  const { data: copiesData } = useCopies(credentialId);
  const { data: alertsData } = useMisuseAlerts(credentialId);

  const copies = copiesData?.copies || [];
  const activeAlerts =
    alertsData?.incidents.filter((i) => i.status === "ACTIVE_ALERT") || [];

  const handleCreateCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialId || !recipientName.trim() || !purpose.trim()) return;

    await createCopyMutation.mutateAsync({
      credentialId,
      recipientName: recipientName.trim(),
      purpose: purpose.trim(),
    });

    setRecipientName("");
    setPurpose("");
  };

  const handleDeactivate = async (copyId: string) => {
    await deactivateCopyMutation.mutateAsync({ copyId });
  };

  const copyLink = (copyId: string) => {
    const url = `${window.location.origin}/verify/${copyId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(copyId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const downloadCopyBundle = (copy: any) => {
    const bundle = {
      format: "cheticheck.v1.copy",
      copy_id: copy.copyId,
      root_credential_id: copy.credentialId,
      recipient_name: copy.recipientName,
      purpose: copy.purpose,
      issued_at: copy.createdAt,
      student_name: rootCredential?.studentName,
      degree: rootCredential?.award,
      institution: rootCredential?.institution,
      verification_url: `${window.location.origin}/verify/${copy.copyId}`,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${copy.copyId}.cheti.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyPreset = (name: string, purp: string) => {
    setRecipientName(name);
    setPurpose(purp);
  };

  if (isLoading) {
    return (
      <div className={styles.walletContainer}>
        <p>Loading graduate wallet...</p>
      </div>
    );
  }

  return (
    <div className={styles.walletContainer}>
      <header className={styles.header}>
        <div className={styles.kicker}>
          Graduate Credential Wallet // Application Traceability
        </div>
        <h1 className={styles.title}>Graduate Certificate Wallet</h1>
        <p className={styles.subtitle}>
          Manage your sealed academic credentials and generate labeled,
          application-specific copies for individual employers. If an altered
          copy is uploaded anywhere, you receive an immediate alert and can
          deactivate that link without affecting your genuine qualification.
        </p>
      </header>

      {/* ACTIVE MISUSE ALERTS */}
      {activeAlerts.length > 0 && (
        <section className={styles.alertBanner}>
          <div className={styles.alertHeader}>
            <AlertTriangle size={24} />
            <span>Security Misuse Alert Detected</span>
          </div>
          {activeAlerts.map((alert) => (
            <div key={alert.id} className={styles.alertContent}>
              <p>
                <strong>Recipient Copy Compromised:</strong> An application
                copy originally issued to <strong>{alert.recipientName}</strong>{" "}
                (Copy ID: <code>{alert.copyId}</code>) was uploaded for
                verification with forged details on{" "}
                {new Date(alert.detectedAt).toLocaleDateString()} at{" "}
                {new Date(alert.detectedAt).toLocaleTimeString()}.
              </p>
              <ul style={{ margin: "0.5rem 0", paddingLeft: "1.25rem" }}>
                {alert.mismatches.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
              <div className={styles.alertActions}>
                <Button
                  variant="destructive"
                  onClick={() => handleDeactivate(alert.copyId)}
                  disabled={deactivateCopyMutation.isPending}
                >
                  <Ban size={16} /> Deactivate This Application Link
                </Button>
                <Link to={`/verify/${alert.copyId}`}>
                  <Button variant="secondary">
                    <ExternalLink size={16} /> View Verification Diagnostic
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ROOT CREDENTIAL CARD */}
      {rootCredential && (
        <section className={styles.credentialHero}>
          <div className={styles.heroTop}>
            <div>
              <div className={styles.kicker}>
                Root Institutional Credential
              </div>
              <h2 className={styles.studentName}>
                {rootCredential.studentName}
              </h2>
              <div className={styles.degreeTitle}>
                {rootCredential.award}
              </div>
              <div className={styles.metaText}>
                {rootCredential.institution} &middot; Class of{" "}
                {rootCredential.graduationYear}
              </div>
            </div>
            <div>
              <Badge variant="success">
                <ShieldCheck size={14} style={{ marginRight: 4 }} /> Root Sealed
              </Badge>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--muted-foreground)",
                marginBottom: 4,
              }}
            >
              Institutional Master Identifier & Fingerprint:
            </div>
            <div className={styles.hashBox}>
              ID: {rootCredential.credentialId} | Issued:{" "}
              {new Date(rootCredential.createdAt).toLocaleDateString()}
            </div>
          </div>
        </section>
      )}

      {/* GENERATE APPLICATION COPY FORM */}
      <section className={styles.generatorCard}>
        <h3 className={styles.sectionTitle}>
          Create Traceable Application Copy
        </h3>
        <p className={styles.sectionDesc}>
          Never share a generic certificate link. Create an individual copy
          labeled with the employer's name. Each copy gets a distinct QR code
          and unique ID so you know exactly which link was used.
        </p>

        <form onSubmit={handleCreateCopy}>
          <div className={styles.formGrid}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                Target Employer / Recipient
              </label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Safaricom PLC"
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                Application Purpose / Reference
              </label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Graduate Trainee 2026"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <span
              style={{
                fontSize: "0.82rem",
                color: "var(--muted-foreground)",
                marginRight: 8,
              }}
            >
              1-Click Demo Presets:
            </span>
            <div className={styles.quickPills}>
              <button
                type="button"
                className={styles.pillBtn}
                onClick={() =>
                  applyPreset(
                    "Safaricom PLC",
                    "Senior Software Engineer Position",
                  )
                }
              >
                Safaricom PLC
              </button>
              <button
                type="button"
                className={styles.pillBtn}
                onClick={() =>
                  applyPreset(
                    "KCB Bank Kenya",
                    "Cybersecurity Analyst Trainee",
                  )
                }
              >
                KCB Bank Kenya
              </button>
              <button
                type="button"
                className={styles.pillBtn}
                onClick={() =>
                  applyPreset(
                    "Kenya Revenue Authority",
                    "ICT Audit Specialist",
                  )
                }
              >
                Kenya Revenue Authority
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={createCopyMutation.isPending}
          >
            <Plus size={16} /> Generate Application Copy
          </Button>
        </form>
      </section>

      {/* COPIES LIST */}
      <section className={styles.copiesSection}>
        <h3 className={styles.sectionTitle}>
          Your Issued Application Copies ({copies.length})
        </h3>
        {copies.length === 0 ? (
          <p style={{ color: "var(--muted-foreground)" }}>
            No application copies created yet. Use the form above to generate
            your first labeled copy.
          </p>
        ) : (
          copies.map((copy) => {
            const isDeactivated = !!copy.deactivatedAt;
            return (
              <div
                key={copy.copyId}
                className={`${styles.copyCard} ${isDeactivated ? styles.deactivated : ""}`}
              >
                <div className={styles.copyHeader}>
                  <div className={styles.copyRecipient}>
                    {copy.recipientName}
                  </div>
                  <div>
                    {isDeactivated ? (
                      <Badge variant="warning">
                        <Ban size={12} style={{ marginRight: 4 }} /> Link
                        Deactivated
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <CheckCircle size={12} style={{ marginRight: 4 }} />{" "}
                        Active Share Link
                      </Badge>
                    )}
                  </div>
                </div>

                <div className={styles.copyMeta}>
                  <div>
                    <strong>Purpose:</strong> {copy.purpose}
                  </div>
                  <div>
                    <strong>Copy ID:</strong> <code>{copy.copyId}</code>
                  </div>
                  <div style={{ color: "var(--muted-foreground)" }}>
                    Generated on {new Date(copy.createdAt).toLocaleDateString()}
                    {isDeactivated &&
                      ` &middot; Deactivated on ${new Date(copy.deactivatedAt!).toLocaleDateString()}`}
                  </div>
                </div>

                <div className={styles.copyActions}>
                  <Button
                    variant="secondary"
                    onClick={() => copyLink(copy.copyId)}
                  >
                    <Copy size={14} />{" "}
                    {copiedId === copy.copyId ? "Copied!" : "Copy Verify Link"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => downloadCopyBundle(copy)}
                  >
                    <Download size={14} /> Download .cheti.json
                  </Button>
                  <Link to={`/verify/${copy.copyId}`}>
                    <Button variant="secondary">
                      <ExternalLink size={14} /> Test Verification
                    </Button>
                  </Link>
                  {!isDeactivated && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeactivate(copy.copyId)}
                      disabled={deactivateCopyMutation.isPending}
                    >
                      <Ban size={14} /> Deactivate Link
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
