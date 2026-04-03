// A hook compatible with both drivers (pg result is a superset so unknown covers both)
export type QueryHook = (
    query: string,
    values: unknown[] | undefined,
    next: () => Promise<unknown>
) => Promise<unknown>;

export class QueryHookError extends Error {
    readonly query: string;
    constructor(query: string, message?: string) {
        super(message ?? `Query hook failed for query: ${query}`);
        this.name = "QueryHookError";
        this.query = query;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export const hooksConfigV1EnvVar = "HOOKS_CONFIG_V1_ENV_VAR";

export interface HooksConfigV1 {
    kafka?: KafkaHookConfigV1[];
    postgresql?: SQLHookConfigV1[];
    mysql?: SQLHookConfigV1[];
}

export interface KafkaHookConfigV1 {
    type: "slow_producer" | "flaky_consumer";
    delayMs?: number;
    errorProbability?: number;
    errorCount?: number;
}

export interface SQLHookConfigV1 {
    type: "errored_commit" | "slow_query";
    delayMs?: number;
    errorProbability?: number;
    errorCount?: number;
}

export function getHooksConfigV1(): HooksConfigV1 {
    const str = process.env[hooksConfigV1EnvVar];
    if (!str) {
        return {} satisfies HooksConfigV1;
    }
    try {
        return JSON.parse(str) as HooksConfigV1;
    } catch (ex) {
        console.warn("not parsable hooks config", str);
        return {} satisfies HooksConfigV1;
    }
}
