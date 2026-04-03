export type FetchHook = (
    url: string | URL | Request,
    init: RequestInit | undefined,
    next: () => Promise<Response>
) => Promise<Response>;

export class FetchHookError extends Error {
    readonly url: string;
    constructor(url: string | URL | Request, message?: string) {
        const urlStr = url instanceof Request ? url.url : String(url);
        super(message ?? `Fetch hook failed for url: ${urlStr}`);
        this.name = "FetchHookError";
        this.url = urlStr;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export interface FetchHookConfigV1 {
    type: "pre_error" | "post_error" | "slow_request";
    delayMs?: number;
    errorProbability?: number;
    errorCount?: number;
}
