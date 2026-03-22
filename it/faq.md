# Domande frequenti

[Home](./README.md) | **FAQ**

---

## Per iniziare

### D: Di cosa ho bisogno per iniziare a moddare DayZ?
**R:** Hai bisogno di Steam, DayZ (copia retail), DayZ Tools (gratuito su Steam nella sezione Strumenti) e un editor di testo (VS Code consigliato). Non e strettamente necessaria esperienza di programmazione -- inizia con il [Capitolo 8.1: Il tuo primo mod](08-tutorials/01-first-mod.md). DayZ Tools include Object Builder, Addon Builder, TexView2 e l'IDE Workbench.

### D: Quale linguaggio di programmazione usa DayZ?
**R:** DayZ usa **Enforce Script**, un linguaggio proprietario di Bohemia Interactive. Ha una sintassi simile al C, vicina al C#, ma con regole e limitazioni proprie (nessun operatore ternario, nessun try/catch, nessuna lambda). Vedi [Parte 1: Enforce Script](01-enforce-script/01-variables-types.md) per una guida completa al linguaggio.

### D: Come configuro il drive P:?
**R:** Apri DayZ Tools da Steam, clicca su "Workdrive" o "Setup Workdrive" per montare il drive P:. Questo crea un drive virtuale che punta al tuo workspace di modding, dove il motore cerca i file sorgente durante lo sviluppo. Puoi anche usare il comando `subst P: "C:\Il\Tuo\Percorso"` dalla riga di comando. Vedi il [Capitolo 4.5](04-file-formats/05-dayz-tools.md).

### D: Posso testare il mio mod senza un server dedicato?
**R:** Si. Avvia DayZ con il parametro `-filePatching` e il mod caricato. Per test rapidi, usa un Listen Server (hosting dal menu di gioco). Per test di produzione, verifica sempre anche su un server dedicato, poiche alcuni percorsi di codice differiscono. Vedi il [Capitolo 8.1](08-tutorials/01-first-mod.md).

### D: Dove trovo i file script vanilla di DayZ da studiare?
**R:** Dopo aver montato il drive P: tramite DayZ Tools, gli script vanilla sono in `P:\DZ\scripts\` organizzati per livello (`3_Game`, `4_World`, `5_Mission`). Questo e il riferimento autorevole per ogni classe del motore, metodo ed evento. Vedi anche il [Cheat Sheet](cheatsheet.md) e l'[API Quick Reference](06-engine-api/quick-reference.md).

---

## Errori comuni e soluzioni

### D: Il mio mod si carica ma non succede nulla. Nessun errore nel log.
**R:** Molto probabilmente il tuo `config.cpp` ha una voce `requiredAddons[]` errata, quindi i tuoi script si caricano troppo presto o per niente. Verifica che ogni nome di addon in `requiredAddons` corrisponda esattamente a un nome di classe `CfgPatches` esistente (sensibile alle maiuscole). Controlla il log degli script in `%localappdata%/DayZ/` per avvisi silenziosi. Vedi il [Capitolo 2.2](02-mod-structure/02-config-cpp.md).

### D: Ricevo errori "Cannot find variable" o "Undefined variable".
**R:** Questo di solito significa che stai facendo riferimento a una classe o variabile da un livello script superiore. I livelli inferiori (`3_Game`) non possono vedere i tipi definiti nei livelli superiori (`4_World`, `5_Mission`). Sposta la definizione della classe nel livello corretto, o usa la riflessione `typename` per un accoppiamento debole. Vedi il [Capitolo 2.1](02-mod-structure/01-five-layers.md).

### D: Perche `JsonFileLoader<T>.JsonLoadFile()` non restituisce i miei dati?
**R:** `JsonLoadFile()` restituisce `void`, non l'oggetto caricato. Devi pre-allocare l'oggetto e passarlo come parametro di riferimento: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Assegnare il valore di ritorno ti dara silenziosamente `null`. Vedi il [Capitolo 6.8](06-engine-api/08-file-io.md).

### D: Il mio RPC viene inviato ma mai ricevuto dall'altra parte.
**R:** Controlla queste cause comuni: (1) L'ID RPC non corrisponde tra mittente e ricevente. (2) Stai inviando dal client ma ascolti sul client (o server-a-server). (3) Hai dimenticato di registrare il gestore RPC in `OnRPC()` o nel tuo gestore personalizzato. (4) L'entita di destinazione e `null` o non e sincronizzata in rete. Vedi il [Capitolo 6.9](06-engine-api/09-networking.md) e il [Capitolo 7.3](07-patterns/03-rpc-patterns.md).

### D: Ricevo "Error: Member already defined" in un blocco else-if.
**R:** Enforce Script non permette la ri-dichiarazione di variabili in blocchi `else if` fratelli nello stesso scope. Dichiara la variabile una volta prima della catena `if`/`else`, o usa scope separati con parentesi graffe. Vedi il [Capitolo 1.12](01-enforce-script/12-gotchas.md).

### D: Il mio layout UI non mostra nulla / i widget sono invisibili.
**R:** Cause comuni: (1) Il widget ha dimensione zero -- controlla che larghezza/altezza siano impostati correttamente (nessun valore negativo). (2) Il widget non ha `Show(true)`. (3) L'alfa del colore del testo e 0 (completamente trasparente). (4) Il percorso del layout in `CreateWidgets()` e errato (non genera errore, restituisce semplicemente `null`). Vedi il [Capitolo 3.3](03-gui-system/03-sizing-positioning.md).

### D: Il mio mod causa un crash all'avvio del server.
**R:** Controlla: (1) Chiamata di metodi solo-client (`GetGame().GetPlayer()`, codice UI) sul server. (2) Riferimento `null` in `OnInit` o `OnMissionStart` prima che il mondo sia pronto. (3) Ricorsione infinita in un override di `modded class` dove si e dimenticato di chiamare `super`. Aggiungi sempre clausole di guardia poiche non esiste try/catch. Vedi il [Capitolo 1.11](01-enforce-script/11-error-handling.md).

### D: I caratteri barra rovesciata o virgolette nelle mie stringhe causano errori di parsing.
**R:** Il parser di Enforce Script (CParser) non supporta le sequenze di escape `\\` o `\"` nei letterali stringa. Evita completamente le barre rovesciate. Per i percorsi dei file, usa le barre (`"my/path/file.json"`). Per le virgolette nelle stringhe, usa apici singoli o concatenazione di stringhe. Vedi il [Capitolo 1.12](01-enforce-script/12-gotchas.md).

