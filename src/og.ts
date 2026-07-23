// The social preview image for formweh.com, served at /og.png.
//
// To generate it: open assets/og-card.html in a browser, export the 1200x630 card
// as a PNG, base64-encode it, and paste the string below. Until then the route
// 404s and scrapers just fall back to the (rich) text preview.
//   base64 -i og.png | pbcopy
export const OG_PNG_B64 = ''

export function hasOgImage(): boolean {
  return OG_PNG_B64.length > 0
}
