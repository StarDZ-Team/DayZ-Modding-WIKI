# Kapitel 1.4: Modded-Klassen (Der Schlüssel zum DayZ-Modding)

[Startseite](../README.md) | [<< Zurück: Klassen & Vererbung](03-classes-inheritance.md) | **Modded-Klassen** | [Weiter: Kontrollfluss >>](05-control-flow.md)

---

## Einführung

**Modded-Klassen sind das wichtigste Konzept im DayZ-Modding.** Sie sind der Mechanismus, der es Ihrer Mod ermöglicht, das Verhalten bestehender Spielklassen zu ändern, ohne die Originaldateien zu ersetzen. Ohne Modded-Klassen würde DayZ-Modding, wie wir es kennen, nicht existieren.

Jede große DayZ-Mod --- Community Online Tools, VPP Admin Tools, DayZ Expansion, Trader-Mods, medizinische Überarbeitungen, Bausysteme --- funktioniert durch die Verwendung von `modded class`, um sich in Vanilla-Klassen einzuklinken und Verhalten hinzuzufügen oder zu ändern. Wenn Sie `PlayerBase` modden, erhält jeder Spieler im Spiel Ihr neues Verhalten. Wenn Sie `MissionServer` modden, läuft Ihr Code als Teil des Server-Mission-Lebenszyklus. Wenn Sie `ItemBase` modden, ist jedes Item im Spiel betroffen.

Dieses Kapitel ist absichtlich das längste und detaillierteste in Teil 1, weil das richtige Anwenden von Modded-Klassen das ist, was eine funktionierende Mod von einer unterscheidet, die Server zum Absturz bringt oder andere Mods beschädigt.

---

## Wie Modded-Klassen funktionieren

### Die Grundidee

Normalerweise erstellt `class Child extends Parent` eine neue Klasse namens `Child`, die von `Parent` erbt. Aber `modded class Parent` macht etwas grundlegend anderes: Es **ersetzt** die ursprüngliche `Parent`-Klasse in der Klassenhierarchie der Engine und fügt Ihren Code in die Vererbungskette ein.

```
Vor dem Modding:
  Parent -> (aller Code der Parent erstellt, erhält das Original)

Nach modded class:
  Originales Parent -> Ihr Modded Parent
  (aller Code der Parent erstellt, erhält nun IHRE Version)
```

Jeder `new Parent()`-Aufruf überall im Spiel --- Vanilla-Code, andere Mods, überall --- erstellt nun eine Instanz Ihrer modifizierten Version.

### Syntax

```c
modded class ClassName
{
    // Ihre Ergänzungen und Überschreibungen kommen hierhin
}
```

Das ist alles. Kein `extends`, kein neuer Name. Das `modded`-Schlüsselwort sagt der Engine: "Ich modifiziere die bestehende Klasse `ClassName`."

### Das kanonische Beispiel

```c
// === Originale Vanilla-Klasse (in DayZ's Scripts) ===
class ModMe
{
    void Say()
    {
        Print("Hallo vom Original");
    }
}

// === Ihre Mod-Skriptdatei ===
modded class ModMe
{
    override void Say()
    {
        Print("Hallo von der Mod");
        super.Say();  // Das Original aufrufen
    }
}

// === Was zur Laufzeit passiert ===
void Test()
{
    ModMe obj = new ModMe();
    obj.Say();
    // Ausgabe:
    //   "Hallo von der Mod"
    //   "Hallo vom Original"
}
```

---

## Verkettung: Mehrere Mods modden dieselbe Klasse

Die eigentliche Stärke von Modded-Klassen ist, dass **mehrere Mods dieselbe Klasse modifizieren können**, und sie verketten sich automatisch. Die Engine verarbeitet Mods in Ladereihenfolge, und jede `modded class` erbt von der vorherigen.

```c
// === Vanilla ===
class ModMe
{
    void Say()
    {
        Print("Original");
    }
}

// === Mod A (zuerst geladen) ===
modded class ModMe
{
    override void Say()
    {
        Print("Mod A");
        super.Say();  // Ruft das Original auf
    }
}

// === Mod B (als zweite geladen) ===
modded class ModMe
{
    override void Say()
    {
        Print("Mod B");
        super.Say();  // Ruft Mod A's Version auf
    }
}

// === Zur Laufzeit ===
void Test()
{
    ModMe obj = new ModMe();
    obj.Say();
    // Ausgabe (umgekehrte Ladereihenfolge):
    //   "Mod B"
    //   "Mod A"
    //   "Original"
}
```

