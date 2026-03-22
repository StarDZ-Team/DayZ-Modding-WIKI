# 第 6.5 章：后处理效果（PPE）

[首页](../README.md) | [<< 上一章：相机](04-cameras.md) | **后处理效果** | [下一章：通知系统 >>](06-notifications.md)

---

## 简介

DayZ 的后处理效果（PPE）系统控制在场景渲染后应用的视觉效果：模糊、色彩分级、暗角、色差、夜视等。系统围绕 `PPERequester` 类构建，这些类可以请求特定的视觉效果。多个请求者可以同时处于活动状态，引擎会混合它们的贡献。本章介绍如何在模组中使用 PPE 系统。

---

## 架构概述

```
PPEManager
├── PPERequesterBank              // 所有可用请求者的静态注册表
│   ├── REQ_INVENTORYBLUR         // 背包模糊
│   ├── REQ_MENUEFFECTS           // 菜单效果
│   ├── REQ_CONTROLLERDISCONNECT  // 手柄断开叠加层
│   ├── REQ_UNCONSCIOUS           // 昏迷效果
│   ├── REQ_FEVEREFFECTS          // 发烧视觉效果
│   ├── REQ_FLASHBANGEFFECTS      // 闪光弹
│   ├── REQ_BURLAPSACK            // 头上套麻袋
│   ├── REQ_DEATHEFFECTS          // 死亡画面
│   ├── REQ_BLOODLOSS             // 失血去饱和
│   └── ...（更多）
└── PPERequester_*                // 各个请求者实现
```

---

## PPEManager

`PPEManager` 是一个单例，用于协调所有活动的 PPE 请求。你很少直接与其交互 --- 而是通过 `PPERequester` 子类来工作。

```c
// 获取管理器实例
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**文件：** `3_Game/PPE/pperequesterbank.c`

一个静态注册表，持有所有 PPE 请求者的实例。通过其常量索引访问特定请求者。

### 获取请求者

```c
// 通过 bank 常量获取请求者
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### 常用请求者常量

| 常量 | 效果 |
|------|------|
| `REQ_INVENTORYBLUR` | 打开背包时的高斯模糊 |
| `REQ_MENUEFFECTS` | 菜单背景模糊 |
| `REQ_UNCONSCIOUS` | 昏迷视觉效果（模糊 + 去饱和） |
| `REQ_DEATHEFFECTS` | 死亡画面（灰度 + 暗角） |
| `REQ_BLOODLOSS` | 失血去饱和 |
| `REQ_FEVEREFFECTS` | 发烧色差 |
| `REQ_FLASHBANGEFFECTS` | 闪光弹白屏 |
| `REQ_BURLAPSACK` | 麻袋蒙眼 |
| `REQ_PAINBLUR` | 疼痛模糊效果 |
| `REQ_CONTROLLERDISCONNECT` | 手柄断开叠加层 |
| `REQ_CAMERANV` | 夜视 |
| `REQ_FILMGRAINEFFECTS` | 胶片颗粒叠加 |
| `REQ_RAINEFFECTS` | 雨水屏幕效果 |
| `REQ_COLORSETTING` | 色彩校正设置 |

---

## PPERequester 基类

所有 PPE 请求者继承自 `PPERequester`：

```c
class PPERequester : Managed
{
    // 启动效果
    void Start(Param par = null);

    // 停止效果
    void Stop(Param par = null);

    // 检查是否活动
    bool IsActiveRequester();

    // 设置材质参数的值
    void SetTargetValueFloat(int mat_id, int param_idx, bool relative,
                              float val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueColor(int mat_id, int param_idx, bool relative,
                              float val1, float val2, float val3, float val4,
                              int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueBool(int mat_id, int param_idx, bool relative,
                             bool val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueInt(int mat_id, int param_idx, bool relative,
                            int val, int priority_layer, int operator = PPOperators.SET);
}
```

### PPOperators

```c
class PPOperators
{
    static const int SET          = 0;  // 直接设置值
    static const int ADD          = 1;  // 添加到当前值
    static const int ADD_RELATIVE = 2;  // 相对于当前值添加
    static const int HIGHEST      = 3;  // 使用当前值和新值中较高的
    static const int LOWEST       = 4;  // 使用当前值和新值中较低的
    static const int MULTIPLY     = 5;  // 乘以当前值
    static const int OVERRIDE     = 6;  // 强制覆盖
}
```

---

## 常用 PPE 材质 ID

效果针对特定的后处理材质。常用材质 ID：

| 常量 | 材质 |
|------|------|
| `PostProcessEffectType.Glow` | 泛光 / 辉光 |
| `PostProcessEffectType.FilmGrain` | 胶片颗粒 |
| `PostProcessEffectType.RadialBlur` | 径向模糊 |
| `PostProcessEffectType.ChromAber` | 色差 |
| `PostProcessEffectType.WetEffect` | 湿镜头效果 |
| `PostProcessEffectType.ColorGrading` | 色彩分级 / LUT |
| `PostProcessEffectType.DepthOfField` | 景深 |
| `PostProcessEffectType.SSAO` | 屏幕空间环境光遮蔽 |
| `PostProcessEffectType.GodRays` | 体积光 |
| `PostProcessEffectType.Rain` | 屏幕雨水 |
| `PostProcessEffectType.Vignette` | 暗角叠加 |
| `PostProcessEffectType.HBAO` | 基于地平线的环境光遮蔽 |

