# LapuGo Travel & Tours — Revision 6

Responsive multi-page Cebu tourism website prototype using HTML, CSS, JavaScript and JSON.

## New tour packages

1. Kawasan Canyoneering & Pescador Island Hopping
2. Cebu Safari Day Tour Package
3. Bantayan Island Tour Package — 3 Days / 2 Nights

## Tour buttons

Every tour card has two separate buttons:

- **View Itinerary** → complete itinerary page
- **Inquire** → Book Now / inquiry form

## Media

Revision 6 removes Wikipedia/Wikimedia image URLs from the website and adds Vercel deployment configuration.
New images are sourced from travel blogs/articles/travel photography pages and are shown
with courtesy/source credits and links.

## Videos

- YouTube cards use reliable thumbnail + original-video links to avoid the previous
  YouTube configuration error.
- Bantayan YouTube video supplied by LapuGo is included in the Gallery and Bantayan
  itinerary.
- The homepage uses the supplied TikTok through TikTok's official Embed Player. It uses
  muted autoplay/loop plus viewport play/pause behavior, with a manual Play button as a
  fallback when a browser blocks autoplay.

## Dark mode

The website defaults to dark mode. Use the sun/moon button in the navigation to switch
between dark and light mode. The preference is stored in localStorage.

## Backgrounds

The header and page hero areas use Cebu travel photography. Contact, About, Gallery and
Tour Packages each have a distinct photo-backed hero treatment. The footer also remains
photo-based.

## Vercel deployment

This is a static multi-page website and includes `vercel.json`. Upload the entire project
folder to Vercel (or connect the Git repository) with no build command and no output
directory required. The `.html` page links, JSON data file, CSS, JavaScript, images and
query-string tour pages are all intended to work as static Vercel assets.

The TikTok itself is hosted by TikTok, so Vercel only serves the page/player iframe;
TikTok's own availability and browser autoplay rules still apply.

## Run in VS Code

1. Extract the ZIP. Keep the entire `LapuGo-Travel-Tours-REVISION-8` folder together; do not separate the files.
2. Open the folder in VS Code.
3. Install Live Server.
4. Right-click `index.html`.
5. Choose **Open with Live Server**.

The site includes `js/site-data.js` as a static data fallback, so the core website can work even when opened directly from the folder. `data/site-data.json` is retained as the editable source copy.

## Important

The booking/inquiry forms are front-end prototypes. Connect them to a real email/CRM/backend
before production use.

Third-party photographs remain the property of their respective creators/sites. Credits and
source links are included, but permission/license requirements must be checked before any
commercial/public launch.


## GitHub / Vercel deployment

Upload the **contents of this one project folder as one repository/project root**. `index.html`, `vercel.json`, `assets/`, `css/`, `js/`, and `data/` must remain together at the same root level shown in the ZIP.

For Vercel, import the GitHub repository and leave the framework preset as **Other** (or no framework), with no build command and no output directory. The root directory must contain `index.html`.

For GitHub Pages, enable Pages from the repository branch/root. The included `.nojekyll` file prevents Jekyll from changing static asset handling.


## IMPORTANT: Flat GitHub/Vercel structure
All website files are intentionally kept in ONE project folder at the same root level. There are no required assets/, css/, js/, or data/ subfolders. Keep `index.html`, `style.css`, `app.js`, `site-data.js`, `site-data.json`, `logo-transparent.png`, and the other HTML files together in the repository root. This makes the project easier to upload to GitHub and deploy to Vercel without changing Root Directory settings.
