import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FileCheck2, FileX2, Upload } from "lucide-react";
import { VerdictStamp } from "../components/VerdictStamp";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useVerify } from "../helpers/useCredentials";
import { sha256Hex } from "../helpers/sha256Text";
import styles from "./verify.$credentialId.module.css";

export default function VerifyPage() {
  const { credentialId = "" } = useParams();
  const [fileHash, setFileHash] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | null>(null);
  const q = useVerify(credentialId, fileHash);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof parsed.canonicalText === "string") {
        const buffer = await new Blob([parsed.canonicalText]).arrayBuffer();
        setFileHash(await sha256Hex(buffer));
        return;
      }
    } catch {
      // Non-JSON file, fall through to raw binary arrayBuffer hashing
    }
    setFileHash(await sha256Hex(await file.arrayBuffer()));
  };

  const data = q.data;

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Verification result | ChetiCheck</title>
      </Helmet>

      <p className={styles.idLine}>
        Checking credential{" "}
        <span className={styles.mono}>{credentialId}</span>
      </p>

      {q.isFetching && !data ? (
        <div className={styles.skeleton} aria-label="Checking" />
      ) : q.isError ? (
        <p className={styles.error}>
          Could not complete the check:{" "}
          {q.error instanceof Error ? q.error.message : "unknown error"}
        </p>
      ) : data ? (
        <>
          <VerdictStamp status={data.status} />

          {data.record && (
            <dl className={styles.record}>
              <div>
                <dt>Name</dt>
                <dd className={styles.name}>{data.record.studentName}</dd>
              </div>
              <div>
                <dt>Institution</dt>
                <dd>{data.record.institution}</dd>
              </div>
              <div>
                <dt>Award</dt>
                <dd>{data.record.award}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{data.record.graduationYear}</dd>
              </div>
              {data.status === "REVOKED" && data.revokedAt && (
                <div>
                  <dt>Revoked on</dt>
                  <dd>{new Date(data.revokedAt).toLocaleDateString()}</dd>
                </div>
              )}
              <div>
                <dt>Checked at</dt>
                <dd>{new Date(data.checkedAt).toLocaleString()}</dd>
              </div>
            </dl>
          )}

          {data.record && (
            <p className={styles.compare}>
              Compare the name above with the document in your hand. A genuine
              QR code copied onto a forged paper would still show the real
              holder&apos;s details.
            </p>
          )}

          {data.record && (
            <section className={styles.fileCheck}>
              <h2 className={styles.h2}>Optional: check a file</h2>
              <p className={styles.fileHelp}>
                If the holder gave you the issued credential file, upload it. If
                it differs from what the issuer recorded by even one character,
                the result becomes Altered.
              </p>
              <label className={styles.upload}>
                <Upload size={18} strokeWidth={1.6} />
                <span>{fileName ?? "Choose issued file (.cheti.json or .txt)"}</span>
                <Input
                  type="file"
                  onChange={onFile}
                  className={styles.fileInput}
                />
              </label>
              {data.fileCheck === "MATCH" && (
                <p className={`${styles.fileResult} ${styles.ok}`}>
                  <FileCheck2 size={18} /> Cryptographic SHA-256 digest matched issued record.
                </p>
              )}
              {data.fileCheck === "MISMATCH" && (
                <p className={`${styles.fileResult} ${styles.bad}`}>
                  <FileX2 size={18} /> Cryptographic hash mismatch: document altered or corrupted.
                </p>
              )}
            </section>
          )}

          <div className={styles.actions}>
            <Button asChild variant="outline">
              <Link to="/">Check another</Link>
            </Button>
            {data.record && (
              <Button asChild variant="ghost">
                <Link to={`/credential/${credentialId}`}>Holder view</Link>
              </Button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
