$(function () {
  var editorBodyEl = document.getElementById("editor-body");

  var state = {
    notes: [],
    fonts: [],
    currentNoteId: null,
    lastOpenedId: null,
    sortMode: localStorage.getItem("memo-sort") || "created",
    selectedIds: new Set(),
    loadedFontFamilies: new Map(),
    savedRange: null,
    pendingDelete: null,
    exportSourceHTML: "",
    exportMode: null,
    undoStack: [],
    redoStack: []
  };

  var exportState = { transparent: false, bg: "#2C2440", radius: 20, padding: 28 };

  // ---------- utils ----------
  function plainText(html) { return $("<div>").html(html || "").text().replace(/\s+/g, " ").trim(); }
  function formatDate(ts) {
    var d = new Date(ts);
    return String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
  }
  var WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
  function formatFullDateTime(ts) {
    var d = new Date(ts);
    var y = d.getFullYear();
    var mo = String(d.getMonth() + 1).padStart(2, "0");
    var da = String(d.getDate()).padStart(2, "0");
    var wd = WEEKDAYS_KO[d.getDay()];
    var hh = String(d.getHours()).padStart(2, "0");
    var mi = String(d.getMinutes()).padStart(2, "0");
    return y + "." + mo + "." + da + "(" + wd + ") " + hh + ":" + mi;
  }
  function showToast(msg) {
    var $t = $("#toast").text(msg).removeClass("hidden");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () { $t.addClass("hidden"); }, 2200);
  }
  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }
  function closeModal($modal) { $modal.addClass("hidden"); }

  // ---------- theme ----------
  function applyTheme(theme) {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
    var effective = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    $(".theme-opt").removeClass("active");
    $('.theme-opt[data-theme-val="' + effective + '"]').addClass("active");
    $("#settings-theme-seg .seg-opt-l").removeClass("active");
    $('#settings-theme-seg .seg-opt-l[data-theme-val="' + theme + '"]').addClass("active");
  }
  function initTheme() { applyTheme(localStorage.getItem("memo-theme") || "system"); }
  $(document).on("click", ".theme-opt", function () {
    var val = $(this).data("theme-val");
    localStorage.setItem("memo-theme", val);
    applyTheme(val);
  });
  $("#settings-theme-seg").on("click", ".seg-opt-l", function () {
    var val = $(this).data("theme-val");
    localStorage.setItem("memo-theme", val);
    applyTheme(val);
  });

  // ---------- settings (S-09) ----------
  function getDefaultFontId() {
    var id = localStorage.getItem("memo-default-font") || "";
    if (id && !state.fonts.some(function (f) { return f.id === id; })) {
      localStorage.removeItem("memo-default-font");
      return "";
    }
    return id;
  }
  function renderSettingsModal() {
    var $sel = $("#settings-default-font").empty().append('<option value="">기본 서체</option>');
    state.fonts.forEach(function (f) { $sel.append($("<option></option>").val(f.id).text(f.name)); });
    $sel.val(getDefaultFontId());
  }
  $("#btn-open-settings").on("click", function () { renderSettingsModal(); $("#modal-settings").removeClass("hidden"); });
  $("#settings-default-font").on("change", function () {
    var id = $(this).val();
    if (id) localStorage.setItem("memo-default-font", id); else localStorage.removeItem("memo-default-font");
  });

  // ---------- navigation ----------
  function showListView() {
    state.lastOpenedId = state.currentNoteId;
    state.currentNoteId = null;
    $("#view-editor").addClass("hidden");
    $("#view-list").removeClass("hidden");
    renderNoteList();
  }
  function showEditorView() {
    $("#view-list").addClass("hidden");
    $("#view-editor").removeClass("hidden");
  }

  // ---------- note list ----------
  function getFilteredNotes() {
    var q = $("#search-input").val().trim().toLowerCase();
    var sortKey = state.sortMode === "updated" ? "updatedAt" : "createdAt";
    var list = state.notes.slice().sort(function (a, b) { return b[sortKey] - a[sortKey]; });
    if (!q) return list;
    return list.filter(function (n) {
      return (n.title || "").toLowerCase().indexOf(q) > -1 ||
        plainText(n.bodyHTML).toLowerCase().indexOf(q) > -1;
    });
  }

  $("#sort-select").on("change", function () {
    state.sortMode = $(this).val();
    localStorage.setItem("memo-sort", state.sortMode);
    renderNoteList();
  });

  function renderNoteList() {
    var notes = getFilteredNotes();
    var $list = $("#note-list").empty();

    if (state.notes.length === 0) {
      $("#empty-state").text("아직 메모가 없어요. 위의 “+ 새 메모”로 시작해보세요.").removeClass("hidden");
    } else if (notes.length === 0) {
      $("#empty-state").text("검색 결과가 없어요.").removeClass("hidden");
    } else {
      $("#empty-state").addClass("hidden");
    }

    notes.forEach(function (note) {
      var checked = state.selectedIds.has(note.id);
      var $card = $('<div class="note-card"></div>').toggleClass("checked", checked).attr("data-id", note.id);
      var $cbox = $('<button type="button" class="cbox" aria-label="선택"></button>')
        .toggleClass("on", checked).text(checked ? "✓" : "");
      var title = note.title && note.title.trim() ? note.title : "제목 없음";
      var $titleRow = $('<div class="t-row"></div>').append($('<span class="t"></span>').text(title));
      if (state.notes.length >= 2 && note.id === state.lastOpenedId) {
        $titleRow.append($('<span class="badge-recent"></span>').text("방금 편집함"));
      }
      var $info = $('<div class="info"></div>').append(
        $titleRow,
        $('<div class="p"></div>').text(plainText(note.bodyHTML) || "내용 없음")
      );
      var $body = $('<div class="body"></div>').append($info, $('<div class="d"></div>').text(formatDate(note.updatedAt)));
      $card.append($cbox, $body);
      $list.append($card);
    });

    updateSelectionUI();
  }

  function updateSelectionUI() {
    var visibleIds = getFilteredNotes().map(function (n) { return n.id; });
    var count = visibleIds.filter(function (id) { return state.selectedIds.has(id); }).length;

    $("#selectall-row").toggleClass("hidden", visibleIds.length === 0);
    var $allBox = $("#btn-select-all").removeClass("on indeterminate").text("");
    if (count > 0 && count === visibleIds.length) $allBox.addClass("on").text("✓");
    else if (count > 0) $allBox.addClass("indeterminate").text("–");
    $("#select-count").text(count > 0 ? count + " / " + visibleIds.length + "개 선택됨" : visibleIds.length + "개");
    $("#btn-bulk-delete").toggleClass("hidden", count === 0);
  }

  $("#search-input").on("input", function () { renderNoteList(); });

  $(document).on("click", ".note-card .cbox", function (e) {
    e.stopPropagation();
    var id = $(this).closest(".note-card").data("id");
    if (state.selectedIds.has(id)) state.selectedIds.delete(id); else state.selectedIds.add(id);
    renderNoteList();
  });

  $(document).on("click", ".note-card .body", function () {
    openEditor($(this).closest(".note-card").data("id"));
  });

  $("#btn-select-all").on("click", function () {
    var visibleIds = getFilteredNotes().map(function (n) { return n.id; });
    var allSelected = visibleIds.length > 0 && visibleIds.every(function (id) { return state.selectedIds.has(id); });
    visibleIds.forEach(function (id) { allSelected ? state.selectedIds.delete(id) : state.selectedIds.add(id); });
    renderNoteList();
  });

  $("#btn-bulk-delete").on("click", function () {
    var ids = Array.from(state.selectedIds);
    if (ids.length) openDeleteModal(ids, "list");
  });

  $("#btn-new-note").on("click", function () {
    var now = Date.now();
    var note = { id: DB.uid(), title: "", bodyHTML: "", fontId: getDefaultFontId() || null, createdAt: now, updatedAt: now };
    state.notes.push(note);
    DB.notes.put(note);
    openEditor(note.id);
  });

  // ---------- editor ----------
  function findNote(id) { return state.notes.find(function (n) { return n.id === id; }); }

  function renderNoteMeta(note) {
    $("#meta-created").text("생성 " + formatFullDateTime(note.createdAt));
    $("#meta-updated").text("수정 " + formatFullDateTime(note.updatedAt));
  }

  function openEditor(id) {
    var note = findNote(id);
    if (!note) return;
    state.currentNoteId = id;
    $("#note-title").val(note.title || "");
    $("#editor-body").html(note.bodyHTML || "");
    renderNoteMeta(note);
    populateFontSelect(note.fontId);
    applyNoteFont(note);
    showEditorView();
    resetUndoHistory();
    if (!note.title) $("#note-title").trigger("focus"); else $("#editor-body").trigger("focus");
  }

  // ---------- undo / redo (Ctrl+Z / Ctrl+Shift+Z) ----------
  // Native contenteditable undo (execCommand-based) doesn't know about the
  // DOM surgery the style toolbar does directly via the Range API (span
  // wrap/unwrap, link insertion) — those edits just fall out of the
  // browser's undo stack. So undo here is fully custom: snapshot {title,
  // bodyHTML} before each edit and restore on Ctrl+Z, independent of the
  // browser's native undo.
  var UNDO_GROUP_GAP = 800; // ms of typing inactivity that starts a new undo step
  var undoBurstTimer = null;
  function resetUndoHistory() {
    state.undoStack = [];
    state.redoStack = [];
    clearTimeout(undoBurstTimer);
    undoBurstTimer = null;
  }
  function captureSnapshot() {
    return { title: $("#note-title").val(), bodyHTML: editorBodyEl.innerHTML };
  }
  // forceNewGroup: true for discrete toolbar actions (always their own undo
  // step); false for typing, which groups consecutive keystrokes into one
  // step until there's a pause longer than UNDO_GROUP_GAP.
  function pushUndoSnapshot(forceNewGroup) {
    if (!state.currentNoteId) return;
    if (forceNewGroup || undoBurstTimer === null) {
      state.undoStack.push(captureSnapshot());
      if (state.undoStack.length > 100) state.undoStack.shift();
      state.redoStack = [];
    }
    clearTimeout(undoBurstTimer);
    undoBurstTimer = forceNewGroup ? null : setTimeout(function () { undoBurstTimer = null; }, UNDO_GROUP_GAP);
  }
  function restoreSnapshot(snap) {
    var note = findNote(state.currentNoteId);
    if (!note) return;
    hideFloatToolbar();
    $("#note-title").val(snap.title);
    editorBodyEl.innerHTML = snap.bodyHTML;
    note.title = snap.title;
    note.bodyHTML = snap.bodyHTML;
    note.updatedAt = Date.now();
    DB.notes.put(note);
    renderNoteMeta(note);
  }
  function performUndo() {
    if (!state.undoStack.length) return;
    clearTimeout(undoBurstTimer);
    undoBurstTimer = null;
    state.redoStack.push(captureSnapshot());
    restoreSnapshot(state.undoStack.pop());
  }
  function performRedo() {
    if (!state.redoStack.length) return;
    state.undoStack.push(captureSnapshot());
    restoreSnapshot(state.redoStack.pop());
  }
  $("#note-title, #editor-body").on("beforeinput", function () { pushUndoSnapshot(false); });
  $(document).on("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
    if ($("#view-editor").hasClass("hidden")) return;
    e.preventDefault();
    if (e.shiftKey) performRedo(); else performUndo();
  });

  function saveCurrentNote() {
    var note = findNote(state.currentNoteId);
    if (!note) return;
    var newTitle = $("#note-title").val();
    var newBodyHTML = $("#editor-body").html();
    if (newTitle === note.title && newBodyHTML === note.bodyHTML) return; // no real edit — don't bump updatedAt/reorder the list
    note.title = newTitle;
    note.bodyHTML = newBodyHTML;
    note.updatedAt = Date.now();
    DB.notes.put(note);
    renderNoteMeta(note);
  }
  var saveCurrentNoteDebounced = debounce(saveCurrentNote, 350);

  $("#note-title").on("input", saveCurrentNoteDebounced);
  $("#note-title").on("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#editor-body").trigger("focus"); } });
  $("#editor-body").on("input", saveCurrentNoteDebounced);
  $("#note-title, #editor-body").on("blur", saveCurrentNote);

  // Tab inserts a 4-space indent instead of moving focus out of the editor
  $("#editor-body").on("keydown", function (e) {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    ");
    }
  });

  // "->" becomes "→" and "=>" becomes "⇒" as soon as the closing ">" is typed
  function autoReplaceArrow() {
    var sel = window.getSelection();
    if (!sel.rangeCount || !sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    var node = range.startContainer;
    if (node.nodeType !== 3 || !editorBodyEl.contains(node)) return;
    if (node.parentElement && node.parentElement.closest("a")) return;
    var offset = range.startOffset;
    var twoChars = node.textContent.slice(Math.max(0, offset - 2), offset);
    var replacement = twoChars === "->" ? "→" : twoChars === "=>" ? "⇒" : null;
    if (!replacement) return;
    var r = document.createRange();
    r.setStart(node, offset - 2);
    r.setEnd(node, offset);
    sel.removeAllRanges();
    sel.addRange(r);
    document.execCommand("insertText", false, replacement);
  }
  // bound on "input" (fires for every content change) rather than "keyup" for ">" —
  // more robust against extensions/IME that can intercept or reshape key events
  $("#editor-body").on("input", autoReplaceArrow);

  $("#btn-back").on("click", function () { saveCurrentNote(); showListView(); });

  $("#btn-delete-note").on("click", function () {
    if (state.currentNoteId) openDeleteModal([state.currentNoteId], "editor");
  });

  // ---------- font manager (S-04) ----------
  function populateFontSelect(selectedFontId) {
    var $sel = $("#font-select").empty().append('<option value="">기본 서체</option>');
    state.fonts.forEach(function (f) { $sel.append($("<option></option>").val(f.id).text(f.name)); });
    $sel.val(selectedFontId || "");
  }

  $("#font-select").on("change", function () {
    var note = findNote(state.currentNoteId);
    if (!note) return;
    note.fontId = $(this).val() || null;
    note.updatedAt = Date.now();
    DB.notes.put(note);
    renderNoteMeta(note);
    applyNoteFont(note);
  });

  function loadFontFace(font) {
    if (state.loadedFontFamilies.has(font.id)) return Promise.resolve(state.loadedFontFamilies.get(font.id));
    var url = URL.createObjectURL(font.blob);
    var face = new FontFace(font.family, "url(" + url + ")");
    return face.load().then(function (loaded) {
      document.fonts.add(loaded);
      state.loadedFontFamilies.set(font.id, font.family);
      return font.family;
    });
  }

  function applyNoteFont(note) {
    if (!note.fontId) { $("#editor-body").css("font-family", ""); return; }
    var font = state.fonts.find(function (f) { return f.id === note.fontId; });
    if (!font) { $("#editor-body").css("font-family", ""); return; }
    loadFontFace(font).then(function (family) {
      if (state.currentNoteId === note.id) $("#editor-body").css("font-family", '"' + family + '", var(--font-body)');
    }).catch(function () { showToast("폰트를 불러오지 못했어요."); });
  }

  $("#btn-font-manager").on("click", function () { renderFontList(); $("#modal-font").removeClass("hidden"); });

  function renderFontList() {
    var $list = $("#font-list").empty();
    if (state.fonts.length === 0) { $list.append('<p class="font-empty">등록된 폰트가 없어요. 위에서 파일을 업로드해보세요.</p>'); return; }
    var note = findNote(state.currentNoteId);
    state.fonts.slice().sort(function (a, b) { return b.createdAt - a.createdAt; }).forEach(function (font) {
      var $preview = $('<div class="preview">가나다 Abc</div>');
      var $info = $('<div class="info"></div>').append($preview, $('<div class="fname"></div>').text(font.name));
      var applied = note && note.fontId === font.id;
      var $btn = $('<button type="button" class="btn"></button>').toggleClass("primary", !applied).prop("disabled", applied).text(applied ? "적용됨" : "적용");
      $btn.on("click", function () { applyFontToCurrentNote(font.id); });
      var $delBtn = $('<button type="button" class="btn ghost-danger"></button>').text("삭제");
      $delBtn.on("click", function () { openDeleteModal([font.id], "font-manager", "fonts"); });
      var $actions = $('<div class="font-row-actions"></div>').append($btn, $delBtn);
      $list.append($('<div class="font-row"></div>').append($info, $actions));
      loadFontFace(font).then(function (family) { $preview.css("font-family", '"' + family + '"'); }).catch(function () {});
    });
  }

  function applyFontToCurrentNote(fontId) {
    var note = findNote(state.currentNoteId);
    if (!note) return;
    note.fontId = fontId;
    note.updatedAt = Date.now();
    DB.notes.put(note);
    renderNoteMeta(note);
    populateFontSelect(fontId);
    applyNoteFont(note);
    closeModal($("#modal-font"));
    showToast("폰트를 적용했어요.");
  }

  function isFontFile(name) {
    var lower = name.toLowerCase();
    return [".ttf", ".otf", ".woff", ".woff2"].some(function (ext) { return lower.endsWith(ext); });
  }

  // A font already registered under the same file name is treated as the
  // same font — re-uploading it replaces the existing entry's file in
  // place instead of adding a second, visually-identical row.
  function handleFontFiles(fileList) {
    var accepted = Array.from(fileList || []).filter(function (f) { return isFontFile(f.name); });
    if (accepted.length === 0) { showToast(".ttf, .otf, .woff, .woff2 파일만 업로드할 수 있어요."); return; }
    var added = 0, updated = 0;
    accepted.forEach(function (file) {
      var existing = state.fonts.find(function (f) { return f.name === file.name; });
      if (existing) {
        existing.blob = file;
        existing.createdAt = Date.now();
        state.loadedFontFamilies.delete(existing.id);
        DB.fonts.put(existing);
        updated++;
      } else {
        var id = DB.uid();
        var font = { id: id, name: file.name, family: "custom-font-" + id, blob: file, createdAt: Date.now() };
        state.fonts.push(font);
        DB.fonts.put(font);
        added++;
      }
    });
    renderFontList();
    var parts = [];
    if (added) parts.push(added + "개 등록");
    if (updated) parts.push(updated + "개 교체");
    showToast(parts.join(" · ") + "했어요.");
  }

  $("#dropzone").on("click", function () { $("#font-file-input").trigger("click"); });
  $("#dropzone").on("dragover", function (e) { e.preventDefault(); $(this).addClass("dragover"); });
  $("#dropzone").on("dragleave", function () { $(this).removeClass("dragover"); });
  $("#dropzone").on("drop", function (e) {
    e.preventDefault();
    $(this).removeClass("dragover");
    handleFontFiles(e.originalEvent.dataTransfer.files);
  });
  $("#font-file-input").on("change", function () { handleFontFiles(this.files); this.value = ""; });

  // ---------- selection floating toolbar (S-03) ----------
  var $floatToolbar = $("#float-toolbar");

  function positionFloatToolbar(range) {
    var rect = range.getBoundingClientRect();
    var tbWidth = $floatToolbar.outerWidth();
    var tbHeight = $floatToolbar.outerHeight() || 40;
    var top = rect.top - tbHeight - 10;
    if (top < 8) top = rect.bottom + 10;
    var left = rect.left + rect.width / 2 - tbWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tbWidth - 8));
    $floatToolbar.css({ top: top + "px", left: left + "px" });
  }

  function hideFloatToolbar() {
    $floatToolbar.addClass("hidden");
    closeLinkPopover();
  }

  function updateFloatToolbar() {
    var sel = window.getSelection();
    if (sel.rangeCount === 0 || sel.isCollapsed) { hideFloatToolbar(); return; }
    var range = sel.getRangeAt(0);
    if (!editorBodyEl.contains(range.commonAncestorContainer)) { hideFloatToolbar(); return; }
    state.savedRange = range.cloneRange();
    positionFloatToolbar(range);
    $floatToolbar.removeClass("hidden");
  }

  $("#editor-body").on("mouseup keyup", function () { setTimeout(updateFloatToolbar, 0); });
  // selectionchange fires for every selection change regardless of how it happened
  // (drag direction, touch, extensions intercepting mouse events) — a more robust
  // trigger than relying solely on mouseup, which some browser extensions can swallow.
  // Skip it while focus is inside the toolbar/link popover themselves (color picker,
  // link URL input) — moving focus there collapses the document selection, and
  // re-running updateFloatToolbar would immediately hide the very control in use.
  document.addEventListener("selectionchange", function () {
    var active = document.activeElement;
    if (active && $(active).closest("#float-toolbar, #link-popover").length) return;
    setTimeout(updateFloatToolbar, 0);
  });
  $(document).on("mousedown", function (e) {
    if ($(e.target).closest("#float-toolbar, #editor-body, #link-popover").length === 0) hideFloatToolbar();
  });
  // buttons steal focus on click; preventDefault on mousedown keeps the text selection alive
  $floatToolbar.on("mousedown", "button", function (e) { e.preventDefault(); });

  // Each style dimension (highlight, text color, letter-spacing, line-height)
  // is applied as its own single-purpose <span>. Re-applying a different
  // value for the SAME dimension over already-styled text must replace the
  // old span, not nest inside it — nesting left the old span's padding and
  // background peeking out from behind the new one as a colored fringe.
  var CATEGORY_MATCHERS = {
    highlight: function (el) { return el.tagName === "SPAN" && el.hasAttribute("data-hl"); },
    color: function (el) { return el.tagName === "SPAN" && !el.hasAttribute("data-hl") && el.style.color; },
    letterSpacing: function (el) { return el.tagName === "SPAN" && el.style.letterSpacing; },
    lineHeight: function (el) { return el.tagName === "SPAN" && el.style.lineHeight; }
  };

  // Splits `node`'s parent so `node` is promoted out of it by one level —
  // any of the parent's other content keeps its style via clones of it
  // wrapping the "before"/"after" siblings. Returns the removed parent so
  // the caller can decide whether to discard or preserve its style.
  function splitOneLevel(node) {
    var parent = node.parentNode;
    var grand = parent.parentNode;
    var before = [], after = [], seen = false;
    Array.prototype.forEach.call(parent.childNodes, function (child) {
      if (child === node) { seen = true; return; }
      (seen ? after : before).push(child);
    });
    if (before.length) {
      var beforeSpan = parent.cloneNode(false);
      before.forEach(function (c) { beforeSpan.appendChild(c); });
      grand.insertBefore(beforeSpan, parent);
    }
    grand.insertBefore(node, parent);
    if (after.length) {
      var afterSpan = parent.cloneNode(false);
      after.forEach(function (c) { afterSpan.appendChild(c); });
      grand.insertBefore(afterSpan, parent);
    }
    grand.removeChild(parent);
    return parent;
  }

  // Climbs `node`'s ancestor chain of <span>s (stopping at the first
  // non-span, e.g. a line's <div>) and strips out every span matching this
  // category, however deep — not just an immediate parent. A span already
  // styled with a DIFFERENT category (color while we're clearing highlight,
  // say) sits in between and must survive, so it's re-applied as a clone
  // around the promoted node instead of being dropped. Without walking the
  // full chain, re-styling text that already carries an unrelated style
  // either left the two nested instead of swapped, or silently failed to
  // find the category span to clear/replace at all.
  function promoteOutOfCategory(node, matches) {
    var hasMatch = false;
    for (var el = node.parentNode; el && el.tagName === "SPAN"; el = el.parentNode) {
      if (matches(el)) { hasMatch = true; break; }
    }
    if (!hasMatch) return;

    for (;;) {
      var parent = node.parentNode;
      if (!parent || parent.tagName !== "SPAN") return;
      var isMatch = matches(parent);
      var template = parent.cloneNode(false);
      splitOneLevel(node);
      if (!isMatch) {
        node.parentNode.insertBefore(template, node);
        template.appendChild(node);
        node = template;
      }
    }
  }

  // Wraps every text node the range touches in its own <span>, instead of
  // extracting the whole range into one <span>. Each line in the editor is
  // its own <div>; extracting a range that crosses a line boundary pulls
  // those <div>s inside the (inline) span, which forces extra line breaks
  // into the note. Wrapping per text node leaves the surrounding <div>
  // structure untouched no matter how many lines the selection spans.
  // `category` (see CATEGORY_MATCHERS) clears any conflicting same-category
  // span first. A falsy `styleStr` means "clear only" — used by the "no
  // color" swatches.
  function wrapSavedRange(styleStr, attrs, category) {
    if (!state.savedRange) return null;
    var range = state.savedRange;
    if (range.collapsed) return null;
    pushUndoSnapshot(true);

    var walkerRoot = range.commonAncestorContainer;
    if (walkerRoot.nodeType === 3) walkerRoot = walkerRoot.parentNode;
    var walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) {
      if (range.intersectsNode(node)) textNodes.push(node);
    }

    var matches = category ? CATEGORY_MATCHERS[category] : null;
    var spans = [];
    textNodes.forEach(function (textNode) {
      var start = textNode === range.startContainer ? range.startOffset : 0;
      var end = textNode === range.endContainer ? range.endOffset : textNode.length;
      if (start >= end) return;
      var middle = start > 0 ? textNode.splitText(start) : textNode;
      if (end - start < middle.length) middle.splitText(end - start);
      if (matches) promoteOutOfCategory(middle, matches);
      if (styleStr) {
        var span = document.createElement("span");
        span.setAttribute("style", styleStr);
        if (attrs) Object.keys(attrs).forEach(function (k) { span.setAttribute(k, attrs[k]); });
        middle.parentNode.insertBefore(span, middle);
        span.appendChild(middle);
        spans.push(span);
      } else {
        spans.push(middle);
      }
    });
    if (!spans.length) return null;

    var newRange = document.createRange();
    newRange.setStartBefore(spans[0]);
    newRange.setEndAfter(spans[spans.length - 1]);
    state.savedRange = newRange;
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(newRange);
    saveCurrentNoteDebounced();
    return spans[0];
  }

  function toggleHighlight(color) {
    if (!state.savedRange) return;
    var range = state.savedRange;
    var container = range.commonAncestorContainer;
    if (container.nodeType === 3) container = container.parentElement;
    var existing = container.closest ? container.closest('span[data-hl="' + color + '"]') : null;
    if (existing && existing.contains(range.startContainer) && existing.contains(range.endContainer)) {
      pushUndoSnapshot(true);
      var parent = existing.parentNode;
      var first = existing.firstChild, last = existing.lastChild;
      while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
      parent.removeChild(existing);
      var newRange = document.createRange();
      if (first && last) { newRange.setStartBefore(first); newRange.setEndAfter(last); } else newRange.selectNodeContents(parent);
      state.savedRange = newRange;
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(newRange);
      saveCurrentNoteDebounced();
    } else {
      wrapSavedRange("background-color:var(--hl-" + color + ");border-radius:3px;padding:0 1px;", { "data-hl": color }, "highlight");
    }
  }

  $("#color-group").on("click", ".ft-swatch", function () {
    var color = $(this).data("color");
    wrapSavedRange(color ? "color:" + color : null, null, "color");
    if (state.savedRange) positionFloatToolbar(state.savedRange);
  });

  $("#highlight-group").on("click", ".ft-swatch", function () {
    var color = $(this).data("hl");
    if (color) toggleHighlight(color); else wrapSavedRange(null, null, "highlight");
    if (state.savedRange) positionFloatToolbar(state.savedRange);
  });

  $floatToolbar.on("click", ".seg .seg-opt", function () {
    var $seg = $(this).closest(".seg");
    var segName = $seg.data("seg");
    var prop = segName === "letterSpacing" ? "letter-spacing" : "line-height";
    $seg.find(".seg-opt").removeClass("active");
    $(this).addClass("active");
    wrapSavedRange(prop + ":" + $(this).data("val"), null, segName);
    if (state.savedRange) positionFloatToolbar(state.savedRange);
  });

  // ---------- links: insert (manual + autolink) & open (S-03b) ----------
  var $linkPopover = $("#link-popover");
  var $linkUrlInput = $("#link-url-input");

  function normalizeUrl(raw) {
    var url = (raw || "").trim();
    if (!url) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url; // already has a scheme (http:, https:, mailto:, ...)
    return "https://" + url;
  }

  function makeLinkEl(url) {
    var a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    return a;
  }

  // Collapses the caret just after `a`. If a text node (e.g. leftover trailing
  // whitespace) immediately follows, the caret goes to the end of it instead —
  // otherwise the browser tends to merge next-typed characters into the START
  // of that node, effectively moving the whitespace past whatever gets typed.
  function placeCaretAfterLink(a) {
    var r = document.createRange();
    var next = a.nextSibling;
    if (next && next.nodeType === 3) r.setStart(next, next.length);
    else r.setStartAfter(a);
    r.collapse(true);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function insertLink(url) {
    if (!state.savedRange || !url) return null;
    pushUndoSnapshot(true);
    var range = state.savedRange;
    var a = makeLinkEl(url);
    a.appendChild(range.extractContents());
    range.insertNode(a);
    var newRange = document.createRange();
    newRange.selectNodeContents(a);
    state.savedRange = newRange;
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(newRange);
    saveCurrentNoteDebounced();
    return a;
  }

  function positionLinkPopover() {
    var tbRect = $floatToolbar[0].getBoundingClientRect();
    var pw = $linkPopover.outerWidth();
    var top = tbRect.bottom + 8;
    var left = tbRect.left + tbRect.width / 2 - pw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    $linkPopover.css({ top: top + "px", left: left + "px" });
  }

  function openLinkPopover() {
    if (!state.savedRange) return;
    $linkUrlInput.val("");
    $linkPopover.removeClass("hidden");
    positionLinkPopover();
    $linkUrlInput.trigger("focus");
  }

  function closeLinkPopover() {
    $linkPopover.addClass("hidden");
  }

  function confirmLinkPopover() {
    var url = normalizeUrl($linkUrlInput.val());
    closeLinkPopover();
    if (!url) return;
    insertLink(url);
    if (state.savedRange) positionFloatToolbar(state.savedRange);
  }

  $("#btn-insert-link").on("click", function () { openLinkPopover(); });
  $("#btn-link-confirm").on("mousedown", function (e) { e.preventDefault(); });
  $("#btn-link-confirm").on("click", confirmLinkPopover);
  $linkUrlInput.on("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); confirmLinkPopover(); }
    else if (e.key === "Escape") { e.preventDefault(); closeLinkPopover(); }
  });

  // autolink: typing a bare URL followed by space/enter turns it into a link
  function autolinkAtCaret() {
    var sel = window.getSelection();
    if (!sel.rangeCount || !sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    var node = range.startContainer;
    if (node.nodeType !== 3 || !editorBodyEl.contains(node)) return;
    if (node.parentElement && node.parentElement.closest("a")) return;
    var offset = range.startOffset;
    var textBefore = node.textContent.slice(0, offset);
    // the space/enter that triggered this handler is already inserted in the DOM by keyup time
    // (a trailing space at the very end of contenteditable content is often an nbsp, not a plain space)
    var trailingWs = textBefore.match(/[ \t\u00A0]+$/);
    var wsLen = trailingWs ? trailingWs[0].length : 0;
    var beforeBoundary = textBefore.slice(0, textBefore.length - wsLen);
    var m = beforeBoundary.match(/(^|[\s(])((https?:\/\/|www\.)\S+)$/i);
    if (!m) return;
    var matched = m[2];
    var trimmed = matched.replace(/[)\].,;:!?'"]+$/, "");
    if (trimmed.length < 4) return;
    var start = beforeBoundary.length - matched.length;
    var end = start + trimmed.length;
    var linkRange = document.createRange();
    linkRange.setStart(node, start);
    linkRange.setEnd(node, end);
    var a = makeLinkEl(normalizeUrl(trimmed));
    a.appendChild(linkRange.extractContents());
    linkRange.insertNode(a);
    placeCaretAfterLink(a);
    saveCurrentNoteDebounced();
  }
  $("#editor-body").on("keyup", function (e) {
    if (e.key === " " || e.key === "Enter") autolinkAtCaret();
  });

  // autolink: pasting a bare URL wraps it (or the replaced selection text) as a link
  $("#editor-body").on("paste", function (e) {
    var cd = (e.originalEvent || e).clipboardData;
    if (!cd) return;
    var text = cd.getData("text/plain");
    if (!text) return;
    var trimmed = text.trim();
    if (!/^(https?:\/\/|www\.)\S+$/i.test(trimmed)) return;
    e.preventDefault();
    pushUndoSnapshot(true);
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    if (!editorBodyEl.contains(range.commonAncestorContainer)) return;
    var a = makeLinkEl(normalizeUrl(trimmed));
    if (!range.collapsed) a.appendChild(range.extractContents());
    else a.textContent = trimmed;
    range.insertNode(a);
    placeCaretAfterLink(a);
    saveCurrentNoteDebounced();
  });

  // clicking a link opens it in a new tab instead of placing the caret
  $("#editor-body").on("click", "a", function (e) {
    e.preventDefault();
    var href = $(this).attr("href");
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  });

  // ---------- image export (S-05) ----------
  $("#btn-export-image").on("click", function () {
    var sel = window.getSelection();
    var hasSelection = sel.rangeCount > 0 && !sel.isCollapsed && editorBodyEl.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (hasSelection) {
      state.exportMode = "selection";
      var wrap = document.createElement("div");
      wrap.appendChild(sel.getRangeAt(0).cloneContents());
      state.exportSourceHTML = wrap.innerHTML;
    } else {
      var note = findNote(state.currentNoteId);
      var bodyEmpty = !plainText(editorBodyEl.innerHTML);
      var titleEmpty = !(note && note.title && note.title.trim());
      if (bodyEmpty && titleEmpty) { showToast("저장할 내용이 없어요."); return; }
      state.exportMode = "full";
      state.exportSourceHTML = editorBodyEl.innerHTML;
    }
    resetExportOptions();
    $("#modal-export").removeClass("hidden");
  });

  function renderExportContent() {
    var $c = $("#export-content").empty();
    if (state.exportMode === "full" && exportState.includeTitle) {
      var note = findNote(state.currentNoteId);
      var titleText = note && note.title && note.title.trim() ? note.title : "제목 없음";
      $c.append($('<div class="export-title"></div>').text(titleText));
    }
    $c.append($('<div class="export-body"></div>').html(state.exportSourceHTML));
    $c.css("font-family", $("#editor-body").css("font-family"));
  }

  function resetExportOptions() {
    exportState = { transparent: false, bg: "#2C2440", radius: 20, padding: 28, includeTitle: true };
    $("#bg-swatches .bg-swatch").removeClass("active").filter('[data-bg="#2C2440"]').addClass("active");
    $("#toggle-transparent").attr("aria-pressed", "false");
    $('.seg-light[data-seg="radius"] .seg-opt-l').removeClass("active").filter('[data-val="20"]').addClass("active");
    $('.seg-light[data-seg="padding"] .seg-opt-l').removeClass("active").filter('[data-val="28"]').addClass("active");
    $("#toggle-include-title").attr("aria-pressed", "true");
    $("#title-toggle-row").toggleClass("hidden", state.exportMode !== "full");
    applyExportFrameStyle();
    renderExportContent();
  }

  $("#toggle-include-title").on("click", function () {
    exportState.includeTitle = !exportState.includeTitle;
    $(this).attr("aria-pressed", String(exportState.includeTitle));
    renderExportContent();
  });

  function applyExportFrameStyle() {
    $("#export-frame").css({
      background: exportState.transparent ? "transparent" : exportState.bg,
      "border-radius": exportState.radius + "px",
      padding: exportState.padding + "px"
    });
  }

  $("#bg-swatches").on("click", ".bg-swatch", function () {
    exportState.bg = $(this).data("bg");
    exportState.transparent = false;
    $("#bg-swatches .bg-swatch").removeClass("active");
    $(this).addClass("active");
    $("#toggle-transparent").attr("aria-pressed", "false");
    applyExportFrameStyle();
  });

  $("#toggle-transparent").on("click", function () {
    exportState.transparent = !exportState.transparent;
    $(this).attr("aria-pressed", String(exportState.transparent));
    $("#bg-swatches .bg-swatch").removeClass("active");
    if (!exportState.transparent) $('#bg-swatches .bg-swatch[data-bg="' + exportState.bg + '"]').addClass("active");
    applyExportFrameStyle();
  });

  $('.seg-light[data-seg="radius"]').on("click", ".seg-opt-l", function () {
    $(this).siblings().removeClass("active"); $(this).addClass("active");
    exportState.radius = parseInt($(this).data("val"), 10);
    applyExportFrameStyle();
  });
  $('.seg-light[data-seg="padding"]').on("click", ".seg-opt-l", function () {
    $(this).siblings().removeClass("active"); $(this).addClass("active");
    exportState.padding = parseInt($(this).data("val"), 10);
    applyExportFrameStyle();
  });

  $("#btn-download-png").on("click", function () {
    var $btn = $(this).prop("disabled", true).text("생성 중…");
    // Captures the padded wrapper around the card, not the card itself —
    // html2canvas doesn't clip its own canvas backdrop to the card's
    // border-radius, so without this the four rounded corners come out as
    // solid white squares. backgroundColor:null keeps that backdrop (and
    // the wrapper's outer margin) transparent regardless of whether the
    // card itself has an opaque background color or "투명 배경" is on.
    html2canvas(document.getElementById("export-capture"), {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    }).then(function (canvas) {
      var link = document.createElement("a");
      link.download = "memo-" + Date.now() + ".png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      $btn.prop("disabled", false).text("PNG로 다운로드");
    }).catch(function (err) {
      console.error(err);
      showToast("이미지 생성에 실패했어요.");
      $btn.prop("disabled", false).text("PNG로 다운로드");
    });
  });

  // ---------- delete confirm (shared: list bulk + editor single + font manager, S-06) ----------
  function openDeleteModal(ids, from, type) {
    state.pendingDelete = { ids: ids, from: from, type: type || "notes" };
    var noun = state.pendingDelete.type === "fonts" ? "폰트" : "메모";
    $("#delete-title").text(noun + "를 삭제할까요?");
    $("#delete-message").text(ids.length > 1
      ? "선택한 " + noun + " " + ids.length + "개를 삭제합니다. 삭제한 " + noun + "는 복구할 수 없습니다."
      : "이 " + noun + "를 삭제합니다. 삭제한 " + noun + "는 복구할 수 없습니다.");
    $("#modal-delete").removeClass("hidden");
  }

  function confirmDeleteFonts(pending) {
    return Promise.all(pending.ids.map(function (id) { return DB.fonts.delete(id); })).then(function () {
      state.fonts = state.fonts.filter(function (f) { return pending.ids.indexOf(f.id) === -1; });
      pending.ids.forEach(function (id) { state.loadedFontFamilies.delete(id); });
      if (pending.ids.indexOf(localStorage.getItem("memo-default-font")) > -1) localStorage.removeItem("memo-default-font");
      var note = findNote(state.currentNoteId);
      if (note && pending.ids.indexOf(note.fontId) > -1) {
        note.fontId = null;
        note.updatedAt = Date.now();
        DB.notes.put(note);
        renderNoteMeta(note);
        applyNoteFont(note);
        populateFontSelect(null);
      }
      closeModal($("#modal-delete"));
      renderFontList();
      showToast(pending.ids.length > 1 ? "폰트 " + pending.ids.length + "개를 삭제했어요." : "폰트를 삭제했어요.");
      state.pendingDelete = null;
    });
  }

  $("#btn-confirm-delete").on("click", function () {
    var pending = state.pendingDelete;
    if (!pending) return;
    if (pending.type === "fonts") { confirmDeleteFonts(pending); return; }
    Promise.all(pending.ids.map(function (id) { return DB.notes.delete(id); })).then(function () {
      state.notes = state.notes.filter(function (n) { return pending.ids.indexOf(n.id) === -1; });
      pending.ids.forEach(function (id) { state.selectedIds.delete(id); });
      closeModal($("#modal-delete"));
      if (pending.from === "editor") showListView(); else renderNoteList();
      showToast(pending.ids.length > 1 ? "메모 " + pending.ids.length + "개를 삭제했어요." : "메모를 삭제했어요.");
      state.pendingDelete = null;
    });
  });

  // ---------- help (S-07) ----------
  $(document).on("click", ".btn-help", function () { $("#modal-help").removeClass("hidden"); });

  // ---------- data backup / restore (S-08) ----------
  $("#btn-open-backup").on("click", function () { $("#modal-backup").removeClass("hidden"); });

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl) {
    return fetch(dataUrl).then(function (res) { return res.blob(); });
  }

  $("#btn-export-backup").on("click", function () {
    var $btn = $(this).prop("disabled", true).text("내보내는 중…");
    Promise.all(state.fonts.map(function (f) {
      return blobToDataUrl(f.blob).then(function (dataUrl) {
        return { id: f.id, name: f.name, family: f.family, dataUrl: dataUrl, createdAt: f.createdAt };
      });
    })).then(function (fontsOut) {
      var payload = {
        app: "memo-app-backup",
        version: 1,
        exportedAt: Date.now(),
        notes: state.notes,
        fonts: fontsOut
      };
      var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.download = "memo-backup-" + Date.now() + ".json";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast("백업 파일을 다운로드했어요.");
    }).catch(function (err) {
      console.error(err);
      showToast("백업 파일 생성에 실패했어요.");
    }).then(function () {
      $btn.prop("disabled", false).text("백업 파일 다운로드");
    });
  });

  $("#backup-file-input").on("change", function () {
    var file = this.files && this.files[0];
    this.value = "";
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      var payload;
      try { payload = JSON.parse(reader.result); } catch (e) { payload = null; }
      if (!payload || payload.app !== "memo-app-backup" || !Array.isArray(payload.notes)) {
        showToast("올바른 백업 파일이 아니에요.");
        return;
      }
      var importedFonts = payload.fonts || [];
      // A font in the backup with the same NAME as one already registered
      // here is the same font, even if it was originally uploaded
      // independently (and so got a different id) on whatever device made
      // this backup — reuse the existing id instead of adding a duplicate
      // row, and remap any note's fontId that pointed at the backup's id.
      var fontIdRemap = {};
      Promise.all(importedFonts.map(function (f) {
        return dataUrlToBlob(f.dataUrl).then(function (blob) {
          var existing = state.fonts.find(function (x) { return x.name === f.name; });
          var id = existing ? existing.id : f.id;
          if (existing && existing.id !== f.id) fontIdRemap[f.id] = existing.id;
          return { id: id, name: f.name, family: "custom-font-" + id, blob: blob, createdAt: f.createdAt };
        });
      })).then(function (fontObjs) {
        payload.notes.forEach(function (n) {
          if (n.fontId && fontIdRemap[n.fontId]) n.fontId = fontIdRemap[n.fontId];
        });
        return Promise.all(
          fontObjs.map(function (f) { return DB.fonts.put(f); })
            .concat(payload.notes.map(function (n) { return DB.notes.put(n); }))
        ).then(function () { return fontObjs; });
      }).then(function (fontObjs) {
        fontObjs.forEach(function (f) {
          var idx = state.fonts.findIndex(function (x) { return x.id === f.id; });
          if (idx > -1) state.fonts[idx] = f; else state.fonts.push(f);
          state.loadedFontFamilies.delete(f.id);
        });
        payload.notes.forEach(function (n) {
          var idx = state.notes.findIndex(function (x) { return x.id === n.id; });
          if (idx > -1) state.notes[idx] = n; else state.notes.push(n);
        });
        closeModal($("#modal-backup"));
        renderNoteList();
        showToast(payload.notes.length + "개 메모를 불러왔어요.");
      }).catch(function (err) {
        console.error(err);
        showToast("백업 파일을 불러오는 데 실패했어요.");
      });
    };
    reader.readAsText(file);
  });

  // ---------- generic modal close ----------
  $(document).on("click", ".modal-shade", function (e) { if (e.target === this) closeModal($(this)); });
  $(document).on("click", "[data-close-modal]", function () { closeModal($(this).closest(".modal-shade")); });
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") $(".modal-shade").not(".hidden").each(function () { closeModal($(this)); });
  });

  // ---------- init ----------
  DB.init().then(function () {
    return Promise.all([DB.notes.getAll(), DB.fonts.getAll()]);
  }).then(function (results) {
    state.notes = results[0];
    state.fonts = results[1];
    initTheme();
    $("#sort-select").val(state.sortMode);
    renderNoteList();
  }).catch(function (err) {
    console.error(err);
    showToast("저장소를 여는 데 실패했어요.");
  });
});
