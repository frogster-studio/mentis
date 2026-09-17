"use client";

import Image from "next/image";
import { useState } from "react";

import styles from "./mentis.module.css";

const ANSWERS = ["Le Cotopaxi", "L’Etna", "L’Ojos del Salado", "Le Kilimandjaro"];
const CORRECT_ANSWER = 2;

export function QuizDemo() {
  const [answer, setAnswer] = useState<number | null>(null);
  const answered = answer !== null;
  const correct = answer === CORRECT_ANSWER;

  return (
    <div className={styles.quiz}>
      <div className={styles.quizTopline}>
        <span>À toi de jouer</span>
        <span className={styles.smallBadge}>Démo sans chrono</span>
      </div>
      <fieldset>
        <legend>Quel est le plus haut volcan actif du monde ?</legend>
        <p className={styles.quizHint}>Mode Carré · Choisis une réponse.</p>
        <div className={styles.answers}>
          {ANSWERS.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={answer === index}
              aria-disabled={answered}
              className={`${styles.answer} ${answered && index === CORRECT_ANSWER ? styles.answerCorrect : ""} ${answer === index && !correct ? styles.answerWrong : ""}`}
              onClick={() => {
                if (!answered) setAnswer(index);
              }}
            >
              <span className={styles.answerLetter}>{String.fromCharCode(65 + index)}</span>
              {label}
              {answered && index === CORRECT_ANSWER && (
                <span className={styles.answerResult}>✓ Bonne réponse</span>
              )}
              {answer === index && !correct && (
                <span className={styles.answerResult}>× Ta réponse</span>
              )}
            </button>
          ))}
        </div>
      </fieldset>
      <div className={styles.feedback} aria-live="polite" aria-atomic="true">
        {answered ? (
          <>
            <Image
              src={`/mentis/${correct ? "correct" : "wink"}.webp`}
              alt=""
              width={60}
              height={90}
              unoptimized
            />
            <div>
              <p className={styles.feedbackTitle}>
                {correct ? "Bien joué ! +2 points en Carré." : "Raté… mais maintenant, tu le sais."}
              </p>
              <p>
                C’est l’Ojos del Salado, dans les Andes, à la frontière du Chili et de l’Argentine.
              </p>
              <a
                className={styles.source}
                href="https://volcano.si.edu/volcano.cfm?vn=355130"
                target="_blank"
                rel="noreferrer"
              >
                Source : Smithsonian (en anglais)
              </a>
            </div>
          </>
        ) : (
          <p>Une intuition ? Pas besoin de compte pour essayer.</p>
        )}
      </div>
    </div>
  );
}
