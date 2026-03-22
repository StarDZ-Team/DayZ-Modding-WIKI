# 第6.4章: カメラシステム

[ホーム](../README.md) | [<< 前へ: 天候](03-weather.md) | **カメラ** | [次へ: ポストプロセスエフェクト >>](05-ppe.md)

---

## はじめに

DayZ は多層カメラシステムを使用しています。プレイヤーカメラは `DayZPlayerCamera` サブクラスを通じてエンジンによって管理されます。Modding やデバッグ用には、`FreeDebugCamera` で自由飛行が可能です。エンジンは現在のカメラ状態へのグローバルアクセサーも提供しています。この章では、カメラの種類、カメラデータへのアクセス方法、スクリプトカメラツールの使い方を解説します。

---

## 現在のカメラ状態（グローバルアクセサー）

これらのメソッドはどこからでも利用可能で、カメラの種類に関係なくアクティブなカメラの状態を返します。

```c
// 現在のカメラのワールド位置
proto native vector GetGame().GetCurrentCameraPosition();

// 現在のカメラの前方方向（単位ベクトル）
proto native vector GetGame().GetCurrentCameraDirection();

// ワールド座標をスクリーン座標に変換
proto native vector GetGame().GetScreenPos(vector world_pos);
// 戻り値: x = スクリーン X（ピクセル）、y = スクリーン Y（ピクセル）、z = 深度（カメラからの距離）
```

**例 --- 位置が画面上にあるか確認する:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 はカメラの背後を意味する
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**例 --- カメラから地点までの距離を取得する:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## DayZPlayerCamera システム

DayZ のプレイヤーカメラは、エンジンのプレイヤーコントローラーによって管理されるネイティブクラスです。スクリプトから直接インスタンス化されることはありません --- 代わりに、プレイヤーの状態（立ち、伏せ、水泳、車両、意識不明など）に基づいてエンジンが適切なカメラを選択します。

### カメラの種類（DayZPlayerCameras 定数）

カメラタイプ ID は定数として定義されています。

| 定数 | 説明 |
|----------|-------------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | 一人称カメラ |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | 三人称 直立（立ち） |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | 三人称 しゃがみ |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | 三人称 伏せ |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | 三人称 ダッシュ |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | 三人称 武器構え |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | 三人称 しゃがみ武器構え |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | アイアンサイト照準 |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | 光学/スコープ照準 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | 三人称 車両 |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | 一人称 車両 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | 三人称 水泳 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | 三人称 意識不明 |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | 一人称 意識不明 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | 三人称 登攀 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | 三人称 ジャンプ |

### 現在のカメラタイプの取得

```c
DayZPlayer player = GetGame().GetPlayer();
if (player)
{
    int cameraType = player.GetCurrentCameraType();
    if (cameraType == DayZPlayerCameras.DAYZCAMERA_1ST)
    {
        Print("Player is in first person");
    }
}
```

---

## FreeDebugCamera

**ファイル:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

デバッグやシネマティック作業に使用されるフリーフライトカメラです。診断ビルドまたは Mod で有効にした場合に利用できます。

### インスタンスへのアクセス

```c
FreeDebugCamera GetFreeDebugCamera();
```

このグローバル関数はフリーカメラのシングルトンインスタンスを返します（存在しない場合は null）。

### 主要メソッド

```c
// フリーカメラの有効化/無効化
static void SetActive(bool active);
static bool GetActive();

// 位置と向き
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // ヨー、ピッチ、ロール

// 速度
void SetFlySpeed(float speed);
float GetFlySpeed();

// カメラの方向
vector GetDirection();
```

**例 --- フリーカメラを有効にしてテレポートする:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // やや下を見る
        cam.SetFlySpeed(10.0);
    }
}
```

---

## 視野角（FOV）

エンジンは FOV をネイティブに制御します。プレイヤーカメラシステムを通じて読み取りや変更が可能です。

### FOV の読み取り

```c
// 現在のカメラ FOV を取得
float fov = GetDayZGame().GetFieldOfView();
```

### DayZPlayerCamera の FOV オーバーライド

`DayZPlayerCamera` を拡張したカスタムカメラクラスでは、FOV をオーバーライドできます。

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // 約45度（ラジアン）
    }
}
```

---

## 被写界深度（DOF）

被写界深度はポストプロセスエフェクトシステムを通じて制御されます（[第6.5章](05-ppe.md)を参照）。ただし、カメラシステムは以下のメカニズムを通じて DOF と連携します。

### World を介した DOF の設定

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(フォーカス距離, フォーカス長, 近距離フォーカス長, ぼかし, フォーカス深度オフセット)
    // すべての値はメートル単位
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### DOF の無効化

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // すべてゼロで DOF を無効化
}
```

---

## ScriptCamera（GameLib）

**ファイル:** `2_GameLib/entities/scriptcamera.c`

GameLib レイヤーの低レベルスクリプトカメラエンティティです。カスタムカメラ実装の基盤となります。

### カメラの作成

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // ローカルのみ
);
```

