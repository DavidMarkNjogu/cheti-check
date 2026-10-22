import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FilePlus2, Ban, ShieldAlert, ScrollText } from "lucide-react";
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

  const [studentName, setStudentName] = useState("");
  const [programme, setProgramme] = useState("");
  const [award, setAward] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [reason, setReason] = useState<Reason>("ISSUED_IN_ERROR");
  const [lastId, setLastId] = useState<string | null>(null);

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
        <h1 className={styles.title}>Issuer portal</h1>
        <p className={styles.sub}>
          Create a credential, sign it with the institution key and hand the
          graduate a QR code. Demo build: the portal is open and uses invented
          records only.
        </p>
      </header>

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
            <Link to={`/credential/${lastId}`}>Open the graduate view and QR</Link>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.listHead}>
          <h2 className={styles.h2}>Issued credentials</h2>
          <div className={styles.reasons} role="group" aria-label="Revoke reason">
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
          Tamper demo edits the stored year without re-signing, so the verify
          page shows Altered. It is irreversible for that record.
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
    </div>
  );
}
