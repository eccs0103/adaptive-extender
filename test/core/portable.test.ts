import "adaptive-extender/core";
import { ArrayOf, Deferred, Field, Nullable, PolymorphicBase, PortableModel } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

//#region Spotify activity
@PolymorphicBase(Deferred(_ => SpotifyLikeActivity))
export abstract class SpotifyActivity extends PortableModel {
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

	@Field(String, "url")
	url!: string;
}
//#endregion

describe("Hoooo", () => {
	it("Asda", () => {
		const raw = {
			$type: "SpotifyLikeActivity",
			title: "Song",
			artists: ["Artist A"],
			cover: null,
			url: "http..."
		};

		console.log("raw_before", raw);
		const activity = SpotifyActivity.import(raw, "api_response");

		expect(activity instanceof SpotifyLikeActivity);
		console.log("port", activity);

		const raw2 = SpotifyActivity.export(activity);
		console.log("raw_after", raw2);
	});
});
