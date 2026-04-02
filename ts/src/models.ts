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
