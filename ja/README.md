# DayZ Modding 完全ガイド

> DayZ Modding の包括的なドキュメント — 92章、ゼロから公開Modまで。

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## 全ページ索引

### パート1: Enforce Script 言語 (13章)

| # | 章 | 説明 |
|---|---|------|
| 1.1 | [変数と型](01-enforce-script/01-variables-types.md) | プリミティブ型、変数宣言、型変換、デフォルト値 |
| 1.2 | [配列、マップ、セット](01-enforce-script/02-arrays-maps-sets.md) | データコレクション: array, map, set — 反復、検索、ソート |
| 1.3 | [クラスと継承](01-enforce-script/03-classes-inheritance.md) | クラス定義、継承、コンストラクタ、ポリモーフィズム |
| 1.4 | [Modded クラス](01-enforce-script/04-modded-classes.md) | Modded class システム、メソッドオーバーライド、super 呼び出し |
| 1.5 | [制御フロー](01-enforce-script/05-control-flow.md) | if/else、switch、while/for ループ、break、continue |
| 1.6 | [文字列操作](01-enforce-script/06-strings.md) | 文字列の操作、フォーマット、検索、比較 |
| 1.7 | [数学とベクトル](01-enforce-script/07-math-vectors.md) | 数学関数、3Dベクトル、距離、方向 |
| 1.8 | [メモリ管理](01-enforce-script/08-memory-management.md) | 参照カウント、ref、メモリリーク防止、参照循環 |
| 1.9 | [キャストとリフレクション](01-enforce-script/09-casting-reflection.md) | 型変換、Class.CastTo、ランタイム型チェック |
| 1.10 | [列挙型とプリプロセッサ](01-enforce-script/10-enums-preprocessor.md) | enum、#ifdef、#define、条件付きコンパイル |
| 1.11 | [エラー処理](01-enforce-script/11-error-handling.md) | try/catch なしのエラー処理パターン、ガード節 |
| 1.12 | [存在しないもの](01-enforce-script/12-gotchas.md) | Enforce Script 言語の30以上の落とし穴と制限 |
| 1.13 | [関数とメソッド](01-enforce-script/13-functions-methods.md) | 関数宣言、パラメータ、戻り値、static、proto |

### パート2: Mod 構造 (6章)

| # | 章 | 説明 |
|---|---|------|
| 2.1 | [5層階層](02-mod-structure/01-five-layers.md) | DayZ の5つのスクリプト層とコンパイル順序 |
| 2.2 | [config.cpp 詳細](02-mod-structure/02-config-cpp.md) | config.cpp の完全な構造、CfgPatches、CfgMods |
| 2.3 | [mod.cpp と Workshop](02-mod-structure/03-mod-cpp.md) | mod.cpp ファイル、Steam Workshop への公開 |
| 2.4 | [最初のMod](02-mod-structure/04-minimum-viable-mod.md) | 最小限の動作するMod — 必須ファイルと構造 |
| 2.5 | [ファイル整理](02-mod-structure/05-file-organization.md) | 命名規則、推奨フォルダ構造 |
| 2.6 | [サーバー/クライアントアーキテクチャ](02-mod-structure/06-server-client-split.md) | サーバーとクライアントコードの分離、セキュリティ |

### パート3: GUI & レイアウトシステム (10章)

| # | 章 | 説明 |
|---|---|------|
| 3.1 | [ウィジェットタイプ](03-gui-system/01-widget-types.md) | 利用可能な全ウィジェットタイプ: テキスト、画像、ボタン等 |
| 3.2 | [レイアウトファイル形式](03-gui-system/02-layout-files.md) | インターフェース用 .layout XML ファイルの構造 |
| 3.3 | [サイジングと配置](03-gui-system/03-sizing-positioning.md) | 座標系、サイズフラグ、アンカリング |
| 3.4 | [コンテナ](03-gui-system/04-containers.md) | コンテナウィジェット: WrapSpacer、GridSpacer、ScrollWidget |
| 3.5 | [プログラムによる作成](03-gui-system/05-programmatic-widgets.md) | コードによるウィジェット作成、GetWidgetUnderCursor、SetHandler |
| 3.6 | [イベント処理](03-gui-system/06-event-handling.md) | UIコールバック: OnClick、OnChange、OnMouseEnter |
| 3.7 | [スタイル、フォント、画像](03-gui-system/07-styles-fonts.md) | 利用可能なフォント、スタイル、画像の読み込み |
| 3.8 | [ダイアログとモーダル](03-gui-system/08-dialogs-modals.md) | ダイアログの作成、モーダルメニュー、確認 |
| 3.9 | [実際のMod UIパターン](03-gui-system/09-real-mod-patterns.md) | COT、VPP、Expansion、Dabs Framework の UIパターン |
| 3.10 | [高度なウィジェット](03-gui-system/10-advanced-widgets.md) | MapWidget、RenderTargetWidget、特殊ウィジェット |