Deshalb ist es **kritisch, immer `super` aufzurufen**. Wenn Mod A `super.Say()` nicht aufruft, wird das originale `Say()` nie ausgeführt. Wenn Mod B `super.Say()` nicht aufruft, wird Mod A's `Say()` nie ausgeführt. Eine Mod, die `super` überspringt, bricht die gesamte Kette.

### Visuelle Darstellung

```
new ModMe() erstellt eine Instanz mit dieser Vererbungskette:

  ModMe (Mod B's Version)      <-- Instanziiert
    |
    super -> ModMe (Mod A's Version)
               |
               super -> ModMe (Originales Vanilla)
```

---

## Was man in einer Modded-Klasse tun kann

### 1. Bestehende Methoden überschreiben

Die häufigste Verwendung. Verhalten vor oder nach dem Vanilla-Code hinzufügen.

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();  // Vanilla-Initialisierung zuerst ausführen lassen
        Print("[MyMod] Spieler initialisiert: " + GetType());
    }
}
```

### 2. Neue Felder (Mitgliedsvariablen) hinzufügen

Die Klasse mit neuen Daten erweitern. Jede Instanz der Modded-Klasse wird diese Felder haben.

```c
modded class PlayerBase
{
    protected int m_KillStreak;
    protected float m_LastKillTime;
    protected ref array<string> m_Achievements;

    override void Init()
    {
        super.Init();
        m_KillStreak = 0;
        m_LastKillTime = 0;
        m_Achievements = new array<string>;
    }
}
```

### 3. Neue Methoden hinzufügen

Völlig neue Funktionalität hinzufügen, die andere Teile Ihrer Mod aufrufen können.

```c
modded class PlayerBase
{
    protected int m_Reputation;

    override void Init()
    {
        super.Init();
        m_Reputation = 0;
    }

    void AddReputation(int amount)
    {
        m_Reputation += amount;
        if (m_Reputation > 1000)
            Print("[MyMod] " + GetIdentity().GetName() + " ist jetzt eine Legende!");
    }

    int GetReputation()
    {
        return m_Reputation;
    }

    bool IsHeroStatus()
    {
        return m_Reputation >= 500;
    }
}
```

### 4. Auf private Mitglieder der Originalklasse zugreifen

Anders als bei normaler Vererbung, wo `private`-Mitglieder unzugänglich sind, **KOENNEN Modded-Klassen auf private Mitglieder** der Originalklasse zugreifen. Dies ist eine spezielle Regel des `modded`-Schlüsselworts.

```c
// Vanilla-Klasse
class VanillaClass
{
    private int m_SecretValue;

    private void DoSecretThing()
    {
        Print("Geheim!");
    }
}

// Modded-Klasse KANN auf private Mitglieder zugreifen
modded class VanillaClass
{
    void ExposeSecret()
    {
        Print(m_SecretValue);  // OK! Modded-Klassen umgehen private
        DoSecretThing();       // OK! Kann auch private Methoden aufrufen
    }
}
```

Dies ist mächtig, sollte aber mit Vorsicht verwendet werden. Private Mitglieder sind aus gutem Grund privat --- sie können sich zwischen DayZ-Updates ändern.

### 5. Konstanten überschreiben

Modded-Klassen können Konstanten neu definieren:

```c
// Vanilla
class GameSettings
{
    const int MAX_PLAYERS = 60;
}

