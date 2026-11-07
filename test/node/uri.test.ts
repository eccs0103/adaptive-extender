"use strict";

import "adaptive-extender/node";
import URLUtilities from "node:url";
import PathUtilities from "node:path";
import { URI } from "adaptive-extender/node";
import { describe, it, expect } from "vitest";

describe("URI (node)", () => {
	describe("toURL / fromURL", () => {
		it("should convert to a platform URL with punycode hosts", () => {
			const url = new URI("http://мир.рф/путь").toURL();
			expect(url).toBeInstanceOf(URL);
			expect(url.href).toBe("http://xn--h1ahn.xn--p1ai/%D0%BF%D1%83%D1%82%D1%8C");
		});

		it("should round-trip a platform URL", () => {
			const url = new URL("https://user:pw@a.dev:8443/x/y?q=1#top");
			expect(URI.fromURL(url).href).toBe(url.href);
		});

		it("should percent-encode what WHATWG leaves but RFC 3986 forbids", () => {
			const url = new URL("http://a/^x|{y}?q=`#f#g");
			expect(URI.fromURL(url).href).toBe("http://a/%5Ex%7C%7By%7D?q=%60#f%23g");
			expect(URI.fromURL(new URL("http://a/%zz")).href).toBe("http://a/%25zz");
			expect(URI.fromURL(new URL("http://[::1]:81/[x]")).href).toBe("http://[::1]:81/%5Bx%5D");
		});

		it("should agree with URL on normalized ASCII http(s) URIs", () => {
			const inputs = ["HTTP://Example.COM:80/a/./b/../c", "https://example.com:443", "https://a.dev:8443/x?y=1#z"];
			for (const input of inputs) {
				const uri = new URI(input);
				uri.normalize();
				expect(uri.href).toBe(new URL(input).href);
			}
		});
	});

	describe("toPath / fromPath", () => {
		it("should round-trip a file path like node:url", () => {
			const path = PathUtilities.resolve("folder", "a b.txt");
			const uri = URI.fromPath(path);
			expect(uri.href).toBe(URLUtilities.pathToFileURL(path).href);
			expect(uri.toPath()).toBe(path);
		});

		it("should throw for a non-file URI", () => {
			expect(() => new URI("https://a.dev/").toPath()).toThrow(TypeError);
		});
	});
});
