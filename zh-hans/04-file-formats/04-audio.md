# 第 4.4 章：音频（.ogg、.wss）

[首页](../README.md) | [<< 上一章：材质](03-materials.md) | **音频** | [下一章：DayZ 工具工作流 >>](05-dayz-tools.md)

---

## 简介

声音设计是 DayZ Mod 制作中最具沉浸感的方面之一。从步枪的枪声到森林中的环境风声，音频为游戏世界注入了生命力。DayZ 使用 **OGG Vorbis** 作为其主要音频格式，并通过在 `config.cpp` 中定义的 **CfgSoundShaders** 和 **CfgSoundSets** 分层系统来配置声音播放。理解这个管道——从原始音频文件到游戏内空间化声音——对于任何引入自定义武器、载具、环境音效或 UI 反馈的 Mod 都至关重要。

本章涵盖音频格式、基于配置的声音系统、3D 定位音频、音量和距离衰减、循环播放，以及将自定义声音添加到 DayZ Mod 的完整工作流程。

---

## 目录

- [音频格式](#音频格式)
- [CfgSoundShaders 和 CfgSoundSets](#cfgsoundshaders-和-cfgsoundsets)
- [声音类别](#声音类别)
- [3D 定位音频](#3d-定位音频)
- [音量和距离衰减](#音量和距离衰减)
- [循环声音](#循环声音)
- [向 Mod 添加自定义声音](#向-mod-添加自定义声音)
- [音频制作工具](#音频制作工具)
- [常见错误](#常见错误)
- [最佳实践](#最佳实践)

---

## 音频格式

### OGG Vorbis（主要格式）

**OGG Vorbis** 是 DayZ 的主要音频格式。所有自定义声音都应导出为 `.ogg` 文件。

| 属性 | 值 |
|------|-----|
| **扩展名** | `.ogg` |
| **编解码器** | Vorbis（有损压缩） |
| **采样率** | 44100 Hz（标准）、22050 Hz（环境音可接受） |
| **位深度** | 由编码器管理（质量设置） |
| **声道** | 单声道（用于 3D 声音）或立体声（用于音乐/UI） |
| **质量范围** | -1 到 10（游戏音频推荐 5-7） |

### DayZ 中 OGG 的关键规则

- **3D 定位声音必须是单声道。** 如果你为 3D 声音提供立体声文件，引擎可能无法正确进行空间化处理，或者可能忽略一个声道。
- **UI 和音乐声音可以是立体声。** 非定位声音（菜单、HUD 反馈、背景音乐）在立体声下正常工作。
- **采样率应为 44100 Hz** 适用于大多数声音。较低的采样率（22050 Hz）可用于远处的环境声音以节省空间。

### WSS（旧版格式）

**WSS** 是来自较早 Bohemia 游戏（Arma 系列）的旧版声音格式。DayZ 仍然可以加载 WSS 文件，但新 Mod 应该专门使用 OGG。

| 属性 | 值 |
|------|-----|
| **扩展名** | `.wss` |
| **状态** | 旧版，不推荐用于新 Mod |
| **转换** | WSS 文件可以使用 Audacity 或类似工具转换为 OGG |

在检查原版 DayZ 数据或从较早的 Bohemia 游戏移植内容时，你会遇到 WSS 文件。

---

## CfgSoundShaders 和 CfgSoundSets

DayZ 的音频系统使用在 `config.cpp` 中定义的两层配置方法。**SoundShader** 定义要播放什么音频文件以及如何播放，而 **SoundSet** 定义声音在世界中的听觉效果和位置。

### 关系

```
config.cpp
  |
  |--> CfgSoundShaders     （播放什么：文件、音量、频率）
  |      |
  |      |--> MyShader      引用 --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         （如何播放：3D 位置、距离、空间）
         |
         |--> MySoundSet    引用 --> MyShader
```

游戏代码和其他配置引用 **SoundSets**，从不直接引用 SoundShaders。SoundSets 是公共接口；SoundShaders 是实现细节。

### CfgSoundShaders

SoundShader 定义原始音频内容和基本播放参数：

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        // 音频文件数组——引擎随机选择一个
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {路径（无扩展名），概率权重}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;                          // 基础音量（0.0 - 1.0）
        range = 300;                           // 最大可听距离（米）
        rangeCurve[] = {{0, 1.0}, {300, 0.0}}; // 音量衰减曲线
    };
};
```

#### SoundShader 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `samples[]` | array | `{路径, 权重}` 对的列表。路径不包含文件扩展名。 |
| `volume` | float | 基础音量倍数（0.0 到 1.0）。 |
| `range` | float | 最大可听距离（米）。 |
| `rangeCurve[]` | array | 定义距离衰减的 `{距离, 音量}` 点数组。 |
| `frequency` | float | 播放速度倍数。1.0 = 正常，0.5 = 半速（音调降低），2.0 = 双速（音调升高）。 |

> **重要：** `samples[]` 路径不包含文件扩展名。引擎会根据磁盘上找到的内容自动附加 `.ogg`（或 `.wss`）。

### CfgSoundSets

SoundSet 包装一个或多个 SoundShaders 并定义空间和行为属性：

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;          // 音量缩放（在 shader 音量之上应用）
        frequencyFactor = 1.0;       // 频率缩放
        volumeCurve = "InverseSquare"; // 预定义衰减曲线名称
        spatial = 1;                  // 1 = 3D 定位，0 = 2D（HUD/菜单）
        doppler = 0;                  // 1 = 启用多普勒效应
        loop = 0;                     // 1 = 连续循环
    };
};
```

#### SoundSet 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `soundShaders[]` | array | 要组合的 SoundShader 类名列表。 |
| `volumeFactor` | float | 在 shader 音量之上应用的额外音量倍数。 |
| `frequencyFactor` | float | 额外的频率/音调倍数。 |
| `frequencyRandomizer` | float | 随机音调变化（0.0 = 无，0.1 = +/- 10%）。 |
| `volumeCurve` | string | 命名衰减曲线：`"InverseSquare"`、`"Linear"`、`"Logarithmic"`。 |
| `spatial` | int | `1` 为 3D 定位音频，`0` 为 2D（UI、音乐）。 |
| `doppler` | int | `1` 启用移动声源的多普勒音调偏移。 |
| `loop` | int | `1` 连续循环，`0` 单次播放。 |
| `distanceFilter` | int | `1` 在远距离应用低通滤波器（远处声音变闷）。 |
| `occlusionFactor` | float | 墙壁/地形对声音的消音程度（0.0 到 1.0）。 |
| `obstructionFactor` | float | 声源和听者之间的障碍物对声音的影响程度。 |

---

## 声音类别

DayZ 将声音组织为不同类别，影响它们与游戏音频混合系统的交互方式。

### 武器声音

武器声音是 DayZ 中最复杂的音频，通常涉及多个 SoundSets 来处理单次射击的不同方面：

```
射击发生
  |--> 近距离射击 SoundSet       （近距离听到的"砰"声）
  |--> 远距离射击 SoundSet    （远距离听到的隆隆声/回声）
  |--> 尾音 SoundSet             （随后的混响/回声）
  |--> 超音速裂声 SoundSet （子弹从头顶飞过）
  |--> 机械 SoundSet       （枪栓循环、弹匣插入）
```

武器声音配置示例：

```cpp
class CfgSoundShaders
{
    class MyMod_Rifle_Shot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 200;
        rangeCurve[] = {{0, 1.0}, {50, 0.8}, {100, 0.4}, {200, 0.0}};
    };

    class MyMod_Rifle_Tail_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_tail_01", 1},
            {"MyMod\sound\weapons\rifle_tail_02", 1}
        };
        volume = 0.8;
        range = 800;
        rangeCurve[] = {{0, 0.6}, {200, 0.4}, {500, 0.2}, {800, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_Rifle_Shot_SoundSet
    {
        soundShaders[] = {"MyMod_Rifle_Shot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
    };

    class MyMod_Rifle_Tail_SoundSet
    {
        soundShaders[] = {"MyMod_Rifle_Tail_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

### 环境声音

用于营造氛围的环境音频：

```cpp
class MyMod_Wind_SoundShader
{
    samples[] = {{"MyMod\sound\ambient\wind_loop", 1}};
    volume = 0.5;
    range = 50;
};

class MyMod_Wind_SoundSet
{
    soundShaders[] = {"MyMod_Wind_SoundShader"};
    volumeFactor = 0.6;
    spatial = 0;           // 非定位（环绕环境音）
    loop = 1;              // 连续循环
};
```

### UI 声音

界面反馈声音（按钮点击、通知）：

```cpp
class MyMod_ButtonClick_SoundShader
{
    samples[] = {{"MyMod\sound\ui\click_01", 1}};
    volume = 0.7;
    range = 0;             // 不需要空间范围
};

class MyMod_ButtonClick_SoundSet
{
    soundShaders[] = {"MyMod_ButtonClick_SoundShader"};
    volumeFactor = 0.8;
    spatial = 0;           // 2D——在听者脑中播放
    loop = 0;
};
```

### 载具声音

载具使用具有多个组件的复杂声音配置：

- **引擎怠速** -- 循环，音调随转速变化
- **引擎加速** -- 循环，音量和音调随油门缩放
- **轮胎噪音** -- 循环，音量随速度缩放
- **喇叭** -- 触发，按住时循环
- **碰撞** -- 碰撞时单次播放

### 角色声音

与玩家相关的声音包括：

- **脚步声** -- 根据地面材质变化（混凝土、草地、木头、金属）
- **呼吸声** -- 取决于体力
- **语音** -- 表情和命令
- **物品栏** -- 物品操作声音

---

## 3D 定位音频

DayZ 使用 3D 空间音频在游戏世界中定位声音。当一把枪在你左边 200 米处开火时，你会从左侧扬声器/耳机听到声音，并且音量会相应降低。

### 3D 音频的要求

1. **音频文件必须是单声道。** 立体声文件无法正确进行空间化处理。
2. **SoundSet 的 `spatial` 必须为 `1`。** 这启用了 3D 定位系统。
3. **声源必须有世界位置。** 引擎需要坐标来计算方向和距离。

### 引擎如何进行声音空间化

```
声源（世界位置）
  |
  |--> 计算到听者的距离
  |--> 计算相对于听者朝向的方向
  |--> 应用距离衰减（rangeCurve）
  |--> 应用遮挡（墙壁、地形）
  |--> 应用多普勒效应（如果启用且声源在移动）
  |--> 输出到正确的扬声器声道
```

### 从脚本触发 3D 声音

```c
// 在世界位置播放定位声音
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// 在对象上播放声音（随对象移动）
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## 音量和距离衰减

### 范围曲线

SoundShader 中的 `rangeCurve[]` 定义音量如何随距离降低。它是 `{距离, 音量}` 对的数组：

```cpp
rangeCurve[] =
{
    {0, 1.0},       // 0米：满音量
    {50, 0.7},      // 50米：70% 音量
    {150, 0.3},     // 150米：30% 音量
    {300, 0.0}      // 300米：静音
};
```

引擎在定义的点之间进行线性插值。你可以通过添加更多控制点来创建任何衰减曲线。

### 预定义音量曲线

SoundSets 可以通过 `volumeCurve` 属性引用命名曲线：

| 曲线名称 | 行为 |
|----------|------|
| `"InverseSquare"` | 真实衰减（音量 = 1/距离^2）。听起来自然。 |
| `"Linear"` | 从最大到零在范围内均匀衰减。 |
| `"Logarithmic"` | 近距离响亮，中距离快速下降，然后缓慢减弱。 |

### 实际衰减示例

**枪声（响亮，传播远）：**
```cpp
range = 800;
rangeCurve[] = {{0, 1.0}, {100, 0.6}, {300, 0.3}, {600, 0.1}, {800, 0.0}};
```

**脚步声（安静，近距离）：**
```cpp
range = 30;
rangeCurve[] = {{0, 1.0}, {10, 0.5}, {20, 0.15}, {30, 0.0}};
```

**载具引擎（中等距离，持续）：**
```cpp
range = 200;
rangeCurve[] = {{0, 1.0}, {50, 0.7}, {100, 0.4}, {200, 0.0}};
```

---

## 循环声音

循环声音会持续重复直到明确停止。它们用于引擎、环境氛围、警报和任何持续的音频。

### 配置循环声音

在 SoundSet 中：
```cpp
class MyMod_Alarm_SoundSet
{
    soundShaders[] = {"MyMod_Alarm_SoundShader"};
    spatial = 1;
    loop = 1;              // 启用循环
};
```

### 从脚本循环播放

```c
// 启动循环声音
EffectSound m_AlarmSound;

void StartAlarm(vector position)
{
    if (!m_AlarmSound)
    {
        m_AlarmSound = SEffectManager.PlaySound("MyMod_Alarm_SoundSet", position);
    }
}

// 停止循环声音
void StopAlarm()
{
    if (m_AlarmSound)
    {
        m_AlarmSound.Stop();
        m_AlarmSound = null;
    }
}
```

### 循环音频文件的准备

要实现无缝循环，音频文件本身必须能够干净地循环：

1. **首尾零交叉。** 波形应在两个端点处穿过零振幅，以避免在循环点出现咔嗒声/爆音。
2. **首尾匹配。** 文件的结尾应无缝衔接到开头。
3. **无淡入/淡出。** 淡化效果在每次循环迭代中都会被听到。
4. **在 Audacity 中测试循环。** 选择整个片段，启用循环播放，检听是否有咔嗒声或不连续。

---

## 向 Mod 添加自定义声音

### 完整工作流程

**步骤 1：准备音频文件**
- 录制或获取你的音频。
- 在 Audacity（或你首选的音频编辑器）中编辑。
- 对于 3D 声音：转换为单声道。
- 导出为 OGG Vorbis（质量 5-7）。
- 描述性地命名文件：`rifle_shot_01.ogg`、`rifle_shot_02.ogg`。

**步骤 2：在 Mod 目录中组织**

```
MyMod/
  sound/
    weapons/
      rifle_shot_01.ogg
      rifle_shot_02.ogg
      rifle_shot_03.ogg
      rifle_tail_01.ogg
      rifle_tail_02.ogg
    ambient/
      wind_loop.ogg
    ui/
      click_01.ogg
      notification_01.ogg
  config.cpp
```

**步骤 3：在 config.cpp 中定义 SoundShaders**

```cpp
class CfgPatches
{
    class MyMod_Sounds
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Sounds_Effects"};
    };
};

class CfgSoundShaders
{
    class MyMod_RifleShot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 300;
        rangeCurve[] = {{0, 1.0}, {100, 0.6}, {200, 0.2}, {300, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_RifleShot_SoundSet
    {
        soundShaders[] = {"MyMod_RifleShot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

**步骤 4：从武器/物品配置中引用**

对于武器，SoundSet 在武器的配置类中引用：

```cpp
class CfgWeapons
{
    class MyMod_Rifle: Rifle_Base
    {
        // ... 其他配置 ...

        class Sounds
        {
            class Fire
            {
                soundSet = "MyMod_RifleShot_SoundSet";
            };
        };
    };
};
```

**步骤 5：构建和测试**
- 打包 PBO（使用 `-packonly`，因为 OGG 文件不需要二进制化）。
- 加载 Mod 启动游戏。
- 在不同距离在游戏内测试声音。

---

## 音频制作工具

### Audacity（免费，开源）

Audacity 是推荐的 DayZ 音频制作工具：

- **下载：** [audacityteam.org](https://www.audacityteam.org/)
- **OGG 导出：** File --> Export --> Export as OGG
- **单声道转换：** Tracks --> Mix --> Mix Stereo Down to Mono
- **标准化：** Effect --> Normalize（设置峰值为 -1 dB 以防止削波）
- **降噪：** Effect --> Noise Reduction
- **循环测试：** Transport --> Loop Play（Shift+Space）

### Audacity 中的 OGG 导出设置

1. **File --> Export --> Export as OGG Vorbis**
2. **质量：** 5-7（环境/UI 用 5，武器/重要声音用 7）
3. **声道：** 3D 声音用单声道，UI/音乐用立体声

### 其他有用工具

| 工具 | 用途 | 费用 |
|------|------|------|
| **Audacity** | 通用音频编辑、格式转换 | 免费 |
| **Reaper** | 专业 DAW，高级编辑 | $60（个人许可） |
| **FFmpeg** | 命令行批量音频转换 | 免费 |
| **Ocenaudio** | 简单编辑器，带实时预览 | 免费 |

### 使用 FFmpeg 批量转换

将目录中的所有 WAV 文件转换为单声道 OGG：

```bash
for file in *.wav; do
    ffmpeg -i "$file" -ac 1 -codec:a libvorbis -qscale:a 6 "${file%.wav}.ogg"
done
```

---

## 常见错误

### 1. 3D 声音使用立体声文件

**症状：** 声音没有空间化，居中播放或只在一个耳朵中播放。
**修复：** 在导出前转换为单声道。3D 定位声音需要单声道音频文件。

### 2. samples[] 路径中包含文件扩展名

**症状：** 声音不播放，日志中没有错误（引擎静默地找不到文件）。
**修复：** 从 `samples[]` 中的路径移除 `.ogg` 扩展名。引擎会自动添加。

```cpp
// 错误
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// 正确
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. 缺少 CfgPatches requiredAddons

**症状：** SoundShaders 或 SoundSets 无法识别，声音不播放。
**修复：** 将 `"DZ_Sounds_Effects"` 添加到你的 CfgPatches `requiredAddons[]` 中，以确保基础声音系统在你的定义之前加载。

### 4. Range 太短

**症状：** 声音在很短的距离内突然切断，感觉不自然。
**修复：** 将 `range` 设置为合理的值。枪声应传播 300-800 米，脚步声 20-40 米，语音 50-100 米。

### 5. 没有随机变化

**症状：** 声音在多次听到后感觉重复和人工。
**修复：** 在 SoundShader 中提供多个样本，并在 SoundSet 中添加 `frequencyRandomizer` 进行音调变化。

```cpp
// 多个样本以增加变化
samples[] =
{
    {"MyMod\sound\step_01", 1},
    {"MyMod\sound\step_02", 1},
    {"MyMod\sound\step_03", 1},
    {"MyMod\sound\step_04", 1}
};

// 加上 SoundSet 中的音调随机化
frequencyRandomizer = 0.05;    // +/- 5% 音调变化
```

### 6. 削波/失真

**症状：** 声音噼啪作响或失真，尤其是在近距离。
**修复：** 在导出前在 Audacity 中将音频标准化到 -1 dB 或 -3 dB 峰值。除非源音频非常安静，否则不要将 `volume` 或 `volumeFactor` 设置为超过 1.0。

---

## 最佳实践

1. **始终将 3D 声音导出为单声道 OGG。** 这是最重要的规则。立体声文件无法进行空间化处理。

2. **为经常听到的声音提供 3-5 个样本变体**（枪声、脚步声、撞击声）。随机选择可以防止相同重复音频的"机关枪效应"。

3. **使用 `frequencyRandomizer`**，值在 0.03 到 0.08 之间以获得自然的音调变化。即使微妙的变化也能显著改善感知的音频质量。

4. **设置真实的 range 值。** 研究原版 DayZ 声音作为参考。步枪射击 600-800 米范围，消音射击 150-200 米，脚步声 20-40 米。

5. **分层你的声音。** 复杂的音频事件（枪声）应使用多个 SoundSets：近距离射击 + 远距离隆隆声 + 尾音/回声。这创造了单个声音文件无法实现的深度。

6. **在多个距离测试。** 在游戏内走离声源并验证衰减曲线是否感觉自然。迭代调整 `rangeCurve[]` 控制点。

7. **组织你的声音目录。** 按类别使用子目录（`weapons/`、`ambient/`、`ui/`、`vehicles/`）。一个包含 200 个 OGG 文件的平面目录是无法管理的。

8. **保持合理的文件大小。** 游戏音频不需要录音室质量。OGG 质量 5-7 就足够了。大多数单个声音文件应在 500 KB 以下。

---

## 在实际 Mod 中观察到的模式

| 模式 | Mod | 详情 |
|------|-----|------|
| 通过 SoundSets 的自定义通知声音 | Expansion（通知模块） | 为不同通知类型（成功、警告、错误）定义多个 `CfgSoundSets`，使用 `spatial = 0` |
| 带缓存播放的 UI 点击声音 | VPP Admin Tools | 使用 `SEffectManager.PlaySoundCachedParams()` 进行按钮点击以避免每次重新解析配置 |
| 多层武器音频（射击 + 尾音 + 裂声） | 社区武器包（RFCP、MuchStuffPack） | 每个武器为每次射击事件定义 3-5 个独立的 SoundSets，用于近距离射击、远距离隆隆声、超音速裂声 |
| 脚步变化的 `frequencyRandomizer` | 原版 DayZ | 在脚步 SoundSets 上使用 0.05-0.08 的音调随机化以防止机械式重复 |

---

## 兼容性与影响

- **多 Mod 共存：** SoundShader 和 SoundSet 类名是全局的。两个 Mod 定义相同的类名会冲突（后加载的获胜）。始终在名称前加上你的 Mod 标识符（例如 `MyMod_Shot_SoundShader`）。
- **性能：** OGG 文件在运行时解压缩。拥有数百个独特音频文件的 Mod 会增加内存使用。保持单个文件在 500 KB 以下，并在变体之间重用样本。
- **版本：** DayZ 的音频系统（CfgSoundShaders/CfgSoundSets）自 1.0 版本以来一直稳定。`sound3DProcessingType` 和 `volumeCurve` 命名预设在后续更新中添加，但向后兼容。

---

## 导航

| 上一章 | 上级 | 下一章 |
|--------|------|--------|
| [4.3 材质](03-materials.md) | [第 4 部分：文件格式与 DayZ 工具](01-textures.md) | [4.5 DayZ 工具工作流](05-dayz-tools.md) |
