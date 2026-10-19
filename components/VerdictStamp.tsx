import { ShieldCheck, ShieldAlert, Ban, SearchX } from "lucide-react";
import styles from "./VerdictStamp.module.css";

export type Verdict = "AUTHENTIC" | "ALTERED" | "REVOKED" | "NOT_FOUND";

const COPY: Record<Verdict, { label: string; line: string }> = {
  AUTHENTIC: {
    label: "Authentic",
    line: "The signature is valid and the record is unchanged since it was issued.",
  },
  ALTERED: {
    label: "Altered",
    line: "This record or file does not match what the issuer signed. Do not rely on it.",
  },
  REVOKED: {
    label: "Revoked",
    line: "The issuer has withdrawn this credential.",
  },
  NOT_FOUND: {
    label: "Not found",
    line: "No credential with this ID exists. Check the code or ask the issuer.",
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
      </div>
    </div>
  );
};
