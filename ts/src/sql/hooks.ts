import { QueryHook, QueryHookError, SQLHookConfigV1, defaultErrorProbability, defaultErrorCount, debug } from "../models";

const DEFAULT_PATTERN = /^COMMIT$/i;

// Converts a plain-text query pattern to a robust case-insensitive regex:
//   - whitespace sequences become \s+ (handles indentation/newlines)
//   - "INTO <table>" expands to "INTO (?:\w+\.)?<table>" so both
//     "employees" and "public.employees" are matched
function toPattern(queryPattern: string | undefined): RegExp {
    if (!queryPattern) return DEFAULT_PATTERN;

    // 1. Expand INTO <table> before escaping so we can identify word boundaries
    const withSchema = queryPattern.replace(
        /\bINTO\s+(\w+)\b/gi,
        (_, table) => `INTO \x00${table}` // placeholder preserves table name
    );

    // 2. Escape all regex metacharacters
    const escaped = withSchema.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 3. Normalize whitespace runs to \s+
    const normalized = escaped.replace(/\s+/g, "\\s+");

    // 4. Replace placeholder with optional-schema expansion
    const final = normalized.replace(/\x00(\w+)/g, "(?:\\w+\\.)?$1");

    return new RegExp(final, "i");
}

export function slowQueryHook(delayMs: number, match: RegExp): QueryHook {
    debug(`[nurburg] sql slow_query hook activated: delayMs=${delayMs} pattern=${match}`);
    return async (query, _values, next) => {
        if (match.test(query)) {
            debug(`[nurburg] sql slow_query applying: delayMs=${delayMs} query="${query}"`);
            await new Promise((r) => setTimeout(r, delayMs));
        } else {
            debug(`[nurburg] sql slow_query bypassing: query="${query}"`);
        }
        return next();
    };
}

export function errorQueryHook(
    errProbability: number,
    failCount: number,
    match: RegExp
): QueryHook {
    debug(`[nurburg] sql errored_commit hook activated: errProbability=${errProbability} failCount=${failCount} pattern=${match}`);
    let remainingFails = failCount;

    return async (query, _values, next) => {
        if (match.test(query) && remainingFails > 0 && Math.random() <= errProbability) {
            remainingFails -= 1;
            debug(`[nurburg] sql errored_commit applying: remainingFails=${remainingFails} query="${query}"`);
            throw new QueryHookError(query, `Injected error for query: ${query}`);
        }
        debug(`[nurburg] sql errored_commit bypassing: query="${query}"`);
        return next();
    };
}

export function getHooksFromCfg(cfg: SQLHookConfigV1[]): QueryHook[] {
    return cfg.map(
        ({ type, delayMs, errorProbability, errorCount, queryPattern }) => {
            const match = toPattern(queryPattern);
            if (type === "errored_commit") {
                return errorQueryHook(
                    defaultErrorProbability(errorProbability),
                    defaultErrorCount(errorCount),
                    match
                );
            }
            return slowQueryHook(delayMs ?? 500, match);
        }
    );
}
