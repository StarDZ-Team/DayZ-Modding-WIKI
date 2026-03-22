# Kapitel 6.9: Netzwerk & RPC

[Startseite](../README.md) | [<< Zurück: Datei-I/O & JSON](08-file-io.md) | **Netzwerk & RPC** | [Weiter: Central Economy >>](10-central-economy.md)

---

## Einführung

DayZ ist ein Client-Server-Spiel. Alle autoritativen Logiken laufen auf dem Server, und Clients kommunizieren mit ihm über Remote Procedure Calls (RPCs). Der primäre RPC-Mechanismus ist `ScriptRPC`, der es ermöglicht, beliebige Daten auf einer Seite zu schreiben und auf der anderen zu lesen. Dieses Kapitel behandelt die Netzwerk-API: Senden und Empfangen von RPCs, die Serialisierungskontextklassen, die Legacy-Methode `CGame.RPC()` und `ScriptInputUserData` für eingabeverifizierte Client-zu-Server-Nachrichten.

---

## Client-Server-Architektur

```
┌────────────┐                    ┌────────────┐
│   Client   │  ──── RPC ────►   │   Server   │
│            │  ◄──── RPC ────   │            │
│ GetGame()  │                    │ GetGame()  │
│ .IsClient()│                    │ .IsServer()│
└────────────┘                    └────────────┘
```

### Umgebungspruefungen

```c
proto native bool GetGame().IsServer();          // true auf Server und Listen-Server-Host
proto native bool GetGame().IsClient();          // true auf Client
proto native bool GetGame().IsMultiplayer();      // true im Multiplayer
proto native bool GetGame().IsDedicatedServer();  // true nur auf dediziertem Server
```

**Typisches Guard-Muster:**

```c
if (GetGame().IsServer())
{
    // Nur-Server-Logik
}

if (!GetGame().IsServer())
{
    // Nur-Client-Logik
}
```

---

## ScriptRPC

**Datei:** `3_Game/gameplay.c:104`

Die primäre RPC-Klasse zum Senden eigener Daten zwischen Client und Server. `ScriptRPC` erweitert `ParamsWriteContext`, daher rufen Sie `.Write()` direkt darauf auf, um Daten zu serialisieren.

### Klassendefinition

```c
class ScriptRPC : ParamsWriteContext
{
    void ScriptRPC();
    void ~ScriptRPC();
    proto native void Reset();
    proto native void Send(Object target, int rpc_type, bool guaranteed,
                           PlayerIdentity recipient = NULL);
}
```

### Sendeparameter

| Parameter | Beschreibung |
|-----------|-------------|
| `target` | Das Objekt, dem dieser RPC zugeordnet ist (kann `null` für globale RPCs sein) |
| `rpc_type` | Ganzzahl-RPC-ID (muss zwischen Sender und Empfänger übereinstimmen) |
| `guaranteed` | `true` = TCP-artige zuverlässige Zustellung; `false` = UDP-artig unzuverlässig |
| `recipient` | `PlayerIdentity` des Ziel-Clients; `null` = an alle Clients senden (nur Server) |

### Daten schreiben

`ParamsWriteContext` (das `ScriptRPC` erweitert) bietet:

```c
proto bool Write(void value_out);
```

Unterstützt alle primitiven Typen, Arrays und serialisierbare Objekte:

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(42);                          // int
rpc.Write(3.14);                        // float
rpc.Write(true);                        // bool
rpc.Write("hello");                     // string
rpc.Write(Vector(100, 0, 200));         // vector

array<string> names = {"Alice", "Bob"};
rpc.Write(names);                       // array<string>
```

### Senden: Server an Client

```c
// An einen bestimmten Spieler senden
void SendDataToPlayer(PlayerBase player, int value, string message)
{
    if (!GetGame().IsServer())
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(value);
    rpc.Write(message);
    rpc.Send(player, MY_RPC_ID, true, player.GetIdentity());
}

// An alle Spieler senden
void BroadcastData(string message)
{
    if (!GetGame().IsServer())
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(message);
    rpc.Send(null, MY_RPC_ID, true, null);  // null-Empfänger = alle Clients
}
```

### Senden: Client an Server

```c
void SendRequestToServer(int requestType)
{
    if (!GetGame().IsClient())
        return;

    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    if (!player)
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(requestType);
    rpc.Send(player, MY_REQUEST_RPC, true, null);
    // Beim Senden vom Client wird der Empfänger ignoriert — es geht immer an den Server
}
```

---

## RPCs empfangen

RPCs werden durch Überschreiben von `OnRPC` auf dem Zielobjekt (oder einer beliebigen Elternklasse in der Hierarchie) empfangen.

### OnRPC-Signatur

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);

    if (rpc_type == MY_RPC_ID)
    {
        // Daten in derselben Reihenfolge lesen, in der sie geschrieben wurden
        int value;
        string message;

        if (!ctx.Read(value))
            return;
        if (!ctx.Read(message))
            return;

        // Die Daten verarbeiten
        HandleData(value, message);
    }
}
```