### パート4: ファイル形式とツール (8章)

| # | 章 | 説明 |
|---|---|------|
| 4.1 | [テクスチャ](04-file-formats/01-textures.md) | .paa、.edds、.tga 形式 — 変換と使用法 |
| 4.2 | [3Dモデル](04-file-formats/02-models.md) | .p3d 形式、LOD、ジオメトリ、メモリポイント |
| 4.3 | [マテリアル](04-file-formats/03-materials.md) | .rvmat ファイル、シェーダー、サーフェスプロパティ |
| 4.4 | [オーディオ](04-file-formats/04-audio.md) | .ogg と .wss 形式、サウンド設定 |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | 公式 DayZ Tools でのワークフロー |
| 4.6 | [PBOパッキング](04-file-formats/06-pbo-packing.md) | PBOファイルの作成と展開 |
| 4.7 | [Workbench ガイド](04-file-formats/07-workbench-guide.md) | スクリプトとアセット編集のための Workbench 使用法 |
| 4.8 | [建物モデリング](04-file-formats/08-building-modeling.md) | ドアとはしご付き建物のモデリング |

### パート5: 設定ファイル (6章)

| # | 章 | 説明 |
|---|---|------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | stringtable.csv による13言語へのローカライズ |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | キー設定とカスタムキーバインド |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Mod のクレジットファイル |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | アイコンとスプライト用 ImageSet 形式 |
| 5.5 | [サーバー設定](05-config-files/05-server-configs.md) | DayZ サーバー設定ファイル |
| 5.6 | [スポーン設定](05-config-files/06-spawning-gear.md) | 初期装備とスポーンポイントの設定 |

### パート6: エンジンAPIリファレンス (23章)

| # | 章 | 説明 |
|---|---|------|
| 6.1 | [エンティティシステム](06-engine-api/01-entity-system.md) | エンティティ階層、EntityAI、ItemBase、Object |
| 6.2 | [車両システム](06-engine-api/02-vehicles.md) | 車両API、エンジン、流体、物理シミュレーション |
| 6.3 | [天候システム](06-engine-api/03-weather.md) | 天候制御、雨、霧、雲量 |
| 6.4 | [カメラシステム](06-engine-api/04-cameras.md) | カスタムカメラ、位置、回転、トランジション |
| 6.5 | [ポストプロセスエフェクト](06-engine-api/05-ppe.md) | PPE: ブラー、色収差、カラーグレーディング |
| 6.6 | [通知システム](06-engine-api/06-notifications.md) | 画面上の通知、プレイヤーへのメッセージ |
| 6.7 | [タイマーと CallQueue](06-engine-api/07-timers.md) | タイマー、遅延呼び出し、繰り返し |
| 6.8 | [ファイルI/O と JSON](06-engine-api/08-file-io.md) | ファイル読み書き、JSONパース |
| 6.9 | [ネットワークと RPC](06-engine-api/09-networking.md) | ネットワーク通信、RPC、クライアント-サーバー同期 |
| 6.10 | [中央経済](06-engine-api/10-central-economy.md) | ルートシステム、カテゴリ、フラグ、min/max |
| 6.11 | [ミッションフック](06-engine-api/11-mission-hooks.md) | ミッションフック、MissionBase、MissionServer |
| 6.12 | [アクションシステム](06-engine-api/12-action-system.md) | プレイヤーアクション、ActionBase、ターゲット、条件 |
| 6.13 | [入力システム](06-engine-api/13-input-system.md) | キーキャプチャ、マッピング、UAInput |
| 6.14 | [プレイヤーシステム](06-engine-api/14-player-system.md) | PlayerBase、インベントリ、体力、スタミナ、統計 |
| 6.15 | [サウンドシステム](06-engine-api/15-sound-system.md) | オーディオ再生、SoundOnVehicle、環境音 |
| 6.16 | [クラフトシステム](06-engine-api/16-crafting-system.md) | クラフトレシピ、材料、結果 |
| 6.17 | [建設システム](06-engine-api/17-construction-system.md) | 拠点建設、建設パーツ、状態 |
| 6.18 | [アニメーションシステム](06-engine-api/18-animation-system.md) | プレイヤーアニメーション、コマンドID、コールバック |
| 6.19 | [地形クエリ](06-engine-api/19-terrain-queries.md) | レイキャスト、地形位置、サーフェス |
| 6.20 | [パーティクルエフェクト](06-engine-api/20-particle-effects.md) | パーティクルシステム、エミッター、視覚効果 |
| 6.21 | [ゾンビ & AIシステム](06-engine-api/21-zombie-ai-system.md) | ZombieBase、感染者AI、行動 |
| 6.22 | [管理者とサーバー](06-engine-api/22-admin-server.md) | サーバー管理、BAN、キック、RCON |
| 6.23 | [ワールドシステム](06-engine-api/23-world-systems.md) | 時刻、日付、ワールド関数 |