// Modded
modded class GameSettings
{
    const int MAX_PLAYERS = 100;  // Überschreibt den Originalwert
}
```

---

## Häufige Modded-Ziele

Dies sind die Klassen, in die sich praktisch jede DayZ-Mod einklinkt. Zu verstehen, was jede einzelne bietet, ist wesentlich.

### MissionServer

Läuft auf dem dedizierten Server. Behandelt Serverstart, Spielerverbindungen und die Spielschleife.

```c
modded class MissionServer
{
    protected ref MyServerManager m_MyManager;

    override void OnInit()
    {
        super.OnInit();

        // Ihre serverseitigen Systeme initialisieren
        m_MyManager = new MyServerManager;
        m_MyManager.Init();
        Print("[MyMod] Serversysteme initialisiert");
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        Print("[MyMod] Mission gestartet");
    }

    override void OnMissionFinish()
    {
        // VOR super aufräumen (super kann Systeme zerstören, von denen wir abhängen)
        if (m_MyManager)
            m_MyManager.Shutdown();

        super.OnMissionFinish();
    }

    // Wird aufgerufen, wenn ein Spieler sich verbindet
    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        super.InvokeOnConnect(player, identity);

        if (identity)
            Print("[MyMod] Spieler verbunden: " + identity.GetName());
    }

    // Wird aufgerufen, wenn ein Spieler die Verbindung trennt
    override void InvokeOnDisconnect(PlayerBase player)
    {
        if (player && player.GetIdentity())
            Print("[MyMod] Spieler getrennt: " + player.GetIdentity().GetName());

        super.InvokeOnDisconnect(player);
    }

    // Wird jeden Server-Tick aufgerufen
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_MyManager)
            m_MyManager.Update(timeslice);
    }
}
```

### MissionGameplay

Läuft auf dem Client. Behandelt clientseitige Benutzeroberfläche, Eingabe und Rendering-Hooks.

```c
modded class MissionGameplay
{
    protected ref MyHUDPanel m_MyHUD;

    override void OnInit()
    {
        super.OnInit();

        m_MyHUD = new MyHUDPanel;
        Print("[MyMod] Client-HUD initialisiert");
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_MyHUD)
            m_MyHUD.Update(timeslice);
    }

    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // Eigenes Menü mit F5 öffnen
        if (key == KeyCode.KC_F5)
        {
            if (m_MyHUD)
                m_MyHUD.Toggle();
        }
    }

    override void OnMissionFinish()
    {
        if (m_MyHUD)
            m_MyHUD.Destroy();

        super.OnMissionFinish();
    }
}
```

### PlayerBase

Die Spielerklasse. Jeder lebende Spieler im Spiel ist eine Instanz von `PlayerBase` (oder einer Unterklasse wie `SurvivorBase`). Das Modden dieser Klasse ist die Art, wie Sie pro-Spieler-Features hinzufügen.

```c
modded class PlayerBase
{
    protected bool m_IsGodMode;
    protected float m_CustomTimer;

    override void Init()
    {
        super.Init();
        m_IsGodMode = false;
        m_CustomTimer = 0;
    }

    // Wird jeden Frame auf dem Server für diesen Spieler aufgerufen
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Serverseitiger pro-Spieler-Tick
        if (GetGame().IsServer())
        {
            m_CustomTimer += pDt;
            if (m_CustomTimer >= 60.0)  // Alle 60 Sekunden
            {
                m_CustomTimer = 0;
                OnMinuteElapsed();
            }
        }
    }

    void SetGodMode(bool enabled)
    {
        m_IsGodMode = enabled;
    }

    // Schaden überschreiben, um Gottmodus zu implementieren
    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source,
                          int component, string dmgZone, string ammo,
                          vector modelPos, float speedCoef)
    {
        if (m_IsGodMode)
            return;  // Schaden komplett überspringen

        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);
    }

    protected void OnMinuteElapsed()
    {
        // Eigene periodische Logik
    }
}
```

### ItemBase

Die Basisklasse für alle Items. Das Modden betrifft jedes Item im Spiel.

```c
modded class ItemBase
{
    override void SetActions()
    {
        super.SetActions();

        // Eine eigene Aktion zu ALLEN Items hinzufügen
        AddAction(MyInspectAction);
    }

    override void EEItemLocationChanged(notnull InventoryLocation oldLoc, notnull InventoryLocation newLoc)
    {
        super.EEItemLocationChanged(oldLoc, newLoc);

        // Verfolgen, wenn Items bewegt werden
        Print(string.Format("[MyMod] %1 von %2 nach %3 bewegt",
            GetType(), oldLoc.GetType(), newLoc.GetType()));
    }
}
```

### DayZGame

Die globale Spielklasse. Während des gesamten Spiellebenszyklus verfügbar.

```c
modded class DayZGame
{
    void DayZGame()
    {
        // Konstruktor: sehr frühe Initialisierung
        Print("[MyMod] DayZGame-Konstruktor - extrem frühe Initialisierung");
    }

    override void OnUpdate(bool doSim, float timeslice)
    {
        super.OnUpdate(doSim, timeslice);

        // Globaler Update-Tick (sowohl Client als auch Server)
    }
}
```

### CarScript

Die Basis-Fahrzeugklasse. Modden Sie diese, um das Verhalten aller Fahrzeuge zu ändern.

```c
modded class CarScript
{
    protected float m_BoostMultiplier;

    override void OnEngineStart()
    {
        super.OnEngineStart();
        m_BoostMultiplier = 1.0;
        Print("[MyMod] Fahrzeugmotor gestartet: " + GetType());
    }

    override void OnEngineStop()
    {
        super.OnEngineStop();
        Print("[MyMod] Fahrzeugmotor gestoppt: " + GetType());
    }
}
```

---

## `#ifdef`-Guards für optionale Abhängigkeiten

