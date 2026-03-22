# 第 6.8 章：文件 I/O 与 JSON

[首页](../README.md) | [<< 上一章：计时器与 CallQueue](07-timers.md) | **文件 I/O 与 JSON** | [下一章：网络与 RPC >>](09-networking.md)

---

## 简介

DayZ 提供了用于读写文本文件、JSON 序列化/反序列化、目录管理和文件枚举的文件 I/O 操作。所有文件操作使用特殊的路径前缀（`$profile:`、`$saves:`、`$mission:`）而非绝对文件系统路径。本章涵盖 Enforce Script 中所有可用的文件操作。

---

## 路径前缀

| 前缀 | 位置 | 可写 |
|--------|----------|----------|
| `$profile:` | 服务器/客户端配置文件目录（例如 `DayZServer/profiles/`） | 是 |
| `$saves:` | 存档目录 | 是 |
| `$mission:` | 当前任务文件夹（例如 `mpmissions/dayzOffline.chernarusplus/`） | 通常只读 |
| `$CurrentDir:` | 当前工作目录 | 视情况而定 |
| 无前缀 | 相对于游戏根目录 | 只读 |

> **重要：** 大多数文件写入操作仅限于 `$profile:` 和 `$saves:`。尝试写入其他位置可能会静默失败。

---

## 文件存在检查

```c
proto bool FileExist(string name);
```

如果给定路径的文件存在，返回 `true`。

**示例：**

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

## 打开和关闭文件

```c
proto FileHandle OpenFile(string name, FileMode mode);
proto void CloseFile(FileHandle file);
```

### FileMode 枚举

```c
enum FileMode
{
    READ,     // 以读取方式打开（文件必须存在）
    WRITE,    // 以写入方式打开（创建新文件/覆盖现有文件）
    APPEND    // 以追加方式打开（不存在则创建）
}
```

`FileHandle` 是一个整数句柄。返回值为 `0` 表示失败。

**示例：**

```c
FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.WRITE);
if (fh != 0)
{
    // 文件成功打开
    // ... 执行操作 ...
    CloseFile(fh);
}
```

> **关键：** 完成后始终调用 `CloseFile()`。不关闭文件可能导致数据丢失和资源泄漏。

---

## 写入文件

### FPrintln（写入行）

```c
proto void FPrintln(FileHandle file, void var);
```

写入值后跟一个换行符。

### FPrint（不带换行写入）

```c
proto void FPrint(FileHandle file, void var);
```

写入值，不带尾部换行符。

**示例 --- 写入日志文件：**

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

## 读取文件

### FGets（读取行）

```c
proto int FGets(FileHandle file, string var);
```

从文件中读取一行到 `var` 中。返回读取的字符数，在文件末尾返回 `-1`。

**示例 --- 逐行读取文件：**

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

### ReadFile（原始二进制读取）

```c
proto int ReadFile(FileHandle file, void param_array, int length);
```

将原始字节读入缓冲区。用于二进制数据。

---

## 目录操作

### MakeDirectory

```c
proto native bool MakeDirectory(string name);
```

创建目录。成功时返回 `true`。只创建最后一级目录 --- 父目录必须已存在。

**示例 --- 确保目录结构：**

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

删除文件。仅在 `$profile:` 和 `$saves:` 目录中有效。

### CopyFile

```c
proto native bool CopyFile(string sourceName, string destName);
```

将文件从源复制到目标。

**示例：**

```c
// 覆盖前备份
if (FileExist("$profile:MyMod/config.json"))
{
    CopyFile("$profile:MyMod/config.json", "$profile:MyMod/config.json.bak");
}
```

---

## 文件枚举（FindFile / FindNextFile）

枚举目录中匹配模式的文件。

```c
proto FindFileHandle FindFile(string pattern, out string fileName,
                               out FileAttr fileAttributes, FindFileFlags flags);
proto bool FindNextFile(FindFileHandle handle, out string fileName,
                         out FileAttr fileAttributes);
proto native void CloseFindFile(FindFileHandle handle);
```

### FileAttr 枚举

```c
enum FileAttr
{
    DIRECTORY,   // 条目是目录
    HIDDEN,      // 条目是隐藏的
    READONLY,    // 条目是只读的
    INVALID      // 无效条目
}
```

