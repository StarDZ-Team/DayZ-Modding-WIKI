# Frequently Asked Questions

[Home](./README.md) | **FAQ**

---

## Erste Schritte

### F: Was brauche ich, um mit dem DayZ-Modding zu beginnen?
**A:** Du brauchst Steam, DayZ (Retail-Version), DayZ Tools (kostenlos auf Steam unter Tools) und einen Texteditor (VS Code empfohlen). Programmiererfahrung ist nicht zwingend erforderlich -- starte mit [Kapitel 8.1: Dein erster Mod](08-tutorials/01-first-mod.md). DayZ Tools enthält Object Builder, Addon Builder, TexView2 und die Workbench-IDE.

### F: Welche Programmiersprache verwendet DayZ?
**A:** DayZ verwendet **Enforce Script**, eine proprietäre Sprache von Bohemia Interactive. Sie hat eine C-ähnliche Syntax, ähnlich wie C#, aber mit eigenen Regeln und Einschränkungen (kein ternärer Operator, kein try/catch, keine Lambdas). Siehe [Teil 1: Enforce Script](01-enforce-script/01-variables-types.md) für eine vollständige Sprachanleitung.

### F: Wie richte ich das P:-Laufwerk ein?
**A:** Öffne DayZ Tools über Steam, klicke auf "Workdrive" oder "Setup Workdrive", um das P:-Laufwerk einzubinden. Dies erstellt ein virtuelles Laufwerk, das auf deinen Modding-Arbeitsbereich zeigt, wo die Engine während der Entwicklung nach Quelldateien sucht. Du kannst auch `subst P: "C:\Dein\Pfad"` über die Kommandozeile verwenden. Siehe [Kapitel 4.5](04-file-formats/05-dayz-tools.md).

### F: Kann ich meinen Mod ohne dedizierten Server testen?
**A:** Ja. Starte DayZ mit dem Parameter `-filePatching` und deinem geladenen Mod. Zum schnellen Testen verwende einen Listen-Server (hoste über das In-Game-Menü). Für Produktionstests verifiziere immer auch auf einem dedizierten Server, da einige Codepfade sich unterscheiden. Siehe [Kapitel 8.1](08-tutorials/01-first-mod.md).

