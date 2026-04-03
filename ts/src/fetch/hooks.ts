import { FetchHookConfigV1 } from "./models";
import { FetchHook, FetchHookError } from "./models";

/**
 * Throws before the request is made.
 * Simulates the network being unavailable or the client failing pre-flight.
 */
export function preErrorFetchHook(
    errProbability: number,
    failCount: number
): FetchHook {
    let remainingFails = failCount;

    return async (url, _init, next) => {
        if (remainingFails > 0 && Math.random() <= errProbability) {
            remainingFails -= 1;
            throw new FetchHookError(url, `Injected pre-request error for: ${url}`);
        }
        return next();
    };
}

/**
 * Lets the request complete, then throws.
 * Simulates the response being discarded due to a client-side failure after receipt.
 */
export function postErrorFetchHook(
    errProbability: number,
    failCount: number
): FetchHook {
    let remainingFails = failCount;

    return async (url, _init, next) => {
        const response = await next();
        if (remainingFails > 0 && Math.random() <= errProbability) {
            remainingFails -= 1;
            throw new FetchHookError(url, `Injected post-request error for: ${url}`);
        }
        return response;
    };
}

/**
 * Adds a delay before the request is made.
 */
export function slowFetchHook(delayMs: number): FetchHook {
    return async (_url, _init, next) => {
        await new Promise((r) => setTimeout(r, delayMs));
        return next();
    };
}

export function getFetchHooksFromCfg(cfg: FetchHookConfigV1[]): FetchHook[] {
    return cfg.map(({ type, delayMs, errorProbability, errorCount }) => {
        if (type === "pre_error") {
            return preErrorFetchHook(errorProbability ?? 1.0, errorCount ?? 10);
        }
        if (type === "post_error") {
            return postErrorFetchHook(errorProbability ?? 1.0, errorCount ?? 10);
        }
        return slowFetchHook(delayMs ?? 500);
    });
}
