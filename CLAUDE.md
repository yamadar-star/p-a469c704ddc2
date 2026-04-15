# ポートフォリオ CLAUDE.md

## プロジェクト概要
山田凜（TOKIUM 26卒）のポートフォリオサイト。純粋なHTML/CSSのみで構成。

## ファイル構成
```
portfolio/
├── index.html        # トップページ（名前・バッジ・一言紹介・ナビ・天気&占いウィジェット・隠しコマンド）
├── about.html        # 自己紹介ページ（出身・学校・ラグビー）
├── hobbies.html      # 趣味紹介ページ（スポーツ・旅行・音楽）
├── food.html         # 食べ物・料理ページ（好きな食べ物・得意料理）
├── restaurant.html   # おすすめの店ページ（バルバッコア青山本店）
├── style.css         # 共通デザインスタイル（おすすめの店スタイル含む）
├── editable.css      # 共通：インライン編集スタイル（hover枠・トースト）
├── editable.js       # 共通：インライン編集 + 星 + クリック効果音 + 画像アップロード
├── widget.js         # トップページ専用：天気 & 占いウィジェット
├── game.css          # ミニゲーム共通スタイル
├── game.js           # ミニゲーム共通ロジック（シャッフル・ランキング・効果音）
├── secret.html           # 隠しミニゲーム：お酒ランキング（右スワイプ）
├── secret-training.html  # 隠しミニゲーム：トレーニングランキング（左スワイプ）
├── secret-sports.html    # 隠しミニゲーム：スポーツランキング（上スワイプ）
├── secret-country.html   # 隠しミニゲーム：国ランキング（下スワイプ）
├── images/           # 画像置き場
│   ├── barbacoa1.jpg # バルバッコア店内
│   ├── barbacoa2.jpg # バルバッコアシュラスコ
│   └── barbacoa3.jpg # バルバッコアピッカーニャ
├── .claude/
│   ├── settings.local.json  # PostToolUse フック設定
│   └── refresh-chrome.js    # Chrome自動リフレッシュスクリプト
└── CLAUDE.md
```

## インライン編集機能（全ページ共通）

新しいページを作るときは以下を必ず含めること。

### `<head>` に追加
```html
<link rel="stylesheet" href="editable.css">
```

### `</body>` 直前に追加
```html
<div id="toast">保存しました ✓</div>
<script src="editable.js"></script>
```

### 編集可能にしたい要素に属性を付ける
```html
<p data-edit="ページ名-要素名">テキスト</p>
<h2 data-edit="ページ名-見出し名">見出し</h2>
<li data-edit="ページ名-項目名">リスト項目</li>
```
- `data-edit` のキーはサイト全体で一意にする
- これだけでクリック編集・自動保存が有効になる

### リスト項目の追加を有効にする
```html
<ul data-addlist="ページ名-リスト名">
  <li data-edit="...">既存の項目</li>
</ul>
```
- リストの下に「＋ 追加」ボタンが自動生成される
- 追加した項目はホバーで「×」削除ボタンが出現

### カードの追加を有効にする
```html
<div class="grid" data-addcard="ページ名-グリッド名">
  ...カード...
</div>
```
- グリッドの末尾に「＋ カードを追加」ボタンが自動生成される
- カード種別は既存カードのクラス名から自動判定：
  - `.fav-card` → 絵文字 + 見出し + 説明文
  - `.card` + `<ul>` → アイコン + 見出し + 追加可能リスト（hobby型）
  - `.card` + `<p>` → アイコン + 見出し + 説明文（info型）
- 追加したカードはホバーで「×」削除ボタンが出現

## デザイン

### カラーパレット（夕焼けグラデーション）
背景は以下のグラデーションで統一する：
```css
background: linear-gradient(
  180deg,
  #1a0d2e 0%,
  #4a1550 18%,
  #8b2560 35%,
  #c94040 52%,
  #e06820 68%,
  #f0a020 82%,
  #a04010 100%
);
```

### テキストカラー
| 用途 | 色 |
|------|-----|
| 見出し・主要テキスト | `#f5f5f5` |
| サブテキスト | `#e0e0e0` |
| リスト項目 | `#e0e0e0` |
| リストマーカー | `rgba(255,255,255,0.4)` |
| バッジ・補足 | `#e0e0e0` |

### フォント
```css
font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
```

### カード
```css
background: rgba(80, 20, 10, 0.45);
border: 1px solid rgba(240, 150, 60, 0.3);
border-radius: 16px;
backdrop-filter: blur(10px);
```

## コマンド作成ルール
- コマンドを作成する際は必ず `.claude/commands/` にファイルを作成するまでを一連の作業として完了させる
- 「作りましょうか？」と確認するのではなく、指示があった時点で即座にファイルを作成する
- コマンド作成後は必ずファイルが存在することを確認して「`/コマンド名` で使えます」と報告する

## カスタムコマンド一覧
- `/タスク取込`：Slackの自分宛メンション（@山田凜）からタスクを抽出し、Notionの「タスク管理ツール」データベースに登録する。依頼・指示・確認依頼のみタスク化し、雑談・情報共有は除外する。重複チェックあり