---

## 使用内置请求者

### 背包模糊

最简单的例子 --- 打开背包时出现的模糊：

```c
// 启动模糊
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// 停止模糊
blurReq.Stop();
```

### 闪光弹效果

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// 延迟后停止
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## 创建自定义 PPE 请求者

要创建自定义后处理效果，请继承 `PPERequester` 并注册它。

### 步骤 1：定义请求者

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // 应用强烈暗角
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // 去饱和颜色
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // 重置为默认值
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### 步骤 2：注册并使用

注册是通过将请求者添加到 bank 来处理的。在实践中，大多数模组开发者使用内置请求者并修改其参数，而不是创建完全自定义的请求者。

---

## 夜视（NVG）

夜视作为 PPE 效果实现。相关请求者是 `REQ_CAMERANV`：

```c
// 启用 NVG 效果
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// 禁用 NVG 效果
nvgReq.Stop();
```

游戏中实际的 NVG 是由 NVGoggles 物品通过其 `ComponentEnergyManager` 和 `NVGoggles.ToggleNVG()` 方法触发的，该方法内部驱动 PPE 系统。

---

## 色彩分级

色彩分级修改场景的整体色彩外观：

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// 调整饱和度（1.0 = 正常，0.0 = 灰度，>1.0 = 过饱和）
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## 模糊效果

### 高斯模糊

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// 调整模糊强度（0.0 = 无，越高越模糊）
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### 径向模糊

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## 优先级层

当多个请求者修改同一参数时，优先级层决定哪个胜出：

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // 最低优先级（静态效果）
    static const int L_1_VALUES   = 1;   // 动态值变化
    static const int L_2_SCRIPTS  = 2;   // 脚本驱动的效果
    static const int L_3_EFFECTS  = 3;   // 游戏玩法效果
    static const int L_4_OVERLAY  = 4;   // 叠加效果
    static const int L_LAST       = 100;  // 最高优先级（覆盖所有）
}
```

数值越高优先级越高。使用 `PPEManager.L_LAST` 可以强制你的效果覆盖所有其他效果。

---

## 总结

| 概念 | 要点 |
|------|------|
| 访问 | `PPERequesterBank.GetRequester(CONSTANT)` |
| 启动/停止 | `requester.Start()` / `requester.Stop()` |
| 参数 | `SetTargetValueFloat(material, param, relative, value, layer, operator)` |
| 运算符 | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| 常见效果 | 模糊、暗角、饱和度、NVG、闪光弹、颗粒、色差 |
| NVG | `REQ_CAMERANV` 请求者 |
| 优先级 | 层 0-100；数值越高在冲突中胜出 |
| 自定义 | 继承 `PPERequester`，重写 `OnStart()` / `OnStop()` |

---

## 最佳实践

- **始终调用 `Stop()` 来清理你的请求者。** 未能停止 PPE 请求者会导致其视觉效果永久保持活动状态，即使触发条件已经结束。
- **使用适当的优先级层。** 游戏玩法效果应使用 `L_3_EFFECTS` 或更高。使用 `L_LAST`（100）会覆盖所有内容，包括原版的昏迷和死亡效果，这可能破坏玩家体验。
- **优先使用内置请求者而非自定义请求者。** `PPERequesterBank` 已经包含了模糊、去饱和、暗角和颗粒的请求者。在创建自定义请求者类之前，先尝试使用调整了参数的内置请求者。
- **在不同光照条件下测试 PPE 效果。** 暗角和去饱和在夜间和白天看起来差异很大。验证你的效果在两种极端条件下都能良好呈现。
- **避免叠加多个高强度模糊效果。** 多个活动的模糊请求者会叠加，可能导致屏幕无法辨认。在启动额外效果之前检查 `IsActiveRequester()`。

---

## 兼容性与影响

- **多模组：** 多个模组可以同时激活 PPE 请求者。引擎使用优先级层和运算符来混合它们。当两个模组在同一参数上使用相同的优先级层和 `PPOperators.SET` 时会产生冲突 -- 最后写入的获胜。
- **性能：** PPE 效果是 GPU 绑定的后处理通道。同时启用许多效果（模糊 + 颗粒 + 色差 + 暗角）可能降低低端 GPU 的帧率。尽量减少活动效果。
- **服务端/客户端：** PPE 完全是客户端渲染。服务端不了解后处理效果。切勿根据 PPE 状态来编写服务端逻辑。

---

[<< 上一章：相机](04-cameras.md) | **后处理效果** | [下一章：通知系统 >>](06-notifications.md)
