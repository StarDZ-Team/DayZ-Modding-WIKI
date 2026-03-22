# 第 2.5 章：文件组织最佳实践

[首页](../README.md) | [<< 上一章：最小可行模组](04-minimum-viable-mod.md) | **文件组织** | [下一章：服务器与客户端架构 >>](06-server-client-split.md)

---

> **摘要：**文件的组织方式决定了你的模组在 10 个文件或 1000 个文件时是否可维护。本章涵盖了标准目录结构、命名约定、内容模组与脚本模组与框架模组、客户端-服务器分离，以及从专业 DayZ 模组中学到的经验。

---

## 目录

- [标准目录结构](#标准目录结构)
- [命名约定](#命名约定)
- [三种模组类型](#三种模组类型)
- [客户端-服务器分离模组](#客户端-服务器分离模组)
- [什么放在哪里](#什么放在哪里)
- [PBO 命名和 @mod 文件夹命名](#pbo-命名和-mod-文件夹命名)
- [专业模组的真实案例](#专业模组的真实案例)
- [反模式](#反模式)

---

## 标准目录结构

这是专业 DayZ 模组使用的标准布局。并非每个文件夹都是必需的——只创建你需要的。

```
MyMod/                                    <-- 项目根目录（开发）
  mod.cpp                                 <-- 启动器元数据
  stringtable.csv                         <-- 本地化（在模组根目录，不在 Scripts/ 中）

  Scripts/                                <-- 脚本 PBO 根目录
    config.cpp                            <-- CfgPatches + CfgMods + 脚本模块定义
    Inputs.xml                            <-- 自定义按键绑定（可选）
    Data/
      Credits.json                        <-- 作者信息
      Version.hpp                         <-- 版本字符串（可选）

    1_Core/                               <-- engineScriptModule（罕见）
      MyMod/
        Constants.c

    3_Game/                               <-- gameScriptModule
      MyMod/
        MyModConfig.c                     <-- 配置类
        MyModRPCs.c                       <-- RPC 标识符/注册
        Data/
          SomeDataClass.c                 <-- 纯数据结构

    4_World/                              <-- worldScriptModule
      MyMod/
        Entities/
          MyCustomItem.c                  <-- 自定义物品
          MyCustomVehicle.c
        Managers/
          MyModManager.c                  <-- 世界感知管理器
        Actions/
          ActionMyCustom.c                <-- 自定义玩家动作

    5_Mission/                            <-- missionScriptModule
      MyMod/
        MyModRegister.c                   <-- 模组注册（启动钩子）
        GUI/
          MyModPanel.c                    <-- UI 面板脚本
          MyModHUD.c                      <-- HUD 覆盖层脚本

  GUI/                                    <-- GUI PBO 根目录（与 Scripts 分离）
    config.cpp                            <-- GUI 特定配置（imageSet、样式）
    layouts/                              <-- .layout 文件
      mymod_panel.layout
      mymod_hud.layout
    imagesets/                            <-- .imageset 文件 + 纹理图集
      mymod_icons.imageset
      mymod_icons.edds
    looknfeel/                            <-- .styles 文件
      mymod.styles

  Data/                                   <-- 数据 PBO 根目录（模型、纹理、物品）
    config.cpp                            <-- CfgVehicles、CfgWeapons 等
    Models/
      my_item.p3d                         <-- 3D 模型
    Textures/
      my_item_co.paa                      <-- 颜色纹理
      my_item_nohq.paa                    <-- 法线贴图
    Materials/
      my_item.rvmat                       <-- 材质定义

  Sounds/                                 <-- 声音文件
    alert.ogg                             <-- 音频文件（始终 .ogg）
    ambient.ogg

  ServerFiles/                            <-- 供服务器管理员复制的文件
    types.xml                             <-- 中央经济生成定义
    cfgspawnabletypes.xml                 <-- 附件预设
    README.md                             <-- 安装指南

  Keys/                                   <-- 签名密钥
    MyMod.bikey                           <-- 服务器验证用的公钥
```

---

## 命名约定

### 模组/项目名称

使用 PascalCase 并带有清晰的前缀：

```
MyFramework          <-- 框架，前缀：MyFW_
MyMod_Missions      <-- 功能模组
MyMod_Weapons       <-- 内容模组
VPPAdminTools        <-- 有些模组省略下划线
DabsFramework        <-- 不带分隔符的 PascalCase
```

### 类名

使用你模组独特的短前缀，后跟下划线和类用途：

```c
// MyMod 模式：MyMod_[子系统]_[名称]
class MyLog             // 核心日志
class MyRPC             // 核心 RPC
class MyW_Config        // 武器配置
class MyM_MissionBase   // 任务基类

// CF 模式：CF_[名称]
class CF_ModuleWorld
class CF_EventArgs

// COT 模式：JM_COT_[名称]
class JM_COT_Menu

// VPP 模式：[名称]（无前缀）
class ChatCommandBase
class WebhookManager
```

**规则：**
- 前缀防止与其他模组冲突
- 保持简短（2-4 个字符）
- 在模组内保持一致

### 文件名

以文件包含的主要类来命名每个文件：

```
MyLog.c            <-- 包含 class MyLog
MyRPC.c            <-- 包含 class MyRPC
MyModConfig.c        <-- 包含 class MyModConfig
ActionMyCustom.c     <-- 包含 class ActionMyCustom
```

一个文件一个类是理想的。当多个小辅助类紧密耦合时，将它们放在一个文件中是可以接受的。

### 布局文件

使用小写字母并带有模组前缀：

```
my_admin_panel.layout
my_killfeed_overlay.layout
mymod_settings_dialog.layout
```

### 变量名

```c
// 成员变量：m_ 前缀
protected int m_Count;
protected ref array<string> m_Items;
protected ref MyConfig m_Config;

// 静态变量：s_ 前缀
static int s_InstanceCount;
static ref MyLog s_Logger;

// 常量：全大写
const int MAX_PLAYERS = 60;
const float UPDATE_INTERVAL = 0.5;
const string MOD_NAME = "MyMod";

// 局部变量：camelCase（无前缀）
int count = 0;
string playerName = identity.GetName();
float deltaTime = timeArgs.DeltaTime;

// 参数：camelCase（无前缀）
void SetConfig(MyConfig config, bool forceReload)
```

---

## 三种模组类型

DayZ 模组分为三类。每种类型有不同的结构重点。

### 1. 内容模组

添加物品、武器、载具、建筑——主要是 3D 资源，脚本最少。

```
MyWeaponPack/
  mod.cpp
  Data/
    config.cpp                <-- CfgVehicles、CfgWeapons、CfgMagazines、CfgAmmo
    Weapons/
      MyRifle/
        MyRifle.p3d
        MyRifle_co.paa
        MyRifle_nohq.paa
        MyRifle.rvmat
    Ammo/
      MyAmmo/
        MyAmmo.p3d
  Scripts/                    <-- 最少（可能甚至不存在）
    config.cpp
    4_World/
      MyWeaponPack/
        MyRifle.c             <-- 仅当武器需要自定义行为时
  ServerFiles/
    types.xml
```

**特征：**
- `Data/` 很大（模型、纹理、材质）
- `Data/config.cpp` 很大（CfgVehicles、CfgWeapons 定义）
- 最少或没有脚本
- 只有当物品需要超出配置定义的自定义行为时才有脚本

### 2. 脚本模组

添加游戏玩法功能、管理工具、系统——主要是代码，资源最少。

```
MyAdminTools/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    3_Game/
      MyAdminTools/
        Config.c
        RPCHandler.c
        Permissions.c
    4_World/
      MyAdminTools/
        PlayerManager.c
        VehicleManager.c
    5_Mission/
      MyAdminTools/
        AdminMenu.c
        AdminHUD.c
  GUI/
    layouts/
      admin_menu.layout
      admin_hud.layout
    imagesets/
      admin_icons.imageset
```

**特征：**
- `Scripts/` 很大（大部分代码在 3_Game、4_World、5_Mission 中）
- GUI 布局和图像集用于 UI
- 很少或没有 `Data/`（没有 3D 模型）
- 通常依赖框架（CF、DabsFramework 或自定义框架）

### 3. 框架模组

为其他模组提供共享基础设施——日志、RPC、配置、UI 系统。

```
MyFramework/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    Data/
      Credits.json
    1_Core/                     <-- 框架通常使用 1_Core
      MyFramework/
        Constants.c
        LogLevel.c
    3_Game/
      MyFramework/
        Config/
          ConfigManager.c
          ConfigBase.c
        RPC/
          RPCManager.c
        Events/
          EventBus.c
        Logging/
          Logger.c
        Permissions/
          PermissionManager.c
        UI/
          ViewBase.c
          DialogBase.c
    4_World/
      MyFramework/
        Module/
          ModuleManager.c
          ModuleBase.c
        Player/
          PlayerData.c
    5_Mission/
      MyFramework/
        MissionHooks.c
        ModRegistration.c
  GUI/
    config.cpp
    layouts/
    imagesets/
    icons/
    looknfeel/
```

**特征：**
- 使用所有脚本层（1_Core 到 5_Mission）
- 每层中有深层子目录层次结构
- 定义 `defines[]` 用于功能检测
- 其他模组通过 `requiredAddons` 依赖它
- 提供其他模组扩展的基类

---

## 客户端-服务器分离模组

当模组同时有客户端可见行为（UI、实体渲染）和仅服务器端逻辑（生成、AI 大脑、安全状态）时，应分为两个包。

### 目录结构

```
MyMod/                                    <-- 项目根目录（开发仓库）
  MyMod_Sub/                           <-- 客户端包（通过 -mod= 加载）
    mod.cpp
    stringtable.csv
    Scripts/
      config.cpp                          <-- type = "mod"
      3_Game/MyMod/                       <-- 共享数据类、RPC
      4_World/MyMod/                      <-- 客户端实体渲染
      5_Mission/MyMod/                    <-- 客户端 UI、HUD
    GUI/
      layouts/
    Sounds/

  MyMod_SubServer/                     <-- 服务器包（通过 -servermod= 加载）
    mod.cpp
    Scripts/
      config.cpp                          <-- type = "servermod"
      3_Game/MyModServer/                 <-- 服务器端数据类
      4_World/MyModServer/                <-- 生成、AI 逻辑、状态管理
      5_Mission/MyModServer/              <-- 服务器启动/关闭钩子
```

### 分离模组的关键规则

1. **客户端包被所有人加载**（服务器和所有客户端通过 `-mod=`）
2. **服务器包仅由服务器加载**（通过 `-servermod=`）
3. **服务器包依赖客户端包**（通过 `requiredAddons`）
4. **永远不要将 UI 代码放在服务器包中**——客户端不会收到它
5. **将安全/私有逻辑放在服务器包中**——它永远不会发送到客户端

### 依赖链

```cpp
// 客户端包 config.cpp
class CfgPatches
{
    class MyMod_Sub_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Core_Scripts" };
    };
};

// 服务器包 config.cpp
class CfgPatches
{
    class MyMod_SubServer_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Sub_Scripts", "MyMod_Core_Scripts" };
        //                                  ^^^ 依赖客户端包
    };
};
```

### 真实案例：任务客户端-服务器分离

```
MyMod_Missions/
  MyMod_Missions/                        <-- 客户端（-mod=）
    mod.cpp                               type = "mod"
    Scripts/
      config.cpp                          requiredAddons: MyMod_Core_Scripts
      3_Game/MyMod_Missions/             共享枚举、配置、RPC ID
      4_World/MyMod_Missions/            任务标记（客户端渲染）
      5_Mission/MyMod_Missions/          任务 UI、无线电 HUD
    GUI/layouts/                          任务面板布局
    Sounds/                               无线电蜂鸣声

  MyMod_MissionsServer/                 <-- 服务器（-servermod=）
    mod.cpp                               type = "servermod"
    Scripts/
      config.cpp                          requiredAddons: MyMod_Scripts, MyMod_Core_Scripts
      3_Game/MyMod_MissionsServer/       服务器配置扩展
      4_World/MyMod_MissionsServer/      任务生成器、战利品管理器
      5_Mission/MyMod_MissionsServer/    服务器任务生命周期
```

---

## 什么放在哪里

### Data/ 目录

物理资源和物品定义：

```
Data/
  config.cpp          <-- CfgVehicles、CfgWeapons、CfgMagazines、CfgAmmo
  Models/             <-- .p3d 3D 模型文件
  Textures/           <-- .paa、.edds 纹理文件
  Materials/          <-- .rvmat 材质定义
  Animations/         <-- .anim 动画文件（罕见）
```

### Scripts/ 目录

所有 Enforce Script 代码：

```
Scripts/
  config.cpp          <-- CfgPatches、CfgMods、脚本模块定义
  Inputs.xml          <-- 按键绑定定义
  Data/
    Credits.json      <-- 作者信息
    Version.hpp       <-- 版本字符串
  1_Core/             <-- 基本常量和工具
  3_Game/             <-- 配置、RPC、数据类
  4_World/            <-- 实体、管理器、游戏逻辑
  5_Mission/          <-- UI、HUD、任务生命周期
```

### GUI/ 目录

用户界面资源：

```
GUI/
  config.cpp          <-- GUI 特定 CfgPatches（用于图像集/样式注册）
  layouts/            <-- .layout 文件（控件树）
  imagesets/          <-- .imageset XML + .edds 纹理图集
  icons/              <-- 图标图像集（可能与通用图像集分离）
  looknfeel/          <-- .styles 文件（控件视觉属性）
  fonts/              <-- 自定义字体文件（罕见）
  sounds/             <-- UI 声音文件（点击、悬停等）
```

### Sounds/ 目录

音频文件：

```
Sounds/
  alert.ogg           <-- 始终 .ogg 格式
  ambient.ogg
  click.ogg
```

声音配置（CfgSoundSets、CfgSoundShaders）放在 `Scripts/config.cpp` 中，而不是单独的 Sounds 配置中。

### ServerFiles/ 目录

服务器管理员复制到其服务器任务文件夹的文件：

```
ServerFiles/
  types.xml                   <-- 中央经济的物品生成定义
  cfgspawnabletypes.xml       <-- 附件/货物预设
  cfgeventspawns.xml          <-- 事件生成位置（罕见）
  README.md                   <-- 安装说明
```

---

## PBO 命名和 @mod 文件夹命名

### PBO 名称

每个 PBO 获得一个带有模组前缀的描述性名称：

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         <-- 脚本代码
    MyMod_Data.pbo            <-- 模型、纹理、物品
    MyMod_GUI.pbo             <-- 布局、图像集、样式
    MyMod_Sounds.pbo          <-- 音频（有时与 Data 合并）
```

PBO 名称不需要与 CfgPatches 类名匹配，但保持对齐可以避免混淆。

### @mod 文件夹名称

`@` 前缀是 Steam 创意工坊的约定。在开发期间，你可以省略它：

```
开发：    MyMod/           <-- 无 @ 前缀
创意工坊：@MyMod/          <-- 有 @ 前缀
```

`@` 对引擎没有技术意义。它纯粹是组织约定。

### 每个模组多个 PBO

大型模组分为多个 PBO 有几个原因：

1. **独立的更新周期**——更新脚本而无需重新下载 3D 模型
2. **可选组件**——如果模组无头运行，GUI PBO 是可选的
3. **构建流程**——不同的 PBO 由不同的工具构建

```
@MyMod_Weapons/
  Addons/
    MyMod_Weapons_Scripts.pbo    <-- 脚本行为
    MyMod_Weapons_Data.pbo       <-- 268 个武器模型、纹理、配置
```

每个 PBO 都有自己的 `config.cpp` 和自己的 `CfgPatches` 条目。它们之间的 `requiredAddons` 控制加载顺序：

```cpp
// Scripts/config.cpp
class CfgPatches
{
    class MyMod_Weapons_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DZ_Weapons_Firearms" };
    };
};

// Data/config.cpp
class CfgPatches
{
    class MyMod_Weapons_Data
    {
        requiredAddons[] = { "DZ_Data", "DZ_Weapons_Firearms" };
    };
};
```

---

## 专业模组的真实案例

### 框架模组示例

```
MyFramework/
  MyFramework/                            <-- 客户端包
    mod.cpp
    stringtable.csv
    GUI/
      config.cpp
      fonts/
      icons/                              <-- 5 个图标权重图像集
      imagesets/
      layouts/
        dialogs/
        options/
        prefabs/
        MyMod/loading/hints/
        MyFramework/AdminPanel/
        MyFramework/Dialogs/
        MyFramework/Modules/
        MyFramework/Options/
        MyFramework/Prefabs/
        MyFramework/Tooltip/
      looknfeel/
      sounds/
    Scripts/
      config.cpp
      Inputs.xml
      1_Core/MyMod/                      <-- 日志级别、常量
      2_GameLib/MyMod/UI/                <-- MVC 属性系统
      3_Game/MyMod/                      <-- 15+ 子系统文件夹
        Animation/
        Branding/
        Chat/
        Collections/
        Config/
        Core/
        Events/
        Hints/
        Killfeed/
        Logging/
        Module/
        MVC/
        Notifications/
        Permissions/
        PlayerData/
        RPC/
        Settings/
        Theme/
        Timer/
        UI/
      4_World/MyMod/                     <-- 玩家数据、世界管理器
      5_Mission/MyMod/                   <-- 管理面板、模组注册

  MyFramework_Server/                     <-- 服务器包
    mod.cpp
    Scripts/
      config.cpp
      ...
```

### Community Online Tools（COT）——管理工具

```
JM/COT/
  mod.cpp
  GUI/
    config.cpp
    layouts/
      cursors/
      uiactions/
      vehicles/
    textures/
  Objects/Debug/
    config.cpp                            <-- 调试实体定义
  Scripts/
    config.cpp
    Data/
      Credits.json
      Version.hpp
      Inputs.xml
    Common/                               <-- 跨所有层共享
    1_Core/
    3_Game/
    4_World/
    5_Mission/
  languagecore/
    config.cpp                            <-- 字符串表配置
```

注意 `Common/` 文件夹模式：通过 `files[]` 包含在每个脚本模块中，允许跨所有层共享类型。

### 内容模组示例

```
MyMod_Weapons/
  MyMod_Weapons/
    mod.cpp
    Data/
      config.cpp                          <-- 合并配置：268 个武器定义
      Ammo/                               <-- 按来源/口径组织
        BC/12.7x55/
        BC/338/
        BC/50Cal/
        GCGN/3006/
        GCGN/300AAC/
      Attachments/                        <-- 瞄准镜、消音器、握把
      Magazines/
      Weapons/                            <-- 按来源组织的武器模型
    Scripts/
      config.cpp                          <-- 脚本模块定义
      3_Game/                             <-- 武器配置、属性系统
      4_World/                            <-- 武器行为覆盖
      5_Mission/                          <-- 注册、UI
```

内容模组有大量的 `Data/` 目录和相对较小的 `Scripts/`。

### DabsFramework——UI 框架

```
DabsFramework/
  mod.cpp
  gui/
    config.cpp
    imagesets/
    icons/
      brands.imageset
      light.imageset
      regular.imageset
      solid.imageset
      thin.imageset
    looknfeel/
  scripts/
    config.cpp
    Credits.json
    Version.hpp
    1_core/
    2_GameLib/                            <-- 少数使用第 2 层的模组之一
    3_Game/
    4_World/
    5_Mission/
```

注意：DabsFramework 使用小写文件夹名（`scripts/`、`gui/`）。这在 Windows 上可以工作，因为 Windows 不区分大小写，但在 Linux 上可能会出问题。约定是使用标准大小写（`Scripts/`、`GUI/`）。

---

## 反模式

### 1. 扁平的脚本堆积

```
Scripts/
  3_Game/
    AllMyStuff.c            <-- 2000 行，15 个类
    MoreStuff.c             <-- 1500 行，12 个类
```

**修复：**每个类一个文件，按子系统组织在子目录中。

### 2. 错误的层放置

```
Scripts/
  3_Game/
    MyMod/
      PlayerManager.c       <-- 引用了 PlayerBase（定义在 4_World 中）
      MyPanel.c             <-- UI 代码（属于 5_Mission）
      MyItem.c              <-- 扩展 ItemBase（属于 4_World）
```

**修复：**遵循第 2.1 章的层规则。将实体代码移到 `4_World`，将 UI 代码移到 `5_Mission`。

### 3. 脚本层中没有模组子目录

```
Scripts/
  3_Game/
    Config.c                <-- 与其他模组有名称冲突风险！
    RPCs.c
```

**修复：**始终使用子目录命名空间：

```
Scripts/
  3_Game/
    MyMod/
      Config.c
      RPCs.c
```

### 4. stringtable.csv 在 Scripts/ 内

```
Scripts/
  stringtable.csv           <-- 错误位置
  config.cpp
```

**修复：**`stringtable.csv` 放在模组根目录（`mod.cpp` 旁边）：

```
MyMod/
  mod.cpp
  stringtable.csv           <-- 正确
  Scripts/
    config.cpp
```

### 5. 资源和脚本混合在一个 PBO 中

```
MyMod/
  config.cpp
  Scripts/3_Game/...
  Models/weapon.p3d
  Textures/weapon_co.paa
```

**修复：**分成多个 PBO：

```
MyMod/
  Scripts/
    config.cpp
    3_Game/...
  Data/
    config.cpp
    Models/weapon.p3d
    Textures/weapon_co.paa
```

### 6. 过深的子目录嵌套

```
Scripts/3_Game/MyMod/Systems/Core/Config/Managers/Settings/PlayerSettings.c
```

**修复：**将嵌套保持在最多 2-3 层。尽可能展平：

```
Scripts/3_Game/MyMod/Config/PlayerSettings.c
```

### 7. 不一致的命名

```
mymod_Config.c
MyMod_rpc.c
MYMOD_Manager.c
my_mod_panel.c
```

**修复：**选择一种约定并坚持使用：

```
MyModConfig.c
MyModRPC.c
MyModManager.c
MyModPanel.c
```

---

## 总结清单

在发布模组之前，验证：

- [ ] `mod.cpp` 在模组根目录（`Addons/` 或 `Scripts/` 旁边）
- [ ] `stringtable.csv` 在模组根目录（不在 `Scripts/` 内）
- [ ] 每个 PBO 根目录都有 `config.cpp`
- [ ] `requiredAddons[]` 列出了所有依赖
- [ ] 脚本模块 `files[]` 路径与实际目录结构匹配
- [ ] 每个 `.c` 文件都在模组命名空间的子目录中（例如 `3_Game/MyMod/`）
- [ ] 类名有唯一前缀以避免冲突
- [ ] 实体类在 `4_World`，UI 类在 `5_Mission`，数据类在 `3_Game`
- [ ] 发布的 PBO 中没有密钥或调试代码
- [ ] 仅服务器的逻辑在单独的 `-servermod` 包中（如适用）

---

## 真实模组中的观察

| 模式 | 模组 | 细节 |
|---------|-----|--------|
| `3_Game` 中的深层子系统文件夹 | StarDZ Core | `3_Game/` 下有 15+ 文件夹（Config、RPC、Events、Logging、Permissions 等） |
| `Common/` 共享文件夹 | COT | 包含在每个脚本模块的 `files[]` 中，提供跨层工具类型 |
| 小写文件夹名 | DabsFramework | 使用 `scripts/`、`gui/` 而非 `Scripts/`、`GUI/`——在 Windows 上可以工作但在 Linux 上有风险 |
| 独立的 GUI PBO | Expansion、COT | GUI 资源（布局、图像集、样式）打包到专用 PBO 中，有自己的 config.cpp |
| 内容模组的最少脚本 | 武器包 | `Data/` 目录占主导；`Scripts/` 只有薄薄的 config.cpp 和可选的行为覆盖 |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| 每文件一个类 | 每个 `.c` 文件包含一个类 | 小的辅助类和枚举通常与其父类放在一起以方便使用 |
| Scripts/Data/GUI 分别使用独立 PBO | 按关注点清晰分离 | 小型模组通常将所有内容合并到单个 PBO 以简化发布 |
| 模组子文件夹防止冲突 | `3_Game/MyMod/` 为文件提供命名空间 | 确实如此，但类名仍然是全局冲突的——子文件夹只防止文件级冲突 |
| `stringtable.csv` 在模组根目录 | 引擎自动找到它 | 必须在被加载的 PBO 根目录中；放在 `Scripts/` 内会导致它被静默忽略 |
| ServerFiles/ 随模组一起发布 | 服务器管理员复制 types.xml | 许多模组作者忘记包含 ServerFiles，迫使管理员手动创建 types.xml 条目 |

---

## 兼容性与影响

- **多模组：**文件组织本身不会导致冲突。然而，两个模组在其 PBO 中放置相同路径的文件（例如，两个都使用 `3_Game/Config.c` 而没有模组子文件夹）会在引擎层面冲突，导致一个静默覆盖另一个。
- **性能：**目录深度和文件数量对脚本编译时间没有可测量的影响。引擎会递归扫描所有列出的 `files[]` 目录，无论嵌套深度如何。

---

**上一章：**[第 2.4 章：你的第一个模组——最小可行](04-minimum-viable-mod.md)
**下一章：**[第 2.6 章：服务器与客户端架构](06-server-client-split.md)
