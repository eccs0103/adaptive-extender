"use strict";

import "./global.js";
import { URIReference } from "./uri-reference.js";
import { URISearchParams } from "./uri-search-params.js";
import { URISyntax } from "./uri-syntax.js";

//#region URI query
class URIQuery extends URISearchParams {
	#reference: URIReference;

	constructor(reference: URIReference) {
		super(reference.query ?? "");
		this.#reference = reference;
	}

	append(name: string, value: string): void {
		super.append(name, value);
		this.#write();
	}

	delete(name: string, value?: string): void {
		if (value === undefined) super.delete(name);
		else super.delete(name, value);
		this.#write();
	}

	set(name: string, value: string): void {
		super.set(name, value);
		this.#write();
	}

	sort(): void {
		super.sort();
		this.#write();
	}

	reload(): void {
		for (const name of new Set(this.keys())) {
			super.delete(name);
		}
		for (const [name, value] of new URISearchParams(this.#reference.query ?? "")) {
			super.append(name, value);
		}
	}

	#write(): void {
		const text = this.toString();
		this.#reference.query = text === "" ? null : text;
	}
}
//#endregion
//#region URI
/**
 * Represents a Uniform Resource Identifier by RFC 3986, extended to Unicode by RFC 3987 (IRI).
 * It follows one generic grammar for every scheme and keeps Unicode as written; the platform `URL` view (WHATWG) is available through the environment bridges, such as `toURL()`.
 */
export class URI {
	#reference: URIReference;
	#parameters: URIQuery | null = null;

	/**
	 * Creates the `about:blank` URI (RFC 6694).
	 */
	constructor();
	/**
	 * Copies another URI.
	 */
	constructor(source: Readonly<URI>);
	/**
	 * Parses an absolute URI.
	 * Bundlers detect only `new URL(literal, import.meta.url)` to emit assets and workers, so keep that form for them and wrap it with `URI.fromURL(...)`.
	 * @throws {TypeError} If the input is not an absolute URI.
	 */
	constructor(input: string);
	/**
	 * Parses a URI reference and resolves it against a base (RFC 3986 §5.2).
	 * Bundlers detect only `new URL(literal, import.meta.url)` to emit assets and workers, so keep that form for them and wrap it with `URI.fromURL(...)`.
	 * @throws {TypeError} If the input is not a URI reference or the base is not an absolute URI.
	 */
	constructor(input: string, base: string);
	/**
	 * Parses a URI reference and resolves it against a base URI (RFC 3986 §5.2).
	 * @throws {TypeError} If the input is not a URI reference.
	 */
	constructor(input: string, base: Readonly<URI>);
	constructor(input: string | Readonly<URI> = "about:blank", base?: string | Readonly<URI>) {
		if (typeof input === "string") {
			const reference = URI.#read(input, base);
			if (reference === null) throw new TypeError(`Unable to parse '${input}' as URI`);
			this.#reference = reference;
			return;
		}
		if (!(input instanceof URI)) throw new TypeError(`Unable to copy URI from ${typename(input)}`);
		this.#reference = input.#reference.copy();
	}

