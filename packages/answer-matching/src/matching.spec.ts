import { UserAnswerMatchedViaEnum } from "@mentis/contracts/enums";
import { describe, expect, it } from "vitest";
import { judgeAnswer, type MatchableQuestion, matchAnswer } from "./matching";

function question(
  answer: string,
  aliases: string[] = [],
  misspellings: string[] = [],
): MatchableQuestion {
  return { answer, aliases, misspellings };
}

describe("matchAnswer — exact after normalization", () => {
  it("accepts the canonical answer verbatim", () => {
    expect(matchAnswer("Élysée", question("Élysée"))).toBe(true);
  });

  it("accepts case differences", () => {
    expect(matchAnswer("PARIS", question("Paris"))).toBe(true);
  });

  it("accepts missing accents", () => {
    expect(matchAnswer("elysee", question("Élysée"))).toBe(true);
  });

  it("accepts wrong accents", () => {
    expect(matchAnswer("élysèe", question("Élysée"))).toBe(true);
  });

  it("accepts a folded cedilla", () => {
    expect(matchAnswer("francois", question("François"))).toBe(true);
  });

  it("accepts the œ ligature in either direction", () => {
    expect(matchAnswer("oedipe", question("Œdipe"))).toBe(true);
    expect(matchAnswer("Œdipe", question("Oedipe"))).toBe(true);
  });

  it("accepts a stripped leading article", () => {
    expect(matchAnswer("la Seine", question("Seine"))).toBe(true);
    expect(matchAnswer("Seine", question("La Seine"))).toBe(true);
  });

  it("accepts an elided article, typographic apostrophe included", () => {
    expect(matchAnswer("l'Élysée", question("Élysée"))).toBe(true);
    expect(matchAnswer("l’Élysée", question("Élysée"))).toBe(true);
  });

  it("accepts « un/une/des » as leading articles", () => {
    expect(matchAnswer("un ornithorynque", question("Ornithorynque"))).toBe(true);
    expect(matchAnswer("une hermine", question("Hermine"))).toBe(true);
    expect(matchAnswer("des dolmens", question("Dolmens"))).toBe(true);
  });

  it("accepts hyphen variants", () => {
    expect(matchAnswer("Jean Jacques Rousseau", question("Jean-Jacques Rousseau"))).toBe(true);
  });

  it("accepts apostrophe variants", () => {
    expect(matchAnswer("Cote d Ivoire", question("Côte d'Ivoire"))).toBe(true);
  });

  it("accepts stray punctuation and collapsed whitespace", () => {
    expect(matchAnswer("  victor   hugo !", question("Victor Hugo"))).toBe(true);
  });

  it("keeps a single-word answer that looks like an article", () => {
    expect(matchAnswer("dés", question("Dés"))).toBe(true);
  });
});

describe("matchAnswer — aliases", () => {
  const etatsUnis = question("États-Unis", ["USA", "Amérique"]);

  it("accepts an alias exactly", () => {
    expect(matchAnswer("USA", etatsUnis)).toBe(true);
  });

  it("accepts an alias after normalization", () => {
    expect(matchAnswer("l'amérique", etatsUnis)).toBe(true);
  });

  it("accepts a typo within tolerance of an alias", () => {
    expect(matchAnswer("amerqiue", etatsUnis)).toBe(true);
  });

  it("rejects fuzz on a ≤3-char alias", () => {
    expect(matchAnswer("usaa", etatsUnis)).toBe(false);
  });
});

describe("matchAnswer — misspellings (exact only)", () => {
  const chrysantheme = question("Chrysanthème", [], ["krisantème"]);

  it("accepts a curated misspelling exactly", () => {
    expect(matchAnswer("krisantème", chrysantheme)).toBe(true);
  });

  it("accepts a curated misspelling after normalization", () => {
    expect(matchAnswer("KRISANTEME", chrysantheme)).toBe(true);
  });

  it("rejects a typo of a misspelling — no fuzzy from the misspellings list", () => {
    expect(matchAnswer("krisantem", chrysantheme)).toBe(false);
  });

  it("still tolerates a typo of the canonical answer itself", () => {
    expect(matchAnswer("chrysanteme", chrysantheme)).toBe(true);
  });
});

