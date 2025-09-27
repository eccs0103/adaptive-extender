import "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Number extensions", () => {
	describe("Number.import", () => {
		it("should import a valid number", () => {
			assert.strictEqual(Number.import(42), 42);
			assert.strictEqual(Number.import(-3.14), -3.14);
		});

		it("should throw TypeError for non-number types", () => {
			assert.throws(() => Number.import("42"), TypeError);
			assert.throws(() => Number.import(null), TypeError);
			assert.throws(() => Number.import(undefined), TypeError);
			assert.throws(() => Number.import({}), TypeError);
			assert.throws(() => Number.import([]), TypeError);
			assert.throws(() => Number.import(true), TypeError);
		});

		it("should use custom name in error message", () => {
			try {
				Number.import("not-a-number", "customName");
			} catch (e: any) {
				assert.ok(e.message.includes("customName"));
			}
		});
	});

	describe("Number.prototype.insteadNaN", () => {
		it("should return fallback for NaN", () => {
			assert.strictEqual((NaN as number).insteadNaN("fallback"), "fallback");
		});

		it("should return original number if not NaN", () => {
			assert.strictEqual((5 as number).insteadNaN("fallback"), 5);
			assert.strictEqual((0 as number).insteadNaN("fallback"), 0);
		});
	});

	describe("Number.prototype.insteadInfinity", () => {
		it("should return fallback for NaN", () => {
			assert.strictEqual((NaN as number).insteadInfinity("fallback"), "fallback");
		});

		it("should return fallback for Infinity", () => {
			assert.strictEqual((Infinity as number).insteadInfinity("fallback"), "fallback");
			assert.strictEqual((-Infinity as number).insteadInfinity("fallback"), "fallback");
		});

		it("should return original number if finite", () => {
			assert.strictEqual((42 as number).insteadInfinity("fallback"), 42);
			assert.strictEqual((0 as number).insteadInfinity("fallback"), 0);
		});
	});

	describe("Number.prototype.insteadZero", () => {
		it("should return fallback for zero", () => {
			assert.strictEqual((0 as number).insteadZero("fallback"), "fallback");
		});

		it("should return original number if not zero", () => {
			assert.strictEqual((1 as number).insteadZero("fallback"), 1);
			assert.strictEqual((-1 as number).insteadZero("fallback"), -1);
			assert.strictEqual((3.14 as number).insteadZero("fallback"), 3.14);
		});
	});
});