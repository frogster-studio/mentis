export type WordFind = { start: number; end: number; whole: boolean };

type Word = { folded: string; start: number; end: number };

function fold(character: string): string {
  return character
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
}

function splitWords(text: string): Word[] {
  const words: Word[] = [];
  let word: Word | null = null;
  let index = 0;
  for (const character of text) {
    const end = index + character.length;
    const folded = fold(character);
    // A text typed already decomposed carries its accents apart; they stay inside their word's span.
    if (folded === "") {
      if (word) word.end = end;
    } else if (!/^[a-z0-9]+$/.test(folded)) {
      word = null;
    } else if (word) {
      word.folded += folded;
      word.end = end;
    } else {
      word = { folded, start: index, end };
      words.push(word);
    }
    index = end;
  }
  return words;
}

function dropFinalS(word: string): string {
  return word.endsWith("s") ? word.slice(0, -1) : word;
}

export function readQueryWords(query: string): string[] {
  return [...new Set(splitWords(query).map(({ folded }) => folded))];
}

// One list per query word, so a caller can require each of them in any of several fields.
export function findQueryWords(queryWords: string[], text: string): WordFind[][] {
  const words = splitWords(text);
  return queryWords.map((queryWord) =>
    words.flatMap(({ folded, start, end }) => {
      const whole = dropFinalS(folded) === dropFinalS(queryWord);
      return whole || folded.startsWith(queryWord) ? [{ start, end, whole }] : [];
    }),
  );
}
