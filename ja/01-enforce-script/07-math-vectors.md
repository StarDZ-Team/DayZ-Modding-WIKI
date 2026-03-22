# 第1.7章: 数学とベクトル演算

[ホーム](../README.md) | [<< 前へ: 文字列操作](06-strings.md) | **数学とベクトル演算** | [次へ: メモリ管理 >>](08-memory-management.md)

---

## はじめに

DayZ MOD開発では、頻繁に数学的計算が必要になります: プレイヤー間の距離の算出、スポーン位置のランダム化、カメラ移動の補間、AIターゲティングの角度計算などです。Enforce Scriptはスカラー演算用の `Math` クラスと、3D数学用の静的ヘルパーを備えた `vector` 型を提供します。この章は、カテゴリ別に整理された両方の完全なリファレンスです。

---

## Mathクラス

`Math` クラスのすべてのメソッドは**静的**です。`Math.MethodName()` として呼び出します。

### 定数

| 定数 | 値 | 説明 |
|----------|-------|-------------|
| `Math.PI` | 3.14159265... | 円周率 |
| `Math.PI2` | 6.28318530... | 2 * Pi（ラジアンでの完全な円） |
| `Math.PI_HALF` | 1.57079632... | Pi / 2（四分円） |
| `Math.EULER` | 2.71828182... | オイラー数 |
| `Math.DEG2RAD` | 0.01745329... | 度にこれを掛けてラジアンを取得 |
| `Math.RAD2DEG` | 57.29577951... | ラジアンにこれを掛けて度を取得 |

```c
// 90度をラジアンに変換
float rad = 90 * Math.DEG2RAD; // 1.5707...

// PIラジアンを度に変換
float deg = Math.PI * Math.RAD2DEG; // 180.0
```

---

### 乱数

```c
// [min, max)の範囲のランダム整数 -- maxは排他的
int roll = Math.RandomInt(0, 10);           // 0から9

// [min, max]の範囲のランダム整数 -- maxは包含的
int dice = Math.RandomIntInclusive(1, 6);   // 1から6

// [min, max)の範囲のランダムfloat -- maxは排他的
float rf = Math.RandomFloat(0.0, 1.0);

// [min, max]の範囲のランダムfloat -- maxは包含的
float rf2 = Math.RandomFloatInclusive(0.0, 1.0);

// [0, 1]包含のランダムfloat（短縮形）
float chance = Math.RandomFloat01();

// ランダムbool
bool coinFlip = Math.RandomBool();

// 乱数ジェネレータのシード（-1でシステム時刻からシード）
Math.Randomize(-1);
```

#### DayZの例: ランダムなルート出現確率

```c
bool ShouldSpawnRareLoot(float rarity)
{
    // rarity: 0.0 = 出現しない、1.0 = 常に出現
    return Math.RandomFloat01() < rarity;
}

// レア武器の15%の確率
if (ShouldSpawnRareLoot(0.15))
{
    GetGame().CreateObject("VSS", position, false, false, true);
}
```

#### DayZの例: 半径内のランダムな位置

```c
vector GetRandomPositionInRadius(vector center, float radius)
{
    float angle = Math.RandomFloat(0, Math.PI2);
    float dist = Math.RandomFloat(0, radius);

    vector pos = center;
    pos[0] = pos[0] + Math.Cos(angle) * dist;
    pos[2] = pos[2] + Math.Sin(angle) * dist;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

    return pos;
}
```

---

### 四捨五入

```c
float rounded = Math.Round(5.6);   // 6.0
float rounded2 = Math.Round(5.4);  // 5.0
float floored = Math.Floor(5.9);   // 5.0
float ceiled = Math.Ceil(5.1);     // 6.0
```

#### DayZの例: グリッドにスナップした建物の配置

```c
vector SnapToGrid(vector pos, float gridSize)
{
    pos[0] = Math.Round(pos[0] / gridSize) * gridSize;
    pos[2] = Math.Round(pos[2] / gridSize) * gridSize;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
    return pos;
}
```

---

### 絶対値と符号

