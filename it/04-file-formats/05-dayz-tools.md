# Capitolo 4.5: Flusso di Lavoro DayZ Tools

[Home](../README.md) | [<< Precedente: Audio](04-audio.md) | **DayZ Tools** | [Successivo: Impacchettamento PBO >>](06-pbo-packing.md)

---

## Introduzione

DayZ Tools è una suite gratuita di applicazioni di sviluppo distribuita tramite Steam, fornita da Bohemia Interactive per i modder. Contiene tutto il necessario per creare, convertire e impacchettare gli asset di gioco: un editor di modelli 3D, un visualizzatore di texture, un editor di terreni, un debugger di script e la pipeline di binarizzazione che trasforma file sorgente leggibili dall'uomo in formati ottimizzati pronti per il gioco. Nessuna mod DayZ può essere costruita senza almeno qualche interazione con questi strumenti.

Questo capitolo fornisce una panoramica di ogni strumento nella suite, spiega il sistema del drive P: (workdrive) che sta alla base dell'intero flusso di lavoro, copre il file patching per un'iterazione rapida nello sviluppo e guida attraverso la pipeline completa degli asset dai file sorgente alla mod giocabile.

---

## Indice dei Contenuti

- [Panoramica della Suite DayZ Tools](#panoramica-della-suite-dayz-tools)
- [Installazione e Configurazione](#installazione-e-configurazione)
- [Drive P: (Workdrive)](#drive-p-workdrive)
- [Object Builder](#object-builder)
- [TexView2](#texview2)
- [Terrain Builder](#terrain-builder)
- [Binarize](#binarize)
- [AddonBuilder](#addonbuilder)
- [Workbench](#workbench)
- [Modalità File Patching](#modalità-file-patching)
- [Flusso di Lavoro Completo: dalla Sorgente al Gioco](#flusso-di-lavoro-completo-dalla-sorgente-al-gioco)
- [Errori Comuni](#errori-comuni)
- [Buone Pratiche](#buone-pratiche)

---

## Panoramica della Suite DayZ Tools

DayZ Tools è disponibile come download gratuito su Steam nella categoria **Tools**. Installa una collezione di applicazioni, ognuna con un ruolo specifico nella pipeline di modding.

| Strumento | Scopo | Utenti Principali |
|------|---------|---------------|
| **Object Builder** | Creazione e modifica di modelli 3D (.p3d) | Artisti 3D, modellatori |
| **TexView2** | Visualizzazione e conversione texture (.paa, .tga, .png) | Artisti texture, tutti i modder |
| **Terrain Builder** | Creazione e modifica del terreno/mappe | Creatori di mappe |
| **Binarize** | Conversione dal formato sorgente al formato di gioco | Pipeline di build (di solito automatizzata) |
| **AddonBuilder** | Impacchettamento PBO con binarizzazione opzionale | Tutti i modder |
| **Workbench** | Debug, test e profilazione degli script | Scripter |
| **DayZ Tools Launcher** | Hub centrale per avviare gli strumenti e configurare il drive P: | Tutti i modder |

### Dove Si Trovano su Disco

Dopo l'installazione su Steam, gli strumenti si trovano tipicamente in:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
  Bin\
    AddonBuilder\
      AddonBuilder.exe          <-- Impacchettatore PBO
    Binarize\
      Binarize.exe              <-- Convertitore asset
    TexView2\
      TexView2.exe              <-- Strumento texture
    ObjectBuilder\
      ObjectBuilder.exe         <-- Editor modelli 3D
    Workbench\
      workbenchApp.exe          <-- Debugger script
  TerrainBuilder\
    TerrainBuilder.exe          <-- Editor terreni
```

---

## Installazione e Configurazione

### Passo 1: Installa DayZ Tools da Steam

1. Apri la Libreria Steam.
2. Abilita il filtro **Tools** nel menu a tendina.
3. Cerca "DayZ Tools".
4. Installa (gratuito, circa 2 GB).

### Passo 2: Avvia DayZ Tools

1. Avvia "DayZ Tools" da Steam.
2. Si apre il DayZ Tools Launcher -- un'applicazione hub centrale.
3. Da qui puoi avviare qualsiasi strumento individuale e configurare le impostazioni.

### Passo 3: Configura il Drive P:

Il launcher fornisce un pulsante per creare e montare il drive P: (workdrive). Questo è il drive virtuale che tutti gli strumenti DayZ usano come percorso radice.

1. Clicca **Setup Workdrive** (o il pulsante di configurazione del drive P:).
2. Lo strumento crea un drive P: mappato tramite subst che punta a una directory sul tuo disco reale.
3. Estrai o crea symlink dei dati vanilla DayZ su P: così gli strumenti possono riferire gli asset di gioco.

---

## Drive P: (Workdrive)

Il **drive P:** è un drive virtuale Windows (creato tramite `subst` o junction) che serve come percorso radice unificato per tutto il modding DayZ. Ogni percorso nei modelli P3D, materiali RVMAT, riferimenti config.cpp e script di build è relativo a P:.

### Perché Esiste il Drive P:

La pipeline degli asset di DayZ è stata progettata attorno a un percorso radice fisso. Quando un materiale riferisce `MyMod\data\texture_co.paa`, il motore cerca `P:\MyMod\data\texture_co.paa`. Questa convenzione assicura:

- Tutti gli strumenti concordano su dove si trovano i file.
- I percorsi nei PBO impacchettati corrispondono ai percorsi durante lo sviluppo.
- Mod multiple possono coesistere sotto una sola radice.

### Struttura

```
P:\
  DZ\                          <-- Dati vanilla DayZ estratti
    characters\
    weapons\
    data\
    ...
  DayZ Tools\                  <-- Installazione strumenti (o symlink)
  MyMod\                       <-- Sorgente della tua mod
    config.cpp
    Scripts\
    data\
  AnotherMod\                  <-- Sorgente di un'altra mod
    ...
```

### SetupWorkdrive.bat

Molti progetti di mod includono uno script `SetupWorkdrive.bat` che automatizza la creazione del drive P: e la configurazione delle junction. Uno script tipico:

```batch
@echo off
REM Crea il drive P: che punta al workspace
subst P: "D:\DayZModding"

REM Crea junction per i dati di gioco vanilla
mklink /J "P:\DZ" "C:\Program Files (x86)\Steam\steamapps\common\DayZ\dta"

REM Crea junction per gli strumenti
mklink /J "P:\DayZ Tools" "C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"

echo Workdrive P: configurato.
pause
```

> **Suggerimento:** Il workdrive deve essere montato prima di avviare qualsiasi strumento DayZ. Se Object Builder o Binarize non trovano i file, la prima cosa da controllare è se P: è montato.

---

## Object Builder

Object Builder è l'editor di modelli 3D per i file P3D. È coperto in dettaglio nel [Capitolo 4.2: Modelli 3D](02-models.md). Ecco un riepilogo del suo ruolo nella catena di strumenti.

### Funzionalità Principali

- Crea e modifica file modello P3D.
- Definisci LOD (Livello di Dettaglio) per mesh visive, di collisione e ombra.
- Assegna materiali (RVMAT) e texture (PAA) alle facce del modello.
- Crea selezioni nominate per animazioni e scambi texture.
- Posiziona punti di memoria e oggetti proxy.
- Importa geometria da formati FBX, OBJ e 3DS.
- Valida modelli per compatibilità con il motore.

---

## TexView2

TexView2 è l'utilità di visualizzazione e conversione texture. Gestisce tutte le conversioni di formato texture necessarie per il modding DayZ.

### Funzionalità Principali

- Apri e visualizza in anteprima file PAA, TGA, PNG, EDDS e DDS.
- Converti tra formati (TGA/PNG in PAA, PAA in TGA, ecc.).
- Visualizza canali individuali (R, G, B, A) separatamente.
- Mostra livelli mipmap.
- Mostra dimensioni texture e tipo di compressione.
- Conversione batch tramite riga di comando.

### Operazioni Comuni

**Converti TGA in PAA:**
1. File --> Open --> seleziona il tuo file TGA.
2. Verifica che l'immagine appaia corretta.
3. File --> Save As --> scegli il formato PAA.
4. Seleziona la compressione (DXT1 per opaco, DXT5 per alfa).
5. Salva.

---

## Terrain Builder

Terrain Builder è uno strumento specializzato per creare mappe (terreni) personalizzate. La creazione di mappe è una delle attività di modding più complesse in DayZ, che coinvolge immagini satellitari, mappe di altezza, maschere di superficie e posizionamento oggetti.

> **Nota:** La creazione di terreni è un argomento avanzato che merita una guida dedicata. Questo capitolo copre Terrain Builder solo come parte della panoramica degli strumenti.

---

## Binarize

Binarize è il motore di conversione principale che trasforma i file sorgente leggibili dall'uomo in formati binari ottimizzati e pronti per il gioco. Funziona dietro le quinte durante l'impacchettamento PBO (tramite AddonBuilder) ma può anche essere invocato direttamente.

### Cosa Converte Binarize

| Formato Sorgente | Formato Output | Descrizione |
|---------------|---------------|-------------|
| MLOD `.p3d` | ODOL `.p3d` | Modello 3D ottimizzato |
| `.tga` / `.png` / `.edds` | `.paa` | Texture compressa |
| `.cpp` (config) | `.bin` | Config binarizzato (parsing più veloce) |
| `.rvmat` | `.rvmat` (elaborato) | Materiale con percorsi risolti |
| `.wrp` | `.wrp` (ottimizzato) | Mondo terreno |

### Quando Serve la Binarizzazione

| Tipo Contenuto | Binarizzare? | Motivo |
|-------------|-----------|--------|
| Config.cpp con CfgVehicles | **Sì** | Il motore richiede config binarizzati per le definizioni degli oggetti |
| Config.cpp (solo script) | Opzionale | Config solo-script funzionano non binarizzati |
| Modelli P3D | **Sì** | ODOL è più veloce da caricare, più piccolo, ottimizzato per il motore |
| Texture (TGA/PNG) | **Sì** | PAA è richiesto a runtime |
| Script (file .c) | **No** | Gli script vengono caricati così come sono (testo) |
| Audio (.ogg) | **No** | OGG è già pronto per il gioco |
| Layout (.layout) | **No** | Caricati così come sono |

---

## AddonBuilder

AddonBuilder è lo strumento di impacchettamento PBO. Prende una directory sorgente e crea un archivio `.pbo`, eseguendo opzionalmente Binarize sul contenuto prima. Questo è coperto in dettaglio nel [Capitolo 4.6: Impacchettamento PBO](06-pbo-packing.md).

### Riferimento Rapido

```bash
# Impacchetta con binarizzazione (per mod con config, modelli, texture)
AddonBuilder.exe "P:\MyMod" "P:\output" -prefix="MyMod" -sign="MyKey"

# Impacchetta senza binarizzazione (per mod solo-script)
AddonBuilder.exe "P:\MyMod" "P:\output" -prefix="MyMod" -packonly
```

---

## Workbench

Workbench è un ambiente di sviluppo script incluso con DayZ Tools. Fornisce funzionalità di editing, debug e profilazione degli script.

### Funzionalità Principali

- **Editing script** con evidenziazione sintassi per Enforce Script.
- **Debug** con breakpoint, esecuzione passo-passo e ispezione variabili.
- **Profilazione** per identificare colli di bottiglia nelle prestazioni degli script.
- **Console** per valutare espressioni e testare frammenti.
- **Browser risorse** per ispezionare i dati di gioco.

### Limitazioni

- Il supporto Enforce Script di Workbench ha alcune lacune -- non tutte le API del motore sono completamente documentate nel suo autocompletamento.
- Alcuni modder preferiscono editor esterni (VS Code con estensioni Enforce Script della community) per scrivere codice e usano Workbench solo per il debug.
- Workbench può essere instabile con mod grandi o configurazioni di breakpoint complesse.

---

## Modalità File Patching

Il **file patching** è una scorciatoia di sviluppo che permette al gioco di caricare file sfusi dal disco invece di richiedere che siano impacchettati in PBO. Questo accelera drasticamente l'iterazione durante lo sviluppo.

### Come Funziona il File Patching

Quando DayZ viene avviato con il parametro `-filePatching`, il motore controlla il drive P: per i file prima di cercare nei PBO. Se un file esiste su P:, la versione sfusa viene caricata invece della versione PBO.

```
Modalità normale:     Il gioco carica --> PBO --> file
File patching:        Il gioco carica --> drive P: (se il file esiste) --> PBO (fallback)
```

### Abilitare il File Patching

Aggiungi il parametro di lancio `-filePatching` a DayZ:

```bash
# Client
DayZDiag_x64.exe -filePatching -mod="MyMod" -connect=127.0.0.1

# Server
DayZDiag_x64.exe -filePatching -server -mod="MyMod" -config=serverDZ.cfg
```

> **Importante:** Il file patching richiede l'eseguibile **Diag** (diagnostico) (`DayZDiag_x64.exe`), non l'eseguibile retail. La build retail ignora `-filePatching` per sicurezza.

### Cosa Può Fare il File Patching

| Tipo Asset | Funziona il File Patching? | Note |
|------------|---------------------|-------|
| Script (.c) | **Sì** | Iterazione più veloce -- modifica, riavvia, testa |
| Layout (.layout) | **Sì** | Modifiche UI senza rebuild |
| Texture (.paa) | **Sì** | Scambia texture senza rebuild |
| Config.cpp | **Parziale** | Solo config non binarizzati |
| Modelli (.p3d) | **Sì** | Solo P3D MLOD non binarizzati |
| Audio (.ogg) | **Sì** | Scambia suoni senza rebuild |

### Limitazioni

- **Nessun contenuto binarizzato.** Config.cpp con voci `CfgVehicles` potrebbe non funzionare correttamente senza binarizzazione. I config solo-script funzionano bene.
- **Nessuna firma delle chiavi.** Il contenuto file-patched non è firmato, quindi funziona solo in sviluppo (non su server pubblici).
- **Solo build Diag.** L'eseguibile retail ignora il file patching.
- **Il drive P: deve essere montato.** Se il workdrive non è montato, il file patching non ha nulla da cui leggere.

> **Suggerimento:** Per le modifiche solo-script, il file patching elimina completamente il passaggio di build. Modifichi i file `.c`, riavvii e testi. Questo è il loop di sviluppo più veloce disponibile.

---

## Flusso di Lavoro Completo: dalla Sorgente al Gioco

Ecco la pipeline end-to-end per trasformare gli asset sorgente in una mod giocabile:

### Fase 1: Crea gli Asset Sorgente

```
Software 3D (Blender/3dsMax)     -->  Esportazione FBX
Editor Immagini (Photoshop/GIMP) -->  Esportazione TGA/PNG
Editor Audio (Audacity)          -->  Esportazione OGG
Editor Testo (VS Code)           -->  Script .c, config.cpp, file .layout
```

### Fase 2: Importa e Converti

```
FBX  -->  Object Builder  -->  P3D (con LOD, selezioni, materiali)
TGA  -->  TexView2         -->  PAA (texture compressa)
PNG  -->  TexView2         -->  PAA (texture compressa)
OGG  -->  (nessuna conversione necessaria, pronto per il gioco)
```

### Fase 3: Organizza sul Drive P:

```
P:\MyMod\
  config.cpp                    <-- Configurazione della mod
  Scripts\
    3_Game\                     <-- Script a caricamento precoce
    4_World\                    <-- Script entità/manager
    5_Mission\                  <-- Script UI/missione
  data\
    models\
      my_item.p3d               <-- Modello 3D
    textures\
      my_item_co.paa            <-- Texture diffuse
      my_item_nohq.paa          <-- Normal map
      my_item_smdi.paa          <-- Mappa speculare
    materials\
      my_item.rvmat             <-- Definizione materiale
  sound\
    my_sound.ogg                <-- File audio
  GUI\
    layouts\
      my_panel.layout           <-- Layout UI
```

### Fase 4: Testa con File Patching (Sviluppo)

```
Avvia DayZDiag con -filePatching
  |
  |--> Il motore legge i file sfusi da P:\MyMod\
  |--> Testa nel gioco
  |--> Modifica i file direttamente su P:
  |--> Riavvia per applicare le modifiche
  |--> Itera rapidamente
```

### Fase 5: Impacchetta PBO (Rilascio)

```
AddonBuilder / script di build
  |
  |--> Legge la sorgente da P:\MyMod\
  |--> Binarize converte: P3D-->ODOL, TGA-->PAA, config.cpp-->.bin
  |--> Impacchetta tutto in MyMod.pbo
  |--> Firma con la chiave: MyMod.pbo.MyKey.bisign
  |--> Output: @MyMod\addons\MyMod.pbo
```

### Fase 6: Distribuisci

```
@MyMod\
  addons\
    MyMod.pbo                   <-- La mod impacchettata
    MyMod.pbo.MyKey.bisign      <-- Firma per la verifica del server
  keys\
    MyKey.bikey                 <-- Chiave pubblica per gli admin dei server
  mod.cpp                       <-- Metadati della mod (nome, autore, ecc.)
```

I giocatori si iscrivono alla mod su Steam Workshop, o gli admin dei server la installano manualmente.

---

## Errori Comuni

### 1. Drive P: Non Montato

**Sintomo:** Tutti gli strumenti segnalano errori "file non trovato". Object Builder mostra texture vuote.
**Soluzione:** Esegui il tuo `SetupWorkdrive.bat` o monta P: tramite il DayZ Tools Launcher prima di avviare qualsiasi strumento.

### 2. Strumento Sbagliato per il Lavoro

**Sintomo:** Tentativo di modificare un file PAA in un editor di testo, o apertura di un P3D in Notepad.
**Soluzione:** PAA è binario -- usa TexView2. P3D è binario -- usa Object Builder. Config.cpp è testo -- usa qualsiasi editor di testo.

### 3. Dimenticanza di Estrarre i Dati Vanilla

**Sintomo:** Object Builder non può visualizzare le texture vanilla sui modelli riferiti. I materiali mostrano rosa/magenta.
**Soluzione:** Estrai i dati vanilla DayZ in `P:\DZ\` così gli strumenti possono risolvere i riferimenti incrociati al contenuto di gioco.

### 4. File Patching con Eseguibile Retail

**Sintomo:** Le modifiche ai file sul drive P: non si riflettono nel gioco.
**Soluzione:** Usa `DayZDiag_x64.exe`, non `DayZ_x64.exe`. Solo la build Diag supporta `-filePatching`.

### 5. Build Senza Drive P:

**Sintomo:** AddonBuilder o Binarize fallisce con errori di risoluzione percorsi.
**Soluzione:** Monta il drive P: prima di eseguire qualsiasi strumento di build. Tutti i percorsi nei modelli e materiali sono relativi a P:.

---

## Buone Pratiche

1. **Usa sempre il drive P:.** Resisti alla tentazione di usare percorsi assoluti. P: è lo standard e tutti gli strumenti lo aspettano.

2. **Usa il file patching durante lo sviluppo.** Riduce il tempo di iterazione da minuti (rebuild PBO) a secondi (riavvio gioco). Costruisci PBO solo per test di rilascio e distribuzione.

3. **Automatizza la tua pipeline di build.** Usa script (`build_pbos.bat`, `dev.py`) per automatizzare l'invocazione di AddonBuilder. L'impacchettamento manuale tramite GUI è soggetto a errori e lento per mod multi-PBO.

4. **Mantieni sorgente e output separati.** I file sorgente vivono su P:. I PBO costruiti vanno in una directory di output separata. Non mescolarli mai.

5. **Impara le scorciatoie da tastiera.** Object Builder e TexView2 hanno scorciatoie da tastiera estese che accelerano drammaticamente il lavoro. Investi tempo per impararle.

6. **Estrai e studia i dati vanilla.** Il modo migliore per imparare come sono strutturati gli asset DayZ è esaminare quelli esistenti. Estrai i PBO vanilla e apri modelli, materiali e texture negli strumenti appropriati.

7. **Usa Workbench per il debug, editor esterni per la scrittura.** VS Code con estensioni Enforce Script fornisce editing migliore. Workbench fornisce debug migliore. Usa entrambi.

---

## Navigazione

| Precedente | Su | Successivo |
|----------|----|------|
| [4.4 Audio](04-audio.md) | [Parte 4: Formati File e DayZ Tools](01-textures.md) | [4.6 Impacchettamento PBO](06-pbo-packing.md) |
