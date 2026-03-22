# Kapitel 8.2: Ein eigenes Item erstellen

[Startseite](../../README.md) | [<< Zurück: Ihre erste Mod](01-first-mod.md) | **Ein eigenes Item erstellen** | [Weiter: Ein Admin-Panel bauen >>](03-admin-panel.md)

---

## Inhaltsverzeichnis

- [Was wir bauen](#was-wir-bauen)
- [Voraussetzungen](#voraussetzungen)
- [Schritt 1: Die Item-Klasse in config.cpp definieren](#schritt-1-die-item-klasse-in-configcpp-definieren)
- [Schritt 2: Hidden Selections für Texturen einrichten](#schritt-2-hidden-selections-für-texturen-einrichten)
- [Schritt 3: Grundlegende Texturen erstellen](#schritt-3-grundlegende-texturen-erstellen)
- [Schritt 4: In types.xml für Server-Spawning hinzufügen](#schritt-4-in-typesxml-für-server-spawning-hinzufügen)
- [Schritt 5: Einen Anzeigenamen mit Stringtable erstellen](#schritt-5-einen-anzeigenamen-mit-stringtable-erstellen)
- [Schritt 6: Im Spiel testen](#schritt-6-im-spiel-testen)
- [Schritt 7: Feinschliff -- Modell, Texturen und Sounds](#schritt-7-feinschliff----modell-texturen-und-sounds)
- [Vollständige Dateireferenz](#vollständige-dateireferenz)
- [Fehlerbehebung](#fehlerbehebung)
- [Nächste Schritte](#nächste-schritte)

---

## Was wir bauen

Wir erstellen ein Item namens **Field Journal** -- ein kleines Notizbuch, das Spieler in der Welt finden, aufheben und in ihrem Inventar aufbewahren können. Es wird:

- Ein Vanilla-Modell verwenden (von einem bestehenden Item geliehen), sodass wir keine 3D-Modellierung benötigen
- Ein eigenes retexturiertes Erscheinungsbild über Hidden Selections haben
- In der Spawntabelle des Servers erscheinen
- Einen korrekten Anzeigenamen und eine Beschreibung haben

Dies ist der Standard-Workflow zum Erstellen jedes Items in DayZ, sei es Nahrung, Werkzeuge, Kleidung oder Baumaterialien.

---

## Voraussetzungen

- Eine funktionierende Mod-Struktur (schliessen Sie zuerst [Kapitel 8.1](01-first-mod.md) ab)
- Ein Texteditor
- DayZ Tools installiert (für Texturkonvertierung, optional)

Wir bauen auf der Mod aus Kapitel 8.1 auf. Ihre aktuelle Struktur sollte so aussehen:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        5_Mission/
            MyFirstMod/
                MissionHello.c
```

---

## Schritt 1: Die Item-Klasse in config.cpp definieren

Items in DayZ werden in der `CfgVehicles`-Config-Klasse definiert. Trotz des Namens "Vehicles" hält diese Klasse ALLE Entitätstypen: Items, Gebäude, Fahrzeuge, Tiere und alles andere.

### Eine Data-config.cpp erstellen

Es ist Best Practice, Item-Definitionen in einem separaten PBO von Ihren Skripten zu halten. Erstellen Sie eine neue Ordnerstruktur:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp              <-- Existiert bereits (Skripte)
    Data/
        config.cpp              <-- NEU (Item-Definitionen)
```

Erstellen Sie die Datei `MyFirstMod/Data/config.cpp` mit diesem Inhalt:

```cpp
class CfgPatches
{
    class MyFirstMod_Data
    {
        units[] = { "MFM_FieldJournal" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Characters"
        };
    };
};

class CfgVehicles
{
    class Inventory_Base;

    class MFM_FieldJournal : Inventory_Base
    {
        scope = 2;
        displayName = "$STR_MFM_FieldJournal";
        descriptionShort = "$STR_MFM_FieldJournal_Desc";
        model = "\DZ\characters\accessories\data\Notebook\Notebook.p3d";
        rotationFlags = 17;
        weight = 200;
        itemSize[] = { 1, 2 };
        absorbency = 0.5;

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 100;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };
        };

        hiddenSelections[] = { "camoGround" };
        hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
    };
};
```

### Was jedes Feld bedeutet

| Feld | Wert | Erklärung |
|-------|-------|-------------|
| `scope` | `2` | Macht das Item öffentlich -- spawnbar und in Admin-Tools sichtbar. Verwenden Sie `0` für Basisklassen, die nie direkt gespawnt werden sollen. |
| `displayName` | `"$STR_MFM_FieldJournal"` | Referenziert einen Stringtable-Eintrag für den Itemnamen. Das `$STR_`-Präfix sagt der Engine, ihn in der `stringtable.csv` nachzuschlagen. |
| `descriptionShort` | `"$STR_MFM_FieldJournal_Desc"` | Kurzbeschreibung, die im Inventar-Tooltip angezeigt wird. |
| `model` | Pfad zur `.p3d` | Das 3D-Modell. Wir leihen das Vanilla-Notizbuch-Modell. Das `\DZ\`-Präfix referenziert Vanilla-Spieldateien. |
| `rotationFlags` | `17` | Bitmaske, die steuert, wie das Item im Inventar rotiert werden kann. `17` erlaubt Standardrotation. |
| `weight` | `200` | Gewicht in Gramm. |
| `itemSize[]` | `{ 1, 2 }` | Inventar-Rastergröße: 1 Spalte breit, 2 Zeilen hoch. |
| `absorbency` | `0.5` | Wie stark das Item Wasser absorbiert (0 = gar nicht, 1 = vollständig). Beeinflusst das Item bei Regen. |
| `hiddenSelections[]` | `{ "camoGround" }` | Benannte Texturslots auf dem Modell, die überschrieben werden können. |
| `hiddenSelectionsTextures[]` | Pfad zur `.paa` | Ihre eigene Textur für jede Hidden Selection. |

### Über die Elternklasse

```cpp
class Inventory_Base;
```

Diese Zeile ist eine **Vorwärtsdeklaration**. Sie sagt dem Config-Parser, dass `Inventory_Base` existiert (sie ist im Vanilla-DayZ definiert). Ihre Item-Klasse erbt dann davon:

```cpp
class MFM_FieldJournal : Inventory_Base
```

`Inventory_Base` ist die Standard-Elternklasse für kleine Items, die ins Spielerinventar gehen. Andere häufige Elternklassen:

| Elternklasse | Verwenden für |
|-------------|---------|
| `Inventory_Base` | Generische Inventar-Items |
| `Edible_Base` | Nahrung und Getränke |
| `Clothing_Base` | Tragbare Kleidung/Ruestung |
| `Weapon_Base` | Feuerwaffen |
| `Magazine_Base` | Magazine und Munitionsboxen |
| `HouseNoDestruct` | Gebäude und Strukturen |

### Über DamageSystem

Der `DamageSystem`-Block definiert, wie das Item Schaden nimmt und abnutzt. Das `healthLevels`-Array ordnet Gesundheitsprozente Texturzuständen zu:

- `1.0` = makellos
- `0.7` = abgenutzt
- `0.5` = beschädigt
- `0.3` = stark beschädigt
- `0.0` = ruiniert

Die leeren `{}` nach jeder Stufe sind Platzhalter für Schadensoverlay-Texturen. Zur Vereinfachung lassen wir sie leer.

---

## Schritt 2: Hidden Selections für Texturen einrichten

Hidden Selections sind der Mechanismus, den DayZ verwendet, um Texturen auf einem 3D-Modell zu tauschen, ohne die Modelldatei selbst zu modifizieren. Das Vanilla-Notizbuch-Modell hat eine Hidden Selection namens `"camoGround"`, die seine Haupttextur steuert.

### Wie Hidden Selections funktionieren

1. Das 3D-Modell (`.p3d`) definiert benannte Bereiche, sogenannte **Selektionen**
2. In der config.cpp listet `hiddenSelections[]` auf, welche Selektionen Sie überschreiben möchten
3. `hiddenSelectionsTextures[]` stellt Ihre Ersatztexturen bereit, in passender Reihenfolge

```cpp
hiddenSelections[] = { "camoGround" };
hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
```

Der erste Eintrag in `hiddenSelectionsTextures` ersetzt den ersten Eintrag in `hiddenSelections`. Wenn Sie mehrere Selektionen hätten:

```cpp
hiddenSelections[] = { "camoGround", "camoMale", "camoFemale" };
hiddenSelectionsTextures[] = { "pfad\tex1.paa", "pfad\tex2.paa", "pfad\tex3.paa" };
```

### Hidden-Selection-Namen finden

Um herauszufinden, welche Hidden Selections ein Vanilla-Modell unterstützt:

1. Öffnen Sie **Object Builder** (aus DayZ Tools)
2. Laden Sie die `.p3d`-Modelldatei
3. Schauen Sie in die **Named Selections**-Liste
4. Selektionen, die mit `"camo"` beginnen, sind typischerweise die, die Sie überschreiben können

Alternativ schauen Sie in die Vanilla-`config.cpp` des Items, auf dem Sie Ihr Item basieren. Das `hiddenSelections[]`-Array zeigt, was verfügbar ist.

---

## Schritt 3: Grundlegende Texturen erstellen

DayZ verwendet das `.paa`-Format für Texturen. Während der Entwicklung können Sie mit einem einfachen farbigen Bild beginnen und es später konvertieren.

### Den Texturordner erstellen

```
MyFirstMod/
    Data/
        config.cpp
        Textures/
            field_journal_co.paa
```

### Option A: Einen Platzhalter verwenden (am schnellsten)

Für erste Tests können Sie `hiddenSelectionsTextures` auf eine Vanilla-Textur zeigen lassen, anstatt eine eigene zu erstellen:

```cpp
hiddenSelectionsTextures[] = { "\DZ\characters\accessories\data\Notebook\notebook_co.paa" };
```

Dies verwendet die Vanilla-Notizbuch-Textur. Ihr Item sieht identisch zum Vanilla-Notizbuch aus, funktioniert aber als Ihr eigenes Item. Ersetzen Sie es durch Ihre eigene Textur, sobald Sie bestätigt haben, dass alles funktioniert.

### Option B: Eine eigene Textur erstellen

1. **Ein Quellbild erstellen:**
   - Öffnen Sie einen beliebigen Bildeditor (GIMP, Photoshop, Paint.NET oder sogar MS Paint)
   - Erstellen Sie ein neues Bild mit **512x512 Pixeln** (Zweierpotenzen sind erforderlich: 256, 512, 1024, 2048)
   - Fuellen Sie es mit einer Farbe oder einem Design. Für ein Feldtagebuch versuchen Sie ein dunkles Braun oder Gruen.
   - Speichern Sie als `.tga` (TGA-Format) oder `.png`

2. **In `.paa` konvertieren:**
   - Öffnen Sie **TexView2** aus DayZ Tools
   - Gehen Sie zu **File > Open** und wählen Sie Ihre `.tga` oder `.png`
   - Gehen Sie zu **File > Save As** und speichern Sie im `.paa`-Format
   - Speichern Sie nach `MyFirstMod/Data/Textures/field_journal_co.paa`

   Das `_co`-Suffix ist eine Namenskonvention für "Color" (die Diffuse-/Albedo-Textur). Andere Suffixe sind `_nohq` (Normal Map), `_smdi` (Specular) und `_as` (Alpha/Transparenz).

### Textur-Namenskonventionen

| Suffix | Typ | Zweck |
|--------|------|---------|
| `_co` | Farbe (Diffuse) | Die Hauptfarb-/Erscheinungstextur |
| `_nohq` | Normal Map | Oberflächendetail und Beleuchtungsnormalen |
| `_smdi` | Specular | Gläns- und Metalleigenschaften |
| `_as` | Alpha/Surface | Transparenz oder Oberflächenmaskierung |
| `_de` | Detail | Zusätzliches Detail-Overlay |

Für ein erstes Item benötigen Sie nur die `_co`-Textur. Das Modell verwendet Standardwerte für die anderen.

---

## Schritt 4: In types.xml für Server-Spawning hinzufügen

Die `types.xml`-Datei steuert, welche Items in der Welt spawnen, wie viele gleichzeitig existieren und wo sie erscheinen. Diese Datei befindet sich im **Missionsordner** des Servers (nicht in Ihrer Mod).

### types.xml finden

Für einen Standard-DayZ-Server befindet sich `types.xml` unter:

```
<DayZ Server>\mpmissions\dayzOffline.chernarusplus\db\types.xml
```

### Ihren Item-Eintrag hinzufügen

Öffnen Sie `types.xml` und fügen Sie diesen Block innerhalb des `<types>`-Wurzelelements hinzu:

```xml
<type name="MFM_FieldJournal">
    <nominal>10</nominal>
    <lifetime>14400</lifetime>
    <restock>1800</restock>
    <min>5</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="tools" />
    <usage name="Town" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
</type>
```

### Was jedes Tag bedeutet

| Tag | Wert | Erklärung |
|-----|-------|-------------|
| `name` | `"MFM_FieldJournal"` | Muss exakt mit Ihrem config.cpp-Klassennamen übereinstimmen |
| `nominal` | `10` | Zielanzahl dieses Items in der Welt zu jedem Zeitpunkt |
| `lifetime` | `14400` | Sekunden bevor ein fallengelassenes Item despawnt (14400 = 4 Stunden) |
| `restock` | `1800` | Sekunden zwischen Respawn-Pruefungen (1800 = 30 Minuten) |
| `min` | `5` | Minimum, das die Central Economy aufrechtzuerhalten versucht |
| `quantmin` / `quantmax` | `-1` | Mengenbereich (-1 = nicht anwendbar, verwendet für Items mit variabler Menge wie Wasserflaschen) |
| `cost` | `100` | Wirtschafts-Prioritätsgewicht (höher = spawnt bereitwilliger) |
| `flags` | Verschiedene | Was zum Nominal-Limit zählt |
| `category` | `"tools"` | Item-Kategorie für Wirtschaftsbalancierung |
| `usage` | `"Town"`, `"Village"` | Wo das Item spawnt (Standortkategorien) |
| `value` | `"Tier1"`, `"Tier2"` | Karten-Tier-Zonen, in denen das Item erscheint |

### Häufige usage- und value-Tags

**Usage (wo es spawnt):**
- `Town`, `Village`, `Farm`, `Industrial`, `Military`, `Hunting`, `Medical`, `Coast`, `Firefighter`, `Prison`, `Police`, `School`, `ContaminatedArea`

**Value (Karten-Tier):**
- `Tier1` -- Küste/Startgebiete
- `Tier2` -- Inland-Städte
- `Tier3` -- Militär/Nordwesten
- `Tier4` -- Tiefstes Inland/Endgame

---

## Schritt 5: Einen Anzeigenamen mit Stringtable erstellen

Die Stringtable bietet lokalisierte Texte für Item-Namen und -Beschreibungen. DayZ liest Stringtables aus `stringtable.csv`-Dateien.

### Die Stringtable erstellen

Erstellen Sie die Datei `MyFirstMod/Data/Stringtable.csv` mit diesem Inhalt:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MFM_FieldJournal","Field Journal","","Feldtagebuch","","","","","","","","","","",""
"STR_MFM_FieldJournal_Desc","A weathered leather journal used to record field notes and observations.","","Ein abgenutztes Ledertagebuch zum Aufzeichnen von Feldnotizen und Beobachtungen.","","","","","","","","","","",""
```

Jede Zeile hat Spalten für jede unterstützte Sprache. Sie müssen nur die `"English"`-Spalte ausfüllen. Die anderen Spalten können leere Strings sein -- die Engine fällt auf Englisch zurück, wenn eine Übersetzung fehlt.

### Wie String-Referenzen funktionieren

In Ihrer config.cpp haben Sie geschrieben:

```cpp
displayName = "$STR_MFM_FieldJournal";
```

Das `$STR_`-Präfix sagt der Engine: "Suche einen Stringtable-Eintrag namens `STR_MFM_FieldJournal`." Die Engine durchsucht alle geladenen `Stringtable.csv`-Dateien nach einer passenden Zeile und gibt den Text für die Sprache des Spielers zurück.

### CSV-Formatregeln

- Die erste Zeile muss die Kopfzeile mit Sprachnamen sein (in der exakten Reihenfolge wie oben gezeigt)
- Jede folgende Zeile ist: `"SCHLUESSEL","Englischer Text","Tschechischer Text",...`
- Alle Werte müssen in doppelten Anführungszeichen stehen
- Werte durch Kommas trennen
- Kein abschliessendes Komma nach dem letzten Wert
- Als UTF-8-Kodierung speichern (wichtig für Nicht-ASCII-Zeichen in anderen Sprachen)

---

## Schritt 6: Im Spiel testen

### Ihre Scripts-config.cpp aktualisieren

Vor dem Testen müssen Sie Ihre `Scripts/config.cpp` aktualisieren, um auch den Data-Ordner zu packen, ODER den Data-Ordner als separates PBO packen.

**Option A: Separates PBO (empfohlen)**

Packen Sie `MyFirstMod/Data/` als zweites PBO:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Enthält Scripts/config.cpp und 5_Mission/
        Data.pbo             <-- Enthält Data/config.cpp, Textures/, Stringtable.csv
```

Verwenden Sie Addon Builder mit:
- Source: `MyFirstMod/Data/`
- Prefix: `MyFirstMod/Data`

**Option B: File Patching (Entwicklung)**

Während der Entwicklung mit `-filePatching` liest die Engine direkt aus Ihren Ordnern. Kein zusätzliches PBO-Packen nötig:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Das Item über die Skriptkonsole spawnen

Der schnellste Weg, Ihr Item zu testen, ohne auf natürliches Spawnen zu warten:

1. Starten Sie DayZ mit geladener Mod
2. Treten Sie Ihrem lokalen Server bei oder starten Sie den Offline-Modus
3. Öffnen Sie die **Skriptkonsole** (bei Verwendung von DayZDiag ist diese über das Debug-Menü verfügbar)
4. Geben Sie in der Skriptkonsole ein:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MFM_FieldJournal");
```

5. Drücken Sie **Execute** (oder den Ausführen-Button)

Das Item sollte im Inventar Ihres Charakters erscheinen.

### Alternative: In der Nähe des Spielers spawnen

Wenn Ihr Inventar voll ist, spawnen Sie das Item auf dem Boden neben Ihrem Charakter:

```c
vector pos = GetGame().GetPlayer().GetPosition();
GetGame().CreateObject("MFM_FieldJournal", pos, false, false, true);
```

### Was zu prüfen ist

1. **Erscheint das Item?** Wenn ja, ist die config.cpp-Klassendefinition korrekt.
2. **Hat es den richtigen Namen?** Prüfen Sie, ob "Field Journal" erscheint (nicht `$STR_MFM_FieldJournal`). Wenn Sie die rohe Stringreferenz sehen, lädt die Stringtable nicht.
3. **Hat es die richtige Textur?** Wenn Sie eine eigene Textur verwenden, überprüfen Sie, ob die Farben stimmen. Wenn das Item ganz weiss oder pink erscheint, ist der Texturpfad falsch.
4. **Kann man es aufheben?** Wenn das Item spawnt, aber nicht aufgehoben werden kann, prüfen Sie `itemSize` und `scope`.
5. **Sieht das Inventar-Icon korrekt aus?** Die Größe sollte mit Ihrer `itemSize[]`-Definition übereinstimmen.

---

## Schritt 7: Feinschliff -- Modell, Texturen und Sounds

Sobald Ihr Item mit einem geliehenen Modell funktioniert, können Sie es mit eigenen Assets aufwerten.

### Eigenes 3D-Modell

Das Erstellen eines eigenen `.p3d`-Modells erfordert:

1. **Blender oder 3DS Max** mit dem DayZ-Tools-Plugin (Blender ist kostenlos)
2. Das Modell als `.p3d` mit Object Builder exportieren
3. Korrekte Geometrie (visuelle Mesh), Feuergeometrie (Kollision) und View-Geometrie (LODs) definieren
4. UV-Maps für Ihre Texturen erstellen
5. Benannte Selektionen für Hidden Selections definieren

Dies ist ein erheblicher Aufwand. Für die meisten Items ist das Retexturieren eines Vanilla-Modells (wie wir es oben getan haben) ausreichend.

### Verbesserte Texturen

Für ein professionell aussehendes Item:

1. Erstellen Sie eine **2048x2048**-Textur für Nahdetails (oder 1024x1024 für kleine Items)
2. Fügen Sie eine **Normal Map** (`_nohq.paa`) für Oberflächendetails ohne zusätzliche Polygone hinzu
3. Fügen Sie eine **Specular Map** (`_smdi.paa`) für Materialeigenschaften (Glänse, Rauheit) hinzu
4. Aktualisieren Sie Ihre Config:

```cpp
hiddenSelections[] = { "camoGround" };
hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
hiddenSelectionsMaterials[] = { "MyFirstMod\Data\Textures\field_journal.rvmat" };
```

Eine `.rvmat`-Datei (Rvmat-Materialdatei) verbindet alle Textur-Maps:

```cpp
ambient[] = { 1.0, 1.0, 1.0, 1.0 };
diffuse[] = { 1.0, 1.0, 1.0, 1.0 };
forcedDiffuse[] = { 0.0, 0.0, 0.0, 0.0 };
emmisive[] = { 0.0, 0.0, 0.0, 0.0 };
specular[] = { 0.2, 0.2, 0.2, 1.0 };
specularPower = 40;

PixelShaderID = "NormalMap";
VertexShaderID = "NormalMap";

class Stage1
{
    texture = "MyFirstMod\Data\Textures\field_journal_nohq.paa";
    uvSource = "tex";
};

class Stage2
{
    texture = "MyFirstMod\Data\Textures\field_journal_smdi.paa";
    uvSource = "tex";
};
```

### Eigene Sounds

Um einen Sound hinzuzufügen, wenn das Item verwendet oder aufgehoben wird:

1. Erstellen Sie eine `.ogg`-Audiodatei (OGG-Vorbis-Format, das einzige Format, das DayZ für eigene Sounds unterstützt)
2. Definieren Sie `CfgSoundShaders` und `CfgSoundSets` in Ihrer Data-config.cpp:

```cpp
class CfgSoundShaders
{
    class MFM_JournalOpen_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\journal_open", 1 }};
        volume = 0.6;
        range = 3;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MFM_JournalOpen_SoundSet
    {
        soundShaders[] = { "MFM_JournalOpen_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
};
```

Hinweis: Sounddateipfade in `samples[]` enthalten KEINE `.ogg`-Erweiterung.

### Skript-Verhalten hinzufügen

Um Ihrem Item eigenes Verhalten zu geben (zum Beispiel eine Aktion, wenn der Spieler es verwendet), erstellen Sie eine Skriptklasse in `4_World`:

```
MyFirstMod/
    Scripts/
        config.cpp              <-- worldScriptModule-Eintrag hinzufügen
        4_World/
            MyFirstMod/
                MFM_FieldJournal.c
        5_Mission/
            MyFirstMod/
                MissionHello.c
```

Aktualisieren Sie `Scripts/config.cpp`, um die neue Schicht einzuschliessen:

```cpp
dependencies[] = { "World", "Mission" };

class defs
{
    class worldScriptModule
    {
        value = "";
        files[] = { "MyFirstMod/Scripts/4_World" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "MyFirstMod/Scripts/5_Mission" };
    };
};
```

Erstellen Sie `4_World/MyFirstMod/MFM_FieldJournal.c`:

```c
class MFM_FieldJournal extends Inventory_Base
{
    override bool CanPutInCargo(EntityAI parent)
    {
        if (!super.CanPutInCargo(parent))
            return false;

        return true;
    }

    override void SetActions()
    {
        super.SetActions();
        // Eigene Aktionen hier hinzufügen
        // AddAction(ActionReadJournal);
    }

    override void OnInventoryEnter(Man player)
    {
        super.OnInventoryEnter(player);
        Print("[MyFirstMod] Spieler hat das Feldtagebuch aufgehoben!");
    }

    override void OnInventoryExit(Man player)
    {
        super.OnInventoryExit(player);
        Print("[MyFirstMod] Spieler hat das Feldtagebuch abgelegt.");
    }
};
```

---

## Vollständige Dateireferenz

### Endgültige Verzeichnisstruktur

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_FieldJournal.c
        5_Mission/
            MyFirstMod/
                MissionHello.c
    Data/
        config.cpp
        Stringtable.csv
        Textures/
            field_journal_co.paa
```

Die vollständigen Dateiinhalte entsprechen den in den obigen Schritten gezeigten Codebeispielen.

---

## Fehlerbehebung

### Item erscheint nicht beim Spawnen über die Skriptkonsole

- **Klassennamen-Nichtübereinstimmung:** Der Name im Spawn-Befehl muss exakt mit Ihrem config.cpp-Klassennamen übereinstimmen: `"MFM_FieldJournal"` (gross-/kleinschreibungssensitiv).
- **config.cpp nicht geladen:** Prüfen Sie, ob Ihr Data-PBO gepackt und geladen ist, oder ob File Patching aktiv ist.
- **CfgPatches fehlt:** Jede config.cpp muss einen gültigen `CfgPatches`-Block haben.

### Item-Name zeigt `$STR_MFM_FieldJournal` an (rohe Stringreferenz)

- **Stringtable nicht gefunden:** Stellen Sie sicher, dass `Stringtable.csv` im selben PBO wie die Config ist, die sie referenziert, oder im Mod-Stammverzeichnis.
- **Falscher Schlüsselname:** Der Schlüssel in der CSV muss exakt übereinstimmen (ohne das `$`-Präfix): `"STR_MFM_FieldJournal"`.
- **CSV-Formatfehler:** Stellen Sie sicher, dass alle Werte in doppelten Anführungszeichen stehen und die Kopfzeile korrekt ist.

### Item erscheint ganz weiss, pink oder unsichtbar

- **Texturpfad falsch:** Überprüfen Sie, dass `hiddenSelectionsTextures[]` auf die korrekte `.paa`-Datei zeigt. Pfade verwenden in config.cpp Backslashes.
- **Hidden-Selection-Name falsch:** Der Selektionsname muss dem entsprechen, was das Modell definiert. Prüfen Sie mit Object Builder.
- **Textur nicht im PBO:** Bei Verwendung gepackter PBOs muss die Texturdatei im PBO enthalten sein.

### Item kann nicht aufgehoben werden

- **`scope` nicht auf 2 gesetzt:** Stellen Sie sicher, dass `scope = 2;` in Ihrer Item-Klasse steht.
- **`itemSize` zu gross:** Wenn die Item-Größe den Inventarplatz des Spielers übersteigt, kann er es nicht aufheben.
- **Elternklasse falsch:** Stellen Sie sicher, dass Sie von `Inventory_Base` oder einer anderen gültigen Item-Elternklasse erben.

### Item spawnt, hat aber falsche Größe im Inventar

- **`itemSize[]`:** Die Werte sind `{ Spalten, Zeilen }`. `{ 1, 2 }` bedeutet 1 breit und 2 hoch. `{ 2, 3 }` bedeutet 2 breit und 3 hoch.

---

## Nächste Schritte

1. **[Kapitel 8.3: Ein Admin-Panel-Modul bauen](03-admin-panel.md)** -- Erstellen Sie ein UI-Panel mit Server-Client-Kommunikation.
2. **Varianten hinzufügen** -- Erstellen Sie Farbvarianten Ihres Items mit verschiedenen Hidden-Selection-Texturen.
3. **Rezepte hinzufügen** -- Definieren Sie Herstellungskombinationen in config.cpp mit `CfgRecipes`.
4. **Kleidung erstellen** -- Erweitern Sie `Clothing_Base` statt `Inventory_Base` für tragbare Items.
5. **Eine Waffe bauen** -- Erweitern Sie `Weapon_Base` für Feuerwaffen mit Anbauteilen und Animationen.

---

**Zurück:** [Kapitel 8.1: Ihre erste Mod (Hello World)](01-first-mod.md)
**Weiter:** [Kapitel 8.3: Ein Admin-Panel-Modul bauen](03-admin-panel.md)
