# よくある質問

[ホーム](./README.md) | **FAQ**

---

## はじめに

### Q: DayZ のモッディングを始めるには何が必要ですか？
**A:** Steam、DayZ（製品版）、DayZ Tools（Steam のツールセクションから無料）、テキストエディタ（VS Code 推奨）が必要です。プログラミング経験は厳密には必要ありません --- [第 8.1 章: はじめての Mod](08-tutorials/01-first-mod.md) から始めましょう。DayZ Tools には Object Builder、Addon Builder、TexView2、Workbench IDE が含まれています。

### Q: DayZ はどのプログラミング言語を使用していますか？
**A:** DayZ は Bohemia Interactive の独自言語である **Enforce Script** を使用しています。C# に似た C 言語風の構文を持ちますが、独自のルールと制限があります（三項演算子なし、try/catch なし、ラムダなし）。完全な言語ガイドは [パート 1: Enforce Script](01-enforce-script/01-variables-types.md) を参照してください。

### Q: P: ドライブはどのように設定しますか？
**A:** Steam から DayZ Tools を開き、「Workdrive」または「Setup Workdrive」をクリックして P: ドライブをマウントします。これにより、エンジンが開発中にソースファイルを検索するモッディングワークスペースを指す仮想ドライブが作成されます。コマンドラインから `subst P: "C:\Your\Path"` を使用することもできます。[第 4.5 章](04-file-formats/05-dayz-tools.md) を参照してください。

### Q: 専用サーバーなしで Mod をテストできますか？
**A:** はい。DayZ を `-filePatching` パラメータと Mod を読み込んで起動してください。簡易テストにはリッスンサーバー（ゲーム内メニューからホスト）を使用してください。本番テストでは、一部のコードパスが異なるため、必ず専用サーバーでも確認してください。[第 8.1 章](08-tutorials/01-first-mod.md) を参照してください。

### Q: バニラの DayZ スクリプトファイルはどこにありますか？
**A:** DayZ Tools で P: ドライブをマウントした後、バニラスクリプトは `P:\DZ\scripts\` にレイヤー別（`3_Game`、`4_World`、`5_Mission`）で整理されています。これらはすべてのエンジンクラス、メソッド、イベントの権威ある参考資料です。[チートシート](cheatsheet.md) と [API クイックリファレンス](06-engine-api/quick-reference.md) も参照してください。

---

## よくあるエラーと修正

### Q: Mod は読み込まれますが何も起きません。ログにエラーもありません。
**A:** おそらく `config.cpp` の `requiredAddons[]` エントリが正しくないため、スクリプトの読み込みが早すぎるか、まったく行われていません。`requiredAddons` の各アドオン名が既存の `CfgPatches` クラス名と正確に一致していることを確認してください（大文字小文字を区別します）。`%localappdata%/DayZ/` のスクリプトログで警告がないか確認してください。[第 2.2 章](02-mod-structure/02-config-cpp.md) を参照してください。

### Q: 「Cannot find variable」や「Undefined variable」エラーが出ます。
**A:** これは通常、上位スクリプトレイヤーのクラスや変数を参照していることを意味します。下位レイヤー（`3_Game`）は上位レイヤー（`4_World`、`5_Mission`）で定義された型を参照できません。クラス定義を正しいレイヤーに移動するか、`typename` リフレクションを使用して疎結合にしてください。[第 2.1 章](02-mod-structure/01-five-layers.md) を参照してください。

### Q: `JsonFileLoader<T>.JsonLoadFile()` がデータを返しません。
**A:** `JsonLoadFile()` は `void` を返し、読み込んだオブジェクトを返しません。オブジェクトを事前に割り当て、参照パラメータとして渡す必要があります：`ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`。戻り値を代入すると、静かに `null` になります。[第 6.8 章](06-engine-api/08-file-io.md) を参照してください。

### Q: RPC を送信しましたが、反対側で受信されません。
**A:** 以下の一般的な原因を確認してください：(1) 送信者と受信者の間で RPC ID が一致していない。(2) クライアントから送信しているがクライアントで受信している（またはサーバー間通信になっている）。(3) `OnRPC()` またはカスタムハンドラーで RPC ハンドラーの登録を忘れている。(4) ターゲットエンティティが `null` またはネットワーク同期されていない。[第 6.9 章](06-engine-api/09-networking.md) と [第 7.3 章](07-patterns/03-rpc-patterns.md) を参照してください。

### Q: else-if ブロックで「Error: Member already defined」が出ます。
**A:** Enforce Script は同じスコープ内の兄弟 `else if` ブロックでの変数の再宣言を許可しません。`if` チェーンの前に変数を1回宣言するか、ブレースで別のスコープを使用してください。[第 1.12 章](01-enforce-script/12-gotchas.md) を参照してください。

### Q: UI レイアウトが何も表示されません / ウィジェットが見えません。
**A:** 一般的な原因：(1) ウィジェットのサイズがゼロ --- 幅/高さが正しく設定されていることを確認してください（負の値を使用しないこと）。(2) ウィジェットが `Show(true)` されていない。(3) テキストカラーのアルファが 0（完全に透明）。(4) `CreateWidgets()` のレイアウトパスが間違っている（エラーはスローされず、単に `null` を返す）。[第 3.3 章](03-gui-system/03-sizing-positioning.md) を参照してください。

### Q: Mod がサーバー起動時にクラッシュを引き起こします。
**A:** 以下を確認してください：(1) サーバー上でクライアント専用メソッド（`GetGame().GetPlayer()`、UI コード）を呼び出している。(2) ワールドの準備ができる前の `OnInit` や `OnMissionStart` での `null` 参照。(3) `super` を呼び忘れた `modded class` オーバーライドでの無限再帰。try/catch がないため、常にガード句を追加してください。[第 1.11 章](01-enforce-script/11-error-handling.md) を参照してください。

### Q: 文字列内のバックスラッシュや引用符がパースエラーを引き起こします。
**A:** Enforce Script のパーサー（CParser）は文字列リテラル内の `\\` や `\"` エスケープシーケンスをサポートしていません。バックスラッシュは完全に避けてください。ファイルパスにはフォワードスラッシュ（`"my/path/file.json"`）を使用してください。文字列内の引用符にはシングルクォート文字または文字列連結を使用してください。[第 1.12 章](01-enforce-script/12-gotchas.md) を参照してください。

