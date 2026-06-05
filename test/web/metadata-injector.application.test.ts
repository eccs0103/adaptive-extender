import { MetadataInjector } from "adaptive-extender/web";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("MetadataInjector — Application", () => {
	beforeAll(() => {
		document.head.innerHTML = "";
		MetadataInjector.inject({
			type: "Application",
			name: "MyApp",
			webpage: new URL("https://myapp.io"),
			description: "A great app.",
			preview: new URL("https://myapp.io/preview.png"),
			category: "GameApplication",
			os: "Windows",
			version: "2.0.0",
		});
	});

	afterAll(() => {
		document.head.innerHTML = "";
	});

	it("should embed a ld+json script with SoftwareApplication schema", () => {
		const script = document.querySelector('script[type="application/ld+json"]');
		expect(script).not.toBeNull();

		const data = JSON.parse(script!.textContent!);
		expect(data["@context"]).toBe("https://schema.org");
		expect(data["@type"]).toBe("SoftwareApplication");
		expect(data.name).toBe("MyApp");
		expect(data.applicationCategory).toBe("GameApplication");
		expect(data.operatingSystem).toBe("Windows");
		expect(data.softwareVersion).toBe("2.0.0");
	});

	it("should set og:type to website", () => {
		expect(document.querySelector('meta[property="og:type"]')?.getAttribute("content")).toBe("website");
	});

	it("should set application-name meta tag", () => {
		expect(document.querySelector('meta[name="application-name"]')?.getAttribute("content")).toBe("MyApp");
	});

	it("should embed og:title, og:url, og:description, og:image", () => {
		expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe("MyApp");
		expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe("https://myapp.io/");
		expect(document.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe("A great app.");
		expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe("https://myapp.io/preview.png");
	});
});
