# Capitolo 4.7: Guida a Workbench

[Home](../README.md) | [<< Precedente: Impacchettamento PBO](06-pbo-packing.md) | **Guida a Workbench** | [Successivo: Modellazione di Edifici >>](08-building-modeling.md)

---

## Introduzione

Workbench è l'ambiente di sviluppo integrato di Bohemia Interactive per il motore Enfusion. È distribuito con DayZ Tools ed è l'unico strumento ufficiale che comprende l'Enforce Script a livello di linguaggio. Mentre molti modder scrivono codice in VS Code o altri editor, Workbench rimane indispensabile per compiti che nessun altro strumento può eseguire: collegare un debugger a un'istanza di DayZ in esecuzione, impostare breakpoint, avanzare nel codice passo passo, ispezionare le variabili a runtime, visualizzare l'anteprima dei file `.layout` dell'UI, esplorare le risorse di gioco ed eseguire comandi script live attraverso la console integrata.

---

## Indice dei Contenuti

- [Cos'è Workbench?](#cosè-workbench)
- [Installazione e Configurazione](#installazione-e-configurazione)
- [File di Progetto (.gproj)](#file-di-progetto-gproj)
- [L'Interfaccia di Workbench](#linterfaccia-di-workbench)
- [Modifica degli Script](#modifica-degli-script)
- [Debug degli Script](#debug-degli-script)
- [Console degli Script -- Test in Tempo Reale](#console-degli-script----test-in-tempo-reale)
- [Anteprima UI / Layout](#anteprima-ui--layout)
- [Browser delle Risorse](#browser-delle-risorse)
- [Profilazione delle Prestazioni](#profilazione-delle-prestazioni)
- [Integrazione con il File Patching](#integrazione-con-il-file-patching)
- [Problemi Comuni di Workbench](#problemi-comuni-di-workbench)
- [Suggerimenti e Buone Pratiche](#suggerimenti-e-buone-pratiche)

---

## Cos'è Workbench?

Workbench è l'IDE di Bohemia per lo sviluppo con il motore Enfusion. È l'unico strumento nella suite DayZ Tools in grado di compilare, analizzare e fare il debug di Enforce Script. Serve a sei scopi:

| Scopo | Descrizione |
|-------|-------------|
| **Modifica script** | Evidenziazione della sintassi, completamento del codice e controllo degli errori per i file `.c` |
| **Debug degli script** | Breakpoint, ispezione delle variabili, stack delle chiamate, esecuzione passo passo |
| **Esplorazione delle risorse** | Navigazione e anteprima delle risorse di gioco -- modelli, texture, config, layout |
| **Anteprima UI / layout** | Anteprima visiva delle gerarchie di widget `.layout` con ispezione delle proprietà |
| **Profilazione delle prestazioni** | Profilazione degli script, analisi del tempo per frame, monitoraggio della memoria |
| **Console degli script** | Esecuzione di comandi Enforce Script dal vivo su un'istanza di gioco in esecuzione |

Workbench utilizza lo stesso compilatore Enfusion Script di DayZ stesso. Quando Workbench segnala un errore di compilazione, quell'errore si verificherà anche in gioco -- rendendolo un controllo pre-volo affidabile prima del lancio.

### Cosa NON è Workbench

- **Non è un editor di codice generico.** Manca di strumenti di refactoring, integrazione Git, editing multi-cursore e l'ecosistema di estensioni di VS Code.
- **Non è un launcher del gioco.** Si esegue comunque `DayZDiag_x64.exe` separatamente; Workbench si connette ad esso.
- **Non è necessario per costruire i PBO.** AddonBuilder e gli script di build gestiscono l'impacchettamento dei PBO in modo indipendente.

---

## Installazione e Configurazione

### Passo 1: Installa DayZ Tools

Workbench è incluso con DayZ Tools, distribuito gratuitamente tramite Steam. Apri la Libreria Steam, abilita il filtro **Strumenti**, cerca **DayZ Tools** e installa (~2 GB).

### Passo 2: Trova Workbench

```
Steam\steamapps\common\DayZ Tools\Bin\Workbench\
  workbenchApp.exe          <-- L'eseguibile di Workbench
  dayz.gproj                <-- File di progetto predefinito
```

### Passo 3: Monta il Drive P:

Workbench richiede che il drive P: (workdrive) sia montato. Senza di esso, Workbench non si avvia o mostra un browser delle risorse vuoto. Montalo tramite il DayZ Tools Launcher, il `SetupWorkdrive.bat` del tuo progetto, o manualmente: `subst P: "D:\TuaCartellaLavoro"`.

### Passo 4: Estrai gli Script Vanilla

Workbench ha bisogno degli script vanilla di DayZ su P: per compilare la tua mod (poiché il tuo codice estende le classi vanilla):

```
P:\scripts\
  1_Core\
  2_GameLib\
  3_Game\
  4_World\
  5_Mission\
```

Estraili tramite il DayZ Tools Launcher, oppure crea un collegamento simbolico alla directory degli script estratti.

### Passo 4b: Collega l'Installazione del Gioco al Drive di Progetto (per l'Hotloading in Tempo Reale)

Per permettere a DayZDiag di caricare gli script direttamente dal tuo Drive di Progetto (abilitando la modifica live senza ricostruzioni PBO), crea un collegamento simbolico dalla cartella di installazione di DayZ a `P:\scripts`:

1. Naviga alla cartella di installazione di DayZ (tipicamente `Steam\steamapps\common\DayZ`).
2. Elimina qualsiasi cartella `scripts` esistente al suo interno.
3. Apri un prompt dei comandi **come Amministratore** ed esegui:

```batch
mklink /J "C:\...\steamapps\common\DayZ\scripts" "P:\scripts"
```

Sostituisci il primo percorso con il tuo percorso effettivo di installazione di DayZ. Dopo questo, la cartella di installazione di DayZ conterrà una junction `scripts` che punta a `P:\scripts`. Qualsiasi modifica fatta sul Drive di Progetto sarà immediatamente visibile al gioco.

### Passo 5: Configura la Directory dei Dati Sorgente

1. Avvia `workbenchApp.exe`.
2. Clicca **Workbench > Options** nella barra dei menu.
3. Imposta **Source data directory** su `P:\`.
4. Clicca **OK** e consenti a Workbench di riavviarsi.

---

## File di Progetto (.gproj)

Il file `.gproj` è la configurazione del progetto di Workbench. Dice a Workbench dove trovare gli script, quali set di immagini caricare per l'anteprima dei layout e quali stili dei widget sono disponibili.

### Posizione del File

La convenzione è posizionarlo in una directory `Workbench/` all'interno della tua mod:

```
P:\MyMod\
  Workbench\
    dayz.gproj
  Scripts\
    3_Game\
    4_World\
    5_Mission\
  config.cpp
```

### Panoramica della Struttura

Un `.gproj` usa un formato di testo proprietario (non JSON, non XML):

```
GameProjectClass {
    ID "MyMod"
    TITLE "My Mod Name"
    Configurations {
        GameProjectConfigClass PC {
            platformHardware PC
            skeletonDefinitions "DZ/Anims/cfg/skeletons.anim.xml"

            FileSystem {
                FileSystemPathClass {
                    Name "Workdrive"
                    Directory "P:/"
                }
            }

            imageSets {
                "gui/imagesets/ccgui_enforce.imageset"
                "gui/imagesets/dayz_gui.imageset"
                "gui/imagesets/dayz_inventory.imageset"
                // ... altri image set vanilla ...
                "MyMod/gui/imagesets/my_imageset.imageset"
            }

            widgetStyles {
                "gui/looknfeel/dayzwidgets.styles"
                "gui/looknfeel/widgets.styles"
            }

            ScriptModules {
                ScriptModulePathClass {
                    Name "core"
                    Paths {
                        "scripts/1_Core"
                        "MyMod/Scripts/1_Core"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "gameLib"
                    Paths { "scripts/2_GameLib" }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "game"
                    Paths {
                        "scripts/3_Game"
                        "MyMod/Scripts/3_Game"
                    }
                    EntryPoint "CreateGame"
                }
                ScriptModulePathClass {
                    Name "world"
                    Paths {
                        "scripts/4_World"
                        "MyMod/Scripts/4_World"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "mission"
                    Paths {
                        "scripts/5_Mission"
                        "MyMod/Scripts/5_Mission"
                    }
                    EntryPoint "CreateMission"
                }
                ScriptModulePathClass {
                    Name "workbench"
                    Paths { "MyMod/Workbench/ToolAddons" }
                    EntryPoint ""
                }
            }
        }
        GameProjectConfigClass XBOX_ONE { platformHardware XBOX_ONE }
        GameProjectConfigClass PS4 { platformHardware PS4 }
        GameProjectConfigClass LINUX { platformHardware LINUX }
    }
}
```

### Spiegazione delle Sezioni Chiave

**FileSystem** -- Directory radice dove Workbench cerca i file. Come minimo, includi `P:/`. Puoi aggiungere percorsi aggiuntivi (es. la directory di installazione Steam di DayZ) se i file si trovano fuori dal workdrive.

**ScriptModules** -- La sezione più importante. Mappa ogni layer del motore alle directory degli script:

| Modulo | Layer | Punto di Ingresso | Scopo |
|--------|-------|-------------------|-------|
| `core` | `1_Core` | `""` | Core del motore, tipi base |
| `gameLib` | `2_GameLib` | `""` | Utilità della libreria di gioco |
| `game` | `3_Game` | `"CreateGame"` | Enum, costanti, inizializzazione del gioco |
| `world` | `4_World` | `""` | Entità, manager |
| `mission` | `5_Mission` | `"CreateMission"` | Hook della missione, pannelli UI |
| `workbench` | (strumenti) | `""` | Plugin di Workbench |

I percorsi vanilla vengono prima, poi i percorsi della tua mod. Se la tua mod dipende da altre mod (come Community Framework), aggiungi anche i loro percorsi:

```
ScriptModulePathClass {
    Name "game"
    Paths {
        "scripts/3_Game"              // Vanilla
        "JM/CF/Scripts/3_Game"        // Community Framework
        "MyMod/Scripts/3_Game"        // La tua mod
    }
    EntryPoint "CreateGame"
}
```

Alcuni framework sovrascrivono i punti di ingresso (CF usa `"CF_CreateGame"`).

**imageSets / widgetStyles** -- Necessari per l'anteprima dei layout. Senza i set di immagini vanilla, i file di layout mostrano immagini mancanti. Includi sempre i 14 set di immagini vanilla standard elencati nell'esempio sopra.

### Risoluzione del Prefisso del Percorso

Quando Workbench risolve automaticamente i percorsi degli script dal `config.cpp` di una mod, il percorso del FileSystem viene anteposto. Se la tua mod si trova in `P:\OtherMods\MyMod` e il config.cpp dichiara `MyMod/scripts/3_Game`, il FileSystem deve includere `P:\OtherMods` per una corretta risoluzione.

### Creazione e Lancio

**Crea un .gproj:** Copia il `dayz.gproj` predefinito da `DayZ Tools\Bin\Workbench\`, aggiorna `ID`/`TITLE` e aggiungi i percorsi degli script della tua mod a ogni modulo.

**Avvia con un progetto personalizzato:**
```batch
workbenchApp.exe -project="P:\MyMod\Workbench\dayz.gproj"
```

**Avvia con -mod (auto-configurazione dal config.cpp):**
```batch
workbenchApp.exe -mod=P:\MyMod
workbenchApp.exe -mod=P:\CommunityFramework;P:\MyMod
```

L'approccio `-mod` è più semplice ma dà meno controllo. Per configurazioni multi-mod complesse, un `.gproj` personalizzato è più affidabile.

---

## L'Interfaccia di Workbench

### Barra del Menu Principale

| Menu | Elementi Chiave |
|------|-----------------|
| **File** | Apri progetto, progetti recenti, salva |
| **Edit** | Taglia, copia, incolla, trova, sostituisci |
| **View** | Attiva/disattiva pannelli, ripristina layout |
| **Workbench** | Opzioni (directory dati sorgente, preferenze) |
| **Debug** | Avvia/ferma debug, toggle client/server, gestione breakpoint |
| **Plugins** | Plugin di Workbench e tool addon installati |

### Pannelli

- **Resource Browser** (sinistra) -- Albero dei file del drive P:. Doppio clic sui file `.c` per modificare, sui file `.layout` per l'anteprima, sui `.p3d` per visualizzare i modelli, sui `.paa` per visualizzare le texture.
- **Script Editor** (centro) -- Area di modifica del codice con evidenziazione della sintassi, completamento del codice, sottolineatura degli errori, numeri di riga, indicatori dei breakpoint e modifica multi-file a schede.
- **Output** (in basso) -- Errori/avvisi del compilatore, output di `Print()` da un gioco connesso, messaggi di debug. Quando connesso a DayZDiag, questa finestra trasmette in tempo reale tutto il testo che l'eseguibile diagnostico stampa per scopi di debug -- lo stesso output che vedresti nei log degli script. Doppio clic sugli errori per navigare alla riga sorgente.
- **Properties** (destra) -- Proprietà dell'oggetto selezionato. Più utile nel Layout Editor per l'ispezione dei widget.
- **Console** -- Esecuzione live di comandi Enforce Script.
- **Pannelli di debug** (durante il debug) -- **Locals** (variabili dello scope corrente), **Watch** (espressioni dell'utente), **Call Stack** (catena delle funzioni), **Breakpoints** (elenco con toggle abilita/disabilita).

---

## Modifica degli Script

### Apertura dei File

1. **Resource Browser:** Doppio clic su un file `.c`. Questo apre automaticamente il modulo Script Editor e carica il file.
2. **Resource Browser dello Script Editor:** Lo Script Editor ha il proprio pannello Resource Browser integrato, separato dal Resource Browser principale di Workbench. Puoi usare entrambi per navigare e aprire i file script.
3. **File > Open:** Finestra di dialogo standard per l'apertura file.
4. **Output degli errori:** Doppio clic su un errore del compilatore per saltare al file e alla riga.

### Evidenziazione della Sintassi

| Elemento | Evidenziato |
|----------|-------------|
| Parole chiave (`class`, `if`, `while`, `return`, `modded`, `override`) | Grassetto / colore parola chiave |
| Tipi (`int`, `float`, `string`, `bool`, `vector`, `void`) | Colore tipo |
| Stringhe, commenti, direttive del preprocessore | Colori distinti |

### Completamento del Codice

Digita il nome di una classe seguito da `.` per vedere metodi e campi, oppure premi `Ctrl+Space` per i suggerimenti. Il completamento è basato sul contesto degli script compilati. È funzionale ma limitato rispetto a VS Code -- ideale per rapide consultazioni delle API.

### Feedback del Compilatore

Workbench compila al salvataggio. Errori comuni:

| Messaggio | Significato |
|-----------|-------------|
| `Undefined variable 'xyz'` | Non dichiarata o errore di battitura |
| `Method 'Foo' not found in class 'Bar'` | Nome del metodo o classe errati |
| `Cannot convert 'string' to 'int'` | Incompatibilità di tipo |
| `Type 'MyClass' not found` | File non nel progetto |

### Trova, Sostituisci e Vai alla Definizione

- `Ctrl+F` / `Ctrl+H` -- trova/sostituisci nel file corrente.
- `Ctrl+Shift+F` -- cerca in tutti i file del progetto.
- Clic destro su un simbolo e seleziona **Go to Definition** per saltare alla sua dichiarazione, anche negli script vanilla.

---

## Debug degli Script

Il debug è la funzionalità più potente di Workbench -- mette in pausa un'istanza di DayZ in esecuzione, ispeziona ogni variabile e avanza nel codice riga per riga.

### Prerequisiti

- **DayZDiag_x64.exe** (non il DayZ retail) -- solo la build Diag supporta il debug.
- **Drive P: montato** con gli script vanilla estratti.
- **Gli script devono corrispondere** -- se modifichi dopo il caricamento del gioco, i numeri di riga non si allineeranno.

### Configurazione di una Sessione di Debug

1. Apri Workbench e carica il tuo progetto.
2. Apri il modulo **Script Editor** (dalla barra dei menu o facendo doppio clic su qualsiasi file `.c` nel Resource Browser -- questo apre automaticamente lo Script Editor e carica il file).
3. Avvia DayZDiag separatamente:

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

4. Workbench rileva automaticamente DayZDiag e si connette. Appare un breve popup nell'angolo inferiore destro dello schermo che conferma la connessione.

> **Suggerimento:** Se hai bisogno solo di vedere l'output della console (senza breakpoint o avanzamento passo passo), non è necessario estrarre i PBO o caricare gli script in Workbench. Lo Script Editor si connetterà comunque a DayZDiag e mostrerà lo stream di Output. Tuttavia, i breakpoint e la navigazione del codice richiedono che i file script corrispondenti siano caricati nel progetto.

### Breakpoint

Clicca il margine sinistro accanto a un numero di riga. Appare un punto rosso.

| Marcatore | Significato |
|-----------|-------------|
| Punto rosso | Breakpoint attivo -- l'esecuzione si ferma qui |
| Esclamativo giallo | Non valido -- questa riga non viene mai eseguita |
| Punto blu | Segnalibro -- solo indicatore di navigazione |

Attiva/disattiva con `F9`. Puoi anche cliccare direttamente nell'area del margine (dove appaiono i punti rossi) per aggiungere o rimuovere breakpoint. Il clic destro nel margine aggiunge un **Segnalibro** blu -- i segnalibri non hanno effetto sull'esecuzione ma segnano i punti che vuoi rivisitare. Clic destro su un breakpoint per impostare una **condizione** (es. `i == 10` o `player.GetIdentity().GetName() == "TestPlayer"`).

### Esecuzione Passo Passo

| Azione | Scorciatoia | Descrizione |
|--------|-------------|-------------|
| Continua | `F5` | Esegui fino al prossimo breakpoint |
| Step Over | `F10` | Esegui la riga corrente, passa alla successiva |
| Step Into | `F11` | Entra nella funzione chiamata |
| Step Out | `Shift+F11` | Esegui fino al ritorno della funzione corrente |
| Stop | `Shift+F5` | Disconnetti e riprendi il gioco |

### Ispezione delle Variabili

Il pannello **Locals** mostra tutte le variabili nello scope -- primitive con valori, oggetti con nomi di classe (espandibili), array con lunghezze e riferimenti NULL chiaramente contrassegnati. Il pannello **Watch** valuta espressioni personalizzate ad ogni pausa. Il **Call Stack** mostra la catena delle funzioni; clicca le voci per navigare.

### Debug Client vs Server

`DayZDiag_x64.exe` può agire sia come client che come server (aggiungendo il parametro di lancio `-server`). Accetta tutti gli stessi parametri dell'eseguibile retail. Workbench può connettersi a entrambe le istanze.

Usa **Debug > Debug Client** o **Debug > Debug Server** nel menu dello Script Editor per scegliere quale lato debuggare. Su un listen server, puoi passare liberamente da uno all'altro. I controlli di avanzamento, i breakpoint e l'ispezione delle variabili si applicano tutti al lato attualmente selezionato.

### Limitazioni

- Solo `DayZDiag_x64.exe` supporta il debug, non le build retail.
- Le funzioni C++ interne al motore non possono essere seguite con step-into.
- Molti breakpoint in funzioni ad alta frequenza (`OnUpdate`) causano lag severo.
- Progetti di mod grandi possono rallentare l'indicizzazione di Workbench.

---

## Console degli Script -- Test in Tempo Reale

La Console degli Script ti permette di eseguire comandi Enforce Script su un'istanza di gioco in esecuzione -- inestimabile per la sperimentazione delle API senza modificare i file.

### Apertura

Cerca la scheda **Console** nel pannello inferiore, oppure abilitala tramite **View > Console**.

### Comandi Comuni

```c
// Stampa la posizione del giocatore
Print(GetGame().GetPlayer().GetPosition().ToString());

// Genera un oggetto ai piedi del giocatore
GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition(), false, false, true);

// Testa la matematica
float dist = vector.Distance("0 0 0", "100 0 100");
Print("Distance: " + dist.ToString());

// Teletrasporta il giocatore
GetGame().GetPlayer().SetPosition("6737 0 2505");

// Genera zombie nelle vicinanze
vector pos = GetGame().GetPlayer().GetPosition();
for (int i = 0; i < 5; i++)
{
    vector offset = Vector(Math.RandomFloat(-5, 5), 0, Math.RandomFloat(-5, 5));
    GetGame().CreateObject("ZmbF_JournalistNormal_Blue", pos + offset, false, false, true);
}
```

### Limitazioni

- **Solo lato client** per impostazione predefinita (il codice lato server necessita di un listen server).
- **Nessuno stato persistente** -- le variabili non si conservano tra le esecuzioni.
- **Alcune API non disponibili** finché il gioco non raggiunge uno stato specifico (giocatore generato, missione caricata).
- **Nessun recupero dagli errori** -- i puntatori null falliscono semplicemente in silenzio.

---

## Anteprima UI / Layout

Workbench può aprire i file `.layout` per l'ispezione visiva.

### Cosa Puoi Fare

- **Visualizzare la gerarchia dei widget** -- vedere l'annidamento genitore-figlio e i nomi dei widget.
- **Ispezionare le proprietà** -- posizione, dimensione, colore, alfa, allineamento, sorgente immagine, testo, font.
- **Trovare i nomi dei widget** usati da `FindAnyWidget()` nel codice script.
- **Controllare i riferimenti alle immagini** -- quali voci degli image set o texture usa un widget.

### Cosa Non Puoi Fare

- **Nessun comportamento a runtime** -- I gestori ScriptClass e il contenuto dinamico non vengono eseguiti.
- **Differenze di rendering** -- trasparenza, stratificazione e risoluzione possono differire dal gioco.
- **Modifica limitata** -- Workbench è principalmente un visualizzatore, non un designer visuale.

**Buona pratica:** Usa il Layout Editor per l'ispezione. Costruisci e modifica i file `.layout` in un editor di testo. Testa in gioco con il file patching.

---

## Browser delle Risorse

Il Resource Browser naviga il drive P: con anteprime dei file consapevoli del gioco.

### Funzionalità

| Tipo di File | Azione al Doppio Clic |
|-------------|----------------------|
| `.c` | Si apre nello Script Editor |
| `.layout` | Si apre nel Layout Editor |
| `.p3d` | Anteprima del modello 3D (rotazione, zoom, ispezione dei LOD) |
| `.paa` / `.edds` | Visualizzatore texture con ispezione dei canali (R, G, B, A) |
| Classi di config | Esplora le gerarchie CfgVehicles, CfgWeapons analizzate |

### Trovare Risorse Vanilla

Uno degli usi più preziosi -- studiare come Bohemia struttura le risorse:

```
P:\DZ\weapons\        <-- Modelli e texture delle armi vanilla
P:\DZ\characters\     <-- Modelli dei personaggi e vestiti
P:\scripts\4_World\   <-- Script del mondo vanilla
P:\scripts\5_Mission\  <-- Script delle missioni vanilla
```

---

## Profilazione delle Prestazioni

Quando connesso a DayZDiag, Workbench può profilare l'esecuzione degli script.

### Cosa Mostra il Profiler

- **Conteggio chiamate funzione** -- quante volte ogni funzione viene eseguita per frame.
- **Tempo di esecuzione** -- millisecondi per funzione.
- **Gerarchia delle chiamate** -- quali funzioni chiamano quali, con attribuzione del tempo.
- **Ripartizione del tempo per frame** -- tempo degli script vs tempo del motore. A 60 FPS, ogni frame ha un budget di ~16.6ms.
- **Memoria** -- conteggi di allocazione per classe, rilevamento di leak da cicli di riferimenti.

### Script Profiler In-Game (Menu Diag)

Oltre al profiler di Workbench, `DayZDiag_x64.exe` ha uno Script Profiler integrato accessibile tramite il Menu Diag (sotto Statistics). Mostra le top-20 per tempo per classe, tempo per funzione, allocazioni per classe, conteggio per funzione e conteggio delle istanze per classe. Usa il parametro di lancio `-profile` per abilitare la profilazione dall'avvio. Il profiler misura solo Enforce Script -- i metodi proto (del motore) non vengono misurati come voci separate, ma il loro tempo di esecuzione è incluso nel tempo totale del metodo script che li chiama. Vedi `EnProfiler.c` negli script vanilla per l'API programmatica (`EnProfiler.Enable`, `EnProfiler.SetModule`, costanti dei flag).

### Colli di Bottiglia Comuni

| Problema | Sintomo nel Profiler | Soluzione |
|----------|---------------------|----------|
| Codice costoso eseguito ogni frame | Alto tempo in `OnUpdate` | Sposta sui timer, riduci la frequenza |
| Iterazione eccessiva | Loop con migliaia di chiamate | Metti in cache i risultati, usa query spaziali |
| Concatenazione di stringhe nei loop | Alto conteggio di allocazioni | Riduci il logging, raggruppa le stringhe |

---

## Integrazione con il File Patching

Il flusso di lavoro di sviluppo più veloce combina Workbench con il file patching, eliminando le ricostruzioni PBO per le modifiche agli script.

### Configurazione

1. Script sul drive P: come file sciolti (non nei PBO).
2. Collegamento simbolico degli script di installazione di DayZ: `mklink /J "...\DayZ\scripts" "P:\scripts"`
3. Avvia con `-filePatching`: sia il client che il server usano `DayZDiag_x64.exe`.

### Il Ciclo di Iterazione Rapida

```
1. Modifica il file .c nel tuo editor
2. Salva (il file è già sul drive P:)
3. Riavvia la missione in DayZDiag (nessuna ricostruzione PBO)
4. Testa in gioco
5. Imposta breakpoint in Workbench se necessario
6. Ripeti
```

### Cosa Deve Essere Ricostruito?

| Modifica | Ricostruire? |
|----------|-------------|
| Logica script (`.c`) | No -- riavvia la missione |
| File layout (`.layout`) | No -- riavvia la missione |
| Config.cpp (solo script) | No -- riavvia la missione |
| Config.cpp (con CfgVehicles) | Sì -- i config binarizzati richiedono PBO |
| Texture (`.paa`) | No -- il motore ricarica da P: |
| Modelli (`.p3d`) | Forse -- solo MLOD non binarizzati |

---

## Problemi Comuni di Workbench

### Workbench Va in Crash all'Avvio

**Causa:** Drive P: non montato oppure il `.gproj` fa riferimento a percorsi inesistenti.
**Soluzione:** Monta prima il P:. Controlla la directory sorgente in **Workbench > Options**. Verifica che i percorsi FileSystem del `.gproj` esistano.

### Nessun Completamento del Codice

**Causa:** Progetto mal configurato -- Workbench non riesce a compilare gli script.
**Soluzione:** Verifica che gli ScriptModules del `.gproj` includano i percorsi vanilla (`scripts/1_Core`, ecc.). Controlla l'Output per errori del compilatore. Assicurati che gli script vanilla siano su P:.

### Gli Script Non Compilano

**Soluzione:** Controlla il pannello Output per gli errori esatti. Verifica che tutti i percorsi delle mod dipendenti siano in ScriptModules. Assicurati che non ci siano riferimenti tra layer (3_Game non può usare tipi di 4_World).

### I Breakpoint Non Si Attivano

**Lista di controllo:**
1. Connesso a DayZDiag (non retail)?
2. Punto rosso (valido) o esclamativo giallo (non valido)?
3. Gli script corrispondono tra Workbench e gioco?
4. Stai facendo il debug del lato giusto (client vs server)?
5. Il percorso del codice viene effettivamente raggiunto? (Aggiungi `Print()` per verificare.)

### Non Si Trovano i File nel Resource Browser

**Soluzione:** Controlla che il FileSystem del `.gproj` includa la directory dove si trovano i tuoi file. Riavvia Workbench dopo aver modificato il `.gproj`.

### Errori "Plugin Not Found"

**Soluzione:** Verifica l'integrità di DayZ Tools tramite Steam (clic destro > Proprietà > File installati > Verifica). Reinstalla se necessario.

### La Connessione a DayZDiag Fallisce

**Soluzione:** Entrambi i processi devono essere sulla stessa macchina. Controlla i firewall. Assicurati che il modulo Script Editor sia aperto prima di avviare DayZDiag. Prova a riavviare entrambi.

---

## Suggerimenti e Buone Pratiche

1. **Usa Workbench per il debug, VS Code per scrivere.** L'editor di Workbench è basilare. Usa editor esterni per la programmazione quotidiana; passa a Workbench per il debug e l'anteprima dei layout.

2. **Mantieni un .gproj per mod.** Ogni mod dovrebbe avere il proprio file di progetto per compilare esattamente il contesto script corretto senza indicizzare mod non correlate.

3. **Usa la console per sperimentare con le API.** Testa le chiamate API nella console prima di scriverle nei file. Più veloce dei cicli modifica-riavvio-test.

4. **Profila prima di ottimizzare.** Non indovinare i colli di bottiglia. Il profiler mostra dove il tempo viene effettivamente speso.

5. **Imposta i breakpoint in modo strategico.** Evita breakpoint in `OnUpdate()` a meno che non siano condizionali. Si attivano ogni frame e congelano il gioco costantemente.

6. **Usa i segnalibri per la navigazione.** I punti blu dei segnalibri segnano posizioni interessanti negli script vanilla che consulti frequentemente.

7. **Controlla l'output del compilatore prima di lanciare.** Se Workbench segnala errori, il gioco fallirà anch'esso. Correggi gli errori in Workbench prima -- più veloce che aspettare l'avvio del gioco.

8. **Usa -mod per configurazioni semplici, .gproj per complesse.** Singola mod senza dipendenze: `-mod=P:\MyMod`. Multi-mod con CF/Dabs: `.gproj` personalizzato.

9. **Tieni Workbench aggiornato.** Aggiorna DayZ Tools tramite Steam quando DayZ viene aggiornato. Versioni non corrispondenti causano errori di compilazione.

---

## Riferimento Rapido: Scorciatoie da Tastiera

| Scorciatoia | Azione |
|-------------|--------|
| `F5` | Avvia / Continua il debug |
| `Shift+F5` | Ferma il debug |
| `F9` | Attiva/disattiva breakpoint |
| `F10` | Step Over |
| `F11` | Step Into |
| `Shift+F11` | Step Out |
| `Ctrl+F` | Trova nel file |
| `Ctrl+H` | Trova e sostituisci |
| `Ctrl+Shift+F` | Trova nel progetto |
| `Ctrl+S` | Salva |
| `Ctrl+Space` | Completamento del codice |

## Riferimento Rapido: Parametri di Lancio

| Parametro | Descrizione |
|-----------|-------------|
| `-project="percorso/dayz.gproj"` | Carica un file di progetto specifico |
| `-mod=P:\MyMod` | Auto-configurazione dal config.cpp della mod |
| `-mod=P:\ModA;P:\ModB` | Mod multiple (separate da punto e virgola) |

---

## Navigazione

| Precedente | Su | Successivo |
|------------|-----|-----------|
| [4.6 Impacchettamento PBO](06-pbo-packing.md) | [Parte 4: Formati di File e DayZ Tools](01-textures.md) | [4.8 Modellazione di Edifici](08-building-modeling.md) |