---

## アーキテクチャに関する判断

### Q: 5 レイヤースクリプト階層とは何で、なぜ重要ですか？
**A:** DayZ スクリプトは 5 つの番号付きレイヤーでコンパイルされます：`1_Core`、`2_GameLib`、`3_Game`、`4_World`、`5_Mission`。各レイヤーは同じまたはそれより低い番号のレイヤーの型のみを参照できます。これによりアーキテクチャの境界が強制されます --- 共有 enum と定数は `3_Game` に、エンティティロジックは `4_World` に、UI/ミッションフックは `5_Mission` に配置してください。[第 2.1 章](02-mod-structure/01-five-layers.md) を参照してください。

### Q: `modded class` を使うべきか、新しいクラスを作るべきか？
**A:** 既存のバニラ動作を変更または拡張する必要がある場合（`PlayerBase` にメソッドを追加、`MissionServer` にフックするなど）は `modded class` を使用してください。何もオーバーライドする必要のない自己完結型システムには新しいクラスを作成してください。modded class は自動的にチェーンされます --- 他の Mod を壊さないよう、常に `super` を呼び出してください。[第 1.4 章](01-enforce-script/04-modded-classes.md) を参照してください。

### Q: クライアントとサーバーのコードはどう整理すべきですか？
**A:** 一方でのみ実行すべきコードには `#ifdef SERVER` と `#ifdef CLIENT` プリプロセッサガードを使用してください。大規模な Mod では、別々の PBO に分割してください：クライアント Mod（UI、レンダリング、ローカルエフェクト）とサーバー Mod（スポーン、ロジック、永続化）。これによりサーバーロジックがクライアントに漏洩するのを防ぎます。[第 2.5 章](02-mod-structure/05-file-organization.md) と [第 6.9 章](06-engine-api/09-networking.md) を参照してください。

### Q: シングルトンとモジュール/プラグイン、どちらを使うべきですか？
**A:** ライフサイクル管理（`OnInit`、`OnUpdate`、`OnMissionFinish`）が必要な場合はモジュール（CF の `PluginManager` または独自のモジュールシステムに登録）を使用してください。グローバルアクセスのみが必要なステートレスユーティリティサービスにはスタンドアロンのシングルトンを使用してください。状態やクリーンアップが必要なものにはモジュールが推奨されます。[第 7.1 章](07-patterns/01-singletons.md) と [第 7.2 章](07-patterns/02-module-systems.md) を参照してください。

### Q: サーバー再起動後も残るプレイヤーデータを安全に保存するにはどうすればよいですか？
**A:** `JsonFileLoader` を使用してサーバーの `$profile:` ディレクトリに JSON ファイルを保存してください。プレイヤーの Steam UID（`PlayerIdentity.GetId()` から取得）をファイル名として使用してください。プレイヤー接続時に読み込み、切断時と定期的に保存してください。try/catch がないため、常にガード句で欠落/破損したファイルを適切に処理してください。[第 7.4 章](07-patterns/04-config-persistence.md) と [第 6.8 章](06-engine-api/08-file-io.md) を参照してください。

---

## 公開と配布

### Q: Mod を PBO にパックするにはどうすればよいですか？
**A:** Addon Builder（DayZ Tools から）またはサードパーティツール（PBO Manager など）を使用してください。Mod のソースフォルダを指定し、正しいプレフィックス（`config.cpp` のアドオンプレフィックスと一致させる）を設定してビルドします。出力された `.pbo` ファイルは Mod の `Addons/` フォルダに配置します。[第 4.6 章](04-file-formats/06-pbo-packing.md) を参照してください。

