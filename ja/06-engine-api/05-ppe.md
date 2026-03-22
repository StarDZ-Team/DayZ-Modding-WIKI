# 第6.5章: ポストプロセスエフェクト（PPE）

[ホーム](../README.md) | [<< 前へ: カメラ](04-cameras.md) | **ポストプロセスエフェクト** | [次へ: 通知 >>](06-notifications.md)

---

## はじめに

DayZ のポストプロセスエフェクト（PPE）システムは、シーンレンダリング後に適用される視覚効果を制御します。ぼかし、カラーグレーディング、ビネット、色収差、暗視、その他多くのエフェクトがあります。このシステムは `PPERequester` クラスを中心に構築されており、特定の視覚効果を要求できます。複数のリクエスターを同時にアクティブにでき、エンジンがそれらの寄与をブレンドします。この章では、Mod で PPE システムを使用する方法を解説します。

---

## アーキテクチャ概要

```
PPEManager
├── PPERequesterBank              // 利用可能な全リクエスターの静的レジストリ
│   ├── REQ_INVENTORYBLUR         // インベントリぼかし
│   ├── REQ_MENUEFFECTS           // メニューエフェクト
│   ├── REQ_CONTROLLERDISCONNECT  // コントローラー切断オーバーレイ
│   ├── REQ_UNCONSCIOUS           // 意識不明エフェクト
│   ├── REQ_FEVEREFFECTS          // 発熱視覚エフェクト
│   ├── REQ_FLASHBANGEFFECTS      // フラッシュバン
│   ├── REQ_BURLAPSACK            // 頭に麻袋
│   ├── REQ_DEATHEFFECTS          // 死亡画面
│   ├── REQ_BLOODLOSS             // 出血による彩度低下
│   └── ... （他にも多数）
└── PPERequester_*                // 個別のリクエスター実装
```

---

## PPEManager

`PPEManager` はすべてのアクティブな PPE リクエストを調整するシングルトンです。直接操作することはほとんどありません --- 代わりに `PPERequester` サブクラスを通じて作業します。

```c
// マネージャーインスタンスの取得
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**ファイル:** `3_Game/PPE/pperequesterbank.c`

すべての PPE リクエスターのインスタンスを保持する静的レジストリです。定数インデックスを使用して特定のリクエスターにアクセスします。

### リクエスターの取得

```c
// バンク定数でリクエスターを取得
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### 一般的なリクエスター定数

| 定数 | エフェクト |
|----------|--------|
| `REQ_INVENTORYBLUR` | インベントリ表示時のガウシアンぼかし |
| `REQ_MENUEFFECTS` | メニュー背景のぼかし |
| `REQ_UNCONSCIOUS` | 意識不明のビジュアル（ぼかし + 彩度低下） |
| `REQ_DEATHEFFECTS` | 死亡画面（グレースケール + ビネット） |
| `REQ_BLOODLOSS` | 出血による彩度低下 |
| `REQ_FEVEREFFECTS` | 発熱による色収差 |
| `REQ_FLASHBANGEFFECTS` | フラッシュバンのホワイトアウト |
| `REQ_BURLAPSACK` | 麻袋による目隠し |
| `REQ_PAINBLUR` | 痛みによるぼかしエフェクト |
| `REQ_CONTROLLERDISCONNECT` | コントローラー切断オーバーレイ |
| `REQ_CAMERANV` | 暗視 |
| `REQ_FILMGRAINEFFECTS` | フィルムグレインオーバーレイ |
| `REQ_RAINEFFECTS` | 雨の画面エフェクト |
| `REQ_COLORSETTING` | 色補正設定 |

---

## PPERequester ベース

すべての PPE リクエスターは `PPERequester` を拡張します。