Wenn Ihre Mod optional eine andere Mod unterstützt, verwenden Sie Präprozessor-Guards. Wenn die andere Mod ein Symbol in ihrer `config.cpp` (via `CfgPatches`) definiert, können Sie es zur Kompilierzeit prüfen.

### Wie es funktioniert

Jeder `CfgPatches`-Klassenname einer Mod wird zu einem Präprozessor-Symbol. Wenn eine Mod zum Beispiel folgendes hat:

```cpp
class CfgPatches
{
    class MyAI_Scripts
    {
        // ...
    };
};
```

Dann wird `#ifdef MyAI_Scripts` `true` sein, wenn diese Mod geladen ist.

Viele Mods definieren auch explizite Symbole. Die Konvention variiert --- prüfen Sie die Dokumentation oder `config.cpp` der Mod.

### Grundmuster

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();

        // Dieser Code wird NUR kompiliert, wenn MyAI vorhanden ist
        #ifdef MyAI
            MyAIManager mgr = MyAIManager.GetInstance();
            if (mgr)
                mgr.RegisterPlayer(this);
        #endif
    }
}
```

### Server vs. Client-Guards

```c
modded class MissionBase
{
    override void OnInit()
    {
        super.OnInit();

        // Nur-Server-Code
        #ifdef SERVER
            InitServerSystems();
        #endif

        // Nur-Client-Code (läuft auch auf Listen-Server-Host)
        #ifndef SERVER
            InitClientHUD();
        #endif
    }

    #ifdef SERVER
    protected void InitServerSystems()
    {
        Print("[MyMod] Serversysteme gestartet");
    }
    #endif

    #ifndef SERVER
    protected void InitClientHUD()
    {
        Print("[MyMod] Client-HUD gestartet");
    }
    #endif
}
```

### Multi-Mod-Kompatibilität

Hier ist ein praxisnahes Muster für eine Mod, die Spieler erweitert, mit optionaler Unterstützung für zwei andere Mods:

```c
modded class PlayerBase
{
    protected int m_BountyPoints;

    override void Init()
    {
        super.Init();
        m_BountyPoints = 0;
    }

    void AddBounty(int amount)
    {
        m_BountyPoints += amount;

        // Wenn Expansion Notifications geladen ist, eine schöne Benachrichtigung anzeigen
        #ifdef EXPANSIONMODNOTIFICATION
            ExpansionNotification("Kopfgeld!", string.Format("+%1 Punkte", amount)).Create(GetIdentity());
        #else
            // Fallback: einfache Benachrichtigung
            NotificationSystem.SendNotificationToPlayerExtended(this, 5, "Kopfgeld",
                string.Format("+%1 Punkte", amount), "");
        #endif

        // Wenn eine Trader-Mod geladen ist, das Guthaben des Spielers aktualisieren
        #ifdef TraderPlus
            // TraderPlus-spezifischer API-Aufruf
        #endif
    }
}
```

---

## Professionelle Muster aus echten Mods

### Muster 1: Nicht-destruktives Methoden-Wrapping (COT-Stil)

Community Online Tools umschliesst Methoden, indem vor und nach `super` gearbeitet wird, ohne das Verhalten jemals vollständig zu ersetzen:

```c
modded class MissionServer
{
    // Neues Feld von COT hinzugefügt
    protected ref JMPlayerModule m_JMPlayerModule;

    override void OnInit()
    {
        super.OnInit();  // Gesamte Vanilla-Initialisierung geschieht

        // COT fügt seine eigene Initialisierung NACH Vanilla hinzu
        m_JMPlayerModule = new JMPlayerModule;
        m_JMPlayerModule.Init();
    }

    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        // COT führt Vorverarbeitung durch
        if (identity)
            m_JMPlayerModule.OnClientConnect(identity);

        // Dann Vanilla (und andere Mods) es behandeln lassen
        super.InvokeOnConnect(player, identity);

        // COT führt Nachverarbeitung durch
        if (identity)
            m_JMPlayerModule.OnClientReady(identity);
    }
}
```

### Muster 2: Bedingtes Override (VPP-Stil)

VPP Admin Tools prueft Bedingungen, bevor entschieden wird, ob das Verhalten geändert werden soll:

```c
#ifndef VPPNOTIFICATIONS
modded class MissionGameplay
{
    private ref VPPNotificationUI m_NotificationUI;

    override void OnInit()
    {
        super.OnInit();
        m_NotificationUI = new VPPNotificationUI;
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_NotificationUI)
            m_NotificationUI.OnUpdate(timeslice);
    }
}
#endif
```

Beachten Sie den `#ifndef VPPNOTIFICATIONS`-Guard --- dieser verhindert, dass der Code kompiliert wird, wenn die eigenständige Benachrichtigungs-Mod bereits geladen ist, um Konflikte zu vermeiden.

