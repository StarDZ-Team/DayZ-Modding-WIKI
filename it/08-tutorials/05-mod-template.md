# Capitolo 8.5: Usare il Template Mod di DayZ

[Home](../README.md) | [<< Precedente: Aggiungere Comandi Chat](04-chat-commands.md) | **Usare il Template Mod di DayZ** | [Successivo: Debug e Test >>](06-debugging-testing.md)

---

> **Sommario:** Questo tutorial ti mostra come usare il Template Mod open-source di InclementDab per iniziare un nuovo progetto mod in pochi secondi. Invece di creare ogni file da zero, cloni uno scheletro pronto che ha già la struttura cartelle corretta, config.cpp, mod.cpp e stub dei layer script. Poi rinomini alcune cose e inizi a scrivere codice immediatamente.

---

## Indice

- [Che Cos'è il Template Mod di DayZ?](#che-cosè-il-template-mod-di-dayz)
- [Cosa Fornisce il Template](#cosa-fornisce-il-template)
- [Passo 1: Clonare o Scaricare il Template](#passo-1-clonare-o-scaricare-il-template)
- [Passo 2: Comprendere la Struttura dei File](#passo-2-comprendere-la-struttura-dei-file)
- [Passo 3: Rinominare la Mod](#passo-3-rinominare-la-mod)
- [Passo 4: Aggiornare config.cpp](#passo-4-aggiornare-configcpp)
- [Passo 5: Aggiornare mod.cpp](#passo-5-aggiornare-modcpp)
- [Passo 6: Rinominare Cartelle e File Script](#passo-6-rinominare-cartelle-e-file-script)
- [Passo 7: Compilare e Testare](#passo-7-compilare-e-testare)
- [Integrazione con DayZ Tools e Workbench](#integrazione-con-dayz-tools-e-workbench)
- [Template vs. Setup Manuale](#template-vs-setup-manuale)
- [Prossimi Passi](#prossimi-passi)

---

## Che Cos'è il Template Mod di DayZ?

Il **Template Mod di DayZ** è un repository open-source mantenuto da InclementDab che fornisce uno scheletro mod completo e pronto all'uso per DayZ:

**Repository:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Piuttosto che creare ogni file a mano (come trattato nel [Capitolo 8.1: La Tua Prima Mod](01-first-mod.md)), il template ti dà una struttura di directory pre-costruita con tutto il boilerplate già al suo posto. Lo cloni, rinomini alcuni identificatori e sei pronto per scrivere logica di gioco.

Questo è il punto di partenza consigliato per chi ha già costruito una mod Hello World e vuole passare a progetti più complessi.

---

## Cosa Fornisce il Template

Il template include tutto ciò di cui una mod DayZ ha bisogno per compilare e caricare:

| File / Cartella | Scopo |
|-----------------|-------|
| `mod.cpp` | Metadati della mod (nome, autore, versione) mostrati nel launcher di DayZ |
| `config.cpp` | Dichiarazioni CfgPatches e CfgMods che registrano la mod nel motore |
| `Scripts/3_Game/` | Stub di script layer Game (enum, costanti, classi di configurazione) |
| `Scripts/4_World/` | Stub di script layer World (entità, manager, interazioni col mondo) |
| `Scripts/5_Mission/` | Stub di script layer Mission (UI, hook della missione) |
| `.gitignore` | Ignore preconfigurati per lo sviluppo DayZ (PBO, log, file temporanei) |

Il template segue la gerarchia standard a 5 layer documentata nel [Capitolo 2.1: La Gerarchia a 5 Layer degli Script](../02-mod-structure/01-five-layers.md). Tutti e tre i layer script sono collegati in config.cpp così puoi immediatamente inserire codice in qualsiasi layer senza configurazione aggiuntiva.

---

## Passo 1: Clonare o Scaricare il Template

### Opzione A: Usare la Funzione "Use this template" di GitHub

1. Vai su [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Clicca il pulsante verde **"Use this template"** in cima al repository
3. Scegli **"Create a new repository"**
4. Dai un nome al tuo repository (es. `MyAwesomeMod`)
5. Clona il tuo nuovo repository nel drive P:

```bash
cd P:\
git clone https://github.com/TuoUsername/MyAwesomeMod.git
```

### Opzione B: Clone Diretto

Se non hai bisogno del tuo repository GitHub, clona il template direttamente:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Opzione C: Scaricare come ZIP

1. Vai alla pagina del repository
2. Clicca **Code** poi **Download ZIP**
3. Estrai lo ZIP in `P:\MyAwesomeMod\`

---

## Passo 2: Comprendere la Struttura dei File

Dopo il clone, la directory della tua mod appare così:

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

### Come Ogni Pezzo si Incastra

**`mod.cpp`** è la carta d'identità della tua mod. Controlla ciò che i giocatori vedono nella lista mod del launcher di DayZ. Vedi [Capitolo 2.3: mod.cpp e Workshop](../02-mod-structure/03-mod-cpp.md) per tutti i campi disponibili.

**`Scripts/config.cpp`** è il file più critico. Dice al motore di DayZ:
- Da cosa dipende la tua mod (`CfgPatches.requiredAddons[]`)
- Dove si trova ogni layer script (`CfgMods.class defs`)
- Quali define del preprocessore impostare (`defines[]`)

Vedi [Capitolo 2.2: Approfondimento config.cpp](../02-mod-structure/02-config-cpp.md) per un riferimento completo.

**`Scripts/3_Game/`** carica per primo. Metti qui enum, costanti, ID RPC, classi di configurazione e qualsiasi cosa che non faccia riferimento a entità del mondo.

**`Scripts/4_World/`** carica per secondo. Metti qui classi entità (`modded class ItemBase`), manager e qualsiasi cosa che interagisca con oggetti di gioco.

**`Scripts/5_Mission/`** carica per ultimo. Metti qui hook della missione (`modded class MissionServer`), pannelli UI e logica di avvio. Questo layer può fare riferimento a tipi di tutti i layer inferiori.

---

## Passo 3: Rinominare la Mod

Il template viene fornito con nomi segnaposto. Devi sostituirli con il nome effettivo della tua mod. Ecco un approccio sistematico.

### Scegliere i Tuoi Nomi

Prima di fare qualsiasi modifica, decidi:

| Identificatore | Esempio | Usato In |
|----------------|---------|----------|
| **Nome visualizzato mod** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Nome directory** | `MyAwesomeMod` | Nome cartella, percorsi config.cpp |
| **Classe CfgPatches** | `MyAwesomeMod_Scripts` | CfgPatches in config.cpp |
| **Classe CfgMods** | `MyAwesomeMod` | CfgMods in config.cpp |
| **Sottocartella script** | `MyAwesomeMod` | Dentro 3_Game/, 4_World/, 5_Mission/ |
| **Define preprocessore** | `MYAWESOMEMOD` | defines[] in config.cpp, controlli #ifdef |

### Regole di Denominazione

- **Nessuno spazio o carattere speciale** nei nomi di directory e classi. Usa PascalCase o underscore.
- **I nomi delle classi CfgPatches devono essere globalmente unici.** Due mod con lo stesso nome di classe CfgPatches entreranno in conflitto. Usa il nome della tua mod come prefisso.
- **I nomi delle sottocartelle script** dentro ogni layer dovrebbero corrispondere al nome della tua mod per coerenza.

---

## Passo 4: Aggiornare config.cpp

Apri `Scripts/config.cpp` e aggiorna le seguenti sezioni.

### CfgPatches

Sostituisci il nome della classe template con il tuo:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Il tuo nome patch unico
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

Se la tua mod dipende da un'altra mod, aggiungi il suo nome di classe CfgPatches a `requiredAddons[]`:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Dipende da Community Framework
};
```

### CfgMods

Aggiorna l'identità della mod e i percorsi script:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "TuoNome";
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
- Il valore `dir` deve corrispondere esattamente al nome della cartella radice della tua mod.
- Ogni percorso `files[]` è relativo alla radice della mod.
- L'array `dependencies[]` dovrebbe elencare quali moduli script vanilla agganci. La maggior parte delle mod usa tutti e tre: `"Game"`, `"World"` e `"Mission"`.

### Define del Preprocessore (Opzionale)

Se vuoi che altre mod rilevino la presenza della tua mod, aggiungi un array `defines[]`:

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

    // Abilitare il rilevamento cross-mod
    defines[] = { "MYAWESOMEMOD" };
};
```

Altre mod possono quindi usare `#ifdef MYAWESOMEMOD` per compilare condizionalmente codice che si integra con la tua.

---

## Passo 5: Aggiornare mod.cpp

Apri `mod.cpp` nella directory radice e aggiornalo con le informazioni della tua mod:

```cpp
name         = "My Awesome Mod";
author       = "TuoNome";
version      = "1.0.0";
overview     = "Una breve descrizione di cosa fa la tua mod.";
picture      = "";             // Opzionale: percorso a un'immagine di anteprima
logo         = "";             // Opzionale: percorso a un logo
logoSmall    = "";             // Opzionale: percorso a un logo piccolo
logoOver     = "";             // Opzionale: percorso a un logo stato hover
tooltip      = "My Awesome Mod";
action       = "";             // Opzionale: URL al sito web della tua mod
```

Come minimo, imposta `name`, `author` e `overview`. Gli altri campi sono opzionali ma migliorano la presentazione nel launcher.

---

## Passo 6: Rinominare Cartelle e File Script

Rinomina le sottocartelle script dentro ogni layer per corrispondere al nome della tua mod:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Dentro queste cartelle, rinomina tutti i file `.c` segnaposto e aggiorna i nomi delle classi. Per esempio, se il template include un file come `ModInit.c` con una classe chiamata `ModInit`, rinominalo in `MyAwesomeModInit.c` e aggiorna la classe:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server inizializzato!");
    }
};
```

---

## Passo 7: Compilare e Testare

### Usare il File Patching (Iterazione Veloce)

Il modo più veloce per testare durante lo sviluppo:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Questo carica i tuoi script direttamente dalle cartelle sorgente senza impacchettare un PBO. Modifica un file `.c`, riavvia il gioco e vedi le modifiche immediatamente.

### Usare Addon Builder (Per la Distribuzione)

Quando sei pronto per distribuire:

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
%localappdata%\DayZ\script_<data>_<ora>.log
```

Cerca il tag prefisso della tua mod (es. `[MyAwesomeMod]`).

---

## Integrazione con DayZ Tools e Workbench

### Workbench

DayZ Workbench può aprire e modificare gli script della tua mod con evidenziazione della sintassi:

1. Apri **Workbench** da DayZ Tools
2. Vai su **File > Open** e naviga nella cartella `Scripts/` della tua mod
3. Apri qualsiasi file `.c` per modificarlo con supporto base di Enforce Script

Workbench legge il `config.cpp` per capire quali file appartengono a quale modulo script, quindi avere un config.cpp configurato correttamente è essenziale.

### Setup Drive P:

Il template è progettato per funzionare dal drive P:. Se hai clonato in un'altra posizione, crea un junction:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

Questo rende la mod accessibile su `P:\MyAwesomeMod` senza spostare file.

### Automazione di Addon Builder

Per build ripetute, puoi creare un file batch nella radice della tua mod:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Build completata.
pause
```

---

## Template vs. Setup Manuale

| Aspetto | Template | Manuale (Capitolo 8.1) |
|---------|----------|------------------------|
| **Tempo alla prima build** | ~2 minuti | ~15 minuti |
| **Tutti e 3 i layer script** | Preconfigurati | Li aggiungi secondo necessità |
| **config.cpp** | Completo con tutti i moduli | Minimale (solo mission) |
| **Pronto per Git** | .gitignore incluso | Lo crei tu |
| **Valore formativo** | Inferiore (file pre-fatti) | Superiore (costruisci tutto tu) |
| **Consigliato per** | Modder esperti, nuovi progetti | Modder alle prime armi che imparano le basi |

**Raccomandazione:** Se questa è la tua primissima mod DayZ, inizia con il [Capitolo 8.1](01-first-mod.md) per capire ogni file. Una volta che ti senti a tuo agio, usa il template per tutti i progetti futuri.

---

## Prossimi Passi

Con la tua mod basata su template funzionante, puoi:

1. **Aggiungere un oggetto personalizzato** -- Segui il [Capitolo 8.2: Creare un Oggetto Personalizzato](02-custom-item.md) per definire oggetti in config.cpp.
2. **Costruire un pannello admin** -- Segui il [Capitolo 8.3: Costruire un Pannello Admin](03-admin-panel.md) per UI di gestione server.
3. **Aggiungere comandi chat** -- Segui il [Capitolo 8.4: Aggiungere Comandi Chat](04-chat-commands.md) per comandi di testo in gioco.
4. **Studiare config.cpp in profondità** -- Leggi il [Capitolo 2.2: Approfondimento config.cpp](../02-mod-structure/02-config-cpp.md) per capire ogni campo.
5. **Imparare le opzioni di mod.cpp** -- Leggi il [Capitolo 2.3: mod.cpp e Workshop](../02-mod-structure/03-mod-cpp.md) per la pubblicazione su Workshop.
6. **Aggiungere dipendenze** -- Se la tua mod usa Community Framework o un'altra mod, aggiorna `requiredAddons[]` e vedi [Capitolo 2.4: La Tua Prima Mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Precedente:** [Capitolo 8.4: Aggiungere Comandi Chat](04-chat-commands.md) | [Home](../README.md)
