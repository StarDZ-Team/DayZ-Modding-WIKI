# Chapter 4.4: Audio (.ogg, .wss)

[Home](../README.md) | [<< Previous: Materials](03-materials.md) | **Audio** | [Next: DayZ Tools Workflow >>](05-dayz-tools.md)

---

## Einführung

Sound design is one of the most immersive aspects of DayZ modding. From the crack of a rifle to the ambient wind in a forest, audio brings the game world to life. DayZ uses **OGG Vorbis** as its primary audio format and configures sound playback through a layered system of **CfgSoundShaders** and **CfgSoundSets** defined in `config.cpp`. Understanding this pipeline -- from raw audio file to spatialized in-game sound -- is essential for any mod that introduces custom weapons, vehicles, ambient effects, or UI feedback.

This chapter covers audio formats, the config-driven sound system, 3D positional audio, volume and distance attenuation, looping, and the complete workflow for adding custom sounds to a DayZ mod.

---

## Inhaltsverzeichnis

- [Audio Formats](#audio-formats)
- [CfgSoundShaders and CfgSoundSets](#cfgsoundshaders-and-cfgsoundsets)
- [Sound Categories](#sound-categories)
- [3D Positional Audio](#3d-positional-audio)
- [Volume and Distance Attenuation](#volume-and-distance-attenuation)
- [Looping Sounds](#looping-sounds)
- [Adding Custom Sounds to a Mod](#adding-custom-sounds-to-a-mod)
- [Audio Production Tools](#audio-production-tools)
- [Common Mistakes](#common-mistakes)
- [Best Practices](#best-practices)

---

## Audio Formats

### OGG Vorbis (Primary Format)

**OGG Vorbis** is DayZ's primary audio format. All custom sounds should be exported as `.ogg` files.

| Property | Value |
|----------|-------|
| **Extension** | `.ogg` |
| **Codec** | Vorbis (lossy compression) |
| **Sample rates** | 44100 Hz (standard), 22050 Hz (acceptable for ambient) |
| **Bit depth** | Managed by encoder (quality setting) |
| **Channels** | Mono (for 3D sounds) or Stereo (for music/UI) |
| **Quality range** | -1 to 10 (5-7 recommended for game audio) |

### Key Rules for OGG in DayZ

- **3D positional sounds MUST be mono.** If you provide a stereo file for a 3D sound, the engine may not spatialize it correctly or may ignore one channel.
- **UI and music sounds can be stereo.** Non-positional sounds (menus, HUD feedback, background music) work correctly in stereo.
- **Sample rate should be 44100 Hz** for most sounds. Lower rates (22050 Hz) can be used for distant ambient sounds to save space.

### WSS (Legacy Format)

**WSS** is a legacy sound format from older Bohemia titles (Arma series). DayZ can still load WSS files, but new mods should use OGG exclusively.

| Property | Value |
|----------|-------|
| **Extension** | `.wss` |
| **Status** | Legacy, not recommended for new mods |
| **Conversion** | WSS files can be converted to OGG with Audacity or similar tools |

You will encounter WSS files when examining vanilla DayZ data or porting content from older Bohemia games.

---

## CfgSoundShaders and CfgSoundSets

DayZ's audio system uses a two-layer configuration approach defined in `config.cpp`. A **SoundShader** defines what audio file to play and how, while a **SoundSet** defines where and how the sound is heard in the world.

### The Relationship

```
config.cpp
  |
  |--> CfgSoundShaders     (WHAT to play: file, volume, frequency)
  |      |
  |      |--> MyShader      references --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         (HOW to play: 3D position, distance, spatial)
         |
         |--> MySoundSet    references --> MyShader
```

Game code and other configs reference **SoundSets**, never SoundShaders directly. SoundSets are the public interface; SoundShaders are the implementation detail.

### CfgSoundShaders

A SoundShader defines the raw audio content and basic playback parameters:

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        // Array of audio files -- engine picks one randomly
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {path (no extension), probability weight}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;                          // Base volume (0.0 - 1.0)
        range = 300;                           // Maximum audible distance (meters)
        rangeCurve[] = {{0, 1.0}, {300, 0.0}}; // Volume falloff curve
    };
};
```

#### SoundShader Properties

| Property | Type | Description |
|----------|------|-------------|
| `samples[]` | array | List of `{path, weight}` pairs. Path excludes the file extension. |
| `volume` | float | Base volume multiplier (0.0 to 1.0). |
| `range` | float | Maximum audible distance in meters. |
| `rangeCurve[]` | array | Array of `{distance, volume}` points defining attenuation over distance. |
| `frequency` | float | Playback speed multiplier. 1.0 = normal, 0.5 = half speed (lower pitch), 2.0 = double speed (higher pitch). |

> **Important:** The `samples[]` path does NOT include the file extension. The engine appends `.ogg` (or `.wss`) automatically based on what it finds on disk.

### CfgSoundSets

A SoundSet wraps one or more SoundShaders and defines the spatial and behavioral properties:

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;          // Volume scaling (applied on top of shader volume)
        frequencyFactor = 1.0;       // Frequency scaling
        volumeCurve = "InverseSquare"; // Predefined attenuation curve name
        spatial = 1;                  // 1 = 3D positional, 0 = 2D (HUD/menu)
        doppler = 0;                  // 1 = enable Doppler effect
        loop = 0;                     // 1 = loop continuously
    };
};
```

#### SoundSet Properties

| Property | Type | Description |
|----------|------|-------------|
| `soundShaders[]` | array | List of SoundShader class names to combine. |
| `volumeFactor` | float | Additional volume multiplier applied on top of shader volume. |
| `frequencyFactor` | float | Additional frequency/pitch multiplier. |
| `frequencyRandomizer` | float | Random pitch variation (0.0 = none, 0.1 = +/- 10%). |
| `volumeCurve` | string | Named attenuation curve: `"InverseSquare"`, `"Linear"`, `"Logarithmic"`. |
| `spatial` | int | `1` for 3D positional audio, `0` for 2D (UI, music). |
| `doppler` | int | `1` to enable Doppler pitch shift for moving sources. |
| `loop` | int | `1` for continuous looping, `0` for one-shot. |
| `distanceFilter` | int | `1` to apply low-pass filter at distance (muffled far-away sounds). |
| `occlusionFactor` | float | How much walls/terrain muffle the sound (0.0 to 1.0). |
| `obstructionFactor` | float | How much obstacles between source and listener affect the sound. |

---

## Sound Categories

DayZ organizes sounds into categories that affect how they interact with the game's audio mixing system.

### Weapon Sounds

Weapon sounds are the most complex audio in DayZ, typically involving multiple SoundSets for different aspects of a single gunshot:

```
Shot fired
  |--> Close shot SoundSet       (the "bang" heard nearby)
  |--> Distance shot SoundSet    (the rumble/echo heard far away)
  |--> Tail SoundSet             (reverb/echo that follows)
  |--> Supersonic crack SoundSet (bullet passing overhead)
  |--> Mechanical SoundSet       (bolt cycling, magazine insertion)
```

Example weapon sound config:

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

### Ambient Sounds

Environmental audio for atmosphere:

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
    spatial = 0;           // Non-positional (ambient surround)
    loop = 1;              // Continuous loop
};
```

### UI Sounds

Interface feedback sounds (button clicks, notifications):

```cpp
class MyMod_ButtonClick_SoundShader
{
    samples[] = {{"MyMod\sound\ui\click_01", 1}};
    volume = 0.7;
    range = 0;             // No spatial range needed
};

class MyMod_ButtonClick_SoundSet
{
    soundShaders[] = {"MyMod_ButtonClick_SoundShader"};
    volumeFactor = 0.8;
    spatial = 0;           // 2D -- plays in the listener's head
    loop = 0;
};
```

### Vehicle Sounds

Vehicles use complex sound configurations with multiple components:

- **Engine idle** -- looping, pitch varies with RPM
- **Engine acceleration** -- looping, volume and pitch scale with throttle
- **Tire noise** -- looping, volume scales with speed
- **Horn** -- triggered, looping while held
- **Crash** -- one-shot on collision

### Character Sounds

Player-related sounds include:

- **Footsteps** -- varies by surface material (concrete, grass, wood, metal)
- **Breathing** -- stamina-dependent
- **Voice** -- emotes and commands
- **Inventory** -- item manipulation sounds

---

## 3D Positional Audio

DayZ uses 3D spatial audio to position sounds in the game world. When a gun fires 200 meters to your left, you hear it from your left speaker/headphone with appropriate volume reduction.

### Requirements for 3D Audio

1. **Audio file must be mono.** Stereo files will not spatialize correctly.
2. **SoundSet `spatial` must be `1`.** This enables the 3D positioning system.
3. **Sound source must have a world position.** The engine needs coordinates to calculate direction and distance.

### How the Engine Spatializes Sound

```
Sound Source (world position)
  |
  |--> Calculate distance to listener
  |--> Calculate direction relative to listener facing
  |--> Apply distance attenuation (rangeCurve)
  |--> Apply occlusion (walls, terrain)
  |--> Apply Doppler effect (if enabled and source is moving)
  |--> Output to correct speaker channels
```

### Triggering 3D Sounds from Script

```c
// Play a positional sound at a world location
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// Play a sound attached to an object (moves with it)
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## Volume and Distance Attenuation

### Range Curve

The `rangeCurve[]` in a SoundShader defines how volume decreases with distance. It is an array of `{distance, volume}` pairs:

```cpp
rangeCurve[] =
{
    {0, 1.0},       // At 0m: full volume
    {50, 0.7},      // At 50m: 70% volume
    {150, 0.3},     // At 150m: 30% volume
    {300, 0.0}      // At 300m: silent
};
```

The engine interpolates linearly between defined points. You can create any falloff curve by adding more control points.

### Predefined Volume Curves

SoundSets can reference named curves via the `volumeCurve` property:

| Curve Name | Behavior |
|------------|----------|
| `"InverseSquare"` | Realistic falloff (volume = 1/distance^2). Natural-sounding. |
| `"Linear"` | Even falloff from max to zero over the range. |
| `"Logarithmic"` | Loud up close, drops quickly at medium distance, then tapers slowly. |

### Practical Attenuation Examples

**Gunshot (loud, carries far):**
```cpp
range = 800;
rangeCurve[] = {{0, 1.0}, {100, 0.6}, {300, 0.3}, {600, 0.1}, {800, 0.0}};
```

**Footstep (quiet, close range):**
```cpp
range = 30;
rangeCurve[] = {{0, 1.0}, {10, 0.5}, {20, 0.15}, {30, 0.0}};
```

**Vehicle engine (medium range, sustained):**
```cpp
range = 200;
rangeCurve[] = {{0, 1.0}, {50, 0.7}, {100, 0.4}, {200, 0.0}};
```

---

## Looping Sounds

Looping sounds repeat continuously until explicitly stopped. They are used for engines, ambient atmosphere, alarms, and any sustained audio.

### Configuring a Looping Sound

In the SoundSet:
```cpp
class MyMod_Alarm_SoundSet
{
    soundShaders[] = {"MyMod_Alarm_SoundShader"};
    spatial = 1;
    loop = 1;              // Enable looping
};
```

### Looping from Script

```c
// Start a looping sound
EffectSound m_AlarmSound;

void StartAlarm(vector position)
{
    if (!m_AlarmSound)
    {
        m_AlarmSound = SEffectManager.PlaySound("MyMod_Alarm_SoundSet", position);
    }
}

// Stop the looping sound
void StopAlarm()
{
    if (m_AlarmSound)
    {
        m_AlarmSound.Stop();
        m_AlarmSound = null;
    }
}
```

### Audio File Preparation for Loops

For seamless looping, the audio file itself must loop cleanly:

1. **Zero-crossing at start and end.** The waveform should cross zero amplitude at both endpoints to avoid a click/pop at the loop point.
2. **Matched start and end.** The end of the file should blend seamlessly into the beginning.
3. **No fade in/out.** Fades would be audible on each loop iteration.
4. **Test the loop in Audacity.** Select the entire clip, enable loop playback, and listen for clicks or discontinuities.

---

## Adding Custom Sounds to a Mod

### Complete Workflow

**Step 1: Prepare audio files**
- Record or source your audio.
- Edit in Audacity (or your preferred audio editor).
- For 3D sounds: convert to mono.
- Export as OGG Vorbis (quality 5-7).
- Name files descriptively: `rifle_shot_01.ogg`, `rifle_shot_02.ogg`.

**Step 2: Organize in mod directory**

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

**Step 3: Define SoundShaders in config.cpp**

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

**Step 4: Reference from weapon/item config**

For weapons, the SoundSet is referenced in the weapon's config class:

```cpp
class CfgWeapons
{
    class MyMod_Rifle: Rifle_Base
    {
        // ... other config ...

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

**Step 5: Build and test**
- Pack the PBO (use `-packonly` since OGG files do not need binarization).
- Launch the game with the mod loaded.
- Test the sound in-game at various distances.

---

## Audio Production Tools

### Audacity (Free, Open Source)

Audacity is the recommended tool for DayZ audio production:

- **Download:** [audacityteam.org](https://www.audacityteam.org/)
- **OGG export:** File --> Export --> Export as OGG
- **Mono conversion:** Tracks --> Mix --> Mix Stereo Down to Mono
- **Normalization:** Effect --> Normalize (set peak to -1 dB to prevent clipping)
- **Noise removal:** Effect --> Noise Reduction
- **Loop testing:** Transport --> Loop Play (Shift+Space)

### OGG Export Settings in Audacity

1. **File --> Export --> Export as OGG Vorbis**
2. **Quality:** 5-7 (5 for ambient/UI, 7 for weapon/important sounds)
3. **Channels:** Mono for 3D sounds, Stereo for UI/music

### Other Useful Tools

| Tool | Purpose | Cost |
|------|---------|------|
| **Audacity** | General audio editing, format conversion | Free |
| **Reaper** | Professional DAW, advanced editing | $60 (personal license) |
| **FFmpeg** | Command-line batch audio conversion | Free |
| **Ocenaudio** | Simple editor with real-time preview | Free |

### Batch Conversion with FFmpeg

Convert all WAV files in a directory to mono OGG:

```bash
for file in *.wav; do
    ffmpeg -i "$file" -ac 1 -codec:a libvorbis -qscale:a 6 "${file%.wav}.ogg"
done
```

---

## Häufige Fehler

### 1. Stereo File for 3D Sound

**Symptom:** Sound does not spatialize, plays centered or only in one ear.
**Fix:** Convert to mono before exporting. 3D positional sounds require mono audio files.

### 2. File Extension in samples[] Path

**Symptom:** Sound does not play, no error in log (engine silently fails to find the file).
**Fix:** Remove the `.ogg` extension from the path in `samples[]`. The engine adds it automatically.

```cpp
// WRONG
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// CORRECT
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. Missing CfgPatches requiredAddons

**Symptom:** SoundShaders or SoundSets not recognized, sounds do not play.
**Fix:** Add `"DZ_Sounds_Effects"` to your CfgPatches `requiredAddons[]` to ensure the base sound system loads before your definitions.

### 4. Range Too Short

**Symptom:** Sound cuts off abruptly at a short distance, feels unnatural.
**Fix:** Set `range` to a realistic value. Gunshots should carry 300-800m, footsteps 20-40m, voices 50-100m.

### 5. No Random Variation

**Symptom:** Sound feels repetitive and artificial after hearing it multiple times.
**Fix:** Provide multiple samples in the SoundShader and add `frequencyRandomizer` to the SoundSet for pitch variation.

```cpp
// Multiple samples for variety
samples[] =
{
    {"MyMod\sound\step_01", 1},
    {"MyMod\sound\step_02", 1},
    {"MyMod\sound\step_03", 1},
    {"MyMod\sound\step_04", 1}
};

// Plus pitch randomization in the SoundSet
frequencyRandomizer = 0.05;    // +/- 5% pitch variation
```

### 6. Clipping / Distortion

**Symptom:** Sound crackles or distorts, especially at close range.
**Fix:** Normalize your audio to -1 dB or -3 dB peak in Audacity before exporting. Never set `volume` or `volumeFactor` above 1.0 unless the source audio is very quiet.

---

## Best Practices

1. **Always export 3D sounds as mono OGG.** This is the single most important rule. Stereo files will not spatialize.

2. **Provide 3-5 sample variants** for frequently heard sounds (gunshots, footsteps, impacts). Random selection prevents the "machine gun effect" of identical repeated audio.

3. **Use `frequencyRandomizer`** between 0.03 and 0.08 for natural pitch variation. Even subtle variation significantly improves perceived audio quality.

4. **Set realistic range values.** Study vanilla DayZ sounds for reference. A rifle shot at 600-800m range, a suppressed shot at 150-200m, footsteps at 20-40m.

5. **Layer your sounds.** Complex audio events (gunshots) should use multiple SoundSets: close shot + distant rumble + tail/echo. This creates depth that a single sound file cannot achieve.

6. **Test at multiple distances.** Walk away from the sound source in-game and verify the attenuation curve feels natural. Adjust `rangeCurve[]` control points iteratively.

7. **Organize your sound directory.** Use subdirectories by category (`weapons/`, `ambient/`, `ui/`, `vehicles/`). A flat directory with 200 OGG files is unmanageable.

8. **Keep file sizes reasonable.** Game audio does not need studio quality. OGG quality 5-7 is sufficient. Most individual sound files should be under 500 KB.

---

## Navigation

| Previous | Up | Next |
|----------|----|------|
| [4.3 Materials](03-materials.md) | [Part 4: File Formats & DayZ Tools](01-textures.md) | [4.5 DayZ Tools Workflow](05-dayz-tools.md) |
