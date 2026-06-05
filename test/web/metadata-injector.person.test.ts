import { MetadataInjector } from "adaptive-extender/web";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("MetadataInjector — Person", () => {
	beforeAll(() => {
		document.head.innerHTML = "";
		MetadataInjector.inject({
			type: "Person",
			name: "Jane Doe",
			webpage: new URL("https://janedoe.dev"),
			preview: new URL("https://janedoe.dev/avatar.jpg"),
			description: "A developer.",
			associations: [
				new URL("https://github.com/janedoe"),
				new URL("https://mastodon.social/@janedoe"),
			],
			job: "Software Engineer",
			knowledge: ["TypeScript", "Rust"],
			keywords: ["dev", "open-source"],
		});
	});

	afterAll(() => {
		document.head.innerHTML = "";
	});

	it("should embed a ld+json script with Person schema", () => {
		const script = document.querySelector('script[type="application/ld+json"]');
		expect(script).not.toBeNull();

		const data = JSON.parse(script!.textContent!);
		expect(data["@context"]).toBe("https://schema.org");
		expect(data["@type"]).toBe("Person");
		expect(data.name).toBe("Jane Doe");
		expect(data.url).toBe("https://janedoe.dev/");
		expect(data.image).toBe("https://janedoe.dev/avatar.jpg");
		expect(data.description).toBe("A developer.");
		expect(data.sameAs).toEqual(["https://github.com/janedoe", "https://mastodon.social/@janedoe"]);
		expect(data.jobTitle).toBe("Software Engineer");
		expect(data.knowsAbout).toEqual(["TypeScript", "Rust"]);
	});

	it("should embed rel=me links for each association", () => {
		const links = document.querySelectorAll('link[rel="me"]');
		expect(links.length).toBe(2);
		expect((links[0] as HTMLLinkElement).href).toBe("https://github.com/janedoe");
		expect((links[1] as HTMLLinkElement).href).toBe("https://mastodon.social/@janedoe");
	});

	it("should set og:type to profile", () => {
		const ogType = document.querySelector('meta[property="og:type"]');
		expect(ogType?.getAttribute("content")).toBe("profile");
	});

	it("should set author meta tag", () => {
		const author = document.querySelector('meta[name="author"]');
		expect(author?.getAttribute("content")).toBe("Jane Doe");
	});

	it("should merge keywords and knowledge into keywords meta, deduplicating", () => {
		const keywordsMeta = document.querySelector('meta[name="keywords"]');
		const parts = (keywordsMeta?.getAttribute("content") ?? "").split(",");
		expect(parts).toContain("dev");
		expect(parts).toContain("open-source");
		expect(parts).toContain("TypeScript");
		expect(parts).toContain("Rust");
		expect(new Set(parts).size).toBe(parts.length);
	});

	it("should embed og:title, og:url, og:description, og:image", () => {
		expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe("Jane Doe");
		expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe("https://janedoe.dev/");
		expect(document.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe("A developer.");
		expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe("https://janedoe.dev/avatar.jpg");
	});

	it("should stamp a generator meta tag", () => {
		const generator = document.querySelector('meta[name="generator"]');
		expect(generator?.getAttribute("content")).toBe("MetadataInjector/1.0.0");
	});

	it("should ignore a second inject call (singleton)", () => {
		MetadataInjector.inject({
			type: "Person",
			name: "Someone Else",
			webpage: new URL("https://other.dev"),
		});

		const scripts = document.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts.length).toBe(1);
		expect(JSON.parse(scripts[0].textContent!).name).toBe("Jane Doe");
	});
});
