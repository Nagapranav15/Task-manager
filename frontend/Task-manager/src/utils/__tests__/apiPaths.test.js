import { describe, it, expect } from 'vitest';
import API_PATHS, { getSecureUrl } from '../apiPaths';

describe('apiPaths.js utility tests', () => {
    it('API_PATHS returns expected endpoints', () => {
        expect(API_PATHS.AUTH.LOGIN).toContain('/api/auth/login');
        expect(API_PATHS.TASKS.GET_ALL_TASKS).toContain('/api/tasks');
        expect(API_PATHS.TASKS.UPDATE_TASK('123')).toContain('/api/tasks/123');
        expect(API_PATHS.ATTENDANCE.GET_MY_LOGS).toContain('/api/attendance/my-logs');
    });

    it('getSecureUrl handles relative and absolute URL formatting', () => {
        expect(getSecureUrl('')).toBe('');
        expect(getSecureUrl(null)).toBe('');
        expect(getSecureUrl('/uploads/test.png')).toContain('/uploads/test.png');
        expect(getSecureUrl('uploads/test.png')).toContain('/uploads/test.png');
    });
});
