import { timingSafeEqual } from "node:crypto";

// timingSafeEqual throws on unequal length, so the length gate has to run first.
export const constantTimeEqual = (received: string, expected: string): boolean => {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
};
