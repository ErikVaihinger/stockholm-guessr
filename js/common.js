// Shared helpers for host, team and picker pages.
(function () {
  const CFG = window.QUIZ_CONFIG;

  const TEAM_COLORS = ["#ef476f", "#06b6d4", "#f59e0b", "#8b5cf6", "#22c55e", "#f97316"];

  const TILES = {
    nolabels: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
    },
    labels: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Imagery &copy; Esri",
      subdomains: "",
    },
  };

  function store(key, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem(key));
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      return null;
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function randomCode() {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O
    let s = "";
    for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
    return s;
  }

  function topic(code) {
    return (CFG.topicPrefix + "-" + code).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  async function publish(code, msg) {
    const res = await fetch(CFG.ntfyServer + "/" + topic(code), {
      method: "POST",
      body: JSON.stringify(msg),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
  }

  // Subscribes to the room and replays everything sent so far, so a
  // reloaded page catches up. Messages are deduplicated by their uid.
  function subscribe(code, onMsg, onStatus) {
    const seen = new Set();
    const url = CFG.ntfyServer + "/" + topic(code) + "/sse?since=all";
    const es = new EventSource(url);
    es.onopen = () => onStatus && onStatus("online");
    es.onerror = () => onStatus && onStatus("offline");
    const handle = (e) => {
      let d, m;
      try {
        d = JSON.parse(e.data);
      } catch (err) {
        return;
      }
      if (d.event && d.event !== "message") return;
      try {
        m = JSON.parse(d.message);
      } catch (err) {
        return;
      }
      if (!m || !m.uid || seen.has(m.uid)) return;
      seen.add(m.uid);
      onMsg(m);
    };
    es.onmessage = handle;
    return es;
  }

  function distance(a, b) {
    const R = 6371000;
    const rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function fmtDist(m) {
    if (m == null) return "no guess";
    if (m < 1000) return Math.round(m) + " m";
    return (m / 1000).toFixed(m < 10000 ? 2 : 1) + " km";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function makeMap(el, style) {
    const map = L.map(el, {
      center: [CFG.mapStart.lat, CFG.mapStart.lng],
      zoom: CFG.mapStart.zoom,
      minZoom: CFG.minZoom,
      maxZoom: CFG.maxZoom,
      zoomControl: true,
      worldCopyJump: false,
    });
    const t = TILES[style] || TILES.nolabels;
    L.tileLayer(t.url, {
      attribution: t.attribution,
      subdomains: t.subdomains || "abc",
      maxZoom: 20,
      detectRetina: false,
    }).addTo(map);
    return map;
  }

  function pinIcon(color, label) {
    const html =
      '<div class="pin" style="--c:' + color + '"><span>' + esc(label || "") + "</span></div>";
    return L.divIcon({ className: "pin-wrap", html, iconSize: [30, 42], iconAnchor: [15, 42] });
  }

  function goalIcon() {
    return L.divIcon({
      className: "pin-wrap",
      html: '<div class="goal">&#9733;</div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }

  // Scores one revealed round. Ties share the better rank's points.
  function scoreRound(answer, guesses) {
    const list = guesses
      .map((g) => ({ ...g, dist: distance(answer, g) }))
      .sort((a, b) => a.dist - b.dist);
    let rank = 0;
    list.forEach((g, i) => {
      if (i === 0 || Math.abs(g.dist - list[i - 1].dist) > 0.5) rank = i;
      g.rank = rank + 1;
      g.points = CFG.points[rank] || 0;
    });
    return list;
  }

  window.GQ = {
    CFG,
    TEAM_COLORS,
    store,
    uid,
    randomCode,
    publish,
    subscribe,
    distance,
    fmtDist,
    esc,
    makeMap,
    pinIcon,
    goalIcon,
    scoreRound,
  };
})();
