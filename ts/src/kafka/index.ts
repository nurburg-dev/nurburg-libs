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

// --- HookedKafka ---

export class HookedKafka {
    private kafka: BaseKafka;
    private hooks: KafkaHooks;

    constructor(config: KafkaConfig, hooks: KafkaHooks) {
        this.kafka = new BaseKafka(config);
        this.hooks = hooks;
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
