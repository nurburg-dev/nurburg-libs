import {
    Producer,
    Consumer,
    ProducerRecord,
    ProducerBatch,
    ConsumerRunConfig,
} from "kafkajs";
import { KafkaHooks } from "./models";

function buildChain<T>(
    hooks: Array<(arg: T, next: () => Promise<any>) => Promise<any>>,
    arg: T,
    userHandler: () => Promise<any>
): () => Promise<any> {
    let chain = userHandler;
    for (const hook of [...hooks].reverse()) {
        const next = chain;
        chain = () => hook(arg, next);
    }
    return chain;
}

// --- Producer wrapper ---

export function wrapProducer(
    producer: Producer,
    hooks: NonNullable<KafkaHooks["producer"]>
): Producer {
    return new Proxy(producer, {
        get(target, prop) {
            if (prop === "send" && hooks.send?.length) {
                return (record: ProducerRecord) =>
                    buildChain(hooks.send!, record, () =>
                        target.send(record)
                    )();
            }

            if (prop === "sendBatch" && hooks.sendBatch?.length) {
                return (batch: ProducerBatch) =>
                    buildChain(hooks.sendBatch!, batch, () =>
                        target.sendBatch(batch)
                    )();
            }

            return Reflect.get(target, prop);
        },
    });
}

// --- Consumer wrapper ---

export function wrapConsumer(
    consumer: Consumer,
    hooks: NonNullable<KafkaHooks["consumer"]>
): Consumer {
    return new Proxy(consumer, {
        get(target, prop) {
            if (prop !== "run") return Reflect.get(target, prop);

            return (config: ConsumerRunConfig = {}) => {
                const wrappedConfig: ConsumerRunConfig = { ...config };

                if (config.eachMessage && hooks.eachMessage?.length) {
                    const userHandler = config.eachMessage;
                    wrappedConfig.eachMessage = (payload) =>
                        buildChain(hooks.eachMessage!, payload, () =>
                            userHandler(payload)
                        )();
                }

                if (config.eachBatch && hooks.eachBatch?.length) {
                    const originalHandler = config.eachBatch;
                    wrappedConfig.eachBatch = (payload) =>
                        buildChain(hooks.eachBatch!, payload, () =>
                            originalHandler(payload)
                        )();
                }

                return target.run(wrappedConfig);
            };
        },
    });
}
