<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Auth edge file: use `src/middleware.ts`, not `proxy.ts`

Next.js 16 renamed middleware → proxy, but on 16.2.x + Turbopack (`next dev`)
`src/proxy.ts` causes valid App Router routes to return **404** while still
logging `proxy.ts` in the timing line (vercel/next.js#92921, #94739). Keep the Clerk
auth gate in `src/middleware.ts` until that bug is fixed upstream. Do not
"migrate" it back to `proxy.ts` to silence deprecation warnings.

## ClerkProvider placement (Next.js 16 + @clerk/nextjs v7)

`ClerkProvider` must wrap children **inside** `<body>`, not wrap `<html>`.
Wrapping `<html>` breaks client context (`useClerk can only be used within the
<ClerkProvider />`). Prefer `dynamic` on the root provider for this authenticated app.
<!-- END:nextjs-agent-rules -->
