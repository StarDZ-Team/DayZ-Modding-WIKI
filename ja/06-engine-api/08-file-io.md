# 第6.8章: ファイルI/OとJSON

[ホーム](../README.md) | [<< 前へ: タイマーとCallQueue](07-timers.md) | **ファイルI/OとJSON** | [次へ: ネットワークとRPC >>](09-networking.md)

---

## はじめに

DayZはテキストファイルの読み書き、JSONのシリアライズ/デシリアライズ、ディレクトリ管理、ファイル列挙のためのファイルI/O操作を提供しています。すべてのファイル操作は絶対ファイルシステムパスではなく、特別なパスプレフィックス（`$profile:`、`$saves:`、`$mission:`）を使用します。この章ではEnforce Scriptで利用可能なすべてのファイル操作について説明します。

---

## パスプレフィックス

| プレフィックス | 場所 | 書き込み可能 |
|--------|----------|----------|
| `$profile:` | サーバー/クライアントプロファイルディレクトリ（例：`DayZServer/profiles/`） | はい |
| `$saves:` | セーブディレクトリ | はい |
| `$mission:` | 現在のミッションフォルダ（例：`mpmissions/dayzOffline.chernarusplus/`） | 通常は読み取りのみ |
| `$CurrentDir:` | カレントワーキングディレクトリ | 場合による |
| プレフィックスなし | ゲームルートからの相対パス | 読み取りのみ |

> **重要:** ほとんどのファイル書き込み操作は `$profile:` と `$saves:` に制限されています。他の場所への書き込みは暗黙的に失敗する場合があります。

---

## ファイル存在チェック

```c
proto bool FileExist(string name);
```

指定されたパスにファイルが存在する場合、`true` を返します。

**例：**

```c
if (FileExist("$profile:MyMod/config.json"))
{
    Print("Config file found");
}
else
{
    Print("Config file not found, creating defaults");
}
```

---

## ファイルのオープンとクローズ

```c
proto FileHandle OpenFile(string name, FileMode mode);
proto void CloseFile(FileHandle file);
```

### FileMode列挙型

```c
enum FileMode
{
    READ,     // 読み取り用に開く（ファイルが存在する必要がある）
    WRITE,    // 書き込み用に開く（新規作成/既存を上書き）
    APPEND    // 追記用に開く（存在しない場合は作成）
}
```

`FileHandle` は整数ハンドルです。戻り値 `0` は失敗を示します。

**例：**

```c
FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.WRITE);
if (fh != 0)
{
    // ファイルが正常に開かれた
    // ... 作業 ...
    CloseFile(fh);
}
```

> **重要:** 作業が完了したら必ず `CloseFile()` を呼び出してください。ファイルを閉じ忘れるとデータ損失やリソースリークの原因になります。

---

## ファイルの書き込み

### FPrintln（行の書き込み）

```c
proto void FPrintln(FileHandle file, void var);
```

値の後に改行文字を付けて書き込みます。

### FPrint（改行なし書き込み）

```c
proto void FPrint(FileHandle file, void var);
```

値を末尾の改行なしで書き込みます。

**例 --- ログファイルの書き込み：**

```c
void WriteLog(string message)
{
    FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.APPEND);
    if (fh != 0)
    {
        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);
        string timestamp = string.Format("[%1-%2-%3 %4:%5]", year, month, day, hour, minute);

        FPrintln(fh, timestamp + " " + message);
        CloseFile(fh);
    }
}
```

---

## ファイルの読み取り

### FGets（行の読み取り）

```c
proto int FGets(FileHandle file, string var);
```

ファイルから1行を `var` に読み込みます。読み取った文字数を返し、ファイルの末尾では `-1` を返します。

**例 --- ファイルを1行ずつ読み取る：**

```c
void ReadConfigFile()
{
    FileHandle fh = OpenFile("$profile:MyMod/settings.txt", FileMode.READ);
    if (fh != 0)
    {
        string line;
        while (FGets(fh, line) >= 0)
        {
            Print("Line: " + line);
            ProcessLine(line);
        }
        CloseFile(fh);
    }
}
```

### ReadFile（生バイナリ読み取り）

```c
proto int ReadFile(FileHandle file, void param_array, int length);
```

生バイトをバッファに読み込みます。バイナリデータに使用します。

---

## ディレクトリ操作

### MakeDirectory

```c
proto native bool MakeDirectory(string name);
```

