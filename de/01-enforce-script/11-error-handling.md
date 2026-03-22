# Kapitel 1.11: Fehlerbehandlung

[Startseite](../README.md) | [<< Zurück: Enums & Präprozessor](10-enums-preprocessor.md) | **Fehlerbehandlung** | [Weiter: Fallstricke >>](12-gotchas.md)

---

> **Ziel:** Lernen Sie, wie man Fehler in einer Sprache ohne try/catch behandelt. Meistern Sie Guard-Klauseln, defensives Programmieren und strukturierte Logging-Muster, die Ihren Mod stabil halten.

---

## Inhaltsverzeichnis

- [Die fundamentale Regel: Kein try/catch](#die-fundamentale-regel-kein-trycatch)
- [Guard-Klausel-Muster](#guard-klausel-muster)
  - [Einzelne Guard-Klausel](#einzelne-guard-klausel)
  - [Mehrere Guards (gestapelt)](#mehrere-guards-gestapelt)
  - [Guard mit Logging](#guard-mit-logging)
- [Null-Prüfung](#null-prüfung)
  - [Vor jeder Operation](#vor-jeder-operation)
  - [Verkettete Null-Prüfungen](#verkettete-null-prüfungen)
  - [Das notnull-Schlüsselwort](#das-notnull-schlüsselwort)
- [ErrorEx -- Engine-Fehlermeldung](#errorex--engine-fehlermeldung)
  - [Schweregrade](#schweregrade)
  - [Wann welchen Grad verwenden](#wann-welchen-grad-verwenden)
- [DumpStackString -- Stack-Traces](#dumpstackstring--stack-traces)
- [Debug-Ausgabe](#debug-ausgabe)
  - [Einfaches Print](#einfaches-print)
  - [Bedingtes Debug mit #ifdef](#bedingtes-debug-mit-ifdef)
- [Strukturierte Logging-Muster](#strukturierte-logging-muster)
  - [Einfaches Präfix-Muster](#einfaches-präfix-muster)
  - [Level-basierte Logger-Klasse](#level-basierte-logger-klasse)
  - [Produktions-Logger-Muster](#produktions-logger-muster)
- [Praxisbeispiele](#praxisbeispiele)
  - [Sichere Funktion mit mehreren Guards](#sichere-funktion-mit-mehreren-guards)
  - [Sicheres Config-Laden](#sicheres-config-laden)
  - [Sicherer RPC-Handler](#sicherer-rpc-handler)
  - [Sichere Inventar-Operation](#sichere-inventar-operation)
- [Zusammenfassung der defensiven Muster](#zusammenfassung-der-defensiven-muster)
- [Häufige Fehler](#häufige-fehler)
- [Zusammenfassung](#zusammenfassung)
- [Navigation](#navigation)

---

## Die fundamentale Regel: Kein try/catch

Enforce Script hat **keine Ausnahmebehandlung**. Es gibt kein `try`, kein `catch`, kein `throw`, kein `finally`. Wenn zur Laufzeit etwas schief geht (Null-Dereferenzierung, ungültiger Cast, Array-Indexüberschreitung), macht die Engine entweder:

1. **Stürzt lautlos ab** -- die Funktion hört auf zu laufen, keine Fehlermeldung
2. **Protokolliert einen Script-Fehler** -- sichtbar in der `.RPT`-Logdatei
3. **Bringt den Server/Client zum Absturz** -- in schweren Fällen

Das bedeutet, **jeder potenzielle Fehlerpunkt muss manuell abgesichert werden**. Die primäre Verteidigung ist das **Guard-Klausel-Muster**.

---

## Guard-Klausel-Muster

Eine Guard-Klausel prüft eine Vorbedingung am Anfang einer Funktion und kehrt frühzeitig zurück, wenn sie fehlschlägt. Das hält den "glücklichen Pfad" unverschachtelt und lesbar.

### Einzelne Guard-Klausel

```c
void TeleportPlayer(PlayerBase player, vector destination)
{
    if (!player)
        return;

    player.SetPosition(destination);
}
```

### Mehrere Guards (gestapelt)

Stapeln Sie Guards am Anfang der Funktion -- jeder prüft eine Vorbedingung:

```c
void GiveItemToPlayer(PlayerBase player, string className, int quantity)
{
    // Guard 1: Spieler existiert
    if (!player)
        return;

    // Guard 2: Spieler lebt
    if (!player.IsAlive())
        return;

    // Guard 3: gültiger Klassenname
    if (className == "")
        return;

    // Guard 4: gültige Menge
    if (quantity <= 0)
        return;

    // Alle Vorbedingungen erfüllt -- sicher fortzufahren
    for (int i = 0; i < quantity; i++)
    {
        player.GetInventory().CreateInInventory(className);
    }
}
```

### Guard mit Logging

Im Produktionscode sollten Sie immer protokollieren, warum ein Guard ausgelöst wurde -- stille Fehler sind schwer zu debuggen:

```c
void StartMission(PlayerBase initiator, string missionId)
{
    if (!initiator)
    {
        Print("[Missions] FEHLER: StartMission mit null-Initiator aufgerufen");
        return;
    }

    if (missionId == "")
    {
        Print("[Missions] FEHLER: StartMission mit leerer missionId aufgerufen");
        return;
    }

    if (!initiator.IsAlive())
    {
        Print("[Missions] WARNUNG: Spieler " + initiator.GetIdentity().GetName() + " ist tot, kann Mission nicht starten");
        return;
    }

    // Mit Missionsstart fortfahren
    Print("[Missions] Starte Mission " + missionId);
    // ...
}
```

---

## Null-Prüfung

Null-Referenzen sind die häufigste Absturzursache beim DayZ-Modding. Jeder Referenztyp kann `null` sein.

### Vor jeder Operation

```c
// FALSCH -- stürzt ab, wenn player, identity oder name an irgendeiner Stelle null ist
string name = player.GetIdentity().GetName();

// RICHTIG -- bei jedem Schritt prüfen
if (!player)
    return;

PlayerIdentity identity = player.GetIdentity();
if (!identity)
    return;

string name = identity.GetName();
```

### Verkettete Null-Prüfungen

Wenn Sie eine Kette von Referenzen durchlaufen müssen, prüfen Sie jedes Glied:

```c
void PrintHandItemName(PlayerBase player)
{
    if (!player)
        return;

    HumanInventory inv = player.GetHumanInventory();
    if (!inv)
        return;

    EntityAI handItem = inv.GetEntityInHands();
    if (!handItem)
        return;

    Print("Spieler hält: " + handItem.GetType());
}
```

### Das notnull-Schlüsselwort

`notnull` ist ein Parametermodifikator, der den Compiler dazu bringt, `null`-Argumente an der Aufrufstelle abzulehnen:

```c
void ProcessItem(notnull EntityAI item)
{
    // Compiler garantiert, dass item nicht null ist
    // Keine Null-Prüfung innerhalb der Funktion nötig
    Print(item.GetType());
}

// Verwendung:
EntityAI item = GetSomeItem();
if (item)
{
    ProcessItem(item);  // OK -- Compiler weiß, dass item hier nicht null ist
}
ProcessItem(null);      // Kompilierfehler!
```

> **Einschränkung:** `notnull` fängt nur literales `null` und offensichtlich-null-Variablen an der Aufrufstelle ab. Es verhindert nicht, dass eine Variable, die zum Prüfzeitpunkt nicht-null war, durch Engine-Löschung null wird.

---

## ErrorEx -- Engine-Fehlermeldung

`ErrorEx` schreibt eine Fehlermeldung in das Script-Log (`.RPT`-Datei). Es stoppt die Ausführung **nicht** und wirft keine Ausnahme.

```c
ErrorEx("Etwas ist schiefgelaufen");
```

### Schweregrade

`ErrorEx` akzeptiert einen optionalen zweiten Parameter vom Typ `ErrorExSeverity`:

```c
// INFO -- informativ, kein Fehler
ErrorEx("Config erfolgreich geladen", ErrorExSeverity.INFO);

// WARNING -- mögliches Problem, Ausführung geht weiter
ErrorEx("Config-Datei nicht gefunden, verwende Standardwerte", ErrorExSeverity.WARNING);

// ERROR -- definitives Problem (Standard-Schweregrad wenn weggelassen)
ErrorEx("Objekt konnte nicht erstellt werden: Klasse nicht gefunden");
ErrorEx("Kritischer Fehler im RPC-Handler", ErrorExSeverity.ERROR);
```

| Schweregrad | Wann verwenden |
|----------|-------------|
| `ErrorExSeverity.INFO` | Informationsmeldungen, die im Fehlerlog erscheinen sollen |
| `ErrorExSeverity.WARNING` | Behebbare Probleme (fehlende Config, Fallback verwendet) |
| `ErrorExSeverity.ERROR` | Definitive Fehler oder nicht behebbare Zustände |

### Wann welchen Grad verwenden

```c
void LoadConfig(string path)
{
    if (!FileExist(path))
    {
        // WARNING -- behebbar, wir verwenden Standardwerte
        ErrorEx("Config nicht gefunden unter " + path + ", verwende Standardwerte", ErrorExSeverity.WARNING);
        UseDefaultConfig();
        return;
    }

    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    if (cfg.Version < EXPECTED_VERSION)
    {
        // INFO -- kein Problem, nur erwähnenswert
        ErrorEx("Config-Version " + cfg.Version.ToString() + " ist älter als erwartet", ErrorExSeverity.INFO);
    }

    if (!cfg.Validate())
    {
        // ERROR -- fehlerhafte Daten, die Probleme verursachen werden
        ErrorEx("Config-Validierung fehlgeschlagen für " + path);
        UseDefaultConfig();
        return;
    }
}
```

---

## DumpStackString -- Stack-Traces

`DumpStackString` erfasst den aktuellen Aufruf-Stack als String. Dies ist entscheidend für die Diagnose, wo ein unerwarteter Zustand aufgetreten ist:

```c
void OnUnexpectedState(string context)
{
    string stack = DumpStackString();
    Print("[FEHLER] Unerwarteter Zustand in " + context);
    Print("[FEHLER] Stack-Trace:");
    Print(stack);
}
```

Verwenden Sie es in Guard-Klauseln, um den Aufrufer zu verfolgen:

```c
void CriticalFunction(PlayerBase player)
{
    if (!player)
    {
        string stack = DumpStackString();
        ErrorEx("CriticalFunction mit null-Spieler aufgerufen! Stack: " + stack);
        return;
    }

    // ...
}
```

---

## Debug-Ausgabe

### Einfaches Print

`Print()` schreibt in die Script-Logdatei. Es akzeptiert jeden Typ:

```c
Print("Hallo Welt");                    // string
Print(42);                               // int
Print(3.14);                             // float
Print(player.GetPosition());             // vector

// Formatierte Ausgabe
Print(string.Format("Spieler %1 an Position %2 mit %3 HP",
    player.GetIdentity().GetName(),
    player.GetPosition().ToString(),
    player.GetHealth("", "Health").ToString()
));
```

### Bedingtes Debug mit #ifdef

Umschließen Sie Debug-Ausgaben mit Präprozessor-Guards, damit sie aus Release-Builds heraus kompiliert werden:

```c
void ProcessAI(DayZInfected zombie)
{
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI DEBUG] Verarbeite %1 an %2",
            zombie.GetType(),
            zombie.GetPosition().ToString()
        ));
    #endif

    // Eigentliche Logik...
}
```

Für mod-spezifische Debug-Flags definieren Sie Ihr eigenes Symbol:

```c
// In Ihrer config.cpp:
// defines[] = { "MYMOD_DEBUG" };

#ifdef MYMOD_DEBUG
    Print("[MyMod] Debug: Item gespawnt an " + pos.ToString());
#endif
```

---

## Strukturierte Logging-Muster

### Einfaches Präfix-Muster

Der einfachste Ansatz -- einen Tag vor jeden Print-Aufruf stellen:

```c
class MissionManager
{
    static const string LOG_TAG = "[Missions] ";

    void Start()
    {
        Print(LOG_TAG + "Missionssystem startet");
    }

    void OnError(string msg)
    {
        Print(LOG_TAG + "FEHLER: " + msg);
    }
}
```

### Level-basierte Logger-Klasse

Ein wiederverwendbarer Logger mit Schweregraden:

```c
class ModLogger
{
    protected string m_Prefix;

    void ModLogger(string prefix)
    {
        m_Prefix = "[" + prefix + "] ";
    }

    void Info(string msg)
    {
        Print(m_Prefix + "INFO: " + msg);
    }

    void Warning(string msg)
    {
        Print(m_Prefix + "WARNUNG: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.WARNING);
    }

    void Error(string msg)
    {
        Print(m_Prefix + "FEHLER: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.ERROR);
    }

    void Debug(string msg)
    {
        #ifdef DIAG_DEVELOPER
            Print(m_Prefix + "DEBUG: " + msg);
        #endif
    }
}

// Verwendung:
ref ModLogger g_MissionLog = new ModLogger("Missions");
g_MissionLog.Info("System gestartet");
g_MissionLog.Error("Missionsdaten konnten nicht geladen werden");
```

### Produktions-Logger-Muster

Für Produktions-Mods eine statische Logging-Klasse mit Dateiausgabe, täglicher Rotation und mehreren Ausgabezielen:

```c
// Enum für Log-Level
enum MyLogLevel
{
    TRACE   = 0,
    DEBUG   = 1,
    INFO    = 2,
    WARNING = 3,
    ERROR   = 4,
    NONE    = 5
};

class MyLog
{
    private static MyLogLevel s_FileMinLevel = MyLogLevel.DEBUG;
    private static MyLogLevel s_ConsoleMinLevel = MyLogLevel.INFO;

    // Verwendung: MyLog.Info("ModuleName", "Etwas ist passiert");
    static void Info(string source, string message)
    {
        Log(MyLogLevel.INFO, source, message);
    }

    static void Warning(string source, string message)
    {
        Log(MyLogLevel.WARNING, source, message);
    }

    static void Error(string source, string message)
    {
        Log(MyLogLevel.ERROR, source, message);
    }

    private static void Log(MyLogLevel level, string source, string message)
    {
        if (level < s_ConsoleMinLevel)
            return;

        string levelName = typename.EnumToString(MyLogLevel, level);
        string line = string.Format("[MyMod] [%1] [%2] %3", levelName, source, message);
        Print(line);

        // Auch in Datei schreiben, wenn Level den Datei-Schwellenwert erreicht
        if (level >= s_FileMinLevel)
        {
            WriteToFile(line);
        }
    }

    private static void WriteToFile(string line)
    {
        // Datei-I/O-Implementierung...
    }
}
```

Verwendung über mehrere Module hinweg:

```c
MyLog.Info("MissionServer", "MyMod Core initialisiert (Server)");
MyLog.Warning("ServerWebhooksRPC", "Unautorisierte Anfrage von: " + sender.GetName());
MyLog.Error("ConfigManager", "Config konnte nicht geladen werden: " + path);
```

---

## Praxisbeispiele

### Sichere Funktion mit mehreren Guards

```c
void HealPlayer(PlayerBase player, float amount, string healerName)
{
    // Guard: null-Spieler
    if (!player)
    {
        MyLog.Error("HealSystem", "HealPlayer mit null-Spieler aufgerufen");
        return;
    }

    // Guard: Spieler lebt
    if (!player.IsAlive())
    {
        MyLog.Warning("HealSystem", "Kann toten Spieler nicht heilen: " + player.GetIdentity().GetName());
        return;
    }

    // Guard: gültiger Betrag
    if (amount <= 0)
    {
        MyLog.Warning("HealSystem", "Ungültiger Heilungsbetrag: " + amount.ToString());
        return;
    }

    // Guard: nicht bereits bei voller Gesundheit
    float currentHP = player.GetHealth("", "Health");
    float maxHP = player.GetMaxHealth("", "Health");
    if (currentHP >= maxHP)
    {
        MyLog.Info("HealSystem", player.GetIdentity().GetName() + " bereits bei voller Gesundheit");
        return;
    }

    // Alle Guards bestanden -- Heilung durchführen
    float newHP = Math.Min(currentHP + amount, maxHP);
    player.SetHealth("", "Health", newHP);

    MyLog.Info("HealSystem", string.Format("%1 hat %2 um %3 HP geheilt (%4 -> %5)",
        healerName,
        player.GetIdentity().GetName(),
        amount.ToString(),
        currentHP.ToString(),
        newHP.ToString()
    ));
}
```

### Sicheres Config-Laden

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 100.0;
    string WelcomeMessage = "Willkommen!";
}

static MyConfig LoadConfigSafe(string path)
{
    // Guard: Datei existiert
    if (!FileExist(path))
    {
        Print("[Config] Datei nicht gefunden: " + path + " -- erstelle Standardwerte");
        MyConfig defaults = new MyConfig();
        JsonFileLoader<MyConfig>.JsonSaveFile(path, defaults);
        return defaults;
    }

    // Ladeversuch (kein try/catch, also danach validieren)
    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    // Guard: geladenes Objekt ist gültig
    if (!cfg)
    {
        Print("[Config] FEHLER: Konnte " + path + " nicht parsen -- verwende Standardwerte");
        return new MyConfig();
    }

    // Guard: Werte validieren
    if (cfg.MaxPlayers < 1 || cfg.MaxPlayers > 128)
    {
        Print("[Config] WARNUNG: MaxPlayers außerhalb des Bereichs (" + cfg.MaxPlayers.ToString() + "), wird begrenzt");
        cfg.MaxPlayers = Math.Clamp(cfg.MaxPlayers, 1, 128);
    }

    if (cfg.SpawnRadius < 0)
    {
        Print("[Config] WARNUNG: SpawnRadius negativ, verwende Standardwert");
        cfg.SpawnRadius = 100.0;
    }

    return cfg;
}
```

### Sicherer RPC-Handler

```c
void RPC_SpawnItem(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    // Guard: nur Server
    if (type != CallType.Server)
        return;

    // Guard: gültiger Absender
    if (!sender)
    {
        Print("[RPC] SpawnItem: null-Absenderidentität");
        return;
    }

    // Guard: Parameter lesen
    Param2<string, vector> data;
    if (!ctx.Read(data))
    {
        Print("[RPC] SpawnItem: Parameter konnten nicht gelesen werden von " + sender.GetName());
        return;
    }

    string className = data.param1;
    vector position = data.param2;

    // Guard: gültiger Klassenname
    if (className == "")
    {
        Print("[RPC] SpawnItem: leerer className von " + sender.GetName());
        return;
    }

    // Guard: Berechtigungsprüfung
    if (!HasPermission(sender.GetPlainId(), "SpawnItem"))
    {
        Print("[RPC] SpawnItem: nicht autorisiert durch " + sender.GetName());
        return;
    }

    // Alle Guards bestanden -- ausführen
    Object obj = GetGame().CreateObjectEx(className, position, ECE_PLACE_ON_SURFACE);
    if (!obj)
    {
        Print("[RPC] SpawnItem: CreateObjectEx hat null zurückgegeben für " + className);
        return;
    }

    Print("[RPC] SpawnItem: " + sender.GetName() + " hat " + className + " gespawnt");
}
```

### Sichere Inventar-Operation

```c
bool TransferItem(PlayerBase fromPlayer, PlayerBase toPlayer, EntityAI item)
{
    // Guard: alle Referenzen gültig
    if (!fromPlayer || !toPlayer || !item)
    {
        Print("[Inventar] TransferItem: null-Referenz");
        return false;
    }

    // Guard: beide Spieler leben
    if (!fromPlayer.IsAlive() || !toPlayer.IsAlive())
    {
        Print("[Inventar] TransferItem: einer oder beide Spieler sind tot");
        return false;
    }

    // Guard: Quelle hat das Item tatsächlich
    EntityAI checkItem = fromPlayer.GetInventory().FindAttachment(
        fromPlayer.GetInventory().FindUserReservedLocationIndex(item)
    );

    // Guard: Ziel hat Platz
    InventoryLocation il = new InventoryLocation();
    if (!toPlayer.GetInventory().FindFreeLocationFor(item, FindInventoryLocationType.ANY, il))
    {
        Print("[Inventar] TransferItem: kein freier Platz im Zielinventar");
        return false;
    }

    // Transfer ausführen
    return toPlayer.GetInventory().TakeEntityToInventory(InventoryMode.SERVER, FindInventoryLocationType.ANY, item);
}
```

---

## Zusammenfassung der defensiven Muster

| Muster | Zweck | Beispiel |
|---------|---------|---------|
| Guard-Klausel | Frühzeitige Rückkehr bei ungültiger Eingabe | `if (!player) return;` |
| Null-Prüfung | Null-Dereferenzierung verhindern | `if (obj) obj.DoThing();` |
| Cast + Prüfung | Sicherer Downcast | `if (Class.CastTo(p, obj))` |
| Nach dem Laden validieren | Daten nach JSON-Laden prüfen | `if (cfg.Value < 0) cfg.Value = default;` |
| Vor der Verwendung validieren | Bereichs-/Grenzprüfung | `if (arr.IsValidIndex(i))` |
| Bei Fehler protokollieren | Nachverfolgen, wo Dinge schiefgelaufen sind | `Print("[Tag] Fehler: " + context);` |
| ErrorEx für die Engine | In .RPT-Datei schreiben | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Aufruf-Stack erfassen | `Print(DumpStackString());` |

---

## Bewährte Praktiken

- Verwenden Sie flache Guard-Klauseln (`if (!x) return;`) am Anfang jeder Funktion anstelle tief verschachtelter `if`-Blöcke -- es hält den Code lesbar und den glücklichen Pfad unverschachtelt.
- Protokollieren Sie immer eine Meldung in Guard-Klauseln -- stilles `return` macht Fehler unsichtbar und extrem schwer zu debuggen.
- Verwenden Sie `ErrorEx` mit angemessenen Schweregraden (`INFO`, `WARNING`, `ERROR`) für Meldungen, die in `.RPT`-Logs erscheinen sollen; verwenden Sie `Print` für Script-Log-Ausgabe.
- Umschließen Sie umfangreiches Debug-Logging mit `#ifdef DIAG_DEVELOPER` oder einem benutzerdefinierten Define, damit es aus Release-Builds heraus kompiliert wird und die Leistung nicht beeinträchtigt.
- Validieren Sie Config-Daten nach dem Laden mit `JsonFileLoader` -- es gibt `void` zurück und lässt bei Parse-Fehler stillschweigend Standardwerte stehen.

---

## In echten Mods beobachtet

> Muster bestätigt durch die Untersuchung professioneller DayZ-Mod-Quellcodes.

| Muster | Mod | Detail |
|---------|-----|--------|
| Gestapelte Guard-Klauseln mit Log-Meldungen | COT / VPP | Jeder RPC-Handler prüft Absender, Parameter, Berechtigungen und protokolliert bei jedem Fehler |
| Statische Logger-Klasse mit Level-Filterung | Expansion / Dabs | Eine einzelne `Log`-Klasse leitet `Info`/`Warning`/`Error` an Konsole, Datei und optional Discord |
| `DumpStackString()` in kritischen Guards | COT Admin | Erfasst den Aufruf-Stack bei unerwartetem null, um den Aufrufer zu identifizieren, der fehlerhafte Daten übergeben hat |
| `#ifdef DIAG_DEVELOPER` um Debug-Ausgaben | Vanilla DayZ / Expansion | Alle Pro-Frame-Debug-Ausgaben sind umschlossen, damit sie in Release-Builds nie laufen |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| `try`/`catch` | Standard in den meisten Sprachen | Existiert nicht in Enforce Script -- jeder Fehlerpunkt muss manuell abgesichert werden |
| `JsonFileLoader.JsonLoadFile` | Sollte Erfolg/Misserfolg zurückgeben | Gibt `void` zurück; bei fehlerhaftem JSON behält das Objekt seine Standardwerte ohne Fehler |
| `ErrorEx` | Klingt, als würde es einen Fehler werfen | Es schreibt nur in das `.RPT`-Log -- die Ausführung geht normal weiter |

---

## Häufige Fehler

### 1. Annehmen, dass eine Funktion erfolgreich ausgeführt wurde

```c
// FALSCH -- JsonLoadFile gibt void zurück, keinen Erfolgsindikator
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
// Wenn die Datei fehlerhaftes JSON enthält, hat cfg immer noch Standardwerte -- kein Fehler

// RICHTIG -- nach dem Laden validieren
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
if (cfg.SomeCriticalField == 0)
{
    Print("[Config] Warnung: SomeCriticalField ist null -- wurde die Datei korrekt geladen?");
}
```

### 2. Tief verschachtelte Null-Prüfungen statt Guards

```c
// FALSCH -- Pyramide des Grauens
void Process(PlayerBase player)
{
    if (player)
    {
        if (player.GetIdentity())
        {
            if (player.IsAlive())
            {
                // Endlich etwas tun
            }
        }
    }
}

// RICHTIG -- flache Guard-Klauseln
void Process(PlayerBase player)
{
    if (!player) return;
    if (!player.GetIdentity()) return;
    if (!player.IsAlive()) return;

    // Etwas tun
}
```

### 3. Vergessen, in Guard-Klauseln zu protokollieren

```c
// FALSCH -- stilles Versagen, unmöglich zu debuggen
if (!player) return;

// RICHTIG -- hinterlässt eine Spur
if (!player)
{
    Print("[MyMod] Process: null-Spieler");
    return;
}
```

### 4. Print in heißen Pfaden verwenden

```c
// FALSCH -- Print jeden Frame tötet die Leistung
override void OnUpdate(float timeslice)
{
    Print("Aktualisiere...");  // Wird jeden Frame aufgerufen!
}

// RICHTIG -- Debug-Guards oder Ratenbegrenzung verwenden
override void OnUpdate(float timeslice)
{
    #ifdef DIAG_DEVELOPER
        m_DebugTimer += timeslice;
        if (m_DebugTimer > 5.0)
        {
            Print("[DEBUG] Update-Tick: " + timeslice.ToString());
            m_DebugTimer = 0;
        }
    #endif
}
```

---

## Zusammenfassung

| Werkzeug | Zweck | Syntax |
|------|---------|--------|
| Guard-Klausel | Frühzeitige Rückkehr bei Fehler | `if (!x) return;` |
| Null-Prüfung | Absturz verhindern | `if (obj) obj.Method();` |
| ErrorEx | In .RPT-Log schreiben | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Aufruf-Stack abrufen | `string s = DumpStackString();` |
| Print | In Script-Log schreiben | `Print("nachricht");` |
| string.Format | Formatiertes Logging | `string.Format("S %1 an %2", a, b)` |
| #ifdef-Guard | Kompilierzeit-Debug-Schalter | `#ifdef DIAG_DEVELOPER` |
| notnull | Compiler-Null-Prüfung | `void Fn(notnull Class obj)` |

**Die goldene Regel:** In Enforce Script gehen Sie davon aus, dass alles null sein kann und jede Operation fehlschlagen kann. Zuerst prüfen, dann handeln, immer protokollieren.

---

## Navigation

| Zurück | Hoch | Weiter |
|----------|----|------|
| [1.10 Enums & Präprozessor](10-enums-preprocessor.md) | [Teil 1: Enforce Script](../README.md) | [1.12 Was es NICHT gibt](12-gotchas.md) |
