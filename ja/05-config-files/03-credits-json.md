# Chapter 5.3: Credits.json

[Home](../../README.md) | [<< Previous: inputs.xml](02-inputs-xml.md) | **Credits.json** | [Next: ImageSet Format >>](04-imagesets.md)

---

> **概要:** `Credits.json` ファイルは、ゲーム内のModメニューでDayZが表示するクレジット情報を定義します。チームメンバー、貢献者、謝辞を部門とセクションで整理して一覧表示します。見た目だけの機能ですが、開発チームに対するクレジット表示の標準的な方法です。

---

## 目次

- [概要](#overview)
- [ファイルの配置場所](#file-location)
- [JSON構造](#json-structure)
- [DayZでのクレジット表示方法](#how-dayz-displays-credits)
- [ローカライズされたセクション名の使用](#using-localized-section-names)
- [テンプレート](#templates)
- [実際の例](#real-examples)
- [よくある間違い](#common-mistakes)

---

## 概要

プレイヤーがDayZランチャーまたはゲーム内のModメニューであなたのModを選択すると、エンジンはModのPBO内にある `Credits.json` ファイルを探します。見つかった場合、クレジットは部門とセクションに整理されたスクロール表示で表示されます --- 映画のクレジットに似ています。

このファイルは任意です。存在しない場合、そのModのクレジットセクションは表示されません。しかし、含めることは良い慣行です：チームの作業を認め、Modにプロフェッショナルな外観を与えます。

---

## ファイルの配置場所

`Credits.json` をScriptsディレクトリの `Data` サブフォルダ内、またはScriptsルートに直接配置します：

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- 一般的な配置場所 (COT, Expansion, DayZ Editor)
        Credits.json         <-- こちらも有効 (DabsFramework, Colorful-UI)
```

どちらの場所でも動作します。エンジンはPBOの内容を `Credits.json` という名前のファイルでスキャンします（一部のプラットフォームでは大文字小文字が区別されます）。

---

## JSON構造

このファイルは3階層の分かりやすいJSON構造を使用します：

```json
{
    "Header": "My Mod Name",
    "Departments": [
        {
            "DepartmentName": "Department Title",
            "Sections": [
                {
                    "SectionName": "Section Title",
                    "Names": ["Person 1", "Person 2"]
                }
            ]
        }
    ]
}
```

### トップレベルフィールド

| フィールド | 型 | 必須 | 説明 |
|-------|------|----------|-------------|
| `Header` | string | いいえ | クレジットの上部に表示されるメインタイトル。省略すると、ヘッダーは表示されません。 |
| `Departments` | array | はい | 部門オブジェクトの配列 |

### 部門オブジェクト

| フィールド | 型 | 必須 | 説明 |
|-------|------|----------|-------------|
| `DepartmentName` | string | はい | セクションヘッダーテキスト。ヘッダーなしの視覚的グルーピングには空文字列 `""` を使用できます。 |
| `Sections` | array | はい | この部門内のセクションオブジェクトの配列 |

### セクションオブジェクト

名前のリスト表示には2つのバリアントが実際に使用されています。エンジンは両方をサポートします。

**バリアント1: `Names` 配列** (MyMod Coreで使用)

| フィールド | 型 | 必須 | 説明 |
|-------|------|----------|-------------|
| `SectionName` | string | はい | 部門内のサブヘッダー |
| `Names` | 文字列の配列 | はい | 貢献者名のリスト |

**バリアント2: `SectionLines` 配列** (COT, Expansion, DabsFrameworkで使用)

| フィールド | 型 | 必須 | 説明 |
|-------|------|----------|-------------|
| `SectionName` | string | はい | 部門内のサブヘッダー |
| `SectionLines` | 文字列の配列 | はい | 貢献者名またはテキスト行のリスト |

`Names` と `SectionLines` は同じ目的を果たします。お好みの方を使用してください --- エンジンは同じように描画します。

---

## DayZでのクレジット表示方法

クレジット表示は以下の視覚的階層に従います：

```
╔══════════════════════════════════╗
║         MY MOD NAME              ║  <-- Header (大きく、中央揃え)
║                                  ║
║     DEPARTMENT NAME              ║  <-- DepartmentName (中くらい、中央揃え)
║                                  ║
║     Section Name                 ║  <-- SectionName (小さく、中央揃え)
║     Person 1                     ║  <-- Names/SectionLines (リスト)
║     Person 2                     ║
║     Person 3                     ║
║                                  ║
║     Another Section              ║
║     Person A                     ║
║     Person B                     ║
║                                  ║
║     ANOTHER DEPARTMENT           ║
║     ...                          ║
╚══════════════════════════════════╝
```

- `Header` は上部に一度表示されます
- 各 `DepartmentName` は主要なセクション区切りとして機能します
- 各 `SectionName` はサブ見出しとして機能します
- 名前はクレジットビューで縦にスクロールします

### スペーシングのための空文字列

Expansionでは空の `DepartmentName` と `SectionName` 文字列、さらに `SectionLines` 内のスペースのみのエントリを使用して、視覚的なスペーシングを作成しています：

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

これはクレジットスクロールの視覚的レイアウトを制御するための一般的なテクニックです。

---

## ローカライズされたセクション名の使用

セクション名は、UIテキストと同様に `#` プレフィックスを使用してstringtableキーを参照できます：

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

エンジンがこれを描画する際、`#STR_EXPANSION_CREDITS_SCRIPTERS` をプレイヤーの言語に一致するローカライズされたテキストに解決します。これは、Modが複数の言語をサポートしており、クレジットのセクションヘッダーを翻訳したい場合に便利です。

部門名もstringtable参照を使用できます：

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## テンプレート

### ソロ開発者

```json
{
    "Header": "My Awesome Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developer",
                    "Names": ["YourName"]
                }
            ]
        }
    ]
}
```

### 小規模チーム

```json
{
    "Header": "My Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developers",
                    "Names": ["Lead Dev", "Co-Developer"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Modeler1", "Modeler2"]
                },
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (French)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                }
            ]
        }
    ]
}
```

### フルプロフェッショナル構造

```json
{
    "Header": "My Big Mod",
    "Departments": [
        {
            "DepartmentName": "Core Team",
            "Sections": [
                {
                    "SectionName": "Lead Developer",
                    "Names": ["ProjectLead"]
                },
                {
                    "SectionName": "Scripters",
                    "Names": ["Dev1", "Dev2", "Dev3"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Artist1", "Artist2"]
                },
                {
                    "SectionName": "Mapping",
                    "Names": ["Mapper1"]
                }
            ]
        },
        {
            "DepartmentName": "Community",
            "Sections": [
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (Czech)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                },
                {
                    "SectionName": "Testers",
                    "Names": ["Tester1", "Tester2", "Tester3"]
                }
            ]
        },
        {
            "DepartmentName": "Legal Notices",
            "Sections": [
                {
                    "SectionName": "Licenses",
                    "Names": [
                        "Font Awesome - CC BY 4.0 License",
                        "Some assets licensed under ADPL-SA"
                    ]
                }
            ]
        }
    ]
}
```

---

## 実際の例

### MyMod Core

`Names` バリアントを使用した最小限ながら完全なクレジットファイルです：

```json
{
    "Header": "MyMod Core",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["Documentation Team"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

複数のセクションと謝辞を含む `SectionLines` バリアントを使用しています：

```json
{
    "Departments": [
        {
            "DepartmentName": "Community Online Tools",
            "Sections": [
                {
                    "SectionName": "Active Developers",
                    "SectionLines": [
                        "LieutenantMaster",
                        "LAVA (liquidrock)"
                    ]
                },
                {
                    "SectionName": "Inactive Developers",
                    "SectionLines": [
                        "Jacob_Mango",
                        "Arkensor",
                        "DannyDog68",
                        "Thurston",
                        "GrosTon1"
                    ]
                },
                {
                    "SectionName": "Thank you to the following communities",
                    "SectionLines": [
                        "PIPSI.NET AU/NZ",
                        "1SKGaming",
                        "AWG",
                        "Expansion Mod Team",
                        "Bohemia Interactive"
                    ]
                }
            ]
        }
    ]
}
```

注目点：COTは `Header` フィールドを完全に省略しています。Mod名は他のメタデータ（config.cpp `CfgMods`）から取得されます。

### DabsFramework

```json
{
    "Departments": [{
        "DepartmentName": "Development",
        "Sections": [{
                "SectionName": "Developers",
                "SectionLines": [
                    "InclementDab",
                    "Gormirn"
                ]
            },
            {
                "SectionName": "Translators",
                "SectionLines": [
                    "InclementDab",
                    "DanceOfJesus (French)",
                    "MarioE (Spanish)",
                    "Dubinek (Czech)",
                    "Steve AKA Salutesh (German)",
                    "Yuki (Russian)",
                    ".magik34 (Polish)",
                    "Daze (Hungarian)"
                ]
            }
        ]
    }]
}
```

### DayZ Expansion

Expansionは Credits.json の最も洗練された使用方法を示しています。以下を含みます：
- stringtable参照によるローカライズされたセクション名（`#STR_EXPANSION_CREDITS_SCRIPTERS`）
- 別の部門としての法的通知
- 視覚的スペーシングのための空の部門名とセクション名
- 多数の名前を含むサポーターリスト

---

## よくある間違い

### 無効なJSON構文

最も一般的な問題です。JSONは以下について厳密です：
- **末尾のカンマ**: `["a", "b",]` は無効なJSONです（`"b"` の後の末尾のカンマ）
- **シングルクォート**: `'single quotes'` ではなく `"double quotes"` を使用してください
- **クォートなしのキー**: `DepartmentName` は `"DepartmentName"` でなければなりません

出荷前にJSONバリデータを使用してください。

### ファイル名の間違い

ファイル名は正確に `Credits.json`（大文字のC）でなければなりません。大文字小文字を区別するファイルシステムでは、`credits.json` や `CREDITS.JSON` は見つかりません。

### NamesとSectionLinesの混在

1つのセクション内では、どちらか一方を使用してください：

```json
{
    "SectionName": "Developers",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

これは曖昧です。1つの形式を選び、ファイル全体で一貫して使用してください。

### エンコーディングの問題

ファイルをUTF-8で保存してください。非ASCII文字（アクセント付きの名前、CJK文字）はゲーム内で正しく表示するためにUTF-8エンコーディングが必要です。

---

## ベストプラクティス

- PBOにパッキングする前に、外部ツールでJSONを検証してください --- エンジンは不正なJSONに対して有用なエラーメッセージを提供しません。
- 一貫性のために `SectionLines` バリアントを使用してください。これはCOT、Expansion、DabsFrameworkで使用されている形式です。
- Modがサードパーティのアセット（フォント、アイコン、サウンド）を帰属表示要件付きでバンドルしている場合は、「Legal Notices」部門を含めてください。
- `Header` フィールドを `mod.cpp` と `config.cpp` のModの `name` と一致させ、一貫したアイデンティティを維持してください。
- 視覚的スペーシングのために空の `DepartmentName` と `SectionName` 文字列は控えめに使用してください --- 使いすぎるとクレジットが断片的に見えます。

---

## 互換性と影響

- **マルチMod:** 各Modには独立した `Credits.json` があります。衝突のリスクはありません --- エンジンは各ModのPBOから個別にファイルを読み取ります。
- **パフォーマンス:** クレジットはプレイヤーがModの詳細画面を開いた時にのみ読み込まれます。ファイルサイズはゲームプレイのパフォーマンスに影響しません。
