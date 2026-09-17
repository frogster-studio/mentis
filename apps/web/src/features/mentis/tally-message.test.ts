import { describe, expect, it } from "vitest";

import { readTallyMessage } from "./tally-message";
import { TALLY_FORM_ID } from "./waitlist-config";

const frameWindow = {} as Window;
const submitted = {
  origin: "https://tally.so",
  source: frameWindow,
  data: JSON.stringify({ event: "Tally.FormSubmitted", payload: { formId: TALLY_FORM_ID } }),
};

describe("Tally messages", () => {
  it("accepts success only from the embedded waitlist", () => {
    expect(readTallyMessage(submitted, frameWindow)).toEqual({ loaded: false, submitted: true });
    expect(
      readTallyMessage({ ...submitted, origin: "https://example.com" }, frameWindow),
    ).toBeNull();
    expect(readTallyMessage({ ...submitted, source: {} as Window }, frameWindow)).toBeNull();
    expect(readTallyMessage(submitted, null)).toBeNull();
  });

  it("does not mistake loading for a stored application", () => {
    expect(
      readTallyMessage(
        {
          ...submitted,
          data: JSON.stringify({ event: "Tally.FormLoaded", payload: { formId: TALLY_FORM_ID } }),
        },
        frameWindow,
      ),
    ).toEqual({ loaded: true, submitted: false });
  });

  it.each([
    null,
    {},
    "not json",
    "null",
    "[]",
    '{"event":"Tally.FormSubmitted"}',
    JSON.stringify({ event: "Tally.FormSubmitted", payload: { formId: "another-form" } }),
    JSON.stringify({ event: "Tally.FormPageView", payload: { formId: TALLY_FORM_ID } }),
  ])("ignores malformed and unrelated payloads: %j", (data) => {
    expect(readTallyMessage({ ...submitted, data }, frameWindow)).toBeNull();
  });
});
