/// <reference types="node" />
// Captures the original Error out-of-band so server.ts can recover the
// real stack when the SSR runtime has already swallowed the throw into a
// generic JSON 500 response. Server-side only (imported from src/server.ts).
// Every captured error is also appended as a JSON line to
// /tmp/ssr-errors.log so the dev tooling can read real stacks out-of-band.

type NodeFsLike = { appendFileSync: (path: string, data: string) => void };

let nodeFs: NodeFsLike | undefined;
// Dynamic import keeps this module loadable in non-Node bundles; in the
// Node dev/SSR server it resolves on the first tick, before any request.
import("node:fs")
  .then((m) => { nodeFs = m as unknown as NodeFsLike; })
  .catch(() => { /* not Node — file logging stays disabled */ });

export function appendSsrErrorLog(error: unknown): void {
  try {
    if (!nodeFs) return;
    const e = error as { message?: unknown; stack?: unknown } | null;
    const message = e && typeof e.message === "string" ? e.message : String(error ?? "Unknown error");
    const stack = e && typeof e.stack === "string" ? e.stack.slice(0, 4000) : undefined;
    const line = JSON.stringify({ ts: new Date().toISOString(), message: message.slice(0, 1000), stack });
    nodeFs.appendFileSync("/tmp/ssr-errors.log", line + "\n");
  } catch {
    // best-effort — logging must never break the request path
  }
}

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
  appendSsrErrorLog(error);
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
