import { ShieldCheck, ShieldAlert, Ban, SearchX, FileCheck, AlertTriangle } from "lucide-react";
import styles from "./VerdictStamp.module.css";

export type Verdict =
  | "AUTHENTIC"
  | "ALTERED"
  | "REVOKED"
  | "NOT_FOUND"
  | "AUTHENTIC_COPY"
  | "ALTERED_COPY"
  | "COPY_DEACTIVATED";

const COPY: Record<Verdict, { label: string; line: string; detail: string }> = {
  AUTHENTIC: {
    label: "Authentic",
    line: "The signature is valid and the record is unchanged since it was issued.",
    detail:
      "The cryptographic signature we stored when this credential was issued still matches the record byte-for-byte. Nobody has edited it.",
  },
  AUTHENTIC_COPY: {
    label: "Authentic Copy",
    line: "Valid application copy matched to issuer registry.",
    detail:
      "This certificate copy was generated for a designated recipient. The cryptographic signature matches the student's degree record byte-for-byte.",
  },
  ALTERED: {
    label: "Altered",
    line: "This record has been changed after it was signed. Do not rely on it.",
    detail:
      "When this credential was issued, a unique digital fingerprint (SHA-256 hash) was locked in. The current record no longer matches that fingerprint, which means at least one field was edited after signing.",
  },
  ALTERED_COPY: {
    label: "Altered Copy",
    line: "This application copy was intercepted and altered. Misuse alert logged.",
    detail:
      "Forensic trace detected: the underlying academic record has been forged. The origin of this altered copy has been traced to a specific recipient application, and both the graduate and institution have been alerted.",
  },
  REVOKED: {
    label: "Revoked",
    line: "The issuer has withdrawn this credential.",
    detail:
      "The institution that originally issued this credential has marked it as revoked. It may have been issued in error, the award may have been withdrawn, or fraud was detected.",
  },
  COPY_DEACTIVATED: {
    label: "Copy Deactivated",
    line: "This specific application link has been disabled by the graduate.",
    detail:
      "The student has deactivated this application-specific copy. Note: the graduate's genuine university qualification remains valid; only this individual application copy link is disabled.",
  },
  NOT_FOUND: {
    label: "Not found",
    line: "No credential with this ID exists. Check the code or ask the issuer.",
    detail:
      "We have no record of a credential with this identifier. It may have been mistyped, or the credential was never issued through this system.",
  },
};

const ICONS = {
  AUTHENTIC: ShieldCheck,
  AUTHENTIC_COPY: FileCheck,
  ALTERED: ShieldAlert,
  ALTERED_COPY: AlertTriangle,
  REVOKED: Ban,
  COPY_DEACTIVATED: Ban,
  NOT_FOUND: SearchX,
} as const;

export const VerdictStamp = ({
  status,
  className,
}: {
  status: Verdict;
  className?: string;
}) => {
  const Icon = ICONS[status];
  const copy = COPY[status];
  return (
    <div
      className={`${styles.stamp} ${styles[status]} ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <Icon size={40} strokeWidth={1.5} className={styles.icon} />
      <div>
        <div className={styles.label}>{copy.label}</div>
        <p className={styles.line}>{copy.line}</p>
        <p className={styles.detail}>{copy.detail}</p>
      </div>
    </div>
  );
};
