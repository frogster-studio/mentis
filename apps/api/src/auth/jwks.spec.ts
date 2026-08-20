import { exportJWK, generateKeyPair } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testEnv } from "../_tests/test-env";
import { createProjectJwks } from "./jwks";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createProjectJwks", () => {
  it("resolves signing keys from the project's well-known JWKS endpoint", async () => {
    const { publicKey } = await generateKeyPair("ES256", { extractable: true });
    const jwk = { ...(await exportJWK(publicKey)), alg: "ES256", kid: "probe-key" };
    const requested: string[] = [];
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      requested.push(String(input));
      return Promise.resolve(Response.json({ keys: [jwk] }));
    });

    const key = await createProjectJwks(testEnv)(
      { alg: "ES256", kid: "probe-key" },
      { payload: "", signature: "" },
    );

    expect(requested).toEqual(["https://stub.supabase.co/auth/v1/.well-known/jwks.json"]);
    expect(key).toMatchObject({ algorithm: { name: "ECDSA", namedCurve: "P-256" } });
  });
});
