import { useEffect, useState } from "react";
import QRCode from "qrcode";

export const QrImage = ({
  value,
  size = 180,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#1a2332", light: "#fbf8f1" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) return <div style={{ width: size, height: size }} />;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="QR code that opens the verification page"
      className={className}
    />
  );
};
