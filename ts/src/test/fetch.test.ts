import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { HooksConfigV1, hooksConfigV1EnvVar } from "../models";
import { hookedFetch, FetchHookError } from "../fetch";

const TEST_URL = "https://jsonplaceholder.typicode.com/posts/1";

afterEach(() => {
    delete process.env[hooksConfigV1EnvVar];
});

describe("hooked fetch", () => {
    test("happy path returns response unchanged", async () => {
        const f = hookedFetch();
        const res = await f(TEST_URL);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.id, 1);
    });

    test("pre_error throws before request is made", async () => {
        let called = false;
        const trackingFetch = async (url: string | URL | Request, init?: RequestInit) => {
            called = true;
            return fetch(url, init);
        };

        process.env[hooksConfigV1EnvVar] = btoa(
            JSON.stringify({
                fetch: [{ type: "pre_error", errorProbability: 1.0, errorCount: 5 }],
            } satisfies HooksConfigV1)
        );

        const f = hookedFetch(trackingFetch);
        await assert.rejects(
            () => f(TEST_URL),
            (err: Error) => {
                assert.equal(err instanceof FetchHookError, true);
                assert.match(err.message, /pre-request error/);
                return true;
            }
        );
        assert.equal(called, false);
    });

    test("post_error throws after request completes", async () => {
        let called = false;
        const trackingFetch = async (url: string | URL | Request, init?: RequestInit) => {
            called = true;
            return fetch(url, init);
        };

        process.env[hooksConfigV1EnvVar] = btoa(
            JSON.stringify({
                fetch: [{ type: "post_error", errorProbability: 1.0, errorCount: 5 }],
            } satisfies HooksConfigV1)
        );

        const f = hookedFetch(trackingFetch);
        await assert.rejects(
            () => f(TEST_URL),
            (err: Error) => {
                assert.equal(err instanceof FetchHookError, true);
                assert.match(err.message, /post-request error/);
                return true;
            }
        );
        assert.equal(called, true);
    });

    test("slow_request adds delay before fetch", async () => {
        process.env[hooksConfigV1EnvVar] = btoa(
            JSON.stringify({
                fetch: [{ type: "slow_request", delayMs: 200 }],
            } satisfies HooksConfigV1)
        );

        const f = hookedFetch();
        const start = Date.now();
        const res = await f(TEST_URL);
        const elapsed = Date.now() - start;

        assert.equal(res.status, 200);
        assert.equal(elapsed >= 200, true);
    });
});
