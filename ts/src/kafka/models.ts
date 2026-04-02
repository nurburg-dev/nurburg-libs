import {
    ProducerRecord,
    ProducerBatch,
    RecordMetadata,
    EachMessagePayload,
    EachBatchPayload,
} from "kafkajs";

export type ProducerHook = (
    record: ProducerRecord,
    next: () => Promise<RecordMetadata[]>
) => Promise<RecordMetadata[]>;

export type ProducerBatchHook = (
    batch: ProducerBatch,
    next: () => Promise<RecordMetadata[]>
) => Promise<RecordMetadata[]>;

export type ConsumerHook = (
    payload: EachMessagePayload,
    next: () => Promise<void>
) => Promise<void>;

export type ConsumerBatchHook = (
    payload: EachBatchPayload,
    next: () => Promise<void>
) => Promise<void>;

export interface KafkaHooks {
    producer?: {
        send?: ProducerHook[];
        sendBatch?: ProducerBatchHook[];
    };
    consumer?: {
        eachMessage?: ConsumerHook[];
        eachBatch?: ConsumerBatchHook[];
    };
}
