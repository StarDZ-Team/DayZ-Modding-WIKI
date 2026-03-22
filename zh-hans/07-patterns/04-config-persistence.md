# 第7.4章：配置持久化

[首页](../README.md) | [<< 上一章：RPC 模式](03-rpc-patterns.md) | **配置持久化** | [下一章：权限系统 >>](05-permissions.md)

---

## 简介

几乎每个 DayZ 模组都需要保存和加载配置数据：服务器设置、刷新表、封禁列表、玩家数据、传送位置。引擎提供了 `JsonFileLoader` 用于简单的 JSON 序列化，以及原始文件 I/O（`FileHandle`、`FPrintln`）用于其他所有情况。专业模组在此基础上层叠了配置版本控制和自动迁移。

本章涵盖了配置持久化的标准模式，从基本的 JSON 加载/保存到版本化的迁移系统、目录管理和自动保存计时器。

---

## 目录

- [JsonFileLoader 模式](#jsonfileloader-pattern)
- [手动 JSON 写入（FPrintln）](#manual-json-writing-fprintln)
- [$profile 路径](#the-profile-path)
- [目录创建](#directory-creation)
- [配置数据类](#config-data-classes)
- [配置版本控制和迁移](#config-versioning-and-migration)
- [自动保存计时器](#auto-save-timers)
- [常见错误](#common-mistakes)
- [最佳实践](#best-practices)

---

## JsonFileLoader 模式

`JsonFileLoader` 是引擎内置的序列化器。它使用反射在 Enforce Script 对象和 JSON 文件之间进行转换——它读取你的类的公共字段并自动将它们映射到 JSON 键。

### 关键注意事项

**`JsonFileLoader<T>.JsonLoadFile()` 和 `JsonFileLoader<T>.JsonSaveFile()` 返回 `void`。** 你不能检查它们的返回值。你不能将它们赋值给 `bool`。你不能在 `if` 条件中使用它们。这是 DayZ 模组开发中最常见的错误之一。

```c
// 错误 — 无法编译
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// 错误 — 无法编译
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// 正确 — 调用后检查对象状态
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// 检查数据是否实际被填充
if (config.m_ServerName != "")
{
    // 数据加载成功
}
```

### 基本加载/保存

```c
// 数据类 — 公共字段被序列化为/从 JSON
class ServerSettings
{
    string ServerName = "My DayZ Server";
    int MaxPlayers = 60;
    float RestartInterval = 14400.0;
    bool PvPEnabled = true;
};

class SettingsManager
{
    private static const string SETTINGS_PATH = "$profile:MyMod/ServerSettings.json";
    protected ref ServerSettings m_Settings;

    void Load()
    {
        m_Settings = new ServerSettings();

        if (FileExist(SETTINGS_PATH))
        {
            JsonFileLoader<ServerSettings>.JsonLoadFile(SETTINGS_PATH, m_Settings);
        }
        else
        {
            // 首次运行：保存默认值
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### 哪些会被序列化

`JsonFileLoader` 序列化对象的**所有公共字段**。它不序列化：
- 私有或受保护字段
- 方法
- 静态字段
- 瞬态/仅运行时字段（没有 `[NonSerialized]` 特性——使用访问修饰符）

生成的 JSON 如下所示：

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### 支持的字段类型

| 类型 | JSON 表示 |
|------|-------------------|
| `int` | 数字 |
| `float` | 数字 |
| `bool` | `true` / `false` |
| `string` | 字符串 |
| `vector` | 3 个数字的数组 |
| `array<T>` | JSON 数组 |
| `map<string, T>` | JSON 对象（仅字符串键） |
| 嵌套类 | 嵌套 JSON 对象 |

### 嵌套对象

```c
class SpawnPoint
{
    string Name;
    vector Position;
    float Radius;
};

class SpawnConfig
{
    ref array<ref SpawnPoint> SpawnPoints = new array<ref SpawnPoint>();
};
```

产生：

```json
{
    "SpawnPoints": [
        {
            "Name": "Coast",
            "Position": [13000, 0, 3500],
            "Radius": 100.0
        },
        {
            "Name": "Airfield",
            "Position": [4500, 0, 9500],
            "Radius": 50.0
        }
    ]
}
```

---

## 手动 JSON 写入（FPrintln）

有时 `JsonFileLoader` 不够灵活：它无法处理混合类型的数组、自定义格式或非类数据结构。在这些情况下，使用原始文件 I/O。

### 基本模式

```c
void WriteCustomData(string path, array<string> lines)
{
    FileHandle file = OpenFile(path, FileMode.WRITE);
    if (!file) return;

    FPrintln(file, "{");
    FPrintln(file, "    \"entries\": [");

    for (int i = 0; i < lines.Count(); i++)
    {
        string comma = "";
        if (i < lines.Count() - 1) comma = ",";
        FPrintln(file, "        \"" + lines[i] + "\"" + comma);
    }

    FPrintln(file, "    ]");
    FPrintln(file, "}");

    CloseFile(file);
}
```

### 读取原始文件

```c
void ReadCustomData(string path)
{
    FileHandle file = OpenFile(path, FileMode.READ);
    if (!file) return;

    string line;
    while (FGets(file, line) >= 0)
    {
        line = line.Trim();
        if (line == "") continue;
        // 处理行...
    }

    CloseFile(file);
}
```

### 何时使用手动 I/O

- 写入日志文件（追加模式）
- 写入 CSV 或纯文本导出
- `JsonFileLoader` 无法生成的自定义 JSON 格式
- 解析非 JSON 文件格式（例如，DayZ 的 `.map` 或 `.xml` 文件）

对于标准配置文件，优先使用 `JsonFileLoader`。它实现更快、更不容易出错，并且自动处理嵌套对象。

---

## $profile 路径

DayZ 提供 `$profile:` 路径前缀，它解析到服务器的配置文件目录（通常是包含 `DayZServer_x64.exe` 的文件夹，或通过 `-profiles=` 指定的配置文件路径）。

```c
// 这些解析到配置文件目录：
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### 始终使用 $profile

永远不要使用绝对路径。永远不要使用相对路径。对于你的模组在运行时创建或读取的任何文件，始终使用 `$profile:`：

```c
// 错误：绝对路径 — 在任何其他机器上都会失败
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// 错误：相对路径 — 依赖于工作目录，而工作目录会变化
const string CONFIG_PATH = "MyMod/config.json";

// 正确：$profile 在任何地方都能正确解析
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### 常规目录结构

大多数模组遵循此约定：

```
$profile:
  └── YourModName/
      ├── Config.json          （主服务器配置）
      ├── Permissions.json     （管理员权限）
      ├── Logs/
      │   └── 2025-01-15.log   （每日日志文件）
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## 目录创建

在写入文件之前，你必须确保其父目录存在。DayZ 不会自动创建目录。

### MakeDirectory

```c
void EnsureDirectories()
{
    string baseDir = "$profile:MyMod";
    if (!FileExist(baseDir))
    {
        MakeDirectory(baseDir);
    }

    string playersDir = baseDir + "/Players";
    if (!FileExist(playersDir))
    {
        MakeDirectory(playersDir);
    }

    string logsDir = baseDir + "/Logs";
    if (!FileExist(logsDir))
    {
        MakeDirectory(logsDir);
    }
}
```

### 重要：MakeDirectory 不是递归的

`MakeDirectory` 只创建路径中的最后一个目录。如果父目录不存在，它会静默失败。你必须逐级创建：

```c
// 错误：父目录 "MyMod" 还不存在
MakeDirectory("$profile:MyMod/Data/Players");  // 静默失败

// 正确：逐级创建
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### 路径常量模式

框架模组将所有路径定义为专用类中的常量：

```c
class MyModConst
{
    static const string PROFILE_DIR    = "$profile:MyMod";
    static const string CONFIG_DIR     = "$profile:MyMod/Configs";
    static const string LOG_DIR        = "$profile:MyMod/Logs";
    static const string PLAYERS_DIR    = "$profile:MyMod/Players";
    static const string PERMISSIONS_FILE = "$profile:MyMod/Permissions.json";
};
```

这避免了代码库中的路径字符串重复，并使查找模组所涉及的每个文件变得容易。

---

## 配置数据类

一个设计良好的配置数据类提供默认值、版本跟踪和每个字段的清晰文档。

### 基本模式

```c
class MyModConfig
{
    // 用于迁移的版本跟踪
    int ConfigVersion = 3;

    // 具有合理默认值的游戏设置
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // 复杂设置
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // 使用默认值初始化集合
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### 反射式 ConfigBase 模式

此模式使用反射式配置系统，每个配置类将其字段声明为描述符。这允许管理面板为任何配置自动生成 UI，无需硬编码字段名：

```c
// 概念模式（反射式配置）：
class MyConfigBase
{
    // 每个配置声明其版本
    int ConfigVersion;
    string ModId;

    // 子类覆盖以声明其字段
    void Init(string modId)
    {
        ModId = modId;
    }

    // 反射：获取所有可配置字段
    array<ref MyConfigField> GetFields();

    // 按字段名动态获取/设置（用于管理面板同步）
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // 加载/保存时的自定义逻辑钩子
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### VPP ConfigurablePlugin 模式

VPP 将配置管理直接合并到插件生命周期中：

```c
// VPP 模式（简化版）：
class VPPESPConfig
{
    bool EnableESP = true;
    float MaxDistance = 1000.0;
    int RefreshRate = 5;
};

class VPPESPPlugin : ConfigurablePlugin
{
    ref VPPESPConfig m_ESPConfig;

    override void OnInit()
    {
        m_ESPConfig = new VPPESPConfig();
        // ConfigurablePlugin.LoadConfig() 处理 JSON 加载
        super.OnInit();
    }
};
```

---

## 配置版本控制和迁移

随着你的模组发展，配置结构会改变。你会添加字段、删除字段、重命名字段、更改默认值。没有版本控制，使用旧配置文件的用户将静默获得错误的值或崩溃。

### 版本字段

每个配置类都应有一个整数版本字段：

```c
class MyModConfig
{
    int ConfigVersion = 5;  // 结构更改时递增
    // ...
};
```

### 加载时迁移

加载配置时，将磁盘上的版本与当前代码版本进行比较。如果不同，运行迁移：

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // 包含当前默认值

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // 使用更新后的版本重新保存
        }
    }
    else
    {
        SaveConfig(config);  // 首次运行：写入默认值
    }

    m_Config = config;
}
```

### 迁移函数

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // 按顺序运行每个迁移步骤
    if (config.ConfigVersion < 2)
    {
        // v1 → v2："SpawnDelay" 被重命名为 "RespawnInterval"
        // 旧字段在加载时丢失；设置新默认值
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 → v3：添加了 "EnableNotifications" 字段
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 → v4："MaxZombies" 默认值从 100 改为 200
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // 仅在用户未更改时更新
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 → v5："DifficultyMode" 从 int 改为 string
        // config.DifficultyMode = "Normal"; // 设置新默认值
    }

    MyLog.Info("Config", "Migrated config from v"
        + config.ConfigVersion.ToString() + " to v" + CURRENT_VERSION.ToString());
}
```

### Expansion 的迁移示例

Expansion 以激进的配置演变而闻名。一些 Expansion 配置已经经历了 17 个以上的版本。他们的模式：
1. 每次版本升级都有一个专用的迁移函数
2. 迁移按顺序运行（1 到 2，然后 2 到 3，然后 3 到 4，等等）
3. 每次迁移只更改该版本步骤所必需的内容
4. 所有迁移完成后，最终版本号被写入磁盘

这是 DayZ 模组中配置版本控制的黄金标准。

---

## 自动保存计时器

对于在运行时更改的配置（管理员编辑、玩家数据积累），实现自动保存计时器以防止崩溃时的数据丢失。

### 基于计时器的自动保存

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 分钟
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // 自上次保存以来数据是否已更改？

    void MarkDirty()
    {
        m_Dirty = true;
    }

    void OnUpdate(float dt)
    {
        m_AutosaveTimer += dt;
        if (m_AutosaveTimer >= AUTOSAVE_INTERVAL)
        {
            m_AutosaveTimer = 0;

            if (m_Dirty)
            {
                Save();
                m_Dirty = false;
            }
        }
    }

    void OnMissionFinish()
    {
        // 关闭时始终保存，即使计时器未触发
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### 脏标志优化

仅在数据实际更改时写入磁盘。文件 I/O 很昂贵。如果没有更改，跳过保存：

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // 无更改，无保存

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### 在关键事件时保存

除了定时保存外，在关键操作后立即保存：

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // 立即保存 — 封禁必须在崩溃后存活
}
```

---

## 常见错误

### 1. 将 JsonLoadFile 当作有返回值处理

```c
// 错误 — 无法编译
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

`JsonLoadFile` 返回 `void`。调用它，然后检查对象的状态。

### 2. 加载前未检查 FileExist

```c
// 错误 — 崩溃或产生无诊断信息的空对象
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// 正确 — 先检查，缺失时创建默认值
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. 忘记创建目录

如果目录不存在，`JsonSaveFile` 会静默失败。保存前始终确保目录存在。

### 4. 你不打算序列化的公共字段

配置类上的每个 `public` 字段最终都会出现在 JSON 中。如果你有仅运行时的字段，将它们设为 `protected` 或 `private`：

```c
class MyConfig
{
    // 这些会进入 JSON：
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // 这些不会进入 JSON（受保护的）：
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. JSON 值中的反斜杠和引号字符

Enforce Script 的 CParser 在处理字符串字面量中的 `\\` 和 `\"` 时会出问题。避免在配置中存储带反斜杠的文件路径。使用正斜杠：

```c
// 错误 — 反斜杠可能破坏解析
string LogPath = "C:\\DayZ\\Logs\\server.log";

// 正确 — 正斜杠在任何地方都有效
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## 最佳实践

1. **所有文件路径使用 `$profile:`。** 永远不要硬编码绝对路径。

2. **写入文件前创建目录。** 使用 `FileExist()` 检查，使用 `MakeDirectory()` 创建，每次一级。

3. **始终在配置类构造函数或字段初始化器中提供默认值。** 这确保首次运行的配置是合理的。

4. **从第一天就为你的配置添加版本号。** 添加 `ConfigVersion` 字段几乎没有成本，但可以节省数小时的调试时间。

5. **将配置数据类与管理器类分离。** 数据类是一个简单的容器；管理器处理加载/保存/同步逻辑。

6. **使用带脏标志的自动保存。** 不要每次值更改时都写入磁盘——用计时器批量写入。

7. **在任务结束时保存。** 自动保存计时器是安全网，不是主要保存。始终在 `OnMissionFinish()` 期间保存。

8. **在一个地方定义路径常量。** 一个包含所有路径的 `MyModConst` 类可以防止字符串重复，并使路径更改变得简单。

9. **记录加载/保存操作。** 调试配置问题时，一条说"Loaded config v3 from $profile:MyMod/Config.json"的日志行非常有价值。

10. **使用已删除的配置文件进行测试。** 你的模组应该优雅地处理首次运行：创建目录、写入默认值、记录所做的操作。

---

## 兼容性与影响

- **多模组：** 每个模组写入自己的 `$profile:ModName/` 目录。只有当两个模组使用相同的目录名时才会发生冲突。为你的模组文件夹使用唯一的、可识别的前缀。
- **加载顺序：** 配置加载发生在 `OnInit` 或 `OnMissionStart` 中，两者都由模组自己的生命周期控制。除非两个模组试图读/写同一个文件（它们永远不应该这样做），否则不会有跨模组加载顺序问题。
- **监听服务器：** 配置文件仅在服务器端（`$profile:` 在服务器上解析）。在监听服务器上，客户端代码技术上可以访问 `$profile:`，但配置应仅由服务器模块加载以避免歧义。
- **性能：** `JsonFileLoader` 是同步的，会阻塞主线程。对于大型配置（100+ KB），在 `OnInit`（游戏开始前）期间加载。自动保存计时器防止重复写入；脏标志模式确保磁盘 I/O 仅在数据实际更改时发生。
- **迁移：** 向配置类添加新字段是安全的——`JsonFileLoader` 忽略缺失的 JSON 键并保留类的默认值。删除或重命名字段需要版本化的迁移步骤以避免静默数据丢失。

---

## 理论与实践

| 教科书说 | DayZ 现实 |
|---------------|-------------|
| 使用异步文件 I/O 以避免阻塞 | Enforce Script 没有异步文件 I/O；所有读/写都是同步的。在启动时加载，在计时器上保存。 |
| 使用 schema 验证 JSON | 不存在 JSON schema 验证；在 `OnAfterLoad()` 中或加载后使用保护子句验证字段。 |
| 使用数据库存储结构化数据 | Enforce Script 无法访问数据库；`$profile:` 中的 JSON 文件是唯一的持久化机制。 |

---

[首页](../README.md) | [<< 上一章：RPC 模式](03-rpc-patterns.md) | **配置持久化** | [下一章：权限系统 >>](05-permissions.md)
