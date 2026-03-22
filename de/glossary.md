# DayZ-Modding-Glossar

[Home](../README.md) | **Glossar**

---

Ein umfassendes Nachschlagewerk der Begriffe, die in diesem Wiki und im DayZ-Modding verwendet werden.

---

## A

**Action** -- Eine Spielerinteraktion mit einem Gegenstand oder der Welt (Essen, Tueren oeffnen, Reparieren). Actions werden mit `ActionBase` mit Bedingungen und Callback-Stufen erstellt. Siehe [Kapitel 6.12](06-engine-api/12-action-system.md).

**Addon Builder** -- DayZ-Tools-Anwendung, die Mod-Dateien in PBO-Archive packt. Verarbeitet Binarisierung, Dateisignierung und Prefix-Zuordnung. Siehe [Kapitel 4.6](04-file-formats/06-pbo-packing.md).

**autoptr** -- Bereichsbezogener starker Referenzzeiger in Enforce Script. Das referenzierte Objekt wird automatisch zerstoert, wenn der `autoptr` den Gueltigkeitsbereich verlaesst. Selten im DayZ-Modding verwendet (bevorzuge explizites `ref`). Siehe [Kapitel 1.8](01-enforce-script/08-memory-management.md).

---

## B

**Binarize** -- Prozess der Konvertierung von Quelldateien (`config.cpp`, `.p3d`, `.tga`) in optimierte Engine-fertige Formate (`.bin`, ODOL, `.paa`). Wird automatisch von Addon Builder oder dem Binarize-Tool in DayZ Tools durchgefuehrt. Siehe [Kapitel 4.6](04-file-formats/06-pbo-packing.md).

