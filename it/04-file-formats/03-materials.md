# Capitolo 4.3: Materiali (.rvmat)

[Home](../../README.md) | [<< Precedente: Modelli 3D](02-models.md) | **Materiali** | [Successivo: Audio >>](04-audio.md)

---

## Introduzione

Un materiale in DayZ è il ponte tra un modello 3D e il suo aspetto visivo. Mentre le texture forniscono dati immagine grezzi, il file **RVMAT** (Real Virtuality Material) definisce come quelle texture vengono combinate, quale shader le interpreta e quali proprietà superficiali il motore deve simulare -- lucentezza, trasparenza, auto-illuminazione e altro. Ogni faccia su ogni modello P3D nel gioco riferisce un file RVMAT, e comprendere come crearli e configurarli è essenziale per qualsiasi mod visiva.

Questo capitolo copre il formato file RVMAT, i tipi di shader, la configurazione degli stadi texture, le proprietà dei materiali, il sistema di scambio materiali per livello di danno e esempi pratici tratti dai DayZ-Samples.

---

## Indice dei Contenuti

- [Panoramica del Formato RVMAT](#panoramica-del-formato-rvmat)
- [Struttura del File](#struttura-del-file)
- [Tipi di Shader](#tipi-di-shader)
- [Stadi delle Texture](#stadi-delle-texture)
- [Proprietà dei Materiali](#proprietà-dei-materiali)
- [Livelli di Salute (Scambio Materiali Danno)](#livelli-di-salute-scambio-materiali-danno)
- [Come i Materiali Riferiscono le Texture](#come-i-materiali-riferiscono-le-texture)
- [Creare un RVMAT da Zero](#creare-un-rvmat-da-zero)
- [Esempi Reali](#esempi-reali)
- [Errori Comuni](#errori-comuni)
- [Buone Pratiche](#buone-pratiche)

---

## Panoramica del Formato RVMAT

Un file **RVMAT** è un file di configurazione basato su testo (non binario) che definisce un materiale. Nonostante l'estensione personalizzata, il formato è testo semplice che usa la sintassi stile config di Bohemia con classi e coppie chiave-valore.

### Caratteristiche Principali

- **Formato testo:** Modificabile in qualsiasi editor di testo (Notepad++, VS Code).
- **Binding dello shader:** Ogni RVMAT specifica quale shader di rendering usare.
- **Mappatura texture:** Definisce quali file texture sono assegnati a quali input dello shader (diffuse, normal, specular, ecc.).
- **Proprietà superficiali:** Controlla intensità speculare, luminosità emissiva, trasparenza e altro.
- **Riferito dai modelli P3D:** Le facce nel LOD Resolution di Object Builder hanno un RVMAT assegnato. Il motore carica l'RVMAT e tutte le texture che riferisce.
- **Riferito da config.cpp:** `hiddenSelectionsMaterials[]` può sovrascrivere i materiali a runtime.

### Convenzione dei Percorsi

I file RVMAT vivono accanto alle loro texture, tipicamente in una directory `data/`:

```
MyMod/
  data/
    my_item.rvmat              <-- Definizione del materiale
    my_item_co.paa             <-- Texture diffuse (riferita dall'RVMAT)
    my_item_nohq.paa           <-- Normal map (riferita dall'RVMAT)
    my_item_smdi.paa           <-- Mappa speculare (riferita dall'RVMAT)
```

---

## Struttura del File

Un file RVMAT ha una struttura consistente. Ecco un esempio completo e annotato:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};        // Moltiplicatore colore ambientale (RGBA)
diffuse[] = {1.0, 1.0, 1.0, 1.0};        // Moltiplicatore colore diffuso (RGBA)
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};  // Override additivo diffuso
emmisive[] = {0.0, 0.0, 0.0, 0.0};       // Colore emissivo (auto-illuminazione)
specular[] = {0.7, 0.7, 0.7, 1.0};       // Colore highlight speculare
specularPower = 80;                        // Nitidezza speculare (più alto = highlight più stretto)
PixelShaderID = "Super";                   // Programma shader da usare
VertexShaderID = "Super";                  // Programma vertex shader

class Stage1                               // Stadio texture: Normal map
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2                               // Stadio texture: Mappa Diffuse/Colore
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3                               // Stadio texture: Mappa Speculare/Metallico
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Proprietà di Primo Livello

Sono dichiarate prima delle classi Stage e controllano il comportamento complessivo del materiale:

| Proprietà | Tipo | Descrizione |
|----------|------|-------------|
| `ambient[]` | float[4] | Moltiplicatore colore luce ambientale. `{1,1,1,1}` = pieno, `{0,0,0,0}` = nessun ambientale. |
| `diffuse[]` | float[4] | Moltiplicatore colore luce diffusa. Di solito `{1,1,1,1}`. |
| `forcedDiffuse[]` | float[4] | Override additivo al diffuso. Di solito `{0,0,0,0}`. |
| `emmisive[]` | float[4] | Colore auto-illuminazione. Valori non-zero fanno brillare la superficie. Nota: Bohemia usa l'errore ortografico `emmisive`, non `emissive`. |
| `specular[]` | float[4] | Colore e intensità highlight speculare. |
| `specularPower` | float | Nitidezza degli highlight speculari. Intervallo 1-200. Più alto = riflesso più stretto e focalizzato. |
| `PixelShaderID` | string | Nome del programma pixel shader. |
| `VertexShaderID` | string | Nome del programma vertex shader. |

---

## Tipi di Shader

I valori `PixelShaderID` e `VertexShaderID` determinano quale pipeline di rendering processa il materiale. Entrambi dovrebbero di solito essere impostati allo stesso valore.

### Shader Disponibili

| Shader | Caso d'Uso | Stadi Texture Richiesti |
|--------|----------|------------------------|
| **Super** | Superfici opache standard (armi, abbigliamento, oggetti) | Normal, Diffuse, Speculare/Metallico |
| **Multi** | Terreno multi-strato e superfici complesse | Coppie diffuse/normal multiple |
| **Glass** | Superfici trasparenti e semi-trasparenti | Diffuse con alfa |
| **Water** | Superfici d'acqua con riflesso e rifrazione | Texture acqua speciali |
| **Terrain** | Superfici del terreno | Satellite, maschera, strati di materiale |
| **NormalMap** | Superficie normal-mapped semplificata | Normal, Diffuse |
| **NormalMapSpecular** | Normal-mapped con speculare | Normal, Diffuse, Speculare |
| **Hair** | Rendering capelli personaggio | Diffuse con alfa, traslucenza speciale |
| **Skin** | Pelle del personaggio con scattering sottosuperficiale | Diffuse, Normal, Speculare |
| **AlphaTest** | Trasparenza a bordi netti (fogliame, recinzioni) | Diffuse con alfa |
| **AlphaBlend** | Trasparenza uniforme (vetro, fumo) | Diffuse con alfa |

### Shader Super (Più Comune)

Lo shader **Super** è lo shader standard di rendering basato sulla fisica usato per la grande maggioranza degli oggetti in DayZ. Si aspetta tre stadi texture:

```
Stage1 = Normal map (_nohq)
Stage2 = Mappa Diffuse/Colore (_co)
Stage3 = Mappa Speculare/Metallico (_smdi)
```

Se stai creando un oggetto mod (arma, abbigliamento, strumento, contenitore), userai quasi sempre lo shader Super.

### Shader Glass

Lo shader **Glass** gestisce le superfici trasparenti. Legge l'alfa dalla texture diffuse per determinare la trasparenza:

```cpp
PixelShaderID = "Glass";
VertexShaderID = "Glass";

class Stage1
{
    texture = "MyMod\data\glass_nohq.paa";
    uvSource = "tex";
    class uvTransform { /* ... */ };
};

class Stage2
{
    texture = "MyMod\data\glass_ca.paa";    // Nota: suffisso _ca per colore+alfa
    uvSource = "tex";
    class uvTransform { /* ... */ };
};
```

---

## Stadi delle Texture

Ogni classe `Stage` nell'RVMAT assegna una texture a un input specifico dello shader. Il numero dello stadio determina quale ruolo gioca la texture.

### Assegnazioni Stadi per lo Shader Super

| Stadio | Ruolo Texture | Suffisso Tipico | Descrizione |
|-------|-------------|----------------|-------------|
| **Stage1** | Normal map | `_nohq` | Dettaglio della superficie, dossi, scanalature |
| **Stage2** | Mappa Diffuse / Colore | `_co` o `_ca` | Colore base della superficie |
| **Stage3** | Mappa Speculare / Metallico | `_smdi` | Lucentezza, proprietà metalliche, dettaglio |
| **Stage4** | Ombra Ambientale | `_as` | Occlusione ambientale precalcolata (opzionale) |
| **Stage5** | Mappa Macro | `_mc` | Variazione di colore su larga scala (opzionale) |
| **Stage6** | Mappa Dettaglio | `_de` | Micro-dettaglio a tiling (opzionale) |
| **Stage7** | Mappa Emissiva / Luce | `_li` | Auto-illuminazione (opzionale) |

---

## Proprietà dei Materiali

### Controllo Speculare

I valori `specular[]` e `specularPower` lavorano insieme per definire quanto appare lucida una superficie:

| Tipo Materiale | specular[] | specularPower | Aspetto |
|---------------|-----------|---------------|------------|
| **Plastica opaca** | `{0.1, 0.1, 0.1, 1.0}` | 10 | Opaco, highlight ampio |
| **Metallo consumato** | `{0.3, 0.3, 0.3, 1.0}` | 40 | Lucentezza moderata |
| **Metallo lucidato** | `{0.8, 0.8, 0.8, 1.0}` | 120 | Highlight luminoso e stretto |
| **Cromato** | `{1.0, 1.0, 1.0, 1.0}` | 200 | Riflesso simile a specchio |
| **Gomma** | `{0.02, 0.02, 0.02, 1.0}` | 5 | Quasi nessun highlight |
| **Superficie bagnata** | `{0.6, 0.6, 0.6, 1.0}` | 80 | Scivoloso, highlight medio-nitido |

### Emissivo (Auto-Illuminazione)

Per far brillare una superficie (luci LED, schermi, elementi luminosi):

```cpp
emmisive[] = {0.2, 0.8, 0.2, 1.0};   // Luminosità verde
```

Il colore emissivo viene aggiunto al colore finale del pixel indipendentemente dall'illuminazione. Una mappa emissiva `_li` in uno stadio texture successivo può mascherare quali parti della superficie brillano.

---

## Livelli di Salute (Scambio Materiali Danno)

Gli oggetti DayZ si degradano nel tempo. Il motore supporta lo scambio automatico dei materiali a diverse soglie di danno, definite in `config.cpp` usando l'array `healthLevels[]`. Questo crea la progressione visiva da incontaminato a rovinato.

### Struttura healthLevels[]

```cpp
class MyItem: Inventory_Base
{
    // ... altra configurazione ...

    healthLevels[] =
    {
        // {soglia_salute, {"set_materiale"}},

        {1.0, {"MyMod\data\my_item.rvmat"}},           // Incontaminato (100% salute)
        {0.7, {"MyMod\data\my_item_worn.rvmat"}},       // Consumato (70% salute)
        {0.5, {"MyMod\data\my_item_damaged.rvmat"}},     // Danneggiato (50% salute)
        {0.3, {"MyMod\data\my_item_badly_damaged.rvmat"}},// Molto Danneggiato (30% salute)
        {0.0, {"MyMod\data\my_item_ruined.rvmat"}}       // Rovinato (0% salute)
    };
};
```

### Come Funziona

1. Il motore monitora il valore di salute dell'oggetto (0.0 a 1.0).
2. Quando la salute scende sotto una soglia, il motore scambia il materiale con l'RVMAT corrispondente.
3. Ogni RVMAT può riferire texture diverse -- tipicamente varianti dall'aspetto progressivamente più danneggiato.
4. Lo scambio è automatico. Non serve codice script.

> **Suggerimento:** Non devi sempre avere texture uniche per ogni livello di danno. Un'ottimizzazione comune è condividere le normal map e le mappe speculari tra tutti i livelli e cambiare solo la texture diffuse.

### Usare Materiali di Danno Vanilla

DayZ fornisce un set di materiali overlay di danno generici che possono essere usati se non vuoi creare texture di danno personalizzate:

```cpp
healthLevels[] =
{
    {1.0, {"MyMod\data\my_item.rvmat"}},
    {0.7, {"DZ\data\data\default_worn.rvmat"}},
    {0.5, {"DZ\data\data\default_damaged.rvmat"}},
    {0.3, {"DZ\data\data\default_badly_damaged.rvmat"}},
    {0.0, {"DZ\data\data\default_ruined.rvmat"}}
};
```

---

## Creare un RVMAT da Zero

### Passo per Passo: Oggetto Opaco Standard

1. **Crea i tuoi file texture:**
   - `my_item_co.paa` (colore diffuse)
   - `my_item_nohq.paa` (normal map)
   - `my_item_smdi.paa` (speculare/metallico)

2. **Crea il file RVMAT** (testo semplice) -- usa lo stesso formato degli esempi sopra con lo shader Super.

3. **Assegna in Object Builder:**
   - Apri il tuo modello P3D.
   - Seleziona le facce nel LOD Resolution.
   - Click destro --> **Face Properties**.
   - Sfoglia fino al tuo file RVMAT.

4. **Testa nel gioco** tramite file patching o build PBO.

---

## Errori Comuni

### 1. Ordine degli Stadi Sbagliato

**Sintomo:** La texture appare mescolata, la normal map si vede come colore, il colore si vede come rilievi.
**Soluzione:** Assicurati che Stage1 = normal, Stage2 = diffuse, Stage3 = speculare (per lo shader Super).

### 2. Errore Ortografico `emmisive`

**Sintomo:** L'emissivo non funziona.
**Soluzione:** Bohemia usa `emmisive` (doppia m, singola s). Usare l'ortografia inglese corretta `emissive` non funzionerà. Questa è una nota peculiarità storica.

### 3. Disallineamento Percorso Texture

**Sintomo:** Il modello appare con materiale grigio predefinito o magenta.
**Soluzione:** Verifica che i percorsi texture nell'RVMAT corrispondano esattamente alle posizioni dei file relative al drive P:. I percorsi usano backslash. Controlla le maiuscole -- alcuni sistemi sono case-sensitive.

### 4. Assegnazione RVMAT Mancante nel P3D

**Sintomo:** Il modello si renderizza senza materiale (grigio piatto o shader predefinito).
**Soluzione:** Apri il modello in Object Builder, seleziona le facce e assegna l'RVMAT tramite **Face Properties**.

### 5. Uso dello Shader Sbagliato per Oggetti Trasparenti

**Sintomo:** La texture trasparente appare opaca, o l'intera superficie scompare.
**Soluzione:** Usa lo shader `Glass`, `AlphaTest` o `AlphaBlend` invece di `Super` per le superfici trasparenti. Usa texture con suffisso `_ca` con canali alfa appropriati.

---

## Buone Pratiche

1. **Parti da un esempio funzionante.** Copia un RVMAT dai DayZ-Samples o da un oggetto vanilla e modificalo. Partire da zero invita errori di battitura.

2. **Mantieni materiali e texture insieme.** Archivia l'RVMAT nella stessa directory `data/` delle sue texture. Questo rende la relazione ovvia e semplifica la gestione dei percorsi.

3. **Usa lo shader Super a meno che tu non abbia un motivo per non farlo.** Gestisce il 95% dei casi d'uso correttamente.

4. **Crea materiali di danno anche per oggetti semplici.** I giocatori notano quando gli oggetti non si degradano visivamente. Come minimo, usa i materiali di danno vanilla predefiniti per i livelli di salute inferiori.

5. **Testa lo speculare nel gioco, non solo in Object Builder.** L'illuminazione dell'editor e quella nel gioco producono risultati molto diversi. Ciò che appare perfetto in Object Builder potrebbe essere troppo lucido o troppo opaco sotto l'illuminazione dinamica di DayZ.

6. **Documenta le tue impostazioni materiale.** Quando trovi valori speculare/potenza che funzionano bene per un tipo di superficie, registrali. Dovrai riutilizzare queste impostazioni su molti oggetti.

---

## Navigazione

| Precedente | Su | Successivo |
|----------|----|------|
| [4.2 Modelli 3D](02-models.md) | [Parte 4: Formati File e DayZ Tools](01-textures.md) | [4.4 Audio](04-audio.md) |
