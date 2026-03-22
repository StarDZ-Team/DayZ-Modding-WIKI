# 第6.3章: 天候システム

[ホーム](../README.md) | [<< 前へ: 車両](02-vehicles.md) | **天候** | [次へ: カメラ >>](04-cameras.md)

---

## はじめに

DayZ には `Weather` クラスを通じて制御される完全に動的な天候システムがあります。このシステムは曇り、雨、降雪、霧、風、雷雨を管理します。天候はスクリプト（Weather API）、ミッションフォルダの `cfgweather.xml`、またはスクリプト化された天候ステートマシンを通じて設定できます。この章では、天候をプログラムで読み取りおよび制御するためのスクリプト API を解説します。

---

## Weather オブジェクトへのアクセス

```c
Weather weather = GetGame().GetWeather();
```

`Weather` オブジェクトはエンジンによって管理されるシングルトンです。ゲームワールドの初期化後は常に利用可能です。

---

## 気象現象

各気象現象（曇り、霧、雨、降雪、風速、風向）は `WeatherPhenomenon` オブジェクトで表現されます。`Weather` のゲッターメソッドを通じてアクセスします。

### 現象オブジェクトの取得

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### WeatherPhenomenon API

各現象は同じインターフェースを共有しています。

```c
class WeatherPhenomenon
{
    // 現在の状態
    proto native float GetActual();          // 現在の補間値（ほとんどの場合 0.0 - 1.0）
    proto native float GetForecast();        // 補間先の目標値
    proto native float GetDuration();        // 現在の予報が持続する時間（秒）

    // 予報の設定（サーバーのみ）
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: 目標値
    // time:     その値への補間にかかる秒数（0 = 即時）
    // minDuration: 自動変更前に値が保持される最小時間

    // 制限
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // 変化速度の制限（現象の変化速度の上限）
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // 変化量の制限
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**例 --- 現在の天候状態を読み取る:**

```c
Weather w = GetGame().GetWeather();
float overcast  = w.GetOvercast().GetActual();
float rain      = w.GetRain().GetActual();
float fog       = w.GetFog().GetActual();
float snow      = w.GetSnowfall().GetActual();
float windSpeed = w.GetWindMagnitude().GetActual();
float windDir   = w.GetWindDirection().GetActual();

Print(string.Format("Overcast: %1, Rain: %2, Fog: %3", overcast, rain, fog));
```

**例 --- 快晴の天候を強制する（サーバー）:**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // 快晴、30秒で遷移、10分間保持
    w.GetRain().Set(0.0, 10, 600);        // 雨なし
    w.GetFog().Set(0.0, 30, 600);         // 霧なし
    w.GetSnowfall().Set(0.0, 10, 600);    // 雪なし
}
```

**例 --- 嵐を作成する:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // 完全な曇り、60秒で上昇、30分間保持
    w.GetRain().Set(0.8, 120, 1800);      // 大雨
    w.GetFog().Set(0.3, 120, 1800);       // 薄い霧
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // 強風（m/s）
}
```

---

## 雨のしきい値

雨は曇りレベルに結びついています。エンジンは曇りがしきい値を超えた場合にのみ雨をレンダリングします。これは `cfgweather.xml` で設定できます。

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: 雨が許可される曇りの範囲
- `end`: 曇りがしきい値を下回った場合に雨が止むまでの秒数

スクリプトでは、曇りが低すぎる場合、`GetRain().GetActual()` がゼロ以外の値を返しても雨は視覚的に表示されません。

---

## 風

風には2つの現象があります: 風速（m/s での速度）と風向（ラジアンでの角度）。

### 風ベクトル

```c
proto native vector GetWind();           // 風向ベクトル（ワールド空間）
proto native float  GetWindSpeed();      // 風速（m/s）
```

**例 --- 風の情報を取得する:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## 雷雨（落雷）

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| パラメータ | 説明 |
|-----------|-------------|
| `density` | 落雷密度（0.0 - 1.0） |
| `threshold` | 落雷が発生するための最小曇りレベル（0.0 - 1.0） |
| `timeout` | 落雷間隔の秒数 |

**例 --- 頻繁な落雷を有効にする:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// 最大密度、60%の曇りでトリガー、10秒ごとに落雷
```

---

## MissionWeather コントロール

天候の手動制御（自動天候ステートマシンを無効化）を行うには、以下を呼び出します。

```c
proto native void MissionWeather(bool use);
```

`MissionWeather(true)` を呼び出すと、エンジンは自動天候遷移を停止し、スクリプト駆動の `Set()` 呼び出しのみが天候を制御します。

**例 --- init.c での完全な手動制御:**

```c
void main()
{
    // 天候の手動制御を取得
    GetGame().GetWeather().MissionWeather(true);

    // 希望する天候を設定
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## 日付と時刻

ゲームの日付と時刻はライティング、太陽の位置、昼夜サイクルに影響します。これらは `Weather` ではなく `World` オブジェクトを通じて制御されますが、密接に関連しています。

### 現在の日付/時刻の取得

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### 日付/時刻の設定（サーバーのみ）

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**例 --- 時刻を正午に設定する:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### 時間加速

時間加速は `serverDZ.cfg` で以下のように設定します。

```
serverTimeAcceleration = 12;      // 実時間の12倍
serverNightTimeAcceleration = 4;  // 夜間は4倍加速
```

スクリプトでは現在の時間倍率を読み取ることはできますが、通常ランタイムでは変更できません。

---

## WorldData 天候ステートマシン

バニラの DayZ は `WorldData` クラス（例: `ChernarusPlusData`, `EnochData`, `SakhalData`）でスクリプト化された天候ステートマシンを使用します。主要なオーバーライドポイントは以下の通りです。

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

`modded` WorldData クラスでこのメソッドをオーバーライドして、天候遷移をインターセプトおよび変更します。

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // 雨が0.5を超えるのを防ぐ
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

ミッションフォルダの `cfgweather.xml` ファイルは、スクリプトなしで天候を設定する宣言的な方法を提供します。存在する場合、デフォルトの天候ステートマシンパラメータをオーバーライドします。

主要な構造:

```xml
<weather reset="0" enable="1">
    <overcast>
        <current actual="0.45" time="120" duration="240" />
        <limits min="0.0" max="1.0" />
        <timelimits min="900" max="1800" />
        <changelimits min="0.0" max="1.0" />
    </overcast>
    <fog>...</fog>
    <rain>
        ...
        <thresholds min="0.5" max="1.0" end="120" />
    </rain>
    <snowfall>...</snowfall>
    <windMagnitude>...</windMagnitude>
    <windDirection>...</windDirection>
    <storm density="1.0" threshold="0.7" timeout="25"/>
