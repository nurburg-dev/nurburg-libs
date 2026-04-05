import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Pool } from "../sql/pg";
import { errorQueryHook, slowQueryHook } from "../sql";
import { HooksConfigV1, hooksConfigV1EnvVar } from "../models";

describe("postgresql postgres client", async (t) => {
    let container: StartedPostgreSqlContainer;
    let pool: Pool;

    before(async () => {
        container = await new PostgreSqlContainer("postgres:17.9").start();

        pool = new Pool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword(),
        });

        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS employees (
                    employee_id SERIAL PRIMARY KEY,
                    first_name VARCHAR(50) NOT NULL,
                    last_name VARCHAR(50) NOT NULL,
                    email VARCHAR(100) UNIQUE,
                    hire_date DATE DEFAULT CURRENT_DATE,
                    salary NUMERIC(10, 2) CHECK (salary > 0)
                );
            `);
        } finally {
            client.release();
        }
    });

    test("positive usecase should work", async () => {
        const p = new Pool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword(),
        });

        const client = await p.connect();
        try {
            await client.query("BEGIN");
            await client.query(
                `INSERT INTO employees (first_name, last_name, email, salary) VALUES ($1, $2, $3, $4)`,
                ["anunay", "biswas", "tester@nurburg.dev", 1000]
            );
            await client.query("COMMIT");

            const result = await client.query("SELECT count(*) FROM employees");
            assert.strictEqual(Number(result.rows[0].count), 1);
        } catch (ex) {
            await client.query("ROLLBACK");
            throw ex;
        } finally {
            client.release();
            await p.end();
        }
    });

    test("error injection should work", async () => {
        process.env[hooksConfigV1EnvVar] = btoa(
            JSON.stringify({
                postgresql: [
                    {
                        type: "errored_commit",
                        errorProbability: 1.0,
                        errorCount: 10,
                    },
                ],
            } satisfies HooksConfigV1)
        );
        const p = new Pool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword(),
        });

        const client = await p.connect();
        try {
            await client.query("BEGIN");
            await client.query(
                `INSERT INTO employees (first_name, last_name, email, salary) VALUES ($1, $2, $3, $4)`,
                ["anunay", "biswas", "tester+1@nurburg.dev", 1000]
            );
            await client.query("COMMIT");
            assert.fail("no error thrown");
        } catch (ex) {
            await client.query("ROLLBACK");
            assert.strictEqual(
                (ex as Error).message,
                "Injected error for query: COMMIT"
            );
            assert.strictEqual((ex as Error).name, "QueryHookError");
        } finally {
            client.release();
            await p.end();
        }
    });

    test("delay injection should work", async () => {
        process.env[hooksConfigV1EnvVar] = btoa(
            JSON.stringify({
                postgresql: [
                    {
                        type: "slow_query",
                        delayMs: 5000,
                    },
                ],
            } satisfies HooksConfigV1)
        );
        const p = new Pool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword(),
        });

        const client = await p.connect();
        try {
            await client.query("BEGIN");
            await client.query(
                `INSERT INTO employees (first_name, last_name, email, salary) VALUES ($1, $2, $3, $4)`,
                ["anunay", "biswas", "tester+1@nurburg.dev", 1000]
            );
            const start = new Date().getTime();
            await client.query("COMMIT");
            const elapsedTime = new Date().getTime() - start;
            assert.equal(elapsedTime > 5000 && elapsedTime < 6000, true);
        } catch (ex) {
            await client.query("ROLLBACK");
            throw ex;
        } finally {
            client.release();
            await p.end();
        }
    });

    test("error injection on insert to specific table should fail write but not commit", async () => {
        process.env[hooksConfigV1EnvVar] = btoa(
            JSON.stringify({
                postgresql: [
                    {
                        type: "errored_commit",
                        errorProbability: 1.0,
                        errorCount: 10,
                        queryPattern: "INSERT INTO employees",
                    },
                ],
            } satisfies HooksConfigV1)
        );
        const p = new Pool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword(),
        });

        const client = await p.connect();
        try {
            await client.query("BEGIN");
            await assert.rejects(
                () =>
                    client.query(
                        `INSERT INTO employees (first_name, last_name, email, salary) VALUES ($1, $2, $3, $4)`,
                        ["anunay", "biswas", "tester+table@nurburg.dev", 1000]
                    ),
                (err: Error) => {
                    assert.strictEqual(err.name, "QueryHookError");
                    return true;
                }
            );
            // COMMIT itself should not be intercepted
            await client.query("ROLLBACK");
        } finally {
            client.release();
            await p.end();
        }
    });

    after(async () => {
        await pool.end();
        await container.stop();
    });
});
