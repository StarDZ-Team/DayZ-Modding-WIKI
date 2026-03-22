# Capitolo 8.13: Il Menu Diagnostico (Diag Menu)

[Home](../README.md) | [<< Precedente: Costruire un Sistema di Scambio](12-trading-system.md) | **Il Menu Diagnostico**

---

> **Riepilogo:** Il Diag Menu è lo strumento diagnostico integrato di DayZ, disponibile solo tramite l'eseguibile DayZDiag. Fornisce contatori FPS, profilazione degli script, debug del rendering, telecamera libera, visualizzazione della fisica, controllo del meteo, strumenti dell'Economia Centrale, debug della navigazione IA e diagnostica audio. Questo capitolo documenta ogni categoria del menu, opzione e scorciatoia da tastiera basandosi sulla documentazione ufficiale di Bohemia Interactive.

---

## Indice

- [Cos'è il Diag Menu?](#cosè-il-diag-menu)
- [Come Accedere](#come-accedere)
- [Controlli di Navigazione](#controlli-di-navigazione)
- [Scorciatoie da Tastiera Rapide](#scorciatoie-da-tastiera-rapide)
- [Panoramica delle Categorie del Menu](#panoramica-delle-categorie-del-menu)
- [Statistics](#statistics)
- [Enfusion Renderer](#enfusion-renderer)
- [Enfusion World (Fisica)](#enfusion-world-fisica)
- [DayZ Render](#dayz-render)
- [Game](#game)
- [AI](#ai)
- [Sounds](#sounds)
- [Funzionalità Utili per i Modder](#funzionalità-utili-per-i-modder)
- [Quando Usare il Diag Menu](#quando-usare-il-diag-menu)
- [Errori Comuni](#errori-comuni)
- [Prossimi Passi](#prossimi-passi)

---

## Cos'è il Diag Menu?

Il Diag Menu è un menu di debug gerarchico integrato nell'eseguibile diagnostico di DayZ. Elenca opzioni utilizzate per il debug degli script di gioco e degli asset attraverso sette categorie principali: Statistics, Enfusion Renderer, Enfusion World, DayZ Render, Game, AI e Sounds.

Il Diag Menu **non è disponibile** nell'eseguibile retail di DayZ (`DayZ_x64.exe`). Devi usare `DayZDiag_x64.exe` -- la build diagnostica che viene distribuita insieme alla versione retail nella tua installazione di DayZ o nelle directory del Server DayZ.

---

## Come Accedere

### Requisiti

- **DayZDiag_x64.exe** -- L'eseguibile diagnostico. Si trova nella cartella di installazione di DayZ accanto al normale `DayZ_x64.exe`.
- Devi essere in esecuzione nel gioco (non in una schermata di caricamento). Il menu è disponibile in qualsiasi viewport 3D.

### Aprire il Menu

Premi **Win + Alt** per aprire il Diag Menu.

Una scorciatoia alternativa è **Ctrl + Win**, ma questa è in conflitto con una scorciatoia di sistema di Windows 11 e non è raccomandata su quella piattaforma.

### Abilitare il Cursore del Mouse

Alcune opzioni del Diag Menu richiedono di interagire con lo schermo usando il mouse. Il cursore del mouse può essere attivato premendo:

**LCtrl + Numpad 9**

Questa combinazione di tasti è registrata tramite script (`PluginKeyBinding`).

---

## Controlli di Navigazione

Una volta che il Diag Menu è aperto:

| Tasto | Azione |
|-----|--------|
| **Freccia Su / Giù** | Navigare tra le voci del menu |
| **Freccia Destra** | Entrare in un sottomenu, o scorrere i valori delle opzioni |
| **Freccia Sinistra** | Scorrere i valori delle opzioni in direzione inversa |
| **Backspace** | Uscire dal sottomenu corrente (tornare indietro di un livello) |

Quando le opzioni mostrano valori multipli, sono elencati nell'ordine in cui appaiono nel menu. La prima opzione è tipicamente quella predefinita.

---

## Scorciatoie da Tastiera Rapide

Queste scorciatoie funzionano in qualsiasi momento mentre si esegue DayZDiag, senza bisogno di aprire il menu:

| Scorciatoia | Funzione |
|----------|----------|
| **LCtrl + Numpad 1** | Attiva/disattiva il contatore FPS |
| **LCtrl + Numpad 9** | Attiva/disattiva il cursore del mouse sullo schermo |
| **RCtrl + RAlt + W** | Cicla la modalità debug del rendering |
| **LCtrl + LAlt + P** | Attiva/disattiva gli effetti di post-elaborazione |
| **LAlt + Numpad 6** | Attiva/disattiva la visualizzazione dei corpi fisici |
| **Page Up** | Telecamera Libera: attiva/disattiva il movimento del giocatore |
| **Page Down** | Telecamera Libera: blocca/sblocca la telecamera |
| **Insert** | Teletrasporta il giocatore alla posizione del cursore (nella telecamera libera) |
| **Home** | Attiva/disattiva la telecamera libera / disattiva e teletrasporta il giocatore al cursore |
| **Numpad /** | Attiva/disattiva la telecamera libera (senza teletrasporto) |
| **End** | Disattiva la telecamera libera (ritorna alla telecamera del giocatore) |

> **Nota:** Qualsiasi menzione di "Cheat Inputs" nella documentazione ufficiale si riferisce a input hardcoded sul lato C++, non accessibili tramite script.

---

## Panoramica delle Categorie del Menu

Il Diag Menu contiene sette categorie di primo livello:

1. **Statistics** -- Contatore FPS e profilatore script
2. **Enfusion Renderer** -- Illuminazione, ombre, materiali, occlusione, post-elaborazione, terreno, widget
3. **Enfusion World** -- Visualizzazione e debug del motore fisico (Bullet)
4. **DayZ Render** -- Rendering del cielo, diagnostica della geometria
5. **Game** -- Meteo, telecamera libera, veicoli, combattimento, Economia Centrale, suoni di superficie
6. **AI** -- Mesh di navigazione, pathfinding, comportamento degli agenti IA
7. **Sounds** -- Debug dei campioni in riproduzione, informazioni sul sistema audio

---

## Statistics

### Struttura del Menu

```
Statistics
  FPS                              [LCtrl + Numpad 1]
  Script profiler UI
  > Script profiler settings
      Always enabled
      Flags
      Module
      Update interval
      Average
      Time resolution
      (UI) Scale
```

### FPS

Abilita il contatore FPS nell'angolo in alto a sinistra dello schermo.

Il valore FPS è calcolato dal tempo tra gli ultimi 10 frame, quindi riflette una breve media mobile piuttosto che una lettura istantanea.

### Script Profiler UI

Attiva il Profilatore Script a schermo, che visualizza dati di performance in tempo reale per l'esecuzione degli script.

Il profilatore mostra sei sezioni di dati:

| Sezione | Cosa Mostra |
|---------|---------------|
| **Time per class** | Tempo totale di tutte le chiamate di funzione appartenenti a una classe (top 20) |
| **Time per function** | Tempo totale di tutte le chiamate a una funzione specifica (top 20) |
| **Class allocations** | Numero di allocazioni di una classe (top 20) |
| **Count per function** | Numero di volte che una funzione è stata chiamata (top 20) |
| **Class count** | Numero di istanze vive di una classe (top 40) |
| **Stats and settings** | Configurazione corrente del profilatore e contatori frame |

Il pannello Stats and settings mostra:

| Campo | Significato |
|-------|---------|
| UI enabled (DIAG) | Se l'interfaccia del profilatore script è attiva |
| Profiling enabled (SCRP) | Se la profilazione viene eseguita anche quando l'interfaccia non è attiva |
| Profiling enabled (SCRC) | Se la profilazione sta effettivamente avvenendo |
| Flags | Flag correnti di raccolta dati |
| Module | Modulo attualmente profilato |
| Interval | Intervallo di aggiornamento corrente |
| Time Resolution | Risoluzione temporale corrente |
| Average | Se i valori mostrati sono medie |
| Game Frame | Frame totali trascorsi |
| Session Frame | Frame totali in questa sessione di profilazione |
| Total Frames | Frame totali in tutte le sessioni di profilazione |
| Profiled Sess Frms | Frame profilati in questa sessione |
| Profiled Frames | Frame profilati in tutte le sessioni |

> **Importante:** Il Profilatore Script profila solo il codice script. I metodi Proto (collegati al motore) non vengono misurati come voci separate, ma il loro tempo di esecuzione è incluso nel tempo totale del metodo script che li chiama.

> **Importante:** L'API EnProfiler e lo stesso profilatore script sono disponibili solo nell'eseguibile diagnostico.

### Impostazioni del Profilatore Script

Queste impostazioni controllano come vengono raccolti i dati di profilazione. Possono essere regolate anche programmaticamente tramite l'API `EnProfiler` (documentata in `EnProfiler.c`).

#### Always Enabled

La raccolta dati di profilazione non è abilitata per impostazione predefinita. Questo toggle mostra se è attualmente attiva.

Per abilitare la profilazione all'avvio, usa il parametro di lancio `-profile`.

L'interfaccia del Profilatore Script ignora questa impostazione -- forza sempre la profilazione mentre l'interfaccia è visibile. Quando l'interfaccia viene disattivata, la profilazione si ferma di nuovo (a meno che "Always enabled" sia impostato su true).

#### Flag

Controlla come vengono raccolti i dati. Sono disponibili quattro combinazioni:

| Combinazione Flag | Ambito | Durata dei Dati |
|-----------------|-------|---------------|
| `SPF_RESET \| SPF_RECURSIVE` | Modulo selezionato + figli | Per frame (reset ogni frame) |
| `SPF_RECURSIVE` | Modulo selezionato + figli | Accumulato tra i frame |
| `SPF_RESET` | Solo modulo selezionato | Per frame (reset ogni frame) |
| `SPF_NONE` | Solo modulo selezionato | Accumulato tra i frame |

- **SPF_RECURSIVE**: Abilita la profilazione dei moduli figli (ricorsivamente)
- **SPF_RESET**: Cancella i dati alla fine di ogni frame

#### Module

Seleziona quale modulo script profilare:

| Opzione | Livello Script |
|--------|-------------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

Il numero di frame da attendere prima di aggiornare la visualizzazione dei dati ordinati. Questo ritarda anche il reset causato da `SPF_RESET`.

Valori disponibili: 0, 5, 10, 20, 30, 50, 60, 120, 144

#### Average

Abilita o disabilita la visualizzazione dei valori medi.

- Con `SPF_RESET` e nessun intervallo: i valori sono il valore grezzo per-frame
- Senza `SPF_RESET`: divide il valore accumulato per il conteggio dei frame della sessione
- Con un intervallo impostato: divide per l'intervallo

Il conteggio delle classi non viene mai mediato -- mostra sempre il conteggio delle istanze correnti. Le allocazioni mostreranno il numero medio di volte che un'istanza è stata creata.

#### Time Resolution

Imposta l'unità di tempo per la visualizzazione. Il valore rappresenta il denominatore (ennesimo di secondo):

| Valore | Unità |
|-------|------|
| 1 | Secondi |
| 1000 | Millisecondi |
| 1000000 | Microsecondi |

Valori disponibili: 1, 10, 100, 1000, 10000, 100000, 1000000

#### (UI) Scale

Regola la scala visiva della visualizzazione del profilatore a schermo per diverse dimensioni e risoluzioni dello schermo.

Intervallo: 0.5 a 1.5 (predefinito: 1.0, passo: 0.05)

---

## Enfusion Renderer

### Struttura del Menu

```
Enfusion Renderer
  Lights
  > Lighting
      Ambient lighting
      Ground lighting
      Directional lighting
      Bidirectional lighting
      Specular lighting
      Reflection
      Emission lighting
  Shadows
  Terrain shadows
  Render debug mode                [RCtrl + RAlt + W]
  Occluders
  Occlude entities
  Occlude proxies
  Show occluder volumes
  Show active occluders
  Show occluded
  Widgets
  Postprocess                      [LCtrl + LAlt + P]
  Terrain
  > Materials
      Common, TreeTrunk, TreeCrown, Grass, Basic, Normal,
      Super, Skin, Multi, Old Terrain, Old Roads, Water,
      Sky, Sky clouds, Sky stars, Sky flares,
      Particle Sprite, Particle Streak
```

### Lights

Attiva/disattiva le sorgenti luminose effettive (come `PersonalLight` o oggetti in-game come le torce). Questo non influenza l'illuminazione ambientale -- usa il sottomenu Lighting per quello.

### Sottomenu Lighting

Ogni toggle controlla un componente di illuminazione specifico:

| Opzione | Effetto Quando Disabilitato |
|--------|---------------------|
| **Ambient lighting** | Rimuove la luce ambientale generale nella scena |
| **Ground lighting** | Rimuove la luce riflessa dal terreno (visibile su tetti, ascelle del personaggio) |
| **Directional lighting** | Rimuove la luce direzionale principale (sole/luna). Disabilita anche l'illuminazione bidirezionale |
| **Bidirectional lighting** | Rimuove il componente di luce bidirezionale |
| **Specular lighting** | Rimuove i riflessi speculari (visibili su superfici lucide come credenze, auto) |
| **Reflection** | Rimuove l'illuminazione da riflessione (visibile su superfici metalliche/lucide) |
| **Emission lighting** | Rimuove l'emissione (auto-illuminazione) dai materiali |

Questi toggle sono utili per isolare contributi specifici di illuminazione durante il debug di problemi visivi in modelli personalizzati o scene.

### Shadows

Abilita o disabilita il rendering delle ombre. Disabilitare rimuove anche il culling della pioggia all'interno degli oggetti (la pioggia cadrà attraverso i tetti).

### Terrain Shadows

Controlla come vengono generate le ombre del terreno.

Opzioni: `on (slice)`, `on (full)`, `no update`, `disabled`

### Render Debug Mode

Passa tra le modalità di visualizzazione del rendering per ispezionare la geometria dei mesh in-game.

Opzioni: `normal`, `wire`, `wire only`, `overdraw`, `overdrawZ`

Materiali diversi vengono visualizzati con colori wireframe diversi:

| Materiale | Colore (RGB) |
|----------|-------------|
| TreeTrunk | 179, 126, 55 |
| TreeCrown | 143, 227, 94 |
| Grass | 41, 194, 53 |
| Basic | 208, 87, 87 |
| Normal | 204, 66, 107 |
| Super | 234, 181, 181 |
| Skin | 252, 170, 18 |
| Multi | 143, 185, 248 |
| Terrain | 255, 127, 127 |
| Water | 51, 51, 255 |
| Ocean | 51, 128, 255 |
| Sky | 143, 185, 248 |

### Occluders

Un insieme di toggle per il sistema di occlusion culling:

| Opzione | Effetto |
|--------|--------|
| **Occluders** | Abilita/disabilita l'occlusione degli oggetti |
| **Occlude entities** | Abilita/disabilita l'occlusione delle entità |
| **Occlude proxies** | Abilita/disabilita l'occlusione dei proxy |
| **Show occluder volumes** | Cattura un'istantanea e disegna forme di debug che visualizzano i volumi di occlusione |
| **Show active occluders** | Mostra gli occluder attualmente attivi con forme di debug |
| **Show occluded** | Visualizza gli oggetti occlusi con forme di debug |

### Widgets

Abilita o disabilita il rendering di tutti i widget UI. Utile per catturare screenshot puliti o isolare problemi di rendering.

### Postprocess

Abilita o disabilita gli effetti di post-elaborazione (bloom, correzione colore, vignettatura, ecc.).

### Terrain

Abilita o disabilita il rendering del terreno interamente.

### Sottomenu Materials

Attiva/disattiva il rendering di tipi di materiali specifici. La maggior parte si spiega da sé. Voci notevoli:

- **Super** -- Un toggle generale che copre ogni materiale relativo allo shader "super"
- **Old Terrain** -- Copre sia i materiali Terrain che Terrain Simple
- **Water** -- Copre ogni materiale relativo all'acqua (oceano, riva, fiumi)

---

## Enfusion World (Fisica)

### Struttura del Menu

```
Enfusion World
  Show Bullet
  > Bullet
      Draw Char Ctrl
      Draw Simple Char Ctrl
      Max. Collider Distance
      Draw Bullet shape
      Draw Bullet wireframe
      Draw Bullet shape AABB
      Draw obj center of mass
      Draw Bullet contacts
      Force sleep Bullet
      Show stats
  Show bodies                      [LAlt + Numpad 6]
```

> **Nota:** "Bullet" qui si riferisce al motore fisico Bullet, non alle munizioni.

### Show Bullet

Attiva la visualizzazione di debug per il motore fisico Bullet.

### Sottomenu Bullet

| Opzione | Descrizione |
|--------|-------------|
| **Draw Char Ctrl** | Visualizza il controller del personaggio giocatore. Dipende da "Draw Bullet shape" |
| **Draw Simple Char Ctrl** | Visualizza il controller del personaggio IA. Dipende da "Draw Bullet shape" |
| **Max. Collider Distance** | Distanza massima dal giocatore per visualizzare i collider (valori: 0, 1, 2, 5, 10, 20, 50, 100, 200, 500). Predefinito 0 |
| **Draw Bullet shape** | Visualizza le forme dei collider fisici |
| **Draw Bullet wireframe** | Mostra i collider solo in wireframe. Dipende da "Draw Bullet shape" |
| **Draw Bullet shape AABB** | Mostra le bounding box allineate agli assi dei collider |
| **Draw obj center of mass** | Mostra i centri di massa degli oggetti |
| **Draw Bullet contacts** | Visualizza i collider in contatto |
| **Force sleep Bullet** | Forza tutti i corpi fisici a dormire |
| **Show stats** | Mostra statistiche di debug (opzioni: disabled, basic, all). Le statistiche rimangono visibili per 10 secondi dopo la disabilitazione |

> **Attenzione:** Max. Collider Distance è 0 per impostazione predefinita perché questa visualizzazione è costosa. Impostarlo a una grande distanza causerà una significativa degradazione delle prestazioni.

### Show Bodies

Visualizza i corpi fisici Bullet. Opzioni: `disabled`, `only`, `all`

---

## DayZ Render

### Struttura del Menu

```
DayZ Render
  > Sky
      Space
      Stars
      > Planets
          Sun
          Moon
      Atmosphere
      > Clouds
          Far
          Near
          Physical
      Horizon
      > Post Process
          God Rays
  > Geometry diagnostic
      diagnostic mode
```

### Sottomenu Sky

Attiva/disattiva i singoli componenti del rendering del cielo:

| Opzione | Cosa Controlla |
|--------|-----------------|
| **Space** | La texture di sfondo dietro le stelle |
| **Stars** | Rendering delle stelle |
| **Sun** | Sole e il suo effetto alone (non i god rays) |
| **Moon** | Luna e il suo effetto alone (non i god rays) |
| **Atmosphere** | La texture dell'atmosfera nel cielo |
| **Far (Clouds)** | Nuvole superiori/distanti. Non influenzano i raggi di luce (meno dense) |
| **Near (Clouds)** | Nuvole inferiori/più vicine. Sono più dense e fungono da occlusione per i raggi di luce |
| **Physical (Clouds)** | Nuvole deprecate basate su oggetti. Rimosse da Chernarus e Livonia in DayZ 1.23 |
| **Horizon** | Rendering dell'orizzonte. L'orizzonte impedirà i raggi di luce |
| **God Rays** | Effetto post-elaborazione dei raggi di luce |

### Geometry Diagnostic

Abilita il disegno di forme di debug per visualizzare come appare la geometria di un oggetto in-game.

Tipi di geometria: `normal`, `roadway`, `geometry`, `viewGeometry`, `fireGeometry`, `paths`, `memory`, `wreck`

Modalità di disegno: `solid+wire`, `Zsolid+wire`, `wire`, `ZWire`, `geom only`

Questo è estremamente utile per i modder che creano modelli personalizzati -- puoi verificare che la fire geometry, view geometry e i memory points siano configurati correttamente senza uscire dal gioco.

---

## Game

### Struttura del Menu

```
Game
  > Weather & environment
      Display
      Force fog at camera
      Override fog
        Distance density
        Height density
        Distance offset
        Height bias
  Free Camera
    FrCam Player Move              [Page Up]
    FrCam NoClip
    FrCam Freeze                   [Page Down]
  > Vehicles
      Audio
      Simulation
  > Combat
      DECombat
      DEShots
      DEHitpoints
      DEExplosions
  > Legacy/obsolete
      DEAmbient
      DELight
  DESurfaceSound
  > Central Economy
      > Loot Spawn Edit
          Spawn Volume Vis
          Setup Vis
          Edit Volume
          Re-Trace Group Points
          Spawn Candy
          Spawn Rotation Test
          Placement Test
          Export Group
          Export All Groups
          Export Map
          Export Clusters
          Export Economy [csv]
          Export Respawn Queue [csv]
      > Loot Tool
          Deplete Lifetime
          Set Damage = 1.0
          Damage + Deplete
          Invert Avoidance
          Project Target Loot
      > Infected
          Infected Vis
          Infected Zone Info
          Infected Spawn
          Reset Cleanup
      > Animal
          Animal Vis
          Animal Spawn
          Ambient Spawn
      > Building
          Building Stats
      Vehicle&Wreck Vis
      Loot Vis
      Cluster Vis
      Dynamic Events Status
      Dynamic Events Vis
      Dynamic Events Spawn
      Export Dyn Event
      Overall Stats
      Updaters State
      Idle Mode
      Force Save
```

### Weather & Environment

Funzionalità di debug per il sistema meteo.

#### Display

Abilita la visualizzazione di debug del meteo. Mostra un debug a schermo della nebbia/distanza visiva e apre una finestra separata in tempo reale con dati meteo dettagliati.

Per abilitare la finestra separata durante l'esecuzione come server, usa il parametro di lancio `-debugweather`.

Le impostazioni della finestra sono memorizzate nei profili come `weather_client_imgui.ini` / `weather_client_imgui.bin` (o `weather_server_*` per i server).

#### Force Fog at Camera

Forza l'altezza della nebbia a corrispondere all'altezza della telecamera del giocatore. Ha priorità sull'impostazione Height bias.

#### Override Fog

Abilita la sovrascrittura dei valori della nebbia con impostazioni manuali:

| Parametro | Intervallo | Passo |
|-----------|-------|------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### Free Camera

La telecamera libera stacca la visuale dal personaggio giocatore e permette di volare attraverso il mondo. Questo è uno degli strumenti di debug più utili per i modder.

#### Controlli della Free Camera

| Tasto | Origine | Funzione |
|-----|--------|----------|
| **W / A / S / D** | Inputs (xml) | Muovi avanti / sinistra / indietro / destra |
| **Q** | Inputs (xml) | Muovi su |
| **Z** | Inputs (xml) | Muovi giù |
| **Mouse** | Inputs (xml) | Guardati intorno |
| **Rotella mouse su** | Inputs (C++) | Aumenta velocità |
| **Rotella mouse giù** | Inputs (C++) | Diminuisci velocità |
| **Barra spaziatrice** | Cheat Inputs (C++) | Attiva/disattiva il debug a schermo dell'oggetto puntato |
| **Ctrl / Shift** | Cheat Inputs (C++) | Velocità corrente x 10 |
| **Alt** | Cheat Inputs (C++) | Velocità corrente / 10 |
| **End** | Cheat Inputs (C++) | Disattiva la telecamera libera (ritorna al giocatore) |
| **Enter** | Cheat Inputs (C++) | Collega la telecamera all'oggetto puntato |
| **Page Up** | Cheat Inputs (C++) | Attiva/disattiva il movimento del giocatore nella telecamera libera |
| **Page Down** | Cheat Inputs (C++) | Blocca/sblocca la posizione della telecamera |
| **Insert** | PluginKeyBinding (Script) | Teletrasporta il giocatore alla posizione del cursore |
| **Home** | PluginKeyBinding (Script) | Attiva/disattiva la telecamera libera / disattiva e teletrasporta al cursore |
| **Numpad /** | PluginKeyBinding (Script) | Attiva/disattiva la telecamera libera (senza teletrasporto) |

#### Opzioni della Free Camera

| Opzione | Descrizione |
|--------|-------------|
| **FrCam Player Move** | Abilita/disabilita gli input del giocatore (WASD) che muovono il giocatore nella telecamera libera |
| **FrCam NoClip** | Abilita/disabilita il passaggio della telecamera attraverso il terreno |
| **FrCam Freeze** | Abilita/disabilita gli input che muovono la telecamera |

### Vehicles

Funzionalità di debug estese per i veicoli. Funzionano solo quando il giocatore è all'interno di un veicolo.

- **Audio** -- Apre una finestra separata per regolare le impostazioni audio in tempo reale. Include la visualizzazione dei controller audio.
- **Simulation** -- Apre una finestra separata con il debug della simulazione auto: regolazione dei parametri fisici e visualizzazione.

### Combat

Strumenti di debug per il combattimento, gli spari e gli hitpoint:

| Opzione | Descrizione |
|--------|-------------|
| **DECombat** | Mostra testo a schermo con le distanze da auto, IA e giocatori |
| **DEShots** | Sottomenu di debug dei proiettili (vedi sotto) |
| **DEHitpoints** | Visualizza il DamageSystem del giocatore e dell'oggetto che sta guardando |
| **DEExplosions** | Mostra i dati di penetrazione delle esplosioni. I numeri mostrano i valori di rallentamento. Croce rossa = fermato. Croce verde = penetrato |

**Sottomenu DEShots:**

| Opzione | Descrizione |
|--------|-------------|
| Clear vis. | Cancella qualsiasi visualizzazione di sparo esistente |
| Vis. trajectory | Traccia il percorso di uno sparo, mostrando i punti di uscita e il punto di arresto |
| Always Deflect | Forza tutti gli spari dal client a deflettere |

### Legacy/Obsolete

- **DEAmbient** -- Visualizza variabili che influenzano i suoni ambientali
- **DELight** -- Visualizza statistiche riguardanti l'ambiente di illuminazione corrente

### DESurfaceSound

Visualizza il tipo di superficie su cui il giocatore è in piedi e il tipo di attenuazione.

### Central Economy

Un insieme completo di strumenti di debugging per il sistema dell'Economia Centrale (CE).

> **Importante:** La maggior parte delle opzioni di debug CE funziona solo in client single-player con CE abilitata. Solo "Building Stats" funziona in un ambiente multigiocatore o quando la CE è disattivata.

> **Nota:** Molte di queste funzioni sono disponibili anche tramite `CEApi` negli script (`CentralEconomy.c`).

#### Loot Spawn Edit

Strumenti per creare e modificare i punti di spawn del loot sugli oggetti. La telecamera libera deve essere abilitata per usare lo strumento Edit Volume.

| Opzione | Descrizione | Equivalente Script |
|--------|-------------|-------------------|
| **Spawn Volume Vis** | Visualizza i punti di spawn del loot. Opzioni: Off, Adaptive, Volume, Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | Mostra le proprietà di setup CE a schermo con contenitori codificati per colore | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | Editor interattivo dei punti loot (richiede telecamera libera) | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | Ritraccia i punti loot per risolvere problemi di sospensione | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | Genera loot in tutti i punti di spawn del gruppo selezionato | -- |
| **Spawn Rotation Test** | Testa i flag di rotazione alla posizione del cursore | -- |
| **Placement Test** | Visualizza il posizionamento con un cilindro sferico | -- |
| **Export Group** | Esporta il gruppo selezionato in `storage/export/mapGroup_CLASSNAME.xml` | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | Esporta tutti i gruppi in `storage/export/mapgroupproto.xml` | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | Genera `storage/export/mapgrouppos.xml` | `GetCEApi().LootExportMap()` |
| **Export Clusters** | Genera `storage/export/mapgroupcluster.xml` | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | Esporta l'economia in `storage/log/economy.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | Esporta la coda di respawn in `storage/log/respawn_queue.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Combinazioni di tasti per Edit Volume:**

| Tasto | Funzione |
|-----|----------|
| **[** | Itera all'indietro tra i contenitori |
| **]** | Itera in avanti tra i contenitori |
| **LMB** | Inserisci nuovo punto |
| **RMB** | Elimina punto |
| **;** | Aumenta dimensione del punto |
| **'** | Diminuisci dimensione del punto |
| **Insert** | Genera loot al punto |
| **M** | Genera 48 "AmmoBox_762x54_20Rnd" |
| **Backspace** | Contrassegna il loot vicino per la pulizia (esaurisce la durata, non istantaneo) |

#### Loot Tool

| Opzione | Descrizione | Equivalente Script |
|--------|-------------|-------------------|
| **Deplete Lifetime** | Esaurisce la durata a 3 secondi (programmato per la pulizia) | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | Imposta la salute a 0 | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | Esegue entrambe le azioni sopra | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | Attiva/disattiva l'evitamento giocatore (rilevamento di giocatori vicini) | -- |
| **Project Target Loot** | Emula lo spawn dell'oggetto puntato, genera immagini e log. Richiede "Loot Vis" abilitato | `GetCEApi().SpawnAnalyze()` e `GetCEApi().EconomyMap()` |

#### Infected

| Opzione | Descrizione | Equivalente Script |
|--------|-------------|-------------------|
| **Infected Vis** | Visualizza le zone zombie, le posizioni, lo stato vivo/morto | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | Debug a schermo quando la telecamera è dentro una zona infetta | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | Genera infetti nella zona selezionata (o "InfectedArmy" al cursore) | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | Imposta il timer di pulizia a 3 secondi | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| Opzione | Descrizione | Equivalente Script |
|--------|-------------|-------------------|
| **Animal Vis** | Visualizza le zone animali, le posizioni, lo stato vivo/morto | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | Genera un animale nella zona selezionata (o "AnimalGoat" al cursore) | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | Genera "AmbientHen" al bersaglio del cursore | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

**Building Stats** mostra il debug a schermo sugli stati delle porte degli edifici:

- Lato sinistro: se ogni porta è aperta/chiusa e libera/bloccata
- Centro: statistiche riguardanti `buildings.bin` (persistenza degli edifici)

La randomizzazione delle porte usa il valore config `initOpened`. Quando `rand < initOpened`, la porta appare aperta (quindi `initOpened=0` significa che le porte non appaiono mai aperte).

Configurazioni comuni di `<building/>` in economy.xml:

| Configurazione | Comportamento |
|-------|----------|
| `init="0" load="0" respawn="0" save="0"` | Nessuna persistenza, nessuna randomizzazione, stato predefinito dopo il riavvio |
| `init="1" load="0" respawn="0" save="0"` | Nessuna persistenza, porte randomizzate da initOpened |
| `init="1" load="1" respawn="0" save="1"` | Salva solo le porte bloccate, porte randomizzate da initOpened |
| `init="0" load="1" respawn="0" save="1"` | Persistenza completa, salva lo stato esatto delle porte, nessuna randomizzazione |

#### Altri Strumenti dell'Economia Centrale

| Opzione | Descrizione | Equivalente Script |
|--------|-------------|-------------------|
| **Vehicle&Wreck Vis** | Visualizza gli oggetti registrati all'evitamento "Vehicle". Giallo = Auto, Rosa = Relitti (Building), Blu = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | Dati Economici a schermo per qualsiasi cosa guardi (loot, infetti, eventi dinamici) | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | Statistiche Trajectory DE a schermo | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | Statistiche DE a schermo | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | Visualizza e modifica i punti di spawn DE | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | Genera un evento dinamico al punto più vicino o "StaticChristmasTree" come fallback | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | Esporta i punti DE in `storage/export/eventSpawn_CLASSNAME.xml` | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | Statistiche CE a schermo | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | Mostra cosa sta attualmente elaborando la CE | -- |
| **Idle Mode** | Mette la CE in pausa (ferma l'elaborazione) | -- |
| **Force Save** | Forza il salvataggio dell'intera cartella `storage/data` (esclude il database giocatori) | -- |

**Combinazioni di tasti per Dynamic Events Vis:**

| Tasto | Funzione |
|-----|----------|
| **[** | Itera all'indietro tra i DE disponibili |
| **]** | Itera in avanti tra i DE disponibili |
| **LMB** | Inserisci nuovo punto per il DE selezionato |
| **RMB** | Elimina il punto più vicino al cursore |
| **MMB** | Tieni premuto o clicca per ruotare l'angolo |

---

## AI

### Struttura del Menu

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **Importante:** Il debug dell'IA attualmente non funziona in un ambiente multigiocatore.

### Show NavMesh

Disegna forme di debug per visualizzare la mesh di navigazione. Mostra un debug a schermo con statistiche.

| Tasto | Funzione |
|-----|----------|
| **Numpad 0** | Registra "Test start" alla posizione della telecamera |
| **Numpad 1** | Rigenera il tile alla posizione della telecamera |
| **Numpad 2** | Rigenera i tile attorno alla posizione della telecamera |
| **Numpad 3** | Itera in avanti tra i tipi di visualizzazione |
| **LAlt + Numpad 3** | Itera all'indietro tra i tipi di visualizzazione |
| **Numpad 4** | Registra "Test end" alla posizione della telecamera. Disegna sfere e una linea tra inizio e fine. Verde = percorso trovato, Rosso = nessun percorso |
| **Numpad 5** | Test posizione più vicina NavMesh (SamplePosition). Sfera blu = query, sfera rosa = risultato |
| **Numpad 6** | Test raycast NavMesh. Sfera blu = query, sfera rosa = risultato |

### Debug Pathgraph World

Debug a schermo che mostra quante richieste di job di percorso sono state completate e quante sono attualmente in sospeso.

### Debug Path Agent

Debug a schermo e forme di debug per il pathfinding di un'IA. Punta un'entità IA per selezionarla per il tracciamento. Usa questo quando sei specificamente interessato a come un'IA trova il suo percorso.

### Debug AI Agent

Debug a schermo e forme di debug per l'allerta e il comportamento di un'IA. Punta un'entità IA per selezionarla per il tracciamento. Usa questo quando vuoi capire le decisioni e lo stato di consapevolezza di un'IA.

---

## Sounds

### Struttura del Menu

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

Visualizzazione di debug per i suoni attualmente in riproduzione.

| Opzione | Descrizione |
|--------|-------------|
| **none** | Predefinito, nessun debug |
| **ImGui** | Finestra separata (iterazione più recente). Supporta il filtraggio, copertura completa delle categorie. Impostazioni salvate come `playing_sounds_imgui.ini` / `.bin` nei profili |
| **DbgUI** | Legacy. Ha il filtraggio per categorie, più leggibile, ma esce dallo schermo e manca la categoria veicoli |
| **Engine** | Legacy. Mostra dati in tempo reale codificati per colore con statistiche, ma esce dallo schermo e non ha legenda dei colori |

### Show System Info

Statistiche di debug a schermo del sistema audio (conteggio buffer, sorgenti attive, ecc.).

---

## Funzionalità Utili per i Modder

Mentre ogni opzione ha il suo utilizzo, queste sono quelle a cui i modder ricorrono più frequentemente:

### Analisi delle Prestazioni

1. **Contatore FPS** (LCtrl + Numpad 1) -- Controllo rapido che la tua mod non stia distruggendo il frame rate
2. **Profilatore Script** -- Trova quali delle tue classi o funzioni consumano più tempo CPU. Imposta il modulo su WORLD o MISSION per concentrarti sul livello script della tua mod

### Debug Visivo

1. **Telecamera Libera** -- Vola in giro per ispezionare oggetti generati, verificare posizioni, controllare il comportamento dell'IA da distanza
2. **Geometry Diagnostic** -- Verifica la fire geometry, view geometry, roadway LOD e memory points del tuo modello personalizzato senza uscire dal gioco
3. **Render Debug Mode** (RCtrl + RAlt + W) -- Vedi overlay wireframe per controllare la densità dei mesh e le assegnazioni dei materiali

### Test del Gameplay

1. **Telecamera Libera + Insert** -- Teletrasporta il tuo giocatore ovunque nella mappa istantaneamente
2. **Override Meteo** -- Forza condizioni di nebbia specifiche per testare funzionalità dipendenti dalla visibilità
3. **Strumenti Economia Centrale** -- Genera infetti, animali, loot ed eventi dinamici su richiesta
4. **Debug combattimento** -- Traccia le traiettorie degli spari, ispeziona i sistemi di danno degli hitpoint, testa la penetrazione delle esplosioni

### Sviluppo IA

1. **Show NavMesh** -- Verifica che l'IA possa effettivamente navigare dove ti aspetti
2. **Debug AI Agent** -- Vedi cosa sta pensando un infetto o animale, a che livello di allerta si trova
3. **Debug Path Agent** -- Vedi il percorso effettivo che un'IA sta seguendo e se il pathfinding ha successo

---

## Quando Usare il Diag Menu

### Durante lo Sviluppo

- **Profilatore Script** quando ottimizzi il codice per-frame (OnUpdate, EOnFrame)
- **Telecamera Libera** per posizionare oggetti, verificare posizioni di spawn, ispezionare il posizionamento dei modelli
- **Geometry Diagnostic** immediatamente dopo l'importazione di un nuovo modello per verificare i LOD e i tipi di geometria
- **Contatore FPS** come linea di base prima e dopo l'aggiunta di nuove funzionalità

### Durante il Testing

- **Debug combattimento** per verificare danni delle armi, comportamento dei proiettili, effetti delle esplosioni
- **Strumenti CE** per testare la distribuzione del loot, i punti di spawn, gli eventi dinamici
- **Debug IA** per verificare che il comportamento degli infetti/animali risponda correttamente alla presenza del giocatore
- **Debug meteo** per testare la tua mod in diverse condizioni meteorologiche

### Durante l'Investigazione dei Bug

- **Contatore FPS + Profilatore Script** quando i giocatori segnalano problemi di prestazioni
- **Telecamera Libera + Barra spaziatrice** (debug oggetto) per ispezionare oggetti che non si comportano correttamente
- **Render Debug Mode** per diagnosticare artefatti visivi o problemi con i materiali
- **Show Bullet** per il debug dei problemi di collisione fisica

---

## Errori Comuni

**Usare l'eseguibile retail.** Il Diag Menu è disponibile solo in `DayZDiag_x64.exe`. Se premi Win+Alt e non succede nulla, stai usando la build retail.

**Dimenticare che Max. Collider Distance è 0.** La visualizzazione della fisica (Draw Bullet shape) non mostrerà nulla se Max. Collider Distance è ancora al suo valore predefinito di 0. Impostalo almeno a 10-20 per vedere i collider intorno a te.

**Strumenti CE in multigiocatore.** La maggior parte delle opzioni di debug dell'Economia Centrale funziona solo in single-player con la CE abilitata. Non aspettarti che funzionino su un server dedicato.

**Debug IA in multigiocatore.** Il debug dell'IA attualmente non funziona in un ambiente multigiocatore. Testa il comportamento dell'IA in single-player.

**Confondere "Bullet" con le munizioni.** Le opzioni "Bullet" della categoria "Enfusion World" si riferiscono al motore fisico Bullet, non alle munizioni delle armi. Il debug relativo al combattimento si trova sotto Game > Combat.

**Lasciare il profilatore attivo.** Il Profilatore Script ha un overhead misurabile. Disattivalo quando hai finito la profilazione per ottenere letture FPS accurate.

**Valori di distanza collider grandi.** Impostare Max. Collider Distance a 200 o 500 distruggerà il tuo frame rate. Usa il valore più piccolo che copra la tua area di interesse.

**Non abilitare i prerequisiti.** Diverse opzioni dipendono da altre che devono essere abilitate prima:
- "Draw Char Ctrl" e "Draw Bullet wireframe" dipendono da "Draw Bullet shape"
- "Edit Volume" richiede la telecamera libera
- "Project Target Loot" richiede che "Loot Vis" sia abilitato

---

## Prossimi Passi

- **Capitolo 8.6: [Debugging & Testing](06-debugging-testing.md)** -- Log degli script, debug con Print, file patching e Workbench
- **Capitolo 8.7: [Pubblicare sul Workshop](07-publishing-workshop.md)** -- Impacchetta e pubblica la tua mod testata