```c
float af = Math.AbsFloat(-5.5);    // 5.5
int ai = Math.AbsInt(-42);         // 42

float sf = Math.SignFloat(-5.0);   // -1.0
float sf2 = Math.SignFloat(5.0);   // 1.0
float sf3 = Math.SignFloat(0.0);   // 0.0

int si = Math.SignInt(-3);         // -1
int si2 = Math.SignInt(7);         // 1
```

---

### べき乗、平方根、対数

```c
float pw = Math.Pow(2, 10);        // 1024.0
float sq = Math.Sqrt(25);          // 5.0
float lg = Math.Log2(8);           // 3.0
```

---

### 三角関数

すべての三角関数は**ラジアン**で動作します。変換には `Math.DEG2RAD` と `Math.RAD2DEG` を使用してください。

```c
// 基本的な三角関数
float s = Math.Sin(Math.PI / 4);     // ~0.707
float c = Math.Cos(Math.PI / 4);     // ~0.707
float t = Math.Tan(Math.PI / 4);     // ~1.0

// 逆三角関数
float asin = Math.Asin(0.5);         // ~0.5236 rad（30度）
float acos = Math.Acos(0.5);         // ~1.0472 rad（60度）

// Atan2 -- x軸から点(y, x)への角度
float angle = Math.Atan2(1, 1);      // PI/4（~0.785 rad = 45度）
```

#### DayZの例: 2つの位置間の方向角度

```c
float GetAngleBetween(vector from, vector to)
{
    float dx = to[0] - from[0];
    float dz = to[2] - from[2];
    float angleRad = Math.Atan2(dx, dz);
    return angleRad * Math.RAD2DEG; // 度で返す
}
```

#### DayZの例: 円形にオブジェクトをスポーン

```c
void SpawnCircleOfBarrels(vector center, float radius, int count)
{
    float angleStep = Math.PI2 / count;

    for (int i = 0; i < count; i++)
    {
        float angle = angleStep * i;
        vector pos = center;
        pos[0] = pos[0] + Math.Cos(angle) * radius;
        pos[2] = pos[2] + Math.Sin(angle) * radius;
        pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

        GetGame().CreateObject("Barrel_Green", pos, false, false, true);
    }
}
```

---

### クランプとMin/Max

```c
// 値を範囲にクランプ
float clamped = Math.Clamp(15, 0, 10);  // 10（最大で制限）
float clamped2 = Math.Clamp(-5, 0, 10); // 0（最小で制限）
float clamped3 = Math.Clamp(5, 0, 10);  // 5（範囲内）

// MinとMax
float mn = Math.Min(3, 7);              // 3
float mx = Math.Max(3, 7);              // 7

// 値が範囲内かチェック
bool inRange = Math.IsInRange(5, 0, 10); // true
bool outRange = Math.IsInRange(15, 0, 10); // false
```

#### DayZの例: プレイヤーの体力をクランプ

```c
void ApplyDamage(PlayerBase player, float damage)
{
    float currentHealth = player.GetHealth("", "Health");
    float newHealth = Math.Clamp(currentHealth - damage, 0, 100);
    player.SetHealth("", "Health", newHealth);
}
```

---

### 補間

```c
// 線形補間（Lerp）
// a + (b - a) * t を返す。tは[0, 1]
float lerped = Math.Lerp(0, 100, 0.5);     // 50
float lerped2 = Math.Lerp(0, 100, 0.25);   // 25

// 逆Lerp -- t値を求める
// (value - a) / (b - a) を返す
float t = Math.InverseLerp(0, 100, 50);    // 0.5
float t2 = Math.InverseLerp(0, 100, 75);   // 0.75
```

#### SmoothCD（スムーズ臨界減衰）

`SmoothCD` はスムーズでフレームレート非依存の補間を提供します。カメラのスムージング、UIアニメーション、振動なしでターゲットに徐々に近づく値に最適です。

```c
// SmoothCD(current, target, velocity, smoothTime, maxSpeed, dt)
// velocityは参照で渡され、各呼び出しで更新される
float currentVal = 0;
float velocity = 0;
float target = 100;
float smoothTime = 0.3;

// フレームごとに呼び出し:
currentVal = Math.SmoothCD(currentVal, target, velocity, smoothTime, 1000, 0.016);
```

