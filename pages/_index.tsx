import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowRight, FilePen, QrCode, ShieldCheck, Lock } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Badge } from "../components/Badge";
import { useCredentialsList } from "../helpers/useCredentials";
import styles from "./_index.module.css";

const STEPS = [
  {
    icon: FilePen,
    title: "Issue",
    text: "The institution signs each credential with its private key and gets a QR code to print on the document.",
  },
  {
    icon: QrCode,
    title: "Scan",
    text: "An employer or admissions officer scans the QR with a phone camera. No account, no app.",
  },
  {
    icon: ShieldCheck,
    title: "Know",
    text: "The page shows one clear answer: authentic, altered, revoked or not found.",
  },
];

export default function HomePage() {
  const [id, setId] = useState("");
  const navigate = useNavigate();
  const list = useCredentialsList();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = id.trim().toUpperCase();
    if (clean) navigate(`/verify/${encodeURIComponent(clean)}`);
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>ChetiCheck: check a credential in seconds</title>
        <meta
          name="description"
          content="Scan a QR code to check whether an academic credential is authentic, altered or revoked, without access to the student's private records."
        />
      </Helmet>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Credential verification</p>
        <h1 className={styles.title}>
          Is this certificate real?
          <br />
          Know in seconds.
        </h1>
        <p className={styles.lede}>
          Scan the QR code on a credential, or type its ID. ChetiCheck checks
          the issuer&apos;s digital signature and tells you whether it is
          authentic, altered or revoked, without needing the student&apos;s
          private records.
        </p>
        <form className={styles.form} onSubmit={submit}>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Credential ID, for example CC-7KQ2M9XH4TRD"
            aria-label="Credential ID"
            className={styles.input}
            autoCapitalize="characters"
            autoComplete="off"
          />
          <Button type="submit" size="lg" disabled={!id.trim()}>
            Check
            <ArrowRight size={18} />
          </Button>
        </form>
      </section>

      <section className={styles.steps} aria-label="How it works">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum}>{i + 1}</span>
              <Icon size={20} strokeWidth={1.6} />
              <h2 className={styles.stepTitle}>{title}</h2>
            </div>
            <p className={styles.stepText}>{text}</p>
          </div>
        ))}
      </section>

      <section className={styles.demo}>
        <div className={styles.demoHead}>
          <h2 className={styles.sectionTitle}>Try a demo credential</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/issuer">Open issuer portal</Link>
          </Button>
        </div>
        {list.isFetching && !list.data ? (
          <div className={styles.skeleton} aria-label="Loading" />
        ) : list.isError ? (
          <p className={styles.error}>Could not load demo credentials.</p>
        ) : (
          <ul className={styles.demoList}>
            {list.data?.credentials.slice(0, 5).map((c) => (
              <li key={c.credentialId}>
                <Link
                  to={`/verify/${c.credentialId}`}
                  className={styles.demoItem}
                >
                  <span className={styles.demoId}>{c.credentialId}</span>
                  <span className={styles.demoName}>
                    {c.studentName}, {c.award}
                  </span>
                  {c.revokedAt ? (
                    <Badge variant="warning">Revoked</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.note}>
        <Lock size={18} strokeWidth={1.6} />
        <p>
          What this check does and does not prove: it confirms the record is
          unchanged since the issuer signed it, and whether it has been revoked.
          It cannot prove the issuer is accredited, or that the person holding
          the document is the named graduate. Always compare the name shown with
          the document in your hand.
        </p>
      </section>
    </div>
  );
}