### ParamsReadContext

`ParamsReadContext` ist ein Typedef für `Serializer`:

```c
typedef Serializer ParamsReadContext;
typedef Serializer ParamsWriteContext;
```

Die `Read`-Methode:

```c
proto bool Read(void value_in);
```

Gibt `true` bei Erfolg zurück, `false` wenn das Lesen fehlschlägt (falscher Typ, unzureichende Daten). Prüfen Sie immer den Rückgabewert.

### Wo OnRPC überschrieben wird

| Zielobjekt | Empfängt RPCs für |
|---------------|-------------------|
| `PlayerBase` | RPCs gesendet mit `target = player` |
| `ItemBase` | RPCs gesendet mit `target = item` |
| Jedes `Object` | RPCs gesendet mit diesem Objekt als Ziel |
| `MissionGameplay` / `MissionServer` | Globale RPCs (`target = null`) über `OnRPC` in der Mission |

**Beispiel --- vollständiger Client-Server-Austausch:**

```c
// Geteilte Konstante (3_Game-Schicht)
const int RPC_MY_CUSTOM_DATA = 87001;

// Serverseitig: Daten an Client senden (4_World oder 5_Mission)
class MyServerHandler
{
    void SendScore(PlayerBase player, int score)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(score);
        rpc.Send(player, RPC_MY_CUSTOM_DATA, true, player.GetIdentity());
    }
}

// Clientseitig: Daten empfangen (modded PlayerBase)
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (rpc_type == RPC_MY_CUSTOM_DATA)
        {
            int score;
            if (!ctx.Read(score))
                return;

            Print(string.Format("Punktzahl empfangen: %1", score));
        }
    }
}
```

---

## CGame.RPC (Legacy-API)

Das ältere array-basierte RPC-System. Wird noch im Vanilla-Code verwendet, aber `ScriptRPC` wird für neue Mods bevorzugt.

### Signaturen

```c
// Mit Array von Param-Objekten senden
proto native void GetGame().RPC(Object target, int rpcType,
                                 notnull array<ref Param> params,
                                 bool guaranteed,
                                 PlayerIdentity recipient = null);

// Mit einem einzelnen Param senden
proto native void GetGame().RPCSingleParam(Object target, int rpc_type,
                                            Param param, bool guaranteed,
                                            PlayerIdentity recipient = null);
```

### Param-Klassen

```c
class Param1<Class T1> extends Param { T1 param1; };
class Param2<Class T1, Class T2> extends Param { T1 param1; T2 param2; };
// ... bis Param8
```

**Beispiel --- Legacy-RPC:**

```c
// Senden
Param1<string> data = new Param1<string>("Hello World");
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true, player.GetIdentity());

// Empfangen (in OnRPC)
if (rpc_type == MY_RPC_ID)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        Print(data.param1);  // "Hello World"
    }
}
```

---

## ScriptInputUserData

**Datei:** `3_Game/gameplay.c`

Ein spezialisierter Schreibkontext zum Senden von Client-zu-Server-Eingabenachrichten, die durch die Eingabevalidierungs-Pipeline der Engine laufen. Wird für Aktionen verwendet, die Anti-Cheat-Verifizierung benötigen.

```c
class ScriptInputUserData : ParamsWriteContext
{
    proto native void Reset();
    proto native void Send();
    proto native static bool CanStoreInputUserData();
}
```

### Verwendungsmuster

```c
// Clientseitig
void SendAction(int actionId)
{
    if (!ScriptInputUserData.CanStoreInputUserData())
    {
        Print("Kann Eingabedaten gerade nicht senden");
        return;
    }

    ScriptInputUserData ctx = new ScriptInputUserData();
    ctx.Write(actionId);
    ctx.Send();  // Wird automatisch an den Server geroutet
}
```

> **Hinweis:** `ScriptInputUserData` hat Ratenbegrenzung. Prüfen Sie immer `CanStoreInputUserData()` vor dem Senden.

---

## RPC-ID-Verwaltung

### RPC-IDs wählen

Vanilla DayZ verwendet das `ERPCs`-Enum für eingebaute RPCs. Eigene Mods sollten IDs verwenden, die nicht mit Vanilla konfligieren.

**Best Practices:**