#### DayZの例: スムーズなカメラズーム

```c
class SmoothZoomCamera
{
    protected float m_CurrentFOV;
    protected float m_TargetFOV;
    protected float m_Velocity;

    void SmoothZoomCamera()
    {
        m_CurrentFOV = 70;
        m_TargetFOV = 70;
        m_Velocity = 0;
    }

    void SetZoom(float targetFOV)
    {
        m_TargetFOV = Math.Clamp(targetFOV, 20, 120);
    }

    void Update(float dt)
    {
        m_CurrentFOV = Math.SmoothCD(m_CurrentFOV, m_TargetFOV, m_Velocity, 0.2, 500, dt);
    }

    float GetFOV()
    {
        return m_CurrentFOV;
    }
}
```

---

### 角度演算

```c
// 角度を[0, 360)に正規化
float norm = Math.NormalizeAngle(370);   // 10
float norm2 = Math.NormalizeAngle(-30);  // 330

// 2つの角度の差（最短経路）
float diff = Math.DiffAngle(350, 10);   // -20
float diff2 = Math.DiffAngle(10, 350);  // 20
```

---

### 二乗と剰余

```c
// 二乗（Pow(x, 2)より高速）
float sqf = Math.SqrFloat(5);          // 25.0
int sqi = Math.SqrInt(5);              // 25

// float剰余
float mod = Math.ModFloat(5.5, 2.0);   // 1.5

// 整数を範囲にラップ
int wrapped = Math.WrapInt(12, 0, 10);  // 2
int wrapped2 = Math.WrapInt(-1, 0, 10); // 9
```

---

## vector型

`vector` 型は3つのfloatコンポーネント（x, y, z）を持つ組み込み値型です。DayZでは位置、方向、向き、スケールに広く使用されます。

### ベクトルの作成

```c
// 文字列初期化（x y zをスペースで区切り）
vector pos = "100.5 0 200.3";

// コンストラクタ関数
vector pos2 = Vector(100.5, 0, 200.3);

// デフォルト値（ゼロベクトル）
vector zero;           // "0 0 0"
```

### コンポーネントへのアクセス

```c
vector pos = Vector(10, 25, 30);

float x = pos[0]; // 10
float y = pos[1]; // 25（DayZでは高さ）
float z = pos[2]; // 30

pos[1] = 50.0;    // yコンポーネントを設定
```

> **DayZの座標系:** `[0]` は東西（X）、`[1]` は高さ（Y）、`[2]` は南北（Z）です。

### ベクトル定数

| 定数 | 値 | 説明 |
|----------|-------|-------------|
| `vector.Zero` | `"0 0 0"` | ゼロベクトル（原点） |
| `vector.Up` | `"0 1 0"` | 上方向を指す |
| `vector.Aside` | `"1 0 0"` | 東（X+）を指す |
| `vector.Forward` | `"0 0 1"` | 北（Z+）を指す |

---

### ベクトル演算（静的メソッド）

#### 距離

```c
vector a = Vector(0, 0, 0);
vector b = Vector(100, 0, 100);

float dist = vector.Distance(a, b);     // ~141.42
float distSq = vector.DistanceSq(a, b); // 20000（sqrtなし、高速）
```

> **パフォーマンスのヒント:** 距離を比較する場合は `DistanceSq` を使用してください。二乗された値を比較することで、コストの高い平方根計算を回避できます。

```c
// 良い例 -- 二乗距離を比較
float maxDistSq = 100 * 100; // 10000
if (vector.DistanceSq(playerPos, targetPos) < maxDistSq)
{
    Print("Target is within 100m");
}

// 遅い例 -- 実際の距離を計算
if (vector.Distance(playerPos, targetPos) < 100)
{
    Print("Target is within 100m");
}
```

#### 方向

1つの点から別の点への方向ベクトルを返します（正規化されていません）。

```c
vector dir = vector.Direction(from, to);
// 次と同等: to - from
```

#### 内積

