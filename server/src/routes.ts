import { Router } from 'express';
import { DEPARTMENTS, METRICS, STORES } from './lib/catalog.js';
import type { ForecastEditMode, Granularity } from './lib/types.js';
import { store } from './store.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'workforce-planner-api' });
});

apiRouter.get('/catalog', (_req, res) => {
  res.json({ stores: STORES, departments: DEPARTMENTS, metrics: METRICS });
});

apiRouter.get('/day-records', (req, res) => {
  const start = String(req.query.start ?? '');
  const end = String(req.query.end ?? '');
  if (!start || !end || start > end) {
    res.status(400).json({ error: 'Query params start and end (YYYY-MM-DD) are required.' });
    return;
  }
  res.json({ records: store.getDayRecords(start, end) });
});

apiRouter.get('/forecast-groups', (_req, res) => {
  res.json({ groups: store.getForecastGroups() });
});

apiRouter.post('/forecast-groups', (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const metricIds = req.body?.metricIds;
  if (!name || !Array.isArray(metricIds) || metricIds.length === 0) {
    res.status(400).json({ error: 'name and metricIds are required.' });
    return;
  }
  const group = store.addForecastGroup(name, metricIds.map(String));
  res.status(201).json({ group });
});

apiRouter.delete('/forecast-groups/:id', (req, res) => {
  store.removeForecastGroup(req.params.id);
  res.status(204).send();
});

apiRouter.get('/forecast-edit-log', (_req, res) => {
  res.json({ editLog: store.getForecastEditLog() });
});

apiRouter.post('/forecast-edits', (req, res) => {
  const {
    scopeKey,
    granularity,
    mode,
    value,
    reason,
    periodLabel,
    storeIds,
    departmentIds,
    metricIds,
    rangeStart,
    rangeEnd,
  } = req.body ?? {};

  if (
    !scopeKey ||
    !granularity ||
    !mode ||
    typeof value !== 'number' ||
    !reason?.trim() ||
    !periodLabel ||
    !Array.isArray(storeIds) ||
    !Array.isArray(departmentIds) ||
    !Array.isArray(metricIds) ||
    !rangeStart ||
    !rangeEnd
  ) {
    res.status(400).json({ error: 'Invalid forecast edit payload.' });
    return;
  }

  const result = store.applyForecastEdit({
    scopeKey: String(scopeKey),
    granularity: granularity as Granularity,
    mode: mode as ForecastEditMode,
    value,
    reason: String(reason).trim(),
    periodLabel: String(periodLabel),
    storeIds: storeIds.map(String),
    departmentIds: departmentIds.map(String),
    metricIds: metricIds.map(String),
    rangeStart: String(rangeStart),
    rangeEnd: String(rangeEnd),
  });

  res.json(result);
});
