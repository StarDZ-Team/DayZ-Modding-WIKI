# 第4.2章: 3Dモデル (.p3d)

[ホーム](../README.md) | [<< 前: テクスチャ](01-textures.md) | **3Dモデル** | [次: マテリアル >>](03-materials.md)

---

## はじめに

DayZのすべての物理オブジェクト -- 武器、衣服、建物、車両、木、岩 -- はBohemiaの独自フォーマットである**P3D**に格納された3Dモデルです。P3Dフォーマットは単なるメッシュコンテナ以上のものです。複数のディテールレベル、コリジョンジオメトリ、アニメーションセレクション、アタッチメントやエフェクト用のメモリポイント、そしてマウント可能なアイテム用のプロキシ位置をエンコードします。P3Dファイルの仕組みと**Object Builder**でそれを作成する方法を理解することは、ゲームワールドに物理アイテムを追加するすべてのモッドにとって不可欠です。

この章では、P3Dフォーマットの構造、LODシステム、名前付きセレクション、メモリポイント、プロキシシステム、`model.cfg`によるアニメーション設定、そして標準3Dフォーマットからのインポートワークフローについて説明します。

---

## 目次

- [P3Dフォーマットの概要](#p3dフォーマットの概要)
- [Object Builder](#object-builder)
- [LODシステム](#lodシステム)
- [名前付きセレクション](#名前付きセレクション)
- [メモリポイント](#メモリポイント)
- [プロキシシステム](#プロキシシステム)
- [アニメーション用model.cfg](#アニメーション用modelcfg)
- [FBX/OBJからのインポート](#fbxobjからのインポート)
- [一般的なモデルタイプ](#一般的なモデルタイプ)
- [よくある間違い](#よくある間違い)
- [ベストプラクティス](#ベストプラクティス)

---

## P3Dフォーマットの概要

**P3D** (Point 3D) はBohemia Interactiveのバイナリ3Dモデルフォーマットで、Real Virtualityエンジンから引き継がれ、Enfusionに受け継がれています。コンパイル済みのエンジン対応フォーマットです -- P3Dファイルを手動で書くことはありません。

### 主な特徴

- **バイナリフォーマット:** 人間が読むことはできません。Object Builderでのみ作成・編集されます。
- **マルチLODコンテナ:** 1つのP3Dファイルには、それぞれ異なる目的を持つ複数のLOD（Level of Detail）メッシュが含まれます。
- **エンジンネイティブ:** DayZエンジンはP3Dを直接ロードします。ランタイム変換は行われません。
- **バイナライズ vs. 非バイナライズ:** Object Builderからのソースp3DファイルはMLOD（編集可能）です。BinarizeはそれらをODOL（最適化済み、読み取り専用）に変換します。ゲームは両方をロードできますが、ODOLの方がロードが速く、サイズも小さくなります。

### 遭遇するファイルタイプ

| 拡張子 | 説明 |
|-----------|-------------|
| `.p3d` | 3Dモデル（MLODソースとODOLバイナライズ済みの両方） |
| `.rtm` | Runtime Motion -- アニメーションキーフレームデータ |
| `.bisurf` | サーフェスプロパティファイル（P3Dと併用） |

### MLOD vs. ODOL

| プロパティ | MLOD（ソース） | ODOL（バイナライズ済み） |
|----------|---------------|-------------------|
| 作成元 | Object Builder | Binarize |
| 編集可能 | はい | いいえ |
| ファイルサイズ | 大きい | 小さい |
| ロード速度 | 遅い | 速い |
| 使用時期 | 開発中 | リリース時 |
| 含まれるもの | 完全な編集データ、名前付きセレクション | 最適化されたメッシュデータ |

> **重要:** バイナライズを有効にしてPBOをパックすると、MLODのP3Dファイルは自動的にODOLに変換されます。`-packonly`でパックする場合、MLODファイルはそのまま含まれます。両方ともゲーム内で動作しますが、リリースビルドではODOLが推奨されます。

---

## Object Builder

**Object Builder**は、P3Dモデルを作成・編集するためのBohemia提供のツールです。SteamのDayZ Toolsスイートに含まれています。

### 主な機能

- 頂点、エッジ、フェースを使って3Dメッシュを作成・編集する。
- 1つのP3Dファイル内に複数のLODを定義する。
- アニメーションとテクスチャ制御用の**名前付きセレクション**（頂点/フェースのグループ）を割り当てる。
- アタッチメント位置、パーティクル原点、サウンドソース用の**メモリポイント**を配置する。
- アタッチ可能なアイテム（マガジン、光学機器など）用の**プロキシオブジェクト**を追加する。
- マテリアル（`.rvmat`）とテクスチャ（`.paa`）をフェースに割り当てる。
- FBX、OBJ、3DSフォーマットからメッシュをインポートする。
- Binarize用のバリデーション済みP3Dファイルをエクスポートする。

### ワークスペースのセットアップ

Object Builderは**P:ドライブ**（ワークドライブ）のセットアップが必要です。この仮想ドライブは、エンジンがアセットを見つけるために使用する統一パスプレフィックスを提供します。

```
P:\
  DZ\                        <-- バニラDayZデータ（展開済み）
  DayZ Tools\                <-- ツールインストール
  MyMod\                     <-- モッドのソースディレクトリ
    data\
      models\
        my_item.p3d
      textures\
        my_item_co.paa
```

P3Dファイルとマテリアル内のすべてのパスはP:ドライブのルートに対する相対パスです。たとえば、モデル内のマテリアル参照は`MyMod\data\textures\my_item_co.paa`のようになります。

### Object Builderでの基本ワークフロー

1. メッシュジオメトリを**作成またはインポート**します。
2. **LODを定義**します -- 最低限、Resolution、Geometry、Fire Geometry LODを作成します。
3. Resolution LODでフェースに**マテリアルを割り当て**ます。
4. アニメーション、テクスチャスワップ、またはコードインタラクションが必要なパーツに**セレクション名を付け**ます。
5. アタッチメント、マズルフラッシュ位置、排出ポートなどの**メモリポイントを配置**します。
6. アタッチ可能なアイテム（光学機器、マガジン、サプレッサー）用の**プロキシを追加**します。
7. Object Builderの組み込みバリデーション（Structure --> Validate）で**バリデーション**します。
8. P3Dとして**保存**します。
9. BinarizeまたはAddonBuilderで**ビルド**します。

---

## LODシステム

P3Dファイルには、それぞれ特定の目的を果たす複数の**LOD**（Level of Detail）が含まれます。エンジンは状況に応じて使用するLODを選択します -- カメラからの距離、物理計算、シャドウレンダリングなど。

### LODタイプ

| LOD | 解像度値 | 目的 |
|-----|-----------------|---------|
| **Resolution 0** | 1.000 | 最高詳細のビジュアルメッシュ。オブジェクトがカメラに近い時にレンダリングされます。 |
| **Resolution 1** | 1.100 | 中詳細。中距離でレンダリングされます。 |
| **Resolution 2** | 1.200 | 低詳細。遠距離でレンダリングされます。 |
| **Resolution 3+** | 1.300+ | 追加の距離LOD。 |
| **View Geometry** | 特殊 | プレイヤーの視界を遮るもの（一人称）を決定します。簡略化されたメッシュ。 |
| **Fire Geometry** | 特殊 | 弾丸やプロジェクタイルのコリジョン。凸形状または凸形状の組み合わせでなければなりません。 |
| **Geometry** | 特殊 | 物理コリジョン。移動コリジョン、重力、配置に使用されます。凸形状または凸形状分解の組み合わせでなければなりません。 |
| **Shadow 0** | 特殊 | シャドウキャスティングメッシュ（近距離）。 |
| **Shadow 1000** | 特殊 | シャドウキャスティングメッシュ（遠距離）。Shadow 0よりシンプルです。 |
| **Memory** | 特殊 | 名前付きポイントのみを含みます（可視ジオメトリなし）。アタッチメント位置、サウンド原点などに使用されます。 |
| **Roadway** | 特殊 | オブジェクト上の歩行可能な表面を定義します（車両、進入可能な建物の内部）。 |
| **Paths** | 特殊 | 建物用のAIパスファインディングヒント。 |

### LOD解像度値（ビジュアルLOD）

```mermaid
graph TB
    P3D["weapon.p3d"]

    P3D --> RES["Resolution LODs<br/>1.0, 2.0, 4.0, 8.0, 16.0<br/>Visible 3D meshes"]
    P3D --> GEO["Geometry LOD<br/>Collision detection<br/>Convex hull"]
    P3D --> FIRE["Fire Geometry LOD<br/>Bullet collision<br/>Simplified shape"]
    P3D --> VIEW["View Geometry LOD<br/>Camera collision"]
    P3D --> SHADOW["Shadow LODs<br/>0.0, 10.0, 1000.0<br/>Shadow casting"]
    P3D --> MEM["Memory LOD<br/>Named points<br/>Attachment positions"]

    style RES fill:#4A90D9,color:#fff
    style GEO fill:#D94A4A,color:#fff
    style FIRE fill:#D97A4A,color:#fff
    style MEM fill:#2D8A4E,color:#fff
```

エンジンは距離とオブジェクトサイズに基づく式を使用して、レンダリングするビジュアルLODを決定します:

```
LOD選択 = (オブジェクトまでの距離 * LODファクター) / オブジェクトのバウンディングスフィア半径
```

値が低い = カメラが近い。エンジンは計算された値に最も近い解像度値を持つLODを見つけます。

### Object BuilderでのLOD作成

1. **File --> New LOD**または右クリックでLODリスト。
2. ドロップダウンからLODタイプを選択します。
3. ビジュアルLOD（Resolution）の場合、解像度値を入力します。
4. そのLODのジオメトリをモデリングします。

### アイテムタイプ別のLOD要件

| アイテムタイプ | 必須LOD | 推奨追加LOD |
|-----------|---------------|----------------------------|
| **携行アイテム** | Resolution 0, Geometry, Fire Geometry, Memory | Shadow 0, Resolution 1 |
| **衣服** | Resolution 0, Geometry, Fire Geometry, Memory | Shadow 0, Resolution 1, Resolution 2 |
| **武器** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Resolution 1, Resolution 2 |
| **建物** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Shadow 1000, Roadway, Paths |
| **車両** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Roadway, Resolution 1+ |

### Geometry LODルール

GeometryとFire Geometry LODには厳格な要件があります:

- **凸形状**または複数の凸形状コンポーネントで構成されている必要があります。エンジンの物理システムは凸形状のコリジョンシェイプを必要とします。
- **名前付きセレクションが一致**している必要があります。Resolution LODのものと同じ（アニメーションパーツ用）。
- **質量が定義されている**必要があります。Geometry LODですべての頂点を選択し、**Structure --> Mass**で質量を割り当てます。これはオブジェクトの物理的重量を決定します。
- **シンプルに保つ。** トライアングルが少ない = 物理パフォーマンスが向上。武器のGeometry LODはビジュアルLODの数千に対して20-50トライアングル程度です。

---

## 名前付きセレクション

名前付きセレクションは、LOD内の頂点、エッジ、またはフェースのグループに名前を付けたものです。エンジンとスクリプトがモデルの部分を操作するためのハンドルとして機能します。

### 名前付きセレクションの機能

| 目的 | セレクション名の例 | 使用元 |
|---------|----------------------|---------|
| **アニメーション** | `bolt`, `trigger`, `magazine` | `model.cfg`アニメーションソース |
| **テクスチャスワップ** | `camo`, `camo1`, `body` | config.cppの`hiddenSelections[]` |
| **ダメージテクスチャ** | `zbytek` | エンジンダメージシステム、マテリアルスワップ |
| **アタッチメントポイント** | `magazine`, `optics`, `suppressor` | プロキシとアタッチメントシステム |

### hiddenSelections（テクスチャスワップ）

モッダーにとって名前付きセレクションの最も一般的な用途は**hiddenSelections** -- config.cppを通じてランタイムにテクスチャをスワップする機能です。

**P3Dモデル内（Resolution LOD）:**
1. リテクスチャ可能にするフェースを選択します。
2. セレクションに名前を付けます（例: `camo`）。

**config.cpp内:**
```cpp
class MyRifle: Rifle_Base
{
    hiddenSelections[] = {"camo"};
    hiddenSelectionsTextures[] = {"MyMod\data\my_rifle_co.paa"};
    hiddenSelectionsMaterials[] = {"MyMod\data\my_rifle.rvmat"};
};
```

これにより、P3Dファイルを複製せずに、異なるテクスチャを持つ同じモデルの異なるバリアントを作成できます。

### 名前付きセレクションの作成

Object Builderでの手順:

1. グループ化したい頂点またはフェースを選択します。
2. **Structure --> Named Selections**（またはCtrl+N）に移動します。
3. **New**をクリックし、セレクション名を入力します。
4. **Assign**をクリックして、選択したジオメトリにその名前をタグ付けします。

> **ヒント:** セレクション名は大文字と小文字が区別されます。`Camo`と`camo`は異なるセレクションです。慣例は小文字です。

### LOD間のセレクション

アニメーションが動作するためには、名前付きセレクションはLOD間で一貫している必要があります:

- `bolt`セレクションがResolution 0に存在する場合、GeometryとFire Geometry LODにも存在する必要があります（対応するコリジョンジオメトリをカバー）。
- アニメーションパーツが正しいシャドウをキャストする場合、Shadow LODにもそのセレクションが必要です。

---

## メモリポイント

メモリポイントは**Memory LOD**で定義される名前付き位置です。ゲーム内では視覚的な表現はありません -- エンジンとスクリプトがエフェクト、アタッチメント、サウンドなどの位置決めに参照する空間座標を定義します。

### 一般的なメモリポイント

| ポイント名 | 目的 |
|------------|---------|
| `usti hlavne` | マズル位置（弾丸の発射元、マズルフラッシュの表示位置） |
| `konec hlavne` | バレルの端（`usti hlavne`と共にバレル方向を定義） |
| `nabojnicestart` | 排莢口の開始位置（薬莢が出る場所） |
| `nabojniceend` | 排莢口の終了位置（排莢方向） |
| `handguard` | ハンドガードアタッチメントポイント |
| `magazine` | マガジンウェル位置 |
| `optics` | 光学機器レール位置 |
| `suppressor` | サプレッサーマウント位置 |
| `trigger` | トリガー位置（ハンドIK用） |
| `pistolgrip` | ピストルグリップ位置（ハンドIK用） |
| `lefthand` | 左手のグリップ位置 |
| `righthand` | 右手のグリップ位置 |
| `eye` | 目の位置（一人称ビューの整列用） |
| `pilot` | ドライバー/パイロットシート位置（車両） |
| `light_l` / `light_r` | 左/右ヘッドライト位置（車両） |

### 方向性メモリポイント

多くのエフェクトには位置と方向の両方が必要です。これはペアのメモリポイントで実現されます:

```
usti hlavne  ------>  konec hlavne
(マズル開始)          (マズル終了)

方向ベクトル: konec hlavne - usti hlavne
```

### Object Builderでのメモリポイント作成

1. LODリストで**Memory LOD**に切り替えます。
2. 目的の位置に頂点を作成します。
3. **Structure --> Named Selections**で名前を付けます: ポイント名でセレクションを作成し、単一の頂点を割り当てます。

> **注意:** Memory LODには名前付きポイント（個別の頂点）のみを含める必要があります。Memory LODにフェースやエッジを作成しないでください。

---

## プロキシシステム

プロキシは、他のP3Dモデルをアタッチできる位置を定義します。武器にマガジンが挿入されているのを見たり、レールに光学機器がマウントされていたり、バレルにサプレッサーが取り付けられているのを見たりする場合 -- それらはプロキシアタッチされたモデルです。

### プロキシの仕組み

プロキシは、Resolution LODに配置される特別な参照で、別のP3Dファイルを指します。エンジンはプロキシの参照モデルをプロキシの位置と方向でレンダリングします。

### プロキシの命名規則

プロキシ名は以下のパターンに従います: `proxy:\path\to\model.p3d`

武器のアタッチメントプロキシの標準名は以下の通りです:

| プロキシパス | アタッチメントタイプ |
|------------|----------------|
| `proxy:\dz\weapons\attachments\magazine\mag_placeholder.p3d` | マガジンスロット |
| `proxy:\dz\weapons\attachments\optics\optic_placeholder.p3d` | 光学機器レール |
| `proxy:\dz\weapons\attachments\suppressor\sup_placeholder.p3d` | サプレッサーマウント |
| `proxy:\dz\weapons\attachments\handguard\handguard_placeholder.p3d` | ハンドガードスロット |
| `proxy:\dz\weapons\attachments\stock\stock_placeholder.p3d` | ストック/バットストックスロット |

### Object Builderでのプロキシ追加

1. Resolution LODで、アタッチメントを表示させたい位置に3Dカーソルを配置します。
2. **Structure --> Proxy --> Create**に移動します。
3. プロキシパスを入力します（例: `dz\weapons\attachments\magazine\mag_placeholder.p3d`）。
4. プロキシは位置と方向を示す小さな矢印として表示されます。
5. アタッチメントジオメトリと正しくアラインするようにプロキシを回転・配置します。

### プロキシインデックス

各プロキシにはインデックス番号（1から開始）があります。モデルに同じタイプの複数のプロキシがある場合、インデックスでそれらを区別します。インデックスはconfig.cppで参照されます:

```cpp
class MyWeapon: Rifle_Base
{
    class Attachments
    {
        class magazine
        {
            type = "magazine";
            proxy = "proxy:\dz\weapons\attachments\magazine\mag_placeholder.p3d";
            proxyIndex = 1;
        };
    };
};
```

---

## アニメーション用model.cfg

`model.cfg`ファイルはP3Dモデルのアニメーションを定義します。アニメーションソース（ゲームロジックによって駆動）を名前付きセレクションのトランスフォームにマッピングします。

### 基本構造

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };

    class MyRifle: Default
    {
        skeletonName = "MyRifle_skeleton";
        sections[] = {"camo"};

        class Animations
        {
            class bolt_move
            {
                type = "translation";
                source = "reload";        // エンジンアニメーションソース
                selection = "bolt";       // P3D内の名前付きセレクション
                axis = "bolt_axis";       // 軸メモリポイントペア
                memory = 1;               // 軸はMemory LODで定義
                minValue = 0;
                maxValue = 1;
                offset0 = 0;
                offset1 = 0.05;           // 5cmの平行移動
            };

            class trigger_move
            {
                type = "rotation";
                source = "trigger";
                selection = "trigger";
                axis = "trigger_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -0.4;            // ラジアン
            };
        };
    };
};

class CfgSkeletons
{
    class Default
    {
        isDiscrete = 0;
        skeletonInherit = "";
        skeletonBones[] = {};
    };

    class MyRifle_skeleton: Default
    {
        skeletonBones[] =
        {
            "bolt", "",          // "ボーン名", "親ボーン"（"" = ルート）
            "trigger", "",
            "magazine", ""
        };
    };
};
```

### アニメーションタイプ

| タイプ | キーワード | 動き | 制御元 |
|------|---------|----------|---------------|
| **平行移動** | `translation` | 軸に沿った直線移動 | `offset0` / `offset1`（メートル） |
| **回転** | `rotation` | 軸を中心とした回転 | `angle0` / `angle1`（ラジアン） |
| **RotationX/Y/Z** | `rotationX` | 固定ワールド軸を中心とした回転 | `angle0` / `angle1` |
| **非表示** | `hide` | セレクションの表示/非表示 | `hideValue`しきい値 |

### アニメーションソース

アニメーションソースは、アニメーションを駆動するエンジン提供の値です:

| ソース | 範囲 | 説明 |
|--------|-------|-------------|
| `reload` | 0-1 | 武器リロードフェーズ |
| `trigger` | 0-1 | トリガー引き |
| `zeroing` | 0-N | 武器ゼロイング設定 |
| `isFlipped` | 0-1 | アイアンサイトフリップ状態 |
| `door` | 0-1 | ドア開閉 |
| `rpm` | 0-N | 車両エンジンRPM |
| `speed` | 0-N | 車両速度 |
| `fuel` | 0-1 | 車両燃料レベル |
| `damper` | 0-1 | 車両サスペンション |

---

## FBX/OBJからのインポート

ほとんどのモッダーは外部ツール（Blender、3ds Max、Maya）で3Dモデルを作成し、Object Builderにインポートします。

### サポートされるインポートフォーマット

| フォーマット | 拡張子 | 備考 |
|--------|-----------|-------|
| **FBX** | `.fbx` | 最良の互換性。FBX 2013以降（バイナリ）でエクスポートしてください。 |
| **OBJ** | `.obj` | Wavefront OBJ。シンプルなメッシュデータのみ（アニメーションなし）。 |
| **3DS** | `.3ds` | レガシー3ds Maxフォーマット。メッシュあたり65K頂点に制限。 |

### インポートワークフロー

**ステップ1: 3Dソフトウェアで準備**
- モデルを原点の中心に配置します。
- すべてのトランスフォーム（位置、回転、スケール）を適用します。
- スケール: 1ユニット = 1メートル。DayZはメートルを使用します。
- メッシュをトライアングレートします（Object Builderはトライアングルで動作します）。
- モデルをUVアンラップします。
- FBX（バイナリ、アニメーションなし、Y-upまたはZ-up -- Object Builderは両方を処理）としてエクスポートします。

**ステップ2: Object Builderにインポート**
1. Object Builderを開きます。
2. **File --> Import --> FBX**（またはOBJ/3DS）。
3. インポート設定を確認します:
   - スケールファクター（ソースがメートル単位の場合1.0であるべき）。
   - 軸変換（必要に応じてZ-upからY-up）。
4. メッシュが新しいResolution LODに表示されます。

**ステップ3: インポート後のセットアップ**
1. フェースにマテリアルを割り当てます（フェースを選択、右クリック --> **Face Properties**）。
2. 追加LOD（Geometry、Fire Geometry、Memory、Shadow）を作成します。
3. コリジョンLOD用にジオメトリを簡略化します（小さなディテールを削除、凸性を確保）。
4. 名前付きセレクション、メモリポイント、プロキシを追加します。
5. バリデーションして保存します。

### Blender固有のヒント

- 利用可能な場合は**Blender DayZ Toolbox**コミュニティアドオンを使用してください -- エクスポート設定を効率化します。
- エクスポート時: **Apply Modifiers**、**Triangulate Faces**、**Apply Scale**。
- FBXエクスポートダイアログで**Forward: -Z Forward**、**Up: Y Up**を設定します。
- Blenderのメッシュオブジェクトの名前を意図する名前付きセレクションに合わせます -- 一部のインポーターはオブジェクト名を保持します。

---

## 一般的なモデルタイプ

### 武器

武器は最も複雑なP3Dモデルで、以下が必要です:
- 高ポリResolution LOD（5,000-20,000トライアングル）
- 複数の名前付きセレクション（bolt、trigger、magazine、camoなど）
- 完全なメモリポイントセット（マズル、排莢、グリップ位置）
- 複数のプロキシ（マガジン、光学機器、サプレッサー、ハンドガード、ストック）
- model.cfgでのスケルトンとアニメーション
- 一人称遮蔽用のView Geometry

### 衣服

衣服モデルはキャラクタースケルトンにリグされています:
- Resolution LODはキャラクターのボーン構造に従う
- テクスチャバリアント用の名前付きセレクション（`camo`、`camo1`）
- よりシンプルなコリジョンジオメトリ
- プロキシなし（通常）
- カラー/カモバリアント用のhiddenSelections

### 建物

建物には独自の要件があります:
- 大きく詳細なResolution LOD
- 歩行可能な表面用のRoadway LOD（床、階段）
- AIナビゲーション用のPaths LOD
- 壁の透視防止用のView Geometry
- 異なる距離でのパフォーマンス用の複数のShadow LOD
- 開くドアや窓用の名前付きセレクション

### 車両

車両は多くのシステムを組み合わせます:
- アニメーションパーツ（ホイール、ドア、フード）を持つ詳細なResolution LOD
- 多くのボーンを持つ複雑なスケルトン
- トラック荷台で立つ乗客用のRoadway LOD
- ライト、排気、ドライバー位置、乗客シート用のメモリポイント
- アタッチメント（ホイール、ドア）用の複数のプロキシ

---

## よくある間違い

### 1. Geometry LODの欠落

**症状:** オブジェクトにコリジョンがない。プレイヤーと弾丸が通り抜ける。
**修正:** 簡略化された凸メッシュでGeometry LODを作成してください。頂点に質量を割り当ててください。

### 2. 非凸コリジョンシェイプ

**症状:** 物理のグリッチ、オブジェクトが不規則に跳ねる、アイテムがサーフェスを通り抜ける。
**修正:** Geometry LODで複雑な形状を複数の凸コンポーネントに分割してください。各コンポーネントは閉じた凸形状でなければなりません。

### 3. 一貫性のない名前付きセレクション

**症状:** アニメーションが視覚的にのみ動作するがコリジョンには反映されない、またはシャドウがアニメーションしない。
**修正:** Resolution LODに存在するすべての名前付きセレクションが、Geometry、Fire Geometry、Shadow LODにも存在することを確認してください。

### 4. 間違ったスケール

**症状:** オブジェクトがゲーム内で巨大または微小。
**修正:** 3Dソフトウェアがメートルを単位として使用していることを確認してください。DayZキャラクターは約1.8メートルの高さです。

### 5. メモリポイントの欠落

**症状:** マズルフラッシュが間違った位置に表示される、アタッチメントが空中に浮く。
**修正:** Memory LODを作成し、正しい位置にすべての必要な名前付きポイントを追加してください。

### 6. 質量が未定義

**症状:** オブジェクトを拾えない、または物理インタラクションが奇妙に動作する。
**修正:** Geometry LODですべての頂点を選択し、**Structure --> Mass**で質量を割り当ててください。

---

## ベストプラクティス

1. **Geometry LODから始めてください。** 最初にコリジョンシェイプをブロックアウトし、その上にビジュアルのディテールを構築します。これにより、美しいモデルを作成したが適切にコリジョンできないという一般的な間違いを防ぎます。

2. **参考モデルを使用してください。** ゲームデータからバニラP3Dファイルを抽出し、Object Builderで調べてください。各アイテムタイプに対してエンジンが何を期待しているかを正確に示しています。

3. **頻繁にバリデーションしてください。** 重要な変更のたびにObject Builderの**Structure --> Validate**を使用してください。警告がゲーム内の謎のバグになる前に修正してください。

4. **LODトライアングル数を比例的に保ってください。** Resolution 0は10,000トライアングル、Resolution 1は約5,000、Geometryは約100-500であるべきです。各レベルで劇的な削減。

5. **セレクションに説明的な名前を付けてください。** `sel01`の代わりに`bolt_carrier`を使用してください。将来のあなた自身（および他のモッダー）に感謝されます。

6. **まずファイルパッチングでテストしてください。** 完全なPBOビルドをコミットする前に、ファイルパッチングモードで非バイナライズP3Dをロードしてください。ほとんどの問題をより速くキャッチできます。

7. **メモリポイントを文書化してください。** すべてのメモリポイントとその意図する位置をリストした参照画像やテキストファイルを保管してください。複雑な武器には20以上のポイントがあることがあります。

---

## ナビゲーション

| 前 | 上 | 次 |
|----------|----|------|
| [4.1 テクスチャ](01-textures.md) | [Part 4: ファイルフォーマット & DayZ Tools](01-textures.md) | [4.3 マテリアル](03-materials.md) |
