import client from './client';

export const ensureTodayAPI = () =>
    client.post('/prayers/today/ensure');

export const markPresentAPI = (prayer, date) =>
    client.post('/prayers/present', { prayer, date });

export const addQadaAPI = (prayer, count) =>
    client.post('/prayers/qada', { prayer, count });

export const undoAPI = () =>
    client.post('/prayers/undo');

export const dailyCloseAPI = (date) =>
    client.post('/prayers/daily-close', { date });

export const closeMissedAPI = () =>
    client.post('/prayers/close-missed');

export const getHistoryAPI = (from, to) =>
    client.get('/history', { params: { from, to } });

export const getStatsAPI = () =>
    client.get('/history/stats');