### Muster 3: Event-Injektion (Expansion-Stil)

DayZ Expansion injiziert Events in Vanilla-Klassen, um Informationen an seine eigenen Systeme zu senden:

```c
modded class PlayerBase
{
    override void EEKilled(Object killer)
    {
        // Expansion's Event-System vor der Vanilla-Todesbehandlung auslösen
        ExpansionEventBus.Fire("OnPlayerKilled", this, killer);

        super.EEKilled(killer);

        // Nach-Tod-Verarbeitung
        ExpansionEventBus.Fire("OnPlayerKilledPost", this, killer);
    }

    override void OnConnect()
    {
        super.OnConnect();
        ExpansionEventBus.Fire("OnPlayerConnect", this);
    }
}
```

### Muster 4: Feature-Registrierung (Community-Framework-Stil)

CF-Mods registrieren Features in Konstruktoren und halten die Initialisierung zentralisiert:

```c
modded class DayZGame
{
    void DayZGame()
    {
        // CF registriert seine Systeme im DayZGame-Konstruktor
        // Dies läuft extrem früh, bevor eine Mission geladen wird
        CF_ModuleManager.RegisterModule(MyCFModule);
    }
}

modded class MissionServer
{
    void MissionServer()
    {
        // Konstruktor: wird ausgeführt, wenn MissionServer erstmals erstellt wird
        // RPCs hier registrieren
        GetRPCManager().AddRPC("MyMod", "RPC_HandleRequest", this, SingleplayerExecutionType.Both);
    }
}
```

---

## Regeln und Best Practices

### Regel 1: IMMER `super` aufrufen

Wenn Sie keinen bewussten, gut verstandenen Grund haben, das Elternverhalten vollständig zu ersetzen, rufen Sie immer `super` auf. Andernfalls bricht die Mod-Kette und Server können absturzen.

```c
// Die GOLDENE REGEL der Modded-Klassen
modded class AnyClass
{
    override void AnyMethod()
    {
        super.AnyMethod();  // IMMER, es sei denn, Sie ersetzen absichtlich
        // Ihr Code hier
    }
}
```

Wenn Sie absichtlich `super` überspringen, dokumentieren Sie warum:

```c
modded class PlayerBase
{
    // Absichtlich NICHT super aufrufen, um Fallschaden komplett zu deaktivieren
    // WARNUNG: Dies verhindert auch, dass andere Mods ihren Fallschadencode ausführen
    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source,
                          int component, string dmgZone, string ammo,
                          vector modelPos, float speedCoef)
    {
        // Prüfen ob dies Fallschaden ist
        if (ammo == "FallDamage")
            return;  // Stillschweigend ignorieren

        // Für allen anderen Schaden die normale Kette aufrufen
        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);
    }
}
```

