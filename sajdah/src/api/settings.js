import client from './client';

export const getSettingsAPI = () =>
    client.get('/settings');

export const updateNotificationsAPI = (data) =>
    client.put('/settings/notifications', data);

export const updateProfileAPI = (data) =>
    client.put('/settings/profile', data);
