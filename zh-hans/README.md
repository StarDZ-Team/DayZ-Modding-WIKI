# DayZ Mod 开发完全指南

> 全面的 DayZ Mod 开发文档 — 92 章，从零到发布 Mod。

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## 完整页面索引

### 第1部分：Enforce Script 语言（13章）

| # | 章节 | 说明 |
|---|------|------|
| 1.1 | [变量与类型](01-enforce-script/01-variables-types.md) | 基本类型、变量声明、类型转换和默认值 |
| 1.2 | [数组、映射与集合](01-enforce-script/02-arrays-maps-sets.md) | 数据集合：array、map、set — 迭代、搜索、排序 |
| 1.3 | [类与继承](01-enforce-script/03-classes-inheritance.md) | 类定义、继承、构造函数、多态 |
| 1.4 | [Modded 类](01-enforce-script/04-modded-classes.md) | Modded class 系统、方法覆盖、super 调用 |
| 1.5 | [控制流](01-enforce-script/05-control-flow.md) | if/else、switch、while/for 循环、break、continue |
| 1.6 | [字符串操作](01-enforce-script/06-strings.md) | 字符串操作、格式化、搜索、比较 |
| 1.7 | [数学与向量](01-enforce-script/07-math-vectors.md) | 数学函数、3D向量、距离、方向 |
| 1.8 | [内存管理](01-enforce-script/08-memory-management.md) | 引用计数、ref、防止内存泄漏、引用循环 |
| 1.9 | [类型转换与反射](01-enforce-script/09-casting-reflection.md) | 类型转换、Class.CastTo、运行时类型检查 |
| 1.10 | [枚举与预处理器](01-enforce-script/10-enums-preprocessor.md) | 枚举、#ifdef、#define、条件编译 |
| 1.11 | [错误处理](01-enforce-script/11-error-handling.md) | 无 try/catch 的错误处理模式、守卫子句 |
| 1.12 | [不存在的特性](01-enforce-script/12-gotchas.md) | Enforce Script 语言的30+陷阱和限制 |
| 1.13 | [函数与方法](01-enforce-script/13-functions-methods.md) | 函数声明、参数、返回值、static、proto |

### 第2部分：Mod 结构（6章）

| # | 章节 | 说明 |
|---|------|------|
| 2.1 | [5层脚本层级](02-mod-structure/01-five-layers.md) | DayZ 的5个脚本层和编译顺序 |
| 2.2 | [config.cpp 详解](02-mod-structure/02-config-cpp.md) | config.cpp 完整结构、CfgPatches、CfgMods |
| 2.3 | [mod.cpp 与 Workshop](02-mod-structure/03-mod-cpp.md) | mod.cpp 文件、Steam Workshop 发布 |
| 2.4 | [你的第一个 Mod](02-mod-structure/04-minimum-viable-mod.md) | 最小可运行 Mod — 必要文件和结构 |
| 2.5 | [文件组织](02-mod-structure/05-file-organization.md) | 命名规范、推荐的文件夹结构 |
| 2.6 | [服务端/客户端架构](02-mod-structure/06-server-client-split.md) | 服务端与客户端代码分离、安全性 |

### 第3部分：GUI 与布局系统（10章）

| # | 章节 | 说明 |
|---|------|------|
| 3.1 | [控件类型](03-gui-system/01-widget-types.md) | 所有可用控件类型：文本、图片、按钮等 |
| 3.2 | [布局文件格式](03-gui-system/02-layout-files.md) | 界面用 .layout XML 文件结构 |
| 3.3 | [尺寸与定位](03-gui-system/03-sizing-positioning.md) | 坐标系、尺寸标志、锚定 |
| 3.4 | [容器控件](03-gui-system/04-containers.md) | 容器控件：WrapSpacer、GridSpacer、ScrollWidget |
| 3.5 | [程序化创建](03-gui-system/05-programmatic-widgets.md) | 通过代码创建控件、GetWidgetUnderCursor、SetHandler |
| 3.6 | [事件处理](03-gui-system/06-event-handling.md) | UI 回调：OnClick、OnChange、OnMouseEnter |
| 3.7 | [样式、字体与图片](03-gui-system/07-styles-fonts.md) | 可用字体、样式、图片加载 |
| 3.8 | [对话框与模态窗口](03-gui-system/08-dialogs-modals.md) | 创建对话框、模态菜单、确认框 |
| 3.9 | [真实 Mod UI 模式](03-gui-system/09-real-mod-patterns.md) | COT、VPP、Expansion、Dabs Framework 的 UI 模式 |
| 3.10 | [高级控件](03-gui-system/10-advanced-widgets.md) | MapWidget、RenderTargetWidget、特殊控件 |