describe("matchAnswer — typo tolerance tiers", () => {
  it("≤ 3 chars: exact only", () => {
    expect(matchAnswer("or", question("Or"))).toBe(true);
    expect(matchAnswer("ors", question("Or"))).toBe(false);
  });

  it("≤ 3 chars: the shorter side decides the tier", () => {
    expect(matchAnswer("rin", question("Rhin"))).toBe(false);
  });

  it("4–6 chars: 1 edit accepted", () => {
    expect(matchAnswer("seyne", question("Seine"))).toBe(true);
    expect(matchAnswer("Zolla", question("Zola"))).toBe(true);
  });

  it("4–6 chars: 2 edits rejected", () => {
    expect(matchAnswer("sceyne", question("Seine"))).toBe(false);
  });

  it("4–6 chars: a transposition counts as 2 edits and is rejected", () => {
    expect(matchAnswer("siene", question("Seine"))).toBe(false);
  });

  it("7–10 chars: 2 edits accepted", () => {
    expect(matchAnswer("maliera", question("Molière"))).toBe(true);
    expect(matchAnswer("moilere", question("Molière"))).toBe(true);
  });

  it("7–10 chars: 3 edits rejected", () => {
    expect(matchAnswer("malyera", question("Molière"))).toBe(false);
  });

  it("≥ 11 chars: 3 edits accepted", () => {
    expect(matchAnswer("versingetorix", question("Vercingétorix"))).toBe(true);
    expect(matchAnswer("vercingetorics", question("Vercingétorix"))).toBe(true);
    expect(matchAnswer("versingeturiz", question("Vercingétorix"))).toBe(true);
  });

  it("≥ 11 chars: 4 edits rejected", () => {
    expect(matchAnswer("versinguturiz", question("Vercingétorix"))).toBe(false);
  });

  it("≥ 11 chars: heavy truncation falls into the shorter tier and is rejected", () => {
    expect(matchAnswer("vercingeto", question("Vercingétorix"))).toBe(false);
  });

  it("accepts a missing hyphen-space through fuzzy matching", () => {
    expect(matchAnswer("jeanjacques rousseau", question("Jean-Jacques Rousseau"))).toBe(true);
    expect(matchAnswer("cote divoire", question("Côte d'Ivoire"))).toBe(true);
  });
});

describe("matchAnswer — numeric strictness", () => {
  it("accepts an exact numeric answer", () => {
    expect(matchAnswer("1789", question("1789"))).toBe(true);
    expect(matchAnswer("1789 !", question("1789"))).toBe(true);
  });

  it("rejects a numeric near-miss", () => {
    expect(matchAnswer("1913", question("1912"))).toBe(false);
  });

  it("rejects a truncated or padded number", () => {
    expect(matchAnswer("178", question("1789"))).toBe(false);
    expect(matchAnswer("17890", question("1789"))).toBe(false);
  });

  it("gives a numeric alias zero tolerance too", () => {
    const answer = question("Mille sept cent quatre-vingt-neuf", ["1789"]);
    expect(matchAnswer("1789", answer)).toBe(true);
    expect(matchAnswer("1788", answer)).toBe(false);
  });
});

describe("matchAnswer — rejections", () => {
  it("rejects empty and blank input", () => {
    expect(matchAnswer("", question("Paris"))).toBe(false);
    expect(matchAnswer("   ", question("Paris"))).toBe(false);
    expect(matchAnswer(" ?! ", question("Paris"))).toBe(false);
  });

  it("rejects an article alone", () => {
    expect(matchAnswer("les", question("Les Misérables"))).toBe(false);
  });

  it("rejects clearly different answers", () => {
    expect(matchAnswer("chat", question("Chien"))).toBe(false);
    expect(matchAnswer("Lyon", question("Marseille"))).toBe(false);
  });
});

describe("judgeAnswer — the rule that fired", () => {
  const etatsUnis = question("États-Unis", ["USA", "Amérique"], ["Etats Unys"]);

  it("names the canonical answer, the alias and the misspelling apart", () => {
    expect(judgeAnswer("etats unis", etatsUnis)).toBe(UserAnswerMatchedViaEnum.CANONICAL);
    expect(judgeAnswer("l'Amérique", etatsUnis)).toBe(UserAnswerMatchedViaEnum.ALIAS);
    expect(judgeAnswer("etats unys", etatsUnis)).toBe(UserAnswerMatchedViaEnum.MISSPELLING);
  });

  it("names a typo of the canonical answer or of an alias fuzzy", () => {
    expect(judgeAnswer("etats unos", etatsUnis)).toBe(UserAnswerMatchedViaEnum.FUZZY);
    expect(judgeAnswer("amerqiue", etatsUnis)).toBe(UserAnswerMatchedViaEnum.FUZZY);
  });

  it("prefers the canonical answer when a misspelling repeats it", () => {
    expect(judgeAnswer("Paris", question("Paris", ["Paris"], ["Paris"]))).toBe(
      UserAnswerMatchedViaEnum.CANONICAL,
    );
  });

  it("returns nothing when no rule fires", () => {
    expect(judgeAnswer("Lyon", etatsUnis)).toBe(null);
    expect(judgeAnswer("", etatsUnis)).toBe(null);
  });
});
