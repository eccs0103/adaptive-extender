"use strict";

import { Controller } from "adaptive-extender/core";
import { assert, describe, it, expect } from "vitest";

describe("Controller", () => {
	it("should throw an error when trying to create an instance of an abstract class", () => {
		//@ts-ignore
		assert.throws(() => new Controller(), TypeError, "Unable to create an instance of an abstract class");
	});

	it("should launch the controller and call the run method", async () => {
		let runCalled = false;

		class TestController extends Controller {
			async run() {
				runCalled = true;
			}
		}

		await TestController.launch();
		assert.isTrue(runCalled, "run method should be called");
	});

	it("should call the catch method when an error occurs in the run method", async () => {
		let catchCalled = false;
		const testError = new Error("Test error");

		class TestController extends Controller {
			async run() {
				throw testError;
			}

			async catch(error: Error) {
				catchCalled = true;
				assert.strictEqual(error, testError, "error in catch should be the one thrown");
			}
		}

		await TestController.launch();
		assert.isTrue(catchCalled, "catch method should be called");
	});

	it("should forward args to the run method", async () => {
		let received: [string, number] | undefined;

		class TestController extends Controller<[string, number]> {
			async run(name: string, value: number) {
				received = [name, value];
			}
		}

		await TestController.launch("hello", 42);
		assert.deepEqual(received, ["hello", 42], "run should receive forwarded args");
	});

	it("should call finally after a successful run", async () => {
		let order: string[] = [];

		class TestController extends Controller {
			async run() {
				order.push("run");
			}

			async finally() {
				order.push("finally");
			}
		}

		await TestController.launch();
		assert.deepEqual(order, ["run", "finally"]);
	});

	it("should re-throw errors by default when catch is not overridden", async () => {
		const testError = new Error("uncaught");

		class TestController extends Controller {
			async run() {
				throw testError;
			}
		}

		await expect(TestController.launch()).rejects.toThrow("uncaught");
	});

	it("should call finally even when run throws", async () => {
		let order: string[] = [];

		class TestController extends Controller {
			async run() {
				order.push("run");
				throw new Error("boom");
			}

			async catch() {
				order.push("catch");
			}

			async finally() {
				order.push("finally");
			}
		}

		await TestController.launch();
		assert.deepEqual(order, ["run", "catch", "finally"]);
	});
});