### パート7: パターンとベストプラクティス (7章)

| # | 章 | 説明 |
|---|---|------|
| 7.1 | [シングルトンパターン](07-patterns/01-singletons.md) | 単一インスタンス、グローバルアクセス、初期化 |
| 7.2 | [モジュールシステム](07-patterns/02-module-systems.md) | モジュール登録、ライフサイクル、CFモジュール |
| 7.3 | [RPC通信](07-patterns/03-rpc-patterns.md) | 安全で効率的なRPCのパターン |
| 7.4 | [設定の永続化](07-patterns/04-config-persistence.md) | JSON設定の保存/読み込み、バージョニング |
| 7.5 | [権限システム](07-patterns/05-permissions.md) | 階層的権限、ワイルドカード、グループ |
| 7.6 | [イベント駆動アーキテクチャ](07-patterns/06-events.md) | イベントバス、パブリッシュ/サブスクライブ、疎結合 |
| 7.7 | [パフォーマンス最適化](07-patterns/07-performance.md) | プロファイリング、キャッシュ、プーリング、RPC削減 |

### パート8: チュートリアル (13章)

| # | 章 | 説明 |
|---|---|------|
| 8.1 | [最初のMod (Hello World)](08-tutorials/01-first-mod.md) | ステップバイステップ: Modを作成して読み込む |
| 8.2 | [カスタムアイテムの作成](08-tutorials/02-custom-item.md) | モデル、テクスチャ、設定付きアイテムの作成 |
| 8.3 | [管理パネルの構築](08-tutorials/03-admin-panel.md) | テレポート、スポーン、管理機能付き管理者UI |
| 8.4 | [チャットコマンドの追加](08-tutorials/04-chat-commands.md) | ゲーム内チャットのカスタムコマンド |
| 8.5 | [Modテンプレートの使用](08-tutorials/05-mod-template.md) | 公式 DayZ Mod テンプレートの使い方 |
| 8.6 | [デバッグとテスト](08-tutorials/06-debugging-testing.md) | ログ、デバッグ、診断ツール |
| 8.7 | [Workshop への公開](08-tutorials/07-publishing-workshop.md) | Steam Workshop へのMod公開 |
| 8.8 | [HUDオーバーレイの構築](08-tutorials/08-hud-overlay.md) | ゲーム上のカスタムHUDオーバーレイ |
| 8.9 | [プロフェッショナルModテンプレート](08-tutorials/09-professional-template.md) | 本番環境対応の完全テンプレート |
| 8.10 | [車両Modの作成](08-tutorials/10-vehicle-mod.md) | 物理と設定付きカスタム車両 |
| 8.11 | [衣服Modの作成](08-tutorials/11-clothing-mod.md) | テクスチャとスロット付きカスタム衣服 |
| 8.12 | [取引システムの構築](08-tutorials/12-trading-system.md) | プレイヤー/NPC間の取引システム |
| 8.13 | [Diag Menu リファレンス](08-tutorials/13-diag-menu.md) | 開発用の診断メニュー |

### クイックリファレンス

| ページ | 説明 |
|--------|------|
| [チートシート](cheatsheet.md) | Enforce Script 構文の早見表 |
| [APIクイックリファレンス](06-engine-api/quick-reference.md) | 最も使用されるエンジンAPIメソッド |
| [用語集](glossary.md) | DayZ Modding で使われる用語の定義 |
| [FAQ](faq.md) | Modding に関するよくある質問 |
| [トラブルシューティングガイド](troubleshooting.md) | 91の一般的な問題と解決策 |

---

## クレジット

| 開発者 | プロジェクト | 主な貢献 |
|--------|------------|----------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | モジュールシステム、RPC、権限、ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC、ViewBinding、エディタUI |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | マーケット、グループ、マップマーカー、車両 |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | 中央経済、設定バージョニング |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | プレイヤー管理、Webhook、ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | 権限、サーバー管理 |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | カラーテーマ、Modded class UIパターン |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | UIカラーシステム、ビジュアル改善 |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script、バニラスクリプト、DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | この Wiki | ドキュメント、翻訳、組織化 |

## ライセンス

ドキュメントは [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/) に基づいてライセンスされています。
コード例は [**MIT**](../LICENCE) に基づいてライセンスされています。
