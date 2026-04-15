// ミニゲーム共通ロジック
// 使い方: HTML側で window.GAME_ITEMS = [{emoji, name}, ...] を定義してから読み込む
(function () {
  var ITEMS = window.GAME_ITEMS || [];
  var currentItems = [];
  var currentIndex = 0;
  var ranking = new Array(10).fill(null);
  var audioCtx = null;

  // ---- 効果音 ----
  function playPop() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
  }

  function playComplete() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.1, 0.2].forEach(function (delay, i) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime([800, 1000, 1200][i], audioCtx.currentTime + delay);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.15);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + 0.15);
    });
  }

  // ---- シャッフル ----
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function runShuffle(callback) {
    var card = document.getElementById('current-card');
    var emojiEl = document.getElementById('card-emoji');
    var nameEl = document.getElementById('card-name');
    card.classList.add('shuffling');

    var step = 0;
    var total = 18;

    function tick() {
      var rand = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      emojiEl.textContent = rand.emoji;
      nameEl.textContent = rand.name;
      step++;

      var delay;
      if (step < total * 0.5) delay = 50;
      else if (step < total * 0.7) delay = 90;
      else if (step < total * 0.85) delay = 150;
      else delay = 250;

      if (step >= total) {
        card.classList.remove('shuffling');
        var item = currentItems[currentIndex];
        emojiEl.textContent = item.emoji;
        nameEl.textContent = item.name;
        card.style.transform = 'scale(1.06)';
        setTimeout(function () { card.style.transform = ''; }, 200);
        if (callback) callback();
      } else {
        setTimeout(tick, delay);
      }
    }
    setTimeout(tick, 50);
  }

  // ---- スロット生成 ----
  function buildSlots() {
    var container = document.getElementById('ranking');
    container.innerHTML = '';
    for (var i = 0; i < 10; i++) {
      var slot = document.createElement('div');
      slot.className = 'rank-slot';
      slot.dataset.rank = i;

      var num = document.createElement('span');
      num.className = 'rank-num';
      if (i === 0) num.classList.add('gold');
      if (i === 1) num.classList.add('silver');
      if (i === 2) num.classList.add('bronze');
      num.textContent = (i + 1) + '位';

      var ph = document.createElement('span');
      ph.className = 'slot-placeholder';
      ph.textContent = 'ここにはめ込む';

      slot.appendChild(num);
      slot.appendChild(ph);
      slot.addEventListener('click', (function (idx) {
        return function () { placeAt(idx); };
      })(i));
      container.appendChild(slot);
    }
  }

  // ---- はめ込み ----
  function placeAt(rankIdx) {
    if (ranking[rankIdx] !== null) return;
    if (currentIndex >= currentItems.length) return;

    var item = currentItems[currentIndex];
    ranking[rankIdx] = item;

    var slot = document.querySelectorAll('.rank-slot')[rankIdx];
    slot.classList.add('filled');
    slot.innerHTML = '';

    var num = document.createElement('span');
    num.className = 'rank-num';
    if (rankIdx === 0) num.classList.add('gold');
    if (rankIdx === 1) num.classList.add('silver');
    if (rankIdx === 2) num.classList.add('bronze');
    num.textContent = (rankIdx + 1) + '位';

    var emoji = document.createElement('span');
    emoji.className = 'slot-emoji';
    emoji.textContent = item.emoji;

    var name = document.createElement('span');
    name.className = 'slot-name';
    name.textContent = item.name;

    slot.appendChild(num);
    slot.appendChild(emoji);
    slot.appendChild(name);

    slot.classList.add('pop');
    setTimeout(function () { slot.classList.remove('pop'); }, 400);

    playPop();
    currentIndex++;

    if (currentIndex >= 10) {
      setTimeout(showComplete, 600);
    } else {
      document.getElementById('progress').textContent = (currentIndex + 1) + ' / 10';
      runShuffle();
    }
  }

  // ---- 完成 ----
  function showComplete() {
    playComplete();
    var overlay = document.getElementById('complete');
    var list = document.getElementById('complete-ranking');
    list.innerHTML = '';

    for (var i = 0; i < 10; i++) {
      var item = ranking[i];
      if (!item) continue;
      var row = document.createElement('div');
      row.className = 'complete-row';
      row.innerHTML =
        '<span class="cr-rank">' + (i + 1) + '位</span>' +
        '<span class="cr-emoji">' + item.emoji + '</span>' +
        '<span class="cr-name">' + item.name + '</span>';
      list.appendChild(row);
    }
    overlay.classList.add('show');
  }

  // ---- 開始 / リセット ----
  function startGame() {
    document.getElementById('complete').classList.remove('show');
    ranking = new Array(10).fill(null);
    currentIndex = 0;
    currentItems = shuffle(ITEMS.slice()).slice(0, 10);
    document.getElementById('progress').textContent = '1 / 10';
    buildSlots();
    runShuffle();
  }

  document.getElementById('btn-retry').addEventListener('click', function () {
    document.getElementById('complete').classList.remove('show');
    setTimeout(startGame, 100);
  });

  startGame();
})();
