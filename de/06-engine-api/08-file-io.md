# Kapitel 6.8: Datei-E/A und JSON

[Startseite](../README.md) | [<< Zurück: Timer und CallQueue](07-timers.md) | **Datei-E/A und JSON** | [Weiter: Netzwerk und RPC >>](09-networking.md)

---

## Einführung

DayZ bietet Datei-E/A-Operationen zum Lesen und Schreiben von Textdateien, JSON-Serialisierung/-Deserialisierung, Verzeichnisverwaltung und Dateiaufzählung. Alle Dateioperationen verwenden spezielle Pfadpräfixe (`$profile:`, `$saves:`, `$mission:`) anstelle absoluter Dateisystempfade. Dieses Kapitel behandelt jede verfügbare Dateioperation in Enforce Script.

---

## Pfadpräfixe

| Präfix | Ort | Beschreibbar |
|--------|-----|--------------|
| `$profile:` | Server-/Client-Profilverzeichnis (z.B. `DayZServer/profiles/`) | Ja |
| `$saves:` | Speicherverzeichnis | Ja |
| `$mission:` | Aktueller Missionsordner (z.B. `mpmissions/dayzOffline.chernarusplus/`) | Nur Lesen typischerweise |
| `$CurrentDir:` | Aktuelles Arbeitsverzeichnis | Abhängig |
| Kein Präfix | Relativ zum Spielstammverzeichnis | Nur Lesen |

> **Wichtig:** Die meisten Schreiboperationen sind auf `$profile:` und `$saves:` beschränkt. Der Versuch, an anderen Orten zu schreiben, kann stillschweigend fehlschlagen.

---

## Dateiexistenzprüfung

```c
proto bool FileExist(string name);
```

Gibt `true` zurück, wenn die Datei am angegebenen Pfad existiert.

**Beispiel:**

```c
if (FileExist("$profile:MyMod/config.json"))
{
    Print("Konfigurationsdatei gefunden");
}
else
{
    Print("Konfigurationsdatei nicht gefunden, erstelle Standards");
}
```

---

## Dateien öffnen und schließen

```c
proto FileHandle OpenFile(string name, FileMode mode);
proto void CloseFile(FileHandle file);
```

### FileMode-Enum

```c
enum FileMode
{
    READ,     // Zum Lesen öffnen (Datei muss existieren)
    WRITE,    // Zum Schreiben öffnen (erstellt neue / überschreibt bestehende)
    APPEND    // Zum Anhängen öffnen (erstellt falls nicht vorhanden)
}
```

`FileHandle` ist ein Integer-Handle. Ein Rückgabewert von `0` zeigt einen Fehler an.

**Beispiel:**

```c
FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.WRITE);
if (fh != 0)
{
    // Datei erfolgreich geöffnet
    // ... Arbeit erledigen ...
    CloseFile(fh);
}
```

> **Kritisch:** Rufen Sie immer `CloseFile()` auf, wenn Sie fertig sind. Das Nichtschließen von Dateien kann Datenverlust und Ressourcenlecks verursachen.

---

## Dateien schreiben

### FPrintln (Zeile schreiben)

```c
proto void FPrintln(FileHandle file, void var);
```

Schreibt den Wert gefolgt von einem Zeilenumbruchzeichen.

### FPrint (Ohne Zeilenumbruch schreiben)

```c
proto void FPrint(FileHandle file, void var);
```

Schreibt den Wert ohne abschließenden Zeilenumbruch.

**Beispiel --- eine Logdatei schreiben:**

```c
void WriteLog(string message)
{
    FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.APPEND);
    if (fh != 0)
    {
        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);
        string timestamp = string.Format("[%1-%2-%3 %4:%5]", year, month, day, hour, minute);

        FPrintln(fh, timestamp + " " + message);
        CloseFile(fh);
    }
}
```

---

## Dateien lesen

### FGets (Zeile lesen)

