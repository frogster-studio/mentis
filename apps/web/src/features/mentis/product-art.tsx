import Image from "next/image";

import styles from "./mentis.module.css";

const CATEGORIES = [
  { name: "history", style: styles.history },
  { name: "art", style: styles.art },
  { name: "science", style: styles.science },
  { name: "nature", style: styles.nature },
  { name: "sport", style: styles.sport },
];

export function ProductArt() {
  return (
    <div className={styles.productArt} aria-hidden="true">
      <div className={styles.artBackdrop} />
      <div className={styles.questionPreview}>
        <div className={styles.previewTimer}>
          25<span>secondes</span>
        </div>
        <div className={styles.previewProgress} />
        <span className={styles.previewNumber}>Question 1 / 10</span>
        <p>Quel est le plus haut volcan actif du monde ?</p>
      </div>
      <Image
        className={styles.mountain}
        src="/mentis/mountain.webp"
        alt=""
        width={146}
        height={155}
        unoptimized
      />
      <Image
        className={styles.football}
        src="/mentis/football.webp"
        alt=""
        width={105}
        height={113}
        unoptimized
      />
      <Image
        className={styles.liberty}
        src="/mentis/liberty.webp"
        alt=""
        width={224}
        height={372}
        preload
        unoptimized
      />
      {CATEGORIES.map(({ name, style }) => (
        <Image
          className={`${styles.categorySticker} ${style}`}
          key={name}
          src={`/mentis/${name}.webp`}
          alt=""
          width={124}
          height={48}
          unoptimized
        />
      ))}
      <span className={styles.geography}>GÉOGRAPHIE</span>
      <span className={styles.artNote}>La curiosité est un bon début.</span>
    </div>
  );
}

export function CompetitionArt() {
  return (
    <div className={styles.competitionArt} aria-hidden="true">
      <Image
        className={styles.summit}
        src="/mentis/summit.webp"
        alt=""
        width={430}
        height={449}
        loading="lazy"
        unoptimized
      />
      <Image
        className={styles.crown}
        src="/mentis/crown.webp"
        alt=""
        width={76}
        height={70}
        loading="lazy"
        unoptimized
      />
      <span className={styles.competitionNote}>À chacun son sommet.</span>
    </div>
  );
}
