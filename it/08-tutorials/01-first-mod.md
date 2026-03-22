# Capitolo 8.1: Il tuo primo mod (Hello World)

[Home](../../README.md) | **Il tuo primo mod** | [Successivo: Creare un oggetto personalizzato >>](02-custom-item.md)

---

> **Riepilogo:** Questo tutorial ti guida nella creazione del tuo primo mod DayZ partendo da zero assoluto. Installerai gli strumenti, configurerai lo spazio di lavoro, scriverai tre file, impacchetterai un PBO, caricherai il mod in DayZ e verificherai il suo funzionamento leggendo il log degli script. Non è richiesta alcuna esperienza precedente di modding DayZ.

---

## Indice dei contenuti

- [Prerequisiti](#prerequisiti)
- [Passo 1: Installare DayZ Tools](#passo-1-installare-dayz-tools)
- [Passo 2: Configurare il disco P: (Workdrive)](#passo-2-configurare-il-disco-p-workdrive)
- [Passo 3: Creare la struttura delle cartelle del mod](#passo-3-creare-la-struttura-delle-cartelle-del-mod)
- [Passo 4: Scrivere mod.cpp](#passo-4-scrivere-modcpp)
- [Passo 5: Scrivere config.cpp](#passo-5-scrivere-configcpp)
- [Passo 6: Scrivere il primo script](#passo-6-scrivere-il-primo-script)
- [Passo 7: Impacchettare il PBO con Addon Builder](#passo-7-impacchettare-il-pbo-con-addon-builder)
- [Passo 8: Caricare il mod in DayZ](#passo-8-caricare-il-mod-in-dayz)
- [Passo 9: Verificare nel log degli script](#passo-9-verificare-nel-log-degli-script)
- [Passo 10: Risoluzione dei problemi comuni](#passo-10-risoluzione-dei-problemi-comuni)
- [Riferimento completo dei file](#riferimento-completo-dei-file)
- [Prossimi passi](#prossimi-passi)

---

## Prerequisiti

Prima di iniziare, assicurati di avere:

- **Steam** installato e connesso
- Il gioco **DayZ** installato (versione retail da Steam)
- Un **editor di testo** (VS Code, Notepad++ o anche il Blocco note)
- Circa **15 GB di spazio libero su disco** per DayZ Tools

Questo è tutto. Per questo tutorial non è richiesta alcuna esperienza di programmazione -- ogni riga di codice è spiegata.

---

## Passo 1: Installare DayZ Tools

DayZ Tools è un'applicazione gratuita su Steam che include tutto il necessario per costruire mod: l'editor di script Workbench, Addon Builder per l'impacchettamento PBO, Terrain Builder e Object Builder.

### Come installare

1. Apri **Steam**
2. Vai alla **Libreria**
3. Nel filtro a tendina in alto, cambia **Giochi** in **Strumenti**
4. Cerca **DayZ Tools**
5. Clicca su **Installa**
6. Attendi il completamento del download (circa 12-15 GB)

Una volta installato, troverai DayZ Tools nella tua libreria Steam sotto Strumenti. Il percorso di installazione predefinito è:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
```

### Cosa viene installato

| Strumento | Scopo |
|------|---------|
| **Addon Builder** | Impacchetta i file del tuo mod in archivi `.pbo` |
| **Workbench** | Editor di script con evidenziazione della sintassi |
| **Object Builder** | Visualizzatore e editor di modelli 3D per file `.p3d` |
| **Terrain Builder** | Editor di mappe/terreni |
| **TexView2** | Visualizzatore/convertitore di texture (`.paa`, `.edds`) |

Per questo tutorial hai bisogno solo di **Addon Builder**. Gli altri saranno utili in seguito.

---

## Passo 2: Configurare il disco P: (Workdrive)

Il modding di DayZ utilizza una lettera di unità virtuale **P:** come spazio di lavoro condiviso. Tutti i mod e i dati di gioco fanno riferimento a percorsi che iniziano con P:, il che mantiene i percorsi coerenti su macchine diverse.

### Creazione del disco P:

1. Apri **DayZ Tools** da Steam
2. Nella finestra principale di DayZ Tools, clicca su **P: Drive Management** (o cerca un pulsante con l'etichetta "Mount P drive" / "Setup P drive")
3. Clicca su **Create/Mount P: Drive**
4. Scegli una posizione per i dati del disco P: (quella predefinita va bene, o scegli un'unità con spazio sufficiente)
5. Attendi il completamento del processo

### Verifica del funzionamento

Apri **Esplora file** e naviga in `P:\`. Dovresti vedere una cartella contenente dati di gioco DayZ. Se il disco P: esiste e puoi sfogliarlo, sei pronto a procedere.

### Alternativa: Disco P: manuale

Se la GUI di DayZ Tools non funziona, puoi creare un disco P: manualmente usando il prompt dei comandi di Windows (eseguito come Amministratore):

```batch
subst P: "C:\DayZWorkdrive"
```

Sostituisci `C:\DayZWorkdrive` con qualsiasi cartella tu voglia. Questo crea una mappatura temporanea dell'unità che dura fino al riavvio. Per una mappatura permanente, usa `net use` o la GUI di DayZ Tools.

### E se non voglio usare il disco P:?

Puoi sviluppare senza il disco P: posizionando la cartella del mod direttamente nella cartella di gioco DayZ e usando la modalità `-filePatching`. Tuttavia, il disco P: è il flusso di lavoro standard e tutta la documentazione ufficiale lo presuppone. Raccomandiamo vivamente di configurarlo.

---

## Passo 3: Creare la struttura delle cartelle del mod

Ogni mod DayZ segue una struttura di cartelle specifica. Crea le seguenti cartelle e file sul tuo disco P: (o nella cartella di gioco DayZ se non usi P:):

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### Creare le cartelle

1. Apri **Esplora file**
2. Naviga in `P:\`
3. Crea una nuova cartella chiamata `MyFirstMod`
4. Dentro `MyFirstMod`, crea una cartella chiamata `Scripts`
5. Dentro `Scripts`, crea una cartella chiamata `5_Mission`
6. Dentro `5_Mission`, crea una cartella chiamata `MyFirstMod`

### Comprendere la struttura

| Percorso | Scopo |
|------|---------|
| `MyFirstMod/` | Radice del tuo mod |
| `mod.cpp` | Metadati (nome, autore) mostrati nel launcher di DayZ |
| `Scripts/config.cpp` | Dice al motore da cosa dipende il tuo mod e dove si trovano gli script |
| `Scripts/5_Mission/` | Il livello script delle missioni (UI, hook di avvio) |
| `Scripts/5_Mission/MyFirstMod/` | Sottocartella per gli script di missione del tuo mod |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | Il tuo file script effettivo |

Hai bisogno esattamente di **3 file**. Creiamoli uno alla volta.

---

## Passo 4: Scrivere mod.cpp

Crea il file `P:\MyFirstMod\mod.cpp` nel tuo editor di testo e incolla questo contenuto:

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Cosa fa ogni riga

- **`name`** -- Il nome visualizzato nella lista dei mod del launcher DayZ. I giocatori vedono questo quando selezionano i mod.
- **`author`** -- Il tuo nome o il nome del team.
- **`version`** -- Qualsiasi stringa di versione tu voglia. Il motore non la analizza.
- **`overview`** -- Una descrizione mostrata quando si espandono i dettagli del mod.

Salva il file. Questa è la carta d'identità del tuo mod.

---

## Passo 5: Scrivere config.cpp

Crea il file `P:\MyFirstMod\Scripts\config.cpp` e incolla questo contenuto:

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Cosa fa ogni sezione

**CfgPatches** dichiara il tuo mod al motore DayZ:

- `class MyFirstMod_Scripts` -- Un identificatore unico per il pacchetto script del tuo mod. Non deve collidere con nessun altro mod.
- `units[] = {}; weapons[] = {};` -- Liste di entità e armi aggiunte dal tuo mod. Vuote per ora.
- `requiredVersion = 0.1;` -- Versione minima del gioco. Sempre `0.1`.
- `requiredAddons[] = { "DZ_Data" };` -- Dipendenze. `DZ_Data` sono i dati base del gioco. Questo assicura che il tuo mod si carichi **dopo** il gioco base.

**CfgMods** dice al motore dove si trovano i tuoi script:

- `dir = "MyFirstMod";` -- Cartella radice del mod.
- `type = "mod";` -- Questo è un mod client+server (al contrario di `"servermod"` solo per server).
- `dependencies[] = { "Mission" };` -- Il tuo codice si aggancia al modulo script Mission.
- `class missionScriptModule` -- Dice al motore di compilare tutti i file `.c` trovati in `MyFirstMod/Scripts/5_Mission/`.

**Perché solo `5_Mission`?** Perché il nostro script Hello World si aggancia all'evento di avvio della missione, che risiede nel livello missioni. La maggior parte dei mod semplici inizia qui.

---

## Passo 6: Scrivere il primo script

Crea il file `P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` e incolla questo contenuto:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### Spiegazione riga per riga

```c
modded class MissionServer
```
La parola chiave `modded` è il cuore del modding DayZ. Dice: "Prendi la classe `MissionServer` esistente dal gioco vanilla e aggiungi le mie modifiche sopra." Non stai creando una nuova classe -- stai estendendo quella esistente.

```c
    override void OnInit()
```
`OnInit()` viene chiamato dal motore quando una missione inizia. `override` dice al compilatore che questo metodo esiste già nella classe padre e lo stiamo sostituendo con la nostra versione.

```c
        super.OnInit();
```
**Questa riga è critica.** `super.OnInit()` chiama l'implementazione vanilla originale. Se la salti, il codice di inizializzazione vanilla della missione non viene mai eseguito e il gioco si rompe. Chiama sempre `super` per primo.

```c
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
```
`Print()` scrive un messaggio nel file di log degli script DayZ. Il prefisso `[MyFirstMod]` rende facile trovare i tuoi messaggi nel log.

```c
modded class MissionGameplay
```
`MissionGameplay` è l'equivalente lato client di `MissionServer`. Quando un giocatore si unisce a un server, `MissionGameplay.OnInit()` si attiva sulla sua macchina. Modificando entrambe le classi, il tuo messaggio appare sia nei log del server che del client.

### Riguardo ai file `.c`

Gli script DayZ usano l'estensione `.c`. Nonostante sembrino C, questo è **Enforce Script**, il linguaggio di scripting proprietario di DayZ. Ha classi, ereditarietà, array e mappe, ma non è C, C++ o C#. Il tuo IDE potrebbe mostrare errori di sintassi -- è normale e previsto.

---

## Passo 7: Impacchettare il PBO con Addon Builder

DayZ carica i mod da file archivio `.pbo` (simili ai .zip ma in un formato che il motore comprende). Devi impacchettare la tua cartella `Scripts` in un PBO.

### Utilizzare Addon Builder (GUI)

1. Apri **DayZ Tools** da Steam
2. Clicca su **Addon Builder** per avviarlo
3. Imposta **Source directory** su: `P:\MyFirstMod\Scripts\`
4. Imposta **Output/Destination directory** su una nuova cartella: `P:\@MyFirstMod\Addons\`

   Crea prima la cartella `@MyFirstMod\Addons\` se non esiste.

5. In **Addon Builder Options**:
   - Imposta **Prefix** su: `MyFirstMod\Scripts`
   - Lascia le altre opzioni ai valori predefiniti
6. Clicca su **Pack**

Se ha successo, vedrai un file in:

```
P:\@MyFirstMod\Addons\Scripts.pbo
```

### Configurare la struttura finale del mod

Ora copia il tuo `mod.cpp` accanto alla cartella `Addons`:

```
P:\@MyFirstMod\
    mod.cpp                         <-- Copia da P:\MyFirstMod\mod.cpp
    Addons\
        Scripts.pbo                 <-- Creato da Addon Builder
```

Il prefisso `@` sul nome della cartella è una convenzione per i mod distribuibili. Segnala agli amministratori del server e al launcher che questo è un pacchetto mod.

### Alternativa: Testare senza impacchettare (File Patching)

Durante lo sviluppo, puoi saltare completamente l'impacchettamento PBO usando la modalità file patching. Questa carica gli script direttamente dalle tue cartelle sorgente:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

Il file patching è più veloce per l'iterazione perché modifichi un file `.c`, riavvii il gioco e vedi le modifiche immediatamente. Nessun passaggio di impacchettamento necessario. Tuttavia, il file patching funziona solo con l'eseguibile diagnostico (`DayZDiag_x64.exe`) e non è adatto alla distribuzione.

---

## Passo 8: Caricare il mod in DayZ

Ci sono due modi per caricare il tuo mod: attraverso il launcher o tramite parametri da riga di comando.

### Opzione A: DayZ Launcher

1. Apri il **DayZ Launcher** da Steam
2. Vai alla scheda **Mods**
3. Clicca su **Add local mod** (o "Add mod from local storage")
4. Naviga in `P:\@MyFirstMod\`
5. Abilita il mod spuntando la sua casella
6. Clicca su **Play** (assicurati di connetterti a un server locale/offline, o di avviare la modalità giocatore singolo)

### Opzione B: Riga di comando (raccomandata per lo sviluppo)

Per un'iterazione più veloce, avvia DayZ direttamente con parametri da riga di comando. Crea un collegamento o un file batch:

**Usando l'eseguibile diagnostico (con file patching, senza bisogno di PBO):**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\MyFirstMod -filePatching -server -config=serverDZ.cfg -port=2302
```

**Usando il PBO impacchettato:**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\@MyFirstMod -server -config=serverDZ.cfg -port=2302
```

Il flag `-server` avvia un server listen locale. Il flag `-filePatching` permette il caricamento di script da cartelle non impacchettate.

### Test rapido: Modalità offline

Il modo più veloce per testare è avviare DayZ in modalità offline:

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

Poi nel menu principale, clicca su **Play** e seleziona **Offline Mode** (o **Community Offline**). Questo avvia una sessione giocatore singolo locale senza bisogno di un server.

---

## Passo 9: Verificare nel log degli script

Dopo aver avviato DayZ con il tuo mod, il motore scrive tutto l'output di `Print()` nei file di log.

### Trovare i file di log

DayZ conserva i log nella tua cartella AppData locale:

```
C:\Users\<IlTuoNomeUtenteWindows>\AppData\Local\DayZ\
```

Per arrivarci velocemente:
1. Premi **Win + R** per aprire la finestra di dialogo Esegui
2. Digita `%localappdata%\DayZ` e premi Invio

Cerca il file più recente con un nome come:

```
script_<data>_<ora>.log
```

Per esempio: `script_2025-01-15_14-30-22.log`

### Cosa cercare

Apri il file di log nel tuo editor di testo e cerca `[MyFirstMod]`. Dovresti vedere uno di questi messaggi:

```
[MyFirstMod] Hello World! The SERVER mission has started.
```

o (se hai caricato come client):

```
[MyFirstMod] Hello World! The CLIENT mission has started.
```

**Se vedi il tuo messaggio: congratulazioni.** Il tuo primo mod DayZ funziona. Hai con successo:

1. Creato una struttura di cartelle del mod
2. Scritto una configurazione che il motore legge
3. Agganciato il codice vanilla del gioco con `modded class`
4. Stampato output nel log degli script

### E se vedi errori?

Se il log contiene righe che iniziano con `SCRIPT (E):`, qualcosa è andato storto. Leggi la sezione successiva.

---

## Passo 10: Risoluzione dei problemi comuni

### Problema: Nessun output nel log (il mod sembra non caricarsi)

**Controlla i parametri di avvio.** Il percorso `-mod=` deve puntare alla cartella corretta. Se usi il file patching, verifica che il percorso punti alla cartella che contiene `Scripts/config.cpp` direttamente (non la cartella `@`).

**Controlla che config.cpp esista al livello corretto.** Deve essere in `Scripts/config.cpp` dentro la radice del tuo mod. Se è nella cartella sbagliata, il motore ignora silenziosamente il tuo mod.

**Controlla il nome della classe CfgPatches.** Se non c'è un blocco `CfgPatches`, o la sua sintassi è sbagliata, l'intero PBO viene saltato.

**Controlla il log principale di DayZ** (non solo il log degli script). Controlla:
```
C:\Users\<IlTuoNome>\AppData\Local\DayZ\DayZ_<data>_<ora>.RPT
```
Cerca il nome del tuo mod. Potresti vedere messaggi come "Addon MyFirstMod_Scripts requires addon DZ_Data which is not loaded."

### Problema: `SCRIPT (E): Undefined variable` o `Undefined type`

Questo significa che il tuo codice fa riferimento a qualcosa che il motore non riconosce. Cause comuni:

- **Errore di battitura nel nome della classe.** `MisionServer` invece di `MissionServer` (nota la doppia 's').
- **Livello script sbagliato.** Se fai riferimento a `PlayerBase` da `5_Mission`, dovrebbe funzionare. Ma se hai accidentalmente posizionato il tuo file in `3_Game` e fai riferimento a tipi di missione, otterrai questo errore.
- **Chiamata `super.OnInit()` mancante.** Ometterla può causare errori a cascata.

### Problema: `SCRIPT (E): Member not found`

Il metodo che stai chiamando non esiste sulla classe. Controlla due volte il nome del metodo e assicurati di sovrascrivere un vero metodo vanilla. `OnInit` esiste su `MissionServer` e `MissionGameplay` -- ma non su ogni classe.

### Problema: Il mod si carica ma lo script non viene mai eseguito

- **Estensione del file:** Assicurati che il tuo file script termini con `.c` (non `.c.txt` o `.cs`). Windows potrebbe nascondere le estensioni per impostazione predefinita.
- **Disallineamento del percorso dello script:** Il percorso `files[]` in `config.cpp` deve corrispondere alla tua effettiva cartella. `"MyFirstMod/Scripts/5_Mission"` significa che il motore cerca una cartella esattamente in quel percorso relativo alla radice del mod.
- **Nome della classe:** `modded class MissionServer` distingue maiuscole e minuscole. Deve corrispondere esattamente al nome della classe vanilla.

### Problema: Errori di impacchettamento PBO

- Assicurati che `config.cpp` sia al livello radice di ciò che stai impacchettando (la cartella `Scripts/`).
- Controlla che il prefisso in Addon Builder corrisponda al percorso del tuo mod.
- Assicurati che non ci siano file non testuali mescolati nella cartella Scripts (nessun `.exe`, `.dll` o file binari).

### Problema: Il gioco va in crash all'avvio

- Controlla gli errori di sintassi in `config.cpp`. Un punto e virgola, parentesi o virgolette mancanti possono far crashare il parser della configurazione.
- Verifica che `requiredAddons` elenchi nomi di addon validi. Un nome di addon scritto male causa un errore grave.
- Rimuovi il tuo mod dai parametri di avvio e conferma che il gioco si avvia senza di esso. Poi aggiungilo di nuovo per isolare il problema.

---

## Riferimento completo dei file

Ecco tutti e tre i file nella loro forma completa, per un facile copia e incolla:

### File 1: `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### File 2: `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### File 3: `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## Prossimi passi

Ora che hai un mod funzionante, ecco le progressioni naturali:

1. **[Capitolo 8.2: Creare un oggetto personalizzato](02-custom-item.md)** -- Definisci un nuovo oggetto di gioco con texture e spawning.
2. **Aggiungi più livelli script** -- Crea le cartelle `3_Game` e `4_World` per organizzare configurazione, classi di dati e logica delle entità. Vedi [Capitolo 2.1: La gerarchia a 5 livelli degli script](../02-mod-structure/01-five-layers.md).
3. **Aggiungi associazioni di tasti** -- Crea un file `Inputs.xml` e registra azioni personalizzate dei tasti.
4. **Crea UI** -- Costruisci pannelli di gioco usando file di layout e `ScriptedWidgetEventHandler`. Vedi [Capitolo 3: Sistema GUI](../03-gui-system/01-widget-types.md).
5. **Usa un framework** -- Integra con Community Framework (CF) o un altro framework per funzionalità avanzate come RPC, gestione della configurazione e pannelli di amministrazione.

---

## Buone pratiche

- **Testa sempre con `-filePatching` prima di costruire PBO.** Elimina il ciclo impacchettamento-copia-riavvio e riduce il tempo di iterazione da minuti a secondi.
- **Inizia con il livello `5_Mission` per l'iterazione più veloce.** Gli hook delle missioni come `OnInit()` sono il modo più semplice per dimostrare che il tuo mod si carica e funziona. Aggiungi `3_Game` e `4_World` solo quando ne hai effettivamente bisogno.
- **Chiama sempre `super` per primo nei metodi sovrascritti.** Omettere `super.OnInit()` rompe silenziosamente il comportamento vanilla e ogni altro mod che si aggancia allo stesso metodo.
- **Usa un prefisso unico nell'output di Print** (es. `[MyFirstMod]`). I log degli script contengono migliaia di righe dal vanilla e da altri mod -- un prefisso è l'unico modo per trovare velocemente il tuo output.
- **Mantieni la sintassi di `config.cpp` semplice e valida.** Un punto e virgola o parentesi mancante in config.cpp causa un crash grave o un salto silenzioso del mod senza messaggi di errore chiari.

---

## Teoria vs. pratica

| Concetto | Teoria | Realtà |
|---------|--------|---------|
| Campi di `mod.cpp` | `version` viene usata per la risoluzione delle dipendenze | Il motore ignora completamente la stringa di versione -- è puramente cosmetica per il launcher. |
| CfgPatches `requiredAddons` | Elenca le dipendenze in modo che il tuo mod si carichi nell'ordine corretto | Se scrivi male il nome di un addon, l'intero PBO viene saltato silenziosamente senza errori nel log degli script. Controlla il file `.RPT`. |
| File patching | Modifica un file `.c` e riconnettiti per vedere le modifiche istantaneamente | `config.cpp` e i file appena aggiunti NON sono coperti dal file patching. Per quelli hai ancora bisogno di ricostruire il PBO. |
| Test in modalità offline | Modo veloce per verificare che il tuo mod funzioni | Alcune API (come `GetGame().GetPlayer().GetIdentity()`) restituiscono NULL in modalità offline, causando crash che non si verificano su un vero server. |

---

## Cosa hai imparato

In questo tutorial hai imparato:
- Come installare DayZ Tools e configurare lo spazio di lavoro del disco P:
- I tre file essenziali di cui ogni mod ha bisogno: `mod.cpp`, `config.cpp` e almeno uno script `.c`
- Come `modded class` estende le classi vanilla senza sostituirle
- Come impacchettare un PBO, caricare un mod e verificare che funzioni leggendo il log degli script

**Successivo:** [Capitolo 8.2: Creare un oggetto personalizzato](02-custom-item.md)