```c
proto int FGets(FileHandle file, string var);
```

Liest eine Zeile aus der Datei in `var`. Gibt die Anzahl der gelesenen Zeichen zurück, oder `-1` am Dateiende.

**Beispiel --- eine Datei zeilenweise lesen:**

```c
void ReadConfigFile()
{
    FileHandle fh = OpenFile("$profile:MyMod/settings.txt", FileMode.READ);
    if (fh != 0)
    {
        string line;
        while (FGets(fh, line) >= 0)
        {
            Print("Zeile: " + line);
            ProcessLine(line);
        }
        CloseFile(fh);
    }
}
```

### ReadFile (Rohes Binärlesen)

```c
proto int ReadFile(FileHandle file, void param_array, int length);
```

Liest Rohbytes in einen Puffer. Wird für Binärdaten verwendet.

---

## Verzeichnisoperationen

### MakeDirectory

```c
proto native bool MakeDirectory(string name);
```

Erstellt ein Verzeichnis. Gibt `true` bei Erfolg zurück. Erstellt nur das letzte Verzeichnis --- übergeordnete Verzeichnisse müssen bereits existieren.

**Beispiel --- Verzeichnisstruktur sicherstellen:**

```c
void EnsureDirectories()
{
    MakeDirectory("$profile:MyMod");
    MakeDirectory("$profile:MyMod/data");
    MakeDirectory("$profile:MyMod/logs");
}
```

### DeleteFile

```c
proto native bool DeleteFile(string name);
```

Löscht eine Datei. Funktioniert nur in `$profile:`- und `$saves:`-Verzeichnissen.

### CopyFile

```c
proto native bool CopyFile(string sourceName, string destName);
```

Kopiert eine Datei von der Quelle zum Ziel.

**Beispiel:**

```c
// Sicherung vor dem Überschreiben erstellen
if (FileExist("$profile:MyMod/config.json"))
{
    CopyFile("$profile:MyMod/config.json", "$profile:MyMod/config.json.bak");
}
```

---

## Dateiaufzählung (FindFile / FindNextFile)

Dateien aufzählen, die einem Muster in einem Verzeichnis entsprechen.

```c
proto FindFileHandle FindFile(string pattern, out string fileName,
                               out FileAttr fileAttributes, FindFileFlags flags);
proto bool FindNextFile(FindFileHandle handle, out string fileName,
                         out FileAttr fileAttributes);
proto native void CloseFindFile(FindFileHandle handle);
```

### FileAttr-Enum

```c
enum FileAttr
{
    DIRECTORY,   // Eintrag ist ein Verzeichnis
    HIDDEN,      // Eintrag ist versteckt
    READONLY,    // Eintrag ist schreibgeschützt
    INVALID      // Ungültiger Eintrag
}
```

### FindFileFlags-Enum

```c
enum FindFileFlags
{
    DIRECTORIES,  // Nur Verzeichnisse zurückgeben
    ARCHIVES,     // Nur Dateien zurückgeben
    ALL           // Beides zurückgeben
}
```

**Beispiel --- alle JSON-Dateien in einem Verzeichnis aufzählen:**

```c
void ListJsonFiles()
{
    string fileName;
    FileAttr fileAttr;
    FindFileHandle handle = FindFile(
        "$profile:MyMod/missions/*.json", fileName, fileAttr, FindFileFlags.ALL
    );

    if (handle)
    {
        // Erstes Ergebnis verarbeiten
        if (!(fileAttr & FileAttr.DIRECTORY))
        {
            Print("Gefunden: " + fileName);
        }

        // Verbleibende Ergebnisse verarbeiten
        while (FindNextFile(handle, fileName, fileAttr))
        {
            if (!(fileAttr & FileAttr.DIRECTORY))
            {
                Print("Gefunden: " + fileName);
            }
        }

        CloseFindFile(handle);
    }
}
```

