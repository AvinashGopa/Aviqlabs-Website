# AviQ Labs Website (aviqlabs.com)

This is the full, editable source for the Avyagraha Research and Analytics LLP website.

## Folder structure

    aviqlabs-website/
    ├── index.html        <- the page structure (headings, sections, text)
    ├── css/
    │   └── styles.css    <- all styling (colours, layout, spacing)
    ├── js/
    │   ├── logos.js      <- the technology logo images (Python, R, PyTorch …)
    │   └── script.js     <- all interactivity (menu, carousels, form, counters)
    ├── images/
    │   └── img01.jpg …   <- all photos and graphics used on the page
    ├── _backup/          <- previous versions of the three files. The
    │                        `pre-uiux-2026-09-08/` subfolder is the copy taken
    │                        immediately before the latest UI pass. Safe to
    │                        delete once you are happy.
    └── README.md         <- this file

The technology-logo icons are embedded images, so they live in their own
`js/logos.js` file. Keeping them separate makes `script.js` small and quick to
open, and lets the browser load the page before it loads the logos.

## Open it in VS Code

1. Install VS Code (https://code.visualstudio.com/) if you don't have it.
2. In VS Code: **File → Open Folder…** and choose this `aviqlabs-website` folder.
   (Open the folder, not just the file, so all paths work.)
3. Recommended: install the **Live Server** extension (Extensions panel, search
   "Live Server" by Ritwick Dey).

## Preview while you edit

- Right-click `index.html` → **Open with Live Server**.
- Your browser opens the site. Every time you save a file (Ctrl/Cmd+S), the
  preview refreshes automatically.

## Where to change things

- **Text / sections** → `index.html`. Each section is marked with a comment,
  e.g. `<!-- INVITED TALKS -->`, `<!-- AWARDS -->`, `<!-- CONTACT -->`.
- **Colours / fonts / spacing** → `css/styles.css`. Everything is defined at the
  very top under `:root` — brand colours, the type scale, the spacing scale, the
  elevation (shadow) ladder, corner radii and the section rhythm. Change a value
  once there and it updates page-wide.

  A few tokens are load-bearing for accessibility, so keep their contrast if you
  change them:

  | Token | Use | Must keep |
  |---|---|---|
  | `--body-c` | body text | 4.5:1 on white |
  | `--muted-c` | meta / captions | 4.5:1 on `--paper-2` |
  | `--teal` | links, kickers, small text on light | 4.5:1 on white |
  | `--teal-2` | accents on **dark only** | 3:1 on `--navy` |
  | `--gold-ink` | gold **text** on light | 4.5:1 on white |
  | `--gold` | gold badges on navy | 3:1 on `--navy` |

  `--teal-2` and `--gold` are bright and only pass on dark grounds — do not use
  them for text on white.
- **Behaviour** → `js/script.js` (form handling, carousels, counters, menu).
- **Replace a photo** → drop your new image in the `images/` folder and point the
  matching `<img src="images/…">` in `index.html` at it.

### When you add or replace an image

Always set `width` and `height` to the picture's real pixel size, and add
`loading="lazy"`:

    <img src="images/img37.jpg" width="1100" height="733" loading="lazy"
         decoding="async" alt="Short description of what is in the photo">

The `width`/`height` stop the page from jumping about while the photo loads, and
the `alt` text is what screen readers and Google read. Keep files small (resize
to roughly 1000–1200px wide) so the page stays fast.

## After you edit CSS or JS: bump the version stamp

`index.html` loads the stylesheet and scripts with a version query:

    <link rel="stylesheet" href="css/styles.css?v=20260908">
    <script src="js/script.js?v=20260908" defer></script>

Browsers cache those files aggressively, so a returning visitor can keep seeing
the **old** styling after you upload a change. Whenever you edit `styles.css`,
`script.js` or `logos.js`, change all three `?v=` numbers to today's date
(e.g. `?v=20261115`) and re-upload `index.html` as well. That forces every
browser to fetch the new file.

## Adding a new invited talk

In `index.html`, find `<!-- INVITED TALKS -->`. Copy one whole `<div class="it-card">…</div>`
block, paste it as the **first** card in the grid (newest talk first), then change
the photos, the title, the date and the venue:

    <div class="it-card reveal">
      <div class="it-frame">
        <button class="it-nav it-prev" onclick="itMove(this,-1)" aria-label="Previous photo">…</button>
        <button class="it-nav it-next" onclick="itMove(this,1)" aria-label="Next photo">…</button>
        <div class="it-slide active"><img src="images/YOUR-PHOTO-1.jpg" width="1280" height="960" loading="lazy" decoding="async" alt="…"></div>
        <div class="it-slide"><img src="images/YOUR-PHOTO-2.jpg" width="1280" height="960" loading="lazy" decoding="async" alt="…"></div>
        <div class="it-dots">
          <button class="it-dot active" onclick="itShow(this.closest('.it-frame'),0)" aria-label="Photo 1"></button>
          <button class="it-dot" onclick="itShow(this.closest('.it-frame'),1)" aria-label="Photo 2"></button>
        </div>
        <div class="it-count">1 / 2</div>
      </div>
      <div class="it-body">
        <span class="kick">Invited talk</span>
        <h3>Title of the talk</h3>
        <div class="it-meta"><span>Month Year</span><span>Institution, City</span></div>
      </div>
    </div>

Rules to keep the carousel working:

- The **first** `.it-slide` must have `active` on it; the others must not.
- There must be **one `.it-dot` per slide**, and the first dot has `active`.
- The numbers in `itShow(this.closest('.it-frame'), N)` count from 0, so three
  photos means dots with 0, 1 and 2.
- Update `<div class="it-count">1 / 2</div>` to the real number of photos.

## Training programmes

There is no "upcoming cohort" section any more. Completed programmes live under
`<!-- PAST EVENTS -->` (the "Training programmes and cohorts" section), and the
strip underneath it invites people to request the next one.

When a new cohort opens, the simplest approach is to add it as a tile in that
grid and change the wording in the `.ev-foot` strip at the end of the section.

## Making the enquiry form work

Open `js/script.js` and find:

    const FORM_ENDPOINT = "https://formsubmit.co/ajax/avinashstat@aviqlabs.com";

FormSubmit needs a **one-time activation**: submit the form once from the live
site, then click the confirmation link that arrives by email. After that,
submissions reach your inbox. To switch services (e.g. Web3Forms or Formspree),
paste the new endpoint between the quotes. If you empty the string, the form
falls back to opening the visitor's own email app.

## Deploying to GoDaddy (cPanel / Web Hosting)

Upload the **contents** of this folder (the `index.html` file plus the `css`,
`js` and `images` folders) into your hosting's `public_html` folder, keeping the
same structure. In cPanel: File Manager → public_html → Upload.

You do not need to upload `_backup/` or `README.md`.
