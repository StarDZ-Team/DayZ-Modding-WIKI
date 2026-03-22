# Capitolo 4.6: Impacchettamento PBO

[Home](../README.md) | [<< Precedente: Flusso di Lavoro DayZ Tools](05-dayz-tools.md) | **Impacchettamento PBO** | [Successivo: Guida a Workbench >>](07-workbench-guide.md)

---

## Introduzione

Un **PBO** (Packed Bank of Objects) è il formato di archivio di DayZ -- l'equivalente di un file `.zip` per il contenuto di gioco. Ogni mod caricata dal gioco viene distribuita come uno o più file PBO. Quando un giocatore si iscrive a una mod su Steam Workshop, scarica dei PBO. Quando un server carica le mod, legge i PBO. Il PBO è il prodotto finale dell'intero processo di modding.

Capire come creare correttamente i PBO -- quando binarizzare, come impostare i prefissi, come strutturare l'output e come automatizzare il processo -- è l'ultimo passo tra i tuoi file sorgente e una mod funzionante. Questo capitolo copre tutto, dal concetto di base fino ai flussi di lavoro automatizzati avanzati.

---

## Indice dei Contenuti

- [Cos'è un PBO?](#cosè-un-pbo)
- [Struttura Interna del PBO](#struttura-interna-del-pbo)
- [AddonBuilder: Lo Strumento di Impacchettamento](#addonbuilder-lo-strumento-di-impacchettamento)
- [Il Flag -packonly](#il-flag--packonly)
- [Il Flag -prefix](#il-flag--prefix)
- [Binarizzazione: Quando Serve e Quando No](#binarizzazione-quando-serve-e-quando-no)
- [Firma delle Chiavi](#firma-delle-chiavi)
- [Struttura della Cartella @mod](#struttura-della-cartella-mod)
- [Script di Build Automatizzati](#script-di-build-automatizzati)
- [Build di Mod Multi-PBO](#build-di-mod-multi-pbo)
- [Errori di Build Comuni e Soluzioni](#errori-di-build-comuni-e-soluzioni)
- [Test: File Patching vs. Caricamento PBO](#test-file-patching-vs-caricamento-pbo)
- [Buone Pratiche](#buone-pratiche)

---

## Cos'è un PBO?

Un PBO è un file di archivio piatto che contiene un albero di directory di risorse di gioco. Non ha compressione (a differenza di ZIP) -- i file al suo interno sono memorizzati alla loro dimensione originale. L'"impacchettamento" è puramente organizzativo: molti file diventano un unico file con una struttura di percorsi interna.

### Caratteristiche Principali

- **Nessuna compressione:** I file sono memorizzati così come sono. La dimensione del PBO equivale alla somma dei suoi contenuti più un piccolo header.
- **Header piatto:** Un elenco di voci di file con percorsi, dimensioni e offset.
- **Metadati del prefisso:** Ogni PBO dichiara un prefisso di percorso interno che mappa i suoi contenuti nel filesystem virtuale del motore.
- **Sola lettura a runtime:** Il motore legge dai PBO ma non scrive mai su di essi.
- **Firmato per il multiplayer:** I PBO possono essere firmati con una coppia di chiavi in stile Bohemia per la verifica delle firme lato server.

### Perché i PBO Invece dei File Sciolti

- **Distribuzione:** Un file per componente del mod è più semplice di migliaia di file sciolti.
- **Integrità:** La firma delle chiavi garantisce che la mod non sia stata manomessa.
- **Prestazioni:** L'I/O dei file del motore è ottimizzato per la lettura dai PBO.
- **Organizzazione:** Il sistema dei prefissi garantisce nessuna collisione di percorsi tra le mod.

---

## Struttura Interna del PBO

Quando apri un PBO (usando uno strumento come PBO Manager o MikeroTools), vedi un albero di directory:

```
MyMod.pbo
  $PBOPREFIX$                    <-- File di testo contenente il percorso del prefisso
  config.bin                      <-- config.cpp binarizzato (o config.cpp se -packonly)
  Scripts/
    3_Game/
      MyConstants.c
    4_World/
      MyManager.c
    5_Mission/
      MyUI.c
  data/
    models/
      my_item.p3d                 <-- ODOL binarizzato (o MLOD se -packonly)
    textures/
      my_item_co.paa
      my_item_nohq.paa
      my_item_smdi.paa
    materials/
      my_item.rvmat
  sound/
    gunshot_01.ogg
  GUI/
    layouts/
      my_panel.layout
```

### $PBOPREFIX$

Il file `$PBOPREFIX$` è un piccolo file di testo alla radice del PBO che dichiara il prefisso del percorso della mod. Per esempio:

```
MyMod
```

Questo dice al motore: "Quando qualcosa fa riferimento a `MyMod\data\textures\my_item_co.paa`, cerca all'interno di questo PBO in `data\textures\my_item_co.paa`."

### config.bin vs. config.cpp

- **config.bin:** Versione binarizzata (binaria) del config.cpp, creata da Binarize. Più veloce da analizzare al momento del caricamento.
- **config.cpp:** La configurazione originale in formato testo. Funziona nel motore ma è leggermente più lenta da analizzare.

Quando costruisci con la binarizzazione, config.cpp diventa config.bin. Quando usi `-packonly`, config.cpp è incluso così com'è.

---

## AddonBuilder: Lo Strumento di Impacchettamento

**AddonBuilder** è lo strumento ufficiale di Bohemia per l'impacchettamento dei PBO, incluso con DayZ Tools. Può operare in modalità GUI o in modalità riga di comando.

### Modalità GUI

1. Avvia AddonBuilder dal DayZ Tools Launcher.
2. **Directory sorgente:** Naviga alla cartella della tua mod su P: (es. `P:\MyMod`).
3. **Directory di output:** Naviga alla cartella di output (es. `P:\output`).
4. **Opzioni:**
   - **Binarize:** Seleziona per eseguire Binarize sul contenuto (converte P3D, texture, config).
   - **Sign:** Seleziona e scegli una chiave per firmare il PBO.
   - **Prefix:** Inserisci il prefisso della mod (es. `MyMod`).
5. Clicca **Pack**.

### Modalità Riga di Comando

La modalità riga di comando è preferita per le build automatizzate:

```bash
AddonBuilder.exe [percorso_sorgente] [percorso_output] [opzioni]
```

**Esempio completo:**
```bash
"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe" ^
    "P:\MyMod" ^
    "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyKey"
```

### Opzioni della Riga di Comando

| Flag | Descrizione |
|------|-------------|
| `-prefix=<percorso>` | Imposta il prefisso interno del PBO (critico per la risoluzione dei percorsi) |
| `-packonly` | Salta la binarizzazione, impacchetta i file così come sono |
| `-sign=<percorso_chiave>` | Firma il PBO con la chiave BI specificata (percorso della chiave privata, senza estensione) |
| `-include=<percorso>` | Elenco file da includere -- impacchetta solo i file che corrispondono a questo filtro |
| `-exclude=<percorso>` | Elenco file da escludere -- salta i file che corrispondono a questo filtro |
| `-binarize=<percorso>` | Percorso di Binarize.exe (se non nella posizione predefinita) |
| `-temp=<percorso>` | Directory temporanea per l'output di Binarize |
| `-clear` | Svuota la directory di output prima dell'impacchettamento |
| `-project=<percorso>` | Percorso del drive di progetto (solitamente `P:\`) |

---

## Il Flag -packonly

Il flag `-packonly` è una delle opzioni più importanti di AddonBuilder. Dice allo strumento di saltare tutta la binarizzazione e impacchettare i file sorgente esattamente come sono.

### Quando Usare -packonly

| Contenuto della Mod | Usare -packonly? | Motivo |
|---------------------|-----------------|--------|
| Solo script (file .c) | **Sì** | Gli script non vengono mai binarizzati |
| Layout UI (.layout) | **Sì** | I layout non vengono mai binarizzati |
| Solo audio (.ogg) | **Sì** | L'OGG è già pronto per il gioco |
| Texture pre-convertite (.paa) | **Sì** | Già nel formato finale |
| Config.cpp (senza CfgVehicles) | **Sì** | I config semplici funzionano senza binarizzazione |
| Config.cpp (con CfgVehicles) | **No** | Le definizioni degli oggetti richiedono config binarizzati |
| Modelli P3D (MLOD) | **No** | Dovrebbero essere binarizzati in ODOL per le prestazioni |
| Texture TGA/PNG (necessitano conversione) | **No** | Devono essere convertite in PAA |

### Guida Pratica

Per una **mod di soli script** (come un framework o una mod utility senza oggetti personalizzati):
```bash
AddonBuilder.exe "P:\MyScriptMod" "P:\output" -prefix="MyScriptMod" -packonly
```

Per una **mod con oggetti** (armi, vestiti, veicoli con modelli e texture):
```bash
AddonBuilder.exe "P:\MyItemMod" "P:\output" -prefix="MyItemMod" -sign="P:\keys\MyKey"
```

> **Suggerimento:** Molte mod si dividono in più PBO proprio per ottimizzare il processo di build. I PBO degli script usano `-packonly` (veloce), mentre i PBO dei dati con modelli e texture richiedono la binarizzazione completa (più lenta ma necessaria).

---

## Il Flag -prefix

Il flag `-prefix` imposta il prefisso del percorso interno del PBO, che viene scritto nel file `$PBOPREFIX$` all'interno del PBO. Questo prefisso è critico -- determina come il motore risolve i percorsi verso il contenuto all'interno del PBO.

### Come Funziona il Prefisso

```
Sorgente: P:\MyMod\data\textures\item_co.paa
Prefisso: MyMod
Percorso interno PBO: data\textures\item_co.paa

Risoluzione del motore: MyMod\data\textures\item_co.paa
  --> Cerca in MyMod.pbo: data\textures\item_co.paa
  --> Trovato!
```

### Prefissi Multi-Livello

Per le mod che usano una struttura a sottocartelle, il prefisso può includere più livelli:

```bash
# Sorgente sul drive P:
P:\MyMod\MyMod\Scripts\3_Game\MyClass.c

# Se il prefisso è "MyMod\MyMod\Scripts"
# Interno PBO: 3_Game\MyClass.c
# Percorso del motore: MyMod\MyMod\Scripts\3_Game\MyClass.c
```

### Il Prefisso Deve Corrispondere ai Riferimenti

Se il tuo config.cpp fa riferimento a `MyMod\data\texture_co.paa`, allora il PBO contenente quella texture deve avere il prefisso `MyMod` e il file deve trovarsi in `data\texture_co.paa` all'interno del PBO. Una discrepanza fa sì che il motore non trovi il file.

### Pattern di Prefisso Comuni

| Struttura della Mod | Percorso Sorgente | Prefisso | Riferimento nel Config |
|---------------------|-------------------|----------|----------------------|
| Mod semplice | `P:\MyMod\` | `MyMod` | `MyMod\data\item.p3d` |
| Mod con namespace | `P:\MyMod_Weapons\` | `MyMod_Weapons` | `MyMod_Weapons\data\rifle.p3d` |
| Sotto-pacchetto script | `P:\MyFramework\MyMod\Scripts\` | `MyFramework\MyMod\Scripts` | (referenziato tramite config.cpp `CfgMods`) |

---

## Binarizzazione: Quando Serve e Quando No

La binarizzazione è la conversione dei formati sorgente leggibili dall'uomo in formati binari ottimizzati per il motore. È il passaggio più lungo nel processo di build e la fonte più comune di errori di build.

### Cosa Viene Binarizzato

| Tipo di File | Binarizzato In | Obbligatorio? |
|-------------|----------------|---------------|
| `config.cpp` | `config.bin` | Obbligatorio per le mod che definiscono oggetti (CfgVehicles, CfgWeapons) |
| `.p3d` (MLOD) | `.p3d` (ODOL) | Consigliato -- ODOL si carica più velocemente ed è più piccolo |
| `.tga` / `.png` | `.paa` | Obbligatorio -- il motore necessita di PAA a runtime |
| `.edds` | `.paa` | Obbligatorio -- come sopra |
| `.rvmat` | `.rvmat` (elaborato) | Percorsi risolti, ottimizzazione minore |
| `.wrp` | `.wrp` (ottimizzato) | Obbligatorio per le mod di terreno/mappe |

### Cosa NON Viene Binarizzato

| Tipo di File | Motivo |
|-------------|--------|
| Script `.c` | Gli script vengono caricati come testo dal motore |
| Audio `.ogg` | Già in formato pronto per il gioco |
| File `.layout` | Già in formato pronto per il gioco |
| Texture `.paa` | Già nel formato finale (pre-convertite) |
| Dati `.json` | Letti come testo dal codice script |

### Dettagli sulla Binarizzazione del Config.cpp

La binarizzazione del config.cpp è il passaggio con cui la maggior parte dei modder ha problemi. Il binarizzatore analizza il testo del config.cpp, valida la sua struttura, risolve le catene di ereditarietà e produce un config.bin binario.

**Quando la binarizzazione è necessaria per il config.cpp:**
- Il config definisce voci `CfgVehicles` (oggetti, armi, veicoli, edifici).
- Il config definisce voci `CfgWeapons`.
- Il config definisce voci che fanno riferimento a modelli o texture.

**Quando la binarizzazione NON è necessaria:**
- Il config definisce solo `CfgPatches` e `CfgMods` (registrazione della mod).
- Il config definisce solo configurazioni audio.
- Mod di soli script con config minimale.

> **Regola pratica:** Se il tuo config.cpp aggiunge oggetti fisici al mondo di gioco, hai bisogno della binarizzazione. Se registra solo script e definisce dati non-oggetto, `-packonly` funziona benissimo.

---

## Firma delle Chiavi

I PBO possono essere firmati con una coppia di chiavi crittografiche. I server usano la verifica delle firme per assicurarsi che tutti i client connessi abbiano gli stessi file della mod (non modificati).

### Componenti della Coppia di Chiavi

| File | Estensione | Scopo | Chi lo Possiede |
|------|-----------|-------|----------------|
| Chiave privata | `.biprivatekey` | Firma i PBO durante la build | Solo l'autore della mod (DA TENERE SEGRETA) |
| Chiave pubblica | `.bikey` | Verifica le firme | Amministratori del server, distribuita con la mod |

### Generazione delle Chiavi

Usa le utilità **DSSignFile** o **DSCreateKey** di DayZ Tools:

```bash
# Genera una coppia di chiavi
DSCreateKey.exe MyModKey

# Questo crea:
#   MyModKey.biprivatekey   (tieni segreta, non distribuire)
#   MyModKey.bikey          (distribuisci agli amministratori del server)
```

### Firma Durante la Build

```bash
AddonBuilder.exe "P:\MyMod" "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyModKey"
```

Questo produce:
```
P:\output\
  MyMod.pbo
  MyMod.pbo.MyModKey.bisign    <-- File di firma
```

### Installazione della Chiave Lato Server

Gli amministratori del server posizionano la chiave pubblica (`.bikey`) nella directory `keys/` del server:

```
DayZServer/
  keys/
    MyModKey.bikey             <-- Permette ai client con questa mod di connettersi
```

---

## Struttura della Cartella @mod

DayZ si aspetta che le mod siano organizzate in una struttura di directory specifica usando la convenzione del prefisso `@`:

```
@MyMod/
  addons/
    MyMod.pbo                  <-- Contenuto della mod impacchettato
    MyMod.pbo.MyKey.bisign     <-- Firma del PBO (opzionale)
  keys/
    MyKey.bikey                <-- Chiave pubblica per i server (opzionale)
  mod.cpp                      <-- Metadati della mod
```

### mod.cpp

Il file `mod.cpp` fornisce metadati visualizzati nel launcher di DayZ:

```cpp
name = "My Awesome Mod";
author = "ModAuthor";
version = "1.0.0";
url = "https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXXXXX";
```

### Mod Multi-PBO

Le mod grandi spesso si dividono in più PBO all'interno di una singola cartella `@mod`:

```
@MyFramework/
  addons/
    MyMod_Core_Scripts.pbo        <-- Layer degli script
    MyMod_Core_Data.pbo           <-- Texture, modelli, materiali
    MyMod_Core_GUI.pbo            <-- File di layout, imageset
  keys/
    MyMod.bikey
  mod.cpp
```

### Caricamento delle Mod

Le mod vengono caricate tramite il parametro `-mod`:

```bash
# Singola mod
DayZDiag_x64.exe -mod="@MyMod"

# Mod multiple (separate da punto e virgola)
DayZDiag_x64.exe -mod="@MyFramework;@MyMod_Weapons;@MyMod_Missions"
```

La cartella `@` deve trovarsi nella directory radice del gioco, oppure deve essere fornito un percorso assoluto.

---

## Script di Build Automatizzati

L'impacchettamento manuale dei PBO tramite la GUI di AddonBuilder è accettabile per mod piccole e semplici. Per progetti più grandi con più PBO, gli script di build automatizzati sono essenziali.

### Pattern dello Script Batch

Un tipico `build_pbos.bat`:

```batch
@echo off
setlocal

set TOOLS="P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
set OUTPUT="P:\@MyMod\addons"
set KEY="P:\keys\MyKey"

echo === Building Scripts PBO ===
%TOOLS% "P:\MyMod\Scripts" %OUTPUT% -prefix="MyMod\Scripts" -packonly -clear

echo === Building Data PBO ===
%TOOLS% "P:\MyMod\Data" %OUTPUT% -prefix="MyMod\Data" -sign=%KEY% -clear

echo === Build Complete ===
pause
```

### Pattern dello Script Python di Build (dev.py)

Per build più sofisticate, uno script Python fornisce una migliore gestione degli errori, logging e logica condizionale:

```python
import subprocess
import os
import sys

ADDON_BUILDER = r"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
OUTPUT_DIR = r"P:\@MyMod\addons"
KEY_PATH = r"P:\keys\MyKey"

PBOS = [
    {
        "name": "Scripts",
        "source": r"P:\MyMod\Scripts",
        "prefix": r"MyMod\Scripts",
        "packonly": True,
    },
    {
        "name": "Data",
        "source": r"P:\MyMod\Data",
        "prefix": r"MyMod\Data",
        "packonly": False,
    },
]

def build_pbo(pbo_config):
    """Build a single PBO."""
    cmd = [
        ADDON_BUILDER,
        pbo_config["source"],
        OUTPUT_DIR,
        f"-prefix={pbo_config['prefix']}",
    ]

    if pbo_config.get("packonly"):
        cmd.append("-packonly")
    else:
        cmd.append(f"-sign={KEY_PATH}")

    print(f"Building {pbo_config['name']}...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR building {pbo_config['name']}:")
        print(result.stderr)
        return False

    print(f"  {pbo_config['name']} built successfully.")
    return True

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = True
    for pbo in PBOS:
        if not build_pbo(pbo):
            success = False

    if success:
        print("\nAll PBOs built successfully.")
    else:
        print("\nBuild completed with errors.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Integrazione con dev.py

Il progetto MyMod usa `dev.py` come orchestratore centrale della build:

```bash
python dev.py build          # Costruisce tutti i PBO
python dev.py server         # Build + avvia server + monitora i log
python dev.py full           # Build + server + client
```

Questo pattern è consigliato per qualsiasi workspace multi-mod. Un singolo comando costruisce tutto, avvia il server e inizia il monitoraggio -- eliminando i passaggi manuali e riducendo l'errore umano.

---

## Build di Mod Multi-PBO

Le mod grandi traggono beneficio dalla suddivisione in più PBO. Questo ha diversi vantaggi:

### Perché Suddividere in Più PBO

1. **Rebuild più veloci.** Se modifichi solo uno script, ricostruisci solo il PBO degli script (con `-packonly`, che richiede pochi secondi). Il PBO dei dati (con binarizzazione) richiede minuti e non ha bisogno di essere ricostruito.
2. **Caricamento modulare.** I PBO destinati solo al server possono essere esclusi dal download dei client.
3. **Organizzazione più pulita.** Script, dati e GUI sono chiaramente separati.
4. **Build parallele.** I PBO indipendenti possono essere costruiti simultaneamente.

### Pattern di Suddivisione Tipico

```
@MyMod/
  addons/
    MyMod_Core.pbo           <-- config.cpp, CfgPatches (binarizzato)
    MyMod_Scripts.pbo         <-- Tutti i file script .c (-packonly)
    MyMod_Data.pbo            <-- Modelli, texture, materiali (binarizzato)
    MyMod_GUI.pbo             <-- Layout, imageset (-packonly)
    MyMod_Sounds.pbo          <-- File audio OGG (-packonly)
```

### Dipendenze tra PBO

Quando un PBO dipende da un altro (es. gli script fanno riferimento a oggetti definiti nel PBO del config), il `requiredAddons[]` in `CfgPatches` assicura il corretto ordine di caricamento:

```cpp
// Nel config.cpp di MyMod_Scripts
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = {"MyMod_Core"};   // Carica dopo il PBO core
    };
};
```

---

## Errori di Build Comuni e Soluzioni

### Errore: "Include file not found"

**Causa:** Il config.cpp fa riferimento a un file (modello, texture) che non esiste nel percorso previsto.
**Soluzione:** Verifica che il file esista su P: nel percorso esatto referenziato. Controlla l'ortografia e le maiuscole/minuscole.

### Errore: "Binarize failed" senza dettagli

**Causa:** Binarize è andato in crash su un file sorgente corrotto o non valido.
**Soluzione:**
1. Controlla quale file stava elaborando Binarize (guarda l'output del log).
2. Apri il file problematico nello strumento appropriato (Object Builder per P3D, TexView2 per le texture).
3. Valida il file.
4. Colpevoli comuni: texture non potenza di 2, file P3D corrotti, sintassi config.cpp non valida.

### Errore: "Addon requires addon X"

**Causa:** Il `requiredAddons[]` di CfgPatches elenca un addon non presente.
**Soluzione:** Installa l'addon richiesto, aggiungilo alla build, oppure rimuovi il requisito se non è effettivamente necessario.

### Errore: Errore di parsing del config.cpp (riga X)

**Causa:** Errore di sintassi nel config.cpp.
**Soluzione:** Apri il config.cpp in un editor di testo e controlla la riga X. Problemi comuni:
- Punto e virgola mancanti dopo le definizioni delle classi.
- Parentesi graffe `{}` non chiuse.
- Virgolette mancanti intorno ai valori stringa.
- Backslash alla fine della riga (la continuazione di riga non è supportata).

### Errore: Discrepanza del prefisso PBO

**Causa:** Il prefisso nel PBO non corrisponde ai percorsi usati nel config.cpp o nei materiali.
**Soluzione:** Assicurati che `-prefix` corrisponda alla struttura di percorsi prevista da tutti i riferimenti. Se il config.cpp fa riferimento a `MyMod\data\item.p3d`, il prefisso del PBO deve essere `MyMod` e il file deve trovarsi in `data\item.p3d` all'interno del PBO.

### Errore: "Signature check failed" sul server

**Causa:** Il PBO del client non corrisponde alla firma prevista dal server.
**Soluzione:**
1. Assicurati che sia il server che il client abbiano la stessa versione del PBO.
2. Rifirma il PBO con una nuova chiave se necessario.
3. Aggiorna il `.bikey` sul server.

### Errore: "Cannot open file" durante Binarize

**Causa:** Il drive P: non è montato oppure il percorso del file non è corretto.
**Soluzione:** Monta il drive P: e verifica che il percorso sorgente esista.

---

## Test: File Patching vs. Caricamento PBO

Lo sviluppo prevede due modalità di test. Scegliere quella giusta per ogni situazione fa risparmiare tempo significativo.

### File Patching (Sviluppo)

| Aspetto | Dettaglio |
|---------|----------|
| **Velocità** | Istantaneo -- modifica il file, riavvia il gioco |
| **Setup** | Monta il drive P:, avvia con il flag `-filePatching` |
| **Eseguibile** | `DayZDiag_x64.exe` (build Diag richiesta) |
| **Firma** | Non applicabile (nessun PBO da firmare) |
| **Limitazioni** | Nessun config binarizzato, solo build Diag |
| **Ideale per** | Sviluppo script, iterazione UI, prototipazione rapida |

### Caricamento PBO (Test di Rilascio)

| Aspetto | Dettaglio |
|---------|----------|
| **Velocità** | Più lento -- bisogna ricostruire il PBO per ogni modifica |
| **Setup** | Costruisci il PBO, posizionalo in `@mod/addons/` |
| **Eseguibile** | `DayZDiag_x64.exe` o il retail `DayZ_x64.exe` |
| **Firma** | Supportata (richiesta per il multiplayer) |
| **Limitazioni** | Ricostruzione necessaria per ogni modifica |
| **Ideale per** | Test finali, test multiplayer, validazione del rilascio |

### Flusso di Lavoro Consigliato

1. **Sviluppa con il file patching:** Scrivi script, modifica i layout, itera sulle texture. Riavvia il gioco per testare. Nessun passaggio di build.
2. **Costruisci i PBO periodicamente:** Testa la build binarizzata per individuare problemi specifici della binarizzazione (errori di parsing del config, problemi di conversione delle texture).
3. **Test finale solo con PBO:** Prima del rilascio, testa esclusivamente dai PBO per assicurarti che la mod impacchettata funzioni in modo identico alla versione con file patching.
4. **Firma e distribuisci i PBO:** Genera le firme per la compatibilità multiplayer.

---

## Buone Pratiche

1. **Usa `-packonly` per i PBO degli script.** Gli script non vengono mai binarizzati, quindi `-packonly` è sempre corretto e molto più veloce.

2. **Imposta sempre un prefisso.** Senza un prefisso, il motore non può risolvere i percorsi verso il contenuto della tua mod. Ogni PBO deve avere un `-prefix` corretto.

3. **Automatizza le tue build.** Crea uno script di build (batch o Python) dal primo giorno. L'impacchettamento manuale non scala ed è soggetto a errori.

4. **Tieni sorgente e output separati.** Sorgente su P:, PBO costruiti in una directory di output separata o in `@mod/addons/`. Non impacchettare mai dalla directory di output.

5. **Firma i tuoi PBO per qualsiasi test multiplayer.** I PBO non firmati vengono rifiutati dai server con verifica delle firme abilitata. Firma durante lo sviluppo anche se sembra non necessario -- previene problemi di tipo "funziona a me" quando altri testano.

6. **Versiona le tue chiavi.** Quando fai modifiche che rompono la compatibilità, genera una nuova coppia di chiavi. Questo forza tutti i client e i server ad aggiornarsi insieme.

7. **Testa sia il file patching che la modalità PBO.** Alcuni bug appaiono solo in una delle due modalità. I config binarizzati si comportano diversamente dai config testuali nei casi limite.

8. **Pulisci la tua directory di output regolarmente.** PBO vecchi da build precedenti possono causare comportamenti confusi. Usa il flag `-clear` o pulisci manualmente prima di costruire.

9. **Suddividi le mod grandi in più PBO.** Il tempo risparmiato sulle ricostruzioni incrementali si ripaga entro il primo giorno di sviluppo.

10. **Leggi i log di build.** Binarize e AddonBuilder producono file di log. Quando qualcosa va storto, la risposta è quasi sempre nei log. Controlla `%TEMP%\AddonBuilder\` e `%TEMP%\Binarize\` per l'output dettagliato.

---

## Osservato nelle Mod Reali

| Pattern | Mod | Dettaglio |
|---------|-----|-----------|
| 20+ PBO per mod con suddivisione fine | Expansion (tutti i moduli) | Suddivide in PBO separati per Script, Data, GUI, Veicoli, Libro, Market, ecc., abilitando ricostruzioni indipendenti e separazione opzionale client/server |
| Tripla suddivisione Script/Data/GUI | StarDZ (Core, Missions, AI) | Ogni mod produce 2-3 PBO: `_Scripts.pbo` (packonly), `_Data.pbo` (modelli/texture binarizzati), `_GUI.pbo` (layout packonly) |
| Singolo PBO monolitico | Semplici mod di retexture | Mod piccole con solo un config.cpp e poche texture PAA impacchettano tutto in un unico PBO con binarizzazione |
| Versionamento delle chiavi per ogni rilascio principale | Expansion | Genera nuove coppie di chiavi per aggiornamenti che rompono la compatibilità, forzando tutti i client e server ad aggiornarsi in sincronia |

---

## Compatibilità e Impatto

- **Multi-Mod:** Le collisioni dei prefissi PBO fanno sì che il motore carichi i file di una mod al posto di quelli di un'altra. Ogni mod deve usare un prefisso unico. Controlla il `$PBOPREFIX$` attentamente quando fai il debug di errori "file not found" in ambienti multi-mod.
- **Prestazioni:** Il caricamento dei PBO è veloce (letture sequenziali dei file), ma le mod con molti PBO grandi aumentano il tempo di avvio del server. Il contenuto binarizzato si carica più velocemente di quello non binarizzato. Usa modelli ODOL e texture PAA per le build di rilascio.
- **Versione:** Il formato PBO stesso non è cambiato. AddonBuilder riceve correzioni periodiche tramite gli aggiornamenti di DayZ Tools, ma i flag della riga di comando e il comportamento di impacchettamento sono stabili da DayZ 1.0.

---

## Navigazione

| Precedente | Su | Successivo |
|------------|-----|-----------|
| [4.5 Flusso di Lavoro DayZ Tools](05-dayz-tools.md) | [Parte 4: Formati di File e DayZ Tools](01-textures.md) | [Successivo: Guida a Workbench](07-workbench-guide.md) |
