# Capitolo 4.8: Modellazione di Edifici -- Porte e Scale

[Home](../README.md) | [<< Precedente: Guida a Workbench](07-workbench-guide.md) | **Modellazione di Edifici**

---

## Introduzione

Gli edifici in DayZ sono più di semplici scenografie statiche. I giocatori interagiscono costantemente con essi -- aprendo porte, salendo scale, riparandosi dietro i muri. Creare un edificio personalizzato che supporti queste interazioni richiede un'attenta configurazione del modello: le porte necessitano di assi di rotazione e selezioni nominate su più LOD, le scale necessitano di percorsi di arrampicata posizionati con precisione definiti interamente attraverso i vertici del Memory LOD.

Questo capitolo copre il flusso di lavoro completo per aggiungere porte interattive e scale scalabili ai modelli di edifici personalizzati, basato sulla documentazione ufficiale di Bohemia Interactive.

### Prerequisiti

- Un **Work-drive** funzionante con la struttura delle cartelle della tua mod personalizzata.
- **Object Builder** (dal pacchetto DayZ Tools) con **Buldozer** (anteprima del modello) configurato.
- La capacità di binarizzare e impacchettare i file della mod personalizzata in PBO.
- Familiarità con il sistema LOD e le selezioni nominate (trattate nel [Capitolo 4.2: Modelli 3D](02-models.md)).

---

## Indice dei Contenuti

