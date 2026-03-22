# Kapitel 2.5: Bewährte Praktiken der Dateiorganisation

[Startseite](../README.md) | [<< Zurück: Minimaler funktionsfähiger Mod](04-minimum-viable-mod.md) | **Dateiorganisation** | [Weiter: Server- vs. Client-Architektur >>](06-server-client-split.md)

---

> **Zusammenfassung:** Wie Sie Dateien organisieren, bestimmt, ob Ihr Mod mit 10 oder 1.000 Dateien wartbar ist. Dieses Kapitel behandelt die kanonische Verzeichnisstruktur, Namenskonventionen, Inhalt- vs. Script- vs. Framework-Mods, Client-Server-Aufspaltungen und Lektionen aus professionellen DayZ-Mods.

---

## Inhaltsverzeichnis

- [Die kanonische Verzeichnisstruktur](#die-kanonische-verzeichnisstruktur)
- [Namenskonventionen](#namenskonventionen)
- [Drei Typen von Mods](#drei-typen-von-mods)
- [Client-Server-Split-Mods](#client-server-split-mods)
- [Was gehört wohin](#was-gehört-wohin)
- [PBO-Benennung und @mod-Ordnerbenennung](#pbo-benennung-und-mod-ordnerbenennung)
- [Echte Beispiele aus professionellen Mods](#echte-beispiele-aus-professionellen-mods)
- [Anti-Muster](#anti-muster)

---

## Die kanonische Verzeichnisstruktur

Dies ist das Standardlayout, das von professionellen DayZ-Mods verwendet wird. Nicht jeder Ordner ist erforderlich -- erstellen Sie nur das, was Sie brauchen.

```
MyMod/                                    <-- Projektstamm (Entwicklung)
  mod.cpp                                 <-- Launcher-Metadaten
  stringtable.csv                         <-- Lokalisierung (im Mod-Stamm, NICHT in Scripts/)

  Scripts/                                <-- Script-PBO-Stamm
    config.cpp                            <-- CfgPatches + CfgMods + Script-Modul-Definitionen
    Inputs.xml                            <-- Benutzerdefinierte Tastenbelegungen (optional)
    Data/
      Credits.json                        <-- Autoren-Credits
      Version.hpp                         <-- Versionsstring (optional)

    1_Core/                               <-- engineScriptModule (selten)
      MyMod/
        Constants.c

    3_Game/                               <-- gameScriptModule
      MyMod/
        MyModConfig.c                     <-- Konfigurationsklasse
        MyModRPCs.c                       <-- RPC-Bezeichner / Registrierung
        Data/
          SomeDataClass.c                 <-- Reine Datenstrukturen

    4_World/                              <-- worldScriptModule
      MyMod/
        Entities/
          MyCustomItem.c                  <-- Benutzerdefinierte Items
          MyCustomVehicle.c
        Managers/
          MyModManager.c                  <-- Welt-bewusste Manager
        Actions/
          ActionMyCustom.c                <-- Benutzerdefinierte Spieleraktionen

    5_Mission/                            <-- missionScriptModule
      MyMod/
        MyModRegister.c                   <-- Mod-Registrierung (Start-Hook)
        GUI/
          MyModPanel.c                    <-- UI-Panel-Skripte
          MyModHUD.c                      <-- HUD-Overlay-Skripte

  GUI/                                    <-- GUI-PBO-Stamm (getrennt von Scripts)
    config.cpp                            <-- GUI-spezifische Config (ImageSets, Styles)
    layouts/                              <-- .layout-Dateien
      mymod_panel.layout
      mymod_hud.layout
    imagesets/                            <-- .imageset-Dateien + Textur-Atlanten
      mymod_icons.imageset
      mymod_icons.edds
    looknfeel/                            <-- .styles-Dateien
      mymod.styles

  Data/                                   <-- Daten-PBO-Stamm (Modelle, Texturen, Items)
    config.cpp                            <-- CfgVehicles, CfgWeapons, usw.
    Models/
      my_item.p3d                         <-- 3D-Modelle
    Textures/
      my_item_co.paa                      <-- Farbtexturen
      my_item_nohq.paa                    <-- Normalmaps
    Materials/
      my_item.rvmat                       <-- Materialdefinitionen

  Sounds/                                 <-- Sound-Dateien
    alert.ogg                             <-- Audiodateien (immer .ogg)
    ambient.ogg

  ServerFiles/                            <-- Dateien für Server-Administratoren zum Kopieren
    types.xml                             <-- Central-Economy-Spawn-Definitionen
    cfgspawnabletypes.xml                 <-- Attachment-Voreinstellungen
    README.md                             <-- Installationsanleitung

  Keys/                                   <-- Signaturschlüssel
    MyMod.bikey                           <-- Öffentlicher Schlüssel zur Server-Verifizierung
```

---

## Namenskonventionen

### Mod-/Projektnamen

Verwenden Sie PascalCase mit einem klaren Präfix:

```
MyFramework          <-- Framework, Präfix: MyFW_
MyMod_Missions      <-- Feature-Mod
MyMod_Weapons       <-- Inhalts-Mod
VPPAdminTools        <-- Manche Mods verzichten auf Unterstriche
DabsFramework        <-- PascalCase ohne Trennzeichen
```

### Klassennamen

Verwenden Sie ein kurzes, für Ihren Mod einzigartiges Präfix, gefolgt von einem Unterstrich und dem Klassenzweck:

```c
// MyMod-Muster: MyMod_[Subsystem]_[Name]
class MyLog             // Kern-Logging
class MyRPC             // Kern-RPC
class MyW_Config        // Waffen-Config
class MyM_MissionBase   // Missions-Basis

// CF-Muster: CF_[Name]
class CF_ModuleWorld
class CF_EventArgs

// COT-Muster: JM_COT_[Name]
class JM_COT_Menu

// VPP-Muster: [Name] (kein Präfix)
class ChatCommandBase
class WebhookManager
```

**Regeln:**
- Präfix verhindert Kollisionen mit anderen Mods
- Halten Sie es kurz (2-4 Zeichen)
- Seien Sie innerhalb Ihres Mods konsistent

### Dateinamen

Benennen Sie jede Datei nach der Hauptklasse, die sie enthält:

```
MyLog.c            <-- Enthält class MyLog
MyRPC.c            <-- Enthält class MyRPC
MyModConfig.c        <-- Enthält class MyModConfig
ActionMyCustom.c     <-- Enthält class ActionMyCustom
```

Eine Klasse pro Datei ist das Ideal. Mehrere kleine Hilfsklassen in einer Datei sind akzeptabel, wenn sie eng gekoppelt sind.

### Layout-Dateien

Verwenden Sie Kleinbuchstaben mit Ihrem Mod-Präfix:

```
my_admin_panel.layout
my_killfeed_overlay.layout
mymod_settings_dialog.layout
```

### Variablennamen

```c
// Mitgliedsvariablen: m_-Präfix
protected int m_Count;
protected ref array<string> m_Items;
protected ref MyConfig m_Config;

// Statische Variablen: s_-Präfix
static int s_InstanceCount;
static ref MyLog s_Logger;

// Konstanten: GROSSBUCHSTABEN
const int MAX_PLAYERS = 60;
const float UPDATE_INTERVAL = 0.5;
const string MOD_NAME = "MyMod";

// Lokale Variablen: camelCase (kein Präfix)
int count = 0;
string playerName = identity.GetName();
float deltaTime = timeArgs.DeltaTime;

// Parameter: camelCase (kein Präfix)
void SetConfig(MyConfig config, bool forceReload)
```

---

## Drei Typen von Mods

DayZ-Mods fallen in drei Kategorien. Jede hat einen anderen Strukturschwerpunkt.

### 1. Inhalts-Mod

Fügt Items, Waffen, Fahrzeuge, Gebäude hinzu -- primär 3D-Assets mit minimalem Scripting.

```
MyWeaponPack/
  mod.cpp
  Data/
    config.cpp                <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
    Weapons/
      MyRifle/
        MyRifle.p3d
        MyRifle_co.paa
        MyRifle_nohq.paa
        MyRifle.rvmat
    Ammo/
      MyAmmo/
        MyAmmo.p3d
  Scripts/                    <-- Minimal (existiert möglicherweise gar nicht)
    config.cpp
    4_World/
      MyWeaponPack/
        MyRifle.c             <-- Nur wenn die Waffe benutzerdefiniertes Verhalten benötigt
  ServerFiles/
    types.xml
```

**Merkmale:**
- Schwerpunkt auf `Data/` (Modelle, Texturen, Materialien)
- Schwerpunkt auf `Data/config.cpp` (CfgVehicles, CfgWeapons-Definitionen)
- Minimales oder kein Scripting
- Scripts nur, wenn Items benutzerdefiniertes Verhalten über die Config-Definition hinaus benötigen

### 2. Script-Mod

Fügt Gameplay-Features, Admin-Tools, Systeme hinzu -- primär Code mit minimalen Assets.

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

**Merkmale:**
- Schwerpunkt auf `Scripts/` (der meiste Code in 3_Game, 4_World, 5_Mission)
- GUI-Layouts und ImageSets für die UI
- Wenig oder kein `Data/` (keine 3D-Modelle)
- Hängt normalerweise von einem Framework ab (CF, DabsFramework oder einem benutzerdefinierten Framework)

### 3. Framework-Mod

Stellt gemeinsame Infrastruktur für andere Mods bereit -- Logging, RPC, Konfiguration, UI-Systeme.

```
MyFramework/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    Data/
      Credits.json
    1_Core/                     <-- Frameworks nutzen oft 1_Core
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

**Merkmale:**
- Nutzt alle Script-Schichten (1_Core bis 5_Mission)
- Tiefe Unterverzeichnis-Hierarchie in jeder Schicht
- Definiert `defines[]` für Feature-Erkennung
- Andere Mods hängen über `requiredAddons` davon ab
- Stellt Basisklassen bereit, die andere Mods erweitern

---

## Client-Server-Split-Mods

Wenn ein Mod sowohl client-sichtbares Verhalten (UI, Entity-Rendering) als auch reine Server-Logik (Spawning, KI-Gehirne, sicherer Zustand) hat, sollte er in zwei Pakete aufgeteilt werden.

### Verzeichnisstruktur

```
MyMod/                                    <-- Projektstamm (Entwicklungs-Repository)
  MyMod_Sub/                           <-- Client-Paket (geladen via -mod=)
    mod.cpp
    stringtable.csv
    Scripts/
      config.cpp                          <-- type = "mod"
      3_Game/MyMod/                       <-- Gemeinsame Datenklassen, RPCs
      4_World/MyMod/                      <-- Client-seitiges Entity-Rendering
      5_Mission/MyMod/                    <-- Client-UI, HUD
    GUI/
      layouts/
    Sounds/

  MyMod_SubServer/                     <-- Server-Paket (geladen via -servermod=)
    mod.cpp
    Scripts/
      config.cpp                          <-- type = "servermod"
      3_Game/MyModServer/                 <-- Server-seitige Datenklassen
      4_World/MyModServer/                <-- Spawning, KI-Logik, Zustandsverwaltung
      5_Mission/MyModServer/              <-- Server-Start-/Shutdown-Hooks
```

### Schlüsselregeln für Split-Mods

1. **Das Client-Paket wird von allen geladen** (Server und alle Clients via `-mod=`)
2. **Das Server-Paket wird nur vom Server geladen** (via `-servermod=`)
3. **Das Server-Paket hängt vom Client-Paket ab** (via `requiredAddons`)
4. **Nie UI-Code in das Server-Paket packen** -- Clients werden es nicht erhalten
5. **Sichere/private Logik im Server-Paket halten** -- sie wird nie an Clients gesendet

### Abhängigkeitskette

```cpp
// Client-Paket config.cpp
class CfgPatches
{
    class MyMod_Sub_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Core_Scripts" };
    };
};

// Server-Paket config.cpp
class CfgPatches
{
    class MyMod_SubServer_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Sub_Scripts", "MyMod_Core_Scripts" };
        //                                  ^^^ hängt vom Client-Paket ab
    };
};
```

### Echtes Beispiel: Missions Client-Server-Split

```
MyMod_Missions/
  MyMod_Missions/                        <-- Client (-mod=)
    mod.cpp                               type = "mod"
    Scripts/
      config.cpp                          requiredAddons: MyMod_Core_Scripts
      3_Game/MyMod_Missions/             Gemeinsame Enums, Config, RPC-IDs
      4_World/MyMod_Missions/            Missions-Marker (Client-Rendering)
      5_Mission/MyMod_Missions/          Missions-UI, Radio-HUD
    GUI/layouts/                          Missions-Panel-Layouts
    Sounds/                               Radio-Pieptöne

  MyMod_MissionsServer/                 <-- Server (-servermod=)
    mod.cpp                               type = "servermod"
    Scripts/
      config.cpp                          requiredAddons: MyMod_Scripts, MyMod_Core_Scripts
      3_Game/MyMod_MissionsServer/       Server-Config-Erweiterungen
      4_World/MyMod_MissionsServer/      Missions-Spawner, Loot-Manager
      5_Mission/MyMod_MissionsServer/    Server-Missions-Lebenszyklus
```

---

## Was gehört wohin

### Data/-Verzeichnis

Physische Assets und Item-Definitionen:

```
Data/
  config.cpp          <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
  Models/             <-- .p3d 3D-Modelldateien
  Textures/           <-- .paa, .edds Texturdateien
  Materials/          <-- .rvmat Materialdefinitionen
  Animations/         <-- .anim Animationsdateien (selten)
```

### Scripts/-Verzeichnis

Gesamter Enforce-Script-Code:

```
Scripts/
  config.cpp          <-- CfgPatches, CfgMods, Script-Modul-Definitionen
  Inputs.xml          <-- Tastenbelegungsdefinitionen
  Data/
    Credits.json      <-- Autoren-Credits
    Version.hpp       <-- Versionsstring
  1_Core/             <-- Fundamentale Konstanten und Hilfsmittel
  3_Game/             <-- Configs, RPCs, Datenklassen
  4_World/            <-- Entities, Manager, Gameplay-Logik
  5_Mission/          <-- UI, HUD, Missions-Lebenszyklus
```

### GUI/-Verzeichnis

Benutzeroberflächen-Ressourcen:

```
GUI/
  config.cpp          <-- GUI-spezifische CfgPatches (für ImageSet/Style-Registrierung)
  layouts/            <-- .layout-Dateien (Widget-Bäume)
  imagesets/          <-- .imageset-XML + .edds Textur-Atlanten
  icons/              <-- Icon-ImageSets (möglicherweise getrennt von allgemeinen ImageSets)
  looknfeel/          <-- .styles-Dateien (Widget-visuelle Eigenschaften)
  fonts/              <-- Benutzerdefinierte Schriftdateien (selten)
  sounds/             <-- UI-Sound-Dateien (Klick, Hover, usw.)
```

### Sounds/-Verzeichnis

Audiodateien:

```
Sounds/
  alert.ogg           <-- Immer .ogg-Format
  ambient.ogg
  click.ogg
```

Sound-Config (CfgSoundSets, CfgSoundShaders) gehört in `Scripts/config.cpp`, nicht in eine separate Sounds-Config.

### ServerFiles/-Verzeichnis

Dateien, die Server-Administratoren in ihren Server-Missionsordner kopieren:

```
ServerFiles/
  types.xml                   <-- Item-Spawn-Definitionen für Central Economy
  cfgspawnabletypes.xml       <-- Attachment-/Cargo-Voreinstellungen
  cfgeventspawns.xml          <-- Event-Spawn-Positionen (selten)
  README.md                   <-- Installationsanleitung
```

---

## PBO-Benennung und @mod-Ordnerbenennung

### PBO-Namen

Jede PBO bekommt einen beschreibenden Namen mit dem Mod-Präfix:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         <-- Script-Code
    MyMod_Data.pbo            <-- Modelle, Texturen, Items
    MyMod_GUI.pbo             <-- Layouts, ImageSets, Styles
    MyMod_Sounds.pbo          <-- Audio (manchmal mit Data gebündelt)
```

Der PBO-Name muss nicht mit dem CfgPatches-Klassennamen übereinstimmen, aber sie ausgerichtet zu halten vermeidet Verwirrung.

### @mod-Ordnername

Das `@`-Präfix ist eine Steam-Workshop-Konvention. Während der Entwicklung können Sie es weglassen:

```
Entwicklung:    MyMod/           <-- Kein @-Präfix
Workshop:       @MyMod/          <-- Mit @-Präfix
```

Das `@` hat keine technische Bedeutung für die Engine. Es ist reine Organisationskonvention.

### Mehrere PBOs pro Mod

Große Mods werden aus mehreren Gründen in mehrere PBOs aufgeteilt:

1. **Separate Update-Zyklen** -- Scripts aktualisieren, ohne 3D-Modelle erneut herunterzuladen
2. **Optionale Komponenten** -- GUI-PBO ist optional, wenn der Mod headless funktioniert
3. **Build-Pipeline** -- verschiedene PBOs werden von verschiedenen Tools erstellt

```
@MyMod_Weapons/
  Addons/
    MyMod_Weapons_Scripts.pbo    <-- Script-Verhalten
    MyMod_Weapons_Data.pbo       <-- 268 Waffenmodelle, Texturen, Configs
```

Jede PBO hat ihre eigene `config.cpp` mit ihrem eigenen `CfgPatches`-Eintrag. Die `requiredAddons` zwischen ihnen steuert die Ladereihenfolge:

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

## Echte Beispiele aus professionellen Mods

### Framework-Mod-Beispiel

```
MyFramework/
  MyFramework/                            <-- Client-Paket
    mod.cpp
    stringtable.csv
    GUI/
      config.cpp
      fonts/
      icons/                              <-- 5 Icon-Gewichts-ImageSets
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
      1_Core/MyMod/                      <-- Log-Level, Konstanten
      2_GameLib/MyMod/UI/                <-- MVC-Attributsystem
      3_Game/MyMod/                      <-- 15+ Subsystem-Ordner
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
      4_World/MyMod/                     <-- Spielerdaten, Welt-Manager
      5_Mission/MyMod/                   <-- Admin-Panel, Mod-Registrierung

  MyFramework_Server/                     <-- Server-Paket
    mod.cpp
    Scripts/
      config.cpp
      ...
```

### Community Online Tools (COT) -- Admin-Tool

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
    config.cpp                            <-- Debug-Entity-Definitionen
  Scripts/
    config.cpp
    Data/
      Credits.json
      Version.hpp
      Inputs.xml
    Common/                               <-- Über alle Schichten geteilt
    1_Core/
    3_Game/
    4_World/
    5_Mission/
  languagecore/
    config.cpp                            <-- Stringtable-Config
```

Beachten Sie das `Common/`-Ordnermuster: Es wird über `files[]` in jedes Script-Modul eingebunden und ermöglicht gemeinsame Typen über alle Schichten.

### Inhalts-Mod-Beispiel

```
MyMod_Weapons/
  MyMod_Weapons/
    mod.cpp
    Data/
      config.cpp                          <-- Zusammengeführte Config: 268 Waffendefinitionen
      Ammo/                               <-- Organisiert nach Quelle/Kaliber
        BC/12.7x55/
        BC/338/
        BC/50Cal/
        GCGN/3006/
        GCGN/300AAC/
      Attachments/                        <-- Zielfernrohre, Schalldämpfer, Griffe
      Magazines/
      Weapons/                            <-- Waffenmodelle nach Quelle organisiert
    Scripts/
      config.cpp                          <-- Script-Modul-Definitionen
      3_Game/                             <-- Waffen-Config, Stat-System
      4_World/                            <-- Waffen-Verhaltensüberschreibungen
      5_Mission/                          <-- Registrierung, UI
```

Inhalts-Mods haben ein massives `Data/`-Verzeichnis und relativ kleines `Scripts/`.

### DabsFramework -- UI-Framework

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
    2_GameLib/                            <-- Einer der wenigen Mods mit Schicht 2
    3_Game/
    4_World/
    5_Mission/
```

Hinweis: DabsFramework verwendet Ordnernamen in Kleinbuchstaben (`scripts/`, `gui/`). Das funktioniert, weil Windows nicht zwischen Groß- und Kleinschreibung unterscheidet, kann aber auf Linux Probleme verursachen. Die Konvention ist die kanonische Schreibweise (`Scripts/`, `GUI/`).

---

## Anti-Muster

### 1. Flacher Script-Dump

```
Scripts/
  3_Game/
    AllMyStuff.c            <-- 2000 Zeilen, 15 Klassen
    MoreStuff.c             <-- 1500 Zeilen, 12 Klassen
```

**Lösung:** Eine Datei pro Klasse, organisiert in Unterverzeichnissen nach Subsystem.

### 2. Falsche Schichtplatzierung

```
Scripts/
  3_Game/
    MyMod/
      PlayerManager.c       <-- Referenziert PlayerBase (definiert in 4_World)
      MyPanel.c             <-- UI-Code (gehört in 5_Mission)
      MyItem.c              <-- Erweitert ItemBase (gehört in 4_World)
```

**Lösung:** Folgen Sie den Schichtregeln aus Kapitel 2.1. Verschieben Sie Entity-Code nach `4_World` und UI-Code nach `5_Mission`.

### 3. Kein Mod-Unterverzeichnis in Script-Schichten

```
Scripts/
  3_Game/
    Config.c                <-- Namenskollisionsrisiko mit anderen Mods!
    RPCs.c
```

**Lösung:** Immer mit einem Unterverzeichnis namensräumen:

```
Scripts/
  3_Game/
    MyMod/
      Config.c
      RPCs.c
```

### 4. stringtable.csv innerhalb von Scripts/

```
Scripts/
  stringtable.csv           <-- FALSCHER ORT
  config.cpp
```

**Lösung:** `stringtable.csv` gehört in den Mod-Stamm (neben `mod.cpp`):

```
MyMod/
  mod.cpp
  stringtable.csv           <-- Korrekt
  Scripts/
    config.cpp
```

### 5. Gemischte Assets und Scripts in einem PBO

```
MyMod/
  config.cpp
  Scripts/3_Game/...
  Models/weapon.p3d
  Textures/weapon_co.paa
```

**Lösung:** In mehrere PBOs aufteilen:

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

### 6. Tief verschachtelte Unterverzeichnisse

```
Scripts/3_Game/MyMod/Systems/Core/Config/Managers/Settings/PlayerSettings.c
```

**Lösung:** Verschachtelung auf maximal 2-3 Ebenen begrenzen. Wenn möglich abflachen:

```
Scripts/3_Game/MyMod/Config/PlayerSettings.c
```

### 7. Inkonsistente Benennung

```
mymod_Config.c
MyMod_rpc.c
MYMOD_Manager.c
my_mod_panel.c
```

**Lösung:** Wählen Sie eine Konvention und bleiben Sie dabei:

```
MyModConfig.c
MyModRPC.c
MyModManager.c
MyModPanel.c
```

---

## Zusammenfassungs-Checkliste

Überprüfen Sie vor der Veröffentlichung Ihres Mods:

- [ ] `mod.cpp` ist im Mod-Stamm (neben `Addons/` oder `Scripts/`)
- [ ] `stringtable.csv` ist im Mod-Stamm (NICHT innerhalb von `Scripts/`)
- [ ] `config.cpp` existiert in jedem PBO-Stamm
- [ ] `requiredAddons[]` listet ALLE Abhängigkeiten auf
- [ ] Script-Modul `files[]`-Pfade stimmen mit der tatsächlichen Verzeichnisstruktur überein
- [ ] Jede `.c`-Datei ist in einem mod-namensräumierten Unterverzeichnis (z.B. `3_Game/MyMod/`)
- [ ] Klassennamen haben ein einzigartiges Präfix, um Kollisionen zu vermeiden
- [ ] Entity-Klassen sind in `4_World`, UI-Klassen in `5_Mission`, Datenklassen in `3_Game`
- [ ] Keine Geheimnisse oder Debug-Code in den veröffentlichten PBOs
- [ ] Server-only-Logik ist in einem separaten `-servermod`-Paket (falls zutreffend)

---

## In echten Mods beobachtet

| Muster | Mod | Detail |
|---------|-----|--------|
| Tiefe Subsystem-Ordner in `3_Game` | StarDZ Core | 15+ Ordner unter `3_Game/` (Config, RPC, Events, Logging, Permissions, usw.) |
| `Common/`-gemeinsamer Ordner | COT | In jedem Script-Modul-`files[]` eingebunden, um schichtübergreifende Hilfstypen bereitzustellen |
| Ordnernamen in Kleinbuchstaben | DabsFramework | Verwendet `scripts/`, `gui/` statt `Scripts/`, `GUI/` -- funktioniert unter Windows, riskiert aber Probleme unter Linux |
| Separate GUI-PBO | Expansion, COT | GUI-Ressourcen (Layouts, ImageSets, Styles) in eine eigene PBO mit eigener config.cpp gepackt |
| Minimale Scripts für Inhalts-Mods | Waffenpakete | `Data/`-Verzeichnis dominiert; `Scripts/` hat nur eine dünne config.cpp und optionale Verhaltensüberschreibungen |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| Eine Klasse pro Datei | Jede `.c`-Datei enthält eine Klasse | Kleine Hilfsklassen und Enums werden oft mit ihrer Elternklasse zusammen platziert |
| Separate PBOs für Scripts/Data/GUI | Saubere Trennung nach Zuständigkeit | Kleine Mods fügen oft alles in eine einzelne PBO zusammen, um die Distribution zu vereinfachen |
| Mod-Unterordner verhindert Kollisionen | `3_Game/MyMod/` namensräumt Dateien | Stimmt, aber Klassennamen kollidieren trotzdem global -- der Unterordner verhindert nur Dateiekonflikte |
| `stringtable.csv` im Mod-Stamm | Engine findet sie automatisch | Muss im PBO-Stamm sein, der geladen wird; Platzierung innerhalb von `Scripts/` führt dazu, dass sie stillschweigend ignoriert wird |
| ServerFiles/ wird mit dem Mod geliefert | Server-Administratoren kopieren types.xml | Viele Mod-Autoren vergessen ServerFiles beizulegen, was Administratoren zwingt, types.xml-Einträge manuell zu erstellen |

---

## Kompatibilität & Auswirkungen

- **Multi-Mod:** Die Dateiorganisation selbst verursacht keine Konflikte. Wenn jedoch zwei Mods Dateien mit dem gleichen Pfad in ihren PBOs platzieren (z.B. beide verwenden `3_Game/Config.c` ohne Mod-Unterordner), kollidieren sie auf Engine-Ebene, wobei einer den anderen stillschweigend überschreibt.
- **Leistung:** Verzeichnistiefe und Dateianzahl haben keinen messbaren Einfluss auf die Script-Kompilierungszeit. Die Engine durchsucht rekursiv alle aufgelisteten `files[]`-Verzeichnisse unabhängig von der Verschachtelung.

---

**Zurück:** [Kapitel 2.4: Ihr erster Mod -- Minimaler funktionsfähiger](04-minimum-viable-mod.md)
**Weiter:** [Kapitel 2.6: Server- vs. Client-Architektur](06-server-client-split.md)
