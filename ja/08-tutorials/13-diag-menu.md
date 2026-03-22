# Chapter 8.13: 診断メニュー（Diag Menu）

[Home](../README.md) | [<< 前へ: トレーディングシステムの構築](12-trading-system.md) | **診断メニュー**

---

> **概要:** Diag MenuはDayZに内蔵された診断ツールで、DayZDiag実行ファイルでのみ利用可能です。FPSカウンター、スクリプトプロファイリング、レンダーデバッグ、フリーカメラ、物理演算の可視化、天候制御、Central Economyツール、AIナビゲーションデバッグ、サウンド診断を提供します。この章では、Bohemia Interactive公式ドキュメントに基づき、すべてのメニューカテゴリ、オプション、キーボードショートカットを文書化します。

---

## 目次

- [Diag Menuとは](#what-is-the-diag-menu)
- [アクセス方法](#how-to-access)
- [ナビゲーションコントロール](#navigation-controls)
- [クイックアクセスキーボードショートカット](#quick-access-keyboard-shortcuts)
- [メニューカテゴリの概要](#menu-categories-overview)
- [Statistics](#statistics)
- [Enfusion Renderer](#enfusion-renderer)
- [Enfusion World（物理演算）](#enfusion-world-physics)
- [DayZ Render](#dayz-render)
- [Game](#game)
- [AI](#ai)
- [Sounds](#sounds)
- [モッダーに便利な機能](#useful-features-for-modders)
- [Diag Menuを使用するタイミング](#when-to-use-the-diag-menu)
- [よくある間違い](#common-mistakes)
- [次のステップ](#next-steps)

---

## Diag Menuとは

Diag Menuは、DayZ診断実行ファイルに組み込まれた階層型デバッグメニューです。Statistics、Enfusion Renderer、Enfusion World、DayZ Render、Game、AI、Soundsの7つの主要カテゴリにわたって、ゲームスクリプトとアセットのデバッグに使用されるオプションをリストします。

Diag Menuは製品版DayZ実行ファイル（`DayZ_x64.exe`）では**利用できません**。`DayZDiag_x64.exe` を使用する必要があります。これはDayZインストールフォルダまたはDayZ Serverディレクトリに製品版と並んで含まれている診断ビルドです。

---

## アクセス方法

### 要件

- **DayZDiag_x64.exe** -- 診断実行ファイル。DayZインストールフォルダ内の通常の `DayZ_x64.exe` と同じ場所にあります。
- ゲームが実行中である必要があります（ロード画面ではなく）。メニューはあらゆる3Dビューポートで利用可能です。

### メニューを開く

**Win + Alt** を押してDiag Menuを開きます。

代替ショートカットは **Ctrl + Win** ですが、Windows 11のシステムショートカットと競合するため、そのプラットフォームでは推奨されません。

### マウスカーソルの有効化

一部のDiag Menuオプションでは、マウスを使用して画面を操作する必要があります。マウスカーソルは以下のキーで切り替えられます：

**LCtrl + Numpad 9**

このキーバインドはスクリプト（`PluginKeyBinding`）を通じて登録されています。

---

## ナビゲーションコントロール

Diag Menuが開いた状態で：

| キー | アクション |
|-----|--------|
| **上 / 下矢印** | メニュー項目間を移動 |
| **右矢印** | サブメニューに入る、またはオプション値を切り替える |
| **左矢印** | オプション値を逆方向に切り替える |
| **Backspace** | 現在のサブメニューを離れる（一階層戻る） |

オプションに複数の値がある場合、メニューに表示される順序でリストされます。最初のオプションが通常デフォルトです。

---

## クイックアクセスキーボードショートカット

これらのショートカットはDayZDiag実行中いつでも機能し、メニューを開く必要はありません：

| ショートカット | 機能 |
|----------|----------|
| **LCtrl + Numpad 1** | FPSカウンターの切り替え |
| **LCtrl + Numpad 9** | 画面上のマウスカーソルの切り替え |
| **RCtrl + RAlt + W** | レンダーデバッグモードの切り替え |
| **LCtrl + LAlt + P** | ポストプロセスエフェクトの切り替え |
| **LAlt + Numpad 6** | 物理ボディ可視化の切り替え |
| **Page Up** | フリーカメラ：プレイヤー移動の切り替え |
| **Page Down** | フリーカメラ：カメラのフリーズ/解除 |
| **Insert** | プレイヤーをカーソル位置にテレポート（フリーカメラ中） |
| **Home** | フリーカメラの切り替え / 無効化してカーソル位置にテレポート |
| **Numpad /** | フリーカメラの切り替え（テレポートなし） |
| **End** | フリーカメラを無効化（プレイヤーカメラに戻る） |

> **注意：** 公式ドキュメントの「Cheat Inputs」への言及は、C++側でハードコードされた入力を指しており、スクリプトからはアクセスできません。

---

## メニューカテゴリの概要

Diag Menuには7つのトップレベルカテゴリがあります：

1. **Statistics** -- FPSカウンターとスクリプトプロファイラー
2. **Enfusion Renderer** -- ライティング、シャドウ、マテリアル、オクルージョン、ポストプロセス、テレイン、ウィジェット
3. **Enfusion World** -- 物理エンジン（Bullet）の可視化とデバッグ
4. **DayZ Render** -- 空のレンダリング、ジオメトリ診断
5. **Game** -- 天候、フリーカメラ、車両、戦闘、Central Economy、サーフェスサウンド
6. **AI** -- ナビゲーションメッシュ、パスファインディング、AIエージェントの動作
7. **Sounds** -- 再生サンプルのデバッグ、サウンドシステム情報

---

## Statistics

### メニュー構成

```
Statistics
  FPS                              [LCtrl + Numpad 1]
  Script profiler UI
  > Script profiler settings
      Always enabled
      Flags
      Module
      Update interval
      Average
      Time resolution
      (UI) Scale
```

### FPS

画面左上隅にFPSカウンターを表示します。

FPS値は直近10フレーム間の時間から計算されるため、瞬間値ではなく短い移動平均を反映します。

### Script Profiler UI

画面上のScript Profilerを有効にし、スクリプト実行のリアルタイムパフォーマンスデータを表示します。

プロファイラーは6つのデータセクションを表示します：

| セクション | 表示内容 |
|---------|---------------|
| **Time per class** | クラスに属するすべての関数呼び出しの合計時間（上位20） |
| **Time per function** | 特定の関数のすべての呼び出しの合計時間（上位20） |
| **Class allocations** | クラスのアロケーション回数（上位20） |
| **Count per function** | 関数が呼び出された回数（上位20） |
| **Class count** | クラスのライブインスタンス数（上位40） |
| **Stats and settings** | 現在のプロファイラー設定とフレームカウンター |

Stats and settingsパネルの表示内容：

| フィールド | 意味 |
|-------|---------|
| UI enabled (DIAG) | スクリプトプロファイラーUIがアクティブかどうか |
| Profiling enabled (SCRP) | UIが非アクティブでもプロファイリングが実行されているかどうか |
| Profiling enabled (SCRC) | プロファイリングが実際に行われているかどうか |
| Flags | 現在のデータ収集フラグ |
| Module | 現在プロファイリングされているモジュール |
| Interval | 現在の更新間隔 |
| Time Resolution | 現在の時間解像度 |
| Average | 表示値が平均かどうか |
| Game Frame | 経過した合計フレーム数 |
| Session Frame | このプロファイリングセッションの合計フレーム数 |
| Total Frames | すべてのプロファイリングセッションにわたる合計フレーム数 |
| Profiled Sess Frms | このセッションでプロファイリングされたフレーム数 |
| Profiled Frames | すべてのセッションにわたってプロファイリングされたフレーム数 |

> **重要：** Script Profilerはスクリプトコードのみをプロファイリングします。Proto（エンジンバインド）メソッドは個別のエントリとして計測されませんが、それらを呼び出すスクリプトメソッドの合計時間にその実行時間が含まれます。

> **重要：** EnProfiler APIとスクリプトプロファイラー自体は、診断実行ファイルでのみ利用可能です。

### Script Profiler Settings

これらの設定は、プロファイリングデータの収集方法を制御します。`EnProfiler` API（`EnProfiler.c` に記載）を通じてプログラムで調整することもできます。

#### Always Enabled

プロファイリングデータの収集はデフォルトでは有効になっていません。このトグルは現在アクティブかどうかを表示します。

起動時にプロファイリングを有効にするには、起動パラメータ `-profile` を使用します。

Script Profiler UIはこの設定を無視します -- UIが表示されている間は常にプロファイリングを強制します。UIをオフにすると、プロファイリングは再び停止します（「Always enabled」がtrueに設定されている場合を除く）。

#### Flags

データの収集方法を制御します。4つの組み合わせが利用可能です：

| フラグの組み合わせ | スコープ | データの有効期間 |
|-----------------|-------|---------------|
| `SPF_RESET \| SPF_RECURSIVE` | 選択したモジュール + 子 | フレームごと（各フレームでリセット） |
| `SPF_RECURSIVE` | 選択したモジュール + 子 | フレーム間で蓄積 |
| `SPF_RESET` | 選択したモジュールのみ | フレームごと（各フレームでリセット） |
| `SPF_NONE` | 選択したモジュールのみ | フレーム間で蓄積 |

- **SPF_RECURSIVE**：子モジュールのプロファイリングを有効にします（再帰的）
- **SPF_RESET**：各フレームの終了時にデータをクリアします

#### Module

プロファイリングするスクリプトモジュールを選択します：

| オプション | スクリプトレイヤー |
|--------|-------------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

ソートされたデータ表示を更新するまでに待機するフレーム数です。これは `SPF_RESET` によるリセットも遅延させます。

利用可能な値：0, 5, 10, 20, 30, 50, 60, 120, 144

#### Average

平均値の表示を有効または無効にします。

- `SPF_RESET` を使用しインターバルなし：値はフレームごとの生の値
- `SPF_RESET` なし：蓄積値をセッションフレーム数で割る
- インターバル設定あり：インターバルで割る

クラスカウントは平均されません -- 常に現在のインスタンス数を表示します。アロケーションはインスタンスが作成された平均回数を表示します。

#### Time Resolution

表示の時間単位を設定します。値は分母（1秒のn分の1）を表します：

| 値 | 単位 |
|-------|------|
| 1 | 秒 |
| 1000 | ミリ秒 |
| 1000000 | マイクロ秒 |

利用可能な値：1, 10, 100, 1000, 10000, 100000, 1000000

#### (UI) Scale

異なる画面サイズと解像度向けに、画面上のプロファイラー表示のビジュアルスケールを調整します。

範囲：0.5〜1.5（デフォルト：1.0、ステップ：0.05）

---

## Enfusion Renderer

### メニュー構成

```
Enfusion Renderer
  Lights
  > Lighting
      Ambient lighting
      Ground lighting
      Directional lighting
      Bidirectional lighting
      Specular lighting
      Reflection
      Emission lighting
  Shadows
  Terrain shadows
  Render debug mode                [RCtrl + RAlt + W]
  Occluders
  Occlude entities
  Occlude proxies
  Show occluder volumes
  Show active occluders
  Show occluded
  Widgets
  Postprocess                      [LCtrl + LAlt + P]
  Terrain
  > Materials
      Common, TreeTrunk, TreeCrown, Grass, Basic, Normal,
      Super, Skin, Multi, Old Terrain, Old Roads, Water,
      Sky, Sky clouds, Sky stars, Sky flares,
      Particle Sprite, Particle Streak
```

### Lights

実際のライトソース（`PersonalLight` やフラッシュライトなどのゲーム内アイテム）を切り替えます。環境ライティングには影響しません -- それにはLightingサブメニューを使用してください。

### Lightingサブメニュー

各トグルは特定のライティングコンポーネントを制御します：

| オプション | 無効時の効果 |
|--------|---------------------|
| **Ambient lighting** | シーン内の一般的なアンビエントライトを除去 |
| **Ground lighting** | 地面から反射されるライトを除去（屋根、キャラクターの脇の下で確認可能） |
| **Directional lighting** | メインのディレクショナル（太陽/月）ライトを除去。双方向ライティングも無効化 |
| **Bidirectional lighting** | 双方向ライトコンポーネントを除去 |
| **Specular lighting** | スペキュラーハイライトを除去（食器棚、車などの光沢のある表面で確認可能） |
| **Reflection** | リフレクションライティングを除去（金属/光沢のある表面で確認可能） |
| **Emission lighting** | マテリアルからのエミッション（自己発光）を除去 |

これらのトグルは、カスタムモデルやシーンのビジュアル問題をデバッグする際に、特定のライティング寄与を分離するのに便利です。

### Shadows

シャドウレンダリングを有効または無効にします。無効にすると、オブジェクト内の雨のカリングも除去されます（雨が屋根を通り抜けるようになります）。

### Terrain Shadows

テレインシャドウの生成方法を制御します。

オプション：`on (slice)`, `on (full)`, `no update`, `disabled`

### Render Debug Mode

ゲーム内でメッシュジオメトリを検査するためのレンダー可視化モードを切り替えます。

オプション：`normal`, `wire`, `wire only`, `overdraw`, `overdrawZ`

異なるマテリアルは異なるワイヤーフレームカラーで表示されます：

| マテリアル | カラー (RGB) |
|----------|-------------|
| TreeTrunk | 179, 126, 55 |
| TreeCrown | 143, 227, 94 |
| Grass | 41, 194, 53 |
| Basic | 208, 87, 87 |
| Normal | 204, 66, 107 |
| Super | 234, 181, 181 |
| Skin | 252, 170, 18 |
| Multi | 143, 185, 248 |
| Terrain | 255, 127, 127 |
| Water | 51, 51, 255 |
| Ocean | 51, 128, 255 |
| Sky | 143, 185, 248 |

### Occluders

オクルージョンカリングシステムのトグルセットです：

| オプション | 効果 |
|--------|--------|
| **Occluders** | オブジェクトオクルージョンの有効/無効 |
| **Occlude entities** | エンティティオクルージョンの有効/無効 |
| **Occlude proxies** | プロキシオクルージョンの有効/無効 |
| **Show occluder volumes** | スナップショットを取得し、オクルージョンボリュームを可視化するデバッグシェイプを描画 |
| **Show active occluders** | 現在アクティブなオクルーダーをデバッグシェイプで表示 |
| **Show occluded** | オクルードされたオブジェクトをデバッグシェイプで可視化 |

### Widgets

すべてのUIウィジェットのレンダリングを有効または無効にします。クリーンなスクリーンショットの撮影やレンダリング問題の分離に便利です。

### Postprocess

ポストプロセスエフェクト（ブルーム、色補正、ビネットなど）を有効または無効にします。

### Terrain

テレインレンダリングを完全に有効または無効にします。

### Materialsサブメニュー

特定のマテリアルタイプのレンダリングを切り替えます。ほとんどは名前から明らかです。注目すべきエントリ：

- **Super** -- 「super」シェーダーに関連するすべてのマテリアルを網羅する包括的なトグル
- **Old Terrain** -- TerrainとTerrain Simpleの両方のマテリアルをカバー
- **Water** -- 水に関連するすべてのマテリアル（海、海岸、川）をカバー

---

## Enfusion World（物理演算）

### メニュー構成

```
Enfusion World
  Show Bullet
  > Bullet
      Draw Char Ctrl
      Draw Simple Char Ctrl
      Max. Collider Distance
      Draw Bullet shape
      Draw Bullet wireframe
      Draw Bullet shape AABB
      Draw obj center of mass
      Draw Bullet contacts
      Force sleep Bullet
      Show stats
  Show bodies                      [LAlt + Numpad 6]
```

> **注意：** ここでの「Bullet」はBullet物理エンジンを指し、弾薬ではありません。

### Show Bullet

Bullet物理エンジンのデバッグ可視化を有効にします。

### Bulletサブメニュー

| オプション | 説明 |
|--------|-------------|
| **Draw Char Ctrl** | プレイヤーキャラクターコントローラーを可視化。「Draw Bullet shape」に依存 |
| **Draw Simple Char Ctrl** | AIキャラクターコントローラーを可視化。「Draw Bullet shape」に依存 |
| **Max. Collider Distance** | コライダーを可視化するプレイヤーからの最大距離（値：0, 1, 2, 5, 10, 20, 50, 100, 200, 500）。デフォルトは0 |
| **Draw Bullet shape** | 物理コライダーシェイプを可視化 |
| **Draw Bullet wireframe** | コライダーをワイヤーフレームのみで表示。「Draw Bullet shape」に依存 |
| **Draw Bullet shape AABB** | コライダーの軸平行バウンディングボックスを表示 |
| **Draw obj center of mass** | オブジェクトの重心を表示 |
| **Draw Bullet contacts** | 接触しているコライダーを可視化 |
| **Force sleep Bullet** | すべての物理ボディをスリープ状態に強制 |
| **Show stats** | デバッグ統計を表示（オプション：disabled, basic, all）。無効化後10秒間表示が残る |

> **警告：** Max. Collider Distanceはデフォルトで0です。この可視化は負荷が高いためです。大きな距離に設定すると、パフォーマンスが大幅に低下します。

### Show Bodies

Bullet物理ボディを可視化します。オプション：`disabled`, `only`, `all`

---

## DayZ Render

### メニュー構成

```
DayZ Render
  > Sky
      Space
      Stars
      > Planets
          Sun
          Moon
      Atmosphere
      > Clouds
          Far
          Near
          Physical
      Horizon
      > Post Process
          God Rays
  > Geometry diagnostic
      diagnostic mode
```

### Skyサブメニュー

個別の空レンダリングコンポーネントを切り替えます：

| オプション | 制御対象 |
|--------|-----------------|
| **Space** | 星の背後の背景テクスチャ |
| **Stars** | 星のレンダリング |
| **Sun** | 太陽とそのハロー効果（ゴッドレイではない） |
| **Moon** | 月とそのハロー効果（ゴッドレイではない） |
| **Atmosphere** | 空の大気テクスチャ |
| **Far (Clouds)** | 上層/遠方の雲。ライトシャフトには影響しない（密度が低い） |
| **Near (Clouds)** | 下層/近い雲。より密度が高く、ライトシャフトのオクルージョンとして機能 |
| **Physical (Clouds)** | 非推奨のオブジェクトベースの雲。DayZ 1.23でChernarusとLivoniaから削除済み |
| **Horizon** | 水平線のレンダリング。水平線はライトシャフトを遮断する |
| **God Rays** | ライトシャフトのポストプロセスエフェクト |

### Geometry Diagnostic

オブジェクトのジオメトリがゲーム内でどのように見えるかを可視化するデバッグシェイプ描画を有効にします。

ジオメトリタイプ：`normal`, `roadway`, `geometry`, `viewGeometry`, `fireGeometry`, `paths`, `memory`, `wreck`

描画モード：`solid+wire`, `Zsolid+wire`, `wire`, `ZWire`, `geom only`

これはカスタムモデルを作成するモッダーにとって非常に便利です -- ゲームを離れることなく、ファイアジオメトリ、ビュージオメトリ、メモリポイントが正しく設定されているか確認できます。

---

## Game

### メニュー構成

```
Game
  > Weather & environment
      Display
      Force fog at camera
      Override fog
        Distance density
        Height density
        Distance offset
        Height bias
  Free Camera
    FrCam Player Move              [Page Up]
    FrCam NoClip
    FrCam Freeze                   [Page Down]
  > Vehicles
      Audio
      Simulation
  > Combat
      DECombat
      DEShots
      DEHitpoints
      DEExplosions
  > Legacy/obsolete
      DEAmbient
      DELight
  DESurfaceSound
  > Central Economy
      > Loot Spawn Edit
          Spawn Volume Vis
          Setup Vis
          Edit Volume
          Re-Trace Group Points
          Spawn Candy
          Spawn Rotation Test
          Placement Test
          Export Group
          Export All Groups
          Export Map
          Export Clusters
          Export Economy [csv]
          Export Respawn Queue [csv]
      > Loot Tool
          Deplete Lifetime
          Set Damage = 1.0
          Damage + Deplete
          Invert Avoidance
          Project Target Loot
      > Infected
          Infected Vis
          Infected Zone Info
          Infected Spawn
          Reset Cleanup
      > Animal
          Animal Vis
          Animal Spawn
          Ambient Spawn
      > Building
          Building Stats
      Vehicle&Wreck Vis
      Loot Vis
      Cluster Vis
      Dynamic Events Status
      Dynamic Events Vis
      Dynamic Events Spawn
      Export Dyn Event
      Overall Stats
      Updaters State
      Idle Mode
      Force Save
```

### Weather & Environment

天候システムのデバッグ機能です。

#### Display

天候デバッグの可視化を有効にします。霧/視程の画面上デバッグを表示し、詳細な天候データを含む別のリアルタイムウィンドウを開きます。

サーバーとして実行中に別ウィンドウを有効にするには、起動パラメータ `-debugweather` を使用します。

ウィンドウ設定はプロファイルに `weather_client_imgui.ini` / `weather_client_imgui.bin`（サーバーの場合は `weather_server_*`）として保存されます。

#### Force Fog at Camera

霧の高さをプレイヤーカメラの高さに合わせます。Height bias設定よりも優先されます。

#### Override Fog

手動設定で霧の値をオーバーライドできます：

| パラメータ | 範囲 | ステップ |
|-----------|-------|------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### Free Camera

フリーカメラはプレイヤーキャラクターからビューを切り離し、ワールド内を自由に飛行できるようにします。モッダーにとって最も便利なデバッグツールの一つです。

#### フリーカメラの操作

| キー | 起源 | 機能 |
|-----|--------|----------|
| **W / A / S / D** | Inputs (xml) | 前進 / 左 / 後退 / 右へ移動 |
| **Q** | Inputs (xml) | 上昇 |
| **Z** | Inputs (xml) | 下降 |
| **マウス** | Inputs (xml) | 周囲を見る |
| **マウスホイール上** | Inputs (C++) | 速度増加 |
| **マウスホイール下** | Inputs (C++) | 速度減少 |
| **スペースバー** | Cheat Inputs (C++) | ターゲットオブジェクトの画面上デバッグを切り替え |
| **Ctrl / Shift** | Cheat Inputs (C++) | 現在の速度 x 10 |
| **Alt** | Cheat Inputs (C++) | 現在の速度 / 10 |
| **End** | Cheat Inputs (C++) | フリーカメラを無効化（プレイヤーに戻る） |
| **Enter** | Cheat Inputs (C++) | カメラをターゲットオブジェクトにリンク |
| **Page Up** | Cheat Inputs (C++) | フリーカメラ中のプレイヤー移動を切り替え |
| **Page Down** | Cheat Inputs (C++) | カメラ位置のフリーズ/解除 |
| **Insert** | PluginKeyBinding (Script) | プレイヤーをカーソル位置にテレポート |
| **Home** | PluginKeyBinding (Script) | フリーカメラの切り替え / 無効化してカーソル位置にテレポート |
| **Numpad /** | PluginKeyBinding (Script) | フリーカメラの切り替え（テレポートなし） |

#### フリーカメラオプション

| オプション | 説明 |
|--------|-------------|
| **FrCam Player Move** | フリーカメラ中にプレイヤー入力（WASD）がプレイヤーを動かすかどうかを有効/無効 |
| **FrCam NoClip** | カメラがテレインを通過できるかどうかを有効/無効 |
| **FrCam Freeze** | 入力によるカメラの移動を有効/無効 |

### Vehicles

車両の拡張デバッグ機能です。プレイヤーが車両内にいる場合のみ動作します。

- **Audio** -- サウンド設定をリアルタイムで調整する別ウィンドウを開きます。オーディオコントローラーの可視化を含みます。
- **Simulation** -- 車両シミュレーションデバッグの別ウィンドウを開きます：物理パラメータの調整と可視化。

### Combat

戦闘、射撃、ヒットポイントのデバッグツールです：

| オプション | 説明 |
|--------|-------------|
| **DECombat** | 車両、AI、プレイヤーまでの距離を画面上テキストで表示 |
| **DEShots** | 弾道デバッグサブメニュー（以下参照） |
| **DEHitpoints** | プレイヤーと注視しているオブジェクトのDamageSystemを表示 |
| **DEExplosions** | 爆発の貫通データを表示。数値は減速値。赤い十字 = 停止。緑の十字 = 貫通 |

**DEShowサブメニュー：**

| オプション | 説明 |
|--------|-------------|
| Clear vis. | 既存の射撃可視化をクリア |
| Vis. trajectory | 射撃の軌道をトレースし、出口点と停止点を表示 |
| Always Deflect | クライアントから発射されたすべての弾を跳弾させる |

### Legacy/Obsolete

- **DEAmbient** -- アンビエントサウンドに影響する変数を表示
- **DELight** -- 現在のライティング環境に関する統計を表示

### DESurfaceSound

プレイヤーが立っているサーフェスタイプと減衰タイプを表示します。

### Central Economy

Central Economy（CE）システムの包括的なデバッグツールセットです。

> **重要：** ほとんどのCEデバッグオプションは、CEが有効なシングルプレイヤークライアントでのみ動作します。「Building Stats」のみがマルチプレイヤー環境またはCEがオフの場合に動作します。

> **注意：** これらの機能の多くは、スクリプトの `CEApi`（`CentralEconomy.c`）を通じても利用可能です。

#### Loot Spawn Edit

オブジェクト上のルートスポーンポイントを作成・編集するためのツールです。Edit Volumeツールを使用するにはフリーカメラを有効にする必要があります。

| オプション | 説明 | スクリプト相当 |
|--------|-------------|-------------------|
| **Spawn Volume Vis** | ルートスポーンポイントを可視化。オプション：Off, Adaptive, Volume, Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | CE設定プロパティをカラーコード付きコンテナで画面上に表示 | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | インタラクティブなルートポイントエディター（フリーカメラが必要） | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | ルートポイントを再トレースして浮遊問題を修正 | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | 選択したグループのすべてのスポーンポイントにルートをスポーン | -- |
| **Spawn Rotation Test** | カーソル位置でローテーションフラグをテスト | -- |
| **Placement Test** | スフィアシリンダーで配置を可視化 | -- |
| **Export Group** | 選択したグループを `storage/export/mapGroup_CLASSNAME.xml` にエクスポート | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | すべてのグループを `storage/export/mapgroupproto.xml` にエクスポート | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | `storage/export/mapgrouppos.xml` を生成 | `GetCEApi().LootExportMap()` |
| **Export Clusters** | `storage/export/mapgroupcluster.xml` を生成 | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | エコノミーを `storage/log/economy.csv` にエクスポート | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | リスポーンキューを `storage/log/respawn_queue.csv` にエクスポート | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Edit Volumeのキーバインド：**

| キー | 機能 |
|-----|----------|
| **[** | コンテナを後方にイテレート |
| **]** | コンテナを前方にイテレート |
| **LMB** | 新しいポイントを挿入 |
| **RMB** | ポイントを削除 |
| **;** | ポイントサイズを増加 |
| **'** | ポイントサイズを減少 |
| **Insert** | ポイントにルートをスポーン |
| **M** | 48個の "AmmoBox_762x54_20Rnd" をスポーン |
| **Backspace** | 近くのルートをクリーンアップ対象にマーク（ライフタイムを消費、即座ではない） |

#### Loot Tool

| オプション | 説明 | スクリプト相当 |
|--------|-------------|-------------------|
| **Deplete Lifetime** | ライフタイムを3秒に消費（クリーンアップ予約） | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | ヘルスを0に設定 | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | 上記の両方を実行 | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | プレイヤー回避（近くのプレイヤーの検出）を切り替え | -- |
| **Project Target Loot** | ターゲットアイテムのスポーンをエミュレートし、画像とログを生成。「Loot Vis」の有効化が必要 | `GetCEApi().SpawnAnalyze()` と `GetCEApi().EconomyMap()` |

#### Infected

| オプション | 説明 | スクリプト相当 |
|--------|-------------|-------------------|
| **Infected Vis** | ゾンビゾーン、ロケーション、生存/死亡ステータスを可視化 | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | カメラがインフェクテッドゾーン内にあるときの画面上デバッグ | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | 選択したゾーンにインフェクテッドをスポーン（またはカーソル位置に "InfectedArmy"） | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | クリーンアップタイマーを3秒に設定 | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| オプション | 説明 | スクリプト相当 |
|--------|-------------|-------------------|
| **Animal Vis** | 動物ゾーン、ロケーション、生存/死亡ステータスを可視化 | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | 選択したゾーンに動物をスポーン（またはカーソル位置に "AnimalGoat"） | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | カーソルターゲットに "AmbientHen" をスポーン | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

**Building Stats** は建物のドア状態に関する画面上デバッグを表示します：

- 左側：各ドアが開いている/閉じている、フリー/ロックされているか
- 中央：`buildings.bin`（建物の永続性）に関する統計

ドアのランダム化は `initOpened` config値を使用します。`rand < initOpened` のとき、ドアは開いた状態でスポーンします（そのため `initOpened=0` はドアが開いた状態でスポーンしないことを意味します）。

economy.xmlでの一般的な `<building/>` 設定：

| 設定 | 動作 |
|-------|----------|
| `init="0" load="0" respawn="0" save="0"` | 永続性なし、ランダム化なし、再起動後デフォルト状態 |
| `init="1" load="0" respawn="0" save="0"` | 永続性なし、initOpenedによるドアのランダム化 |
| `init="1" load="1" respawn="0" save="1"` | ロックされたドアのみ保存、initOpenedによるドアのランダム化 |
| `init="0" load="1" respawn="0" save="1"` | 完全な永続性、正確なドア状態を保存、ランダム化なし |

#### その他のCentral Economyツール

| オプション | 説明 | スクリプト相当 |
|--------|-------------|-------------------|
| **Vehicle&Wreck Vis** | 「Vehicle」回避に登録されたオブジェクトを可視化。黄色 = 車、ピンク = レック（Building）、青 = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | 注視しているもの（ルート、インフェクテッド、ダイナミックイベント）のエコノミーデータを画面上に表示 | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | Trajectory DEの統計を画面上に表示 | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | DEの統計を画面上に表示 | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | DEスポーンポイントを可視化・編集 | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | 最寄りのポイントにダイナミックイベントをスポーン、またはフォールバックとして "StaticChristmasTree" | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | DEポイントを `storage/export/eventSpawn_CLASSNAME.xml` にエクスポート | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | CE統計を画面上に表示 | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | CEが現在処理している内容を表示 | -- |
| **Idle Mode** | CEをスリープ状態にする（処理を停止） | -- |
| **Force Save** | `storage/data` フォルダ全体の保存を強制（プレイヤーデータベースは除外） | -- |

**Dynamic Events Visのキーバインド：**

| キー | 機能 |
|-----|----------|
| **[** | 利用可能なDEを後方にイテレート |
| **]** | 利用可能なDEを前方にイテレート |
| **LMB** | 選択したDEの新しいポイントを挿入 |
| **RMB** | カーソルに最も近いポイントを削除 |
| **MMB** | ホールドまたはクリックで角度を回転 |

---

## AI

### メニュー構成

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **重要：** AIデバッグは現在マルチプレイヤー環境では動作しません。

### Show NavMesh

ナビゲーションメッシュを可視化するデバッグシェイプを描画します。統計を含む画面上デバッグを表示します。

| キー | 機能 |
|-----|----------|
| **Numpad 0** | カメラ位置に「Test start」を登録 |
| **Numpad 1** | カメラ位置のタイルを再生成 |
| **Numpad 2** | カメラ位置周辺のタイルを再生成 |
| **Numpad 3** | 可視化タイプを前方にイテレート |
| **LAlt + Numpad 3** | 可視化タイプを後方にイテレート |
| **Numpad 4** | カメラ位置に「Test end」を登録。スタートとエンド間にスフィアとラインを描画。緑 = パスあり、赤 = パスなし |
| **Numpad 5** | NavMesh最近傍位置テスト（SamplePosition）。青のスフィア = クエリ、ピンクのスフィア = 結果 |
| **Numpad 6** | NavMeshレイキャストテスト。青のスフィア = クエリ、ピンクのスフィア = 結果 |

### Debug Pathgraph World

完了したパスジョブリクエスト数と現在ペンディング中の数を表示する画面上デバッグです。

### Debug Path Agent

AIのパスに関する画面上デバッグとデバッグシェイプです。AIエンティティをターゲットにして追跡対象として選択します。AIがどのようにパスを見つけるかに特に興味がある場合に使用します。

### Debug AI Agent

AIの警戒度と動作に関する画面上デバッグとデバッグシェイプです。AIエンティティをターゲットにして追跡対象として選択します。AIの意思決定と認識状態を理解したい場合に使用します。

---

## Sounds

### メニュー構成

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

現在再生中のサウンドのデバッグ可視化です。

| オプション | 説明 |
|--------|-------------|
| **none** | デフォルト、デバッグなし |
| **ImGui** | 別ウィンドウ（最新版）。フィルタリング対応、全カテゴリカバー。設定はプロファイルに `playing_sounds_imgui.ini` / `.bin` として保存 |
| **DbgUI** | レガシー。カテゴリフィルタリングあり、より読みやすいが、画面外に出る場合があり車両カテゴリが欠如 |
| **Engine** | レガシー。リアルタイムのカラーコード付きデータと統計を表示するが、画面外に出る場合がありカラー凡例なし |

### Show System Info

サウンドシステムの画面上デバッグ統計（バッファ数、アクティブソース数など）です。

---

## モッダーに便利な機能

すべてのオプションに用途がありますが、モッダーが最も頻繁に利用するものは以下です：

### パフォーマンス分析

1. **FPSカウンター**（LCtrl + Numpad 1）-- Modがフレームレートを破壊していないかの簡易チェック
2. **Script Profiler** -- どのクラスや関数が最もCPU時間を消費しているか特定。ModのスクリプトレイヤーにフォーカスするにはモジュールをWORLDまたはMISSIONに設定

### ビジュアルデバッグ

1. **フリーカメラ** -- スポーンされたオブジェクトの検査、位置の確認、遠距離からのAI動作のチェックのために飛び回る
2. **Geometry Diagnostic** -- ゲームを離れることなく、カスタムモデルのファイアジオメトリ、ビュージオメトリ、ロードウェイLOD、メモリポイントを検証
3. **Render Debug Mode**（RCtrl + RAlt + W）-- メッシュ密度とマテリアル割り当てを確認するためのワイヤーフレームオーバーレイを表示

### ゲームプレイテスト

1. **フリーカメラ + Insert** -- マップ上のどこにでもプレイヤーを瞬時にテレポート
2. **Weather Override** -- 視界依存機能をテストするための特定の霧条件を強制
3. **Central Economyツール** -- インフェクテッド、動物、ルート、ダイナミックイベントをオンデマンドでスポーン
4. **戦闘デバッグ** -- 射撃軌道のトレース、ヒットポイントダメージシステムの検査、爆発貫通のテスト

### AI開発

1. **Show NavMesh** -- AIが期待する場所に実際にナビゲートできることを検証
2. **Debug AI Agent** -- インフェクテッドや動物が何を考えているか、どの警戒レベルにあるかを確認
3. **Debug Path Agent** -- AIが実際に通っているパスとパスファインディングが成功しているかを確認

---

## Diag Menuを使用するタイミング

### 開発中

- **Script Profiler** -- フレームごとのコード（OnUpdate、EOnFrame）を最適化する際
- **フリーカメラ** -- オブジェクトの配置、スポーン位置の確認、モデル配置の検査
- **Geometry Diagnostic** -- 新しいモデルのインポート直後にLODとジオメトリタイプを検証
- **FPSカウンター** -- 新機能追加の前後のベースラインとして

### テスト中

- **戦闘デバッグ** -- 武器ダメージ、弾道動作、爆発効果の検証
- **CEツール** -- ルート分布、スポーンポイント、ダイナミックイベントのテスト
- **AIデバッグ** -- インフェクテッド/動物の動作がプレイヤーの存在に正しく反応するか検証
- **天候デバッグ** -- 異なる天候条件下でModをテスト

### バグ調査中

- **FPSカウンター + Script Profiler** -- プレイヤーからパフォーマンス問題が報告された場合
- **フリーカメラ + スペースバー**（オブジェクトデバッグ）-- 正しく動作していないオブジェクトの検査
- **Render Debug Mode** -- ビジュアルアーティファクトやマテリアル問題の診断
- **Show Bullet** -- 物理衝突問題のデバッグ

---

## よくある間違い

**製品版実行ファイルの使用。** Diag Menuは `DayZDiag_x64.exe` でのみ利用可能です。Win+Altを押しても何も起きない場合、製品版ビルドを実行しています。

**Max. Collider Distanceが0のまま。** 物理可視化（Draw Bullet shape）は、Max. Collider Distanceがデフォルトの0のままだと何も表示しません。周囲のコライダーを見るには少なくとも10〜20に設定してください。

**マルチプレイヤーでのCEツール。** ほとんどのCentral Economyデバッグオプションは、CEが有効なシングルプレイヤーでのみ動作します。専用サーバーで機能することを期待しないでください。

**マルチプレイヤーでのAIデバッグ。** AIデバッグは現在マルチプレイヤー環境では動作しません。AI動作はシングルプレイヤーでテストしてください。

**「Bullet」を弾薬と混同。** 「Enfusion World」カテゴリの「Bullet」オプションはBullet物理エンジンを指し、武器の弾薬ではありません。戦闘関連のデバッグはGame > Combatの下にあります。

**プロファイラーをオンのまま。** Script Profilerは測定可能なオーバーヘッドがあります。プロファイリング完了後はオフにして、正確なFPS読み取り値を取得してください。

**大きなコライダー距離値。** Max. Collider Distanceを200や500に設定すると、フレームレートが大幅に低下します。関心のあるエリアをカバーする最小の値を使用してください。

**前提条件の有効化忘れ。** いくつかのオプションは他のオプションが先に有効化されている必要があります：
- 「Draw Char Ctrl」と「Draw Bullet wireframe」は「Draw Bullet shape」に依存
- 「Edit Volume」はフリーカメラが必要
- 「Project Target Loot」は「Loot Vis」の有効化が必要

---

## 次のステップ

- **Chapter 8.6: [デバッグとテスト](06-debugging-testing.md)** -- スクリプトログ、Printデバッグ、ファイルパッチング、Workbench
- **Chapter 8.7: [Workshopへの公開](07-publishing-workshop.md)** -- テスト済みModのパッケージングと公開
