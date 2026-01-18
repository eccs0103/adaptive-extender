import "adaptive-extender/core";
import { ArrayOf, Deferred, Descendant, Field, Nullable, PortableModel } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

//#region Spotify activity
@Descendant(Deferred(_ => SpotifyLikeActivity))
export abstract class SpotifyActivity extends PortableModel {
	@Field(String, "url")
	link!: string;
}
//#endregion
//#region Spotify like activity
export class SpotifyLikeActivity extends SpotifyActivity {
	@Field(String, "title")
	title!: string;

	@Field(ArrayOf(String), "artists")
	artists!: string[];

	@Field(Nullable(String), "cover")
	cover!: string | null;
}
//#endregion

describe("Hoooo", () => {
	it("Asda", () => {
		const raw = {
			$type: "SpotifyLikeActivity",
			url: "http...",
			title: "Song",
			artists: ["Artist A"],
			cover: null,
		};

		console.log("raw_before", raw);
		const activity = SpotifyActivity.import(raw, "api_response");

		expect(activity instanceof SpotifyLikeActivity);
		console.log("port", activity);

		const raw2 = SpotifyActivity.export(activity);
		console.log("raw_after", raw2);
	});
});

//#region Node
export interface NodeScheme {
	children: NodeScheme[];
}

export class Node extends PortableModel {
	@Field(ArrayOf(Deferred(_ => Node)))
	children!: Node[];
}
//#endregion