ディレクトリを作成します。成功した場合 `true` を返します。最終ディレクトリのみを作成します --- 親ディレクトリは既に存在している必要があります。

**例 --- ディレクトリ構造の確保：**

```c
void EnsureDirectories()
{
    MakeDirectory("$profile:MyMod");
    MakeDirectory("$profile:MyMod/data");
    MakeDirectory("$profile:MyMod/logs");
}
```

### DeleteFile

```c
proto native bool DeleteFile(string name);
```

ファイルを削除します。`$profile:` と `$saves:` ディレクトリでのみ動作します。

### CopyFile

```c
proto native bool CopyFile(string sourceName, string destName);
```

ソースからデスティネーションにファイルをコピーします。

**例：**

```c
// 上書き前にバックアップ
if (FileExist("$profile:MyMod/config.json"))
{
    CopyFile("$profile:MyMod/config.json", "$profile:MyMod/config.json.bak");
}
```

---

## ファイル列挙（FindFile / FindNextFile）

ディレクトリ内のパターンに一致するファイルを列挙します。

```c
proto FindFileHandle FindFile(string pattern, out string fileName,
                               out FileAttr fileAttributes, FindFileFlags flags);
proto bool FindNextFile(FindFileHandle handle, out string fileName,
                         out FileAttr fileAttributes);
proto native void CloseFindFile(FindFileHandle handle);
```

### FileAttr列挙型

```c
enum FileAttr
{
    DIRECTORY,   // エントリはディレクトリ
    HIDDEN,      // エントリは非表示
    READONLY,    // エントリは読み取り専用
    INVALID      // 無効なエントリ
}
```

### FindFileFlags列挙型

```c
enum FindFileFlags
{
    DIRECTORIES,  // ディレクトリのみを返す
    ARCHIVES,     // ファイルのみを返す
    ALL           // 両方を返す
}
```

**例 --- ディレクトリ内のすべてのJSONファイルを列挙：**

```c
void ListJsonFiles()
{
    string fileName;
    FileAttr fileAttr;
    FindFileHandle handle = FindFile(
        "$profile:MyMod/missions/*.json", fileName, fileAttr, FindFileFlags.ALL
    );

    if (handle)
    {
        // 最初の結果を処理
        if (!(fileAttr & FileAttr.DIRECTORY))
        {
            Print("Found: " + fileName);
        }

        // 残りの結果を処理
        while (FindNextFile(handle, fileName, fileAttr))
        {
            if (!(fileAttr & FileAttr.DIRECTORY))
            {
                Print("Found: " + fileName);
            }
        }

        CloseFindFile(handle);
    }
}
```

> **重要:** `FindFile` はファイル名のみを返し、フルパスは返しません。ファイルを処理する際は自分でディレクトリパスを先頭に追加する必要があります。

**例 --- ディレクトリ内のファイル数をカウント：**

```c
int CountFiles(string pattern)
{
    int count = 0;
    string fileName;
    FileAttr fileAttr;
    FindFileHandle handle = FindFile(pattern, fileName, fileAttr, FindFileFlags.ARCHIVES);

    if (handle)
    {
        count++;
        while (FindNextFile(handle, fileName, fileAttr))
        {
            count++;
        }
        CloseFindFile(handle);
    }

    return count;
}
```

---

## JsonFileLoader（汎用JSON）

**ファイル:** `3_Game/tools/jsonfileloader.c`（173行）

JSONデータの読み込みと保存に推奨される方法です。パブリックフィールドを持つ任意のクラスで動作します。

### モダンAPI（推奨）

```c
class JsonFileLoader<Class T>
{
    // JSONファイルをオブジェクトに読み込む
    static bool LoadFile(string filename, out T data, out string errorMessage);

    // オブジェクトをJSONファイルに保存する
    static bool SaveFile(string filename, T data, out string errorMessage);

    // JSON文字列をオブジェクトにパースする
    static bool LoadData(string string_data, out T data, out string errorMessage);

    // オブジェクトをJSON文字列にシリアライズする
    static bool MakeData(T inputData, out string outputData,
                          out string errorMessage, bool prettyPrint = true);
}
```

すべてのメソッドは `bool` を返します --- 成功時は `true`、失敗時は `false` でエラーは `errorMessage` に格納されます。

### レガシーAPI（非推奨）

```c
class JsonFileLoader<Class T>
{
    static void JsonLoadFile(string filename, out T data);    // voidを返す！
    static void JsonSaveFile(string filename, T data);
    static void JsonLoadData(string string_data, out T data);
    static string JsonMakeData(T data);
}
```