```c
float dot = vector.Dot(a, b);
// dot > 0: ベクトルが似た方向を向いている
// dot = 0: ベクトルが直交
// dot < 0: ベクトルが反対方向を向いている
```

#### DayZの例: ターゲットがプレイヤーの前方にあるか?

```c
bool IsTargetInFront(PlayerBase player, vector targetPos)
{
    vector playerDir = player.GetDirection();
    vector toTarget = vector.Direction(player.GetPosition(), targetPos);
    toTarget.Normalize();

    float dot = vector.Dot(playerDir, toTarget);
    return dot > 0; // 正は前方を意味
}
```

#### 正規化

ベクトルを単位長（長さ1）に変換します。

```c
vector dir = Vector(3, 0, 4);
float len = dir.Length();      // 5.0

vector norm = dir.Normalized(); // Vector(0.6, 0, 0.8)
// norm.Length() == 1.0

// インプレース正規化
dir.Normalize();
// dirは Vector(0.6, 0, 0.8) になる
```

#### 長さ

```c
vector v = Vector(3, 4, 0);
float len = v.Length();        // 5.0
float lenSq = v.LengthSq();   // 25.0（高速、sqrtなし）
```

#### Lerp（静的）

2つのベクトル間の線形補間。

```c
vector start = Vector(0, 0, 0);
vector end = Vector(100, 50, 200);

vector mid = vector.Lerp(start, end, 0.5);
// mid = Vector(50, 25, 100)

vector quarter = vector.Lerp(start, end, 0.25);
// quarter = Vector(25, 12.5, 50)
```

#### RotateAroundZeroDeg（静的）

ベクトルを指定された軸の周りに指定された角度（度）で回転します。

```c
vector original = Vector(1, 0, 0); // 東を指す
vector axis = Vector(0, 1, 0);     // Y軸周りに回転
float angle = 90;                  // 90度

vector rotated = vector.RotateAroundZeroDeg(original, axis, angle);
// rotatedはおよそ Vector(0, 0, 1) -- 北を指す
```

#### ランダム方向

```c
vector rdir = vector.RandomDir();    // ランダムな3D方向（単位ベクトル）
vector rdir2d = vector.RandomDir2D(); // XZ平面のランダムな方向
```

---

### ベクトル算術

ベクトルは標準的な算術演算子をサポートします:

```c
vector a = Vector(1, 2, 3);
vector b = Vector(4, 5, 6);

vector sum = a + b;         // Vector(5, 7, 9)
vector diff = a - b;        // Vector(-3, -3, -3)
vector scaled = a * 2;      // Vector(2, 4, 6)

// 位置を前方に移動
vector pos = player.GetPosition();
vector dir = player.GetDirection();
vector ahead = pos + dir * 5; // プレイヤーの5メートル前方
```

### ベクトルを文字列に変換

```c
vector pos = Vector(100.5, 25.3, 200.7);
string s = pos.ToString(); // "<100.5, 25.3, 200.7>"
```

---

## Math3Dクラス

高度な3D演算には、`Math3D` クラスが行列と回転のユーティリティを提供します。

```c
// ヨー/ピッチ/ロール（度）から回転行列を作成
vector mat[3];
Math3D.YawPitchRollMatrix("45 0 0", mat);

// 回転行列を角度に変換
vector angles = Math3D.MatrixToAngles(mat);

// 単位行列（4x4）
vector mat4[4];
Math3D.MatrixIdentity4(mat4);
```

---

## 実世界の例

### 2人のプレイヤー間の距離計算

```c
float GetPlayerDistance(PlayerBase player1, PlayerBase player2)
{
    if (!player1 || !player2)
        return -1;

    return vector.Distance(player1.GetPosition(), player2.GetPosition());
}

void WarnProximity(PlayerBase player, array<Man> allPlayers, float warnDistance)
{
    vector myPos = player.GetPosition();
    float warnDistSq = warnDistance * warnDistance;

    foreach (Man man : allPlayers)
    {
        if (man == player)
            continue;

        if (vector.DistanceSq(myPos, man.GetPosition()) < warnDistSq)
        {
            Print(string.Format("Player nearby! Distance: %1m",
                vector.Distance(myPos, man.GetPosition())));
        }
    }
}
```

