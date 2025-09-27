import { Random } from "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Random", () => {
	const random = new Random();

	describe("boolean()", () => {
		it("should return a boolean", () => {
			const value = random.boolean();
			assert.equal(typeof value, "boolean");
		});

		it("should throw if factor is not finite", () => {
			assert.throws(() => random.boolean(Infinity));
			assert.throws(() => random.boolean(NaN));
		});

		it("should throw if factor is out of range", () => {
			assert.throws(() => random.boolean(-0.1), RangeError);
			assert.throws(() => random.boolean(1.1), RangeError);
		});

		it("should respect the factor probability", () => {
			const results = Array.from({ length: 1000 }, () => random.boolean(0.8));
			const trueCount = results.filter(Boolean).length;
			assert.ok(trueCount > 700);
		});
	});

	describe("number()", () => {
		it("should return a number", () => {
			assert.equal(typeof random.number(), "number");
		});

		it("should return a number between 0 and max", () => {
			const value = random.number(10);
			assert.ok(value >= 0);
			assert.ok(value < 10);
		});

		it("should return a number between min and max", () => {
			const value = random.number(5, 15);
			assert.ok(value >= 5);
			assert.ok(value < 15);
		});
	});

	describe("integer()", () => {
		it("should return an integer", () => {
			assert.ok(Number.isInteger(random.integer()));
		});

		it("should return an integer between 0 and max", () => {
			const value = random.integer(10);
			assert.ok(value >= 0);
			assert.ok(value <= 10);
			assert.ok(Number.isInteger(value));
		});

		it("should return an integer between min and max", () => {
			const value = random.integer(5, 15);
			assert.ok(value >= 5);
			assert.ok(value <= 15);
			assert.ok(Number.isInteger(value));
		});
	});

	describe("item()", () => {
		it("should return an item from the array", () => {
			const arr = [1, 2, 3];
			const item = random.item(arr);
			assert.ok(arr.includes(item));
		});

		it("should throw if array is empty", () => {
			assert.throws(() => random.item([]));
		});
	});

	describe("subarray()", () => {
		it("should return a shuffled copy of the array", () => {
			const arr = [1, 2, 3, 4];
			const sub = random.subarray(arr);
			assert.deepEqual(sub.sort(), arr.sort());
			assert.equal(sub.length, arr.length);
		});

		it("should return a random subset of given size", () => {
			const arr = [1, 2, 3, 4, 5];
			const sub = random.subarray(arr, 3);
			assert.equal(sub.length, 3);
			sub.forEach(item => assert.ok(arr.includes(item)));
		});

		it("should throw if count is not integer", () => {
			assert.throws(() => random.subarray([1, 2], 1.5));
		});

		it("should throw if count is out of range", () => {
			assert.throws(() => random.subarray([1, 2], -1), RangeError);
			assert.throws(() => random.subarray([1, 2], 3), RangeError);
		});
	});

	describe("shuffle()", () => {
		it("should shuffle the array in place", () => {
			const arr = [1, 2, 3, 4, 5];
			const copy = [...arr];
			random.shuffle(arr as any);
			assert.deepEqual(arr.sort(), copy.sort());
		});
	});

	describe("case()", () => {
		it("should select an item based on weights", () => {
			const cases = new Map<string, number>([
				["a", 1],
				["b", 2],
				["c", 7],
			]);
			const result = random.case(cases);
			assert.ok(["a", "b", "c"].includes(result));
		});

		it("should throw if map is empty", () => {
			assert.throws(() => random.case(new Map()));
		});
	});

	describe("global", () => {
		it("should return the global instance", () => {
			assert.ok(Random.global instanceof Random);
		});
	});
});