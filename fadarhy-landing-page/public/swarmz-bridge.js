(function() {
  var VERSION = 'swarmz-bridge@2026-10-27/soft-reload+page-swipe-cancel+pods-v2-swap+presence#b21';

  // -------------------------------------------------------------------------
  // OAuth popup relay — the ONLY part that runs top-level. Two popup kinds:
  //
  //   "swarmz-oauth-native"   — opened by the SCAFFOLDED Supabase client (a
  //     frame redirect to the provider is refused by X-Frame-Options). The
  //     provider redirects back here with implicit-flow tokens in the
  //     fragment; relay them to the opener (the preview iframe, same origin)
  //     and close — the opener's client listens and calls setSession. A
  //     ?code= (PKCE) landing has no fragment tokens — leave the page to the
  //     app, whose client completes the exchange.
  //
  //   "swarmz-oauth-external" — opened by THIS script's external-navigation
  //     rescue for imported apps whose own Supabase client did a same-tab
  //     provider redirect. Nobody in the frame listens for relayed tokens, so
  //     do NOT close: let the app boot in the popup and persist the session
  //     itself (detectSessionInUrl / PKCE exchange writes localStorage, which
  //     the frame shares). Watch for the sb-*-auth-token write, then tell the
  //     frame to reload (it boots signed-in) and close. Tokens are still
  //     relayed for scaffold-style listeners; errors relay and close.
  // -------------------------------------------------------------------------
  var popupKind = (window.opener && (window.name === 'swarmz-oauth-native' || window.name === 'swarmz-oauth-external')) ? window.name : '';
  if (popupKind) {
    try {
      var hp = new URLSearchParams((location.hash || '').replace(/^#/, ''));
      var qp = new URLSearchParams(location.search || '');
      var at = hp.get('access_token');
      var rt = hp.get('refresh_token');
      var oe = hp.get('error_description') || hp.get('error') || qp.get('error_description') || qp.get('error');
      if (at && rt) {
        window.opener.postMessage({ type: 'swarmz:native_oauth_complete', session: { access_token: at, refresh_token: rt } }, location.origin);
        if (popupKind === 'swarmz-oauth-native') window.close();
      } else if (oe) {
        window.opener.postMessage({ type: 'swarmz:native_oauth_error', message: String(oe).slice(0, 300) }, location.origin);
        window.close();
      }
      if (popupKind === 'swarmz-oauth-external' && !oe) {
        var ls = window.localStorage;
        if (ls && typeof ls.key === 'function') {
          // Snapshot BEFORE the app's scripts run (this file loads first in
          // <head>), so any sb-*-auth-token appearing or changing afterwards
          // is the sign-in landing.
          var snap = {};
          for (var si = 0; si < ls.length; si++) {
            var sk = ls.key(si);
            if (sk && /^sb-.*-auth-token$/.test(sk)) snap[sk] = ls.getItem(sk);
          }
          var ticks = 0;
          var iv = setInterval(function() {
            try {
              for (var i = 0; i < ls.length; i++) {
                var k = ls.key(i);
                if (!k || !/^sb-.*-auth-token$/.test(k)) continue;
                var v = ls.getItem(k);
                if (v && v.indexOf('access_token') !== -1 && v !== snap[k]) {
                  window.opener.postMessage({ type: 'swarmz:external_oauth_synced' }, location.origin);
                  clearInterval(iv);
                  window.close();
                  return;
                }
              }
              // ~20s: assume this isn't an auth landing (or the app persists
              // elsewhere) — stop polling and leave the page to the user.
              if (++ticks > 40) clearInterval(iv);
            } catch (e) { clearInterval(iv); }
          }, 500);
        }
      }
    } catch (e) { /* never break the popup page */ }
  }

  if (window.parent === window) return;

  // -------------------------------------------------------------------------
  // Framed preview only: slim, quiet scrollbars. The generated app's native
  // scrollbar filled the phone-width frame with the classic wide bar (owner,
  // 2026-09-18: "the nasty old one, it should be slimmer and clean"). The
  // published site is untouched — this runs only inside the editor. Chrome
  // 121+ and Firefox use the standard properties; older WebKit the pseudo
  // elements.
  // -------------------------------------------------------------------------
  try {
    var sbStyle = document.createElement('style');
    sbStyle.setAttribute('data-swarmz-preview-scrollbar', '1');
    sbStyle.textContent = 'html{scrollbar-color:rgba(127,127,127,.45) transparent}*{scrollbar-width:thin}::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(127,127,127,.45);border-radius:999px}::-webkit-scrollbar-thumb:hover{background:rgba(127,127,127,.7)}';
    (document.head || document.documentElement).appendChild(sbStyle);
  } catch (e) { /* never break the app */ }

  // -------------------------------------------------------------------------
  // Saved-to-live swap (build 20, pods v2). On a cold open the editor shows
  // the project's saved version (its static build, on the swarmz-saved--
  // host) and loads the live app behind it in a frame named "swz-live", then
  // switches when nobody can see it happen. Only those two frames report, as
  // swarmz:swap messages: scroll {y,h,path}, ready {path,h,y} (loaded, fonts
  // in, painted), netidle / netbusy (no new resource for 800 ms after load),
  // activity (real input, and the scrolls that follow it, never a scroll the
  // page made by itself), unload, and nav {path}. The editor answers with
  // swarmz:swap_cmd scrollTo {y} and, to live only, navigate {path}, and only
  // before the switch. A saved document runs this and the scrollbar style
  // only: nothing else from it ever reaches the editor.
  // -------------------------------------------------------------------------
  var SWAP_SAVED = /^swarmz-saved--/i.test(String(location.hostname || ''));
  function swapReport(saved) {
    var post = function(kind, extra) {
      var m = { type: 'swarmz:swap', kind: kind };
      if (extra) for (var k in extra) m[k] = extra[k];
      try { window.parent.postMessage(m, '*'); } catch (e) { /* ignore */ }
    };
    // A hidden or covered frame may pause requestAnimationFrame: the next
    // frame or 50 ms, whichever comes first, runs fn once.
    var nextFrame = function(fn) {
      var done = false;
      var go = function() { if (!done) { done = true; fn(); } };
      try { if (window.requestAnimationFrame) window.requestAnimationFrame(go); } catch (e) { /* ignore */ }
      setTimeout(go, 50);
    };
    var pageHeight = function() { var de = document.documentElement; return de ? Number(de.scrollHeight) || 0 : 0; };
    var pageY = function() { return Math.round(Number(window.scrollY) || 0); };
    var postScroll = function() { post('scroll', { y: pageY(), h: pageHeight(), path: location.pathname }); };
    var lastInput = 0, lastUserScroll = 0, heldAt = 0;
    var onInput = function(e) {
      if (e && e.isTrusted === false) return;
      lastInput = Date.now();
      post('activity');
    };
    var kinds = ['wheel', 'touchstart', 'touchmove', 'keydown', 'input'];
    for (var ki = 0; ki < kinds.length; ki++) window.addEventListener(kinds[ki], onInput, { capture: true, passive: true });
    window.addEventListener('pointerdown', function(e) { if (!e || e.isTrusted !== false) heldAt = Date.now(); onInput(e); }, { capture: true, passive: true });
    var release = function() { heldAt = 0; };
    window.addEventListener('pointerup', release, { capture: true, passive: true });
    window.addEventListener('pointercancel', release, { capture: true, passive: true });
    window.addEventListener('blur', release);
    window.addEventListener('scroll', function() {
      var t = Date.now();
      // The user's scroll: a pointer is held (a scrollbar drag), input just
      // happened, or it continues one that was (momentum).
      if ((heldAt && t - heldAt < 30000) || t - lastInput < 600 || t - lastUserScroll < 200) {
        lastUserScroll = t;
        post('activity');
      }
      nextFrame(postScroll);
    }, { passive: true });
    window.addEventListener('pagehide', function() { post('unload'); });
    window.addEventListener('message', function(e) {
      try {
        var d = e.data;
        if (e.source !== window.parent || !d || d.type !== 'swarmz:swap_cmd') return;
        if (d.kind === 'scrollTo' && typeof d.y === 'number' && isFinite(d.y)) {
          try { window.scrollTo({ top: d.y, left: 0, behavior: 'instant' }); } catch (er) { window.scrollTo(0, d.y); }
          nextFrame(postScroll);
        } else if (d.kind === 'navigate' && !saved && typeof d.path === 'string') {
          softNavigate(d.path);
        }
      } catch (err) { /* never break the app */ }
    });
    var ready = function() {
      var fire = function() {
        nextFrame(function() { nextFrame(function() { post('ready', { path: location.pathname, h: pageHeight(), y: pageY() }); }); });
      };
      try {
        if (document.fonts && document.fonts.ready && document.fonts.ready.then) { document.fonts.ready.then(fire, fire); return; }
      } catch (e) { /* ignore */ }
      fire();
    };
    if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
    var lp = location.pathname;
    setInterval(function() {
      if (location.pathname === lp) return;
      lp = location.pathname;
      post('nav', { path: lp });
      ready();
    }, 100);
    setInterval(postScroll, 1000);
    if (saved) return;
    // Network quiet: no new resource for 800 ms after load. The bridge's own
    // console flush never counts, and fetch / XHR only count for the first 5 s
    // after load, so an app that polls its API still settles.
    var loadedAt = 0, lastRes = Date.now(), quiet = false;
    var counts = function(en) {
      var name = String((en && en.name) || '');
      if (name.indexOf('/api/console-log') !== -1 || name.indexOf('/__swarmz/') !== -1) return false;
      var it = en && en.initiatorType;
      if ((it === 'fetch' || it === 'xmlhttprequest' || it === 'beacon') && loadedAt && Date.now() - loadedAt > 5000) return false;
      return true;
    };
    try {
      var PO = window.PerformanceObserver;
      if (PO) {
        new PO(function(list) {
          var entries = list.getEntries();
          for (var ei = 0; ei < entries.length; ei++) {
            if (!counts(entries[ei])) continue;
            lastRes = Date.now();
            if (quiet) { quiet = false; post('netbusy'); }
            return;
          }
        }).observe({ type: 'resource', buffered: true });
      }
    } catch (e) { /* no resource timing: quiet 800 ms after load */ }
    setInterval(function() {
      if (document.readyState !== 'complete') return;
      if (!loadedAt) loadedAt = Date.now();
      if (!quiet && Date.now() - lastRes > 800) { quiet = true; post('netidle'); }
    }, 200);
  }
  if (SWAP_SAVED || window.name === 'swz-live') {
    try { swapReport(SWAP_SAVED); } catch (e) { /* never break the app */ }
  }
  if (SWAP_SAVED) return;

  // -------------------------------------------------------------------------
  // Presence (build 21, pods v2). Tells the sandbox manager that a page has
  // this project open and how long ago a real person last gave input in it,
  // so it freezes an open but untouched project after 45 minutes instead of
  // on traffic. POST /__sbx/presence {inputAgoMs} (-1 before any input) on
  // the pod's own origin: once after load, every 2 minutes while the page is
  // visible, and at once on real input (a pointer move counts) or on the tab
  // becoming visible when the last report is over 30 s old: that is what
  // wakes a frozen project when the person comes back. The editor forwards
  // its own input as swarmz:presence_input, so working in the editor counts
  // too. Synthetic input, such as the AI preview mirror's, never counts. A
  // response that is not ok (an older pod whose dev server does not know the
  // path answers 404) stops it for this page load. Runs in any framed
  // preview except the saved version.
  // -------------------------------------------------------------------------
  function presenceReport() {
    var lastInput = 0, lastSend = 0, stopped = false;
    var sendIfStale = function() { if (Date.now() - lastSend > 30000) send(); };
    var send = function() {
      if (stopped) return;
      lastSend = Date.now();
      try {
        var p = fetch(location.origin + '/__sbx/presence', {
          method: 'POST',
          credentials: 'same-origin',
          keepalive: true,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ inputAgoMs: lastInput ? Date.now() - lastInput : -1 })
        });
        if (p && p.then) p.then(function(res) { if (res && !res.ok) stopped = true; }, function() { /* the next tick retries */ });
      } catch (e) { /* the next tick retries */ }
    };
    // The editor hears about the page's input too (swarmz:input, at most
    // every 10 s): it pauses its own dev-server polls while nobody is here.
    var lastTold = 0;
    var onInput = function(e) {
      if (e && e.isTrusted === false) return;
      lastInput = Date.now();
      if (e && lastInput - lastTold > 10000) {
        lastTold = lastInput;
        try { window.parent.postMessage({ type: 'swarmz:input' }, '*'); } catch (err) { /* ignore */ }
      }
      sendIfStale();
    };
    // No touchmove listener: the page-swipe forwarder below owns that event,
    // and the touchstart of every gesture is input enough.
    var kinds = ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart', 'input'];
    for (var ki = 0; ki < kinds.length; ki++) window.addEventListener(kinds[ki], onInput, { capture: true, passive: true });
    window.addEventListener('message', function(e) {
      try {
        var d = e.data;
        if (e.source === window.parent && d && d.type === 'swarmz:presence_input') onInput(null);
      } catch (err) { /* never break the app */ }
    });
    var visible = function() { var vs = document.visibilityState; return vs === undefined || vs === 'visible'; };
    if (document.addEventListener) document.addEventListener('visibilitychange', function() { if (visible()) sendIfStale(); });
    setInterval(function() { if (visible()) send(); }, 120000);
    if (document.readyState === 'complete') send(); else window.addEventListener('load', send);
  }
  try { presenceReport(); } catch (e) { /* never break the app */ }

  // -------------------------------------------------------------------------
  // Edge-call error reporting — surfaces failed Supabase calls to the editor.
  // Message shape is load-bearing (EdgeErrorOverlay parses it) — do not change.
  // -------------------------------------------------------------------------
  var _f = window.fetch;
  window.fetch = function() {
    var a = arguments, u = String(a[0] || ''), sb = u.includes('/functions/') || u.includes('.supabase.co');
    return _f.apply(this, a).then(function(r) {
      if (!r.ok && sb) r.clone().text().then(function(b) {
        var m = b.slice(0, 500);
        try { var j = JSON.parse(b); m = j.error || j.message || m; } catch (e) {}
        window.parent.postMessage({ type: 'swarmz:edge_error', url: u.split('?')[0], status: r.status, statusText: r.statusText, error: m, timestamp: Date.now() }, '*');
      }).catch(function() {});
      return r;
    }).catch(function(e) {
      if (sb) window.parent.postMessage({ type: 'swarmz:edge_error', url: u.split('?')[0], status: 0, statusText: 'Network Error', error: e.message || 'CORS or network error', timestamp: Date.now() }, '*');
      throw e;
    });
  };

  // -------------------------------------------------------------------------
  // Route reporting — keeps the editor address bar in sync with THIS frame.
  // Reported as soon as the bridge runs: a full-document load (first open, a
  // reload, a plain link, a redirect) never calls pushState, so the bar used
  // to keep showing the previous page. Again on DOMContentLoaded (the router
  // may have rewritten the URL by then), pageshow (a back/forward-cache
  // restore), popstate, hashchange, the History API wrappers below and the
  // Navigation API's navigatesuccess where it exists. De-duplicated by the
  // last path posted; a cache restore always re-posts, because the editor
  // showed another page meanwhile.
  // -------------------------------------------------------------------------
  var rrLast = null;
  var rr = function() {
    try {
      var p = location.pathname + location.search + location.hash;
      if (p === rrLast) return;
      rrLast = p;
      window.parent.postMessage({ type: 'swarmz:route_change', path: p }, '*');
    } catch (e) { /* never break the app */ }
  };
  rr();
  document.addEventListener('DOMContentLoaded', rr);
  window.addEventListener('pageshow', function(e) { if (e && e.persisted) rrLast = null; rr(); });
  window.addEventListener('popstate', rr);
  window.addEventListener('hashchange', rr);
  if (window.navigation && window.navigation.addEventListener) window.navigation.addEventListener('navigatesuccess', rr);
  var _ps = history.pushState.bind(history), _rs = history.replaceState.bind(history);
  history.pushState = function() { _ps.apply(this, arguments); setTimeout(rr, 0); };
  history.replaceState = function() { _rs.apply(this, arguments); setTimeout(rr, 0); };

  // -------------------------------------------------------------------------
  // Vite HMR liveness — tells the editor whether this document is receiving
  // dev-server updates. The editor skips its end-of-run iframe remount (the
  // post-build cache-bust) when the socket stayed connected for the whole run
  // (HMR already delivered every change live), and falls back to the remount
  // when it dropped (a stale document would 404 its recompiled module
  // hashes). Vite's client only exposes ws state to graph modules
  // (import.meta.hot), never to the page, so wrap the WebSocket constructor:
  // this classic script runs before Vite's deferred module client, and Vite
  // tags its socket with the 'vite-hmr' subprotocol. pagehide suppresses the
  // close report — any navigation (including a Vite-initiated full reload)
  // closes the socket, but the NEW document re-announces itself, and
  // reporting that close as a drop would make the editor remount right after
  // Vite already reloaded: a double flash.
  // -------------------------------------------------------------------------
  try {
    var _hmrUnloading = false;
    var postHmr = function(status) {
      window.parent.postMessage({ type: 'swarmz:vite_hmr', status: status, timestamp: Date.now() }, '*');
    };
    // 'unloading' (build 16): this document's socket is going away with the
    // page. The editor clears its liveness without counting a drop.
    window.addEventListener('pagehide', function() { _hmrUnloading = true; try { postHmr('unloading'); } catch (e) { /* ignore */ } }, true);
    var NativeWS = window.WebSocket;
    if (NativeWS) {
      var PatchedWS = function(url, protocols) {
        var ws = protocols === undefined ? new NativeWS(url) : new NativeWS(url, protocols);
        try {
          var isVite = protocols === 'vite-hmr' || (protocols && protocols.indexOf && protocols.indexOf('vite-hmr') !== -1);
          if (isVite) {
            ws.addEventListener('open', function() { postHmr('connected'); });
            ws.addEventListener('close', function() { if (!_hmrUnloading) postHmr('disconnected'); });
          }
        } catch (e) { /* never break the socket */ }
        return ws;
      };
      PatchedWS.prototype = NativeWS.prototype;
      PatchedWS.CONNECTING = NativeWS.CONNECTING;
      PatchedWS.OPEN = NativeWS.OPEN;
      PatchedWS.CLOSING = NativeWS.CLOSING;
      PatchedWS.CLOSED = NativeWS.CLOSED;
      window.WebSocket = PatchedWS;
    }
  } catch (e) { /* HMR reporting is best-effort */ }

  // -------------------------------------------------------------------------
  // Soft updates (build 16). The preview must NEVER hard refresh unless the
  // user presses refresh (owner, 2026-10-24: updates are instant and keep the
  // scroll position). The editor used to remount the iframe for an update the
  // HMR socket could not deliver, to start an AI control session, after a
  // verification repair and to load the visual-edit script; each one threw
  // away the page the user was looking at. Instead it asks THIS script:
  //   swarmz:soft_reload        reload in place (the old paint stays up until
  //                             the new document is ready) and put the scroll
  //                             position back once the page is tall enough
  //   swarmz:soft_navigate      change route through the app's own router
  //                             (pushState + popstate); a real navigation
  //                             only when nothing rendered (no router)
  //   swarmz:load_visual_script append the visual-edit script in place
  // The editor learns what this document supports from swarmz:bridge_ready.
  // -------------------------------------------------------------------------
  var BUILD = Number((VERSION.match(/#b(\d+)/) || [])[1]) || 0;
  var SOFT_KEY = '__swarmz_soft_reload';
  var SOFT_MAX_AGE_MS = 15000;
  var SOFT_RESTORE_MS = 4000;
  var SOFT_HOLD_MS = 900;
  var SOFT_NAV_CONFIRM_MS = 1500;
  function softPath() { return location.pathname + location.search + location.hash; }
  function softSamePath(p) { return typeof p === 'string' && p.charAt(0) === '/' && p.charAt(1) !== '/' && p.charAt(1) !== '\\'; }
  // A short CSS path for a scrolled container, so apps that scroll a <main>
  // instead of the window come back where they were too.
  function softSelector(el) {
    var parts = [], n = el;
    for (var d = 0; n && n.nodeType === 1 && n !== document.body && d < 12; d++) {
      if (n.id && /^[A-Za-z][\w-]*$/.test(n.id)) { parts.unshift('#' + n.id); return parts.join('>'); }
      var i = 1, s = n.previousElementSibling;
      for (; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
      parts.unshift(n.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
      n = n.parentElement;
    }
    return n === document.body && parts.length ? 'body>' + parts.join('>') : null;
  }
  function softScrollers() {
    var out = [];
    try {
      var all = document.querySelectorAll('body *');
      for (var i = 0; i < all.length && out.length < 3; i++) {
        var el = all[i];
        if (!(el.scrollTop > 0) || el.clientHeight < window.innerHeight * 0.4) continue;
        var sel = softSelector(el);
        if (sel) out.push({ sel: sel, top: el.scrollTop });
      }
    } catch (e) { /* never break the app */ }
    return out;
  }
  function softReload() {
    try {
      window.sessionStorage.setItem(SOFT_KEY, JSON.stringify({ path: softPath(), x: window.scrollX || 0, y: window.scrollY || 0, s: softScrollers(), at: Date.now() }));
    } catch (e) { /* storage blocked: the reload still happens, at the top */ }
    try { location.reload(); } catch (e) { /* ignore */ }
  }
  // True once the window sits at the saved position; scrolls there as soon as
  // the page is tall enough to hold it.
  function softApplyWindow(saved) {
    var x = Number(saved.x) || 0, y = Number(saved.y) || 0;
    if (Math.abs((window.scrollY || 0) - y) < 2 && Math.abs((window.scrollX || 0) - x) < 2) return true;
    var de = document.documentElement, height = de ? Number(de.scrollHeight) || 0 : 0;
    if (height - window.innerHeight < y - 1) return false;
    try { window.scrollTo(x, y); } catch (e) { return true; }
    return Math.abs((window.scrollY || 0) - y) < 2;
  }
  function softApplyEls(saved) {
    var list = saved.s && saved.s.length ? saved.s : [], done = true;
    for (var i = 0; i < list.length; i++) {
      var el = null;
      try { el = document.querySelector(list[i].sel); } catch (e) { el = null; }
      if (!el) { done = false; continue; }
      if (Math.abs(el.scrollTop - list[i].top) >= 2) el.scrollTop = list[i].top;
      if (Math.abs(el.scrollTop - list[i].top) >= 2) done = false;
    }
    return done;
  }
  function softTakeSaved() {
    var saved = null;
    try {
      var raw = window.sessionStorage.getItem(SOFT_KEY);
      if (raw) { window.sessionStorage.removeItem(SOFT_KEY); saved = JSON.parse(raw); }
    } catch (e) { saved = null; }
    if (!saved || typeof saved !== 'object' || saved.path !== softPath()) return null;
    var age = Date.now() - Number(saved.at);
    return age >= 0 && age < SOFT_MAX_AGE_MS ? saved : null;
  }
  // Polls until the page can hold the saved position, then keeps it there for
  // a moment: routers reset the scroll to the top as they mount. Stops for
  // good the moment the user scrolls, touches or types.
  function softRestore() {
    var saved = softTakeSaved();
    if (!saved) return;
    var deadline = Date.now() + SOFT_RESTORE_MS, heldSince = 0, userMoved = false;
    var mark = function(e) { if (e && e.isTrusted) userMoved = true; };
    window.addEventListener('wheel', mark, { capture: true, passive: true });
    window.addEventListener('touchstart', mark, { capture: true, passive: true });
    window.addEventListener('keydown', mark, true);
    var tick = function() {
      if (userMoved) return;
      var placed = softApplyWindow(saved) && softApplyEls(saved);
      var now = Date.now();
      if (placed && !heldSince) heldSince = now;
      if (!placed) heldSince = 0;
      if ((heldSince && now - heldSince >= SOFT_HOLD_MS) || now >= deadline) return;
      setTimeout(tick, 50);
    };
    tick();
  }
  // Router state the common SPA routers read on popstate (TanStack Router's
  // __TSR_index, React Router's idx): one step forward from where we are.
  function softState() {
    var st = history.state && typeof history.state === 'object' ? history.state : {};
    var key = Math.random().toString(36).slice(2, 10);
    var next = { key: key, __TSR_key: key };
    if (typeof st.__TSR_index === 'number') next.__TSR_index = st.__TSR_index + 1;
    if (typeof st.idx === 'number') { next.idx = st.idx + 1; next.usr = null; }
    return next;
  }
  function softNavigate(path) {
    if (!softSamePath(path) || softPath() === path) return;
    var rendered = false, mo = null;
    try {
      mo = new MutationObserver(function() { rendered = true; });
      mo.observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
    } catch (e) { rendered = true; }
    try {
      history.pushState(softState(), '', path);
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    } catch (e) {
      try { if (mo) mo.disconnect(); } catch (e2) { /* ignore */ }
      location.assign(path);
      return;
    }
    setTimeout(function() {
      try { if (mo) mo.disconnect(); } catch (e) { /* ignore */ }
      // Nothing re-rendered: a page without a client router. Its own links
      // load documents too, so do what a click on one would.
      if (!rendered && softPath() === path) location.assign(path);
    }, SOFT_NAV_CONFIRM_MS);
  }
  var visualLoadAt = 0;
  function loadVisualScript() {
    if (window.__swarmzVisualMode || Date.now() - visualLoadAt < 8000) return;
    visualLoadAt = Date.now();
    try {
      var vs = document.createElement('script');
      vs.src = '/__swarmz_visual.js?v=' + Date.now();
      vs.setAttribute('data-swarmz-visual-loader', '1');
      (document.body || document.head || document.documentElement).appendChild(vs);
    } catch (e) { /* never break the app */ }
  }
  try { softRestore(); } catch (e) { /* never break the app */ }
  try {
    window.parent.postMessage({ type: 'swarmz:bridge_ready', version: VERSION, build: BUILD, features: ['soft_reload', 'soft_navigate', 'load_visual_script', 'presence'] }, '*');
  } catch (e) { /* ignore */ }

  // -------------------------------------------------------------------------
  // Console capture — buffered flush to the sidecar's dedicated (append-only,
  // capped, unauthenticated) POST /api/console-log, which lands in
  // /tmp/console.log for the AI's read-console tool and the smoke checks.
  // The old path (POST /api/files/write) never worked: 403 from the bearer
  // gate, and /tmp is outside the files API's /workspace jail anyway — the
  // 403s it sprayed in the console read as a platform bug. AI-generated
  // preview code commonly logs API keys and tokens during prototyping —
  // redact obvious secret patterns before persisting. A 401/403/404 response
  // means an old-sidecar pod without the endpoint: stop flushing immediately
  // and permanently (one quiet failure, not a retry spray); other failures
  // back off after 3 tries.
  // -------------------------------------------------------------------------
  var _cl = console.log, _ce = console.error, _cw = console.warn;
  var logBuf = [];
  var flushFails = 0;
  function redact(s) {
    try {
      return String(s)
        .replace(/sk-ant-[A-Za-z0-9_-]{10,}/g, 'sk-ant-***REDACTED***')
        .replace(/sk-proj-[A-Za-z0-9_-]{10,}/g, 'sk-proj-***REDACTED***')
        .replace(/sk-[A-Za-z0-9]{20,}/g, 'sk-***REDACTED***')
        .replace(/sk_(live|test)_[A-Za-z0-9]{10,}/g, 'sk_$1_***REDACTED***')
        .replace(/rk_(live|test)_[A-Za-z0-9]{10,}/g, 'rk_$1_***REDACTED***')
        .replace(/whsec_[A-Za-z0-9]{10,}/g, 'whsec_***REDACTED***')
        .replace(/ghp_[A-Za-z0-9]{20,}/g, 'ghp_***REDACTED***')
        .replace(/gho_[A-Za-z0-9]{20,}/g, 'gho_***REDACTED***')
        .replace(/github_pat_[A-Za-z0-9_]{20,}/g, 'github_pat_***REDACTED***')
        .replace(/glpat-[A-Za-z0-9_-]{10,}/g, 'glpat-***REDACTED***')
        .replace(/xox[abprso]-[A-Za-z0-9-]{10,}/g, 'xox-***REDACTED***')
        .replace(/AKIA[0-9A-Z]{16}/g, 'AKIA***REDACTED***')
        .replace(/AIza[0-9A-Za-z_-]{20,}/g, 'AIza***REDACTED***')
        .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '***JWT-REDACTED***')
        .replace(/[Bb]earer\s+[A-Za-z0-9._\-]{16,}/g, 'Bearer ***REDACTED***')
        .replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+PRIVATE KEY-----/g, '***PRIVATE-KEY-REDACTED***');
    } catch (e) { return String(s); }
  }
  function flushLogs() {
    if (!logBuf.length || flushFails >= 3) return;
    var b = logBuf.splice(0, 50);
    fetch('/api/console-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: b.join('\n') + '\n' }) })
      .then(function(r) {
        if (r.ok) { flushFails = 0; return; }
        flushFails = (r.status === 401 || r.status === 403 || r.status === 404) ? 3 : flushFails + 1;
      })
      .catch(function() { flushFails++; });
  }
  setInterval(flushLogs, 2000);
  function capLog(l, a) {
    if (logBuf.length > 500) logBuf.length = 0;
    logBuf.push('[' + l + '] ' + redact(Array.prototype.slice.call(a).map(function(x) { try { return typeof x === 'object' ? JSON.stringify(x) : String(x); } catch (e) { return String(x); } }).join(' ')));
  }
  console.log = function() { capLog('LOG', arguments); _cl.apply(console, arguments); };
  // console.error additionally posts swarmz:runtime_error when an Error object
  // is logged — React render crashes CAUGHT by an error boundary never hit
  // window.onerror, so the editor's auto-heal was blind to them. Deduped per
  // message for 30s (React dev logs the same error 2-3x).
  var reported = {};
  console.error = function() {
    capLog('ERROR', arguments);
    try {
      var er = null, i;
      for (i = 0; i < arguments.length; i++) { if (arguments[i] instanceof Error) { er = arguments[i]; break; } }
      if (er && er.message) {
        var k = String(er.message).slice(0, 120), n = Date.now();
        if (!reported[k] || n - reported[k] > 30000) {
          reported[k] = n;
          window.parent.postMessage({ type: 'swarmz:runtime_error', error: (String(er.message) + ' ' + (String(er.stack || '').split('\n')[1] || '').trim()).slice(0, 500) }, '*');
        }
      }
    } catch (e) {}
    _ce.apply(console, arguments);
  };
  console.warn = function() { capLog('WARN', arguments); _cw.apply(console, arguments); };

  // -------------------------------------------------------------------------
  // Vite error overlay + uncaught error reporting.
  // -------------------------------------------------------------------------
  var _eo = new MutationObserver(function(ms) {
    ms.forEach(function(m) {
      m.addedNodes.forEach(function(n) {
        if (n.tagName && n.tagName.toLowerCase() === 'vite-error-overlay') {
          var t = '';
          try {
            var sr = n.shadowRoot;
            t = sr && sr.querySelector('.message-body') ? sr.querySelector('.message-body').textContent : n.textContent || '';
          } catch (e) { t = n.textContent || ''; }
          if (t) window.parent.postMessage({ type: 'swarmz:vite_error', error: t.trim().slice(0, 3000) }, '*');
        }
      });
    });
  });
  _eo.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('error', function(e) {
    if (e.message) window.parent.postMessage({ type: 'swarmz:runtime_error', error: e.message + (e.filename ? ' in ' + e.filename.split('/').pop() : '') + (e.lineno ? ':' + e.lineno : '') }, '*');
  });
  window.addEventListener('unhandledrejection', function(e) {
    var r = e.reason, m = r && r.message ? r.message : String(r || 'unknown');
    if (m && m !== 'unknown') window.parent.postMessage({ type: 'swarmz:runtime_error', error: 'Unhandled promise rejection: ' + m.slice(0, 500) }, '*');
  });

  // -------------------------------------------------------------------------
  // External links. Navigating THIS frame to another site lands on Chrome's
  // "This content is blocked" page whenever the site refuses to be framed
  // (X-Frame-Options / frame-ancestors) — Instagram, TikTok, X, YouTube,
  // LinkedIn, Facebook, GitHub and WhatsApp all do. So the frame never goes
  // there on its own: it asks the editor (swarmz:external_link), which knows
  // whether the site allows framing. "inline" → the frame opens it right here
  // (the editor shows the site's address and a way back to the app); "tab" →
  // a real tab. An editor that does not acknowledge within 300 ms (an older
  // bundle) or does not decide within 3.5 s gets the old behaviour: a tab.
  //
  // Recognized OAuth/SSO authorize URLs get an OPENERED popup named
  // "swarmz-oauth-external" so the provider's redirect back to this origin
  // lands where the top of this script can relay/sync the session (see the
  // popup relay above). Other tabs lose their opener at once, so an
  // arbitrary site cannot script or tabnab the preview frame. The opener is
  // nulled by hand rather than with noopener because noopener hides whether
  // Chrome blocked the popup (no user gesture left, e.g. a redirect after a
  // slow request) — then the editor offers a one-click open instead.
  // -------------------------------------------------------------------------
  var AUTH_RE = /\/auth\/v1\/authorize|\/oauth2?\/(v2(\.\d+)?\/)?authoriz|\/o\/oauth2\/|\/connect\/authorize|\/login\/oauth|\/realms\/[^/]+\/protocol\/openid-connect|\/dialog\/oauth|\/saml2?\/|\/sso\/|^accounts\.google\.com|^appleid\.apple\.com|^login\.microsoftonline\.com/i;
  var extSeq = 0, extPending = Object.create(null), extInlineHref = null;
  function openExternalTab(href) {
    var w = null;
    try { w = window.open(href, '_blank'); } catch (err) { w = null; }
    if (w) {
      try { w.opener = null; } catch (err) { /* already cross-origin */ }
      return;
    }
    try { window.parent.postMessage({ type: 'swarmz:external_link_blocked', url: href }, '*'); } catch (err) { /* ignore */ }
  }
  function rescueExternal(u) {
    if (AUTH_RE.test(u.host + u.pathname)) {
      window.open(u.href, 'swarmz-oauth-external', 'width=480,height=720');
      return;
    }
    var id = 'x' + (++extSeq) + '-' + Date.now().toString(36);
    var entry = { href: u.href, acked: false };
    extPending[id] = entry;
    try { window.parent.postMessage({ type: 'swarmz:external_link', id: id, url: u.href }, '*'); } catch (err) { /* ignore */ }
    setTimeout(function() {
      if (extPending[id] !== entry || entry.acked) return;
      delete extPending[id];
      openExternalTab(entry.href);
    }, 300);
    setTimeout(function() {
      if (extPending[id] !== entry) return;
      delete extPending[id];
      openExternalTab(entry.href);
    }, 3500);
  }
  window.addEventListener('message', function(e) {
    try {
      var d = e.data;
      if (e.source !== window.parent || !d || typeof d !== 'object' || typeof d.id !== 'string') return;
      var entry = extPending[d.id];
      if (!entry) return;
      if (d.type === 'swarmz:external_link_ack') { entry.acked = true; return; }
      if (d.type !== 'swarmz:external_link_decision') return;
      delete extPending[d.id];
      if (d.mode !== 'inline') { openExternalTab(entry.href); return; }
      extInlineHref = entry.href;
      window.parent.postMessage({ type: 'swarmz:external_inline', url: entry.href }, '*');
      location.assign(entry.href);
    } catch (err) { /* never break the app */ }
  });

  // Anchor clicks — bubble phase so the app's own handlers (SPA router links,
  // preventDefault) always win; anchors that already target _blank open
  // natively.
  document.addEventListener('click', function(e) {
    try {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var t = e.target;
      var a = t && t.closest ? t.closest('a[href]') : null;
      if (!a) return;
      if ((a.getAttribute('target') || '').toLowerCase() === '_blank') return;
      if (a.hasAttribute('download')) return;
      var raw = a.getAttribute('href') || '';
      if (!raw || raw.charAt(0) === '#') return;
      if (/^(javascript|mailto|tel|blob|data):/i.test(raw)) return;
      var u;
      try { u = new URL(raw, location.href); } catch (err) { return; }
      if (u.origin === location.origin) return;
      e.preventDefault();
      rescueExternal(u);
    } catch (err) { /* never break app clicks */ }
  }, false);

  // Programmatic same-tab navigations (location.href = provider URL — how
  // supabase-js signInWithOAuth leaves the page, plus any window.location
  // redirect an imported app does). The Navigation API fires a cancelable
  // 'navigate' for these where supported (Chromium 102+, Safari 18.4+,
  // Firefox 147+); elsewhere behaviour degrades to today's (the frame hits
  // the target's frame-ancestors wall). Skips: same-origin, downloads,
  // hash-only, form POSTs (the submit handler below aims those at a tab), and
  // anything the engine marks non-cancelable (user-initiated traversals).
  // -------------------------------------------------------------------------
  if (window.navigation && window.navigation.addEventListener) {
    window.navigation.addEventListener('navigate', function(e) {
      try {
        if (!e || !e.destination || e.hashChange) return;
        if (e.downloadRequest !== null && e.downloadRequest !== undefined) return;
        if (e.formData) return;
        if (e.cancelable === false) return;
        var u;
        try { u = new URL(e.destination.url, location.href); } catch (err) { return; }
        if (u.origin === location.origin) return;
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
        // The editor said this site may open inline: let that one through.
        if (extInlineHref !== null && u.href === extInlineHref) { extInlineHref = null; return; }
        e.preventDefault();
        rescueExternal(u);
      } catch (err) { /* never break app navigation */ }
    });
  }

  // Cross-site form posts (newsletter, contact and payment forms that post to
  // another site) would take the frame there and hit the same wall. A POST
  // cannot be replayed into a tab later, so the form is aimed at a new tab
  // as it submits, while the click's user gesture still counts. Forms the app
  // handles itself (preventDefault) or that name their own target (a hidden
  // iframe, _blank) are left alone; the attribute is restored right after.
  document.addEventListener('submit', function(e) {
    try {
      if (e.defaultPrevented) return;
      var f = e.target;
      if (!f || !f.getAttribute) return;
      var s = e.submitter && e.submitter.getAttribute ? e.submitter : null;
      var el = s && s.hasAttribute && s.hasAttribute('formtarget') ? s : f;
      var attr = el === f ? 'target' : 'formtarget';
      var prev = el.getAttribute(attr);
      if (prev && prev.toLowerCase() !== '_self') return;
      var act = (s && s.getAttribute('formaction')) || f.getAttribute('action') || '';
      if (!act) return;
      var u;
      try { u = new URL(act, location.href); } catch (err) { return; }
      if (u.origin === location.origin) return;
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
      el.setAttribute(attr, '_blank');
      setTimeout(function() {
        try { if (prev === null) el.removeAttribute(attr); else el.setAttribute(attr, prev); } catch (err) { /* ignore */ }
      }, 0);
    } catch (err) { /* never break app forms */ }
  }, false);

  // When a "swarmz-oauth-external" popup reports the session landed in
  // shared localStorage, reload — the app boots signed-in. Same-origin
  // messages only (the popup posts with location.origin).
  window.addEventListener('message', function(e) {
    try {
      if (e.origin !== location.origin) return;
      if (e.data && e.data.type === 'swarmz:external_oauth_synced') softReload();
    } catch (err) { /* ignore */ }
  });

  // -------------------------------------------------------------------------
  // App session sharing. The AI's preview session is a separate headless
  // browser; the app's login lives in THIS frame's storage. The editor keeps
  // the latest snapshot per project and hands it to a run, which seeds the
  // AI's browser before its first page load (owner, 2026-09-19: "the AI
  // should see and do the same things as me in the preview"). Posted on load,
  // on request, and whenever the storage or cookies change (a 2s fingerprint
  // poll: the storage event never fires in the writing tab). The editor
  // validates the frame's origin; nothing is ever applied INTO this frame.
  // -------------------------------------------------------------------------
  var AS_VALUE_MAX = 65536, AS_TOTAL_MAX = 524288, AS_ENTRIES_MAX = 200;
  var AS_AUTH_RX = /auth|token|session|sid|jwt|^sb-/i;
  function asEntries(store) {
    var out = [];
    try {
      if (!store || typeof store.key !== 'function') return out;
      for (var i = 0; i < store.length && out.length < AS_ENTRIES_MAX; i++) {
        var k = store.key(i);
        if (!k || k.indexOf('__swarmz') === 0) continue;
        var v = store.getItem(k);
        if (typeof v !== 'string' || v.length > AS_VALUE_MAX) continue;
        out.push({ name: k, value: v });
      }
    } catch (e) { /* storage blocked */ }
    return out;
  }
  function asCookies() {
    var out = [];
    try {
      var parts = String(document.cookie || '').split('; ');
      for (var i = 0; i < parts.length && out.length < AS_ENTRIES_MAX; i++) {
        var eq = parts[i].indexOf('=');
        if (eq <= 0) continue;
        out.push({ name: parts[i].slice(0, eq), value: parts[i].slice(eq + 1) });
      }
    } catch (e) { /* ignore */ }
    return out;
  }
  // Over budget, the largest entries that are not sign-in related go first.
  function asTrim(snap) {
    var lists = [snap.cookies, snap.localStorage, snap.sessionStorage], total = 0, i, j;
    for (i = 0; i < lists.length; i++) for (j = 0; j < lists[i].length; j++) total += lists[i][j].name.length + lists[i][j].value.length;
    while (total > AS_TOTAL_MAX) {
      var list = null, idx = -1, best = -1;
      for (i = 0; i < lists.length; i++) for (j = 0; j < lists[i].length; j++) {
        var e = lists[i][j];
        if (AS_AUTH_RX.test(e.name)) continue;
        var size = e.name.length + e.value.length;
        if (size > best) { best = size; list = lists[i]; idx = j; }
      }
      if (!list) break;
      total -= best;
      list.splice(idx, 1);
    }
    return snap;
  }
  // The copy the AI's browser is seeded with carries the ACCESS token only:
  // the refresh token is blanked. Two reasons, one rule. The AI must never be
  // able to rotate the user's session (a rotation revokes the family and
  // signs the user out of their own app), and supabase-js only attempts a
  // grant when it HAS a refresh token — with none it just uses the access
  // token until it expires, so its auth lock can never hang on a request the
  // preview service refuses. This frame's own storage is untouched.
  function asShare(entries) {
    var out = [], i;
    for (i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (!/^sb-[a-z0-9-]+-auth-token$/.test(e.name)) { out.push(e); continue; }
      try {
        var s = JSON.parse(e.value);
        if (s && typeof s === 'object' && typeof s.refresh_token === 'string') {
          s.refresh_token = '';
          out.push({ name: e.name, value: JSON.stringify(s) });
          continue;
        }
      } catch (err) { /* not a session we understand */ }
      out.push(e);
    }
    return out;
  }
  function asSnapshot() {
    return asTrim({ type: 'swarmz:app_state', origin: location.origin, capturedAt: Date.now(), cookies: asCookies(), localStorage: asShare(asEntries(window.localStorage)), sessionStorage: asShare(asEntries(window.sessionStorage)) });
  }
  function asHash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; }
  function asFingerprint(snap) {
    var all = snap.cookies.concat(snap.localStorage, snap.sessionStorage), s = '';
    for (var i = 0; i < all.length; i++) s += all[i].name + '' + all[i].value + '';
    return all.length + ':' + asHash(s);
  }
  var asLast = '';
  function asPost(force) {
    try {
      var snap = asSnapshot();
      var fp = asFingerprint(snap);
      if (!force && fp === asLast) return;
      asLast = fp;
      window.parent.postMessage(snap, '*');
    } catch (e) { /* never break the app */ }
  }
  setTimeout(function() { asPost(true); }, 0);
  setInterval(function() { asPost(false); }, 2000);
  // A run is starting and the editor asked for this frame's session. The app
  // keeps it in localStorage and refreshes it only while a Supabase client is
  // alive on the page — a frame parked on a page that never creates one (the
  // marketing homepage: getSupabase() is lazy) holds a session that quietly
  // expires, and the copy handed to the AI's browser is dead on arrival (that
  // browser is not allowed to rotate the user's tokens). So refresh it HERE,
  // on the app's own origin, against the app's own API, then report.
  var AS_REFRESH_WITHIN_S = 600;
  function asStoredSession() {
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (!k || !/^sb-[a-z0-9-]+-auth-token$/.test(k)) continue;
        var raw = window.localStorage.getItem(k);
        if (!raw) continue;
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && typeof parsed.refresh_token === 'string') return { key: k, session: parsed };
      }
    } catch (e) { /* storage blocked or not JSON */ }
    return null;
  }
  function asRefresh(cloud) {
    var found = asStoredSession();
    var url = cloud && typeof cloud.apiUrl === 'string' ? cloud.apiUrl : '';
    while (url.charAt(url.length - 1) === '/') url = url.slice(0, -1);
    var key = cloud && typeof cloud.anonKey === 'string' ? cloud.anonKey : '';
    if (!found || url.indexOf('https://') !== 0 || !key) { asPost(true); return; }
    var expiresAt = typeof found.session.expires_at === 'number' ? found.session.expires_at : null;
    if (expiresAt !== null && expiresAt - Date.now() / 1000 > AS_REFRESH_WITHIN_S) { asPost(true); return; }
    fetch(url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: found.session.refresh_token }),
    }).then(function(r) { return r.ok ? r.json() : null; }).then(function(next) {
      if (next && typeof next.access_token === 'string' && typeof next.refresh_token === 'string') {
        var merged = {}, k2;
        for (k2 in found.session) if (Object.prototype.hasOwnProperty.call(found.session, k2)) merged[k2] = found.session[k2];
        merged.access_token = next.access_token;
        merged.refresh_token = next.refresh_token;
        if (typeof next.token_type === 'string') merged.token_type = next.token_type;
        if (typeof next.expires_in === 'number') merged.expires_in = next.expires_in;
        merged.expires_at = typeof next.expires_at === 'number' ? next.expires_at
          : typeof next.expires_in === 'number' ? Math.floor(Date.now() / 1000) + next.expires_in : merged.expires_at;
        if (next.user && typeof next.user === 'object') merged.user = next.user;
        try { window.localStorage.setItem(found.key, JSON.stringify(merged)); } catch (e) { /* ignore */ }
      }
      asPost(true);
    }).catch(function() { asPost(true); });
  }

  // -------------------------------------------------------------------------
  // AI preview control. The editor posts one 'swarmz:ai_action' per step the
  // Kernel took in ITS headless session, only while the AI is actually
  // driving the page. A multiplayer-style cursor with the platform's name
  // on a small badge (msg.brand: "swarmz" or the white-label host's name)
  // glides to the element — a thin outline only when the target is a
  // control (a button, a field), never a scrolled section — and the step
  // is then PERFORMED
  // here too — the click opens the menu, the text lands in the field, the
  // route changes — so the user's preview shows exactly what the AI did.
  // EVERYTHING is performed, a form submit and Enter in a form included
  // (owner, 2026-09-17: "everything the AI does should show — every modal,
  // every popup, every widget"; the old submit guard hid the success widget
  // the AI had just opened). A click is the sequence a real mouse sends
  // (pointerover/down/up, mouse*, click) so pointerdown-driven menus open;
  // an Enter that the page did not handle submits the field's form or
  // presses the focused button, as the browser would. The AI's own session is a separate headless
  // browser, so a form wired to a real backend is submitted twice — the
  // Kernel prompt says so and submits only when asked to test the form.
  // Only a cross-origin link is left alone (the AI's session was fenced from
  // it too). A native <select> cannot be popped open by script in any
  // browser: it is focused and its value set, which is what shows. The cursor
  // leaves ~3s after the last step and at once on 'swarmz:ai_done' (owner,
  // 2026-09-17: "when the control session is done the mouse should go
  // away"). It never fights the user for the page: a look (screenshot,
  // read) shows nothing, a target already on screen is not scrolled to,
  // fields are focused without scrolling, and nothing scrolls right after
  // the user's own input. Parent-window messages only.
  // -------------------------------------------------------------------------
  var AI_ORANGE = '#FF6A2B';
  var aiLayer = null, aiBox = null, aiCursor = null, aiCursorSvg = null, aiTag = null;
  var aiHideTimer = null, aiIdleTimer = null, aiPlaced = false;
  function aiEnsure() {
    if (aiLayer) return;
    aiLayer = document.createElement('div');
    aiLayer.setAttribute('data-swarmz-ai-mirror', '1');
    aiLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646;opacity:0;transition:opacity .22s ease';
    aiBox = document.createElement('div');
    aiBox.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;border:1.5px solid rgba(255,106,43,.75);border-radius:6px;opacity:0;transition:left .38s cubic-bezier(.22,1,.36,1),top .38s cubic-bezier(.22,1,.36,1),width .38s cubic-bezier(.22,1,.36,1),height .38s cubic-bezier(.22,1,.36,1),opacity .2s ease';
    aiCursor = document.createElement('div');
    aiCursor.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-200px,-200px);transition:transform .55s cubic-bezier(.22,1,.36,1);filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))';
    aiCursorSvg = document.createElement('div');
    aiCursorSvg.style.cssText = 'width:30px;height:30px;transform-origin:5px 4px;transition:transform .14s ease';
    aiCursorSvg.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="' + AI_ORANGE + '" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"><path d="M4.5 3l7.2 17 2.4-6.9 6.9-2.3z"/></svg>';
    aiTag = document.createElement('div');
    aiTag.style.cssText = 'position:absolute;left:24px;top:24px;background:' + AI_ORANGE + ';color:#ffffff;border-radius:999px;padding:3px 10px 4px;font-size:12px;font-weight:600;line-height:1.25;letter-spacing:.01em;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.22);font-family:system-ui,-apple-system,Segoe UI,sans-serif';
    aiCursor.appendChild(aiCursorSvg);
    aiCursor.appendChild(aiTag);
    aiLayer.appendChild(aiBox);
    aiLayer.appendChild(aiCursor);
    (document.documentElement || document.body).appendChild(aiLayer);
  }
  // How long a step waits for its target to render before it is abandoned.
  // Long enough for a route change plus a data fetch in the user's preview,
  // short enough that a genuinely missing element does not stall the queue.
  var AI_TARGET_WAIT_MS = 5000;
  var aiWaitTimer = null;
  function aiFind(msg) {
    var el = null;
    try { if (msg.cssPath) el = document.querySelector(msg.cssPath); } catch (e) { el = null; }
    if (!el && msg.rect && typeof msg.rect.top === 'number') {
      var x = msg.rect.left + msg.rect.width / 2 - window.scrollX;
      var y = msg.rect.top + msg.rect.height / 2 - window.scrollY;
      if (x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight) el = document.elementFromPoint(x, y);
    }
    if (el === aiLayer || (el && aiLayer && aiLayer.contains(el))) el = null;
    return el;
  }
  function aiExternalLink(el) {
    var a = el && el.closest ? el.closest('a[href]') : null;
    if (!a) return false;
    try { var u = new URL(a.getAttribute('href'), location.href); return u.origin !== location.origin || a.target === '_blank'; } catch (e) { return false; }
  }
  function aiSetValue(el, value) {
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, value); else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // A real mouse fires pointer events before the click. The generated apps'
  // menus (Radix dropdown-menu, select, popover…) open on pointerdown and
  // ignore a bare el.click() (owner, 2026-09-17: "dropdowns, menus, buttons,
  // widgets — when the AI clicks, the result must be seen by the user").
  function aiPointer(el, type, extra) {
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    var init = { bubbles: true, cancelable: true, composed: true, view: window, button: 0, buttons: type === 'pointerdown' || type === 'mousedown' ? 1 : 0,
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'mouse', isPrimary: true };
    if (extra) for (var k in extra) init[k] = extra[k];
    var ev;
    try { ev = type.indexOf('pointer') === 0 && typeof PointerEvent === 'function' ? new PointerEvent(type, init) : new MouseEvent(type, init); }
    catch (e) { ev = new MouseEvent(type, init); }
    return el.dispatchEvent(ev);
  }
  function aiPress(el) {
    aiPointer(el, 'pointerover'); aiPointer(el, 'pointerenter', { bubbles: false }); aiPointer(el, 'mouseover'); aiPointer(el, 'mousemove');
    var down = aiPointer(el, 'pointerdown');
    if (down) aiPointer(el, 'mousedown');
    try { if (el.focus && !(el.matches && el.matches(':focus'))) el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    aiPointer(el, 'pointerup'); aiPointer(el, 'mouseup');
    el.click();
  }
  function aiKey(spec, target) {
    var parts = String(spec).split('+');
    var key = parts[parts.length - 1];
    var init = { key: key === 'Space' ? ' ' : key, code: key.length === 1 ? 'Key' + key.toUpperCase() : key, bubbles: true, cancelable: true,
      shiftKey: parts.indexOf('Shift') >= 0, ctrlKey: parts.indexOf('Control') >= 0, altKey: parts.indexOf('Alt') >= 0, metaKey: parts.indexOf('Meta') >= 0 };
    var t = target || document.activeElement || document.body;
    var down = new KeyboardEvent('keydown', init);
    var allowed = t.dispatchEvent(down) && !down.defaultPrevented;
    t.dispatchEvent(new KeyboardEvent('keyup', init));
    if (!allowed) return;
    // The browser's default action, which a synthetic key never triggers:
    // Enter in a form field submits the form; Enter or Space on a button or
    // link presses it.
    var tag = t.tagName;
    if (key === 'Enter' && (tag === 'INPUT' || tag === 'SELECT') && t.form && t.type !== 'button' && t.type !== 'submit') {
      try { if (t.form.requestSubmit) t.form.requestSubmit(); else t.form.submit(); } catch (e) { /* ignore */ }
    } else if ((key === 'Enter' || key === 'Space') && (tag === 'BUTTON' || tag === 'A' || (tag === 'INPUT' && (t.type === 'button' || t.type === 'submit')) || t.getAttribute('role') === 'button')) {
      try { t.click(); } catch (e) { /* ignore */ }
    }
  }
  // Performs the step for real. 'skipped' only when the target is gone or
  // is a cross-origin link.
  function aiPerform(msg, el) {
    try {
      switch (msg.action) {
        case 'click': case 'dblclick':
          if (!el || aiExternalLink(el)) return 'skipped';
          aiPress(el); if (msg.action === 'dblclick') { aiPress(el); aiPointer(el, 'dblclick'); } return 'done';
        case 'hover':
          if (el) { aiPointer(el, 'pointerover'); aiPointer(el, 'pointerenter', { bubbles: false }); aiPointer(el, 'mouseover'); aiPointer(el, 'mouseenter', { bubbles: false }); aiPointer(el, 'pointermove'); aiPointer(el, 'mousemove'); }
          return 'done';
        case 'fill': case 'type': case 'clear':
          if (!el || !('value' in el)) return 'skipped';
          // A plain focus() scrolls the field into view: the cursor already
          // arrived, so never move the page under the user here.
          el.focus({ preventScroll: true });
          aiSetValue(el, msg.action === 'clear' ? '' : msg.action === 'type' ? (el.value || '') + (msg.text || '') : (msg.text || ''));
          return 'done';
        case 'select':
          if (!el || el.tagName !== 'SELECT') return 'skipped';
          try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
          for (var i = 0; i < el.options.length; i++) { if (el.options[i].value === msg.value || el.options[i].text === msg.value) { el.selectedIndex = i; break; } }
          el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'done';
        case 'check': case 'uncheck':
          if (!el) return 'skipped';
          if (el.tagName === 'INPUT') { if (el.checked !== (msg.action === 'check')) el.click(); } else aiPress(el);
          return 'done';
        case 'press':
          aiKey(msg.key || 'Enter', el);
          return 'done';
        case 'navigate':
          // Through the app's router: the user's page is never reloaded
          // for the AI (build 16).
          softNavigate(msg.path);
          return 'done';
        case 'back': history.back(); return 'done';
        // The AI reloading ITS page is not replayed: the user's page only
        // reloads when the user asks (build 16).
        case 'reload': return 'done';
        default: return 'done';
      }
    } catch (e) { return 'skipped'; }
  }
  function aiMoveTo(x, y) {
    if (!aiPlaced) {
      // First appearance: land near the target without a glide from off-screen.
      aiCursor.style.transition = 'none';
      aiCursor.style.transform = 'translate(' + (x + 90) + 'px,' + (y + 70) + 'px)';
      void aiCursor.offsetWidth;
      aiCursor.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1)';
      aiPlaced = true;
    }
    aiCursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    var flip = x + 170 > window.innerWidth;
    aiTag.style.left = flip ? 'auto' : '24px';
    aiTag.style.right = flip ? '8px' : 'auto';
  }
  // A native <select> cannot be popped open by script in any browser, so the
  // choice is shown the way a person would see it (owner, 2026-09-18: "he
  // never opened it, the item just appeared"): a dropdown with the real
  // options opens under the field, the cursor glides to the chosen one, it
  // highlights, the panel closes and the value lands (input + change).
  var aiMenu = null;
  function aiCloseMenu() {
    var menu = aiMenu;
    if (!menu) return;
    aiMenu = null;
    menu.style.opacity = '0'; menu.style.transform = 'translateY(-4px)';
    setTimeout(function() { try { menu.parentNode && menu.parentNode.removeChild(menu); } catch (e) { /* ignore */ } }, 180);
  }
  function aiShowSelect(msg, el) {
    var r = el.getBoundingClientRect();
    var chosen = -1;
    for (var i = 0; i < el.options.length; i++) { if (el.options[i].value === msg.value || el.options[i].text === msg.value) { chosen = i; break; } }
    aiCloseMenu();
    var menu = document.createElement('div');
    var width = Math.max(160, Math.min(r.width, window.innerWidth - r.left - 8));
    var below = r.bottom + 4 + 8 * 31 <= window.innerHeight || r.top < window.innerHeight - r.bottom;
    menu.style.cssText = 'position:absolute;left:' + Math.round(r.left) + 'px;' + (below ? 'top:' + Math.round(r.bottom + 4) + 'px;' : 'bottom:' + Math.round(window.innerHeight - r.top + 4) + 'px;') + 'width:' + Math.round(width) + 'px;box-sizing:border-box;background:#ffffff;color:#111111;border:1px solid rgba(0,0,0,.12);border-radius:8px;box-shadow:0 12px 32px rgba(0,0,0,.18);padding:4px;font:13px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;opacity:0;transform:translateY(-4px);transition:opacity .16s ease,transform .16s ease';
    var rows = {};
    var shown = 0;
    for (var j = 0; j < el.options.length && shown < 8; j++) {
      var option = el.options[j];
      var row = document.createElement('div');
      row.textContent = option.text || option.value || ' ';
      row.style.cssText = 'padding:6px 10px;border-radius:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .12s ease,color .12s ease' + (j === el.selectedIndex ? ';color:#777777' : '');
      menu.appendChild(row); rows[j] = row; shown++;
    }
    aiLayer.appendChild(menu); aiMenu = menu;
    void menu.offsetWidth; menu.style.opacity = '1'; menu.style.transform = 'translateY(0)';
    var target = chosen >= 0 ? rows[chosen] : null;
    setTimeout(function() {
      if (!target) return;
      var tr = target.getBoundingClientRect();
      aiMoveTo(tr.left + Math.min(tr.width - 12, 28), tr.top + tr.height * 0.55);
    }, 260);
    setTimeout(function() {
      if (target) { target.style.background = AI_ORANGE; target.style.color = '#ffffff'; }
      aiCursorSvg.style.transform = 'scale(.82)';
      setTimeout(function() { aiCursorSvg.style.transform = 'scale(1)'; }, 150);
    }, 860);
    setTimeout(function() {
      if (aiMenu === menu) aiCloseMenu();
      aiPerform(msg, el);
      var rr = el.getBoundingClientRect();
      aiMoveTo(rr.left + Math.min(rr.width - 10, Math.max(10, rr.width * 0.62)), rr.top + Math.min(rr.height - 6, Math.max(6, rr.height * 0.58)));
    }, 1250);
  }
  function aiPlace(msg, el) {
    var r = el ? el.getBoundingClientRect() : null;
    var hasRect = !!r && r.width > 0 && r.height > 0;
    // Outline only a control-sized target (a button, a field, a link) —
    // never a scrolled area or a page-sized element, whose outline wrapped
    // most of the viewport in orange. (A capture never gets here: a look
    // shows nothing, see aiShow.)
    var outline = hasRect && msg.action !== 'scroll' && r.width < window.innerWidth * 0.7 && r.height < window.innerHeight * 0.5;
    if (hasRect) { var pt = aiPoint(r); aiMoveTo(pt.x, pt.y); }
    else aiMoveTo(Math.round(window.innerWidth * 0.5), Math.round(window.innerHeight * 0.45));
    if (outline) {
      aiBox.style.left = (r.left - 3) + 'px';
      aiBox.style.top = (r.top - 3) + 'px';
      aiBox.style.width = (r.width + 6) + 'px';
      aiBox.style.height = (r.height + 6) + 'px';
      aiBox.style.opacity = '1';
    } else {
      aiBox.style.opacity = '0';
    }
    aiTag.textContent = msg.brand || 'swarmz';
    // Act once the cursor has arrived (the glide is .55s).
    setTimeout(function() {
      aiCursorSvg.style.transform = 'scale(.82)';
      setTimeout(function() { aiCursorSvg.style.transform = 'scale(1)'; }, 150);
      if (msg.action === 'select' && el && el.tagName === 'SELECT') aiShowSelect(msg, el);
      else if (msg.action !== 'scroll') aiPerform(msg, el);
    }, 600);
  }
  // The AI starts driving from its route. Build 16 never reloads for it
  // (owner, 2026-10-24: the preview only refreshes when the user asks): a
  // different page opens through the app's router, the same page stays as
  // it is. Older editor tabs still send this, so it must stay soft too.
  function aiReset(path) {
    try {
      aiDone();
      if (softSamePath(path) && path.split(/[?#]/)[0] !== location.pathname) softNavigate(path);
    } catch (e) { /* never break the app */ }
  }
  // The AI is ahead of this page: it already has the dashboard while the
  // preview is still painting it, so resolving the target ONCE dropped the
  // step and the run looked like it clicked nothing (owner, 2026-09-19: "he
  // clicked in the void again"). Poll for the element instead, and only give
  // up when it truly never arrives.
  function aiFindWait(msg, deadline, cb) {
    var el = aiFind(msg);
    if (el || !msg.cssPath || Date.now() >= deadline) { cb(el); return; }
    aiWaitTimer = setTimeout(function () { aiFindWait(msg, deadline, cb); }, 120);
  }
  // A look — a screenshot, a page read — changes nothing on the AI's page,
  // so nothing shows here either: no cursor, no frame, and never a scroll
  // (the editor no longer replays them; this covers an older editor tab).
  var AI_LOOK_ONLY = { capture: 1, screenshot: 1, read: 1, snapshot: 1 };
  function aiShow(msg) {
    if (AI_LOOK_ONLY[msg.action] === 1) return;
    aiEnsure();
    clearTimeout(aiHideTimer);
    clearTimeout(aiIdleTimer);
    clearTimeout(aiWaitTimer);
    aiFindWait(msg, Date.now() + AI_TARGET_WAIT_MS, function (el) { aiShowResolved(msg, el); });
  }
  // The mirror never fights the user for the page. Their own wheel, touch,
  // pointer or key input in the last few seconds means they are reading or
  // using the preview: steps still run (the click, the typing), the page just
  // does not scroll for them. Trusted input only: the replayed pointer and
  // key events below are synthetic and never count.
  var AI_USER_QUIET_MS = 4000;
  var aiUserAt = 0;
  var aiUserInput = function(e) { if (e && e.isTrusted) aiUserAt = Date.now(); };
  window.addEventListener('wheel', aiUserInput, { capture: true, passive: true });
  window.addEventListener('touchstart', aiUserInput, { capture: true, passive: true });
  window.addEventListener('pointerdown', aiUserInput, true);
  window.addEventListener('keydown', aiUserInput, true);
  // Where the cursor lands on a target (also the point that must be visible).
  function aiPoint(r) {
    return { x: r.left + Math.min(r.width - 10, Math.max(10, r.width * 0.62)), y: r.top + Math.min(r.height - 6, Math.max(6, r.height * 0.58)) };
  }
  function aiInView(el) {
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    if (!r || !(r.width > 0) || !(r.height > 0)) return false;
    var p = aiPoint(r);
    if (p.x < 0 || p.y < 0 || p.x > window.innerWidth || p.y > window.innerHeight) return false;
    // On screen but clipped by a scrolled container or covered: what shows
    // at that point is not the target, so it still needs bringing into view.
    var hit = document.elementFromPoint ? document.elementFromPoint(p.x, p.y) : null;
    return !hit || hit === el || (!!el.contains && el.contains(hit));
  }
  // Brings the step's target into view the way the AI's own browser did: only
  // when it is off-screen (a scroll step always — scrolling IS that step),
  // and never right after the user's own input. True when it scrolled.
  function aiScrollTo(msg, el) {
    if (Date.now() - aiUserAt < AI_USER_QUIET_MS) return false;
    try {
      if (el) {
        if (msg.action !== 'scroll' && aiInView(el)) return false;
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        return true;
      }
      if (typeof msg.scrollY === 'number') {
        try { window.scrollTo({ top: msg.scrollY, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, msg.scrollY); }
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }
  function aiShowResolved(msg, el) {
    // A step whose target never appears on THIS page must not drag the cursor
    // to the middle of the screen and mime a click on nothing.
    if (!el && msg.cssPath) { aiIdleTimer = setTimeout(aiDone, 3200); return; }
    aiLayer.style.opacity = '1';
    var delay = aiScrollTo(msg, el) ? 420 : 0;
    setTimeout(function() { aiPlace(msg, el); }, delay);
    aiHideTimer = setTimeout(function() { aiBox.style.opacity = '0'; }, typeof msg.holdMs === 'number' ? msg.holdMs : 2400);
    // Steps arrive ~1.1s apart (2.6s after a route change) while the AI is
    // driving; once they stop, the cursor leaves.
    aiIdleTimer = setTimeout(aiDone, 3200);
  }
  function aiDone() {
    clearTimeout(aiWaitTimer);
    if (!aiLayer) return;
    clearTimeout(aiHideTimer);
    aiCloseMenu();
    aiLayer.style.opacity = '0';
    aiBox.style.opacity = '0';
    aiPlaced = false;
  }
  window.addEventListener('message', function(e) {
    try {
      if (e.source !== window.parent || !e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'swarmz:ai_action') aiShow(e.data);
      else if (e.data.type === 'swarmz:ai_done') aiDone();
      else if (e.data.type === 'swarmz:app_state_request') asPost(true);
      else if (e.data.type === 'swarmz:app_state_refresh') asRefresh(e.data.cloud);
      else if (e.data.type === 'swarmz:ai_reset') aiReset(e.data.path);
      else if (e.data.type === 'swarmz:soft_reload') softReload();
      else if (e.data.type === 'swarmz:soft_navigate') softNavigate(e.data.path);
      else if (e.data.type === 'swarmz:load_visual_script') loadVisualScript();
    } catch (err) { /* never break the app */ }
  });

  // -------------------------------------------------------------------------
  // Phone page swipe (build 17). On a phone the editor pages Chat, Preview and
  // Code by a sideways swipe, but this frame swallows every touch on it, so
  // Preview could only page from two thin strips over its edges. Once the
  // editor turns this on (swarmz:swipe_config: a phone, on the Preview page),
  // a one-finger swipe that locks sideways within 6 px and that nothing in the
  // app owns is forwarded (swarmz:swipe start / move / end / cancel) and the
  // browser's own pan is prevented. Vertical scrolling and every sideways
  // gesture the app owns (a scroller that can still move that way, carousels,
  // sliders, text fields, canvases and maps, touch-action handlers,
  // data-swipe-ignore) stay the app's. Positions are SCREEN coordinates: the
  // editor slides this frame with the finger, so frame coordinates would
  // stand still. The blocking touchmove listener exists only while it is on.
  // -------------------------------------------------------------------------
  if (!window.__swarmzPageSwipe) {
    window.__swarmzPageSwipe = 1;
    var swOn = false;
    var swG = null;
    var SW_OWNED = '[data-swipe-ignore],[data-pager-ignore],input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="slider"],[aria-roledescription="carousel"],.swiper,.embla,.keen-slider,.slick-slider,.splide,.glide,.flickity-enabled,.leaflet-container,.mapboxgl-map,.maplibregl-map,.gm-style,canvas,video,[draggable="true"]';
    var swPost = function(phase, x, y, t) {
      try { window.parent.postMessage({ type: 'swarmz:swipe', phase: phase, x: x, y: y, t: t }, '*'); } catch (e) { /* ignore */ }
    };
    var swReady = function() {
      try { window.parent.postMessage({ type: 'swarmz:swipe_ready', v: 1 }, '*'); } catch (e) { /* ignore */ }
    };
    var swPoint = function(t) {
      var ok = typeof t.screenX === 'number' && isFinite(t.screenX) && typeof t.screenY === 'number' && isFinite(t.screenY);
      return ok ? { x: t.screenX, y: t.screenY } : { x: t.clientX, y: t.clientY };
    };
    // dirX is 1 when the finger moves left (the content would scroll right).
    var swScrollsX = function(n, cs, dirX) {
      if (cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') return false;
      var max = n.scrollWidth - n.clientWidth;
      if (max <= 1) return false;
      if (cs.direction === 'rtl') return true;
      return dirX > 0 ? n.scrollLeft < max - 1 : n.scrollLeft > 1;
    };
    var swOwned = function(el, dirX) {
      for (var n = el; n && n.nodeType === 1 && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        if (n.matches && n.matches(SW_OWNED)) return true;
        var cs = window.getComputedStyle ? window.getComputedStyle(n) : null;
        if (!cs) continue;
        if (cs.touchAction && cs.touchAction !== 'auto' && cs.touchAction !== 'manipulation') return true;
        if (swScrollsX(n, cs, dirX)) return true;
      }
      return false;
    };
    var swEnd = function(e, cancel) {
      var g = swG;
      swG = null;
      if (!g || !g.on) return;
      var t = !cancel && e && e.changedTouches && e.changedTouches[0];
      var p = t ? swPoint(t) : { x: 0, y: 0 };
      swPost(cancel ? 'cancel' : 'end', p.x, p.y, e ? e.timeStamp : 0);
    };
    // Decided once, on the first move past 6 px: clearly sideways, still
    // cancelable (the browser has not started its own pan) and owned by
    // nothing in the app, or the gesture is the page's.
    var swClaim = function(g, dx, dy, e) {
      var ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax * ax + ay * ay < 36) return false;
      swG = null;
      if (ax <= ay * 1.2 || e.cancelable === false || swOwned(g.el, dx < 0 ? 1 : -1)) return false;
      g.on = true;
      swG = g;
      swPost('start', g.x0, g.y0, g.t0);
      return true;
    };
    var swMove = function(e) {
      var g = swG;
      if (!g) return;
      if (!e.touches || e.touches.length !== 1) { swEnd(e, true); return; }
      var p = swPoint(e.touches[0]);
      if (!g.on && !swClaim(g, p.x - g.x0, p.y - g.y0, e)) return;
      if (e.cancelable) e.preventDefault();
      swPost('move', p.x, p.y, e.timeStamp);
    };
    var swStart = function(e) {
      // A second finger ends a forwarded swipe here (the browser reports the
      // new touch first): tell the editor, so its pager settles at once.
      var was = swG;
      swG = null;
      if (was && was.on) swPost('cancel', 0, 0, e.timeStamp);
      if (!swOn || !e.touches || e.touches.length !== 1) return;
      try {
        var sel = window.getSelection && window.getSelection();
        if (sel && !sel.isCollapsed && String(sel)) return;
      } catch (er) { /* ignore */ }
      var p = swPoint(e.touches[0]);
      swG = { x0: p.x, y0: p.y, t0: e.timeStamp, el: e.target, on: false };
    };
    var swSet = function(on) {
      if (on === swOn) return;
      if (!on && swG && swG.on) swPost('cancel', 0, 0, 0);
      swOn = on;
      swG = null;
      try {
        if (on) window.addEventListener('touchmove', swMove, { passive: false, capture: true });
        else window.removeEventListener('touchmove', swMove, { capture: true });
      } catch (e) { /* ignore */ }
    };
    window.addEventListener('message', function(e) {
      try {
        if (e.source !== window.parent || !e.data || e.data.type !== 'swarmz:swipe_config') return;
        swSet(e.data.enabled === true);
        swReady();
      } catch (err) { /* never break the app */ }
    });
    window.addEventListener('touchstart', swStart, { passive: true, capture: true });
    window.addEventListener('touchend', function(e) { swEnd(e, false); }, { passive: true, capture: true });
    window.addEventListener('touchcancel', function(e) { swEnd(e, true); }, { passive: true, capture: true });
    swReady();
  }
})();