```c
class PPERequester : Managed
{
    // エフェクトの開始
    void Start(Param par = null);

    // エフェクトの停止
    void Stop(Param par = null);

    // アクティブかどうかの確認
    bool IsActiveRequester();

    // マテリアルパラメータに値を設定
    void SetTargetValueFloat(int mat_id, int param_idx, bool relative,
                              float val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueColor(int mat_id, int param_idx, bool relative,
                              float val1, float val2, float val3, float val4,
                              int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueBool(int mat_id, int param_idx, bool relative,
                             bool val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueInt(int mat_id, int param_idx, bool relative,
                            int val, int priority_layer, int operator = PPOperators.SET);
}
```

### PPOperators

```c
class PPOperators
{
    static const int SET          = 0;  // 値を直接設定
    static const int ADD          = 1;  // 現在の値に加算
    static const int ADD_RELATIVE = 2;  // 現在の値に相対加算
    static const int HIGHEST      = 3;  // 現在と新規の高い方を使用
    static const int LOWEST       = 4;  // 現在と新規の低い方を使用
    static const int MULTIPLY     = 5;  // 現在の値に乗算
    static const int OVERRIDE     = 6;  // 強制オーバーライド
}
```

---

## 一般的な PPE マテリアル ID

エフェクトは特定のポストプロセスマテリアルをターゲットにします。一般的なマテリアル ID は以下の通りです。

| 定数 | マテリアル |
|----------|----------|
| `PostProcessEffectType.Glow` | ブルーム / グロー |
| `PostProcessEffectType.FilmGrain` | フィルムグレイン |
| `PostProcessEffectType.RadialBlur` | ラジアルブラー |
| `PostProcessEffectType.ChromAber` | 色収差 |
| `PostProcessEffectType.WetEffect` | 濡れたレンズエフェクト |
| `PostProcessEffectType.ColorGrading` | カラーグレーディング / LUT |
| `PostProcessEffectType.DepthOfField` | 被写界深度 |
| `PostProcessEffectType.SSAO` | スクリーンスペースアンビエントオクルージョン |
| `PostProcessEffectType.GodRays` | ボリュメトリックライト |
| `PostProcessEffectType.Rain` | 画面上の雨 |
| `PostProcessEffectType.Vignette` | ビネットオーバーレイ |
| `PostProcessEffectType.HBAO` | ホライゾンベースアンビエントオクルージョン |

---

## ビルトインリクエスターの使用

### インベントリぼかし

最もシンプルな例 --- インベントリを開いたときに表示されるぼかしです。

```c
// ぼかしの開始
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// ぼかしの停止
blurReq.Stop();
```

### フラッシュバンエフェクト

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// 遅延後に停止
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## カスタム PPE リクエスターの作成

カスタムポストプロセスエフェクトを作成するには、`PPERequester` を拡張して登録します。

### ステップ 1: リクエスターの定義

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // 強いビネットを適用
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // 彩度を下げる
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // デフォルトにリセット
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### ステップ 2: 登録と使用

登録はリクエスターをバンクに追加することで行います。実際には、ほとんどのモッダーは完全にカスタムのリクエスターを作成するのではなく、ビルトインリクエスターのパラメータを調整して使用します。

---

## 暗視（NVG）

暗視は PPE エフェクトとして実装されています。該当するリクエスターは `REQ_CAMERANV` です。

```c
// NVG エフェクトを有効化
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// NVG エフェクトを無効化
nvgReq.Stop();
```

ゲーム内の実際の NVG は、NVGoggles アイテムの `ComponentEnergyManager` と `NVGoggles.ToggleNVG()` メソッドを通じてトリガーされ、内部的に PPE システムを駆動します。

---

## カラーグレーディング

カラーグレーディングは、シーンの全体的な色の外観を変更します。

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// 彩度の調整（1.0 = 通常、0.0 = グレースケール、>1.0 = 過飽和）
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## ぼかしエフェクト

### ガウシアンぼかし

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// ぼかし強度の調整（0.0 = なし、高いほどぼかしが強い）
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### ラジアルブラー

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## 優先度レイヤー

