// ポートフォリオ共通：インライン編集 + 動的追加/削除/並び替え + パスワード保護
// 使い方：
//   編集したい要素         → data-edit="一意なキー"
//   リスト項目を追加可能に → <ul data-addlist="一意なキー">
//   カードを追加可能に     → <div class="grid" data-addcard="一意なキー">
(function () {
  const page       = location.pathname.split('/').pop() || 'index.html';
  const STORE_TEXT = 'portfolio_edit_' + page;
  const STORE_DYN  = 'portfolio_dynamic_' + page;
  const STORE_IMG  = 'portfolio_img_' + page;
  const PW_KEY     = 'portfolio_pw_hash';
  const SESSION_KEY = 'portfolio_edit_session';

  // ========================
  // ---- クリック効果音 ----
  // ========================
  var audioCtx = null;
  function playClick() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
  }

  function initClickSound() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a, button, .card-add-btn, .btn-add-item');
      if (target) playClick();
    });
  }

  // ========================
  // ---- ユーティリティ ----
  // ========================
  function simpleHash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
    return (h >>> 0).toString(36);
  }

  function selectAll(el) {
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }

  function isEditMode() {
    return document.body.classList.contains('edit-mode');
  }

  // ========================
  // ---- トースト ----
  // ========================
  let toastTimer;
  function showToast() {
    const t = document.getElementById('toast');
    if (!t) return;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ========================
  // ---- 保存 ----
  // ========================
  function saveTextData() {
    const data = {};
    document.querySelectorAll('[data-edit]').forEach(el => {
      data[el.dataset.edit] = el.textContent;
    });
    localStorage.setItem(STORE_TEXT, JSON.stringify(data));
  }

  function saveDynData() {
    const lists = {};
    document.querySelectorAll('[data-addlist]').forEach(ul => {
      if (ul.closest('[data-dynamic="card"]')) return;
      lists[ul.dataset.addlist] = collectListItems(ul);
    });

    const cards = {};
    document.querySelectorAll('[data-addcard]').forEach(grid => {
      const type = detectCardType(grid);
      cards[grid.dataset.addcard] = Array.from(
        grid.querySelectorAll(':scope > [data-dynamic="card"]')
      ).map(card => serializeCard(card, type));
    });

    localStorage.setItem(STORE_DYN, JSON.stringify({ lists, cards }));
  }

  function saveAll() {
    saveTextData();
    saveDynData();
    showToast();
  }

  function saveAllSilent() {
    saveTextData();
    saveDynData();
  }

  // ========================
  // ---- ロード ----
  // ========================
  function loadText() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_TEXT) || '{}');
      document.querySelectorAll('[data-edit]').forEach(el => {
        if (saved[el.dataset.edit] !== undefined) el.textContent = saved[el.dataset.edit];
      });
    } catch (e) {}
  }

  function loadDynamic() {
    try { return JSON.parse(localStorage.getItem(STORE_DYN) || '{}'); }
    catch (e) { return {}; }
  }

  // ========================
  // ---- リスト項目のテキスト収集 ----
  // ========================
  function collectListItems(ul) {
    return Array.from(ul.querySelectorAll(':scope > li')).map(li => {
      return li.querySelector('.li-text')?.textContent?.trim() || '';
    }).filter(t => t.length > 0);
  }

  // ========================
  // ---- カードのシリアライズ ----
  // ========================
  function serializeCard(card, type) {
    if (type === 'fav') {
      return { type: 'fav',
        icon:  card.querySelector('.emoji')?.textContent?.trim() || '🍴',
        title: card.querySelector('h2')?.textContent?.trim()     || '',
        desc:  card.querySelector('p')?.textContent?.trim()      || '' };
    } else if (type === 'info') {
      return { type: 'info',
        icon:  card.querySelector('.icon')?.textContent?.trim()  || '📌',
        title: card.querySelector('h2')?.textContent?.trim()     || '',
        desc:  card.querySelector('p')?.textContent?.trim()      || '' };
    } else {
      const ul = card.querySelector('ul');
      return { type: 'hobby',
        icon:  card.querySelector('.icon')?.textContent?.trim()  || '🎯',
        title: card.querySelector('h2')?.textContent?.trim()     || '',
        items: ul ? collectListItems(ul) : [] };
    }
  }

  // ========================
  // ---- 編集可能化 ----
  // ========================
  function makeEditable(el) {
    if (el.contentEditable === 'true') return;
    el.contentEditable = 'true';
    el.spellcheck = false;
    if (el.tagName === 'H2') {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });
    }
    let timer;
    el.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(saveAll, 800);
    });
  }

  // ========================
  // ---- ドラッグ&ドロップ（リスト） ----
  // ========================
  let dragSrc = null;

  function setupListItemDrag(li, ul) {
    li.draggable = true;
    li.addEventListener('dragstart', e => {
      dragSrc = li;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => li.classList.add('dragging'), 0);
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      dragSrc = null;
      saveAll();
    });
    li.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragSrc || dragSrc === li || dragSrc.parentNode !== ul) return;
      const rect = li.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        ul.insertBefore(dragSrc, li);
      } else {
        li.after(dragSrc);
      }
    });
  }

  // ========================
  // ---- ドラッグ&ドロップ（カード） ----
  // ========================
  function setupCardDrag(card, grid) {
    card.draggable = true;
    card.addEventListener('dragstart', e => {
      dragSrc = card;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragSrc = null;
      saveAll();
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragSrc || dragSrc === card || !grid.contains(dragSrc)) return;
      const addBtn = grid.querySelector('.card-add-btn');
      if (dragSrc === addBtn) return;
      const rect = card.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        grid.insertBefore(dragSrc, card);
      } else {
        const next = card.nextElementSibling;
        grid.insertBefore(dragSrc, next === addBtn ? addBtn : next || addBtn);
      }
    });
  }

  // ========================
  // ---- リスト項目生成 ----
  // ========================
  function createListItem(text) {
    const li = document.createElement('li');

    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⠿';
    handle.setAttribute('contenteditable', 'false');

    const textSpan = document.createElement('span');
    textSpan.className = 'li-text';
    textSpan.textContent = text || '新しい項目';
    textSpan.contentEditable = 'true';
    textSpan.spellcheck = false;
    textSpan.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); textSpan.blur(); }
    });
    let timer;
    textSpan.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(saveAll, 800);
    });

    const del = document.createElement('button');
    del.className = 'btn-delete-item';
    del.textContent = '×';
    del.setAttribute('contenteditable', 'false');
    del.addEventListener('click', e => {
      e.stopPropagation();
      li.remove();
      saveAll();
    });

    li.append(handle, textSpan, del);
    return li;
  }

  function setupAddListButton(ul) {
    const btn = document.createElement('button');
    btn.className = 'btn-add-item';
    btn.textContent = '＋ 追加';
    btn.addEventListener('click', () => {
      const li = createListItem('');
      setupListItemDrag(li, ul);
      ul.appendChild(li);
      const span = li.querySelector('.li-text');
      span?.focus();
      if (span) selectAll(span);
      saveAll();
    });
    ul.after(btn);
  }

  // ---- リスト初期化（配列ベース） ----
  function initAddList(ul, savedItems) {
    // HTMLから既存アイテムのテキストを読む（初回シード用）
    const htmlItems = Array.from(ul.querySelectorAll('li')).map(li => li.textContent.trim());
    // HTMLの li を全削除
    Array.from(ul.querySelectorAll('li')).forEach(li => li.remove());

    const items = savedItems !== undefined ? savedItems : htmlItems;
    items.forEach(text => {
      const li = createListItem(text);
      setupListItemDrag(li, ul);
      ul.appendChild(li);
    });

    setupAddListButton(ul);
  }

  // ========================
  // ---- カード種別判定 ----
  // ========================
  function detectCardType(grid) {
    if (grid.querySelector(':scope > .fav-card')) return 'fav';
    const card = grid.querySelector(':scope > .card');
    if (card && card.querySelector('ul')) return 'hobby';
    return 'info';
  }

  // ========================
  // ---- カードにドラッグハンドル＋削除ボタン追加 ----
  // ========================
  function decorateCard(card, grid, isDynamic) {
    // ドラッグハンドル
    if (!card.querySelector('.card-drag-handle')) {
      const handle = document.createElement('span');
      handle.className = 'drag-handle card-drag-handle';
      handle.textContent = '⠿';
      card.prepend(handle);
    }
    // 削除ボタン（動的カードのみ）
    if (isDynamic && !card.querySelector('.btn-delete-card')) {
      const del = document.createElement('button');
      del.className = 'btn-delete-card';
      del.textContent = '×';
      del.addEventListener('click', () => { card.remove(); saveAll(); });
      card.appendChild(del);
    }
    setupCardDrag(card, grid);
  }

  // ========================
  // ---- 動的カード生成 ----
  // ========================
  function createHobbyCard(data) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.dynamic = 'card';

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = data?.icon || '🎯';
    makeEditable(icon);

    const h2 = document.createElement('h2');
    h2.textContent = data?.title || '新しいカテゴリ';
    makeEditable(h2);

    const ul = document.createElement('ul');
    card.append(icon, h2, ul);
    initAddList(ul, data?.items || []);
    return card;
  }

  function createFavCard(data) {
    const card = document.createElement('div');
    card.className = 'fav-card';
    card.dataset.dynamic = 'card';

    const emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = data?.icon || '🍴';
    makeEditable(emoji);

    const h2 = document.createElement('h2');
    h2.textContent = data?.title || '新しい食べ物';
    makeEditable(h2);

    const p = document.createElement('p');
    p.textContent = data?.desc || '説明文をここに入力してください';
    makeEditable(p);

    card.append(emoji, h2, p);
    return card;
  }

  function createInfoCard(data) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.dynamic = 'card';

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = data?.icon || '📌';
    makeEditable(icon);

    const h2 = document.createElement('h2');
    h2.textContent = data?.title || '新しい項目';
    makeEditable(h2);

    const p = document.createElement('p');
    p.textContent = data?.desc || '説明文をここに入力してください';
    makeEditable(p);

    card.append(icon, h2, p);
    return card;
  }

  const CARD_CREATORS = { hobby: createHobbyCard, fav: createFavCard, info: createInfoCard };

  function initAddCard(grid, savedCards) {
    const type = detectCardType(grid);
    const create = CARD_CREATORS[type] || createHobbyCard;

    // 静的カードにドラッグハンドルを追加
    grid.querySelectorAll(':scope > .card, :scope > .fav-card').forEach(card => {
      decorateCard(card, grid, false);
    });

    // 保存済み動的カードを復元
    (savedCards || []).forEach(data => {
      const card = create(data);
      grid.appendChild(card);
      decorateCard(card, grid, true);
    });

    // 「＋カードを追加」ボタン
    const addBtn = document.createElement('div');
    addBtn.className = 'card-add-btn';
    addBtn.innerHTML = '<span class="card-add-plus">＋</span><small>カードを追加</small>';
    addBtn.addEventListener('click', () => {
      const card = create();
      grid.insertBefore(card, addBtn);
      decorateCard(card, grid, true);
      const h2 = card.querySelector('h2');
      if (h2) { h2.focus(); selectAll(h2); }
      saveAll();
    });
    grid.appendChild(addBtn);
  }

  // ========================
  // ---- 編集モード適用 ----
  // ========================
  function applyEditFeatures() {
    document.querySelectorAll('[data-edit]').forEach(makeEditable);
  }

  // ========================
  // ---- パスワード管理 ----
  // ========================
  function enterEditMode() {
    document.body.classList.add('edit-mode');
    sessionStorage.setItem(SESSION_KEY, '1');
    updateLockBtn();
    applyEditFeatures();
  }

  function exitEditMode() {
    document.body.classList.remove('edit-mode');
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  }

  function updateLockBtn() {
    const btn = document.getElementById('edit-lock-btn');
    if (btn) btn.textContent = isEditMode() ? '🔓' : '🔒';
  }

  function handleLockClick() {
    if (isEditMode()) {
      if (confirm('編集モードを終了しますか？')) exitEditMode();
      return;
    }

    const savedHash = localStorage.getItem(PW_KEY);

    if (!savedHash) {
      const pw = prompt('編集パスワードを設定してください（初回のみ）');
      if (!pw) return;
      const pw2 = prompt('確認のためもう一度入力してください');
      if (pw !== pw2) { alert('パスワードが一致しません'); return; }
      localStorage.setItem(PW_KEY, simpleHash(pw));
      alert('パスワードを設定しました。編集モードを開始します。');
      enterEditMode();
    } else {
      const pw = prompt('パスワードを入力してください');
      if (!pw) return;
      if (simpleHash(pw) === savedHash) {
        enterEditMode();
      } else {
        alert('パスワードが違います');
      }
    }
  }

  function injectLockButton() {
    const btn = document.createElement('button');
    btn.id = 'edit-lock-btn';
    btn.textContent = '🔒';
    btn.title = '編集モード';
    btn.addEventListener('click', handleLockClick);
    document.body.appendChild(btn);
  }

  // ========================
  // ---- 画像アップロード ----
  // ========================
  function loadImages() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_IMG) || '{}');
      document.querySelectorAll('[data-photo]').forEach(function (el) {
        var key = el.dataset.photo;
        if (saved[key]) applyImage(el, saved[key]);
      });
    } catch (e) {}
  }

  function saveImages() {
    var data = {};
    document.querySelectorAll('[data-photo]').forEach(function (el) {
      var img = el.querySelector('img');
      if (img && img.src.indexOf('data:') === 0) data[el.dataset.photo] = img.src;
    });
    localStorage.setItem(STORE_IMG, JSON.stringify(data));
  }

  function applyImage(container, src) {
    var placeholder = container.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = 'none';
    var existing = container.querySelector('img');
    if (existing) {
      existing.src = src;
    } else {
      var img = document.createElement('img');
      img.src = src;
      img.alt = '料理写真';
      container.appendChild(img);
    }
  }

  function compressImage(file, maxSize, quality, callback) {
    var img = new Image();
    img.onload = function () {
      var w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        var ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = URL.createObjectURL(file);
  }

  function initPhotoUpload() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    var currentTarget = null;

    document.querySelectorAll('[data-photo]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (!isEditMode()) return;
        currentTarget = el;
        input.click();
      });
    });

    input.addEventListener('change', function () {
      if (!currentTarget || !input.files[0]) return;
      compressImage(input.files[0], 800, 0.8, function (dataUrl) {
        applyImage(currentTarget, dataUrl);
        saveImages();
        showToast();
        currentTarget = null;
      });
      input.value = '';
    });
  }

  // ========================
  // ---- 星アニメーション ----
  // ========================
  function initStars() {
    const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:45%;pointer-events:none;z-index:0;overflow:hidden';
    for (let i = 0; i < 180; i++) {
      const s = document.createElement('span');
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const r = (Math.random() * 1.6 + 0.3).toFixed(1);
      const op = (Math.random() * 0.6 + 0.4).toFixed(2);
      const twinkle = Math.random() > 0.3;
      const dur = (Math.random() * 2.5 + 1.2).toFixed(1);
      const delay = (Math.random() * 4).toFixed(1);
      const bright = Math.random() > 0.85;
      s.style.cssText =
        `position:absolute;left:${x}%;top:${y}%;width:${r}px;height:${r}px;` +
        `border-radius:50%;opacity:${op};` +
        (bright
          ? `background:#fff;box-shadow:0 0 ${r * 3}px rgba(255,220,140,0.6);`
          : `background:#fff;`) +
        (twinkle ? `animation:twinkle ${dur}s ${delay}s ease-in-out infinite alternate;` : '');
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
  }

  // ========================
  // ---- 初期化 ----
  // ========================
  function init() {
    initStars();

    const dyn = loadDynamic();

    // リスト管理（配列ベース・全モード共通）
    document.querySelectorAll('[data-addlist]').forEach(ul => {
      initAddList(ul, (dyn.lists || {})[ul.dataset.addlist]);
    });

    // カード管理
    document.querySelectorAll('[data-addcard]').forEach(grid => {
      initAddCard(grid, (dyn.cards || {})[grid.dataset.addcard]);
    });

    // 静的テキストを復元
    loadText();

    // 画像を復元 & アップロード機能を初期化
    loadImages();
    initPhotoUpload();

    // 初回は現在のDOM状態を保存（リストの初期データを永続化）
    if (!localStorage.getItem(STORE_DYN)) saveAllSilent();

    // ロックボタン生成
    injectLockButton();

    // クリック効果音
    initClickSound();

    // セッション認証チェック
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      document.body.classList.add('edit-mode');
      updateLockBtn();
      applyEditFeatures();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
