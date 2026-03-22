# Chapter 5.5: サーバー設定ファイル

[Home](../README.md) | [<< Previous: ImageSet Format](04-imagesets.md) | **サーバー設定ファイル** | [Next: Spawning Gear Configuration >>](06-spawning-gear.md)

---

> **概要:** DayZ サーバーはミッションフォルダ（例：`mpmissions/dayzOffline.chernarusplus/`）内の XML、JSON、およびスクリプトファイルによって設定されます。これらのファイルはアイテムのスポーン、エコノミーの動作、ゲームプレイルール、およびサーバーのアイデンティティを制御します。カスタムアイテムをルートエコノミーに追加したり、サーバーパラメータを調整したり、カスタムミッションを構築したりするためには、これらのファイルの理解が不可欠です。

---

## 目次

- [概要](#概要)
- [init.c --- ミッションエントリポイント](#initc--ミッションエントリポイント)
- [types.xml --- アイテムスポーン定義](#typesxml--アイテムスポーン定義)
- [cfgspawnabletypes.xml --- アタッチメントとカーゴ](#cfgspawnabletypesxml--アタッチメントとカーゴ)
- [cfgrandompresets.xml --- 再利用可能なルートプール](#cfgrandompresetsxml--再利用可能なルートプール)
- [globals.xml --- エコノミーパラメータ](#globalsxml--エコノミーパラメータ)
- [cfggameplay.json --- ゲームプレイ設定](#cfggameplayjson--ゲームプレイ設定)
- [serverDZ.cfg --- サーバー設定](#serverdzcfg--サーバー設定)
- [Modとエコノミーの連携](#modとエコノミーの連携)
- [よくある間違い](#よくある間違い)

---

## 概要

すべての DayZ サーバーは**ミッションフォルダ**から設定を読み込みます。Central Economy（CE）ファイルはどのアイテムがどこに、どのくらいの期間スポーンするかを定義します。サーバー実行ファイル自体は、実行ファイルと同じ場所にある `serverDZ.cfg` で設定されます。

| ファイル | 目的 |
|------|---------|
| `init.c` | ミッションエントリポイント --- Hive 初期化、日時、スポーンロードアウト |
| `db/types.xml` | アイテムスポーン定義：数量、ライフタイム、ロケーション |
| `cfgspawnabletypes.xml` | スポーンされたエンティティの事前アタッチアイテムとカーゴ |
| `cfgrandompresets.xml` | cfgspawnabletypes 用の再利用可能なアイテムプール |
| `db/globals.xml` | グローバルエコノミーパラメータ：最大数、クリーンアップタイマー |
| `cfggameplay.json` | ゲームプレイ調整：スタミナ、建築、UI |
| `cfgeconomycore.xml` | ルートクラス登録と CE ロギング |
| `cfglimitsdefinition.xml` | 有効なカテゴリ、用途、値タグ定義 |
| `serverDZ.cfg` | サーバー名、パスワード、最大プレイヤー数、Mod ロード |

---

## init.c --- ミッションエントリポイント

`init.c` スクリプトはサーバーが最初に実行するものです。Central Economy を初期化し、ミッションインスタンスを作成します。

```c
void main()
{
    Hive ce = CreateHive();
    if (ce)
        ce.InitOffline();

    GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);
    CreateCustomMission("dayzOffline.chernarusplus");
}

class CustomMission: MissionServer
{
    override PlayerBase CreateCharacter(PlayerIdentity identity, vector pos,
                                        ParamsReadContext ctx, string characterName)
    {
        Entity playerEnt;
        playerEnt = GetGame().CreatePlayer(identity, characterName, pos, 0, "NONE");
        Class.CastTo(m_player, playerEnt);
        GetGame().SelectPlayer(identity, m_player);
        return m_player;
    }

    override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
    {
        EntityAI itemClothing = player.FindAttachmentBySlotName("Body");
        if (itemClothing)
        {
            itemClothing.GetInventory().CreateInInventory("BandageDressing");
        }
    }
}

Mission CreateCustomMission(string path)
{
    return new CustomMission();
}
```

`Hive` は CE データベースを管理します。`CreateHive()` がなければ、アイテムはスポーンせず永続性は無効になります。`CreateCharacter` はスポーン時にプレイヤーエンティティを作成し、`StartingEquipSetup` は新規キャラクターが受け取るアイテムを定義します。その他の便利な `MissionServer` オーバーライドには `OnInit()`、`OnUpdate()`、`InvokeOnConnect()`、`InvokeOnDisconnect()` などがあります。

---

## types.xml --- アイテムスポーン定義

`db/types.xml` に配置され、このファイルは CE の心臓部です。スポーンできるすべてのアイテムにここでのエントリが必要です。

### 完全なエントリ

```xml
<type name="AK74">
    <nominal>6</nominal>
    <lifetime>28800</lifetime>
    <restock>0</restock>
    <min>4</min>
    <quantmin>30</quantmin>
    <quantmax>80</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1"
           count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

### フィールドリファレンス

| フィールド | 説明 |
|-------|-------------|
| `nominal` | マップ上のターゲット数。CE はこの数に達するまでアイテムをスポーンします |
| `min` | CE がリストックを開始する最小数 |
| `lifetime` | 地面に置かれたアイテムがデスポーンするまでの秒数 |
| `restock` | リストック試行間の最小秒数（0 = 即時） |
| `quantmin/quantmax` | 数量を持つアイテムの充填パーセンテージ（マガジン、ボトル）。数量のないアイテムには `-1` を使用 |
| `cost` | CE の優先重み（高い = 優先される）。ほとんどのアイテムは `100` を使用 |

### フラグ

| フラグ | 目的 |
|------|---------|
| `count_in_cargo` | コンテナ内のアイテムをnominalに対してカウント |
| `count_in_hoarder` | スタッシュ/テント/バレル内のアイテムをnominalに対してカウント |
| `count_in_map` | 地面のアイテムをnominalに対してカウント |
| `count_in_player` | プレイヤーインベントリのアイテムをnominalに対してカウント |
| `crafted` | クラフト専用アイテム、自然スポーンなし |
| `deloot` | ダイナミックイベントルート（ヘリクラッシュなど） |

### カテゴリ、使用法、値タグ

これらのタグはアイテムが**どこに**スポーンするかを制御します：

- **`category`** --- アイテムタイプ。バニラ: `tools`、`containers`、`clothes`、`food`、`weapons`、`books`、`explosives`、`lootdispatch`。
- **`usage`** --- 建物タイプ。バニラ: `Military`、`Police`、`Medic`、`Firefighter`、`Industrial`、`Farm`、`Coast`、`Town`、`Village`、`Hunting`、`Office`、`School`、`Prison`、`ContaminatedArea`、`Historical`。
- **`value`** --- マップティアゾーン。バニラ: `Tier1`（海岸）、`Tier2`（内陸）、`Tier3`（軍事）、`Tier4`（深部軍事）、`Unique`。

複数のタグを組み合わせることができます。`usage` タグなし = アイテムはスポーンしません。`value` タグなし = すべてのティアでスポーンします。

### アイテムの無効化

`nominal=0` と `min=0` を設定します。アイテムはスポーンしませんが、スクリプトやクラフトを通じて存在できます。

---

## cfgspawnabletypes.xml --- アタッチメントとカーゴ

他のアイテムに**すでにアタッチされた状態または内部に**何がスポーンするかを制御します。

### ホーダーマーキング

ストレージコンテナは CE がプレイヤーアイテムを保持していることを認識できるようにタグ付けされます：

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### スポーンダメージ

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

値の範囲は `0.0`（新品）から `1.0`（壊れた状態）です。

### アタッチメント

```xml
<type name="PlateCarrierVest_Camo">
    <damage min="0.1" max="0.6" />
    <attachments chance="0.85">
        <item name="PlateCarrierHolster_Camo" chance="1.00" />
    </attachments>
    <attachments chance="0.85">
        <item name="PlateCarrierPouches_Camo" chance="1.00" />
    </attachments>
</type>
```

外側の `chance` はアタッチメントグループが評価されるかどうかを決定します。内側の `chance` はグループ内に複数のアイテムがリストされている場合に特定のアイテムを選択します。

### カーゴプリセット

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

各行はプリセットを独立してロールします --- 3行は3回の個別のチャンスを意味します。

---

## cfgrandompresets.xml --- 再利用可能なルートプール

`cfgspawnabletypes.xml` によって参照される名前付きアイテムプールを定義します：

```xml
<randompresets>
    <cargo chance="0.16" name="foodVillage">
        <item name="SodaCan_Cola" chance="0.02" />
        <item name="TunaCan" chance="0.05" />
        <item name="PeachesCan" chance="0.05" />
        <item name="BakedBeansCan" chance="0.05" />
        <item name="Crackers" chance="0.05" />
    </cargo>

    <cargo chance="0.15" name="toolsHermit">
        <item name="WeaponCleaningKit" chance="0.10" />
        <item name="Matchbox" chance="0.15" />
        <item name="Hatchet" chance="0.07" />
    </cargo>
</randompresets>
```

プリセットの `chance` は何かがスポーンする全体的な確率です。ロールが成功すると、個々のアイテムのチャンスに基づいてプールから1つのアイテムが選択されます。Mod アイテムを追加するには、新しい `cargo` ブロックを作成し、`cfgspawnabletypes.xml` で参照します。

---

## globals.xml --- エコノミーパラメータ

`db/globals.xml` に配置され、このファイルはグローバルな CE パラメータを設定します：

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadAnimal" type="0" value="1200"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="CleanupLifetimeRuined" type="0" value="330"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="FlagRefreshMaxDuration" type="0" value="3456000"/>
    <var name="FoodDecay" type="0" value="1"/>
    <var name="InitialSpawn" type="0" value="100"/>
    <var name="LootDamageMin" type="1" value="0.0"/>
    <var name="LootDamageMax" type="1" value="0.82"/>
    <var name="SpawnInitial" type="0" value="1200"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="TimePenalty" type="0" value="20"/>
    <var name="TimeHopping" type="0" value="60"/>
    <var name="ZoneSpawnDist" type="0" value="300"/>
</variables>
```

### 主要変数

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `AnimalMaxCount` | 200 | マップ上の最大動物数 |
| `ZombieMaxCount` | 1000 | マップ上の最大感染者数 |
| `CleanupLifetimeDeadPlayer` | 3600 | 死体の除去時間（秒） |
| `CleanupLifetimeRuined` | 330 | 壊れたアイテムの除去時間 |
| `FlagRefreshFrequency` | 432000 | テリトリーフラグのリフレッシュ間隔（5日） |
| `FlagRefreshMaxDuration` | 3456000 | フラグの最大ライフタイム（40日） |
| `FoodDecay` | 1 | 食品腐敗の切り替え（0=オフ、1=オン） |
| `InitialSpawn` | 100 | 起動時にスポーンする nominal のパーセンテージ |
| `LootDamageMax` | 0.82 | スポーンされたルートの最大ダメージ |
| `TimeLogin` / `TimeLogout` | 15 | ログイン/ログアウトタイマー（コンバットログ対策） |
| `TimePenalty` | 20 | コンバットログペナルティタイマー |
| `ZoneSpawnDist` | 300 | ゾンビ/動物のスポーンをトリガーするプレイヤー距離 |

`type` 属性は `0` が整数、`1` が浮動小数点です。間違った型を使用すると値が切り捨てられます。

---

## cfggameplay.json --- ゲームプレイ設定

`serverDZ.cfg` で `enableCfgGameplayFile = 1` の場合のみ読み込まれます。これがなければ、エンジンはハードコードされたデフォルトを使用します。

### 構造

```json
{
    "version": 123,
    "GeneralData": {
        "disableBaseDamage": false,
        "disableContainerDamage": false,
        "disableRespawnDialog": false
    },
    "PlayerData": {
        "disablePersonalLight": false,
        "StaminaData": {
            "sprintStaminaModifierErc": 1.0,
            "staminaMax": 100.0,
            "staminaWeightLimitThreshold": 6000.0,
            "staminaMinCap": 5.0
        },
        "MovementData": {
            "timeToSprint": 0.45,
            "rotationSpeedSprint": 0.15,
            "allowStaminaAffectInertia": true
        }
    },
    "WorldsData": {
        "lightingConfig": 0,
        "environmentMinTemps": [-3, -2, 0, 4, 9, 14, 18, 17, 13, 11, 9, 0],
        "environmentMaxTemps": [3, 5, 7, 14, 19, 24, 26, 25, 18, 14, 10, 5]
    },
    "BaseBuildingData": {
        "HologramData": {
            "disableIsCollidingBBoxCheck": false,
            "disableIsCollidingAngleCheck": false,
            "disableHeightPlacementCheck": false,
            "disallowedTypesInUnderground": ["FenceKit", "TerritoryFlagKit"]
        }
    },
    "MapData": {
        "ignoreMapOwnership": false,
        "displayPlayerPosition": false,
        "displayNavInfo": true
    }
}
```

主要設定：`disableBaseDamage` は拠点ダメージを防ぎます、`disablePersonalLight` は新規スポーンのライトを除去します、`staminaWeightLimitThreshold` はグラム単位です（6000 = 6kg）、温度配列は12個の値を持ちます（1月〜12月）、`lightingConfig` は `0`（デフォルト）または `1`（暗い夜）を受け入れ、`displayPlayerPosition` はマップ上にプレイヤーのドットを表示します。

---

## serverDZ.cfg --- サーバー設定

このファイルはミッションフォルダではなく、サーバー実行ファイルの隣に配置されます。

### 主要設定

```
hostname = "My DayZ Server";
password = "";
passwordAdmin = "adminpass123";
maxPlayers = 60;
verifySignatures = 2;
forceSameBuild = 1;
template = "dayzOffline.chernarusplus";
enableCfgGameplayFile = 1;
storeHouseStateDisabled = false;
storageAutoFix = 1;
```

| パラメータ | 説明 |
|-----------|-------------|
| `hostname` | ブラウザでのサーバー名 |
| `password` | 参加パスワード（空 = オープン） |
| `passwordAdmin` | RCON 管理者パスワード |
| `maxPlayers` | 最大同時接続プレイヤー数 |
| `template` | ミッションフォルダ名 |
| `verifySignatures` | 署名チェックレベル（2 = 厳格） |
| `enableCfgGameplayFile` | cfggameplay.json の読み込み（0/1） |

### Mod の読み込み

Mod は設定ファイルではなく、起動パラメータで指定します：

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

`-mod=` の Mod はクライアントにインストールが必要です。`-servermod=` の Mod はサーバーサイドのみで実行されます。

---

## Modとエコノミーの連携

### cfgeconomycore.xml --- ルートクラス登録

すべてのアイテムクラス階層は登録されたルートクラスまで遡る必要があります：

```xml
<economycore>
    <classes>
        <rootclass name="DefaultWeapon" />
        <rootclass name="DefaultMagazine" />
        <rootclass name="Inventory_Base" />
        <rootclass name="SurvivorBase" act="character" reportMemoryLOD="no" />
        <rootclass name="DZ_LightAI" act="character" reportMemoryLOD="no" />
        <rootclass name="CarScript" act="car" reportMemoryLOD="no" />
    </classes>
</economycore>
```

Mod が `Inventory_Base`、`DefaultWeapon`、または `DefaultMagazine` を継承しない新しい基底クラスを導入する場合、それを `rootclass` として追加してください。`act` 属性はエンティティタイプを指定します：AI 用の `character`、車両用の `car`。

### cfglimitsdefinition.xml --- カスタムタグ

`types.xml` で使用されるすべての `category`、`usage`、または `value` はここで定義する必要があります：

```xml
<lists>
    <categories>
        <category name="mymod_special"/>
    </categories>
    <usageflags>
        <usage name="MyModDungeon"/>
    </usageflags>
    <valueflags>
        <value name="MyModEndgame"/>
    </valueflags>
</lists>
```

バニラファイルを上書きすべきでない追加には `cfglimitsdefinitionuser.xml` を使用してください。

### economy.xml --- サブシステム制御

どの CE サブシステムがアクティブかを制御します：

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

フラグ：`init`（起動時にスポーン）、`load`（永続性を読み込む）、`respawn`（クリーンアップ後にリスポーン）、`save`（データベースに永続化）。

### スクリプト側のエコノミー連携

`CreateInInventory()` で作成されたアイテムは自動的に CE 管理されます。ワールドスポーンには ECE フラグを使用します：

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## よくある間違い

### XML構文エラー

閉じられていないタグが1つあるだけでファイル全体が壊れます。デプロイ前に必ず XML を検証してください。

### cfglimitsdefinition.xml にタグがない

types.xml で使用している `usage` や `value` が cfglimitsdefinition.xml で定義されていない場合、アイテムはサイレントにスポーンに失敗します。RPT ログで警告を確認してください。

### Nominal が高すぎる

すべてのアイテムにわたる合計 nominal は 10,000〜15,000 以下に保つべきです。過度な値はサーバーのパフォーマンスを低下させます。

### Lifetime が短すぎる

非常に短い lifetime のアイテムはプレイヤーが見つける前に消えます。一般的なアイテムには少なくとも `3600`（1時間）、武器には `28800`（8時間）を使用してください。

### ルートクラスの欠落

クラス階層が `cfgeconomycore.xml` に登録されたルートクラスまで遡れないアイテムは、types.xml のエントリが正しくてもスポーンしません。

### cfggameplay.json が有効化されていない

`serverDZ.cfg` で `enableCfgGameplayFile = 1` が設定されていない限り、このファイルは無視されます。

### globals.xml での間違った型

`0.82` のような float 値に `type="0"`（整数）を使用すると、`0` に切り捨てられます。浮動小数点には `type="1"` を使用してください。

### バニラファイルの直接編集

バニラの types.xml を変更すると動作しますが、ゲームアップデートで壊れます。個別のタイプファイルを配布して cfgeconomycore で登録するか、カスタムタグには cfglimitsdefinitionuser.xml を使用することを推奨します。

---

## ベストプラクティス

- サーバー管理者がゼロから書くのではなくコピー＆ペーストできるように、事前設定された `types.xml` エントリを含む `ServerFiles/` フォルダを Mod に同梱してください。
- バニラの `cfglimitsdefinition.xml` を編集する代わりに `cfglimitsdefinitionuser.xml` を使用してください --- 追加がゲームアップデートを生き残ります。
- 一般的なアイテム（食料、弾薬）には `count_in_hoarder="0"` を設定して、ため込みが CE のリスポーンをブロックするのを防ぎます。
- `cfggameplay.json` の変更が反映されることを期待する前に、`serverDZ.cfg` で `enableCfgGameplayFile = 1` を必ず設定してください。
- 人口の多いサーバーでの CE パフォーマンス低下を避けるため、すべての types.xml エントリにわたる合計 `nominal` を 12,000 未満に維持してください。

---

## 理論と実践

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| `nominal` はハードターゲット | CE はこの数のアイテムを正確にスポーンする | CE は時間をかけて nominal に近づきますが、プレイヤーの行動、クリーンアップサイクル、ゾーン距離に基づいて変動します |
| `restock=0` は即時リスポーンを意味する | アイテムはデスポーン後すぐに再出現する | CE はサイクル（通常30〜60秒ごと）でリストックをバッチ処理するため、restock の値に関係なく常に遅延があります |
| `cfggameplay.json` がすべてのゲームプレイを制御する | すべての調整はここで行う | 多くのゲームプレイ値はスクリプトや config.cpp にハードコードされており、cfggameplay.json でオーバーライドできません |
| `init.c` はサーバー起動時のみ実行される | 一度きりの初期化 | `init.c` はサーバーの再起動を含め、ミッションがロードされるたびに実行されます。永続的な状態は init.c ではなく Hive によって管理されます |
| 複数の types.xml ファイルがクリーンにマージされる | CE はすべての登録ファイルを読む | ファイルは `<ce folder="custom">` ディレクティブで cfgeconomycore.xml に登録する必要があります。追加の XML ファイルを `db/` に配置するだけでは何も起きません |

---

## 互換性と影響

- **マルチ Mod:** クラス名が一意である限り、複数の Mod が競合なく types.xml にエントリを追加できます。2つの Mod が異なる nominal/lifetime 値で同じクラス名を定義した場合、最後にロードされたエントリが優先されます。
- **パフォーマンス:** 過度な nominal 数（15,000以上）は、サーバー FPS の低下として見える CE ティックスパイクを引き起こします。各 CE サイクルはスポーン条件を確認するためにすべての登録タイプを反復処理します。
