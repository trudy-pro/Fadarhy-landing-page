// Centralised content layer. Every route reads from this file via
// typed imports — there is no CMS, no fetch, no markdown layer to keep
// in sync. The shape on top maps 1:1 to what each route renders.
//
// Adding a new content type: declare the shape with `export type`,
// export a typed array beneath it, then import the array inside a
// route loader. Slugs declared here MUST match the route file name
// (e.g. `projects.$slug.tsx` reads `projects.find(p => p.slug === $slug)`).

/** Wraps an Unsplash photo id with the right query string so the AI
 *  doesn't have to remember the format. Returns a 1600px-wide image by
 *  default; pass `w` to override (e.g. 800 for thumbnails). */
export const u = (id: string, w = 1600): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export type SiteMeta = {
  title: string;
  description: string;
  /** Used by route head() blocks as the default suffix on titles. */
  brandSuffix: string;
};

export const site: SiteMeta = {
  title: "FadäRhy — Find your next right connection",
  description: "Describe where you are. Get source-linked routes to the right people, programmes, labs and funding, with a clear next step.",
  brandSuffix: "—",
};

/** Replace with whatever the project ends up being. The starter shape
 *  is intentionally generic so the agent can rename / re-shape on the
 *  first prompt. */
export type Feature = {
  slug: string;
  title: string;
  body: string;
  icon?: string;
};

export const features: Feature[] = [];