### F: Wo finde ich die Vanilla-DayZ-Skriptdateien zum Studieren?
**A:** Nach dem Einbinden des P:-Laufwerks über DayZ Tools befinden sich die Vanilla-Skripte unter `P:\DZ\scripts\`, organisiert nach Schicht (`3_Game`, `4_World`, `5_Mission`). Diese sind die massgebliche Referenz für jede Engine-Klasse, Methode und jedes Event. Siehe auch den [Spickzettel](cheatsheet.md) und die [API-Kurzreferenz](06-engine-api/quick-reference.md).

---

## Häufige Fehler und Lösungen

### F: Mein Mod laed, aber nichts passiert. Keine Fehler im Log.
**A:** Höchstwahrscheinlich hat deine `config.cpp` einen falschen `requiredAddons[]`-Eintrag, sodass deine Skripte zu früh oder gar nicht geladen werden. Überprüfen, dass jeder Addon-Name in `requiredAddons` exakt mit einem existierenden `CfgPatches`-Klassennamen übereinstimmt (Groß-/Kleinschreibung beachten). Prüfe das Skript-Log unter `%localappdata%/DayZ/` auf stille Warnungen. Siehe [Kapitel 2.2](02-mod-structure/02-config-cpp.md).

### F: Ich bekomme "Cannot find variable"- oder "Undefined variable"-Fehler.
**A:** Dies bedeutet normalerweise, dass du eine Klasse oder Variable aus einer höheren Skriptschicht referenzierst. Niedrigere Schichten (`3_Game`) können keine Typen sehen, die in höheren Schichten (`4_World`, `5_Mission`) definiert sind. Verschiebe deine Klassendefinition in die richtige Schicht oder verwende `typename`-Reflexion für lose Kopplung. Siehe [Kapitel 2.1](02-mod-structure/01-five-layers.md).

### F: Warum gibt `JsonFileLoader<T>.JsonLoadFile()` meine Daten nicht zurück?
**A:** `JsonLoadFile()` gibt `void` zurück, nicht das geladene Objekt. Du musst dein Objekt vorab erstellen und als Referenzparameter übergeben: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Die Zuweisung des Rückgabewerts ergibt stillschweigend `null`. Siehe [Kapitel 6.8](06-engine-api/08-file-io.md).

### F: Mein RPC wird gesendet, aber nie auf der anderen Seite empfangen.
**A:** Prüfe diese häufigen Ursachen: (1) Die RPC-ID stimmt nicht zwischen Sender und Empfänger überein. (2) Du sendest vom Client, hörst aber auf dem Client (oder Server-zu-Server). (3) Du hast vergessen, den RPC-Handler in `OnRPC()` oder deinem benutzerdefinierten Handler zu registrieren. (4) Die Zielentität ist `null` oder nicht netzwerksynchronisiert. Siehe [Kapitel 6.9](06-engine-api/09-networking.md) und [Kapitel 7.3](07-patterns/03-rpc-patterns.md).

### F: Ich bekomme "Error: Member already defined" in einem else-if-Block.
**A:** Enforce Script erlaubt keine Variablen-Neudeklaration in benachbarten `else if`-Blöcken innerhalb desselben Gültigkeitsbereichs. Deklariere die Variable einmal vor der `if`-Kette oder verwende separate Gültigkeitsbereiche mit geschweiften Klammern. Siehe [Kapitel 1.12](01-enforce-script/12-gotchas.md).

### F: Mein UI-Layout zeigt nichts / Widgets sind unsichtbar.
**A:** Häufige Ursachen: (1) Widget hat Größe null -- prüfe, ob Breite/Höhe korrekt gesetzt sind (keine negativen Werte). (2) Das Widget ist nicht `Show(true)`. (3) Die Textfarben-Alpha ist 0 (vollständig transparent). (4) Der Layout-Pfad in `CreateWidgets()` ist falsch (kein Fehler wird ausgegeben, es wird einfach `null` zurückgegeben). Siehe [Kapitel 3.3](03-gui-system/03-sizing-positioning.md).

### F: Mein Mod verursacht einen Absturz beim Serverstart.
**A:** Prüfe auf: (1) Aufruf von Client-only-Methoden (`GetGame().GetPlayer()`, UI-Code) auf dem Server. (2) `null`-Referenz in `OnInit` oder `OnMissionStart` bevor die Welt bereit ist. (3) Unendliche Rekursion in einer `modded class`-Überschreibung, die `super` aufzurufen vergessen hat. Füge immer Guard-Klauseln hinzu, da es kein try/catch gibt. Siehe [Kapitel 1.11](01-enforce-script/11-error-handling.md).

### F: Backslash- oder Anführungszeichen in meinen Strings verursachen Parse-Fehler.
**A:** Der Parser von Enforce Script (CParser) unterstützt keine `\\`- oder `\"`-Escape-Sequenzen in String-Literalen. Vermeide Backslashes komplett. Für Dateipfade verwende Schrägstriche (`"my/path/file.json"`). Für Anführungszeichen in Strings verwende einfache Anführungszeichen oder String-Verkettung. Siehe [Kapitel 1.12](01-enforce-script/12-gotchas.md).

---

## Architekturentscheidungen

### F: Was ist die 5-Schichten-Skripthierarchie und warum ist sie wichtig?
**A:** DayZ-Skripte kompilieren in fünf nummerierten Schichten: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Jede Schicht kann nur Typen aus der gleichen oder einer niedriger nummerierten Schicht referenzieren. Dies erzwingt architektonische Grenzen -- platziere gemeinsame Enums und Konstanten in `3_Game`, Entitätslogik in `4_World` und UI/Mission-Hooks in `5_Mission`. Siehe [Kapitel 2.1](02-mod-structure/01-five-layers.md).