> **Wichtig:** `FindFile` gibt nur den Dateinamen zurück, nicht den vollständigen Pfad. Sie müssen den Verzeichnispfad bei der Verarbeitung der Dateien selbst voranstellen.

**Beispiel --- Dateien in einem Verzeichnis zählen:**

```c
int CountFiles(string pattern)
{
    int count = 0;
    string fileName;
    FileAttr fileAttr;
    FindFileHandle handle = FindFile(pattern, fileName, fileAttr, FindFileFlags.ARCHIVES);

    if (handle)
    {
        count++;
        while (FindNextFile(handle, fileName, fileAttr))
        {
            count++;
        }
        CloseFindFile(handle);
    }

    return count;
}
```

---

## JsonFileLoader (Generisches JSON)

**Datei:** `3_Game/tools/jsonfileloader.c` (173 Zeilen)

Die empfohlene Methode zum Laden und Speichern von JSON-Daten. Funktioniert mit jeder Klasse, die öffentliche Felder hat.

### Moderne API (Bevorzugt)

```c
class JsonFileLoader<Class T>
{
    // JSON-Datei in Objekt laden
    static bool LoadFile(string filename, out T data, out string errorMessage);

    // Objekt in JSON-Datei speichern
    static bool SaveFile(string filename, T data, out string errorMessage);

    // JSON-String in Objekt parsen
    static bool LoadData(string string_data, out T data, out string errorMessage);

    // Objekt zu JSON-String serialisieren
    static bool MakeData(T inputData, out string outputData,
                          out string errorMessage, bool prettyPrint = true);
}
```

Alle Methoden geben `bool` zurück --- `true` bei Erfolg, `false` bei Fehler mit der Fehlermeldung in `errorMessage`.

### Legacy-API (Veraltet)

```c
class JsonFileLoader<Class T>
{
    static void JsonLoadFile(string filename, out T data);    // Gibt void zurück!
    static void JsonSaveFile(string filename, T data);
    static void JsonLoadData(string string_data, out T data);
    static string JsonMakeData(T data);
}
```

> **Kritischer Fallstrick:** `JsonLoadFile()` gibt `void` zurück. Sie KÖNNEN es NICHT in einer `if`-Bedingung verwenden:
> ```c
> // FALSCH - wird nicht kompilieren oder ist immer false
> if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg)) { }
>
> // RICHTIG - moderne LoadFile() verwenden, die bool zurückgibt
> if (JsonFileLoader<MyConfig>.LoadFile(path, cfg, error)) { }
> ```

### Anforderungen an Datenklassen

Die Zielklasse muss **öffentliche Felder** mit Standardwerten haben. Der JSON-Serialisierer bildet Feldnamen direkt auf JSON-Schlüssel ab.

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 150.0;
    string ServerName = "Mein Server";
    bool EnablePVP = true;
    ref array<string> AllowedItems = new array<string>;
    ref map<string, int> ItemPrices = new map<string, int>;

    void MyConfig()
    {
        AllowedItems.Insert("BandageDressing");
        AllowedItems.Insert("Canteen");
    }
}
```

Dies erzeugt folgendes JSON:

```json
{
    "MaxPlayers": 60,
    "SpawnRadius": 150.0,
    "ServerName": "Mein Server",
    "EnablePVP": true,
    "AllowedItems": ["BandageDressing", "Canteen"],
    "ItemPrices": {}
}
```

### Vollständiges Laden/Speichern-Beispiel

```c
class MyModConfig
{
    int Version = 1;
    float RespawnTime = 300.0;
    ref array<string> SpawnItems = new array<string>;
}

class MyModConfigManager
{
    protected static const string CONFIG_PATH = "$profile:MyMod/config.json";
    protected ref MyModConfig m_Config;

    void Init()
    {
        MakeDirectory("$profile:MyMod");
        m_Config = new MyModConfig();
        Load();
    }

