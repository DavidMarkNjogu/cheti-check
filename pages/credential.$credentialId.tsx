import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Copy, Download, Printer, Check } from "lucide-react";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { QrImage } from "../components/QrImage";
import { useHolder } from "../helpers/useCredentials";
import styles from "./credential.$credentialId.module.css";

export default function CredentialPage() {
  const { credentialId = "" } = useParams();
  const q = useHolder(credentialId);
  const [copied, setCopied] = useState(false);

  const verifyUrl = `${window.location.origin}/verify/${credentialId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    if (!q.data) return;
    const blob = new Blob([q.data.canonicalText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${credentialId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBundle = () => {
    if (!q.data) return;
    const bundle = {
      standard: "ChetiCheck.v1",
      credentialId: q.data.credentialId,
      studentName: q.data.studentName,
      institution: q.data.institution,
      programme: q.data.programme,
      award: q.data.award,
      graduationYear: q.data.graduationYear,
      recordHash: q.data.recordHash,
      canonicalText: q.data.canonicalText,
      issuedAt: q.data.issuedAt,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${credentialId}.cheti.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Your credential | ChetiCheck</title>
      </Helmet>

      {q.isFetching && !q.data ? (
        <div className={styles.skeleton} aria-label="Loading" />
      ) : q.isError ? (
        <p className={styles.error}>
          {q.error instanceof Error ? q.error.message : "Could not load"}
        </p>
      ) : q.data ? (
        <>
          <article className={styles.certificate}>
            <div className={styles.inner}>
              <p className={styles.issuer}>{q.data.institution}</p>
              <p className={styles.kicker}>Certificate of award</p>
              <h1 className={styles.name}>{q.data.studentName}</h1>
              <p className={styles.award}>
                {q.data.award} in {q.data.programme}
              </p>
              <p className={styles.year}>Class of {q.data.graduationYear}</p>

              <div className={styles.bottom}>
                <div>
                  <p className={styles.label}>Credential ID</p>
                  <p className={styles.id}>{q.data.credentialId}</p>
                  {q.data.revokedAt ? (
                    <Badge variant="warning">Revoked</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </div>
                <div className={styles.qr}>
                  <QrImage value={verifyUrl} size={120} />
                  <p className={styles.scan}>Scan to verify</p>
                </div>
              </div>
            </div>
          </article>

          <div className={styles.actions}>
            <Button onClick={copy} variant="outline">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Link copied" : "Copy share link"}
            </Button>
            <Button onClick={downloadBundle} variant="outline" title="Download cryptographically verifiable credential bundle">
              <Download size={16} />
              Download .cheti.json
            </Button>
            <Button onClick={download} variant="outline" title="Download canonical hash payload">
              <Download size={16} />
              Download raw .txt
            </Button>
            <Button onClick={() => window.print()} variant="outline">
              <Printer size={16} />
              Print
            </Button>
            <Button asChild variant="ghost">
              <Link to={`/verify/${credentialId}`}>Open verify page</Link>
            </Button>
          </div>

          <p className={styles.help}>
            Share the link or the QR code with an employer or admissions team.
            They see only your name, institution, award, year and status, never
            your transcript or ID numbers. The issued file lets a verifier
            confirm that a document matches what the institution signed.
          </p>
        </>
      ) : null}
    </div>
  );
}
