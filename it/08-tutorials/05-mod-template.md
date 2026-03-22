# Capitolo 8.5: Usare il Template per Mod DayZ

> **Riassunto:** Questo tutorial mostra come utilizzare il template open-source per mod DayZ di InclementDab per creare un nuovo progetto mod in pochi secondi. Invece di creare ogni file da zero, si clona uno scheletro pronto all'uso che ha gia' la struttura di cartelle corretta, config.cpp, mod.cpp e gli stub dei layer degli script. Basta rinominare alcune cose e si puo' iniziare a scrivere codice immediatamente.

---

## Indice dei Contenuti

- [Cos'e' il Template per Mod DayZ?](#cose-il-template-per-mod-dayz)
- [Cosa Fornisce il Template](#cosa-fornisce-il-template)
- [Passo 1: Clonare o Scaricare il Template](#passo-1-clonare-o-scaricare-il-template)
- [Passo 2: Comprendere la Struttura dei File](#passo-2-comprendere-la-struttura-dei-file)
- [Passo 3: Rinominare il Mod](#passo-3-rinominare-il-mod)
- [Passo 4: Aggiornare config.cpp](#passo-4-aggiornare-configcpp)
- [Passo 5: Aggiornare mod.cpp](#passo-5-aggiornare-modcpp)
- [Passo 6: Rinominare le Cartelle e i File degli Script](#passo-6-rinominare-le-cartelle-e-i-file-degli-script)
- [Passo 7: Compilare e Testare](#passo-7-compilare-e-testare)
- [Integrazione con DayZ Tools e Workbench](#integrazione-con-dayz-tools-e-workbench)
- [Template vs. Configurazione Manuale](#template-vs-configurazione-manuale)
- [Prossimi Passi](#prossimi-passi)

---

## Cos'e' il Template per Mod DayZ?

Il **Template per Mod DayZ** e' un repository open-source mantenuto da InclementDab che fornisce uno scheletro completo e pronto all'uso per i mod DayZ:

**Repository:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Invece di creare ogni file a mano (come descritto nel [Capitolo 8.1: Il Tuo Primo Mod](01-first-mod.md)), il template fornisce una struttura di directory pre-costruita con tutto il codice boilerplate gia' presente. Si clona, si rinominano alcuni identificatori, e si e' pronti a scrivere la logica di gioco.

Questo e' il punto di partenza raccomandato per chiunque abbia gia' creato un mod Hello World e voglia passare a progetti piu' complessi.

---

## Cosa Fornisce il Template

Il template include tutto cio' di cui un mod DayZ ha bisogno per compilare e caricarsi:

| File / Cartella | Scopo |
|-----------------|-------|
| `mod.cpp` | Metadati del mod (nome, autore, versione) visualizzati nel launcher di DayZ |
| `config.cpp` | Dichiarazioni CfgPatches e CfgMods che registrano il mod con il motore |
| `Scripts/3_Game/` | Stub degli script del layer Game (enum, costanti, classi config) |
| `Scripts/4_World/` | Stub degli script del layer World (entita', manager, interazioni mondo) |
| `Scripts/5_Mission/` | Stub degli script del layer Mission (UI, hook della missione) |
| `.gitignore` | Ignore pre-configurati per lo sviluppo DayZ (PBO, log, file temporanei) |

Il template segue la gerarchia standard a 5 layer degli script documentata nel [Capitolo 2.1: La Gerarchia a 5 Layer degli Script](../02-mod-structure/01-five-layers.md). Tutti e tre i layer degli script sono configurati in config.cpp, cosi' si puo' immediatamente inserire codice in qualsiasi layer senza configurazione aggiuntiva.

---

## Passo 1: Clonare o Scaricare il Template

### Opzione A: Usare la Funzione "Use this template" di GitHub

1. Vai su [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Clicca il pulsante verde **"Use this template"** in alto nel repository
3. Scegli **"Create a new repository"**
4. Dai un nome al tuo repository (es. `MyAwesomeMod`)
5. Clona il tuo nuovo repository nel drive P:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### Opzione B: Clone Diretto

Se non hai bisogno di un tuo repository GitHub, clona il template direttamente:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Opzione C: Scarica come ZIP

1. Vai alla pagina del repository
2. Clicca **Code** poi **Download ZIP**
3. Estrai lo ZIP in `P:\MyAwesomeMod\`

---

## Passo 2: Comprendere la Struttura dei File

Dopo la clonazione, la directory del tuo mod appare cosi':

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (script del layer game)
        4_World\
            ModName\
                (script del layer world)
        5_Mission\
            ModName\
                (script del layer mission)
```

### Come Ogni Pezzo si Inserisce nel Tutto

**`mod.cpp`** e' la carta d'identita' del tuo mod. Controlla cio' che i giocatori vedono nella lista mod del launcher DayZ. Consulta il [Capitolo 2.3: mod.cpp e Workshop](../02-mod-structure/03-mod-cpp.md) per tutti i campi disponibili.

**`Scripts/config.cpp`** e' il file piu' critico. Dice al motore DayZ:
- Da cosa dipende il tuo mod (`CfgPatches.requiredAddons[]`)
- Dove si trova ogni layer degli script (`CfgMods.class defs`)
- Quali definizioni del preprocessore impostare (`defines[]`)

Consulta il [Capitolo 2.2: config.cpp in Dettaglio](../02-mod-structure/02-config-cpp.md) per un riferimento completo.

**`Scripts/3_Game/`** viene caricato per primo. Inserisci qui enum, costanti, ID RPC, classi di configurazione e tutto cio' che non fa riferimento a entita' del mondo.

**`Scripts/4_World/`** viene caricato per secondo. Inserisci qui classi di entita' (`modded class ItemBase`), manager e tutto cio' che interagisce con gli oggetti di gioco.

**`Scripts/5_Mission/`** viene caricato per ultimo. Inserisci qui hook della missione (`modded class MissionServer`), pannelli UI e logica di avvio. Questo layer puo' fare riferimento ai tipi di tutti i layer inferiori.

---

## Passo 3: Rinominare il Mod

Il template viene fornito con nomi segnaposto. Devi sostituirli con il nome effettivo del tuo mod. Ecco un approccio sistematico.

### Scegli i Tuoi Nomi

Prima di apportare qualsiasi modifica, decidi:

| Identificatore | Esempio | Usato In |
|----------------|---------|----------|
| **Nome visualizzato del mod** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Nome della directory** | `MyAwesomeMod` | Nome cartella, percorsi config.cpp |
| **Classe CfgPatches** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **Classe CfgMods** | `MyAwesomeMod` | config.cpp CfgMods |
| **Sottocartella script** | `MyAwesomeMod` | Dentro 3_Game/, 4_World/, 5_Mission/ |
| **Definizione preprocessore** | `MYAWESOMEMOD` | config.cpp defines[], controlli #ifdef |

### Regole di Denominazione

- **Nessuno spazio o carattere speciale** nei nomi di directory e classi. Usa PascalCase o underscore.
- **I nomi delle classi CfgPatches devono essere globalmente univoci.** Due mod con lo stesso nome di classe CfgPatches entreranno in conflitto. Usa il nome del tuo mod come prefisso.
- **I nomi delle sottocartelle degli script** dentro ogni layer dovrebbero corrispondere al nome del tuo mod per coerenza.

---

## Passo 4: Aggiornare config.cpp

Apri `Scripts/config.cpp` e aggiorna le seguenti sezioni.

### CfgPatches

Sostituisci il nome della classe del template con il tuo:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Il tuo nome patch univoco
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Dipendenza dal gioco base
        };
    };
};
```

Se il tuo mod dipende da un altro mod, aggiungi il suo nome di classe CfgPatches a `requiredAddons[]`:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Dipende da Community Framework
};
```

### CfgMods

Aggiorna l'identita' del mod e i percorsi degli script:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Punti chiave:**
- Il valore `dir` deve corrispondere esattamente al nome della cartella radice del tuo mod.
- Ogni percorso `files[]` e' relativo alla radice del mod.
- L'array `dependencies[]` dovrebbe elencare quali moduli script vanilla si agganciano. La maggior parte dei mod usa tutti e tre: `"Game"`, `"World"` e `"Mission"`.

### Definizioni Preprocessore (Opzionale)

Se vuoi che altri mod possano rilevare la presenza del tuo mod, aggiungi un array `defines[]`:

```cpp
class MyAwesomeMod
{
    // ... (altri campi sopra)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... altri moduli ...
    };

    // Abilita il rilevamento tra mod
    defines[] = { "MYAWESOMEMOD" };
};
```

Altri mod possono poi usare `#ifdef MYAWESOMEMOD` per compilare condizionalmente il codice che si integra con il tuo.

---

## Passo 5: Aggiornare mod.cpp

Apri `mod.cpp` nella directory radice e aggiornalo con le informazioni del tuo mod:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "Una breve descrizione di cosa fa il tuo mod.";
picture      = "";             // Opzionale: percorso a un'immagine di anteprima
logo         = "";             // Opzionale: percorso a un logo
logoSmall    = "";             // Opzionale: percorso a un logo piccolo
logoOver     = "";             // Opzionale: percorso a un logo per lo stato hover
tooltip      = "My Awesome Mod";
action       = "";             // Opzionale: URL al sito web del tuo mod
```

Come minimo, imposta `name`, `author` e `overview`. Gli altri campi sono opzionali ma migliorano la presentazione nel launcher.

---

## Passo 6: Rinominare le Cartelle e i File degli Script

Rinomina le sottocartelle degli script dentro ogni layer per corrispondere al nome del tuo mod:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Dentro queste cartelle, rinomina qualsiasi file `.c` segnaposto e aggiorna i nomi delle loro classi. Per esempio, se il template include un file come `ModInit.c` con una classe chiamata `ModInit`, rinominalo in `MyAwesomeModInit.c` e aggiorna la classe:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## Passo 7: Compilare e Testare

### Usare il File Patching (Iterazione Rapida)

Il modo piu' veloce per testare durante lo sviluppo:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Questo carica gli script direttamente dalle cartelle sorgente senza impacchettare un PBO. Modifica un file `.c`, riavvia il gioco e vedi le modifiche immediatamente.

### Usare l'Addon Builder (Per la Distribuzione)

Quando sei pronto per la distribuzione:

1. Apri **DayZ Tools** da Steam
2. Avvia **Addon Builder**
3. Imposta **Source directory** su `P:\MyAwesomeMod\Scripts\`
4. Imposta **Output directory** su `P:\@MyAwesomeMod\Addons\`
5. Imposta **Prefix** su `MyAwesomeMod\Scripts`
6. Clicca **Pack**

Poi copia `mod.cpp` accanto alla cartella `Addons`:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Verificare nel Log degli Script

Dopo l'avvio, controlla il log degli script per i tuoi messaggi:

```
%localappdata%\DayZ\script_<date>_<time>.log
```

Cerca il tag prefisso del tuo mod (es. `[MyAwesomeMod]`).

---

## Integrazione con DayZ Tools e Workbench

### Workbench

Il Workbench di DayZ puo' aprire e modificare gli script del tuo mod con evidenziazione della sintassi:

1. Apri **Workbench** da DayZ Tools
2. Vai su **File > Open** e naviga fino alla cartella `Scripts/` del tuo mod
3. Apri qualsiasi file `.c` per modificarlo con supporto base per Enforce Script

Il Workbench legge il `config.cpp` per capire quali file appartengono a quale modulo script, quindi avere un config.cpp correttamente configurato e' essenziale.

### Configurazione del Drive P:

Il template e' progettato per funzionare dal drive P:. Se hai clonato in un'altra posizione, crea un collegamento:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

Questo rende il mod accessibile a `P:\MyAwesomeMod` senza spostare file.

### Automazione dell'Addon Builder

Per compilazioni ripetute, puoi creare un file batch nella radice del tuo mod:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Compilazione completata.
pause
```

---

## Template vs. Configurazione Manuale

| Aspetto | Template | Manuale (Capitolo 8.1) |
|---------|----------|------------------------|
| **Tempo per la prima compilazione** | ~2 minuti | ~15 minuti |
| **Tutti e 3 i layer script** | Pre-configurati | Li aggiungi secondo necessita' |
| **config.cpp** | Completo con tutti i moduli | Minimo (solo missione) |
| **Pronto per Git** | .gitignore incluso | Lo crei tu |
| **Valore educativo** | Inferiore (file pre-fatti) | Superiore (costruisci tutto tu) |
| **Raccomandato per** | Modder esperti, nuovi progetti | Modder alle prime armi che imparano le basi |

**Raccomandazione:** Se questo e' il tuo primissimo mod DayZ, inizia con il [Capitolo 8.1](01-first-mod.md) per capire ogni file. Una volta acquisita familiarita', usa il template per tutti i progetti futuri.

---

## Prossimi Passi

Con il tuo mod basato sul template funzionante, puoi:

1. **Aggiungere un oggetto personalizzato** -- Segui il [Capitolo 8.2: Creare un Oggetto Personalizzato](02-custom-item.md) per definire oggetti in config.cpp.
2. **Costruire un pannello di amministrazione** -- Segui il [Capitolo 8.3: Pannello di Amministrazione](03-admin-panel.md) per l'UI di gestione del server.
3. **Aggiungere comandi chat** -- Segui il [Capitolo 8.4: Comandi Chat](04-chat-commands.md) per comandi testuali in gioco.
4. **Studiare config.cpp in profondita'** -- Leggi il [Capitolo 2.2: config.cpp in Dettaglio](../02-mod-structure/02-config-cpp.md) per capire ogni campo.
5. **Scoprire le opzioni di mod.cpp** -- Leggi il [Capitolo 2.3: mod.cpp e Workshop](../02-mod-structure/03-mod-cpp.md) per la pubblicazione su Workshop.
6. **Aggiungere dipendenze** -- Se il tuo mod usa Community Framework o un altro mod, aggiorna `requiredAddons[]` e consulta il [Capitolo 2.4: Il Tuo Primo Mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Precedente:** [Capitolo 8.4: Comandi Chat](04-chat-commands.md) | [Home](../../README.md)
