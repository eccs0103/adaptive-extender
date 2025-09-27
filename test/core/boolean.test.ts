import "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Boolean extensions", () => {
	describe("Boolean.import", () => {
		it("should import true as true", () => {
			assert.equal(Boolean.import(true), true);
		});

		it("should import false as false", () => {
			assert.equal(Boolean.import(false), false);
		});

		it("should throw TypeError for non-boolean values (number)", () => {
			assert.throws(
				() => Boolean.import(1),
				(err: any) =>
					err instanceof TypeError &&
					err.message === `Unable to import boolean from [source] due its ${typename(1)} type`
			);
		});

		it("should throw TypeError for non-boolean values (string)", () => {
			assert.throws(
				() => Boolean.import("true"),
				(err: any) =>
					err instanceof TypeError &&
					err.message === `Unable to import boolean from [source] due its ${typename("true")} type`
			);
		});

		it("should throw TypeError for non-boolean values (object)", () => {
			assert.throws(
				() => Boolean.import({}),
				(err: any) =>
					err instanceof TypeError &&
					err.message === `Unable to import boolean from [source] due its ${typename({})} type`
			);
		});

		it("should throw TypeError for non-boolean values (undefined)", () => {
			assert.throws(
				() => Boolean.import(undefined),
				(err: any) =>
					err instanceof TypeError &&
					err.message === `Unable to import boolean from [source] due its ${typename(undefined)} type`
			);
		});

		it("should use custom name in error message", () => {
			assert.throws(
				() => Boolean.import(0, "customName"),
				(err: any) =>
					err instanceof TypeError &&
					err.message === `Unable to import boolean from customName due its ${typename(0)} type`
			);
		});
	});
});