# Housebets Sportsbook — clickable prototype

Entry for the Housebets Contest Labs design contest **“Housebets Sportsbook is coming”**
(https://www.housebets.com/contests/sportsbook-design).

A clickable, front-end-only sportsbook prototype: 5 pages, singles only.

## The five pages

1. **Sports home** (`index.html`) — Live now, Starting soon, Top competitions, sports nav, search (teams, players, competitions, markets), Favourites.
2. **Live** (`live.html`) — every match in play, filter by sport and competition, live score and clock. A filter with nothing live shows Starting soon.
3. **Football** (`football.html`) — Premier League, Champions League, LaLiga, Serie A, Bundesliga; match-result odds on each row; follow a team or competition.
4. **Match page** (`match.html?id=ars-bha`) — Arsenal v Brighton, live. Scoreboard (score, clock), market groups: Popular, Goals, Halves, Handicaps, Goalscorers, Corners & cards. Odds move live; the Corners & cards group is suspended.
5. **Bet slip + My bets** (`slip.html`) — tap odds to add to the slip. Singles only, decimal odds, stakes in USDT, stake × odds = potential return. Odds changed → accept the new price before placing. Suspended selections cannot be placed. Bet placed and bet failed states. My bets: open, settled, cash out.

The shell (top bar, left nav, side panel) and the dark navy + cyan look follow the contest's own desktop wireframe.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8137
# → http://localhost:8137/
```

## Notes

- **Sample data only** — no real players, no real money, no real bets. Odds are illustrative.
- **Out of scope, deliberately not built:** multis, accumulators, bet builder; boosts, free bets, promos; outrights, specials; stats widgets, match trackers; AI search.
- Vanilla HTML, CSS and JavaScript. Bet slip and My bets persist in `localStorage`.
- The contest's official starter files / brand pack sit behind a Housebets account sign-in, so this prototype was built to the published wireframe instead; the wordmark is plain text and the wave mark is a hand-drawn SVG.
