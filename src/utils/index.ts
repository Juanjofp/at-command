const TIME_OUT = 4000;
export function runAfterTimeout(callback: () => void, timeout = TIME_OUT) {
    return setTimeout(() => {
        callback();
    }, timeout);
}

export function waitForMillisecond(time = 200): Promise<number> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(time);
        }, time);
    });
}

export async function runWithRetryDelayed<T>(
    callback: () => Promise<T>,
    retries = 3,
    delay = 200
): Promise<T> {
    try {
        return await callback();
    } catch (error) {
        if (retries === 1) {
            throw error;
        }
        await waitForMillisecond(delay);
        return await runWithRetryDelayed<T>(callback, retries - 1, delay);
    }
}
