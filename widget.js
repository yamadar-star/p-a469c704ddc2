// トップページ：天気 & 占いウィジェット
(function () {
  var WEATHER_URL = 'https://wttr.in/Tokyo?format=j1';
  var URANAI_URL = 'https://www.fujitv.co.jp/meza/uranai/data/uranai.json';
  var PROXY = 'https://api.allorigins.win/raw?url=';

  var WEATHER_MAP = {
    113: ['☀️', '晴れ'], 116: ['⛅', 'ところにより曇り'],
    119: ['☁️', '曇り'], 122: ['☁️', '厚い曇り'],
    143: ['🌫️', '霧'], 176: ['🌧️', '小雨'], 200: ['⛈️', '雷雨'],
    248: ['🌫️', '霧'], 260: ['🌫️', '霧'],
    263: ['🌧️', '小雨'], 266: ['🌧️', '小雨'],
    293: ['🌧️', '弱い雨'], 296: ['🌧️', '雨'],
    299: ['🌧️', 'やや強い雨'], 302: ['🌧️', '強い雨'],
    305: ['🌧️', '強い雨'], 308: ['🌧️', '大雨'],
    311: ['🌧️', '冷たい雨'], 314: ['🌧️', '冷たい雨'],
    317: ['🌨️', 'みぞれ'], 320: ['🌨️', 'みぞれ'],
    323: ['❄️', '弱い雪'], 326: ['❄️', '雪'],
    329: ['❄️', '強い雪'], 332: ['❄️', '強い雪'],
    335: ['❄️', '大雪'], 338: ['❄️', '大雪'],
    353: ['🌧️', 'にわか雨'], 356: ['🌧️', 'にわか雨'],
    359: ['🌧️', '激しいにわか雨'],
    386: ['⛈️', '雷雨'], 389: ['⛈️', '激しい雷雨'],
    392: ['⛈️', '雷雪'], 395: ['⛈️', '激しい雷雪']
  };

  var RANK_LABEL = { 1: '🥇', 2: '🥈', 3: '🥉' };

  // ---- フェッチ（直接 → プロキシ fallback） ----
  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (r.ok) return r.json();
      throw new Error(r.status);
    }).catch(function () {
      return fetch(PROXY + encodeURIComponent(url)).then(function (r) {
        if (r.ok) return r.json();
        throw new Error('proxy failed');
      });
    });
  }

  // ---- 天気 ----
  function loadWeather() {
    var el = document.getElementById('weather-content');
    fetchJSON(WEATHER_URL).then(function (data) {
      var cur = data.current_condition[0];
      var code = parseInt(cur.weatherCode);
      var mapped = WEATHER_MAP[code] || ['🌤️', cur.weatherDesc[0].value];
      el.innerHTML =
        '<div class="weather-main">' +
          '<span class="weather-emoji">' + mapped[0] + '</span>' +
          '<span class="weather-temp">' + cur.temp_C + '<small>°C</small></span>' +
        '</div>' +
        '<p class="weather-desc">' + mapped[1] + '</p>' +
        '<p class="weather-detail">体感 ' + cur.FeelsLikeC + '°C ／ 湿度 ' + cur.humidity + '%</p>';
    }).catch(function () {
      el.innerHTML = '<p class="widget-error">取得できませんでした</p>';
    });
  }

  // ---- 占い ----
  function loadFortune() {
    var el = document.getElementById('fortune-content');
    fetchJSON(URANAI_URL).then(function (data) {
      var ranking = data.ranking.slice().sort(function (a, b) { return a.rank - b.rank; });
      var top3 = ranking.slice(0, 3);
      var worst = ranking[ranking.length - 1];
      var html = '';

      top3.forEach(function (r) {
        html +=
          '<div class="fortune-item">' +
            '<div class="fortune-head">' +
              '<span class="fortune-rank">' + RANK_LABEL[r.rank] + ' ' + r.rank + '位</span>' +
              '<span class="fortune-sign">' + r.name + '</span>' +
            '</div>' +
            '<p class="fortune-text">' + r.text.replace(/<br>/g, ' ') + '</p>' +
            '<p class="fortune-lucky">🍀 ' + r.point + '</p>' +
          '</div>';
      });

      html +=
        '<div class="fortune-item fortune-worst">' +
          '<div class="fortune-head">' +
            '<span class="fortune-rank">😈 ' + worst.rank + '位</span>' +
            '<span class="fortune-sign">' + worst.name + '</span>' +
          '</div>' +
          '<p class="fortune-text">' + worst.text.replace(/<br>/g, ' ') + '</p>' +
          '<p class="fortune-lucky">💡 ' + (worst.advice || worst.point) + '</p>' +
        '</div>';

      el.innerHTML = html;
    }).catch(function () {
      el.innerHTML = '<p class="widget-error">取得できませんでした</p>';
    });
  }

  // ---- 初期化 ----
  function init() { loadWeather(); loadFortune(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
