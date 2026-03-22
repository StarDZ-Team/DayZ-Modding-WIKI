# Capitolo 4.1: Texture (.paa, .edds, .tga)

[Home](../README.md) | **Texture** | [Successivo: Modelli 3D >>](02-models.md)

---

## Introduzione

Ogni superficie che vedi in DayZ -- skin delle armi, abbigliamento, terreno, icone UI -- è definita da file di texture. Il motore usa un formato compresso proprietario chiamato **PAA** a runtime, ma durante lo sviluppo lavori con diversi formati sorgente che vengono convertiti durante il processo di build. Comprendere questi formati, le convenzioni di denominazione che li legano ai materiali e le regole di risoluzione imposte dal motore è fondamentale per creare contenuto visivo per le mod DayZ.

Questo capitolo copre ogni formato di texture che incontrerai, il sistema di suffissi di denominazione che dice al motore come interpretare ogni texture, i requisiti di risoluzione e canale alfa, e il flusso di lavoro pratico per la conversione tra formati.

---

## Indice dei Contenuti

- [Panoramica dei Formati Texture](#panoramica-dei-formati-texture)
- [Formato PAA](#formato-paa)
- [Formato EDDS](#formato-edds)
- [Formato TGA](#formato-tga)
- [Formato PNG](#formato-png)
- [Convenzioni di Denominazione delle Texture](#convenzioni-di-denominazione-delle-texture)
- [Requisiti di Risoluzione](#requisiti-di-risoluzione)
- [Supporto al Canale Alfa](#supporto-al-canale-alfa)
- [Conversione tra Formati](#conversione-tra-formati)
- [Qualità e Compressione delle Texture](#qualità-e-compressione-delle-texture)
- [Esempi dal Mondo Reale](#esempi-dal-mondo-reale)
- [Errori Comuni](#errori-comuni)
- [Buone Pratiche](#buone-pratiche)

---

## Panoramica dei Formati Texture

DayZ usa quattro formati di texture in fasi diverse della pipeline di sviluppo:

| Formato | Estensione | Ruolo | Supporto Alfa | Usato In |
|--------|-----------|------|---------------|---------|
| **PAA** | `.paa` | Formato di gioco a runtime (compresso) | Sì | Build finale, distribuito nei PBO |
| **EDDS** | `.edds` | Variante DDS editor/intermedia | Sì | Anteprima Object Builder, auto-conversione |
| **TGA** | `.tga` | Artwork sorgente non compresso | Sì | Workspace dell'artista, esportazione Photoshop/GIMP |
| **PNG** | `.png` | Formato sorgente portatile | Sì | Texture UI, strumenti esterni |

Il flusso di lavoro generale è: **Sorgente (TGA/PNG) --> conversione DayZ Tools --> PAA (pronto per il gioco)**.

---

## Formato PAA

**PAA** (PAcked Arma) è il formato di texture compresso nativo usato dal motore Enfusion a runtime. Ogni texture distribuita in un PBO deve essere in formato PAA (o sarà convertita ad esso durante la binarizzazione).

### Caratteristiche

- **Compresso:** Usa compressione DXT1, DXT5 o ARGB8888 internamente a seconda della presenza del canale alfa e delle impostazioni di qualità.
- **Con mipmap:** I file PAA contengono una catena completa di mipmap, generata automaticamente durante la conversione. Questo è critico per le prestazioni di rendering -- il motore seleziona il livello mip appropriato in base alla distanza.
- **Dimensioni potenza di due:** Il motore richiede che le texture PAA abbiano dimensioni che sono potenze di 2 (256, 512, 1024, 2048, 4096).
- **Sola lettura a runtime:** Il motore carica i file PAA direttamente dai PBO. Non modifichi mai un file PAA -- modifichi la sorgente e riconverti.

### Tipi di Compressione Interna

| Tipo | Alfa | Qualità | Caso d'Uso |
|------|-------|---------|----------|
| **DXT1** | No (1-bit) | Buona, rapporto 6:1 | Texture opache, terreno |
| **DXT5** | Piena 8-bit | Buona, rapporto 4:1 | Texture con alfa uniforme (vetro, fogliame) |
| **ARGB4444** | Piena 4-bit | Media | Texture UI, piccole icone |
| **ARGB8888** | Piena 8-bit | Senza perdita | Debug, massima qualità (dimensione file grande) |
| **AI88** | Scala di grigi + alfa | Buona | Normal map, maschere scala di grigi |

### Quando Vedi File PAA

- All'interno dei dati di gioco vanilla spacchettati (PBO `dta/` e addon)
- Come output della conversione TexView2
- Come output di Binarize durante l'elaborazione delle texture sorgente
- Nel PBO finale della tua mod dopo la build

---

## Formato EDDS

**EDDS** è un formato di texture intermedio usato principalmente da **Object Builder** e dagli strumenti editor di DayZ. È essenzialmente una variante del formato standard DirectDraw Surface (DDS) con metadati specifici del motore.

### Caratteristiche

- **Formato di anteprima:** Object Builder può visualizzare direttamente le texture EDDS, rendendole utili durante la creazione dei modelli.
- **Auto-conversione in PAA:** Quando esegui Binarize o AddonBuilder (senza `-packonly`), i file EDDS nel tuo albero sorgente vengono automaticamente convertiti in PAA.
- **Più grande del PAA:** I file EDDS non sono ottimizzati per la distribuzione -- esistono per comodità nell'editor.
- **Formato DayZ-Samples:** I DayZ-Samples ufficiali forniti da Bohemia usano estensivamente texture EDDS.

### Flusso di Lavoro con EDDS

```
L'artista crea la sorgente TGA/PNG
    --> Plugin DDS Photoshop esporta EDDS per l'anteprima
        --> Object Builder visualizza EDDS sul modello
            --> Binarize converte EDDS in PAA per il PBO
```

> **Suggerimento:** Puoi saltare completamente EDDS se preferisci. Converti le tue texture sorgente direttamente in PAA usando TexView2 e riferisci i percorsi PAA nei tuoi materiali. EDDS è una comodità, non un requisito.

---

## Formato TGA

**TGA** (Truevision TGA / Targa) è il formato sorgente non compresso tradizionale per il lavoro sulle texture DayZ. Molte texture vanilla DayZ sono state originariamente create come file TGA.

### Caratteristiche

- **Non compresso:** Nessuna perdita di qualità, profondità colore completa (24-bit o 32-bit con alfa).
- **Dimensioni file grandi:** Una TGA 2048x2048 con alfa è di circa 16 MB.
- **Alfa in canale dedicato:** TGA supporta un canale alfa a 8-bit (TGA 32-bit), che corrisponde direttamente alla trasparenza in PAA.
- **Compatibile con TexView2:** TexView2 può aprire direttamente i file TGA e convertirli in PAA.

### Quando Usare TGA

- Come file sorgente master per le texture che crei da zero.
- Quando esporti da Substance Painter o Photoshop per DayZ.
- Quando la documentazione DayZ-Samples o i tutorial della community specificano TGA come formato sorgente.

### Impostazioni di Esportazione TGA

Quando esporti TGA per la conversione DayZ:

- **Profondità bit:** 32-bit (se serve l'alfa) o 24-bit (texture opache)
- **Compressione:** Nessuna (non compresso)
- **Orientamento:** Origine in basso a sinistra (orientamento TGA standard)
- **Risoluzione:** Deve essere potenza di 2 (vedi [Requisiti di Risoluzione](#requisiti-di-risoluzione))

---

## Formato PNG

**PNG** (Portable Network Graphics) è ampiamente supportato e può essere usato come formato sorgente alternativo, in particolare per le texture UI.

### Caratteristiche

- **Compressione senza perdita:** Più piccolo del TGA ma mantiene la qualità completa.
- **Canale alfa completo:** PNG a 32-bit supporta alfa a 8-bit.
- **Compatibile con TexView2:** TexView2 può aprire e convertire PNG in PAA.
- **Adatto all'UI:** Molti imageset e icone UI nelle mod usano PNG come formato sorgente.

### Quando Usare PNG

- **Texture e icone UI:** PNG è la scelta pratica per imageset ed elementi HUD.
- **Retexture semplici:** Quando hai bisogno solo di una mappa colore/diffuse senza alfa complesso.
- **Flussi di lavoro cross-tool:** PNG è supportato universalmente tra editor di immagini, strumenti web e script.

> **Nota:** PNG non è un formato sorgente ufficiale Bohemia -- preferiscono TGA. Tuttavia, gli strumenti di conversione gestiscono PNG senza problemi e molti modder lo usano con successo.

---

## Convenzioni di Denominazione delle Texture

DayZ usa un sistema di suffissi rigoroso per identificare il ruolo di ogni texture. Il motore e i materiali riferiscono le texture per nome file, e il suffisso dice sia al motore che agli altri modder che tipo di dati contiene la texture.

### Suffissi Obbligatori

| Suffisso | Nome Completo | Scopo | Formato Tipico |
|--------|-----------|---------|----------------|
| `_co` | **Color / Diffuse** | Il colore base (albedo) di una superficie | RGB, alfa opzionale |
| `_nohq` | **Normal Map (Alta Qualità)** | Normali di dettaglio della superficie, definisce dossi e scanalature | RGB (normale tangent-space) |
| `_smdi` | **Specular / Metallic / Indice Dettaglio** | Controlla lucentezza e proprietà metalliche | I canali RGB codificano dati separati |
| `_ca` | **Colore con Alfa** | Texture colore dove il canale alfa porta dati significativi (trasparenza, maschera) | RGBA |
| `_as` | **Ombra Ambientale** | Occlusione ambientale / bake ombre | Scala di grigi |
| `_mc` | **Macro** | Variazione di colore su larga scala visibile a distanza | RGB |
| `_li` | **Luce / Emissivo** | Mappa di auto-illuminazione (parti luminose) | RGB |
| `_no` | **Normal Map (Standard)** | Variante normal map di qualità inferiore | RGB |
| `_mca` | **Macro con Alfa** | Texture macro con canale alfa | RGBA |
| `_de` | **Dettaglio** | Texture di dettaglio a tiling per variazione della superficie da vicino | RGB |

### Convenzione di Denominazione nella Pratica

Un singolo oggetto tipicamente ha più texture, tutte con lo stesso nome base:

```
data/
  my_rifle_co.paa          <-- Colore base (ciò che vedi)
  my_rifle_nohq.paa        <-- Normal map (rilievi della superficie)
  my_rifle_smdi.paa         <-- Speculare/metallico (lucentezza)
  my_rifle_as.paa           <-- Ombra ambientale (AO precalcolato)
  my_rifle_ca.paa           <-- Colore con alfa (se serve la trasparenza)
```

### I Canali _smdi

La texture speculare/metallico/dettaglio comprime tre flussi di dati in una singola immagine RGB:

| Canale | Dati | Intervallo | Effetto |
|---------|------|-------|--------|
| **R** | Metallico | 0-255 | 0 = non-metallo, 255 = metallo pieno |
| **G** | Ruvidità (speculare invertito) | 0-255 | 0 = ruvido/opaco, 255 = liscio/lucido |
| **B** | Indice dettaglio / AO | 0-255 | Tiling dettaglio o occlusione ambientale |

### I Canali _nohq

Le normal map in DayZ usano codifica tangent-space:

| Canale | Dati |
|---------|------|
| **R** | Normale asse X (sinistra-destra) |
| **G** | Normale asse Y (alto-basso) |
| **B** | Normale asse Z (verso l'osservatore) |
| **A** | Potenza speculare (opzionale, dipende dal materiale) |

---

## Requisiti di Risoluzione

Il motore Enfusion richiede che tutte le texture abbiano **dimensioni potenza di due**. Sia larghezza che altezza devono indipendentemente essere una potenza di 2, ma non devono essere uguali (le texture non quadrate sono valide).

### Dimensioni Valide

| Dimensione | Uso Tipico |
|------|-------------|
| **64x64** | Icone minuscole, elementi UI |
| **128x128** | Piccole icone, miniature inventario |
| **256x256** | Pannelli UI, texture di piccoli oggetti |
| **512x512** | Texture di oggetti standard, abbigliamento |
| **1024x1024** | Armi, abbigliamento dettagliato, parti di veicoli |
| **2048x2048** | Armi ad alto dettaglio, modelli di personaggi |
| **4096x4096** | Texture del terreno, texture di veicoli grandi |

### Texture Non Quadrate

Le texture non quadrate con potenze di due sono valide:

```
256x512    -- Valido (entrambi sono potenze di 2)
512x1024   -- Valido
1024x2048  -- Valido
300x512    -- NON VALIDO (300 non è una potenza di 2)
```

### Linee Guida sulla Risoluzione

- **Armi:** 2048x2048 per il corpo principale, 1024x1024 per gli accessori.
- **Abbigliamento:** 1024x1024 o 2048x2048 a seconda della copertura dell'area superficiale.
- **Icone UI:** 128x128 o 256x256 per le icone inventario, 64x64 per gli elementi HUD.
- **Terreno:** 4096x4096 per le mappe satellitari, 512x512 o 1024x1024 per le tile dei materiali.
- **Normal map:** Stessa risoluzione della texture colore corrispondente.
- **Mappe SMDI:** Stessa risoluzione della texture colore corrispondente.

> **Attenzione:** Se una texture ha dimensioni non potenza di due, il motore rifiuterà di caricarla o mostrerà una texture di errore magenta. TexView2 mostrerà un avviso durante la conversione.

---

## Supporto al Canale Alfa

Il canale alfa in una texture trasporta dati aggiuntivi oltre al colore. Come viene interpretato dipende dal suffisso della texture e dallo shader del materiale.

### Ruoli del Canale Alfa

| Suffisso | Interpretazione Alfa |
|--------|---------------------|
| `_co` | Di solito non usato; se presente, può definire la trasparenza per materiali semplici |
| `_ca` | Maschera di trasparenza (0 = completamente trasparente, 255 = completamente opaco) |
| `_nohq` | Mappa di potenza speculare (più alto = highlight speculare più nitido) |
| `_smdi` | Di solito non usato |
| `_li` | Maschera di intensità emissiva |

### Creare Texture con Alfa

Nel tuo editor di immagini (Photoshop, GIMP, Krita):

1. Crea il contenuto RGB normalmente.
2. Aggiungi un canale alfa.
3. Dipingi bianco (255) dove vuoi opacità/effetto pieno, nero (0) dove non ne vuoi.
4. Esporta come TGA 32-bit o PNG.
5. Converti in PAA usando TexView2 -- rileverà automaticamente il canale alfa.

### Verifica dell'Alfa in TexView2

Apri il PAA in TexView2 e usa i pulsanti di visualizzazione canale:

- **RGBA** -- Mostra il composito finale
- **RGB** -- Mostra solo il colore
- **A** -- Mostra solo il canale alfa (bianco = opaco, nero = trasparente)

---

## Conversione tra Formati

### TexView2 (Strumento Principale)

**TexView2** è incluso con DayZ Tools ed è l'utilità standard di conversione texture.

**Apertura di un file:**
1. Avvia TexView2 da DayZ Tools o direttamente da `DayZ Tools\Bin\TexView2\TexView2.exe`.
2. Apri il tuo file sorgente (TGA, PNG o EDDS).
3. Verifica che l'immagine appaia corretta e controlla le dimensioni.

**Conversione in PAA:**
1. Apri la texture sorgente in TexView2.
2. Vai a **File --> Save As**.
3. Seleziona **PAA** come formato di output.
4. Scegli il tipo di compressione:
   - **DXT1** per texture opache (nessun alfa necessario)
   - **DXT5** per texture con trasparenza alfa
   - **ARGB4444** per piccole texture UI dove la dimensione file conta
5. Clicca **Save**.

**Conversione batch tramite riga di comando:**

```bash
# Converti un singolo TGA in PAA
"P:\DayZ Tools\Bin\TexView2\TexView2.exe" -i "source.tga" -o "output.paa"

# TexView2 selezionerà automaticamente la compressione in base alla presenza del canale alfa
```

### Binarize (Automatizzato)

Quando Binarize elabora la directory sorgente della tua mod, converte automaticamente tutti i formati di texture riconosciuti (TGA, PNG, EDDS) in PAA. Questo avviene come parte della pipeline di AddonBuilder.

**Flusso di conversione Binarize:**
```
source/mod_name/data/texture_co.tga
    --> Binarize rileva TGA
        --> Converte in PAA con selezione automatica della compressione
            --> Output: build/mod_name/data/texture_co.paa
```

### Tabella di Conversione Manuale

| Da | A | Strumento | Note |
|------|----|------|-------|
| TGA --> PAA | TexView2 | Flusso di lavoro standard |
| PNG --> PAA | TexView2 | Funziona identicamente a TGA |
| EDDS --> PAA | TexView2 o Binarize | Automatico durante la build |
| PAA --> TGA | TexView2 (Salva come TGA) | Per modificare texture esistenti |
| PAA --> PNG | TexView2 (Salva come PNG) | Per estrarre in formato portatile |
| PSD --> TGA/PNG | Photoshop/GIMP | Esporta dall'editor, poi converti |

---

## Qualità e Compressione delle Texture

### Selezione del Tipo di Compressione

| Scenario | Compressione Consigliata | Motivo |
|----------|------------------------|--------|
| Diffuse opaco (`_co`) | DXT1 | Miglior rapporto, nessun alfa necessario |
| Diffuse trasparente (`_ca`) | DXT5 | Supporto alfa completo |
| Normal map (`_nohq`) | DXT5 | Il canale alfa trasporta la potenza speculare |
| Mappe speculari (`_smdi`) | DXT1 | Di solito opache, solo canali RGB |
| Texture UI | ARGB4444 o DXT5 | Dimensione ridotta, bordi puliti |
| Mappe emissive (`_li`) | DXT1 o DXT5 | DXT5 se l'alfa trasporta l'intensità |

### Qualità vs. Dimensione File

```
Formato        2048x2048 dimensione approx.
-----------------------------------------
ARGB8888      16.0 MB    (non compresso)
DXT5           5.3 MB    (compressione 4:1)
DXT1           2.7 MB    (compressione 6:1)
ARGB4444       8.0 MB    (compressione 2:1)
```

### Impostazioni di Qualità nel Gioco

I giocatori possono regolare la qualità delle texture nelle impostazioni video di DayZ. Il motore seleziona livelli mip inferiori quando la qualità è ridotta, quindi le tue texture appariranno progressivamente più sfocate a impostazioni inferiori. Questo è automatico -- non devi creare livelli di qualità separati.

---

## Esempi dal Mondo Reale

### Set di Texture per Armi

Una tipica mod armi contiene questi file di texture:

```
MyMod_Weapons/data/weapons/m4a1/
  my_weapon_co.paa           <-- 2048x2048, DXT1, colore base
  my_weapon_nohq.paa         <-- 2048x2048, DXT5, normal map
  my_weapon_smdi.paa          <-- 2048x2048, DXT1, speculare/metallico
  my_weapon_as.paa            <-- 1024x1024, DXT1, ombra ambientale
```

Il file materiale (`.rvmat`) riferisce queste texture e le assegna agli stadi dello shader.

### Texture UI (Sorgente Imageset)

```
MyFramework/data/gui/icons/
  my_icons_co.paa           <-- 512x512, ARGB4444, atlante sprite
```

Le texture UI sono spesso impacchettate in un singolo atlante (imageset) e riferite per nome nei file di layout. La compressione ARGB4444 è comune per l'UI perché preserva bordi puliti mantenendo le dimensioni file piccole.

### Texture del Terreno

```
terrain/
  grass_green_co.paa         <-- 1024x1024, DXT1, colore a tiling
  grass_green_nohq.paa       <-- 1024x1024, DXT5, normale a tiling
  grass_green_smdi.paa        <-- 1024x1024, DXT1, speculare a tiling
  grass_green_mc.paa          <-- 512x512, DXT1, variazione macro
  grass_green_de.paa          <-- 512x512, DXT1, dettaglio a tiling
```

Le texture del terreno si ripetono attraverso il paesaggio. La texture macro `_mc` aggiunge variazione di colore su larga scala per prevenire la ripetizione.

---

## Errori Comuni

### 1. Dimensioni Non Potenza di Due

**Sintomo:** Texture magenta nel gioco, avvisi di TexView2.
**Soluzione:** Ridimensiona la tua sorgente alla potenza di 2 più vicina prima di convertire.

### 2. Suffisso Mancante

**Sintomo:** Il materiale non trova la texture, o viene renderizzata in modo scorretto.
**Soluzione:** Includi sempre il suffisso appropriato (`_co`, `_nohq`, ecc.) nel nome del file.

### 3. Compressione Sbagliata per l'Alfa

**Sintomo:** La trasparenza appare blocchettosa o binaria (on/off senza sfumatura).
**Soluzione:** Usa DXT5 invece di DXT1 per le texture che necessitano di sfumature alfa uniformi.

### 4. Mipmap Dimenticate

**Sintomo:** La texture appare bene da vicino ma luccica/scintilla a distanza.
**Soluzione:** I file PAA generati da TexView2 includono automaticamente le mipmap. Se stai usando uno strumento non standard, assicurati che la generazione di mipmap sia abilitata.

### 5. Formato Normal Map Scorretto

**Sintomo:** L'illuminazione sul modello appare invertita o piatta.
**Soluzione:** Assicurati che la tua normal map sia in formato tangent-space con convenzione asse Y stile DirectX (canale verde: su = più chiaro). Alcuni strumenti esportano in stile OpenGL (Y invertito) -- devi invertire il canale verde.

### 6. Disallineamento del Percorso Dopo la Conversione

**Sintomo:** Il modello o il materiale mostra magenta perché riferisce un percorso `.tga` ma il PBO contiene `.paa`.
**Soluzione:** I materiali dovrebbero riferire il percorso `.paa` finale. Binarize gestisce automaticamente la rimappatura dei percorsi, ma se impacchetti con `-packonly` (senza binarizzazione), devi assicurarti che i percorsi corrispondano esattamente.

---

## Buone Pratiche

1. **Mantieni i file sorgente nel controllo versione.** Archivia i master TGA/PNG insieme alla tua mod. I file PAA sono output generati -- le sorgenti sono ciò che conta.

2. **Adatta la risoluzione all'importanza.** Un fucile che il giocatore fissa per ore merita 2048x2048. Una lattina di fagioli in fondo a uno scaffale può usare 512x512.

3. **Fornisci sempre una normal map.** Anche una normal map piatta (riempimento solido 128, 128, 255) è meglio di nessuna -- le normal map mancanti causano errori del materiale.

4. **Denominazione consistente.** Un nome base, suffissi multipli: `myitem_co.paa`, `myitem_nohq.paa`, `myitem_smdi.paa`. Non mescolare mai gli schemi di denominazione.

5. **Anteprima in TexView2 prima della build.** Apri il tuo output PAA e verifica che appaia corretto. Controlla ogni canale individualmente.

6. **Usa DXT1 per impostazione predefinita, DXT5 solo quando serve l'alfa.** DXT1 è la metà della dimensione file di DXT5 e appare identico per le texture opache.

7. **Testa alle impostazioni di qualità bassa.** Ciò che appare ottimo a Ultra potrebbe essere illeggibile a Basso perché il motore scarta aggressivamente i livelli mip.

---

## Osservato nelle Mod Reali

| Pattern | Mod | Dettaglio |
|---------|-----|--------|
| Texture atlante `_co` per griglie di icone | Colorful UI | Impacchetta più icone UI in un singolo atlante `_co.paa` 512x512 riferito dagli imageset |
| Fogli sprite icone mercato | Expansion Market | Usa grandi texture PAA atlante con decine di miniature oggetti per l'interfaccia del commerciante |
| Retexture hiddenSelections senza nuovo P3D | DayZ-Samples (Test_ClothingRetexture) | Scambia `_co.paa` tramite `hiddenSelectionsTextures[]` per creare varianti di colore da un modello |
| ARGB4444 per piccoli elementi HUD | VPP Admin Tools | Usa file PAA 64x64 compressi ARGB4444 per icone della barra strumenti e dei pannelli per minimizzare la dimensione file |

---

## Compatibilità e Impatto

- **Multi-Mod:** Le collisioni di percorsi texture sono rare perché ogni mod usa il proprio prefisso PBO, ma due mod che ritexturizzano lo stesso oggetto vanilla tramite `hiddenSelectionsTextures[]` entreranno in conflitto -- l'ultimo caricato vince.
- **Prestazioni:** Una singola texture 4096x4096 DXT5 usa ~21 MB di memoria GPU con le mipmap. L'uso eccessivo di texture grandi su molti oggetti moddati può esaurire la VRAM su hardware di fascia bassa. Preferisci 1024 o 2048 per la maggior parte degli oggetti.
- **Versione:** Il formato PAA e la pipeline TexView2 sono stabili da DayZ 1.0. Non si sono verificati cambiamenti incompatibili tra le versioni di DayZ.

---

## Navigazione

| Precedente | Su | Successivo |
|----------|----|------|
| [Parte 3: Sistema GUI](../03-gui-system/07-styles-fonts.md) | [Parte 4: Formati File e DayZ Tools](../04-file-formats/01-textures.md) | [4.2 Modelli 3D](02-models.md) |
