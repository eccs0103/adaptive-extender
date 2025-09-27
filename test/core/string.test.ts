import "adaptive-extender/core";
import { strict as assert } from "assert";

describe("String extensions", () => {
	describe("String.import", () => {
		it("should return the string if valid", () => {
			assert.equal(String.import("hello"), "hello");
		});

		it("should throw TypeError if source is not a string", () => {
			assert.throws(() => String.import(123), TypeError);
			assert.throws(() => String.import({}, "obj"), TypeError);
			assert.throws(() => String.import(null, "null"), TypeError);
			assert.throws(() => String.import(undefined, "undef"), TypeError);
		});

		it("should use custom name in error message", () => {
			try {
				String.import(42, "customName");
			} catch (e: any) {
				assert.ok(e.message.includes("customName"));
			}
		});
	});

	describe("String.empty", () => {
		it("should be an empty string", () => {
			assert.equal(String.empty, "");
		});

		it("should be immutable", () => {
			assert.throws(() => { (String as any).empty = "not empty"; });
		});
	});

	describe("String.isEmpty", () => {
		it("should return true for empty string", () => {
			assert.equal(String.isEmpty(""), true);
		});

		it("should return false for non-empty string", () => {
			assert.equal(String.isEmpty("abc"), false);
		});
	});

	describe("String.isWhitespace", () => {
		it("should return true for empty string", () => {
			assert.equal(String.isWhitespace(""), true);
		});

		it("should return true for whitespace-only string", () => {
			assert.equal(String.isWhitespace("   "), true);
			assert.equal(String.isWhitespace("\t\n"), true);
		});

		it("should return false for non-whitespace string", () => {
			assert.equal(String.isWhitespace("abc"), false);
			assert.equal(String.isWhitespace(" abc "), false);
		});
	});

	describe("String.prototype.insteadEmpty", () => {
		it("should return fallback for empty string", () => {
			assert.equal("".insteadEmpty("fallback"), "fallback");
		});

		it("should return original string for non-empty", () => {
			assert.equal("hello".insteadEmpty("fallback"), "hello");
		});
	});

	describe("String.prototype.insteadWhitespace", () => {
		it("should return fallback for whitespace-only string", () => {
			assert.equal("   ".insteadWhitespace("fallback"), "fallback");
			assert.equal("\n\t".insteadWhitespace("fallback"), "fallback");
		});

		it("should return original string for non-whitespace", () => {
			assert.equal("hello".insteadWhitespace("fallback"), "hello");
			assert.equal(" abc ".insteadWhitespace("fallback"), " abc ");
		});
	});

	describe("String.prototype.toTitleCase", () => {
		it("should capitalize first letter of each word", () => {
			assert.equal("hello world".toTitleCase(), "Hello World");
			assert.equal("foo bar baz".toTitleCase(), "Foo Bar Baz");
		});

		it("should handle mixed case and punctuation", () => {
			assert.equal("hElLo, wOrLd!".toTitleCase(), "Hello, World!");
			assert.equal("a.b c".toTitleCase(), "A.B C");
		});
	});

	describe("String.prototype.toLocalTitleCase", () => {
		it("should capitalize first letter of each word with locale", () => {
			assert.equal("straße".toLocalTitleCase("de"), "StraßE");
			assert.equal("istanbul".toLocalTitleCase("tr"), "İstanbul");
		});

		it("should handle array of locales", () => {
			assert.equal("istanbul".toLocalTitleCase(["tr", "en"]), "İstanbul");
		});
	});
});