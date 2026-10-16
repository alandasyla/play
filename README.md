# play

A single-page website showing why children learn more through play and games than through memorizing textbooks or listening passively.

**Live:** https://play.alanda.ch (also reachable at https://alandasyla.github.io/play/, which redirects there)

The site uses the ideas it describes. Visitors learn the research by playing with it:

- **Toy box:** a hero area with toys you can drag and throw (simple physics).
- **Textbook mode:** a switch in the header that turns the whole page grey, serif and dull, and locks the games.
- **Flip a lesson:** cards that turn a textbook exercise into a playful one.
- **Myth or Fact?:** a quiz built on real studies (retrieval practice in action).
- **The Number Race:** the 1–10 board game from Ramani & Siegler (2008), with an optional read-aloud voice.
- **Playful-o-meter:** rates activities against the five characteristics of playful learning (Zosh et al., 2017).
- **Play spectrum slider:** from free play to direct instruction (Zosh et al., 2018).
- **Research cards** with DOI links, playful ideas by age group, and an FAQ.

It's a static site: plain HTML, CSS and JavaScript with no build step. The only external resource is Google Fonts (Fredoka and Nunito); system fonts are used if they don't load.

## Files

```
index.html      page content
css/styles.css  all styles, including Textbook mode and the responsive layout
js/main.js      toy physics, games, tabs, meter, spectrum, Textbook mode
favicon.svg
.nojekyll       tells GitHub Pages to serve the files as they are
```

## Preview locally

Open `index.html` in a browser.

## Updating the live site

The site is hosted on GitHub Pages from the `main` branch of https://github.com/alandasyla/play. Edit the files, then commit and push to `main`. GitHub republishes automatically, usually within a minute.

## Custom domain

The site uses **play.alanda.ch**. The domain is registered at ALL-INKL.COM, and the setup has two parts:

- **GitHub:** the `CNAME` file in this repo contains `play.alanda.ch`. Don't delete it, or the site falls back to the github.io address.
- **ALL-INKL (KAS → Tools → DNS-Einstellungen → alanda.ch):** a DNS record with Name `play`, Type `CNAME`, Prio `0`, and Data `alandasyla.github.io.` (the trailing dot is required at ALL-INKL).

Once DNS is active, tick **Enforce HTTPS** under the repo's **Settings → Pages**. The old `alandasyla.github.io/play/` address redirects to the new domain.
