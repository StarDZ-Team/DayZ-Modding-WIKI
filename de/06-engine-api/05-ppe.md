# Kapitel 6.5: Nachbearbeitungseffekte (PPE)

[Startseite](../README.md) | [<< Zurück: Kameras](04-cameras.md) | **Nachbearbeitungseffekte** | [Weiter: Benachrichtigungen >>](06-notifications.md)

---

## Einführung

Das Post-Process-Effects-System (PPE) von DayZ steuert visuelle Effekte, die nach dem Szenen-Rendering angewendet werden: Unschärfe, Farbkorrektur, Vignette, chromatische Aberration, Nachtsicht und mehr. Das System basiert auf `PPERequester`-Klassen, die bestimmte visuelle Effekte anfordern können. Mehrere Requester können gleichzeitig aktiv sein, und die Engine mischt ihre Beiträge. Dieses Kapitel behandelt die Verwendung des PPE-Systems in Mods.

---

## Architekturübersicht

```
PPEManager
├── PPERequesterBank              // Statische Registry aller verfügbaren Requester
│   ├── REQ_INVENTORYBLUR         // Inventar-Unschärfe
│   ├── REQ_MENUEFFECTS           // Menü-Effekte
│   ├── REQ_CONTROLLERDISCONNECT  // Controller-Verbindungsabbruch-Overlay
│   ├── REQ_UNCONSCIOUS           // Bewusstlosigkeitseffekt
│   ├── REQ_FEVEREFFECTS          // Fieber-Visuelleffekte
│   ├── REQ_FLASHBANGEFFECTS      // Blendgranate
│   ├── REQ_BURLAPSACK            // Jutesack über dem Kopf
│   ├── REQ_DEATHEFFECTS          // Todesbildschirm
│   ├── REQ_BLOODLOSS             // Blutverlust-Entsättigung
│   └── ... (viele weitere)
└── PPERequester_*                // Einzelne Requester-Implementierungen
```

---

## PPEManager

Der `PPEManager` ist ein Singleton, der alle aktiven PPE-Anfragen koordiniert. Sie interagieren selten direkt damit --- stattdessen arbeiten Sie über `PPERequester`-Unterklassen.

```c
// Manager-Instanz abrufen
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**Datei:** `3_Game/PPE/pperequesterbank.c`

Eine statische Registry, die Instanzen aller PPE-Requester enthält. Greifen Sie auf bestimmte Requester über ihren Konstantenindex zu.

### Einen Requester abrufen

```c
// Einen Requester über seine Bank-Konstante abrufen
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Häufige Requester-Konstanten

| Konstante | Effekt |
|-----------|--------|
| `REQ_INVENTORYBLUR` | Gaußsche Unschärfe bei geöffnetem Inventar |
| `REQ_MENUEFFECTS` | Menü-Hintergrund-Unschärfe |
| `REQ_UNCONSCIOUS` | Bewusstlosigkeits-Visuell (Unschärfe + Entsättigung) |
| `REQ_DEATHEFFECTS` | Todesbildschirm (Graustufen + Vignette) |
| `REQ_BLOODLOSS` | Blutverlust-Entsättigung |
| `REQ_FEVEREFFECTS` | Fieber-chromatische Aberration |
| `REQ_FLASHBANGEFFECTS` | Blendgranaten-Weißblende |
| `REQ_BURLAPSACK` | Jutesack-Augenbinde |
| `REQ_PAINBLUR` | Schmerz-Unschärfe-Effekt |
| `REQ_CONTROLLERDISCONNECT` | Controller-Verbindungsabbruch-Overlay |
| `REQ_CAMERANV` | Nachtsicht |
| `REQ_FILMGRAINEFFECTS` | Filmkorn-Overlay |
| `REQ_RAINEFFECTS` | Regen-Bildschirmeffekte |
| `REQ_COLORSETTING` | Farbkorrektur-Einstellungen |

---

## PPERequester-Basis

Alle PPE-Requester erweitern `PPERequester`:

