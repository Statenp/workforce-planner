# Workforce Planner

Labor forecasting application with a **Next.js** frontend and **Express** API backend.

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Charts | Recharts |
| Backend | Express 4, TypeScript (`server/`) |
| Storage | JSON file (`server/data/store.json`) |

## Run locally

Requires [Node.js](https://nodejs.org/) 20+.

```bash
cd workforce-planner
npm install
npm install --prefix server
npm run dev
```

- **Web** — http://localhost:3000/
- **API** — http://localhost:3001/api

`npm run dev` starts both. Next.js rewrites `/api/*` to the Express server.

### Run separately

```bash
npm run dev:web      # Next.js only (port 3000)
npm run dev:server   # Express API (port 3001)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js + API |
| `npm run build` | Production Next.js build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Project structure

```
src/app/       Next.js App Router (page, layout, globals.css)
src/components/  UI components
src/hooks/       Client data hooks
server/        Express API + persistence
```
