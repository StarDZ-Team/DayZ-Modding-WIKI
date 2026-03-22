# Kapitel 1.10: Enums & Präprozessor

[Startseite](../README.md) | [<< Zurück: Casting & Reflection](09-casting-reflection.md) | **Enums & Präprozessor** | [Weiter: Fehlerbehandlung >>](11-error-handling.md)

---

> **Ziel:** Enum-Deklarationen, Enum-Reflection-Werkzeuge, Bitflag-Muster, Konstanten und das Präprozessorsystem für bedingte Kompilierung verstehen.

---

## Inhaltsverzeichnis

- [Enum-Deklaration](#enum-deklaration)
  - [Explizite Werte](#explizite-werte)
  - [Implizite Werte](#implizite-werte)
  - [Enum-Vererbung](#enum-vererbung)
- [Enums verwenden](#enums-verwenden)
- [Enum-Reflection](#enum-reflection)
  - [typename.EnumToString](#typenameenumtostring)
  - [typename.StringToEnum](#typenamestringtoenum)
- [Bitflags-Muster](#bitflags-muster)
- [Konstanten](#konstanten)
- [Präprozessor-Direktiven](#präprozessor-direktiven)
  - [#ifdef / #ifndef / #endif](#ifdef--ifndef--endif)
  - [#define](#define)
  - [Gängige Engine-Defines](#gängige-engine-defines)
  - [Eigene Defines über config.cpp](#eigene-defines-über-configcpp)
- [Praxisbeispiele](#praxisbeispiele)
  - [Plattformspezifischer Code](#plattformspezifischer-code)
  - [Optionale Mod-Abhängigkeiten](#optionale-mod-abhängigkeiten)
  - [Nur-Debug-Diagnosen](#nur-debug-diagnosen)
  - [Server- vs. Client-Logik](#server--vs-client-logik)
- [Häufige Fehler](#häufige-fehler)
- [Zusammenfassung](#zusammenfassung)
- [Navigation](#navigation)

---

## Enum-Deklaration

Enums in Enforce Script definieren benannte Integer-Konstanten, die unter einem Typnamen gruppiert sind. Sie verhalten sich intern wie `int`.

### Explizite Werte

```c
enum EDamageState
{
    PRISTINE  = 0,
    WORN      = 1,
    DAMAGED   = 2,
    BADLY_DAMAGED = 3,
    RUINED    = 4
};
```

### Implizite Werte

Wenn Sie Werte weglassen, werden sie automatisch vom vorherigen Wert hochgezählt (beginnend bei 0):

```c
enum EWeaponMode
{
    SEMI,       // 0
    BURST,      // 1
    AUTO,       // 2
    COUNT       // 3 — gängiger Trick, um die Gesamtanzahl zu erhalten
};
```

### Enum-Vererbung

Enums können von anderen Enums erben. Die Werte setzen beim letzten Elternwert fort:

```c
enum EBaseColor
{
    RED    = 0,
    GREEN  = 1,
    BLUE   = 2
};

enum EExtendedColor : EBaseColor
{
    YELLOW,   // 3
    CYAN,     // 4
    MAGENTA   // 5
};
```

Alle Elternwerte sind über das Kind-Enum zugänglich:

```c
int c = EExtendedColor.RED;      // 0 — von EBaseColor geerbt
int d = EExtendedColor.YELLOW;   // 3 — in EExtendedColor definiert
```

> **Hinweis:** Enum-Vererbung ist nützlich, um Vanilla-Enums in gemodetem Code zu erweitern, ohne das Original zu ändern.

---

## Enums verwenden

Enums verhalten sich wie `int` — Sie können sie `int`-Variablen zuweisen, vergleichen und in Switch-Anweisungen verwenden:

```c
EDamageState state = EDamageState.WORN;

// Vergleichen
if (state == EDamageState.RUINED)
{
    Print("Gegenstand ist ruiniert!");
}

// In Switch verwenden
switch (state)
{
    case EDamageState.PRISTINE:
        Print("Perfekter Zustand");
        break;
    case EDamageState.WORN:
        Print("Leicht abgenutzt");
        break;
    case EDamageState.DAMAGED:
        Print("Beschädigt");
        break;
    case EDamageState.BADLY_DAMAGED:
        Print("Schwer beschädigt");
        break;
    case EDamageState.RUINED:
        Print("Ruiniert!");
        break;
}

// An int zuweisen
int stateInt = state;  // 1

// Von int zuweisen (keine Validierung — jeder int-Wert wird akzeptiert!)
EDamageState fromInt = 99;  // Kein Fehler, obwohl 99 kein gültiger Enum-Wert ist
```

> **Warnung:** Enforce Script validiert Enum-Zuweisungen **nicht**. Das Zuweisen eines Integers außerhalb des Bereichs an eine Enum-Variable kompiliert und läuft ohne Fehler.

---

## Enum-Reflection

Enforce Script bietet eingebaute Funktionen zur Konvertierung zwischen Enum-Werten und Strings.

### typename.EnumToString

Einen Enum-Wert in seinen Namen als String konvertieren:

```c
EDamageState state = EDamageState.DAMAGED;
string name = typename.EnumToString(EDamageState, state);
Print(name);  // "DAMAGED"
```

Dies ist für Logging und UI-Anzeige unverzichtbar:

```c
void LogDamageState(EntityAI item, EDamageState state)
{
    string stateName = typename.EnumToString(EDamageState, state);
    Print(item.GetType() + " ist " + stateName);
}
```

### typename.StringToEnum

Einen String zurück in einen Enum-Wert konvertieren:

```c
int value;
typename.StringToEnum(EDamageState, "RUINED", value);
Print(value.ToString());  // "4"
```

Dies wird beim Laden von Enum-Werten aus Konfigurationsdateien oder JSON verwendet:

```c
// Aus einem Config-String laden
string configValue = "BURST";
int modeInt;
if (typename.StringToEnum(EWeaponMode, configValue, modeInt))
{
    EWeaponMode mode = modeInt;
    Print("Geladener Waffenmodus: " + typename.EnumToString(EWeaponMode, mode));
}
```

---

## Bitflags-Muster

Enums mit Zweierpotenz-Werten erzeugen Bitflags — mehrere Optionen, die in einem einzelnen Integer kombiniert werden:

```c
enum ESpawnFlags
{
    NONE            = 0,
    PLACE_ON_GROUND = 1,     // 1 << 0
    CREATE_PHYSICS  = 2,     // 1 << 1
    UPDATE_NAVMESH  = 4,     // 1 << 2
    CREATE_LOCAL    = 8,     // 1 << 3
    NO_LIFETIME     = 16     // 1 << 4
};
```

Mit bitweisem ODER kombinieren, mit bitweisem UND testen:

```c
// Flags kombinieren
int flags = ESpawnFlags.PLACE_ON_GROUND | ESpawnFlags.CREATE_PHYSICS | ESpawnFlags.UPDATE_NAVMESH;

// Ein einzelnes Flag testen
if (flags & ESpawnFlags.CREATE_PHYSICS)
{
    Print("Physik wird erstellt");
}

// Ein Flag entfernen
flags = flags & ~ESpawnFlags.CREATE_LOCAL;

// Ein Flag hinzufügen
flags = flags | ESpawnFlags.NO_LIFETIME;
```

DayZ verwendet dieses Muster ausgiebig für Objekt-Erstellungsflags (`ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS`, `ECE_UPDATEPATHGRAPH` usw.).

---

## Konstanten

Verwenden Sie `const`, um unveränderliche Werte zu deklarieren. Konstanten müssen bei der Deklaration initialisiert werden.

```c
// Integer-Konstanten
const int MAX_PLAYERS = 60;
const int INVALID_INDEX = -1;

// Float-Konstanten
const float GRAVITY = 9.81;
const float SPAWN_RADIUS = 500.0;

// String-Konstanten
const string MOD_NAME = "MyMod";
const string CONFIG_PATH = "$profile:MyMod/config.json";
const string LOG_PREFIX = "[MyMod] ";
```

Konstanten können als Switch-Case-Werte und Array-Größen verwendet werden:

```c
// Array mit const-Größe
const int BUFFER_SIZE = 256;
int buffer[BUFFER_SIZE];

// Switch mit const-Werten
const int CMD_HELP = 1;
const int CMD_SPAWN = 2;
const int CMD_TELEPORT = 3;

switch (command)
{
    case CMD_HELP:
        ShowHelp();
        break;
    case CMD_SPAWN:
        SpawnItem();
        break;
    case CMD_TELEPORT:
        TeleportPlayer();
        break;
}
```

> **Hinweis:** Es gibt kein `const` für Referenztypen (Objekte). Sie können eine Objektreferenz nicht unveränderlich machen.

---

## Präprozessor-Direktiven

Der Enforce Script Präprozessor läuft vor der Kompilierung und ermöglicht bedingte Code-Einbindung. Er funktioniert ähnlich wie der C/C++-Präprozessor, aber mit weniger Funktionen.

### #ifdef / #ifndef / #endif

Code bedingt einschließen, basierend darauf, ob ein Symbol definiert ist:

```c
// Code nur einschließen, wenn DEVELOPER definiert ist
#ifdef DEVELOPER
    Print("[DEBUG] Diagnose aktiviert");
#endif

// Code nur einschließen, wenn ein Symbol NICHT definiert ist
#ifndef SERVER
    // Nur-Client-Code
    CreateClientUI();
#endif

// If-Else-Muster
#ifdef SERVER
    Print("Läuft auf dem Server");
#else
    Print("Läuft auf dem Client");
#endif
```

### #define

Eigene Symbole definieren (kein Wert — nur Existenz):

```c
#define MY_MOD_DEBUG

#ifdef MY_MOD_DEBUG
    Print("Debug-Modus aktiv");
#endif
```

> **Hinweis:** Enforce Scripts `#define` erzeugt nur Existenz-Flags. Es unterstützt **keine** Makro-Substitution (kein `#define MAX_HP 100` — verwenden Sie stattdessen `const`).

### Gängige Engine-Defines

DayZ stellt diese eingebauten Defines basierend auf Build-Typ und Plattform bereit:

| Define | Wann verfügbar | Verwendung |
|--------|---------------|---------|
| `SERVER` | Läuft auf dediziertem Server | Nur-Server-Logik |
| `DEVELOPER` | Entwickler-Build von DayZ | Nur-Entwickler-Funktionen |
| `DIAG_DEVELOPER` | Diagnose-Build | Diagnosemenüs, Debug-Werkzeuge |
| `PLATFORM_WINDOWS` | Windows-Plattform | Plattformspezifische Pfade |
| `PLATFORM_XBOX` | Xbox-Plattform | Konsolenspezifische UI |
| `PLATFORM_PS4` | PlayStation-Plattform | Konsolenspezifische Logik |
| `BUILD_EXPERIMENTAL` | Experimenteller Branch | Experimentelle Funktionen |

```c
void InitPlatform()
{
    #ifdef PLATFORM_WINDOWS
        Print("Läuft auf Windows");
    #endif

    #ifdef PLATFORM_XBOX
        Print("Läuft auf Xbox");
    #endif

    #ifdef PLATFORM_PS4
        Print("Läuft auf PlayStation");
    #endif
}
```

### Eigene Defines über config.cpp

Mods können eigene Symbole in `config.cpp` über das `defines[]`-Array definieren. Diese sind für alle Skripte verfügbar, die nach diesem Mod geladen werden:

```cpp
class CfgMods
{
    class MyMod_MissionSystem
    {
        // ...
        defines[] = { "MY_MISSIONS_LOADED" };
        // ...
    };
};
```

Nun können andere Mods erkennen, ob Ihr Missions-Mod geladen ist:

```c
#ifdef MY_MISSIONS_LOADED
    // Missions-Mod ist geladen — seine API verwenden
    MyMissionManager.Start();
#else
    // Missions-Mod ist nicht geladen — überspringen oder Fallback verwenden
    Print("Missionssystem nicht erkannt");
#endif
```

---

## Praxisbeispiele

### Plattformspezifischer Code

```c
string GetSavePath()
{
    #ifdef PLATFORM_WINDOWS
        return "$profile:MyMod/saves/";
    #else
        return "$saves:MyMod/";
    #endif
}
```

### Optionale Mod-Abhängigkeiten

Dies ist das Standardmuster für Mods, die optional mit anderen Mods integriert werden:

```c
class MyModManager
{
    void Init()
    {
        Print("[MyMod] Initialisierung...");

        // Kernfunktionen immer verfügbar
        LoadConfig();
        RegisterRPCs();

        // Optionale Integration mit MyFramework
        #ifdef MY_FRAMEWORK
            Print("[MyMod] Framework erkannt — verwende einheitliches Logging");
            RegisterWithCore();
        #endif

        // Optionale Integration mit Community Framework
        #ifdef JM_CommunityFramework
            GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);
        #endif
    }
}
```

### Nur-Debug-Diagnosen

```c
void ProcessAI(DayZInfected zombie)
{
    vector pos = zombie.GetPosition();
    float health = zombie.GetHealth("", "Health");

    // Aufwändiges Debug-Logging — nur in Diagnose-Builds
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI] Zombie %1 bei %2, HP: %3",
            zombie.GetType(), pos.ToString(), health.ToString()));

        // Debug-Kugel zeichnen (funktioniert nur in Diag-Builds)
        Debug.DrawSphere(pos, 1.0, Colors.RED, ShapeFlags.ONCE);
    #endif

    // Eigentliche Logik läuft in allen Builds
    if (health <= 0)
    {
        HandleZombieDeath(zombie);
    }
}
```

### Server- vs. Client-Logik

```c
class MissionHandler
{
    void OnMissionStart()
    {
        #ifdef SERVER
            // Server: Missionsdaten laden, Objekte spawnen
            LoadMissionData();
            SpawnMissionObjects();
            NotifyAllPlayers();
        #else
            // Client: UI einrichten, auf Ereignisse abonnieren
            CreateMissionHUD();
            RegisterClientRPCs();
        #endif
    }
}
```

---

## Best Practices

- Fügen Sie einen `COUNT`-Sentinel-Wert als letzten Enum-Eintrag hinzu, um einfach zu iterieren oder Bereiche zu validieren (z.B. `for (int i = 0; i < EMode.COUNT; i++)`).
- Verwenden Sie Zweierpotenz-Werte für Bitflag-Enums und kombinieren Sie sie mit `|`; testen Sie mit `&`; entfernen Sie mit `& ~FLAG`.
- Verwenden Sie `const` anstelle von `#define` für numerische Konstanten -- Enforce Scripts `#define` erzeugt nur Existenz-Flags, keine Wertmakros.
- Definieren Sie ein `defines[]`-Array in der `config.cpp` Ihres Mods, um Mod-übergreifende Erkennungssymbole bereitzustellen (z.B. `"STARDZ_CORE"`).
- Validieren Sie Enum-Werte, die aus externen Daten geladen werden (Configs, RPCs), immer — Enforce Script akzeptiert jeden `int` als Enum ohne Bereichsprüfung.

---

## In echten Mods beobachtet

> Muster, die durch das Studium professioneller DayZ-Mod-Quellcodes bestätigt wurden.

| Muster | Mod | Detail |
|---------|-----|--------|
| `#ifdef` für optionale Mod-Integration | Expansion / COT | Prüft `#ifdef JM_CF` oder `#ifdef EXPANSIONMOD` vor dem Aufruf von Mod-übergreifenden APIs |
| Bitflag-Enums für Spawn-Optionen | Vanilla DayZ | `ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS` usw. kombiniert mit `\|` für `CreateObjectEx` |
| `typename.EnumToString` für Logging | Expansion / Dabs | Schadenszustände und Ereignistypen werden als lesbare Strings statt roher Ints geloggt |
| `defines[]` in config.cpp | StarDZ Core / Expansion | Jeder Mod deklariert sein eigenes Symbol, damit andere Mods es mit `#ifdef` erkennen können |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|--------|---------|
| Enum-Zuweisungsvalidierung | Compiler sollte ungültige Werte ablehnen | `EDamageState state = 999` kompiliert problemlos -- keinerlei Bereichsprüfung |
| `#define MAX_HP 100` | Funktioniert wie C/C++-Makro | Enforce Scripts `#define` erzeugt nur Existenz-Flags; verwenden Sie `const int` für Werte |
| `switch`-Case-Staplung | Mehrere Cases teilen einen Handler | Kein Fall-Through in Enforce Script -- jeder `case` ist unabhängig; verwenden Sie stattdessen `if`/`\|\|` |

---

## Häufige Fehler

### 1. Enums als validierte Typen verwenden

```c
// PROBLEM — keine Validierung, jeder int wird akzeptiert
EDamageState state = 999;  // Kompiliert einwandfrei, aber 999 ist kein gültiger Zustand

// LÖSUNG — manuell validieren, wenn aus externen Daten geladen wird
int rawValue = LoadFromConfig();
if (rawValue >= 0 && rawValue <= EDamageState.RUINED)
{
    EDamageState state = rawValue;
}
```

### 2. Versuch, #define für Wert-Substitution zu verwenden

```c
// FALSCH — Enforce Script #define unterstützt KEINE Werte
#define MAX_HEALTH 100
int hp = MAX_HEALTH;  // Kompilierungsfehler!

// RICHTIG — stattdessen const verwenden
const int MAX_HEALTH = 100;
int hp = MAX_HEALTH;
```

### 3. Falsch verschachtelte #ifdef

```c
// RICHTIG — verschachtelte ifdefs sind in Ordnung
#ifdef SERVER
    #ifdef MY_FRAMEWORK
        MyLog.Info("MyMod", "Server + Core");
    #endif
#endif

// FALSCH — fehlendes #endif verursacht mysteriöse Kompilierungsfehler
#ifdef SERVER
    DoServerStuff();
// #endif hier vergessen!
```

### 4. Vergessen, dass switch/case keinen Fall-Through hat

```c
// In C/C++ fallen Cases ohne break durch.
// In Enforce Script ist jeder Case UNABHÄNGIG — kein Fall-Through.

switch (state)
{
    case EDamageState.PRISTINE:
    case EDamageState.WORN:
        Print("Guter Zustand");  // Wird nur für WORN erreicht, nicht für PRISTINE!
        break;
}
```

Wenn mehrere Cases die gleiche Logik teilen sollen, verwenden Sie if/else:

```c
if (state == EDamageState.PRISTINE || state == EDamageState.WORN)
{
    Print("Guter Zustand");
}
```

---

## Zusammenfassung

### Enums

| Funktion | Syntax |
|---------|--------|
| Deklarieren | `enum EName { A = 0, B = 1 };` |
| Implizit | `enum EName { A, B, C };` (0, 1, 2) |
| Erben | `enum EChild : EParent { D, E };` |
| Zu String | `typename.EnumToString(EName, value)` |
| Von String | `typename.StringToEnum(EName, "A", out val)` |
| Bitflag kombinieren | `flags = A | B` |
| Bitflag testen | `if (flags & A)` |

### Präprozessor

| Direktive | Zweck |
|-----------|---------|
| `#ifdef SYMBOL` | Kompilieren, wenn Symbol existiert |
| `#ifndef SYMBOL` | Kompilieren, wenn Symbol NICHT existiert |
| `#else` | Alternativer Zweig |
| `#endif` | Bedingten Block beenden |
| `#define SYMBOL` | Ein Symbol definieren (kein Wert) |

### Wichtige Defines

| Define | Bedeutung |
|--------|---------|
| `SERVER` | Dedizierter Server |
| `DEVELOPER` | Entwickler-Build |
| `DIAG_DEVELOPER` | Diagnose-Build |
| `PLATFORM_WINDOWS` | Windows-Betriebssystem |
| Eigenes: `defines[]` | config.cpp Ihres Mods |

---

## Navigation

| Zurück | Hoch | Weiter |
|----------|----|------|
| [1.9 Casting & Reflection](09-casting-reflection.md) | [Teil 1: Enforce Script](../README.md) | [1.11 Fehlerbehandlung](11-error-handling.md) |
