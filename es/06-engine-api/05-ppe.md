# Capítulo 6.5: Efectos de Post-Procesado (PPE)

[Inicio](../README.md) | [<< Anterior: Cameras](04-cameras.md) | **Post-Process Effects** | [Siguiente: Notifications >>](06-notifications.md)

---

## Introducción

DayZ's Post-Process Effects (PPE) system controls visual effects applied after scene rendering: blur, color grading, vignette, chromatic aberration, night vision, and more. The system is built around `PPERequester` classes that can request specific visual effects. Multiple requesters can be active simultaneously, and the engine blends their contributions. This chapter covers how to use the PPE system in mods.

---

## Descripción General de la Arquitectura

```
PPEManager
├── PPERequesterBank              // Static registry of all available requesters
│   ├── REQ_INVENTORYBLUR         // Inventory blur
│   ├── REQ_MENUEFFECTS           // Menu effects
│   ├── REQ_CONTROLLERDISCONNECT  // Controller disconnect overlay
│   ├── REQ_UNCONSCIOUS           // Unconsciousness effect
│   ├── REQ_FEVEREFFECTS          // Fever visual effects
│   ├── REQ_FLASHBANGEFFECTS      // Flashbang
│   ├── REQ_BURLAPSACK            // Burlap sack on head
│   ├── REQ_DEATHEFFECTS          // Death screen
│   ├── REQ_BLOODLOSS             // Blood loss desaturation
│   └── ... (many more)
└── PPERequester_*                // Individual requester implementations
```

---

## PPEManager

The `PPEManager` is a singleton that coordinates all active PPE requests. You rarely interact with it directly --- instead, you work through `PPERequester` subclasses.

```c
// Get the manager instance
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**Archivo:** `3_Game/PPE/pperequesterbank.c`

A static registry that holds instances of all PPE requesters. Access specific requesters by their constant index.

### Getting a Requester

```c
// Get a requester by its bank constant
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Common Requester Constants

| Constante | Effect |
|----------|--------|
| `REQ_INVENTORYBLUR` | Gaussian blur when inventory is open |
| `REQ_MENUEFFECTS` | Menu background blur |
| `REQ_UNCONSCIOUS` | Unconsciousness visual (blur + desaturation) |
| `REQ_DEATHEFFECTS` | Death screen (grayscale + vignette) |
| `REQ_BLOODLOSS` | Blood loss desaturation |
| `REQ_FEVEREFFECTS` | Fever chromatic aberration |
| `REQ_FLASHBANGEFFECTS` | Flashbang whiteout |
| `REQ_BURLAPSACK` | Burlap sack blindfold |
| `REQ_PAINBLUR` | Pain blur effect |
| `REQ_CONTROLLERDISCONNECT` | Controller disconnect overlay |
| `REQ_CAMERANV` | Night vision |
| `REQ_FILMGRAINEFFECTS` | Film grain overlay |
| `REQ_RAINEFFECTS` | Rain screen effects |
| `REQ_COLORSETTING` | Color correction settings |

---

## PPERequester Base

All PPE requesters extend `PPERequester`:

```c
class PPERequester : Managed
{
    // Start the effect
    void Start(Param par = null);

    // Stop the effect
    void Stop(Param par = null);

    // Check if active
    bool IsActiveRequester();

    // Set values on material parameters
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
    static const int SET          = 0;  // Directly set the value
    static const int ADD          = 1;  // Add to current value
    static const int ADD_RELATIVE = 2;  // Add relative to current
    static const int HIGHEST      = 3;  // Use the highest of current and new
    static const int LOWEST       = 4;  // Use the lowest of current and new
    static const int MULTIPLY     = 5;  // Multiply current value
    static const int OVERRIDE     = 6;  // Force override
}
```

---

## Common PPE Material IDs

Effects target specific post-processing materials. Common material IDs:

| Constante | Material |
|----------|----------|
| `PostProcessEffectType.Glow` | Bloom / glow |
| `PostProcessEffectType.FilmGrain` | Film grain |
| `PostProcessEffectType.RadialBlur` | Radial blur |
| `PostProcessEffectType.ChromAber` | Chromatic aberration |
| `PostProcessEffectType.WetEffect` | Wet lens effect |
| `PostProcessEffectType.ColorGrading` | Color grading / LUT |
| `PostProcessEffectType.DepthOfField` | Depth of field |
| `PostProcessEffectType.SSAO` | Screen-space ambient occlusion |
| `PostProcessEffectType.GodRays` | Volumetric light |
| `PostProcessEffectType.Rain` | Rain on screen |
| `PostProcessEffectType.Vignette` | Vignette overlay |
| `PostProcessEffectType.HBAO` | Horizon-based ambient occlusion |

