import { Archive } from "adaptive-extender/web";
import { describe, it, expect, beforeEach } from "vitest";

describe("Archive", () => {
	const testKey = "test-archive";

	beforeEach(() => {
		localStorage.clear();
	});

	it("should initialize with initial value if localStorage is empty", () => {
		const initialData = { foo: "bar" };
		const archive = new Archive(testKey, initialData);
		expect(archive.data).toEqual(initialData);
	});

	it("should not overwrite existing value in localStorage on construction", () => {
		const existingData = { message: "I exist" };
		localStorage.setItem(testKey, JSON.stringify(existingData));

		const newData = { message: "I am new" };
		const archive = new Archive(testKey, newData);

		expect(archive.data).toEqual(existingData);
	});

	describe("data getter", () => {
		it("should get the data from localStorage", () => {
			const data = { a: 1, b: "test" };
			localStorage.setItem(testKey, JSON.stringify(data));
			const archive = new Archive(testKey, null);
			expect(archive.data).toEqual(data);
		});

		it("should throw ReferenceError if key does not exist", () => {
			const archive = new Archive("non-existent-key", null);
			// Clear any potential initialization
			localStorage.clear();
			expect(() => archive.data).toThrow(ReferenceError);
		});

		it("should throw SyntaxError if data is corrupted", () => {
			localStorage.setItem(testKey, "{ not json }");
			const archive = new Archive(testKey, null);
			expect(() => archive.data).toThrow(SyntaxError);
		});
	});

	describe("data setter", () => {
		it("should set the data in localStorage", () => {
			const archive = new Archive(testKey, null);
			const data = { message: "Hello, world!" };
			archive.data = data;
			const storedData = JSON.parse(localStorage.getItem(testKey)!);
			expect(storedData).toEqual(data);
		});

		it("should handle objects", () => {
			const archive = new Archive(testKey, {});
			const complexObject = {
				a: [1, 2, 3],
				b: { c: "nested" },
				d: new Date(0), // Dates will be stringified
			};
			archive.data = complexObject;
			expect(archive.data.a).toEqual([1, 2, 3]);
			expect(archive.data.b).toEqual({ c: "nested" });
			expect(new Date(archive.data.d)).toEqual(new Date(0));
		});

		it("should handle primitives", () => {
			const archive = new Archive(testKey, null);

			archive.data = "a string";
			expect(archive.data).toBe("a string");

			archive.data = 12345;
			expect(archive.data).toBe(12345);

			archive.data = true;
			expect(archive.data).toBe(true);

			archive.data = null;
			expect(archive.data).toBe(null);
		});

		it("should throw a SyntaxError for values that cannot be stringified", () => {
			const archive = new Archive(testKey, null);
			const circularValue: any = {};
			circularValue.a = circularValue;
			expect(() => archive.data = circularValue).toThrow(SyntaxError);
		});
	});
});
