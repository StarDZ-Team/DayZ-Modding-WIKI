# Chapter 5.1: stringtable.csv --- ローカライゼーション

[Home](../README.md) | **stringtable.csv** | [Next: inputs.xml >>](02-inputs-xml.md)

---

> **概要:** `stringtable.csv` ファイルは、DayZ Mod のローカライズテキストを提供します。エンジンは起動時にこの CSV を読み込み、プレイヤーの言語設定に基づいて翻訳キーを解決します。UIラベル、入力バインド名、アイテム説明、通知テキストなど、ユーザーに表示されるすべての文字列は、ハードコードではなく stringtable に配置するべきです。

---

## 目次

- [概要](#概要)
- [CSV形式](#csv形式)
- [カラムリファレンス](#カラムリファレンス)
- [キー命名規則](#キー命名規則)
- [文字列の参照](#文字列の参照)
- [新しいStringtableの作成](#新しいstringtableの作成)
- [空セルの処理とフォールバック動作](#空セルの処理とフォールバック動作)
- [多言語ワークフロー](#多言語ワークフロー)
- [モジュラーStringtableアプローチ (DayZ Expansion)](#モジュラーstringtableアプローチ-dayz-expansion)
- [実際の例](#実際の例)
- [よくある間違い](#よくある間違い)

---

## 概要

DayZ は CSV ベースのローカライゼーションシステムを使用しています。エンジンが `#` プレフィックス付きの文字列キー（例：`#STR_MYMOD_HELLO`）に遭遇すると、読み込まれたすべての stringtable ファイルからそのキーを検索し、プレイヤーの現在の言語に一致する翻訳を返します。アクティブな言語で一致が見つからない場合、エンジンは定義されたチェーンに従ってフォールバックします。

stringtable ファイルは正確に `stringtable.csv` という名前で、Mod の PBO 構造内に配置する必要があります。エンジンが自動的に検出するため、config.cpp での登録は不要です。

---

## CSV形式

このファイルはクォートされたフィールドを持つ標準的なカンマ区切り値ファイルです。最初の行がヘッダーで、以降の各行が1つの翻訳キーを定義します。

### ヘッダー行

ヘッダー行はカラムを定義します。DayZ は最大15カラムを認識します：

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### データ行

各行は文字列キー（CSV 内では `#` プレフィックスなし）から始まり、各言語の翻訳が続きます：

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### 末尾のカンマ

多くの stringtable ファイルは最後のカラムの後に末尾のカンマを含みます。これは慣例的なもので安全です --- エンジンはこれを許容します。

### クォートルール

- フィールドにカンマ、改行、またはダブルクォートが含まれる場合、ダブルクォートでクォートする**必要があります**。
- 実際には、一貫性のためにほとんどの Mod がすべてのフィールドをクォートしています。
- 一部の Mod（MyMod Missions など）はクォートを完全に省略しています。フィールド内容にカンマが含まれない限り、エンジンは両方のスタイルを処理します。

---

## カラムリファレンス

DayZ は13のプレイヤー選択可能言語をサポートしています。CSV が15カラムなのは、最初のカラムがキー名、2番目が `original` カラム（Mod 作者の母国語またはデフォルトテキスト）だからです。

| # | カラム名 | 言語 | 備考 |
|---|-------------|----------|-------|
| 1 | `Language` | --- | 文字列キー識別子（例：`STR_MYMOD_HELLO`） |
| 2 | `original` | 作者の母国語 | 最終手段のフォールバック。他のカラムが一致しない場合に使用 |
| 3 | `english` | 英語 | 国際 Mod で最も一般的な主要言語 |
| 4 | `czech` | チェコ語 | |
| 5 | `german` | ドイツ語 | |
| 6 | `russian` | ロシア語 | |
| 7 | `polish` | ポーランド語 | |
| 8 | `hungarian` | ハンガリー語 | |
| 9 | `italian` | イタリア語 | |
| 10 | `spanish` | スペイン語 | |
| 11 | `french` | フランス語 | |
| 12 | `chinese` | 中国語（繁体字） | 繁体字中国語文字 |
| 13 | `japanese` | 日本語 | |
| 14 | `portuguese` | ポルトガル語 | |
| 15 | `chinesesimp` | 中国語（簡体字） | 簡体字中国語文字 |

### カラム順序の重要性

エンジンはカラムを位置ではなく**ヘッダー名**で識別します。ただし、互換性と可読性のために上記の標準順序に従うことを強く推奨します。

### 省略可能なカラム

15カラムすべてを含める必要はありません。Mod が英語のみをサポートする場合、最小限のヘッダーを使用できます：

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

一部の Mod は `korean` のような非標準カラムを追加しています（MyMod Missions がこれを行っています）。エンジンはサポートされた言語として認識しないカラムを無視しますが、それらのカラムはドキュメントや将来の言語サポートの準備として機能します。

---

## キー命名規則

文字列キーは階層的な命名パターンに従います：

```
STR_MODNAME_CATEGORY_ELEMENT
```

### ルール

1. **常に `STR_` で始める** --- これは DayZ の普遍的な慣例です
2. **Mod プレフィックス** --- Mod を一意に識別します（例：`MYMOD`、`COT`、`EXPANSION`、`VPP`）
3. **カテゴリ** --- 関連する文字列をグループ化します（例：`INPUT`、`TAB`、`CONFIG`、`DIR`）
4. **要素** --- 特定の文字列（例：`ADMIN_PANEL`、`NORTH`、`SAVE`）
5. **大文字を使用** --- すべての主要 Mod 間の慣例
6. **アンダースコアを区切り文字として使用**、スペースやハイフンは使わない

### 実際の Mod からの例

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod: キーバインドラベル
STR_MYMOD_CLOSE                   -- MyMod: 汎用の「閉じる」ボタン
STR_MYMOD_DIR_NORTH                  -- MyMod: コンパスの方角
STR_MYMOD_TAB_ONLINE                 -- MyMod: 管理パネルのタブ名
STR_COT_ESP_MODULE_NAME            -- COT: モジュール表示名
STR_COT_CAMERA_MODULE_BLUR         -- COT: カメラツールラベル
STR_EXPANSION_ATM                  -- Expansion: 機能名
STR_EXPANSION_AI_COMMAND_MENU      -- Expansion: 入力ラベル
```

### アンチパターン

```
STR_hello_world          -- 悪い例: 小文字、Modプレフィックスなし
MY_STRING                -- 悪い例: STR_ プレフィックスなし
STR_MYMOD Hello World    -- 悪い例: キーにスペース
```

---

## 文字列の参照

ローカライズされた文字列を参照するコンテキストは3つあり、それぞれ少し異なる構文を使用します。

### レイアウトファイル (.layout) での参照

キー名の前に `#` プレフィックスを使用します。エンジンはウィジェット作成時にこれを解決します。

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

`#` プレフィックスはレイアウトパーサーに「これはリテラルテキストではなくローカライゼーションキーである」と伝えます。

### Enforce Script (.c ファイル) での参照

ランタイムでキーを解決するには `Widget.TranslateString()` を使用します。引数には `#` プレフィックスが必要です。

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close" (プレイヤーの言語が英語の場合)
// translated == "Fechar" (プレイヤーの言語がポルトガル語の場合)
```

ウィジェットテキストを直接設定することもできます：

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

または、文字列キーをウィジェットのテキストプロパティに直接使用し、エンジンが解決します：

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // これも動作します -- エンジンが自動解決
```

### inputs.xml での参照

`loc` 属性を `#` プレフィックス**なしで**使用します。

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

ここは `#` を省略する唯一の場所です。入力システムが内部的に追加します。

### まとめテーブル

| コンテキスト | 構文 | 例 |
|---------|--------|---------|
| レイアウトファイルの `text` 属性 | `#STR_KEY` | `text "#STR_MYMOD_CLOSE"` |
| スクリプト `TranslateString()` | `"#STR_KEY"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| スクリプトウィジェットテキスト | `"#STR_KEY"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| inputs.xml `loc` 属性 | `STR_KEY` (# なし) | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## 新しいStringtableの作成

### ステップ 1: ファイルの作成

Mod の PBO コンテンツディレクトリのルートに `stringtable.csv` を作成します。エンジンは読み込まれたすべての PBO から `stringtable.csv` という名前のファイルを検索します。

典型的な配置：

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- ここ
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### ステップ 2: ヘッダーの記述

フル15カラムのヘッダーから始めます：

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### ステップ 3: 文字列の追加

翻訳可能な文字列ごとに1行を追加します。英語から始め、翻訳が利用可能になったら他の言語を記入します：

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### ステップ 4: パックとテスト

PBO をビルドします。ゲームを起動します。スクリプトログで `Widget.TranslateString("#STR_MYMOD_TITLE")` が "My Cool Mod" を返すことを確認します。設定でゲーム言語を変更してフォールバック動作を検証します。

---

## 空セルの処理とフォールバック動作

エンジンがプレイヤーの現在の言語で文字列キーを検索し、空のセルを見つけた場合、フォールバックチェーンに従います：

1. **プレイヤーの選択した言語カラム** --- 最初にチェック
2. **`english` カラム** --- プレイヤーの言語セルが空の場合
3. **`original` カラム** --- `english` も空の場合
4. **生のキー名** --- すべてのカラムが空の場合、エンジンはキー自体を表示します（例：`STR_MYMOD_TITLE`）

つまり、開発中は英語以外のカラムを安全に空にしておけます。英語のプレイヤーは `english` カラムを見て、他のプレイヤーは適切な翻訳が追加されるまで英語のフォールバックを見ます。

### 実際の意味

プレースホルダーとして英語のテキストをすべてのカラムにコピーする必要はありません。未翻訳のセルは空のままにします：

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

言語がドイツ語のプレイヤーは、ドイツ語の翻訳が提供されるまで "Hello"（英語のフォールバック）を見ます。

---

## 多言語ワークフロー

### ソロ開発者向け

1. すべての文字列を英語で記述します（`original` と `english` の両方のカラム）。
2. Mod をリリースします。英語がユニバーサルフォールバックとして機能します。
3. コミュニティメンバーが翻訳を提供したら、追加のカラムを記入します。
4. 再ビルドしてアップデートをリリースします。

### 翻訳者チーム向け

1. 共有リポジトリまたはスプレッドシートで CSV を管理します。
2. 言語ごとに1人の翻訳者を割り当てます。
3. `original` カラムには作者の母国語を使用します（例：ブラジルの開発者ならポルトガル語）。
4. `english` カラムは常に記入します --- これが国際的なベースラインです。
5. 差分ツールを使用して、最後の翻訳パス以降に追加されたキーを追跡します。

### スプレッドシートソフトウェアの使用

CSV ファイルは Excel、Google Sheets、LibreOffice Calc で自然に開けます。以下の落とし穴に注意してください：

- **Excel は UTF-8 ファイルに BOM（バイトオーダーマーク）を追加する場合があります。** DayZ は BOM を処理しますが、一部のツールで問題が発生する可能性があります。安全のため "CSV UTF-8" として保存してください。
- **Excel の自動フォーマット**は、日付や数値に見えるフィールドを変更する可能性があります。
- **改行コード**: DayZ は `\r\n`（Windows）と `\n`（Unix）の両方を受け入れます。

---

## モジュラーStringtableアプローチ (DayZ Expansion)

DayZ Expansion は大規模 Mod のベストプラクティスを示しています：機能モジュールごとに整理された複数の stringtable ファイルに翻訳を分割します。彼らの構造は `languagecore` ディレクトリ内に20の個別の stringtable ファイルを使用しています：

```
DayZExpansion/
  languagecore/
    AI/stringtable.csv
    BaseBuilding/stringtable.csv
    Book/stringtable.csv
    Chat/stringtable.csv
    Core/stringtable.csv
    Garage/stringtable.csv
    Groups/stringtable.csv
    Hardline/stringtable.csv
    Licensed/stringtable.csv
    Main/stringtable.csv
    MapAssets/stringtable.csv
    Market/stringtable.csv
    Missions/stringtable.csv
    Navigation/stringtable.csv
    PersonalStorage/stringtable.csv
    PlayerList/stringtable.csv
    Quests/stringtable.csv
    SpawnSelection/stringtable.csv
    Vehicles/stringtable.csv
    Weapons/stringtable.csv
```

### なぜ分割するのか？

- **管理のしやすさ**: 大規模 Mod の単一の stringtable は数千行に成長する可能性があります。機能モジュールごとに分割することで各ファイルが管理しやすくなります。
- **独立した更新**: 翻訳者はマージコンフリクトなしに1つのモジュールずつ作業できます。
- **条件付き包含**: 各サブ Mod の PBO は自身の機能の stringtable のみを含み、PBO サイズを小さく保ちます。

### 仕組み

エンジンは読み込まれたすべての PBO から `stringtable.csv` を検索します。各 Expansion サブモジュールが独自の PBO にパックされるため、各モジュールは自然に独自の stringtable のみを含みます。特別な設定は不要です --- ファイルを `stringtable.csv` と名付けて PBO 内に配置するだけです。

キー名は衝突を避けるためにグローバルプレフィックス（`STR_EXPANSION_`）を引き続き使用します。

---

## 実際の例

### MyMod Core

MyMod Core はフル15カラム形式を使用し、`original` 言語としてポルトガル語（開発チームの母国語）を使用し、サポートされているすべての13言語の包括的な翻訳を備えています：

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

注目すべきパターン：
- `original` にはポルトガル語テキストが含まれています（チームの母国語）
- `english` は常に記入されており、国際的なベースラインとなります
- 13言語カラムすべてが入力されています

### COT (Community Online Tools)

COT は同じ15カラム形式を使用しています。キーは `STR_COT_MODULE_CATEGORY_ELEMENT` パターンに従います：

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

VPP はカラム数が少ないセット（13カラム、`hungarian` カラムなし）を使用し、キーに `STR_` プレフィックスを付けません：

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

これは `STR_` プレフィックスが要件ではなく慣例であることを示しています。ただし、これを省略するとレイアウトファイルで `#` プレフィックス解決を使用できなくなります。VPP はスクリプトコードからのみこれらのキーを参照しています。すべての新しい Mod には `STR_` プレフィックスを強く推奨します。

### MyMod Missions

MyMod Missions はクォートなし、ヘッダーレス形式の CSV（フィールドにクォートなし）に追加の `Korean` カラムを使用しています：

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MYMOD_MISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

注目点：`original` カラムがなく、`Korean` が追加されています。エンジンは認識しないカラム名を無視するため、`Korean` は公式韓国語サポートが追加されるまでドキュメントとして機能します。

---

## よくある間違い

### スクリプトでの `#` プレフィックスの忘れ

```c
// 間違い -- 翻訳ではなく生のキーを表示します
label.SetText("STR_MYMOD_HELLO");

// 正しい
label.SetText("#STR_MYMOD_HELLO");
```

### inputs.xml での `#` の使用

```xml
<!-- 間違い -- 入力システムが内部的に # を追加します -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- 正しい -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### Mod 間でのキーの重複

2つの Mod が `STR_CLOSE` を定義した場合、エンジンは最後にロードされた PBO を使用します。常に Mod プレフィックスを使用してください：

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### カラム数の不一致

行のカラム数がヘッダーより少ない場合、エンジンはその行をサイレントにスキップするか、欠落カラムに空文字列を割り当てる可能性があります。すべての行がヘッダーと同じフィールド数を持つようにしてください。

### BOM の問題

一部のテキストエディタはファイルの先頭に UTF-8 BOM（バイトオーダーマーク）を挿入します。これにより CSV の最初のキーがサイレントに壊れる可能性があります。最初の文字列キーが解決されない場合は、BOM を確認して削除してください。

### クォートされていないフィールド内のカンマの使用

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

`Hello` と ` World` が別のカラムとして読まれるため、パースが壊れます。フィールドをクォートするか、値内のカンマを避けてください：

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```

---

## ベストプラクティス

- すべてのキーに `STR_MODNAME_` プレフィックスを常に使用してください。これにより、複数の Mod が一緒にロードされた場合の衝突を防ぎます。
- 内容にカンマがなくても、CSV のすべてのフィールドをクォートしてください。これにより、他の言語の翻訳にカンマや特殊文字が含まれる場合の微妙なパースエラーを防ぎます。
- 母国語が異なる場合でも、すべてのキーの `english` カラムを記入してください。英語はユニバーサルフォールバックであり、コミュニティ翻訳者のベースラインです。
- 小規模 Mod では PBO ごとに1つの stringtable を維持してください。500以上のキーを持つ大規模 Mod では、Expansion パターンに従って機能ごとの stringtable ファイルに分割してください。
- BOM なしの UTF-8 としてファイルを保存してください。Excel を使用する場合は、エクスポート時に明示的に "CSV UTF-8" 形式を選択してください。

---

## 理論と実践

> ドキュメントで言われていることと、実際のランタイムでの動作の違いです。

| 概念 | 理論 | 現実 |
|---------|--------|---------|
| カラム順序は関係ない | エンジンはヘッダー名でカラムを識別する | 正しいですが、一部のコミュニティツールやスプレッドシートのエクスポートがカラムを並べ替えます。標準順序を維持することで混乱を防ぎます |
| フォールバックチェーン: 言語 > english > original > 生のキー | ドキュメントされたカスケード | `english` と `original` の両方が空の場合、エンジンは `#` プレフィックスを外した生のキーを表示します --- ゲーム内で不足している翻訳を見つけるのに便利です |
| `Widget.TranslateString()` | 呼び出し時に解決される | 結果はセッションごとにキャッシュされます。ゲーム言語の変更は、stringtable 検索が更新されるために再起動が必要です |
| 同じキーを持つ複数の Mod | 最後にロードされた PBO が優先 | Mod 間の PBO ロード順序は保証されていません。2つの Mod が `STR_CLOSE` を定義した場合、表示されるテキストはどちらの Mod が最後にロードされるかに依存します --- 常に Mod プレフィックスを使用してください |
| `SetText()` での `#` プレフィックス | エンジンがローカライゼーションキーを自動解決 | 動作しますが、最初の呼び出し時のみです。`SetText("#STR_KEY")` を呼んだ後に `SetText("literal text")` を呼び、再度 `SetText("#STR_KEY")` に戻しても問題なく動作します --- ウィジェットレベルでのキャッシュの問題はありません |

---

## 互換性と影響

- **マルチ Mod:** 文字列キーの衝突が主なリスクです。2つの Mod が `STR_ADMIN_PANEL` を定義するとサイレントに競合します。常にキーに Mod 名をプレフィックスとして付けてください（`STR_MYMOD_ADMIN_PANEL`）。
- **パフォーマンス:** Stringtable の検索は高速です（ハッシュベース）。複数の Mod にわたる数千のキーがあっても、測定可能なパフォーマンス影響はありません。stringtable 全体が起動時にメモリに読み込まれます。
- **バージョン:** CSV ベースの stringtable 形式は DayZ Standalone アルファ以来変わっていません。15カラムのレイアウトとフォールバック動作はすべてのバージョンで安定しています。
