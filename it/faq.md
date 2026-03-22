# Domande Frequenti

[Home](../README.md) | **FAQ**

---

## Per Iniziare

### D: Di cosa ho bisogno per iniziare a moddare DayZ?
**R:** Hai bisogno di Steam, DayZ (copia retail), DayZ Tools (gratuito su Steam nella sezione Strumenti) e un editor di testo (VS Code consigliato). Non e strettamente necessaria esperienza di programmazione — start with [Chapter 8.1: Your First Mod](08-tutorials/01-first-mod.md). DayZ Tools include Object Builder, Addon Builder, TexView2 e l'IDE Workbench.

### D: Quale linguaggio di programmazione usa DayZ?
**R:** DayZ usa **Enforce Script**, un linguaggio proprietario di Bohemia Interactive. Ha una sintassi simile al C, simile a C#, ma con le sue regole e limitazioni (nessun operatore ternario, nessun try/catch, nessuna lambda). Vedi [Parte 1: Enforce Script](01-enforce-script/01-variables-types.md) per una guida completa del linguaggio.

### D: Come configuro il drive P:?
**R:** Apri DayZ Tools da Steam, clicca "Workdrive" or "Setup Workdrive" per montare il drive P:. Questo crea un drive virtuale che punta al tuo spazio di lavoro per il modding dove il motore cerca i file sorgente durante lo sviluppo. Puoi anche usare `subst P: "C:\Your\Path"` dalla riga di comando. Vedi [Capitolo 4.5](04-file-formats/05-dayz-tools.md).

### D: Posso testare il mio mod senza un server dedicato?
**R:** Si. Avvia DayZ con il `-filePatching` parametro e il tuo mod caricato. Per un test rapido, usa un Listen Server (ospita dal menu di gioco). Per i test di produzione, verifica sempre anche su un server dedicato, poiche alcuni percorsi del codice differiscono. Vedi [Capitolo 8.1](08-tutorials/01-first-mod.md).

### D: Dove trovo i file script vanilla di DayZ da studiare?
**R:** Dopo aver montato il drive P: tramite DayZ Tools, gli script vanilla si trovano in `P:\DZ\scripts\` organizzati per layer (`3_Game`, `4_World`, `5_Mission`). Questi sono il riferimento autorevole per ogni classe, metodo ed evento del motore. Vedi anche il [Cheat Sheet](cheatsheet.md) and [API Quick Reference](06-engine-api/quick-reference.md).

---

## Errori Comuni e Soluzioni

### D: Il mio mod si carica ma non succede nulla. Nessun errore nel log.
**R:** Molto probabilmente il tuo `config.cpp` ha una voce `requiredAddons[]` errata, quindi i tuoi script si caricano troppo presto o non si caricano affatto. Verifica che ogni nome di addon in `requiredAddons` corrisponda a un `CfgPatches` nome di classe esistente esattamente (sensibile alle maiuscole). Controlla il log degli script in `%localappdata%/DayZ/` per avvisi silenziosi. Vedi [Capitolo 2.2](02-mod-structure/02-config-cpp.md).

### D: Ottengo "Cannot find variable" or "Undefiniscid variable" errori.
**R:** Questo di solito significa che stai facendo riferimento a una classe o variabile da un layer di script superiore. I layer inferiori (`3_Game`) non possono vedere i tipi definiti nei layer superiori (`4_World`, `5_Mission`). Sposta la definizione della tua classe nel layer corretto, oppure usa `typename` reflection per un accoppiamento lasco. Vedi [Capitolo 2.1](02-mod-structure/01-five-layers.md).

### D: Perche `JsonFileLoader<T>.JsonLoadFile()` non restituisce i miei dati?
**A:** `JsonLoadFile()` restituisce `void`, non l'oggetto caricato. Devi pre-allocare il tuo oggetto e passarlo come parametro di riferimento: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Assegnare il valore di ritorno ti da silenziosamente `null`. Vedi [Capitolo 6.8](06-engine-api/08-file-io.md).

### D: Il mio RPC viene inviato ma mai ricevuto dall'altra parte.
**R:** Controlla queste cause comuni: (1) L'ID RPC non corrisponde tra mittente e destinatario. (2) Stai inviando dal client ma ascoltando sul client (or server-to-server). (3) Hai dimenticato di registrare il gestore RPC in `OnRPC()` or your custom handler. (4) L'entita target e `null` o non sincronizzata in rete. Vedi [Capitolo 6.9](06-engine-api/09-networking.md) and [Chapter 7.3](07-patterns/03-rpc-patterns.md).

### D: Ottengo "Error: Member already definiscid" in un blocco else-if.
**R:** Enforce Script non consente la ridichiarazione di variabili nei blocchi `else if` fratelli all'interno dello stesso ambito. Dichiara la variabile una volta prima della `if` catena, o usa ambiti separati con parentesi graffe. Vedi [Capitolo 1.12](01-enforce-script/12-gotchas.md).

### D: Il mio layout UI non mostra nulla / i widget sono invisibili.
**R:** Cause comuni: (1) Il widget ha dimensione zero — controlla che larghezza/altezza siano impostati correttamente (nessun valore negativo). (2) Il widget non e `Show(true)`. (3) L'alfa del colore del testo e 0 (completamente trasparente). (4) Il percorso del layout in `CreateWidgets()` e errato (nessun errore viene generato, restituisce semplicemente `null`). Vedi [Capitolo 3.3](03-gui-system/03-sizing-positioning.md).

### D: Il mio mod causa un crash all'avvio del server.
**R:** Controlla: (1) Chiamata di metodi solo-client (`GetGame().GetPlayer()`, codice UI) sul server. (2) `null` riferimento in `OnInit` or `OnMissionStart` prima che il mondo sia pronto. (3) Ricorsione infinita in un `modded class` override che ha dimenticato di chiamare `super`. Aggiungi sempre clausole di guardia poiche non esiste try/catch. Vedi [Capitolo 1.11](01-enforce-script/11-error-handling.md).

### Q: Backslash or quote characters in my strings cause parse errori.
**A:** Enforce Script's parser (CParser) non supporta `\\` or `\"` sequenze di escape nei letterali stringa. Evita completamente i backslash. Per i percorsi dei file, usa le barre (`"my/path/file.json"`). Per le virgolette nelle stringhe, usa caratteri di virgoletta singola o concatenazione di stringhe. Vedi [Capitolo 1.12](01-enforce-script/12-gotchas.md).

