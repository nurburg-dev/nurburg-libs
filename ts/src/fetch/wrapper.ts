import { getHooksConfigV1 } from "../models";
import { FetchHook } from "./models";
import { getFetchHooksFromCfg } from "./hooks";

export function hookedFetch(fetchFn: typeof fetch = fetch): typeof fetch {
    const { fetch: fetchHooksCfg } = getHooksConfigV1();
    if (!fetchHooksCfg?.length) return fetchFn;

    const hooks = getFetchHooksFromCfg(fetchHooksCfg);

    return (url, init) => {
        const next = () => fetchFn(url, init);
        let chain: () => Promise<Response> = next;
        for (const hook of [...hooks].reverse()) {
            const currentNext = chain;
            chain = () =>
                hook(url as string | URL | Request, init, currentNext);
        }
        return chain();
    };
}
