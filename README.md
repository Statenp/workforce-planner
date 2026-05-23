# Workforce Planner

Labor forecasting application with a modern UI for exploring and editing workforce metrics across locations and departments.

## Features

- **Custom date range** picker with quick presets
- **Day / week / month** views with drill-down and drill-up navigation
- **Metric-level data** aggregated from daily records (lowest granularity)
- **Series**: actuals, last-year actuals, budget, and forecast
- **Line chart** (Recharts) with one line per metric (per visible series)
- **Public holidays** marked on the chart (US federal holidays by default)
- **Numeric table** with period totals
- **5-week forecast horizon** — rolling outlook from today with projected budget/forecast (no future actuals)
- **Forecast editing** by percent or numeric delta, with proportional proration to underlying days
- **Forecast groups** for bundled metric selection
- **Filters** by store(s) and department(s)

## Run locally

Requires [Node.js](https://nodejs.org/) 20+.

```bash
cd workforce-planner
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Project structure

- `src/data/` — mock catalog and day-level seed data
- `src/utils/periods.ts` — aggregation and period keys
- `src/constants/forecastHorizon.ts` — 5-week horizon helpers
- `src/utils/forecastEdit.ts` — forecast-only edits with proration
- `src/hooks/usePlannerData.ts` — application state
- `src/components/` — UI modules

Mock data is generated in-browser; replace `generateMockDayRecords` and `usePlannerData` with API calls when connecting to a backend.
