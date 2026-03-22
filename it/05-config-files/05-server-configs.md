# Capitolo 5.5: File di Configurazione del Server

[Home](../README.md) | [<< Precedente: Formato ImageSet](04-imagesets.md) | **File di Configurazione del Server** | [Successivo: Configurazione dello Spawn Gear >>](06-spawning-gear.md)

---

> **Sommario:** I server DayZ sono configurati tramite file XML, JSON e script nella cartella della missione (es. `mpmissions/dayzOffline.chernarusplus/`). Questi file controllano gli spawn degli oggetti, il comportamento dell'economia, le regole di gioco e l'identità del server. Comprenderli è essenziale per aggiungere oggetti personalizzati all'economia del loot, regolare i parametri del server o costruire una missione personalizzata.

---

## Indice

- [Panoramica](#panoramica)
- [init.c --- Punto di Ingresso della Missione](#initc----punto-di-ingresso-della-missione)
- [types.xml --- Definizioni di Spawn degli Oggetti](#typesxml----definizioni-di-spawn-degli-oggetti)
- [cfgspawnabletypes.xml --- Accessori e Carico](#cfgspawnabletypesxml----accessori-e-carico)
- [cfgrandompresets.xml --- Pool di Loot Riutilizzabili](#cfgrandompresetsxml----pool-di-loot-riutilizzabili)
- [globals.xml --- Parametri dell'Economia](#globalsxml----parametri-delleconomia)
- [cfggameplay.json --- Impostazioni di Gioco](#cfggameplayjson----impostazioni-di-gioco)
- [serverDZ.cfg --- Impostazioni del Server](#serverdzcfg----impostazioni-del-server)
- [Come i Mod Interagiscono con l'Economia](#come-i-mod-interagiscono-con-leconomia)
- [Errori Comuni](#errori-comuni)

---

## Panoramica

Ogni server DayZ carica la sua configurazione da una **cartella missione**. I file della Central Economy (CE) definiscono quali oggetti appaiono, dove e per quanto tempo. L'eseguibile del server stesso è configurato tramite `serverDZ.cfg`, che si trova accanto all'eseguibile.

| File | Scopo |
|------|-------|
| `init.c` | Punto di ingresso della missione --- inizializzazione Hive, data/ora, equipaggiamento iniziale |
| `db/types.xml` | Definizioni di spawn degli oggetti: quantità, durata, posizioni |
| `cfgspawnabletypes.xml` | Oggetti pre-attaccati e carico sulle entità generate |
| `cfgrandompresets.xml` | Pool di oggetti riutilizzabili per cfgspawnabletypes |
| `db/globals.xml` | Parametri globali dell'economia: conteggi massimi, timer di pulizia |
| `cfggameplay.json` | Regolazione del gameplay: stamina, costruzione basi, UI |
| `cfgeconomycore.xml` | Registrazione delle classi radice e logging della CE |
| `cfglimitsdefinition.xml` | Definizioni valide di tag categoria, uso e valore |
| `serverDZ.cfg` | Nome del server, password, giocatori massimi, caricamento mod |

---

## init.c --- Punto di Ingresso della Missione

Lo script `init.c` è la prima cosa che il server esegue. Inizializza la Central Economy e crea l'istanza della missione.

```c
void main()
{
    Hive ce = CreateHive();
    if (ce)
        ce.InitOffline();

    GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);
    CreateCustomMission("dayzOffline.chernarusplus");
}

class CustomMission: MissionServer
{
    override PlayerBase CreateCharacter(PlayerIdentity identity, vector pos,
                                        ParamsReadContext ctx, string characterName)
    {
        Entity playerEnt;
        playerEnt = GetGame().CreatePlayer(identity, characterName, pos, 0, "NONE");
        Class.CastTo(m_player, playerEnt);
        GetGame().SelectPlayer(identity, m_player);
        return m_player;
    }

    override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
    {
        EntityAI itemClothing = player.FindAttachmentBySlotName("Body");
        if (itemClothing)
        {
            itemClothing.GetInventory().CreateInInventory("BandageDressing");
        }
    }
}

Mission CreateCustomMission(string path)
{
    return new CustomMission();
}
```

L'`Hive` gestisce il database della CE. Senza `CreateHive()`, nessun oggetto appare e la persistenza è disabilitata. `CreateCharacter` crea l'entità del giocatore allo spawn, e `StartingEquipSetup` definisce gli oggetti che un personaggio appena creato riceve. Altre sovrascritture utili di `MissionServer` includono `OnInit()`, `OnUpdate()`, `InvokeOnConnect()` e `InvokeOnDisconnect()`.

---

## types.xml --- Definizioni di Spawn degli Oggetti

Situato in `db/types.xml`, questo file è il cuore della CE. Ogni oggetto che può apparire deve avere una voce qui.

### Voce Completa

```xml
<type name="AK74">
    <nominal>6</nominal>
    <lifetime>28800</lifetime>
    <restock>0</restock>
    <min>4</min>
    <quantmin>30</quantmin>
    <quantmax>80</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1"
           count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

### Riferimento dei Campi

| Campo | Descrizione |
|-------|-------------|
| `nominal` | Conteggio obiettivo sulla mappa. La CE genera oggetti fino a raggiungere questo valore |
| `min` | Conteggio minimo prima che la CE avvii il rifornimento |
| `lifetime` | Secondi di permanenza di un oggetto a terra prima della rimozione |
| `restock` | Secondi minimi tra tentativi di rifornimento (0 = immediato) |
| `quantmin/quantmax` | Percentuale di riempimento per oggetti con quantità (caricatori, bottiglie). Usa `-1` per oggetti senza quantità |
| `cost` | Peso di priorità della CE (più alto = prioritario). La maggior parte degli oggetti usa `100` |

### Flag

| Flag | Scopo |
|------|-------|
| `count_in_cargo` | Conta gli oggetti dentro i contenitori verso il nominale |
| `count_in_hoarder` | Conta gli oggetti in nascondigli/tende/barili verso il nominale |
| `count_in_map` | Conta gli oggetti a terra verso il nominale |
| `count_in_player` | Conta gli oggetti nell'inventario del giocatore verso il nominale |
| `crafted` | L'oggetto è solo fabbricabile, non appare naturalmente |
| `deloot` | Loot da Evento Dinamico (crash di elicotteri, ecc.) |

### Tag di Categoria, Uso e Valore

Questi tag controllano **dove** appaiono gli oggetti:

- **`category`** --- Tipo di oggetto. Vanilla: `tools`, `containers`, `clothes`, `food`, `weapons`, `books`, `explosives`, `lootdispatch`.
- **`usage`** --- Tipi di edifici. Vanilla: `Military`, `Police`, `Medic`, `Firefighter`, `Industrial`, `Farm`, `Coast`, `Town`, `Village`, `Hunting`, `Office`, `School`, `Prison`, `ContaminatedArea`, `Historical`.
- **`value`** --- Zone tier della mappa. Vanilla: `Tier1` (costa), `Tier2` (entroterra), `Tier3` (militare), `Tier4` (militare profondo), `Unique`.

Si possono combinare più tag. Nessun tag `usage` = l'oggetto non apparirà. Nessun tag `value` = appare in tutti i tier.

### Disabilitare un Oggetto

Imposta `nominal=0` e `min=0`. L'oggetto non appare mai ma può comunque esistere tramite script o fabbricazione.

---

## cfgspawnabletypes.xml --- Accessori e Carico

Controlla cosa appare **già attaccato o dentro** altri oggetti.

### Marcatura degli Accumulatori

I contenitori di stoccaggio vengono marcati affinché la CE sappia che contengono oggetti dei giocatori:

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### Danno allo Spawn

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

I valori vanno da `0.0` (integro) a `1.0` (distrutto).

### Accessori

```xml
<type name="PlateCarrierVest_Camo">
    <damage min="0.1" max="0.6" />
    <attachments chance="0.85">
        <item name="PlateCarrierHolster_Camo" chance="1.00" />
    </attachments>
    <attachments chance="0.85">
        <item name="PlateCarrierPouches_Camo" chance="1.00" />
    </attachments>
</type>
```

La `chance` esterna determina se il gruppo di accessori viene valutato. La `chance` interna seleziona l'oggetto specifico quando più oggetti sono elencati in un gruppo.

### Preset del Carico

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

Ogni riga tira il preset indipendentemente --- tre righe significano tre possibilità separate.

---

## cfgrandompresets.xml --- Pool di Loot Riutilizzabili

Definisce pool di oggetti con nome referenziati da `cfgspawnabletypes.xml`:

```xml
<randompresets>
    <cargo chance="0.16" name="foodVillage">
        <item name="SodaCan_Cola" chance="0.02" />
        <item name="TunaCan" chance="0.05" />
        <item name="PeachesCan" chance="0.05" />
        <item name="BakedBeansCan" chance="0.05" />
        <item name="Crackers" chance="0.05" />
    </cargo>

    <cargo chance="0.15" name="toolsHermit">
        <item name="WeaponCleaningKit" chance="0.10" />
        <item name="Matchbox" chance="0.15" />
        <item name="Hatchet" chance="0.07" />
    </cargo>
</randompresets>
```

La `chance` del preset è la probabilità complessiva che qualcosa appaia. Se il tiro ha successo, un oggetto viene selezionato dalla pool in base alle probabilità individuali degli oggetti. Per aggiungere oggetti moddati, crea un nuovo blocco `cargo` e referenzialo in `cfgspawnabletypes.xml`.

---

## globals.xml --- Parametri dell'Economia

Situato in `db/globals.xml`, questo file imposta i parametri globali della CE:

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadAnimal" type="0" value="1200"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="CleanupLifetimeRuined" type="0" value="330"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="FlagRefreshMaxDuration" type="0" value="3456000"/>
    <var name="FoodDecay" type="0" value="1"/>
    <var name="InitialSpawn" type="0" value="100"/>
    <var name="LootDamageMin" type="1" value="0.0"/>
    <var name="LootDamageMax" type="1" value="0.82"/>
    <var name="SpawnInitial" type="0" value="1200"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="TimePenalty" type="0" value="20"/>
    <var name="TimeHopping" type="0" value="60"/>
    <var name="ZoneSpawnDist" type="0" value="300"/>
</variables>
```

### Variabili Chiave

| Variabile | Predefinito | Descrizione |
|-----------|-------------|-------------|
| `AnimalMaxCount` | 200 | Animali massimi sulla mappa |
| `ZombieMaxCount` | 1000 | Infetti massimi sulla mappa |
| `CleanupLifetimeDeadPlayer` | 3600 | Tempo di rimozione dei cadaveri (secondi) |
| `CleanupLifetimeRuined` | 330 | Tempo di rimozione degli oggetti distrutti |
| `FlagRefreshFrequency` | 432000 | Intervallo di aggiornamento della bandiera territoriale (5 giorni) |
| `FlagRefreshMaxDuration` | 3456000 | Durata massima della bandiera (40 giorni) |
| `FoodDecay` | 1 | Attiva/disattiva il deterioramento del cibo (0=off, 1=on) |
| `InitialSpawn` | 100 | Percentuale del nominale generata all'avvio |
| `LootDamageMax` | 0.82 | Danno massimo sul loot generato |
| `TimeLogin` / `TimeLogout` | 15 | Timer di login/logout (anti-combat-log) |
| `TimePenalty` | 20 | Timer di penalità per combat log |
| `ZoneSpawnDist` | 300 | Distanza del giocatore che attiva lo spawn di zombie/animali |

L'attributo `type` è `0` per intero, `1` per decimale. Usare il tipo sbagliato tronca il valore.

---

## cfggameplay.json --- Impostazioni di Gioco

Caricato solo quando `enableCfgGameplayFile = 1` è impostato in `serverDZ.cfg`. Senza questo, il motore usa i valori predefiniti hardcoded.

### Struttura

```json
{
    "version": 123,
    "GeneralData": {
        "disableBaseDamage": false,
        "disableContainerDamage": false,
        "disableRespawnDialog": false
    },
    "PlayerData": {
        "disablePersonalLight": false,
        "StaminaData": {
            "sprintStaminaModifierErc": 1.0,
            "staminaMax": 100.0,
            "staminaWeightLimitThreshold": 6000.0,
            "staminaMinCap": 5.0
        },
        "MovementData": {
            "timeToSprint": 0.45,
            "rotationSpeedSprint": 0.15,
            "allowStaminaAffectInertia": true
        }
    },
    "WorldsData": {
        "lightingConfig": 0,
        "environmentMinTemps": [-3, -2, 0, 4, 9, 14, 18, 17, 13, 11, 9, 0],
        "environmentMaxTemps": [3, 5, 7, 14, 19, 24, 26, 25, 18, 14, 10, 5]
    },
    "BaseBuildingData": {
        "HologramData": {
            "disableIsCollidingBBoxCheck": false,
            "disableIsCollidingAngleCheck": false,
            "disableHeightPlacementCheck": false,
            "disallowedTypesInUnderground": ["FenceKit", "TerritoryFlagKit"]
        }
    },
    "MapData": {
        "ignoreMapOwnership": false,
        "displayPlayerPosition": false,
        "displayNavInfo": true
    }
}
```

Impostazioni chiave: `disableBaseDamage` impedisce i danni alle basi, `disablePersonalLight` rimuove la luce dello spawn iniziale, `staminaWeightLimitThreshold` è in grammi (6000 = 6kg), gli array delle temperature hanno 12 valori (Gennaio--Dicembre), `lightingConfig` accetta `0` (predefinito) o `1` (notti più scure), e `displayPlayerPosition` mostra il punto del giocatore sulla mappa.

---

## serverDZ.cfg --- Impostazioni del Server

Questo file si trova accanto all'eseguibile del server, non nella cartella della missione.

### Impostazioni Chiave

```
hostname = "My DayZ Server";
password = "";
passwordAdmin = "adminpass123";
maxPlayers = 60;
verifySignatures = 2;
forceSameBuild = 1;
template = "dayzOffline.chernarusplus";
enableCfgGameplayFile = 1;
storeHouseStateDisabled = false;
storageAutoFix = 1;
```

| Parametro | Descrizione |
|-----------|-------------|
| `hostname` | Nome del server nel browser |
| `password` | Password di accesso (vuota = aperto) |
| `passwordAdmin` | Password admin RCON |
| `maxPlayers` | Giocatori simultanei massimi |
| `template` | Nome della cartella missione |
| `verifySignatures` | Livello di verifica delle firme (2 = rigoroso) |
| `enableCfgGameplayFile` | Carica cfggameplay.json (0/1) |

### Caricamento dei Mod

I mod vengono specificati tramite parametri di avvio, non nel file di configurazione:

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

I mod `-mod=` devono essere installati dai client. I mod `-servermod=` funzionano solo lato server.

---

## Come i Mod Interagiscono con l'Economia

### cfgeconomycore.xml --- Registrazione delle Classi Radice

Ogni gerarchia di classi degli oggetti deve risalire a una classe radice registrata:

```xml
<economycore>
    <classes>
        <rootclass name="DefaultWeapon" />
        <rootclass name="DefaultMagazine" />
        <rootclass name="Inventory_Base" />
        <rootclass name="SurvivorBase" act="character" reportMemoryLOD="no" />
        <rootclass name="DZ_LightAI" act="character" reportMemoryLOD="no" />
        <rootclass name="CarScript" act="car" reportMemoryLOD="no" />
    </classes>
</economycore>
```

Se la tua mod introduce una nuova classe base che non eredita da `Inventory_Base`, `DefaultWeapon` o `DefaultMagazine`, aggiungila come `rootclass`. L'attributo `act` specifica il tipo di entità: `character` per IA, `car` per veicoli.

### cfglimitsdefinition.xml --- Tag Personalizzati

Qualsiasi `category`, `usage` o `value` usato in `types.xml` deve essere definito qui:

```xml
<lists>
    <categories>
        <category name="mymod_special"/>
    </categories>
    <usageflags>
        <usage name="MyModDungeon"/>
    </usageflags>
    <valueflags>
        <value name="MyModEndgame"/>
    </valueflags>
</lists>
```

Usa `cfglimitsdefinitionuser.xml` per aggiunte che non dovrebbero sovrascrivere il file vanilla.

### economy.xml --- Controllo dei Sottosistemi

Controlla quali sottosistemi della CE sono attivi:

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

Flag: `init` (genera all'avvio), `load` (carica persistenza), `respawn` (rigenera dopo pulizia), `save` (persisti nel database).

### Interazione Economica lato Script

Gli oggetti creati tramite `CreateInInventory()` sono automaticamente gestiti dalla CE. Per gli spawn nel mondo, usa i flag ECE:

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## Errori Comuni

### Errori di Sintassi XML

Un singolo tag non chiuso rompe l'intero file. Valida sempre l'XML prima della distribuzione.

### Tag Mancanti in cfglimitsdefinition.xml

Usare un `usage` o `value` in types.xml che non è definito in cfglimitsdefinition.xml fa sì che l'oggetto non appaia silenziosamente. Controlla i log RPT per gli avvertimenti.

### Nominale Troppo Alto

Il nominale totale di tutti gli oggetti dovrebbe restare sotto 10.000--15.000. Valori eccessivi degradano le prestazioni del server.

### Durata Troppo Breve

Oggetti con durata molto breve scompaiono prima che i giocatori li trovino. Usa almeno `3600` (1 ora) per oggetti comuni, `28800` (8 ore) per le armi.

### Classe Radice Mancante

Oggetti la cui gerarchia di classi non risale a una classe radice registrata in `cfgeconomycore.xml` non appariranno mai, anche con voci corrette in types.xml.

### cfggameplay.json Non Abilitato

Il file viene ignorato a meno che `enableCfgGameplayFile = 1` non sia impostato in `serverDZ.cfg`.

### Tipo Sbagliato in globals.xml

Usare `type="0"` (intero) per un valore decimale come `0.82` lo tronca a `0`. Usa `type="1"` per i decimali.

### Modifica Diretta dei File Vanilla

Modificare il types.xml vanilla funziona ma si rompe con gli aggiornamenti del gioco. Preferisci distribuire file di tipo separati e registrarli tramite cfgeconomycore, oppure usa cfglimitsdefinitionuser.xml per tag personalizzati.

---

## Buone Pratiche

- Distribuisci una cartella `ServerFiles/` con la tua mod contenente voci `types.xml` preconfigurate così gli amministratori del server possono copiare e incollare invece di scrivere da zero.
- Usa `cfglimitsdefinitionuser.xml` invece di modificare il `cfglimitsdefinition.xml` vanilla -- le tue aggiunte sopravvivono agli aggiornamenti del gioco.
- Imposta `count_in_hoarder="0"` per oggetti comuni (cibo, munizioni) per evitare che l'accumulo blocchi i respawn della CE.
- Imposta sempre `enableCfgGameplayFile = 1` in `serverDZ.cfg` prima di aspettarti che le modifiche a `cfggameplay.json` abbiano effetto.
- Mantieni il `nominal` totale di tutte le voci types.xml sotto 12.000 per evitare il degrado delle prestazioni della CE su server popolati.

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|----------|--------|--------|
| `nominal` è un obiettivo fisso | La CE genera esattamente questo numero di oggetti | La CE si avvicina al nominale nel tempo ma fluttua in base all'interazione dei giocatori, ai cicli di pulizia e alla distanza delle zone |
| `restock=0` significa respawn istantaneo | Gli oggetti riappaiono immediatamente dopo la rimozione | La CE elabora il rifornimento in cicli (tipicamente ogni 30-60 secondi), quindi c'è sempre un ritardo indipendentemente dal valore di restock |
| `cfggameplay.json` controlla tutto il gameplay | Tutta la regolazione va qui | Molti valori di gameplay sono hardcoded negli script o in config.cpp e non possono essere sovrascritti da cfggameplay.json |
| `init.c` viene eseguito solo all'avvio del server | Inizializzazione una tantum | `init.c` viene eseguito ogni volta che la missione si carica, incluso dopo i riavvii del server. Lo stato persistente è gestito dall'Hive, non da init.c |
| Più file types.xml si fondono correttamente | La CE legge tutti i file registrati | I file devono essere registrati in cfgeconomycore.xml tramite direttive `<ce folder="custom">`. Semplicemente posizionare file XML aggiuntivi in `db/` non fa nulla |

---

## Compatibilità e Impatto

- **Multi-Mod:** Più mod possono aggiungere voci a types.xml senza conflitti purché i nomi delle classi siano unici. Se due mod definiscono lo stesso nome di classe con valori nominale/durata diversi, l'ultima voce caricata vince.
- **Prestazioni:** Conteggi nominali eccessivi (15.000+) causano picchi nel tick della CE visibili come cali di FPS del server. Ogni ciclo della CE itera tutti i tipi registrati per verificare le condizioni di spawn.
