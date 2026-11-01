import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// Server functions are same-origin RPC endpoints. Start only adds this CSRF
// guard by itself while src/start.ts is absent, so it is declared explicitly:
// keep it in requestMiddleware when you add middleware of your own.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}));