### F: Sollte ich `modded class` verwenden oder neue Klassen erstellen?
**A:** Verwende `modded class`, wenn du bestehendes Vanilla-Verhalten ändern oder erweitern musst (eine Methode zu `PlayerBase` hinzufügen, in `MissionServer` einhaken). Erstelle neue Klassen für eigenständige Systeme, die nichts überschreiben müssen. Modded-Klassen verketten automatisch -- rufe immer `super` auf, um andere Mods nicht zu beschädigen. Siehe [Kapitel 1.4](01-enforce-script/04-modded-classes.md).

### F: Wie sollte ich Client- vs. Server-Code organisieren?
**A:** Verwende `#ifdef SERVER`- und `#ifdef CLIENT`-Präprozessor-Guards für Code, der nur auf einer Seite laufen darf. Für größere Mods teile in separate PBOs auf: einen Client-Mod (UI, Rendering, lokale Effekte) und einen Server-Mod (Spawning, Logik, Persistenz). Dies verhindert das Durchsickern von Serverlogik an Clients. Siehe [Kapitel 2.5](02-mod-structure/05-file-organization.md) und [Kapitel 6.9](06-engine-api/09-networking.md).

### F: Wann sollte ich ein Singleton vs. ein Modul/Plugin verwenden?
**A:** Verwende ein Modul (registriert bei CFs `PluginManager` oder deinem eigenen Modulsystem), wenn du Lifecycle-Management brauchst (`OnInit`, `OnUpdate`, `OnMissionFinish`). Verwende ein eigenständiges Singleton für zustandslose Utility-Dienste, die nur globalen Zugriff benötigen. Module werden für alles mit Zustand oder Bereinigungsbedarf bevorzugt. Siehe [Kapitel 7.1](07-patterns/01-singletons.md) und [Kapitel 7.2](07-patterns/02-module-systems.md).

### F: Wie speichere ich sicher spielerbezogene Daten, die Server-Neustarts überleben?
**A:** Speichere JSON-Dateien im `$profile:`-Verzeichnis des Servers mit `JsonFileLoader`. Verwende die Steam-UID des Spielers (von `PlayerIdentity.GetId()`) als Dateinamen. Lade beim Spieler-Connect, speichere beim Disconnect und periodisch während des Spiels. Behandle immer fehlende/beschädigte Dateien ordnungsgemäß mit Guard-Klauseln. Siehe [Kapitel 7.4](07-patterns/04-config-persistence.md) und [Kapitel 6.8](06-engine-api/08-file-io.md).

---

## Veröffentlichung und Distribution

### F: Wie packe ich meinen Mod in ein PBO?
**A:** Verwende Addon Builder (aus DayZ Tools) oder Tools von Drittanbietern wie PBO Manager. Zeige auf den Quellordner deines Mods, setze das korrekte Prefix (passend zum `config.cpp`-Addon-Prefix) und baue. Die Ausgabe-`.pbo`-Datei kommt in den `Addons/`-Ordner deines Mods. Siehe [Kapitel 4.6](04-file-formats/06-pbo-packing.md).

### F: Wie signiere ich meinen Mod für die Servernutzung?
**A:** Erstelle ein Schlüsselpaar mit DayZ Tools' DSSignFile oder DSCreateKey: Dies erzeugt einen `.biprivatekey` und `.bikey`. Signiere jedes PBO mit dem privaten Schlüssel (erstellt `.bisign`-Dateien neben jedem PBO). Verteile den `.bikey` an Serveradministratoren für deren `keys/`-Ordner. Teile niemals deinen `.biprivatekey`. Siehe [Kapitel 4.6](04-file-formats/06-pbo-packing.md).

### F: Wie veröffentliche ich im Steam Workshop?
**A:** Verwende den DayZ Tools Publisher oder den Steam Workshop Uploader. Du brauchst eine `mod.cpp`-Datei im Mod-Stammverzeichnis, die Name, Autor und Beschreibung definiert. Der Publisher lädt deine gepackten PBOs hoch, und Steam weist eine Workshop-ID zu. Aktualisiere durch erneutes Veröffentlichen vom selben Account. Siehe [Kapitel 2.3](02-mod-structure/03-mod-cpp.md) und [Kapitel 8.7](08-tutorials/07-publishing-workshop.md).

