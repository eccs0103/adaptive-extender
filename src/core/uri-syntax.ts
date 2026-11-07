"use strict";

//#region URI syntax
interface URIPointMapper {
	(point: number): string;
}

interface URIBytesMapper {
	(bytes: readonly number[], begin: number, end: number): string;
}

export class URISyntax {
	static #ucschar: string = "\\u{A0}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFEF}\\u{10000}-\\u{1FFFD}\\u{20000}-\\u{2FFFD}\\u{30000}-\\u{3FFFD}\\u{40000}-\\u{4FFFD}\\u{50000}-\\u{5FFFD}\\u{60000}-\\u{6FFFD}\\u{70000}-\\u{7FFFD}\\u{80000}-\\u{8FFFD}\\u{90000}-\\u{9FFFD}\\u{A0000}-\\u{AFFFD}\\u{B0000}-\\u{BFFFD}\\u{C0000}-\\u{CFFFD}\\u{D0000}-\\u{DFFFD}\\u{E1000}-\\u{EFFFD}";
	static #iprivate: string = "\\u{E000}-\\u{F8FF}\\u{F0000}-\\u{FFFFD}\\u{100000}-\\u{10FFFD}";
	static #unreserved: string = "A-Za-z0-9\\-._~";
	static #delimiters: string = "!$&'()*+,;=";

	static #scheme: RegExp = /^[A-Za-z][A-Za-z0-9+\-.]*$/;
	static #port: RegExp = /^[0-9]*$/;
	static #userinfo: RegExp = URISyntax.#compose(":", "");
	static #name: RegExp = URISyntax.#compose("", "");
	static #path: RegExp = URISyntax.#compose(":@/", "");
	static #query: RegExp = URISyntax.#compose(":@/?", URISyntax.#iprivate);
	static #fragment: RegExp = URISyntax.#compose(":@/?", "");
	static #literal: RegExp = /^\[(.*)\]$/su;
	static #future: RegExp = /^[vV][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+$/;
	static #ipv4: RegExp = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
	static #h16: RegExp = /^[0-9A-Fa-f]{1,4}$/;
	static #character: RegExp = new RegExp(`^[${URISyntax.#unreserved}${URISyntax.#ucschar}]$`, "u");
	static #encoded: RegExp = /(?:%[0-9A-Fa-f]{2})+/g;
	static #invalid: RegExp = /%(?![0-9A-Fa-f]{2})|[^A-Za-z0-9\-._~!$&'()*+,;=:@/?%]/gu;
	static #invalid2: RegExp = /%(?![0-9A-Fa-f]{2})|[^A-Za-z0-9\-._~!$&'()*+,;=:@/?%[\]]/gu;
	static #reserved: RegExp = /[!'()~]/g;

	static #compose(extra: string, additional: string): RegExp {
		return new RegExp(`^(?:[${URISyntax.#unreserved}${URISyntax.#ucschar}${URISyntax.#delimiters}${extra}${additional}]|%[0-9A-Fa-f]{2})*$`, "u");
	}

	static isScheme(text: string): boolean {
		return URISyntax.#scheme.test(text);
	}

	static isUserinfo(text: string): boolean {
		return URISyntax.#userinfo.test(text);
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

	static isPath(text: string): boolean {
		return URISyntax.#path.test(text);
	}

	static isQuery(text: string): boolean {
		return URISyntax.#query.test(text);
	}

	static isFragment(text: string): boolean {
		return URISyntax.#fragment.test(text);
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

	static repair(href: string): string {
		const invalid = URISyntax.#invalid;
		const hash = href.indexOf("#");
		const rest = hash < 0 ? href : href.slice(0, hash);
		const question = rest.indexOf("?");
		const head = question < 0 ? rest : rest.slice(0, question);
		let result = URISyntax.#repairHierarchy(head);
		if (question >= 0) result += `?${URISyntax.#escape(rest.slice(question + 1), invalid)}`;
		if (hash >= 0) result += `#${URISyntax.#escape(href.slice(hash + 1), invalid)}`;
		return result;
	}

	static #repairHierarchy(head: string): string {
		const invalid = URISyntax.#invalid;
		const colon = head.indexOf(":");
		const scheme = head.slice(0, colon + 1);
		const after = head.slice(colon + 1);
		if (!after.startsWith("//")) return scheme + URISyntax.#escape(after, invalid);
		const slash = after.indexOf("/", 2);
		const authority = slash < 0 ? after.slice(2) : after.slice(2, slash);
		const path = slash < 0 ? "" : after.slice(slash);
		return `${scheme}//${URISyntax.#escape(authority, URISyntax.#invalid2)}${URISyntax.#escape(path, invalid)}`;
	}

	static #escape(text: string, pattern: RegExp): string {
		return text.replace(pattern, URISyntax.#percent);
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
