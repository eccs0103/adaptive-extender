import "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Object extensions", () => {
	describe("Object.import", () => {
		it("should return the object if valid", () => {
			const obj = { a: 1 };
			assert.equal(Object.import(obj), obj);
		});

		it("should throw TypeError if source is null", () => {
			assert.throws(() => Object.import(null), TypeError);
		});

		it("should throw TypeError if source is not object", () => {
			assert.throws(() => Object.import(42), TypeError);
			assert.throws(() => Object.import("str"), TypeError);
			assert.throws(() => Object.import(undefined), TypeError);
			assert.throws(() => Object.import(true), TypeError);
		});

		it("should use custom name in error message", () => {
			try {
				Object.import(undefined, "customName");
			} catch (e: any) {
				assert.ok(e.message.includes("customName"));
			}
		});
	});

	describe("Object.map", () => {
		it("should apply callback if value is non-null/non-undefined", () => {
			const result = Object.map(5, v => v * 2);
			assert.equal(result, 10);
		});

		it("should return value unchanged if null", () => {
			const result = Object.map(null as number | null, v => v * 2);
			assert.equal(result, null);
		});

		it("should return value unchanged if undefined", () => {
			const result = Object.map(undefined as number | undefined, v => v * 2);
			assert.equal(result, undefined);
		});

		it("should work with objects", () => {
			const obj = { x: 1 };
			const result = Object.map(obj, o => ({ ...o, y: 2 }));
			assert.deepEqual(result, { x: 1, y: 2 });
		});
	});
});