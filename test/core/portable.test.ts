import "adaptive-extender/core";
import { ArrayOf, Field, Nullable, PolymorphicBase, PortableModel } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

//#region Spotify activity
@PolymorphicBase(() => [SpotifyLikeActivity])
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
	const raw = {
		$type: "SpotifyLikeActivity",
		title: "Song",
		artists: ["Artist A"],
		cover: null,
		url: "http..."
	};
	console.log("raw_before", raw);

	const activity = SpotifyActivity.import(raw, "api_response");
	console.log("port", activity);
	expect(activity instanceof SpotifyLikeActivity);

	const raw2 = SpotifyActivity.export(activity);
	console.log("raw_after", raw2);
});
