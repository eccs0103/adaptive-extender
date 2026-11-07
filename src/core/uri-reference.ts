"use strict";

import { URISyntax } from "./uri-syntax.js";

const { max } = Math;

//#region URI reference
export class URIReference {
	static #pattern: RegExp = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/u;
	static #authority: RegExp = /^(?:([^@]*)@)?(\[[^\]]*\]|[^:]*)(?::(.*))?$/u;
	static #ports: ReadonlyMap<string, number> = new Map([["http", 80], ["https", 443], ["ws", 80], ["wss", 443], ["ftp", 21]]);

	scheme: string | null = null;
	userinfo: string | null = null;
	host: string | null = null;
	port: string | null = null;
	path: string = "";
	query: string | null = null;
	fragment: string | null = null;

	static parse(text: string): URIReference | null {
		const match = URIReference.#pattern.exec(text);
		if (match === null) return null;
		const [, scheme, authority, path, query, fragment] = match;
		const reference = new URIReference();
		if (scheme !== undefined) {
			if (!URISyntax.isScheme(scheme)) return null;
			reference.scheme = scheme;
		}
		if (authority !== undefined && !reference.#readAuthority(authority)) return null;
		if (!URISyntax.isPath(path)) return null;
		reference.path = path;
		if (query !== undefined) {
			if (!URISyntax.isQuery(query)) return null;
			reference.query = query;
		}
		if (fragment !== undefined) {
			if (!URISyntax.isFragment(fragment)) return null;
			reference.fragment = fragment;
		}
		return reference;
	}

	#readAuthority(authority: string): boolean {
		const parts = URIReference.#authority.exec(authority);
		if (parts === null) return false;
		const [, userinfo, host, port] = parts;
		if (userinfo !== undefined) {
			if (!URISyntax.isUserinfo(userinfo)) return false;
			this.userinfo = userinfo;
		}
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
