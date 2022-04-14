import { sum } from '@/mylib/sum';

describe('mylib', () => {
    it('should work', () => {
        expect(sum(10, 10)).toBe(20);
    });
});
