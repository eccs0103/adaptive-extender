"use strict";

import { Controller } from "adaptive-extender/core";
import { assert, describe, it } from "vitest";

describe("Controller", () => {
	it("should throw an error when trying to create an instance of an abstract class", () => {
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
});
