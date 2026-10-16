# play

A single-page website showing why children learn more through play and games than through memorizing textbooks or listening passively.

**Live:** https://alandasyla.github.io/play/

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

## Adding your own domain later

Once you own a domain (for example `example.com`), the site can live at `play.example.com`:

1. At your domain's DNS provider, add a `CNAME` record named `play` with the value `alandasyla.github.io`.
2. On GitHub, open the repo's **Settings → Pages**, enter `play.example.com` under **Custom domain** and click **Save**. GitHub adds a `CNAME` file to the repo, so run `git pull` before your next push.
3. When the DNS check passes (anywhere from a few minutes to a few hours), tick **Enforce HTTPS**.
4. Recommended: verify the domain under your GitHub profile's **Settings → Pages** so nobody else can use it with GitHub Pages.

After that, the old `alandasyla.github.io/play/` address redirects to the new domain.