### Regel 2: Neue Felder im richtigen Override initialisieren

Wenn Sie Felder zu einer Modded-Klasse hinzufügen, initialisieren Sie sie in der passenden Lebenszyklusmethode, nicht irgendwo:

| Klasse | Initialisieren in | Warum |
|-------|--------------|-----|
| `PlayerBase` | `override void Init()` | Wird einmal aufgerufen, wenn die Spieler-Entität erstellt wird |
| `ItemBase` | Konstruktor oder `override void InitItemVariables()` | Item-Erstellung |
| `MissionServer` | `override void OnInit()` | Server-Mission-Start |
| `MissionGameplay` | `override void OnInit()` | Client-Mission-Start |
| `DayZGame` | Konstruktor `void DayZGame()` | Frühestmöglicher Zeitpunkt |
| `CarScript` | Konstruktor oder `override void EOnInit(IEntity other, int extra)` | Fahrzeugerstellung |

### Regel 3: Gegen Null absichern

In Modded-Klassen arbeiten Sie oft mit Objekten, die möglicherweise noch nicht initialisiert sind (weil Sie vor oder nach anderem Code laufen):

```c
modded class PlayerBase
{
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Immer prüfen: läuft dies auf dem Server?
        if (!GetGame().IsServer())
            return;

        // Immer prüfen: lebt der Spieler?
        if (!IsAlive())
            return;

        // Immer prüfen: hat der Spieler eine Identität?
        PlayerIdentity identity = GetIdentity();
        if (!identity)
            return;

        // Jetzt ist es sicher, identity zu verwenden
        string uid = identity.GetPlainId();
    }
}
```

### Regel 4: Andere Mods nicht beschädigen

Ihre Modded-Klasse ist Teil einer Kette. Respektieren Sie den Vertrag:

- Events nicht stillschweigend verschlucken (immer `super` aufrufen, es sei denn absichtlich überschrieben)
- Felder nicht überschreiben, die andere Mods möglicherweise gesetzt haben (fügen Sie stattdessen eigene Felder hinzu)
- `#ifdef`-Guards für optionale Abhängigkeiten verwenden
- Mit anderen populären Mods zusammen testen

### Regel 5: Beschreibende Feldpräfixe verwenden

Wenn Sie Felder zu einer Modded-Klasse hinzufügen, versehen Sie sie mit Ihrem Mod-Namen als Präfix, um Kollisionen mit anderen Mods zu vermeiden, die Felder zur selben Klasse hinzufügen:

```c
modded class PlayerBase
{
    // SCHLECHT: generischer Name, könnte mit einer anderen Mod kollidieren
    protected int m_Points;

    // GUT: mod-spezifisches Präfix
    protected int m_MyMod_Points;
    protected float m_MyMod_LastSync;
    protected ref array<string> m_MyMod_Unlocks;
}
```

---

## Häufige Fehler

### 1. `super` nicht aufrufen (Der #1-Mod-brechende Bug)

Dies kann nicht genug betont werden. Jedes Mal, wenn Sie einen Fehlerbericht sehen, der sagt "Mod X ist kaputt gegangen, als ich Mod Y hinzugefügt habe", ist das Erste, was geprueft werden muss, ob jemand vergessen hat, `super` aufzurufen.

```c
// DIES BRICHT ALLES NACHFOLGENDE
modded class MissionServer
{
    override void OnInit()
    {
        // KEIN super.OnInit()-Aufruf!
        // Jede Mod, die vor dieser geladen wurde, hat ihr OnInit übersprungen
        Print("Meine Mod gestartet!");
    }
}
```

### 2. Eine Methode überschreiben, die nicht existiert

Wenn Sie versuchen, eine Methode zu `override`n, die in der Elternklasse nicht existiert, erhalten Sie einen Kompilierfehler. Dies passiert normalerweise, wenn:
- Sie den Methodennamen falsch geschrieben haben
- Sie eine Methode der falschen Klasse überschreiben
- Ein DayZ-Update die Methode umbenannt oder entfernt hat

