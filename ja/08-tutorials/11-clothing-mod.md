# Chapter 8.11: カスタム衣類の作成

[Home](../README.md) | [<< 前へ: カスタム車両の作成](10-vehicle-mod.md) | **カスタム衣類の作成** | [次へ: トレーディングシステムの構築 >>](12-trading-system.md)

---

> **概要:** このチュートリアルでは、DayZ用のカスタムタクティカルジャケットを作成する手順を説明します。基底クラスの選択、config.cppでの断熱・カーゴプロパティの定義、hidden selectionsによるカモパターンのリテクスチャ、ローカライズとスポーン設定の追加、そしてオプションでスクリプト動作の拡張を行います。最終的に、プレイヤーを暖かく保ち、アイテムを収納でき、ワールド内でスポーンする着用可能なジャケットが完成します。

---

## 目次

- [作るもの](#what-we-are-building)
- [Step 1: 基底クラスの選択](#step-1-choose-a-base-class)
- [Step 2: 衣類のconfig.cpp](#step-2-configcpp-for-clothing)
- [Step 3: テクスチャの作成](#step-3-create-textures)
- [Step 4: カーゴスペースの追加](#step-4-add-cargo-space)
- [Step 5: ローカライズとスポーン](#step-5-localization-and-spawning)
- [Step 6: スクリプト動作（オプション）](#step-6-script-behavior-optional)
- [Step 7: ビルド、テスト、仕上げ](#step-7-build-test-polish)
- [完全なコードリファレンス](#complete-code-reference)
- [よくある間違い](#common-mistakes)
- [ベストプラクティス](#best-practices)
- [理論と実践](#theory-vs-practice)
- [学んだこと](#what-you-learned)

---

## 作るもの

**Tactical Camo Jacket** を作成します。プレイヤーが発見して着用できるウッドランドカモフラージュのミリタリースタイルジャケットです。以下の特徴があります：

- バニラのGorkaジャケットモデルを拡張（3Dモデリング不要）
- hidden selectionsを使用したカスタムカモリテクスチャ
- `heatIsolation` 値による保温性
- ポケット内のアイテム収納（カーゴスペース）
- ヘルスステートに応じた視覚的劣化のあるダメージ
- ワールド内のミリタリーロケーションでスポーン

**前提条件：** 動作するMod構造（先に [Chapter 8.1](01-first-mod.md) と [Chapter 8.2](02-custom-item.md) を完了してください）、テキストエディタ、DayZ Toolsのインストール（TexView2用）、カモテクスチャ作成用の画像エディタ。

---

## Step 1: 基底クラスの選択

DayZの衣類は `Clothing_Base` を継承しますが、直接拡張することはほとんどありません。DayZは各ボディスロットに中間基底クラスを提供しています：

| 基底クラス | ボディスロット | 例 |
|------------|-----------|----------|
| `Top_Base` | Body（胴体） | ジャケット、シャツ、フーディー |
| `Pants_Base` | Legs（脚） | ジーンズ、カーゴパンツ |
| `Shoes_Base` | Feet（足） | ブーツ、スニーカー |
| `HeadGear_Base` | Head（頭） | ヘルメット、帽子 |
| `Mask_Base` | Face（顔） | ガスマスク、バラクラバ |
| `Gloves_Base` | Hands（手） | タクティカルグローブ |
| `Vest_Base` | Vest slot（ベスト） | プレートキャリア、チェストリグ |
| `Glasses_Base` | Eyewear（アイウェア） | サングラス |
| `Backpack_Base` | Back（背中） | バックパック、バッグ |

完全な継承チェーンは次のとおりです：`Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> YourJacket`

### 既存のバニラアイテムを拡張する理由

異なるレベルで拡張できます：

1. **特定のアイテムを拡張**（`GorkaEJacket_ColorBase` など）-- 最も簡単です。モデル、アニメーション、スロット、すべてのプロパティを継承します。テクスチャの変更と値の微調整のみ行います。Bohemiaの `Test_ClothingRetexture` サンプルがこの手法を使用しています。
2. **スロット基底クラスを拡張**（`Top_Base` など）-- クリーンな出発点ですが、モデルとすべてのプロパティを指定する必要があります。
3. **`Clothing` を直接拡張** -- 完全にカスタムなスロット動作のためだけです。ほとんど必要ありません。

このタクティカルジャケットでは、`GorkaEJacket_ColorBase` を拡張します。バニラスクリプトを見てみましょう：

```c
class GorkaEJacket_ColorBase extends Top_Base
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
class GorkaEJacket_Summer extends GorkaEJacket_ColorBase {};
class GorkaEJacket_Flat extends GorkaEJacket_ColorBase {};
```

パターンに注目してください：`_ColorBase` クラスが共有動作を処理し、個別のカラーバリアントは追加コードなしでそれを拡張します。config.cppのエントリが異なるテクスチャを提供します。同じパターンに従います。

基底クラスを探すには、`scripts/4_world/entities/itembase/clothing_base.c`（すべてのスロット基底クラスを定義）と `scripts/4_world/entities/itembase/clothing/`（衣類ファミリーごとに1ファイル）を参照してください。

---

## Step 2: 衣類のconfig.cpp

`MyClothingMod/Data/config.cpp` を作成します：

```cpp
class CfgPatches
{
    class MyClothingMod_Data
    {
        units[] = { "MCM_TacticalJacket_Woodland" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgVehicles
{
    class GorkaEJacket_ColorBase;

    class MCM_TacticalJacket_ColorBase : GorkaEJacket_ColorBase
    {
        scope = 0;
        displayName = "";
        descriptionShort = "";

        weight = 1800;
        itemSize[] = { 3, 4 };
        absorbency = 0.3;
        heatIsolation = 0.8;
        visibilityModifier = 0.7;

        repairableWithKits[] = { 5, 2 };
        repairCosts[] = { 30.0, 25.0 };

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 200;
                    healthLevels[] =
                    {
                        { 1.0,  { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.70, { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.50, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.30, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.01, { "DZ\characters\tops\Data\GorkaUpper_destruct.rvmat" } }
                    };
                };
            };
            class GlobalArmor
            {
                class Melee
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
                class Infected
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
            };
        };

        class EnvironmentWetnessIncrements
        {
            class Soaking
            {
                rain = 0.015;
                water = 0.1;
            };
            class Drying
            {
                playerHeat = -0.08;
                fireBarrel = -0.25;
                wringing = -0.15;
            };
        };
    };

    class MCM_TacticalJacket_Woodland : MCM_TacticalJacket_ColorBase
    {
        scope = 2;
        displayName = "$STR_MCM_TacticalJacket_Woodland";
        descriptionShort = "$STR_MCM_TacticalJacket_Woodland_Desc";
        hiddenSelectionsTextures[] =
        {
            "MyClothingMod\Data\Textures\tactical_jacket_g_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa"
        };
    };
};
```

### 衣類固有フィールドの説明

**保温性とステルス：**

| フィールド | 値 | 説明 |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | 提供される保温性（0.0〜1.0の範囲）。エンジンはこの値にヘルスとウェットネスの係数を乗算します。無傷で乾いたジャケットは最大の保温性を発揮し、破損して濡れたものはほぼゼロになります。 |
| `visibilityModifier` | `0.7` | AIに対するプレイヤーの視認性（低い = 検出されにくい）。 |
| `absorbency` | `0.3` | 吸水性（0 = 防水、1 = スポンジ）。低いほど耐雨性が高くなります。 |

**バニラのheatIsolationリファレンス：** Tシャツ 0.2、フーディー 0.5、Gorkaジャケット 0.7、フィールドジャケット 0.8、ウールコート 0.9。

**修理：** `repairableWithKits[] = { 5, 2 }` はキットタイプ（5=ソーイングキット、2=レザーソーイングキット）をリストします。`repairCosts[]` は対応する順序で修理ごとに消費される素材を示します。

**アーマー：** `damage` 値が0.8の場合、プレイヤーは受けるダメージの80%を受けます（20%が吸収されます）。値が低いほど防御力が高くなります。

**ウェットネス：** `Soaking` は雨/水がアイテムを濡らす速度を制御します。`Drying` の負の値は体熱、焚き火、絞りによる水分喪失を表します。

**Hidden selections：** Gorkaモデルには3つのselectionがあります -- インデックス0は地面モデル、インデックス1と2は着用モデルです。`hiddenSelectionsTextures[]` をカスタムPAAパスでオーバーライドします。

**ヘルスレベル：** 各エントリは `{ healthThreshold, { materialPath } }` です。ヘルスが閾値を下回ると、エンジンがマテリアルを切り替えます。バニラのダメージrvmatは摩耗マークや裂け目を追加します。

---

## Step 3: テクスチャの作成

### テクスチャの検索と作成

Gorkaジャケットのテクスチャは `DZ\characters\tops\data\` にあります。テンプレートとして使用するために、P:ドライブから `gorka_upper_summer_co.paa`（カラー）、`gorka_upper_nohq.paa`（ノーマル）、`gorka_upper_smdi.paa`（スペキュラー）を抽出します。

**カモパターンの作成：**

1. TexView2でバニラの `_co` テクスチャを開き、TGA/PNGとしてエクスポートします
2. 画像エディタでUVレイアウトに従ってウッドランドカモを描画します
3. 同じ解像度を維持します（通常2048x2048または1024x1024）
4. TGAとして保存し、TexView2でPAAに変換します（File > Save As > .paa）

### テクスチャの種類

| サフィックス | 用途 | 必須？ |
|--------|---------|-----------|
| `_co` | メインカラー/パターン | はい |
| `_nohq` | ノーマルマップ（生地のディテール） | いいえ -- バニラのデフォルトを使用 |
| `_smdi` | スペキュラー（光沢） | いいえ -- バニラのデフォルトを使用 |
| `_as` | アルファ/サーフェスマスク | いいえ |

リテクスチャの場合、`_co` テクスチャのみが必要です。バニラモデルのノーマルマップとスペキュラーマップはそのまま機能します。

完全なマテリアル制御が必要な場合は、`.rvmat` ファイルを作成し、`hiddenSelectionsMaterials[]` で参照します。ダメージおよびデストラクトバリアントを含む動作するrvmatの例については、Bohemiaの `Test_ClothingRetexture` サンプルを参照してください。

---

## Step 4: カーゴスペースの追加

`GorkaEJacket_ColorBase` を拡張する場合、そのカーゴグリッド（4x3）とインベントリスロット（`"Body"`）は自動的に継承されます。`itemSize[] = { 3, 4 }` プロパティは、ジャケットがルートとして保管されるときのサイズを定義します。カーゴ容量ではありません。

一般的な衣類スロット：`"Body"`（ジャケット）、`"Legs"`（パンツ）、`"Feet"`（ブーツ）、`"Headgear"`（帽子）、`"Vest"`（チェストリグ）、`"Gloves"`、`"Mask"`、`"Back"`（バックパック）。

一部の衣類はアタッチメントを受け付けます（プレートキャリアのポーチなど）。`attachments[] = { "Shoulder", "Armband" };` で追加します。基本的なジャケットの場合、継承されたカーゴで十分です。

---

## Step 5: ローカライズとスポーン

### Stringtable

`MyClothingMod/Data/Stringtable.csv` を作成します：

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### スポーン（types.xml）

サーバーのミッションフォルダの `types.xml` に追加します：

```xml
<type name="MCM_TacticalJacket_Woodland">
    <nominal>8</nominal>
    <lifetime>14400</lifetime>
    <restock>3600</restock>
    <min>3</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="clothes" />
    <usage name="Military" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

すべての衣類に `category name="clothes"` を使用します。アイテムがスポーンする場所に合わせて `usage` を設定し（Military、Town、Policeなど）、マップティアに `value` を設定します（Tier1=海岸からTier4=内陸奥地まで）。

---

## Step 6: スクリプト動作（オプション）

シンプルなリテクスチャの場合、スクリプトは不要です。ただし、ジャケット着用時の動作を追加するには、スクリプトクラスを作成します。

### Scripts config.cpp

```cpp
class CfgPatches
{
    class MyClothingMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgMods
{
    class MyClothingMod
    {
        dir = "MyClothingMod";
        name = "My Clothing Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "World" };
        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyClothingMod/Scripts/4_World" };
            };
        };
    };
};
```

### カスタムジャケットスクリプト

`Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c` を作成します：

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player equipped Tactical Jacket");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player removed Tactical Jacket");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### 衣類の主要イベント

| イベント | 発火タイミング | 一般的な用途 |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | プレイヤーがアイテムを装備 | バフの適用、エフェクトの表示 |
| `OnWasDetached(parent, slot_id)` | プレイヤーがアイテムを解除 | バフの除去、クリーンアップ |
| `EEItemAttached(item, slot_name)` | この衣類にアイテムがアタッチ | モデルselectionの表示/非表示 |
| `EEItemDetached(item, slot_name)` | この衣類からアイテムがデタッチ | ビジュアル変更の元に戻す |
| `EEHealthLevelChanged(old, new, zone)` | ヘルスが閾値を超える | ビジュアルステートの更新 |

**重要：** すべてのオーバーライドの先頭で必ず `super` を呼び出してください。親クラスが重要なエンジン動作を処理します。

---

## Step 7: ビルド、テスト、仕上げ

### ビルドとスポーン

`Data/` と `Scripts/` を別々のPBOとしてパックします。Modを有効にしてDayZを起動し、ジャケットをスポーンします：

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### 確認チェックリスト

1. **インベントリに表示されますか？** 表示されない場合、`scope=2` とクラス名の一致を確認してください。
2. **正しいテクスチャですか？** デフォルトのGorkaテクスチャ = パスが間違っています。白/ピンク = テクスチャファイルが見つかりません。
3. **装備できますか？** Bodyスロットに入るはずです。入らない場合、親クラスチェーンを確認してください。
4. **表示名は正しいですか？** 生の `$STR_` テキストが表示される場合、stringtableが読み込まれていません。
5. **保温性はありますか？** デバッグ/インスペクトメニューで `heatIsolation` を確認してください。
6. **ダメージでビジュアルが劣化しますか？** 次のコードでテストします：`ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### カラーバリアントの追加

`_ColorBase` パターンに従います -- テクスチャのみが異なる兄弟クラスを追加します：

```cpp
class MCM_TacticalJacket_Desert : MCM_TacticalJacket_ColorBase
{
    scope = 2;
    displayName = "$STR_MCM_TacticalJacket_Desert";
    descriptionShort = "$STR_MCM_TacticalJacket_Desert_Desc";
    hiddenSelectionsTextures[] =
    {
        "MyClothingMod\Data\Textures\tactical_jacket_g_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa"
    };
};
```

各バリアントには独自の `scope=2`、表示名、テクスチャ、stringtableエントリ、types.xmlエントリが必要です。

---

## 完全なコードリファレンス

### ディレクトリ構成

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- アイテム定義（Step 2参照）
        Stringtable.csv         <-- 表示名（Step 5参照）
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- スクリプト動作が必要な場合のみ
        config.cpp              <-- CfgModsエントリ（Step 6参照）
        4_World/
            MyClothingMod/
                MCM_TacticalJacket.c
```

### mod.cpp

```cpp
name = "My Clothing Mod";
author = "YourName";
version = "1.0";
overview = "Adds a tactical jacket with camo variants to DayZ.";
```

その他のファイルはすべて上記の各ステップで完全に示されています。

---

## よくある間違い

| 間違い | 結果 | 修正方法 |
|---------|-------------|-----|
| バリアントで `scope=2` を忘れる | アイテムがスポーンしない、管理ツールに表示されない | 基底には `scope=0`、スポーン可能な各バリアントには `scope=2` を設定 |
| テクスチャ配列の数が間違い | 一部のパーツが白/ピンクのテクスチャになる | `hiddenSelectionsTextures` の数をモデルのhidden selectionsに合わせる（Gorkaは3つ） |
| テクスチャパスにスラッシュを使用 | テクスチャが無言で読み込まれない | バックスラッシュを使用：`"MyMod\Data\tex.paa"` |
| `requiredAddons` が不足 | Configパーサーが親クラスを解決できない | トップスには `"DZ_Characters_Tops"` を含める |
| `heatIsolation` が1.0を超える | 暖かい天候でプレイヤーが過熱する | 値を0.0〜1.0の範囲に保つ |
| `healthLevels` のマテリアルが空 | 視覚的なダメージ劣化がない | 少なくともバニラのrvmatを参照する |
| オーバーライドで `super` をスキップ | インベントリ、ダメージ、アタッチメント動作が壊れる | 常に最初に `super.MethodName()` を呼び出す |

---

## ベストプラクティス

- **シンプルなリテクスチャから始めましょう。** カスタムプロパティやスクリプトを追加する前に、テクスチャスワップで動作するModを完成させてください。これによりconfigの問題とテクスチャの問題を分離できます。
- **_ColorBaseパターンを使用しましょう。** 共有プロパティは `scope=0` の基底に、テクスチャと名前のみを `scope=2` のバリアントに配置します。重複なし。
- **断熱値は現実的に保ちましょう。** 類似する現実世界の衣類を持つバニラアイテムを参考にしてください。
- **types.xmlの前にスクリプトコンソールでテストしましょう。** スポーンテーブルのデバッグ前にアイテムが動作することを確認してください。
- **プレイヤー向けのすべてのテキストに `$STR_` 参照を使用しましょう。** config変更なしで将来のローカライズが可能になります。
- **DataとScriptsは別々のPBOとしてパックしましょう。** スクリプトの再ビルドなしでテクスチャを更新できます。
- **地面テクスチャを提供しましょう。** `_g_` テクスチャにより、ドロップされたアイテムが正しく表示されます。

---

## 理論と実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `heatIsolation` | シンプルな保温性の数値 | 有効な保温性はヘルスとウェットネスに依存します。エンジンは `MiscGameplayFunctions.GetCurrentItemHeatIsolation()` の係数で乗算します。 |
| アーマーの `damage` 値 | 低い = より高い防御 | 0.8の値はプレイヤーが80%のダメージを受けることを意味します（20%のみ吸収）。多くのモッダーは0.9を「90%の防御」と読みますが、実際には10%です。 |
| `scope` の継承 | 子は親のscopeを継承する | 継承しません。各クラスは明示的に `scope` を設定する必要があります。親の `scope=0` はすべての子をデフォルトで `scope=0` にします。 |
| `absorbency` | 雨からの防御を制御 | 水分吸収を制御し、保温性を低下させます。防水 = 低い absorbency（0.1）。高い absorbency（0.8+）= スポンジのように吸収します。 |
| Hidden selections | どのモデルでも動作する | すべてのモデルが同じselectionを公開するわけではありません。基底モデルを選択する前にObject Builderまたはバニラconfigで確認してください。 |

---

## 学んだこと

このチュートリアルで学んだこと：

- DayZの衣類がスロット固有の基底クラス（`Top_Base`、`Pants_Base` など）からどのように継承するか
- config.cppで保温性、アーマー、ウェットネスプロパティを持つ衣類アイテムを定義する方法
- hidden selectionsによりバニラモデルをカスタムカモパターンでリテクスチャする仕組み
- `heatIsolation`、`visibilityModifier`、`absorbency` がゲームプレイにどう影響するか
- `DamageSystem` が視覚的劣化とアーマー防御をどのように制御するか
- `_ColorBase` パターンを使用してカラーバリアントを作成する方法
- `types.xml` でスポーンエントリを追加し、`Stringtable.csv` で表示名を追加する方法
- オプションで `OnWasAttached` と `OnWasDetached` イベントによるスクリプト動作を追加する方法

**次へ：** 同じテクニックを応用してパンツ（`Pants_Base`）、ブーツ（`Shoes_Base`）、またはベスト（`Vest_Base`）を作成できます。config構造は同一で、親クラスとインベントリスロットだけが変わります。

---

**前へ：** [Chapter 8.8: HUDオーバーレイ](08-hud-overlay.md)
**次へ：** 近日公開
