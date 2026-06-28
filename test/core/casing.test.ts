import "adaptive-extender/core";
import { Casing } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Casing", () => {
	describe("Casing.words — universal tokenizer", () => {
		it("should split lowerCamelCase", () => {
			expect(Casing.words("helloWorld")).toEqual(["hello", "World"]);
		});

		it("should split PascalCase", () => {
			expect(Casing.words("HelloWorld")).toEqual(["Hello", "World"]);
		});

		it("should split lower_snake_case", () => {
			expect(Casing.words("hello_world")).toEqual(["hello", "world"]);
		});

		it("should split UPPER_SNAKE_CASE", () => {
			expect(Casing.words("HELLO_WORLD")).toEqual(["HELLO", "WORLD"]);
		});

		it("should split lower-kebab-case", () => {
			expect(Casing.words("hello-world")).toEqual(["hello", "world"]);
		});

		it("should split UPPER-KEBAB-CASE", () => {
			expect(Casing.words("HELLO-WORLD")).toEqual(["HELLO", "WORLD"]);
		});

		it("should split spaced words", () => {
			expect(Casing.words("hello world")).toEqual(["hello", "world"]);
		});

		it("should split acronym runs: HTTPServer → HTTP, Server", () => {
			expect(Casing.words("HTTPServer")).toEqual(["HTTP", "Server"]);
		});

		it("should split mixed acronym: myHTTPSRequest → my, HTTPS, Request", () => {
			expect(Casing.words("myHTTPSRequest")).toEqual(["my", "HTTPS", "Request"]);
		});

		it("should extract digit groups: v2Point → v, 2, Point", () => {
			expect(Casing.words("v2Point")).toEqual(["v", "2", "Point"]);
		});

		it("should return empty array for empty or separator-only strings", () => {
			expect(Casing.words("")).toEqual([]);
			expect(Casing.words("___")).toEqual([]);
			expect(Casing.words("---")).toEqual([]);
		});
	});

	describe("Casing presets — convert()", () => {
		const inputs = ["hello_world", "HelloWorld", "HELLO_WORLD", "hello-world", "hello world", "HTTPServer"];

		describe("Casing.camel", () => {
			it("should produce lowerCamelCase", () => {
				expect(Casing.camel.convert("hello_world")).toBe("helloWorld");
				expect(Casing.camel.convert("HelloWorld")).toBe("helloWorld");
				expect(Casing.camel.convert("HELLO_WORLD")).toBe("helloWorld");
				expect(Casing.camel.convert("hello-world")).toBe("helloWorld");
				expect(Casing.camel.convert("HTTPServer")).toBe("httpServer");
			});

			it("should handle a single word", () => {
				expect(Casing.camel.convert("Hello")).toBe("hello");
			});
		});

		describe("Casing.pascal", () => {
			it("should produce PascalCase", () => {
				expect(Casing.pascal.convert("hello_world")).toBe("HelloWorld");
				expect(Casing.pascal.convert("helloWorld")).toBe("HelloWorld");
				expect(Casing.pascal.convert("HELLO_WORLD")).toBe("HelloWorld");
				expect(Casing.pascal.convert("HTTPServer")).toBe("HttpServer");
			});
		});

		describe("Casing.snake", () => {
			it("should produce lower_snake_case", () => {
				expect(Casing.snake.convert("helloWorld")).toBe("hello_world");
				expect(Casing.snake.convert("HelloWorld")).toBe("hello_world");
				expect(Casing.snake.convert("HELLO_WORLD")).toBe("hello_world");
				expect(Casing.snake.convert("HTTPServer")).toBe("http_server");
			});
		});

		describe("Casing.upperSnake", () => {
			it("should produce UPPER_SNAKE_CASE", () => {
				expect(Casing.upperSnake.convert("helloWorld")).toBe("HELLO_WORLD");
				expect(Casing.upperSnake.convert("hello-world")).toBe("HELLO_WORLD");
				expect(Casing.upperSnake.convert("HTTPServer")).toBe("HTTP_SERVER");
			});
		});

		describe("Casing.kebab", () => {
			it("should produce lower-kebab-case", () => {
				expect(Casing.kebab.convert("helloWorld")).toBe("hello-world");
				expect(Casing.kebab.convert("HelloWorld")).toBe("hello-world");
				expect(Casing.kebab.convert("HTTPServer")).toBe("http-server");
			});
		});

		describe("Casing.upperKebab", () => {
			it("should produce UPPER-KEBAB-CASE", () => {
				expect(Casing.upperKebab.convert("helloWorld")).toBe("HELLO-WORLD");
				expect(Casing.upperKebab.convert("hello_world")).toBe("HELLO-WORLD");
				expect(Casing.upperKebab.convert("HTTPServer")).toBe("HTTP-SERVER");
			});
		});

		describe("Casing.lower", () => {
			it("should produce lower case (space-separated)", () => {
				expect(Casing.lower.convert("helloWorld")).toBe("hello world");
				expect(Casing.lower.convert("HELLO_WORLD")).toBe("hello world");
				expect(Casing.lower.convert("HTTPServer")).toBe("http server");
			});
		});

		describe("Casing.upper", () => {
			it("should produce UPPER CASE (space-separated)", () => {
				expect(Casing.upper.convert("helloWorld")).toBe("HELLO WORLD");
				expect(Casing.upper.convert("hello_world")).toBe("HELLO WORLD");
				expect(Casing.upper.convert("HTTPServer")).toBe("HTTP SERVER");
			});
		});

		describe("Casing.title", () => {
			it("should produce Title Case", () => {
				expect(Casing.title.convert("helloWorld")).toBe("Hello World");
				expect(Casing.title.convert("HELLO_WORLD")).toBe("Hello World");
				expect(Casing.title.convert("HTTPServer")).toBe("Http Server");
			});
		});

		describe("Casing.sentence", () => {
			it("should produce Sentence case", () => {
				expect(Casing.sentence.convert("helloWorld")).toBe("Hello world");
				expect(Casing.sentence.convert("HELLO_WORLD")).toBe("Hello world");
				expect(Casing.sentence.convert("HTTPServer")).toBe("Http server");
			});

			it("should handle a single word", () => {
				expect(Casing.sentence.convert("hello")).toBe("Hello");
			});
		});
	});

	describe("Casing.format — pre-tokenized words", () => {
		it("should format words directly without re-tokenizing", () => {
			expect(Casing.snake.format(["Hello", "World"])).toBe("hello_world");
			expect(Casing.camel.format(["hello", "world"])).toBe("helloWorld");
		});
	});

	describe("Custom Casing instance", () => {
		it("should allow a user-defined casing strategy", () => {
			const dotCase = new Casing(w => w.toLowerCase(), w => w.toLowerCase(), ".");
			expect(dotCase.convert("helloWorld")).toBe("hello.world");
			expect(dotCase.convert("HTTPServer")).toBe("http.server");
		});
	});

	describe("String.prototype casing methods", () => {
		it("toCamelCase", () => {
			expect("hello_world".toCamelCase()).toBe("helloWorld");
			expect("Hello World".toCamelCase()).toBe("helloWorld");
		});

		it("toPascalCase", () => {
			expect("hello-world".toPascalCase()).toBe("HelloWorld");
			expect("hello_world".toPascalCase()).toBe("HelloWorld");
		});

		it("toSnakeCase", () => {
			expect("helloWorld".toSnakeCase()).toBe("hello_world");
			expect("Hello World".toSnakeCase()).toBe("hello_world");
		});

		it("toUpperSnakeCase", () => {
			expect("helloWorld".toUpperSnakeCase()).toBe("HELLO_WORLD");
			expect("hello-world".toUpperSnakeCase()).toBe("HELLO_WORLD");
		});

		it("toKebabCase", () => {
			expect("helloWorld".toKebabCase()).toBe("hello-world");
			expect("hello_world".toKebabCase()).toBe("hello-world");
		});

		it("toUpperKebabCase", () => {
			expect("helloWorld".toUpperKebabCase()).toBe("HELLO-WORLD");
			expect("hello_world".toUpperKebabCase()).toBe("HELLO-WORLD");
		});

		it("toSentenceCase", () => {
			expect("HELLO_WORLD".toSentenceCase()).toBe("Hello world");
			expect("helloWorld".toSentenceCase()).toBe("Hello world");
		});
	});
});
