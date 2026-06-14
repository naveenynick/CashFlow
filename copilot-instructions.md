# Copilot Instructions for Daily Cash Flow

This repository uses plain JavaScript for both frontend and backend logic.

Guidelines:
- Keep changes small and focused. Avoid large refactors unless the user explicitly asks for them.
- Preserve the existing architecture: frontend code in `public/`, backend logic in `server.js` and `netlify/functions/system-sale.js`.
- Do not introduce new frameworks, transpilers, or build tools unless explicitly requested.
- Use standard browser and Node.js APIs. Avoid TypeScript, JSX, and modern tooling that is not already present.
- For UI updates, modify `public/app.js`, `public/index.html`, and `public/styles.css`.
- For server/API updates, modify `server.js`, `patanjali-api.js`, or `netlify/functions/system-sale.js` as appropriate.
- Keep styling simple and consistent with existing CSS.
- If a change could affect deployment, ensure it is compatible with Netlify and Vercel configurations in this repo.
- When unsure, ask the user before changing project structure or adding dependencies.