---

## Using Built-in Requesters

### Inventory Blur

The simplest example --- the blur that appears when the inventory opens:

```c
// Start blur
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Stop blur
blurReq.Stop();
```

### Flashbang Effect

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Stop after a delay
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Creating a Custom PPE Requester

To create custom post-process effects, extend `PPERequester` and register it.

### Step 1: Define the Requester

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Apply a strong vignette
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Desaturate colors
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Reset to defaults
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### Step 2: Register and Use

Registration is handled by adding the requester to the bank. In practice, most modders use the built-in requesters and modify their parameters rather than creating fully custom ones.

---

## Night Vision (NVG)

Night vision is implemented as a PPE effect. The relevant requester is `REQ_CAMERANV`:

```c
// Enable NVG effect
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// Disable NVG effect
nvgReq.Stop();
```

The actual NVG in-game is triggered by the NVGoggles item through its `ComponentEnergyManager` and the `NVGoggles.ToggleNVG()` method, which internally drives the PPE system.

---

## Color Grading

Color grading modifies the overall color appearance of the scene:

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Adjust saturation (1.0 = normal, 0.0 = grayscale, >1.0 = oversaturated)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Blur Effects

### Gaussian Blur

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Adjust blur intensity (0.0 = none, higher = more blur)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Radial Blur

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Priority Layers

When multiple requesters modify the same parameter, the priority layer determines which one wins:

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Lowest priority (static effects)
    static const int L_1_VALUES   = 1;   // Dynamic value changes
    static const int L_2_SCRIPTS  = 2;   // Script-driven effects
    static const int L_3_EFFECTS  = 3;   // Gameplay effects
    static const int L_4_OVERLAY  = 4;   // Overlay effects
    static const int L_LAST       = 100;  // Highest priority (override all)
}
```

Higher numbers take priority. Use `PPEManager.L_LAST` to force your effect to override all others.

---

## Resumen

| Concepto | Punto Clave |
|---------|-----------|
| Access | `PPERequesterBank.GetRequester(CONSTANT)` |
| Start/Stop | `requester.Start()` / `requester.Stop()` |
| Parameters | `SetTargetValueFloat(material, param, relative, value, layer, operator)` |
| Operators | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Common effects | Blur, vignette, saturation, NVG, flashbang, grain, chromatic aberration |
| NVG | `REQ_CAMERANV` requester |
| Priority | Layers 0-100; higher number wins conflicts |
| Custom | Extend `PPERequester`, override `OnStart()` / `OnStop()` |

---

## Mejores Prácticas

- **Always call `Stop()` to clean up your requester.** Failing to stop a PPE requester leaves its visual effect permanently active, even after the triggering condition ends.
- **Use appropriate priority layers.** Gameplay effects should use `L_3_EFFECTS` or higher. Using `L_LAST` (100) overrides everything including vanilla unconsciousness and death effects, which can break the player experience.
- **Prefer built-in requesters over custom ones.** The `PPERequesterBank` already contains requesters for blur, desaturation, vignette, and grain. Reuse them with adjusted parameters before creating a custom requester class.
- **Test PPE effects under different lighting conditions.** Vignette and desaturation look drastically different at night vs daytime. Verify your effect reads well in both extremes.
- **Avoid stacking multiple high-intensity blur effects.** Multiple active blur requesters compound, potentially rendering the screen unreadable. Check `IsActiveRequester()` before starting additional effects.

---

## Compatibilidad e Impacto

- **Multi-Mod:** Multiple mods can activate PPE requesters simultaneously. The engine blends them using priority layers and operators. Conflicts occur when two mods use the same priority level with `PPOperators.SET` on the same parameter -- the last to write wins.
- **Performance:** PPE effects are GPU-bound post-processing passes. Enabling many simultaneous effects (blur + grain + chromatic aberration + vignette) can reduce frame rate on lower-end GPUs. Keep active effects minimal.
- **Server/Client:** PPE is entirely client-side rendering. The server has no knowledge of post-process effects. Never condition server logic on PPE state.

---

[<< Anterior: Cameras](04-cameras.md) | **Post-Process Effects** | [Siguiente: Notifications >>](06-notifications.md)
