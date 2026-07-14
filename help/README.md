# Fractal user guides — authoring scaffold

Structure, conventions and templates for the Fractal user guides. The same
Markdown source renders both as the standalone docs site (Zensical) and as
in-app contextual help in Fractal web, so every page is written to stand on its
own — a reader arriving mid-page from a `?` icon should not be lost.

## Layout

```
snippets/             Canonical concept summaries (2–4 sentences). Single source
                      of truth. OUTSIDE docs/ so Zensical does not turn them into
                      pages (it would also warn about unreferenced files).
docs/concepts/        EXPLANATION pages — what a thing is and why, with
                      progressive disclosure. One per concept.
docs/reference/       REFERENCE pages — what each element of a Fractal web page
                      does. One per main UI page. This is the element that is
                      linked to from Fractal web help buttons.
docs/assets/          Screenshots and images.
_templates/           Authoring templates. Copy them; do not edit in place. Also
                      outside docs/ so they are never built.
```

The split mirrors two of the four Diátaxis modes: **explanation** (`concepts/`)
and **reference** (`reference/`). How-to guides and tutorials come later and get
their own top-level folders (`docs/how-to/`, `docs/tutorials/`).

## The box-plus-link convention

A reference page shows a short, styled summary of the relevant concept and links
to the full explanation. The summary is **transcluded** from the snippet, so it
can never drift from the concept page. Copy this block onto any page that touches
the concept — only the snippet path and the two labels change:

```markdown
!!! info "What is a dataset?"

    --8<-- "datasets.md"

    [Learn more about datasets →](../concepts/datasets.md)
```

The same snippet is used as the opening paragraph of the matching explanation
page.

## Adding a new concept (three steps)

1. Copy `_templates/snippet.md` → `snippets/<slug>.md` and write
   the 2–4 sentence summary. This is the only place the wording lives.
2. Copy `_templates/concept-page.md` → `docs/concepts/<slug>.md`. It already
   `--8<--`-includes the snippet as its lede; add the depth below it.
3. On each reference page that touches the concept, paste the box block above,
   pointing at `concepts/<slug>.md`.

## Screenshots

- Crop tight to the relevant control; full-window shots rot on any restyle.
- Always write real alt text (accessibility, and it documents intent when the
  image drifts).
- Future: Consider generating them from Fractal web's test suite
  (e.g. Playwright) so they regenerate on release instead of being recaptured
  by hand.

## Build config

Build with strict mode in CI so broken internal links and missing snippets fail
the build:

```bash
zensical build --strict
```
