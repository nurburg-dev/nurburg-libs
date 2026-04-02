// --- Hook examples ---

import { ConsumerHook, ProducerHook } from "./models";

export function logProducerHook(): ProducerHook {
    return async (record, next) => {
        const start = Date.now();
        const result = await next();
        console.log(
            `[hooked-kafka] send topic=${record.topic} messages=${record.messages.length} time=${Date.now() - start}ms`
        );
        return result;
    };
}

export function slowProducerHook(delayMs: number): ProducerHook {
    return async (record, next) => {
        console.log(`[hooked-kafka] send intercepted — sleeping ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
        return next();
    };
}

export function logConsumerHook(): ConsumerHook {
    return async (payload, next) => {
        const start = Date.now();
        await next();
        console.log(
            `[hooked-kafka] message topic=${payload.topic} partition=${payload.partition} offset=${payload.message.offset} time=${Date.now() - start}ms`
        );
    };
}

/**
 * A consumer hook that fails the first `failCount` invocations and succeeds thereafter.
 * Useful for testing retry logic where transient errors are expected.
 */
export function flakyConsumerHook(failCount: number): ConsumerHook {
    let remainingFails = failCount;

    return async (payload, next) => {
        await next();
        if (remainingFails > 0) {
            remainingFails -= 1;
            throw new Error(
                `flakyConsumerHook failed (${failCount - remainingFails}/${failCount}) for topic=${payload.topic}`
            );
        }
    };
}