```c
class PPERequester : Managed
{
    // Effekt starten
    void Start(Param par = null);

    // Effekt stoppen
    void Stop(Param par = null);

    // Prüfen ob aktiv
    bool IsActiveRequester();

    // Werte auf Material-Parameter setzen
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
    static const int SET          = 0;  // Wert direkt setzen
    static const int ADD          = 1;  // Zum aktuellen Wert addieren
    static const int ADD_RELATIVE = 2;  // Relativ zum aktuellen Wert addieren
    static const int HIGHEST      = 3;  // Den höchsten von aktuellem und neuem Wert verwenden
    static const int LOWEST       = 4;  // Den niedrigsten von aktuellem und neuem Wert verwenden
    static const int MULTIPLY     = 5;  // Aktuellen Wert multiplizieren
    static const int OVERRIDE     = 6;  // Erzwungene Überschreibung
}
```

---

## Häufige PPE-Material-IDs

Effekte zielen auf bestimmte Nachbearbeitungsmaterialien ab. Häufige Material-IDs:

| Konstante | Material |
|-----------|----------|
| `PostProcessEffectType.Glow` | Bloom / Glühen |
| `PostProcessEffectType.FilmGrain` | Filmkorn |
| `PostProcessEffectType.RadialBlur` | Radiale Unschärfe |
| `PostProcessEffectType.ChromAber` | Chromatische Aberration |
| `PostProcessEffectType.WetEffect` | Nasse-Linse-Effekt |
| `PostProcessEffectType.ColorGrading` | Farbkorrektur / LUT |
| `PostProcessEffectType.DepthOfField` | Tiefenschärfe |
| `PostProcessEffectType.SSAO` | Screen-Space Ambient Occlusion |
| `PostProcessEffectType.GodRays` | Volumetrisches Licht |
| `PostProcessEffectType.Rain` | Regen auf dem Bildschirm |
| `PostProcessEffectType.Vignette` | Vignetten-Overlay |
| `PostProcessEffectType.HBAO` | Horizon-Based Ambient Occlusion |

---

## Eingebaute Requester verwenden

### Inventar-Unschärfe

Das einfachste Beispiel --- die Unschärfe, die erscheint, wenn das Inventar geöffnet wird:

```c
// Unschärfe starten
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Unschärfe stoppen
blurReq.Stop();
```

### Blendgranaten-Effekt

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Nach einer Verzögerung stoppen
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Einen benutzerdefinierten PPE-Requester erstellen

Um benutzerdefinierte Nachbearbeitungseffekte zu erstellen, erweitern Sie `PPERequester` und registrieren ihn.

### Schritt 1: Den Requester definieren

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Eine starke Vignette anwenden
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Farben entsättigen
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Auf Standardwerte zurücksetzen
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### Schritt 2: Registrieren und verwenden

Die Registrierung erfolgt durch Hinzufügen des Requesters zur Bank. In der Praxis verwenden die meisten Modder die eingebauten Requester und passen deren Parameter an, anstatt vollständig benutzerdefinierte zu erstellen.

---

## Nachtsicht (NVG)

Nachtsicht ist als PPE-Effekt implementiert. Der zugehörige Requester ist `REQ_CAMERANV`:

```c
// NVG-Effekt aktivieren
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// NVG-Effekt deaktivieren
nvgReq.Stop();
```

Die eigentliche NVG im Spiel wird durch das NVGoggles-Item über seinen `ComponentEnergyManager` und die `NVGoggles.ToggleNVG()`-Methode ausgelöst, die intern das PPE-System steuert.

---

## Farbkorrektur

Farbkorrektur verändert das gesamte Farberscheinungsbild der Szene:

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Sättigung anpassen (1.0 = normal, 0.0 = Graustufen, >1.0 = übersättigt)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Unschärfe-Effekte

### Gaußsche Unschärfe

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Unschärfe-Intensität anpassen (0.0 = keine, höher = mehr Unschärfe)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Radiale Unschärfe

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Prioritätsebenen