### 第4部分：文件格式与工具（8章）

| # | 章节 | 说明 |
|---|------|------|
| 4.1 | [纹理](04-file-formats/01-textures.md) | .paa、.edds、.tga 格式 — 转换与使用 |
| 4.2 | [3D 模型](04-file-formats/02-models.md) | .p3d 格式、LOD、几何体、内存点 |
| 4.3 | [材质](04-file-formats/03-materials.md) | .rvmat 文件、着色器、表面属性 |
| 4.4 | [音频](04-file-formats/04-audio.md) | .ogg 和 .wss 格式、声音配置 |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | 官方 DayZ Tools 工作流程 |
| 4.6 | [PBO 打包](04-file-formats/06-pbo-packing.md) | PBO 文件的创建和解包 |
| 4.7 | [Workbench 指南](04-file-formats/07-workbench-guide.md) | 使用 Workbench 编辑脚本和资源 |
| 4.8 | [建筑建模](04-file-formats/08-building-modeling.md) | 带门和梯子的建筑建模 |

### 第5部分：配置文件（6章）

| # | 章节 | 说明 |
|---|------|------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | 使用 stringtable.csv 进行13种语言的本地化 |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | 按键配置和自定义键位绑定 |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Mod 的制作名单文件 |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | 图标和精灵图的 ImageSet 格式 |
| 5.5 | [服务器配置](05-config-files/05-server-configs.md) | DayZ 服务器配置文件 |
| 5.6 | [出生配置](05-config-files/06-spawning-gear.md) | 初始装备和出生点配置 |

### 第6部分：引擎 API 参考（23章）

| # | 章节 | 说明 |
|---|------|------|
| 6.1 | [实体系统](06-engine-api/01-entity-system.md) | 实体层级、EntityAI、ItemBase、Object |
| 6.2 | [载具系统](06-engine-api/02-vehicles.md) | 载具 API、引擎、液体、物理模拟 |
| 6.3 | [天气系统](06-engine-api/03-weather.md) | 天气控制、雨、雾、云量 |
| 6.4 | [相机系统](06-engine-api/04-cameras.md) | 自定义相机、位置、旋转、过渡 |
| 6.5 | [后处理效果](06-engine-api/05-ppe.md) | PPE：模糊、色差、颜色分级 |
| 6.6 | [通知系统](06-engine-api/06-notifications.md) | 屏幕通知、玩家消息 |
| 6.7 | [定时器与 CallQueue](06-engine-api/07-timers.md) | 定时器、延迟调用、重复 |
| 6.8 | [文件 I/O 与 JSON](06-engine-api/08-file-io.md) | 文件读写、JSON 解析 |
| 6.9 | [网络与 RPC](06-engine-api/09-networking.md) | 网络通信、RPC、客户端-服务器同步 |
| 6.10 | [中心经济](06-engine-api/10-central-economy.md) | 战利品系统、分类、标志、最小/最大值 |
| 6.11 | [任务钩子](06-engine-api/11-mission-hooks.md) | 任务钩子、MissionBase、MissionServer |
| 6.12 | [动作系统](06-engine-api/12-action-system.md) | 玩家动作、ActionBase、目标、条件 |
| 6.13 | [输入系统](06-engine-api/13-input-system.md) | 按键捕获、映射、UAInput |
| 6.14 | [玩家系统](06-engine-api/14-player-system.md) | PlayerBase、背包、生命值、耐力、统计 |
| 6.15 | [声音系统](06-engine-api/15-sound-system.md) | 音频播放、SoundOnVehicle、环境音 |
| 6.16 | [合成系统](06-engine-api/16-crafting-system.md) | 合成配方、材料、结果 |
| 6.17 | [建造系统](06-engine-api/17-construction-system.md) | 基地建造、建造部件、状态 |
| 6.18 | [动画系统](06-engine-api/18-animation-system.md) | 玩家动画、命令 ID、回调 |
| 6.19 | [地形查询](06-engine-api/19-terrain-queries.md) | 射线检测、地形位置、表面 |
| 6.20 | [粒子效果](06-engine-api/20-particle-effects.md) | 粒子系统、发射器、视觉效果 |
| 6.21 | [僵尸与 AI 系统](06-engine-api/21-zombie-ai-system.md) | ZombieBase、感染者 AI、行为 |
| 6.22 | [管理与服务器](06-engine-api/22-admin-server.md) | 服务器管理、封禁、踢出、RCON |
| 6.23 | [世界系统](06-engine-api/23-world-systems.md) | 时间、日期、世界函数 |

