# Chapter 4.4: オーディオ (.ogg, .wss)

[Home](../README.md) | [<< 前: マテリアル](03-materials.md) | **オーディオ** | [次: DayZ Tools ワークフロー >>](05-dayz-tools.md)

---

## はじめに

サウンドデザインは、DayZ Moddingにおいて最も没入感を高める要素の一つです。ライフルの発砲音から森の環境風音まで、オーディオはゲームの世界に命を吹き込みます。DayZは主要なオーディオフォーマットとして**OGG Vorbis**を使用し、`config.cpp`で定義された**CfgSoundShaders**と**CfgSoundSets**の階層システムを通じてサウンド再生を設定します。生のオーディオファイルからゲーム内の空間音声化まで、このパイプラインを理解することは、カスタム武器、車両、環境エフェクト、またはUIフィードバックを導入するあらゆるMODにとって不可欠です。

この章では、オーディオフォーマット、設定駆動型のサウンドシステム、3Dポジショナルオーディオ、音量と距離減衰、ループ、そしてDayZ MODにカスタムサウンドを追加するための完全なワークフローを扱います。

---

## 目次

- [オーディオフォーマット](#audio-formats)
- [CfgSoundShadersとCfgSoundSets](#cfgsoundshaders-and-cfgsoundsets)
- [サウンドカテゴリ](#sound-categories)
- [3Dポジショナルオーディオ](#3d-positional-audio)
- [音量と距離減衰](#volume-and-distance-attenuation)
- [ループサウンド](#looping-sounds)
- [MODへのカスタムサウンドの追加](#adding-custom-sounds-to-a-mod)
- [オーディオ制作ツール](#audio-production-tools)
- [よくある間違い](#common-mistakes)
- [ベストプラクティス](#best-practices)

---

## オーディオフォーマット

### OGG Vorbis（主要フォーマット）

**OGG Vorbis**はDayZの主要オーディオフォーマットです。すべてのカスタムサウンドは`.ogg`ファイルとしてエクスポートする必要があります。

| プロパティ | 値 |
|----------|-------|
| **拡張子** | `.ogg` |
| **コーデック** | Vorbis（非可逆圧縮） |
| **サンプルレート** | 44100 Hz（標準）、22050 Hz（環境音には許容範囲） |
| **ビット深度** | エンコーダーが管理（品質設定） |
| **チャンネル** | モノラル（3Dサウンド用）またはステレオ（音楽/UI用） |
| **品質範囲** | -1〜10（ゲームオーディオには5-7を推奨） |

### DayZにおけるOGGの主要ルール

- **3Dポジショナルサウンドはモノラルである必要があります。** 3Dサウンドにステレオファイルを使用すると、エンジンが正しく空間音声化できない場合や、片方のチャンネルが無視される場合があります。
- **UIや音楽のサウンドはステレオでも構いません。** 非ポジショナルサウンド（メニュー、HUDフィードバック、BGM）はステレオで正しく動作します。
- **サンプルレートはほとんどのサウンドで44100 Hzにする必要があります。** 遠方の環境音では容量節約のために低いレート（22050 Hz）を使用できます。

### WSS（レガシーフォーマット）

**WSS**は旧Bohemiaタイトル（Armaシリーズ）のレガシーサウンドフォーマットです。DayZは引き続きWSSファイルを読み込めますが、新しいMODではOGGのみを使用すべきです。

| プロパティ | 値 |
|----------|-------|
| **拡張子** | `.wss` |
| **ステータス** | レガシー、新しいMODには非推奨 |
| **変換** | WSSファイルはAudacityや同様のツールでOGGに変換できます |

バニラDayZのデータを調べたり、旧Bohemiaゲームからコンテンツを移植する際にWSSファイルに遭遇することがあります。

---

## CfgSoundShadersとCfgSoundSets

DayZのオーディオシステムは、`config.cpp`で定義される2層の設定アプローチを使用します。**SoundShader**はどのオーディオファイルをどのように再生するかを定義し、**SoundSet**はそのサウンドがワールド内でどこでどのように聞こえるかを定義します。

### 関係性

```
config.cpp
  |
  |--> CfgSoundShaders     (何を再生するか: ファイル、音量、周波数)
  |      |
  |      |--> MyShader      参照 --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         (どのように再生するか: 3D位置、距離、空間)
         |
         |--> MySoundSet    参照 --> MyShader
```

ゲームコードや他の設定は**SoundSets**を参照し、SoundShadersを直接参照することはありません。SoundSetsはパブリックインターフェースであり、SoundShadersは実装の詳細です。

### CfgSoundShaders

SoundShaderは、生のオーディオコンテンツと基本的な再生パラメータを定義します：

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        // オーディオファイルの配列 -- エンジンがランダムに1つを選択
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {パス（拡張子なし）, 確率ウェイト}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;                          // 基本音量 (0.0 - 1.0)
        range = 300;                           // 最大可聴距離（メートル）
        rangeCurve[] = {{0, 1.0}, {300, 0.0}}; // 音量減衰カーブ
    };
};
```

#### SoundShaderのプロパティ

| プロパティ | 型 | 説明 |
|----------|------|-------------|
| `samples[]` | array | `{パス, ウェイト}`ペアのリスト。パスにはファイル拡張子を含めません。 |
| `volume` | float | 基本音量の乗数（0.0〜1.0）。 |
| `range` | float | メートル単位の最大可聴距離。 |
| `rangeCurve[]` | array | 距離に対する減衰を定義する`{距離, 音量}`ポイントの配列。 |
| `frequency` | float | 再生速度の乗数。1.0 = 通常、0.5 = 半速（低ピッチ）、2.0 = 倍速（高ピッチ）。 |

> **重要：** `samples[]`のパスにはファイル拡張子を含めません。エンジンはディスク上にあるものに基づいて自動的に`.ogg`（または`.wss`）を追加します。

### CfgSoundSets

SoundSetは1つ以上のSoundShadersをラップし、空間的および動作的なプロパティを定義します：

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;          // 音量スケーリング（シェーダーの音量に加えて適用）
        frequencyFactor = 1.0;       // 周波数スケーリング
        volumeCurve = "InverseSquare"; // 定義済み減衰カーブ名
        spatial = 1;                  // 1 = 3Dポジショナル、0 = 2D (HUD/メニュー)
        doppler = 0;                  // 1 = ドップラー効果を有効化
        loop = 0;                     // 1 = 連続ループ
    };
};
```

#### SoundSetのプロパティ

| プロパティ | 型 | 説明 |
|----------|------|-------------|
| `soundShaders[]` | array | 結合するSoundShaderクラス名のリスト。 |
| `volumeFactor` | float | シェーダーの音量に加えて適用される追加の音量乗数。 |
| `frequencyFactor` | float | 追加の周波数/ピッチ乗数。 |
| `frequencyRandomizer` | float | ランダムなピッチ変動（0.0 = なし、0.1 = +/- 10%）。 |
| `volumeCurve` | string | 名前付き減衰カーブ：`"InverseSquare"`、`"Linear"`、`"Logarithmic"`。 |
| `spatial` | int | 3Dポジショナルオーディオは`1`、2D（UI、音楽）は`0`。 |
| `doppler` | int | 移動する音源のドップラーピッチシフトを有効にするには`1`。 |
| `loop` | int | 連続ループは`1`、ワンショットは`0`。 |
| `distanceFilter` | int | 距離でのローパスフィルタ適用は`1`（遠くのこもったサウンド）。 |
| `occlusionFactor` | float | 壁/地形がサウンドをどの程度消すか（0.0〜1.0）。 |
| `obstructionFactor` | float | 音源とリスナー間の障害物がサウンドにどの程度影響するか。 |

---

## サウンドカテゴリ

DayZはサウンドをカテゴリに分類し、ゲームのオーディオミキシングシステムとの相互作用に影響を与えます。

### 武器サウンド

武器サウンドはDayZで最も複雑なオーディオであり、通常、1回の射撃で複数のSoundSetが関与します：

```
射撃
  |--> 近距離射撃SoundSet       （近くで聞こえる「バン」）
  |--> 遠距離射撃SoundSet    （遠くで聞こえる低音/エコー）
  |--> テールSoundSet             （後に続くリバーブ/エコー）
  |--> 超音速クラックSoundSet （頭上を通過する弾丸）
  |--> メカニカルSoundSet       （ボルト操作、マガジン装填）
```

武器サウンド設定の例：

```cpp
class CfgSoundShaders
{
    class MyMod_Rifle_Shot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 200;
        rangeCurve[] = {{0, 1.0}, {50, 0.8}, {100, 0.4}, {200, 0.0}};
    };

    class MyMod_Rifle_Tail_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_tail_01", 1},
            {"MyMod\sound\weapons\rifle_tail_02", 1}
        };
        volume = 0.8;
        range = 800;
        rangeCurve[] = {{0, 0.6}, {200, 0.4}, {500, 0.2}, {800, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_Rifle_Shot_SoundSet
    {
        soundShaders[] = {"MyMod_Rifle_Shot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
    };

    class MyMod_Rifle_Tail_SoundSet
    {
        soundShaders[] = {"MyMod_Rifle_Tail_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

### 環境サウンド

雰囲気を作る環境オーディオ：

```cpp
class MyMod_Wind_SoundShader
{
    samples[] = {{"MyMod\sound\ambient\wind_loop", 1}};
    volume = 0.5;
    range = 50;
};

class MyMod_Wind_SoundSet
{
    soundShaders[] = {"MyMod_Wind_SoundShader"};
    volumeFactor = 0.6;
    spatial = 0;           // 非ポジショナル（アンビエントサラウンド）
    loop = 1;              // 連続ループ
};
```

### UIサウンド

インターフェースのフィードバックサウンド（ボタンクリック、通知）：

```cpp
class MyMod_ButtonClick_SoundShader
{
    samples[] = {{"MyMod\sound\ui\click_01", 1}};
    volume = 0.7;
    range = 0;             // 空間範囲は不要
};

class MyMod_ButtonClick_SoundSet
{
    soundShaders[] = {"MyMod_ButtonClick_SoundShader"};
    volumeFactor = 0.8;
    spatial = 0;           // 2D -- リスナーの頭の中で再生
    loop = 0;
};
```

### 車両サウンド

車両は複数のコンポーネントを持つ複雑なサウンド設定を使用します：

- **エンジンアイドル** -- ループ、RPMに応じてピッチが変化
- **エンジン加速** -- ループ、スロットルに応じて音量とピッチがスケール
- **タイヤノイズ** -- ループ、速度に応じて音量がスケール
- **ホーン** -- トリガー、押している間ループ
- **クラッシュ** -- 衝突時にワンショット

### キャラクターサウンド

プレイヤー関連のサウンドには以下が含まれます：

- **足音** -- 地面の素材によって変化（コンクリート、草、木、金属）
- **呼吸** -- スタミナ依存
- **声** -- エモートとコマンド
- **インベントリ** -- アイテム操作サウンド

---

## 3Dポジショナルオーディオ

DayZは3D空間オーディオを使用して、ゲームワールド内にサウンドを配置します。200メートル左で銃が発砲されると、適切な音量低減とともに左のスピーカー/ヘッドフォンから聞こえます。

### 3Dオーディオの要件

1. **オーディオファイルはモノラルである必要があります。** ステレオファイルは正しく空間音声化されません。
2. **SoundSetの`spatial`は`1`である必要があります。** これにより3Dポジショニングシステムが有効になります。
3. **音源にはワールド位置が必要です。** エンジンは方向と距離を計算するための座標が必要です。

### エンジンのサウンド空間音声化の仕組み

```
音源（ワールド位置）
  |
  |--> リスナーまでの距離を計算
  |--> リスナーの向きに対する方向を計算
  |--> 距離減衰を適用（rangeCurve）
  |--> 遮蔽を適用（壁、地形）
  |--> ドップラー効果を適用（有効かつ音源が移動中の場合）
  |--> 正しいスピーカーチャンネルに出力
```

### スクリプトからの3Dサウンドのトリガー

```c
// ワールド位置でポジショナルサウンドを再生
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// オブジェクトにアタッチされたサウンドを再生（オブジェクトとともに移動）
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## 音量と距離減衰

### レンジカーブ

SoundShaderの`rangeCurve[]`は、距離に応じて音量がどのように減少するかを定義します。`{距離, 音量}`ペアの配列です：

```cpp
rangeCurve[] =
{
    {0, 1.0},       // 0mで: フルボリューム
    {50, 0.7},      // 50mで: 70%の音量
    {150, 0.3},     // 150mで: 30%の音量
    {300, 0.0}      // 300mで: 無音
};
```

エンジンは定義されたポイント間を線形補間します。より多くの制御ポイントを追加することで、任意の減衰カーブを作成できます。

### 定義済みボリュームカーブ

SoundSetsは`volumeCurve`プロパティを通じて名前付きカーブを参照できます：

| カーブ名 | 動作 |
|------------|----------|
| `"InverseSquare"` | リアリスティックな減衰（音量 = 1/距離^2）。自然な音。 |
| `"Linear"` | 範囲内で最大からゼロまで均等に減衰。 |
| `"Logarithmic"` | 近くでは大きく、中距離で急激に低下し、その後ゆっくりと減衰。 |

### 実用的な減衰の例

**銃声（大きく、遠くまで届く）：**
```cpp
range = 800;
rangeCurve[] = {{0, 1.0}, {100, 0.6}, {300, 0.3}, {600, 0.1}, {800, 0.0}};
```

**足音（静かで、近距離）：**
```cpp
range = 30;
rangeCurve[] = {{0, 1.0}, {10, 0.5}, {20, 0.15}, {30, 0.0}};
```

**車両エンジン（中距離、持続）：**
```cpp
range = 200;
rangeCurve[] = {{0, 1.0}, {50, 0.7}, {100, 0.4}, {200, 0.0}};
```

---

## ループサウンド

ループサウンドは明示的に停止されるまで繰り返し再生されます。エンジン、環境音、アラーム、その他の持続的なオーディオに使用されます。

### ループサウンドの設定

SoundSetで：
```cpp
class MyMod_Alarm_SoundSet
{
    soundShaders[] = {"MyMod_Alarm_SoundShader"};
    spatial = 1;
    loop = 1;              // ループを有効化
};
```

### スクリプトからのループ

```c
// ループサウンドを開始
EffectSound m_AlarmSound;

void StartAlarm(vector position)
{
    if (!m_AlarmSound)
    {
        m_AlarmSound = SEffectManager.PlaySound("MyMod_Alarm_SoundSet", position);
    }
}

// ループサウンドを停止
void StopAlarm()
{
    if (m_AlarmSound)
    {
        m_AlarmSound.Stop();
        m_AlarmSound = null;
    }
}
```

### ループ用のオーディオファイル準備

シームレスなループのために、オーディオファイル自体がきれいにループする必要があります：

1. **開始と終了でゼロクロッシング。** 波形は両端でゼロ振幅を横切り、ループポイントでのクリック/ポップを回避する必要があります。
2. **開始と終了の一致。** ファイルの終わりが始まりにシームレスにブレンドする必要があります。
3. **フェードイン/アウトなし。** フェードは各ループ反復で聞こえてしまいます。
4. **Audacityでループをテスト。** クリップ全体を選択し、ループ再生を有効にして、クリックや不連続がないか聴いてください。

---

## MODへのカスタムサウンドの追加

### 完全なワークフロー

**ステップ1: オーディオファイルを準備**
- オーディオを録音またはソースから入手します。
- Audacity（またはお好みのオーディオエディタ）で編集します。
- 3Dサウンドの場合：モノラルに変換します。
- OGG Vorbis（品質5-7）としてエクスポートします。
- ファイルにわかりやすい名前をつけます：`rifle_shot_01.ogg`、`rifle_shot_02.ogg`。

**ステップ2: MODディレクトリに整理**

```
MyMod/
  sound/
    weapons/
      rifle_shot_01.ogg
      rifle_shot_02.ogg
      rifle_shot_03.ogg
      rifle_tail_01.ogg
      rifle_tail_02.ogg
    ambient/
      wind_loop.ogg
    ui/
      click_01.ogg
      notification_01.ogg
  config.cpp
```

**ステップ3: config.cppでSoundShadersを定義**

```cpp
class CfgPatches
{
    class MyMod_Sounds
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Sounds_Effects"};
    };
};

class CfgSoundShaders
{
    class MyMod_RifleShot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 300;
        rangeCurve[] = {{0, 1.0}, {100, 0.6}, {200, 0.2}, {300, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_RifleShot_SoundSet
    {
        soundShaders[] = {"MyMod_RifleShot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

**ステップ4: 武器/アイテムの設定から参照**

武器の場合、SoundSetは武器の設定クラスで参照されます：

```cpp
class CfgWeapons
{
    class MyMod_Rifle: Rifle_Base
    {
        // ... 他の設定 ...

        class Sounds
        {
            class Fire
            {
                soundSet = "MyMod_RifleShot_SoundSet";
            };
        };
    };
};
```

**ステップ5: ビルドとテスト**
- PBOをパックします（OGGファイルはバイナリ化が不要なので`-packonly`を使用します）。
- MODをロードしてゲームを起動します。
- さまざまな距離でゲーム内のサウンドをテストします。

---

## オーディオ制作ツール

### Audacity（無料、オープンソース）

AudacityはDayZオーディオ制作に推奨されるツールです：

- **ダウンロード:** [audacityteam.org](https://www.audacityteam.org/)
- **OGGエクスポート:** ファイル --> エクスポート --> OGGとしてエクスポート
- **モノラル変換:** トラック --> ミックス --> ステレオをモノラルにミックスダウン
- **ノーマライゼーション:** エフェクト --> ノーマライズ（ピークを-1 dBに設定してクリッピングを防止）
- **ノイズ除去:** エフェクト --> ノイズリダクション
- **ループテスト:** トランスポート --> ループ再生 (Shift+Space)

### AudacityでのOGGエクスポート設定

1. **ファイル --> エクスポート --> OGG Vorbisとしてエクスポート**
2. **品質:** 5-7（環境/UIには5、武器/重要なサウンドには7）
3. **チャンネル:** 3Dサウンドにはモノラル、UI/音楽にはステレオ

### その他の便利なツール

| ツール | 用途 | コスト |
|------|---------|------|
| **Audacity** | 一般的なオーディオ編集、フォーマット変換 | 無料 |
| **Reaper** | プロフェッショナルDAW、高度な編集 | $60（個人ライセンス） |
| **FFmpeg** | コマンドラインのバッチオーディオ変換 | 無料 |
| **Ocenaudio** | リアルタイムプレビュー付きのシンプルなエディタ | 無料 |

### FFmpegでのバッチ変換

ディレクトリ内のすべてのWAVファイルをモノラルOGGに変換：

```bash
for file in *.wav; do
    ffmpeg -i "$file" -ac 1 -codec:a libvorbis -qscale:a 6 "${file%.wav}.ogg"
done
```

---

## よくある間違い

### 1. 3Dサウンドにステレオファイルを使用

**症状：** サウンドが空間音声化されず、中央で再生されるか片耳でしか聞こえません。
**修正：** エクスポート前にモノラルに変換してください。3Dポジショナルサウンドにはモノラルオーディオファイルが必要です。

### 2. samples[]パスにファイル拡張子を含める

**症状：** サウンドが再生されず、ログにエラーなし（エンジンがサイレントにファイルを見つけられません）。
**修正：** `samples[]`のパスから`.ogg`拡張子を削除してください。エンジンが自動的に追加します。

```cpp
// 間違い
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// 正しい
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. CfgPatchesのrequiredAddonsの欠落

**症状：** SoundShadersやSoundSetsが認識されず、サウンドが再生されません。
**修正：** CfgPatchesの`requiredAddons[]`に`"DZ_Sounds_Effects"`を追加して、基本サウンドシステムが自分の定義より先にロードされるようにしてください。

### 4. レンジが短すぎる

**症状：** サウンドが短い距離で突然途切れ、不自然に感じます。
**修正：** `range`を現実的な値に設定してください。銃声は300-800m、足音は20-40m、声は50-100mにすべきです。

### 5. ランダムなバリエーションがない

**症状：** 何度も聞いた後、サウンドが繰り返しで人工的に感じます。
**修正：** SoundShaderに複数のサンプルを提供し、SoundSetに`frequencyRandomizer`を追加してピッチバリエーションを加えてください。

```cpp
// バリエーション用の複数サンプル
samples[] =
{
    {"MyMod\sound\step_01", 1},
    {"MyMod\sound\step_02", 1},
    {"MyMod\sound\step_03", 1},
    {"MyMod\sound\step_04", 1}
};

// SoundSetでのピッチランダマイゼーション
frequencyRandomizer = 0.05;    // +/- 5%のピッチ変動
```

### 6. クリッピング/ディストーション

**症状：** サウンドがパチパチしたり歪んだりします。特に近距離で。
**修正：** エクスポート前にAudacityでオーディオを-1 dBまたは-3 dBピークにノーマライズしてください。ソースオーディオが非常に静かでない限り、`volume`や`volumeFactor`を1.0以上に設定しないでください。

---

## ベストプラクティス

1. **3DサウンドはMOD常にモノラルOGGとしてエクスポートしてください。** これが最も重要なルールです。ステレオファイルは空間音声化されません。

2. **頻繁に聞かれるサウンドには3-5個のサンプルバリエーションを提供してください**（銃声、足音、衝撃音）。ランダム選択は同一の繰り返しオーディオの「マシンガン効果」を防ぎます。

3. **自然なピッチバリエーションのために`frequencyRandomizer`を0.03〜0.08の間で使用してください。** わずかな変動でも知覚されるオーディオ品質が大幅に向上します。

4. **現実的なrange値を設定してください。** 参考としてバニラDayZのサウンドを研究してください。ライフルの射撃は600-800mの範囲、サプレッサー付きの射撃は150-200m、足音は20-40mです。

5. **サウンドをレイヤー化してください。** 複雑なオーディオイベント（銃声）は複数のSoundSetを使用すべきです：近距離射撃 + 遠距離の轟音 + テール/エコー。これにより、単一のサウンドファイルでは実現できない深みが生まれます。

6. **複数の距離でテストしてください。** ゲーム内で音源から離れ、減衰カーブが自然に感じられることを確認してください。`rangeCurve[]`の制御ポイントを反復的に調整してください。

7. **サウンドディレクトリを整理してください。** カテゴリ別のサブディレクトリ（`weapons/`、`ambient/`、`ui/`、`vehicles/`）を使用してください。200個のOGGファイルが平坦なディレクトリにあると管理できません。

8. **ファイルサイズを適切に保ってください。** ゲームオーディオにスタジオ品質は不要です。OGG品質5-7で十分です。ほとんどの個別サウンドファイルは500 KB未満にすべきです。

---

## ナビゲーション

| 前 | 上 | 次 |
|----------|----|------|
| [4.3 マテリアル](03-materials.md) | [パート4: ファイルフォーマットとDayZ Tools](01-textures.md) | [4.5 DayZ Toolsワークフロー](05-dayz-tools.md) |
