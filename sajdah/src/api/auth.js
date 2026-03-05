import client from './client';

export const loginAPI = (email, password) =>
    client.post('/auth/login', { email, password });

export const registerAPI = (email, password, language, initialQadaEstimate) =>
    client.post('/auth/register', { email, password, language, initialQadaEstimate });

export const getMeAPI = () =>
    client.get('/auth/me');