```c
modded class PlayerBase
{
    // FEHLER: keine solche Methode in PlayerBase
    // override void OnPlayerSpawned()

    // KORREKTER Methodenname:
    override void OnConnect()
    {
        super.OnConnect();
    }
}
```

### 3. Die falsche Klasse modden

Ein häufiger Anfängerfehler ist das Modden einer Klasse, die dem Namen nach richtig erscheint, aber in der falschen Skriptschicht liegt:

```c
// FALSCH: MissionBase ist die abstrakte Basis -- Ihre Hooks hier könnten nicht
// feuern, wenn Sie es erwarten
modded class MissionBase
{
    override void OnInit()
    {
        super.OnInit();
        // Dies läuft für ALLE Missionstypen -- aber ist es das, was Sie wollen?
    }
}

// RICHTIG: Die spezifische Klasse für Ihr Ziel wählen
// Für Server-Logik:
modded class MissionServer
{
    override void OnInit() { super.OnInit(); /* Server-Code */ }
}

// Für Client-UI:
modded class MissionGameplay
{
    override void OnInit() { super.OnInit(); /* Client-Code */ }
}
```

### 4. Schwere Verarbeitung in Pro-Frame-Overrides

Methoden wie `OnUpdate()` und `CommandHandler()` laufen jeden Tick oder jeden Frame. Teure Logik hier hinzuzufügen zerstört die Server-/Client-Leistung:

```c
modded class PlayerBase
{
    // SCHLECHT: läuft jeden Frame für jeden Spieler
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Dies erstellt und zerstört ein Array JEDEN FRAME für JEDEN SPIELER
        array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);
        foreach (Man m : players)
        {
            // O(n^2) pro Frame!
        }
    }
}

// GUT: einen Timer verwenden, um teure Operationen zu drosseln
modded class PlayerBase
{
    protected float m_MyMod_Timer;

    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        if (!GetGame().IsServer())
            return;

        m_MyMod_Timer += pDt;
        if (m_MyMod_Timer < 5.0)  // Alle 5 Sekunden, nicht jeden Frame
            return;

        m_MyMod_Timer = 0;
        DoExpensiveWork();
    }

    protected void DoExpensiveWork()
    {
        // Periodische Logik hier
    }
}
```

### 5. `#ifdef`-Guards für optionale Abhängigkeiten vergessen

Wenn Ihre Mod eine Klasse von einer anderen Mod ohne `#ifdef`-Guards referenziert, wird sie nicht kompilieren, wenn diese Mod nicht geladen ist:

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();

        // SCHLECHT: Kompilierfehler wenn ExpansionMod nicht geladen ist
        // ExpansionHumanity.AddKarma(this, 10);

        // GUT: mit #ifdef abgesichert
        #ifdef EXPANSIONMODCORE
            ExpansionHumanity.AddKarma(this, 10);
        #endif
    }
}
```

### 6. Destruktoren: Vor `super` aufräumen

Wenn Sie Destruktoren oder Aufräummethoden überschreiben, führen Sie Ihre Bereinigung **vor** dem Aufruf von `super` durch, da `super` Ressourcen zerstören kann, von denen Sie abhängen:

```c
modded class MissionServer
{
    protected ref MyManager m_MyManager;

    override void OnMissionFinish()
    {
        // Zuerst IHRE Sachen aufräumen
        if (m_MyManager)
        {
            m_MyManager.Save();
            m_MyManager.Shutdown();
        }
        m_MyManager = null;

        // DANN Vanilla und andere Mods aufräumen lassen
        super.OnMissionFinish();
    }
}
```

---

## Dateibenennung und Organisation

Modded-Klassen-Dateien sollten einer klaren Namenskonvention folgen, damit Sie auf einen Blick erkennen können, welche Klasse von welcher Mod gemoddet wird:

```
MyMod/
  Scripts/
    3_Game/
      MyMod/
    4_World/
      MyMod/
        Entities/
          ManBase/
            MyMod_PlayerBase.c         <-- modded class PlayerBase
          ItemBase/
            MyMod_ItemBase.c           <-- modded class ItemBase
          Vehicles/
            MyMod_CarScript.c          <-- modded class CarScript
    5_Mission/
      MyMod/
        Mission/
          MyMod_MissionServer.c        <-- modded class MissionServer
          MyMod_MissionGameplay.c      <-- modded class MissionGameplay