> **重大な注意点:** `JsonLoadFile()` は `void` を返します。`if` 条件で使用することはできません：
> ```c
> // 間違い - コンパイルできないか、常にfalseになる
> if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg)) { }
>
> // 正しい - boolを返すモダンなLoadFile()を使用する
> if (JsonFileLoader<MyConfig>.LoadFile(path, cfg, error)) { }
> ```

### データクラスの要件

ターゲットクラスはデフォルト値を持つ**パブリックフィールド**を持つ必要があります。JSONシリアライザはフィールド名をJSONキーに直接マッピングします。

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 150.0;
    string ServerName = "My Server";
    bool EnablePVP = true;
    ref array<string> AllowedItems = new array<string>;
    ref map<string, int> ItemPrices = new map<string, int>;

    void MyConfig()
    {
        AllowedItems.Insert("BandageDressing");
        AllowedItems.Insert("Canteen");
    }
}
```

これにより以下のJSONが生成されます：

```json
{
    "MaxPlayers": 60,
    "SpawnRadius": 150.0,
    "ServerName": "My Server",
    "EnablePVP": true,
    "AllowedItems": ["BandageDressing", "Canteen"],
    "ItemPrices": {}
}
```

### 完全な読み込み/保存の例

```c
class MyModConfig
{
    int Version = 1;
    float RespawnTime = 300.0;
    ref array<string> SpawnItems = new array<string>;
}

class MyModConfigManager
{
    protected static const string CONFIG_PATH = "$profile:MyMod/config.json";
    protected ref MyModConfig m_Config;

    void Init()
    {
        MakeDirectory("$profile:MyMod");
        m_Config = new MyModConfig();
        Load();
    }

    void Load()
    {
        if (!FileExist(CONFIG_PATH))
        {
            Save();  // デフォルト設定を作成
            return;
        }

        string error;
        if (!JsonFileLoader<MyModConfig>.LoadFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Config load error: " + error);
            m_Config = new MyModConfig();  // デフォルトにリセット
            Save();
        }
    }

    void Save()
    {
        string error;
        if (!JsonFileLoader<MyModConfig>.SaveFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Config save error: " + error);
        }
    }

    MyModConfig GetConfig()
    {
        return m_Config;
    }
}
```

---

## JsonSerializer（直接使用）

**ファイル:** `3_Game/gameplay.c`

ファイル操作なしでJSON文字列を直接シリアライズ/デシリアライズする必要がある場合に使用します：

```c
class JsonSerializer : Serializer
{
    proto bool WriteToString(void variable_out, bool nice, out string result);
    proto bool ReadFromString(void variable_in, string jsonString, out string error);
}
```

**例：**

```c
MyConfig cfg = new MyConfig();
cfg.MaxPlayers = 100;

JsonSerializer js = new JsonSerializer();

// 文字列にシリアライズ
string jsonOutput;
js.WriteToString(cfg, true, jsonOutput);  // true = 整形出力
Print(jsonOutput);