## 決定事項・注意点
- 油絵エフェクト（SVG feTurbulence / フィルター / テクスチャオーバーレイ）は使わない
- フレームワーク・ビルドツール不使用。ファイルを直接ブラウザで開く運用
- 星アニメーションは `editable.js` の `initStars()` に一本化されている。HTMLにインラインの星スクリプトを書かないこと
- 外部サイトの画像は `images/` にローカル保存して使う。直リンクはリンク切れリスクがあるため禁止
- `body.page-home` に `overflow: hidden` を使わない（ウィジェット追加でスクロール不能になるため）。`overflow-x: hidden` + `min-height: 100vh` を使う
- PostToolUse フック（`.claude/` 内）でポートフォリオの `.html/.css/.js` 編集後に Chrome を自動リフレッシュする仕組みがある。フック設定を壊さないよう注意
- **インラインスタイル（`<style>`タグ）を HTML に書かない。ページ固有スタイルも `style.css` に集約すること**
- **共通コードの重複禁止**: 複数ページで同じCSS/JSが必要な場合は共通ファイルに切り出す（例: `game.css` / `game.js`）

## ナビゲーション
- トップページ（`index.html`）の `.nav` に全サブページへのリンクがある
- サブページのフッターは共通ナビ（`.sub-nav`）を使う。現在のページには `class="current"` を付ける
- **新ページ追加時は `index.html` のナビ + 全サブページのフッターナビの両方にリンクを追加すること**

## 画像アップロード機能
- `data-photo="一意なキー"` を付けた要素は、編集モード時にクリックで画像選択 → 自動圧縮 → localStorageに保存
- 圧縮仕様: Canvas で長辺800px以下にリサイズ、JPEG品質0.8
- 保存キー: `portfolio_img_<ページ名>`
- 新しいレシピカード等を追加する際は `data-photo` 属性を付けること
- 大量の画像を保存するとlocalStorage上限（5-10MB）に達する可能性あり

## トップページ固有
- 名前のフォントは Google Fonts「Klee One」（`<head>` にフォント読み込みが必要）
- 流れ星アニメーション: `.shooting-star` コンテナ + 5つの `span.ss-N`。右上から左下へ青白い光が流れる。`z-index: 0` で星や文字の奥に配置
- 天気 & 占いウィジェット（`widget.js`）
  - 天気: `wttr.in/Tokyo?format=j1`（CORS対応、直接取得）
  - 占い: `fujitv.co.jp/meza/uranai/data/uranai.json`（CORS非対応 → `api.allorigins.win` 経由でフォールバック）
  - トップ3 + ワースト1を表示

## 隠しコマンド（トップページ）
- 名前（h1）を上下左右に50px以上スワイプで4つのミニゲームに遷移
  - 右 → `secret.html`（お酒）、左 → `secret-training.html`（トレーニング）
  - 上 → `secret-sports.html`（スポーツ）、下 → `secret-country.html`（国）
- `#secret-burst` バーストエフェクト要素が index.html に必要
- マウス・タッチ両対応。h1 の `cursor: grab` と `userSelect: none` を維持すること

## ミニゲーム共通テンプレート
- 共通ロジックは `game.js`、共通スタイルは `game.css` に集約済み
- 新しいランキングゲーム追加手順:
  1. `secret.html` をコピー
  2. `<title>`、`<h1>`、`<p>` のテキストを変更
  3. `window.GAME_ITEMS = [...]` のデータ配列を差し替え（`{emoji, name}` × 24個）
  4. 初期カードの emoji / name を変更
  5. index.html の隠しコマンドに新しい方向を追加
- **ゲームページにインラインでCSS/JSを書かないこと** — `game.css` / `game.js` を使う
- シャッフル演出の速度（50→90→150→250ms）は `game.js` で統一管理
- 効果音（`playPop()` / `playComplete()`）も `game.js` に集約済み

## クリック効果音 & ボタンフィードバック
- `editable.js` に `playClick()` + `initClickSound()` 実装済み。全ページの `a`, `button`, `.card-add-btn`, `.btn-add-item` クリック時に自動発火
- `game.js` に `playPop()`（はめ込み時）+ `playComplete()`（完成時）を集約済み
- `.nav a:active` / `.sub-nav a:active` に `scale(0.94)` + `brightness(1.2)` を設定
- transition に `transform 0.1s, filter 0.1s` を含めること

## ファイル構成ルール
- **CSS**: ページ固有スタイルも含め `style.css` に集約。ミニゲームは `game.css`。HTMLに `<style>` を書かない
- **JS**: 全ページ共通は `editable.js`、トップ専用は `widget.js`、ゲーム共通は `game.js`。ゲームページにインラインJSを書くのはデータ定義（`window.GAME_ITEMS`）のみ
- **不要ファイル**: 使われていないファイルは削除する（テスト用、バックアップ等）

## レスポンシブ（375px対応）
- `@media (max-width: 560px)` でスマホ用の調整が入っている
- body padding、h1サイズ、ナビボタン、サブナビ、カード、店ページ見出しなどを縮小
- `.grid` の `minmax(200px, 1fr)` + `max-width: 1080px` で4カード横並びにも対応（PC時）

## コンテンツ

### 自己紹介
- **出身**: 神奈川県
- **学校**: 法政大学
- **ラグビー**: 10歳から継続中

### 趣味
- **スポーツ**: ラグビー、筋トレ、山登り
- **旅行**: 自然に触れられる場所が好き / おすすめ：阿蘇・尾道・金沢・イタリア・スイス
- **音楽**: Damiano David、Imagine Dragons、サザンオールスターズ、中島みゆき
