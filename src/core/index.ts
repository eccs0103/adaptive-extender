"use strict";

export * from "./global.js";
export * from "./primitives.js";
export * from "./number.js";
export * from "./string.js";
export * from "./boolean.js";
export * from "./date.js";
export * from "./math.js";
export * from "./array.js";
export * from "./object.js";
export * from "./reflect.js";
export * from "./portable.js";
export * from "./error.js";
export * from "./promise.js";
export * from "./random.js";
export * from "./color.js";
export * from "./vector.js";
export * from "./vector-1.js";
export * from "./vector-2.js";
export * from "./vector-3.js";
export * from "./timespan.js";
export * from "./engine.js";
export * from "./controller.js";

import { PortableModel } from "./portable-model.js";
import { PolymorphicBase, Scheme } from "./decorators.js";
import { ArrayOf, Nullable } from "./wrappers.js";

// --- Base Class ---
// Наследуемся от PortableModel -> получаем import/export
// Передаем callback () => [...], чтобы Derived был виден, даже если он ниже в файле
@PolymorphicBase(() => [SpotifyLikeActivity])
export abstract class SpotifyActivity extends PortableModel {
	// В абстрактном классе конструктор можно пока опустить или оставить пустым
}

// --- Derived Class ---
export class SpotifyLikeActivity extends SpotifyActivity {

	@Scheme(String, "title")
	title!: string; // Используем !, так как поля заполняются через import, минуя конструктор

	@Scheme(ArrayOf(String), "artists")
	artists!: string[];

	@Scheme(Nullable(String), "cover")
	cover!: string | null;

	@Scheme(String, "url")
	url!: string;
}

// --- Использование ---
/*
const raw = {
	$type: "SpotifyLikeActivity",
	title: "Song",
	artists: ["Artist A"],
	cover: null,
	url: "http..."
};

// SpotifyActivity.import вернет экземпляр SpotifyLikeActivity
const activity = SpotifyActivity.import(raw, "api_response"); 

console.log(activity instanceof SpotifyLikeActivity); // true
console.log(activity.title); // "Song"
*/
