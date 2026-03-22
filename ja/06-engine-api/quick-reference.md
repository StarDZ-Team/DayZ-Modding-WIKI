# Engine API Quick Reference

[Home](../README.md) | **Engine API Quick Reference**

---

## 目次

- [エンティティメソッド](#エンティティメソッド)
- [体力とダメージ](#体力とダメージ)
- [型チェック](#型チェック)
- [インベントリ](#インベントリ)
- [エンティティの生成と削除](#エンティティの生成と削除)
- [プレイヤーメソッド](#プレイヤーメソッド)
- [車両メソッド](#車両メソッド)
- [天候メソッド](#天候メソッド)
- [ファイル I/O メソッド](#ファイル-io-メソッド)
- [タイマーと CallQueue メソッド](#タイマーと-callqueue-メソッド)
- [Widget 生成メソッド](#widget-生成メソッド)
- [RPC / ネットワーキングメソッド](#rpc--ネットワーキングメソッド)
- [数学定数とメソッド](#数学定数とメソッド)
- [ベクトルメソッド](#ベクトルメソッド)
- [グローバル関数](#グローバル関数)
- [ミッションフック](#ミッションフック)
- [アクションシステム](#アクションシステム)

---

## エンティティメソッド

*完全なリファレンス: [第6.1章: エンティティシステム](01-entity-system.md)*

### 位置と向き (Object)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetPosition` | `vector GetPosition()` | ワールド座標 |
| `SetPosition` | `void SetPosition(vector pos)` | ワールド座標を設定 |
| `GetOrientation` | `vector GetOrientation()` | ヨー、ピッチ、ロール（度数） |
| `SetOrientation` | `void SetOrientation(vector ori)` | ヨー、ピッチ、ロールを設定 |
| `GetDirection` | `vector GetDirection()` | 前方方向ベクトル |
| `SetDirection` | `void SetDirection(vector dir)` | 前方方向を設定 |
| `GetScale` | `float GetScale()` | 現在のスケール |
| `SetScale` | `void SetScale(float scale)` | スケールを設定 |

### トランスフォーム (IEntity)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetOrigin` | `vector GetOrigin()` | ワールド座標（エンジンレベル） |
| `SetOrigin` | `void SetOrigin(vector orig)` | ワールド座標を設定（エンジンレベル） |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | ヨー/ピッチ/ロールとしての回転 |
| `GetTransform` | `void GetTransform(out vector mat[4])` | 完全な 4x3 トランスフォーム行列 |
| `SetTransform` | `void SetTransform(vector mat[4])` | トランスフォームを設定 |
| `VectorToParent` | `vector VectorToParent(vector vec)` | ローカル方向をワールドに変換 |
| `CoordToParent` | `vector CoordToParent(vector coord)` | ローカル座標をワールドに変換 |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | ワールド方向をローカルに変換 |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | ワールド座標をローカルに変換 |

### 階層構造 (IEntity)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | ボーンに子をアタッチ |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | 子をデタッチ |
| `GetParent` | `IEntity GetParent()` | 親エンティティまたは null |
| `GetChildren` | `IEntity GetChildren()` | 最初の子エンティティ |
| `GetSibling` | `IEntity GetSibling()` | 次の兄弟エンティティ |

### 表示情報 (Object)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetType` | `string GetType()` | config クラス名（例: `"AKM"`） |
| `GetDisplayName` | `string GetDisplayName()` | ローカライズされた表示名 |
| `IsKindOf` | `bool IsKindOf(string type)` | config 継承のチェック |

### ボーン位置 (Object)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | ローカル空間でのボーン位置 |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | モデル空間でのボーン位置 |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | ワールド空間でのボーン位置 |

### Config アクセス (Object)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | config から bool を読み取り |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | config から int を読み取り |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | config から float を読み取り |
| `ConfigGetString` | `string ConfigGetString(string entry)` | config から string を読み取り |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | 文字列配列を読み取り |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | config エントリの存在チェック |

---

## 体力とダメージ

*完全なリファレンス: [第6.1章: エンティティシステム](01-entity-system.md)*

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetHealth` | `float GetHealth(string zone, string type)` | 体力値を取得 |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | 最大体力を取得 |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | 体力を設定 |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | 最大値に設定 |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | 体力を加算 |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | 体力を減少 |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | ダメージの有効/無効 |
| `GetAllowDamage` | `bool GetAllowDamage()` | ダメージ許可の確認 |
| `IsAlive` | `bool IsAlive()` | 生存チェック（EntityAI で使用） |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | ダメージを適用（EntityAI） |

**よく使われる zone/type の組み合わせ:** `("", "Health")` グローバル、`("", "Blood")` プレイヤーの血液量、`("", "Shock")` プレイヤーのショック値、`("Engine", "Health")` 車両エンジン。

---

## 型チェック

| メソッド | クラス | 説明 |
|--------|-------|-------------|
| `IsMan()` | Object | プレイヤーかどうか |
| `IsBuilding()` | Object | 建物かどうか |
| `IsTransport()` | Object | 車両かどうか |
| `IsDayZCreature()` | Object | クリーチャー（ゾンビ/動物）かどうか |
| `IsKindOf(string)` | Object | config 継承のチェック |
| `IsItemBase()` | EntityAI | インベントリアイテムかどうか |
| `IsWeapon()` | EntityAI | 武器かどうか |
| `IsMagazine()` | EntityAI | マガジンかどうか |
| `IsClothing()` | EntityAI | 衣類かどうか |
| `IsFood()` | EntityAI | 食料かどうか |
| `Class.CastTo(out, obj)` | Class | 安全なダウンキャスト（bool を返します） |
| `ClassName.Cast(obj)` | Class | インラインキャスト（失敗時は null を返します） |

---

## インベントリ

*完全なリファレンス: [第6.1章: エンティティシステム](01-entity-system.md)*

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetInventory` | `GameInventory GetInventory()` | インベントリコンポーネントを取得（EntityAI） |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | カーゴにアイテムを生成 |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | カーゴにアイテムを生成 |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | アタッチメントとしてアイテムを生成 |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | 全アイテムをリスト |
| `CountInventory` | `int CountInventory()` | アイテム数をカウント |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | アイテムの存在チェック |
| `AttachmentCount` | `int AttachmentCount()` | アタッチメント数 |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | インデックスでアタッチメントを取得 |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | スロット名でアタッチメントを取得 |

---

## エンティティの生成と削除

*完全なリファレンス: [第6.1章: エンティティシステム](01-entity-system.md)*

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | エンティティを生成 |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | ECE フラグ付きで生成 |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | サーバー側の即時削除 |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | クライアント側のみの削除 |
| `Delete` | `void obj.Delete()` | 遅延削除（次フレーム） |

### 主要な ECE フラグ

| フラグ | 値 | 説明 |
|------|-------|-------------|
| `ECE_NONE` | `0` | 特別な動作なし |
| `ECE_CREATEPHYSICS` | `1024` | コリジョンを生成 |
| `ECE_INITAI` | `2048` | AI を初期化 |
| `ECE_EQUIP` | `24576` | アタッチメント + カーゴ付きでスポーン |
| `ECE_PLACE_ON_SURFACE` | combined | 物理 + パス + トレース |
| `ECE_LOCAL` | `1073741824` | クライアントのみ（レプリケートされません） |
| `ECE_NOLIFETIME` | `4194304` | デスポーンしません |
| `ECE_KEEPHEIGHT` | `524288` | Y 座標を維持 |

---

## プレイヤーメソッド

*完全なリファレンス: [第6.1章: エンティティシステム](01-entity-system.md)*

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | プレイヤー識別オブジェクト |
| `GetIdentity().GetName()` | `string GetName()` | Steam/プラットフォーム表示名 |
| `GetIdentity().GetId()` | `string GetId()` | BI 固有 ID |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | Steam64 ID |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | セッションプレイヤー ID |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | 手に持っているアイテム |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | 運転中の車両 |
| `IsAlive` | `bool IsAlive()` | 生存チェック |
| `IsUnconscious` | `bool IsUnconscious()` | 意識不明チェック |
| `IsRestrained` | `bool IsRestrained()` | 拘束チェック |
| `IsInVehicle` | `bool IsInVehicle()` | 車両内チェック |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | プレイヤーの前方にスポーン |

---

## 車両メソッド

*完全なリファレンス: [第6.2章: 車両システム](02-vehicles.md)*

### 乗員 (Transport)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `CrewSize` | `int CrewSize()` | 総座席数 |
| `CrewMember` | `Human CrewMember(int idx)` | 座席の人物を取得 |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | 人物の座席を取得 |
| `CrewGetOut` | `void CrewGetOut(int idx)` | 座席から強制排出 |
| `CrewDeath` | `void CrewDeath(int idx)` | 乗員を死亡させる |

### エンジン (Car)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `EngineIsOn` | `bool EngineIsOn()` | エンジン稼働中か |
| `EngineStart` | `void EngineStart()` | エンジン始動 |
| `EngineStop` | `void EngineStop()` | エンジン停止 |
| `EngineGetRPM` | `float EngineGetRPM()` | 現在の RPM |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | レッドライン RPM |
| `GetGear` | `int GetGear()` | 現在のギア |
| `GetSpeedometer` | `float GetSpeedometer()` | 速度（km/h） |

### 流体 (Car)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | 最大容量 |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | 充填レベル 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | 流体を追加 |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | 流体を除去 |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | 全流体を排出 |

**CarFluid 列挙型:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### コントロール (Car)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0、-1 = 全輪 |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | ステアリング入力 |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 スロットル |

---

## 天候メソッド

*完全なリファレンス: [第6.3章: 天候システム](03-weather.md)*

### アクセス

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | 天候シングルトンを取得 |

### 気象現象 (Weather)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | 雲量 |
| `GetRain` | `WeatherPhenomenon GetRain()` | 雨 |
| `GetFog` | `WeatherPhenomenon GetFog()` | 霧 |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | 降雪 |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | 風速 |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | 風向 |
| `GetWind` | `vector GetWind()` | 風方向ベクトル |
| `GetWindSpeed` | `float GetWindSpeed()` | 風速 m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | 雷の設定 |

### WeatherPhenomenon

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetActual` | `float GetActual()` | 現在の補間値 |
| `GetForecast` | `float GetForecast()` | 目標値 |
| `GetDuration` | `float GetDuration()` | 残り時間（秒） |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | 目標を設定（サーバーのみ） |
| `SetLimits` | `void SetLimits(float min, float max)` | 値の範囲制限 |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | 変化速度の制限 |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | 変化量の制限 |

---

## ファイル I/O メソッド

*完全なリファレンス: [第6.8章: ファイル I/O と JSON](08-file-io.md)*

### パスプレフィックス

| プレフィックス | 場所 | 書き込み可能 |
|--------|----------|----------|
| `$profile:` | サーバー/クライアントのプロファイルディレクトリ | はい |
| `$saves:` | セーブディレクトリ | はい |
| `$mission:` | 現在のミッションフォルダ | 通常は読み取りのみ |
| `$CurrentDir:` | 作業ディレクトリ | 状況による |

### ファイル操作

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `FileExist` | `bool FileExist(string path)` | ファイルの存在チェック |
| `MakeDirectory` | `bool MakeDirectory(string path)` | ディレクトリを作成 |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | ファイルを開く（0 = 失敗） |
| `CloseFile` | `void CloseFile(FileHandle fh)` | ファイルを閉じる |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | テキストを書き込み（改行なし） |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | テキスト + 改行を書き込み |
| `FGets` | `int FGets(FileHandle fh, string line)` | 1行を読み取り |
| `ReadFile` | `string ReadFile(FileHandle fh)` | ファイル全体を読み取り |
| `DeleteFile` | `bool DeleteFile(string path)` | ファイルを削除 |
| `CopyFile` | `bool CopyFile(string src, string dst)` | ファイルをコピー |

### JSON (JsonFileLoader)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | JSON をオブジェクトに読み込み（**void を返します**） |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | オブジェクトを JSON として保存 |

### FileMode 列挙型

| 値 | 説明 |
|-------|-------------|
| `FileMode.READ` | 読み取り用に開く |
| `FileMode.WRITE` | 書き込み用に開く（作成/上書き） |
| `FileMode.APPEND` | 追記用に開く |

---

## タイマーと CallQueue メソッド

*完全なリファレンス: [第6.7章: タイマーと CallQueue](07-timers.md)*

### アクセス

| 式 | 戻り値 | 説明 |
|------------|---------|-------------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | ゲームプレイ用コールキュー |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | システム用コールキュー |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | GUI 用コールキュー |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | フレーム毎の更新キュー |

### ScriptCallQueue

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | 遅延/繰り返し呼び出しをスケジュール |
| `Call` | `void Call(func fn, param1..4)` | 次フレームで実行 |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | 文字列名でメソッドを呼び出し |
| `Remove` | `void Remove(func fn)` | スケジュール済み呼び出しをキャンセル |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | 文字列名でキャンセル |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | CallLater の残り時間を取得 |

### Timer クラス

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | コンストラクタ |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | タイマー開始 |
| `Stop` | `void Stop()` | タイマー停止 |
| `Pause` | `void Pause()` | タイマー一時停止 |
| `Continue` | `void Continue()` | タイマー再開 |
| `IsPaused` | `bool IsPaused()` | 一時停止中か |
| `IsRunning` | `bool IsRunning()` | 実行中か |
| `GetRemaining` | `float GetRemaining()` | 残り秒数 |

### ScriptInvoker

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Insert` | `void Insert(func fn)` | コールバックを登録 |
| `Remove` | `void Remove(func fn)` | コールバックを登録解除 |
| `Invoke` | `void Invoke(params...)` | 全コールバックを発火 |
| `Count` | `int Count()` | 登録済みコールバック数 |
| `Clear` | `void Clear()` | 全コールバックを削除 |

---

## Widget 生成メソッド

*完全なリファレンス: [第3.5章: プログラムによる Widget 作成](../03-gui-system/05-programmatic-widgets.md)*

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | UI ワークスペースを取得 |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | .layout ファイルを読み込み |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | 名前で子を検索（再帰的） |
| `Show` | `void Show(bool show)` | Widget の表示/非表示 |
| `SetText` | `void TextWidget.SetText(string text)` | テキスト内容を設定 |
| `SetImage` | `void ImageWidget.SetImage(int index)` | 画像インデックスを設定 |
| `SetColor` | `void SetColor(int color)` | Widget の色を設定（ARGB） |
| `SetAlpha` | `void SetAlpha(float alpha)` | 透明度を設定 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Widget のサイズを設定 |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Widget の位置を設定 |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | 画面解像度 |
| `Destroy` | `void Widget.Destroy()` | Widget を削除して破棄 |

### ARGB カラーヘルパー

| 関数 | シグネチャ | 説明 |
|----------|-----------|-------------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | カラー int を作成（各 0-255） |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | カラー int を作成（各 0.0-1.0） |

---

## RPC / ネットワーキングメソッド

*完全なリファレンス: [第6.9章: ネットワーキングと RPC](09-networking.md)*

### 環境チェック

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `GetGame().IsServer()` | `bool IsServer()` | サーバー / リッスンサーバーホストで true |
| `GetGame().IsClient()` | `bool IsClient()` | クライアントで true |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | マルチプレイヤーで true |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | 専用サーバーでのみ true |

### ScriptRPC

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `ScriptRPC()` | `void ScriptRPC()` | コンストラクタ |
| `Write` | `bool Write(void value)` | 値をシリアライズ（int, float, bool, string, vector, array） |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | RPC を送信 |
| `Reset` | `void Reset()` | 書き込みデータをクリア |

### 受信（Object で Override）

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | RPC 受信ハンドラ |

### ParamsReadContext

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Read` | `bool Read(out void value)` | 値をデシリアライズ（Write と同じ型） |

### レガシー RPC (CGame)

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | 単一の Param オブジェクトを送信 |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | 複数の Param を送信 |

### ScriptInputUserData（入力検証付き）

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | キューに空きがあるかチェック |
| `Write` | `bool Write(void value)` | 値をシリアライズ |
| `Send` | `void Send()` | サーバーに送信（クライアントのみ） |

---

## 数学定数とメソッド

*完全なリファレンス: [第1.7章: Math と Vector](../01-enforce-script/07-math-vectors.md)*

### 定数

| 定数 | 値 | 説明 |
|----------|-------|-------------|
| `Math.PI` | `3.14159...` | 円周率 |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | 度からラジアンへの乗数 |
| `Math.RAD2DEG` | `57.2957...` | ラジアンから度への乗数 |
| `int.MAX` | `2147483647` | int の最大値 |
| `int.MIN` | `-2147483648` | int の最小値 |
| `float.MAX` | `3.4028e+38` | float の最大値 |
| `float.MIN` | `1.175e-38` | float の最小正数 |

### 乱数

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | ランダム int [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | ランダム int [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | ランダム float [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | ランダム true/false |

### 丸め

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Math.Round` | `float Round(float f)` | 最も近い値に丸め |
| `Math.Floor` | `float Floor(float f)` | 切り捨て |
| `Math.Ceil` | `float Ceil(float f)` | 切り上げ |

### クランプと補間

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | 範囲内にクランプ |
| `Math.Min` | `float Min(float a, float b)` | 2つの最小値 |
| `Math.Max` | `float Max(float a, float b)` | 2つの最大値 |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | 線形補間 |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | 逆線形補間 |

### 絶対値とべき乗

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | 絶対値（float） |
| `Math.AbsInt` | `int AbsInt(int i)` | 絶対値（int） |
| `Math.Pow` | `float Pow(float base, float exp)` | べき乗 |
| `Math.Sqrt` | `float Sqrt(float f)` | 平方根 |
| `Math.SqrFloat` | `float SqrFloat(float f)` | 二乗（f * f） |

### 三角関数（ラジアン）

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Math.Sin` | `float Sin(float rad)` | サイン |
| `Math.Cos` | `float Cos(float rad)` | コサイン |
| `Math.Tan` | `float Tan(float rad)` | タンジェント |
| `Math.Asin` | `float Asin(float val)` | アークサイン |
| `Math.Acos` | `float Acos(float val)` | アークコサイン |
| `Math.Atan2` | `float Atan2(float y, float x)` | 成分からの角度 |

### スムースダンピング

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | 目標に向かってスムースにダンプ（Unity の SmoothDamp に類似） |

```c
// Smooth damping usage
// val: current value, target: target value, velocity: ref velocity (persisted between calls)
// smoothTime: smoothing time, maxSpeed: speed cap, dt: delta time
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### 角度

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | 0-360 に正規化 |

---

## ベクトルメソッド

| メソッド | シグネチャ | 説明 |
|--------|-----------|-------------|
| `vector.Distance` | `float Distance(vector a, vector b)` | 2点間の距離 |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | 2乗距離（高速） |
| `vector.Direction` | `vector Direction(vector from, vector to)` | 方向ベクトル |
| `vector.Dot` | `float Dot(vector a, vector b)` | 内積 |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | 位置の補間 |
| `v.Length()` | `float Length()` | ベクトルの大きさ |
| `v.LengthSq()` | `float LengthSq()` | 2乗の大きさ（高速） |
| `v.Normalized()` | `vector Normalized()` | 単位ベクトル |
| `v.VectorToAngles()` | `vector VectorToAngles()` | 方向からヨー/ピッチに変換 |
| `v.AnglesToVector()` | `vector AnglesToVector()` | ヨー/ピッチから方向に変換 |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | 行列乗算 |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | 逆行列乗算 |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | ベクトルを作成 |

---

## グローバル関数

| 関数 | シグネチャ | 説明 |
|----------|-----------|-------------|
| `GetGame()` | `CGame GetGame()` | ゲームインスタンス |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | ローカルプレイヤー（クライアントのみ） |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | 全プレイヤー（サーバー） |
| `GetGame().GetWorld()` | `World GetWorld()` | ワールドインスタンス |
| `GetGame().GetTickTime()` | `float GetTickTime()` | サーバー時間（秒） |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | UI ワークスペース |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | 指定位置の地形高さ |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | 地表マテリアルの種類 |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | 位置付近のオブジェクトを検索 |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | 画面解像度を取得 |
| `GetGame().IsServer()` | `bool IsServer()` | サーバーチェック |
| `GetGame().IsClient()` | `bool IsClient()` | クライアントチェック |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | マルチプレイヤーチェック |
| `Print(string)` | `void Print(string msg)` | スクリプトログに書き込み |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | 重要度付きでエラーをログ |
| `DumpStackString()` | `string DumpStackString()` | コールスタックを文字列で取得 |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | 文字列フォーマット（`%1`..`%9`） |

---

## ミッションフック

*完全なリファレンス: [第6.11章: ミッションフック](11-mission-hooks.md)*

### サーバーサイド (modded MissionServer)

| メソッド | 説明 |
|--------|-------------|
| `override void OnInit()` | マネージャーの初期化、RPC の登録 |
| `override void OnMissionStart()` | 全 Mod 読み込み後 |
| `override void OnUpdate(float timeslice)` | フレーム毎（アキュムレータを使用してください） |
| `override void OnMissionFinish()` | シングルトンのクリーンアップ、イベントの購読解除 |
| `override void OnEvent(EventType eventTypeId, Param params)` | チャット、ボイスイベント |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | プレイヤーが参加 |
| `override void InvokeOnDisconnect(PlayerBase player)` | プレイヤーが離脱 |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | クライアントがデータ受信準備完了 |
| `override void PlayerRegistered(int peerId)` | アイデンティティが登録済み |

### クライアントサイド (modded MissionGameplay)

| メソッド | 説明 |
|--------|-------------|
| `override void OnInit()` | クライアントマネージャーの初期化、HUD 作成 |
| `override void OnUpdate(float timeslice)` | フレーム毎のクライアント更新 |
| `override void OnMissionFinish()` | クリーンアップ |
| `override void OnKeyPress(int key)` | キーが押された |
| `override void OnKeyRelease(int key)` | キーが離された |

---

## アクションシステム

*完全なリファレンス: [第6.12章: アクションシステム](12-action-system.md)*

### アイテムにアクションを登録

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Add custom action
    RemoveAction(ActionEat);       // Remove vanilla action
}
```

### ActionBase の主要メソッド

| メソッド | 説明 |
|--------|-------------|
| `override void CreateConditionComponents()` | CCINone/CCTNone 距離条件の設定 |
| `override bool ActionCondition(...)` | カスタム検証ロジック |
| `override void OnExecuteServer(ActionData action_data)` | サーバーサイドでの実行 |
| `override void OnExecuteClient(ActionData action_data)` | クライアントサイドのエフェクト |
| `override string GetText()` | 表示名（`#STR_` キーをサポート） |

---

*完全なドキュメント: [ホーム](../README.md) | [チートシート](../cheatsheet.md) | [エンティティシステム](01-entity-system.md) | [車両](02-vehicles.md) | [天候](03-weather.md) | [タイマー](07-timers.md) | [ファイル I/O](08-file-io.md) | [ネットワーキング](09-networking.md) | [ミッションフック](11-mission-hooks.md) | [アクションシステム](12-action-system.md)*
