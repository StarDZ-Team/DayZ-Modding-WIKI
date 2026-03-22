# Capitolo 4.2: Modelli 3D (.p3d)

[Home](../README.md) | [<< Precedente: Texture](01-textures.md) | **Modelli 3D** | [Successivo: Materiali >>](03-materials.md)

---

## Introduzione

Ogni oggetto fisico in DayZ -- armi, abbigliamento, edifici, veicoli, alberi, rocce -- è un modello 3D memorizzato nel formato proprietario **P3D** di Bohemia. Il formato P3D è molto più di un contenitore di mesh: codifica più livelli di dettaglio, geometria di collisione, selezioni per animazioni, punti di memoria per attacchi ed effetti, e posizioni proxy per oggetti montabili. Comprendere come funzionano i file P3D e come crearli con **Object Builder** è essenziale per qualsiasi mod che aggiunge oggetti fisici al mondo di gioco.

Questo capitolo copre la struttura del formato P3D, il sistema LOD, le selezioni nominate, i punti di memoria, il sistema proxy, la configurazione delle animazioni tramite `model.cfg` e il flusso di lavoro di importazione da formati 3D standard.

---

## Indice dei Contenuti

- [Panoramica del Formato P3D](#panoramica-del-formato-p3d)
- [Object Builder](#object-builder)
- [Il Sistema LOD](#il-sistema-lod)
- [Selezioni Nominate](#selezioni-nominate)
- [Punti di Memoria](#punti-di-memoria)
- [Il Sistema Proxy](#il-sistema-proxy)
- [Model.cfg per le Animazioni](#modelcfg-per-le-animazioni)
- [Importazione da FBX/OBJ](#importazione-da-fbxobj)
- [Tipi di Modelli Comuni](#tipi-di-modelli-comuni)
- [Errori Comuni](#errori-comuni)
- [Buone Pratiche](#buone-pratiche)

---

## Panoramica del Formato P3D

**P3D** (Point 3D) è il formato di modello 3D binario di Bohemia Interactive, ereditato dal motore Real Virtuality e portato avanti in Enfusion. È un formato compilato, pronto per il motore -- non scrivi file P3D a mano.

### Caratteristiche Principali

- **Formato binario:** Non leggibile dall'uomo. Creato e modificato esclusivamente con Object Builder.
- **Contenitore multi-LOD:** Un singolo file P3D contiene più mesh LOD (Livello di Dettaglio), ognuna con uno scopo diverso.
- **Nativo del motore:** Il motore DayZ carica P3D direttamente. Nessuna conversione a runtime.
- **Binarizzato vs. non binarizzato:** I file P3D sorgente da Object Builder sono "MLOD" (modificabili). Binarize li converte in "ODOL" (ottimizzati, sola lettura). Il gioco può caricare entrambi, ma ODOL si carica più velocemente ed è più piccolo.

### Tipi di File che Incontrerai

| Estensione | Descrizione |
|-----------|-------------|
| `.p3d` | Modello 3D (sia MLOD sorgente che ODOL binarizzato) |
| `.rtm` | Runtime Motion -- dati keyframe delle animazioni |
| `.bisurf` | File proprietà superficiali (usato insieme al P3D) |

### MLOD vs. ODOL

| Proprietà | MLOD (Sorgente) | ODOL (Binarizzato) |
|----------|---------------|-------------------|
| Creato da | Object Builder | Binarize |
| Modificabile | Sì | No |
| Dimensione file | Più grande | Più piccola |
| Velocità di caricamento | Più lenta | Più veloce |
| Usato durante | Sviluppo | Rilascio |
| Contiene | Dati di modifica completi, selezioni nominate | Dati mesh ottimizzati |

> **Importante:** Quando impacchetti un PBO con la binarizzazione abilitata, i tuoi file P3D MLOD vengono automaticamente convertiti in ODOL. Se impacchetti con `-packonly`, i file MLOD vengono inclusi così come sono. Entrambi funzionano nel gioco, ma ODOL è preferito per le build di rilascio.

---

## Object Builder

**Object Builder** è lo strumento fornito da Bohemia per creare e modificare modelli P3D. È incluso nella suite DayZ Tools su Steam.

### Funzionalità Principali

- Crea e modifica mesh 3D con vertici, spigoli e facce.
- Definisci più LOD all'interno di un singolo file P3D.
- Assegna **selezioni nominate** (gruppi di vertici/facce) per animazioni e controllo texture.
- Posiziona **punti di memoria** per posizioni di attacco, origini particelle e sorgenti sonore.
- Aggiungi **oggetti proxy** per oggetti collegabili (caricatori, ottiche, ecc.).
- Assegna materiali (`.rvmat`) e texture (`.paa`) alle facce.
- Importa mesh da formati FBX, OBJ e 3DS.
- Esporta file P3D validati per Binarize.

### Configurazione del Workspace

Object Builder richiede il **drive P:** (workdrive) configurato. Questo drive virtuale fornisce un prefisso di percorso unificato che il motore usa per localizzare gli asset.

```
P:\
  DZ\                        <-- Dati vanilla DayZ (estratti)
  DayZ Tools\                <-- Installazione strumenti
  MyMod\                     <-- Directory sorgente della tua mod
    data\
      models\
        my_item.p3d
      textures\
        my_item_co.paa
```

Tutti i percorsi nei file P3D e nei materiali sono relativi alla radice del drive P:. Ad esempio, un riferimento a un materiale all'interno del modello sarebbe `MyMod\data\textures\my_item_co.paa`.

### Flusso di Lavoro Base in Object Builder

1. **Crea o importa** la tua geometria mesh.
2. **Definisci i LOD** -- come minimo, crea LOD Resolution, Geometry e Fire Geometry.
3. **Assegna materiali** alle facce nel LOD Resolution.
4. **Nomina le selezioni** per qualsiasi parte che anima, scambia texture o necessita di interazione via codice.
5. **Posiziona punti di memoria** per attacchi, posizioni del flash della canna, porte di espulsione, ecc.
6. **Aggiungi proxy** per oggetti che possono essere collegati (ottiche, caricatori, silenziatori).
7. **Valida** usando la validazione integrata di Object Builder (Structure --> Validate).
8. **Salva** come P3D.
9. **Compila** tramite Binarize o AddonBuilder.

---

## Il Sistema LOD

Un file P3D contiene più **LOD** (Livelli di Dettaglio), ognuno con uno scopo specifico. Il motore seleziona quale LOD usare in base alla situazione -- distanza dalla telecamera, calcoli fisici, rendering delle ombre, ecc.

### Tipi di LOD

| LOD | Valore Risoluzione | Scopo |
|-----|-----------------|---------|
| **Resolution 0** | 1.000 | Mesh visiva al massimo dettaglio. Renderizzata quando l'oggetto è vicino alla telecamera. |
| **Resolution 1** | 1.100 | Dettaglio medio. Renderizzata a distanza moderata. |
| **Resolution 2** | 1.200 | Basso dettaglio. Renderizzata a grande distanza. |
| **Resolution 3+** | 1.300+ | LOD di distanza aggiuntivi. |
| **View Geometry** | Speciale | Determina cosa blocca la vista del giocatore (prima persona). Mesh semplificata. |
| **Fire Geometry** | Speciale | Collisione per proiettili e proiettili. Deve essere convessa o composta da parti convesse. |
| **Geometry** | Speciale | Collisione fisica. Usata per collisione di movimento, gravità, posizionamento. Deve essere convessa o composta da decomposizione convessa. |
| **Shadow 0** | Speciale | Mesh per la proiezione ombre (a corto raggio). |
| **Shadow 1000** | Speciale | Mesh per la proiezione ombre (a lungo raggio). Più semplice di Shadow 0. |
| **Memory** | Speciale | Contiene solo punti nominati (nessuna geometria visibile). Usato per posizioni di attacco, origini suoni, ecc. |
| **Roadway** | Speciale | Definisce le superfici percorribili sugli oggetti (veicoli, edifici con interni accessibili). |
| **Paths** | Speciale | Suggerimenti per il pathfinding IA per gli edifici. |

### Valori di Risoluzione LOD (LOD Visivi)

Il motore usa una formula basata su distanza e dimensione dell'oggetto per determinare quale LOD visivo renderizzare:

```
LOD selezionato = (distanza_dall_oggetto * fattore_LOD) / raggio_sfera_contenente_oggetto
```

Valori inferiori = telecamera più vicina. Il motore trova il LOD il cui valore di risoluzione è la corrispondenza più vicina al valore calcolato.

### Creare LOD in Object Builder

1. **File --> New LOD** o click destro sulla lista LOD.
2. Seleziona il tipo di LOD dal menu a tendina.
3. Per i LOD visivi (Resolution), inserisci il valore di risoluzione.
4. Modella la geometria per quel LOD.

### Requisiti LOD per Tipo di Oggetto

| Tipo Oggetto | LOD Obbligatori | LOD Aggiuntivi Consigliati |
|-----------|---------------|----------------------------|
| **Oggetto portatile** | Resolution 0, Geometry, Fire Geometry, Memory | Shadow 0, Resolution 1 |
| **Abbigliamento** | Resolution 0, Geometry, Fire Geometry, Memory | Shadow 0, Resolution 1, Resolution 2 |
| **Arma** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Resolution 1, Resolution 2 |
| **Edificio** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Shadow 1000, Roadway, Paths |
| **Veicolo** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Roadway, Resolution 1+ |

### Regole LOD Geometry

I LOD Geometry e Fire Geometry hanno requisiti rigorosi:

- **Devono essere convessi** o composti da componenti convessi multipli. Il sistema fisico del motore richiede forme di collisione convesse.
- **Le selezioni nominate devono corrispondere** a quelle nel LOD Resolution (per le parti animate).
- **La massa deve essere definita.** Seleziona tutti i vertici nel LOD Geometry e assegna la massa tramite **Structure --> Mass**. Questo determina il peso fisico dell'oggetto.
- **Mantienilo semplice.** Meno triangoli = migliori prestazioni fisiche. Il LOD geometry di un'arma potrebbe avere 20-50 triangoli vs. migliaia nel LOD visivo.

---

## Selezioni Nominate

Le selezioni nominate sono gruppi di vertici, spigoli o facce all'interno di un LOD che sono etichettati con un nome. Servono come maniglie che il motore e gli script usano per manipolare parti di un modello.

### Cosa Fanno le Selezioni Nominate

| Scopo | Esempio Nome Selezione | Usato Da |
|---------|----------------------|---------|
| **Animazione** | `bolt`, `trigger`, `magazine` | Sorgenti animazione `model.cfg` |
| **Scambi texture** | `camo`, `camo1`, `body` | `hiddenSelections[]` in config.cpp |
| **Texture danno** | `zbytek` | Sistema danni del motore, scambi materiale |
| **Punti di attacco** | `magazine`, `optics`, `suppressor` | Sistema proxy e attacchi |

### hiddenSelections (Scambi Texture)

L'uso più comune delle selezioni nominate per i modder è **hiddenSelections** -- la possibilità di scambiare texture a runtime tramite config.cpp.

**Nel modello P3D (LOD Resolution):**
1. Seleziona le facce che dovrebbero essere ritexturizzabili.
2. Nomina la selezione (ad es. `camo`).

**In config.cpp:**
```cpp
class MyRifle: Rifle_Base
{
    hiddenSelections[] = {"camo"};
    hiddenSelectionsTextures[] = {"MyMod\data\my_rifle_co.paa"};
    hiddenSelectionsMaterials[] = {"MyMod\data\my_rifle.rvmat"};
};
```

Questo permette varianti diverse dello stesso modello con texture diverse senza duplicare il file P3D.

### Creare Selezioni Nominate

In Object Builder:

1. Seleziona i vertici o le facce che vuoi raggruppare.
2. Vai a **Structure --> Named Selections** (o premi Ctrl+N).
3. Clicca **New**, inserisci il nome della selezione.
4. Clicca **Assign** per etichettare la geometria selezionata con quel nome.

> **Suggerimento:** I nomi delle selezioni sono case-sensitive. `Camo` e `camo` sono selezioni diverse. La convenzione è minuscolo.

### Selezioni Attraverso i LOD

Le selezioni nominate devono essere consistenti tra i LOD affinché le animazioni funzionino:

- Se la selezione `bolt` esiste nel LOD Resolution 0, deve esistere anche nei LOD Geometry e Fire Geometry (coprendo la geometria di collisione corrispondente).
- I LOD Shadow dovrebbero avere anch'essi la selezione se la parte animata deve proiettare ombre corrette.

---

## Punti di Memoria

I punti di memoria sono posizioni nominate definite nel **LOD Memory**. Non hanno rappresentazione visiva nel gioco -- definiscono coordinate spaziali che il motore e gli script riferiscono per posizionare effetti, attacchi, suoni e altro.

### Punti di Memoria Comuni

| Nome Punto | Scopo |
|------------|---------|
| `usti hlavne` | Posizione della canna (dove originano i proiettili, appare il flash della canna) |
| `konec hlavne` | Fine della canna (usato con `usti hlavne` per definire la direzione della canna) |
| `nabojnicestart` | Inizio porta di espulsione (dove emergono i bossoli) |
| `nabojniceend` | Fine porta di espulsione (direzione di espulsione) |
| `handguard` | Punto di attacco del paramano |
| `magazine` | Posizione dell'alloggiamento caricatore |
| `optics` | Posizione della slitta ottica |
| `suppressor` | Posizione di montaggio del silenziatore |
| `trigger` | Posizione del grilletto (per IK della mano) |
| `pistolgrip` | Posizione dell'impugnatura a pistola (per IK della mano) |
| `lefthand` | Posizione della presa mano sinistra |
| `righthand` | Posizione della presa mano destra |
| `eye` | Posizione dell'occhio (per allineamento vista in prima persona) |
| `pilot` | Posizione del sedile guidatore/pilota (veicoli) |
| `light_l` / `light_r` | Posizioni fari sinistro/destro (veicoli) |

### Punti di Memoria Direzionali

Molti effetti necessitano sia di una posizione che di una direzione. Questo si ottiene con punti di memoria accoppiati:

```
usti hlavne  ------>  konec hlavne
(inizio canna)        (fine canna)

Il vettore direzione è: konec hlavne - usti hlavne
```

### Creare Punti di Memoria in Object Builder

1. Passa al **LOD Memory** nella lista LOD.
2. Crea un vertice nella posizione desiderata.
3. Nominalo tramite **Structure --> Named Selections**: crea una selezione con il nome del punto e assegna il singolo vertice ad essa.

> **Nota:** Il LOD Memory deve contenere SOLO punti nominati (vertici individuali). Non creare facce o spigoli nel LOD Memory.

---

## Il Sistema Proxy

I proxy definiscono posizioni dove altri modelli P3D possono essere collegati. Quando vedi un caricatore inserito in un'arma, un'ottica montata su una slitta, o un silenziatore avvitato su una canna -- quelli sono modelli collegati tramite proxy.

### Come Funzionano i Proxy

Un proxy è un riferimento speciale posizionato nel LOD Resolution che punta a un altro file P3D. Il motore renderizza il modello riferito dal proxy alla posizione e orientamento del proxy.

### Convenzione di Denominazione dei Proxy

I nomi dei proxy seguono il pattern: `proxy:\percorso\al\modello.p3d`

Per i proxy di attacco sulle armi, i nomi standard sono:

| Percorso Proxy | Tipo di Attacco |
|------------|----------------|
| `proxy:\dz\weapons\attachments\magazine\mag_placeholder.p3d` | Slot caricatore |
| `proxy:\dz\weapons\attachments\optics\optic_placeholder.p3d` | Slitta ottica |
| `proxy:\dz\weapons\attachments\suppressor\sup_placeholder.p3d` | Montaggio silenziatore |
| `proxy:\dz\weapons\attachments\handguard\handguard_placeholder.p3d` | Slot paramano |
| `proxy:\dz\weapons\attachments\stock\stock_placeholder.p3d` | Slot calcio |

### Aggiungere Proxy in Object Builder

1. Nel LOD Resolution, posiziona il cursore 3D dove l'attacco deve apparire.
2. Vai a **Structure --> Proxy --> Create**.
3. Inserisci il percorso del proxy (ad es. `dz\weapons\attachments\magazine\mag_placeholder.p3d`).
4. Il proxy appare come una piccola freccia che indica posizione e orientamento.
5. Ruota e posiziona il proxy per allinearsi correttamente con la geometria dell'attacco.

### Indice del Proxy

Ogni proxy ha un numero indice (partendo da 1). Quando un modello ha più proxy dello stesso tipo, l'indice li differenzia. L'indice è riferito in config.cpp:

```cpp
class MyWeapon: Rifle_Base
{
    class Attachments
    {
        class magazine
        {
            type = "magazine";
            proxy = "proxy:\dz\weapons\attachments\magazine\mag_placeholder.p3d";
            proxyIndex = 1;
        };
    };
};
```

---

## Model.cfg per le Animazioni

Il file `model.cfg` definisce le animazioni per i modelli P3D. Mappa le sorgenti di animazione (guidate dalla logica del gioco) a trasformazioni sulle selezioni nominate.

### Struttura Base

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };

    class MyRifle: Default
    {
        skeletonName = "MyRifle_skeleton";
        sections[] = {"camo"};

        class Animations
        {
            class bolt_move
            {
                type = "translation";
                source = "reload";        // Sorgente animazione del motore
                selection = "bolt";       // Selezione nominata nel P3D
                axis = "bolt_axis";       // Coppia di punti di memoria per l'asse
                memory = 1;               // Asse definito nel LOD Memory
                minValue = 0;
                maxValue = 1;
                offset0 = 0;
                offset1 = 0.05;           // Traslazione di 5cm
            };

            class trigger_move
            {
                type = "rotation";
                source = "trigger";
                selection = "trigger";
                axis = "trigger_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -0.4;            // Radianti
            };
        };
    };
};

class CfgSkeletons
{
    class Default
    {
        isDiscrete = 0;
        skeletonInherit = "";
        skeletonBones[] = {};
    };

    class MyRifle_skeleton: Default
    {
        skeletonBones[] =
        {
            "bolt", "",          // "nome_osso", "osso_genitore" ("" = radice)
            "trigger", "",
            "magazine", ""
        };
    };
};
```

### Tipi di Animazione

| Tipo | Parola Chiave | Movimento | Controllato Da |
|------|---------|----------|---------------|
| **Traslazione** | `translation` | Movimento lineare lungo un asse | `offset0` / `offset1` (metri) |
| **Rotazione** | `rotation` | Rotazione attorno a un asse | `angle0` / `angle1` (radianti) |
| **RotazioneX/Y/Z** | `rotationX` | Rotazione attorno a un asse fisso del mondo | `angle0` / `angle1` |
| **Nascondi** | `hide` | Mostra/nascondi una selezione | Soglia `hideValue` |

### Sorgenti di Animazione

Le sorgenti di animazione sono valori forniti dal motore che guidano le animazioni:

| Sorgente | Intervallo | Descrizione |
|--------|-------|-------------|
| `reload` | 0-1 | Fase di ricarica dell'arma |
| `trigger` | 0-1 | Pressione del grilletto |
| `zeroing` | 0-N | Impostazione di azzeramento dell'arma |
| `isFlipped` | 0-1 | Stato ribaltamento mirino |
| `door` | 0-1 | Apertura/chiusura porta |
| `rpm` | 0-N | RPM motore veicolo |
| `speed` | 0-N | Velocità veicolo |
| `fuel` | 0-1 | Livello carburante veicolo |
| `damper` | 0-1 | Sospensione veicolo |

---

## Importazione da FBX/OBJ

La maggior parte dei modder crea modelli 3D in strumenti esterni (Blender, 3ds Max, Maya) e li importa in Object Builder.

### Formati di Importazione Supportati

| Formato | Estensione | Note |
|--------|-----------|-------|
| **FBX** | `.fbx` | Migliore compatibilità. Esporta come FBX 2013 o successivo (binario). |
| **OBJ** | `.obj` | Wavefront OBJ. Solo dati mesh semplici (nessuna animazione). |
| **3DS** | `.3ds` | Formato legacy 3ds Max. Limitato a 65K vertici per mesh. |

### Flusso di Lavoro di Importazione

**Passo 1: Prepara nel tuo software 3D**
- Il modello deve essere centrato all'origine.
- Applica tutte le trasformazioni (posizione, rotazione, scala).
- Scala: 1 unità = 1 metro. DayZ usa i metri.
- Triangola la mesh (Object Builder lavora con i triangoli).
- UV unwrap del modello.
- Esporta come FBX (binario, senza animazione, Y-up o Z-up -- Object Builder gestisce entrambi).

**Passo 2: Importa in Object Builder**
1. Apri Object Builder.
2. **File --> Import --> FBX** (o OBJ/3DS).
3. Rivedi le impostazioni di importazione:
   - Fattore di scala (dovrebbe essere 1.0 se la sorgente è in metri).
   - Conversione assi (Z-up a Y-up se necessario).
4. La mesh appare in un nuovo LOD Resolution.

**Passo 3: Configurazione post-importazione**
1. Assegna materiali alle facce (seleziona facce, click destro --> **Face Properties**).
2. Crea LOD aggiuntivi (Geometry, Fire Geometry, Memory, Shadow).
3. Semplifica la geometria per i LOD di collisione (rimuovi piccoli dettagli, assicura la convessità).
4. Aggiungi selezioni nominate, punti di memoria e proxy.
5. Valida e salva.

### Suggerimenti Specifici per Blender

- Usa l'addon della community **Blender DayZ Toolbox** se disponibile -- semplifica le impostazioni di esportazione.
- Esporta con: **Apply Modifiers**, **Triangulate Faces**, **Apply Scale**.
- Imposta **Forward: -Z Forward**, **Up: Y Up** nel dialogo di esportazione FBX.
- Nomina gli oggetti mesh in Blender per corrispondere alle selezioni nominate previste -- alcuni importatori preservano i nomi degli oggetti.

---

## Tipi di Modelli Comuni

### Armi

Le armi sono i modelli P3D più complessi, richiedendo:
- LOD Resolution ad alto poligonaggio (5.000-20.000 triangoli)
- Selezioni nominate multiple (bolt, trigger, magazine, camo, ecc.)
- Set completo di punti di memoria (canna, espulsione, posizioni di presa)
- Proxy multipli (caricatore, ottiche, silenziatore, paramano, calcio)
- Scheletro e animazioni in model.cfg
- View Geometry per l'ostruzione in prima persona

### Abbigliamento

I modelli di abbigliamento sono rigged allo scheletro del personaggio:
- Il LOD Resolution segue la struttura ossea del personaggio
- Selezioni nominate per varianti texture (`camo`, `camo1`)
- Geometria di collisione più semplice
- Nessun proxy (di solito)
- hiddenSelections per varianti colore/mimetica

### Edifici

Gli edifici hanno requisiti unici:
- LOD Resolution grandi e dettagliati
- LOD Roadway per superfici percorribili (pavimenti, scale)
- LOD Paths per la navigazione IA
- View Geometry per impedire di vedere attraverso i muri
- LOD Shadow multipli per prestazioni a diverse distanze
- Selezioni nominate per porte e finestre che si aprono

### Veicoli

I veicoli combinano molti sistemi:
- LOD Resolution dettagliato con parti animate (ruote, porte, cofano)
- Scheletro complesso con molte ossa
- LOD Roadway per passeggeri in piedi nei cassoni dei camion
- Punti di memoria per luci, scarico, posizione guidatore, sedili passeggeri
- Proxy multipli per attacchi (ruote, porte)

---

## Errori Comuni

### 1. LOD Geometry Mancante

**Sintomo:** L'oggetto non ha collisione. Giocatori e proiettili lo attraversano.
**Soluzione:** Crea un LOD Geometry con una mesh convessa semplificata. Assegna la massa ai vertici.

### 2. Forme di Collisione Non Convesse

**Sintomo:** Glitch fisici, oggetti che rimbalzano erraticamente, oggetti che cadono attraverso le superfici.
**Soluzione:** Suddividi le forme complesse in componenti convessi multipli nel LOD Geometry. Ogni componente deve essere un solido convesso chiuso.

### 3. Selezioni Nominate Inconsistenti

**Sintomo:** Le animazioni funzionano solo visivamente ma non per la collisione, o l'ombra non si anima.
**Soluzione:** Assicurati che ogni selezione nominata che esiste nel LOD Resolution esista anche nei LOD Geometry, Fire Geometry e Shadow.

### 4. Scala Sbagliata

**Sintomo:** L'oggetto è gigantesco o microscopico nel gioco.
**Soluzione:** Verifica che il tuo software 3D usi i metri come unità. Un personaggio DayZ è alto circa 1.8 metri.

### 5. Punti di Memoria Mancanti

**Sintomo:** Il flash della canna appare nella posizione sbagliata, gli attacchi fluttuano nello spazio.
**Soluzione:** Crea il LOD Memory e aggiungi tutti i punti nominati richiesti nelle posizioni corrette.

### 6. Nessuna Massa Definita

**Sintomo:** L'oggetto non può essere raccolto, o le interazioni fisiche si comportano in modo strano.
**Soluzione:** Seleziona tutti i vertici nel LOD Geometry e assegna la massa tramite **Structure --> Mass**.

---

## Buone Pratiche

1. **Inizia con il LOD Geometry.** Blocca la forma di collisione prima, poi costruisci il dettaglio visivo sopra. Questo previene l'errore comune di creare un modello bellissimo che non può collidere correttamente.

2. **Usa modelli di riferimento.** Estrai i file P3D vanilla dai dati di gioco e studiali in Object Builder. Mostrano esattamente cosa il motore si aspetta per ogni tipo di oggetto.

3. **Valida frequentemente.** Usa **Structure --> Validate** di Object Builder dopo ogni cambiamento significativo. Risolvi gli avvisi prima che diventino bug misteriosi nel gioco.

4. **Mantieni il conteggio triangoli dei LOD proporzionale.** Resolution 0 potrebbe avere 10.000 triangoli; Resolution 1 dovrebbe avere ~5.000; Geometry dovrebbe avere ~100-500. Riduzione drastica ad ogni livello.

5. **Nomina le selezioni in modo descrittivo.** Usa `bolt_carrier` invece di `sel01`. Il tuo te stesso futuro (e gli altri modder) ti ringrazieranno.

6. **Testa prima con il file patching.** Carica il tuo P3D non binarizzato tramite la modalità file patching prima di impegnarti in una build PBO completa. Questo cattura la maggior parte dei problemi più velocemente.

7. **Documenta i punti di memoria.** Tieni un'immagine di riferimento o un file di testo che elenca tutti i punti di memoria e le loro posizioni previste. Le armi complesse possono avere 20+ punti.

---

## Navigazione

| Precedente | Su | Successivo |
|----------|----|------|
| [4.1 Texture](01-textures.md) | [Parte 4: Formati File e DayZ Tools](01-textures.md) | [4.3 Materiali](03-materials.md) |
