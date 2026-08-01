import { describe, expect, it } from "vitest";
import { type Feed, type FeedQuestion, transformFeed } from "./transform";

const GOLDEN_FEED: Feed = {
  themes: [
    {
      id: "marie-antoinette",
      name: "Marie-Antoinette",
      questions: [
        {
          id: "ma-001",
          question: "De quel pays Marie-Antoinette était-elle originaire ?",
          answers: ["Autriche", "France", "Espagne", "Prusse"],
          correctAnswer: 0,
          aliases: ["l'Autriche"],
          misspellings: ["Autrice"],
        },
        {
          id: "ma-002",
          question: "Quel roi de France Marie-Antoinette a-t-elle épousé ?",
          answers: ["Louis XIV", "Louis XV", "Louis XVI", "Charles X"],
          correctAnswer: 2,
          aliases: [],
          misspellings: [],
        },
      ],
    },
    {
      id: "chocolats",
      name: "Chocolats",
      questions: [
        {
          id: "choc-001",
          question: "De quelle fève provient le chocolat ?",
          answers: ["Café", "Cacao", "Vanille", "Noisette"],
          correctAnswer: 1,
          misspellings: ["cacaoo"],
        },
      ],
    },
  ],
};

describe("transformFeed", () => {
  it("transforms the golden feed into theme rows and questions carrying their theme", () => {
    expect(transformFeed(GOLDEN_FEED)).toStrictEqual({
      themes: [
        { id: "marie-antoinette", name: "Marie-Antoinette" },
        { id: "chocolats", name: "Chocolats" },
      ],
      questions: [
        {
          id: "ma-001",
          theme_id: "marie-antoinette",
          text: "De quel pays Marie-Antoinette était-elle originaire ?",
          answer: "Autriche",
          aliases: ["l'Autriche"],
          misspellings: ["Autrice"],
          wrong_choices: ["France", "Espagne", "Prusse"],
        },
        {
          id: "ma-002",
          theme_id: "marie-antoinette",
          text: "Quel roi de France Marie-Antoinette a-t-elle épousé ?",
          answer: "Louis XVI",
          aliases: [],
          misspellings: [],
          wrong_choices: ["Louis XIV", "Louis XV", "Charles X"],
        },
        {
          id: "choc-001",
          theme_id: "chocolats",
          text: "De quelle fève provient le chocolat ?",
          answer: "Cacao",
          aliases: [],
          misspellings: ["cacaoo"],
          wrong_choices: ["Café", "Vanille", "Noisette"],
        },
      ],
    });
  });

  it("derives a question id from its theme and position when omitted", () => {
    const feed: Feed = {
      themes: [
        {
          id: "chocolats",
          name: "Chocolats",
          questions: [
            {
              question: "De quelle fève provient le chocolat ?",
              answers: ["Café", "Cacao", "Vanille", "Noisette"],
              correctAnswer: 1,
            },
            {
              question: "Quel pays est le premier producteur de cacao ?",
              answers: ["Ghana", "Brésil", "Côte d'Ivoire", "Équateur"],
              correctAnswer: 2,
            },
          ],
        },
      ],
    };
    const { questions } = transformFeed(feed);
    expect(questions.map((q) => q.id)).toStrictEqual(["chocolats-001", "chocolats-002"]);
  });

  it("rejects the same question id under two different themes (inverted rule)", () => {
    const feed: Feed = {
      themes: [
        { id: "produits-laitiers", name: "Les produits laitiers", questions: [dairyQuestion()] },
        {
          id: "animaux-de-la-ferme",
          name: "Les animaux de la ferme",
          questions: [dairyQuestion()],
        },
      ],
    };
    expect(() => transformFeed(feed)).toThrow("appears twice in the feed");
  });

  it("rejects the same question id listed twice under one theme", () => {
    const feed: Feed = {
      themes: [
        { id: "chocolats", name: "Chocolats", questions: [dairyQuestion(), dairyQuestion()] },
      ],
    };
    expect(() => transformFeed(feed)).toThrow("appears twice in the feed");
  });

  it("rejects a duplicate theme id", () => {
    const feed: Feed = {
      themes: [
        { id: "chocolats", name: "Chocolats", questions: [] },
        { id: "chocolats", name: "Chocolats bis", questions: [] },
      ],
    };
    expect(() => transformFeed(feed)).toThrow("Duplicate theme id");
  });

  it("rejects a theme with an empty id or name", () => {
    const feed: Feed = { themes: [{ id: "", name: "Chocolats", questions: [] }] };
    expect(() => transformFeed(feed)).toThrow("Theme with empty id or name");
  });

  it("rejects a question with an explicit empty id", () => {
    const feed = feedWithQuestion({ id: "" });
    expect(() => transformFeed(feed)).toThrow("Question with empty id");
  });

  it("rejects a question without exactly 4 answers", () => {
    const feed = feedWithQuestion({ answers: ["Café", "Cacao", "Vanille"] });
    expect(() => transformFeed(feed)).toThrow("exactly 4 non-empty answers");
  });

  it("rejects an out-of-range correctAnswer index", () => {
    const feed = feedWithQuestion({ correctAnswer: 4 });
    expect(() => transformFeed(feed)).toThrow("out-of-range correctAnswer");
  });

  it("transforms a launch-scale feed of 10 themes × 20 questions", () => {
    const { themes, questions } = transformFeed(launchScaleFeed());

    expect(themes).toHaveLength(10);
    expect(questions).toHaveLength(200);
    expect(new Set(questions.map((q) => q.id)).size).toBe(200);
    for (const question of questions) {
      expect(question.wrong_choices).toHaveLength(3);
      expect(question.answer).not.toBe("");
    }
  });
});

function dairyQuestion(): FeedQuestion {
  return {
    id: "lait-001",
    question: "Quel animal donne le lait de vache ?",
    answers: ["La chèvre", "La vache", "La brebis", "La jument"],
    correctAnswer: 1,
  };
}

function feedWithQuestion(overrides: Partial<FeedQuestion>): Feed {
  return {
    themes: [
      {
        id: "chocolats",
        name: "Chocolats",
        questions: [
          {
            id: "choc-001",
            question: "De quelle fève provient le chocolat ?",
            answers: ["Café", "Cacao", "Vanille", "Noisette"],
            correctAnswer: 1,
            ...overrides,
          },
        ],
      },
    ],
  };
}

function launchScaleFeed(): Feed {
  return {
    themes: Array.from({ length: 10 }, (_, t) => ({
      id: `theme-${t}`,
      name: `Thème ${t}`,
      questions: Array.from({ length: 20 }, (_, q) => ({
        question: `Question ${q} du thème ${t} ?`,
        answers: ["A", "B", "C", "D"],
        correctAnswer: q % 4,
      })),
    })),
  };
}
