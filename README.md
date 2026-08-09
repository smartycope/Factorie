# Factorie
Factorie is a tool to help you make big decisions.


## To Install
```bash
nvm use v22.20.0
npm install
```
## To Run
```bash
npm run dev
```
## To Publish
```bash
npm run build
```
And then
Push to the repo should work, it's hosted on github pages.

## Google Drive Setup

The Dashboard can save and load one decision spreadsheet at a time without a
backend. In a Google Cloud project:

1. Enable the Google Drive API and Google Picker API.
2. Configure the OAuth consent screen with the non-sensitive
   `https://www.googleapis.com/auth/drive.file` scope.
3. Create a Web OAuth client. Add `https://smartycope.github.io` and
   `http://localhost:5173` as authorized JavaScript origins.
4. Create a browser API key restricted to the Google Picker API and to the
   production and localhost HTTP referrers.
5. Copy `.env.example` to `.env.local` for local development and fill in the
   OAuth client ID, API key, and Cloud project number (the Drive App ID).
6. Add the same values as GitHub Actions repository variables named
   `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`, and `VITE_GOOGLE_APP_ID`.

These browser identifiers are embedded in the built app, so the API key's
referrer and API restrictions are required. Do not add a client secret or store
Google access tokens; the app keeps each short-lived token in memory only.

---


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
