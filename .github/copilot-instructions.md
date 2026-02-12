## Purpose

This file guides AI coding agents working on Factorie so they can be productive immediately. Focus on developer workflows, architecture, and repository conventions that are specific to this project.

## Big picture
- Two main parts: a Python/Streamlit prototype app (app logic & pages under `src/`) and the main React project for richer UI components in `Factorie-React/`.
- The Streamlit app sets global state in `streamlit.session_state` (see `main.py`) and exposes pages via `st.navigation([...]).run()` (see `main.py`). Pages live in `src/*.py` (e.g., `src/quiz.py`, `src/dashboard.py`).
- The prototype data model is centered on `Decision` objects in `src/classes/Decision.py` and `FactorPack` in `src/classes/FactorPack.py`. These hold options, factors, and the `answers` arrays used across UI pages.
- The React app is structured around pages in `Factorie-React/src/pages/` (e.g., `Quiz.jsx`, `Results.jsx`, `FactorPacks.jsx`) and shared components in `Factorie-React/src/components/`. The React app is built with Vite and uses Material UI for styling.
- There is no background services or database — all state is in-memory and persisted via file I/O & localstorage.

## Key files and patterns (examples)
- Entry & navigation: [main.py](main.py#L1) loads texts, exposes pages, and keeps the current `ss.decision` available to all pages.
- Pages: Streamlit pages live in `src/` (e.g., [src/quiz.py](src/quiz.py#L1), [src/dashboard.py](src/dashboard.py#L1)). They read/write `ss.decision` and other keys in `session_state`.
- Data model: [src/classes/Decision.py](src/classes/Decision.py#L1) — persistent in-memory structures, with `serialize`/`deserialize` helpers used by `main.py` and `src/save.py`.
- Frontend component: a multi-handled slider UI exists in `src/multi_handled_slider/frontend` and an app in `Factorie-React/` (see `Factorie-React/src/MultiHandledSlider.jsx`). The React app is independent and built with Vite.

## Project-specific conventions
- Streamlit session_state is the single source of truth for UI pages. Common keys: `decision`, `decisions`, `texts`, `available_factor_packs`, and page-local indices like `idx` (see `src/quiz.py`). Avoid creating duplicate state owners — update the central `ss.decision` methods instead of mutating arrays directly.
- Answers are stored as numeric arrays (NumPy), often shaped/reshaped in pairs — see `src/quiz.py`'s `formatted_answers()` helper. Validation helpers live on the `Decision` object (used by `direct_input()` in `src/quiz.py`).
- UI flow: pages call `st.rerun()` after state-changing actions (submit/skip/back). When modifying state, ensure consistent `ss.idx` bounds and handle wrap-around behavior used in `quiz.index()`.

## Development workflows
- Python environment: create a venv and install requirements:

  python -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt

- Run the Streamlit app (app navigation defined in `main.py`):

  streamlit run main.py

- Frontend (React) local dev/build (in `Factorie-React/`):

  cd Factorie-React
  npm install
  npm run dev   # starts Vite (see package.json)
  npm run build

## Integration points & testing notes
- The Streamlit app loads example decisions from `examples/*.dec` and `texts.json` at app start. Changing these files will affect runtime state without code changes.
- The React Vite app is primarily for isolated UI components (e.g., multi-handled slider). Coordinate changes between `src/multi_handled_slider/frontend` and `Factorie-React/src` if reusing components.
- There are no automated tests in the repo

## What agents should do first
1. Focus on the React app, as the prototype has been mostly moved over to the production React app. The React app is in `Factorie-React/` and has pages like `Quiz.jsx`, `Results.jsx`, and `FactorPacks.jsx`.
2. Load the app locally (`npm run dev`) and open React page.
3. Inspect `Factorie-React/src/models/Decision.js` to understand serialization, validation, and `answers` layout before changing pages that mutate answers.
