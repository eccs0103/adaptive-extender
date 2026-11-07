"use strict";

import "./global.js";

const { max } = Math;

//#region URI syntax
interface URIPointMapper {
	(point: number): string;
}

interface URIBytesMapper {
	(bytes: readonly number[], begin: number, end: number): string;
}

class URISyntax {
	static #ucschar: string = "\\u{A0}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFEF}\\u{10000}-\\u{1FFFD}\\u{20000}-\\u{2FFFD}\\u{30000}-\\u{3FFFD}\\u{40000}-\\u{4FFFD}\\u{50000}-\\u{5FFFD}\\u{60000}-\\u{6FFFD}\\u{70000}-\\u{7FFFD}\\u{80000}-\\u{8FFFD}\\u{90000}-\\u{9FFFD}\\u{A0000}-\\u{AFFFD}\\u{B0000}-\\u{BFFFD}\\u{C0000}-\\u{CFFFD}\\u{D0000}-\\u{DFFFD}\\u{E1000}-\\u{EFFFD}";
	static #iprivate: string = "\\u{E000}-\\u{F8FF}\\u{F0000}-\\u{FFFFD}\\u{100000}-\\u{10FFFD}";
	static #unreserved: string = "A-Za-z0-9\\-._~";
	static #delimiters: string = "!$&'()*+,;=";

	static #scheme: RegExp = /^[A-Za-z][A-Za-z0-9+\-.]*$/;
	static #port: RegExp = /^[0-9]*$/;
	static #name: RegExp = URISyntax.#compose("", "");
	static #username: RegExp = URISyntax.#illegal("", "");
	static #userinfo: RegExp = URISyntax.#illegal(":", "");
	static #path: RegExp = URISyntax.#illegal(":@/", "");
	static #query: RegExp = URISyntax.#illegal(":@/?", URISyntax.#iprivate);
	static #fragment: RegExp = URISyntax.#illegal(":@/?", "");
	static #literal: RegExp = /^\[(.*)\]$/su;
	static #future: RegExp = /^[vV][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+$/;
	static #ipv4: RegExp = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
	static #h16: RegExp = /^[0-9A-Fa-f]{1,4}$/;
	static #character: RegExp = new RegExp(`^[${URISyntax.#unreserved}${URISyntax.#ucschar}]$`, "u");
	static #encoded: RegExp = /(?:%[0-9A-Fa-f]{2})+/g;
	static #reserved: RegExp = /[!'()~]/g;
	static #edges: RegExp = /^[\u0000-\u0020]+|[\u0000-\u0020]+$/g;
	static #breaks: RegExp = /[\t\n\r]/g;

