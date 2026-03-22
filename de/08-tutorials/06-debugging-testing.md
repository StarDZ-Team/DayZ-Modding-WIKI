# Kapitel 8.6: Debugging & Testen Ihrer Mod

[Startseite](../README.md) | [<< Zurück: Die DayZ-Mod-Vorlage verwenden](05-mod-template.md) | **Debugging & Testen** | [Weiter: Im Steam Workshop veröffentlichen >>](07-publishing-workshop.md)

---

## Inhaltsverzeichnis

- [Einführung](#einführung)
- [Das Script-Log -- Ihr bester Freund](#das-script-log----ihr-bester-freund)
- [Print-Debugging (die zuverlässige Methode)](#print-debugging-die-zuverlässige-methode)
- [DayZDiag -- Die Debug-Executable](#dayzdiag----die-debug-executable)
- [File Patching -- Bearbeiten ohne Neuerstellen](#file-patching----bearbeiten-ohne-neuerstellen)
- [Workbench -- Skripteditor und Debugger](#workbench----skripteditor-und-debugger)
- [Häufige Fehlermuster und Lösungen](#häufige-fehlermuster-und-lösungen)
- [Test-Workflow](#test-workflow)
- [Ingame-Debug-Tools](#ingame-debug-tools)
- [Pre-Release-Checkliste](#pre-release-checkliste)
- [Häufige Fehler](#häufige-fehler)
- [Nächste Schritte](#nächste-schritte)

---

## Einführung

Anders als Unity oder Unreal unterstützt die Retail-DayZ-Executable kein Anfügen eines Debuggers an Enforce Script. Stattdessen verlassen Sie sich auf fünf Werkzeuge:

1. **Script-Logs** -- Textdateien, die jeden Fehler, jede Warnung und Print-Ausgabe erfassen
2. **Print-Anweisungen** -- Ausführungsfluss verfolgen und Variablenwerte inspizieren
3. **DayZDiag** -- Diagnose-Build mit erweiterter Fehlerberichterstattung und Debug-Tools
4. **File Patching** -- Skripte bearbeiten, ohne jedes Mal Ihr PBO neu zu erstellen
5. **Workbench** -- Offizieller Skripteditor mit Syntaxpruefung und einer Skriptkonsole

Zusammen bilden sie ein leistungsstarkes Toolkit. Dieses Kapitel lehrt Sie, wie Sie jedes einzelne verwenden.

---

## Das Script-Log -- Ihr bester Freund

Jedes Mal, wenn DayZ läuft, schreibt es eine Script-Logdatei. Diese Datei erfasst jeden Skriptfehler, jede Warnung und Print()-Ausgabe. Wenn etwas schiefgeht, ist das Script-Log der erste Ort zum Nachschauen.

### Wo Sie Script-Logs finden

**Client-Logs:** `%LocalAppData%\DayZ\` (drücken Sie `Win+R`, einfügen, Enter)

**Server-Logs:** Im Profilordner Ihres Servers (gesetzt via `-profiles=serverprofile`)

Dateien heissen `script_YYYY-MM-DD_HH-MM-SS.log` -- der neueste Zeitstempel ist Ihre letzte Sitzung.

### Wonach Sie suchen

Script-Logs enthalten Tausende von Zeilen. Sie müssen wissen, wonach Sie suchen.

**Fehler** sind mit `SCRIPT (E)` markiert:

```
SCRIPT (E): MyMod/Scripts/4_World/MyManager.c :: OnInit -- Null pointer access
```

Dies ist ein harter Fehler. Ihr Code hat versucht, etwas Ungültiges zu tun, und DayZ hat die Ausführung dieses Codepfads gestoppt. Diese müssen behoben werden.

**Warnungen** sind mit `SCRIPT (W)` markiert:

```
SCRIPT (W): MyMod/Scripts/4_World/MyManager.c :: Load -- Cannot open file "$profile:MyMod/config.json"
```

Warnungen bringen Ihren Code nicht zum Absturz, aber sie deuten oft auf ein Problem hin, das später Probleme verursachen wird. Ignorieren Sie sie nicht.

**Print-Ausgaben** erscheinen als Klartext ohne Präfix:

```
[MyMod] Manager initialized with 5 items
```

Dies ist die Ausgabe Ihrer eigenen `Print()`-Aufrufe. Es ist die primäre Methode, mit der Sie verfolgen, was Ihr Code tut.

### Effizient suchen

Script-Logs können Zehntausende Zeilen umfassen. Lesen Sie nie Zeile für Zeile -- suchen Sie nach Ihrem Mod-Präfix oder Fehlermarkierungen:

```powershell
# PowerShell -- alle Fehler im neuesten Log finden
Select-String -Path "$env:LOCALAPPDATA\DayZ\script*.log" -Pattern "SCRIPT \(E\)" | Select-Object -Last 20

# PowerShell -- alle Zeilen von Ihrer Mod finden
Select-String -Path "$env:LOCALAPPDATA\DayZ\script*.log" -Pattern "MyMod" | Select-Object -Last 30
```

```cmd
:: Eingabeaufforderung-Alternative
findstr "SCRIPT (E)" "%LocalAppData%\DayZ\script_2026-03-21_14-30-05.log"
```

### Häufige Log-Einträge verstehen

| Log-Eintrag | Bedeutung |
|-----------|---------|
| `SCRIPT (E): Cannot convert string to int` | Typkonflikt -- falschen Typ übergeben oder zugewiesen |
| `SCRIPT (E): Null pointer access in ... :: Update` | Methode auf einem NULL-Objekt aufgerufen (häufigster Fehler) |
| `SCRIPT (E): Undefined variable 'manger'` | Tippfehler in einem Variablennamen oder falscher Scope |
| `SCRIPT (E): Method 'GetHelth' not found in class 'EntityAI'` | Methode existiert nicht -- Schreibweise und Elternklasse prüfen |

### Echtzeit-Log-Überwachung

Beobachten Sie das Log live in einem separaten PowerShell-Fenster, während DayZ läuft:

```powershell
# Das neueste Script-Log in Echtzeit verfolgen
Get-ChildItem "$env:LOCALAPPDATA\DayZ\script*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
    Get-Content $_.FullName -Wait -Tail 50
}
```

Filtern, um nur Fehler und Ihre Mod-Ausgabe anzuzeigen:

```powershell
Get-ChildItem "$env:LOCALAPPDATA\DayZ\script*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
    Get-Content $_.FullName -Wait -Tail 50 | Where-Object { $_ -match "SCRIPT \(E\)|SCRIPT \(W\)|\[MyMod\]" }
}
```

---

## Print-Debugging (die zuverlässige Methode)

Wenn Sie wissen müssen, was Ihr Code zur Laufzeit tut, ist `Print()` Ihr primäres Werkzeug. Es schreibt eine Zeile ins Script-Log, die Sie danach lesen oder in Echtzeit beobachten können.

### Grundlegende Print-Verwendung

```c
class MyManager
{
    void Init()
    {
        Print("[MyMod] MyManager.Init() aufgerufen");

        int count = LoadItems();
        Print("[MyMod] " + count.ToString() + " Items geladen");
    }
}
```

Dies erzeugt Zeilen im Script-Log wie:

```
[MyMod] MyManager.Init() aufgerufen
[MyMod] 5 Items geladen
```

### Formatierte Ausgabe

Verwenden Sie String-Verkettung, um informative Nachrichten mit genug Kontext aufzubauen, um für sich allein nützlich zu sein:

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player)
    {
        Print("[MyMod] ProcessPlayer: player ist NULL, Abbruch");
        return;
    }

    string name = player.GetIdentity().GetName();
    vector pos = player.GetPosition();
    Print("[MyMod] Verarbeite: " + name + " bei " + pos.ToString());
}
```

### Einen Debug-Logger erstellen

Statt rohe `Print()`-Aufrufe zu verstreuen, erstellen Sie einen umschaltbaren Logger:

```c
class MyModDebug
{
    static bool s_Enabled = true;

    static void Log(string msg)
    {
        if (s_Enabled)
            Print("[MyMod:DEBUG] " + msg);
    }

    static void Error(string msg)
    {
        // Fehler werden immer ausgegeben, unabhängig vom Debug-Flag
        Print("[MyMod:ERROR] " + msg);
    }
}
```

Verwenden Sie ihn in Ihrem gesamten Code: `MyModDebug.Log("Spieler verbunden: " + name);`

### Präprozessor-Defines für Debug-Only-Code verwenden

Enforce Script unterstützt `#ifdef`, um Code nur in Entwicklungs-Builds einzuschliessen:

```c
void Update()
{
    #ifdef DEVELOPER
    Print("[MyMod] Update-Tick, aktive Items: " + m_Items.Count().ToString());
    #endif

    // Normaler Code hier...
}
```

`DEVELOPER` ist in DayZDiag und Workbench gesetzt, aber nicht im Retail-DayZ. `DIAG_DEVELOPER` ist ein weiteres nützliches Define, das nur in Diagnose-Builds verfügbar ist. Code innerhalb dieser Guards hat null Kosten in Release-Builds.

### Debug-Prints vor Release entfernen

Wenn Sie keine `#ifdef`-Guards verwenden, entfernen Sie alle `Print()`-Aufrufe vor der Veröffentlichung. Übermässige Ausgabe bläst Logs auf, schadet der Server-Leistung und kann interne Informationen preisgeben. Ein konsistentes Präfix wie `[MyMod:DEBUG]` macht sie leicht zu finden und zu entfernen.

---

## DayZDiag -- Die Debug-Executable

DayZDiag ist ein spezieller Diagnose-Build von DayZ mit Features, die die Retail-Version nicht hat.

### Was DayZDiag anders macht

| Feature | Retail DayZ | DayZDiag |
|---------|-------------|----------|
| File-Patching-Unterstützung | Nein | Ja |
| `DEVELOPER`-Define aktiv | Nein | Ja |
| `DIAG_DEVELOPER`-Define aktiv | Nein | Ja |
| Zusätzliche Fehlerdetails in Logs | Grundlegend | Ausführlich |
| Admin-Konsole-Zugang | Nein | Ja |
| Skriptkonsole | Nein | Ja |
| Freie Kamera | Nein | Ja |

### DayZDiag erhalten

DayZDiag ist in DayZ Tools enthalten (kein separater Download). Nach der Installation von DayZ Tools aus Steam finden Sie `DayZDiag_x64.exe` unter:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\
```

### Startparameter

Erstellen Sie eine Batch-Datei oder Verknüpfung mit diesen Parametern:

**Client (Einzelspieler mit Server):**

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -profiles=clientprofile -server -port=2302
```

**Client (mit separatem Server verbinden):**

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

**Dedizierter Server:**

```batch
DayZDiag_x64.exe -filePatching -server -mod=P:\MyMod -config=serverDZ.cfg -port=2302 -profiles=serverprofile
```

Wichtige Parameter:

| Parameter | Zweck |
|-----------|---------|
| `-filePatching` | Laden loser Dateien vom P:-Laufwerk aktivieren (siehe nächster Abschnitt) |
| `-mod=P:\MyMod` | Ihre Mod vom P:-Laufwerk laden |
| `-profiles=ordner` | Profilordner für Logs und Configs setzen |
| `-server` | Als lokalen Listen-Server laufen lassen (Einzelspieler-Tests) |
| `-connect=IP` | Mit einem Server an der angegebenen IP verbinden |
| `-port=PORT` | Netzwerkport setzen (Standard 2302) |

### Wann DayZDiag vs. Retail verwenden

- **Während der Entwicklung:** Verwenden Sie immer DayZDiag. Es gibt Ihnen File Patching, bessere Fehler und Debug-Tools.
- **Vor der Veröffentlichung:** Testen Sie mit der Retail-DayZ-Executable, um sicherzustellen, dass alles für Spieler funktioniert. Einige Verhaltensweisen unterscheiden sich zwischen DayZDiag und Retail (zum Beispiel läuft `#ifdef DEVELOPER`-Code nicht im Retail).

---

## File Patching -- Bearbeiten ohne Neuerstellen

File Patching ist die größte Zeitersparnis im DayZ-Modding. Ohne es erfordert jede Skriptänderung: Datei bearbeiten, PBO neu erstellen, PBO kopieren, DayZ neustarten. Mit File Patching können Sie: Datei bearbeiten, Mission neustarten. Das ist alles.

### Wie es funktioniert

Wenn DayZ mit dem `-filePatching`-Parameter gestartet wird, prueft es das P:-Laufwerk auf lose Dateien, bevor es Dateien aus PBOs lädt. Wenn es eine Datei auf P: findet, die einer Datei in einem PBO entspricht, hat die lose Datei Vorrang.

Das bedeutet:

1. Ihre Mod ist auf dem P:-Laufwerk eingerichtet (via `SetupWorkdrive.bat` oder manueller Junction)
2. Sie starten DayZDiag mit `-filePatching -mod=P:\MyMod`
3. DayZ lädt Ihre Skripte direkt vom P:-Laufwerk -- nicht aus dem PBO
4. Sie bearbeiten eine `.c`-Datei auf dem P:-Laufwerk und speichern sie
5. Sie verbinden sich neu oder starten die Mission im Spiel neu
6. DayZ nimmt Ihre geänderte Datei sofort auf

Kein PBO-Neubau nötig. Der Bearbeitungs-Test-Zyklus sinkt von Minuten auf Sekunden.

### File Patching einrichten

1. Stellen Sie sicher, dass Ihr Mod-Quellcode auf dem P:-Laufwerk liegt (aus [Kapitel 8.1](01-first-mod.md))
2. Starten Sie: `DayZDiag_x64.exe -filePatching -mod=P:\MyMod -server -port=2302`
3. Bearbeiten Sie eine `.c`-Datei, speichern Sie, verbinden Sie sich im Spiel neu -- Ihre Änderungen sind live

### Was mit File Patching funktioniert

| Dateityp | File Patching funktioniert? |
|-----------|---------------------|
| Skriptdateien (`.c`) | Ja |
| Layout-Dateien (`.layout`) | Ja |
| Texturen (`.edds`, `.paa`) | Ja |
| Sounddateien | Ja |
| `config.cpp` | **Nein** -- PBO-Neubau erforderlich |
| `mod.cpp` | **Nein** -- PBO-Neubau erforderlich |
| Neue Dateien (nicht im PBO) | **Nein** -- PBO-Neubau erforderlich, um sie zu registrieren |

Die wichtigste Einschränkung: `config.cpp`-Änderungen erfordern immer einen PBO-Neubau. Dazu gehört das Hinzufügen neuer Klassen, Ändern von `requiredAddons` oder Modifizieren von `CfgMods`. Wenn Sie eine brandneue `.c`-Datei hinzufügen, benötigen Sie ebenfalls einen PBO-Neubau, damit das Skript-Laden der `config.cpp` die neue Datei kennt.

### Der File-Patching-Workflow

Hier ist der ideale Entwicklungszyklus:

```
1. Ihr PBO einmal erstellen (um die Dateiliste in config.cpp festzulegen)
2. DayZDiag mit -filePatching -mod=P:\MyMod starten
3. Eine .c-Datei auf dem P:-Laufwerk bearbeiten
4. Die Datei speichern
5. Im Spiel: trennen und neu verbinden (oder Mission neustarten)
6. Das Script-Log auf Ihre Änderungen prüfen
7. Ab Schritt 3 wiederholen
```

Diese Schleife kann unter 30 Sekunden pro Iteration dauern, verglichen mit mehreren Minuten beim PBO-Neubau jedes Mal.

---

## Workbench -- Skripteditor und Debugger

Workbench ist die offizielle DayZ-Entwicklungsumgebung, die in DayZ Tools enthalten ist.

### Starten und einrichten

1. Öffnen Sie **DayZ Tools** aus Steam, klicken Sie auf **Workbench**
2. Gehen Sie zu **File > Open Project** und zeigen Sie auf das Skriptverzeichnis Ihrer Mod auf dem P:-Laufwerk
3. Workbench indiziert Ihre `.c`-Dateien und bietet Syntaxerkennung

### Wichtige Features

- **Syntaxhervorhebung** -- Schlüsselwörter, Typen, Strings und Kommentare sind farblich markiert
- **Code-Vervollständigung** -- Tippen Sie einen Klassennamen gefolgt von einem Punkt, um verfügbare Methoden zu sehen
- **Fehlerhervorhebung** -- Syntaxfehler werden rot unterstrichen, bevor Sie etwas ausführen
- **Skriptkonsole** -- Enforce-Script-Befehle live ausführen:

```c
// Die Position des Spielers ausgeben
Print(GetGame().GetPlayer().GetPosition().ToString());

// Ein Item an Ihrer Position spawnen
GetGame().GetPlayer().SpawnEntityOnGroundPos("AKM", GetGame().GetPlayer().GetPosition());
```

### Einschränkungen

- **Keine vollständige Spielumgebung:** Einige APIs funktionieren nur im eigentlichen Spiel, nicht in Workbenchs Simulation
- **Getrennt von der Spiel-Laufzeit:** Sie müssen Dateien immer noch speichern und die Mission neustarten, um Änderungen im Spiel zu sehen
- **Unvollständiger Mod-Kontext:** Cross-Mod-Referenzen können als Fehler angezeigt werden, auch wenn sie im Spiel funktionieren

---

## Häufige Fehlermuster und Lösungen

Referenztabellen der häufigsten Fehler und wie sie zu beheben sind. Setzen Sie ein Lesezeichen für diesen Abschnitt.

### Skriptfehler

| Fehlermeldung | Ursache | Lösung |
|---------------|-------|-----|
| `Null pointer access` | Methode auf einer NULL-Variable aufgerufen | Null-Pruefung vor Verwendung hinzufügen: `if (obj) { obj.DoThing(); }` |
| `Cannot convert X to Y` | Typkonflikt bei Zuweisung oder Funktionsaufruf | Erwarteten Typ prüfen. `Class.CastTo()` für sicheres Casting verwenden. |
| `Undefined variable 'xyz'` | Tippfehler im Variablennamen oder falscher Scope | Schreibweise prüfen. Sicherstellen, dass die Variable im aktuellen Scope deklariert ist. |
| `Method 'xyz' not found in class 'Abc'` | Methode existiert nicht auf dieser Klasse | Klassenhierarchie prüfen. Den korrekten Methodennamen in der API nachschlagen. |
| `Division by zero` | Division durch eine Variable die gleich 0 ist | Guard hinzufügen: `if (divisor != 0) { result = value / divisor; }` |
| `Stack overflow` | Endlose Rekursion in Ihrem Code | Methoden prüfen, die sich selbst ohne korrekte Abbruchbedingung aufrufen. |
| `Type 'MyClass' not found` | Die Datei, die MyClass definiert, wird nicht geladen oder befindet sich in einer höheren Skriptschicht | config.cpp Skript-Ladereihenfolge prüfen. Untere Schichten können obere nicht sehen. |

### Config-Fehler

| Fehlermeldung | Ursache | Lösung |
|---------------|-------|-----|
| `Config parse error` | Fehlendes Semikolon, fehlende Klammer oder fehlendes Anführungszeichen in config.cpp | config.cpp-Syntax sorgfältig prüfen. Jede Eigenschaft braucht ein Semikolon. Jede Klasse braucht öffnende und schliessende Klammern. |
| `Addon 'X' requires addon 'Y'` | Fehlende Abhängigkeit in requiredAddons | Das benötigte Addon zum `requiredAddons[]`-Array hinzufügen. |
| `Cannot find mod` | Mod-Ordnername oder -pfad ist falsch | Überprüfen, dass der `-mod=`-Parameter exakt mit Ihrem Mod-Ordnernamen übereinstimmt. |

### Mod-Ladefehler

| Symptom | Ursache | Lösung |
|---------|-------|-----|
| Mod erscheint nicht im Launcher | Fehlende oder ungültige `mod.cpp` | Prüfen, dass `mod.cpp` im Mod-Stamm existiert und gültige `name`- und `dir`-Felder hat. |
| Skripte werden nicht ausgeführt | config.cpp registriert Skripte nicht | Überprüfen, dass die `CfgMods`-Klasse in config.cpp den korrekten Skriptpfad hat. |
| Mod lädt, aber Features fehlen | Skriptschicht-Problem | Überprüfen, dass Dateien in den korrekten Schichtordnern sind (3_Game, 4_World, 5_Mission). |

### Laufzeitprobleme

| Symptom | Ursache | Lösung |
|---------|-------|-----|
| RPC wird auf dem Server nicht empfangen | Falsche RPC-Registrierung oder Identitäts-Nichtübereinstimmung | Prüfen, dass RPC sowohl auf Client als auch Server registriert ist. RPC-ID-Übereinstimmung überprüfen. |
| RPC wird auf dem Client nicht empfangen | Server sendet nicht, oder Client nicht registriert | Print() auf Serverseite hinzufügen, um Senden zu bestätigen. Client-Registrierungscode prüfen. |
| UI wird nicht angezeigt | Layout-Pfad falsch oder Eltern-Widget ist null | Überprüfen, dass der `.layout`-Dateipfad relativ zur Mod korrekt ist. Prüfen, dass das Eltern-Widget existiert. |
| JSON-Config lädt nicht | Dateipfad falsch oder JSON-Syntaxfehler | Dateipfad prüfen. JSON-Syntax validieren (keine nachgestellten Kommas, korrekte Anführungszeichen). |
| Spielerdaten werden nicht gespeichert | Profilordner-Berechtigungen oder Pfadproblem | Prüfen, dass der `$profile:`-Pfad zugänglich ist und der Ordner existiert. |

### Null-Pointer und sicheres Casting -- detaillierte Beispiele

Diese beiden Fehler sind so häufig, dass sie ausführliche Beispiele verdienen.

**Unsicherer Code (stürzt ab wenn GetPlayer() oder GetIdentity() NULL zurückgibt):**

```c
void DoSomething()
{
    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    string name = player.GetIdentity().GetName();  // Absturz wenn player oder identity NULL ist
}
```

**Sicherer Code (jeden potenziellen Null absichern):**

```c
void DoSomething()
{
    Man man = GetGame().GetPlayer();
    if (!man)
        return;

    PlayerBase player;
    if (!Class.CastTo(player, man))
        return;

    PlayerIdentity identity = player.GetIdentity();
    if (!identity)
        return;

    Print("[MyMod] Spieler: " + identity.GetName());
}
```

**Sicheres Casting-Muster mit `Class.CastTo()`:**

```c
void ProcessEntity(Object obj)
{
    ItemBase item;
    if (Class.CastTo(item, obj))
    {
        item.SetQuantity(1);
    }
    else
    {
        Print("[MyMod] Objekt ist kein ItemBase: " + obj.GetType());
    }
}
```

`Class.CastTo()` gibt `true` bei Erfolg zurück, `false` bei Misserfolg. Prüfen Sie immer den Rückgabewert.

---

## Test-Workflow

DayZ-Modding hat kein automatisiertes Testframework. Testen ist manuell: erstellen, starten, spielen, beobachten, Logs prüfen. Ein effizienter Workflow ist entscheidend.

### Der grundlegende Testzyklus

```
Code bearbeiten --> PBO erstellen --> DayZ starten --> Im Spiel testen --> Log prüfen --> Beheben --> Wiederholen
```

Mit File Patching überspringen Sie den PBO-Bau: `.c` auf dem P:-Laufwerk bearbeiten, neu verbinden, Log prüfen. Dies reduziert die Iteration von Minuten auf Sekunden.

### Server-Mods testen

Wenn Ihre Mod serverseitige Logik hat, benötigen Sie einen lokalen dedizierten Server.

**Option 1: Listen-Server (am einfachsten)**

Starten Sie DayZDiag mit `-server`, um Client und Server in einem einzelnen Prozess auszuführen:

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -server -port=2302
```

Dies ist der schnellste Weg zum Testen, repliziert aber keine dedizierte Serverumgebung perfekt.

**Option 2: Lokaler dedizierter Server (am genauesten)**

Führen Sie einen separaten DayZDiag-Serverprozess aus und verbinden Sie sich dann mit einem DayZDiag-Client:

Server:
```batch
DayZDiag_x64.exe -filePatching -server -mod=P:\MyMod -config=serverDZ.cfg -port=2302 -profiles=serverprofile
```

Client:
```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

Dies gibt Ihnen separate Client- und Server-Logs, was für das Debugging von RPC-Kommunikation und Client-Server-Split-Logik wesentlich ist.

### Client-Only- und Multiplayer-Tests

Für reine Client-Mods (UI, HUD) reicht ein Listen-Server aus: fügen Sie `-server` zu Ihren Startparametern hinzu.

Für Multiplayer-Tests haben Sie drei Optionen:
- **Zwei Instanzen auf einem Rechner:** DayZDiag-Server + zwei Clients mit verschiedenen `-profiles`-Ordnern ausführen
- **Mit einem Freund testen:** DayZDiag-Server hosten, Firewall-Port 2302 öffnen
- **Cloud-Server:** Einen entfernten dedizierten Server einrichten

### Build-Skripte verwenden

Wenn Ihr Projekt ein Build-Skript hat (wie `dev.py`), verwenden Sie es, um den Zyklus zu automatisieren:

```bash
python dev.py build     # Alle PBOs erstellen
python dev.py server    # Erstellen + Server starten + Logs überwachen
python dev.py client    # Client starten (verbindet sich mit localhost:2302)
python dev.py full      # Erstellen + Server + Überwachen + Client automatisch starten
python dev.py check     # Neuestes Script-Log auf Fehler prüfen (offline)
python dev.py watch     # Echtzeit-Log-Verfolgung, gefiltert für Fehler und Mod-Ausgabe
python dev.py kill      # DayZ-Prozesse für Neustart beenden
```

Der `watch`-Befehl ist besonders wertvoll -- er filtert das Live-Log, um nur relevante Ausgaben anzuzeigen.

---

## Ingame-Debug-Tools

DayZDiag bietet mehrere Ingame-Tools zum Testen. Diese sind in Retail-Builds nicht verfügbar.

### Skriptkonsole

Öffnen Sie mit der Akzent-Taste (`` ` ``) oder prüfen Sie Ihre Tastenbelegungen für "Script Console". Führen Sie Enforce-Script-Befehle live aus:

```c
// Ein Item an Ihrer Position spawnen
GetGame().GetPlayer().SpawnEntityOnGroundPos("AKM", GetGame().GetPlayer().GetPosition());

// Zu Koordinaten teleportieren
GetGame().GetPlayer().SetPosition("8000 0 10000");

// Ihre aktuelle Position ausgeben
Print(GetGame().GetPlayer().GetPosition().ToString());
```

### Freie Kamera

Umschaltbar über das Admin-Tools-Menü. Fliegen Sie losgelöst von Ihrem Charakter herum, um gespawnte Objekte zu inspizieren, Platzierung zu prüfen oder KI-Verhalten zu beobachten.

### Objekt-Spawning

```c
// Einen Zombie spawnen
GetGame().CreateObjectEx("ZmbM_HermitSkinny_Base", "8000 0 10000", ECE_PLACE_ON_SURFACE);

// Ein Fahrzeug spawnen
GetGame().CreateObjectEx("OffroadHatchback", "8000 0 10000", ECE_PLACE_ON_SURFACE);
```

### Zeit- und Wetter-Manipulation

```c
// Auf Mittag / Mitternacht setzen
GetGame().GetWorld().SetDate(2026, 6, 15, 12, 0);
GetGame().GetWorld().SetDate(2026, 6, 15, 0, 0);

// Wetter überschreiben
Weather weather = GetGame().GetWeather();
weather.GetOvercast().Set(0.8, 0, 0);
weather.GetRain().Set(1.0, 0, 0);
weather.GetFog().Set(0.5, 0, 0);
```

---

## Pre-Release-Checkliste

Bevor Sie im Steam Workshop veröffentlichen, gehen Sie jeden Punkt durch.

### 1. Alle Debug-Ausgaben entfernen oder absichern

Suchen Sie nach `Print(` und stellen Sie sicher, dass jeder Debug-Print entfernt oder in `#ifdef DEVELOPER` eingewickelt ist.

### 2. Mit einem sauberen Profil testen

Benennen Sie `%LocalAppData%\DayZ\` in `DayZ_backup` um und testen Sie von Grund auf. Dies fangen Annahmen über zwischengespeicherte Daten oder bestehende Config-Dateien ab.

### 3. Mod-Ladereihenfolge testen

Testen Sie Ihre Mod geladen vor und nach anderen populären Mods. Prüfen Sie auf Klassennamen-Kollisionen, RPC-ID-Konflikte und config.cpp-Überschreibungen.

### 4. Auf Speicherlecks prüfen

Beobachten Sie den Serverspeicher über die Zeit. Häufige Leak-Ursachen: Objekte, die in Schleifen ohne Bereinigung erstellt werden, zirkuläre `ref`-Referenzen (eine Seite muss roh sein), Arrays, die ohne Grenzen wachsen.

### 5. Stringtable-Einträge überprüfen

Jeder `#key_name`, der im Code referenziert wird, braucht eine passende Zeile in der `stringtable.csv`. Fehlende Einträge werden als rohe Schlüssel-Strings im Spiel angezeigt.

### 6. Auf einem dedizierten Server testen

Listen-Server-Tests verbergen RPC-Timing-Probleme, Autoritätsunterschiede und Multi-Client-Sync-Bugs. Führen Sie immer einen finalen Test auf einem echten dedizierten Server durch.

### 7. Eine frische Workshop-Installation testen

Abonnement kündigen, lokalen Mod-Ordner löschen, neu abonnieren und testen. Dies verifiziert, dass der Workshop-Upload vollständig ist.

---

## Häufige Fehler

Fehler, die jeder DayZ-Modder mindestens einmal macht. Lernen Sie daraus.

### 1. Debug-Prints in Release-Builds lassen

Spieler brauchen kein `[MyMod:DEBUG] Tick count: 14523` in ihren Logs. Wickeln Sie es in `#ifdef DEVELOPER` ein oder entfernen Sie es vollständig.

### 2. Nur im Einzelspieler testen

Listen-Server führen Client und Server in einem Prozess aus und verbergen RPCs, die nie das Netzwerk kreuzen, Race Conditions, Autoritätspruefungsunterschiede und Null-Identitäts-Referenzen. Testen Sie mit einem separaten dedizierten Server.

### 3. Nicht mit anderen Mods testen

Ihre Mod kann mit CF, Expansion oder anderen populären Mods über doppelte RPC-IDs, fehlende `super`-Aufrufe in Overrides oder Config-Klassen-Kollisionen konfligieren. Testen Sie Kombinationen vor der Veröffentlichung.

### 4. Warnungen ignorieren

`SCRIPT (W)`-Warnungen sagen oft zukünftige Absturze voraus. Eine fehlende-Datei-Warnung heute wird morgen ein Null-Pointer.

### 5. File Patching nicht verwenden

PBOs für jede einzelne Zeilenänderung neu erstellen vergeudet enorm viel Zeit. Richten Sie File Patching einmal ein (siehe [oben](#file-patching----bearbeiten-ohne-neuerstellen)).

### 6. Nicht beide Client- und Server-Logs prüfen

Bei RPC-/Client-Server-Problemen ist der Fehler oft auf einer Seite und das Symptom auf der anderen. Prüfen Sie sowohl `%LocalAppData%\DayZ\` (Client) als auch den Profilordner Ihres Servers.

### 7. config.cpp ändern ohne Neuerstellen

File Patching gilt nicht für `config.cpp`. Neue Klassen, `requiredAddons`-Änderungen und `CfgMods`-Bearbeitungen erfordern immer einen PBO-Neubau.

### 8. Falsche Skriptschicht

Untere Schichten können obere nicht sehen. Wenn `3_Game/`-Code `PlayerBase` referenziert (definiert in `4_World/`), schlägt es fehl:

```
3_Game/   -- Kann nicht auf 4_World- oder 5_Mission-Typen referenzieren
4_World/  -- Kann auf 3_Game referenzieren, nicht auf 5_Mission
5_Mission/-- Kann auf 3_Game und 4_World referenzieren
```

---

## Nächste Schritte

1. **File Patching einrichten**, falls Sie es noch nicht getan haben. Es ist die wirkungsvollste Einzelverbesserung für Ihren Entwicklungs-Workflow.
2. **Eine Debug-Logger-Klasse** für Ihre Mod mit konsistentem Präfix erstellen, damit Sie Log-Ausgaben leicht filtern können.
3. **Das Script-Log lesen üben.** Öffnen Sie es nach jeder Testsitzung und suchen Sie nach Fehlern und Warnungen, auch wenn alles zu funktionieren schien. Stille Fehler können subtile Bugs verursachen, die später auftauchen.
4. **Workbench erkunden.** Öffnen Sie die Skripte Ihrer Mod in Workbench und probieren Sie die Skriptkonsole. Es braucht Zeit, sich einzugewöhnen, aber es zahlt sich aus.
5. **Ein Testszenario erstellen.** Erstellen Sie eine gespeicherte Mission oder ein Skript, das eine bestimmte Testumgebung einrichtet (Items spawnt, Tageszeit setzt, zu einem Ort teleportiert), damit Sie Bugs schnell reproduzieren können.
6. **[Kapitel 8.1](01-first-mod.md) lesen**, falls Sie Ihre erste Mod noch nicht erstellt haben. Debugging ist viel einfacher, wenn Sie die vollständige Mod-Struktur verstehen.

---

## Bewährte Methoden

- **Zuerst das Script-Log prüfen, bevor Sie Code ändern.** Die meisten Bugs haben eine klare Fehlermeldung im Log. Code zu ändern, ohne das Log zu lesen, führt zu blindem Raten und neuen Bugs.
- **`#ifdef DEVELOPER`-Guards für alle Debug-Prints verwenden.** Dies stellt null Leistungskosten in Retail-Builds sicher und verhindert Log-Spam für Spieler. Reservieren Sie ungesicherte `Print()`-Aufrufe nur für kritische Fehler.
- **Immer sowohl Client- als auch Server-Logs bei RPC-Problemen prüfen.** Der Fehler ist oft auf einer Seite und das Symptom auf der anderen. Ein serverseitiger Null-Pointer verwirft die Antwort stillschweigend, und der Client sieht nur "keine Daten empfangen."
- **File Patching am ersten Tag einrichten.** Der Bearbeiten-Neustart-Prüfen-Zyklus sinkt von 3-5 Minuten (PBO-Neubau) auf unter 30 Sekunden (speichern und neu verbinden). Dies ist die größte Einzelproduktivitätsverbesserung.
- **Ein konsistentes Log-Präfix wie `[MyMod]` in jedem Print-Aufruf verwenden.** Script-Logs enthalten Ausgaben von Vanilla-Code, der Engine und jeder geladenen Mod. Ohne Präfix ist Ihre Ausgabe im Rauschen unsichtbar.

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|--------|---------|
| `SCRIPT (W)`-Warnungen | Warnungen sind nicht-fatal und können sicher ignoriert werden | Warnungen sagen oft zukünftige Absturze voraus. Eine "Cannot open file"-Warnung heute wird morgen ein Null-Pointer-Absturz, wenn Code annimmt, dass die Datei geladen wurde. |
| Listen-Server-Tests | Gut genug um zu verifizieren, dass Skripte funktionieren | Listen-Server verbergen ganze Kategorien von Bugs: RPCs die nie das Netzwerk kreuzen, fehlende Autoritätspruefungen, Null-`PlayerIdentity` auf dem Server und Race Conditions zwischen Client- und Server-Init. |
| File Patching | Jede Datei bearbeiten und Änderungen sofort sehen | `config.cpp` wird nie per File Patching geladen. Neue `.c`-Dateien werden ebenfalls nicht aufgenommen. Beides erfordert einen PBO-Neubau. Nur Modifikationen an bestehenden Skript- und Layout-Dateien werden live nachgeladen. |
| Workbench-Debugger | Vollständige IDE-Debugging-Erfahrung | Workbench kann Syntax prüfen und isolierte Skripte ausführen, aber es repliziert nicht die vollständige Spielumgebung. Viele APIs geben null zurück oder verhalten sich ausserhalb des Spiels anders. |

---

## Was Sie gelernt haben

In diesem Tutorial haben Sie gelernt:
- Wie Sie DayZ-Script-Logs finden und lesen, und was `SCRIPT (E)`- und `SCRIPT (W)`-Markierungen bedeuten
- Wie Sie `Print()`-Debugging mit Präfixen, Formatierern und umschaltbaren Debug-Loggern verwenden
- Wie Sie DayZDiag mit File Patching für schnelle Iteration einrichten
- Wie Sie die häufigsten Fehlermuster diagnostizieren: Null-Pointer, Typkonflikte, undefinierte Variablen und Skriptschicht-Verletzungen
- Wie Sie einen zuverlässigen Test-Workflow von der Bearbeitung bis zur Verifizierung etablieren

**Nächstes:** [Kapitel 8.8: Ein HUD-Overlay bauen](08-hud-overlay.md)

---