// 文字列からデシリアライズ
MyConfig parsed = new MyConfig();
string parseError;
js.ReadFromString(parsed, jsonOutput, parseError);
Print("MaxPlayers: " + parsed.MaxPlayers);
```

---

## まとめ

| 操作 | 関数 | 注意点 |
|-----------|----------|-------|
| 存在チェック | `FileExist(path)` | boolを返す |
| オープン | `OpenFile(path, FileMode)` | ハンドルを返す（0 = 失敗） |
| クローズ | `CloseFile(handle)` | 完了時に必ず呼び出す |
| 行の書き込み | `FPrintln(handle, data)` | 改行付き |
| 書き込み | `FPrint(handle, data)` | 改行なし |
| 行の読み取り | `FGets(handle, out line)` | EOFで-1を返す |
| ディレクトリ作成 | `MakeDirectory(path)` | 単一レベルのみ |
| 削除 | `DeleteFile(path)` | `$profile:` / `$saves:` のみ |
| コピー | `CopyFile(src, dst)` | -- |
| ファイル検索 | `FindFile(pattern, ...)` | ハンドルを返し、`FindNextFile` で反復 |
| JSON読み込み | `JsonFileLoader<T>.LoadFile(path, data, error)` | モダンAPI、boolを返す |
| JSON保存 | `JsonFileLoader<T>.SaveFile(path, data, error)` | モダンAPI、boolを返す |
| JSON文字列 | `JsonSerializer.WriteToString()` / `ReadFromString()` | 直接文字列操作 |

| 概念 | 重要ポイント |
|---------|-----------|
| パスプレフィックス | `$profile:`（書き込み可能）、`$mission:`（読み取り）、`$saves:`（書き込み可能） |
| JsonLoadFile | **voidを返す** --- 代わりに `LoadFile()`（bool）を使用する |
| データクラス | デフォルト値を持つパブリックフィールド、配列/マップには `ref` |
| 常にクローズ | すべての `OpenFile` に対応する `CloseFile` が必要 |
| FindFile | ファイル名のみを返し、フルパスは返さない |

---

## ベストプラクティス

- **ファイル操作は常に存在チェックで囲み、すべてのコードパスでハンドルを閉じてください。** 閉じられていない `FileHandle` はリソースをリークし、ファイルがディスクに書き込まれるのを妨げる可能性があります。ガードパターンを使用してください：`fh != 0` を確認し、作業を行い、すべての `return` の前に `CloseFile(fh)` を呼び出します。
- **レガシーの `JsonFileLoader<T>.JsonLoadFile()`（voidを返す）の代わりに、モダンな `JsonFileLoader<T>.LoadFile()`（boolを返す）を使用してください。** レガシーAPIはエラーを報告できず、そのvoidの戻り値を条件で使用しようとすると暗黙的に失敗します。
- **`MakeDirectory()` で親から子の順にディレクトリを作成してください。** `MakeDirectory` は最終ディレクトリセグメントのみを作成します。`A/B` が存在しない場合、`MakeDirectory("$profile:A/B/C")` は失敗します。各レベルを順番に作成してください。
- **設定ファイルを上書きする前に `CopyFile()` でバックアップを作成してください。** 破損したセーブからのJSONパースエラーは回復不能です。`.bak` コピーがあればサーバーオーナーは最後の正常な状態を復元できます。
- **`FindFile()` はファイル名のみを返し、フルパスは返さないことを忘れないでください。** `FindFile`/`FindNextFile` で見つかったファイルを読み込む際は、自分でディレクトリプレフィックスを連結する必要があります。

---

## 互換性と影響

> **Mod互換性:** 各Modが独自の `$profile:` サブディレクトリを使用する場合、ファイルI/Oは本質的にMod間で分離されます。競合が発生するのは2つのModが同じファイルパスを読み書きする場合のみです。

- **ロード順序:** ファイルI/Oにはロード順序の依存関係はありません。Modは独立して読み書きします。
- **moddedクラスの競合:** クラスの競合はありません。リスクは2つのModが同じ `$profile:` サブディレクトリ名やファイル名を使用し、データの破損を引き起こすことです。
- **パフォーマンスへの影響:** `JsonFileLoader` によるJSONシリアライゼーションは同期的で、メインスレッドをブロックします。ゲームプレイ中に大きなJSONファイル（>100KB）を読み込むとフレームの停止が発生します。`OnInit()` または `OnMissionStart()` で設定を読み込み、`OnUpdate()` では決して行わないでください。
- **サーバー/クライアント:** ファイルの書き込みは `$profile:` と `$saves:` に制限されています。クライアントでは `$profile:` はクライアントプロファイルディレクトリを指します。専用サーバーではサーバープロファイルを指します。`$mission:` は通常、どちらの側でも読み取り専用です。

---

## 実際のModで確認されたパターン

> これらのパターンはプロフェッショナルなDayZ Modのソースコードを調査して確認されました。

| パターン | Mod | ファイル/場所 |
|---------|-----|---------------|
| `MakeDirectory` チェーン + `FileExist` チェック + デフォルトへのフォールバック付き `LoadFile` | Expansion | 設定マネージャー（`ExpansionSettings`） |
| 設定保存前の `CopyFile` バックアップ | COT | パーミッションファイル管理 |
| `$profile:` 内のプレイヤーごとのJSONファイルを列挙する `FindFile`/`FindNextFile` | VPP Admin Tools | プレイヤーデータローダー |
| ファイルなしでRPCペイロードシリアライゼーションに `JsonSerializer.WriteToString()` | Dabs Framework | ネットワーク設定同期 |

---

[<< 前へ: タイマーとCallQueue](07-timers.md) | **ファイルI/OとJSON** | [次へ: ネットワークとRPC >>](09-networking.md)