	static #read(input: string, base?: string | Readonly<URI>): URIReference | null {
		const reference = URIReference.parse(input);
		if (reference === null) return null;
		if (base === undefined) return reference.scheme === null ? null : reference;
		const origin = URI.#base(base);
		if (origin === null) return null;
		return reference.resolve(origin);
	}

	static #base(base: string | Readonly<URI>): URIReference | null {
		if (base instanceof URI) return base.#reference;
		if (typeof base !== "string") return null;
		const reference = URIReference.parse(base);
		if (reference === null || reference.scheme === null) return null;
		return reference;
	}

	static #wrap(reference: URIReference): URI {
		const uri = new URI();
		uri.#reference = reference;
		return uri;
	}

	/**
	 * Checks whether the input parses as an absolute URI.
	 */
	static canParse(input: string): boolean;
	/**
	 * Checks whether the input parses as a URI reference against the base.
	 */
	static canParse(input: string, base: string): boolean;
	/**
	 * Checks whether the input parses as a URI reference against the base URI.
	 */
	static canParse(input: string, base: Readonly<URI>): boolean;
	static canParse(input: string, base?: string | Readonly<URI>): boolean {
		return URI.#read(input, base) !== null;
	}

	/**
	 * Attempts to parse an absolute URI.
	 * @returns The parsed URI, or null if the input is invalid.
	 */
	static tryParse(input: string): URI | null;
	/**
	 * Attempts to parse a URI reference and resolve it against the base.
	 * @returns The resolved URI, or null if the input or the base is invalid.
	 */
	static tryParse(input: string, base: string): URI | null;
	/**
	 * Attempts to parse a URI reference and resolve it against the base URI.
	 * @returns The resolved URI, or null if the input is invalid.
	 */
	static tryParse(input: string, base: Readonly<URI>): URI | null;
	static tryParse(input: string, base?: string | Readonly<URI>): URI | null {
		const reference = URI.#read(input, base);
		if (reference === null) return null;
		return URI.#wrap(reference);
	}

	/**
	 * Parses an absolute URI.
	 * @throws {SyntaxError} If the input is invalid.
	 */
	static parse(input: string): URI;
	/**
	 * Parses a URI reference and resolves it against the base.
	 * @throws {SyntaxError} If the input or the base is invalid.
	 */
	static parse(input: string, base: string): URI;
	/**
	 * Parses a URI reference and resolves it against the base URI.
	 * @throws {SyntaxError} If the input is invalid.
	 */
	static parse(input: string, base: Readonly<URI>): URI;
	static parse(input: string, base?: string | Readonly<URI>): URI {
		const reference = URI.#read(input, base);
		if (reference === null) throw new SyntaxError(`Unable to parse '${input}' as URI`);
		return URI.#wrap(reference);
	}

	/**
	 * Gets the whole URI; setting it parses a new absolute URI.
	 * @throws {TypeError} On set, if the value is not an absolute URI.
	 */
	get href(): string {
		return this.#reference.toString();
	}
	set href(value: string) {
		const reference = URI.#read(value);
		if (reference === null) throw new TypeError(`Unable to parse '${value}' as URI`);
		this.#reference.assign(reference);
		this.#parameters?.reload();
	}

	/**
	 * Gets the origin by RFC 6454: `scheme://host[:port]` without the default port, or `"null"` for a URI without a host.
	 */
	get origin(): string {
		return this.#reference.origin;
	}

	/**
	 * Gets the scheme followed by `:`; setting it accepts the scheme with or without the `:`.
	 * @throws {TypeError} On set, if the value is not a valid scheme.
	 */
	get protocol(): string {
		return `${this.#reference.scheme}:`;
	}
	set protocol(value: string) {
		const scheme = value.endsWith(":") ? value.slice(0, -1) : value;
		if (!URISyntax.isScheme(scheme)) throw new TypeError(`Invalid '${value}' scheme`);
		this.#reference.scheme = scheme;
	}

	/**
	 * Gets the user name of the userinfo, or an empty string.
	 * @throws {TypeError} On set, if the value is invalid or the URI has no authority.
	 */
	get username(): string {
		const { userinfo } = this.#reference;
		if (userinfo === null) return "";
		const colon = userinfo.indexOf(":");
		return colon < 0 ? userinfo : userinfo.slice(0, colon);
	}
	set username(value: string) {
		if (!URISyntax.isUserinfo(value) || value.includes(":")) throw new TypeError(`Invalid '${value}' username`);
		this.#writeUserinfo(value, this.password);
	}

	/**
	 * Gets the password of the userinfo, or an empty string.
	 * @throws {TypeError} On set, if the value is invalid or the URI has no authority.
	 */
	get password(): string {
		const { userinfo } = this.#reference;
		if (userinfo === null) return "";
		const colon = userinfo.indexOf(":");
		return colon < 0 ? "" : userinfo.slice(colon + 1);
	}
	set password(value: string) {
		if (!URISyntax.isUserinfo(value)) throw new TypeError(`Invalid '${value}' password`);
		this.#writeUserinfo(this.username, value);
	}

	#writeUserinfo(username: string, password: string): void {
		const reference = this.#reference;
		if (reference.host === null) throw new TypeError("Unable to set userinfo on a URI without authority");
		if (password !== "") reference.userinfo = `${username}:${password}`;
		else reference.userinfo = username === "" ? null : username;
	}

	/**
	 * Gets the host with the port, if any.
	 * @throws {TypeError} On set, if the value is not a valid `host[:port]` or the path cannot follow an authority.
	 */
	get host(): string {
		const { host, port } = this.#reference;
		if (host === null) return "";
		if (port === null || port === "") return host;
		return `${host}:${port}`;
	}
	set host(value: string) {
		const parts = URIReference.splitHost(value);
		if (parts === null) throw new TypeError(`Invalid '${value}' host`);
		const [host, port] = parts;
		if (port !== null && !URISyntax.isPort(port)) throw new TypeError(`Invalid '${value}' host`);
		this.hostname = host;
		this.#reference.port = port;
	}

	/**
	 * Gets the host without the port, or an empty string.
	 * @throws {TypeError} On set, if the value is not a valid host or the path cannot follow an authority.
	 */
	get hostname(): string {
		return this.#reference.host ?? "";
	}
	set hostname(value: string) {
		const reference = this.#reference;
		const { path } = reference;
		if (!URISyntax.isHost(value)) throw new TypeError(`Invalid '${value}' host`);
		if (reference.host === null && path !== "" && !path.startsWith("/")) throw new TypeError(`Unable to add an authority before the '${path}' path`);
		reference.host = value;
	}

	/**
	 * Gets the port, or an empty string.
	 * @throws {TypeError} On set, if the value is not digits or the URI has no authority.
	 */
	get port(): string {
		return this.#reference.port ?? "";
	}
	set port(value: string) {
		const reference = this.#reference;
		if (!URISyntax.isPort(value)) throw new TypeError(`Invalid '${value}' port`);
		if (reference.host === null) throw new TypeError("Unable to set port on a URI without authority");
		reference.port = value === "" ? null : value;
	}

	/**
	 * Gets the path.
	 * @throws {TypeError} On set, if the value is invalid or does not fit the authority (RFC 3986 §3.3).
	 */
	get pathname(): string {
		return this.#reference.path;
	}
	set pathname(value: string) {
		const reference = this.#reference;
		if (!URISyntax.isPath(value)) throw new TypeError(`Invalid '${value}' path`);
		if (reference.host !== null && value !== "" && !value.startsWith("/")) throw new TypeError(`The '${value}' path must start with '/' after an authority`);
		if (reference.host === null && value.startsWith("//")) throw new TypeError(`The '${value}' path cannot start with '//' without an authority`);
		reference.path = value;
	}

	/**
	 * Gets the query with a leading `?`, or an empty string; setting an empty string removes the query.
	 * @throws {TypeError} On set, if the value is not a valid query.
	 */
	get search(): string {
		const { query } = this.#reference;
		if (query === null || query === "") return "";
		return `?${query}`;
	}
	set search(value: string) {
		const query = value.startsWith("?") ? value.slice(1) : value;
		if (!URISyntax.isQuery(query)) throw new TypeError(`Invalid '${value}' query`);
		this.#reference.query = query === "" ? null : query;
		this.#parameters?.reload();
	}

	/**
	 * Gets the live query parameters; changing them rewrites the query.
	 */
	get searchParams(): URISearchParams {
		const parameters = this.#parameters;
		if (parameters !== null) return parameters;
		const query = new URIQuery(this.#reference);
		this.#parameters = query;
		return query;
	}

	/**
	 * Gets the fragment with a leading `#`, or an empty string; setting an empty string removes the fragment.
	 * @throws {TypeError} On set, if the value is not a valid fragment.
	 */
	get hash(): string {
		const { fragment } = this.#reference;
		if (fragment === null || fragment === "") return "";
		return `#${fragment}`;
	}
	set hash(value: string) {
		const fragment = value.startsWith("#") ? value.slice(1) : value;
		if (!URISyntax.isFragment(fragment)) throw new TypeError(`Invalid '${value}' fragment`);
		this.#reference.fragment = fragment === "" ? null : fragment;
	}

	/**
	 * Normalizes the URI in place (RFC 3986 §6.2.2 and §6.2.3): lowercases the scheme and host, uppercases percent-encodings, decodes unreserved characters, removes dot segments, drops the default port and gives an empty http(s), ws(s) or ftp path a `/`.
	 */
	normalize(): void {
		this.#reference.normalize();
		this.#parameters?.reload();
	}

	/**
	 * Returns the whole URI.
	 */
	toString(): string {
		return this.href;
	}

	/**
	 * Returns the whole URI for `JSON.stringify`.
	 */
	toJSON(): string {
		return this.href;
	}

	/**
	 * Validates and imports a URI from a raw string source.
	 * @param source The raw value to check.
	 * @param name The field name for error context.
	 * @throws {TypeError} If the source is not a string.
	 * @throws {SyntaxError} If the string cannot be parsed as an absolute URI.
	 */
	static import(source: any, name: string): URI {
		if (typeof source !== "string") throw new TypeError(`Unable to import URI from ${name} due its ${typename(source)} type`);
		return URI.parse(source);
	}

	/**
	 * Returns the URI string for export.
	 * @param source The URI to export.
	 */
	static export(source: URI): string {
		return source.href;
	}
}
//#endregion
