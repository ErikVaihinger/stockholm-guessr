// Host screen: runs the game, shown on the TV.
//
// Everything that happens is a message in a log. The host applies its own
// messages immediately, sends them to the room, and receives the teams'
// messages from the room. State is always rebuilt from the log, so a
// reload (or a manual guess while offline) never loses anything.
(function () {
  const { CFG, TEAM_COLORS, store, uid, randomCode, publish, subscribe, fmtDist, esc } = GQ;
  const $ = (id) => document.getElementById(id);
  const ROUNDS = CFG.rounds;

  let code = store("gq_host_code");
  if (!code) {
    code = randomCode();
    store("gq_host_code", code);
  }
  const logKey = () => "gq_host_log_" + code;
  let log = store(logKey()) || [];
  const seen = new Set(log.map((m) => m.uid));
  let showFinal = false;
  let es = null;

  // ---------- state ----------
  function derive() {
    const teams = [];
    const byId = {};
    const rounds = {};
    let current = null;
    const addTeam = (id, name) => {
      if (!byId[id]) {
        byId[id] = { id, name, color: TEAM_COLORS[teams.length % TEAM_COLORS.length], idx: teams.length };
        teams.push(byId[id]);
      } else if (name) {
        byId[id].name = name;
      }
    };
    for (const m of log) {
      if (m.t === "join") addTeam(m.teamId, m.name);
      else if (m.t === "start") {
        rounds[m.round] = { endsAt: m.endsAt, guesses: {}, revealed: false };
        current = m.round;
      } else if (m.t === "guess") {
        const r = rounds[m.round];
        if (!r || r.revealed) continue;
        addTeam(m.teamId, m.name);
        r.guesses[m.teamId] = { teamId: m.teamId, lat: m.lat, lng: m.lng };
      } else if (m.t === "reveal") {
        if (rounds[m.round]) rounds[m.round].revealed = true;
      }
    }
    // score revealed rounds
    const totals = {};
    teams.forEach((t) => (totals[t.id] = 0));
    for (const n of Object.keys(rounds)) {
      const r = rounds[n];
      if (!r.revealed) continue;
      r.results = resultsFor(Number(n), r, teams);
      r.results.forEach((x) => (totals[x.teamId] += x.points));
    }
    return { teams, byId, rounds, current, totals };
  }

  function resultsFor(n, r, teams) {
    const cfg = ROUNDS[n - 1];
    const scored = GQ.scoreRound(cfg, Object.values(r.guesses));
    const guessed = new Set(scored.map((s) => s.teamId));
    const missing = teams
      .filter((t) => !guessed.has(t.id))
      .map((t) => ({ teamId: t.id, dist: null, rank: null, points: 0 }));
    return scored.concat(missing);
  }

  // ---------- messaging ----------
  function apply(m) {
    if (seen.has(m.uid)) return;
    seen.add(m.uid);
    log.push(m);
    store(logKey(), log);
    render();
  }

  async function send(m) {
    m.uid = uid();
    apply(m);
    try {
      await publish(code, m);
      hideBanner();
    } catch (e) {
      showBanner("Couldn't reach the sync service (" + e.message + "). The game still works on this screen; teams' laptops may not update. Use \"Enter a guess by hand\" if needed.");
    }
  }

  function connect() {
    if (es) es.close();
    es = subscribe(code, apply, (s) => {
      const el = $("status");
      el.className = "status " + s;
      el.textContent = s === "online" ? "live" : "reconnecting…";
    });
  }

  function showBanner(t) { $("banner").textContent = t; $("banner").classList.remove("hidden"); }
  function hideBanner() { $("banner").classList.add("hidden"); }

  // ---------- actions ----------
  function startRound(n) {
    showFinal = false;
    send({ t: "start", round: n, endsAt: Date.now() + CFG.roundSeconds * 1000 });
  }

  function reveal() {
    const s = derive();
    const n = s.current;
    if (!n) return;
    // compute results for the message so team laptops can show them
    const r = s.rounds[n];
    const results = resultsFor(n, r, s.teams).map((x) => {
      const g = r.guesses[x.teamId];
      return { ...x, name: s.byId[x.teamId].name, color: s.byId[x.teamId].color, lat: g ? g.lat : null, lng: g ? g.lng : null };
    });
    const totals = { ...s.totals };
    results.forEach((x) => (totals[x.teamId] = (totals[x.teamId] || 0) + x.points));
    const cfg = ROUNDS[n - 1];
    send({ t: "reveal", round: n, answer: { lat: cfg.lat, lng: cfg.lng, label: cfg.answer || "" }, results, totals });
  }

  function next() {
    const s = derive();
    if (s.current >= ROUNDS.length) {
      showFinal = true;
      render();
    } else {
      startRound(s.current + 1);
    }
  }

  function newGame() {
    if (!confirm("Start a new game? Scores are cleared and teams need the new room code.")) return;
    store(logKey(), null);
    code = randomCode();
    store("gq_host_code", code);
    log = [];
    seen.clear();
    showFinal = false;
    lastRevealDrawn = null;
    connect();
    render();
  }

  // ---------- rendering ----------
  function show(id) {
    for (const s of ["lobby", "round", "reveal", "final"]) $(s).classList.toggle("hidden", s !== id);
  }

  function teamRow(t, right, extraClass) {
    return '<div class="team-row ' + (extraClass || "") + '"><span class="chip" style="--c:' + t.color + '"></span><span class="name">' + esc(t.name) + "</span>" + right + "</div>";
  }

  function totalsRows(s) {
    const sorted = s.teams.slice().sort((a, b) => s.totals[b.id] - s.totals[a.id]);
    const top = sorted.length ? s.totals[sorted[0].id] : 0;
    return sorted
      .map((t) => teamRow(t, '<span class="pts">' + s.totals[t.id] + "</span>", s.totals[t.id] === top && top > 0 ? "first" : ""))
      .join("") || '<div class="muted">No teams yet.</div>';
  }

  function render() {
    const s = derive();
    $("roomCode").textContent = code;
    const url = new URL("team.html?room=" + code, location.href).href;
    $("joinUrl").textContent = url.replace(/^https?:\/\//, "");
    $("overlayTeams").innerHTML = totalsRows(s);

    if (showFinal) return renderFinal(s);
    if (!s.current) return renderLobby(s);
    const r = s.rounds[s.current];
    if (r.revealed) return renderReveal(s, s.current);
    renderRound(s, s.current);
  }

  function renderLobby(s) {
    show("lobby");
    $("lobbyTeams").innerHTML = s.teams.map((t) => teamRow(t, "")).join("");
    $("lobbyEmpty").classList.toggle("hidden", s.teams.length > 0);
    $("roundCount").textContent = ROUNDS.length + " rounds · " + CFG.roundSeconds + " s each";
  }

  let roundEndsAt = 0;
  function renderRound(s, n) {
    show("round");
    const cfg = ROUNDS[n - 1];
    const img = $("roundPhoto");
    if (img.getAttribute("src") !== cfg.photo) img.src = cfg.photo;
    $("roundNo").textContent = n + " of " + ROUNDS.length;
    roundEndsAt = s.rounds[n].endsAt;
    tick();
    const r = s.rounds[n];
    $("roundTeams").innerHTML =
      s.teams
        .map((t) => (r.guesses[t.id] ? teamRow(t, '<span class="meta ok">locked in ✓</span>') : teamRow(t, '<span class="meta">thinking…</span>')))
        .join("") || '<div class="muted">No teams joined.</div>';
  }

  function tick() {
    const el = $("timer");
    if ($("round").classList.contains("hidden")) return;
    const left = Math.ceil((roundEndsAt - Date.now()) / 1000);
    if (left > 0) {
      el.textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
      el.className = "timer" + (left <= 10 ? " low" : "");
    } else {
      el.textContent = "Time's up!";
      el.className = "timer up";
    }
  }
  setInterval(tick, 250);

  // reveal map
  let map = null;
  let layer = null;
  let lastRevealDrawn = null;
  function renderReveal(s, n) {
    show("reveal");
    const cfg = ROUNDS[n - 1];
    const r = s.rounds[n];
    $("revealRoundLabel").textContent = "Round " + n + " of " + ROUNDS.length;
    $("revealAnswer").textContent = cfg.answer || "Here it is";
    if ($("revealThumb").getAttribute("src") !== cfg.photo) $("revealThumb").src = cfg.photo;

    $("revealResults").innerHTML = r.results
      .map((x) => {
        const t = s.byId[x.teamId];
        return teamRow(
          t,
          '<span class="meta">' + fmtDist(x.dist) + '</span><span class="plus">+' + x.points + "</span>",
          "result-row"
        ).replace('<span class="chip"', '<span class="rank">' + (x.rank || "–") + '</span><span class="chip"');
      })
      .join("");
    $("revealTotals").innerHTML = totalsRows(s);
    $("btnNext").textContent = n >= ROUNDS.length ? "Show final scores" : "Next round";

    if (!map) map = GQ.makeMap($("revealMap"), "labels");
    map.invalidateSize();
    const drawKey = n + ":" + JSON.stringify(r.guesses);
    if (lastRevealDrawn === drawKey) return;
    lastRevealDrawn = drawKey;
    if (layer) layer.remove();
    layer = L.layerGroup().addTo(map);
    const goal = [cfg.lat, cfg.lng];
    const pts = [goal];
    r.results.forEach((x) => {
      const g = r.guesses[x.teamId];
      if (!g) return;
      const t = s.byId[x.teamId];
      const p = [g.lat, g.lng];
      pts.push(p);
      L.polyline([p, goal], { color: t.color, weight: 4, dashArray: "8 8", opacity: 0.9 }).addTo(layer);
      L.marker(p, { icon: GQ.pinIcon(t.color, t.name.slice(0, 1).toUpperCase()) })
        .bindTooltip(esc(t.name) + " · " + fmtDist(x.dist), { permanent: true, direction: "top", offset: [0, -40], className: "dist" })
        .addTo(layer);
    });
    L.marker(goal, { icon: GQ.goalIcon(), zIndexOffset: 1000 }).addTo(layer);
    setTimeout(() => {
      map.invalidateSize();
      if (pts.length > 1) map.fitBounds(pts, { padding: [70, 70], maxZoom: 16 });
      else map.setView(goal, 15);
    }, 50);
  }

  function renderFinal(s) {
    show("final");
    const sorted = s.teams.slice().sort((a, b) => s.totals[b.id] - s.totals[a.id]);
    const top = sorted.length ? s.totals[sorted[0].id] : 0;
    const winners = sorted.filter((t) => s.totals[t.id] === top);
    $("winnerLine").textContent = winners.length
      ? (winners.length > 1 ? "It's a tie: " : "") + winners.map((t) => t.name).join(" & ") + (winners.length > 1 ? "" : " wins!")
      : "No teams played";
    $("finalTeams").innerHTML = sorted
      .map((t, i) => teamRow(t, '<span class="pts">' + s.totals[t.id] + "</span>", s.totals[t.id] === top ? "first" : ""))
      .join("");
  }

  // ---------- manual guess ----------
  function openManual() {
    const s = derive();
    const sel = $("manualTeam");
    sel.innerHTML =
      s.teams.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.name) + "</option>").join("") +
      '<option value="__new">+ New team…</option>';
    $("manualNewName").classList.toggle("hidden", s.teams.length > 0);
    $("manualCoords").value = "";
    $("manualErr").textContent = "";
    $("manualOverlay").classList.remove("hidden");
    $("manualCoords").focus();
  }

  function saveManual() {
    const s = derive();
    const m = $("manualCoords").value.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);
    if (!m) return ($("manualErr").textContent = "Type it like 59.33012, 18.06581");
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return ($("manualErr").textContent = "Those coordinates don't look right.");
    let teamId = $("manualTeam").value;
    let name;
    if (teamId === "__new" || !teamId) {
      name = $("manualNewName").value.trim();
      if (!name) return ($("manualErr").textContent = "Give the team a name.");
      teamId = "manual-" + uid();
      send({ t: "join", teamId, name });
    } else {
      name = s.byId[teamId].name;
    }
    send({ t: "guess", round: s.current, teamId, name, lat, lng });
    $("manualOverlay").classList.add("hidden");
  }

  // ---------- wiring ----------
  $("btnStartFirst").onclick = () => startRound(1);
  $("btnReveal").onclick = () => {
    const s = derive();
    const missing = s.teams.filter((t) => !s.rounds[s.current].guesses[t.id]).length;
    if (missing && !confirm(missing + (missing === 1 ? " team hasn't" : " teams haven't") + " locked in yet. Reveal anyway?")) return;
    reveal();
  };
  $("btnNext").onclick = next;
  $("btnBackFromFinal").onclick = () => { showFinal = false; render(); };
  $("btnNewGame").onclick = newGame;
  $("btnScores").onclick = () => $("scoresOverlay").classList.remove("hidden");
  $("btnManual").onclick = openManual;
  $("manualSave").onclick = saveManual;
  $("manualTeam").onchange = (e) => $("manualNewName").classList.toggle("hidden", e.target.value !== "__new");
  document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => b.closest(".overlay").classList.add("hidden")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".overlay").forEach((o) => o.classList.add("hidden"));
  });

  connect();
  render();
})();
