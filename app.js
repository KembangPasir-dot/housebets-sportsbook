/* Housebets Sportsbook prototype — app logic.
   Front end only. Sample data only. Singles only. No real money. */
(function () {
  'use strict';
  var D = window.HB_DATA;
  var LS_SLIP = 'hb_slip_v1', LS_BETS = 'hb_mybets_v1', LS_FOLLOW = 'hb_follow_v1', LS_SEED = 'hb_seeded_v1';
  var MAX_STAKE = 1000; // USDT per single

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return Number(n).toFixed(2); }
  function fmtOdds(n) { return Number(n).toFixed(2); }

  /* ---------- storage ---------- */
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function getSlip() { return load(LS_SLIP, []); }
  function getBets() { return load(LS_BETS, []); }
  function getFollow() {
    var v = load(LS_FOLLOW, null);
    if (!v) { v = { comps: ['epl'], teams: ['ARS'] }; save(LS_FOLLOW, v); }
    return v;
  }

  /* ---------- data helpers ---------- */
  function team(code) { return D.TEAMS[code] || { short: code, name: code, color: '#33506b', dark: false }; }
  function comp(id) { var c = D.COMPS.filter(function (x) { return x.id === id; })[0]; return c || { id: id, name: id, country: '', sport: 'Soccer' }; }
  function match(id) { return D.MATCHES.filter(function (m) { return m.id === id; })[0]; }
  function liveMatches() { return D.MATCHES.filter(function (m) { return m.status === 'live'; }); }
  function upcomingMatches() { return D.MATCHES.filter(function (m) { return m.status === 'upcoming'; }); }
  function teamName(m, side) {
    if (m.tennis || m.basketball) return side === 'home' ? m.homeName : m.awayName;
    var t = team(side === 'home' ? m.home : m.away); return t.name;
  }
  function teamShort(m, side) {
    if (m.tennis || m.basketball) return side === 'home' ? m.home : m.away;
    return side === 'home' ? m.home : m.away;
  }
  function crest(code, size) {
    var t = team(code);
    var color = t.dark ? '#0b1a26' : '#fff';
    return '<span class="crest" style="background:' + t.color + ';color:' + color + '"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size / 3.2) + 'px;background:' + t.color + ';color:' + color + '"' : '') + '>' + esc(code) + '</span>';
  }
  function genericMarkets(m) {
    var h = teamName(m, 'home'), a = teamName(m, 'away');
    var mk = [{ name: 'Match result', outcomes: [[h, m.odds[0]], ['Draw', m.odds[1]], [a, m.odds[2]]] }];
    if (m.tennis || m.basketball) {
      mk = [{ name: m.tennis ? 'Match winner' : 'Match winner', outcomes: [[h, m.odds[0]], [a, m.odds[1]]] }];
      return mk;
    }
    mk.push({ name: 'Both teams to score', outcomes: [['Yes', 1.85], ['No', 1.95]] });
    mk.push({ name: 'Total goals — Over / Under 2.5', outcomes: [['Over 2.5', 1.95], ['Under 2.5', 1.85]] });
    return mk;
  }
  function matchGroups(m) {
    if (D.MATCH_MARKETS[m.id]) return D.MATCH_MARKETS[m.id];
    return [{ group: 'Popular', markets: genericMarkets(m) }];
  }

  /* ---------- suspended markets (runtime) ---------- */
  var suspended = {}; // key: matchId + '|' + marketName
  function isSuspended(matchId, marketName) {
    if (suspended[matchId + '|' + marketName]) return true;
    var groups = matchGroups(match(matchId) || {});
    return groups.some(function (g) { return g.suspended && g.markets.some(function (mk) { return mk.name === marketName; }); });
  }
  function suspendMarket(matchId, marketName) {
    suspended[matchId + '|' + marketName] = true;
    $$('.odds-btn[data-match="' + matchId + '"]').forEach(function (b) {
      if (b.getAttribute('data-market') === marketName) { b.disabled = true; }
    });
    $$('.market[data-match="' + matchId + '"][data-market="' + marketName + '"]').forEach(function (el) {
      el.classList.add('suspended');
      var head = $('.market-head', el);
      if (head && !$('.susp-tag', head)) { head.insertAdjacentHTML('beforeend', '<span class="susp-tag">SUSPENDED</span>'); }
    });
    var slip = getSlip(), changed = false;
    slip.forEach(function (s) { if (s.matchId === matchId && s.market === marketName && !s.suspended) { s.suspended = true; changed = true; } });
    if (changed) { save(LS_SLIP, slip); renderSlipEverywhere(); }
    toast('Market suspended: ' + marketName);
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ---------- icons (inline SVG, drawn for this prototype) ---------- */
  var IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
    live: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none"/>',
    soccer: '<circle cx="12" cy="12" r="9"/><path d="M12 7l3 2.2-1.2 3.6h-3.6L9 9.2z"/><path d="M12 7V3.5M15 9.2l3.6 1M10.8 12.8L9 16.5M13.2 12.8L15 16.5"/>',
    tennis: '<circle cx="12" cy="12" r="9"/><path d="M5.5 6.5c3 2.5 3 8.5 0 11M18.5 6.5c-3 2.5-3 8.5 0 11"/>',
    basketball: '<circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3.5c-3 4-3 13 0 17M12 3.5c3 4 3 13 0 17"/>',
    baseball: '<circle cx="12" cy="12" r="9"/><path d="M6 5.5c2.5 2 2.5 4 0 6M6 12.5c2.5 2 2.5 4 0 6M18 5.5c-2.5 2-2.5 4 0 6M18 12.5c-2.5 2-2.5 4 0 6"/>',
    football: '<ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(-30 12 12)"/><path d="M9.5 10.5l5 3M10.8 9.2l.8 1.6M13.2 13.2l.8 1.6"/>',
    esports: '<rect x="3" y="8" width="18" height="9" rx="4.5"/><path d="M8 11v3M6.5 12.5h3M15 11.5h.01M17 13.5h.01"/>',
    casino: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 5H4a3 3 0 003 4M17 5h3a3 3 0 01-3 4M12 14v4M8 21h8M10 18h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 15h2"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'
  };
  function icon(name, size) {
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (IC[name] || '') + '</svg>';
  }
  function logoSVG() {
    return '<svg width="30" height="30" viewBox="0 0 32 32" fill="none"><path d="M2 12 C7 6 12 6 16 11 C20 16 25 16 30 10" stroke="#7deee0" stroke-width="2.2" stroke-linecap="round" opacity=".5"/><path d="M2 18 C7 12 12 12 16 17 C20 22 25 22 30 16" stroke="#2fd6c3" stroke-width="2.6" stroke-linecap="round"/><path d="M2 24 C7 18 12 18 16 23 C20 28 25 28 30 22" stroke="#1fae9e" stroke-width="2.6" stroke-linecap="round" opacity=".65"/></svg>';
  }

  /* ---------- shell ---------- */
  function renderShell(active) {
    var tb = $('#topbar');
    if (tb) {
      tb.innerHTML =
        '<a class="logo" href="index.html">' + logoSVG() + '<span class="wordmark"><span class="word">House<b>bets</b></span><span class="word-sub">Sportsbook</span></span></a>' +
        '<div class="prize-chip"><span class="trophy">' + icon('trophy', 17) + '</span><span>Weekly Prize<b>$50,000.00</b></span></div>' +
        '<div class="spacer"></div>' +
        '<button class="icon-btn" id="top-search-btn" title="Search" aria-label="Search">' + icon('search', 18) + '</button>' +
        '<button class="icon-btn" id="top-bets-btn" title="My bets" aria-label="My bets">' + icon('wallet', 18) + '</button>' +
        '<button class="btn btn-dark" data-demo-auth><span>Log In</span></button>' +
        '<button class="btn btn-light" data-demo-auth><span>Register</span></button>';
      var sb = $('#top-search-btn');
      if (sb) sb.addEventListener('click', function () { var i = $('#global-search'); if (i) { i.focus(); i.scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
      var bb = $('#top-bets-btn');
      if (bb) bb.addEventListener('click', function () { location.href = 'slip.html'; });
    }
    var rail = $('#rail');
    if (rail) {
      var items = [
        ['index.html', 'home', 'Home', 'home'],
        ['live.html', 'live', 'Live', 'live'],
        ['football.html', 'football', 'Football', 'soccer'],
        ['football.html', 'football', 'Tennis', 'tennis'],
        ['football.html', 'football', 'Basketball', 'basketball'],
        ['live.html', 'live', 'Esports', 'esports']
      ];
      rail.innerHTML = items.map(function (it) {
        return '<a href="' + it[0] + '" class="' + (active === it[1] ? 'active' : '') + '" title="' + it[2] + '">' + icon(it[3], 20) + '</a>';
      }).join('') + '<div class="rail-sep"></div>' +
        '<a href="slip.html" class="' + (active === 'slip' ? 'active' : '') + '" title="Bet slip & My bets">' + icon('wallet', 20) + '</a>';
    }
    renderSide();
    renderBottomBar();
    $$('[data-demo-auth]').forEach(function (b) {
      b.addEventListener('click', function () { toast('Prototype demo — accounts are not part of this prototype.'); });
    });
  }

  /* ---------- odds buttons ---------- */
  function oddsBtn(m, marketName, pick, odds) {
    var key = m.id + '|' + marketName + '|' + pick;
    var slip = getSlip();
    var inSlip = slip.some(function (s) { return s.key === key; });
    var susp = isSuspended(m.id, marketName);
    return '<button class="odds-btn' + (inSlip ? ' in-slip' : '') + '" data-key="' + esc(key) + '" data-match="' + esc(m.id) + '" data-market="' + esc(marketName) + '" data-pick="' + esc(pick) + '" data-odds="' + odds + '"' + (susp ? ' disabled' : '') + '>' +
      '<span class="pick">' + esc(pick) + '</span><span class="val">' + fmtOdds(odds) + '</span></button>';
  }
  function oddsGroup(m, outcomes, marketName) {
    var cls = outcomes.length === 2 ? 'odds2' : 'odds3';
    return '<div class="' + cls + '">' + outcomes.map(function (o) { return oddsBtn(m, marketName, o[0], o[1]); }).join('') + '</div>';
  }

  /* ---------- slip ---------- */
  function slipKey(matchId, market, pick) { return matchId + '|' + market + '|' + pick; }
  function toggleSlip(matchId, market, pick, odds) {
    var m = match(matchId); if (!m) return;
    if (isSuspended(matchId, market)) { toast('That market is suspended.'); return; }
    var slip = getSlip();
    var key = slipKey(matchId, market, pick);
    var i = -1; slip.forEach(function (s, idx) { if (s.key === key) i = idx; });
    if (i >= 0) { slip.splice(i, 1); toast('Removed from bet slip.'); }
    else {
      slip.push({ key: key, matchId: matchId, matchLabel: teamName(m, 'home') + ' v ' + teamName(m, 'away'), market: market, pick: pick, odds: Number(odds), stake: '', changedFrom: null, suspended: false });
      toast('Added to bet slip — singles only.');
    }
    save(LS_SLIP, slip);
    refreshOddsButtons(); renderSlipEverywhere();
  }
  function slipTotals(slip) {
    var stake = 0, ret = 0, n = slip.length;
    slip.forEach(function (s) { var st = parseFloat(s.stake); if (!isNaN(st) && st > 0) { stake += st; ret += st * s.odds; } });
    return { n: n, stake: stake, ret: ret };
  }
  function slipRowHTML(s, compact) {
    var ret = '';
    var st = parseFloat(s.stake);
    if (!isNaN(st) && st > 0) ret = money(st * s.odds);
    var h = '<div class="slip-row" data-key="' + esc(s.key) + '">' +
      '<button class="slip-remove" data-remove="' + esc(s.key) + '" title="Remove">×</button>' +
      '<div class="s-match">' + esc(s.matchLabel) + '</div>' +
      '<div class="s-pick">' + esc(s.pick) + ' <span class="s-odds">@ ' + fmtOdds(s.odds) + '</span></div>' +
      '<div class="s-market">' + esc(s.market) + '</div>';
    if (s.suspended) {
      h += '<div class="slip-suspended">Suspended — this selection cannot be placed right now.</div>';
    } else if (s.changedFrom != null) {
      h += '<div class="odds-changed"><span>Odds changed: ' + fmtOdds(s.changedFrom) + ' → <b>' + fmtOdds(s.odds) + '</b></span><button data-accept="' + esc(s.key) + '">Accept new odds</button></div>';
    }
    h += '<div class="slip-stake"><span class="cur">USDT</span><input type="number" min="0" step="0.01" inputmode="decimal" placeholder="Stake" value="' + esc(s.stake === '' ? '' : s.stake) + '" data-stake="' + esc(s.key) + '" aria-label="Stake in USDT"' + (s.suspended ? ' disabled' : '') + '></div>' +
      '<div class="slip-return"><span>Potential return</span><b>' + (ret === '' ? '—' : 'USDT ' + ret) + '</b></div></div>';
    return h;
  }
  function renderSlipInto(el, opts) {
    if (!el) return;
    var slip = getSlip();
    if (!slip.length) {
      el.innerHTML = '<div class="slip-empty"><span class="big">🎫</span>Your bet slip is empty.<br>Tap any odds to add a single.</div>';
      return;
    }
    var t = slipTotals(slip);
    var anyChanged = slip.some(function (s) { return s.changedFrom != null; });
    var h = slip.map(function (s) { return slipRowHTML(s, opts && opts.compact); }).join('');
    h += '<div class="slip-foot"><div class="slip-total"><span>Selections</span><b>' + t.n + ' single' + (t.n > 1 ? 's' : '') + '</b></div>' +
      '<div class="slip-total"><span>Total stake</span><b>USDT ' + money(t.stake) + '</b></div>' +
      '<div class="slip-total"><span>Potential return</span><b>USDT ' + money(t.ret) + '</b></div>' +
      (anyChanged ? '<div class="slip-note">Odds changed on a selection — accept the new odds before placing your bet.</div>' : '') +
      '<button class="btn btn-cyan btn-block place-bets-btn"' + (anyChanged ? ' disabled' : '') + '>Place bet' + (t.n > 1 ? 's' : '') + '</button>' +
      '<div class="slip-note">Singles only. No multis, no boosts, no free bets. Stakes in USDT, max USDT ' + MAX_STAKE.toLocaleString() + ' per single. Sample data — no real money.</div></div>';
    el.innerHTML = h;
  }
  function renderSide() {
    var side = $('#side'); if (!side) return;
    var page = document.body.getAttribute('data-page');
    var h = '<div class="side-head"><span>Bet slip</span><a href="slip.html">View slip →</a></div><div id="side-slip"></div>';
    if (page === 'slip') {
      h += '<div class="side-head" style="border-top:1px solid var(--line)"><span>Top competitions</span></div>' +
        '<div style="padding:4px 16px 16px">' + D.COMPS.filter(function (c) { return c.sport === 'Soccer'; }).map(function (c) {
          return '<a href="football.html#' + c.id + '" style="display:block;padding:8px 0;border-bottom:1px solid var(--line);font-weight:600">' + esc(c.name) + ' <span style="color:var(--muted);font-weight:400">· ' + esc(c.country) + '</span></a>';
        }).join('') + '</div>' +
        '<div class="card-pad" style="margin:0 16px 16px"><b>How singles work</b><div class="hint">Each pick is its own bet. Stake × odds = your return. If the odds move before you place, you accept the new price first — never silently.</div></div>';
    } else {
      h += '<div class="side-head" style="border-top:1px solid var(--line)"><span>Top competitions</span></div>' +
        '<div style="padding:4px 16px 16px">' + D.COMPS.filter(function (c) { return c.sport === 'Soccer'; }).map(function (c) {
          return '<a href="football.html#' + c.id + '" style="display:block;padding:8px 0;border-bottom:1px solid var(--line);font-weight:600">' + esc(c.name) + ' <span style="color:var(--muted);font-weight:400">· ' + esc(c.country) + '</span></a>';
        }).join('') + '</div>';
    }
    side.innerHTML = h;
    renderSlipInto($('#side-slip'), { compact: true });
  }
  function renderBottomBar() {
    var bar = $('#bottombar'); if (!bar) return;
    var slip = getSlip(), t = slipTotals(slip);
    if (!slip.length) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
    bar.style.display = '';
    bar.innerHTML = '<div class="bb-info"><b>Bet slip · ' + t.n + ' single' + (t.n > 1 ? 's' : '') + '</b><span>Total stake USDT ' + money(t.stake) + ' · Return USDT ' + money(t.ret) + '</span></div>' +
      '<a class="btn btn-cyan" href="slip.html">View slip</a>';
  }
  function renderSlipEverywhere() {
    renderSlipInto($('#side-slip'), { compact: true });
    renderSlipInto($('#slip-list'));
    renderBottomBar();
    $$('.place-bets-btn').forEach(function (pb) { pb.addEventListener('click', placeBets); });
  }
  function refreshOddsButtons() {
    var slip = getSlip();
    $$('.odds-btn').forEach(function (b) {
      var inSlip = slip.some(function (s) { return s.key === b.getAttribute('data-key'); });
      b.classList.toggle('in-slip', inSlip);
    });
  }

  /* ---------- place bets ---------- */
  function placeBets() {
    var slip = getSlip();
    if (!slip.length) { toast('Your slip is empty.'); return; }
    if (slip.some(function (s) { return s.changedFrom != null; })) { toast('Accept the new odds first.'); return; }
    var bets = getBets();
    var placed = [], failed = [];
    slip.forEach(function (s) {
      var st = parseFloat(s.stake);
      if (s.suspended || isSuspended(s.matchId, s.market)) { failed.push({ s: s, reason: 'Selection suspended — bet not placed.' }); return; }
      if (isNaN(st) || st <= 0) { failed.push({ s: s, reason: 'Enter a stake above USDT 0.' }); return; }
      if (st > MAX_STAKE) { failed.push({ s: s, reason: 'Stake exceeds the USDT ' + MAX_STAKE.toLocaleString() + ' single limit.' }); return; }
      bets.unshift({ id: 'b' + Date.now() + Math.floor(Math.random() * 1000), matchLabel: s.matchLabel, market: s.market, pick: s.pick, odds: s.odds, stake: st, placedAt: new Date().toISOString(), status: 'open' });
      placed.push(s);
    });
    save(LS_BETS, bets);
    var remaining = slip.filter(function (s) { return failed.some(function (f) { return f.s.key === s.key; }); });
    save(LS_SLIP, remaining);
    var res = $('#place-result');
    if (res) {
      var cls = placed.length && failed.length ? 'mixed' : (failed.length ? 'bad' : 'ok');
      var h = '';
      if (placed.length) h += '<b>Bet placed — ' + placed.length + ' single' + (placed.length > 1 ? 's' : '') + ' open.</b> See My bets below.';
      if (failed.length) h += (h ? '<br>' : '') + '<b>Bet failed — ' + failed.length + ':</b><br>' + failed.map(function (f) { return '• ' + esc(f.s.pick) + ' (' + esc(f.s.matchLabel) + ') — ' + esc(f.reason); }).join('<br>');
      res.className = 'place-result ' + cls; res.innerHTML = h; res.style.display = 'block';
      res.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    renderSlipEverywhere(); renderMyBets('open');
    toast(placed.length ? placed.length + ' bet' + (placed.length > 1 ? 's' : '') + ' placed.' : 'No bets placed.');
  }

  /* ---------- my bets ---------- */
  function seedBets() {
    if (load(LS_SEED, false)) return;
    var bets = getBets();
    bets.push(
      { id: 'seed1', matchLabel: 'Arsenal v Chelsea', market: 'Match result', pick: 'Arsenal', odds: 1.85, stake: 20, placedAt: '2026-11-10T18:02:00Z', status: 'won', ret: 37.00 },
      { id: 'seed2', matchLabel: 'Liverpool v Newcastle', market: 'Match result', pick: 'Draw', odds: 4.20, stake: 10, placedAt: '2026-11-09T15:40:00Z', status: 'lost', ret: 0 }
    );
    save(LS_BETS, bets); save(LS_SEED, true);
  }
  function cashoutValue(b) {
    var m = matchByLabel(b.matchLabel);
    var cur = m ? currentOdds(m) : b.odds;
    var v = b.stake * (cur / b.odds) * 0.9;
    return Math.max(b.stake * 0.1, Math.min(v, b.stake * 5));
  }
  function matchByLabel(label) {
    var parts = label.split(' v ');
    return D.MATCHES.filter(function (m) { return teamName(m, 'home') === parts[0] && teamName(m, 'away') === parts[1]; })[0];
  }
  function currentOdds(m) {
    var key = m.id + '|Match result|' + teamName(m, 'home');
    var btn = $('.odds-btn[data-key="' + key.replace(/"/g, '') + '"]');
    return btn ? parseFloat(btn.getAttribute('data-odds')) : m.odds[0];
  }
  function statusPill(b) {
    if (b.status === 'open') return '<span class="status-pill status-open">OPEN</span>';
    if (b.status === 'won') return '<span class="status-pill status-won">WON</span>';
    if (b.status === 'lost') return '<span class="status-pill status-lost">LOST</span>';
    return '<span class="status-pill status-cashed">CASHED OUT</span>';
  }
  function renderMyBets(tab) {
    var el = $('#mybets-list'); if (!el) return;
    var bets = getBets();
    var list = bets.filter(function (b) { return tab === 'open' ? b.status === 'open' : b.status !== 'open'; });
    $$('#mybets-tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
    if (!list.length) {
      el.innerHTML = '<div class="empty-state"><span class="big">' + (tab === 'open' ? '🎫' : '🏁') + '</span><b>No ' + (tab === 'open' ? 'open' : 'settled') + ' bets yet.</b>' + (tab === 'open' ? 'Place a single from any odds button and it will show here.' : 'Settled and cashed-out bets will show here.') + '</div>';
      return;
    }
    el.innerHTML = list.map(function (b) {
      var h = '<div class="bet-card" data-bet="' + b.id + '"><div class="b-top"><span>' + esc(b.matchLabel) + ' · ' + esc(b.market) + '</span>' + statusPill(b) + '</div>' +
        '<div class="b-pick">' + esc(b.pick) + ' <span style="color:var(--cyan)">@ ' + fmtOdds(b.odds) + '</span></div>' +
        '<div class="b-meta">Placed ' + new Date(b.placedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</div>' +
        '<div class="b-amounts"><span>Stake<b>USDT ' + money(b.stake) + '</b></span><span>Potential return<b>USDT ' + money(b.stake * b.odds) + '</b></span>' +
        (b.status === 'won' ? '<span>Return<b>USDT ' + money(b.ret || 0) + '</b></span>' : '') +
        (b.status === 'cashed' ? '<span>Cashed out<b>USDT ' + money(b.ret || 0) + '</b></span>' : '') + '</div>';
      if (b.status === 'open') {
        var co = cashoutValue(b);
        h += '<div class="b-actions"><button class="btn btn-ghost" data-cashout="' + b.id + '">Cash out</button><span class="hint" style="margin:0">Cash out value updates with live odds.</span></div>' +
          '<div class="cashout-box" id="co-' + b.id + '" style="display:none"><span>Cash out now for <b>USDT ' + money(co) + '</b>?</span><button class="btn btn-cyan" data-cashout-confirm="' + b.id + '">Yes, cash out</button><button class="btn btn-ghost" data-cashout-cancel="' + b.id + '">Cancel</button></div>';
      }
      return h + '</div>';
    }).join('');
  }
  function cashOut(betId) {
    var bets = getBets();
    var b = bets.filter(function (x) { return x.id === betId; })[0];
    if (!b || b.status !== 'open') return;
    b.status = 'cashed'; b.ret = Number(money(cashoutValue(b)));
    save(LS_BETS, bets);
    renderMyBets('open');
    toast('Cashed out for USDT ' + money(b.ret) + '.');
  }

  /* ---------- follow ---------- */
  function toggleFollow(kind, id, btn) {
    var f = getFollow();
    var arr = f[kind];
    var i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
    save(LS_FOLLOW, f);
    if (btn) btn.classList.toggle('on', i < 0);
    renderFavChips();
  }
  function renderFavChips() {
    var el = $('#fav-chips'); if (!el) return;
    var f = getFollow();
    var chips = [];
    f.comps.forEach(function (c) { chips.push('<span class="fav-chip"><span class="star">★</span>' + esc(comp(c).name) + '<button class="x" data-unfollow-comp="' + esc(c) + '" title="Unfollow">×</button></span>'); });
    f.teams.forEach(function (t) { chips.push('<span class="fav-chip">' + crest(t) + esc(team(t).name) + '<button class="x" data-unfollow-team="' + esc(t) + '" title="Unfollow">×</button></span>'); });
    el.innerHTML = chips.length ? chips.join('') : '<span class="hint">Follow a competition or team — it will show up here.</span>';
  }

  /* ---------- search ---------- */
  function initSearch() {
    var input = $('#global-search'); if (!input) return;
    var box = $('#search-results'); if (!box) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { box.classList.remove('open'); box.innerHTML = ''; return; }
      var teamHits = [], compHits = [], playerHits = [], marketHits = [];
      Object.keys(D.TEAMS).forEach(function (k) { var t = D.TEAMS[k]; if (t.name.toLowerCase().indexOf(q) >= 0) teamHits.push(k); });
      D.COMPS.forEach(function (c) { if (c.name.toLowerCase().indexOf(q) >= 0) compHits.push(c); });
      D.PLAYERS.forEach(function (p) { if (p.toLowerCase().indexOf(q) >= 0) playerHits.push(p); });
      ['Match result', 'Both teams to score', 'Total goals', 'Anytime goalscorer', 'Asian handicap'].forEach(function (mk) { if (mk.toLowerCase().indexOf(q) >= 0) marketHits.push(mk); });
      var h = '';
      if (teamHits.length) h += '<div class="sr-group">Teams</div>' + teamHits.slice(0, 4).map(function (k) { return '<a class="sr" href="football.html">' + crest(k) + esc(D.TEAMS[k].name) + '<small>Football</small></a>'; }).join('');
      if (compHits.length) h += '<div class="sr-group">Competitions</div>' + compHits.map(function (c) { return '<a class="sr" href="football.html#' + c.id + '">' + icon('trophy', 16) + esc(c.name) + '<small>' + esc(c.country) + '</small></a>'; }).join('');
      if (playerHits.length) h += '<div class="sr-group">Players</div>' + playerHits.slice(0, 4).map(function (p) { return '<a class="sr" href="match.html?id=ars-bha">' + icon('user', 16) + esc(p) + '<small>Goalscorer market</small></a>'; }).join('');
      if (marketHits.length) h += '<div class="sr-group">Markets</div>' + marketHits.map(function (mk) { return '<a class="sr" href="match.html?id=ars-bha">' + icon('search', 16) + esc(mk) + '<small>Arsenal v Brighton</small></a>'; }).join('');
      if (!h) h = '<div class="sr-group">No results</div><a class="sr" href="football.html">Try “Arsenal”, “Premier League” or “Saka”.</a>';
      box.innerHTML = h; box.classList.add('open');
    });
    input.addEventListener('blur', function () { setTimeout(function () { box.classList.remove('open'); }, 200); });
    input.addEventListener('focus', function () { if (input.value.trim().length >= 2) box.classList.add('open'); });
  }

  /* ---------- odds drift (live prices move) ---------- */
  function driftTick() {
    var live = liveMatches().filter(function (m) { return !m.tennis && !m.basketball; });
    if (!live.length) return;
    var m = live[Math.floor(Math.random() * live.length)];
    var idx = Math.floor(Math.random() * 3);
    var delta = (Math.random() < 0.5 ? -1 : 1) * (0.01 + Math.random() * 0.04);
    var oldV = m.odds[idx], newV = Math.max(1.01, Math.round((oldV + delta) * 100) / 100);
    if (newV === oldV) return;
    m.odds[idx] = newV;
    var labels = [teamName(m, 'home'), 'Draw', teamName(m, 'away')];
    updateOddsButton(m.id, 'Match result', labels[idx], oldV, newV);
  }
  function updateOddsButton(matchId, market, pick, oldV, newV) {
    var key = slipKey(matchId, market, pick);
    $$('.odds-btn[data-key="' + CSS.escape(key) + '"]').forEach(function (b) {
      b.setAttribute('data-odds', String(newV));
      var val = $('.val', b); if (val) val.textContent = fmtOdds(newV);
      b.classList.remove('flash-up', 'flash-down'); void b.offsetWidth;
      b.classList.add(newV > oldV ? 'flash-up' : 'flash-down');
    });
    var slip = getSlip(), changed = false;
    slip.forEach(function (s) {
      if (s.key === key) {
        if (s.changedFrom == null) s.changedFrom = s.odds;
        s.odds = newV; changed = true;
      }
    });
    if (changed) { save(LS_SLIP, slip); renderSlipEverywhere(); toast('Odds changed on a slip selection — accept the new odds to place.'); }
  }

  /* ---------- clock tick ---------- */
  function clockTick() {
    liveMatches().forEach(function (m) {
      if (typeof m.minute === 'number' && m.minute < 90) m.minute += 1;
    });
    $$('[data-clock]').forEach(function (el) {
      var m = match(el.getAttribute('data-clock'));
      if (m && typeof m.minute === 'number') el.textContent = m.minute + '’';
    });
  }

  /* ---------- page renderers ---------- */
  function matchRowHTML(m, opts) {
    var c = comp(m.comp);
    var timeHtml;
    if (m.status === 'live') {
      timeHtml = '<span class="live-badge">LIVE</span><br><span class="clock" data-clock="' + m.id + '">' + (typeof m.minute === 'number' ? m.minute + '’' : esc(String(m.minute))) + '</span>';
    } else {
      timeHtml = esc(m.time || '') + '<br>' + esc(m.date || '');
    }
    var score = m.status === 'live'
      ? '<div class="match-score"><span>' + esc(String(m.scoreH)) + '</span><span>' + esc(String(m.scoreA)) + '</span></div>'
      : '<div class="match-score"><span></span><span></span></div>';
    var oddsHtml;
    if (m.tennis || m.basketball) {
      oddsHtml = '<div class="odds2">' + oddsBtn(m, 'Match winner', teamName(m, 'home'), m.odds[0]) + oddsBtn(m, 'Match winner', teamName(m, 'away'), m.odds[1]) + '</div>';
    } else {
      oddsHtml = '<div class="odds3">' + oddsBtn(m, 'Match result', teamName(m, 'home'), m.odds[0]) + oddsBtn(m, 'Match result', 'Draw', m.odds[1]) + oddsBtn(m, 'Match result', teamName(m, 'away'), m.odds[2]) + '</div>';
    }
    var f = getFollow();
    var followed = f.teams.indexOf(m.home) >= 0 || f.teams.indexOf(m.away) >= 0;
    return '<div class="match-row" data-goto="match.html?id=' + m.id + '">' +
      '<div class="match-time">' + timeHtml + '</div>' +
      '<div><div class="team-line">' + crest(m.home) + esc(teamName(m, 'home')) + (followed ? ' <span style="color:var(--amber)">★</span>' : '') + '</div>' +
      '<div class="team-line">' + crest(m.away) + esc(teamName(m, 'away')) + '</div></div>' +
      score + oddsHtml +
      '<div class="more">+' + (m.more || 0) + ' ›</div></div>';
  }
  function featCardHTML(m) {
    var c = comp(m.comp);
    var when = m.status === 'live'
      ? '<span><span class="live-badge" style="background:var(--red);color:#fff;font-weight:800;font-size:10.5px;padding:2px 7px;border-radius:5px">LIVE</span> <span class="clock" data-clock="' + m.id + '">' + (typeof m.minute === 'number' ? m.minute + '’' : esc(String(m.minute))) + '</span></span>'
      : '<span>' + esc(m.date || '') + ' · ' + esc(m.time || '') + '</span>';
    var oddsHtml;
    if (m.tennis || m.basketball) {
      oddsHtml = '<div class="odds2">' + oddsBtn(m, 'Match winner', teamName(m, 'home'), m.odds[0]) + oddsBtn(m, 'Match winner', teamName(m, 'away'), m.odds[1]) + '</div>';
    } else {
      oddsHtml = '<div class="odds3">' + oddsBtn(m, 'Match result', teamName(m, 'home'), m.odds[0]) + oddsBtn(m, 'Match result', 'Draw', m.odds[1]) + oddsBtn(m, 'Match result', teamName(m, 'away'), m.odds[2]) + '</div>';
    }
    return '<div class="feat-card" data-goto="match.html?id=' + m.id + '">' +
      '<div class="feat-top"><span>' + esc(c.name) + '</span>' + when + '</div>' +
      '<div class="feat-team"><span>' + crest(m.home) + ' ' + esc(teamName(m, 'home')) + '</span><span class="sc">' + (m.status === 'live' ? esc(String(m.scoreH)) : '') + '</span></div>' +
      '<div class="feat-team"><span>' + crest(m.away) + ' ' + esc(teamName(m, 'away')) + '</span><span class="sc">' + (m.status === 'live' ? esc(String(m.scoreA)) : '') + '</span></div>' +
      '<div class="feat-odds">' + oddsHtml + '</div></div>';
  }

  function renderHome() {
    var live = liveMatches(), up = upcomingMatches();
    var el = $('#home-content'); if (!el) return;
    var h = '<h2 class="sec">Live now <small>' + live.length + ' matches in play</small><a class="link" href="live.html">All live →</a></h2>' +
      '<div class="card"><div class="match-list-head"><span></span><span>Match</span><span></span><span class="odds-h">Match result</span><span></span></div>' +
      live.filter(function (m) { return !m.tennis && !m.basketball; }).slice(0, 4).map(function (m) { return matchRowHTML(m); }).join('') + '</div>' +
      '<h2 class="sec">Featured matches</h2><div class="feat-row">' +
      [match('ars-bha'), match('liv-mun'), match('rma-bay'), match('mci-tot')].map(featCardHTML).join('') + '</div>' +
      '<h2 class="sec">Starting soon <small>Today &amp; this weekend</small></h2>' +
      '<div class="card"><div class="match-list-head"><span></span><span>Match</span><span></span><span class="odds-h">Match result</span><span></span></div>' +
      up.slice(0, 5).map(function (m) { return matchRowHTML(m); }).join('') + '</div>' +
      '<h2 class="sec">Top competitions</h2><div class="card">' +
      D.COMPS.filter(function (c) { return c.sport === 'Soccer'; }).map(function (c) {
        var n = D.MATCHES.filter(function (m) { return m.comp === c.id; }).length;
        return '<a href="football.html#' + c.id + '" style="display:flex;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--line);font-weight:700"><span>' + esc(c.name) + ' <span style="color:var(--muted);font-weight:400">· ' + esc(c.country) + '</span></span><span style="color:var(--muted)"> ' + n + ' matches ›</span></a>';
      }).join('') + '</div>';
    el.innerHTML = h;
    renderFavChips();
  }

  function renderLive() {
    var el = $('#live-content'); if (!el) return;
    var sport = ($('#f-sport') || {}).value || 'All';
    var compId = ($('#f-comp') || {}).value || 'All';
    var live = liveMatches().filter(function (m) {
      return (sport === 'All' || m.sport === sport) && (compId === 'All' || m.comp === compId);
    });
    var h = '';
    if (!live.length) {
      h = '<div class="empty-state"><span class="big">⏱️</span><b>Nothing live here right now.</b>Showing starting soon instead.</div>' +
        '<h2 class="sec">Starting soon</h2><div class="card"><div class="match-list-head"><span></span><span>Match</span><span></span><span class="odds-h">Match result</span><span></span></div>' +
        upcomingMatches().filter(function (m) { return (sport === 'All' || m.sport === sport) && (compId === 'All' || m.comp === compId); }).slice(0, 6).map(function (m) { return matchRowHTML(m); }).join('') + '</div>';
    } else {
      h = '<div class="card"><div class="match-list-head"><span></span><span>Match</span><span></span><span class="odds-h">Match result</span><span></span></div>' +
        live.map(function (m) { return matchRowHTML(m); }).join('') + '</div>';
    }
    el.innerHTML = h;
  }

  function renderFootball() {
    var el = $('#football-content'); if (!el) return;
    var f = getFollow();
    var hash = (location.hash || '').replace('#', '');
    var order = ['epl', 'ucl', 'laliga', 'seriea', 'bundes'];
    if (hash && order.indexOf(hash) >= 0) order = [hash].concat(order.filter(function (x) { return x !== hash; }));
    el.innerHTML = order.map(function (cid) {
      var c = comp(cid);
      var ms = D.MATCHES.filter(function (m) { return m.comp === cid; });
      if (!ms.length) return '';
      var followed = f.comps.indexOf(cid) >= 0;
      return '<div class="comp-block"><div class="card"><div class="comp-head"><span>' + esc(c.name) + '</span><span class="country">' + esc(c.country) + '</span>' +
        '<button class="follow-btn' + (followed ? ' on' : '') + '" data-follow-comp="' + cid + '" title="Follow competition">★</button></div>' +
        '<div class="match-list-head"><span></span><span>Match</span><span></span><span class="odds-h">Match result</span><span></span></div>' +
        ms.map(function (m) { return matchRowHTML(m); }).join('') + '</div></div>';
    }).join('');
  }

  function renderMatch(id) {
    var m = match(id) || match('ars-bha');
    var el = $('#match-content'); if (!el) return;
    var c = comp(m.comp);
    var groups = matchGroups(m);
    var h = '<a class="back-link" href="football.html">← Football</a>' +
      '<div class="card scoreboard"><div class="comp">' + esc(c.name) + ' · ' + esc(c.country) + '</div>' +
      '<div class="clock-row">' + (m.status === 'live' ? '<span class="clock" data-clock="' + m.id + '">' + (typeof m.minute === 'number' ? m.minute + '’' : esc(String(m.minute))) + '</span><span style="color:var(--red);font-weight:800;font-size:12px">● LIVE</span>' : '<span style="color:var(--muted);font-weight:700">' + esc(m.date || '') + ' · ' + esc(m.time || '') + '</span>') + '</div>' +
      '<div class="sb-teams"><div class="sb-team">' + crest(m.home, 44) + esc(teamName(m, 'home')) + '</div>' +
      '<div class="sb-score">' + (m.status === 'live' ? esc(String(m.scoreH)) + ' <small>–</small> ' + esc(String(m.scoreA)) : '–') + '</div>' +
      '<div class="sb-team">' + crest(m.away, 44) + esc(teamName(m, 'away')) + '</div></div>' +
      '<div class="sb-note">' + (m.status === 'live' ? 'Live scores update as the match plays. Odds move in real time.' : 'Match has not started. Odds shown are pre-match.') + '</div></div>' +
      '<div class="group-tabs">' + groups.map(function (x, i) {
        return '<button data-group="' + esc(x.group) + '" class="' + (i === 0 ? 'active' : '') + '">' + esc(x.group) + (x.suspended ? ' ⏸' : '') + '</button>';
      }).join('') + '</div>';
    h += groups.map(function (grp) {
      var head = '<h3 class="group-head" id="group-' + esc(grp.group.replace(/\s+/g, '-')) + '">' + esc(grp.group) + (grp.suspended ? ' <span class="susp-tag">SUSPENDED</span>' : '') + '</h3>';
      return head + grp.markets.map(function (mk) {
        var susp = !!grp.suspended || isSuspended(m.id, mk.name);
        var body = '<div class="market-body' + (mk.outcomes.length === 2 ? ' two' : '') + '">' + mk.outcomes.map(function (o) { return oddsBtn(m, mk.name, o[0], o[1]); }).join('') + '</div>';
        return '<div class="market' + (susp ? ' suspended' : '') + '" data-match="' + esc(m.id) + '" data-market="' + esc(mk.name) + '">' +
          '<div class="market-head">' + esc(mk.name) + (susp ? '<span class="susp-tag">SUSPENDED</span>' : '') + '</div>' + body +
          (susp ? '<div class="susp-note">This market is suspended — no bets can be placed on it right now.</div>' : '') + '</div>';
      }).join('');
    }).join('');
    h += '<div class="demo-strip"><b>How to try the states:</b> tap any odds to add it to your slip · odds drift live and a changed price must be accepted before placing · the Corners &amp; cards group is suspended · place a bet with a stake over USDT 1,000 to see a failed bet.</div>';
    el.innerHTML = h;
    $$('#match-content [data-group]').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#match-content [data-group]').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var t = $('#group-' + b.getAttribute('data-group').replace(/\s+/g, '-'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- init ---------- */
  function init(page) {
    seedBets();
    renderShell(page);
    initSearch();
    document.addEventListener('click', function (e) {
      var ob = e.target.closest('.odds-btn');
      if (ob && !ob.disabled) {
        e.stopPropagation();
        toggleSlip(ob.getAttribute('data-match'), ob.getAttribute('data-market'), ob.getAttribute('data-pick'), ob.getAttribute('data-odds'));
        return;
      }
      var rm = e.target.closest('[data-remove]');
      if (rm) {
        var slip = getSlip().filter(function (s) { return s.key !== rm.getAttribute('data-remove'); });
        save(LS_SLIP, slip); refreshOddsButtons(); renderSlipEverywhere(); return;
      }
      var ac = e.target.closest('[data-accept]');
      if (ac) {
        var s2 = getSlip();
        s2.forEach(function (s) { if (s.key === ac.getAttribute('data-accept')) s.changedFrom = null; });
        save(LS_SLIP, s2); renderSlipEverywhere(); toast('New odds accepted.'); return;
      }
      var fc = e.target.closest('[data-follow-comp]');
      if (fc) { toggleFollow('comps', fc.getAttribute('data-follow-comp'), fc); return; }
      var uc = e.target.closest('[data-unfollow-comp]');
      if (uc) { toggleFollow('comps', uc.getAttribute('data-unfollow-comp')); renderFootball(); return; }
      var ut = e.target.closest('[data-unfollow-team]');
      if (ut) { toggleFollow('teams', ut.getAttribute('data-unfollow-team')); return; }
      var co = e.target.closest('[data-cashout]');
      if (co) { var box = $('#co-' + co.getAttribute('data-cashout')); if (box) box.style.display = 'flex'; return; }
      var coc = e.target.closest('[data-cashout-confirm]');
      if (coc) { cashOut(coc.getAttribute('data-cashout-confirm')); return; }
      var cox = e.target.closest('[data-cashout-cancel]');
      if (cox) { var box2 = $('#co-' + cox.getAttribute('data-cashout-cancel')); if (box2) box2.style.display = 'none'; return; }
      var go = e.target.closest('[data-goto]');
      if (go && !e.target.closest('.odds-btn')) { location.href = go.getAttribute('data-goto'); return; }
    });
    document.addEventListener('input', function (e) {
      var st = e.target.closest('[data-stake]');
      if (st) {
        var slip = getSlip();
        slip.forEach(function (s) { if (s.key === st.getAttribute('data-stake')) s.stake = st.value; });
        save(LS_SLIP, slip);
        var row = st.closest('.slip-row');
        if (row) {
          var s = slip.filter(function (x) { return x.key === st.getAttribute('data-stake'); })[0];
          var v = parseFloat(st.value);
          var rb = $('.slip-return b', row);
          if (rb) rb.textContent = (!isNaN(v) && v > 0 && s) ? 'USDT ' + money(v * s.odds) : '—';
        }
        renderBottomBar();
        var t = slipTotals(slip);
        $$('.slip-foot .slip-total b').forEach(function (b, i) {
          if (i === 1) b.textContent = 'USDT ' + money(t.stake);
          if (i === 2) b.textContent = 'USDT ' + money(t.ret);
        });
      }
    });
    document.addEventListener('change', function (e) {
      if (e.target.id === 'f-sport' || e.target.id === 'f-comp') renderLive();
    });
    setInterval(driftTick, 6000);
    setInterval(clockTick, 45000);
    /* A market suspends mid-session (live product behaviour): after 30s the
       Total goals market on Liverpool v Man Utd suspends. */
    setTimeout(function () { suspendMarket('liv-mun', 'Total goals — Over / Under 2.5'); }, 30000);
    renderSlipEverywhere();
    /* debug / verification hook */
    window.HB = { getSlip: getSlip, getBets: getBets, suspendMarket: suspendMarket, toggleSlip: toggleSlip, placeBets: placeBets, cashOut: cashOut, MAX_STAKE: MAX_STAKE,
      forceOdds: function (matchId, market, pick, newOdds) {
        var btn = $('.odds-btn[data-key="' + CSS.escape(slipKey(matchId, market, pick)) + '"]');
        var oldV = btn ? parseFloat(btn.getAttribute('data-odds')) : NaN;
        if (isNaN(oldV)) return false;
        updateOddsButton(matchId, market, pick, oldV, newOdds);
        return true;
      } };
  }

  window.HB_APP = { init: init, renderHome: renderHome, renderLive: renderLive, renderFootball: renderFootball, renderMatch: renderMatch, renderMyBets: renderMyBets, renderFavChips: renderFavChips };
})();
