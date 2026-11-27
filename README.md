# KBLsystems Audio Lab — local static site

A complete, offline rebuild of `kblsystems.blogspot.com` using the chosen
**Concept A — Dark Studio** design. All **29 posts**, the about page, an archive
and seven topic pages are generated locally.

- No comments, no AdSense, no Instagram embeds or links.
- No external requests: system fonts, local CSS/JS, local images.
- Light/dark mode, client-side search, topic filtering, responsive images,
  lightbox, reading progress and mobile navigation.

The three-concept design study is preserved at **`examples/index.html`**.

## Preview

```sh
cd /home/thei/test_blogspot
python3 -m http.server 8000
# http://localhost:8000/
```

If port 8000 is already in use by an older server, either stop that process
or use another port:

```sh
python3 -m http.server 8080
# http://localhost:8080/
```

Opening `index.html` directly works for browsing, theme switching and the
lightbox. A local server is recommended so search URLs and responsive `srcset`
behave exactly as they would when deployed.

## Editing text — simple local editor

```sh
./tools/edit.sh
# http://localhost:8000/editor
```

If port 8000 is busy: `./tools/edit.sh --port 8080`.

The editor is a small local web app with no extra dependencies:

- **Notes** — title, published month, kicker, topics and body.
- **Visual / HTML tabs** — edit in the rendered article style, or the raw HTML.
- **Site & About** — site title, tagline and the About intro paragraphs.
- **Save & rebuild** — writes the JSON/fragment, rebuilds the site and refreshes
  the preview. `Ctrl/Cmd+S` also saves.
- **Backups** — every save copies the content files to `content/backups/`.
- It binds to `127.0.0.1` only and serves the site at `/` and the editor at
  `/editor`.

The editor does not need a virtualenv — `tools/editor.py` uses only the Python
standard library, and `tools/build_site.py` was rewritten to be stdlib-only too.

## What is here

| | |
|---|---|
| Home | `index.html` — hero, 6 latest notes, all topics, projects strip, about band |
| Archive | `archive.html` — all 29 notes with search and topic chips |
| Topics | `labels/*.html` — 7 filtered pages with counts |
| Articles | `posts/*.html` — 29 cleaned posts in the Dark Studio layout |
| About | `about.html` — the original introduction, profile and archive facts |
| Images | 106 figures, originals plus 480/960/1600 WebP variants |
| Design study | `examples/index.html` — the original A/B/C comparison |

Topic counts: Blurbs 16 · Past Projects 13 · STM32 5 · X-over Setup 4 ·
Current Projects 3 · Electronics 3 · FIR filtering 3.

## Folder map

```
index.html            home
archive.html          searchable archive
about.html            about
posts/                29 article pages
labels/               7 topic pages
assets/
  site.css            base + Concept A + full-site additions
  app.js              theme, search/filter, lightbox, progress
  favicon.svg
  img/                all post images, tiles, portrait, WebP variants
content/
  site_posts.json     metadata + cleaned bodies for all 29 posts
  site_images.json    image dimensions + responsive variants
  posts_all/          individual cleaned body fragments
  posts.json          the 3-post sample used by the design study
  site.json           intro, profile, tiles
  backups/            pre-rewrite content snapshots (Nov 2026)
test_writingstyle/    rewrite drafts, topic folders and master index
source/raw/           untouched Blogger HTML (sitemap + 29 posts + pages)
examples/             A/B/C design study (uses ../../assets/img)
tools/                fetch / extract / build scripts + editor
  edit.sh             launcher for the local text editor
  editor.py           local editor server (stdlib)
  editor.html         editor UI (visual + HTML editing)
README.md
```

## Makeover — November 2026

All 29 posts were rewritten post-by-post, topic-by-topic, with a
**bench-first opening** and a full-body **smoother-flow** pass. The rewrites
are applied to the built site.

- Review drafts, topic folders and status: **`test_writingstyle/index.html`**
- Previous content: **`content/backups/rewrites-20261126-145110/`**
  (`site_posts.json`, `posts_all/`, `build_site.py`)
- Topic batches: STM32 (5), FIR filtering (3), Past Projects (13),
  X-over Setup (4), Current Projects (3), Blurbs (gallery), Electronics
  (cross-linked from Past Projects).
- Figures have descriptive alt text; captions, code blocks and tables are
  preserved. The old three-proposal style test remains in
  `test_writingstyle/2026-11-26/`.

## How the content was handled

- **Sources:** Blogger's JSON feed is disabled, so the sitemap and rendered HTML
  were used. Originals are kept untouched in `source/raw/`.
- **Dates:** only month precision is available from post URLs. The 1987 posts are
  backdated on the original blog and are kept as-is.
- **Labels:** normalised into seven topics. Posts with only `blurbs` fall back to
  Blurbs; the unlabelled slide post was assigned to Blurbs.
- **Images:** every figure was downloaded from Blogger at the largest available
  size, then resized to WebP variants. All 106 figures are local.
- **Internal links:** links to Blogger posts, topic labels, the about page and
  monthly archives were rewritten to local pages. External links still open in a
  new tab.
- **Removed:** scripts, inline styles, share bars, the Instagram link/sentence,
  advertising markup and the old JavaScript slideshow. The slideshow post is now
  a static four-image gallery.
- **Preserved:** tables, `<pre>` code blocks, author formatting, captions used as
  figure alt text, and the original post titles.
- **Duplicate titles:** the two “Dynamic lin. phase EQ” posts are suffixed
  `— part 1` / `— part 2`.
- **No comments:** there is no comment system or comment markup. The only mention
  of comments is in the prose.

## Mobile

Audited at 320, 360, 390 and 414 px in light and dark mode:

- No horizontal overflow on home, archive, topic, article or about pages.
- Header nav wraps under the brand and scrolls horizontally on narrow screens.
- Nav links, chips, theme toggle, footer links and buttons are at least 44 px tall.
- 16 px body and input text, so iOS does not zoom the search field.
- Article figures fill the column; the lightbox opens inside the viewport with a
  44 px close button.
- Search and topic filters work with the same client-side script on mobile.

## Rebuilding

The text editor needs no setup. Rebuilding the content from Blogger needs the
scraping dependencies:

```sh
python3 -m venv /tmp/kblvenv
/tmp/kblvenv/bin/pip install -r tools/requirements.txt

/tmp/kblvenv/bin/python tools/fetch_raw.py      # sitemap + 29 raw posts
/tmp/kblvenv/bin/python tools/extract_all.py    # clean content + all images
python3 tools/build_site.py                     # write the full site (stdlib)
```

Optional, refresh the three-concept study:

```sh
/tmp/kblvenv/bin/python tools/build_examples.py
```

`fetch_raw.py` skips already-downloaded pages, and `extract_all.py` reuses
downloaded images, so reruns are relatively fast. Scripts assume the repository is
at `/home/thei/test_blogspot`; change `ROOT` at the top if it moves.

## Notes

- The full site is self-contained except for the optional `examples/` design
  study, which references `../assets/img`.
- The About portrait is the largest version Blogger exposes (138×179), so it is
  intentionally shown at a modest size.
- The archive is a single long page (29 cards). Search and topic chips make it
  navigable without pagination.
- To deploy, upload the site root plus `posts/`, `labels/`, `assets/` and
  optionally `examples/`. If you drop `examples/`, remove the “Design study” link
  in the footer.
