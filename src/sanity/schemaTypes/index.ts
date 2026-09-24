import { aboutPage } from "./aboutPage";
import { artwork } from "./artwork";
import { collection } from "./collection";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [artwork, collection, aboutPage, siteSettings];

/** Documents that exist exactly once. */
export const singletonTypes = new Set(["aboutPage", "siteSettings"]);