	static #compose(extra: string, additional: string): RegExp {
		return new RegExp(`^(?:[${URISyntax.#unreserved}${URISyntax.#ucschar}${URISyntax.#delimiters}${extra}${additional}]|%[0-9A-Fa-f]{2})*$`, "u");
	}

	static #illegal(extra: string, additional: string): RegExp {
		return new RegExp(`%(?![0-9A-Fa-f]{2})|[^${URISyntax.#unreserved}${URISyntax.#ucschar}${URISyntax.#delimiters}${extra}${additional}%]`, "gu");
	}

	static clean(text: string): string {
		return text.replace(URISyntax.#edges, "").replace(URISyntax.#breaks, "");
	}

	static isScheme(text: string): boolean {
		return URISyntax.#scheme.test(text);
	}

	static isHost(text: string): boolean {
		const literal = URISyntax.#literal.exec(text);
		if (literal === null) return URISyntax.#name.test(text);
		const [, address] = literal;
		return URISyntax.#future.test(address) || URISyntax.#isIPv6(address);
	}

	static isPort(text: string): boolean {
		return URISyntax.#port.test(text);
	}

	static fixUsername(text: string): string {
		return text.replace(URISyntax.#username, URISyntax.#percent);
	}

	static fixUserinfo(text: string): string {
		return text.replace(URISyntax.#userinfo, URISyntax.#percent);
	}

	static fixPath(text: string): string {
		return text.replace(URISyntax.#path, URISyntax.#percent);
	}

	static fixQuery(text: string): string {
		return text.replace(URISyntax.#query, URISyntax.#percent);
	}

	static fixFragment(text: string): string {
		return text.replace(URISyntax.#fragment, URISyntax.#percent);
	}

	static #isIPv6(text: string): boolean {
		const halves = text.split("::");
		if (halves.length > 2) return false;
		let count = 0;
		for (let index = 0; index < halves.length; index++) {
			const half = halves[index];
			if (half === "") continue;
			const groups = half.split(":");
			for (let position = 0; position < groups.length; position++) {
				const group = groups[position];
				const last = index === halves.length - 1 && position === groups.length - 1;
				if (last && URISyntax.#ipv4.test(group)) {
					count += 2;
					continue;
				}
				if (!URISyntax.#h16.test(group)) return false;
				count++;
			}
		}
		if (halves.length === 2) return count <= 7;
		return count === 8;
	}

	static normalize(text: string): string {
		return text.replace(URISyntax.#encoded, run => URISyntax.#utf8(URISyntax.#bytes(run), URISyntax.#keep, URISyntax.#hex));
	}

	static decode(text: string): string {
		return text.replaceAll("+", " ").replace(URISyntax.#encoded, run => URISyntax.#utf8(URISyntax.#bytes(run), String.fromCodePoint, URISyntax.#replacement));
	}

	static encode(text: string): string {
		return encodeURIComponent(text.toWellFormed()).replace(URISyntax.#reserved, URISyntax.#percent).replaceAll("%20", "+");
	}

	static #percent(character: string): string {
		const point = character.codePointAt(0);
		if (point === undefined || point >= 0x80) return encodeURIComponent(character.toWellFormed());
		return `%${point.toString(16).toUpperCase().padStart(2, "0")}`;
	}

	static #keep(point: number): string {
		const character = String.fromCodePoint(point);
		if (URISyntax.#character.test(character)) return character;
		return URISyntax.#percent(character);
	}

	static #hex(bytes: readonly number[], begin: number, end: number): string {
		let result = "";
		for (let index = begin; index < end; index++) {
			result += `%${bytes[index].toString(16).toUpperCase().padStart(2, "0")}`;
		}
		return result;
	}

	static #replacement(): string {
		return "�";
	}

	static #bytes(run: string): number[] {
		const bytes: number[] = [];
		for (let index = 0; index < run.length; index += 3) {
			bytes.push(Number.parseInt(run.slice(index + 1, index + 3), 16));
		}
		return bytes;
	}

	static #utf8(bytes: readonly number[], valid: URIPointMapper, invalid: URIBytesMapper): string {
		let result = "";
		let needed = 0;
		let seen = 0;
		let point = 0;
		let lower = 0x80;
		let upper = 0xBF;
		let begin = 0;
		for (let index = 0; index < bytes.length; index++) {
			const byte = bytes[index];
			if (needed === 0) {
				begin = index;
				if (byte <= 0x7F) {
					result += valid(byte);
					continue;
				}
				if (byte >= 0xC2 && byte <= 0xDF) {
					needed = 1;
					point = byte & 0x1F;
					continue;
				}
				if (byte >= 0xE0 && byte <= 0xEF) {
					if (byte === 0xE0) lower = 0xA0;
					if (byte === 0xED) upper = 0x9F;
					needed = 2;
					point = byte & 0xF;
					continue;
				}
				if (byte >= 0xF0 && byte <= 0xF4) {
					if (byte === 0xF0) lower = 0x90;
					if (byte === 0xF4) upper = 0x8F;
					needed = 3;
					point = byte & 0x7;
					continue;
				}
				result += invalid(bytes, index, index + 1);
				continue;
			}
			if (byte < lower || byte > upper) {
				result += invalid(bytes, begin, index);
				needed = 0;
				seen = 0;
				point = 0;
				lower = 0x80;
				upper = 0xBF;
				index--;
				continue;
			}
			lower = 0x80;
			upper = 0xBF;
			point = (point << 6) | (byte & 0x3F);
			seen++;
			if (seen !== needed) continue;
			result += valid(point);
			needed = 0;
			seen = 0;
			point = 0;
		}
		if (needed !== 0) result += invalid(bytes, begin, bytes.length);
		return result;
	}
}
//#endregion
//#region URI reference
class URIReference {
	static #pattern: RegExp = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/su;
	static #authority: RegExp = /^(?:(.*)@)?(\[[^\]]*\]|[^:]*)(?::(.*))?$/su;
	static #ports: ReadonlyMap<string, number> = new Map([["http", 80], ["https", 443], ["ws", 80], ["wss", 443], ["ftp", 21]]);

	scheme: string | null = null;
	userinfo: string | null = null;
	host: string | null = null;
	port: string | null = null;
	path: string = "";
	query: string | null = null;
	fragment: string | null = null;

	static parse(text: string): URIReference | null {
		const match = URIReference.#pattern.exec(URISyntax.clean(text));
		if (match === null) return null;
		const [, scheme, authority, path, query, fragment] = match;
		const reference = new URIReference();
		if (scheme !== undefined) {
			if (!URISyntax.isScheme(scheme)) return null;
			reference.scheme = scheme;
		}
		if (authority !== undefined && !reference.#readAuthority(authority)) return null;
		reference.path = URISyntax.fixPath(path);
		if (query !== undefined) reference.query = URISyntax.fixQuery(query);
		if (fragment !== undefined) reference.fragment = URISyntax.fixFragment(fragment);
		return reference;
	}

	#readAuthority(authority: string): boolean {
		const parts = URIReference.#authority.exec(authority);
		if (parts === null) return false;
		const [, userinfo, host, port] = parts;
		if (userinfo !== undefined) this.userinfo = URISyntax.fixUserinfo(userinfo);
		if (!URISyntax.isHost(host)) return false;
		this.host = host;
		if (port === undefined) return true;
		if (!URISyntax.isPort(port)) return false;
		this.port = port;
		return true;
	}

	static splitHost(text: string): readonly [string, string | null] | null {
		const parts = URIReference.#authority.exec(text);
		if (parts === null) return null;
		const [, userinfo, host, port] = parts;
		if (userinfo !== undefined) return null;
		return [host, port ?? null];
	}

	assign(source: Readonly<URIReference>): void {
		this.scheme = source.scheme;
		this.userinfo = source.userinfo;
		this.host = source.host;
		this.port = source.port;
		this.path = source.path;
		this.query = source.query;
		this.fragment = source.fragment;
	}

	copy(): URIReference {
		const reference = new URIReference();
		reference.assign(this);
		return reference;
	}

	#adoptAuthority(source: Readonly<URIReference>): void {
		this.userinfo = source.userinfo;
		this.host = source.host;
		this.port = source.port;
	}

	resolve(base: Readonly<URIReference>): URIReference {
		const target = new URIReference();
		target.fragment = this.fragment;
		if (this.scheme !== null) {
			target.scheme = this.scheme;
			target.#adoptAuthority(this);
			target.path = URIReference.#collapse(this.path);
			target.query = this.query;
			return target;
		}
		target.scheme = base.scheme;
		if (this.host !== null) {
			target.#adoptAuthority(this);
			target.path = URIReference.#collapse(this.path);
			target.query = this.query;
			return target;
		}
		target.#adoptAuthority(base);
		if (this.path === "") {
			target.path = base.path;
			target.query = this.query ?? base.query;
			return target;
		}
		target.query = this.query;
		if (this.path.startsWith("/")) {
			target.path = URIReference.#collapse(this.path);
			return target;
		}
		target.path = URIReference.#collapse(URIReference.#merge(base, this.path));
		return target;
	}

	static #merge(base: Readonly<URIReference>, path: string): string {
		if (base.host !== null && base.path === "") return `/${path}`;
		return base.path.slice(0, base.path.lastIndexOf("/") + 1) + path;
	}

	static #collapse(path: string): string {
		let input = path;
		let output = "";
		while (input.length > 0) {
			if (input.startsWith("../")) {
				input = input.slice(3);
				continue;
			}
			if (input.startsWith("./")) {
				input = input.slice(2);
				continue;
			}
			if (input.startsWith("/./")) {
				input = input.slice(2);
				continue;
			}
			if (input === "/.") {
				input = "/";
				continue;
			}
			if (input.startsWith("/../") || input === "/..") {
				input = `/${input.slice(input === "/.." ? 3 : 4)}`;
				output = output.slice(0, max(output.lastIndexOf("/"), 0));
				continue;
			}
			if (input === "." || input === "..") {
				input = "";
				continue;
			}
			const slash = input.indexOf("/", 1);
			const segment = slash < 0 ? input : input.slice(0, slash);
			output += segment;
			input = input.slice(segment.length);
		}
		return output;
	}

	get origin(): string {
		const { scheme, host, port } = this;
		if (scheme === null || host === null || host === "") return "null";
		const name = scheme.toLowerCase();
		let result = `${name}://${host.toLowerCase()}`;
		if (port === null || port === "") return result;
		if (Number(port) === URIReference.#ports.get(name)) return result;
		result += `:${Number(port)}`;
		return result;
	}

	normalize(): void {
		const { scheme, userinfo, host, port } = this;
		if (scheme !== null) this.scheme = scheme.toLowerCase();
		if (userinfo !== null) this.userinfo = URISyntax.normalize(userinfo);
		if (host !== null) this.host = URISyntax.normalize(URISyntax.normalize(host).toLowerCase());
		const fallback = this.scheme === null ? undefined : URIReference.#ports.get(this.scheme);
		if (port === "" || (port !== null && Number(port) === fallback)) this.port = null;
		this.path = URIReference.#collapse(URISyntax.normalize(this.path));
		if (this.host !== null && this.path === "" && fallback !== undefined) this.path = "/";
		const { query, fragment } = this;
		if (query !== null) this.query = URISyntax.normalize(query);
		if (fragment !== null) this.fragment = URISyntax.normalize(fragment);
	}

	toString(): string {
		const { scheme, userinfo, host, port, path, query, fragment } = this;
		let result = "";
		if (scheme !== null) result += `${scheme}:`;
		if (host !== null) {
			result += "//";
			if (userinfo !== null) result += `${userinfo}@`;
			result += host;
			if (port !== null) result += `:${port}`;
		}
		if (host === null && path.startsWith("//")) result += "/.";
		result += path;
		if (query !== null) result += `?${query}`;
		if (fragment !== null) result += `#${fragment}`;
		return result;
	}
}
//#endregion
//#region URI search params
/**
 * Represents the callback invoked by {@link URISearchParams.forEach} for each parameter.
 */
export interface URISearchParamsCallback {
	(value: string, key: string, parent: URISearchParams): void;
}

/**
 * Represents an ordered list of query parameters, mirroring the platform `URLSearchParams`.
 * Parsing and serialization follow the `application/x-www-form-urlencoded` format (`+` stands for a space), which is an HTML convention, not part of RFC 3986.
 */
export class URISearchParams {
	#entries: [string, string][] = [];

	/**
	 * Creates an empty parameter list.
	 */
	constructor();
	/**
	 * Parses a query string; a leading `?` is ignored.
	 */
	constructor(init: string);
	/**
	 * Creates a parameter list from name-value pairs.
	 * @throws {TypeError} If a pair does not hold exactly two items.
	 */
	constructor(init: Iterable<readonly [string, string]>);
	/**
	 * Creates a parameter list from the own enumerable properties of a record.
	 */
	constructor(init: Readonly<Record<string, string>>);
	constructor(init: string | Iterable<readonly [string, string]> | Readonly<Record<string, string>> = "") {
		if (typeof init === "string") {
			this.#read(init);
			return;
		}
		if (Symbol.iterator in init) {
			this.#readPairs(init);
			return;
		}
		for (const [name, value] of Object.entries(init)) {
			this.#push(name, value);
		}
	}

	#push(name: string, value: string): void {
		this.#entries.push([name.toWellFormed(), value.toWellFormed()]);
	}

	#read(text: string): void {
		const entries = this.#entries;
		const query = text.startsWith("?") ? text.slice(1) : text;
		for (const part of query.split("&")) {
			if (part === "") continue;
			const equals = part.indexOf("=");
			const name = equals < 0 ? part : part.slice(0, equals);
			const value = equals < 0 ? "" : part.slice(equals + 1);
			entries.push([URISyntax.decode(name), URISyntax.decode(value)]);
		}
	}

	#readPairs(pairs: Iterable<readonly [string, string]>): void {
		for (const pair of pairs) {
			if (pair.length !== 2) throw new TypeError(`Unable to read a parameter from a pair of ${pair.length} items`);
			const [name, value] = pair;
			this.#push(name, value);
		}
	}

	/**
	 * Gets the number of parameters.
	 */
	get size(): number {
		return this.#entries.length;
	}

	/**
	 * Appends a parameter.
	 */
	append(name: string, value: string): void {
		this.#push(name, value);
	}

	/**
	 * Removes every parameter with the given name.
	 */
	delete(name: string): void;
	/**
	 * Removes every parameter with the given name and value.
	 */
	delete(name: string, value: string): void;
	delete(name: string, value?: string): void {
		const key = name.toWellFormed();
		const text = value?.toWellFormed();
		this.#entries = this.#entries.filter(([name2, value2]) => name2 !== key || (text !== undefined && value2 !== text));
	}

	/**
	 * Gets the value of the first parameter with the given name.
	 * @returns The value, or null if there is no such parameter.
	 */
	get(name: string): string | null {
		const key = name.toWellFormed();
		const entry = this.#entries.find(([name2]) => name2 === key);
		if (entry === undefined) return null;
		return entry[1];
	}

	/**
	 * Gets the values of every parameter with the given name, in order.
	 */
	getAll(name: string): string[] {
		const key = name.toWellFormed();
		const values: string[] = [];
		for (const [name2, value] of this.#entries) {
			if (name2 === key) values.push(value);
		}
		return values;
	}

	/**
	 * Checks whether a parameter with the given name exists.
	 */
	has(name: string): boolean;
	/**
	 * Checks whether a parameter with the given name and value exists.
	 */
	has(name: string, value: string): boolean;
	has(name: string, value?: string): boolean {
		const key = name.toWellFormed();
		const text = value?.toWellFormed();
		return this.#entries.some(([name2, value2]) => name2 === key && (text === undefined || value2 === text));
	}

	/**
	 * Sets the value of the first parameter with the given name and removes the others, or appends the parameter if none exists.
	 */
	set(name: string, value: string): void {
		const key = name.toWellFormed();
		const text = value.toWellFormed();
		const entries = this.#entries;
		const index = entries.findIndex(([name2]) => name2 === key);
		if (index < 0) {
			entries.push([key, text]);
			return;
		}
		entries[index] = [key, text];
		this.#entries = entries.filter(([name2], position) => position <= index || name2 !== key);
	}

	/**
	 * Sorts the parameters by name in code unit order; parameters with equal names keep their relative order.
	 */
	sort(): void {
		this.#entries.sort(([name], [name2]) => {
			if (name < name2) return -1;
			if (name > name2) return 1;
			return 0;
		});
	}

	/**
	 * Calls the callback for each parameter, in order.
	 */
	forEach(callback: URISearchParamsCallback): void {
		for (const [name, value] of this.#entries) {
			callback(value, name, this);
		}
	}

	/**
	 * Returns an iterator over the name-value pairs.
	 */
	*entries(): IteratorObject<[string, string], BuiltinIteratorReturn> {
		for (const [name, value] of this.#entries) {
			yield [name, value];
		}
	}

	/**
	 * Returns an iterator over the names.
	 */
	*keys(): IteratorObject<string, BuiltinIteratorReturn> {
		for (const [name] of this.#entries) {
			yield name;
		}
	}

	/**
	 * Returns an iterator over the values.
	 */
	*values(): IteratorObject<string, BuiltinIteratorReturn> {
		for (const [, value] of this.#entries) {
			yield value;
		}
	}

	/**
	 * Returns an iterator over the name-value pairs.
	 */
	[Symbol.iterator](): IteratorObject<[string, string], BuiltinIteratorReturn> {
		return this.entries();
	}

	/**
	 * Returns the parameters as an `application/x-www-form-urlencoded` string, without a leading `?`.
	 */
	toString(): string {
		let result = "";
		for (const [name, value] of this.#entries) {
			if (result !== "") result += "&";
			result += `${URISyntax.encode(name)}=${URISyntax.encode(value)}`;
		}
		return result;
	}
}
//#endregion
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
	 * Gets the whole URI; setting it parses a new absolute URI and ignores a value that is not one.
	 */
	get href(): string {
		return this.#reference.toString();
	}
	set href(value: string) {
		const reference = URI.#read(value);
		if (reference === null) return;
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
	 * Gets the scheme followed by `:`; setting it accepts the scheme with or without the `:` and ignores an invalid scheme.
	 */
	get protocol(): string {
		return `${this.#reference.scheme}:`;
	}
	set protocol(value: string) {
		const scheme = value.endsWith(":") ? value.slice(0, -1) : value;
		if (!URISyntax.isScheme(scheme)) return;
		this.#reference.scheme = scheme;
	}

	/**
	 * Gets the user name of the userinfo, or an empty string; setting it percent-encodes the characters a user name cannot hold, `:` included, and is ignored on a URI without authority.
	 */
	get username(): string {
		const { userinfo } = this.#reference;
		if (userinfo === null) return "";
		const colon = userinfo.indexOf(":");
		return colon < 0 ? userinfo : userinfo.slice(0, colon);
	}
	set username(value: string) {
		this.#writeUserinfo(URISyntax.fixUsername(value), this.password);
	}

	/**
	 * Gets the password of the userinfo, or an empty string; setting it percent-encodes the characters userinfo cannot hold and is ignored on a URI without authority.
	 */
	get password(): string {
		const { userinfo } = this.#reference;
		if (userinfo === null) return "";
		const colon = userinfo.indexOf(":");
		return colon < 0 ? "" : userinfo.slice(colon + 1);
	}
	set password(value: string) {
		this.#writeUserinfo(this.username, URISyntax.fixUserinfo(value));
	}

	#writeUserinfo(username: string, password: string): void {
		const reference = this.#reference;
		if (reference.host === null) return;
		if (password !== "") reference.userinfo = `${username}:${password}`;
		else reference.userinfo = username === "" ? null : username;
	}

	/**
	 * Gets the host with the port, if any; setting it ignores a value that is not a valid `host[:port]`, or that would put an authority before a rootless path.
	 */
	get host(): string {
		const { host, port } = this.#reference;
		if (host === null) return "";
		if (port === null || port === "") return host;
		return `${host}:${port}`;
	}
	set host(value: string) {
		const reference = this.#reference;
		const parts = URIReference.splitHost(value);
		if (parts === null) return;
		const [host, port] = parts;
		if (port !== null && !URISyntax.isPort(port)) return;
		if (!this.#accepts(host)) return;
		reference.host = host;
		reference.port = port;
	}

	/**
	 * Gets the host without the port, or an empty string; setting it ignores an invalid host, or one that would put an authority before a rootless path.
	 */
	get hostname(): string {
		return this.#reference.host ?? "";
	}
	set hostname(value: string) {
		if (!this.#accepts(value)) return;
		this.#reference.host = value;
	}

	#accepts(host: string): boolean {
		const { host: current, path } = this.#reference;
		if (!URISyntax.isHost(host)) return false;
		return current !== null || path === "" || path.startsWith("/");
	}

	/**
	 * Gets the port, or an empty string; setting an empty string removes the port, and a value that is not digits, or a URI without authority, is ignored.
	 */
	get port(): string {
		return this.#reference.port ?? "";
	}
	set port(value: string) {
		const reference = this.#reference;
		if (!URISyntax.isPort(value)) return;
		if (reference.host === null) return;
		reference.port = value === "" ? null : value;
	}

	/**
	 * Gets the path; setting it percent-encodes the characters a path cannot hold and, after an authority, adds the leading `/` a path needs there (RFC 3986 §3.3).
	 */
	get pathname(): string {
		return this.#reference.path;
	}
	set pathname(value: string) {
		const reference = this.#reference;
		const path = URISyntax.fixPath(value);
		if (reference.host !== null && path !== "" && !path.startsWith("/")) reference.path = `/${path}`;
		else reference.path = path;
	}

	/**
	 * Gets the query with a leading `?`, or an empty string; setting it percent-encodes the characters a query cannot hold, and an empty string removes the query.
	 */
	get search(): string {
		const { query } = this.#reference;
		if (query === null || query === "") return "";
		return `?${query}`;
	}
	set search(value: string) {
		const query = URISyntax.fixQuery(value.startsWith("?") ? value.slice(1) : value);
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
	 * Gets the fragment with a leading `#`, or an empty string; setting it percent-encodes the characters a fragment cannot hold, and an empty string removes the fragment.
	 */
	get hash(): string {
		const { fragment } = this.#reference;
		if (fragment === null || fragment === "") return "";
		return `#${fragment}`;
	}
	set hash(value: string) {
		const fragment = URISyntax.fixFragment(value.startsWith("#") ? value.slice(1) : value);
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