### F: Kann mein Mod andere Mods als Abhängigkeiten erfordern?
**A:** Ja. In `config.cpp` füge den `CfgPatches`-Klassennamen des Abhängigkeits-Mods zu deinem `requiredAddons[]`-Array hinzu. In `mod.cpp` gibt es kein formales Abhängigkeitssystem -- dokumentiere erforderliche Mods in deiner Workshop-Beschreibung. Spieler müssen alle erforderlichen Mods abonnieren und laden. Siehe [Kapitel 2.2](02-mod-structure/02-config-cpp.md).

---

## Fortgeschrittene Themen

### F: Wie erstelle ich benutzerdefinierte Spieleraktionen (Interaktionen)?
**A:** Erweitere `ActionBase` (oder eine Unterklasse wie `ActionInteractBase`), definiere `CreateConditionComponents()` für Vorbedingungen, überschreibe `OnStart`/`OnExecute`/`OnEnd` für Logik und registriere sie in `SetActions()` auf der Zielentität. Aktionen unterstützen kontinuierliche (Halten) und sofortige (Klick) Modi. Siehe [Kapitel 6.12](06-engine-api/12-action-system.md).

### F: Wie funktioniert das Schadenssystem für benutzerdefinierte Gegenstände?
**A:** Definiere eine `DamageSystem`-Klasse in der config.cpp deines Gegenstands mit `DamageZones` (benannte Bereiche) und `ArmorType`-Werten. Jede Zone verfolgt ihre eigene Gesundheit. Überschreibe `EEHitBy()` und `EEKilled()` im Skript für benutzerdefinierte Schadensreaktionen. Die Engine ordnet Fire-Geometry-Modellkomponenten den Zonennamen zu. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

### F: Wie kann ich benutzerdefinierte Tastenbelegungen zu meinem Mod hinzufügen?
**A:** Erstelle eine `inputs.xml`-Datei, die deine Eingabeaktionen mit Standard-Tastenzuweisungen definiert. Registriere sie im Skript über `GetUApi().RegisterInput()`. Frage den Status mit `GetUApi().GetInputByName("deine_aktion").LocalPress()` ab. Füge lokalisierte Namen in deiner `stringtable.csv` hinzu. Siehe [Kapitel 5.2](05-config-files/02-inputs-xml.md) und [Kapitel 6.13](06-engine-api/13-input-system.md).

### F: Wie mache ich meinen Mod mit anderen Mods kompatibel?
**A:** Folge diesen Prinzipien: (1) Rufe immer `super` in Modded-Class-Überschreibungen auf. (2) Verwende eindeutige Klassennamen mit einem Mod-Prefix (z.B. `MyMod_Manager`). (3) Verwende eindeutige RPC-IDs. (4) Überschreibe keine Vanilla-Methoden ohne `super` aufzurufen. (5) Verwende `#ifdef` zur Erkennung optionaler Abhängigkeiten. (6) Teste mit beliebten Mod-Kombinationen (CF, Expansion, etc.). Siehe [Kapitel 7.2](07-patterns/02-module-systems.md).

### F: Wie optimiere ich meinen Mod für die Server-Performance?
**A:** Wichtige Strategien: (1) Vermeide Per-Frame-Logik (`OnUpdate`) -- verwende Timer oder ereignisgesteuerte Architekturen. (2) Cache Referenzen anstatt `GetGame().GetPlayer()` wiederholt aufzurufen. (3) Verwende `GetGame().IsServer()` / `GetGame().IsClient()`-Guards, um unnütigen Code zu überspringen. (4) Profiliere mit `int start = TickCount(0);`-Benchmarks. (5) Begrenze den Netzwerkverkehr -- bündle RPCs und verwende Net-Sync-Variablen für häufige kleine Updates. Siehe [Kapitel 7.7](07-patterns/07-performance.md).

---

*Hast du eine Frage, die hier nicht behandelt wird? Erstelle ein Issue im Repository.*
