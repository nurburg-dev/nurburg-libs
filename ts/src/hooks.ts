import { QueryHook, QueryHookError } from "./models";

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

export function errorQueryHook(match: string | RegExp = "COMMIT"): QueryHook {
    return async (query, _values, next) => {
        const matched =
            typeof match === "string"
                ? query.trim().toUpperCase() === match.toUpperCase()
                : match.test(query);
        if (matched) {
            throw new QueryHookError(
                query,
                `Injected error for query: ${query}`
            );
        }
        return next();
    };
}
