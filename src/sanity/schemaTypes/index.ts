import { aboutPage } from "./aboutPage";
import { artwork } from "./artwork";
import { collection } from "./collection";
import { commissionRequest } from "./commissionRequest";
import { order } from "./order";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [artwork, collection, order, commissionRequest, aboutPage, siteSettings];

/** Documents created by the website, never by hand. */
export const websiteCreatedTypes = new Set(["order", "commissionRequest"]);

/** Documents that exist exactly once. */
export const singletonTypes = new Set(["aboutPage", "siteSettings"]);