**bikey / biprivatekey / bisign** -- Siehe [Schluesselsignierung](#k).

---

## C

**CallQueue** -- DayZ-Engine-Utility zum Planen von verzoegerten oder wiederholenden Funktionsaufrufen. Zugriff ueber `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)`. Siehe [Kapitel 6.7](06-engine-api/07-timers.md).

**CastTo** -- Siehe [Class.CastTo](#classcasto).

**Central Economy (CE)** -- DayZs Beuteverteilungs- und Persistenzsystem. Konfiguriert durch XML-Dateien (`types.xml`, `mapgrouppos.xml`, `cfglimitsdefinition.xml`), die definieren, was wo und wie oft spawnt. Siehe [Kapitel 6.10](06-engine-api/10-central-economy.md).

**CfgMods** -- Top-Level config.cpp-Klasse, die einen Mod bei der Engine registriert. Definiert den Mod-Namen, Skriptverzeichnisse, erforderliche Abhaengigkeiten und Addon-Ladereihenfolge. Siehe [Kapitel 2.2](02-mod-structure/02-config-cpp.md).

**CfgPatches** -- config.cpp-Klasse, die einzelne Addons (Skriptpakete, Modelle, Texturen) innerhalb eines Mods registriert. Das `requiredAddons[]`-Array steuert die Ladereihenfolge zwischen Mods. Siehe [Kapitel 2.2](02-mod-structure/02-config-cpp.md).

**CfgVehicles** -- config.cpp-Klassenhierarchie, die alle Spielentitaeten definiert: Gegenstaende, Gebaeude, Fahrzeuge, Tiere und Spieler. Trotz des Namens enthaelt sie weit mehr als Fahrzeuge. Siehe [Kapitel 2.2](02-mod-structure/02-config-cpp.md).

**Class.CastTo** -- Statische Methode fuer sicheres Downcasting in Enforce Script. Gibt `true` zurueck, wenn der Cast erfolgreich ist. Erforderlich, da Enforce Script kein `as`-Schluesselwort hat. Verwendung: `Class.CastTo(result, source)`. Siehe [Kapitel 1.9](01-enforce-script/09-casting-reflection.md).

**CommunityFramework (CF)** -- Drittanbieter-Framework-Mod von Jacob_Mango, das Modul-Lifecycle-Management, Logging, RPC-Helfer, Datei-I/O-Utilities und doppelt verlinkte Listen-Datenstrukturen bietet. Viele beliebte Mods haengen davon ab. Siehe [Kapitel 7.2](07-patterns/02-module-systems.md).

**config.cpp** -- Die zentrale Konfigurationsdatei fuer jeden DayZ-Mod. Definiert `CfgPatches`, `CfgMods`, `CfgVehicles` und andere Klassenhierarchien, die die Engine beim Start liest. Dies ist KEIN C++-Code trotz der Dateiendung. Siehe [Kapitel 2.2](02-mod-structure/02-config-cpp.md).

---

## D

**DamageSystem** -- Engine-Subsystem, das Trefferregistrierung, Schadenszonen, Gesundheits-/Blut-/Schockwerte und Ruestungsberechnungen auf Entitaeten verarbeitet. Konfiguriert durch die config.cpp `DamageSystem`-Klasse mit Zonen und Trefferkomponenten. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**DayZ Tools** -- Kostenlose Steam-Anwendung mit dem offiziellen Modding-Toolkit: Object Builder, Terrain Builder, Addon Builder, TexView2, Workbench und P:-Laufwerk-Verwaltung. Siehe [Kapitel 4.5](04-file-formats/05-dayz-tools.md).

**DayZPlayer** -- Basisklasse fuer alle Spielerentitaeten in der Engine. Bietet Zugriff auf Bewegungs-, Animations-, Inventar- und Eingabesysteme. `PlayerBase` erweitert diese Klasse und ist der typische Modding-Einstiegspunkt. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**Dedicated Server** -- Eigenstaendiger kopfloser Serverprozess (`DayZServer_x64.exe`), der fuer Multiplayer-Hosting verwendet wird. Fuehrt nur serverseitige Skripte aus. Im Gegensatz zum [Listen Server](#l).

---

## E

**EEInit** -- Engine-Event-Methode, die aufgerufen wird, wenn eine Entitaet nach der Erstellung initialisiert wird. Ueberschreibe diese in deiner Entitaetsklasse, um Setup-Logik auszufuehren. Wird sowohl auf Client als auch Server aufgerufen. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**EEKilled** -- Engine-Event-Methode, die aufgerufen wird, wenn die Gesundheit einer Entitaet null erreicht. Wird fuer Todeslogik, Beuteabwurf und Kill-Tracking verwendet. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**EEHitBy** -- Engine-Event-Methode, die aufgerufen wird, wenn eine Entitaet Schaden erhaelt. Parameter umfassen die Schadensquelle, getroffene Komponente, Schadenstyp und Schadenszonen. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**EEItemAttached** -- Engine-Event-Methode, die aufgerufen wird, wenn ein Gegenstand an einen Inventarplatz einer Entitaet angebracht wird (z.B. ein Zielfernrohr an eine Waffe). Gepaart mit `EEItemDetached`. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**Enforce Script** -- Bohemia Interactives proprietaere Skriptsprache, die in DayZ und Enfusion-Engine-Spielen verwendet wird. C-aehnliche Syntax, aehnlich wie C#, aber mit einzigartigen Einschraenkungen (kein Ternaeroperator, kein try/catch, keine Lambdas). Siehe [Teil 1](01-enforce-script/01-variables-types.md).

**EntityAI** -- Basisklasse fuer alle "intelligenten" Entitaeten in DayZ (Spieler, Tiere, Zombies, Gegenstaende). Erweitert `Entity` um Inventar, Schadenssystem und KI-Schnittstellen. Die meisten Gegenstands- und Charakter-Modding-Arbeiten beginnen hier. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**EventBus** -- Ein Publish-Subscribe-Muster fuer entkoppelte Kommunikation zwischen Systemen. Module abonnieren benannte Events und erhalten Callbacks, wenn Events ausgeloest werden, ohne direkte Abhaengigkeiten. Siehe [Kapitel 7.6](07-patterns/06-events.md).

---

## F

**File Patching** -- Startparameter (`-filePatching`), der es der Engine ermoeglicht, lose Dateien vom P:-Laufwerk statt gepackter PBOs zu laden. Unverzichtbar fuer schnelle Entwicklungsiteration. Muss sowohl auf Client als auch Server aktiviert sein. Siehe [Kapitel 4.6](04-file-formats/06-pbo-packing.md).

**Fire Geometry** -- Spezialisiertes LOD in einem 3D-Modell (`.p3d`), das Oberflaechen definiert, auf denen Kugeln einschlagen und Schaden verursachen koennen. Unterscheidet sich von View Geometry und Geometry LOD. Siehe [Kapitel 4.2](04-file-formats/02-models.md).

---

## G

**GameInventory** -- Engine-Klasse, die das Inventarsystem einer Entitaet verwaltet. Bietet Methoden zum Hinzufuegen, Entfernen, Finden und Uebertragen von Gegenstaenden zwischen Containern und Plaetzen. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**GetGame()** -- Globale Funktion, die das `CGame`-Singleton zurueckgibt. Einstiegspunkt fuer den Zugriff auf Mission, Spieler, CallQueues, RPC, Wetter und andere Engine-Systeme. Ueberall im Skript verfuegbar. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**GetUApi()** -- Globale Funktion, die das `UAInputAPI`-Singleton fuer das Eingabesystem zurueckgibt. Wird zum Registrieren und Abfragen benutzerdefinierter Tastenbelegungen verwendet. Siehe [Kapitel 6.13](06-engine-api/13-input-system.md).

**Geometry LOD** -- 3D-Modell-Detailstufe fuer physische Kollisionserkennung (Spielerbewegung, Fahrzeugphysik). Getrennt von View Geometry und Fire Geometry. Siehe [Kapitel 4.2](04-file-formats/02-models.md).

**Guard Clause** -- Defensives Programmiermuster: Pruefe Vorbedingungen am Anfang einer Methode und kehre frueh zurueck, wenn sie fehlschlagen. Unverzichtbar in Enforce Script, da es kein try/catch gibt. Siehe [Kapitel 1.11](01-enforce-script/11-error-handling.md).

---

## H

**Hidden Selections** -- Benannte Textur-/Materialplaetze auf einem 3D-Modell, die zur Laufzeit per Skript getauscht werden koennen. Verwendet fuer Tarnungsvarianten, Teamfarben, Schadenszustaende und dynamische Erscheinungsaenderungen. Definiert in config.cpp und den benannten Selektionen des Modells. Siehe [Kapitel 4.2](04-file-formats/02-models.md).

**HUD** -- Heads-Up-Display: Bildschirmelemente, die waehrend des Spiels sichtbar sind (Gesundheitsanzeigen, Hotbar, Kompass, Benachrichtigungen). Erstellt mit `.layout`-Dateien und geskripteten Widget-Klassen. Siehe [Kapitel 3.1](03-gui-system/01-widget-types.md).

---

## I

**IEntity** -- Die niedrigste Entitaetsschnittstelle in der Enfusion-Engine. Bietet Zugriff auf Transform (Position/Rotation), Visuelles und Physik. Die meisten Modder arbeiten stattdessen mit `EntityAI` oder hoeheren Klassen. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**ImageSet** -- XML-Datei (`.imageset`), die benannte rechteckige Bereiche innerhalb eines Texturatlasses (`.edds` oder `.paa`) definiert. Wird verwendet, um Icons, Button-Grafiken und UI-Elemente zu referenzieren, ohne separate Bilddateien. Siehe [Kapitel 5.4](05-config-files/04-imagesets.md).

**InventoryLocation** -- Engine-Klasse, die eine bestimmte Position im Inventarsystem beschreibt: welche Entitaet, welcher Platz, welche Cargo-Zeile/Spalte. Wird fuer praezise Inventarmanipulation und -uebertragungen verwendet. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**ItemBase** -- Die Standard-Basisklasse fuer alle In-Game-Gegenstaende (erweitert `EntityAI`). Waffen, Werkzeuge, Nahrung, Kleidung, Container und Anbauten erben alle von `ItemBase`. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

---

## J

**JsonFileLoader** -- Engine-Utility-Klasse zum Laden und Speichern von JSON-Dateien in Enforce Script. Wichtiger Fallstrick: `JsonLoadFile()` gibt `void` zurueck -- du musst ein vorab erstelltes Objekt per Referenz uebergeben, nicht den Rueckgabewert zuweisen. Siehe [Kapitel 6.8](06-engine-api/08-file-io.md).

---

## K

**Schluesselsignierung (.bikey, .biprivatekey, .bisign)** -- DayZs Mod-Verifizierungssystem. Ein `.biprivatekey` wird zum Signieren von PBOs verwendet (erzeugt `.bisign`-Dateien). Der passende `.bikey`-oeffentliche Schluessel wird im `keys/`-Ordner des Servers platziert. Server laden nur Mods, deren Signaturen mit einem installierten Schluessel uebereinstimmen. Siehe [Kapitel 4.6](04-file-formats/06-pbo-packing.md).

---

## L

**Layout (.layout-Datei)** -- XML-basierte UI-Definitionsdatei, die vom DayZ-GUI-System verwendet wird. Definiert Widget-Hierarchie, Positionierung, Groesse und Stileigenschaften. Wird zur Laufzeit mit `GetGame().GetWorkspace().CreateWidgets()` geladen. Siehe [Kapitel 3.2](03-gui-system/02-layout-files.md).

**Listen Server** -- Ein Server, der innerhalb des Spieleclients gehostet wird (Spieler agiert als Server und Client gleichzeitig). Nuetzlich fuer Solo-Tests. Einige Codepfade unterscheiden sich von dedizierten Servern -- teste immer beide. Siehe [Kapitel 8.1](08-tutorials/01-first-mod.md).

**LOD (Level of Detail)** -- Mehrere Versionen eines 3D-Modells mit unterschiedlichen Polygonzahlen. Die Engine wechselt basierend auf der Kameraentfernung zwischen ihnen, um die Leistung zu optimieren. DayZ-Modelle haben auch spezielle LODs: Geometry, Fire Geometry, View Geometry, Memory und Shadow. Siehe [Kapitel 4.2](04-file-formats/02-models.md).

---

## M

**Managed** -- Enforce-Script-Schluesselwort, das anzeigt, dass Instanzen einer Klasse referenzgezaehlt und automatisch per Garbage Collection aufgeraeumt werden. Die meisten DayZ-Klassen erben von `Managed`. Im Gegensatz zu `Class` (manuell verwaltet). Siehe [Kapitel 1.8](01-enforce-script/08-memory-management.md).

**Memory Point** -- Benannter Punkt, der in das Memory-LOD eines 3D-Modells eingebettet ist. Wird von Skripten verwendet, um Positionen auf einem Objekt zu lokalisieren (Muendungsfeuer-Ursprung, Befestigungspunkte, Proxy-Positionen). Zugriff ueber `GetMemoryPointPosition()`. Siehe [Kapitel 4.2](04-file-formats/02-models.md).

**Mission (MissionServer / MissionGameplay)** -- Der uebergeordnete Spielzustandscontroller. `MissionServer` laeuft auf dem Server, `MissionGameplay` laeuft auf dem Client. Ueberschreibe diese, um in Spielstart, Spielerverbindungen und Herunterfahren einzuhaken. Siehe [Kapitel 6.11](06-engine-api/11-mission-hooks.md).

**mod.cpp** -- Datei im Stammverzeichnis eines Mods, die dessen Steam-Workshop-Metadaten definiert: Name, Autor, Beschreibung, Icon und Aktions-URL. Nicht zu verwechseln mit `config.cpp`. Siehe [Kapitel 2.3](02-mod-structure/03-mod-cpp.md).

**Modded Class** -- Enforce-Script-Mechanismus (`modded class X extends X`) zum Erweitern oder Ueberschreiben bestehender Klassen ohne Aenderung der Originaldateien. Die Engine verkettet alle Modded-Class-Definitionen automatisch. Dies ist der primaere Weg, wie Mods mit Vanilla und anderen Mods interagieren. Siehe [Kapitel 1.4](01-enforce-script/04-modded-classes.md).

**Module** -- Eine eigenstaendige Funktionseinheit, die bei einem Modulmanager (wie CFs `PluginManager`) registriert ist. Module haben Lifecycle-Methoden (`OnInit`, `OnUpdate`, `OnMissionFinish`) und sind die Standardarchitektur fuer Mod-Systeme. Siehe [Kapitel 7.2](07-patterns/02-module-systems.md).

---

## N

**Named Selection** -- Eine benannte Gruppe von Vertices/Flaechen in einem 3D-Modell, erstellt in Object Builder. Verwendet fuer Hidden Selections (Texturtausch), Schadenszonen und Animationsziele. Siehe [Kapitel 4.2](04-file-formats/02-models.md).

**Net Sync Variable** -- Eine Variable, die automatisch vom Server an alle Clients durch das Netzwerk-Replikationssystem der Engine synchronisiert wird. Registriert ueber `RegisterNetSyncVariable*()` Methoden und empfangen in `OnVariablesSynchronized()`. Siehe [Kapitel 6.9](06-engine-api/09-networking.md).

**notnull** -- Enforce-Script-Parametermodifikator, der dem Compiler mitteilt, dass ein Referenzparameter nicht `null` sein darf. Bietet Kompilierzeit-Sicherheit und dokumentiert die Absicht. Verwendung: `void DoWork(notnull MyClass obj)`. Siehe [Kapitel 1.3](01-enforce-script/03-classes-inheritance.md).

---

## O

**Object Builder** -- DayZ-Tools-Anwendung zum Erstellen und Bearbeiten von 3D-Modellen (`.p3d`). Wird verwendet, um LODs, benannte Selektionen, Memory Points und Geometriekomponenten zu definieren. Siehe [Kapitel 4.5](04-file-formats/05-dayz-tools.md).

**OnInit** -- Lifecycle-Methode, die aufgerufen wird, wenn ein Modul oder Plugin zum ersten Mal initialisiert wird. Wird fuer Registrierung, Abonnierung von Events und einmalige Einrichtung verwendet. Siehe [Kapitel 7.2](07-patterns/02-module-systems.md).

**OnUpdate** -- Lifecycle-Methode, die jeden Frame (oder in einem festen Intervall) auf Modulen und bestimmten Entitaeten aufgerufen wird. Sparsam verwenden -- Per-Frame-Code ist ein Performance-Problem. Siehe [Kapitel 7.7](07-patterns/07-performance.md).

**OnMissionFinish** -- Lifecycle-Methode, die aufgerufen wird, wenn eine Mission endet (Server-Herunterfahren, Verbindungstrennung). Wird fuer Bereinigung, Speichern von Zustaenden und Freigabe von Ressourcen verwendet. Siehe [Kapitel 6.11](06-engine-api/11-mission-hooks.md).

**Override** -- Das `override`-Schluesselwort in Enforce Script, das eine Methode markiert, die eine Elternklassen-Methode ersetzt. Erforderlich (oder dringend empfohlen) beim Ueberschreiben virtueller Methoden. Rufe immer `super.MethodName()` auf, um das Elternverhalten beizubehalten, es sei denn, du beabsichtigst es bewusst zu ersetzen. Siehe [Kapitel 1.3](01-enforce-script/03-classes-inheritance.md).

---

## P

**P:-Laufwerk (Workdrive)** -- Virtueller Laufwerksbuchstabe, der von DayZ Tools auf dein Mod-Projektverzeichnis gemappt wird. Die Engine verwendet intern `P:\`-Pfade, um Quelldateien waehrend der Entwicklung zu finden. Eingerichtet ueber DayZ Tools oder manuelle `subst`-Befehle. Siehe [Kapitel 4.5](04-file-formats/05-dayz-tools.md).

**PAA** -- Bohemias proprietaeres Texturformat (`.paa`). Konvertiert aus `.tga`- oder `.png`-Quelldateien mit TexView2 oder dem Binarisierungsschritt von Addon Builder. Unterstuetzt DXT1-, DXT5- und ARGB-Kompression. Siehe [Kapitel 4.1](04-file-formats/01-textures.md).

**PBO** -- Packed Bohemia Object (`.pbo`): das Archivformat zur Verteilung von DayZ-Mod-Inhalten. Enthaelt Skripte, Konfigurationen, Texturen, Modelle und Datendateien. Erstellt mit Addon Builder oder Tools von Drittanbietern. Siehe [Kapitel 4.6](04-file-formats/06-pbo-packing.md).

**PlayerBase** -- Die primaere Spielerentitaetsklasse, mit der Modder arbeiten. Erweitert `DayZPlayer` und bietet Zugriff auf Inventar, Schaden, Statuseffekte und alle spielerbezogenen Funktionen. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**PlayerIdentity** -- Engine-Klasse, die die Metadaten eines verbundenen Spielers enthaelt: Steam-UID, Name, Netzwerk-ID und Ping. Serverseitig zugaenglich ueber `PlayerBase.GetIdentity()`. Unverzichtbar fuer Admin-Tools und Persistenz. Siehe [Kapitel 6.9](06-engine-api/09-networking.md).

**PPE (Post-Process-Effekte)** -- Engine-System fuer Bildschirmeffekte: Unschaerfe, Farbabstufung, chromatische Aberration, Vignette, Filmkorn. Gesteuert ueber `PPERequester`-Klassen. Siehe [Kapitel 6.5](06-engine-api/05-ppe.md).

**Print** -- Eingebaute Funktion zur Ausgabe von Text in das Skript-Log (`%localappdata%/DayZ/`-Logdateien). Nuetzlich zum Debuggen, sollte aber in Produktionscode entfernt oder geschuetzt werden. Siehe [Kapitel 1.11](01-enforce-script/11-error-handling.md).

**Proto Native** -- Funktionen, die mit `proto native` deklariert sind, sind in der C++-Engine implementiert, nicht im Skript. Sie ueberbruecken Enforce Script zu Engine-Interna und koennen nicht ueberschrieben werden. Siehe [Kapitel 1.3](01-enforce-script/03-classes-inheritance.md).

---

## Q

**Quaternion** -- Eine Vier-Komponenten-Rotationsdarstellung, die intern von der Engine verwendet wird. In der Praxis arbeiten DayZ-Modder typischerweise mit Euler-Winkeln (`vector` aus Pitch/Yaw/Roll) und die Engine konvertiert intern. Siehe [Kapitel 1.7](01-enforce-script/07-math-vectors.md).

---

## R

**ref** -- Enforce-Script-Schluesselwort, das eine starke Referenz auf ein verwaltetes Objekt deklariert. Verhindert Garbage Collection, solange die Referenz existiert. Verwende `ref` fuer Besitz; rohe Referenzen fuer nicht-besitzende Zeiger. Vorsicht vor `ref`-Zyklen (A referenziert B, B referenziert A), die Speicherlecks verursachen. Siehe [Kapitel 1.8](01-enforce-script/08-memory-management.md).

**requiredAddons** -- Array in `CfgPatches`, das angibt, welche Addons vor deinem geladen werden muessen. Steuert die Skriptkompilierungs- und Konfigurationsvererbungsreihenfolge zwischen Mods. Falsche Angaben verursachen "fehlende Klasse"-Fehler oder stille Ladefehler. Siehe [Kapitel 2.2](02-mod-structure/02-config-cpp.md).

**RPC (Remote Procedure Call)** -- Mechanismus zum Senden von Daten zwischen Server und Client. DayZ bietet `GetGame().RPCSingleParam()` und `ScriptRPC` fuer benutzerdefinierte Kommunikation. Erfordert uebereinstimmende Sender und Empfaenger auf der richtigen Maschine. Siehe [Kapitel 6.9](06-engine-api/09-networking.md).

**RVMAT** -- Materialdefinitionsdatei (`.rvmat`), die vom DayZ-Renderer verwendet wird. Spezifiziert Texturen, Shader und Oberflaecheneigenschaften fuer 3D-Modelle. Siehe [Kapitel 4.3](04-file-formats/03-materials.md).

---

## S

**Scope (Config)** -- Ganzzahlwert in `CfgVehicles`, der die Gegenstandssichtbarkeit steuert: `0` = versteckt/abstrakt (spawnt nie), `1` = nur per Skript zugaenglich, `2` = im Spiel sichtbar und von der Central Economy spawnbar. Siehe [Kapitel 2.2](02-mod-structure/02-config-cpp.md).

**ScriptRPC** -- Enforce-Script-Klasse zum Erstellen und Senden benutzerdefinierter RPC-Nachrichten. Ermoeglicht das Schreiben mehrerer Parameter (ints, floats, strings, vectors) in ein einzelnes Netzwerkpaket. Siehe [Kapitel 6.9](06-engine-api/09-networking.md).

**SEffectManager** -- Singleton-Manager fuer visuelle und Sound-Effekte. Verarbeitet Partikelerstellung, Soundwiedergabe und Effekt-Lifecycle. Verwende `SEffectManager.PlayInWorld()` fuer positionierte Effekte. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**Singleton** -- Entwurfsmuster, das sicherstellt, dass nur eine Instanz einer Klasse existiert. In Enforce Script haeufig implementiert mit einer statischen `GetInstance()`-Methode, die die Instanz in einer `static ref`-Variable speichert. Siehe [Kapitel 7.1](07-patterns/01-singletons.md).

**Slot** -- Ein benannter Befestigungspunkt auf einer Entitaet (z.B. `"Shoulder"`, `"Hands"`, `"Slot_Magazine"`). Definiert in config.cpp unter `InventorySlots` und dem `attachments[]`-Array der Entitaet. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

**stringtable.csv** -- CSV-Datei, die lokalisierte Strings fuer bis zu 13 Sprachen bereitstellt. Im Code ueber `#STR_`-vorangestellte Schluessel referenziert. Die Engine waehlt automatisch die richtige Sprachspalte. Siehe [Kapitel 5.1](05-config-files/01-stringtable.md).

**super** -- Schluesselwort, das innerhalb einer Methodenueberschreibung verwendet wird, um die Implementierung der Elternklasse aufzurufen. Rufe immer `super.MethodName()` in ueberschriebenen Methoden auf, es sei denn, du willst bewusst die Elternlogik ueberspringen. Siehe [Kapitel 1.3](01-enforce-script/03-classes-inheritance.md).

---

## T

**TexView2** -- DayZ-Tools-Utility zum Anzeigen und Konvertieren von Texturen zwischen `.tga`-, `.png`-, `.paa`- und `.edds`-Formaten. Wird auch zum Inspizieren von PAA-Kompression, Mipmaps und Alphakanaelen verwendet. Siehe [Kapitel 4.5](04-file-formats/05-dayz-tools.md).

**typename** -- Enforce-Script-Typ, der eine Klassenreferenz zur Laufzeit repraesentiert. Wird fuer Reflexion, Factory-Muster und dynamische Typueberpruefung verwendet. Von einer Instanz erhalten mit `obj.Type()` oder direkt von einem Klassennamen: `typename t = PlayerBase;`. Siehe [Kapitel 1.9](01-enforce-script/09-casting-reflection.md).

**types.xml** -- Central-Economy-XML-Datei, die fuer jeden spawnbaren Gegenstand die Sollanzahl, Lebensdauer, Nachfuellverhalten, Spawnkategorien und Tier-Zonen definiert. Befindet sich im `db/`-Ordner der Mission. Siehe [Kapitel 6.10](06-engine-api/10-central-economy.md).

---

## U

**UAInput** -- Engine-Klasse, die eine einzelne Eingabeaktion (Tastenbelegung) repraesentiert. Erstellt ueber `GetUApi().RegisterInput()` und verwendet zur Erkennung von Tastendruecken, Halten und Loslassen. Definiert zusammen mit `inputs.xml`. Siehe [Kapitel 6.13](06-engine-api/13-input-system.md).

**Unlink** -- Methode zum sicheren Zerstoeren und Dereferenzieren eines verwalteten Objekts. Bevorzugt gegenueber dem Setzen auf `null`, wenn sofortige Bereinigung erforderlich ist. Aufgerufen als `GetGame().ObjectDelete(obj)` fuer Entitaeten. Siehe [Kapitel 1.8](01-enforce-script/08-memory-management.md).

---

## V

**View Geometry** -- 3D-Modell-LOD, das fuer visuelle Verdeckungstests verwendet wird (KI-Sichtpruefungen, Spieler-Sichtlinien). Bestimmt, ob ein Objekt die Sicht blockiert. Getrennt vom Geometry-LOD (Kollision) und Fire Geometry (Ballistik). Siehe [Kapitel 4.2](04-file-formats/02-models.md).

---

## W

**Widget** -- Basisklasse fuer alle UI-Elemente im DayZ-GUI-System. Untertypen umfassen `TextWidget`, `ImageWidget`, `ButtonWidget`, `EditBoxWidget`, `ScrollWidget` und Container-Typen wie `WrapSpacerWidget`. Siehe [Kapitel 3.1](03-gui-system/01-widget-types.md).

**Workbench** -- DayZ-Tools-IDE zum Bearbeiten von Skripten, Konfigurationen und zum Ausfuehren des Spiels im Entwicklungsmodus. Bietet Skriptkompilierung, Breakpoints und den Resource Browser. Siehe [Kapitel 4.5](04-file-formats/05-dayz-tools.md).

**WrapSpacer** -- Container-Widget, das seine Kinder in Zeilen/Spalten umbricht (wie CSS Flexbox Wrap). Unverzichtbar fuer dynamische Listen, Inventarraster und jedes Layout, bei dem die Kindanzahl variiert. Siehe [Kapitel 3.4](03-gui-system/04-containers.md).

---

## X

**XML-Configs** -- Sammelbegriff fuer die vielen XML-Konfigurationsdateien, die von DayZ-Servern verwendet werden: `types.xml`, `globals.xml`, `economy.xml`, `events.xml`, `cfglimitsdefinition.xml`, `mapgrouppos.xml` und andere. Siehe [Kapitel 6.10](06-engine-api/10-central-economy.md).

---

## Z

**Zone (Schadenszone)** -- Ein benannter Bereich auf dem Modell einer Entitaet, der eine unabhaengige Gesundheitsverfolgung erhaelt. Definiert in config.cpp unter `DamageSystem` mit `class DamageZones`. Haeufige Zonen auf Spielern: `Head`, `Torso`, `LeftArm`, `LeftLeg`, etc. Siehe [Kapitel 6.1](06-engine-api/01-entity-system.md).

---

*Fehlt ein Begriff? Erstelle ein Issue oder reiche einen Pull Request ein.*
