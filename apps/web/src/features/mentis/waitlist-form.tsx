"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import styles from "./mentis.module.css";
import { readTallyMessage } from "./tally-message";
import { TALLY_FORM_ID } from "./waitlist-config";

export function WaitlistForm() {
  const container = useRef<HTMLDivElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const frameUrl = `https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1#${attempt}`;

  useEffect(() => {
    if (!visible || !frameUrl) return;
    const timeout = window.setTimeout(() => setFailed(true), 15000);
    const onMessage = (event: MessageEvent) => {
      const message = readTallyMessage(event, iframe.current?.contentWindow ?? null);
      if (!message) return;
      window.clearTimeout(timeout);
      setLoaded(true);
      setFailed(false);
      if (message.submitted) setSubmitted(true);
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    };
  }, [visible, frameUrl]);

  useEffect(() => {
    if (submitted) confirmation.current?.focus();
  }, [submitted]);

  return (
    <div ref={container} className={styles.formPanel}>
      <h3>On garde le contact ?</h3>
      <p>
        Une candidature, puis un e-mail si tu es sélectionné. L’inscription ne garantit pas l’accès.
      </p>
      {submitted ? (
        <div ref={confirmation} className={styles.formStatus} role="status" tabIndex={-1}>
          <p>Ta candidature est bien reçue !</p>
          <p>
            Si tu es sélectionné, tu recevras par e-mail les instructions pour accéder à la bêta.
          </p>
        </div>
      ) : (
        <>
          <div role="status" aria-live="polite">
            {!loaded && !failed && <p className={styles.formStatus}>Chargement du formulaire…</p>}
            {failed && (
              <p className={styles.formStatus}>
                Le formulaire ne répond pas. Réessaie ou ouvre-le directement sur Tally ci-dessous.
              </p>
            )}
          </div>
          {visible && (
            <>
              <Script
                src="https://tally.so/widgets/embed.js"
                strategy="afterInteractive"
                onReady={() => {
                  const tally = (window as Window & { Tally?: { loadEmbeds: () => void } }).Tally;
                  tally?.loadEmbeds();
                }}
                key={`script-${attempt}`}
              />
              <iframe
                key={attempt}
                ref={iframe}
                className={styles.formFrame}
                src={frameUrl}
                title="Candidature à la bêta Mentis"
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
              />
            </>
          )}
          <noscript>
            Active JavaScript ou utilise le lien direct ci-dessous pour candidater.
          </noscript>
          <p className={styles.formFallback}>
            {failed && (
              <button
                type="button"
                onClick={() => {
                  setLoaded(false);
                  setFailed(false);
                  setAttempt((value) => value + 1);
                }}
              >
                Réessayer
              </button>
            )}
            <a href={`https://tally.so/r/${TALLY_FORM_ID}`} target="_blank" rel="noreferrer">
              Ouvrir le formulaire sur Tally
            </a>
          </p>
        </>
      )}
    </div>
  );
}