```

Dies spiegelt die Vanilla-DayZ-Dateistruktur wider und macht es einfach zu finden, welche Datei welche Klasse moddet.

---

## Uebungsaufgaben

### Uebung 1: Spieler-Beitritts-Logger
Erstellen Sie eine `modded class MissionServer`, die eine Nachricht ins Server-Log ausgibt, wann immer ein Spieler sich verbindet oder trennt, einschliesslich Name und UID. Stellen Sie sicher, dass Sie `super` aufrufen.

### Uebung 2: Item-Inspektion
Erstellen Sie eine `modded class ItemBase`, die eine Methode `string GetInspectInfo()` hinzufügt, die einen formatierten String mit dem Klassennamen, der Gesundheit und ob das Item ruiniert ist zurückgibt. Überschreiben Sie eine geeignete Methode, um diese Info auszugeben, wenn das Item in die Hände eines Spielers gelegt wird.

### Uebung 3: Admin-Gottmodus
Erstellen Sie eine `modded class PlayerBase`, die:
1. Ein `m_IsGodMode`-Feld hinzufügt
2. `EnableGodMode()`- und `DisableGodMode()`-Methoden hinzufügt
3. Die Schadensmethode `EEHitBy` überschreibt, um Schaden bei aktivem Gottmodus zu überspringen
4. Immer `super` für normalen (Nicht-Gottmodus) Schaden aufruft

### Uebung 4: Fahrzeug-Geschwindigkeits-Logger
Erstellen Sie eine `modded class CarScript`, die die maximale Geschwindigkeit während jeder Motorsitzung verfolgt. Überschreiben Sie `OnEngineStart()` und `OnEngineStop()`, um die Verfolgung zu beginnen/beenden. Geben Sie die Maximalgeschwindigkeit aus, wenn der Motor stoppt.

### Uebung 5: Optionale Mod-Integration
Erstellen Sie eine `modded class PlayerBase`, die ein Reputationssystem hinzufügt. Wenn ein Spieler einen Zombie tötet, erhält er 1 Punkt. Verwenden Sie `#ifdef`-Guards um:
- Wenn Expansion's Benachrichtigungssystem verfügbar ist, eine Benachrichtigung anzuzeigen
- Wenn eine Trader-Mod verfügbar ist, Währung hinzuzufügen
- Wenn keines verfügbar ist, auf eine einfache Print()-Nachricht zurückzufallen

---

## Zusammenfassung

| Konzept | Details |
|---------|---------|
| Syntax | `modded class ClassName { }` |
| Wirkung | Ersetzt die Originalklasse global für alle `new`-Aufrufe |
| Verkettung | Mehrere Mods können dieselbe Klasse modden; sie verketten sich in Ladereihenfolge |
| `super` | **Immer aufrufen**, es sei denn, das Verhalten wird absichtlich ersetzt |
| Neue Felder | Mit mod-spezifischen Präfixen hinzufügen (`m_MyMod_FeldName`) |
| Neue Methoden | Vollständig unterstützt; von überall aufrufbar, wo eine Referenz besteht |
| Privater Zugriff | Modded-Klassen **können** auf private Mitglieder des Originals zugreifen |
| `#ifdef`-Guards | Für optionale Abhängigkeiten zu anderen Mods verwenden |
| Häufige Ziele | `MissionServer`, `MissionGameplay`, `PlayerBase`, `ItemBase`, `DayZGame`, `CarScript` |

### Die drei Gebote der Modded-Klassen

1. **Immer `super` aufrufen** --- es sei denn, Sie haben einen dokumentierten Grund, es nicht zu tun
2. **Optionale Abhängigkeiten mit `#ifdef` absichern** --- Ihre Mod sollte eigenständig funktionieren
3. **Felder und Methoden mit Präfixen versehen** --- Namenskollisionen mit anderen Mods vermeiden

---

[Startseite](../README.md) | [<< Zurück: Klassen & Vererbung](03-classes-inheritance.md) | **Modded-Klassen** | [Weiter: Kontrollfluss >>](05-control-flow.md)
