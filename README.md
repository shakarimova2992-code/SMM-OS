# SMM OS v0.3

Frontend MVP for GitHub Pages.

## Files
- `index.html`
- `style.css`
- `app.js`

## Deploy
1. Create a GitHub repository, for example `smm-os`.
2. Upload the three files to the repository root.
3. Open **Settings → Pages**.
4. Source: **Deploy from a branch**.
5. Branch: `main`, folder: `/ (root)`.
6. Save.

## Important
This version is a client-side MVP. Project data and content-plan data are stored in the user's browser via localStorage.

No private API keys are included. Real AI generation, authentication, payments and cloud storage should be connected through a backend/serverless function in a later stage; API keys must not be placed directly in GitHub Pages JavaScript.
