(function() {
  var VERSION = 'swarmz-visual@2026-07-03/snapdom-crop-align';
  if (window.__swarmzVisualMode) {
    console.log('[swarmz-visual] already running:', window.__swarmzVisualMode);
    return;
  }
  window.__swarmzVisualMode = VERSION;
  var active = false; // selection listeners attached only while true
  // Comment mode reuses the same selection listeners as visual mode, but a click
  // emits swarmz:comment_element_selected (for the preview-comments feature)
  // instead of running the visual-edit selection side-effects.
  //
  // VISUAL_ON / COMMENT_ON are independent intents, each owned solely by its
  // own message type (swarmz:visual_mode / swarmz:comment_mode). The parent
  // posts both messages in one commit when switching modes, and the order
  // between them is not guaranteed to leave active correct if enable()/
  // disable() were called directly from each handler — e.g. entering Visual
  // from Comment posts visual_mode{true} then comment_mode{false}; a naive
  // "last message wins" would call disable() and leave the machine off even
  // though Visual should stay on. Deriving active from the OR of both
  // intents via syncActive() makes the end state independent of message
  // order.
  var VISUAL_ON = false;
  var COMMENT_ON = false;
  console.log('[swarmz-visual] booted (idle)', VERSION);

  // -------------------------------------------------------------------------
  // Same-origin snapdom loader — the IIFE build is provisioned into the pod at
  // public/__swarmz_snapdom.js (useVisualEditMode.ensureInjected), fetched
  // same-origin and evaluated INSIDE the preview so element snapshots
  // rasterize locally with the browser's own renderer: instant, faithful to
  // the signed-in view, and immune to the modern-CSS parsing failures that
  // killed html2canvas. Loaded lazily on first snapshot.
  // -------------------------------------------------------------------------
  var __sdPromise = null;
  function loadSnapdom() {
    if (window.snapdom) return Promise.resolve(window.snapdom);
    if (__sdPromise) return __sdPromise;
    __sdPromise = fetch('/__swarmz_snapdom.js')
      .then(function(r) {
        if (!r.ok) throw new Error('snapdom fetch failed: ' + r.status);
        return r.text();
      })
      .then(function(code) {
        var s = document.createElement('script');
        s.textContent = code;
        document.head.appendChild(s);
        if (!window.snapdom) throw new Error('snapdom failed to load');
        return window.snapdom;
      });
    return __sdPromise;
  }

  // Smallest ancestor that fully contains the element PLUS its context margin.
  // Rasterizing a small container takes tens of ms; rasterizing the whole body
  // would take seconds on a long page — so walk up only as far as needed and
  // stop before regions get huge.
  function pickContextContainer(el) {
    var er = el.getBoundingClientRect();
    var padX = Math.min(80, Math.max(24, er.width * 0.3));
    var padY = Math.min(64, Math.max(20, er.height * 0.3));
    var needW = Math.max(200, er.width + padX * 2);
    var needH = Math.max(120, er.height + padY * 2);
    var best = el;
    var cur = el.parentElement;
    for (var hops = 0; cur && cur !== document.documentElement && hops < 15; hops++, cur = cur.parentElement) {
      // Never cross a SCROLLED ancestor: the rasterizer clones the DOM and a
      // clone's internal scroll state is not trustworthy, so cropping by
      // visual rect deltas across a scrolled container lands on the wrong
      // area. Stop below it — worst case we capture the element alone, which
      // is always geometrically exact.
      if (cur.scrollTop > 0 || cur.scrollLeft > 0) break;
      var r = cur.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.width * r.height > 4000000 && best !== el) break; // keep the smaller pick
      best = cur;
      if (r.width >= needW && r.height >= needH) break;
    }
    return best;
  }

  // -------------------------------------------------------------------------
  // Overlay layer (pointer-events:none so it never receives events)
  // -------------------------------------------------------------------------
  var LAYER_ID = '__swarmz_visual_layer';
  var layer = document.createElement('div');
  layer.id = LAYER_ID;
  layer.style.cssText = [
    'position:fixed','top:0','left:0','width:100vw','height:100vh',
    'pointer-events:none','z-index:2147483640','margin:0','padding:0',
  ].join(';');
  // layer is appended by enable(); while idle there is no editor DOM in the page.

  var ACCENT = '#C85A1E';

  var hoverBox = document.createElement('div');
  hoverBox.style.cssText = [
    'position:absolute','box-sizing:border-box',
    'border:1.5px solid ' + ACCENT,
    'background:rgba(200,90,30,0.06)',
    'display:none','pointer-events:none',
    'will-change:transform,width,height',
  ].join(';');
  layer.appendChild(hoverBox);

  var hoverLabel = document.createElement('div');
  hoverLabel.style.cssText = [
    'position:absolute','display:none','pointer-events:none',
    'background:' + ACCENT,'color:#fff','white-space:nowrap',
    'font:600 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
    'padding:3px 5px','border-radius:3px 3px 3px 0',
    'letter-spacing:0.02em',
  ].join(';');
  layer.appendChild(hoverLabel);

  // -------------------------------------------------------------------------
  // Selectability — only visible HTML tag elements, never our own UI
  // -------------------------------------------------------------------------
  var IGNORED = new Set([
    'HTML','BODY','HEAD','SCRIPT','STYLE','LINK','META','TITLE','NOSCRIPT',
    'BASE','TEMPLATE','SLOT',
  ]);
  var TEXT_TAGS = new Set([
    'P','H1','H2','H3','H4','H5','H6','SPAN','A','BUTTON','LABEL','LI','TD','TH','CAPTION',
    'EM','STRONG','I','B','U','SMALL','MARK','SUB','SUP','BLOCKQUOTE','CODE','PRE','CITE',
    'Q','KBD','SAMP','VAR','TIME','ABBR','DT','DD','FIGCAPTION','SUMMARY','LEGEND',
  ]);

  function isOwnUI(el) {
    if (!el) return false;
    if (el.id === LAYER_ID) return true;
    if (typeof el.closest === 'function') return !!el.closest('#' + LAYER_ID);
    return false;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function isSvgInternal(el) {
    // Anything inside an <svg> (path, g, rect, etc.) — but not the <svg> root itself
    return el && el.namespaceURI === SVG_NS && el.tagName && el.tagName.toLowerCase() !== 'svg';
  }

  function isSelectable(el) {
    if (!el || el.nodeType !== 1 || !el.tagName) return false;
    if (IGNORED.has(el.tagName.toUpperCase())) return false;
    if (isOwnUI(el)) return false;
    if (isSvgInternal(el)) return false; // treat whole <svg> as one selectable unit
    var rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    return true;
  }

  // First selectable descendant — the way to drill INTO an element after
  // click-selection promoted up to the outer block (e.g. reach the text span
  // inside a button). Prefers a direct child, then recurses.
  function firstSelectableChild(el) {
    if (!el) return null;
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) {
      if (isSelectable(kids[i])) return kids[i];
    }
    for (var j = 0; j < kids.length; j++) {
      var deep = firstSelectableChild(kids[j]);
      if (deep) return deep;
    }
    return null;
  }

  function safeClassName(el) {
    // SVG className is SVGAnimatedString, not a plain string
    var cn = el.className;
    if (typeof cn === 'string') return cn;
    if (cn && typeof cn.baseVal === 'string') return cn.baseVal;
    return '';
  }

  // -------------------------------------------------------------------------
  // Element ID system — stable data attribute so the parent can address
  // elements without escaping Tailwind selectors like bg-[#fff]
  // -------------------------------------------------------------------------
  var nextId = 1;
  var idMap = new WeakMap();

  function getElementId(el) {
    if (idMap.has(el)) return idMap.get(el);
    var id = '__swarmz_' + (nextId++);
    el.setAttribute('data-swarmz-id', id);
    idMap.set(el, id);
    return id;
  }

  function findById(id) {
    return document.querySelector('[data-swarmz-id="' + id + '"]');
  }

  function getDisplaySelector(el) {
    var tag = el.tagName.toLowerCase();
    if (el.id) return tag + '#' + el.id;
    var cls = Array.from(el.classList)
      .filter(function(c) { return c.indexOf('[') === -1 && c.indexOf('__swarmz') === -1; })
      .slice(0, 2);
    return cls.length ? tag + '.' + cls.join('.') : tag;
  }

  // Human-readable, reload-stable CSS path (e.g. "#top > div:nth-of-type(2) > h1")
  // — used where a selector is PERSISTED or shown to a person (element comments).
  // getElementId's __swarmz_N ids are per-page-load counters, so they'd be
  // meaningless in a stored comment or a chat card.
  function cssPath(el) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      var tag = node.tagName.toLowerCase();
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      var idx = 1;
      var sib = node.previousElementSibling;
      while (sib) { if (sib.tagName === node.tagName) idx++; sib = sib.previousElementSibling; }
      var ambiguous = idx > 1;
      if (!ambiguous) {
        var after = node.nextElementSibling;
        while (after) { if (after.tagName === node.tagName) { ambiguous = true; break; } after = after.nextElementSibling; }
      }
      parts.unshift(ambiguous ? tag + ':nth-of-type(' + idx + ')' : tag);
      if (tag === 'body') break;
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  // -------------------------------------------------------------------------
  // React source detection — used by source-mapper to write changes back
  // to JSX files. Walks the FIBER chain only (component composition), never
  // the DOM chain.
  // -------------------------------------------------------------------------
  var SOURCE_SKIP = /(\/node_modules\/|\/\.vite\/|\/react-dom\.|\/react\.development\.|\/react\.production\.|__swarmz_visual)/;
  function parseStackForUserFrame(stack) {
    if (!stack || typeof stack !== 'string') return null;
    var lines = stack.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/(https?:\/\/[^):\s]+):(\d+):(\d+)/);
      if (!m) continue;
      if (SOURCE_SKIP.test(m[1])) continue;
      try {
        var path = new URL(m[1]).pathname;
        if (!/\.(tsx?|jsx?)$/i.test(path)) continue;
        return { fileName: path, lineNumber: parseInt(m[2], 10) || 1, columnNumber: parseInt(m[3], 10) || 1 };
      } catch (_) {}
    }
    return null;
  }
  function getFiber(el) {
    if (!el) return null;
    var keys = Object.getOwnPropertyNames(el);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('__reactFiber$') === 0 || keys[i].indexOf('__reactInternalInstance$') === 0) {
        return el[keys[i]];
      }
    }
    return null;
  }
  function getReactSource(el) {
    try {
      var fiber = getFiber(el);
      while (fiber) {
        if (fiber._debugSource && fiber._debugSource.fileName) {
          return {
            fileName: fiber._debugSource.fileName,
            lineNumber: fiber._debugSource.lineNumber || 1,
            columnNumber: fiber._debugSource.columnNumber || 1,
          };
        }
        if (fiber._debugStack && fiber._debugStack.stack) {
          var fromStack = parseStackForUserFrame(fiber._debugStack.stack);
          if (fromStack) return fromStack;
        }
        fiber = fiber.return;
      }
    } catch (_) {}
    return null;
  }

  // Source file for THIS element's OWN fiber (no walking up the fiber chain).
  // Used to detect component boundaries — when adjacent DOM elements come
  // from different source files, they belong to different React components.
  var __ownSrcCache = new WeakMap();
  function getOwnSourceFile(el) {
    if (!el || el.nodeType !== 1) return null;
    if (__ownSrcCache.has(el)) return __ownSrcCache.get(el);
    var out = null;
    try {
      var fiber = getFiber(el);
      if (fiber) {
        if (fiber._debugSource && fiber._debugSource.fileName) {
          out = fiber._debugSource.fileName;
        } else if (fiber._debugStack && fiber._debugStack.stack) {
          var s = parseStackForUserFrame(fiber._debugStack.stack);
          if (s) out = s.fileName;
        }
      }
    } catch (_) {}
    __ownSrcCache.set(el, out);
    return out;
  }

  // The "page file" is whichever user-code source file has the MOST DOM
  // elements in the rendered tree — i.e., the file the user is currently
  // editing. Library wrappers like RevealLines only contribute a handful
  // of elements so they never win. Computed once per script lifetime.
  var __pageFile;
  function getPageFile() {
    if (__pageFile !== undefined) return __pageFile;
    var counts = Object.create(null);
    var winner = null;
    var winnerCount = 0;
    var scanned = 0;
    function visit(node) {
      if (!node || node.nodeType !== 1 || scanned > 1500) return;
      if (!isOwnUI(node) && node.tagName && !IGNORED.has(node.tagName.toUpperCase())) {
        scanned++;
        var src = getOwnSourceFile(node);
        if (src && !SOURCE_SKIP.test(src)) {
          counts[src] = (counts[src] || 0) + 1;
          if (counts[src] > winnerCount) { winner = src; winnerCount = counts[src]; }
        }
      }
      var kids = node.children;
      for (var i = 0; i < kids.length; i++) visit(kids[i]);
    }
    if (document.body) visit(document.body);
    __pageFile = winner;
    console.log('[swarmz-visual] page file:', winner, 'count:', winnerCount);
    return winner;
  }

  // -------------------------------------------------------------------------
  // Computed style snapshot for the properties panel
  // -------------------------------------------------------------------------
  function getComputedProps(el) {
    var s = window.getComputedStyle(el);
    return {
      width: s.width, height: s.height,
      minWidth: s.minWidth, maxWidth: s.maxWidth, minHeight: s.minHeight, maxHeight: s.maxHeight,
      padding: s.padding, paddingTop: s.paddingTop, paddingRight: s.paddingRight, paddingBottom: s.paddingBottom, paddingLeft: s.paddingLeft,
      margin: s.margin, marginTop: s.marginTop, marginRight: s.marginRight, marginBottom: s.marginBottom, marginLeft: s.marginLeft,
      display: s.display, flexDirection: s.flexDirection, justifyContent: s.justifyContent, alignItems: s.alignItems, gap: s.gap,
      position: s.position, top: s.top, right: s.right, bottom: s.bottom, left: s.left,
      backgroundColor: s.backgroundColor, opacity: s.opacity, overflow: s.overflow,
      flexWrap: s.flexWrap, columnGap: s.columnGap, rowGap: s.rowGap,
      borderWidth: s.borderWidth, borderTopWidth: s.borderTopWidth, borderColor: s.borderColor, borderTopColor: s.borderTopColor,
      borderStyle: s.borderStyle, borderTopStyle: s.borderTopStyle, borderRadius: s.borderRadius,
      fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, fontStyle: s.fontStyle,
      lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textAlign: s.textAlign, textDecoration: s.textDecoration,
      color: s.color, transform: s.transform,
    };
  }

  // -------------------------------------------------------------------------
  // Hover state
  // -------------------------------------------------------------------------
  var hovered = null;

  function paintHover(el) {
    if (!el) {
      hoverBox.style.display = 'none';
      hoverLabel.style.display = 'none';
      return;
    }
    var r = el.getBoundingClientRect();
    hoverBox.style.display = 'block';
    hoverBox.style.left = r.left + 'px';
    hoverBox.style.top = r.top + 'px';
    hoverBox.style.width = r.width + 'px';
    hoverBox.style.height = r.height + 'px';

    // Comment mode: outline only — the tag-name label is a visual-edit affordance.
    if (COMMENT_ON && !VISUAL_ON) {
      hoverLabel.style.display = 'none';
      return;
    }
    hoverLabel.style.display = 'block';
    hoverLabel.textContent = el.tagName.toLowerCase();
    // Prefer label above the box; flip below if no headroom
    var labelHeight = 16;
    var aboveTop = r.top - labelHeight;
    var useAbove = aboveTop >= 2;
    hoverLabel.style.left = Math.max(2, r.left) + 'px';
    hoverLabel.style.top = (useAbove ? aboveTop : r.top + 2) + 'px';
    hoverLabel.style.borderRadius = useAbove ? '3px 3px 3px 0' : '0 3px 3px 3px';
  }

  function setHover(el) {
    if (el === hovered) return;
    hovered = el;
    paintHover(el);
  }

  // -------------------------------------------------------------------------
  // Selection state
  // -------------------------------------------------------------------------
  var selected = new Set();

  function paintSelection(el) {
    el.style.outline = '2px solid ' + ACCENT;
    el.style.outlineOffset = '-1px';
  }

  function unpaintSelection(el) {
    el.style.outline = '';
    el.style.outlineOffset = '';
  }

  function buildElementData(el) {
    var rect = el.getBoundingClientRect();
    var fullText = el.textContent || '';
    var truncated = fullText.trim().slice(0, 80);
    var isTextTag = TEXT_TAGS.has(el.tagName.toUpperCase());
    var noElementChildren = el.children && el.children.length === 0;
    var textOnly = isTextTag && noElementChildren;
    return {
      selector: getElementId(el),
      displaySelector: getDisplaySelector(el),
      tagName: el.tagName,
      classList: Array.from(el.classList),
      id: el.id || '',
      computedStyles: getComputedProps(el),
      rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
      textContent: textOnly ? fullText : truncated,
      className: safeClassName(el),
      hasOnlyTextChildren: textOnly,
      source: getReactSource(el),
    };
  }

  function selectElement(el) {
    if (!isSelectable(el)) return;
    selected.add(el);
    paintSelection(el);
    var data = buildElementData(el);
    data.type = 'swarmz:element_selected';
    window.parent.postMessage(data, '*');
  }

  function deselectElement(el) {
    if (!selected.has(el)) return;
    selected.delete(el);
    unpaintSelection(el);
    window.parent.postMessage({ type: 'swarmz:element_deselected', selector: getElementId(el) }, '*');
  }

  function clearSelection() {
    selected.forEach(function(el) { unpaintSelection(el); });
    selected.clear();
    window.parent.postMessage({ type: 'swarmz:selection_cleared' }, '*');
  }

  // -------------------------------------------------------------------------
  // Inline text editing — double-click a text-bearing element to edit its text
  // in place. Commit on Enter or click-away, cancel on Escape. The committed
  // text rides the same changeset/Apply path as the Typography "Content" field
  // (parent receives swarmz:text_edited). Only leaf text tags are editable, so
  // we never make a layout container contentEditable.
  // -------------------------------------------------------------------------
  var editing = false;
  var editingEl = null;
  var editOriginal = '';

  function isTextEditable(el) {
    if (!isSelectable(el)) return false;
    if (!TEXT_TAGS.has(el.tagName.toUpperCase())) return false;
    return !!el.children && el.children.length === 0;
  }

  function onEditBlur() { commitTextEdit(); }

  function enterTextEdit(el) {
    if (editing) commitTextEdit();
    if (!isTextEditable(el)) return;
    if (!selected.has(el)) { clearSelection(); selectElement(el); }
    editing = true;
    editingEl = el;
    editOriginal = el.textContent || '';
    // Record the original so swarmz:revert_changes (Discard) can restore it.
    var key = getElementId(el) + '::text-content';
    if (!window.__swarmzOriginalStyles[key]) {
      window.__swarmzOriginalStyles[key] = { el: el, property: 'text-content', original: editOriginal };
    }
    setHover(null);
    try { el.contentEditable = 'plaintext-only'; } catch (_) {}
    if (el.getAttribute('contenteditable') !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
    el.style.cursor = 'text';
    el.style.outline = '2px solid ' + ACCENT;
    el.style.outlineOffset = '-1px';
    el.addEventListener('blur', onEditBlur, true);
    el.focus();
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) {}
  }

  function finishTextEdit(el) {
    el.removeEventListener('blur', onEditBlur, true);
    el.removeAttribute('contenteditable');
    el.style.cursor = '';
    var sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    if (selected.has(el)) paintSelection(el);
  }

  function commitTextEdit() {
    if (!editing || !editingEl) return;
    var el = editingEl;
    var newText = el.textContent || '';
    editing = false;
    editingEl = null;
    finishTextEdit(el);
    if (newText === editOriginal) return; // nothing changed this session
    // Reconcile against the TRUE source original (recorded on first edit) rather
    // than this session's starting text, so editing back to the original removes
    // the pending change instead of leaving a phantom dirty state. Include the
    // React source so classless text (a bare <p>) can still be located on Apply.
    var key = getElementId(el) + '::text-content';
    var rec = window.__swarmzOriginalStyles[key];
    var trueOriginal = rec && typeof rec.original === 'string' ? rec.original : editOriginal;
    window.parent.postMessage({
      type: 'swarmz:text_edited',
      selector: getElementId(el),
      tagName: el.tagName,
      className: safeClassName(el),
      id: el.id || '',
      source: getReactSource(el),
      oldValue: trueOriginal,
      newValue: newText,
    }, '*');
  }

  function cancelTextEdit() {
    if (!editing || !editingEl) return;
    var el = editingEl;
    editing = false;
    editingEl = null;
    el.textContent = editOriginal;
    finishTextEdit(el);
  }

  // -------------------------------------------------------------------------
  // Resolve the selectable element at a cursor position, then promote to the
  // outer visual block so hovering anywhere on a button selects the BUTTON,
  // not the inner <span>. Promotion rules:
  //   - SVG internals always promote to the root <svg>
  //   - Walk up while parent has the same bounding box as the child (tight
  //     wrapper — span exactly filling its h1, etc.)
  //   - Walk up if parent has a single element child whose bounding box
  //     equals parent's CONTENT area (parent has padding but no siblings —
  //     button with px-4 wrapping a span)
  // -------------------------------------------------------------------------
  function rectsEqual(a, b, tol) {
    return Math.abs(a.width - b.width) <= tol && Math.abs(a.height - b.height) <= tol;
  }

  function contentArea(parent, parentRect) {
    var s = window.getComputedStyle(parent);
    var l = parseFloat(s.paddingLeft) || 0;
    var r = parseFloat(s.paddingRight) || 0;
    var t = parseFloat(s.paddingTop) || 0;
    var b = parseFloat(s.paddingBottom) || 0;
    return { width: parentRect.width - l - r, height: parentRect.height - t - b };
  }

  function promoteToOuterTag(el) {
    if (!el) return null;
    // SVG internals → root <svg>
    if (isSvgInternal(el)) {
      var svg = el.ownerSVGElement;
      if (svg && isSelectable(svg)) return svg;
    }
    if (!isSelectable(el)) return null;

    // Media elements are atomic selection units. An <img>/<video> is almost
    // always sized to fill a same-bbox wrapper (w-full h-full inside an
    // aspect-ratio div), which would otherwise promote the selection up to the
    // wrapper — the user wants the media element itself, not its container.
    var tag = el.tagName ? el.tagName.toUpperCase() : '';
    if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS' || tag === 'PICTURE') return el;

    var origSrc = getOwnSourceFile(el);

    var current = el;
    for (var safety = 0; safety < 12; safety++) {
      var parent = current.parentElement;
      if (!parent || !isSelectable(parent)) break;

      // Don't cross a component boundary during bbox promotion. If the
      // parent comes from a different source file it's part of a different
      // React component — keep promotion local to the current component.
      var parentSrc = getOwnSourceFile(parent);
      if (origSrc && parentSrc && parentSrc !== origSrc) break;

      var pr = parent.getBoundingClientRect();
      var cr = current.getBoundingClientRect();

      // Tight wrapper: parent has same bounds as child
      if (rectsEqual(pr, cr, 1)) { current = parent; continue; }

      // Padded single-child wrapper: child fills parent's content area
      var onlyChild = parent.children.length === 1 && parent.children[0] === current;
      if (onlyChild) {
        var ca = contentArea(parent, pr);
        if (Math.abs(ca.width - cr.width) <= 2 && Math.abs(ca.height - cr.height) <= 2) {
          current = parent; continue;
        }
      }
      break;
    }
    return current;
  }

  // Walk up the DOM until we find an ancestor whose own source file matches
  // the page file. If the hovered element is inside a library wrapper
  // (RevealLines, etc.), this jumps to the wrapping page-level element so
  // "Go to Code" lands in the file the user is actually editing.
  //
  // Subtlety: the null-source fallback that stops the walk only fires when
  // the ORIGINAL element also had no source. Without that guard, a click
  // inside a real section component (Footer.tsx, Header.tsx) walks past
  // the entire component and lands on the page's null-source root wrapper
  // — which is the whole page. With the guard, the walk falls through to
  // return the original element, and promoteToOuterTag handles the rest.
  function walkToPageFile(el) {
    var pageFile = getPageFile();
    if (!pageFile) return el;
    var origSrc = getOwnSourceFile(el);
    var current = el;
    for (var hops = 0; current && hops < 30; hops++, current = current.parentElement) {
      if (!isSelectable(current)) continue;
      var src = getOwnSourceFile(current);
      if (src === pageFile) return current;
      if (!src && !origSrc) return current;
    }
    return el;
  }

  function resolveAt(x, y) {
    var raw = document.elementFromPoint(x, y);
    if (!raw) return null;
    // If the topmost node is junk (head-injected, svg internal, etc.) walk up
    while (raw && !isSelectable(raw) && !isSvgInternal(raw)) {
      raw = raw.parentElement;
    }
    if (!raw) return null;
    if (isSvgInternal(raw)) {
      raw = raw.ownerSVGElement;
      if (!raw || !isSelectable(raw)) return null;
    }
    // Skip library-component internals: jump up to the nearest ancestor in
    // the page file the user is editing. VISUAL EDIT ONLY — it's a
    // "Go to Code" ergonomic. In comment mode it made everything inside a
    // section component (Header.tsx etc.) resolve to the whole <Header/>,
    // so individual components could never be picked; comments pin the
    // element the user is actually pointing at (still bbox-promoted below,
    // so a button's inner span picks the BUTTON).
    if (!(COMMENT_ON && !VISUAL_ON)) {
      raw = walkToPageFile(raw);
      if (!raw) return null;
    }
    return promoteToOuterTag(raw);
  }

  // -------------------------------------------------------------------------
  // Pointer + keyboard handlers
  // -------------------------------------------------------------------------
  function onPointerMove(e) {
    if (editing) return;
    setHover(resolveAt(e.clientX, e.clientY));
  }

  function onPointerLeave() {
    setHover(null);
  }

  function onClick(e) {
    if (editing) {
      // Click inside the editing element places the caret; click away commits.
      if (editingEl && editingEl.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      commitTextEdit();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    var el = resolveAt(e.clientX, e.clientY);
    if (!el) return;
    if (COMMENT_ON) {
      // Comment mode: report the picked element to the parent and stop — no
      // visual-edit selection outline / element_selected side-effects.
      // scroll + viewport let the editor turn the viewport-relative rect into
      // PAGE coordinates for the server-side snapshot's focused-area crop.
      var cr = el.getBoundingClientRect();
      window.parent.postMessage({
        type: 'swarmz:comment_element_selected',
        // selector = internal per-load id; cssPath is what gets persisted and
        // shown to people.
        selector: getElementId(el),
        cssPath: cssPath(el),
        rect: { top: cr.top, right: cr.right, bottom: cr.bottom, left: cr.left, width: cr.width, height: cr.height },
        scrollX: window.scrollX || 0,
        scrollY: window.scrollY || 0,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        tagName: el.tagName,
      }, '*');
      return;
    }
    var multi = e.metaKey || e.ctrlKey;
    if (multi) {
      if (selected.has(el)) deselectElement(el); else selectElement(el);
    } else {
      clearSelection();
      selectElement(el);
    }
  }

  function onDblClick(e) {
    var el = resolveAt(e.clientX, e.clientY);
    if (!el || !isTextEditable(el)) return;
    e.preventDefault();
    e.stopPropagation();
    enterTextEdit(el);
  }

  function onKeyDown(e) {
    if (editing) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); commitTextEdit(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelTextEdit(); }
      return;
    }
    if (e.key === 'Escape') {
      clearSelection();
      setHover(null);
    }
  }

  function swallowHover(e) { e.stopPropagation(); }

  // Pointer/keyboard listeners are attached by enable() (see below), not at
  // boot — the script stays idle until the parent sends swarmz:visual_mode
  // { enabled: true }. swallowHover suppresses hover-driven side effects
  // (link prefetch, dropdown menus) while editing.

  // -------------------------------------------------------------------------
  // Scroll / resize — keep selected element rects + hover overlay in sync
  // -------------------------------------------------------------------------
  var rafPending = false;
  function reposition() {
    rafPending = false;
    selected.forEach(function(el) {
      if (!el.isConnected) return;
      var r = el.getBoundingClientRect();
      window.parent.postMessage({
        type: 'swarmz:element_position',
        selector: getElementId(el),
        rect: { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height },
      }, '*');
    });
    if (hovered && hovered.isConnected) paintHover(hovered);
  }
  function scheduleReposition() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(reposition);
  }
  // scroll/resize listeners are attached by enable() (see below).

  // -------------------------------------------------------------------------
  // enable / disable — idempotent. Selection listeners exist ONLY while
  // active, so a resident-but-disabled script never highlights anything.
  // active itself is DERIVED from the VISUAL_ON / COMMENT_ON intents via
  // syncActive() (called from both mode-message handlers), so it doesn't
  // matter which of the two messages the parent sends last.
  // -------------------------------------------------------------------------
  function syncActive() {
    var want = VISUAL_ON || COMMENT_ON;
    if (want && !active) enable();
    else if (!want && active) disable();
  }

  function enable() {
    if (active) return;
    active = true;
    if (!layer.parentElement) document.documentElement.appendChild(layer);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerleave', onPointerLeave, true);
    document.addEventListener('mouseleave', onPointerLeave, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('dblclick', onDblClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mouseover', swallowHover, true);
    document.addEventListener('mouseenter', swallowHover, true);
    document.addEventListener('scroll', scheduleReposition, true);
    window.addEventListener('resize', scheduleReposition);
    console.log('[swarmz-visual] enabled');
  }

  function disable() {
    if (!active) return;
    active = false;
    if (editing) cancelTextEdit();
    document.removeEventListener('pointermove', onPointerMove, true);
    document.removeEventListener('pointerleave', onPointerLeave, true);
    document.removeEventListener('mouseleave', onPointerLeave, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('dblclick', onDblClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('mouseover', swallowHover, true);
    document.removeEventListener('mouseenter', swallowHover, true);
    document.removeEventListener('scroll', scheduleReposition, true);
    window.removeEventListener('resize', scheduleReposition);
    clearSelection();
    setHover(null);
    if (layer.parentElement) layer.parentElement.removeChild(layer);
    console.log('[swarmz-visual] disabled');
  }

  // -------------------------------------------------------------------------
  // Page tree serialization — a clean "Layers" outline for the editor sidebar:
  // only selectable elements, with the selectable descendants of a
  // non-selectable wrapper hoisted up to the nearest selectable ancestor (so
  // every node is directly selectable and the tree stays clean). Each node
  // carries just its id, tag and children — the panel renders an icon + the
  // element type from the tag alone. Both the emitted-node count and the total
  // elements scanned are capped so a huge or wrapper-heavy document can't
  // freeze the walk. Assigning data-swarmz-id is layout-neutral, so the
  // getBoundingClientRect reads in isSelectable() stay cheap across the walk.
  // -------------------------------------------------------------------------
  var TREE_CAP = 2000;
  var TREE_SCAN_CAP = 20000;

  function makeTreeNode(el, children) {
    return {
      selector: getElementId(el),
      tagName: el.tagName ? el.tagName.toLowerCase() : '',
      childCount: children.length,
      children: children,
    };
  }

  function buildTreeChildren(parent, st) {
    var out = [];
    var kids = parent.children;
    if (!kids) return out;
    for (var i = 0; i < kids.length; i++) {
      if (st.truncated) break;
      var child = kids[i];
      if (child.nodeType !== 1 || !child.tagName) continue;
      if (isOwnUI(child)) continue;
      if (IGNORED.has(child.tagName.toUpperCase())) continue;
      if (isSvgInternal(child)) continue; // whole <svg> is one selectable unit

      // Bound total traversal — only selectable nodes are counted, so without
      // this a wrapper-heavy subtree could be walked in full.
      st.scanned++;
      if (st.scanned > TREE_SCAN_CAP) { st.truncated = true; break; }

      if (isSelectable(child)) {
        if (st.count >= TREE_CAP) { st.truncated = true; break; }
        st.count++;
        out.push(makeTreeNode(child, buildTreeChildren(child, st)));
      } else {
        // Non-selectable wrapper — hoist its selectable descendants up so the
        // tree stays clean but nothing addressable is hidden.
        var hoisted = buildTreeChildren(child, st);
        for (var h = 0; h < hoisted.length; h++) out.push(hoisted[h]);
      }
    }
    return out;
  }

  function buildPageTree() {
    var st = { count: 0, scanned: 0, truncated: false };
    var roots = document.body ? buildTreeChildren(document.body, st) : [];
    return { roots: roots, nodeCount: st.count, truncated: st.truncated };
  }

  // -------------------------------------------------------------------------
  // Parent → iframe commands
  // -------------------------------------------------------------------------
  window.__swarmzOriginalStyles = window.__swarmzOriginalStyles || {};

  function onMessage(e) {
    var data = e.data;
    if (!data || typeof data !== 'object') return;

    switch (data.type) {
      case 'swarmz:visual_mode': {
        VISUAL_ON = !!data.enabled;
        syncActive();
        break;
      }

      case 'swarmz:clear_selection': {
        clearSelection();
        break;
      }

      case 'swarmz:comment_mode': {
        // Owned solely by this message — visual_mode never touches COMMENT_ON.
        // Reuses the visual-mode selection listeners; the click handler
        // branches on COMMENT_ON to emit swarmz:comment_element_selected
        // instead of running the visual-edit selection side-effects.
        COMMENT_ON = !!data.enabled;
        syncActive();
        break;
      }

      case 'swarmz:snapshot_element': {
        // Instant in-iframe capture: rasterize the element's context container
        // with snapdom, then crop the focused area around the element. Replies
        // with swarmz:element_snapshot { requestId, dataUrl | error }.
        var snapSel = data.selector;
        var snapReq = data.requestId;
        var snapEl = snapSel ? findById(snapSel) : null;
        // Per-load ids die on reload; the stable cssPath lets a request made
        // just before a reload (script auto-heal) still find its element.
        if (!snapEl && data.cssPath) {
          try { snapEl = document.querySelector(data.cssPath); } catch (_) {}
        }
        var snapReply = function(payload) {
          var msg = { type: 'swarmz:element_snapshot', selector: snapSel, requestId: snapReq };
          for (var k in payload) msg[k] = payload[k];
          try { window.parent.postMessage(msg, '*'); } catch (_) {}
        };
        if (!snapEl) { snapReply({ error: 'not_found' }); break; }
        loadSnapdom().then(function(sd) {
          var target = pickContextContainer(snapEl);
          // Never bake our own editor overlay into the shot.
          var hidLayer = target === document.body || target.contains(layer);
          if (hidLayer) layer.style.display = 'none';
          // Measure BOTH rects now, in the same frame the clone is taken —
          // measuring the element after the (async) rasterize let entrance
          // animations shift the page in between, skewing the crop offset.
          var tr = target.getBoundingClientRect();
          var er = snapEl.getBoundingClientRect();
          // 2x for retina thumbnails, dropping to 1x for big regions so the
          // raster stays fast and under canvas limits.
          var sdScale = (tr.width * tr.height > 3000000) ? 1 : 2;
          return sd.toCanvas(target, { scale: sdScale, fast: true }).then(function(canvas) {
            if (hidLayer) layer.style.display = '';
            if (target === snapEl) {
              // Element-only capture — the canvas IS the focused area.
              snapReply({ dataUrl: canvas.toDataURL('image/png') });
              return;
            }
            // The canvas maps 1:1 onto the container's border box; derive the
            // axis scales from the actual canvas size so rounding inside the
            // rasterizer can't skew the crop.
            var sx = canvas.width / tr.width;
            var sy = canvas.height / tr.height;
            var padX = Math.min(80, Math.max(24, er.width * 0.3));
            var padY = Math.min(64, Math.max(20, er.height * 0.3));
            var cw = Math.min(tr.width, Math.max(200, er.width + padX * 2));
            var ch = Math.min(tr.height, Math.max(120, er.height + padY * 2));
            var cx = (er.left + er.width / 2) - tr.left;
            var cy = (er.top + er.height / 2) - tr.top;
            var x = Math.max(0, Math.min(cx - cw / 2, tr.width - cw));
            var y = Math.max(0, Math.min(cy - ch / 2, tr.height - ch));
            var out = document.createElement('canvas');
            out.width = Math.max(1, Math.round(cw * sx));
            out.height = Math.max(1, Math.round(ch * sy));
            out.getContext('2d').drawImage(
              canvas,
              Math.round(x * sx), Math.round(y * sy), out.width, out.height,
              0, 0, out.width, out.height
            );
            snapReply({ dataUrl: out.toDataURL('image/png') });
          }, function(err) {
            if (hidLayer) layer.style.display = '';
            throw err;
          });
        }).catch(function(err) {
          snapReply({ error: String(err && err.message || err) });
        });
        break;
      }

      case 'swarmz:preview_change': {
        var id = data.selector, prop = data.property, val = data.value;
        if (!id || !prop) break;
        var el = findById(id);
        if (!el) break;
        var key = id + '::' + prop;
        if (prop === 'text-content') {
          if (!window.__swarmzOriginalStyles[key]) {
            window.__swarmzOriginalStyles[key] = { el: el, property: prop, original: el.textContent || '' };
          }
          el.textContent = val;
        } else {
          if (!window.__swarmzOriginalStyles[key]) {
            window.__swarmzOriginalStyles[key] = { el: el, property: prop, original: el.style.getPropertyValue(prop) };
          }
          el.style.setProperty(prop, val, 'important');
        }
        break;
      }

      case 'swarmz:revert_changes': {
        Object.values(window.__swarmzOriginalStyles).forEach(function(entry) {
          if (!entry || !entry.el) return;
          if (entry.property === 'text-content') entry.el.textContent = entry.original;
          else entry.el.style.setProperty(entry.property, entry.original);
        });
        window.__swarmzOriginalStyles = {};
        break;
      }

      case 'swarmz:highlight_element': {
        var hId = data.selector;
        if (!hId) break;
        var hEl = findById(hId);
        if (!hEl) break;
        hEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash the hover overlay on this element
        paintHover(hEl);
        var prevBorder = hoverBox.style.border;
        hoverBox.style.border = '2px solid ' + ACCENT;
        setTimeout(function() {
          hoverBox.style.border = prevBorder;
          if (hovered !== hEl) paintHover(hovered);
        }, 1200);
        break;
      }

      case 'swarmz:select_parent': {
        var pId = data.selector;
        if (!pId) break;
        var pEl = findById(pId);
        if (!pEl) break;
        var parent = pEl.parentElement;
        while (parent && !isSelectable(parent)) parent = parent.parentElement;
        if (!parent) break;
        clearSelection();
        selectElement(parent);
        break;
      }

      case 'swarmz:select_child': {
        var scId = data.selector;
        if (!scId) break;
        var scEl = findById(scId);
        if (!scEl) break;
        var child = firstSelectableChild(scEl);
        if (!child) break;
        clearSelection();
        selectElement(child);
        break;
      }

      case 'swarmz:click_element': {
        var cId = data.selector;
        if (!cId) break;
        var cEl = findById(cId);
        if (!cEl || !isSelectable(cEl)) break;
        clearSelection();
        selectElement(cEl);
        break;
      }

      case 'swarmz:get_tree': {
        var built = buildPageTree();
        window.parent.postMessage({
          type: 'swarmz:tree_data',
          requestId: data.requestId,
          roots: built.roots,
          nodeCount: built.nodeCount,
          truncated: built.truncated,
        }, '*');
        break;
      }

      // Lightweight hover paint for tree-row hover — outlines the element
      // WITHOUT scrolling (unlike swarmz:highlight_element). Routes through
      // setHover so the hovered element is tracked (kept in sync by the
      // scroll/resize reposition) and a null selector clears it cleanly.
      case 'swarmz:hover_element': {
        setHover(data.selector ? findById(data.selector) : null);
        break;
      }

      case 'swarmz:annotation_hittest': {
        var pts = (data && data.points) || [];
        var hits = [];
        for (var ai = 0; ai < pts.length; ai++) {
          var p = pts[ai];
          var hel = (p && typeof p.x === 'number' && typeof p.y === 'number')
            ? resolveAt(p.x, p.y)
            : null;
          hits.push(hel ? buildElementData(hel) : null);
        }
        window.parent.postMessage({
          type: 'swarmz:annotation_hit',
          requestId: data.requestId,
          hits: hits,
        }, '*');
        break;
      }

      case 'swarmz:annotation_scroll': {
        // Draw-mode overlay captures wheel events; forward the delta so the
        // user can still scroll the preview while annotating. Report how far
        // the page ACTUALLY moved — the parent only wipes strokes on real
        // movement, so a swipe on a non-scrollable page (or past the scroll
        // limit) doesn't nuke the drawing. behavior:'instant' defeats CSS
        // scroll-behavior:smooth, which would make the readback see 0.
        var sx = window.scrollX, sy = window.scrollY;
        try { window.scrollBy({ left: data.dx || 0, top: data.dy || 0, behavior: 'instant' }); }
        catch (_) { try { window.scrollBy(data.dx || 0, data.dy || 0); } catch (_2) {} }
        var mdx = window.scrollX - sx, mdy = window.scrollY - sy;
        if (mdx || mdy) {
          try { window.parent.postMessage({ type: 'swarmz:annotation_scrolled', dx: mdx, dy: mdy }, '*'); } catch (_) {}
        }
        break;
      }
    }
  }
  window.addEventListener('message', onMessage);
  // Tell the parent the resident script is live. The parent replies with the
  // current mode (enable/disable) — this is also the reconcile signal after
  // any iframe reload (AI edit, key bump, page refresh).
  try { window.parent.postMessage({ type: 'swarmz:visual_ready', version: VERSION }, '*'); } catch (_) {}
})();