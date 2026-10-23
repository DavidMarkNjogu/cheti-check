import { Link, NavLink } from "react-router-dom";
import { Stamp } from "lucide-react";
import styles from "./AppShell.module.css";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <Stamp size={22} strokeWidth={1.6} />
          <span className={styles.brandName}>ChetiCheck</span>
        </Link>
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            Verify
          </NavLink>
          <NavLink
            to="/wallet"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            Graduate wallet
          </NavLink>
          <NavLink
            to="/issuer"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            Issuer portal
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        Demo build for the Riara Design Thinking Hackathon. Every record here is
        invented and labelled DEMO INSTITUTION. No real student data is used.
      </footer>
    </div>
  );
};
