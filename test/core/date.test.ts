import "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Date extensions", () => {
	describe("Date.import", () => {
		it("should import a valid Date instance", () => {
			const d = new Date();
			assert.strictEqual(Date.import(d), d);
		});

		it("should throw TypeError for non-Date values", () => {
			assert.throws(() => Date.import("2024-01-01"), TypeError);
			assert.throws(() => Date.import(123), TypeError);
			assert.throws(() => Date.import(null), TypeError);
			assert.throws(() => Date.import(undefined), TypeError);
			assert.throws(() => Date.import({}), TypeError);
		});

		it("should include the name in the error message", () => {
			try {
				Date.import("not a date", "customName");
				assert.fail("Expected error not thrown");
			} catch (e: any) {
				assert.ok(e.message.includes("customName"));
			}
		});
	});

	describe("Date.isInvalid", () => {
		it("should return false for non-Date values", () => {
			assert.strictEqual(Date.isInvalid("2024-01-01"), false);
			assert.strictEqual(Date.isInvalid(123), false);
			assert.strictEqual(Date.isInvalid(null), false);
			assert.strictEqual(Date.isInvalid(undefined), false);
			assert.strictEqual(Date.isInvalid({}), false);
		});

		it("should return false for valid Date", () => {
			const d = new Date();
			assert.strictEqual(Date.isInvalid(d), false);
		});

		it("should return true for invalid Date", () => {
			const d = new Date("invalid-date");
			assert.strictEqual(Date.isInvalid(d), true);
		});
	});

	describe("Date.prototype.insteadInvalid", () => {
		it("should return itself if valid", () => {
			const d = new Date();
			assert.strictEqual(d.insteadInvalid("fallback"), d);
		});

		it("should return fallback if invalid", () => {
			const d = new Date("invalid-date");
			const fallback = "fallback";
			assert.strictEqual(d.insteadInvalid(fallback), fallback);
		});

		it("should work with different fallback types", () => {
			const d = new Date("invalid-date");
			assert.strictEqual(d.insteadInvalid(123), 123);
			assert.deepStrictEqual(d.insteadInvalid({ a: 1 }), { a: 1 });
		});
	});
});