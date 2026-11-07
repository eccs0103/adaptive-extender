"use strict";

import "../core/index.js";
import { URI } from "../core/index.js";

//#region URI
declare module "../core/uri.js" {
	interface URI {
		/**
		 * Converts the URI to a platform `URL`, which applies WHATWG rules such as punycode hosts and special-scheme normalization.
		 * @throws {TypeError} If the platform cannot parse the URI.
		 */
		toURL(): URL;
	}

	namespace URI {
		/**
		 * Creates a URI from a platform `URL`; the characters that WHATWG leaves as written but RFC 3986 forbids, such as `|` or `^`, are percent-encoded.
		 */
		function fromURL(url: Readonly<URL>): URI;
	}
}

URI.prototype.toURL = function (this: URI): URL {
	return new URL(this.href);
};

URI.fromURL = function (url: Readonly<URL>): URI {
	return new URI(url.href);
};
//#endregion
