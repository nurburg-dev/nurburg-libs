// --- Hook examples ---

import { KafkaHookConfigV1 } from "../models";
import {
    ConsumerHook,
    ProducerHook,
    KafkaHooks,
    ConsumerBatchHook,
    ProducerBatchHook,
} from "./models";

export function slowProducerHook(delayMs: number): ProducerHook {
    return async (record, next) => {
        console.log(`[hooked-kafka] send intercepted — sleeping ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
        return next();
    };
}

export function slowProducerBatchHook(delayMs: number): ProducerBatchHook {
    return async (record, next) => {
        console.log(`[hooked-kafka] send intercepted — sleeping ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
        return next();
    };
}
/**
 * A consumer hook that fails the first `failCount` invocations and succeeds thereafter.
 * Useful for testing retry logic where transient errors are expected.
 */
export function flakyConsumerHook(
    errProbability: number,
    failCount: number
): ConsumerHook {
    let remainingFails = failCount;

    return async (payload, next) => {
        await next();
        if (Math.random() <= errProbability && remainingFails > 0) {
            remainingFails -= 1;
            throw new Error(
                `flakyConsumerHook failed (${failCount - remainingFails}/${failCount}) for topic=${payload.topic}`
            );
        }
    };
}

/**
 * A consumer hook that fails the first `failCount` invocations and succeeds thereafter.
 * Useful for testing retry logic where transient errors are expected.
 */
export function flakyConsumerBatchHook(
    errProbability: number,
    failCount: number
): ConsumerBatchHook {
    let remainingFails = failCount;

    return async (payload, next) => {
        await next();
        if (Math.random() <= errProbability && remainingFails > 0) {
            remainingFails -= 1;
            throw new Error(
                `flakyConsumerHook failed (${failCount - remainingFails}/${failCount})`
            );
        }
    };
}

export function getHooksFromCfg(cfg: KafkaHookConfigV1[]): KafkaHooks {
    const h: KafkaHooks = {
        producer: {
            send: [],
            sendBatch: [],
        },
        consumer: {
            eachBatch: [],
            eachMessage: [],
        },
    };
    cfg.forEach((c) => {
        if (c.type === "flaky_consumer") {
            const hook = flakyConsumerHook(
                c.errorProbability ?? 1.0,
                c.errorCount ?? 10
            );
            const hook2 = flakyConsumerBatchHook(
                c.errorProbability ?? 1.0,
                c.errorCount ?? 10
            );
            h.consumer?.eachMessage?.push(hook);
            h.consumer?.eachBatch?.push(hook2);
        } else {
            const hook = slowProducerHook(c.delayMs ?? 500);
            const hook2 = slowProducerBatchHook(c.delayMs ?? 500);
            h.producer?.send?.push(hook);
            h.producer?.sendBatch?.push(hook2);
        }
    });
    return h;
}
