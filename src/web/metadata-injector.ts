"use strict";

import "adaptive-extender/web";
import { Model, Field, Optional, ArrayOf, type PortableConstructor, DiscriminatorKey, Descendant, Deferred } from "adaptive-extender/web";

//#region URL adapter
const URLAdapter = {
	[Symbol.hasInstance](instance: any): boolean {
		return URL[Symbol.hasInstance](instance);
	},

	get name(): string {
		return "URL";
	},

	import(source: any, name: string): URL {
		if (typeof source !== "string") throw new TypeError(`Unable to import URL from ${name} due its ${typename(source)} type`);
		return new URL(source);
	},

	export(source: URL): string {
		return source.toString();
	},
} as PortableConstructor<URL, string>;
//#endregion

//#region Metadata
export interface MetadataDiscriminator extends PersonMetadataDiscriminator, ApplicationMetadataDiscriminator, OrganizationMetadataDiscriminator {
}

interface MetadataScheme {
	"@context": "https://schema.org";
	"@type": MetadataDiscriminator[keyof MetadataDiscriminator];
	name: string;
	url: string;
	image?: string;
	description?: string;
	keywords?: string[];
}

/**
 * Base configuration for the entity metadata.
 */
export interface MetadataConfiguration {
	type: keyof MetadataDiscriminator;

	/**
	 * The display name of the entity or the page title.
	 */
	name: string;

	/**
	 * The canonical public URL of the resource.
	 */
	webpage: URL;

	/**
	 * The absolute URL to the representative image (Open Graph).
	 */
	preview?: URL;

	/**
	 * A short summary of the content.
	 */
	description?: string;

	/**
	 * A set of keywords relevant to the content.
	 */
	keywords?: string[];
}

@DiscriminatorKey("@type")
@Descendant(Deferred(_ => PersonMetadata), "Person")
@Descendant(Deferred(_ => ApplicationMetadata), "SoftwareApplication")
@Descendant(Deferred(_ => OrganizationMetadata), "Organization")
abstract class Metadata extends Model {
	@Field(String, "@context")
	context: string = "https://schema.org";

	@Field(String, "name")
	name: string;

	@Field(URLAdapter, "url")
	webpage: URL;

	@Field(Optional(URLAdapter), "image")
	preview?: URL;

	@Field(Optional(String), "description")
	description?: string;

	@Field(Optional(ArrayOf(String)), "keywords")
	keywords?: string[];

	constructor();
	constructor(configuration: MetadataConfiguration);
	constructor(configuration?: MetadataConfiguration) {
		if (new.target === Metadata) throw new TypeError("Unable to create an instance of an abstract class");

		if (configuration === undefined) {
			super();
			return;
		}

		super();
		this.name = configuration.name;
		this.webpage = configuration.webpage;
		this.preview = configuration.preview;
		this.description = configuration.description;
		this.keywords = configuration.keywords;
	}
}
//#endregion
//#region Person metadata
export interface PersonMetadataDiscriminator {
	"Person": "Person";
}

interface PersonMetadataScheme extends MetadataScheme {
	"@type": PersonMetadataDiscriminator[keyof PersonMetadataDiscriminator];
	sameAs?: string[];
	jobTitle?: string;
	knowsAbout?: string[];
	/* worksFor?: {
		"@type": "Organization";
		name: string;
	}; */
}

/**
 * Configuration for a personal profile.
 */
export interface PersonMetadataConfiguration extends MetadataConfiguration {
	type: keyof PersonMetadataDiscriminator;

	/**
	 * A list of related social profiles or websites.
	 */
	associations?: URL[];

	/**
	 * The professional job title or role.
	 */
	job?: string;

	/**
	 * A list of known skills or expertise.
	 */
	knowledge?: string[];
}

class PersonMetadata extends Metadata {
	@Field(Optional(ArrayOf(URLAdapter)), "sameAs")
	associations?: URL[];

	@Field(Optional(String), "jobTitle")
	job?: string;

	@Field(Optional(ArrayOf(String)), "knowsAbout")
	knowledge?: string[];

	constructor();
	constructor(configuration: PersonMetadataConfiguration);
	constructor(configuration?: PersonMetadataConfiguration) {
		if (configuration === undefined) {
			super();
			return;
		}

		super(configuration);
		this.associations = configuration.associations;
		this.job = configuration.job;
		this.knowledge = configuration.knowledge;
	}
}
//#endregion
//#region Application metadata
export interface ApplicationMetadataDiscriminator {
	"Application": "SoftwareApplication";
}

interface ApplicationMetadataScheme extends MetadataScheme {
	"@type": ApplicationMetadataDiscriminator[keyof ApplicationMetadataDiscriminator];
	applicationCategory: string;
	operatingSystem: string;
	softwareVersion?: string;
	/* offers?: {
		"@type": "Offer";
		price: "0";
		priceCurrency: "USD";
	}; */
}

/**
 * Configuration for a software application.
 */
export interface ApplicationMetadataConfiguration extends MetadataConfiguration {
	type: keyof ApplicationMetadataDiscriminator;

	/**
	 * The general category of the application.
	 */
	category: string;

	/**
	 * The required operating system.
	 */
	os: string;

	/**
	 * The current version identifier.
	 */
	version?: string;
}

class ApplicationMetadata extends Metadata {
	@Field(String, "applicationCategory")
	category: string;

	@Field(String, "operatingSystem")
	os: string;

	@Field(Optional(String), "softwareVersion")
	version?: string;

