import {
    createPool as createMySQLPool,
    Pool as MySQLPool,
    PoolConnection,
    PoolOptions,
} from "mysql2/promise";
import { QueryHook } from "./models";

function buildChain(
    query: string,
    values: unknown[] | undefined,
    hooks: QueryHook[],
    leaf: () => Promise<unknown>
): () => Promise<unknown> {
    let chain = leaf;
    for (const hook of [...hooks].reverse()) {
        const currentNext = chain;
        chain = () => hook(query, values, currentNext);
    }
    return chain;
}

function wrapConnection(
    conn: PoolConnection,
    hooks: QueryHook[]
): PoolConnection {
    return new Proxy(conn, {
        get(target, prop) {
            if (prop === "query" || prop === "execute") {
                return (sqlOrOptions: string | object, values?: unknown[]) => {
                    const queryText =
                        typeof sqlOrOptions === "string"
                            ? sqlOrOptions
                            : (sqlOrOptions as { sql: string }).sql;
                    const leaf = () =>
                        typeof sqlOrOptions === "string"
                            ? (target[prop] as Function)(sqlOrOptions, values)
                            : (target[prop] as Function)(sqlOrOptions);
                    return buildChain(queryText, values, hooks, leaf)();
                };
            }

            if (
                prop === "commit" ||
                prop === "rollback" ||
                prop === "beginTransaction"
            ) {
                const token = prop.toUpperCase() as
                    | "COMMIT"
                    | "ROLLBACK"
                    | "BEGINTRANSACTION";
                return () =>
                    buildChain(token, undefined, hooks, () =>
                        (target[prop] as Function)()
                    )();
            }

            return Reflect.get(target, prop);
        },
    });
}

export class Pool {
    private pool: MySQLPool;
    private hooks: QueryHook[];

    constructor(config: PoolOptions, hooks: QueryHook[]) {
        this.pool = createMySQLPool(config);
        this.hooks = hooks;
    }

    async getConnection(): Promise<PoolConnection> {
        const conn = await this.pool.getConnection();
        return wrapConnection(conn, this.hooks);
    }

    query: MySQLPool["query"] = (...args: any[]) =>
        (this.pool.query as any)(...args);
    execute: MySQLPool["execute"] = (...args: any[]) =>
        (this.pool.execute as any)(...args);
    end() {
        return this.pool.end();
    }
    on: MySQLPool["on"] = (...args: any[]) => (this.pool.on as any)(...args);
}