    void Load()
    {
        if (!FileExist(CONFIG_PATH))
        {
            Save();  // Standardkonfiguration erstellen
            return;
        }

        string error;
        if (!JsonFileLoader<MyModConfig>.LoadFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Konfigurationsladefehler: " + error);
            m_Config = new MyModConfig();  // Auf Standards zurücksetzen
            Save();
        }
    }

    void Save()
    {
        string error;
        if (!JsonFileLoader<MyModConfig>.SaveFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Konfigurationsspeicherfehler: " + error);
        }
    }

    MyModConfig GetConfig()
    {
        return m_Config;
    }
}
```

---

## JsonSerializer (Direkte Verwendung)

**Datei:** `3_Game/gameplay.c`

Für Fälle, in denen Sie JSON-Strings direkt serialisieren/deserialisieren müssen, ohne Dateioperationen:

```c
class JsonSerializer : Serializer
{
    proto bool WriteToString(void variable_out, bool nice, out string result);
    proto bool ReadFromString(void variable_in, string jsonString, out string error);
}
```

**Beispiel:**

```c
MyConfig cfg = new MyConfig();
cfg.MaxPlayers = 100;

JsonSerializer js = new JsonSerializer();

// Zu String serialisieren
string jsonOutput;
js.WriteToString(cfg, true, jsonOutput);  // true = schön formatiert
Print(jsonOutput);

