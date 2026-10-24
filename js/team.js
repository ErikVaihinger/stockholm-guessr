// Team page: one per laptop. Shows the photo, lets the team drop a pin,
// sends the guess to the host and shows the result after the reveal.
(function () {
  const { CFG, TEAM_COLORS, store, uid, publish, subscribe, fmtDist, esc } = GQ;
  const $ = (id) => document.getElementById(id);
  const ROUNDS = CFG.rounds;

  let me = store("gq_team") || {};
  let log = [];
  let es = null;
  let map = null;
  let pin = null;       // the team's own marker
  let revealLayer = null;
  let shownRound = null; // round currently drawn on the map
  let shownReveal = null;
  const autoTried = {};
  let sending = false;

  // prefill from URL
  const params = new URLSearchParams(location.search);
  const urlRoom = (params.get("room") || "").toUpperCase();
  if (urlRoom && urlRoom !== me.room) {
    // a new room link: keep the name, ask to join that room
    me.room = null;
  }
  $("inRoom").value = urlRoom || me.lastRoom || "";
  $("inName").value = me.name || "";

  // ---------- state ----------
  function derive() {
    const joinOrder = [];
    let current = null;
    let endsAt = 0;
    const myGuess = {};
    const reveals = {};
    for (const m of log) {
      if (m.t === "join" && !joinOrder.includes(m.teamId)) joinOrder.push(m.teamId);
      else if (m.t === "start") { current = m.round; endsAt = m.endsAt; delete reveals[m.round]; delete myGuess[m.round]; }
      else if (m.t === "guess" && m.teamId === me.id && !reveals[m.round]) myGuess[m.round] = m;
      else if (m.t === "reveal") reveals[m.round] = m;
    }
    let totals = null;
    for (const m of log) if (m.t === "reveal") totals = m.totals;
    let idx = joinOrder.indexOf(me.id);
    let color = TEAM_COLORS[(idx < 0 ? 0 : idx) % TEAM_COLORS.length];
    const lastReveal = current && reveals[current];
    if (lastReveal) {
      const mine = lastReveal.results.find((r) => r.teamId === me.id);
      if (mine && mine.color) color = mine.color;
    }
    return { current, endsAt, myGuess, reveals, totals, color };
  }

  function apply(m) {
    if (log.some((x) => x.uid === m.uid)) return;
    log.push(m);
    render();
  }

  function connect() {
    if (es) es.close();
    log = [];
    es = subscribe(me.room, apply, (s) => {
      $("status").className = "status " + s;
      $("status").textContent = s === "online" ? "live · room " + me.room : "reconnecting…";
    });
  }

  function showBanner(t) { $("banner").innerHTML = t; $("banner").classList.remove("hidden"); }
  function hideBanner() { $("banner").classList.add("hidden"); }

  // ---------- join ----------
  async function join() {
    const name = $("inName").value.trim();
    const room = $("inRoom").value.trim().toUpperCase();
    if (!name) return ($("joinErr").textContent = "Pick a team name.");
    if (!/^[A-Z]{4}$/.test(room)) return ($("joinErr").textContent = "The room code is the 4 letters on the TV.");
    if (!me.id) me.id = "t-" + uid();
    me.name = name;
    me.room = room;
    me.lastRoom = room;
    store("gq_team", me);
    $("btnJoin").disabled = true;
    try {
      await publish(room, { t: "join", uid: uid(), teamId: me.id, name });
      $("joinErr").textContent = "";
    } catch (e) {
      $("btnJoin").disabled = false;
      return ($("joinErr").textContent = "Couldn't connect (" + e.message + "). Check the wifi and try again.");
    }
    $("btnJoin").disabled = false;
    connect();
    render();
  }

  function leave() {
    if (es) es.close();
    me.room = null;
    store("gq_team", me);
    render();
  }

  // ---------- rendering ----------
  function show(id) {
    for (const s of ["join", "wait", "play"]) $(s).classList.toggle("hidden", s !== id);
  }

  function render() {
    if (!me.room) {
      show("join");
      $("teamBadge").classList.add("hidden");
      $("teamScore").classList.add("hidden");
      $("status").className = "status";
      $("status").textContent = "not connected";
      return;
    }
    const s = derive();
    $("teamBadge").classList.remove("hidden");
    $("teamName").textContent = me.name;
    $("teamChip").style.setProperty("--c", s.color);
    if (s.totals && s.totals[me.id] != null) {
      $("teamScore").textContent = s.totals[me.id] + " pts";
      $("teamScore").classList.remove("hidden");
    }

    if (!s.current) {
      show("wait");
      $("waitLabel").textContent = "You're in · room " + me.room;
      $("waitTitle").textContent = "Waiting for the host to start…";
      return;
    }
    show("play");
    ensureMap();
    const n = s.current;
    const cfg = ROUNDS[n - 1];
    $("roundLabel").textContent = "Round " + n + " of " + ROUNDS.length;
    if (shownRound !== n) newRound(n, cfg, s);
    const rev = s.reveals[n];
    if (rev) return renderReveal(n, rev, s);
    renderPlaying(n, s);
  }

  function ensureMap() {
    if (map) return;
    map = GQ.makeMap($("map"), CFG.mapStyle);
    map.on("click", onMapClick);
    setTimeout(() => map.invalidateSize(), 50);
  }

  function newRound(n, cfg, s) {
    shownRound = n;
    shownReveal = null;
    if (pin) { pin.remove(); pin = null; }
    if (revealLayer) { revealLayer.remove(); revealLayer = null; }
    $("photo").src = cfg.photo;
    $("lightImg").src = cfg.photo;
    map.invalidateSize();
    map.setView([CFG.mapStart.lat, CFG.mapStart.lng], CFG.mapStart.zoom);
    const g = s.myGuess[n];
    const draft = store(draftKey(n));
    const p = g ? { lat: g.lat, lng: g.lng } : draft;
    if (p) placePin(p, !g);
  }

  const draftKey = (n) => "gq_draft_" + me.room + "_" + n;

  function placePin(p, draggable) {
    if (pin) pin.remove();
    pin = L.marker([p.lat, p.lng], { icon: GQ.pinIcon(derive().color, me.name.slice(0, 1).toUpperCase()), draggable });
    pin.on("dragend", () => {
      const ll = pin.getLatLng();
      store(draftKey(shownRound), { lat: ll.lat, lng: ll.lng });
      render();
    });
    pin.addTo(map);
  }

  function onMapClick(e) {
    const s = derive();
    const n = s.current;
    if (!n || s.reveals[n] || s.myGuess[n]) return;
    const p = { lat: e.latlng.lat, lng: e.latlng.lng };
    store(draftKey(n), p);
    placePin(p, true);
    render();
  }

  function pinPos() {
    if (!pin) return null;
    const ll = pin.getLatLng();
    return { lat: ll.lat, lng: ll.lng };
  }

  function coordText(p) {
    return '<span class="coords">' + p.lat.toFixed(5) + ", " + p.lng.toFixed(5) + "</span>";
  }

  let endsAt = 0;
  function renderPlaying(n, s) {
    endsAt = s.endsAt;
    const locked = s.myGuess[n];
    const p = pinPos();
    $("photoBox").classList.remove("hidden");
    if (locked) {
      if (pin && pin.dragging) pin.dragging.disable();
      $("msg").innerHTML = "<b>Locked in ✓</b> Waiting for the reveal… " + coordText(locked);
      $("btnLock").disabled = true;
      $("btnLock").textContent = "Locked in";
    } else if (p) {
      $("msg").innerHTML = "Drag the pin or click somewhere else to move it. " + coordText(p);
      $("btnLock").disabled = sending;
      $("btnLock").textContent = "Lock in guess";
    } else {
      $("msg").innerHTML = "Click on the map where you think the photo was taken. Zoom with the scroll wheel or the +/− buttons.";
      $("btnLock").disabled = true;
      $("btnLock").textContent = "Lock in guess";
    }
    tick();
  }

  function tick() {
    const s = derive();
    const n = s.current;
    const el = $("timer");
    if (!n || $("play").classList.contains("hidden")) return;
    if (s.reveals[n]) { el.textContent = "Done"; el.className = "timer up"; return; }
    const left = Math.ceil((endsAt - Date.now()) / 1000);
    if (left > 0) {
      el.textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
      el.className = "timer" + (left <= 10 ? " low" : "");
    } else {
      el.textContent = "Time's up";
      el.className = "timer up";
      // send whatever pin is on the map
      if (!s.myGuess[n] && pinPos() && !autoTried[n] && !sending) {
        autoTried[n] = true;
        lock();
      }
    }
  }
  setInterval(tick, 250);

  async function lock() {
    const s = derive();
    const n = s.current;
    const p = pinPos();
    if (!n || !p || s.myGuess[n] || sending) return;
    sending = true;
    $("btnLock").disabled = true;
    const m = { t: "guess", uid: uid(), round: n, teamId: me.id, name: me.name, lat: p.lat, lng: p.lng };
    try {
      await publish(me.room, m);
      hideBanner();
      sending = false;
      apply(m);
    } catch (e) {
      sending = false;
      showBanner("Couldn't send your guess (" + esc(e.message) + "). Try again, or read these numbers to the host: <b>" + p.lat.toFixed(5) + ", " + p.lng.toFixed(5) + "</b>");
      render();
    }
  }

  function renderReveal(n, rev, s) {
    $("btnLock").disabled = true;
    $("btnLock").textContent = n >= ROUNDS.length ? "Last round done" : "Waiting for next round";
    const mine = rev.results.find((r) => r.teamId === me.id);
    const ord = (k) => k + (k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th");
    const label = rev.answer.label ? esc(rev.answer.label) + ". " : "";
    if (mine && mine.dist != null) {
      $("msg").innerHTML = '<span class="result-big">' + label + "You were <b>" + fmtDist(mine.dist) + "</b> away · " + ord(mine.rank) + " place · <b>+" + mine.points + "</b></span>";
    } else {
      $("msg").innerHTML = '<span class="result-big">' + label + "No guess from you this round.</span>";
    }
    if (pin) { pin.remove(); pin = null; }
    if (shownReveal === n) return;
    shownReveal = n;
    if (revealLayer) revealLayer.remove();
    revealLayer = L.layerGroup().addTo(map);
    const goal = [rev.answer.lat, rev.answer.lng];
    const pts = [goal];
    rev.results.forEach((r) => {
      if (r.lat == null) return;
      const p = [r.lat, r.lng];
      pts.push(p);
      const isMe = r.teamId === me.id;
      L.polyline([p, goal], { color: r.color, weight: isMe ? 5 : 3, dashArray: "8 8", opacity: isMe ? 1 : 0.6 }).addTo(revealLayer);
      L.marker(p, { icon: GQ.pinIcon(r.color, (r.name || "?").slice(0, 1).toUpperCase()), zIndexOffset: isMe ? 500 : 0 })
        .bindTooltip(esc(r.name) + " · " + fmtDist(r.dist), { permanent: isMe, direction: "top", offset: [0, -40], className: "dist" })
        .addTo(revealLayer);
    });
    L.marker(goal, { icon: GQ.goalIcon(), zIndexOffset: 1000 }).addTo(revealLayer);
    setTimeout(() => {
      map.invalidateSize();
      if (pts.length > 1) map.fitBounds(pts, { padding: [60, 60], maxZoom: 16 });
      else map.setView(goal, 15);
    }, 50);
  }

  // ---------- wiring ----------
  $("btnJoin").onclick = join;
  $("inRoom").addEventListener("keydown", (e) => e.key === "Enter" && join());
  $("inName").addEventListener("keydown", (e) => e.key === "Enter" && $("inRoom").focus());
  $("btnLeave").onclick = leave;
  $("btnLock").onclick = lock;
  $("photoBox").onclick = () => $("lightbox").classList.remove("hidden");
  $("lightbox").onclick = () => $("lightbox").classList.add("hidden");
  document.addEventListener("keydown", (e) => e.key === "Escape" && $("lightbox").classList.add("hidden"));

  if (me.room) connect();
  render();
})();
