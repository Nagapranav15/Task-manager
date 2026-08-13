import { describe, it, expect, beforeEach } from 'vitest';
import axiosInstance from '../axiosInstance';

describe('axiosInstance.js utility tests', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('attaches Authorization header when token is present in localStorage', async () => {
        localStorage.setItem('token', 'mock_access_token');
        const config = await axiosInstance.interceptors.request.handlers[0].fulfilled({ headers: {} });
        expect(config.headers.Authorization).toBe('Bearer mock_access_token');
    });

    it('does not attach Authorization header when token is missing', async () => {
        const config = await axiosInstance.interceptors.request.handlers[0].fulfilled({ headers: {} });
        expect(config.headers.Authorization).toBeUndefined();
    });
});