// Aus String deserialisieren
MyConfig parsed = new MyConfig();
string parseError;
js.ReadFromString(parsed, jsonOutput, parseError);
Print("MaxPlayers: " + parsed.MaxPlayers);
```

---

## Zusammenfassung

| Operation | Funktion | Hinweise |
|-----------|----------|----------|
| Existenz prüfen | `FileExist(path)` | Gibt bool zurück |
| Öffnen | `OpenFile(path, FileMode)` | Gibt Handle zurück (0 = Fehler) |
| Schließen | `CloseFile(handle)` | Immer aufrufen wenn fertig |
| Zeile schreiben | `FPrintln(handle, data)` | Mit Zeilenumbruch |
| Schreiben | `FPrint(handle, data)` | Ohne Zeilenumbruch |
| Zeile lesen | `FGets(handle, out line)` | Gibt -1 bei EOF zurück |
| Verzeichnis erstellen | `MakeDirectory(path)` | Nur eine Ebene |
| Löschen | `DeleteFile(path)` | Nur `$profile:` / `$saves:` |
| Kopieren | `CopyFile(src, dst)` | -- |
| Dateien finden | `FindFile(pattern, ...)` | Gibt Handle zurück, mit `FindNextFile` iterieren |
| JSON laden | `JsonFileLoader<T>.LoadFile(path, data, error)` | Moderne API, gibt bool zurück |
| JSON speichern | `JsonFileLoader<T>.SaveFile(path, data, error)` | Moderne API, gibt bool zurück |
| JSON-String | `JsonSerializer.WriteToString()` / `ReadFromString()` | Direkte String-Operationen |

| Konzept | Kernpunkt |
|---------|-----------|
| Pfadpräfixe | `$profile:` (beschreibbar), `$mission:` (lesen), `$saves:` (beschreibbar) |
| JsonLoadFile | **Gibt void zurück** --- verwenden Sie stattdessen `LoadFile()` (bool) |
| Datenklassen | Öffentliche Felder mit Standards, `ref` für Arrays/Maps |
| Immer schließen | Jedes `OpenFile` muss ein passendes `CloseFile` haben |
| FindFile | Gibt nur Dateinamen zurück, nicht vollständige Pfade |

---

## Bewährte Praktiken

- **Wickeln Sie Dateioperationen immer in Existenzprüfungen und schließen Sie Handles in allen Codepfaden.** Ein ungeschlossenes `FileHandle` verursacht Ressourcenlecks und kann verhindern, dass die Datei auf die Festplatte geschrieben wird. Verwenden Sie Schutzmuster: prüfen Sie `fh != 0`, erledigen Sie die Arbeit, dann `CloseFile(fh)` vor jedem `return`.
- **Verwenden Sie das moderne `JsonFileLoader<T>.LoadFile()` (gibt bool zurück) anstelle des veralteten `JsonLoadFile()` (gibt void zurück).** Die Legacy-API kann keine Fehler melden, und der Versuch, ihren void-Rückgabewert in einer Bedingung zu verwenden, schlägt stillschweigend fehl.
- **Erstellen Sie Verzeichnisse mit `MakeDirectory()` der Reihe nach vom Eltern- zum Kindverzeichnis.** `MakeDirectory` erstellt nur das letzte Verzeichnissegment. `MakeDirectory("$profile:A/B/C")` schlägt fehl, wenn `A/B` nicht existiert. Erstellen Sie jede Ebene sequentiell.
- **Verwenden Sie `CopyFile()`, um Sicherungen vor dem Überschreiben von Konfigurationsdateien zu erstellen.** JSON-Parserfehler aus beschädigten Speicherständen sind nicht wiederherstellbar. Eine `.bak`-Kopie ermöglicht es Serverbetreibern, den letzten guten Zustand wiederherzustellen.
- **Denken Sie daran, dass `FindFile()` nur Dateinamen zurückgibt, nicht vollständige Pfade.** Sie müssen das Verzeichnispräfix selbst voranstellen, wenn Sie über `FindFile`/`FindNextFile` gefundene Dateien laden.

---

## Kompatibilität und Auswirkungen

> **Mod-Kompatibilität:** Datei-E/A ist inhärent pro Mod isoliert, wenn jede Mod ihr eigenes `$profile:`-Unterverzeichnis verwendet. Konflikte treten nur auf, wenn zwei Mods denselben Dateipfad lesen/schreiben.

- **Ladereihenfolge:** Datei-E/A hat keine Ladereihenfolge-Abhängigkeit. Mods lesen und schreiben unabhängig.
- **Modded-Class-Konflikte:** Keine Klassenkonflikte. Das Risiko besteht darin, dass zwei Mods denselben `$profile:`-Unterverzeichnisnamen oder Dateinamen verwenden, was Datenbeschädigung verursacht.
- **Leistungsauswirkung:** JSON-Serialisierung über `JsonFileLoader` ist synchron und blockiert den Haupt-Thread. Das Laden großer JSON-Dateien (>100KB) während des Spiels verursacht Frame-Ruckler. Laden Sie Konfigurationen in `OnInit()` oder `OnMissionStart()`, niemals in `OnUpdate()`.
- **Server/Client:** Dateischreibvorgänge sind auf `$profile:` und `$saves:` beschränkt. Auf Clients zeigt `$profile:` auf das Client-Profilverzeichnis. Auf dedizierten Servern zeigt es auf das Serverprofil. `$mission:` ist typischerweise auf beiden Seiten schreibgeschützt.

---

## In echten Mods beobachtet

> Diese Muster wurden durch das Studium des Quellcodes professioneller DayZ-Mods bestätigt.

| Muster | Mod | Datei/Ort |
|--------|-----|-----------|
| `MakeDirectory`-Kette + `FileExist`-Prüfung + `LoadFile` mit Fallback auf Standards | Expansion | Einstellungsverwaltung (`ExpansionSettings`) |
| `CopyFile`-Sicherung vor Konfigurationsspeicherung | COT | Berechtigungsdateiverwaltung |
| `FindFile`/`FindNextFile` zum Aufzählen von Spieler-JSON-Dateien in `$profile:` | VPP Admin Tools | Spielerdatenlader |
| `JsonSerializer.WriteToString()` für RPC-Payload-Serialisierung (ohne Datei) | Dabs Framework | Netzwerk-Konfigurationssynchronisation |

---

[<< Zurück: Timer und CallQueue](07-timers.md) | **Datei-E/A und JSON** | [Weiter: Netzwerk und RPC >>](09-networking.md)
