import { TALLY_FORM_ID } from "./waitlist-config";

export function readTallyMessage(
  event: Pick<MessageEvent, "origin" | "source" | "data">,
  frameWindow: Window | null,
) {
  if (
    !frameWindow ||
    event.origin !== "https://tally.so" ||
    event.source !== frameWindow ||
    typeof event.data !== "string"
  )
    return null;

  try {
    const message = JSON.parse(event.data);
    if (!message || message.payload?.formId !== TALLY_FORM_ID) return null;
    if (message.event !== "Tally.FormLoaded" && message.event !== "Tally.FormSubmitted")
      return null;
    return {
      loaded: message.event === "Tally.FormLoaded",
      submitted: message.event === "Tally.FormSubmitted",
    };
  } catch {
    return null;
  }
}
