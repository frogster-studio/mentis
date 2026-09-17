import Image from "next/image";

import styles from "./mentis.module.css";

const CATEGORIES = [
  { name: "history", style: styles.history, width: 480, height: 142 },
  { name: "art", style: styles.art, width: 488, height: 144 },
  { name: "science", style: styles.science, width: 492, height: 145 },
  { name: "nature", style: styles.nature, width: 480, height: 142 },
  { name: "sport", style: styles.sport, width: 488, height: 144 },
  { name: "geography", style: styles.geography, width: 588, height: 142 },
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
        width={572}
        height={620}
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
      <picture>
        <source
          type="image/webp"
          srcSet="/mentis/liberty.webp 490w, /mentis/liberty-735.webp 735w"
          sizes="(max-width: 480px) 45vw, (max-width: 760px) 201px, 245px"
        />
        <Image
          className={styles.liberty}
          src="/mentis/liberty.webp"
          alt=""
          width={224}
          height={372}
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
      </picture>
      {CATEGORIES.map(({ name, style, width, height }) => (
        <Image
          className={`${styles.categorySticker} ${style}`}
          key={name}
          src={`/mentis/${name}.svg`}
          alt=""
          width={width}
          height={height}
          unoptimized
        />
      ))}
    </div>
  );
}

export function CompetitionArt() {
  return (
    <div className={styles.competitionArt} aria-hidden="true">
      <picture>
        <source
          type="image/webp"
          srcSet="/mentis/summit.webp 688w, /mentis/summit-1024.webp 1024w, /mentis/summit-1536.webp 1536w"
          sizes="(max-width: 480px) 89vw, (max-width: 760px) 440px, (max-width: 1000px) 44vw, 512px"
        />
        <Image
          className={styles.summit}
          src="/mentis/summit.webp"
          alt=""
          width={430}
          height={452}
          loading="lazy"
          unoptimized
        />
      </picture>
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
