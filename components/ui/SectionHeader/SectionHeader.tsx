import type React from "react";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'display' | 'primary' | 'secondary' | 'muted';
}

export function SectionHeader({ 
  title, 
  description, 
  action,
  variant = 'primary' 
}: SectionHeaderProps) {
  return (
    <div className={`${styles.header} ${styles[`variant-${variant}`]}`}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

