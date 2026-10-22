import { ShieldCheck, ShieldAlert, Ban, SearchX } from "lucide-react";
import styles from "./VerdictStamp.module.css";

export type Verdict = "AUTHENTIC" | "ALTERED" | "REVOKED" | "NOT_FOUND";

const COPY: Record<Verdict, { label: string; line: string; detail: string }> = {
  AUTHENTIC: {
    label: "Authentic",
    line: "The signature is valid and the record is unchanged since it was issued.",
    detail:
      "The cryptographic signature we stored when this credential was issued still matches the record byte-for-byte. Nobody has edited it.",
  },
  ALTERED: {
    label: "Altered",
    line: "This record has been changed after it was signed. Do not rely on it.",
    detail:
      "When this credential was issued, a unique digital fingerprint (SHA-256 hash) was locked in. The current record no longer matches that fingerprint, which means at least one field was edited after signing.",
  },
  REVOKED: {
    label: "Revoked",
    line: "The issuer has withdrawn this credential.",
    detail:
      "The institution that originally issued this credential has marked it as revoked. It may have been issued in error, the award may have been withdrawn, or fraud was detected.",
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
  ALTERED: ShieldAlert,
  REVOKED: Ban,
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
