# Capitolo 8.7: Pubblicare sullo Steam Workshop

[Home](../README.md) | [<< Precedente: Debugging & Testing](06-debugging-testing.md) | **Pubblicare sullo Steam Workshop** | [Successivo: Costruire un Overlay HUD >>](08-hud-overlay.md)

---

> **Riepilogo:** La tua mod è costruita, testata e pronta per il mondo. Questo tutorial ti guida attraverso il processo completo di pubblicazione dall'inizio alla fine: preparare la cartella della mod, firmare i PBO per la compatibilità multigiocatore, creare un elemento Steam Workshop, caricare tramite DayZ Tools o riga di comando, e mantenere gli aggiornamenti nel tempo. Alla fine, la tua mod sarà live sul Workshop e giocabile da chiunque.

---

## Indice

- [Introduzione](#introduzione)
- [Checklist Pre-Pubblicazione](#checklist-pre-pubblicazione)
- [Passo 1: Preparare la Cartella della Mod](#passo-1-preparare-la-cartella-della-mod)
- [Passo 2: Scrivere un mod.cpp Completo](#passo-2-scrivere-un-modcpp-completo)
- [Passo 3: Preparare Logo e Immagini di Anteprima](#passo-3-preparare-logo-e-immagini-di-anteprima)
- [Passo 4: Generare una Coppia di Chiavi](#passo-4-generare-una-coppia-di-chiavi)
- [Passo 5: Firmare i Tuoi PBO](#passo-5-firmare-i-tuoi-pbo)
- [Passo 6: Pubblicare tramite il Publisher di DayZ Tools](#passo-6-pubblicare-tramite-il-publisher-di-dayz-tools)
- [Pubblicazione tramite Riga di Comando (Alternativa)](#pubblicazione-tramite-riga-di-comando-alternativa)
- [Aggiornare la Tua Mod](#aggiornare-la-tua-mod)
- [Buone Pratiche per la Gestione delle Versioni](#buone-pratiche-per-la-gestione-delle-versioni)
- [Buone Pratiche per la Pagina Workshop](#buone-pratiche-per-la-pagina-workshop)
- [Guida per gli Operatori di Server](#guida-per-gli-operatori-di-server)
- [Distribuzione Senza il Workshop](#distribuzione-senza-il-workshop)
- [Problemi Comuni e Soluzioni](#problemi-comuni-e-soluzioni)
- [Il Ciclo di Vita Completo della Mod](#il-ciclo-di-vita-completo-della-mod)
- [Prossimi Passi](#prossimi-passi)

---

## Introduzione

Pubblicare sullo Steam Workshop è il passo finale nel percorso di modding di DayZ. Tutto ciò che hai imparato nei capitoli precedenti culmina qui. Una volta che la tua mod è sul Workshop, qualsiasi giocatore di DayZ può iscriversi, scaricarla e giocarci. Questo capitolo copre il processo completo: preparare la tua mod, firmare i PBO, caricare e mantenere gli aggiornamenti.

---

## Checklist Pre-Pubblicazione

Prima di caricare qualsiasi cosa, scorri questa lista. Saltare degli elementi qui causa i più comuni problemi post-pubblicazione.

- [ ] Tutte le funzionalità testate su un **server dedicato** (non solo in single-player)
- [ ] Test multigiocatore: un altro client può connettersi e usare le funzionalità della mod
- [ ] Nessun errore critico nei log degli script (`DayZDiag_x64.RPT` o `script_*.log`)
- [ ] Tutte le istruzioni `Print()` di debug rimosse o avvolte in `#ifdef DEVELOPER`
- [ ] Nessun valore di test hardcoded o codice sperimentale residuo
- [ ] `stringtable.csv` contiene tutte le stringhe visibili all'utente con le traduzioni
- [ ] `credits.json` compilato con le informazioni su autore e contributori
- [ ] Immagine del logo preparata (vedi [Passo 3](#passo-3-preparare-logo-e-immagini-di-anteprima) per le dimensioni)
- [ ] Tutte le texture convertite in formato `.paa` (non `.png`/`.tga` grezzi nei PBO)
- [ ] Descrizione del Workshop e istruzioni di installazione scritte
- [ ] Changelog iniziato (anche solo "1.0.0 - Rilascio iniziale")

---

## Passo 1: Preparare la Cartella della Mod

La cartella finale della tua mod deve seguire esattamente la struttura prevista da DayZ.

### Struttura Richiesta

```
@MyMod/
├── addons/
│   ├── MyMod_Scripts.pbo
│   ├── MyMod_Scripts.pbo.MyMod.bisign
│   ├── MyMod_Data.pbo
│   └── MyMod_Data.pbo.MyMod.bisign
├── keys/
│   └── MyMod.bikey
├── mod.cpp
└── meta.cpp  (auto-generato dal DayZ Launcher al primo caricamento)
```

### Dettaglio delle Cartelle

| Cartella / File | Scopo |
|---------------|---------|
| `addons/` | Contiene tutti i file `.pbo` (contenuto mod impacchettato) e i loro file di firma `.bisign` |
| `keys/` | Contiene la chiave pubblica (`.bikey`) che i server usano per verificare i tuoi PBO |
| `mod.cpp` | Metadati della mod: nome, autore, versione, descrizione, percorsi delle icone |
| `meta.cpp` | Auto-generato dal DayZ Launcher; contiene l'ID Workshop dopo la pubblicazione |

### Regole Importanti

- Il nome della cartella **deve** iniziare con `@`. Questo è il modo in cui DayZ identifica le directory delle mod.
- Ogni `.pbo` in `addons/` deve avere un file `.bisign` corrispondente accanto.
- Il file `.bikey` in `keys/` deve corrispondere alla chiave privata usata per creare i file `.bisign`.
- **Non** includere i file sorgente (script `.c`, texture grezze, progetti Workbench) nella cartella di caricamento. Solo i PBO impacchettati vanno qui.

---

## Passo 2: Scrivere un mod.cpp Completo

Il file `mod.cpp` dice a DayZ e al launcher tutto sulla tua mod. Un `mod.cpp` incompleto causa icone mancanti, descrizioni vuote e problemi di visualizzazione.

### Esempio Completo di mod.cpp

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### Riferimento dei Campi

| Campo | Obbligatorio | Descrizione |
|-------|----------|-------------|
| `name` | Sì | Nome visualizzato nella lista mod del DayZ Launcher |
| `picture` | Sì | Percorso dell'immagine logo principale (visualizzata nel launcher). Relativo al drive P: o alla root della mod |
| `logo` | Sì | Uguale a picture nella maggior parte dei casi; usato in alcuni contesti UI |
| `logoSmall` | No | Versione più piccola del logo per viste compatte |
| `logoOver` | No | Stato hover del logo (spesso uguale a `logo`) |
| `tooltip` | Sì | Breve descrizione di una riga mostrata al passaggio del mouse nel launcher |
| `overview` | Sì | Descrizione più lunga mostrata nel pannello dettagli della mod |
| `author` | Sì | Il tuo nome o il nome del team |
| `overviewPicture` | No | Immagine grande mostrata nel pannello panoramica della mod |
| `action` | No | URL aperto quando il giocatore clicca "Website" (tipicamente la tua pagina Workshop o GitHub) |
| `version` | Sì | Stringa versione corrente (es., `"1.0.0"`) |
| `versionPath` | No | Percorso a un file di testo contenente il numero di versione (per build automatizzate) |

### Errori Comuni

- **Punti e virgola mancanti** alla fine di ogni riga. Ogni riga deve terminare con `;`.
- **Percorsi immagine errati.** I percorsi sono relativi alla root del drive P: durante la build. Dopo l'impacchettamento, il percorso dovrebbe riflettere il prefisso del PBO. Testa caricando la mod localmente prima di caricare.
- **Dimenticare di aggiornare la versione** prima di ricaricare. Incrementa sempre la stringa versione.

---

## Passo 3: Preparare Logo e Immagini di Anteprima

### Requisiti delle Immagini

| Immagine | Dimensione | Formato | Usata Per |
|-------|------|--------|----------|
| Logo mod (`picture` / `logo`) | 512 x 512 px | `.paa` (in-game) | Lista mod del DayZ Launcher |
| Logo piccolo (`logoSmall`) | 128 x 128 px | `.paa` (in-game) | Viste compatte del launcher |
| Anteprima Steam Workshop | 512 x 512 px | `.png` o `.jpg` | Miniatura della pagina Workshop |
| Immagine panoramica | 1024 x 512 px | `.paa` (in-game) | Pannello dettagli della mod |

### Conversione delle Immagini in PAA

DayZ usa texture `.paa` internamente. Per convertire immagini PNG/TGA:

1. Apri **TexView2** (incluso con DayZ Tools)
2. File > Open la tua immagine `.png` o `.tga`
3. File > Save As > scegli il formato `.paa`
4. Salva nella directory `Data/Textures/` della tua mod

Addon Builder può anche auto-convertire le texture durante l'impacchettamento dei PBO se configurato per binarizzare.

### Suggerimenti

- Usa un'icona chiara e riconoscibile che si legga bene a piccole dimensioni.
- Mantieni il testo sui logo al minimo -- diventa illeggibile a 128x128.
- L'immagine di anteprima dello Steam Workshop (`.png`/`.jpg`) è separata dal logo in-game (`.paa`). La carichi attraverso il Publisher.

---

## Passo 4: Generare una Coppia di Chiavi

La firma delle chiavi è **essenziale** per il multigiocatore. Quasi tutti i server pubblici abilitano la verifica delle firme, quindi senza firme appropriate i giocatori verranno espulsi quando si connettono con la tua mod.

### Come Funziona la Firma delle Chiavi

- Crei una **coppia di chiavi**: un `.biprivatekey` (privata) e un `.bikey` (pubblica)
- Firmi ogni `.pbo` con la chiave privata, producendo un file `.bisign`
- Distribuisci il `.bikey` con la tua mod; gli operatori di server lo posizionano nella loro cartella `keys/`
- Quando un giocatore si connette, il server verifica ogni `.pbo` contro il suo `.bisign` usando il `.bikey`

### Generare le Chiavi con DayZ Tools

1. Apri **DayZ Tools** da Steam
2. Nella finestra principale, trova e clicca **DS Create Key** (a volte elencato sotto Tools o Utilities)
3. Inserisci un **nome chiave** -- usa il nome della tua mod (es., `MyMod`)
4. Scegli dove salvare i file
5. Vengono creati due file:
   - `MyMod.bikey` -- la **chiave pubblica** (distribuisci questa)
   - `MyMod.biprivatekey` -- la **chiave privata** (tienila segreta)

### Generare le Chiavi tramite Riga di Comando

Puoi anche usare lo strumento `DSCreateKey` direttamente da un terminale:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

Questo crea `MyMod.bikey` e `MyMod.biprivatekey` nella directory corrente.

### Regola Critica di Sicurezza

> **NON condividere MAI il tuo file `.biprivatekey`.** Chiunque abbia la tua chiave privata può firmare PBO modificati che i server accetteranno come legittimi. Conservala in modo sicuro e fai un backup. Se la perdi, devi generare una nuova coppia di chiavi, rifirmare tutto, e gli operatori di server devono aggiornare le loro chiavi.

---

## Passo 5: Firmare i Tuoi PBO

Ogni file `.pbo` nella tua mod deve essere firmato con la tua chiave privata. Questo produce file `.bisign` che si affiancano ai PBO.

### Firmare con DayZ Tools

1. Apri **DayZ Tools**
2. Trova e clicca **DS Sign File** (sotto Tools o Utilities)
3. Seleziona il tuo file `.biprivatekey`
4. Seleziona il file `.pbo` da firmare
5. Viene creato un file `.bisign` accanto al PBO (es., `MyMod_Scripts.pbo.MyMod.bisign`)
6. Ripeti per ogni `.pbo` nella tua cartella `addons/`

### Firmare tramite Riga di Comando

Per l'automazione o PBO multipli, usa la riga di comando:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

Per firmare tutti i PBO in una cartella con uno script batch:

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Signing %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo All PBOs signed.
pause
```

### Dopo la Firma: Verifica la Tua Cartella

La tua cartella `addons/` dovrebbe apparire così:

```
addons/
├── MyMod_Scripts.pbo
├── MyMod_Scripts.pbo.MyMod.bisign
├── MyMod_Data.pbo
└── MyMod_Data.pbo.MyMod.bisign
```

Ogni `.pbo` deve avere un `.bisign` corrispondente. Se manca qualche `.bisign`, i giocatori verranno espulsi dai server con verifica delle firme.

### Posizionare la Chiave Pubblica

Copia `MyMod.bikey` nella cartella `@MyMod/keys/` della tua mod. Questo è ciò che gli operatori di server copieranno nella directory `keys/` del loro server per autorizzare la tua mod.

---

## Passo 6: Pubblicare tramite il Publisher di DayZ Tools

DayZ Tools include un publisher Workshop integrato -- il modo più semplice per portare la tua mod su Steam.

### Aprire il Publisher

1. Apri **DayZ Tools** da Steam
2. Clicca **Publisher** nella finestra principale (potrebbe anche essere etichettato "Workshop Tool")
3. Si apre la finestra del Publisher con i campi per i dettagli della tua mod

### Compilare i Dettagli

| Campo | Cosa Inserire |
|-------|---------------|
| **Title** | Il nome visualizzato della tua mod (es., "My Awesome Mod") |
| **Description** | Panoramica dettagliata di cosa fa la tua mod. Supporta la formattazione BB code di Steam (vedi sotto) |
| **Preview Image** | Sfoglia fino alla tua immagine di anteprima `.png` o `.jpg` 512 x 512 |
| **Mod Folder** | Sfoglia fino alla tua cartella completa `@MyMod` |
| **Tags** | Seleziona i tag pertinenti (es., Weapons, Vehicles, UI, Server, Gear, Maps) |
| **Visibility** | **Public** (chiunque può trovarla), **Friends Only**, o **Unlisted** (accessibile solo tramite link diretto) |

### Riferimento Rapido al BB Code di Steam

La descrizione del Workshop supporta il BB code:

```
[h1]Features[/h1]
[list]
[*] Feature one
[*] Feature two
[/list]

[b]Bold[/b]  [i]Italic[/i]  [code]Code[/code]
[url=https://example.com]Link text[/url]
[img]https://example.com/image.png[/img]
```

### Pubblicare

1. Rivedi tutti i campi un'ultima volta
2. Clicca **Publish** (o **Upload**)
3. Attendi il completamento del caricamento. Le mod grandi possono richiedere diversi minuti a seconda della tua connessione.
4. Una volta completato, vedrai una conferma con il tuo **Workshop ID** (un lungo ID numerico come `2345678901`)
5. **Salva questo Workshop ID.** Ti servirà per caricare gli aggiornamenti successivi.

### Dopo la Pubblicazione: Verifica

Non saltare questo passaggio. Testa la tua mod come farebbe un giocatore normale:

1. Visita `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` e verifica titolo, descrizione, immagine di anteprima
2. **Iscriviti** alla tua stessa mod sul Workshop
3. Avvia DayZ, conferma che la mod appare nel launcher
4. Abilitala, avvia il gioco, connettiti a un server (o avvia il tuo server di test)
5. Conferma che tutte le funzionalità funzionano
6. Aggiorna il campo `action` in `mod.cpp` per puntare all'URL della tua pagina Workshop

Se qualcosa non funziona, aggiorna e ricarica prima di annunciare pubblicamente.

---

## Pubblicazione tramite Riga di Comando (Alternativa)

Per l'automazione, CI/CD, o caricamenti batch, SteamCMD fornisce un'alternativa da riga di comando.

### Installare SteamCMD

Scarica dal [sito developer di Valve](https://developer.valvesoftware.com/wiki/SteamCMD) ed estrai in una cartella come `C:\SteamCMD\`.

### Creare un File VDF

SteamCMD usa un file `.vdf` per descrivere cosa caricare. Crea un file chiamato `workshop_publish.vdf`:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### Riferimento dei Campi

| Campo | Valore |
|-------|-------|
| `appid` | Sempre `221100` per DayZ |
| `publishedfileid` | `0` per un nuovo elemento; usa l'ID Workshop per gli aggiornamenti |
| `contentfolder` | Percorso assoluto alla tua cartella `@MyMod` |
| `previewfile` | Percorso assoluto alla tua immagine di anteprima |
| `visibility` | `0` = Pubblico, `1` = Solo Amici, `2` = Non in Lista, `3` = Privato |
| `title` | Nome della mod |
| `description` | Descrizione della mod (testo semplice) |
| `changenote` | Testo mostrato nella cronologia delle modifiche sulla pagina Workshop |

### Eseguire SteamCMD

```batch
C:\SteamCMD\steamcmd.exe +login YourSteamUsername +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

SteamCMD chiederà la tua password e il codice Steam Guard al primo utilizzo. Dopo l'autenticazione, carica la mod e stampa l'ID Workshop.

### Quando Usare la Riga di Comando

- **Build automatizzate:** integra in uno script di build che impacchetta i PBO, li firma e li carica in un solo passo
- **Operazioni batch:** caricare più mod contemporaneamente
- **Server headless:** ambienti senza GUI
- **Pipeline CI/CD:** GitHub Actions o simili possono chiamare SteamCMD

---

## Aggiornare la Tua Mod

### Processo di Aggiornamento Passo per Passo

1. **Apporta le modifiche al codice** e testa accuratamente
2. **Incrementa la versione** in `mod.cpp` (es., `"1.0.0"` diventa `"1.0.1"`)
3. **Ricostruisci tutti i PBO** usando Addon Builder o il tuo script di build
4. **Rifirma tutti i PBO** con la **stessa chiave privata** che hai usato originariamente
5. **Apri il Publisher di DayZ Tools**
6. Inserisci il tuo **Workshop ID** esistente (o seleziona l'elemento esistente)
7. Punta alla tua cartella `@MyMod` aggiornata
8. Scrivi una **nota di modifica** che descrive cosa è cambiato
9. Clicca **Publish / Update**

### Usare SteamCMD per gli Aggiornamenti

Aggiorna il file VDF con il tuo Workshop ID e una nuova nota di modifica:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Fixed item duplication bug, added French translation"
}
```

Poi esegui SteamCMD come prima. Il `publishedfileid` dice a Steam di aggiornare l'elemento esistente invece di crearne uno nuovo.

### Importante: Usa la Stessa Chiave

Firma sempre gli aggiornamenti con la **stessa chiave privata** che hai usato per il rilascio originale. Se firmi con una chiave diversa, gli operatori di server devono sostituire il vecchio `.bikey` con il tuo nuovo -- il che significa downtime e confusione. Genera una nuova coppia di chiavi solo se la tua chiave privata è compromessa.

---

## Buone Pratiche per la Gestione delle Versioni

### Versionamento Semantico

Usa il formato **MAJOR.MINOR.PATCH**:

| Componente | Quando Incrementare | Esempio |
|-----------|-------------------|---------|
| **MAJOR** | Modifiche che rompono la compatibilità: cambi nel formato del config, funzionalità rimosse, revisioni API | `1.0.0` a `2.0.0` |
| **MINOR** | Nuove funzionalità retrocompatibili | `1.0.0` a `1.1.0` |
| **PATCH** | Correzioni di bug, piccole modifiche, aggiornamenti delle traduzioni | `1.0.0` a `1.0.1` |

### Formato del Changelog

Mantieni un changelog nella descrizione del Workshop o in un file separato. Un formato pulito:

```
v1.2.0 (2025-06-15)
- Added: Night vision toggle keybind
- Added: German and Spanish translations
- Fixed: Inventory crash when dropping stacked items
- Changed: Reduced default spawn rate from 5 to 3

v1.1.0 (2025-05-01)
- Added: New crafting recipes for 4 items
- Fixed: Server crash on player disconnect during trade

v1.0.0 (2025-04-01)
- Initial release
```

### Retrocompatibilità

Quando la tua mod salva dati persistenti (config JSON, file dati giocatore), rifletti bene prima di cambiare il formato:

- **Aggiungere nuovi campi** è sicuro. Usa valori predefiniti per i campi mancanti quando carichi vecchi file.
- **Rinominare o rimuovere campi** è una modifica che rompe la compatibilità. Incrementa la versione MAJOR.
- **Considera un pattern di migrazione:** rileva il vecchio formato, converti nel nuovo formato, salva.

Esempio di controllo migrazione in Enforce Script:

```csharp
// In your config load function
if (config.configVersion < 2)
{
    // Migrate from v1 to v2: rename "oldField" to "newField"
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrated from v1 to v2");
}
```

### Tag Git

Se usi Git per il controllo versione (e dovresti), tagga ogni rilascio:

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

Questo crea un punto di riferimento permanente così puoi sempre tornare al codice esatto di qualsiasi versione pubblicata.

---

## Buone Pratiche per la Pagina Workshop

### Struttura della Descrizione

Organizza la tua descrizione con queste sezioni:

1. **Panoramica** -- cosa fa la mod, in 2-3 frasi
2. **Funzionalità** -- elenco puntato delle funzionalità chiave
3. **Requisiti** -- elenca tutte le mod dipendenza con link al Workshop
4. **Installazione** -- passo per passo per i giocatori (di solito solo "iscriviti e abilita")
5. **Configurazione Server** -- istruzioni per gli operatori di server (posizionamento chiavi, file di config)
6. **FAQ** -- domande comuni risposte preventivamente
7. **Problemi Noti** -- sii onesto sulle limitazioni attuali
8. **Supporto** -- link al tuo Discord, GitHub issues, o thread del forum
9. **Changelog** -- cronologia delle versioni recenti
10. **Licenza** -- come altri possono (o non possono) usare il tuo lavoro

### Screenshot e Media

- Includi **3-5 screenshot in-game** che mostrano la tua mod in azione
- Se la tua mod aggiunge UI, mostra chiaramente i pannelli dell'interfaccia
- Se la tua mod aggiunge oggetti, mostrali in-game (non solo nell'editor)
- Un breve video di gameplay aumenta drasticamente le iscrizioni

### Dipendenze

Se la tua mod richiede altre mod, elencale chiaramente con i link al Workshop. Usa la funzionalità "Required Items" dello Steam Workshop così il launcher carica automaticamente le dipendenze.

### Programma di Aggiornamento

Imposta le aspettative. Se aggiorni settimanalmente, dillo. Se gli aggiornamenti sono occasionali, di' "aggiornamenti secondo necessità". I giocatori sono più comprensivi quando sanno cosa aspettarsi.

---

## Guida per gli Operatori di Server

Includi queste informazioni nella descrizione del Workshop per gli admin dei server.

### Installare una Mod Workshop su un Server Dedicato

1. **Scarica la mod** usando SteamCMD o il client Steam:
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. **Copia** (o crea un symlink) la cartella `@ModName` nella directory del Server DayZ
3. **Copia il file `.bikey`** da `@ModName/keys/` alla cartella `keys/` del server
4. **Aggiungi la mod** al parametro di avvio `-mod=`

### Sintassi dei Parametri di Avvio

Le mod vengono caricate tramite il parametro `-mod=`, separate da punti e virgola:

```
-mod=@CF;@VPPAdminTools;@MyMod
```

Usa il **percorso relativo completo** dalla root del server. Su Linux, i percorsi sono case-sensitive.

### Ordine di Caricamento

Le mod vengono caricate nell'ordine elencato in `-mod=`. Questo è importante quando le mod dipendono l'una dall'altra:

- **Dipendenze prima.** Se `@MyMod` richiede `@CF`, elenca `@CF` prima di `@MyMod`.
- **Regola generale:** framework prima, mod di contenuto per ultime.
- Se la tua mod dichiara `requiredAddons` in `config.cpp`, DayZ tenterà di risolvere l'ordine di caricamento automaticamente, ma l'ordinamento esplicito in `-mod=` è più sicuro.

### Gestione delle Chiavi

- Posiziona **un `.bikey` per mod** nella directory `keys/` del server
- Quando una mod si aggiorna con la stessa chiave, nessuna azione necessaria -- il `.bikey` esistente funziona ancora
- Se un autore di mod cambia chiavi, devi sostituire il vecchio `.bikey` con quello nuovo
- Il percorso della cartella `keys/` è relativo alla root del server (es., `DayZServer/keys/`)

---

## Distribuzione Senza il Workshop

### Quando Saltare il Workshop

- **Mod private** per la tua community di server
- **Beta testing** con un piccolo gruppo prima del rilascio pubblico
- **Mod commerciali o con licenza** distribuite attraverso altri canali
- **Iterazione rapida** durante lo sviluppo (più veloce che ricaricare ogni volta)

### Creare uno ZIP di Rilascio

Impacchetta la tua mod per la distribuzione manuale:

```
MyMod_v1.0.0.zip
└── @MyMod/
    ├── addons/
    │   ├── MyMod_Scripts.pbo
    │   ├── MyMod_Scripts.pbo.MyMod.bisign
    │   ├── MyMod_Data.pbo
    │   └── MyMod_Data.pbo.MyMod.bisign
    ├── keys/
    │   └── MyMod.bikey
    └── mod.cpp
```

Includi un `README.txt` con le istruzioni di installazione:

```
INSTALLATION:
1. Extract the @MyMod folder into your DayZ game directory
2. (Server operators) Copy MyMod.bikey from @MyMod/keys/ to your server's keys/ folder
3. Add @MyMod to your -mod= launch parameter
```

### GitHub Releases

Se la tua mod è open source, usa GitHub Releases per ospitare download versionati:

1. Tagga il rilascio in Git (`git tag v1.0.0`)
2. Costruisci e firma i PBO
3. Crea uno ZIP della cartella `@MyMod`
4. Crea una GitHub Release e allega lo ZIP
5. Scrivi le note di rilascio nella descrizione del rilascio

Questo ti dà cronologia delle versioni, conteggio dei download e un URL stabile per ogni rilascio.

---

## Problemi Comuni e Soluzioni

| Problema | Causa | Soluzione |
|---------|-------|-----|
| "Addon rejected by server" | Il server non ha il `.bikey`, o il `.bisign` non corrisponde al `.pbo` | Conferma che il `.bikey` sia nella cartella `keys/` del server. Rifirma i PBO con il `.biprivatekey` corretto. |
| "Signature check failed" | PBO modificato dopo la firma, o firmato con la chiave sbagliata | Ricostruisci il PBO dal sorgente pulito. Rifirma con la **stessa chiave** che ha generato il `.bikey` del server. |
| La mod non appare nel DayZ Launcher | `mod.cpp` malformato o struttura cartella errata | Controlla `mod.cpp` per errori di sintassi (`;` mancanti). Assicurati che la cartella inizi con `@`. Riavvia il launcher. |
| Il caricamento fallisce nel Publisher | Problema di autenticazione, connessione o blocco file | Verifica il login Steam. Chiudi Workbench/Addon Builder. Prova a eseguire DayZ Tools come Amministratore. |
| Icona Workshop errata/mancante | Percorso errato in `mod.cpp` o formato immagine sbagliato | Verifica che i percorsi `picture`/`logo` puntino a file `.paa` effettivi. L'anteprima Workshop (`.png`) è separata. |
| Conflitti con altre mod | Ridefinizione di classi vanilla invece di moddarne | Usa `modded class`, chiama `super` negli override, imposta `requiredAddons` per l'ordine di caricamento. |
| I giocatori crashano al caricamento | Errori di script, PBO corrotti o dipendenze mancanti | Controlla i log `.RPT`. Ricostruisci i PBO dal sorgente pulito. Verifica che le dipendenze si carichino prima. |

---

## Il Ciclo di Vita Completo della Mod

```
IDEA → SETUP (8.1) → STRUTTURA (8.1, 8.5) → CODICE (8.2, 8.3, 8.4) → BUILD (8.1)
  → TEST → DEBUG (8.6) → RIFINITURA → FIRMA (8.7) → PUBBLICAZIONE (8.7) → MANTENIMENTO (8.7)
                                    ↑                                    │
                                    └────── ciclo di feedback ───────────┘
```

Dopo la pubblicazione, il feedback dei giocatori ti riporta a CODICE, TEST e DEBUG. Quel ciclo di pubblicazione-feedback-miglioramento è il modo in cui vengono create le grandi mod.

---

## Prossimi Passi

Hai completato la serie completa di tutorial sul modding di DayZ -- da uno spazio di lavoro vuoto a una mod pubblicata, firmata e mantenuta sullo Steam Workshop. Da qui:

- **Esplora i capitoli di riferimento** (Capitoli 1-7) per una conoscenza più approfondita del sistema GUI, config.cpp e Enforce Script
- **Studia le mod open-source** come CF, Community Online Tools e Expansion per pattern avanzati
- **Unisciti alla community di modding di DayZ** su Discord e i forum di Bohemia Interactive
- **Costruisci in grande.** La tua prima mod era Hello World. La prossima potrebbe essere una revisione completa del gameplay.

Gli strumenti sono nelle tue mani. Costruisci qualcosa di grande.
