# Chapter 9.6: プレイヤースポーン

[ホーム](../README.md) | [<< 前へ: 車両スポーン](05-vehicle-spawning.md) | [次へ: パーシステンス >>](07-persistence.md)

---

> **概要:** プレイヤーのスポーン位置は **cfgplayerspawnpoints.xml**（位置バブル）と **init.c**（初期装備）によって制御されます。この章では、チェルナルスのバニラの実際の値を使用して両方のファイルを解説します。

---

## 目次

- [cfgplayerspawnpoints.xmlの概要](#cfgplayerspawnpointsxmlの概要)
- [スポーンパラメータ](#スポーンパラメータ)
- [ジェネレータパラメータ](#ジェネレータパラメータ)
- [グループパラメータ](#グループパラメータ)
- [新規スポーンバブル](#新規スポーンバブル)
- [ホップスポーン](#ホップスポーン)
- [init.c -- 初期装備](#initc----初期装備)
- [カスタムスポーンポイントの追加](#カスタムスポーンポイントの追加)
- [よくある間違い](#よくある間違い)

---

## cfgplayerspawnpoints.xmlの概要

このファイルはミッションフォルダ（例: `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`）にあります。2つのセクションがあり、それぞれ独自のパラメータと位置バブルを持ちます:

- **`<fresh>`** -- 新しいキャラクター（初回ライフまたは死亡後）
- **`<hop>`** -- サーバーホッパー（プレイヤーが別のサーバーにキャラクターを持っていた場合）

---

## スポーンパラメータ

バニラの新規スポーン値:

```xml
<spawn_params>
    <min_dist_infected>30</min_dist_infected>
    <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>
    <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
</spawn_params>
```

| パラメータ | 値 | 意味 |
|-----------|-------|---------|
| `min_dist_infected` | 30 | プレイヤーは最寄りの感染者から最低30m離れてスポーンする必要があります |
| `max_dist_infected` | 70 | 30m以上離れた位置がない場合、70mまでのフォールバック範囲で受け入れます |
| `min_dist_player` | 65 | 他のプレイヤーから最低65m離れてスポーンする必要があります |
| `max_dist_player` | 150 | フォールバック範囲 -- 他のプレイヤーから最大150mまでの位置を受け入れます |
| `min_dist_static` | 0 | 静的オブジェクト（建物、壁）からの最小距離 |
| `max_dist_static` | 2 | 静的オブジェクトからの最大距離 -- プレイヤーを構造物の近くに保ちます |

エンジンはまず `min_dist_*` を試みます。有効な位置がない場合、`max_dist_*` に向かって緩和します。

---

## ジェネレータパラメータ

ジェネレータは各バブル周辺に候補位置のグリッドを作成します:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
</generator_params>
```

| パラメータ | 値 | 意味 |
|-----------|-------|---------|
| `grid_density` | 4 | グリッドポイント間の間隔（メートル） -- 低いほど候補が多く、CPU負荷が高い |
| `grid_width` | 200 | 各バブル中心の周囲でX軸に200m展開するグリッド |
| `grid_height` | 200 | 各バブル中心の周囲でZ軸に200m展開するグリッド |
| `min_steepness` / `max_steepness` | -45 / 45 | 地形の傾斜範囲（度） -- 崖面や急な丘を除外します |

各バブルは4mごとにポイントを持つ200x200mのグリッド（約2,500候補）を取得します。エンジンは傾斜と静的距離でフィルタリングし、スポーン時に `spawn_params` を適用します。

#### `allow_in_water` パラメータ（1.28+）

DayZ 1.28 から、新しいブール値 `allow_in_water` パラメータが `generator_params` に追加されました（デフォルト: `false`）。`true` に設定すると、スポーンポイントジェネレータは水中の位置を有効なスポーンポイントとして認識します。

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
    <allow_in_water>false</allow_in_water>
</generator_params>
```

デフォルトでは、エンジンは水中（池、川、海）に位置する候補位置を拒否します。`allow_in_water` を `true` に設定するとこのフィルタが解除されます。これは主に島スポーンのあるカスタムマップや、海岸の水中スポーンが意図的なシナリオに役立ちます。ほとんどのサーバーでは、プレイヤーが湖や海にスポーンするのを避けるため、`false` のままにしてください。

---

## グループパラメータ

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| パラメータ | 値 | 意味 |
|-----------|-------|---------|
| `enablegroups` | true | 位置バブルは名前付きグループに整理されます |
| `groups_as_regular` | true | グループは通常のスポーンポイントとして扱われます（任意のグループが選択可能） |
| `lifetime` | 240 | 使用されたスポーンポイントが再び利用可能になるまでの秒数 |
| `counter` | -1 | スポーンポイントが使用できる回数です。-1 = 無制限 |

使用された位置は240秒間ロックされ、2人のプレイヤーが同じ場所にスポーンするのを防ぎます。

---

## 新規スポーンバブル

バニラのチェルナルスでは、新規スポーン用に海岸沿いに11のグループが定義されています。各グループは町の周辺に3-8の位置をクラスタリングしています:

| グループ | 位置数 | エリア |
|-------|-----------|------|
| WestCherno | 4 | チェルノゴルスク西側 |
| EastCherno | 4 | チェルノゴルスク東側 |
| WestElektro | 5 | エレクトロザボーツク西部 |
| EastElektro | 4 | エレクトロザボーツク東部 |
| Kamyshovo | 5 | カミショヴォ海岸線 |
| Solnechny | 5 | ソルニーチュイ工場エリア |
| Orlovets | 4 | ソルニーチュイとニジノイエの間 |
| Nizhnee | 4 | ニジノイエ海岸 |
| SouthBerezino | 3 | 南ベレジノ |
| NorthBerezino | 8 | 北ベレジノ + 延長海岸線 |
| Svetlojarsk | 3 | スヴェトロヤルスク港 |

### グループの実例

```xml
<generator_posbubbles>
    <group name="WestCherno">
        <pos x="6063.018555" z="1931.907227" />
        <pos x="5933.964844" z="2171.072998" />
        <pos x="6199.782715" z="2241.805176" />
        <pos x="13552.5654" z="5955.893066" />
    </group>
    <group name="WestElektro">
        <pos x="8747.670898" z="2357.187012" />
        <pos x="9363.6533" z="2017.953613" />
        <pos x="9488.868164" z="1898.900269" />
        <pos x="9675.2216" z="1817.324585" />
        <pos x="9821.274414" z="2194.003662" />
    </group>
    <group name="Kamyshovo">
        <pos x="11830.744141" z="3400.428955" />
        <pos x="11930.805664" z="3484.882324" />
        <pos x="11961.211914" z="3419.867676" />
        <pos x="12222.977539" z="3454.867188" />
        <pos x="12336.774414" z="3503.847168" />
    </group>
</generator_posbubbles>
```

座標は `x`（東西）と `z`（南北）を使用します。Y軸（高度）は地形のハイトマップから自動的に計算されます。

---

## ホップスポーン

ホップスポーンはプレイヤー距離に関してより寛容で、より小さなグリッドを使用します:

```xml
<!-- ホップのspawn_paramsとfreshの違い -->
<min_dist_player>25.0</min_dist_player>   <!-- fresh: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- fresh: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- fresh: 0 -->

<!-- ホップのgenerator_paramsの違い -->
<grid_width>150</grid_width>              <!-- fresh: 200 -->
<grid_height>150</grid_height>            <!-- fresh: 200 -->

<!-- ホップのgroup_paramsの違い -->
<enablegroups>false</enablegroups>        <!-- fresh: true -->
<lifetime>360</lifetime>                  <!-- fresh: 240 -->
```

ホップグループは **内陸** に広がっています: Balota (6)、Cherno (5)、Pusta (5)、Kamyshovo (4)、Solnechny (5)、Nizhnee (6)、Berezino (5)、Olsha (4)、Svetlojarsk (5)、Dobroye (5)。`enablegroups=false` では、エンジンはすべての50の位置をフラットなプールとして扱います。

---

## init.c -- 初期装備

ミッションフォルダの **init.c** ファイルはキャラクター作成と初期装備を制御します。2つのオーバーライドが重要です:

- **`CreateCharacter`** -- `GetGame().CreatePlayer()` を呼び出します。エンジンはこの実行前に **cfgplayerspawnpoints.xml** から位置を選択します。ここではスポーン位置を設定しません。
- **`StartingEquipSetup`** -- キャラクター作成後に実行されます。プレイヤーはすでにデフォルトの衣服（シャツ、ジーンズ、スニーカー）を持っています。このメソッドは初期アイテムを追加します。

### バニラのStartingEquipSetup（チェルナルス）

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65の体力

        itemEnt = itemClothing.GetInventory().CreateInInventory( "BandageDressing" );
        player.SetQuickBarEntityShortcut(itemEnt, 2);

        string chemlightArray[] = { "Chemlight_White", "Chemlight_Yellow", "Chemlight_Green", "Chemlight_Red" };
        int rndIndex = Math.RandomInt( 0, 4 );
        itemEnt = itemClothing.GetInventory().CreateInInventory( chemlightArray[rndIndex] );
        SetRandomHealth( itemEnt );
        player.SetQuickBarEntityShortcut(itemEnt, 1);

        rand = Math.RandomFloatInclusive( 0.0, 1.0 );
        if ( rand < 0.35 )
            itemEnt = player.GetInventory().CreateInInventory( "Apple" );
        else if ( rand > 0.65 )
            itemEnt = player.GetInventory().CreateInInventory( "Pear" );
        else
            itemEnt = player.GetInventory().CreateInInventory( "Plum" );
        player.SetQuickBarEntityShortcut(itemEnt, 3);
        SetRandomHealth( itemEnt );
    }

    itemClothing = player.FindAttachmentBySlotName( "Legs" );
    if ( itemClothing )
        SetRandomHealth( itemClothing );
}
```

各プレイヤーに与えられるもの: **BandageDressing**（クイックバー3）、ランダムな **Chemlight**（クイックバー2）、ランダムなフルーツ -- 35% Apple、30% Plum、35% Pear（クイックバー1）。`SetRandomHealth` はすべてのアイテムに45-65%のコンディションを設定します。

### カスタム初期装備の追加

```c
// フルーツブロックの後、Bodyスロットチェック内に追加
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## カスタムスポーンポイントの追加

カスタムスポーングループを追加するには、**cfgplayerspawnpoints.xml** の `<fresh>` セクションを編集します:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

手順:

1. ゲーム内でマップを開くか、iZurviveを使用して座標を見つけます
2. 安全なエリア（崖なし、水なし）で100-200m内に広がる3-5つの位置を選びます
3. `<generator_posbubbles>` 内に `<group>` ブロックを追加します
4. `x` は東西、`z` は南北に使用します -- エンジンが地形からY（高度）を計算します
5. サーバーを再起動します -- パーシステンスワイプは不要です

バランスの取れたスポーンのために、複数のプレイヤーが同時に死亡した時に240秒のロックアウトがすべての位置をブロックしないよう、グループごとに少なくとも4つの位置を維持してください。

---

## よくある間違い

### プレイヤーが海にスポーンする

`z`（南北）とY（高度）を入れ替えたか、0-15360の範囲外の座標を使用しています。海岸の位置は低い `z` 値（南端）を持ちます。iZurviveで再確認してください。

### スポーンポイントが不足

2-3つの位置しかない場合、240秒のロックアウトがクラスタリングを引き起こします。バニラは11グループに49のfresh位置を使用しています。4つ以上のグループに少なくとも20の位置を目指してください。

### hopセクションを忘れる

空の `<hop>` セクションは、サーバーホッパーが `0,0,0` -- チェルナルスでは海 -- にスポーンすることを意味します。`<fresh>` からコピーする場合でも、常にホップポイントを定義してください。

### 急な地形上のスポーンポイント

ジェネレータは45度を超える傾斜を拒否します。すべてのカスタム位置が丘の斜面にある場合、有効な候補が存在しません。道路近くの平坦な地面を使用してください。

### プレイヤーが常に同じ場所にスポーンする

1-2つの位置しかないグループは240秒のクールダウンによってロックされます。グループごとにさらに位置を追加してください。

---

[ホーム](../README.md) | [<< 前へ: 車両スポーン](05-vehicle-spawning.md) | [次へ: パーシステンス >>](07-persistence.md)