---

## Decisioni Architetturali

### D: Cos'e la gerarchia a 5 livelli degli script e perche e importante?
**R:** Gli script di DayZ compilano in cinque layer numerati: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Ogni layer puo fare riferimento solo a tipi dallo stesso layer o da layer con numerazione inferiore. Questo impone confini architetturali — put shared enums and constants in `3_Game`, entity logica in `4_World`, and UI/mission hooks in `5_Mission`. Vedi [Capitolo 2.1](02-mod-structure/01-five-layers.md).

### D: Dovrei usare `modded class` o creare nuove classi?
**A:** Use `modded class` quando devi cambiare o estendere il comportamento vanilla esistente (adding a method to `PlayerBase`, hooking into `MissionServer`). Crea nuove classi per sistemi autonomi che non hanno bisogno di sovrascrivere nulla. Le classi moddate si concatenano automaticamente — chiama sempre `super` per evitare di rompere altri mod. Vedi [Capitolo 1.4](01-enforce-script/04-modded-classes.md).

### D: Come dovrei organizzare il codice client vs. server?
**A:** Use `#ifdef SERVER` and `#ifdef CLIENT` guardie del preprocessore per il codice che deve essere eseguito solo su un lato. Per mod piu grandi, dividi in PBO separati: un mod client (UI, rendering, effetti locali) e un mod server (spawning, logicaa, persistenza). Questo impedisce la fuga della logicaa del server ai client. Vedi [Capitolo 2.5](02-mod-structure/05-file-organization.md) and [Chapter 6.9](06-engine-api/09-networking.md).

