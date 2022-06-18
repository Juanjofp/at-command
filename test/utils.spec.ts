import { runWithRetryDelayed } from '@/utils';

describe('Utils should', () => {
    it('call function 3 times with a few ms between calls and fails', async () => {
        expect.assertions(1);
        const cmd = jest.fn();
        cmd.mockRejectedValue(new Error('Tries consumed'));

        try {
            await runWithRetryDelayed(cmd, 3);
        } catch (error) {
            expect(cmd).toHaveBeenCalledTimes(3);
        }
    });

    it('call function 3 times with 100ms between calls and fails', async () => {
        const expectedResult = { ack: 'ok' };
        const cmd = jest.fn();
        cmd.mockRejectedValueOnce(new Error('Tries consumed'));
        cmd.mockRejectedValueOnce(new Error('Tries consumed'));
        cmd.mockRejectedValueOnce(new Error('Tries consumed'));
        cmd.mockResolvedValue(expectedResult);
        const startAt = Date.now();
        const retriesBeforeResolve = 3;
        const delay = 100;

        const result = await runWithRetryDelayed<typeof expectedResult>(
            cmd,
            5,
            delay
        );

        const endAt = Date.now();
        expect(endAt - startAt).toBeGreaterThanOrEqual(
            delay * retriesBeforeResolve
        );
        expect(cmd).toHaveBeenCalledTimes(retriesBeforeResolve + 1);
        expect(result.ack).toEqual('ok');
    });
});
