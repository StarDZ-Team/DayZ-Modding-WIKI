# Chapter 8.10: カスタム車両Modの作成

[Home](../README.md) | [<< 前へ: プロフェッショナルModテンプレート](09-professional-template.md) | **カスタム車両の作成** | [次へ: カスタム衣類の作成 >>](11-clothing-mod.md)

---

> **概要:** このチュートリアルでは、既存のバニラ車両を拡張してDayZでカスタム車両バリアントを作成する手順を説明します。config.cppでの車両定義、ステータスとテクスチャのカスタマイズ、ドアとエンジンのスクリプト動作の記述、パーツ事前装着でのサーバースポーンテーブルへの追加、ゲーム内テストを行います。最終的に、パフォーマンスと外観が変更された完全に運転可能なカスタムOffroad Hatchbackバリアントが完成します。

---

## 目次

- [作るもの](#what-we-are-building)
- [前提条件](#prerequisites)
- [Step 1: Config（config.cpp）の作成](#step-1-create-the-config-configcpp)
- [Step 2: カスタムテクスチャ](#step-2-custom-textures)
- [Step 3: スクリプト動作（CarScript）](#step-3-script-behavior-carscript)
- [Step 4: types.xmlエントリ](#step-4-typesxml-entry)
- [Step 5: ビルドとテスト](#step-5-build-and-test)
- [Step 6: 仕上げ](#step-6-polish)
- [完全なコードリファレンス](#complete-code-reference)
- [ベストプラクティス](#best-practices)
- [理論と実践](#theory-vs-practice)
- [学んだこと](#what-you-learned)
- [よくある間違い](#common-mistakes)

---

## 作るもの

**MFM Rally Hatchback** という車両を作成します。バニラのOffroad Hatchback（Niva）の改造版で、以下の特徴があります：

- hidden selectionsを使用したカスタムリテクスチャのボディパネル
- 変更されたエンジン性能（より高い最高速度、より高い燃費消費）
- 調整されたダメージゾーンのヘルス値（より頑丈なエンジン、より弱いドア）
- すべての標準的な車両動作：ドアの開閉、エンジンの始動/停止、燃料、ライト、乗降
- ホイールとパーツが事前装着されたスポーンテーブルエントリ

車両をゼロから構築するのではなく、`OffroadHatchback` を拡張します。これは車両Modの標準的なワークフローです。モデル、アニメーション、物理ジオメトリ、既存のすべての動作を継承するためです。変更したいものだけをオーバーライドします。

---

## 前提条件

- 動作するMod構造（先に [Chapter 8.1](01-first-mod.md) と [Chapter 8.2](02-custom-item.md) を完了してください）
- テキストエディタ
- DayZ Toolsのインストール（テクスチャ変換用、オプション）
- config.cppのクラス継承の仕組みに関する基本的な知識

Modは次の初期構造を持つ必要があります：

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Step 1: Config（config.cpp）の作成

車両定義はアイテムと同じく `CfgVehicles` に配置されます。クラス名とは裏腹に、`CfgVehicles` はアイテム、建物、実際の車両すべてを保持します。車両の主な違いは親クラスと、ダメージゾーン、アタッチメント、シミュレーションパラメータの追加設定です。

### Data config.cppの更新

`MyFirstMod/Data/config.cpp` を開き、車両クラスを追加します。Chapter 8.2のアイテム定義が既にある場合は、既存の `CfgVehicles` ブロック内に車両クラスを追加してください。

```cpp
class CfgPatches
{
    class MyFirstMod_Vehicles
    {
        units[] = { "MFM_RallyHatchback" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgVehicles
{
    class OffroadHatchback;

    class MFM_RallyHatchback : OffroadHatchback
    {
        scope = 2;
        displayName = "Rally Hatchback";
        descriptionShort = "A modified offroad hatchback built for speed.";

        // --- リテクスチャ用のHidden Selections ---
        hiddenSelections[] =
        {
            "camoGround",
            "camoMale",
            "driverDoors",
            "coDriverDoors",
            "intHood",
            "intTrunk"
        };
        hiddenSelectionsTextures[] =
        {
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "",
            "",
            "",
            ""
        };

        // --- シミュレーション（物理エンジン） ---
        class SimulationModule : SimulationModule
        {
            // 駆動タイプ: 0 = RWD, 1 = FWD, 2 = AWD
            drive = 2;

            class Throttle
            {
                reactionTime = 0.75;
                defaultThrust = 0.85;
                gentleThrust = 0.65;
                turboCoef = 4.0;
                gentleCoef = 0.5;
            };

            class Engine
            {
                inertia = 0.15;
                torqueMax = 160;
                torqueRpm = 4200;
                powerMax = 95;
                powerRpm = 5600;
                rpmIdle = 850;
                rpmMin = 900;
                rpmClutch = 1400;
                rpmRedline = 6500;
                rpmMax = 7500;
            };

            class Gearbox
            {
                reverse = 3.526;
                ratios[] = { 3.667, 2.1, 1.361, 1.0 };
                transmissionRatio = 3.857;
            };

            braking[] = { 0.0, 0.1, 0.8, 0.9, 0.95, 1.0 };
        };

        // --- ダメージゾーン ---
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };

            class DamageZones
            {
                class Chassis
                {
                    class Health
                    {
                        hitpoints = 3000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_chassis" };
                    inventorySlots[] = {};
                };

                class Engine
                {
                    class Health
                    {
                        hitpoints = 1200;
                        transferToGlobalCoef = 1;
                    };
                    fatalInjuryCoef = 0.001;
                    componentNames[] = { "yourcar_engine" };
                    inventorySlots[] = {};
                };

                class FuelTank
                {
                    class Health
                    {
                        hitpoints = 600;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_fueltank" };
                    inventorySlots[] = {};
                };

                class Front
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_front" };
                    inventorySlots[] = { "NivaHood" };
                };

                class Rear
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_rear" };
                    inventorySlots[] = { "NivaTrunk" };
                };

                class Body
                {
                    class Health
                    {
                        hitpoints = 2000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_body" };
                    inventorySlots[] = {};
                };

                class WindowFront
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowfront" };
                    inventorySlots[] = {};
                };

                class WindowLR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowLR" };
                    inventorySlots[] = {};
                };

                class WindowRR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowRR" };
                    inventorySlots[] = {};
                };

                class Door_1_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_1_1" };
                    inventorySlots[] = { "NivaDriverDoors" };
                };

                class Door_2_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_2_1" };
                    inventorySlots[] = { "NivaCoDriverDoors" };
                };
            };
        };
    };
};
```

### 主要フィールドの説明

| フィールド | 目的 |
|-------|---------|
| `scope = 2` | 車両をスポーン可能にします。直接スポーンすべきでない基底クラスには `0` を使用します。 |
| `displayName` | 管理ツールやゲーム内で表示される名前。ローカライゼーションには `$STR_` 参照を使用できます。 |
| `requiredAddons[]` | 親クラス `OffroadHatchback` が先にロードされるように `"DZ_Vehicles_Wheeled"` を含める必要があります。 |
| `hiddenSelections[]` | オーバーライドしたいモデル上のテクスチャスロット。モデルの名前付きselectionと一致する必要があります。 |
| `SimulationModule` | 物理エンジン設定。速度、トルク、ギアリング、ブレーキを制御します。 |
| `DamageSystem` | 車両の各部分（エンジン、ドア、窓、ボディ）のヘルスプールを定義します。 |

### 親クラスについて

```cpp
class OffroadHatchback;
```

この前方宣言は、configパーサーに `OffroadHatchback` がバニラDayZに存在することを伝えます。あなたの車両はそれを継承し、完全なNivaモデル、アニメーション、物理ジオメトリ、アタッチメントポイント、プロキシ定義を取得します。変更したいものだけをオーバーライドすれば十分です。

拡張できる他のバニラ車両の親クラス：

| 親クラス | 車両 |
|-------------|---------|
| `OffroadHatchback` | Niva（4人乗りハッチバック） |
| `CivilianSedan` | Olga（4人乗りセダン） |
| `Hatchback_02` | Golf/Gunter（4人乗りハッチバック） |
| `Sedan_02` | Sarka 120（4人乗りセダン） |
| `Offroad_02` | Humvee（4人乗りオフロード） |
| `Truck_01_Base` | V3S（トラック） |

### SimulationModuleについて

`SimulationModule` は車両の走行特性を制御します。主要パラメータ：

| パラメータ | 効果 |
|-----------|--------|
| `drive` | `0` = 後輪駆動、`1` = 前輪駆動、`2` = 全輪駆動 |
| `torqueMax` | Nmでのピークエンジントルク。高い = 加速力が強い。バニラNivaは約114。 |
| `powerMax` | ピーク馬力。高い = 最高速度が速い。バニラNivaは約68。 |
| `rpmRedline` | エンジンレッドラインRPM。これを超えると、エンジンはレブリミッターで跳ね返ります。 |
| `ratios[]` | ギア比。低い数値 = トールギア = 高い最高速度だが遅い加速。 |
| `transmissionRatio` | ファイナルドライブ比。すべてのギアの乗数として機能します。 |

### ダメージゾーンについて

各ダメージゾーンには独自のヘルスプールがあります。ゾーンのヘルスがゼロに達すると、そのコンポーネントは破壊されます：

| ゾーン | 破壊時の効果 |
|------|-------------------|
| `Engine` | 車両が始動できない |
| `FuelTank` | 燃料が漏出する |
| `Front` / `Rear` | 視覚的ダメージ、防御力の低下 |
| `Door_1_1` / `Door_2_1` | ドアが落ちる |
| `WindowFront` | 窓が割れる（遮音性に影響） |

`transferToGlobalCoef` 値は、このゾーンから車両のグローバルヘルスにどれだけのダメージが移転するかを決定します。`1` は100%移転（エンジンダメージが全体ヘルスに影響）、`0` は移転なしを意味します。

`componentNames[]` は車両のジオメトリLOD内の名前付きコンポーネントと一致する必要があります。Nivaモデルを継承しているため、ここではプレースホルダー名を使用しています。親クラスのジオメトリコンポーネントが実際の衝突検出に使用されます。バニラモデルを修正なしで使用する場合、親のコンポーネントマッピングが自動的に適用されます。

---

## Step 2: カスタムテクスチャ

### 車両のHidden Selectionsの仕組み

車両のhidden selectionsはアイテムのテクスチャと同じように機能しますが、車両には通常より多くのselectionスロットがあります。Offroad Hatchbackモデルは、バニラのカラーバリアント（White、Blue）を可能にするために、異なるボディパネル用のselectionを使用しています。

### バニラテクスチャの使用（最速スタート）

初期テストでは、hidden selectionsを既存のバニラテクスチャに指定します。カスタムアートを作成する前にconfigが動作することを確認できます：

```cpp
hiddenSelectionsTextures[] =
{
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "",
    "",
    "",
    ""
};
```

空文字列 `""` は「このselectionにはモデルのデフォルトテクスチャを使用する」ことを意味します。

### カスタムテクスチャセットの作成

ユニークな外観を作成するには：

1. **バニラテクスチャを抽出**します。DayZ ToolsのAddon BuilderまたはP:ドライブを使用して以下を探します：
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **編集可能なフォーマットに変換**します。TexView2を使用：
   - TexView2で `.paa` ファイルを開く
   - `.tga` または `.png` としてエクスポート

3. **画像エディタで編集**（GIMP、Photoshop、Paint.NET）：
   - 車両テクスチャは通常 **2048x2048** または **4096x4096**
   - 色の変更、デカールの追加、レーシングストライプ、錆の効果
   - UVレイアウトはそのまま保持 -- 色とディテールのみ変更

4. **`.paa` に変換して戻す**：
   - TexView2で編集した画像を開く
   - `.paa` フォーマットとして保存
   - `MyFirstMod/Data/Textures/rally_body_co.paa` に保存

### 車両のテクスチャ命名規則

| サフィックス | タイプ | 用途 |
|--------|------|---------|
| `_co` | Color（Diffuse） | メインカラーと外観 |
| `_nohq` | Normal Map | 表面の凹凸、パネルライン、リベットのディテール |
| `_smdi` | Specular | メタリックな光沢、ペイントの反射 |
| `_as` | Alpha/Surface | 窓の透明度 |
| `_de` | Destruct | ダメージオーバーレイテクスチャ |

最初の車両Modでは、`_co` テクスチャのみが必要です。モデルはデフォルトのノーマルマップとスペキュラーマップを使用します。

### マテリアルの一致（オプション）

完全なマテリアル制御が必要な場合は、`.rvmat` ファイルを作成します：

```cpp
hiddenSelectionsMaterials[] =
{
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "",
    "",
    "",
    ""
};
```

---

## Step 3: スクリプト動作（CarScript）

車両スクリプトクラスは、エンジンサウンド、ドアロジック、乗降動作、シートアニメーションを制御します。`OffroadHatchback` を拡張するため、すべてのバニラ動作を継承し、カスタマイズしたいものだけをオーバーライドします。

### スクリプトファイルの作成

フォルダ構造とスクリプトファイルを作成します：

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Scripts config.cppの更新

`Scripts/config.cpp` はエンジンがスクリプトをロードするように `4_World` レイヤーを登録する必要があります：

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### 車両スクリプトの記述

`4_World/MyFirstMod/MFM_RallyHatchback.c` を作成します：

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // エンジンサウンドのオーバーライド（バニラNivaサウンドを再利用）
        m_EngineStartOK         = "offroad_engine_start_SoundSet";
        m_EngineStartBattery    = "offroad_engine_failed_start_battery_SoundSet";
        m_EngineStartPlug       = "offroad_engine_failed_start_sparkplugs_SoundSet";
        m_EngineStartFuel       = "offroad_engine_failed_start_fuel_SoundSet";
        m_EngineStop            = "offroad_engine_stop_SoundSet";
        m_EngineStopFuel        = "offroad_engine_stop_fuel_SoundSet";

        m_CarDoorOpenSound      = "offroad_door_open_SoundSet";
        m_CarDoorCloseSound     = "offroad_door_close_SoundSet";
        m_CarSeatShiftInSound   = "Offroad_SeatShiftIn_SoundSet";
        m_CarSeatShiftOutSound  = "Offroad_SeatShiftOut_SoundSet";

        m_CarHornShortSoundName = "Offroad_Horn_Short_SoundSet";
        m_CarHornLongSoundName  = "Offroad_Horn_SoundSet";

        // モデル空間でのエンジン位置(x, y, z) -- 温度ソース、
        // 水没検出、パーティクルエフェクトに使用
        SetEnginePos("0 0.7 1.2");
    }

    // --- アニメーションインスタンス ---
    // 乗降時にプレイヤーが使用するアニメーションセットを決定します。
    // 車両のスケルトンと一致する必要があります。Nivaモデルを使用するため、HATCHBACKを維持。
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- カメラ距離 ---
    // 三人称カメラが車両の後方にどれだけ離れるか。
    // バニラNivaは3.5。より広い視野にするために増加。
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- シートアニメーションタイプ ---
    // 各シートインデックスをプレイヤーアニメーションタイプにマッピング。
    // 0 = ドライバー、1 = 助手席、2 = 後部左、3 = 後部右。
    override int GetSeatAnimationType(int posIdx)
    {
        switch (posIdx)
        {
        case 0:
            return DayZPlayerConstants.VEHICLESEAT_DRIVER;
        case 1:
            return DayZPlayerConstants.VEHICLESEAT_CODRIVER;
        case 2:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_L;
        case 3:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_R;
        }

        return 0;
    }

    // --- ドア状態 ---
    // ドアが欠落、開放、または閉鎖かを返します。
    // スロット名（NivaDriverDoors、NivaCoDriverDoors、NivaHood、NivaTrunk）は
    // モデルのインベントリスロットプロキシで定義されています。
    override int GetCarDoorsState(string slotType)
    {
        CarDoor carDoor;

        Class.CastTo(carDoor, FindAttachmentBySlotName(slotType));
        if (!carDoor)
        {
            return CarDoorState.DOORS_MISSING;
        }

        switch (slotType)
        {
            case "NivaDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsDriver");

            case "NivaCoDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsCoDriver");

            case "NivaHood":
                return TranslateAnimationPhaseToCarDoorState("DoorsHood");

            case "NivaTrunk":
                return TranslateAnimationPhaseToCarDoorState("DoorsTrunk");
        }

        return CarDoorState.DOORS_MISSING;
    }

    // --- 乗降 ---
    // プレイヤーが特定のシートに乗降できるかどうかを判定します。
    // ドア状態とシート折りたたみアニメーションフェーズをチェックします。
    // 前席（0, 1）はドアが開いている必要があります。
    // 後席（2, 3）はドアが開いていて、かつ前席が前方に折りたたまれている必要があります。
    override bool CrewCanGetThrough(int posIdx)
    {
        switch (posIdx)
        {
            case 0:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") > 0.5)
                    return false;
                return true;

            case 1:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") > 0.5)
                    return false;
                return true;

            case 2:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") <= 0.5)
                    return false;
                return true;

            case 3:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") <= 0.5)
                    return false;
                return true;
        }

        return false;
    }

    // --- フードのアタッチメントチェック ---
    // フードが閉じているときにプレイヤーがエンジンパーツを取り外すのを防ぎます。
    override bool CanReleaseAttachment(EntityAI attachment)
    {
        if (!super.CanReleaseAttachment(attachment))
        {
            return false;
        }

        if (EngineIsOn() || GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
        {
            string attType = attachment.GetType();
            if (attType == "CarRadiator" || attType == "CarBattery" || attType == "SparkPlug")
            {
                return false;
            }
        }

        return true;
    }

    // --- カーゴアクセス ---
    // 車両カーゴにアクセスするにはトランクが開いている必要があります。
    override bool CanDisplayCargo()
    {
        if (!super.CanDisplayCargo())
        {
            return false;
        }

        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            return false;
        }

        return true;
    }

    // --- エンジンルームアクセス ---
    // エンジンアタッチメントスロットを表示するにはフードが開いている必要があります。
    override bool CanDisplayAttachmentCategory(string category_name)
    {
        if (!super.CanDisplayAttachmentCategory(category_name))
        {
            return false;
        }

        category_name.ToLower();
        if (category_name.Contains("engine"))
        {
            if (GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
            {
                return false;
            }
        }

        return true;
    }

    // --- デバッグスポーン ---
    // デバッグメニューからスポーンする際に呼び出されます。すべてのパーツが装着され、
    // 即座にテストできるように液体が満タンの状態でスポーンします。
    override void OnDebugSpawn()
    {
        SpawnUniversalParts();
        SpawnAdditionalItems();
        FillUpCarFluids();

        GameInventory inventory = GetInventory();
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");

        inventory.CreateInInventory("HatchbackDoors_Driver");
        inventory.CreateInInventory("HatchbackDoors_CoDriver");
        inventory.CreateInInventory("HatchbackHood");
        inventory.CreateInInventory("HatchbackTrunk");

        // カーゴにスペアホイール
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### 主要オーバーライドの理解

**GetAnimInstance** -- 車両に座っているときにプレイヤーが使用するアニメーションセットを返します。列挙値：

| 値 | 定数 | 車両タイプ |
|-------|----------|-------------|
| 0 | `CIVVAN` | バン |
| 1 | `V3S` | V3Sトラック |
| 2 | `SEDAN` | Olgaセダン |
| 3 | `HATCHBACK` | Nivaハッチバック |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

これを間違った値に変更すると、プレイヤーのアニメーションが車両を貫通したり不正確に見えたりします。使用しているモデルに常に合わせてください。

**CrewCanGetThrough** -- プレイヤーがシートに乗降できるかどうかを判定するため、毎フレーム呼び出されます。Nivaの後席（インデックス2と3）は前席とは異なる動作をします：後部乗客が通れるようにするには、前シートの背もたれが前方に折りたたまれている必要があります（アニメーションフェーズ > 0.5）。これは2ドアハッチバックの実際の動作に合致しています。

**OnDebugSpawn** -- デバッグスポーンメニューを使用した際に呼び出されます。`SpawnUniversalParts()` はヘッドライトバルブとカーバッテリーを追加します。`FillUpCarFluids()` は燃料、冷却液、オイル、ブレーキフルードを最大まで充填します。その後ホイール、ドア、フード、トランクを作成します。テスト用にすぐに運転可能な車両が得られます。

---

## Step 4: types.xmlエントリ

### 車両のスポーン設定

`types.xml` 内の車両はアイテムと同じフォーマットを使用しますが、いくつかの重要な違いがあります。サーバーの `types.xml` に追加します：

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### types.xmlでのアイテムとの違い

| 設定 | アイテム | 車両 |
|---------|-------|----------|
| `nominal` | 10〜50+ | 1〜5（車両はレア） |
| `lifetime` | 3600〜14400 | 3888000（45日 -- 車両は長期間持続） |
| `restock` | 1800 | 0（車両は自動補充されない；前の車両が破壊されデスポーン後にのみリスポーン） |
| `category` | `tools`、`weapons` など | `vehicles` |

### cfgspawnabletypes.xmlでのパーツ事前装着

車両はデフォルトでは空のシェルとしてスポーンします -- ホイール、ドア、エンジンパーツなし。パーツが事前装着された状態でスポーンさせるには、サーバーミッションフォルダの `cfgspawnabletypes.xml` にエントリを追加します：

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

### cfgspawnabletypesの仕組み

各 `<attachments>` ブロックは独立して評価されます：
- 外側の `chance` は、このアタッチメントグループが考慮されるかどうかを決定
- 各 `<item>` には独自の配置 `chance` がある
- アイテムは車両上の最初の利用可能な一致スロットに配置される

これは、車両が3つのホイールとドアなし、またはすべてのホイールとバッテリーはあるがスパークプラグなしでスポーンする可能性があることを意味します。これがスカベンジングのゲームプレイループを作り出します -- プレイヤーは欠落パーツを見つけなければなりません。

---

## Step 5: ビルドとテスト

### PBOのパック

このModには2つのPBOが必要です：

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Scripts/config.cppと4_World/を含む
        Data.pbo             <-- Data/config.cppとTextures/を含む
```

DayZ ToolsのAddon Builderを使用：
1. **Scripts PBO:** Source = `MyFirstMod/Scripts/`、Prefix = `MyFirstMod/Scripts`
2. **Data PBO:** Source = `MyFirstMod/Data/`、Prefix = `MyFirstMod/Data`

または開発中はファイルパッチングを使用：

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### スクリプトコンソールでの車両スポーン

1. Modをロードした状態でDayZを起動
2. サーバーに参加またはオフラインモードで開始
3. スクリプトコンソールを開く
4. キャラクター近くにフル装備の車両をスポーン：

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. **Execute** を押す

車両があなたの5メートル前方に表示されるはずです。

### すぐに運転可能な車両のスポーン

より素早いテストのため、車両をスポーンしてすべてのパーツを装着するデバッグスポーンメソッドを使用します：

```c
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
Object obj = GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true);
CarScript car = CarScript.Cast(obj);
if (car)
{
    car.OnDebugSpawn();
}
```

これはあなたの `OnDebugSpawn()` オーバーライドを呼び出し、液体を充填してホイール、ドア、フード、トランクを装着します。

### テスト項目

| チェック | 確認事項 |
|-------|-----------------|
| **車両がスポーン** | スクリプトログにエラーなしでワールドに表示される |
| **テクスチャが適用** | カスタムボディカラーが表示される（カスタムテクスチャ使用時） |
| **エンジン始動** | 乗り込んでエンジン始動キーを長押し。始動サウンドを確認。 |
| **運転** | 加速、最高速度、ハンドリングがバニラと異なることを確認 |
| **ドア** | ドライバーと助手席のドアの開閉が可能 |
| **フード/トランク** | フードを開けてエンジンパーツにアクセス。トランクを開けてカーゴにアクセス。 |
| **後席** | 前席を折りたたんでから後席に乗車 |
| **燃費** | 運転して燃料ゲージを確認 |
| **ダメージ** | 車両を撃つ。パーツがダメージを受けて最終的に壊れる。 |
| **ライト** | 夜間にヘッドライトとテールライトが機能 |

### スクリプトログの読み取り

車両がスポーンしないか正しく動作しない場合、以下のスクリプトログを確認します：

```
%localappdata%\DayZ\<YourProfile>\script.log
```

よくあるエラー：

| ログメッセージ | 原因 |
|-------------|-------|
| `Cannot create object type MFM_RallyHatchback` | config.cppのクラス名の不一致、またはData PBOがロードされていない |
| `Undefined variable 'OffroadHatchback'` | `requiredAddons` に `"DZ_Vehicles_Wheeled"` が欠落 |
| メソッド呼び出しで `Member not found` | オーバーライドメソッド名のタイプミス |

---

## Step 6: 仕上げ

### カスタムホーンサウンド

車両にユニークなホーンを付けるには、Data config.cppにカスタムサウンドセットを定義します：

```cpp
class CfgSoundShaders
{
    class MFM_RallyHorn_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn", 1 }};
        volume = 1.0;
        range = 150;
        limitation = 0;
    };
    class MFM_RallyHornShort_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn_short", 1 }};
        volume = 1.0;
        range = 100;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MFM_RallyHorn_SoundSet
    {
        soundShaders[] = { "MFM_RallyHorn_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
    class MFM_RallyHornShort_SoundSet
    {
        soundShaders[] = { "MFM_RallyHornShort_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
};
```

次に、スクリプトのコンストラクタで参照します：

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

サウンドファイルは `.ogg` フォーマットである必要があります。`samples[]` 内のパスにはファイル拡張子を含めません。

### カスタムヘッドライト

ヘッドライトの明るさ、色、または範囲を変更するためにカスタムライトクラスを作成できます：

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // ロービーム（segregated）
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // ハイビーム（aggregated）
        m_AggregatedBrightness = 14;
        m_AggregatedRadius = 90;
        m_AggregatedAngle = 120;
        m_AggregatedColorRGB = Vector(0.9, 0.9, 1.0);

        FadeIn(0.3);
        SetFadeOutTime(0.25);

        SegregateLight();
    }
};
```

車両クラスでオーバーライド：

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### サウンドインシュレーション（OnSound）

`OnSound` オーバーライドは、ドアと窓の状態に基づいてキャビンがエンジンノイズをどれだけ遮音するかを制御します：

```c
override float OnSound(CarSoundCtrl ctrl, float oldValue)
{
    switch (ctrl)
    {
    case CarSoundCtrl.DOORS:
        float newValue = 0;
        if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.3;
        }
        if (GetHealthLevel("WindowFront") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.6;
        }
        if (GetHealthLevel("WindowLR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        if (GetHealthLevel("WindowRR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        return Math.Clamp(newValue, 0, 1);
    }

    return super.OnSound(ctrl, oldValue);
}
```

値 `1.0` は完全な遮音（静かなキャビン）、`0.0` は遮音なし（オープンエア感覚）を意味します。

---

## 完全なコードリファレンス

### 最終ディレクトリ構成

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
    Data/
        config.cpp
        Textures/
            rally_body_co.paa
        Sounds/
            rally_horn.ogg           （オプション）
            rally_horn_short.ogg     （オプション）
```

### MyFirstMod/mod.cpp

```cpp
name = "My First Mod";
author = "YourName";
version = "1.2";
overview = "My first DayZ mod with a custom rally hatchback vehicle.";
```

### サーバーミッション types.xmlエントリ

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

---

## ベストプラクティス

- **常に既存の車両クラスを拡張してください。** ゼロから車両を作成するには、正しいジオメトリLOD、プロキシ、メモリポイント、物理シミュレーションconfigを含むカスタム3Dモデルが必要です。バニラ車両を拡張すると、これらすべてが無料で得られます。
- **最初に `OnDebugSpawn()` でテストしてください。** types.xmlとcfgspawnabletypes.xmlを設定する前に、デバッグメニューまたはスクリプトコンソールで完全装備をスポーンして車両が動作することを確認してください。
- **親と同じ `GetAnimInstance()` を維持してください。** 一致するアニメーションセットなしでこれを変更すると、プレイヤーがTポーズになったり車両を貫通したりします。
- **ドアスロット名を変更しないでください。** Nivaは `NivaDriverDoors`、`NivaCoDriverDoors`、`NivaHood`、`NivaTrunk` を使用します。これらはモデルのプロキシ名とインベントリスロット定義に紐付いています。モデルを変更せずにこれらを変更すると、ドア機能が壊れます。
- **内部基底クラスには `scope = 0` を使用してください。** 他のバリアントが拡張する抽象的な基底車両を作成する場合、直接スポーンしないように `scope = 0` を設定してください。
- **`requiredAddons` を正しく設定してください。** Data config.cppには親の `OffroadHatchback` クラスが先にロードされるように `"DZ_Vehicles_Wheeled"` をリストする必要があります。
- **ドアロジックを徹底的にテストしてください。** すべてのシートへの乗降、すべてのドアの開閉、フードが閉じた状態でのエンジンベイへのアクセスを試してください。CrewCanGetThroughのバグは車両Modで最も一般的な問題です。

---

## 理論と実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| config.cppの `SimulationModule` | 車両物理の完全な制御 | 親クラスを拡張する際、すべてのパラメータがきれいにオーバーライドされるわけではありません。速度/トルクの変更が効果がないように見える場合、`torqueMax` だけでなく `transmissionRatio` とギア `ratios[]` を調整してみてください。 |
| `componentNames[]` のダメージゾーン | 各ゾーンがジオメトリコンポーネントにマップ | バニラ車両を拡張する場合、親モデルのコンポーネント名は既に設定されています。configの `componentNames[]` 値はカスタムモデルを提供する場合にのみ重要です。親のジオメトリLODが実際のヒット検出を決定します。 |
| hidden selectionsによるカスタムテクスチャ | 任意のテクスチャを自由にスワップ | モデル作者が「hidden」としてマークしたselectionのみオーバーライドできます。`hiddenSelections[]` にないパーツをリテクスチャする必要がある場合、Object Builderで新しいモデルを作成するか既存のものを修正する必要があります。 |
| `cfgspawnabletypes.xml` のパーツ事前装着 | アイテムが一致するスロットに装着 | ホイールクラスが車両と互換性がない場合（間違ったアタッチメントスロット）、無音で失敗します。常に親車両が受け付けるパーツを使用してください -- Nivaの場合、`CivSedanWheel` ではなく `HatchbackWheel` です。 |
| エンジンサウンド | 任意のSoundSet名を設定 | サウンドセットはロードされたconfigのどこかの `CfgSoundSets` で定義されている必要があります。存在しないサウンドセットを参照すると、エンジンは無音にフォールバックします -- ログにエラーは出ません。 |

---

## 学んだこと

このチュートリアルで学んだこと：

- config.cppで既存のバニラ車両を拡張してカスタム車両クラスを定義する方法
- ダメージゾーンの仕組みと各車両コンポーネントのヘルス値の設定方法
- 車両のhidden selectionsによりカスタム3Dモデルなしでボディをリテクスチャする方法
- ドア状態ロジック、乗降チェック、エンジン動作を含む車両スクリプトの記述方法
- `types.xml` と `cfgspawnabletypes.xml` がランダム化されたパーツ事前装着で車両スポーンにどう連携するか
- スクリプトコンソールと `OnDebugSpawn()` メソッドを使用してゲーム内で車両をテストする方法
- ホーンのカスタムサウンドとヘッドライトのカスタムライトクラスを追加する方法

**次へ：** カスタムドアモデル、インテリアテクスチャ、またはBlenderとObject Builderを使用した完全に新しい車両ボディで車両Modを拡張しましょう。

---

## よくある間違い

### 車両がスポーンするがすぐに地面を突き抜ける

物理ジオメトリがロードされていません。これは通常 `requiredAddons[]` に `"DZ_Vehicles_Wheeled"` が欠落しており、親クラスの物理configが継承されていないことを意味します。

### 車両がスポーンするが乗れない

`GetAnimInstance()` が使用しているモデルに対して正しいenum値を返しているか確認してください。`OffroadHatchback` を拡張しているのに `VehicleAnimInstances.SEDAN` を返すと、乗車アニメーションが間違ったドア位置をターゲットにし、プレイヤーが乗れません。

### ドアが開閉しない

`GetCarDoorsState()` が正しいスロット名を使用しているか確認してください。Nivaは `"NivaDriverDoors"`、`"NivaCoDriverDoors"`、`"NivaHood"`、`"NivaTrunk"` を使用します。大文字小文字を含めて正確に一致する必要があります。

### エンジンは始動するが車両が動かない

`SimulationModule` のギア比を確認してください。`ratios[]` が空またはゼロの値を持つ場合、車両には前進ギアがありません。また、ホイールが装着されていることを確認してください -- ホイールのない車両は空ぶかしするだけで動きません。

### 車両にサウンドがない

エンジンサウンドはコンストラクタで割り当てられます。SoundSet名のスペルを間違えると（例：`"offroad_engine_Start_SoundSet"` の代わりに `"offroad_engine_start_SoundSet"`）、エンジンは無音でサウンドなしになります。サウンドセット名は大文字小文字を区別します。

### カスタムテクスチャが表示されない

3つを順番に確認してください：(1) hidden selection名がモデルと正確に一致、(2) config.cppのテクスチャパスがバックスラッシュを使用、(3) `.paa` ファイルがパックされたPBO内にある。開発中にファイルパッチングを使用している場合、パスが絶対パスではなくModルートから始まることを確認してください。

### 後席の乗客が乗れない

Nivaの後席は前席が前方に折りたたまれている必要があります。シートインデックス2と3の `CrewCanGetThrough()` オーバーライドが `GetAnimationPhase("SeatDriver")` と `GetAnimationPhase("SeatCoDriver")` をチェックしていない場合、後部乗客は永久にロックアウトされます。

### マルチプレイヤーで車両がパーツなしでスポーン

`OnDebugSpawn()` はデバッグ/テスト専用です。実際のサーバーでは、パーツは `cfgspawnabletypes.xml` から提供されます。車両が裸のシェルとしてスポーンする場合、Step 4で説明した `cfgspawnabletypes.xml` エントリを追加してください。

---

**前へ：** [Chapter 8.9: プロフェッショナルModテンプレート](09-professional-template.md)
