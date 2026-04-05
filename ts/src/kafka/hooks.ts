// --- Hook examples ---

import { KafkaHookConfigV1, defaultErrorProbability, defaultErrorCount, debug } from "../models";
import {
    ConsumerHook,
    ProducerHook,
    KafkaHooks,
    ConsumerBatchHook,
    ProducerBatchHook,
} from "./models";

export function slowProducerHook(delayMs: number): ProducerHook {
    debug(`[nurburg] kafka slow_producer hook activated: delayMs=${delayMs}`);
    return async (record, next) => {
        debug(`[nurburg] kafka slow_producer applying: delayMs=${delayMs} topic=${record.topic}`);
        await new Promise((r) => setTimeout(r, delayMs));
        return next();
    };
}

export function slowProducerBatchHook(delayMs: number): ProducerBatchHook {
    debug(`[nurburg] kafka slow_producer_batch hook activated: delayMs=${delayMs}`);
    return async (batch, next) => {
        debug(`[nurburg] kafka slow_producer_batch applying: delayMs=${delayMs}`);
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
    debug(`[nurburg] kafka flaky_consumer hook activated: errProbability=${errProbability} failCount=${failCount}`);
    let remainingFails = failCount;

    return async (payload, next) => {
        await next();
        if (Math.random() <= errProbability && remainingFails > 0) {
            remainingFails -= 1;
            debug(`[nurburg] kafka flaky_consumer applying: remainingFails=${remainingFails} topic=${payload.topic}`);
            throw new Error(
                `flakyConsumerHook failed (${failCount - remainingFails}/${failCount}) for topic=${payload.topic}`
            );
        }
        debug(`[nurburg] kafka flaky_consumer bypassing: topic=${payload.topic}`);
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
    debug(`[nurburg] kafka flaky_consumer_batch hook activated: errProbability=${errProbability} failCount=${failCount}`);
    let remainingFails = failCount;

    return async (payload, next) => {
        await next();
        if (Math.random() <= errProbability && remainingFails > 0) {
            remainingFails -= 1;
            debug(`[nurburg] kafka flaky_consumer_batch applying: remainingFails=${remainingFails}`);
            throw new Error(
                `flakyConsumerHook failed (${failCount - remainingFails}/${failCount})`
            );
        }
        debug(`[nurburg] kafka flaky_consumer_batch bypassing`);
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
                defaultErrorProbability(c.errorProbability),
                defaultErrorCount(c.errorCount)
            );
            const hook2 = flakyConsumerBatchHook(
                defaultErrorProbability(c.errorProbability),
                defaultErrorCount(c.errorCount)
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
