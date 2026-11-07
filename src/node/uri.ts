"use strict";

import "../core/index.js";
import URLUtilities from "node:url";
import { URI } from "../core/index.js";

//#region URI
declare module "../core/uri.js" {
	interface URI {
		/**
		 * Converts the URI to a platform `URL`, which applies WHATWG rules such as punycode hosts and special-scheme normalization.
		 * @throws {TypeError} If the platform cannot parse the URI.
		 */
		toURL(): URL;
		/**
		 * Converts a `file:` URI to a platform file path.
		 * @throws {TypeError} If the URI is not a valid `file:` URI for this platform.
		 */
		toPath(): string;
	}

	namespace URI {
		/**
		 * Creates a URI from a platform `URL`; the characters that WHATWG leaves as written but RFC 3986 forbids, such as `|` or `^`, are percent-encoded.
		 */
		function fromURL(url: Readonly<URL>): URI;
		/**
		 * Creates a `file:` URI from a platform file path, resolved against the current working directory.
		 */
		function fromPath(path: string): URI;
	}
}

URI.prototype.toURL = function (this: URI): URL {
	return new URL(this.href);
};

URI.prototype.toPath = function (this: URI): string {
	return URLUtilities.fileURLToPath(this.toURL());
};

URI.fromURL = function (url: Readonly<URL>): URI {
	return new URI(url.href);
};

URI.fromPath = function (path: string): URI {
	return URI.fromURL(URLUtilities.pathToFileURL(path));
};
//#endregion
