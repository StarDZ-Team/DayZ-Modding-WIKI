# Chapter 9.6: Spawn dei Giocatori

[Home](../README.md) | [<< Precedente: Spawn dei Veicoli](05-vehicle-spawning.md) | [Successivo: Persistenza >>](07-persistence.md)

---

> **Riepilogo:** Le posizioni di spawn dei giocatori sono controllate da **cfgplayerspawnpoints.xml** (bolle di posizione) e **init.c** (equipaggiamento iniziale). Questo capitolo copre entrambi i file con valori vanilla reali di Chernarus.

---

## Indice

- [Panoramica di cfgplayerspawnpoints.xml](#panoramica-di-cfgplayerspawnpointsxml)
- [Parametri di spawn](#parametri-di-spawn)
- [Parametri del generatore](#parametri-del-generatore)
- [Parametri di gruppo](#parametri-di-gruppo)
- [Bolle di spawn per nuovi giocatori](#bolle-di-spawn-per-nuovi-giocatori)
- [Spawn per server hopper](#spawn-per-server-hopper)
- [init.c -- Equipaggiamento iniziale](#initc----equipaggiamento-iniziale)
- [Aggiungere punti di spawn personalizzati](#aggiungere-punti-di-spawn-personalizzati)
- [Errori comuni](#errori-comuni)

---

## Panoramica di cfgplayerspawnpoints.xml

Questo file si trova nella cartella della tua missione (ad esempio `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Ha due sezioni, ciascuna con i propri parametri e bolle di posizione:

- **`<fresh>`** -- personaggi completamente nuovi (prima vita o dopo la morte)
- **`<hop>`** -- server hopper (il giocatore aveva un personaggio su un altro server)

---

## Parametri di spawn

Valori vanilla per lo spawn dei nuovi giocatori:

```xml
<spawn_params>
    <min_dist_infected>30</min_dist_infected>
    <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>
    <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
</spawn_params>
```

| Parametro | Valore | Significato |
|-----------|--------|-------------|
| `min_dist_infected` | 30 | Il giocatore deve spawnare ad almeno 30m dall'infetto piu vicino |
| `max_dist_infected` | 70 | Se non esiste una posizione a 30m+, accetta fino a 70m come intervallo di ripiego |
| `min_dist_player` | 65 | Il giocatore deve spawnare ad almeno 65m da qualsiasi altro giocatore |
| `max_dist_player` | 150 | Intervallo di ripiego -- accetta posizioni fino a 150m da altri giocatori |
| `min_dist_static` | 0 | Distanza minima da oggetti statici (edifici, muri) |
| `max_dist_static` | 2 | Distanza massima da oggetti statici -- mantiene i giocatori vicini alle strutture |

Il motore prova prima `min_dist_*`; se non esiste una posizione valida, rilassa verso `max_dist_*`.

---

## Parametri del generatore

Il generatore crea una griglia di posizioni candidate intorno a ogni bolla:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
</generator_params>
```

| Parametro | Valore | Significato |
|-----------|--------|-------------|
| `grid_density` | 4 | Spaziatura tra i punti della griglia in metri -- piu bassa = piu candidati, costo CPU piu alto |
| `grid_width` | 200 | La griglia si estende per 200m sull'asse X intorno al centro di ogni bolla |
| `grid_height` | 200 | La griglia si estende per 200m sull'asse Z intorno al centro di ogni bolla |
| `min_steepness` / `max_steepness` | -45 / 45 | Intervallo di pendenza del terreno in gradi -- rifiuta pareti rocciose e colline ripide |

Ogni bolla ottiene una griglia 200x200m con un punto ogni 4m (~2.500 candidati). Il motore filtra per pendenza e distanza dagli oggetti statici, poi applica i `spawn_params` al momento dello spawn.

#### Parametro `allow_in_water` (1.28+)

A partire da DayZ 1.28, e stato aggiunto un nuovo parametro booleano `allow_in_water` in `generator_params` (valore predefinito: `false`). Se impostato su `true`, il generatore di punti di spawn considera valide anche le posizioni in acqua:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
    <allow_in_water>false</allow_in_water>
</generator_params>
```

Per impostazione predefinita, il motore rifiuta qualsiasi posizione candidata che cade in acqua (stagni, fiumi, oceano). Impostare `allow_in_water` su `true` rimuove questo filtro. Questo e utile principalmente per mappe personalizzate con spawn su isole o scenari in cui lo spawn in acqua costiera e intenzionale. Per la maggior parte dei server, lascia questo valore su `false` per evitare che i giocatori spawnino nei laghi o nell'oceano.

---

## Parametri di gruppo

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Parametro | Valore | Significato |
|-----------|--------|-------------|
| `enablegroups` | true | Le bolle di posizione sono organizzate in gruppi nominati |
| `groups_as_regular` | true | I gruppi sono trattati come punti di spawn regolari (qualsiasi gruppo puo essere selezionato) |
| `lifetime` | 240 | Secondi prima che un punto di spawn usato diventi nuovamente disponibile |
| `counter` | -1 | Numero di volte che un punto di spawn puo essere usato. -1 = illimitato |

Una posizione usata viene bloccata per 240 secondi, impedendo a due giocatori di spawnare uno sopra l'altro.

---

## Bolle di spawn per nuovi giocatori

Chernarus vanilla definisce 11 gruppi lungo la costa per i nuovi spawn. Ogni gruppo raggruppa 3-8 posizioni intorno a una citta:

| Gruppo | Posizioni | Area |
|--------|-----------|------|
| WestCherno | 4 | Lato ovest di Chernogorsk |
| EastCherno | 4 | Lato est di Chernogorsk |
| WestElektro | 5 | Elektrozavodsk ovest |
| EastElektro | 4 | Elektrozavodsk est |
| Kamyshovo | 5 | Costa di Kamyshovo |
| Solnechny | 5 | Area della fabbrica di Solnechniy |
| Orlovets | 4 | Tra Solnechniy e Nizhnoye |
| Nizhnee | 4 | Costa di Nizhnoye |
| SouthBerezino | 3 | Berezino sud |
| NorthBerezino | 8 | Berezino nord + costa estesa |
| Svetlojarsk | 3 | Porto di Svetlojarsk |

### Esempi reali di gruppi

```xml
<generator_posbubbles>
    <group name="WestCherno">
        <pos x="6063.018555" z="1931.907227" />
        <pos x="5933.964844" z="2171.072998" />
        <pos x="6199.782715" z="2241.805176" />
        <pos x="13552.5654" z="5955.893066" />
    </group>
    <group name="WestElektro">
        <pos x="8747.670898" z="2357.187012" />
        <pos x="9363.6533" z="2017.953613" />
        <pos x="9488.868164" z="1898.900269" />
        <pos x="9675.2216" z="1817.324585" />
        <pos x="9821.274414" z="2194.003662" />
    </group>
    <group name="Kamyshovo">
        <pos x="11830.744141" z="3400.428955" />
        <pos x="11930.805664" z="3484.882324" />
        <pos x="11961.211914" z="3419.867676" />
        <pos x="12222.977539" z="3454.867188" />
        <pos x="12336.774414" z="3503.847168" />
    </group>
</generator_posbubbles>
```

Le coordinate usano `x` (est-ovest) e `z` (nord-sud). L'asse Y (altitudine) viene calcolato automaticamente dalla heightmap del terreno.

---

## Spawn per server hopper

Gli spawn per gli hopper sono piu permissivi sulla distanza dai giocatori e usano griglie piu piccole:

```xml
<!-- Differenze dei spawn_params per hop rispetto a fresh -->
<min_dist_player>25.0</min_dist_player>   <!-- fresh: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- fresh: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- fresh: 0 -->

<!-- Differenze dei generator_params per hop -->
<grid_width>150</grid_width>              <!-- fresh: 200 -->
<grid_height>150</grid_height>            <!-- fresh: 200 -->

<!-- Differenze dei group_params per hop -->
<enablegroups>false</enablegroups>        <!-- fresh: true -->
<lifetime>360</lifetime>                  <!-- fresh: 240 -->
```

I gruppi hop sono distribuiti **nell'entroterra**: Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). Con `enablegroups=false`, il motore tratta tutte le 50 posizioni come un pool piatto.

---

## init.c -- Equipaggiamento iniziale

Il file **init.c** nella cartella della tua missione controlla la creazione del personaggio e l'equipaggiamento iniziale. Due override contano:

- **`CreateCharacter`** -- chiama `GetGame().CreatePlayer()`. Il motore sceglie la posizione da **cfgplayerspawnpoints.xml** prima che questo venga eseguito; non imposti la posizione di spawn qui.
- **`StartingEquipSetup`** -- viene eseguito dopo la creazione del personaggio. Il giocatore ha gia l'abbigliamento predefinito (maglietta, jeans, scarpe da ginnastica). Questo metodo aggiunge gli oggetti iniziali.

### StartingEquipSetup vanilla (Chernarus)

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 salute

        itemEnt = itemClothing.GetInventory().CreateInInventory( "BandageDressing" );
        player.SetQuickBarEntityShortcut(itemEnt, 2);

        string chemlightArray[] = { "Chemlight_White", "Chemlight_Yellow", "Chemlight_Green", "Chemlight_Red" };
        int rndIndex = Math.RandomInt( 0, 4 );
        itemEnt = itemClothing.GetInventory().CreateInInventory( chemlightArray[rndIndex] );
        SetRandomHealth( itemEnt );
        player.SetQuickBarEntityShortcut(itemEnt, 1);

        rand = Math.RandomFloatInclusive( 0.0, 1.0 );
        if ( rand < 0.35 )
            itemEnt = player.GetInventory().CreateInInventory( "Apple" );
        else if ( rand > 0.65 )
            itemEnt = player.GetInventory().CreateInInventory( "Pear" );
        else
            itemEnt = player.GetInventory().CreateInInventory( "Plum" );
        player.SetQuickBarEntityShortcut(itemEnt, 3);
        SetRandomHealth( itemEnt );
    }

    itemClothing = player.FindAttachmentBySlotName( "Legs" );
    if ( itemClothing )
        SetRandomHealth( itemClothing );
}
```

Cosa riceve ogni giocatore: **BandageDressing** (quickbar 3), **Chemlight** casuale (quickbar 2), frutta casuale -- 35% Apple, 30% Plum, 35% Pear (quickbar 1). `SetRandomHealth` imposta una condizione del 45-65% su tutti gli oggetti.

### Aggiungere equipaggiamento iniziale personalizzato

```c
// Aggiungi dopo il blocco della frutta, dentro il controllo dello slot Body
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Aggiungere punti di spawn personalizzati

Per aggiungere un gruppo di spawn personalizzato, modifica la sezione `<fresh>` di **cfgplayerspawnpoints.xml**:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Passaggi:

1. Apri la mappa nel gioco o usa iZurvive per trovare le coordinate
2. Scegli 3-5 posizioni distribuite su 100-200m in un'area sicura (niente scogliere, niente acqua)
3. Aggiungi il blocco `<group>` dentro `<generator_posbubbles>`
4. Usa `x` per est-ovest e `z` per nord-sud -- il motore calcola Y (altitudine) dal terreno
5. Riavvia il server -- non e necessario un wipe della persistenza

Per uno spawn equilibrato, mantieni almeno 4 posizioni per gruppo in modo che il blocco di 240 secondi non blocchi tutte le posizioni quando piu giocatori muoiono contemporaneamente.

---

## Errori comuni

### I giocatori spawnano nell'oceano

Hai scambiato `z` (nord-sud) con Y (altitudine), o hai usato coordinate fuori dall'intervallo 0-15360. Le posizioni costiere hanno valori `z` bassi (bordo sud). Ricontrolla con iZurvive.

### Non abbastanza punti di spawn

Con solo 2-3 posizioni, il blocco di 240 secondi causa raggruppamento. Il vanilla usa 49 posizioni fresh distribuite su 11 gruppi. Punta ad almeno 20 posizioni in 4+ gruppi.

### Dimenticare la sezione hop

Una sezione `<hop>` vuota significa che i server hopper spawnano a `0,0,0` -- l'oceano su Chernarus. Definisci sempre i punti hop, anche se li copi da `<fresh>`.

### Punti di spawn su terreno ripido

Il generatore rifiuta pendenze oltre i 45 gradi. Se tutte le posizioni personalizzate sono su colline, non esistono candidati validi. Usa terreno piatto vicino alle strade.

### I giocatori spawnano sempre nello stesso punto

I gruppi con 1-2 posizioni vengono bloccati dal cooldown di 240 secondi. Aggiungi piu posizioni per gruppo.

---

[Home](../README.md) | [<< Precedente: Spawn dei Veicoli](05-vehicle-spawning.md) | [Successivo: Persistenza >>](07-persistence.md)