- [Panoramica](#introduzione)
- [Configurazione delle Porte](#configurazione-delle-porte)
  - [Configurazione del Modello](#configurazione-del-modello-per-le-porte)
  - [model.cfg -- Scheletri e Animazioni](#modelcfg----scheletri-e-animazioni)
  - [Config di Gioco (config.cpp)](#config-di-gioco-configcpp)
  - [Porte Doppie](#porte-doppie)
  - [Porte Scorrevoli](#porte-scorrevoli)
  - [Problemi della Sfera di Delimitazione](#problemi-della-sfera-di-delimitazione)
- [Configurazione delle Scale](#configurazione-delle-scale)
  - [Tipi di Scale Supportati](#tipi-di-scale-supportati)
  - [Selezioni Nominate del Memory LOD](#selezioni-nominate-del-memory-lod)
  - [Requisiti della View Geometry](#requisiti-della-view-geometry)
  - [Dimensioni delle Scale](#dimensioni-delle-scale)
  - [Spazio di Collisione](#spazio-di-collisione)
  - [Requisiti di Configurazione per le Scale](#requisiti-di-configurazione-per-le-scale)
- [Riepilogo dei Requisiti del Modello](#riepilogo-dei-requisiti-del-modello)
- [Buone Pratiche](#buone-pratiche)
- [Errori Comuni](#errori-comuni)
- [Riferimenti](#riferimenti)

---

## Configurazione delle Porte

Le porte interattive richiedono che tre elementi si combinino: il modello P3D con selezioni nominate e punti di memoria correttamente denominati, un `model.cfg` che definisce lo scheletro dell'animazione e i parametri di rotazione, e un `config.cpp` di gioco che collega la porta ai suoni, alle zone di danno e alla logica di gioco.

### Configurazione del Modello per le Porte

Una porta nel modello P3D deve includere i seguenti elementi:

1. **Selezioni nominate su tutti i LOD rilevanti.** La geometria che rappresenta la porta deve essere assegnata a una selezione nominata (es. `door1`) in ciascuno di questi LOD:
   - **Resolution LOD** -- la mesh visiva che il giocatore vede.
   - **Geometry LOD** -- la forma di collisione fisica. Deve anche contenere una proprietà nominata `class` con il valore `house`.
   - **View Geometry LOD** -- usato per i controlli di visibilità e il ray-casting delle azioni. Il nome della selezione qui corrisponde al parametro `component` nel config di gioco.
   - **Fire Geometry LOD** -- usato per il rilevamento dei colpi balistici.

2. **Vertici del Memory LOD** che definiscono:
   - **Asse di rotazione** -- Due vertici che formano l'asse di rotazione, assegnati a una selezione nominata come `door1_axis`. Questo asse definisce la linea del cardine attorno alla quale la porta ruota.
   - **Posizione del suono** -- Un vertice assegnato a una selezione nominata come `door1_action`, che segna dove originano i suoni della porta.
   - **Posizione del widget di azione** -- Dove il widget di interazione viene mostrato al giocatore.

#### Dimensioni Raccomandate per le Porte

Quasi tutte le porte nel DayZ vanilla sono **120 x 220 cm** (larghezza x altezza). Usare queste dimensioni standard assicura che le animazioni appaiano corrette e che i personaggi passino attraverso le aperture in modo naturale. Modella le tue porte **chiuse per impostazione predefinita** e animale nella posizione aperta -- Bohemia prevede di supportare porte che si aprono in entrambe le direzioni in futuro.

### model.cfg -- Scheletri e Animazioni

Qualsiasi porta animata richiede un file `model.cfg`. Questo config definisce la struttura ossea (scheletro) e i parametri dell'animazione. Posiziona il `model.cfg` vicino al tuo file modello, o più in alto nella struttura delle cartelle -- la posizione esatta è flessibile purché il binarizzatore possa trovarlo.

Il `model.cfg` ha due sezioni:

#### CfgSkeletons

Definisce le ossa animate. Ogni porta ottiene una voce di osso. Le ossa sono elencate in coppie: il nome dell'osso seguito dal suo genitore (stringa vuota `""` per le ossa di livello radice).

```cpp
class CfgSkeletons
{
    class Default
    {
        isDiscrete = 1;
        skeletonInherit = "";
        skeletonBones[] = {};
    };
    class Skeleton_2door: Default
    {
        skeletonInherit = "Default";
        skeletonBones[] =
        {
            "door1", "",
            "door2", ""
        };
    };
};
```

#### CfgModels

Definisce le animazioni per ogni osso. Il nome della classe sotto `CfgModels` **deve corrispondere al nome del file del tuo modello** (senza estensione) affinché il collegamento funzioni.

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };
    class yourmodelname: Default
    {
        skeletonName = "Skeleton_2door";
        class Animations
        {
            class Door1
            {
                type = "rotation";
                selection = "door1";
                source = "door1";
                axis = "door1_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = 1.4;
            };
            class Door2
            {
                type = "rotation";
                selection = "door2";
                source = "door2";
                axis = "door2_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -1.4;
            };
        };
    };
};
```

**Spiegazione dei parametri chiave:**

| Parametro | Descrizione |
|-----------|-------------|
| `type` | Tipo di animazione. Usa `"rotation"` per porte a battente, `"translation"` per porte scorrevoli. |
| `selection` | La selezione nominata nel modello che deve essere animata. |
| `source` | Si collega alla classe `Doors` del config di gioco. Deve corrispondere al nome della classe nel `config.cpp`. |
| `axis` | Selezione nominata nel Memory LOD che definisce l'asse di rotazione (due vertici). |
| `memory` | Impostato su `1` per indicare che l'asse è definito nel Memory LOD. |
| `minValue` / `maxValue` | Intervallo della fase di animazione. Tipicamente da `0` a `1`. |
| `angle0` / `angle1` | Angoli di rotazione in **radianti**. `angle1` definisce quanto si apre la porta. Usa valori negativi per invertire la direzione. Un valore di `1.4` radianti corrisponde approssimativamente a 80 gradi. |

#### Verifica in Buldozer

Dopo aver scritto il `model.cfg`, apri il tuo modello in Object Builder con Buldozer in esecuzione. Usa i tasti `[` e `]` per scorrere le sorgenti di animazione disponibili, e `;` / `'` (o la rotella del mouse su/giù) per avanzare o arretrare l'animazione. Questo ti permette di verificare che la porta ruoti correttamente sul suo asse.

### Config di Gioco (config.cpp)

Il config di gioco collega il modello animato ai sistemi di gioco -- suoni, danni e logica dello stato della porta. Il nome della classe nel config **deve** seguire il pattern `land_nomemodello` per collegarsi correttamente al modello.

```cpp
class CfgPatches
{
    class yourcustombuilding
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
        author = "yourname";
        name = "addonname";
        url = "";
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class land_modelname: HouseNoDestruct
    {
        model = "\path\to\your\model\file.p3d";
        class Doors
        {
            class Door1
            {
                displayName = "door 1";
                component = "Door1";
                soundPos = "door1_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
            class Door2
            {
                displayName = "door 2";
                component = "Door2";
                soundPos = "door2_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
        };
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                };
            };
            class GlobalArmor
            {
                class Projectile
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
                class Melee
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
            };
            class DamageZones
            {
                class Door1
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door1"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
                class Door2
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door2"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
            };
        };
    };
};
```

**Spiegazione dei parametri di configurazione delle porte:**

| Parametro | Descrizione |
|-----------|-------------|
| `component` | Selezione nominata nel **View Geometry LOD** usata per questa porta. |
| `soundPos` | Selezione nominata nel **Memory LOD** dove vengono riprodotti i suoni della porta. |
| `animPeriod` | Velocità dell'animazione della porta (in secondi). |
| `initPhase` | Fase iniziale dell'animazione (`0` = chiusa, `1` = completamente aperta). Testa in Buldozer per verificare quale valore corrisponde a quale stato. |
| `initOpened` | Probabilità che la porta venga generata aperta nel mondo. `0.5` significa il 50% di probabilità. |
| `soundOpen` | Classe sonora da `CfgActionSounds` riprodotta quando la porta si apre. Vedi `DZ\sounds\hpp\config.cpp` per i set di suoni disponibili. |
| `soundClose` | Classe sonora riprodotta quando la porta si chiude. |
| `soundLocked` | Classe sonora riprodotta quando un giocatore tenta di aprire una porta chiusa a chiave. |
| `soundOpenABit` | Classe sonora riprodotta quando un giocatore forza l'apertura di una porta chiusa a chiave. |

**Note importanti sulla configurazione:**

- Tutti gli edifici in DayZ ereditano da `HouseNoDestruct`.
- Ogni nome di classe sotto `class Doors` deve corrispondere al parametro `source` definito nel `model.cfg`.
- La sezione `DamageSystem` deve includere una sottoclasse `DamageZones` per ogni porta. L'array `componentNames[]` fa riferimento alla selezione nominata dal Fire Geometry LOD del modello.
- Aggiungere la proprietà nominata `class=house` e una classe di config di gioco richiede che il tuo terreno venga ri-binarizzato (i percorsi dei modelli nei file `.wrp` vengono sostituiti con riferimenti alla classe del config di gioco).

### Porte Doppie

Le porte doppie (due ante che si aprono insieme da una singola interazione) sono comuni in DayZ. Richiedono una configurazione speciale:

**Nel modello:**
- Configura ogni anta come una porta individuale con la propria selezione nominata (es. `door3_1` e `door3_2`).
- Nel **Memory LOD**, il punto di azione deve essere **condiviso** tra le due ante -- usa una selezione nominata e un vertice per la posizione dell'azione.
- La selezione nominata senza suffisso (es. `door3` senza suffisso dell'anta) deve coprire **entrambe** le maniglie delle porte.
- La **View Geometry** e la **Fire Geometry** richiedono una selezione nominata aggiuntiva che copra entrambe le ante insieme.

**Nel model.cfg:**
- Definisci ogni anta come una classe di animazione separata, ma imposta lo **stesso parametro `source`** per entrambe le ante (es. `"doors34"` per entrambe).
- Imposta `angle1` su un valore **positivo** per un'anta e **negativo** per l'altra, in modo che ruotino in direzioni opposte.

**Nel config.cpp:**
- Definisci solo **una** classe sotto `class Doors`, con il suo nome che corrisponde al parametro `source` condiviso.
- Analogamente, definisci solo **una** voce in `DamageZones` per la coppia di porte doppie.

### Porte Scorrevoli

Per le porte che scorrono lungo un binario invece di ruotare (come le porte dei fienili o i pannelli scorrevoli), cambia il `type` dell'animazione nel `model.cfg` da `"rotation"` a `"translation"`. I vertici dell'asse nel Memory LOD definiscono allora la direzione di spostamento invece della linea di rotazione.

### Problemi della Sfera di Delimitazione

Per impostazione predefinita, la sfera di delimitazione di un modello è dimensionata per contenere l'intero oggetto. Quando le porte sono modellate in posizione chiusa, la posizione aperta può estendersi **al di fuori** di questa sfera di delimitazione. Questo causa problemi:

- **Le azioni smettono di funzionare** -- il ray-casting per le interazioni con le porte fallisce da certi angoli.
- **La balistica ignora la porta** -- i proiettili passano attraverso la geometria che si trova al di fuori della sfera di delimitazione.

**Soluzione:** Crea una selezione nominata nel Memory LOD che copra l'area più ampia occupata dall'edificio quando le porte sono completamente aperte. Poi aggiungi un parametro `bounding` alla tua classe di config di gioco:

```cpp
class land_modelname: HouseNoDestruct
{
    bounding = "selection_name";
    // ... resto del config
};
```

Questo sovrascrive il calcolo automatico della sfera di delimitazione con uno che comprende tutte le posizioni delle porte.

---

## Configurazione delle Scale

A differenza delle porte, le scale in DayZ non richiedono **nessuna configurazione di animazione** e **nessuna voce speciale nel config di gioco** oltre alla classe base dell'edificio. L'intera configurazione delle scale viene fatta attraverso il posizionamento dei vertici nel Memory LOD e una selezione nella View Geometry. Questo rende le scale più semplici da configurare rispetto alle porte, ma il posizionamento dei vertici deve essere preciso.

### Tipi di Scale Supportati

DayZ supporta due tipi di scale:

1. **Ingresso frontale dal basso con uscita laterale in alto** -- Il giocatore si avvicina frontalmente dal basso ed esce lateralmente in alto (contro un muro).
2. **Ingresso frontale dal basso con uscita frontale in alto** -- Il giocatore si avvicina frontalmente dal basso ed esce in avanti in alto (su un tetto o una piattaforma).

Entrambi i tipi supportano anche **punti di ingresso e uscita laterali intermedi**, permettendo ai giocatori di salire e scendere dalla scala ai piani intermedi. Le scale possono anche essere posizionate **in angolo** piuttosto che strettamente verticali.

### Selezioni Nominate del Memory LOD

La scala è definita interamente da vertici nominati nel Memory LOD. Ogni nome di selezione inizia con `ladderN_` dove **N** è l'ID della scala, a partire da `1`. Un edificio può avere più scale (`ladder1_`, `ladder2_`, `ladder3_`, ecc.).

Ecco il set completo di selezioni nominate per una scala:

| Selezione Nominata | Descrizione |
|---------------------|-------------|
| `ladderN_bottom_front` | Definisce il gradino di ingresso inferiore -- dove il giocatore inizia a salire. |
| `ladderN_middle_left` | Definisce un punto di ingresso/uscita intermedio (lato sinistro). Può contenere più vertici se la scala passa per più piani. |
| `ladderN_middle_right` | Definisce un punto di ingresso/uscita intermedio (lato destro). Può contenere più vertici per scale multi-piano. |
| `ladderN_top_front` | Definisce il gradino di uscita superiore -- dove il giocatore finisce di salire (tipo uscita frontale). |
| `ladderN_top_left` | Definisce la direzione di uscita superiore per le scale a muro (lato sinistro). Deve essere almeno **5 gradini di scala più in alto** del piano (approssimativamente l'altezza di un giocatore in piedi su una scala). |
| `ladderN_top_right` | Definisce la direzione di uscita superiore per le scale a muro (lato destro). Stesso requisito di altezza di `top_left`. |
| `ladderN` | Definisce dove il widget dell'azione "Entra nella Scala" appare al giocatore. |
| `ladderN_dir` | Definisce la direzione da cui la scala può essere salita (direzione di avvicinamento). |
| `ladderN_con` | Il punto di misurazione per l'azione di ingresso. **Deve essere posizionato al livello del pavimento.** |
| `ladderN_con_dir` | Definisce la direzione di un cono di 180 gradi (originante da `ladderN_con`) entro il quale l'azione per entrare nella scala è disponibile. |

Ognuno di questi è un vertice (o un set di vertici per i punti intermedi) che posizioni manualmente nel Memory LOD di Object Builder.

### Requisiti della View Geometry

Oltre alla configurazione del Memory LOD, devi creare un componente di **View Geometry** con una selezione nominata chiamata `ladderN`. Questa selezione deve coprire l'**intero volume** della scala -- l'intera altezza e larghezza dell'area scalabile. Senza questa selezione nella View Geometry, la scala non funzionerà correttamente.

### Dimensioni delle Scale

Le animazioni di arrampicata sono progettate per **dimensioni fisse**. I pioli e la spaziatura della tua scala dovrebbero corrispondere alle proporzioni vanilla delle scale per assicurare che le animazioni si allineino correttamente. Fai riferimento al repository ufficiale DayZ Samples per le misure esatte -- le parti di scala campione sono le stesse usate sulla maggior parte degli edifici vanilla.

### Spazio di Collisione

I personaggi **collidono con la geometria mentre salgono una scala**. Questo significa che devi assicurarti che ci sia abbastanza spazio libero intorno alla scala per il personaggio che sale sia nella:

- **Geometry LOD** -- collisione fisica.
- **Roadway LOD** -- interazione con le superfici.

Se lo spazio è troppo stretto, il personaggio si compenetrerà nei muri o rimarrà bloccato durante l'animazione di arrampicata.

### Requisiti di Configurazione per le Scale

A differenza della serie Arma, DayZ **non** richiede un array `ladders[]` nella classe di config di gioco. Tuttavia, due cose sono ancora necessarie:

1. Il tuo modello deve avere una **rappresentazione nel config** -- un `config.cpp` con una classe `CfgVehicles` (la stessa classe base usata per le porte; vedi la sezione sulla configurazione delle porte sopra).
2. La **Geometry LOD** deve contenere la proprietà nominata `class` con il valore `house`.

Oltre a questi due requisiti, la scala è completamente definita dai vertici del Memory LOD e dalla selezione della View Geometry. Non sono necessarie voci di animazione nel `model.cfg`.

---

## Riepilogo dei Requisiti del Modello

Gli edifici con porte e scale devono includere diversi LOD, ognuno con uno scopo distinto. La tabella seguente riassume cosa deve contenere ogni LOD:

| LOD | Scopo | Requisiti Porte | Requisiti Scale |
|-----|-------|-----------------|-----------------|
| **Resolution LOD** | Mesh visiva mostrata al giocatore. | Selezione nominata per la geometria della porta (es. `door1`). | Nessun requisito specifico. |
| **Geometry LOD** | Rilevamento delle collisioni fisiche. | Selezione nominata per la geometria della porta. Proprietà nominata `class = "house"`. | Proprietà nominata `class = "house"`. Spazio sufficiente intorno alla scala per i personaggi che salgono. |
| **Fire Geometry LOD** | Rilevamento dei colpi balistici (proiettili). | Selezione nominata corrispondente a `componentNames[]` nella configurazione della zona di danno. | Nessun requisito specifico. |
| **View Geometry LOD** | Controlli di visibilità, ray-casting delle azioni. | Selezione nominata corrispondente al parametro `component` nella configurazione della porta. | Selezione nominata `ladderN` che copra l'intero volume della scala. |
| **Memory LOD** | Definizioni degli assi, punti di azione, posizioni dei suoni. | Vertici dell'asse (`door1_axis`), posizione del suono (`door1_action`), posizione del widget di azione. | Set completo di vertici della scala (`ladderN_bottom_front`, `ladderN_top_left`, `ladderN_dir`, `ladderN_con`, ecc.). |
| **Roadway LOD** | Interazione delle superfici per i personaggi. | Tipicamente non richiesto. | Spazio sufficiente intorno alla scala per i personaggi che salgono. |

### Coerenza delle Selezioni Nominate

Un requisito critico è che **le selezioni nominate devono essere coerenti su tutti i LOD** che le referenziano. Se una selezione si chiama `door1` nel Resolution LOD, deve anche essere `door1` nei LOD Geometry, Fire Geometry e View Geometry. Nomi non corrispondenti tra i LOD causeranno il fallimento silenzioso della porta o della scala.

---

## Buone Pratiche

1. **Modella le porte chiuse per impostazione predefinita.** Anima dalla posizione chiusa a quella aperta. Bohemia prevede di supportare l'apertura delle porte in entrambe le direzioni, quindi partire dalla posizione chiusa è a prova di futuro.

2. **Usa dimensioni standard per le porte.** Mantieni 120 x 220 cm per le aperture delle porte a meno che tu non abbia un motivo specifico di design. Questo corrisponde agli edifici vanilla e assicura che le animazioni dei personaggi appaiano corrette.

3. **Testa le animazioni in Buldozer prima dell'impacchettamento.** Usa `[` / `]` per scorrere le sorgenti e `;` / `'` o la rotella del mouse per scorrere l'animazione. Individuare errori di asse o angolo qui fa risparmiare tempo significativo.

4. **Sovrascrivi le sfere di delimitazione per gli edifici grandi.** Se il tuo edificio ha porte che si aprono verso l'esterno in modo significativo, crea una selezione nel Memory LOD che copra l'intera estensione animata e collegala con il parametro `bounding` nel config.

5. **Posiziona i vertici delle scale con precisione.** Le animazioni di arrampicata sono fissate a dimensioni specifiche. Vertici troppo distanti o disallineati causeranno al personaggio di galleggiare, compenetrarsi o rimanere bloccato.

6. **Assicura lo spazio intorno alle scale.** Lascia abbastanza spazio nei LOD Geometry e Roadway per il modello del personaggio durante l'arrampicata.

7. **Mantieni un `model.cfg` per modello o per cartella.** Il `model.cfg` non deve per forza trovarsi accanto al file `.p3d`, ma tenerli vicini facilita l'organizzazione. Può anche essere posizionato più in alto nella struttura delle cartelle per coprire più modelli.

8. **Usa il repository DayZ Samples.** Bohemia fornisce campioni funzionanti sia per le porte (`Test_Building`) che per le scale (`Test_Ladders`) su `https://github.com/BohemiaInteractive/DayZ-Samples`. Studiali prima di costruire i tuoi.

9. **Ri-binarizza il terreno dopo aver aggiunto i config degli edifici.** Aggiungere `class=house` e una classe di config di gioco significa che i percorsi dei modelli nei file `.wrp` vengono sostituiti con riferimenti alle classi. Il tuo terreno deve essere ri-binarizzato affinché questo abbia effetto.

10. **Aggiorna la navmesh dopo aver posizionato gli edifici.** Un terreno ricostruito senza una navmesh aggiornata può causare all'IA di attraversare le porte invece di usarle correttamente.

---

## Errori Comuni

### Porte

| Errore | Sintomo | Soluzione |
|--------|---------|----------|
| Il nome della classe `CfgModels` non corrisponde al nome del file del modello. | L'animazione della porta non viene riprodotta. | Rinomina la classe in modo che corrisponda esattamente al nome del file `.p3d` (senza estensione). |
| Selezione nominata mancante in uno o più LOD. | La porta è visibile ma non interattiva, oppure i proiettili la attraversano. | Assicurati che la selezione esista nei LOD Resolution, Geometry, View Geometry e Fire Geometry. |
| Vertici dell'asse mancanti o un solo vertice definito. | La porta ruota dal punto sbagliato o non ruota affatto. | Posiziona esattamente due vertici nel Memory LOD per la selezione dell'asse (es. `door1_axis`). |
| Il `source` nel `model.cfg` non corrisponde al nome della classe in `config.cpp` Doors. | La porta non è collegata alla logica di gioco -- nessun suono, nessun cambio di stato. | Assicurati che il parametro `source` e il nome della classe Doors siano identici. |
| Dimenticata la proprietà nominata `class = "house"` nel Geometry LOD. | L'edificio non viene riconosciuto come struttura interattiva. | Aggiungi la proprietà nominata nel Geometry LOD di Object Builder. |
| Sfera di delimitazione troppo piccola. | Le azioni della porta o la balistica falliscono da certi angoli. | Aggiungi una selezione `bounding` nel Memory LOD e referenziala nel config. |
| Confusione tra `angle1` negativo e positivo per le porte doppie. | Entrambe le ante ruotano nella stessa direzione e si compenetrano. | Un'anta necessita di `angle1` positivo, l'altra negativo. |

### Scale

| Errore | Sintomo | Soluzione |
|--------|---------|----------|
| `ladderN_con` non posizionato al livello del pavimento. | L'azione "Entra nella Scala" non appare o appare all'altezza sbagliata. | Sposta il vertice al livello del suolo/pavimento. |
| Selezione `ladderN` mancante nella View Geometry. | La scala non può essere utilizzata. | Crea un componente di View Geometry con una selezione nominata che copra l'intero volume della scala. |
| `ladderN_top_left` / `ladderN_top_right` troppo bassi. | Il personaggio si compenetra nel muro o nel pavimento all'uscita superiore. | Questi devono essere almeno 5 gradini di scala più in alto del livello del pavimento. |
| Spazio insufficiente nel Geometry LOD. | Il personaggio rimane bloccato o si compenetra nei muri durante l'arrampicata. | Allarga lo spazio intorno alla scala nei LOD Geometry e Roadway. |
| La numerazione delle scale parte da 0. | La scala non funziona. | La numerazione parte da `1` (`ladder1_`, non `ladder0_`). |
| Specificare `ladders[]` nel config di gioco. | Lavoro sprecato (innocuo ma non necessario). | DayZ non usa l'array `ladders[]`. Rimuovilo e affidati al posizionamento dei vertici nel Memory LOD. |

---

## Riferimenti

- [Bohemia Interactive -- Porte sugli edifici](https://community.bistudio.com/wiki/DayZ:Doors_on_buildings) (documentazione ufficiale BI)
- [Bohemia Interactive -- Scale sugli edifici](https://community.bistudio.com/wiki/DayZ:Ladders_on_buildings) (documentazione ufficiale BI)
- [DayZ Samples -- Test_Building](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Building) (campione funzionante per le porte)
- [DayZ Samples -- Test_Ladders](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Ladders) (campione funzionante per le scale)
- [Capitolo 4.2: Modelli 3D](02-models.md) -- Sistema LOD, selezioni nominate, fondamenti del `model.cfg`

---

## Navigazione

| Precedente | Su | Successivo |
|------------|-----|-----------|
| [4.7 Guida a Workbench](07-workbench-guide.md) | [Parte 4: Formati di File e DayZ Tools](01-textures.md) | -- |