### FindFileFlags 枚举

```c
enum FindFileFlags
{
    DIRECTORIES,  // 仅返回目录
    ARCHIVES,     // 仅返回文件
    ALL           // 返回两者
}
```

**示例 --- 枚举目录中的所有 JSON 文件：**

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
        // 处理第一个结果
        if (!(fileAttr & FileAttr.DIRECTORY))
        {
            Print("Found: " + fileName);
        }

        // 处理剩余结果
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

> **重要：** `FindFile` 只返回文件名，而不是完整路径。处理文件时你必须自己添加目录路径前缀。

**示例 --- 计算目录中的文件数：**

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

## JsonFileLoader（通用 JSON）

**文件：** `3_Game/tools/jsonfileloader.c`（173 行）

加载和保存 JSON 数据的推荐方式。适用于任何具有公共字段的类。

### 现代 API（推荐）

```c
class JsonFileLoader<Class T>
{
    // 将 JSON 文件加载到对象中
    static bool LoadFile(string filename, out T data, out string errorMessage);

    // 将对象保存到 JSON 文件
    static bool SaveFile(string filename, T data, out string errorMessage);

    // 将 JSON 字符串解析到对象中
    static bool LoadData(string string_data, out T data, out string errorMessage);

    // 将对象序列化为 JSON 字符串
    static bool MakeData(T inputData, out string outputData,
                          out string errorMessage, bool prettyPrint = true);
}
```

所有方法返回 `bool` --- 成功时为 `true`，失败时为 `false`，错误信息在 `errorMessage` 中。

### 旧版 API（已弃用）

```c
class JsonFileLoader<Class T>
{
    static void JsonLoadFile(string filename, out T data);    // 返回 void！
    static void JsonSaveFile(string filename, T data);
    static void JsonLoadData(string string_data, out T data);
    static string JsonMakeData(T data);
}
```

> **关键陷阱：** `JsonLoadFile()` 返回 `void`。你**不能**在 `if` 条件中使用它：
> ```c
> // 错误 - 不会编译或始终为 false
> if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg)) { }
>
> // 正确 - 使用返回 bool 的现代 LoadFile()
> if (JsonFileLoader<MyConfig>.LoadFile(path, cfg, error)) { }
> ```

### 数据类要求

目标类必须具有带默认值的**公共字段**。JSON 序列化器将字段名直接映射到 JSON 键。

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

这将产生 JSON：

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