---

## Decisioni architetturali

### D: Cos'e la gerarchia di script a 5 livelli e perche e importante?
**R:** Gli script DayZ si compilano in cinque livelli numerati: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Ogni livello puo riferirsi solo a tipi dello stesso livello o di livelli con numero inferiore. Questo impone confini architetturali -- posiziona enum e costanti condivise in `3_Game`, la logica delle entita in `4_World` e gli hook UI/missione in `5_Mission`. Vedi il [Capitolo 2.1](02-mod-structure/01-five-layers.md).

### D: Devo usare `modded class` o creare nuove classi?
**R:** Usa `modded class` quando devi modificare o estendere il comportamento vanilla esistente (aggiungere un metodo a `PlayerBase`, hookarsi a `MissionServer`). Crea nuove classi per sistemi autonomi che non hanno bisogno di sovrascrivere nulla. Le classi moddate si concatenano automaticamente -- chiama sempre `super` per non rompere gli altri mod. Vedi il [Capitolo 1.4](01-enforce-script/04-modded-classes.md).

### D: Come devo organizzare il codice client vs. server?
**R:** Usa le guard del preprocessore `#ifdef SERVER` e `#ifdef CLIENT` per codice che deve eseguire solo su un lato. Per mod piu grandi, dividili in PBO separati: mod client (UI, rendering, effetti locali) e mod server (spawn, logica, persistenza). Questo previene la fuoriuscita della logica server verso i client. Vedi il [Capitolo 2.5](02-mod-structure/05-file-organization.md) e il [Capitolo 6.9](06-engine-api/09-networking.md).

### D: Quando usare un Singleton vs. un Modulo/Plugin?
**R:** Usa un Modulo (registrato tramite il `PluginManager` di CF o il tuo sistema di moduli) quando hai bisogno della gestione del ciclo di vita (`OnInit`, `OnUpdate`, `OnMissionFinish`). Usa un Singleton autonomo per servizi utility senza stato che necessitano solo di accesso globale. I moduli sono preferiti per qualsiasi cosa con stato o necessita di pulizia. Vedi il [Capitolo 7.1](07-patterns/01-singletons.md) e il [Capitolo 7.2](07-patterns/02-module-systems.md).

### D: Come posso memorizzare in modo sicuro dati per-giocatore che sopravvivono al riavvio del server?
**R:** Salva file JSON nella directory `$profile:` del server usando `JsonFileLoader`. Usa lo Steam UID del giocatore (da `PlayerIdentity.GetId()`) come nome del file. Carica alla connessione del giocatore, salva alla disconnessione e periodicamente durante il gioco. Gestisci sempre con eleganza file mancanti/corrotti con clausole di guardia. Vedi il [Capitolo 7.4](07-patterns/04-config-persistence.md) e il [Capitolo 6.8](06-engine-api/08-file-io.md).

---

## Pubblicazione e distribuzione