### 主要メソッド

```c
proto native void SetFOV(float fov);          // ラジアン単位の FOV
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### カメラのアクティベーション

```c
// このカメラをアクティブなレンダリングカメラにする
GetGame().SelectPlayer(null, null);   // プレイヤーからデタッチ
GetGame().ObjectRelease(camera);      // エンジンに解放
```

> **注意:** プレイヤーカメラから切り替える場合、入力や HUD の慎重な処理が必要です。ほとんどの Mod では、カスタムカメラを作成する代わりにフリーデバッグカメラや PPE オーバーレイエフェクトを使用します。

---

## カメラからのレイキャスト

一般的なパターンとして、カメラ位置からカメラ方向にレイキャストを行い、プレイヤーが見ているオブジェクトを見つけます。

```c
Object GetObjectInCrosshair(float maxDistance)
{
    vector from = GetGame().GetCurrentCameraPosition();
    vector to = from + (GetGame().GetCurrentCameraDirection() * maxDistance);

    vector contactPos;
    vector contactDir;
    int contactComponent;
    set<Object> hitObjects = new set<Object>;

    if (DayZPhysics.RaycastRV(from, to, contactPos, contactDir,
                               contactComponent, hitObjects, null, null,
                               false, false, ObjIntersectView, 0.0))
    {
        if (hitObjects.Count() > 0)
            return hitObjects[0];
    }

    return null;
}
```

---

## まとめ

| 概念 | 要点 |
|---------|-----------|
| グローバルアクセサー | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| カメラの種類 | `DayZPlayerCameras` 定数（1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE など） |
| 現在のタイプ | `player.GetCurrentCameraType()` |
| フリーカメラ | `FreeDebugCamera.SetActive(true)` → `GetFreeDebugCamera()` |
| FOV | 読み取り: `GetDayZGame().GetFieldOfView()`、カメラクラスで `GetCurrentFOV()` をオーバーライド |
| DOF | `GetGame().GetWorld().SetDOF(focus, length, near, blur, offset)` |
| スクリーン変換 | `GetScreenPos(worldPos)` はピクセル XY + 深度 Z を返す |

---

## ベストプラクティス

- **フレーム内で複数回クエリする場合はカメラ位置をキャッシュしてください。** `GetGame().GetCurrentCameraPosition()` と `GetCurrentCameraDirection()` はエンジン呼び出しです --- 同一フレーム内で複数の計算に必要な場合はローカル変数に結果を格納してください。
- **UI 配置前に `GetScreenPos()` の深度チェックを使用してください。** ワールド位置に HUD マーカーを描画する前に必ず `screenPos[2] > 0`（カメラの前方）を確認してください。そうしないとマーカーがプレイヤーの背後に反転して表示されます。
- **単純なエフェクトのためにカスタム ScriptCamera インスタンスを作成することは避けてください。** FreeDebugCamera と PPE システムは、ほとんどのシネマティックおよびビジュアルのニーズをカバーします。カスタムカメラは入力/HUD の管理が複雑で壊れやすくなります。
- **エンジンのカメラタイプ遷移を尊重してください。** プレイヤーコントローラーの状態を完全に処理しない限り、スクリプトからカメラタイプの変更を強制しないでください。予期しないカメラ切り替えはプレイヤーの移動をロックしたりデシンクを引き起こしたりする可能性があります。
- **フリーカメラの使用は管理者/デバッグチェックの背後に置いてください。** FreeDebugCamera は神視点のワールド検査を提供します。悪用を防ぐために、認証された管理者または診断ビルドに対してのみ有効にしてください。

---

## 互換性と影響

- **マルチ Mod:** カメラアクセサーは読み取り専用のグローバルなので、複数の Mod が安全にカメラ状態を同時に読み取ることができます。衝突が発生するのは、2つの Mod が両方とも FreeDebugCamera またはカスタム ScriptCamera インスタンスをアクティベートしようとした場合のみです。
- **パフォーマンス:** `GetScreenPos()` と `GetCurrentCameraPosition()` は軽量なエンジン呼び出しです。カメラからのレイキャスト（`DayZPhysics.RaycastRV`）はより高コストです --- エンティティごとではなく、フレームごとに1回に制限してください。
- **サーバー/クライアント:** カメラ状態はクライアントにのみ存在します。すべてのカメラメソッドは専用サーバーでは無意味なデータを返します。サーバーサイドのロジックでカメラクエリを使用しないでください。

---

[<< 前へ: 天候](03-weather.md) | **カメラ** | [次へ: ポストプロセスエフェクト >>](05-ppe.md)
