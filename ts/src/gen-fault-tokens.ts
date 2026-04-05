import type { HooksConfigV1 } from "./models";

function toToken(config: HooksConfigV1): string {
    return Buffer.from(JSON.stringify(config)).toString("base64");
}

function printToken(label: string, config: HooksConfigV1): void {
    console.log(`\n# ${label}`);
    console.log(`  JSON:  ${JSON.stringify(config)}`);
    console.log(`  TOKEN: ${toToken(config)}`);
}

printToken("fetch", {
    fetch: [
        {
            type: "post_error",
            errorProbability: 1,
            errorCount: 10,
            urlPattern: "/flight-bookings/block",
        },
    ],
});

printToken("postgresql / errored_commit (always)", {
    postgresql: [{ type: "errored_commit", errorProbability: 1 }],
});

printToken("mysql / errored_commit (always)", {
    mysql: [{ type: "errored_commit", errorProbability: 1 }],
});

printToken("kafka / flaky_consumer (always)", {
    kafka: [{ type: "flaky_consumer", errorProbability: 1 }],
});