</weather>
```

| 属性 | 説明 |
|-----------|-------------|
| `reset` | サーバー起動時にストレージから天候をリセットするかどうか |
| `enable` | このファイルがアクティブかどうか |
| `actual` | 初期値 |
| `time` | 初期値に到達するまでの秒数 |
| `duration` | 初期値が保持される秒数 |
| `limits min/max` | 現象値の範囲 |
| `timelimits min/max` | 遷移時間の範囲（秒） |
| `changelimits min/max` | 遷移ごとの変化量の範囲 |

---

## まとめ

| 概念 | 要点 |
|---------|-----------|
| アクセス | `GetGame().GetWeather()` が `Weather` シングルトンを返す |
| 現象 | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| 読み取り | `phenomenon.GetActual()` で現在値を取得（0.0 - 1.0） |
| 書き込み | `phenomenon.Set(forecast, transitionTime, holdDuration)` （サーバーのみ） |
| 嵐 | `SetStorm(density, threshold, timeout)` |
| 手動モード | `MissionWeather(true)` が自動天候変更を無効化 |
| 日付/時刻 | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| 設定ファイル | ミッションフォルダの `cfgweather.xml` で宣言的に設定 |

---

## ベストプラクティス

- **`init.c` で天候を設定する前に `MissionWeather(true)` を呼び出してください。** これがないと、自動天候ステートマシンが数秒以内に `Set()` 呼び出しをオーバーライドします。決定論的な天候が必要な場合は、まず手動制御を取得してください。
- **`Set()` では必ず `minDuration` パラメータを指定してください。** `minDuration` を 0 に設定すると、天候システムがすぐに値から遷移する可能性があります。希望する状態を保持するために少なくとも 300-600 秒を使用してください。
- **雨の前に曇りを設定してください。** 雨は曇りのしきい値に視覚的に結びついています。曇りが `cfgweather.xml` で設定されたしきい値未満の場合、`GetRain().GetActual()` がゼロ以外の値を返しても雨はレンダリングされません。
- **サーバー全体の天候ポリシーには `WeatherOnBeforeChange()` を使用してください。** `modded class ChernarusPlusData`（または適切な WorldData サブクラス）でこれをオーバーライドして、ステートマシンと闘わずに天候遷移をクランプまたはリダイレクトします。
- **両側で天候を読み取り、サーバーでのみ書き込んでください。** `GetActual()` と `GetForecast()` はクライアントとサーバーで動作しますが、`Set()` はサーバーでのみ効果があります。

---

## 互換性と影響

> **Mod 互換性:** 天候 Mod は一般的に WorldData サブクラスの `WeatherOnBeforeChange()` をオーバーライドします。マップの WorldData クラスごとに1つの Mod のオーバーライドチェーンのみが実行されます。

- **ロード順序:** 同じ WorldData サブクラス（例: `ChernarusPlusData`）で `WeatherOnBeforeChange` をオーバーライドする複数の Mod はすべて `super` を呼び出す必要があります。そうでないと、先にロードされた Mod の天候ロジックが失われます。
- **Modded クラスの衝突:** ある Mod が `MissionWeather(true)` を呼び出し、別の Mod が自動天候を期待している場合、根本的に互換性がありません。Mod が手動天候制御を取得するかどうかを文書化してください。
- **パフォーマンスへの影響:** Weather API の呼び出しは軽量です。現象の補間はスクリプトではなくエンジンで実行されます。頻繁な `Set()` 呼び出し（毎フレーム）は無駄ですが有害ではありません。
- **サーバー/クライアント:** すべての `Set()` 呼び出しはサーバー専用です。クライアントはエンジンの同期を通じて自動的に天候状態を受信します。クライアントサイドの `Set()` 呼び出しは無視されます。

---

## 実際の Mod で確認されたパターン

> これらのパターンは、プロフェッショナルな DayZ Mod のソースコードを研究して確認されました。

| パターン | Mod | ファイル/場所 |
|---------|-----|---------------|
| `MissionWeather(true)` + `CallLater` によるスクリプト天候サイクル | Expansion | ミッション初期化の天候コントローラー |
| 特定エリアの雨を防ぐ `WeatherOnBeforeChange` オーバーライド | COT Weather Module | Modded `ChernarusPlusData` |
| 長い保持時間で `Set()` を使用した快晴/嵐の管理コマンド | VPP Admin Tools | 天候管理パネル |
| 雪専用マップ向けカスタムしきい値の `cfgweather.xml` | Namalsk | ミッションフォルダの設定 |

---

[<< 前へ: 車両](02-vehicles.md) | **天候** | [次へ: カメラ >>](04-cameras.md)
