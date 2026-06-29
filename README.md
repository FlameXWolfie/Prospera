# Prospera

A React career platform (ATS resume scanner, resume builder, application tracker,
interview prep) with a real auth + data backend.

## Layout

```
.
├─ frontend/   Vite + React app (the UI)
└─ server/     Express + MongoDB API (auth, resumes, applications, AI)
```

Each package has its own `package.json` and `node_modules`.

## Getting started

```bash
npm run install:all          # install root + frontend + server deps
cp server/.env.example server/.env   # configure MongoDB / secrets
npm run dev:all              # run frontend (5173) + server (4000) together
```

The frontend reaches the API through Vite's `/api` proxy → `http://localhost:4000`.

## Scripts (from the repo root)

| Command               | What it does                                  |
| --------------------- | --------------------------------------------- |
| `npm run dev`         | Frontend dev server only                      |
| `npm run server`      | API server only                               |
| `npm run server:dev`  | API server with `--watch`                     |
| `npm run dev:all`     | Frontend + server together (`concurrently`)   |
| `npm run build`       | Production build of the frontend              |
| `npm run lint`        | Lint the frontend                             |
| `npm run install:all` | Install deps for root, frontend and server    |

You can also work inside a single package directly, e.g. `cd frontend && npm run dev`.
