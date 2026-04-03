import { test, describe, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { KafkaContainer, StartedKafkaContainer } from "@testcontainers/kafka";
import { Kafka } from "../kafka";
import { flakyConsumerHook } from "../kafka/hooks";
import { HooksConfigV1, hooksConfigV1EnvVar } from "../models";

describe("kafka integration", async (t) => {
    let container: StartedKafkaContainer;

    before(async () => {
        container = await new KafkaContainer(
            "confluentinc/cp-kafka:7.7.8"
        ).start();
    });

    after(async () => {
        await container.stop();
    });

    afterEach(() => {
        process.env[hooksConfigV1EnvVar] = "";
    });

    test("produce and consume one message", async (t) => {
        const topic = "test-topic";

        // The KafkaContainer module usually maps the external port to 9093
        // Use getMappedPort(9093) specifically.
        const host = container.getHost();
        const port = container.getMappedPort(9093);
        const broker = `${host}:${port}`;

        const kafka = new Kafka({
            brokers: [broker],
            // Adding a short retry for the initial connection
            retry: { retries: 5 },
        });

        const producer = kafka.producer();
        const consumer = kafka.consumer({ groupId: "test-group" });

        try {
            await producer.connect();
            await consumer.connect();
            await consumer.subscribe({ topic, fromBeginning: true });

            let resolveReceived: (value: string) => void;
            const received = new Promise<string>((resolve, reject) => {
                const timeout = setTimeout(
                    () => reject(new Error("Timeout")),
                    10000
                );
                resolveReceived = (value: string) => {
                    clearTimeout(timeout);
                    resolve(value);
                };
            });

            await consumer.run({
                eachMessage: async ({ message }) => {
                    if (message.value)
                        resolveReceived(message.value.toString());
                },
            });

            await producer.send({
                topic,
                messages: [{ key: "key1", value: "hello world" }],
            });

            const value = await received;
            assert.strictEqual(value, "hello world");
        } finally {
            // CRITICAL: Stop the client software BEFORE the container
            // This prevents the ECONNREFUSED spam in your logs
            await producer.disconnect().catch(() => {});
            await consumer.stop().catch(() => {});
            await consumer.disconnect().catch(() => {});
        }
    });
    test("consumer handles double delivery via seek", async (t) => {
        const topic = "double-delivery-topic";
        const host = container.getHost();
        const port = container.getMappedPort(9093);
        const broker = `${host}:${port}`;
        process.env[hooksConfigV1EnvVar] = JSON.stringify({
            kafka: [
                {
                    type: "flaky_consumer",
                    errorProbability: 1.0,
                    errorCount: 10,
                },
            ],
        } satisfies HooksConfigV1);
        const kafka = new Kafka({ brokers: [broker] });
        const producer = kafka.producer();
        const consumer = kafka.consumer({ groupId: "double-delivery-group" });

        await producer.connect();
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });

        const receivedMessages: string[] = [];
        let resolveTest: () => void;
        const testFinished = new Promise<void>((resolve) => {
            resolveTest = resolve;
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const value = message.value?.toString();
                if (!value) return;

                receivedMessages.push(value);

                // Once we receive the message the first time,
                // we manually tell the consumer to "rewind" to the same offset
                if (receivedMessages.length === 1) {
                    consumer.seek({
                        topic,
                        partition,
                        offset: message.offset,
                    });
                }

                // Once we have seen the message twice, we are done
                if (receivedMessages.length === 2) {
                    resolveTest();
                }
            },
        });

        try {
            await producer.send({
                topic,
                messages: [{ key: "test-key", value: "duplicate-me" }],
            });

            // Wait for the double delivery to be confirmed
            await testFinished;

            assert.strictEqual(
                receivedMessages.length,
                2,
                "Should have received the message twice"
            );
            assert.strictEqual(receivedMessages[0], "duplicate-me");
            assert.strictEqual(receivedMessages[1], "duplicate-me");
        } finally {
            await consumer.stop();
            await consumer.disconnect();
            await producer.disconnect();
        }
    });
});
