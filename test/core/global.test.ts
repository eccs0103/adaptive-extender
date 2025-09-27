import "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Global extensions", () => {
	describe("global prototype function", () => {
		it("should return the constructor of a string", () => {
			assert.strictEqual(prototype("hello"), String);
		});

		it("should return the constructor of a number", () => {
			assert.strictEqual(prototype(42), Number);
		});

		it("should return the constructor of an array", () => {
			assert.strictEqual(prototype([1, 2, 3]), Array);
		});

		it("should return the constructor of an object", () => {
			assert.strictEqual(prototype({ a: 1 }), Object);
		});

		it("should return the constructor of a custom class instance", () => {
			class MyClass { }
			const instance = new MyClass();
			assert.strictEqual(prototype(instance), MyClass);
		});
	});

	describe("global typename function", () => {
		it("should return 'Undefined' for undefined", () => {
			assert.strictEqual(typename(undefined), "Undefined");
		});

		it("should return 'Null' for null", () => {
			assert.strictEqual(typename(null), "Null");
		});

		it("should return 'String' for string values", () => {
			assert.strictEqual(typename("test"), "String");
		});

		it("should return 'Number' for number values", () => {
			assert.strictEqual(typename(123), "Number");
		});

		it("should return 'Boolean' for boolean values", () => {
			assert.strictEqual(typename(true), "Boolean");
		});

		it("should return 'Array' for arrays", () => {
			assert.strictEqual(typename([1, 2, 3]), "Array");
		});

		it("should return 'Object' for plain objects", () => {
			assert.strictEqual(typename({}), "Object");
		});

		it("should return the class name for custom class instances", () => {
			class Custom { }
			assert.strictEqual(typename(new Custom()), "Custom");
		});
	});
});