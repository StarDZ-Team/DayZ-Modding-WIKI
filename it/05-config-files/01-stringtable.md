# Capitolo 5.1: stringtable.csv --- Localizzazione

[Home](../README.md) | **stringtable.csv** | [Successivo: inputs.xml >>](02-inputs-xml.md)

---

> **Sommario:** Il file `stringtable.csv` fornisce il testo localizzato per la tua mod DayZ. Il motore legge questo CSV all'avvio e risolve le chiavi di traduzione in base alla lingua impostata dal giocatore. Ogni stringa rivolta all'utente --- etichette dell'UI, nomi delle associazioni di tasti, descrizioni degli oggetti, testo delle notifiche --- dovrebbe trovarsi in una stringtable anziché essere hardcoded.

---

## Indice

- [Panoramica](#panoramica)
- [Formato CSV](#formato-csv)
- [Riferimento delle Colonne](#riferimento-delle-colonne)
- [Convenzione di Denominazione delle Chiavi](#convenzione-di-denominazione-delle-chiavi)
- [Referenziare le Stringhe](#referenziare-le-stringhe)
- [Creare una Nuova Stringtable](#creare-una-nuova-stringtable)
- [Gestione Celle Vuote e Comportamento di Fallback](#gestione-celle-vuote-e-comportamento-di-fallback)
- [Flusso di Lavoro Multilingua](#flusso-di-lavoro-multilingua)
- [Approccio Stringtable Modulare (DayZ Expansion)](#approccio-stringtable-modulare-dayz-expansion)
- [Esempi Reali](#esempi-reali)
- [Errori Comuni](#errori-comuni)

---

## Panoramica

DayZ utilizza un sistema di localizzazione basato su CSV. Quando il motore incontra una chiave stringa con prefisso `#` (ad esempio, `#STR_MYMOD_HELLO`), cerca quella chiave in tutti i file stringtable caricati e restituisce la traduzione corrispondente alla lingua corrente del giocatore. Se non viene trovata una corrispondenza per la lingua attiva, il motore passa attraverso una catena di fallback definita.

Il file stringtable deve chiamarsi esattamente `stringtable.csv` e deve essere posizionato all'interno della struttura PBO della tua mod. Il motore lo individua automaticamente --- non è richiesta alcuna registrazione in config.cpp.

---

## Formato CSV

Il file è un file standard con valori separati da virgola con campi tra virgolette. La prima riga è l'intestazione, e ogni riga successiva definisce una chiave di traduzione.

### Riga di Intestazione

La riga di intestazione definisce le colonne. DayZ riconosce fino a 15 colonne:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Righe di Dati

Ogni riga inizia con la chiave stringa (senza prefisso `#` nel CSV), seguita dalla traduzione per ogni lingua:

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### Virgola Finale

Molti file stringtable includono una virgola finale dopo l'ultima colonna. Questa è una convenzione sicura --- il motore la tollera.

### Regole di Quotatura

- I campi **devono** essere racchiusi tra virgolette doppie se contengono virgole, a capo o virgolette doppie.
- In pratica, la maggior parte delle mod quota ogni campo per coerenza.
- Alcune mod (come MyMod Missions) omettono completamente le virgolette; il motore gestisce entrambi gli stili purché il contenuto del campo non contenga virgole.

---

## Riferimento delle Colonne

DayZ supporta 13 lingue selezionabili dal giocatore. Il CSV ha 15 colonne perché la prima colonna è il nome della chiave e la seconda è la colonna `original` (la lingua nativa dell'autore della mod o il testo predefinito).

| # | Nome Colonna | Lingua | Note |
|---|-------------|--------|------|
| 1 | `Language` | --- | L'identificatore della chiave stringa (es. `STR_MYMOD_HELLO`) |
| 2 | `original` | Nativa dell'autore | Fallback di ultima istanza; usato se nessun'altra colonna corrisponde |
| 3 | `english` | Inglese | La lingua principale più comune per mod internazionali |
| 4 | `czech` | Ceco | |
| 5 | `german` | Tedesco | |
| 6 | `russian` | Russo | |
| 7 | `polish` | Polacco | |
| 8 | `hungarian` | Ungherese | |
| 9 | `italian` | Italiano | |
| 10 | `spanish` | Spagnolo | |
| 11 | `french` | Francese | |
| 12 | `chinese` | Cinese (Tradizionale) | Caratteri cinesi tradizionali |
| 13 | `japanese` | Giapponese | |
| 14 | `portuguese` | Portoghese | |
| 15 | `chinesesimp` | Cinese (Semplificato) | Caratteri cinesi semplificati |

### L'Ordine delle Colonne è Importante

Il motore identifica le colonne tramite il **nome dell'intestazione**, non dalla posizione. Tuttavia, seguire l'ordine standard mostrato sopra è fortemente consigliato per compatibilità e leggibilità.

### Colonne Opzionali

Non è necessario includere tutte le 15 colonne. Se la tua mod supporta solo l'inglese, puoi usare un'intestazione minimale:

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

Alcune mod aggiungono colonne non standard come `korean` (MyMod Missions lo fa). Il motore ignora le colonne che non riconosce come lingua supportata, ma quelle colonne possono servire come documentazione o preparazione per il supporto linguistico futuro.

---

## Convenzione di Denominazione delle Chiavi

Le chiavi stringa seguono un pattern di denominazione gerarchico:

```
STR_MODNAME_CATEGORY_ELEMENT
```

### Regole

1. **Inizia sempre con `STR_`** --- questa è una convenzione universale di DayZ
2. **Prefisso mod** --- identifica univocamente la tua mod (es. `MYMOD`, `COT`, `EXPANSION`, `VPP`)
3. **Categoria** --- raggruppa stringhe correlate (es. `INPUT`, `TAB`, `CONFIG`, `DIR`)
4. **Elemento** --- la stringa specifica (es. `ADMIN_PANEL`, `NORTH`, `SAVE`)
5. **Usa MAIUSCOLO** --- la convenzione di tutte le mod principali
6. **Usa underscore** come separatori, mai spazi o trattini

### Esempi da Mod Reali

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod: etichetta keybinding
STR_MYMOD_CLOSE                   -- MyMod: pulsante generico "Chiudi"
STR_MYMOD_DIR_NORTH               -- MyMod: direzione bussola
STR_MYMOD_TAB_ONLINE              -- MyMod: nome tab pannello admin
STR_COT_ESP_MODULE_NAME           -- COT: nome visualizzato del modulo
STR_COT_CAMERA_MODULE_BLUR        -- COT: etichetta strumento camera
STR_EXPANSION_ATM                 -- Expansion: nome funzionalità
STR_EXPANSION_AI_COMMAND_MENU     -- Expansion: etichetta input
```

### Anti-Pattern

```
STR_hello_world          -- Male: minuscolo, nessun prefisso mod
MY_STRING                -- Male: prefisso STR_ mancante
STR_MYMOD Hello World    -- Male: spazi nella chiave
```

---

## Referenziare le Stringhe

Ci sono tre contesti distinti in cui si referenziano stringhe localizzate, e ciascuno usa una sintassi leggermente diversa.

### Nei File Layout (.layout)

Usa il prefisso `#` prima del nome della chiave. Il motore lo risolve al momento della creazione del widget.

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

Il prefisso `#` dice al parser del layout "questa è una chiave di localizzazione, non testo letterale."

### In Enforce Script (file .c)

Usa `Widget.TranslateString()` per risolvere la chiave a runtime. Il prefisso `#` è richiesto nell'argomento.

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close" (se la lingua del giocatore è Inglese)
// translated == "Fechar" (se la lingua del giocatore è Portoghese)
```

Puoi anche impostare il testo del widget direttamente:

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

Oppure usa le chiavi stringa direttamente nelle proprietà di testo del widget, e il motore le risolve:

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // Funziona anche così -- il motore risolve automaticamente
```

### In inputs.xml

Usa l'attributo `loc` **senza** il prefisso `#`.

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

Questo è l'unico posto in cui si omette il `#`. Il sistema di input lo aggiunge internamente.

### Tabella Riepilogativa

| Contesto | Sintassi | Esempio |
|----------|----------|---------|
| Attributo `text` del file layout | `#STR_KEY` | `text "#STR_MYMOD_CLOSE"` |
| Script `TranslateString()` | `"#STR_KEY"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| Testo widget nello script | `"#STR_KEY"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| Attributo `loc` di inputs.xml | `STR_KEY` (senza #) | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## Creare una Nuova Stringtable

### Passo 1: Creare il File

Crea `stringtable.csv` alla radice della directory del contenuto PBO della tua mod. Il motore scansiona tutti i PBO caricati cercando file chiamati esattamente `stringtable.csv`.

Posizionamento tipico:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- Qui
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### Passo 2: Scrivere l'Intestazione

Inizia con l'intestazione completa a 15 colonne:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Passo 3: Aggiungere le Stringhe

Aggiungi una riga per ogni stringa traducibile. Inizia con l'inglese, compila le altre lingue man mano che le traduzioni diventano disponibili:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### Passo 4: Impacchettare e Testare

Compila il tuo PBO. Avvia il gioco. Verifica che `Widget.TranslateString("#STR_MYMOD_TITLE")` restituisca "My Cool Mod" nei log degli script. Cambia la lingua del gioco nelle impostazioni per verificare il comportamento di fallback.

---

## Gestione Celle Vuote e Comportamento di Fallback

Quando il motore cerca una chiave stringa per la lingua corrente del giocatore e trova una cella vuota, segue una catena di fallback:

1. **Colonna della lingua selezionata dal giocatore** --- controllata per prima
2. **Colonna `english`** --- se la cella della lingua del giocatore è vuota
3. **Colonna `original`** --- se anche `english` è vuota
4. **Nome grezzo della chiave** --- se tutte le colonne sono vuote, il motore mostra la chiave stessa (es. `STR_MYMOD_TITLE`)

Questo significa che puoi tranquillamente lasciare le colonne non inglesi vuote durante lo sviluppo. I giocatori anglofoni vedono la colonna `english`, e gli altri giocatori vedono il fallback inglese fino a quando non viene fornita una traduzione corretta.

### Implicazione Pratica

Non è necessario copiare il testo inglese in ogni colonna come segnaposto. Lascia le celle non tradotte vuote:

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

I giocatori la cui lingua è il tedesco vedranno "Hello" (il fallback inglese) fino a quando non verrà fornita una traduzione tedesca.

---

## Flusso di Lavoro Multilingua

### Per Sviluppatori Singoli

1. Scrivi tutte le stringhe in inglese (entrambe le colonne `original` e `english`).
2. Pubblica la mod. L'inglese serve come fallback universale.
3. Man mano che i membri della comunità offrono traduzioni, compila le colonne aggiuntive.
4. Ricompila e pubblica gli aggiornamenti.

### Per Team con Traduttori

1. Mantieni il CSV in un repository condiviso o in un foglio di calcolo.
2. Assegna un traduttore per lingua.
3. Usa la colonna `original` per la lingua nativa dell'autore (es. Portoghese per sviluppatori brasiliani).
4. La colonna `english` è sempre compilata --- è il punto di riferimento internazionale.
5. Usa uno strumento di diff per tracciare quali chiavi sono state aggiunte dall'ultimo giro di traduzioni.

### Usare Software per Fogli di Calcolo

I file CSV si aprono naturalmente in Excel, Google Sheets o LibreOffice Calc. Fai attenzione a queste insidie:

- **Excel potrebbe aggiungere BOM (Byte Order Mark)** ai file UTF-8. DayZ gestisce il BOM, ma può causare problemi con alcuni strumenti. Salva come "CSV UTF-8" per sicurezza.
- **La formattazione automatica di Excel** può alterare campi che sembrano date o numeri.
- **Fine riga**: DayZ accetta sia `\r\n` (Windows) che `\n` (Unix).

---

## Approccio Stringtable Modulare (DayZ Expansion)

DayZ Expansion dimostra una buona pratica per mod grandi: suddividere le traduzioni in più file stringtable organizzati per modulo funzionale. La loro struttura usa 20 file stringtable separati all'interno di una directory `languagecore`:

```
DayZExpansion/
  languagecore/
    AI/stringtable.csv
    BaseBuilding/stringtable.csv
    Book/stringtable.csv
    Chat/stringtable.csv
    Core/stringtable.csv
    Garage/stringtable.csv
    Groups/stringtable.csv
    Hardline/stringtable.csv
    Licensed/stringtable.csv
    Main/stringtable.csv
    MapAssets/stringtable.csv
    Market/stringtable.csv
    Missions/stringtable.csv
    Navigation/stringtable.csv
    PersonalStorage/stringtable.csv
    PlayerList/stringtable.csv
    Quests/stringtable.csv
    SpawnSelection/stringtable.csv
    Vehicles/stringtable.csv
    Weapons/stringtable.csv
```

### Perché Suddividere?

- **Gestibilità**: Una singola stringtable per una mod grande può crescere fino a migliaia di righe. Suddividere per modulo funzionale rende ogni file gestibile.
- **Aggiornamenti indipendenti**: I traduttori possono lavorare su un modulo alla volta senza conflitti di merge.
- **Inclusione condizionale**: Il PBO di ogni sotto-mod include solo la stringtable per la sua funzionalità, mantenendo le dimensioni dei PBO ridotte.

### Come Funziona

Il motore scansiona ogni PBO caricato cercando `stringtable.csv`. Poiché ogni sotto-modulo di Expansion è impacchettato nel proprio PBO, ciascuno include naturalmente solo la propria stringtable. Non è necessaria alcuna configurazione speciale --- basta chiamare il file `stringtable.csv` e posizionarlo dentro il PBO.

I nomi delle chiavi usano comunque un prefisso globale (`STR_EXPANSION_`) per evitare collisioni.

---

## Esempi Reali

### MyMod Core

MyMod Core usa il formato completo a 15 colonne con il portoghese come lingua `original` (la lingua nativa del team di sviluppo) e traduzioni complete per tutte le 13 lingue supportate:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

Pattern notevoli:
- `original` contiene testo portoghese (la lingua nativa del team)
- `english` è sempre compilata come punto di riferimento internazionale
- Tutte le 13 colonne linguistiche sono compilate

### COT (Community Online Tools)

COT usa lo stesso formato a 15 colonne. Le sue chiavi seguono il pattern `STR_COT_MODULE_CATEGORY_ELEMENT`:

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

VPP usa un set ridotto di colonne (13 colonne, senza colonna `hungarian`) e non aggiunge il prefisso `STR_` alle chiavi:

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

Questo dimostra che il prefisso `STR_` è una convenzione, non un requisito. Tuttavia, ometterlo significa che non puoi usare la risoluzione con prefisso `#` nei file layout. VPP referenzia queste chiavi solo tramite codice script. Il prefisso `STR_` è fortemente consigliato per tutte le nuove mod.

### MyMod Missions

MyMod Missions usa un CSV in stile senza virgolette e senza intestazione (nessuna virgoletta attorno ai campi) con una colonna extra `Korean`:

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MYMOD_MISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

Da notare: la colonna `original` è assente, e `Korean` è aggiunta come lingua extra. Il motore ignora i nomi di colonna non riconosciuti, quindi `Korean` serve come documentazione fino a quando il supporto ufficiale per il coreano non viene aggiunto.

---

## Errori Comuni

### Dimenticare il Prefisso `#` negli Script

```c
// SBAGLIATO -- mostra la chiave grezza, non la traduzione
label.SetText("STR_MYMOD_HELLO");

// CORRETTO
label.SetText("#STR_MYMOD_HELLO");
```

### Usare `#` in inputs.xml

```xml
<!-- SBAGLIATO -- il sistema di input aggiunge # internamente -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- CORRETTO -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### Chiavi Duplicate tra Mod

Se due mod definiscono `STR_CLOSE`, il motore usa qualsiasi PBO si carichi per ultimo. Usa sempre il prefisso della tua mod:

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### Conteggio Colonne Non Corrispondente

Se una riga ha meno colonne dell'intestazione, il motore potrebbe saltarla silenziosamente o assegnare stringhe vuote alle colonne mancanti. Assicurati sempre che ogni riga abbia lo stesso numero di campi dell'intestazione.

### Problemi con il BOM

Alcuni editor di testo inseriscono un BOM UTF-8 (byte order mark) all'inizio del file. Questo può far sì che la prima chiave del CSV sia silenziosamente rotta. Se la tua prima chiave stringa non si risolve mai, controlla e rimuovi il BOM.

### Usare Virgole dentro Campi non Quotati

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

Questo rompe l'analisi perché `Hello` e ` World` vengono letti come colonne separate. Quota il campo oppure evita le virgole nei valori:

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```

---

## Buone Pratiche

- Usa sempre il prefisso `STR_NOMEMOD_` per ogni chiave. Questo previene le collisioni quando più mod sono caricate insieme.
- Quota ogni campo nel CSV, anche se il contenuto non ha virgole. Questo previene errori sottili di analisi quando le traduzioni in altre lingue contengono virgole o caratteri speciali.
- Compila la colonna `english` per ogni chiave, anche se la tua lingua nativa è diversa. L'inglese è il fallback universale e il punto di riferimento per i traduttori della comunità.
- Mantieni una stringtable per PBO per mod piccole. Per mod grandi con 500+ chiavi, suddividi in file stringtable per funzionalità in PBO separati (seguendo il pattern di Expansion).
- Salva i file come UTF-8 senza BOM. Se usi Excel, scegli esplicitamente il formato "CSV UTF-8" all'esportazione.

---

## Teoria vs Pratica

> Cosa dice la documentazione rispetto a come funzionano effettivamente le cose a runtime.

| Concetto | Teoria | Realtà |
|----------|--------|--------|
| L'ordine delle colonne non conta | Il motore identifica le colonne tramite il nome dell'intestazione | Vero, ma alcuni strumenti della comunità e le esportazioni dei fogli di calcolo riordinano le colonne. Mantenere l'ordine standard previene confusione |
| Catena di fallback: lingua > english > original > chiave grezza | Cascata documentata | Se sia `english` che `original` sono vuoti, il motore mostra la chiave grezza con il prefisso `#` rimosso -- utile per individuare traduzioni mancanti in gioco |
| `Widget.TranslateString()` | Risolve al momento della chiamata | Il risultato è memorizzato nella cache per sessione. Cambiare la lingua del gioco richiede un riavvio affinché le ricerche nella stringtable si aggiornino |
| Più mod con la stessa chiave | L'ultimo PBO caricato vince | L'ordine di caricamento dei PBO non è garantito tra le mod. Se due mod definiscono `STR_CLOSE`, il testo mostrato dipende da quale mod si carica per ultima -- usa sempre un prefisso mod |
| Prefisso `#` in `SetText()` | Il motore risolve automaticamente le chiavi di localizzazione | Funziona, ma solo alla prima chiamata. Se chiami `SetText("#STR_KEY")` e poi chiami `SetText("testo letterale")`, tornare a `SetText("#STR_KEY")` funziona correttamente -- nessun problema di cache a livello di widget |

---

## Compatibilità e Impatto

- **Multi-Mod:** Le collisioni di chiavi stringa sono il rischio principale. Due mod che definiscono `STR_ADMIN_PANEL` entreranno in conflitto silenziosamente. Aggiungi sempre il prefisso con il nome della tua mod (`STR_MYMOD_ADMIN_PANEL`).
- **Prestazioni:** La ricerca nella stringtable è veloce (basata su hash). Avere migliaia di chiavi attraverso più mod non ha impatto misurabile sulle prestazioni. L'intera stringtable viene caricata in memoria all'avvio.
- **Versione:** Il formato stringtable basato su CSV è rimasto invariato dalla alpha di DayZ Standalone. Il layout a 15 colonne e il comportamento di fallback sono rimasti stabili in tutte le versioni.
