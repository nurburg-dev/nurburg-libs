import { QueryHook, QueryHookError, SQLHookConfigV1 } from "./models";

export function slowQueryHook(
    delayMs: number,
    match: string | RegExp = "COMMIT"
): QueryHook {
    return async (query, _values, next) => {
        const matched =
            typeof match === "string"
                ? query.trim().toUpperCase() === match.toUpperCase()
                : match.test(query);
        if (matched) {
            await new Promise((r) => setTimeout(r, delayMs));
        }
        return next();
    };
}

export function errorQueryHook(
    errProbability: number,
    failCount: number,
    match: string | RegExp = "COMMIT"
): QueryHook {
    let remainingFails = failCount;

    return async (query, _values, next) => {
        const matched =
            typeof match === "string"
                ? query.trim().toUpperCase() === match.toUpperCase()
                : match.test(query);
        if (matched && remainingFails > 0 && Math.random() <= errProbability) {
            remainingFails -= 1;
            throw new QueryHookError(
                query,
                `Injected error for query: ${query}`
            );
        }
        return next();
    };
}

export function getHooksFromCfg(cfg: SQLHookConfigV1[]): QueryHook[] {
    return cfg.map(({ type, delayMs, errorProbability, errorCount }) => {
        if (type === "errored_commit") {
            return errorQueryHook(errorProbability ?? 1.0, errorCount ?? 10);
        }
        return slowQueryHook(delayMs ?? 500);
    });
}