### 最も近いオブジェクトの検索

```c
Object FindClosest(vector origin, array<Object> objects)
{
    Object closest = null;
    float closestDistSq = float.MAX;

    foreach (Object obj : objects)
    {
        if (!obj)
            continue;

        float distSq = vector.DistanceSq(origin, obj.GetPosition());
        if (distSq < closestDistSq)
        {
            closestDistSq = distSq;
            closest = obj;
        }
    }

    return closest;
}
```

### パスに沿ったオブジェクトの移動

```c
class PathMover
{
    protected ref array<vector> m_Waypoints;
    protected int m_CurrentWaypoint;
    protected float m_Progress; // ウェイポイント間の0.0から1.0
    protected float m_Speed;    // 秒速メートル

    void PathMover(array<vector> waypoints, float speed)
    {
        m_Waypoints = waypoints;
        m_CurrentWaypoint = 0;
        m_Progress = 0;
        m_Speed = speed;
    }

    vector Update(float dt)
    {
        if (m_CurrentWaypoint >= m_Waypoints.Count() - 1)
            return m_Waypoints.Get(m_Waypoints.Count() - 1);

        vector from = m_Waypoints.Get(m_CurrentWaypoint);
        vector to = m_Waypoints.Get(m_CurrentWaypoint + 1);
        float segmentLength = vector.Distance(from, to);

        if (segmentLength > 0)
        {
            m_Progress += (m_Speed * dt) / segmentLength;
        }

        if (m_Progress >= 1.0)
        {
            m_Progress = 0;
            m_CurrentWaypoint++;
            return Update(0); // 次のセグメントで再計算
        }

        return vector.Lerp(from, to, m_Progress);
    }
}
```

### ポイント周りのスポーンリングの計算

```c
array<vector> GetSpawnRing(vector center, float radius, int count)
{
    array<vector> positions = new array<vector>;
    float angleStep = Math.PI2 / count;

    for (int i = 0; i < count; i++)
    {
        float angle = angleStep * i;
        vector pos = center;
        pos[0] = pos[0] + Math.Cos(angle) * radius;
        pos[2] = pos[2] + Math.Sin(angle) * radius;
        pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
        positions.Insert(pos);
    }

    return positions;
}
```

---

## ベストプラクティス

- タイトなループでは `vector.DistanceSq()` を使用し、`radius * radius` と比較してください -- `Distance()` 内の高価な `sqrt` を回避できます。
- `Sin()`/`Cos()` に角度を渡す前に必ず `Math.DEG2RAD` を掛けてください -- すべての三角関数はラジアンで動作します。
- `Normalize()` を呼び出す前に `v.Length() > 0` をチェックしてください -- ゼロ長ベクトルの正規化は `NaN` 値を生成します。
- 手動の `if` チェーンの代わりに `Math.Clamp()` を使用して、体力、ダメージ、UI値を制限してください。
- 最大値が到達可能であるべき場合（例: サイコロ投げ）は `Math.RandomIntInclusive()` を優先してください -- `RandomInt()` の最大値は排他的です。

---

## 実際のMODで確認されたパターン

> プロフェッショナルなDayZ MODソースコードの調査で確認されたパターンです。

| パターン | MOD | 詳細 |
|---------|-----|--------|
| 事前に二乗された閾値での `DistanceSq` | Expansion / COT | 近接チェックで `float maxDistSq = range * range` を格納し、`DistanceSq` と比較 |
| 方位用の `Math.Atan2(dx, dz) * RAD2DEG` | Expansion AI | ターゲットへの方向を向きの割り当て用に度単位の角度として計算 |
| スポーンリング用の `Math.RandomFloat(0, Math.PI2)` | Dabs / Expansion | ランダム角度 + `Cos`/`Sin` で円形のスポーン位置を生成 |
| 体力/ダメージ値の `Math.Clamp` | VPP / COT | すべてのダメージ適用で結果を `[0, maxHealth]` にクランプして負の値やオーバーフローを防止 |

---

## 理論と実践

