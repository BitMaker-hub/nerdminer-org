# Nerd* Mining Ecosystem — Community Landing Page

> **Status: community contribution proposal.**
> This repository is an open draft of a unified landing page that introduces
> the Nerd* family of open-source Bitcoin mining devices. It is **not** an
> official site of any single project — it is a starting point put forward
> for the community to shape together. Feedback, forks and pull requests
> are very welcome.

A static landing page that showcases the evolution and diversity of the
Nerd* Bitcoin mining ecosystem: from the original ESP32 educational miner
to multi-ASIC builds with double-digit terahash, all of them open source —
firmware, schematics and PCB layouts.

## Why this exists

The Nerd* ecosystem has grown fast: new variants, new ASICs, new forks, new
contributors. Information lives scattered across many repos, social posts
and chat groups, which makes it hard for newcomers to understand what each
device is, how they relate to each other, and where to start.

This site is an attempt to gather that map in one place, so that:

- Newcomers can see at a glance which device fits their interest or budget.
- Makers and resellers can share a single URL when explaining the ecosystem.
- The community has a neutral, open-source canvas it can keep extending.

## Featured devices

The site currently lists, ordered roughly by complexity and hashrate:

- **NerdMiner v2** — the original. ESP32-S3 microcontroller doing SHA-256
  solo mining with a full-color display. Educational and absurdly low
  power. 23+ supported boards.
- **NerdNOS** — the bridge between NerdMiner and full ASIC mining. BM1397
  chip in a USB-C desktop form factor.
- **NerdAxe** — single BM1370 ASIC (Antminer S21 Pro generation), compact
  and efficient.
- **NerdQaxe** — 4× BM1370, dual-fan cooling, spring-mounted heatsink.
- **NerdQX** — 4× BM1370 redesigned: per-ASIC temperature sensors,
  increased copper ratio, XT60 connector, AIO liquid cooling support.
- **NerdOctaxe** — 8× BM1370, 6-phase buck converter, dual Thermalright
  heatsinks. Open PCB for custom cooling. Expert build.
- **NerdEKO Gamma** — 12× BM1370 on a 6-layer / 2 oz copper PCB. Currently
  the most powerful board in the family.

For each device the site links to its source repository, hardware revisions
and the communities behind it.

## Two ways to contribute

This README is the first place to make it explicit that the invitation to
contribute is **not just about the website**. It runs at two levels.

### 1. Contribute to this landing page

The site itself is open and welcomes:

- **Issues** when a device is missing, miscredited, mis-specced, or its
  links are stale.
- **Pull requests** that add a new device card, fix a link, polish copy,
  or improve UX (especially on mobile).
- **Translations** — the current copy is in English; we'd love community
  ports.
- **Design / accessibility tweaks** — anything that makes the ecosystem
  easier to navigate for newcomers.

### 2. Contribute by building new hardware in the Nerd* philosophy

This is the bigger invitation, and it's the one that makes the family grow.
Every Nerd* device is fully open source:

- Firmware: `BitMaker-hub/NerdMiner_v2` for the no-ASIC educational miner,
  and `shufps/ESP-Miner-NerdQAxePlus` (NerdOS) as the shared firmware base
  for the ASIC family.
- Hardware: schematics and KiCad PCB layouts published per device under
  `BitMaker-hub` and other community accounts.

That means **anyone with hardware skills can fork the firmware, modify the
open-source PCB, and ship a new compatible device** — a different ASIC
count, a different cooling strategy, a new form factor, a classroom kit, a
plug-and-play desktop unit, whatever the community can dream up.

If you build something new in this spirit, **open an issue or PR here** and
we'll add a card for it on the site, with a link back to your repo. That is
exactly the kind of contribution this proposal is set up to receive.

A good submission for a new device card includes:

- Public repo with firmware fork (or pointer to NerdOS) and KiCad sources.
- A short description (one or two sentences).
- ASIC type and count (or "no ASIC, ESP32"), expected hashrate, power.
- An image or rendering of the board.
- Lead developer / maintainer contact.

## Tech stack

Plain HTML, CSS and vanilla JavaScript with SVG animations. No build step,
no framework, no tracking. Anything modern enough to render an SVG can run
it.

## Run it locally

The site is fully static — pick whichever you prefer.

**Python (no install needed if you have Python)**

    cd NerdminerOrg
    python -m http.server 8080

Then open <http://localhost:8080>.

**Node (with live reload)**

    npx serve .
    # or, with auto-refresh on save:
    npx live-server

**VS Code**

Install the *Live Server* extension, then right-click `index.html` →
*Open with Live Server*.

## Project layout

    index.html          Main landing page
    Imagenes/           Device photos and graphics
    animationProject/   SVG / animation source assets
    README.md           This file

## Credits

Built on the shoulders of the Bitaxe project and the open-source ASIC
knowledge it brought to the community, and with respect for every maker
who has poured time into the Nerd* family. Each individual device project
remains owned by its respective authors and communities — this repository
only links to and describes them.

## License

No formal license file has been added yet. The intent is to keep the site's
contents (HTML/CSS/JS/copy) open and permissive so the community can reuse
and adapt them. A `LICENSE` file will be added as the proposal stabilizes.
Each linked device project is licensed independently — refer to each
project's own repository for its license.
