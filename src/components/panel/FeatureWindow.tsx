"use client";

import { type CSSProperties, useLayoutEffect, useRef } from "react";
import type { PanelFeature } from "@/data/panelFeatures";
import styles from "./FeatureWindow.module.css";
import { FeatureLive } from "./FeatureLive";
import { FeatureIcon } from "./FeatureIcon";

interface Props {
  feature: PanelFeature;
  onClose: () => void;
}

/**
 * Oyun envanteri penceresi gibi açılan özellik ekranı (doğal `<dialog>`).
 * Kişisel alanın gerçek araçlarını gösterir.
 */
export function FeatureWindow({ feature, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={`fw-title-${feature.id}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.window} style={{ "--feature": feature.color } as CSSProperties}>
        <header className={styles.head}>
          <span className={styles.icon} aria-hidden="true">
            <FeatureIcon id={feature.id} />
          </span>
          <div>
            <h2 id={`fw-title-${feature.id}`} className={styles.title}>
              {feature.title}
            </h2>
            <p className={styles.subtitle}>{feature.subtitle}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Pencereyi kapat">
            ✕
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.desc}>{feature.description}</p>
          <FeatureLive id={feature.id} />
        </div>
      </div>
    </dialog>
  );
}
