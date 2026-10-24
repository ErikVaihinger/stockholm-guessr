# Stockholm Guessr

A one-photo GeoGuessr for quiz night. The TV shows a photo, every team drops a pin on a map without street names on their own laptop, and the closest team wins the round.

- `host.html`: the game screen for the TV laptop
- `team.html`: one per team laptop
- `pick.html`: for you, to get coordinates and check your answers
- `config.js`: the only file you edit (rounds, timer, points)
- `photos/`: your photos go here

There's no backend to run. Guesses travel between laptops through [ntfy.sh](https://ntfy.sh), a free message relay that needs no account.

---

## 1. Put it on GitHub Pages

1. Go to <https://github.com/new>, name the repo `stockholm-guessr`, set it to **Public**, and click **Create repository**.
2. On the empty repo page, click **uploading an existing file**. Open the `stockholm-guessr` folder on your computer, select everything inside it (not the folder itself) and drag it into the browser. Click **Commit changes**.
   - Using git instead: `git init`, `git add .`, `git commit -m "quiz"`, then the `git remote add` and `git push` lines GitHub shows you.
3. In the repo, go to **Settings → Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**. Click **Save**.
4. Wait 1 to 2 minutes and reload the Settings page. The site address appears at the top, for example `https://YOURNAME.github.io/stockholm-guessr/`.

After every change you push, GitHub needs about a minute to update the site. If you still see the old version, hard-refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac).

## 2. Add your photos and locations

1. Name your photos `1.jpg`, `2.jpg`, `3.jpg` and so on, in the order you want to play them.
2. In the repo, open the `photos` folder, click **Add file → Upload files**, drop them in and commit. Files with the same name replace the placeholders.
3. Get each photo's exact location. Open `pick.html` on your site and click the spot. It gives you a ready line to paste. (Google Maps also works: right-click the spot and click the numbers at the top of the menu.)
4. Open `config.js` in the repo, click the pencil icon, and edit the `rounds` list. One line per photo:
   ```js
   { photo: "photos/1.jpg", lat: 59.32750, lng: 18.05430, answer: "Stockholm City Hall" },
   ```
   The `answer` text is shown on the TV when the round is revealed. Add or remove lines to change the number of rounds. Commit.
5. Open `pick.html` again. The numbered stars show where your answers are, and clicking one shows its photo. This is the quickest way to catch a swapped or wrong coordinate.

About the photos:

- **iPhone photos are often HEIC, which most browsers can't display.** Convert them to JPG first (on a Mac: open in Preview, then File → Export → JPEG).
- Large photos load slowly. About 2000 px wide is plenty.
- The repo is public, so anyone with the link can see the photos. Phone photos also often store GPS location inside the file. If that matters for a photo, turn off location before sharing it (iPhone share sheet → Options → Location off).
- Use photos you took yourselves, so nobody can reverse image search them.

## 3. Test it before the night (10 minutes)

Do this once the photos and coordinates are in. This is the step that proves the live sync works on your wifi.

1. On your laptop, open `host.html`. The dot at the top should say **live**.
2. On a second device (or a private/incognito window), open the team link shown on the host screen, enter a team name and join. The team should appear on the host screen within a second or two.
3. Start round 1, drop a pin, lock it in, reveal. Check that the distance and points make sense and that the answer star sits on the right spot.
4. Click **New game** on the host so the real game starts clean.

Each browser holds one team. To test two teams on one computer, use a normal window and a private window, not two normal tabs.

## 4. Running the game

1. Connect the TV laptop, open `host.html` and go full screen (F11, or Ctrl+Cmd+F on Mac).
2. Each team opens the link shown on the TV, picks a name and enters the 4-letter room code.
3. When all teams are listed, click **Start round 1**.
4. Teams click the map to drop a pin. They can drag it or click elsewhere to move it, then **Lock in guess**. When the timer runs out, a pin that's on the map gets sent automatically.
5. The timer is only a guide. You decide when to click **Reveal answer**. The TV then shows every pin, the lines to the real spot, the distances and the points.
6. **Next round** until the end, then **Show final scores**.

**Scores** (top right) shows the standings at any time. **New game** clears everything and makes a new room code.

## If something goes wrong

- **The host laptop reloads or the browser closes:** open `host.html` again. The game continues where it was.
- **A team laptop reloads:** it reconnects to the same team and round on its own.
- **A team laptop can't connect at all:** under their map they see their pin's coordinates. They read them out, and you click **Enter a guess by hand** on the host screen. This also works for a team without a laptop.
- **The host dot says "reconnecting" for a long time:** the wifi or ntfy.sh is down. The host screen keeps working. Teams read out their coordinates and you enter them by hand.

## Settings in `config.js`

| Setting | Default | What it does |
|---|---|---|
| `roundSeconds` | `90` | Timer per round |
| `points` | `[3, 2, 1]` | Points for closest, second, third |
| `mapStyle` | `"nolabels"` | `"satellite"` switches to aerial photos (also without labels) |
| `mapStart` | central Stockholm, zoom 12 | Where the map starts each round |
| `minZoom` / `maxZoom` | `9` / `18` | How far teams can zoom out and in |
| `topicPrefix` | random word | Keeps your game's messages separate from other ntfy.sh users |

The answers sit in `config.js`, so someone who opens the browser's developer tools on a team laptop could find them. For a quiz among friends that's an honour-system thing.

Map data © OpenStreetMap contributors, map tiles © CARTO, built with Leaflet.
