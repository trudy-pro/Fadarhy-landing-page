import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

// Side-effect import FIRST: registers the out-of-band error capture before
// the first request, so a throw the SSR runtime swallows into a generic
// JSON 500 can still be recovered (with its real stack) below.
import "./lib/error-capture";
import { appendSsrErrorLog, consumeLastCapturedError } from "./lib/error-capture";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Standalone inline-CSS error page. Deliberately depends on NOTHING from
// the app bundle (no styles.css, no React) — it renders precisely when the
// server render itself crashed.
function renderErrorPage(message: string): string {
  const safeMessage = escapeHtml(String(message || "Unknown error").slice(0, 600));
  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8" />',
    "    <title>This app hit a server error</title>",
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    "    <style>",
    "      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }",
    "      .card { max-width: 30rem; width: 100%; text-align: center; padding: 2rem; }",
    "      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }",
    "      p { color: #4b5563; margin: 0 0 1rem; }",
    "      pre { text-align: left; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 12px; line-height: 1.45; overflow-x: auto; white-space: pre-wrap; word-break: break-word; color: #374151; }",
    "      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-top: 1.25rem; }",
    "      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }",
    "      .primary { background: #111; color: #fff; }",
    "      .secondary { background: #fff; color: #111; border-color: #d1d5db; }",
    "    </style>",
    "  </head>",
    "  <body>",
    '    <div class="card">',
    "      <h1>This app hit a server error</h1>",
    "      <p>The server render failed. Check the latest changes for the cause, or try reloading.</p>",
    "      <pre>" + safeMessage + "</pre>",
    '      <div class="actions">',
    '        <button class="primary" onclick="location.reload()">Try again</button>',
    '        <a class="secondary" href="/">Go home</a>',
    "      </div>",
    "    </div>",
    // Report the crash to the parent editor frame with the same
    // swarmz:runtime_error shape the bridge and the root ErrorPage emit, so
    // the editor's auto-heal pill shows while this page is on screen. The
    // bridge never loads on a 500 page, which left SSR crashes invisible to
    // the editor (2026-10-02). Reads the message back out of the <pre> so no
    // string ever needs escaping into script context; re-posts every 20s
    // while mounted (a crash the user is still looking at must never read as
    // cleared); self-noops when not iframed.
    "    <script>",
    "      (function () {",
    "        if (window.parent === window) return;",
    "        var pre = document.querySelector('pre');",
    "        var payload = ('Dev server returned HTTP 500: ' + (pre ? pre.textContent : '')).slice(0, 500);",
    "        function report() {",
    "          try { window.parent.postMessage({ type: 'swarmz:runtime_error', source: 'ssr', error: payload }, '*'); } catch (e) {}",
    "        }",
    "        report();",
    "        setInterval(report, 20000);",
    "      })();",
    "    </script>",
    "  </body>",
    "</html>",
  ].join("\n");
}

function errorResponse(message: string): Response {
  return new Response(renderErrorPage(message), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// The SSR runtime swallows in-handler throws into a plain JSON 500 whose
// body contains "unhandled":true — the try/catch below never fires for
// those. Detect that shape on any JSON 5xx and replace it with the styled
// page, recovering the real error (captured out-of-band by
// ./lib/error-capture) when one is available.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true')) return response;

  const captured = consumeLastCapturedError();
  if (captured !== undefined) {
    // Captured errors were already appended to /tmp/ssr-errors.log by
    // error-capture's record() — just surface the stack in the dev log.
    console.error(captured);
  } else {
    appendSsrErrorLog(new Error("SSR error swallowed by the server runtime: " + body.slice(0, 300)));
  }
  const message =
    captured instanceof Error
      ? captured.message
      : "Server render failed (HTTP " + response.status + ")";
  return errorResponse(message);
}

export default createServerEntry({
  async fetch(request) {
    try {
      const response = await handler.fetch(request);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      appendSsrErrorLog(error);
      return errorResponse(error instanceof Error ? error.message : String(error));
    }
  },
});
