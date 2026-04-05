import {
    Kafka as BaseKafka,
    KafkaConfig,
    Producer,
    ProducerConfig,
    Consumer,
    ConsumerConfig,
} from "kafkajs";
import { KafkaHooks } from "./models";
import { wrapConsumer, wrapProducer } from "./wrapper";
import { getHooksFromCfg } from "./hooks";
import { getHooksConfigV1, debug } from "../models";

// --- HookedKafka ---

export class Kafka {
    private kafka: BaseKafka;
    private hooks: KafkaHooks;

    constructor(config: KafkaConfig) {
        this.kafka = new BaseKafka(config);
        const kafkaCfg = getHooksConfigV1().kafka ?? [];
        debug(`[nurburg] kafka: ${kafkaCfg.length ? `hooks config ${JSON.stringify(kafkaCfg)}` : "no hooks config"}`);
        this.hooks = getHooksFromCfg(kafkaCfg);
    }

    producer(config?: ProducerConfig): Producer {
        return wrapProducer(
            this.kafka.producer(config),
            this.hooks.producer ?? {}
        );
    }

    consumer(config: ConsumerConfig): Consumer {
        return wrapConsumer(
            this.kafka.consumer(config),
            this.hooks.consumer ?? {}
        );
    }

    admin = (config?: Parameters<BaseKafka["admin"]>[0]) =>
        this.kafka.admin(config);

    logger = () => this.kafka.logger();
}
