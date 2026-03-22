# Kapitel 5.3: Credits.json

[Startseite](../README.md) | [<< Zurück: inputs.xml](02-inputs-xml.md) | **Credits.json** | [Weiter: ImageSet-Format >>](04-imagesets.md)

---

> **Zusammenfassung:** Die `Credits.json`-Datei definiert die Credits, die DayZ für Ihre Mod im Mod-Menü des Spiels anzeigt. Sie listet Teammitglieder, Mitwirkende und Danksagungen auf, organisiert nach Abteilungen und Sektionen. Obwohl rein kosmetisch, ist sie der Standardweg, um Ihrem Entwicklungsteam Anerkennung zu geben.

---

## Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Dateispeicherort](#dateispeicherort)
- [JSON-Struktur](#json-struktur)
- [Wie DayZ Credits anzeigt](#wie-dayz-credits-anzeigt)
- [Lokalisierte Sektionsnamen verwenden](#lokalisierte-sektionsnamen-verwenden)
- [Vorlagen](#vorlagen)
- [Praxisbeispiele](#praxisbeispiele)
- [Häufige Fehler](#häufige-fehler)

---

## Übersicht

Wenn ein Spieler Ihre Mod im DayZ-Launcher oder im Spiel-Mod-Menü auswählt, sucht die Engine nach einer `Credits.json`-Datei innerhalb des PBOs Ihrer Mod. Wenn gefunden, werden die Credits in einer scrollenden Ansicht angezeigt, organisiert in Abteilungen und Sektionen --- ähnlich wie Filmcredits.

Die Datei ist optional. Wenn sie fehlt, erscheint kein Credits-Bereich für Ihre Mod. Aber eine einzuschließen ist gute Praxis: Sie würdigt die Arbeit Ihres Teams und verleiht Ihrer Mod ein professionelles Erscheinungsbild.

---

## Dateispeicherort

Platzieren Sie `Credits.json` in einem `Data`-Unterordner Ihres Scripts-Verzeichnisses oder direkt im Scripts-Stammverzeichnis:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- Häufiger Speicherort (COT, Expansion, DayZ Editor)
        Credits.json         <-- Ebenfalls gültig (DabsFramework, Colorful-UI)
```

Beide Speicherorte funktionieren. Die Engine durchsucht den PBO-Inhalt nach einer Datei namens `Credits.json` (auf einigen Plattformen groß-/kleinschreibungsempfindlich).

---

## JSON-Struktur

Die Datei verwendet eine unkomplizierte JSON-Struktur mit drei Hierarchieebenen:

```json
{
    "Header": "Mein Mod-Name",
    "Departments": [
        {
            "DepartmentName": "Abteilungstitel",
            "Sections": [
                {
                    "SectionName": "Sektionstitel",
                    "Names": ["Person 1", "Person 2"]
                }
            ]
        }
    ]
}
```

### Felder der obersten Ebene

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|--------------|
| `Header` | String | Nein | Haupttitel, der oben in den Credits angezeigt wird. Wenn weggelassen, wird keine Kopfzeile angezeigt. |
| `Departments` | Array | Ja | Array von Abteilungsobjekten |

### Abteilungsobjekt

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|--------------|
| `DepartmentName` | String | Ja | Sektionskopftext. Kann leer `""` sein für visuelle Gruppierung ohne Kopfzeile. |
| `Sections` | Array | Ja | Array von Sektionsobjekten innerhalb dieser Abteilung |

### Sektionsobjekt

In der Praxis existieren zwei Varianten zum Auflisten von Namen. Die Engine unterstützt beide.

**Variante 1: `Names`-Array** (verwendet von MyMod Core)

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|--------------|
| `SectionName` | String | Ja | Unterüberschrift innerhalb der Abteilung |
| `Names` | Array von Strings | Ja | Liste der Mitwirkendennamen |

**Variante 2: `SectionLines`-Array** (verwendet von COT, Expansion, DabsFramework)

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|--------------|
| `SectionName` | String | Ja | Unterüberschrift innerhalb der Abteilung |
| `SectionLines` | Array von Strings | Ja | Liste der Mitwirkendennamen oder Textzeilen |

Sowohl `Names` als auch `SectionLines` dienen demselben Zweck. Verwenden Sie, was Sie bevorzugen --- die Engine rendert sie identisch.

---

## Wie DayZ Credits anzeigt

Die Credits-Anzeige folgt dieser visuellen Hierarchie:

```
╔══════════════════════════════════╗
║         MEIN MOD-NAME            ║  <-- Header (groß, zentriert)
║                                  ║
║     ABTEILUNGSNAME               ║  <-- DepartmentName (mittel, zentriert)
║                                  ║
║     Sektionsname                 ║  <-- SectionName (klein, zentriert)
║     Person 1                     ║  <-- Names/SectionLines (Liste)
║     Person 2                     ║
║     Person 3                     ║
║                                  ║
║     Andere Sektion               ║
║     Person A                     ║
║     Person B                     ║
║                                  ║
║     ANDERE ABTEILUNG             ║
║     ...                          ║
╚══════════════════════════════════╝
```

- Der `Header` erscheint einmal oben
- Jeder `DepartmentName` fungiert als großer Abschnittsteiler
- Jeder `SectionName` fungiert als Unterüberschrift
- Namen scrollen vertikal in der Credits-Ansicht

### Leere Strings für Abstände

Expansion verwendet leere `DepartmentName`- und `SectionName`-Strings sowie Leerzeichen-Einträge in `SectionLines`, um visuelle Abstände zu erzeugen:

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

Dies ist ein häufiger Trick zur Steuerung des visuellen Layouts im Credits-Scroll.

---

## Lokalisierte Sektionsnamen verwenden

Sektionsnamen können Stringtable-Schlüssel mit dem `#`-Präfix referenzieren, genau wie UI-Text:

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

Wenn die Engine dies rendert, löst sie `#STR_EXPANSION_CREDITS_SCRIPTERS` in den lokalisierten Text auf, der zur Sprache des Spielers passt. Dies ist nützlich, wenn Ihre Mod mehrere Sprachen unterstützt und Sie die Credits-Sektionsüberschriften übersetzen möchten.

Abteilungsnamen können ebenfalls Stringtable-Referenzen verwenden:

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## Vorlagen

### Solo-Entwickler

```json
{
    "Header": "Meine tolle Mod",
    "Departments": [
        {
            "DepartmentName": "Entwicklung",
            "Sections": [
                {
                    "SectionName": "Entwickler",
                    "Names": ["IhrName"]
                }
            ]
        }
    ]
}
```

### Kleines Team

```json
{
    "Header": "Meine Mod",
    "Departments": [
        {
            "DepartmentName": "Entwicklung",
            "Sections": [
                {
                    "SectionName": "Entwickler",
                    "Names": ["Lead Dev", "Co-Developer"]
                },
                {
                    "SectionName": "3D-Künstler",
                    "Names": ["Modeler1", "Modeler2"]
                },
                {
                    "SectionName": "Übersetzer",
                    "Names": [
                        "Übersetzer1 (Französisch)",
                        "Übersetzer2 (Deutsch)",
                        "Übersetzer3 (Russisch)"
                    ]
                }
            ]
        }
    ]
}
```

### Volle professionelle Struktur

```json
{
    "Header": "Meine große Mod",
    "Departments": [
        {
            "DepartmentName": "Kernteam",
            "Sections": [
                {
                    "SectionName": "Leitender Entwickler",
                    "Names": ["ProjektLeiter"]
                },
                {
                    "SectionName": "Scripter",
                    "Names": ["Dev1", "Dev2", "Dev3"]
                },
                {
                    "SectionName": "3D-Künstler",
                    "Names": ["Künstler1", "Künstler2"]
                },
                {
                    "SectionName": "Kartierung",
                    "Names": ["Mapper1"]
                }
            ]
        },
        {
            "DepartmentName": "Gemeinschaft",
            "Sections": [
                {
                    "SectionName": "Übersetzer",
                    "Names": [
                        "Übersetzer1 (Tschechisch)",
                        "Übersetzer2 (Deutsch)",
                        "Übersetzer3 (Russisch)"
                    ]
                },
                {
                    "SectionName": "Tester",
                    "Names": ["Tester1", "Tester2", "Tester3"]
                }
            ]
        },
        {
            "DepartmentName": "Rechtliche Hinweise",
            "Sections": [
                {
                    "SectionName": "Lizenzen",
                    "Names": [
                        "Font Awesome - CC BY 4.0 Lizenz",
                        "Einige Assets lizenziert unter ADPL-SA"
                    ]
                }
            ]
        }
    ]
}
```

---

## Praxisbeispiele

### MyMod Core

Eine minimale aber vollständige Credits-Datei mit der `Names`-Variante:

```json
{
    "Header": "MyMod Core",
    "Departments": [
        {
            "DepartmentName": "Entwicklung",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["Dokumentationsteam"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

Verwendet die `SectionLines`-Variante mit mehreren Sektionen und Danksagungen:

```json
{
    "Departments": [
        {
            "DepartmentName": "Community Online Tools",
            "Sections": [
                {
                    "SectionName": "Aktive Entwickler",
                    "SectionLines": [
                        "LieutenantMaster",
                        "LAVA (liquidrock)"
                    ]
                },
                {
                    "SectionName": "Inaktive Entwickler",
                    "SectionLines": [
                        "Jacob_Mango",
                        "Arkensor",
                        "DannyDog68",
                        "Thurston",
                        "GrosTon1"
                    ]
                },
                {
                    "SectionName": "Danke an die folgenden Gemeinschaften",
                    "SectionLines": [
                        "PIPSI.NET AU/NZ",
                        "1SKGaming",
                        "AWG",
                        "Expansion Mod Team",
                        "Bohemia Interactive"
                    ]
                }
            ]
        }
    ]
}
```

Bemerkenswert: COT lässt das `Header`-Feld vollständig weg. Der Mod-Name kommt aus anderen Metadaten (config.cpp `CfgMods`).

### DabsFramework

```json
{
    "Departments": [{
        "DepartmentName": "Entwicklung",
        "Sections": [{
                "SectionName": "Entwickler",
                "SectionLines": [
                    "InclementDab",
                    "Gormirn"
                ]
            },
            {
                "SectionName": "Übersetzer",
                "SectionLines": [
                    "InclementDab",
                    "DanceOfJesus (Französisch)",
                    "MarioE (Spanisch)",
                    "Dubinek (Tschechisch)",
                    "Steve AKA Salutesh (Deutsch)",
                    "Yuki (Russisch)",
                    ".magik34 (Polnisch)",
                    "Daze (Ungarisch)"
                ]
            }
        ]
    }]
}
```

### DayZ Expansion

Expansion demonstriert die anspruchsvollste Verwendung von Credits.json, einschließlich:
- Lokalisierter Sektionsnamen über Stringtable-Referenzen (`#STR_EXPANSION_CREDITS_SCRIPTERS`)
- Rechtliche Hinweise als separate Abteilung
- Leere Abteilungs- und Sektionsnamen für visuelle Abstände
- Eine Unterstützerliste mit Dutzenden von Namen

---

## Häufige Fehler

### Ungültige JSON-Syntax

Das häufigste Problem. JSON ist streng bei:
- **Nachgestellte Kommas**: `["a", "b",]` ist ungültiges JSON (das nachgestellte Komma nach `"b"`)
- **Einfache Anführungszeichen**: Verwenden Sie `"doppelte Anführungszeichen"`, nicht `'einfache Anführungszeichen'`
- **Nicht-zitierte Schlüssel**: `DepartmentName` muss `"DepartmentName"` sein

Verwenden Sie einen JSON-Validator vor der Veröffentlichung.

### Falscher Dateiname

Die Datei muss genau `Credits.json` heißen (großes C). Auf groß-/kleinschreibungsempfindlichen Dateisystemen wird `credits.json` oder `CREDITS.JSON` nicht gefunden.

### Names und SectionLines mischen

Innerhalb einer einzelnen Sektion verwenden Sie das eine oder das andere:

```json
{
    "SectionName": "Entwickler",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

Dies ist mehrdeutig. Wählen Sie ein Format und verwenden Sie es konsistent in der gesamten Datei.

### Kodierungsprobleme

Speichern Sie die Datei als UTF-8. Nicht-ASCII-Zeichen (akzentuierte Namen, CJK-Zeichen) erfordern UTF-8-Kodierung, um im Spiel korrekt angezeigt zu werden.

---

## Bewährte Praktiken

- Validieren Sie Ihr JSON mit einem externen Tool, bevor Sie es in ein PBO packen -- die Engine gibt keine nützliche Fehlermeldung für fehlerhaftes JSON aus.
- Verwenden Sie die `SectionLines`-Variante für Konsistenz, da es das Format ist, das von COT, Expansion und DabsFramework verwendet wird.
- Fügen Sie eine Abteilung "Rechtliche Hinweise" hinzu, wenn Ihre Mod Drittanbieter-Assets (Schriftarten, Icons, Sounds) mit Zuordnungsanforderungen bündelt.
- Halten Sie das `Header`-Feld passend zum `name` Ihrer Mod in `mod.cpp` und `config.cpp` für eine konsistente Identität.
- Verwenden Sie leere `DepartmentName`- und `SectionName`-Strings sparsam für visuelle Abstände -- übermäßige Verwendung lässt Credits fragmentiert wirken.

---

## Kompatibilität und Auswirkungen

- **Multi-Mod:** Jede Mod hat ihre eigene unabhängige `Credits.json`. Es besteht kein Kollisionsrisiko -- die Engine liest die Datei separat aus dem PBO jeder Mod.
- **Leistung:** Credits werden nur geladen, wenn der Spieler den Mod-Details-Bildschirm öffnet. Die Dateigröße hat keine Auswirkung auf die Spielleistung.
