# Kapitel 2.1: Die 5-Schichten-Skript-Hierarchie

[Startseite](../../README.md) | **Die 5-Schichten-Skript-Hierarchie** | [Weiter: config.cpp im Detail >>](02-config-cpp.md)

---

## Inhaltsverzeichnis

- [Überblick](#überblick)
- [Der Schichtenstapel](#der-schichtenstapel)
- [Schicht 1: 1_Core (engineScriptModule)](#schicht-1-1_core-enginescriptmodule)
- [Schicht 2: 2_GameLib (gameLibScriptModule)](#schicht-2-2_gamelib-gamelibscriptmodule)
- [Schicht 3: 3_Game (gameScriptModule)](#schicht-3-3_game-gamescriptmodule)
- [Schicht 4: 4_World (worldScriptModule)](#schicht-4-4_world-worldscriptmodule)
- [Schicht 5: 5_Mission (missionScriptModule)](#schicht-5-5_mission-missionscriptmodule)
- [Die kritische Regel](#die-kritische-regel)
- [Ladereihenfolge und Timing](#ladereihenfolge-und-timing)
- [Wann der Code jeder Schicht ausgeführt wird](#wann-der-code-jeder-schicht-ausgeführt-wird)
- [Praktische Richtlinien](#praktische-richtlinien)
- [Schnelle Entscheidungshilfe](#schnelle-entscheidungshilfe)
- [Häufige Fehler](#häufige-fehler)

---

## Überblick

Die DayZ-Engine kompiliert Skripte in fünf verschiedenen Durchläufen, die **Script-Module** genannt werden. Jedes Modul entspricht einem nummerierten Ordner im `Scripts/`-Verzeichnis Ihrer Mod:

```
Scripts/
  1_Core/          --> engineScriptModule
  2_GameLib/       --> gameLibScriptModule
  3_Game/          --> gameScriptModule
  4_World/         --> worldScriptModule
  5_Mission/       --> missionScriptModule
```

Jede Schicht baut auf den vorherigen auf. Die Nummern sind nicht willkürlich -- sie definieren eine strikte Kompilierungs- und Abhängigkeitsreihenfolge, die von der Engine durchgesetzt wird.

---

## Der Schichtenstapel

```
+---------------------------------------------------------------+
|                                                               |
|   5_Mission   (missionScriptModule)                           |
|   UI, HUD, Mission-Lebenszyklus, Menüscreens                |
|   Kann referenzieren: alles darunter (1-4)                    |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   4_World     (worldScriptModule)                             |
|   Entitäten, Items, Fahrzeuge, Manager, Gameplay-Logik       |
|   Kann referenzieren: 1_Core, 2_GameLib, 3_Game               |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   3_Game      (gameScriptModule)                              |
|   Configs, RPC-Registrierung, Datenklassen, Eingabe-Bindungen |
|   Kann referenzieren: 1_Core, 2_GameLib                       |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   2_GameLib   (gameLibScriptModule)                           |
|   Low-Level-Engine-Bindungen (selten von Mods genutzt)        |
|   Kann referenzieren: nur 1_Core                              |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   1_Core      (engineScriptModule)                            |
|   Grundlegende Typen, Konstanten, reine Hilfsfunktionen       |
|   Kann referenzieren: nichts (dies ist das Fundament)         |
|                                                               |
+---------------------------------------------------------------+

        KOMPILIERUNGSREIHENFOLGE: 1 --> 2 --> 3 --> 4 --> 5
        ABHAENGIGKEITSRICHTUNG: nur aufwärts (untere können obere nicht sehen)
```

---

## Schicht 1: 1_Core (engineScriptModule)

### Zweck

Das absolute Fundament. Code hier läuft auf Engine-Ebene, bevor Spielsysteme existieren. Dies ist der früheste Punkt, an dem Mod-Code ausgeführt werden kann.

### Was hierhin gehört

- Konstanten und Enums, die über alle Schichten geteilt werden
- Reine Hilfsfunktionen (Mathe-Helfer, String-Utilities)
- Logging-Infrastruktur (der Logger selbst, nicht was geloggt wird)
- Präprozessor-Defines und Typedefs
- Basisklassen-Definitionen, die überall sichtbar sein müssen

### Praxisbeispiele

**Community Framework** platziert sein Kernmodulsystem hier:

```c
// 1_Core/CF_ModuleCoreManager.c
class CF_ModuleCoreManager
{
    static ref array<typename> s_Modules = new array<typename>;

    static void _Insert(typename module)
    {
        s_Modules.Insert(module);
    }
};
```

**MyFramework** platziert seine Logging-Konstanten hier:

```c
// 1_Core/MyLogLevel.c
enum MyLogLevel
{
    TRACE = 0,
    DEBUG = 1,
    INFO  = 2,
    WARN  = 3,
    ERROR = 4
};
```

### Wann verwenden

Verwenden Sie `1_Core` nur, wenn Sie etwas benötigen, das **allen** anderen Schichten zur Verfügung steht, und es keinerlei Abhängigkeit von Spieltypen wie `PlayerBase`, `ItemBase` oder `MissionBase` hat. Die meisten Mods benötigen diese Schicht überhaupt nicht.

---

## Schicht 2: 2_GameLib (gameLibScriptModule)

### Zweck

Low-Level-Engine-Bibliotheksbindungen. Diese Schicht existiert in der Vanilla-Skript-Hierarchie, wird aber **selten von Mods verwendet**. Sie sitzt zwischen der rohen Engine und der Spiellogik.

### Was hierhin gehört

- Engine-Level-Abstraktionen (Rendering, Sound-Engine-Bindungen)
- Mathematische Bibliotheken über das hinaus, was `1_Core` bietet
- Basis-Widget/UI-Engine-Typen

### Praxisbeispiele

**DabsFramework** ist eine der wenigen Mods, die diese Schicht verwenden:

```c
// 2_GameLib/DabsFramework/MVC/ScriptView.c
// Low-Level-View-Binding-Infrastruktur
class ScriptView : ScriptedWidgetEventHandler
{
    // ...
};
```

### Wann verwenden

Fast nie. Sofern Sie kein Framework bauen, das Engine-Level-Bindungen unterhalb der Spielschicht benötigt, überspringen Sie `2_GameLib` komplett. Die überwiegende Mehrheit der Mods verwendet nur die Schichten 3, 4 und 5.

---

## Schicht 3: 3_Game (gameScriptModule)

### Zweck

Die Arbeitstier-Schicht für Konfiguration, Datendefinitionen und Systeme, die nicht direkt mit Weltentitäten interagieren. Dies ist die erste Schicht, in der Spieltypen verfügbar sind.

### Was hierhin gehört

- Konfigurationsklassen (Einstellungen, die geladen/gespeichert werden können)
- RPC-Registrierung und Identifikatoren
- Datenklassen und DTOs (Data Transfer Objects)
- Eingabe-Bindungs-Registrierung
- Plugin-/Modul-Registrierungssysteme
- Geteilte Enums und Konstanten, die von Spieltypen abhängen
- Eigene Tastenbelegungs-Handler

### Praxisbeispiele

**MyFramework**-Konfigurationssystem:

```c
// 3_Game/MyMod/Config/MyConfigBase.c
class MyConfigBase
{
    // Basiskonfiguration mit automatischer JSON-Persistenz
    void Load();
    void Save();
    string GetConfigPath();
};
```

**COT** definiert seine RPC-Identifikatoren hier:

```c
// 3_Game/COT/RPCData.c
class JMRPCData
{
    static const int WEATHER_SET  = 0x1001;
    static const int PLAYER_HEAL  = 0x1002;
    // ...
};
```

**VPP Admin Tools** registriert seine Chat-Befehle:

```c
// 3_Game/VPPAdminTools/ChatCommands/ChatCommandBase.c
class ChatCommandBase
{
    string GetCommand();
    bool Execute(PlayerIdentity sender, array<string> args);
};
```

### Wann verwenden

**Im Zweifel in `3_Game` platzieren.** Dies ist die Standard-Schicht für den meisten Nicht-Entitäten-Code. Konfigurationsklassen, Enums, Konstanten, RPC-Definitionen, Datenklassen -- gehören alle hierhin.

---

## Schicht 4: 4_World (worldScriptModule)

### Zweck

Gameplay-Logik, die mit der 3D-Welt interagiert. Diese Schicht hat Zugriff auf Entitäten, Items, Fahrzeuge, Gebäude und alle Weltobjekte.

### Was hierhin gehört

- Eigene Items und Waffen (Erweiterung von `ItemBase`, `Weapon_Base`)
- Eigene Entitäten (Erweiterung von `Building`, `DayZAnimal`, etc.)
- Welt-Manager (Spawn-Systeme, Loot-Manager, KI-Direktoren)
- Spieler-Erweiterungen (gemoddes `PlayerBase`-Verhalten)
- Fahrzeug-Anpassung
- Aktionssysteme (Erweiterung von `ActionBase`)
- Triggerzonen und Flächeneffekte

### Praxisbeispiele

**MyMissions-Mod** spawnt Missionsmarker in der Welt:

```c
// 4_World/Missions/MyMissionMarker.c
class MyMissionMarker : House
{
    void MyMissionMarker()
    {
        SetFlags(EntityFlags.VISIBLE, true);
    }

    void SetPosition(vector pos)
    {
        SetPosition(pos);
    }
};
```

**MyAI-Mod** implementiert Bot-Entitäten hier:

```c
// 4_World/AI/MyAIBot.c
class MyAIBot : SurvivorBase
{
    protected ref MyAIBrain m_Brain;

    override void EOnInit(IEntity other, int extra)
    {
        super.EOnInit(other, extra);
        m_Brain = new MyAIBrain(this);
    }
};
```

**Vanilla DayZ** definiert alle Items hier:

```c
// 4_World/Entities/ItemBase/Edible_Base.c
class Edible_Base extends ItemBase
{
    // Alle Nahrungsmittel-Items erben hiervon
};
```

### Wann verwenden

Alles, was die physische Spielwelt berührt: Entitäten erstellen, Items modifizieren, Spieler-Interaktionen behandeln, Weltzustand verwalten. Wenn Ihre Klasse `EntityAI`, `ItemBase`, `PlayerBase`, `Building` erweitert oder mit `GetGame().GetWorld()` interagiert, gehört sie in `4_World`.

---

## Schicht 5: 5_Mission (missionScriptModule)

### Zweck

Die höchste Schicht. Mission-Lebenszyklus, UI-Panels, HUD-Overlays und der letzte Initialisierungspunkt. Hier lebt der clientseitige und serverseitige Startcode.

### Was hierhin gehört

- Mission-Klassen-Hooks (`MissionServer`-, `MissionGameplay`-Overrides)
- HUD- und UI-Panels
- Menüscreens
- Mod-Registrierung und Initialisierung (die "Boot"-Sequenz)
- Clientseitige Rendering-Overlays
- Server-Start-/Shutdown-Handler

### Praxisbeispiele

**MyFramework** klinkt sich in die Mission ein, um alle Subsysteme zu initialisieren:

```c
// 5_Mission/MyMod/MyModMissionClient.c
modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        MyFramework.Init();
    }

    override void OnMissionFinish()
    {
        MyFramework.ShutdownAll();
        super.OnMissionFinish();
    }
};
```

**COT** fügt hier sein Admin-Menü hinzu:

```c
// 5_Mission/COT/gui/COT_Menu.c
class COT_Menu : UIScriptedMenu
{
    override Widget Init()
    {
        // Admin-Panel-UI aufbauen
    }
};
```

**MyMissions-Mod** registriert sich bei Core:

```c
// 5_Mission/Missions/MyMissionsRegister.c
class MyMissionsRegister
{
    void MyMissionsRegister()
    {
        MyFramework.RegisterMod("Missions", "1.0.0");
        MyFramework.RegisterModConfig(new MyMissionsConfig());
    }
};
```

### Wann verwenden

UI, HUD, Menüscreens und Mod-Initialisierung, die davon abhängt, dass die Mission aktiv ist. Auch der letzte Ort, an dem der Server sich in den Start-/Shutdown-Lebenszyklus einklinkt.

---

## Die kritische Regel

> **Untere Schichten KOENNEN NICHT auf Typen aus höheren Schichten referenzieren.**

Dies ist die wichtigste Einzelregel in der DayZ-Skript-Architektur. Die Engine setzt dies zur Kompilierzeit durch.

```
ERLAUBT:
  5_Mission-Code referenziert eine Klasse aus 4_World       OK
  4_World-Code referenziert eine Klasse aus 3_Game           OK
  3_Game-Code referenziert eine Klasse aus 1_Core            OK

VERBOTEN:
  3_Game-Code referenziert eine Klasse aus 4_World           KOMPILIERFEHLER
  4_World-Code referenziert eine Klasse aus 5_Mission        KOMPILIERFEHLER
  1_Core-Code referenziert eine Klasse aus 3_Game            KOMPILIERFEHLER
```

### Warum das existiert

Jede Schicht wird separat und sequentiell kompiliert. Wenn `3_Game` kompiliert wird, existieren `4_World` und `5_Mission` noch nicht. Der Compiler hat keine Kenntnis dieser Typen.

### Was passiert, wenn Sie dagegen verstossen

Die Fehlermeldung ist oft wenig hilfreich:

```
SCRIPT (E): Undefined type 'PlayerBase'
```

Dies bedeutet typischerweise, dass Sie Code in `3_Game` platziert haben, der `PlayerBase` referenziert, das in `4_World` definiert ist. Die Lösung ist, Ihren Code nach `4_World` oder höher zu verschieben.

### Der Workaround: Casting über Basistypen

Wenn `3_Game`-Code ein Objekt behandeln muss, das zur Laufzeit ein `PlayerBase` sein wird, verwenden Sie den Basistyp `Object` oder `Man` (definiert in `3_Game`) und casten Sie später:

```c
// In 3_Game -- wir können PlayerBase nicht direkt referenzieren
class MyConfig
{
    void HandlePlayer(Man player)
    {
        // 'Man' ist in 3_Game verfügbar
        // Zur Laufzeit wird dies ein PlayerBase sein, aber wir können es hier nicht benennen
    }
};

// In 4_World -- jetzt können wir sicher casten
class MyWorldLogic
{
    void ProcessPlayer(Man player)
    {
        PlayerBase pb;
        if (Class.CastTo(pb, player))
        {
            // Jetzt haben wir vollen PlayerBase-Zugriff
        }
    }
};
```

---

## Ladereihenfolge und Timing

### Kompilierungsreihenfolge

Die Engine kompiliert die Skripte aller Mods für jede Schicht, bevor sie zur nächsten Schicht übergeht:

```
Schritt 1: Alle 1_Core-Skripte aller Mods kompilieren
Schritt 2: Alle 2_GameLib-Skripte aller Mods kompilieren
Schritt 3: Alle 3_Game-Skripte aller Mods kompilieren
Schritt 4: Alle 4_World-Skripte aller Mods kompilieren
Schritt 5: Alle 5_Mission-Skripte aller Mods kompilieren
```

Innerhalb jedes Schrittes werden Mods nach ihrer `requiredAddons`-Abhängigkeitskette in `config.cpp` geordnet. Wenn ModB von ModA abhängt, werden ModA's Skripte für diese Schicht zuerst kompiliert.

### Initialisierungsreihenfolge

Nach der Kompilierung folgt die Laufzeit-Initialisierung einer anderen Abfolge:

```
1. Engine startet, lädt Configs
2. 1_Core-Skripte sind verfügbar (statische Konstruktoren laufen)
3. 2_GameLib-Skripte sind verfügbar
4. 3_Game-Skripte sind verfügbar
   --> CfgMods-Einstiegsfunktionen laufen (z.B. "CreateGameMod")
   --> Eingabe-Bindungen registrieren
5. 4_World-Skripte sind verfügbar
   --> Entitäten können erstellt werden
6. Mission wird geladen
7. 5_Mission-Skripte sind verfügbar
   --> MissionServer.OnInit() / MissionGameplay.OnInit() feuern
   --> UI und HUD werden verfügbar
```

---

## Wann der Code jeder Schicht ausgeführt wird

| Schicht | Statische Init | Laufzeit bereit | Schlüssel-Event |
|-------|------------|---------------|-----------|
| `1_Core` | Erste | Sofort | Engine-Start |
| `2_GameLib` | Zweite | Nach Engine-Init | Engine-Subsysteme bereit |
| `3_Game` | Dritte | Nach Spiel-Init | `CreateGame()` / eigene Einstiegsfunktion |
| `4_World` | Vierte | Nach Welt-Ladung | Entitäten beginnen zu spawnen |
| `5_Mission` | Fünfte (letzte) | Nach Mission-Start | `MissionServer.OnInit()` / `MissionGameplay.OnInit()` |

**Wichtig:** Statische Variablen und Code auf globaler Ebene in jeder Schicht werden während der Kompilierungs-/Linking-Phase ausgeführt, bevor `OnInit()` jemals aufgerufen wird. Platzieren Sie keine komplexe Initialisierungslogik in statischen Initialisierern.

---

## Praktische Richtlinien

### "Im Zweifel in 3_Game platzieren"

Dies ist die häufigste Schicht für Mod-Code. Es sei denn, Ihr Code:
- Muss verfügbar sein, bevor Spieltypen existieren --> `1_Core`
- Erweitert eine Entität/Item/Fahrzeug/Spieler --> `4_World`
- Berührt UI, HUD oder Mission-Lebenszyklus --> `5_Mission`

...gehört er in `3_Game`.

### Die Schichten-Checkliste

Bevor Sie eine Datei platzieren, stellen Sie diese Fragen:

1. **Erweitert sie `EntityAI`, `ItemBase`, `PlayerBase`, `Building` oder eine andere Welt-Entität?**
   In `4_World` platzieren.

2. **Referenziert sie `MissionServer`, `MissionGameplay` oder erstellt UI-Widgets?**
   In `5_Mission` platzieren.

3. **Ist es eine reine Datenklasse, Config, Enum oder RPC-Definition?**
   In `3_Game` platzieren.

4. **Ist es eine fundamentale Konstante oder ein Utility ohne Spiel-Abhängigkeiten?**
   In `1_Core` platzieren.

5. **Nichts davon?**
   Standard ist `3_Game`.

### Schichten schlank halten

Ein häufiger Fehler ist, alles in `4_World` zu packen. Dies erzeugt eng gekoppelten Code. Stattdessen:

```
GUT:
  3_Game/  --> Config-Klasse, Enums, RPC-IDs, Datenstrukturen
  4_World/ --> Manager der die Config verwendet, Entitätsklassen
  5_Mission/ --> UI die Manager-Zustand anzeigt

SCHLECHT:
  4_World/ --> Config, Enums, RPCs, Manager UND Entitätsklassen alles zusammengemischt
```

---

## Schnelle Entscheidungshilfe

```
                    Erweitert es eine Welt-Entität?
                          (EntityAI, ItemBase, etc.)
                         /                    \
                        JA                   NEIN
                        |                      |
                    4_World              Berührt es UI/HUD/Mission?
                                        /                    \
                                       JA                   NEIN
                                       |                      |
                                   5_Mission          Ist es ein reines Utility
                                                      ohne Spiel-Abhängigkeiten?
                                                      /                \
                                                     JA               NEIN
                                                     |                  |
                                                  1_Core            3_Game
```

---

## Häufige Fehler

### 1. PlayerBase aus 3_Game referenzieren

```c
// FALSCH: in 3_Game/MyConfig.c
class MyConfig
{
    void ApplyToPlayer(PlayerBase player)  // FEHLER: PlayerBase noch nicht definiert
    {
    }
};

// RICHTIG: in 3_Game/MyConfig.c
class MyConfig
{
    ref array<float> m_Values;  // Reine Daten, keine Entitäts-Referenzen
};

// RICHTIG: in 4_World/MyManager.c
class MyManager
{
    void ApplyConfig(PlayerBase player, MyConfig config)
    {
        // Jetzt können wir beides verwenden
    }
};
```

### 2. UI-Code in 4_World platzieren

```c
// FALSCH: in 4_World/MyPanel.c
class MyPanel : UIScriptedMenu  // UIScriptedMenu funktioniert in 4_World,
{                                // aber MissionGameplay-Hooks sind in 5_Mission
    // Dies wird Probleme verursachen beim Versuch, die UI zu registrieren
};

// RICHTIG: in 5_Mission/MyPanel.c
class MyPanel : UIScriptedMenu
{
    // UI gehört in 5_Mission, wo der Mission-Lebenszyklus verfügbar ist
};
```

### 3. Konstanten in 4_World platzieren, wenn 3_Game sie braucht

```c
// FALSCH: Konstanten in 4_World definiert
// 4_World/MyConstants.c
const int MY_RPC_ID = 12345;

// 3_Game/MyRPCHandler.c
class MyRPCHandler
{
    void Register()
    {
        // FEHLER: MY_RPC_ID hier nicht sichtbar (in höherer Schicht definiert)
    }
};

// RICHTIG: Konstanten in 3_Game definiert (oder 1_Core)
// 3_Game/MyConstants.c
const int MY_RPC_ID = 12345;  // Jetzt sichtbar für 3_Game UND 4_World UND 5_Mission
```

### 4. Überkomplizierung mit 1_Core

Wenn Ihre "Konstanten" einen Spieltyp referenzieren, können sie nicht in `1_Core` platziert werden. Selbst etwas wie `const string PLAYER_CONFIG_PATH` ist in `1_Core` in Ordnung, aber eine Klasse, die einen `CGame`-Parameter nimmt, ist es nicht.

---

## Zusammenfassung

| Schicht | Ordner | Config-Eintrag | Primäre Verwendung | Häufigkeit |
|-------|--------|-------------|-------------|-----------|
| 1 | `1_Core/` | `engineScriptModule` | Konstanten, Utilities, Logging-Basis | Selten |
| 2 | `2_GameLib/` | `gameLibScriptModule` | Engine-Bindungen | Sehr selten |
| 3 | `3_Game/` | `gameScriptModule` | Configs, RPCs, Datenklassen | **Am häufigsten** |
| 4 | `4_World/` | `worldScriptModule` | Entitäten, Items, Manager | Häufig |
| 5 | `5_Mission/` | `missionScriptModule` | UI, HUD, Mission-Hooks | Häufig |

**Merke:** Untere Schichten können obere Schichten nicht sehen. Im Zweifel `3_Game` verwenden. Code nur nach oben verschieben, wenn Sie Zugriff auf Typen benötigen, die in einer höheren Schicht definiert sind.

---

**Weiter:** [Kapitel 2.2: config.cpp im Detail](02-config-cpp.md)
