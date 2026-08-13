import { describe, it, expect } from 'vitest';
import { validateEmail, addThousandsSeparator } from '../helper';

describe('helper.js pure utility tests', () => {
    it('validateEmail verifies email format', () => {
        expect(validateEmail('test@thinklabdigitalsolutions.com')).toBe(true);
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('user@domain')).toBe(false);
    });

    it('addThousandsSeparator formats numbers with commas correctly', () => {
        expect(addThousandsSeparator(1000)).toBe('1,000');
        expect(addThousandsSeparator(1000000)).toBe('1,000,000');
        expect(addThousandsSeparator(1234.56)).toBe('1,234.56');
        expect(addThousandsSeparator(null)).toBe('');
    });
});