### Q: サーバーで使用するために Mod に署名するにはどうすればよいですか？
**A:** DayZ Tools の DSSignFile または DSCreateKey でキーペアを生成します：`.biprivatekey` と `.bikey` が作成されます。秘密鍵で各 PBO に署名します（各 PBO の横に `.bisign` ファイルが作成されます）。`.bikey` をサーバー管理者に配布して `keys/` フォルダに配置してもらいます。`.biprivatekey` は決して共有しないでください。[第 4.6 章](04-file-formats/06-pbo-packing.md) を参照してください。

### Q: Steam Workshop に公開するにはどうすればよいですか？
**A:** DayZ Tools Publisher または Steam Workshop アップローダーを使用してください。Mod ルートに名前、作成者、説明を定義する `mod.cpp` ファイルが必要です。パブリッシャーがパック済みの PBO をアップロードし、Steam が Workshop ID を割り当てます。同じアカウントから再公開して更新します。[第 2.3 章](02-mod-structure/03-mod-cpp.md) と [第 8.7 章](08-tutorials/07-publishing-workshop.md) を参照してください。

### Q: 自分の Mod が他の Mod を依存関係として要求できますか？
**A:** はい。`config.cpp` で、依存する Mod の `CfgPatches` クラス名を `requiredAddons[]` 配列に追加してください。`mod.cpp` には正式な依存関係システムがないため、必要な Mod を Workshop の説明に記載してください。プレイヤーは必要な Mod すべてをサブスクライブして読み込む必要があります。[第 2.2 章](02-mod-structure/02-config-cpp.md) を参照してください。

---

## 高度なトピック

### Q: カスタムプレイヤーアクション（インタラクション）はどのように作成しますか？
**A:** `ActionBase`（またはサブクラスの `ActionInteractBase` など）を拡張し、前提条件として `CreateConditionComponents()` を定義し、ロジックとして `OnStart`/`OnExecute`/`OnEnd` をオーバーライドし、ターゲットエンティティの `SetActions()` で登録します。アクションは継続（ホールド）と即時（クリック）モードをサポートしています。[第 6.12 章](06-engine-api/12-action-system.md) を参照してください。

### Q: カスタムアイテムのダメージシステムはどのように機能しますか？
**A:** アイテムの config.cpp に `DamageZones`（名前付き領域）と `ArmorType` 値を持つ `DamageSystem` クラスを定義します。各ゾーンは独自の体力を追跡します。カスタムダメージの反応にはスクリプトで `EEHitBy()` と `EEKilled()` をオーバーライドしてください。エンジンはモデルの Fire Geometry コンポーネントをゾーン名にマッピングします。[第 6.1 章](06-engine-api/01-entity-system.md) を参照してください。

### Q: Mod にカスタムキーバインドを追加するにはどうすればよいですか？
**A:** デフォルトのキー割り当てで入力アクションを定義する `inputs.xml` ファイルを作成します。`GetUApi().RegisterInput()` でスクリプトに登録します。`GetUApi().GetInputByName("your_action").LocalPress()` で状態を照会します。`stringtable.csv` にローカライズされた名前を追加してください。[第 5.2 章](05-config-files/02-inputs-xml.md) と [第 6.13 章](06-engine-api/13-input-system.md) を参照してください。

### Q: 自分の Mod を他の Mod と互換性のあるものにするにはどうすればよいですか？
**A:** 以下の原則に従ってください：(1) modded class のオーバーライドでは常に `super` を呼び出す。(2) Mod プレフィックス付きのユニークなクラス名を使用する（例：`MyMod_Manager`）。(3) ユニークな RPC ID を使用する。(4) `super` を呼び出さずにバニラメソッドをオーバーライドしない。(5) `#ifdef` を使用してオプションの依存関係を検出する。(6) 人気の Mod の組み合わせ（CF、Expansion など）でテストする。[第 7.2 章](07-patterns/02-module-systems.md) を参照してください。

### Q: サーバーパフォーマンスのために Mod を最適化するにはどうすればよいですか？
**A:** 主要な戦略：(1) フレームごと（`OnUpdate`）のロジックを避ける --- タイマーまたはイベント駆動設計を使用。(2) `GetGame().GetPlayer()` を繰り返し呼び出す代わりに参照をキャッシュ。(3) `GetGame().IsServer()` / `GetGame().IsClient()` ガードを使用して不要なコードをスキップ。(4) `int start = TickCount(0);` ベンチマークでプロファイリング。(5) ネットワークトラフィックを制限 --- RPC をバッチ処理し、頻繁な小さな更新には Net Sync Variables を使用。[第 7.7 章](07-patterns/07-performance.md) を参照してください。

---

*ここで取り上げていない質問がありますか？リポジトリで Issue を開いてください。*
