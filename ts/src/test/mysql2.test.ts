import { test, describe, before, after, afterEach } from "node:test";
import { StartedMySqlContainer, MySqlContainer } from "@testcontainers/mysql";
import { Pool } from "../mysql2";
import assert from "node:assert/strict";
import { errorQueryHook, slowQueryHook } from "../hooks";
import { HooksConfigV1, hooksConfigV1EnvVar } from "../models";

describe("mysql client", async (t) => {
    let container: StartedMySqlContainer;
    let pool: Pool;
    before(async () => {
        container = await new MySqlContainer("mysql:9").start();
        pool = new Pool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getRootPassword(),
        });

        const client = await pool.getConnection();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS employees (
                    employee_id INT NOT NULL AUTO_INCREMENT,
                    first_name VARCHAR(50) NOT NULL,
                    last_name VARCHAR(50) NOT NULL,
                    email VARCHAR(100) UNIQUE,
                    hire_date DATE DEFAULT (CURRENT_DATE),
                    salary DECIMAL(10, 2),
                    PRIMARY KEY (employee_id),
                    CONSTRAINT chk_salary CHECK (salary > 0)
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
            password: container.getRootPassword(),
        });

        const client = await p.getConnection();
        try {
            await client.query("BEGIN");
            await client.query(
                `INSERT INTO employees (first_name, last_name, email, salary) VALUES (?, ?, ?, ?)`,
                ["anunay", "biswas", "tester@nurburg.dev", 1000]
            );
            await client.query("COMMIT");

            const [rows] = await client.query(
                "SELECT count(*) AS count FROM employees"
            );
            assert.strictEqual(Number((rows as any[])[0].count), 1);
        } catch (ex) {
            await client.query("ROLLBACK");
            throw ex;
        } finally {
            client.release();
            await p.end();
        }
    });

    afterEach(() => {
        process.env[hooksConfigV1EnvVar] = "";
    });

    test("error injection should work", async () => {
        process.env[hooksConfigV1EnvVar] = btoa(
            JSON.stringify({
                mysql: [
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
            password: container.getRootPassword(),
        });

        const client = await p.getConnection();
        try {
            await client.query("BEGIN");
            await client.query(
                `INSERT INTO employees (first_name, last_name, email, salary) VALUES (?, ?, ?, ?)`,
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
                mysql: [
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
            password: container.getRootPassword(),
        });

        const client = await p.getConnection();
        try {
            await client.query("BEGIN");
            await client.query(
                `INSERT INTO employees (first_name, last_name, email, salary) VALUES (?, ?, ?, ?)`,
                ["anunay", "biswas", "tester+1@nurburg.dev", 1000]
            );
            const start = new Date().getTime();
            await client.query("COMMIT");
            const elapsedTime = new Date().getTime() - start;
            assert.equal(elapsedTime >= 5000 && elapsedTime < 6000, true);
        } catch (ex) {
            await client.query("ROLLBACK");
            throw ex;
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