### 第7部分：模式与最佳实践（7章）

| # | 章节 | 说明 |
|---|------|------|
| 7.1 | [单例模式](07-patterns/01-singletons.md) | 单一实例、全局访问、初始化 |
| 7.2 | [模块系统](07-patterns/02-module-systems.md) | 模块注册、生命周期、CF 模块 |
| 7.3 | [RPC 通信](07-patterns/03-rpc-patterns.md) | 安全高效的 RPC 模式 |
| 7.4 | [配置持久化](07-patterns/04-config-persistence.md) | JSON 配置的保存/加载、版本管理 |
| 7.5 | [权限系统](07-patterns/05-permissions.md) | 分层权限、通配符、分组 |
| 7.6 | [事件驱动架构](07-patterns/06-events.md) | 事件总线、发布/订阅、解耦 |
| 7.7 | [性能优化](07-patterns/07-performance.md) | 性能分析、缓存、对象池、减少 RPC |

### 第8部分：教程（13章）

| # | 章节 | 说明 |
|---|------|------|
| 8.1 | [你的第一个 Mod (Hello World)](08-tutorials/01-first-mod.md) | 分步教程：创建并加载一个 Mod |
| 8.2 | [创建自定义物品](08-tutorials/02-custom-item.md) | 创建带模型、纹理和配置的物品 |
| 8.3 | [构建管理面板](08-tutorials/03-admin-panel.md) | 带传送、刷出、管理功能的管理员 UI |
| 8.4 | [添加聊天命令](08-tutorials/04-chat-commands.md) | 游戏聊天中的自定义命令 |
| 8.5 | [使用 Mod 模板](08-tutorials/05-mod-template.md) | 如何使用官方 DayZ Mod 模板 |
| 8.6 | [调试与测试](08-tutorials/06-debugging-testing.md) | 日志、调试、诊断工具 |
| 8.7 | [发布到 Workshop](08-tutorials/07-publishing-workshop.md) | 将 Mod 发布到 Steam Workshop |
| 8.8 | [构建 HUD 叠加层](08-tutorials/08-hud-overlay.md) | 游戏上方的自定义 HUD 叠加层 |
| 8.9 | [专业 Mod 模板](08-tutorials/09-professional-template.md) | 可投入生产的完整模板 |
| 8.10 | [创建载具 Mod](08-tutorials/10-vehicle-mod.md) | 带物理和配置的自定义载具 |
| 8.11 | [创建服装 Mod](08-tutorials/11-clothing-mod.md) | 带纹理和插槽的自定义服装 |
| 8.12 | [构建交易系统](08-tutorials/12-trading-system.md) | 玩家/NPC 间的交易系统 |
| 8.13 | [Diag Menu 参考](08-tutorials/13-diag-menu.md) | 开发用诊断菜单 |

### 快速参考

| 页面 | 说明 |
|------|------|
| [速查表](cheatsheet.md) | Enforce Script 语法快速概览 |
| [API 快速参考](06-engine-api/quick-reference.md) | 最常用的引擎 API 方法 |
| [术语表](glossary.md) | DayZ Mod 开发中使用的术语定义 |
| [常见问题](faq.md) | Mod 开发常见问题解答 |
| [故障排除指南](troubleshooting.md) | 91个常见问题及解决方案 |

---

## 致谢

| 开发者 | 项目 | 主要贡献 |
|--------|------|----------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | 模块系统、RPC、权限、ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC、ViewBinding、编辑器 UI |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | 市场、队伍、地图标记、载具 |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | 中心经济、设置版本管理 |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | 玩家管理、Webhook、ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | 权限、服务器管理 |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | 颜色主题、Modded class UI 模式 |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | UI 颜色系统、视觉增强 |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script、原版脚本、DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | 本 Wiki | 文档编写、翻译与组织 |

## 许可证

文档采用 [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/) 许可。
代码示例采用 [**MIT**](../LICENCE) 许可。