	constructor();
	constructor(configuration: ApplicationMetadataConfiguration);
	constructor(configuration?: ApplicationMetadataConfiguration) {
		if (configuration === undefined) {
			super();
			return;
		}

		super(configuration);
		this.category = configuration.category;
		this.os = configuration.os;
		this.version = configuration.version;
	}
}
//#endregion
//#region Organization metadata
export interface OrganizationMetadataDiscriminator {
	"Organization": "Organization";
}

interface OrganizationMetadataScheme extends MetadataScheme {
	"@type": OrganizationMetadataDiscriminator[keyof OrganizationMetadataDiscriminator];
	logo?: string;
	email?: string;
	foundingDate?: string;
	/* address?: {
		"@type": "PostalAddress";
		addressLocality: string;
		addressCountry: string;
	}; */
}

/**
 * Configuration for an organization.
 */
export interface OrganizationMetadataConfiguration extends MetadataConfiguration {
	type: keyof OrganizationMetadataDiscriminator;

	/**
	 * The URL to the organization's logo image.
	 */
	logo?: URL;

	/**
	 * The primary contact email.
	 */
	email?: string;

	/**
	 * The date the organization was established.
	 */
	foundation?: Date;
}

class OrganizationMetadata extends Metadata {
	@Field(Optional(URLAdapter), "logo")
	logo?: URL;

	@Field(Optional(String), "email")
	email?: string;

	@Field(Optional(Date), "foundingDate")
	foundation?: Date;

	constructor();
	constructor(configuration: OrganizationMetadataConfiguration);
	constructor(configuration?: OrganizationMetadataConfiguration) {
		if (configuration === undefined) {
			super();
			return;
		}

		super(configuration);
		this.logo = configuration.logo;
		this.email = configuration.email;
		this.foundation = configuration.foundation;
	}
}
//#endregion

//#region Metadata injector
export class MetadataInjector {
	static #lock: boolean = true;
	static #instance: MetadataInjector | null = null;

	constructor() {
		if (MetadataInjector.#lock) throw new TypeError("Illegal constructor");
	}

	#compose(configuration: OrganizationMetadataConfiguration | ApplicationMetadataConfiguration | PersonMetadataConfiguration): Metadata {
		switch (configuration.type) {
		case "Person": return new PersonMetadata(configuration);
		case "Application": return new ApplicationMetadata(configuration);
		case "Organization": return new OrganizationMetadata(configuration);
		default: throw new TypeError(`Invalid '${typename(configuration)}' type for configuration`);
		}
	}

	#embedMetadataScript(metadata: Metadata): void {
		const scheme = Metadata.export<Metadata, MetadataScheme>(metadata);
		const script = document.createElement("script");
		script.type = "application/ld+json";
		script.textContent = JSON.stringify(scheme, undefined, "\t");
		const { head } = document;
		const child =
			document.querySelector("script") ??
			head.lastElementChild;
		head.insertBefore(script, child);
	}

	#embedRelLinks(metadata: Metadata): void {
		if (!(metadata instanceof PersonMetadata)) return;
		if (metadata.associations === undefined) return;
		const { head } = document;
		for (const association of metadata.associations) {
			const link = document.createElement("link");
			link.rel = "me";
			link.href = String(association);
			head.appendChild(link);
		}
	}

	#setMetadata(name: string, content: string): void {
		const meta =
			document.querySelector(`meta[name="${name}"]`) ??
			document.querySelector(`meta[property="${name}"]`) ??
			document.createElement("meta");
		meta.setAttribute(name.startsWith("og:") ? "property" : "name", name);
		meta.setAttribute("content", content);
		const { head } = document;
		const child =
			document.querySelector("title") ??
			document.querySelector("meta:last-of-type + *") ??
			head.firstElementChild;
		head.insertBefore(meta, child);
	}

	#embedMetatags(metadata: Metadata): void {
		if (metadata.description !== undefined) this.#setMetadata("description", metadata.description);
		if (metadata instanceof PersonMetadata) this.#setMetadata("author", metadata.name);
		this.#setMetadata("generator", "MetadataInjector/1.0.0");
		if (metadata instanceof ApplicationMetadata) this.#setMetadata("application-name", metadata.name);
		this.#setMetadata("og:title", metadata.name);
		if (metadata.description !== undefined) this.#setMetadata("og:description", metadata.description);
		this.#setMetadata("og:url", String(metadata.webpage));
		if (metadata.preview !== undefined) this.#setMetadata("og:image", String(metadata.preview));
		this.#setMetadata("og:type", metadata instanceof PersonMetadata ? "profile" : "website");
		const keywords: string[] = [];
		if (metadata.keywords !== undefined) keywords.push(...metadata.keywords);
		if (metadata instanceof PersonMetadata && metadata.knowledge !== undefined) keywords.push(...metadata.knowledge);
		if (keywords.length > 0) this.#setMetadata("keywords", Array.from(new Set(keywords)).join(","));
	}

	#embed(configuration: OrganizationMetadataConfiguration | ApplicationMetadataConfiguration | PersonMetadataConfiguration): void {
		const metadata = this.#compose(configuration);
		this.#embedMetadataScript(metadata);
		this.#embedRelLinks(metadata);
		this.#embedMetatags(metadata);
	}

	static inject(configuration: PersonMetadataConfiguration): void;
	static inject(configuration: ApplicationMetadataConfiguration): void;
	static inject(configuration: OrganizationMetadataConfiguration): void;
	static inject(configuration: OrganizationMetadataConfiguration | ApplicationMetadataConfiguration | PersonMetadataConfiguration): void {
		if (MetadataInjector.#instance !== null) return;
		MetadataInjector.#lock = false;
		const instance: MetadataInjector = MetadataInjector.#instance = new MetadataInjector();
		MetadataInjector.#lock = true;
		instance.#embed(configuration);
	}
}
//#endregion
