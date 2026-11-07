"use strict";

import "adaptive-extender/core";
import { URI, Field, Model, Optional } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

class LinkModel extends Model {
	@Field(URI, { name: "target" })
	target: URI = new URI();

	@Field(Optional.Of(URI), { name: "mirror" })
	mirror?: URI;
}

describe("URI", () => {
	describe("constructor", () => {
		it("should default to about:blank", () => {
			const uri = new URI();
			expect(uri.href).toBe("about:blank");
			expect(uri.protocol).toBe("about:");
			expect(uri.pathname).toBe("blank");
		});

		it("should copy another URI independently", () => {
			const source = new URI("https://a.dev/x?y=1");
			const copy = new URI(source);
			copy.pathname = "/z";
			expect(copy.href).toBe("https://a.dev/z?y=1");
			expect(source.href).toBe("https://a.dev/x?y=1");
		});

		it("should split every component", () => {
			const uri = new URI("https://user:secret@example.com:8080/path/to?a=1&b=2#part");
			expect(uri.protocol).toBe("https:");
			expect(uri.username).toBe("user");
			expect(uri.password).toBe("secret");
			expect(uri.host).toBe("example.com:8080");
			expect(uri.hostname).toBe("example.com");
			expect(uri.port).toBe("8080");
			expect(uri.pathname).toBe("/path/to");
			expect(uri.search).toBe("?a=1&b=2");
			expect(uri.hash).toBe("#part");
			expect(uri.origin).toBe("https://example.com:8080");
		});

		it("should parse schemes without an authority", () => {
			const mail = new URI("mailto:me@example.com?subject=Hi");
			expect(mail.protocol).toBe("mailto:");
			expect(mail.hostname).toBe("");
			expect(mail.pathname).toBe("me@example.com");
			expect(mail.search).toBe("?subject=Hi");
			expect(new URI("urn:isbn:0451450523").pathname).toBe("isbn:0451450523");
			expect(new URI("data:text/plain;base64,SGk=").pathname).toBe("text/plain;base64,SGk=");
			expect(new URI("tel:+1-816-555-1212").pathname).toBe("+1-816-555-1212");
		});

		it("should keep an empty host of file URIs", () => {
			const uri = new URI("file:///C:/Temp/a.txt");
			expect(uri.hostname).toBe("");
			expect(uri.pathname).toBe("/C:/Temp/a.txt");
			expect(uri.href).toBe("file:///C:/Temp/a.txt");
			expect(uri.origin).toBe("null");
		});

		it("should parse IP literals", () => {
			expect(new URI("http://[::1]:8080/").hostname).toBe("[::1]");
			expect(new URI("http://[2001:db8::7]/").hostname).toBe("[2001:db8::7]");
			expect(new URI("http://[::ffff:192.0.2.1]/").hostname).toBe("[::ffff:192.0.2.1]");
			expect(new URI("http://[v7.fe80::a+en1]/").hostname).toBe("[v7.fe80::a+en1]");
			expect(new URI("http://192.0.2.16/").hostname).toBe("192.0.2.16");
		});

		it("should keep Unicode as written (IRI)", () => {
			const uri = new URI("http://мир.рф/путь?ключ=значение#раздел");
			expect(uri.hostname).toBe("мир.рф");
			expect(uri.pathname).toBe("/путь");
			expect(uri.href).toBe("http://мир.рф/путь?ключ=значение#раздел");
		});

		it("should throw TypeError for invalid input", () => {
			expect(() => new URI("relative/path")).toThrow(TypeError);
			expect(() => new URI("http://a b/")).toThrow(TypeError);
			expect(() => new URI("http://a/%zz")).toThrow(TypeError);
			expect(() => new URI("http://[::1::2]/")).toThrow(TypeError);
			expect(() => new URI("http://a:8o/")).toThrow(TypeError);
			expect(() => new URI(String.raw`http:\\a\b`)).toThrow(TypeError);
			expect(() => new URI("1http://a/")).toThrow(TypeError);
			expect(() => new URI("http://a/\uD800")).toThrow(TypeError);
			expect(() => new URI("g", "relative")).toThrow(TypeError);
		});
	});

	describe("resolution (RFC 3986 §5.4)", () => {
		const base = "http://a/b/c/d;p?q";
		const normal: readonly (readonly [string, string])[] = [
			["g:h", "g:h"], ["g", "http://a/b/c/g"], ["./g", "http://a/b/c/g"], ["g/", "http://a/b/c/g/"], ["/g", "http://a/g"], ["//g", "http://g"],
			["?y", "http://a/b/c/d;p?y"], ["g?y", "http://a/b/c/g?y"], ["#s", "http://a/b/c/d;p?q#s"], ["g#s", "http://a/b/c/g#s"], ["g?y#s", "http://a/b/c/g?y#s"],
			[";x", "http://a/b/c/;x"], ["g;x", "http://a/b/c/g;x"], ["g;x?y#s", "http://a/b/c/g;x?y#s"], ["", "http://a/b/c/d;p?q"], [".", "http://a/b/c/"], ["./", "http://a/b/c/"],
			["..", "http://a/b/"], ["../", "http://a/b/"], ["../g", "http://a/b/g"], ["../..", "http://a/"], ["../../", "http://a/"], ["../../g", "http://a/g"],
		];
		const abnormal: readonly (readonly [string, string])[] = [
			["../../../g", "http://a/g"], ["../../../../g", "http://a/g"], ["/./g", "http://a/g"], ["/../g", "http://a/g"], ["g.", "http://a/b/c/g."], [".g", "http://a/b/c/.g"],
			["g..", "http://a/b/c/g.."], ["..g", "http://a/b/c/..g"], ["./../g", "http://a/b/g"], ["./g/.", "http://a/b/c/g/"], ["g/./h", "http://a/b/c/g/h"], ["g/../h", "http://a/b/c/h"],
			["g;x=1/./y", "http://a/b/c/g;x=1/y"], ["g;x=1/../y", "http://a/b/c/y"], ["g?y/./x", "http://a/b/c/g?y/./x"], ["g?y/../x", "http://a/b/c/g?y/../x"],
			["g#s/./x", "http://a/b/c/g#s/./x"], ["g#s/../x", "http://a/b/c/g#s/../x"], ["http:g", "http:g"],
		];

		it.each(normal)("should resolve the normal example %j", (input, expected) => {
			expect(new URI(input, base).href).toBe(expected);
		});

		it.each(abnormal)("should resolve the abnormal example %j", (input, expected) => {
			expect(new URI(input, base).href).toBe(expected);
		});

		it("should resolve against a URI base", () => {
			expect(new URI("../x", new URI(base)).href).toBe("http://a/b/x");
		});

		it("should never turn a path into an authority", () => {
			expect(new URI("/..//x", "s:/a").href).toBe("s:/.//x");
		});
	});

	describe("normalize (RFC 3986 §6)", () => {
		it("should normalize case, encoding, dot segments and the default port", () => {
			const uri = new URI("HTTP://User@Ex%61mple.COM:80/a/./b/../c/%7euser/%2f?q=%41%3d#%7E");
			uri.normalize();
			expect(uri.href).toBe("http://User@example.com/a/c/~user/%2F?q=A%3D#~");
		});

		it("should give an empty http path a slash and drop an empty port", () => {
			const uri = new URI("https://example.com:");
			uri.normalize();
			expect(uri.href).toBe("https://example.com/");
		});

		it("should keep a non-default port and unknown schemes' paths", () => {
			const uri = new URI("HTTP://example.com:8080");
			uri.normalize();
			expect(uri.href).toBe("http://example.com:8080/");
			const custom = new URI("Custom://Host");
			custom.normalize();
			expect(custom.href).toBe("custom://host");
		});

		it("should decode percent-encoded Unicode letters (RFC 3987 §5.3.2.3)", () => {
			const uri = new URI("http://a/%D0%BF%C3%A9?x=%E2%82%AC&y=%EE%80%80");
			uri.normalize();
			expect(uri.href).toBe("http://a/пé?x=€&y=%EE%80%80");
		});

		it("should keep invalid UTF-8 and reserved characters percent-encoded", () => {
			const uri = new URI("http://a/%c3%28");
			uri.normalize();
			expect(uri.href).toBe("http://a/%C3%28");
		});
	});

	describe("setters", () => {
		it("should change each component", () => {
			const uri = new URI("http://a.dev/");
			uri.protocol = "https";
			uri.username = "me";
			uri.password = "pw";
			uri.hostname = "b.dev";
			uri.port = "8443";
			uri.pathname = "/x/y";
			uri.search = "?k=v";
			uri.hash = "#top";
			expect(uri.href).toBe("https://me:pw@b.dev:8443/x/y?k=v#top");
			uri.host = "c.dev:9000";
			expect(uri.href).toBe("https://me:pw@c.dev:9000/x/y?k=v#top");
		});

		it("should remove a component with an empty string", () => {
			const uri = new URI("https://me:pw@a.dev:1/x?k=v#top");
			uri.username = "";
			uri.password = "";
			uri.port = "";
			uri.search = "";
			uri.hash = "";
			expect(uri.href).toBe("https://a.dev/x");
		});

		it("should replace the whole URI through href", () => {
			const uri = new URI("http://a.dev/");
			uri.href = "mailto:me@a.dev";
			expect(uri.protocol).toBe("mailto:");
			expect(() => { uri.href = "nope"; }).toThrow(TypeError);
		});

		it("should throw TypeError for invalid values", () => {
			const uri = new URI("http://a.dev/");
			expect(() => { uri.protocol = "1x"; }).toThrow(TypeError);
			expect(() => { uri.username = "a:b"; }).toThrow(TypeError);
			expect(() => { uri.hostname = "a b"; }).toThrow(TypeError);
			expect(() => { uri.port = "80a"; }).toThrow(TypeError);
			expect(() => { uri.pathname = "relative"; }).toThrow(TypeError);
			expect(() => { uri.search = "?a b"; }).toThrow(TypeError);
			expect(() => { uri.hash = "#a#b"; }).toThrow(TypeError);
			expect(uri.href).toBe("http://a.dev/");
		});

		it("should reject an authority where the path cannot follow it", () => {
			const mail = new URI("mailto:me@a.dev");
			expect(() => { mail.hostname = "b.dev"; }).toThrow(TypeError);
			expect(() => { mail.port = "1"; }).toThrow(TypeError);
			expect(() => { mail.username = "me"; }).toThrow(TypeError);
			expect(() => { mail.pathname = "//x"; }).toThrow(TypeError);
		});
	});

	describe("searchParams", () => {
		it("should read the query", () => {
			const uri = new URI("https://a.dev/?a=1&b=two+words&a=%C3%A9");
			expect(uri.searchParams.getAll("a")).toEqual(["1", "é"]);
			expect(uri.searchParams.get("b")).toBe("two words");
		});

		it("should be the same live object", () => {
			const uri = new URI("https://a.dev/?a=1");
			expect(uri.searchParams).toBe(uri.searchParams);
		});

		it("should write changes back to the query", () => {
			const uri = new URI("https://a.dev/p?a=1");
			const parameters = uri.searchParams;
			parameters.append("c", "é &");
			expect(uri.href).toBe("https://a.dev/p?a=1&c=%C3%A9+%26");
			parameters.set("a", "2");
			parameters.sort();
			expect(uri.search).toBe("?a=2&c=%C3%A9+%26");
			parameters.delete("a");
			parameters.delete("c");
			expect(uri.href).toBe("https://a.dev/p");
		});

		it("should follow query changes made through the URI", () => {
			const uri = new URI("https://a.dev/?a=1");
			const parameters = uri.searchParams;
			uri.search = "?z=9";
			expect([...parameters]).toEqual([["z", "9"]]);
			uri.href = "https://b.dev/?y=8";
			expect(parameters.get("y")).toBe("8");
		});
	});

	describe("static parsing", () => {
		it("should check without throwing", () => {
			expect(URI.canParse("https://a.dev/")).toBe(true);
			expect(URI.canParse("rel")).toBe(false);
			expect(URI.canParse("rel", "https://a.dev/")).toBe(true);
			expect(URI.canParse("rel", "bad base")).toBe(false);
		});

		it("should return null from tryParse for invalid input", () => {
			expect(URI.tryParse("https://a.dev/")?.href).toBe("https://a.dev/");
			expect(URI.tryParse("http://a b")).toBeNull();
			expect(URI.tryParse("x", new URI("https://a.dev/b/c"))?.href).toBe("https://a.dev/b/x");
		});

		it("should throw SyntaxError from parse for invalid input", () => {
			expect(URI.parse("https://a.dev/").href).toBe("https://a.dev/");
			expect(() => URI.parse("rel")).toThrow(SyntaxError);
		});
	});

	describe("serialization", () => {
		it("should stringify to href", () => {
			const uri = new URI("https://a.dev/x");
			expect(String(uri)).toBe("https://a.dev/x");
			expect(JSON.stringify({ uri })).toBe(`{"uri":"https://a.dev/x"}`);
		});

		it("should round-trip through a portable model", () => {
			const model = LinkModel.import({ target: "https://a.dev/x", mirror: "urn:x:y" }, "link");
			expect(model.target).toBeInstanceOf(URI);
			expect(model.target.hostname).toBe("a.dev");
			expect(model.mirror?.protocol).toBe("urn:");
			expect(LinkModel.export(model)).toEqual({ target: "https://a.dev/x", mirror: "urn:x:y" });
		});

		it("should reject invalid portable sources", () => {
			expect(() => URI.import(42, "link")).toThrow(TypeError);
			expect(() => URI.import("rel", "link")).toThrow(SyntaxError);
		});
	});
});
