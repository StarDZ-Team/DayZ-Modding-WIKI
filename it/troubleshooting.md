# Guida alla risoluzione dei problemi

[Home](./README.md) | **Guida alla risoluzione dei problemi**

---

> Quando qualcosa va storto, inizia qui. Questa guida e organizzata per **cio che vedi** (il sintomo), non per sistema. Trova il tuo problema, leggi la causa, applica la correzione.

---

## Indice

1. [Il mod non si carica](#1-il-mod-non-si-carica)
2. [Errori di script](#2-errori-di-script)
3. [Problemi RPC e di rete](#3-problemi-rpc-e-di-rete)
4. [Problemi UI](#4-problemi-ui)
5. [Problemi di build e PBO](#5-problemi-di-build-e-pbo)
6. [Problemi di prestazioni](#6-problemi-di-prestazioni)
7. [Problemi con oggetti, veicoli ed entita](#7-problemi-con-oggetti-veicoli-ed-entita)
8. [Problemi di configurazione e tipi](#8-problemi-di-configurazione-e-tipi)
9. [Problemi di persistenza](#9-problemi-di-persistenza)
10. [Diagrammi di flusso decisionali](#10-diagrammi-di-flusso-decisionali)
11. [Riferimento rapido comandi di debug](#11-riferimento-rapido-comandi-di-debug)
12. [Posizioni dei file di log](#12-posizioni-dei-file-di-log)
13. [Dove ottenere aiuto](#13-dove-ottenere-aiuto)

---

## 1. Il mod non si carica

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| Errore "Addon requires addon X" all'avvio | Voce `requiredAddons[]` mancante o errata | Aggiungi il nome esatto della classe `CfgPatches` della dipendenza al tuo `requiredAddons[]`. I nomi sono sensibili alle maiuscole. Vedi [Capitolo 2.2](02-mod-structure/02-config-cpp.md). |
| Mod non visibile nel launcher | File `mod.cpp` mancante o con errori di sintassi | Crea o correggi `mod.cpp` nella root del mod. Deve contenere i campi `name`, `author` e `dir`. |
| "Config parse error" all'avvio | Errore di sintassi nel `config.cpp` | Controlla punti e virgola mancanti dopo le chiusure delle classi (`};`), parentesi non chiuse o virgolette sbilanciate. |
| Nessuna voce nel log degli script | Il blocco `CfgMods` `defs` punta al percorso sbagliato | Verifica che la voce `CfgMods` nel `config.cpp` abbia il `dir` corretto. Il motore ignora silenziosamente i percorsi errati. |
| Il mod si carica ma non succede nulla | Gli script compilano ma non vengono mai eseguiti | Controlla che il tuo mod abbia un punto di ingresso: `modded class MissionServer` o `MissionGameplay`. Vedi [Capitolo 7.2](07-patterns/02-module-systems.md). |
| Il mod funziona solo in giocatore singolo | Il server non ha il mod installato | Assicurati che il parametro `-mod=` del server includa il percorso del tuo mod. |

---

## 2. Errori di script

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| `Null pointer access` | Accesso a una variabile che e `null` | Aggiungi un controllo null prima dell'uso: `if (myVar) { myVar.DoSomething(); }`. E l'errore runtime piu comune. |
| `Cannot convert type 'X' to type 'Y'` | Cast diretto tra tipi incompatibili | Usa `Class.CastTo()` per un cast sicuro: `Class.CastTo(result, source);`. Vedi [Capitolo 1.9](01-enforce-script/09-casting-reflection.md). |
| `Undefined variable 'X'` | Errore di battitura, scope sbagliato o livello sbagliato | Controlla prima l'ortografia. Se la variabile e una classe di un altro file, assicurati che sia definita nello stesso livello o inferiore. Vedi [Capitolo 2.1](02-mod-structure/01-five-layers.md). |
| `Method 'X' not found` | Chiamata a un metodo che non esiste sulla classe | Verifica il nome del metodo e controlla la classe genitore. Controlla gli script vanilla in `P:\DZ\scripts\`. |
| `Division by zero` | Divisione per una variabile uguale a `0` | Aggiungi una guardia: `if (divisor != 0) result = value / divisor;`. |
| `Redeclaration of variable 'X'` | Stesso nome variabile dichiarato in blocchi `else if` fratelli | Dichiara la variabile una volta prima della catena `if`/`else`. Vedi [Capitolo 1.12](01-enforce-script/12-gotchas.md). |
| `Stack overflow` | Ricorsione infinita | Un metodo chiama se stesso senza caso base. Aggiungi un controllo di profondita. |
| `Index out of range` | Accesso all'array con indice non valido | Controlla sempre `array.Count()` prima dell'accesso per indice. |
| Errore di sintassi senza messaggio chiaro | Barra rovesciata `\` o virgolette escapate nel letterale stringa | Il CParser di Enforce Script non supporta `\\` o `\"`. Usa barre per i percorsi. Vedi [Capitolo 1.12](01-enforce-script/12-gotchas.md). |
| `JsonFileLoader` restituisce dati null | Assegnazione del valore di ritorno di `JsonLoadFile()` | `JsonLoadFile()` restituisce `void`. Pre-alloca l'oggetto e passalo per riferimento. Vedi [Capitolo 6.8](06-engine-api/08-file-io.md). |

---

## 3. Problemi RPC e di rete

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| RPC inviato ma mai ricevuto | Mancata corrispondenza della registrazione | Mittente e ricevente devono registrare lo stesso ID RPC. Vedi [Capitolo 6.9](06-engine-api/09-networking.md). |
| RPC ricevuto ma dati corrotti | Mancata corrispondenza parametri lettura/scrittura | Le chiamate `Write()` del mittente e `Read()` del ricevente devono avere gli stessi tipi nello stesso ordine. |
| Dati non sincronizzati ai client | `SetSynchDirty()` mancante | Dopo aver modificato una variabile registrata per la sincronizzazione, chiama `SetSynchDirty()` sull'entita. |
| Funziona in giocatore singolo, fallisce su dedicato | Percorsi di codice diversi per listen vs. dedicato | Su un listen server, client e server funzionano nello stesso processo. Testa sempre su server dedicato. |
| Flood di RPC e lag del server | Invio di RPC ogni frame | Limita le chiamate RPC con timer. Raggruppa piccoli aggiornamenti in un singolo RPC. |

---

## 4. Problemi UI

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| Il layout si carica ma nulla e visibile | La dimensione del widget e zero | Controlla i valori `hexactsize` e `vexactsize`. Nessuna dimensione negativa. Vedi [Capitolo 3.3](03-gui-system/03-sizing-positioning.md). |
| `CreateWidgets()` restituisce null | Il percorso del file layout e sbagliato o il file manca | Verifica il percorso del file `.layout` (barre, nessun errore di battitura). Il motore restituisce silenziosamente `null`. |
| I widget esistono ma non sono cliccabili | Un altro widget copre il pulsante | Controlla la `priority` del widget (ordine z). Priorita piu alta = renderizzato sopra e cattura l'input per primo. |
| L'input di gioco e bloccato dopo la chiusura dell'UI | Le chiamate `ChangeGameFocus()` sono sbilanciate | Ogni `ChangeGameFocus(1)` deve avere un corrispondente `ChangeGameFocus(-1)`. |
| Il testo mostra `#STR_some_key` letteralmente | Voce stringtable mancante | Aggiungi la chiave al tuo `stringtable.csv`. |
| Il cursore del mouse non appare | `ShowUICursor()` non chiamato | Chiama `GetGame().GetUIManager().ShowUICursor(true)` aprendo la tua UI. |

---

## 5. Problemi di build e PBO

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| PBO si compila con successo ma il mod crasha al caricamento | Errore di binarizzazione `config.cpp` | Prova a compilare con la binarizzazione disabilitata. |
| "Signature check failed" alla connessione al server | PBO non firmato o firmato con chiave sbagliata | Rifirma il PBO con la tua chiave privata. Assicurati che il server abbia il `.bikey` corrispondente. |
| Le modifiche del file patching non hanno effetto | Non si sta usando l'eseguibile diagnostico | Il file patching funziona solo con `DayZDiag_x64.exe`, non con il retail `DayZ_x64.exe`. |
| La vecchia versione del mod si carica nonostante le modifiche | PBO in cache o versione workshop che sovrascrive | Elimina il vecchio PBO. Controlla il percorso `-mod=`. |

---

## 6. Problemi di prestazioni

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| FPS del server bassi (sotto 20) | Elaborazione pesante in `OnUpdate()` | Usa un accumulatore delta-tempo. Esegui la logica ogni N secondi. Vedi [Capitolo 7.7](07-patterns/07-performance.md). |
| La memoria cresce nel tempo (memory leak) | Cicli di riferimento `ref` | Quando due oggetti mantengono `ref` l'uno sull'altro, nessuno viene mai liberato. Rendi un lato un riferimento raw (non-`ref`). Vedi [Capitolo 1.8](01-enforce-script/08-memory-management.md). |
| Il file di log cresce molto rapidamente | `Print()` eccessivi | Rimuovi o proteggi le chiamate `Print()` di debug dietro `#ifdef DEVELOPER`. |

---

## 7. Problemi con oggetti, veicoli ed entita

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| L'oggetto non si genera ("cannot create") | `scope=0` nella configurazione o mancante da `types.xml` | Imposta `scope=2`. Aggiungi una voce al `types.xml` del server. |
| L'oggetto si genera ma e invisibile | Il percorso del modello (`.p3d`) e sbagliato | Controlla il percorso `model` nella tua classe `CfgVehicles`. Usa le barre. |
| L'oggetto non puo essere raccolto | Geometria errata o `inventorySlot` sbagliato | Verifica la Fire Geometry nel modello. Controlla `itemSize[]`. |
| L'entita viene eliminata immediatamente dopo la generazione | `lifetime` e zero in `types.xml` | Imposta un valore `lifetime` appropriato. |

---

## 8. Problemi di configurazione e tipi

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| I valori di configurazione non hanno effetto | Modifica del sorgente con configurazione binarizzata | Ricompila il PBO dopo le modifiche alla configurazione. |
| Le modifiche a `types.xml` vengono ignorate | Modifica del file `types.xml` sbagliato | Il server carica i tipi da `mpmissions/la_tua_missione/db/types.xml`. |
| "Error loading types" all'avvio del server | Errore di sintassi XML in `types.xml` | Valida il tuo XML. Problemi comuni: tag non chiusi, virgolette mancanti. |
| Il file di configurazione JSON non si carica | JSON malformato o percorso sbagliato | Valida la sintassi JSON. Usa il prefisso `$profile:`. |

---

## 9. Problemi di persistenza

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| Dati giocatore persi al riavvio | Non salva nella directory `$profile:` | Usa `JsonFileLoader<T>.JsonSaveFile()` con un percorso `$profile:`. |
| Il file salvato e vuoto o corrotto | Crash durante la scrittura | Scrivi prima in un file temporaneo, poi rinomina al percorso finale. |
| Mancata corrispondenza `OnStoreSave`/`OnStoreLoad` | La versione e cambiata ma nessuna migrazione | Scrivi sempre prima il numero di versione. |

---

## 10. Diagrammi di flusso decisionali

### "Il mio mod non funziona affatto"

1. **Controlla il log degli script** per errori `SCRIPT (E)`. Correggi il primo errore trovato. (Sezione 2)
2. **Il mod appare nel launcher?** Se no, controlla `mod.cpp`. (Sezione 1)
3. **Il log menziona la tua classe CfgPatches?** Se no, controlla la sintassi di `config.cpp` e il parametro `-mod=`.
4. **Gli script compilano?** Cerca errori di compilazione nell'RPT. (Sezione 2)
5. **C'e un punto di ingresso?** Hai bisogno di `modded class MissionServer`/`MissionGameplay`.
6. **Ancora nulla?** Aggiungi `Print("MY_MOD: Init reached");` al tuo punto di ingresso.

### "Funziona offline ma non su server dedicato"

1. **Il mod e installato sul server?** Controlla `-mod=` e la posizione del PBO.
2. **Codice solo-client sul server?** `GetGame().GetPlayer()` restituisce `null` durante l'init del server. Aggiungi guardie.
3. **Gli RPC funzionano?** Aggiungi `Print()` su entrambi i lati. Controlla la corrispondenza degli ID. (Sezione 3)
4. **Sincronizzazione dati?** Verifica `SetSynchDirty()`.

### "La mia UI e rotta"

1. **`CreateWidgets()` restituisce null?** Il percorso del layout e sbagliato.
2. **I widget esistono ma sono invisibili?** Controlla le dimensioni (> 0, nessun negativo). Controlla `Show(true)`.
3. **Visibili ma non cliccabili?** Controlla la `priority` del widget.
4. **Input bloccato dopo la chiusura dell'UI?** Le chiamate `ChangeGameFocus()` sono sbilanciate.

---

## 11. Riferimento rapido comandi di debug

| Azione | Comando |
|--------|---------|
| Genera oggetto a terra | `GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition());` |
| Teletrasporto alle coordinate | `GetGame().GetPlayer().SetPosition("6543 0 2114".ToVector());` |
| Cura completa | `GetGame().GetPlayer().SetHealth("", "", 5000);` |
| Imposta mezzogiorno | `GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);` |
| Imposta notte | `GetGame().GetWorld().SetDate(2024, 9, 15, 2, 0);` |
| Tempo sereno | `GetGame().GetWeather().GetOvercast().Set(0,0,0); GetGame().GetWeather().GetRain().Set(0,0,0);` |
| Stampa posizione | `Print(GetGame().GetPlayer().GetPosition());` |
| Verifica server/client | `Print("IsServer: " + GetGame().IsServer().ToString());` |

**Posizioni comuni in Chernarus:** Elektro `"10570 0 2354"`, Cherno `"6649 0 2594"`, NWAF `"4494 0 10365"`, Tisy `"1693 0 13575"`, Berezino `"12121 0 9216"`

### Parametri di avvio

| Parametro | Scopo |
|-----------|-------|
| `-filePatching` | Carica file non impacchettati (richiede DayZDiag) |
| `-scriptDebug=true` | Abilita funzionalita di debug script |
| `-doLogs` | Abilita logging dettagliato |
| `-profiles=<percorso>` | Directory profilo/log personalizzata |
| `-connect=<ip>` | Connessione automatica al server all'avvio |
| `-port=<porta>` | Porta del server (predefinita 2302) |
| `-mod=@Mod1;@Mod2` | Carica mod (separati da punto e virgola) |
| `-serverMod=@Mod` | Mod solo server (non inviati ai client) |

---

## 12. Posizioni dei file di log

### Log del client

| Log | Posizione | Contenuto |
|-----|-----------|-----------|
| Log degli script | `%localappdata%\DayZ\` (file `.RPT` piu recente) | Errori script, avvisi, output `Print()` |
| Dump dei crash | `%localappdata%\DayZ\` (file `.mdmp`) | Dati per l'analisi dei crash |

### Log del server

| Log | Posizione | Contenuto |
|-----|-----------|-----------|
| Log degli script | `<root_server>\profiles\` (file `.RPT` piu recente) | Errori script, `Print()` lato server |
| Log amministratore | `<root_server>\profiles\` (file `.ADM`) | Connessioni giocatori, uccisioni, chat |

### Lettura efficace dei log

- Cerca `SCRIPT (E)` per trovare errori di script
- Cerca il nome del tuo mod o nomi di classi per filtrare le voci rilevanti
- Gli errori spesso si cascadano -- correggi il **primo** errore nel log, non l'ultimo

---

## 13. Dove ottenere aiuto

### Risorse della comunita

| Risorsa | URL | Migliore per |
|---------|-----|-------------|
| DayZ Modding Discord | `discord.gg/dayzmods` | Aiuto in tempo reale |
| Forum Bohemia Interactive | `forums.bohemia.net/forums/forum/231-dayz-modding/` | Forum ufficiali |
| DayZ Workshop | Steam Workshop (DayZ) | Esplorare mod pubblicati |

### Codice sorgente di riferimento

| Mod | Cosa impari |
|-----|-------------|
| **Community Framework (CF)** | Ciclo di vita dei moduli, gestione RPC, logging |
| **DayZ Expansion** | Architettura mod su larga scala, sistema di mercato |
| **Community Online Tools (COT)** | Strumenti admin, permessi, pattern UI |
| **Dabs Framework** | Pattern MVC, data binding, framework componenti UI |

### Riferimento script vanilla

- Monta il drive P: tramite DayZ Tools
- Naviga a `P:\DZ\scripts\`
- Organizzato per livelli: `3_Game/`, `4_World/`, `5_Mission/`

---

*Problema ancora irrisolto? Controlla le [FAQ](faq.md), il [Cheat Sheet](cheatsheet.md), o chiedi sul DayZ Modding Discord.*