### D: Quando dovrei usare un Singleton vs. un Modulo/Plugin?
**A:** Usa un Modulo (registered with CF's `PluginManager` or your own module system) quando hai bisogno di gestione del ciclo di vita (`OnInit`, `OnUpdate`, `OnMissionFinish`). Usa un Singleton autonomo per servizi di utilita senza stato che hanno solo bisogno di accesso globale. I Moduli sono preferiti per qualsiasi cosa con stato o necessita di pulizia. Vedi [Capitolo 7.1](07-patterns/01-singletons.md) and [Chapter 7.2](07-patterns/02-module-systems.md).

### D: Come posso memorizzare in modo sicuro i dati per giocatore che sopravvivono ai riavvii del server?
**A:** Salva file JSON nella directory `$profile:` del server usando `JsonFileLoader`. Usa lo Steam UID del giocatore (from `PlayerIdentity.GetId()`) come nome del file. Carica alla connessione del giocatore, salva alla disconnessione e periodicamente. Gestisci sempre i file mancanti/corrotti con clausole di guardia. Vedi [Capitolo 7.4](07-patterns/04-config-persistence.md) and [Chapter 6.8](06-engine-api/08-file-io.md).

---

## Pubblicazione e Distribuzione

### D: Come impacchetto il mio mod in un PBO?
**R:** Usa Addon Builder (da DayZ Tools) o strumenti di terze parti come PBO Manager. Puntalo alla cartella sorgente del tuo mod, imposta il prefisso corretto (corrispondente al tuo `config.cpp` prefisso addon), e compila. L'output `.pbo` va nella cartella `Addons/` del tuo mod. Vedi [Capitolo 4.6](04-file-formats/06-pbo-packing.md).

### D: Come firmo il mio mod per l'uso sul server?
**A:** Genera una coppia di chiavi con DSSignFile or DSCreateKey: questo produce un `.biprivatekey` and `.bikey`. Firma ogni PBO con la chiave privata (crea `.bisign` file accanto a ogni PBO). Distribuisci il `.bikey` agli amministratori del server per la loro cartella `keys/` del tuo mod. Non condividere mai il tuo `.biprivatekey`. Vedi [Capitolo 4.6](04-file-formats/06-pbo-packing.md).

### D: Come pubblico sullo Steam Workshop?
**R:** Usa il Publisher di DayZ Tools o l'uploader dello Steam Workshop. Hai bisogno di un `mod.cpp` file nella root del tuo mod che definisce nome, autore e descrizione. Il publisher carica i tuoi PBO impacchettati e Steam assegna un ID Workshop. Aggiorna ri-pubblicando dallo stesso account. Vedi [Capitolo 2.3](02-mod-structure/03-mod-cpp.md) and [Chapter 8.7](08-tutorials/07-publishing-workshop.md).

### D: Il mio mod puo richiedere altri mod come dipendenze?
**R:** Si. In `config.cpp`, aggiungi il nome della classe `CfgPatches` del mod dipendenza al tuo `requiredAddons[]` array. In `mod.cpp`, non esiste un sistema formale di dipendenze — documenta i mod richiesti nella descrizione del tuo Workshop. I giocatori devono iscriversi e caricare tutti i mod richiesti. Vedi [Capitolo 2.2](02-mod-structure/02-config-cpp.md).

---

## Argomenti Avanzati

### D: Come creo azioni personalizzate del giocatore (interazioni)?
**A:** Extend `ActionBase` (or a subclass like `ActionInteractBase`), definisci `CreateConditionComponents()` per le precondizioni, sovrascrivi `OnStart`/`OnExecute`/`OnEnd` per la logicaa, e registrala in `SetActions()` sull'entita target. Le azioni supportano modalita continua (tenere premuto) e istantanea (clic). Vedi [Capitolo 6.12](06-engine-api/12-action-system.md).

### D: Come funziona il sistema di danni per gli oggetti personalizzati?
**R:** Definisci una `DamageSystem` nella config.cpp del tuo oggetto con `DamageZones` (regioni nominate) e `ArmorType` valori. Ogni zona traccia la propria salute. Sovrascrivi `EEHitBy()` and `EEKilled()` nello script per reazioni al danno personalizzate. Il motore mappa i componenti della Fire Geometry del modello ai nomi delle zone. Vedi [Capitolo 6.1](06-engine-api/01-entity-system.md).

### D: Come posso aggiungere tasti personalizzati al mio mod?
**R:** Crea un `inputs.xml` file che definisce le tue azioni di input con assegnazioni di tasti predefinite. Registrale nello script tramite `GetUApi().RegisterInput()`. Interroga lo stato con `GetUApi().GetInputByName("your_action").LocalPress()`. Aggiungi nomi localizzati nel tuo `stringtable.csv`. Vedi [Capitolo 5.2](05-config-files/02-inputs-xml.md) and [Chapter 6.13](06-engine-api/13-input-system.md).

### D: Come rendo il mio mod compatibile con altri mod?
**R:** Segui questi principi: (1) Chiama sempre `super` negli override delle classi moddate. (2) Usa nomi di classe unici con un prefisso del mod (e.g., `MyMod_Manager`). (3) Usa ID RPC unici. (4) Non sovrascrivere i metodi vanilla senza chiamare `super`. (5) Use `#ifdef` per rilevare le dipendenze opzionali. (6) Testa con combinazioni di mod popolari (CF, Expansion, etc.). Vedi [Capitolo 7.2](07-patterns/02-module-systems.md).

### D: Come ottimizzo il mio mod per le prestazioni del server?
**R:** Strategie chiave: (1) Evita la logicaa per-frame (`OnUpdate`) logica — usa timer o design guidato dagli eventi. (2) Memorizza in cache i riferimenti invece di chiamare `GetGame().GetPlayer()` ripetutamente. (3) Use `GetGame().IsServer()` / `GetGame().IsClient()` guardie per saltare il codice non necessario. (4) Profila con `int start = TickCount(0);` benchmark. (5) Limita il traffico di rete — raggruppa gli RPC e usa le Net Sync Variables per aggiornamenti piccoli e frequenti. Vedi [Capitolo 7.7](07-patterns/07-performance.md).

---

*Hai una domanda non trattata qui? Apri una issue nel repository.*
