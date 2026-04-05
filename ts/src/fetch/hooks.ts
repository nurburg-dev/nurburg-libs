import { FetchHookConfigV1 } from "./models";
import { FetchHook, FetchHookError } from "./models";
import { defaultErrorProbability, defaultErrorCount, debug } from "../models";

function urlMatches(url: string | URL | Request, pattern: RegExp): boolean {
    const str = url instanceof Request ? url.url : String(url);
    return pattern.test(str);
}

function toPattern(urlPattern: string | undefined): RegExp {
    return urlPattern && urlPattern !== "*" ? new RegExp(urlPattern) : /.*/;
}

/**
 * Throws before the request is made.
 * Simulates the network being unavailable or the client failing pre-flight.
 */
export function preErrorFetchHook(
    errProbability: number,
    failCount: number,
    urlPattern: RegExp
): FetchHook {
    debug(`[nurburg] fetch pre_error hook activated: errProbability=${errProbability} failCount=${failCount} pattern=${urlPattern}`);
    let remainingFails = failCount;

    return async (url, _init, next) => {
        if (!urlMatches(url, urlPattern)) {
            debug(`[nurburg] fetch pre_error bypassing: url="${url}"`);
            return next();
        }
        if (remainingFails > 0 && Math.random() <= errProbability) {
            remainingFails -= 1;
            debug(`[nurburg] fetch pre_error applying: remainingFails=${remainingFails} url="${url}"`);
            throw new FetchHookError(url, `Injected pre-request error for: ${url}`);
        }
        debug(`[nurburg] fetch pre_error bypassing: exhausted url="${url}"`);
        return next();
    };
}

/**
 * Lets the request complete, then throws.
 * Simulates the response being discarded due to a client-side failure after receipt.
 */
export function postErrorFetchHook(
    errProbability: number,
    failCount: number,
    urlPattern: RegExp
): FetchHook {
    debug(`[nurburg] fetch post_error hook activated: errProbability=${errProbability} failCount=${failCount} pattern=${urlPattern}`);
    let remainingFails = failCount;

    return async (url, _init, next) => {
        const response = await next();
        if (!urlMatches(url, urlPattern)) {
            debug(`[nurburg] fetch post_error bypassing: url="${url}"`);
            return response;
        }
        if (remainingFails > 0 && Math.random() <= errProbability) {
            remainingFails -= 1;
            debug(`[nurburg] fetch post_error applying: remainingFails=${remainingFails} url="${url}"`);
            throw new FetchHookError(url, `Injected post-request error for: ${url}`);
        }
        debug(`[nurburg] fetch post_error bypassing: exhausted url="${url}"`);
        return response;
    };
}

/**
 * Adds a delay before the request is made.
 */
export function slowFetchHook(delayMs: number, urlPattern: RegExp): FetchHook {
    debug(`[nurburg] fetch slow_request hook activated: delayMs=${delayMs} pattern=${urlPattern}`);
    return async (url, _init, next) => {
        if (!urlMatches(url, urlPattern)) {
            debug(`[nurburg] fetch slow_request bypassing: url="${url}"`);
            return next();
        }
        debug(`[nurburg] fetch slow_request applying: delayMs=${delayMs} url="${url}"`);
        await new Promise((r) => setTimeout(r, delayMs));
        return next();
    };
}

export function getFetchHooksFromCfg(cfg: FetchHookConfigV1[]): FetchHook[] {
    return cfg.map(
        ({ type, delayMs, errorProbability, errorCount, urlPattern }) => {
            const pattern = toPattern(urlPattern);
            if (type === "pre_error") {
                return preErrorFetchHook(
                    defaultErrorProbability(errorProbability),
                    defaultErrorCount(errorCount),
                    pattern
                );
            }
            if (type === "post_error") {
                return postErrorFetchHook(
                    defaultErrorProbability(errorProbability),
                    defaultErrorCount(errorCount),
                    pattern
                );
            }
            return slowFetchHook(delayMs ?? 500, pattern);
        }
    );
}
