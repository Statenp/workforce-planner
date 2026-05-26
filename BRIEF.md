# Workforce Planner — Project Brief

## Overview

Workforce Planner is a labor forecasting application for retail/restaurant operators. It lets planners view metric actuals, budgets, last-year comparisons, and forward forecasts across locations and departments — then adjust forecasts with documented reasons.

**Status:** Active development (mock data + JSON persistence)  
**Default view:** Current calendar week, rolling 5-week forecast horizon from today

## Goals

1. Give operators a single pane to compare **actual**, **last year**, **budget**, and **forecast** metrics.
2. Support planning at **day**, **week**, and **month** granularity with drill-down/up.
3. Allow forecast edits with **audit trail** (reason + timestamp).
4. Group metrics into **forecast groups** for focused analysis.
5. Surface **public holidays** on the chart for context.

## Users & Use Cases

| Persona | Primary tasks |
|---------|---------------|
| Store / district manager | Review weekly traffic and sales vs forecast; adjust upcoming weeks |
| Workforce planner | Compare budget vs actual headcount drivers; drill month → week → day |
| Regional lead | Filter by location/department; use forecast groups for cross-store patterns |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Charts | Recharts |
| Backend | Express 4, TypeScript (`server/`) |
| Storage | JSON file (`server/data/store.json`) |
| Dates | date-fns |
| Holidays | Nager.Date public API (client-side) |

## Architecture

```
src/app/           Next.js pages (App Router)
src/components/    UI (FilterPanel, ForecastChart, DataTable, ForecastEditor, …)
src/hooks/         usePlannerData — client state + API orchestration
src/services/      plannerApi, nagerHolidays
src/utils/         periods (aggregation, drill), forecastEdit
server/src/        Express API, store persistence, mock data generation
```

**Dev:** `npm run dev` starts Next.js (port 3000) and Express (port 3001). Next.js rewrites `/api/*` → Express.

## Domain Model

### Catalog (static)

- **Stores** (5): Downtown Flagship, Riverside Mall, Harbor Plaza, Summit Outlet, Lakeview Center
- **Departments** (4): Front of House, Kitchen, Delivery, Management
- **Metrics** (4):
  - Item Sales ($)
  - Customer Traffic (visitors)
  - Item Returns (units)
  - Items Sold (units)

### Core entities

- **DayRecord** — `{ date, storeId, departmentId, metricId, actual, actualLy, budget, forecast }`
- **ForecastGroup** — `{ id, name, metricIds[] }` — user-defined metric bundles
- **ForecastEditLog** — `{ id, timestamp, periodKey, periodLabel, granularity, mode, value, reason }`
- **PeriodBucket** — aggregated totals for a day/week/month with future-horizon flags

### Forecast horizon

- **5 weeks** forward from today (`FORECAST_HORIZON_WEEKS`)
- Default date range: **current Mon–Sun week**
- Preset: **5 Week Out Forecast** (today → today + 5 weeks)
- Data fetch always extends through the forecast horizon end

## Features (implemented)

### Filtering (left panel, collapsible sections)

- Locations, departments, metrics (multi-select checkboxes)
- Forecast groups with **+ New** create flow and metric membership view
- Active forecast group narrows chart/table to its metrics (intersected with selected metrics)

### Visualization

- Multi-line chart (Recharts) — one line per metric × visible series
- Collapsible legend (collapsed: title + chevron only)
- Holiday markers from Nager.Date (no vendor name in UI)
- Series toggle: actual, actual LY, budget, forecast

### Time navigation

- Custom date range picker + presets
- Granularity: day / week / month
- Drill down: month → week → day (table action)
- Drill up / reset drill (toolbar)

### Forecast editing

- Select a period in the table → edit panel activates
- Adjust by **percent** or **numeric** delta
- **Reason required** before apply
- Recent edits list (last 25, persisted server-side)
- Only **forecast** values are mutable; actual/budget/LY are read-only

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/catalog` | Stores, departments, metrics |
| GET | `/api/day-records?start&end` | Day-level records for range |
| GET | `/api/forecast-groups` | List forecast groups |
| POST | `/api/forecast-groups` | Create group `{ name, metricIds }` |
| DELETE | `/api/forecast-groups/:id` | Remove group |
| GET | `/api/forecast-edit-log` | Edit audit log |
| POST | `/api/forecast-edits` | Apply forecast adjustment |

## Conventions

- **Client hook:** `usePlannerData()` is the single source of planner state.
- **Styling:** Custom CSS in `src/app/globals.css` (not component-level Tailwind-heavy patterns).
- **Types:** Shared between client (`src/types.ts`) and server (`server/src/lib/types.ts`) — keep in sync manually.
- **Mock data:** Generated on demand for missing dates via `generateMockDayRecords`.
- **Persistence:** All mutations write to `server/data/store.json`.

## Out of Scope (current)

- Authentication / multi-tenant
- Real ERP or POS integrations
- Scheduled/automated forecast models
- Export / reporting
- Mobile-specific layout

## Suggested Next Steps

1. Replace mock generator with import pipeline (CSV/API).
2. Add user/session scoping for forecast groups and edit log.
3. Persist filter selections (localStorage or user prefs API).
4. Add comparison mode (e.g. store vs store, period vs period).
5. Production database (Postgres) instead of JSON file.

## Running Locally

```bash
npm install
npm install --prefix server
npm run dev
```

- Web: http://localhost:3000/
- API: http://localhost:3001/api