### D: Come impacchetto il mio mod in un PBO?
**R:** Usa Addon Builder (da DayZ Tools) o strumenti di terze parti come PBO Manager. Puntalo alla cartella sorgente del tuo mod, imposta il prefisso corretto (corrispondente al prefisso addon nel `config.cpp`) e compila. Il file `.pbo` di output va nella cartella `Addons/` del tuo mod. Vedi il [Capitolo 4.6](04-file-formats/06-pbo-packing.md).

### D: Come firmo il mio mod per l'uso su server?
**R:** Genera una coppia di chiavi con DSSignFile o DSCreateKey di DayZ Tools: questo produce un `.biprivatekey` e un `.bikey`. Firma ogni PBO con la chiave privata (crea file `.bisign` accanto a ogni PBO). Distribuisci il `.bikey` agli amministratori del server per la loro cartella `keys/`. Non condividere mai il `.biprivatekey`. Vedi il [Capitolo 4.6](04-file-formats/06-pbo-packing.md).

### D: Come pubblico sullo Steam Workshop?
**R:** Usa il DayZ Tools Publisher o l'uploader dello Steam Workshop. Hai bisogno di un file `mod.cpp` nella root del mod che definisca il nome, l'autore e la descrizione. Il publisher carica i tuoi PBO impacchettati e Steam assegna un Workshop ID. Aggiorna ri-pubblicando dallo stesso account. Vedi il [Capitolo 2.3](02-mod-structure/03-mod-cpp.md) e il [Capitolo 8.7](08-tutorials/07-publishing-workshop.md).

### D: Il mio mod puo richiedere altri mod come dipendenze?
**R:** Si. In `config.cpp`, aggiungi il nome della classe `CfgPatches` del mod dipendente al tuo array `requiredAddons[]`. In `mod.cpp` non c'e un sistema formale di dipendenze -- documenta i mod richiesti nella descrizione del Workshop. I giocatori devono iscriversi e caricare tutti i mod richiesti. Vedi il [Capitolo 2.2](02-mod-structure/02-config-cpp.md).

---

## Argomenti avanzati

### D: Come creo azioni personalizzate del giocatore (interazioni)?
**R:** Estendi `ActionBase` (o una sottoclasse come `ActionInteractBase`), definisci `CreateConditionComponents()` per le precondizioni, sovrascrivi `OnStart`/`OnExecute`/`OnEnd` per la logica e registrala in `SetActions()` sull'entita di destinazione. Le azioni supportano modalita continua (pressione prolungata) e istantanea (clic). Vedi il [Capitolo 6.12](06-engine-api/12-action-system.md).

### D: Come funziona il sistema di danno per gli oggetti personalizzati?
**R:** Definisci una classe `DamageSystem` nel config.cpp del tuo oggetto con `DamageZones` (regioni nominate) e valori `ArmorType`. Ogni zona traccia i propri punti salute. Sovrascrivi `EEHitBy()` ed `EEKilled()` nello script per reazioni al danno personalizzate. Il motore mappa i componenti Fire Geometry del modello ai nomi delle zone. Vedi il [Capitolo 6.1](06-engine-api/01-entity-system.md).

### D: Come posso aggiungere tasti personalizzati al mio mod?
**R:** Crea un file `inputs.xml` che definisca le tue azioni di input con assegnazioni di tasti predefinite. Registrale nello script tramite `GetUApi().RegisterInput()`. Interroga lo stato con `GetUApi().GetInputByName("your_action").LocalPress()`. Aggiungi nomi localizzati nel tuo `stringtable.csv`. Vedi il [Capitolo 5.2](05-config-files/02-inputs-xml.md) e il [Capitolo 6.13](06-engine-api/13-input-system.md).

### D: Come rendo il mio mod compatibile con altri mod?
**R:** Segui questi principi: (1) Chiama sempre `super` negli override di modded class. (2) Usa nomi di classe unici con prefisso del mod (es. `MyMod_Manager`). (3) Usa ID RPC unici. (4) Non sovrascrivere metodi vanilla senza chiamare `super`. (5) Usa `#ifdef` per rilevare dipendenze opzionali. (6) Testa con combinazioni di mod popolari (CF, Expansion, ecc.). Vedi il [Capitolo 7.2](07-patterns/02-module-systems.md).

### D: Come ottimizzo il mio mod per le prestazioni del server?
**R:** Strategie chiave: (1) Evita logica per-frame (`OnUpdate`) -- usa timer o design guidato dagli eventi. (2) Memorizza in cache i riferimenti invece di chiamare ripetutamente `GetGame().GetPlayer()`. (3) Usa guard `GetGame().IsServer()` / `GetGame().IsClient()` per saltare codice non necessario. (4) Profila con benchmark `int start = TickCount(0);`. (5) Limita il traffico di rete -- raggruppa gli RPC e usa Net Sync Variables per aggiornamenti piccoli e frequenti. Vedi il [Capitolo 7.7](07-patterns/07-performance.md).

---

*Hai una domanda non trattata qui? Apri una issue nel repository.*