| 概念 | 理論 | 実際 |
|---------|--------|---------|
| `Math.RandomInt(0, 10)` | 0-10包含と思うかもしれない | 最大値は排他的 -- 0-9を返す。包含的な最大値には `RandomIntInclusive` を使用 |
| `vector[1]` はY軸 | 標準的なXYZマッピング | DayZではYは垂直方向の高さ -- 他のエンジンのZ-up規則と混同しやすい |
| `Math.SqrFloat` vs `Math.Sqrt` | 名前が似ている | `SqrFloat(5)` = 25（値を二乗）、`Sqrt(25)` = 5（平方根） -- 逆の操作 |

---

## よくある間違い

| 間違い | 問題 | 修正 |
|---------|---------|-----|
| `Math.Sin()` / `Math.Cos()` に度を渡す | 三角関数はラジアンを期待 | 先に `Math.DEG2RAD` を掛ける |
| `Math.RandomInt(0, 10)` で10を期待 | 最大値は排他的 | 包含的な最大値には `Math.RandomIntInclusive(0, 10)` を使用 |
| タイトなループで `vector.Distance()` を計算 | `Distance` は `sqrt` を使用し低速 | `vector.DistanceSq()` を使用し二乗距離と比較 |
| ゼロ長ベクトルを正規化 | ゼロ除算、NaNが発生 | 正規化前に `v.Length() > 0` をチェック |
| DayZのYが上方向であることを忘れる | `pos[1]` は高さであり、Zではない | `[0]` = X（東）、`[1]` = Y（上）、`[2]` = Z（北） |
| t が[0,1]の外の `Lerp` を使用 | 範囲外に外挿される | `Math.Clamp(t, 0, 1)` でtをクランプ |
| `SqrFloat` と `Sqrt` の混同 | `SqrFloat` は値を二乗。`Sqrt` は平方根 | `Math.SqrFloat(5)` = 25、`Math.Sqrt(25)` = 5 |

---

## クイックリファレンス

```c
// 定数
Math.PI  Math.PI2  Math.PI_HALF  Math.EULER  Math.DEG2RAD  Math.RAD2DEG

// 乱数
Math.RandomInt(min, max)              // [min, max)
Math.RandomIntInclusive(min, max)     // [min, max]
Math.RandomFloat(min, max)            // [min, max)
Math.RandomFloatInclusive(min, max)   // [min, max]
Math.RandomFloat01()                  // [0, 1]
Math.RandomBool()
Math.Randomize(-1)                    // 時刻からシード

// 四捨五入
Math.Round(f)  Math.Floor(f)  Math.Ceil(f)

// 絶対値と符号
Math.AbsFloat(f)  Math.AbsInt(i)  Math.SignFloat(f)  Math.SignInt(i)

// べき乗と平方根
Math.Pow(base, exp)  Math.Sqrt(f)  Math.Log2(f)  Math.SqrFloat(f)

// 三角関数（ラジアン）
Math.Sin(r) Math.Cos(r) Math.Tan(r) Math.Asin(f) Math.Acos(f) Math.Atan2(y, x)

// クランプと補間
Math.Clamp(val, min, max)  Math.Min(a, b)  Math.Max(a, b)
Math.Lerp(a, b, t)  Math.InverseLerp(a, b, val)
Math.SmoothCD(cur, target, vel, smoothTime, maxSpeed, dt)
Math.IsInRange(val, min, max)

// 角度
Math.NormalizeAngle(deg)  Math.DiffAngle(a, b)

// ベクトル
vector.Distance(a, b)    vector.DistanceSq(a, b)
vector.Direction(from, to)
vector.Dot(a, b)          vector.Lerp(a, b, t)
vector.RotateAroundZeroDeg(vec, axis, angleDeg)
vector.RandomDir()        vector.RandomDir2D()
v.Length()  v.LengthSq()  v.Normalized()  v.Normalize()

// ベクトル定数
vector.Zero  vector.Up  vector.Aside  vector.Forward
```

---

[<< 1.6: 文字列操作](06-strings.md) | [ホーム](../README.md) | [1.8: メモリ管理 >>](08-memory-management.md)