複数のリクエスターが同じパラメータを変更する場合、優先度レイヤーがどちらが優先されるかを決定します。

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // 最低優先度（静的エフェクト）
    static const int L_1_VALUES   = 1;   // 動的な値の変更
    static const int L_2_SCRIPTS  = 2;   // スクリプト駆動のエフェクト
    static const int L_3_EFFECTS  = 3;   // ゲームプレイエフェクト
    static const int L_4_OVERLAY  = 4;   // オーバーレイエフェクト
    static const int L_LAST       = 100;  // 最高優先度（すべてをオーバーライド）
}
```

数値が大きいほど優先されます。`PPEManager.L_LAST` を使用すると、エフェクトが他のすべてを強制的にオーバーライドします。

---

## まとめ

| 概念 | 要点 |
|---------|-----------|
| アクセス | `PPERequesterBank.GetRequester(CONSTANT)` |
| 開始/停止 | `requester.Start()` / `requester.Stop()` |
| パラメータ | `SetTargetValueFloat(material, param, relative, value, layer, operator)` |
| 演算子 | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| 一般的なエフェクト | ぼかし、ビネット、彩度、NVG、フラッシュバン、グレイン、色収差 |
| NVG | `REQ_CAMERANV` リクエスター |
| 優先度 | レイヤー 0-100; 数値が大きいほど競合に勝つ |
| カスタム | `PPERequester` を拡張し、`OnStart()` / `OnStop()` をオーバーライド |

---

## ベストプラクティス

- **リクエスターをクリーンアップするために必ず `Stop()` を呼び出してください。** PPE リクエスターの停止を怠ると、トリガー条件が終了した後も視覚効果が永続的にアクティブなままになります。
- **適切な優先度レイヤーを使用してください。** ゲームプレイエフェクトは `L_3_EFFECTS` 以上を使用すべきです。`L_LAST`（100）を使用すると、バニラの意識不明や死亡エフェクトを含むすべてをオーバーライドし、プレイヤー体験を損なう可能性があります。
- **カスタムリクエスターよりビルトインリクエスターを優先してください。** `PPERequesterBank` にはすでにぼかし、彩度低下、ビネット、グレインのリクエスターが含まれています。カスタムリクエスタークラスを作成する前に、パラメータを調整して再利用してください。
- **異なるライティング条件で PPE エフェクトをテストしてください。** ビネットと彩度低下は昼と夜で大きく見え方が異なります。両方の極端な条件でエフェクトが適切に表示されることを確認してください。
- **複数の高強度ぼかしエフェクトの重ね合わせを避けてください。** 複数のアクティブなぼかしリクエスターが合成され、画面が読めなくなる可能性があります。追加のエフェクトを開始する前に `IsActiveRequester()` で確認してください。

---

## 互換性と影響

- **マルチ Mod:** 複数の Mod が同時に PPE リクエスターをアクティベートできます。エンジンは優先度レイヤーと演算子を使用してブレンドします。衝突が発生するのは、2つの Mod が同じ優先度レベルで同じパラメータに `PPOperators.SET` を使用した場合です --- 最後に書き込んだものが勝ちます。
- **パフォーマンス:** PPE エフェクトは GPU バウンドのポストプロセスパスです。多数の同時エフェクト（ぼかし + グレイン + 色収差 + ビネット）を有効にすると、低スペック GPU ではフレームレートが低下する可能性があります。アクティブなエフェクトは最小限に抑えてください。
- **サーバー/クライアント:** PPE は完全にクライアントサイドのレンダリングです。サーバーはポストプロセスエフェクトについて何も把握していません。PPE の状態に基づいてサーバーロジックを条件付けないでください。

---

[<< 前へ: カメラ](04-cameras.md) | **ポストプロセスエフェクト** | [次へ: 通知 >>](06-notifications.md)
