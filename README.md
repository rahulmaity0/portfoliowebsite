# Portfolio website

My personal site. Plain HTML, CSS and a bit of JavaScript — no framework and no
build step, so you can open `index.html` in a browser and it just works.

The live version is built from the files in the root of this repo.

## Running it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## What's in here

```
index.html    the page
styles.css    colours, type and layout
main.js       theme toggle, nav highlighting, the hero animation
alt-pine/     an earlier light-themed version I kept around
```

The hero canvas draws order events moving from a producer, through a Kafka
topic, into three partitions. It loops every 12 seconds off the system clock,
and renders a single static frame for anyone who has reduced motion turned on.
The numbers to change are `PERIOD`, `TRAVEL`, `SPACING` and `LANES` near the top
of that section in `main.js`.

## Adding a project

Copy one of the `<li class="card">` blocks in the work section and change five
things: the label, the heading, the paragraph, the pipeline stages and the tech
list. The first card has `card-lead` on it for the bigger heading.

## Colours

Everything is a CSS custom property at the top of `styles.css`. Dark is the
default; light is defined twice — once under `prefers-color-scheme: light` and
once under `[data-theme="light"]` — so the toggle works in both directions.
Change a colour in all three places or you'll only fix one theme.

## Deploying

Vercel, with the framework preset set to Other and no build command. GitHub
Pages and Netlify work the same way since there's nothing to compile.
