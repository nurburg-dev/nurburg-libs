import {
    Pool as PgPool,
    PoolClient as PgPoolClient,
    PoolConfig as PgPoolConfig,
} from "pg";
import { QueryHook } from "./models";

function wrapClient(client: PgPoolClient, hooks: QueryHook[]): PgPoolClient {
    return new Proxy(client, {
        get(target, prop) {
            if (prop !== "query") return Reflect.get(target, prop);

            return async (
                queryOrConfig: string | object,
                values?: unknown[]
            ) => {
                const queryText =
                    typeof queryOrConfig === "string"
                        ? queryOrConfig
                        : (queryOrConfig as { text: string }).text;

                const next = () =>
                    typeof queryOrConfig === "string"
                        ? target.query(queryOrConfig, values)
                        : target.query(queryOrConfig as any);

                let chain = next;
                for (const hook of [...hooks].reverse()) {
                    const currentNext = chain;
                    chain = () => hook(queryText, values, currentNext);
                }

                return chain();
            };
        },
    });
}

export class Pool extends PgPool {
    private hooks: QueryHook[];

    constructor(config: PgPoolConfig, hooks: QueryHook[]) {
        super(config);
        this.hooks = hooks;
    }

    async connect(): Promise<PgPoolClient> {
        const client = await super.connect();
        return wrapClient(client, this.hooks);
    }
}
