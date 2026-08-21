import {
  appCompetitionActiveAttemptResponseSchema,
  appCompetitionAttemptResponseSchema,
  appCompetitionTranscriptResponseSchema,
} from "@mentis/contracts/app";
import { describe, expect, it, vi } from "vitest";
import { type ApiClient, createApiClient } from "@/lib/api/client";
import type { PlayedAnswer } from "./attempt-reducer";
import { activeAttemptRequest, finalizeAttemptRequest, issueAttemptRequest } from "./requests";

const BASE_URL = "https://api.test";
const ATTEMPT_ID = "3f1d4d1e-0f4a-4c9b-9a1a-8f5c2b7d6e01";

type Call = { url: string; init: RequestInit };

function client(body: unknown): { api: ApiClient; calls: Call[] } {
  const calls: Call[] = [];
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  return {
    api: createApiClient({
      baseUrl: BASE_URL,
      fetch: fetch as unknown as typeof globalThis.fetch,
      getToken: async () => "token-abc",
      onUnauthenticated: vi.fn(),
    }),
    calls,
  };
}

function issuedQuestion(position: number) {
  return {
    id: `q${position}`,
    text: `Question ${position} ?`,
    squareChoices: ["faux un", `bonne réponse ${position}`, "faux deux", "faux trois"],
  };
}

const ISSUED_BODY = {
  id: ATTEMPT_ID,
  day: "2026-08-21",
  kind: "initial",
  status: "active",
  themeId: "histoire",
  themeName: "Histoire",
  questions: Array.from({ length: 10 }, (_, index) => issuedQuestion(index + 1)),
};

const PLAYED: PlayedAnswer[] = [
  { questionId: "q1", mode: "cash", rawInput: "Charlemagne", clientElapsedMs: 9_120 },
  { questionId: "q2", mode: "square", rawInput: "bonne réponse 2", clientElapsedMs: 25_000 },
];

describe("the competition paths", () => {
  it("all sit under the guarded /app/me prefix, so every call carries the token", async () => {
    for (const request of [
      activeAttemptRequest,
      issueAttemptRequest,
      finalizeAttemptRequest(ATTEMPT_ID, []),
    ]) {
      expect(request.path.startsWith("/app/me/")).toBe(true);
    }
  });

  it("read, issuance and finalize each address their own endpoint", () => {
    expect(activeAttemptRequest).toStrictEqual({
      method: "GET",
      path: "/app/me/competition/attempts/active",
    });
    expect(issueAttemptRequest).toStrictEqual({
      method: "POST",
      path: "/app/me/competition/attempts",
    });
    expect(finalizeAttemptRequest(ATTEMPT_ID, []).path).toBe(
      `/app/me/competition/attempts/${ATTEMPT_ID}/finalize`,
    );
  });
});

describe("the finalize payload", () => {
  it("sends the served prefix as raw play — no verdict, no score, no Canonical Answer", async () => {
    const { api, calls } = client({
      id: ATTEMPT_ID,
      day: "2026-08-21",
      kind: "initial",
      themeId: "histoire",
      themeName: "Histoire",
      finalizeReason: "quit",
      score: 5,
      answers: Array.from({ length: 10 }, (_, position) => ({
        position,
        questionId: `q${position + 1}`,
        questionText: `Question ${position + 1} ?`,
        canonicalAnswer: `bonne réponse ${position + 1}`,
        mode: "none",
        rawInput: null,
        correct: false,
        points: 0,
        matchedVia: null,
      })),
    });

    await api.requestJson(
      finalizeAttemptRequest(ATTEMPT_ID, PLAYED),
      appCompetitionTranscriptResponseSchema,
    );

    expect(JSON.parse(String(calls[0].init.body))).toStrictEqual({
      answers: [
        { questionId: "q1", mode: "cash", rawInput: "Charlemagne", clientElapsedMs: 9_120 },
        { questionId: "q2", mode: "square", rawInput: "bonne réponse 2", clientElapsedMs: 25_000 },
      ],
    });
  });

  it("carries a quit as a short batch — the positions never reached are simply absent", () => {
    const body = finalizeAttemptRequest(ATTEMPT_ID, PLAYED).body as { answers: PlayedAnswer[] };
    expect(body.answers).toHaveLength(2);
  });
});

describe("what issuance may put on the device", () => {
  it("keeps only the id, the text and the pre-shuffled grid", async () => {
    const { api } = client(ISSUED_BODY);

    const attempt = await api.requestJson(issueAttemptRequest, appCompetitionAttemptResponseSchema);

    expect(Object.keys(attempt.questions[0]).sort()).toStrictEqual(["id", "squareChoices", "text"]);
  });

  it("strips any answer material a payload smuggles alongside a Question", async () => {
    const { api } = client({
      attempt: {
        ...ISSUED_BODY,
        questions: ISSUED_BODY.questions.map((question) => ({
          ...question,
          answer: "bonne réponse 1",
          aliases: ["Charles Ier"],
          misspellings: ["charlemagn"],
        })),
      },
    });

    const { attempt } = await api.requestJson(
      activeAttemptRequest,
      appCompetitionActiveAttemptResponseSchema,
    );

    expect(attempt?.questions[0]).toStrictEqual(issuedQuestion(1));
  });
});
