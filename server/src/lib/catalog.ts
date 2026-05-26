import type { Department, Metric, Store } from './types.js';

export const STORES: Store[] = [
  { id: 's1', name: 'Downtown Flagship', region: 'Northeast' },
  { id: 's2', name: 'Riverside Mall', region: 'Northeast' },
  { id: 's3', name: 'Harbor Plaza', region: 'West' },
  { id: 's4', name: 'Summit Outlet', region: 'West' },
  { id: 's5', name: 'Lakeview Center', region: 'Midwest' },
];

export const DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Front of House' },
  { id: 'd2', name: 'Kitchen' },
  { id: 'd3', name: 'Delivery' },
  { id: 'd4', name: 'Management' },
];

export const METRICS: Metric[] = [
  { id: 'm1', name: 'Item Sales', unit: '$' },
  { id: 'm2', name: 'Customer Traffic', unit: 'visitors' },
  { id: 'm3', name: 'Item Returns', unit: 'units' },
  { id: 'm4', name: 'Items Sold', unit: 'units' },
];
