import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Global extensions", () => {
	describe("global prototype function", () => {
		it("should return the constructor of a string", () => {
			expect(prototype("hello")).toBe(String);
		});

		it("should return the constructor of a number", () => {
			expect(prototype(42)).toBe(Number);
		});

		it("should return the constructor of an array", () => {
			expect(prototype([1, 2, 3])).toBe(Array);
		});

		it("should return the constructor of an object", () => {
			expect(prototype({ a: 1 })).toBe(Object);
		});

		it("should return the constructor of a custom class instance", () => {
			class MyClass { }
			const instance = new MyClass();
			expect(prototype(instance)).toBe(MyClass);
		});
	});

	describe("global typename function", () => {
		it("should return 'Undefined' for undefined", () => {
			expect(typename(undefined)).toBe("Undefined");
		});

		it("should return 'Null' for null", () => {
			expect(typename(null)).toBe("Null");
		});

		it("should return 'String' for string values", () => {
			expect(typename("test")).toBe("String");
		});

		it("should return 'Number' for number values", () => {
			expect(typename(123)).toBe("Number");
		});

		it("should return 'Boolean' for boolean values", () => {
			expect(typename(true)).toBe("Boolean");
		});

		it("should return 'Array' for arrays", () => {
			expect(typename([1, 2, 3])).toBe("Array");
		});

		it("should return 'Object' for plain objects", () => {
			expect(typename({})).toBe("Object");
		});

		it("should return the class name for custom class instances", () => {
			class Custom { }
			expect(typename(new Custom())).toBe("Custom");
		});
	});
});