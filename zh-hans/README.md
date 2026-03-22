# DayZ Mod 开发百科全书（简体中文版）

[![English](https://flagsapi.com/US/flat/48.png)](../en/README.md) [![Português](https://flagsapi.com/BR/flat/48.png)](../pt/README.md) [![Deutsch](https://flagsapi.com/DE/flat/48.png)](../de/README.md) [![Русский](https://flagsapi.com/RU/flat/48.png)](../ru/README.md) [![Čeština](https://flagsapi.com/CZ/flat/48.png)](../cs/README.md) [![Polski](https://flagsapi.com/PL/flat/48.png)](../pl/README.md) [![Magyar](https://flagsapi.com/HU/flat/48.png)](../hu/README.md) [![Italiano](https://flagsapi.com/IT/flat/48.png)](../it/README.md) [![Español](https://flagsapi.com/ES/flat/48.png)](../es/README.md) [![Français](https://flagsapi.com/FR/flat/48.png)](../fr/README.md) [![日本語](https://flagsapi.com/JP/flat/48.png)](../ja/README.md) [![简体中文](https://flagsapi.com/CN/flat/48.png)](../zh-hans/README.md)

> 本文档从英文版翻译而来。代码示例保持原样，技术术语保留英文。

---

## 目录

### 第一部分：Enforce Script 语言

| 章节 | 主题 | 说明 |
|------|------|------|
| [1.1](01-enforce-script/01-variables-types.md) | 变量与类型 | 基本类型、声明、类型转换 |
| [1.2](01-enforce-script/02-arrays-maps-sets.md) | 数组、映射与集合 | `array<T>`、`map<K,V>`、`set<T>` |
| [1.3](01-enforce-script/03-classes-inheritance.md) | 类与继承 | 类声明、继承、访问修饰符 |
| [1.4](01-enforce-script/04-modded-classes.md) | Modded 类 | DayZ Mod 开发的核心机制 |
| [1.5](01-enforce-script/05-control-flow.md) | 控制流 | if/else、for、while、foreach、switch |
| [1.6](01-enforce-script/06-strings.md) | 字符串操作 | 完整的字符串方法参考 |
| [1.7](01-enforce-script/07-math-vectors.md) | 数学与向量 | Math 类、vector 类型、3D 运算 |
| [1.8](01-enforce-script/08-memory-management.md) | 内存管理 | ref、autoptr、引用计数、循环引用 |
| [1.9](01-enforce-script/09-casting-reflection.md) | 类型转换与反射 | CastTo、IsInherited、反射 API |
| [1.10](01-enforce-script/10-enums-preprocessor.md) | 枚举与预处理器 | enum、#ifdef、条件编译 |
| [1.11](01-enforce-script/11-error-handling.md) | 错误处理 | 守卫子句、ErrorEx、日志记录 |
| [1.12](01-enforce-script/12-gotchas.md) | 陷阱大全 | 30 个常见"坑"与解决方案 |
| [1.13](../en/01-enforce-script/13-functions-methods.md) | Functions & Methods (English) | 函数与方法 🔄 |

### 第二部分：Mod 结构

| 章节 | 主题 | 说明 |
|------|------|------|
| [2.1](02-mod-structure/01-five-layers.md) | 五层脚本层次结构 | 1_Core 到 5_Mission 的编译层级 |
| [2.2](02-mod-structure/02-config-cpp.md) | config.cpp 深入解析 | CfgPatches、CfgMods、脚本模块 |
| [2.3](02-mod-structure/03-mod-cpp.md) | mod.cpp 与 Workshop | 启动器元数据、Workshop 发布 |
| [2.4](02-mod-structure/04-minimum-viable-mod.md) | 你的第一个 Mod | 从零开始的最小可行 Mod |
| [2.5](02-mod-structure/05-file-organization.md) | 文件组织最佳实践 | 目录结构、命名规范、PBO 组织 |
| [2.6](../en/02-mod-structure/06-server-client-split.md) | Server/Client Architecture (English) | 服务器/客户端架构 🔄 |

### 第三部分：GUI 系统

| 章节 | 主题 | 说明 |
|------|------|------|
| [3.1](03-gui-system/01-widget-types.md) | Widget 类型 | 所有 Widget 类型参考 |
| [3.2](03-gui-system/02-layout-files.md) | 布局文件 | .layout XML 格式 |
| [3.3](03-gui-system/03-sizing-positioning.md) | 尺寸与定位 | 锚点、对齐、尺寸模式 |
| [3.4](03-gui-system/04-containers.md) | 容器 | 面板布局、滚动、网格 |
| [3.5](03-gui-system/05-programmatic-widgets.md) | 代码创建 Widget | 代码中创建和操作 Widget |
| [3.6](03-gui-system/06-event-handling.md) | 事件处理 | 输入事件、回调、焦点 |
| [3.7](03-gui-system/07-styles-fonts.md) | 样式与字体 | .styles 文件、字体、主题 |
| [3.8](../en/03-gui-system/08-dialogs-modals.md) | Dialogs & Modals (English) | 对话框与模态窗口 🔄 |
| [3.9](../en/03-gui-system/09-real-mod-patterns.md) | Real Mod UI Patterns (English) | 真实 Mod UI 模式 🔄 |
| [3.10](../en/03-gui-system/10-advanced-widgets.md) | Advanced Widgets (English) | 高级控件 🔄 |

### 第四部分：文件格式

| 章节 | 主题 | 说明 |
|------|------|------|
| [4.1](04-file-formats/01-textures.md) | 纹理 | .paa、.edds 格式、TexView2 |
| [4.2](04-file-formats/02-models.md) | 模型 | .p3d 格式、Object Builder |
| [4.3](04-file-formats/03-materials.md) | 材质 | .rvmat 格式、着色器 |
| [4.4](04-file-formats/04-audio.md) | 音频 | .ogg 格式、CfgSoundSets |
| [4.5](04-file-formats/05-dayz-tools.md) | DayZ Tools | 工具套件概览 |
| [4.6](04-file-formats/06-pbo-packing.md) | PBO 打包 | 打包、签名、部署 |
| [4.7](../en/04-file-formats/07-workbench-guide.md) | Workbench Guide (English) | Workbench 指南 🔄 |

### 第五部分：配置文件

| 章节 | 主题 | 说明 |
|------|------|------|
| [5.1](05-config-files/01-stringtable.md) | 字符串表 | stringtable.csv 本地化 |
| [5.2](05-config-files/02-inputs-xml.md) | 输入绑定 | Inputs.xml 按键绑定 |
| [5.3](05-config-files/03-credits-json.md) | Credits.json | 作者署名文件 |
| [5.4](05-config-files/04-imagesets.md) | ImageSets | 图标集与纹理图集 |
| [5.5](../en/05-config-files/05-server-configs.md) | Server Configuration Files (English) | 服务器配置文件 🔄 |
| [5.6](../en/05-config-files/06-spawning-gear.md) | Spawning Gear Configuration (English) | 出生装备配置 🔄 |

### 第六部分：引擎 API

| 章节 | 主题 | 说明 |
|------|------|------|
| [6.1](06-engine-api/01-entity-system.md) | 实体系统 | Object、EntityAI、生命周期 |
| [6.2](06-engine-api/02-vehicles.md) | 载具 | CarScript、引擎、物理 |
| [6.3](06-engine-api/03-weather.md) | 天气 | Weather API、雾、风、雨 |
| [6.4](06-engine-api/04-cameras.md) | 摄像机 | 摄像机类型、自定义视角 |
| [6.5](06-engine-api/05-ppe.md) | 后处理效果 | PPE 材质、模糊、色调 |
| [6.6](06-engine-api/06-notifications.md) | 通知 | 通知系统 API |
| [6.7](06-engine-api/07-timers.md) | 定时器 | CallLater、Timer、调度 |
| [6.8](06-engine-api/08-file-io.md) | 文件 I/O | 文件读写、JSON、路径 |
| [6.9](06-engine-api/09-networking.md) | 网络 | RPC、同步变量、复制 |
| [6.10](06-engine-api/10-central-economy.md) | 中央经济 | types.xml、生成系统 |
| [6.11](../en/06-engine-api/11-mission-hooks.md) | Mission Hooks (English) | 任务钩子 🔄 |
| [6.12](../en/06-engine-api/12-action-system.md) | Action System (English) | 动作系统 🔄 |
| [6.13](../en/06-engine-api/13-input-system.md) | Input System (English) | 输入系统 🔄 |
| [6.14](../en/06-engine-api/14-player-system.md) | Player System (English) | 玩家系统 🔄 |
| [6.15](../en/06-engine-api/15-sound-system.md) | Sound System (English) | 音效系统 🔄 |
| [6.16](../en/06-engine-api/16-crafting-system.md) | Crafting System (English) | 制作系统 🔄 |
| [6.17](../en/06-engine-api/17-construction-system.md) | Construction System (English) | 建造系统 🔄 |
| [6.18](../en/06-engine-api/18-animation-system.md) | Animation System (English) | 动画系统 🔄 |
| [6.19](../en/06-engine-api/19-terrain-queries.md) | Terrain & World Queries (English) | 地形与世界查询 🔄 |
| [6.20](../en/06-engine-api/20-particle-effects.md) | Particle & Effect System (English) | 粒子与特效系统 🔄 |
| [6.21](../en/06-engine-api/21-zombie-ai-system.md) | Zombie & AI System (English) | 僵尸与 AI 系统 🔄 |
| [6.22](../en/06-engine-api/22-admin-server.md) | Admin & Server Management (English) | 管理与服务器管理 🔄 |

### 第七部分：设计模式

| 章节 | 主题 | 说明 |
|------|------|------|
| [7.1](07-patterns/01-singletons.md) | 单例模式 | 全局管理器模式 |
| [7.2](07-patterns/02-module-systems.md) | 模块系统 | 模块注册与生命周期 |
| [7.3](07-patterns/03-rpc-patterns.md) | RPC 模式 | 远程过程调用最佳实践 |
| [7.4](07-patterns/04-config-persistence.md) | 配置持久化 | JSON 配置加载/保存 |
| [7.5](07-patterns/05-permissions.md) | 权限系统 | 权限检查与管理 |
| [7.6](07-patterns/06-events.md) | 事件系统 | 事件总线、发布/订阅 |
| [7.7](07-patterns/07-performance.md) | 性能优化 | 性能陷阱与优化技巧 |

### 第八部分：教程

| 章节 | 主题 | 说明 |
|------|------|------|
| [8.1](08-tutorials/01-first-mod.md) | 第一个 Mod | 完整的入门教程 |
| [8.2](08-tutorials/02-custom-item.md) | 自定义物品 | 创建自定义游戏物品 |
| [8.3](08-tutorials/03-admin-panel.md) | 管理面板 | 构建管理员面板 |
| [8.4](08-tutorials/04-chat-commands.md) | 聊天命令 | 实现聊天命令系统 |
| [8.5](08-tutorials/05-mod-template.md) | Mod 模板 | 使用 DayZ Mod 模板 |
| [8.6](../en/08-tutorials/06-debugging-testing.md) | Debugging & Testing (English) | 调试与测试 🔄 |
| [8.7](../en/08-tutorials/07-publishing-workshop.md) | Publishing to Steam Workshop (English) | 发布到 Steam Workshop 🔄 |
| [8.8](../en/08-tutorials/08-hud-overlay.md) | Building a HUD Overlay (English) | 构建 HUD 覆盖层 🔄 |
| [8.9](../en/08-tutorials/09-professional-template.md) | Professional Mod Template (English) | 专业 Mod 模板 🔄 |
| [8.10](../en/08-tutorials/10-vehicle-mod.md) | Creating a Vehicle Mod (English) | 创建载具 Mod 🔄 |
| [8.11](../en/08-tutorials/11-clothing-mod.md) | Creating a Clothing Mod (English) | 创建服装 Mod 🔄 |
| [8.12](../en/08-tutorials/12-trading-system.md) | Building a Trading System (English) | 构建交易系统 🔄 |
| [8.13](../en/08-tutorials/13-diag-menu.md) | Diag Menu Reference (English) | 诊断菜单参考 🔄 |

### 速查表

| 页面 | 说明 |
|------|------|
| [速查表](cheatsheet.md) | 单页 Enforce Script 快速参考 |
| [引擎 API 快速参考](06-engine-api/quick-reference.md) | 引擎 API 方法的单页参考 |
| [Glossary (English)](../en/glossary.md) | 术语表 🔄 |
| [FAQ (English)](../en/faq.md) | 常见问题 🔄 |
| [Troubleshooting Guide (English)](../en/troubleshooting.md) | 故障排除指南 🔄 |

---

## Credits

- **Bohemia Interactive** -- DayZ 引擎与官方示例
- **Jacob_Mango** -- Community Framework 与 Community Online Tools
- **InclementDab** -- Dabs Framework 与 DayZ Editor
- **DaOne & GravityWolf** -- VPP Admin Tools
- **DayZ Expansion Team** -- Expansion Scripts
- **Brian Orr (DrkDevil)** -- Colorful UI，颜色主题系统
- **lothsun** -- Colorful UI，UI 颜色系统
- **StarDZ Team** -- 文档编辑、翻译与组织

---

> 翻译说明：所有代码示例保持英文原样。技术术语（如 `modded class`、`override`、`ref` 等）保留英文，并在首次出现时给出中文解释。导航链接指向中文版页面。