### 完整的加载/保存示例

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
            Save();  // 创建默认配置
            return;
        }

        string error;
        if (!JsonFileLoader<MyModConfig>.LoadFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Config load error: " + error);
            m_Config = new MyModConfig();  // 重置为默认值
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

**文件：** `3_Game/gameplay.c`

当你需要直接序列化/反序列化 JSON 字符串而不进行文件操作时使用：

```c
class JsonSerializer : Serializer
{
    proto bool WriteToString(void variable_out, bool nice, out string result);
    proto bool ReadFromString(void variable_in, string jsonString, out string error);
}
```

**示例：**

```c
MyConfig cfg = new MyConfig();
cfg.MaxPlayers = 100;

JsonSerializer js = new JsonSerializer();

// 序列化为字符串
string jsonOutput;
js.WriteToString(cfg, true, jsonOutput);  // true = 美化打印
Print(jsonOutput);

// 从字符串反序列化
MyConfig parsed = new MyConfig();
string parseError;
js.ReadFromString(parsed, jsonOutput, parseError);
Print("MaxPlayers: " + parsed.MaxPlayers);
```

---

## 总结

| 操作 | 函数 | 注意事项 |
|-----------|----------|-------|
| 检查存在 | `FileExist(path)` | 返回 bool |
| 打开 | `OpenFile(path, FileMode)` | 返回句柄（0 = 失败） |
| 关闭 | `CloseFile(handle)` | 完成后始终调用 |
| 写入行 | `FPrintln(handle, data)` | 带换行 |
| 写入 | `FPrint(handle, data)` | 不带换行 |
| 读取行 | `FGets(handle, out line)` | 在 EOF 时返回 -1 |
| 创建目录 | `MakeDirectory(path)` | 仅单级 |
| 删除 | `DeleteFile(path)` | 仅 `$profile:` / `$saves:` |
| 复制 | `CopyFile(src, dst)` | -- |
| 查找文件 | `FindFile(pattern, ...)` | 返回句柄，用 `FindNextFile` 迭代 |
| JSON 加载 | `JsonFileLoader<T>.LoadFile(path, data, error)` | 现代 API，返回 bool |
| JSON 保存 | `JsonFileLoader<T>.SaveFile(path, data, error)` | 现代 API，返回 bool |
| JSON 字符串 | `JsonSerializer.WriteToString()` / `ReadFromString()` | 直接字符串操作 |

| 概念 | 关键要点 |
|---------|-----------|
| 路径前缀 | `$profile:`（可写）、`$mission:`（只读）、`$saves:`（可写） |
| JsonLoadFile | **返回 void** --- 改用 `LoadFile()`（返回 bool） |
| 数据类 | 带默认值的公共字段，数组/映射使用 `ref` |
| 始终关闭 | 每个 `OpenFile` 必须有对应的 `CloseFile` |
| FindFile | 只返回文件名，不是完整路径 |

---

## 最佳实践

- **始终将文件操作包装在存在检查中，并在所有代码路径中关闭句柄。** 未关闭的 `FileHandle` 会泄漏资源，并可能阻止文件写入磁盘。使用保护模式：检查 `fh != 0`，执行操作，然后在每个 `return` 之前调用 `CloseFile(fh)`。
- **使用现代的 `JsonFileLoader<T>.LoadFile()`（返回 bool）而不是旧版的 `JsonLoadFile()`（返回 void）。** 旧版 API 无法报告错误，并且尝试在条件中使用其 void 返回值会静默失败。
- **使用 `MakeDirectory()` 按从父到子的顺序创建目录。** `MakeDirectory` 只创建最后一级目录段。如果 `A/B` 不存在，`MakeDirectory("$profile:A/B/C")` 会失败。按顺序创建每一级。
- **在覆盖配置文件之前使用 `CopyFile()` 创建备份。** 损坏的存档导致的 JSON 解析错误是不可恢复的。`.bak` 副本让服务器管理员可以恢复最后的良好状态。
- **记住 `FindFile()` 只返回文件名，不是完整路径。** 加载通过 `FindFile`/`FindNextFile` 找到的文件时，你必须自己拼接目录前缀。

---

## 兼容性与影响

> **模组兼容性：** 当每个模组使用自己的 `$profile:` 子目录时，文件 I/O 本质上是隔离的。只有当两个模组读写相同的文件路径时才会发生冲突。

- **加载顺序：** 文件 I/O 没有加载顺序依赖。模组独立读写。
- **Modded Class 冲突：** 没有类冲突。风险是两个模组使用相同的 `$profile:` 子目录名或文件名，导致数据损坏。
- **性能影响：** 通过 `JsonFileLoader` 的 JSON 序列化是同步的，会阻塞主线程。在游戏过程中加载大型 JSON 文件（>100KB）会导致帧卡顿。在 `OnInit()` 或 `OnMissionStart()` 中加载配置，永远不要在 `OnUpdate()` 中加载。
- **服务器/客户端：** 文件写入限制在 `$profile:` 和 `$saves:`。在客户端上，`$profile:` 指向客户端配置文件目录。在专用服务器上，它指向服务器配置文件。`$mission:` 在两端通常都是只读的。

---

## 在真实模组中的观察

> 这些模式通过研究专业 DayZ 模组的源代码得到了确认。

| 模式 | 模组 | 文件/位置 |
|---------|-----|---------------|
| `MakeDirectory` 链 + `FileExist` 检查 + `LoadFile` 带回退到默认值 | Expansion | 设置管理器（`ExpansionSettings`） |
| 配置保存前 `CopyFile` 备份 | COT | 权限文件管理 |
| `FindFile`/`FindNextFile` 枚举 `$profile:` 中的每个玩家 JSON 文件 | VPP Admin Tools | 玩家数据加载器 |
| `JsonSerializer.WriteToString()` 用于 RPC 负载序列化（无文件） | Dabs Framework | 网络配置同步 |

---

[<< 上一章：计时器与 CallQueue](07-timers.md) | **文件 I/O 与 JSON** | [下一章：网络与 RPC >>](09-networking.md)