```c
// In der 3_Game-Schicht definieren (zwischen Client und Server geteilt)
const int MY_MOD_RPC_BASE = 87000;  // Eine hohe Zahl wählen, die unwahrscheinlich kollidiert
const int RPC_MY_FEATURE_A = MY_MOD_RPC_BASE + 1;
const int RPC_MY_FEATURE_B = MY_MOD_RPC_BASE + 2;
const int RPC_MY_FEATURE_C = MY_MOD_RPC_BASE + 3;
```

### Einzelne Engine-ID-Muster (von MyFramework verwendet)

Für Mods mit vielen RPC-Typen verwenden Sie eine einzelne Engine-RPC-ID und routen intern über einen String-Identifikator:

```c
// Einzelne Engine-ID
const int MyRPC_ENGINE_ID = 83722;

// Mit String-Routing senden
ScriptRPC rpc = new ScriptRPC();
rpc.Write("MyFeature.DoAction");  // String-Route
rpc.Write(payload);
rpc.Send(target, MyRPC_ENGINE_ID, true, recipient);

// Empfangen und routen
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    if (rpc_type == MyRPC_ENGINE_ID)
    {
        string route;
        if (!ctx.Read(route))
            return;

        // Basierend auf String an Handler weiterleiten
        HandleRoute(route, sender, ctx);
    }
}
```

---

## Netzwerk-Sync-Variablen (Alternative zu RPC)

Für einfache Zustandssynchronisation ist `RegisterNetSyncVariable*()` oft einfacher als RPCs. Siehe [Kapitel 6.1](01-entity-system.md) für Details.

RPCs sind besser wenn:
- Sie einmalige Events senden müssen (keinen kontinuierlichen Zustand)
- Die Daten nicht zu einer bestimmten Entität gehören
- Sie komplexe oder variabel lange Daten senden müssen
- Sie Client-zu-Server-Kommunikation benötigen

Netz-Sync-Variablen sind besser wenn:
- Sie eine kleine Anzahl von Variablen auf einer Entität haben, die sich periodisch ändern
- Sie automatische Interpolation wünschen
- Die Daten natürlich zur Entität gehören

---

## Sicherheitsüberlegungen

### Serverseitige Validierung

**Vertrauen Sie niemals Client-Daten.** Validieren Sie RPC-Daten immer auf dem Server:

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);

    if (rpc_type == RPC_PLAYER_REQUEST && GetGame().IsServer())
    {
        int requestedAmount;
        if (!ctx.Read(requestedAmount))
            return;

        // VALIDIEREN: auf erlaubten Bereich begrenzen
        requestedAmount = Math.Clamp(requestedAmount, 0, 100);

        // VALIDIEREN: Absender-Identität stimmt mit Spielerobjekt überein
        PlayerBase senderPlayer = GetPlayerBySender(sender);
        if (!senderPlayer || !senderPlayer.IsAlive())
            return;

        // Jetzt die validierte Anfrage verarbeiten
        ProcessRequest(senderPlayer, requestedAmount);
    }
}
```

### Ratenbegrenzung

Die Engine hat eingebaute Ratenbegrenzung für RPCs. Zu viele RPCs pro Frame zu senden kann dazu führen, dass sie verworfen werden. Für hochfrequente Daten erwägen Sie:

- Netz-Sync-Variablen stattdessen verwenden
- Mehrere Werte in einen einzelnen RPC bündeln
- Sendefrequenz mit einem Timer drosseln

---

## Zusammenfassung

| Konzept | Kernpunkt |
|---------|-----------|
| ScriptRPC | Primäre RPC-Klasse: Daten `Write()`, dann `Send(target, id, guaranteed, recipient)` |
| OnRPC | Auf dem Zielobjekt überschreiben zum Empfangen: `OnRPC(sender, rpc_type, ctx)` |
| Lesen/Schreiben | `ctx.Write(value)` / `ctx.Read(value)` --- immer Read-Rückgabewert prüfen |
| Richtung | Client sendet an Server; Server sendet an bestimmten Client oder sendet an alle |
| Empfänger | `null` = Broadcast (Server), ignoriert (Client) |
| Garantiert | `true` = zuverlässige Zustellung, `false` = unzuverlässig (schneller) |
| Legacy | `GetGame().RPC()` / `RPCSingleParam()` mit Param-Objekten |
| Eingabedaten | `ScriptInputUserData` für validierte Client-Eingabe |
| IDs | Hohe Nummern verwenden (87000+) um Vanilla-Konflikte zu vermeiden |
| Sicherheit | Client-Daten immer auf dem Server validieren |

---

[<< Zurück: Datei-I/O & JSON](08-file-io.md) | **Netzwerk & RPC** | [Weiter: Central Economy >>](10-central-economy.md)