Wenn mehrere Requester denselben Parameter ändern, bestimmt die Prioritätsebene, welcher gewinnt:

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Niedrigste Priorität (statische Effekte)
    static const int L_1_VALUES   = 1;   // Dynamische Wertänderungen
    static const int L_2_SCRIPTS  = 2;   // Script-gesteuerte Effekte
    static const int L_3_EFFECTS  = 3;   // Gameplay-Effekte
    static const int L_4_OVERLAY  = 4;   // Overlay-Effekte
    static const int L_LAST       = 100;  // Höchste Priorität (alles überschreiben)
}
```

Höhere Zahlen haben Vorrang. Verwenden Sie `PPEManager.L_LAST`, um Ihren Effekt zu zwingen, alle anderen zu überschreiben.

---

## Zusammenfassung

| Konzept | Kernpunkt |
|---------|-----------|
| Zugriff | `PPERequesterBank.GetRequester(KONSTANTE)` |
| Start/Stopp | `requester.Start()` / `requester.Stop()` |
| Parameter | `SetTargetValueFloat(Material, Parameter, relativ, Wert, Ebene, Operator)` |
| Operatoren | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Häufige Effekte | Unschärfe, Vignette, Sättigung, NVG, Blendgranate, Filmkorn, chromatische Aberration |
| NVG | `REQ_CAMERANV` Requester |
| Priorität | Ebenen 0-100; höhere Zahl gewinnt bei Konflikten |
| Benutzerdefiniert | `PPERequester` erweitern, `OnStart()` / `OnStop()` überschreiben |

---

## Bewährte Praktiken

- **Rufen Sie immer `Stop()` auf, um Ihren Requester aufzuräumen.** Wenn ein PPE-Requester nicht gestoppt wird, bleibt sein visueller Effekt dauerhaft aktiv, auch nachdem die auslösende Bedingung endet.
- **Verwenden Sie passende Prioritätsebenen.** Gameplay-Effekte sollten `L_3_EFFECTS` oder höher verwenden. Die Verwendung von `L_LAST` (100) überschreibt alles einschließlich der Vanilla-Bewusstlosigkeits- und Todeseffekte, was das Spielererlebnis beeinträchtigen kann.
- **Bevorzugen Sie eingebaute Requester gegenüber benutzerdefinierten.** Die `PPERequesterBank` enthält bereits Requester für Unschärfe, Entsättigung, Vignette und Filmkorn. Verwenden Sie diese mit angepassten Parametern wieder, bevor Sie eine benutzerdefinierte Requester-Klasse erstellen.
- **Testen Sie PPE-Effekte unter verschiedenen Lichtverhältnissen.** Vignette und Entsättigung sehen bei Nacht gegenüber Tags drastisch unterschiedlich aus. Überprüfen Sie, dass Ihr Effekt unter beiden Extremen gut lesbar ist.
- **Vermeiden Sie das Stapeln mehrerer hochintensiver Unschärfe-Effekte.** Mehrere aktive Unschärfe-Requester verstärken sich gegenseitig, was den Bildschirm potenziell unleserlich macht. Prüfen Sie `IsActiveRequester()` bevor Sie zusätzliche Effekte starten.

---

## Kompatibilität und Auswirkungen

- **Multi-Mod:** Mehrere Mods können gleichzeitig PPE-Requester aktivieren. Die Engine mischt sie über Prioritätsebenen und Operatoren. Konflikte treten auf, wenn zwei Mods dieselbe Prioritätsebene mit `PPOperators.SET` auf demselben Parameter verwenden -- der zuletzt Schreibende gewinnt.
- **Leistung:** PPE-Effekte sind GPU-gebundene Nachbearbeitungsdurchläufe. Das gleichzeitige Aktivieren vieler Effekte (Unschärfe + Filmkorn + chromatische Aberration + Vignette) kann die Bildrate auf schwächeren GPUs reduzieren. Halten Sie aktive Effekte minimal.
- **Server/Client:** PPE ist vollständig clientseitiges Rendering. Der Server hat keine Kenntnis von Nachbearbeitungseffekten. Machen Sie serverseitige Logik niemals von PPE-Zuständen abhängig.

---

[<< Zurück: Kameras](04-cameras.md) | **Nachbearbeitungseffekte** | [Weiter: Benachrichtigungen >>](06-notifications.md)
