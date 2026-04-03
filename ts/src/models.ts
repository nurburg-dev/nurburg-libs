import { FetchHookConfigV1 } from "./fetch/models";

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
    fetch?: FetchHookConfigV1[];
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

// { "postgresql": [{"type": "errored_commit", "errorCount": 2, "errorProbability": 1}]}
// IHsgInBvc3RncmVzcWwiOiBbeyJ0eXBlIjogImVycm9yZWRfY29tbWl0IiwgImVycm9yQ291bnQiOiAyLCAiZXJyb3JQcm9iYWJpbGl0eSI6IDF9XX0=

// { "postgresql": [{"type": "slow_query", "delayMs": 300 }]}
// eyAicG9zdGdyZXNxbCI6IFt7InR5cGUiOiAic2xvd19xdWVyeSIsICJkZWxheU1zIjogMzAwIH1dfQ==
export function getHooksConfigV1(): HooksConfigV1 {
    const str = process.env[hooksConfigV1EnvVar];
    if (!str) {
        return {} satisfies HooksConfigV1;
    }
    try {
        return JSON.parse(atob(str)) as HooksConfigV1;
    } catch (ex) {
        console.warn("not parsable hooks config", str);
        return {} satisfies HooksConfigV1;
    }
}
