# play

A single-page website showing why children learn more through play and games than through memorizing textbooks or listening passively. It's meant to live at a `play.` subdomain, such as `play.yourdomain.com`.

The site uses the ideas it describes. Visitors learn the research by playing with it:

- **Toy box:** a hero area with toys you can drag and throw (simple physics).
- **Textbook mode:** a switch in the header that turns the whole page grey, serif and dull, and locks the games.
- **Flip a lesson:** cards that turn a textbook exercise into a playful one.
- **Myth or Fact?:** a quiz built on real studies (retrieval practice in action).
- **The Number Race:** the 1–10 board game from Ramani & Siegler (2008), with an optional read-aloud voice.
- **Playful-o-meter:** rates activities against the five characteristics of playful learning (Zosh et al., 2017).
- **Play spectrum slider:** from free play to direct instruction (Zosh et al., 2018).
- **Research cards** with DOI links, playful ideas by age group, and an FAQ.

It's plain HTML, CSS and JavaScript with no build step. The only external resource is Google Fonts (Fredoka and Nunito); system fonts are used if they don't load.

## Files

```
index.html      page content
css/styles.css  all styles, including Textbook mode and the responsive layout
js/main.js      toy physics, games, tabs, meter, spectrum, Textbook mode
favicon.svg
```

## Preview locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Put it on the `play` subdomain

1. Upload the folder contents to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, or your own server).
2. In your domain's DNS, add a `CNAME` record named `play` that points to your host's address. For example:
   - Netlify: `your-site.netlify.app`
   - GitHub Pages: `your-user.github.io`
   - Vercel: `cname.vercel-dns.com`
3. Add `play.yourdomain.com` as a custom domain in your host's settings. On GitHub Pages, also add a file called `CNAME` containing `play.yourdomain.com`.
4. Turn on HTTPS (most hosts do this automatically).

For shared hosting with cPanel, create the subdomain `play` and upload the files to its document root.
