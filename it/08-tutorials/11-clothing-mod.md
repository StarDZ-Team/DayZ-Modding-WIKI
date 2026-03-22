# Capitolo 8.11: Creare Abbigliamento Personalizzato

[Home](../README.md) | [<< Precedente: Creare un Veicolo Personalizzato](10-vehicle-mod.md) | **Creare Abbigliamento Personalizzato** | [Successivo: Costruire un Sistema di Scambio >>](12-trading-system.md)

---

> **Riepilogo:** Questo tutorial ti guida nella creazione di una giacca tattica personalizzata per DayZ. Sceglierai una classe base, definirai l'abbigliamento in config.cpp con proprietà di isolamento e cargo, lo ritexturerai con un pattern mimetico usando le hidden selections, aggiungerai localizzazione e spawning, e opzionalmente lo estenderai con comportamento scriptato. Alla fine, avrai una giacca indossabile che tiene caldi i giocatori, contiene oggetti e appare nel mondo.

---

## Indice

- [Cosa Costruiremo](#cosa-costruiremo)
- [Passo 1: Scegliere una Classe Base](#passo-1-scegliere-una-classe-base)
- [Passo 2: config.cpp per l'Abbigliamento](#passo-2-configcpp-per-labbigliamento)
- [Passo 3: Creare le Texture](#passo-3-creare-le-texture)
- [Passo 4: Aggiungere Spazio Cargo](#passo-4-aggiungere-spazio-cargo)
- [Passo 5: Localizzazione e Spawning](#passo-5-localizzazione-e-spawning)
- [Passo 6: Comportamento Script (Opzionale)](#passo-6-comportamento-script-opzionale)
- [Passo 7: Build, Test, Rifinitura](#passo-7-build-test-rifinitura)
- [Riferimento Completo del Codice](#riferimento-completo-del-codice)
- [Errori Comuni](#errori-comuni)
- [Buone Pratiche](#buone-pratiche)
- [Teoria vs Pratica](#teoria-vs-pratica)
- [Cosa Hai Imparato](#cosa-hai-imparato)

---

## Cosa Costruiremo

Creeremo una **Giacca Tattica Mimetica** -- una giacca in stile militare con mimetizzazione woodland che i giocatori possono trovare e indossare. Essa:

- Estende il modello vanilla della giacca Gorka (nessuna modellazione 3D richiesta)
- Ha una ritexturizzazione mimetica personalizzata usando le hidden selections
- Fornisce calore attraverso i valori di `heatIsolation`
- Trasporta oggetti nelle tasche (spazio cargo)
- Subisce danni con degradazione visiva attraverso gli stati di salute
- Appare nelle posizioni militari del mondo

**Prerequisiti:** Una struttura mod funzionante (completa prima il [Capitolo 8.1](01-first-mod.md) e il [Capitolo 8.2](02-custom-item.md)), un editor di testo, DayZ Tools installato (per TexView2), e un editor di immagini per creare texture mimetiche.

---

## Passo 1: Scegliere una Classe Base

L'abbigliamento in DayZ eredita da `Clothing_Base`, ma quasi mai si estende direttamente. DayZ fornisce classi base intermedie per ogni slot corporeo:

| Classe Base | Slot Corporeo | Esempi |
|------------|-----------|----------|
| `Top_Base` | Corpo (torso) | Giacche, camicie, felpe |
| `Pants_Base` | Gambe | Jeans, pantaloni cargo |
| `Shoes_Base` | Piedi | Stivali, scarpe da ginnastica |
| `HeadGear_Base` | Testa | Elmetti, cappelli |
| `Mask_Base` | Viso | Maschere antigas, passamontagna |
| `Gloves_Base` | Mani | Guanti tattici |
| `Vest_Base` | Slot giubbotto | Plate carrier, chest rig |
| `Glasses_Base` | Occhiali | Occhiali da sole |
| `Backpack_Base` | Schiena | Zaini, borse |

La catena completa di ereditarietà è: `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> YourJacket`

### Perché Estendere un Oggetto Vanilla Esistente

Puoi estendere a diversi livelli:

1. **Estendi un oggetto specifico** (come `GorkaEJacket_ColorBase`) -- il più facile. Erediti il modello, le animazioni, lo slot e tutte le proprietà. Cambi solo le texture e regoli i valori. Questo è ciò che fa il sample `Test_ClothingRetexture` di Bohemia.
2. **Estendi una base di slot** (come `Top_Base`) -- punto di partenza pulito, ma devi specificare un modello e tutte le proprietà.
3. **Estendi `Clothing` direttamente** -- solo per comportamenti di slot completamente personalizzati. Raramente necessario.

Per la nostra giacca tattica, estenderemo `GorkaEJacket_ColorBase`. Guardando lo script vanilla:

```c
class GorkaEJacket_ColorBase extends Top_Base
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
class GorkaEJacket_Summer extends GorkaEJacket_ColorBase {};
class GorkaEJacket_Flat extends GorkaEJacket_ColorBase {};
```

Nota il pattern: una classe `_ColorBase` gestisce il comportamento condiviso, e le singole varianti di colore la estendono senza codice aggiuntivo. Le loro voci in config.cpp forniscono texture diverse. Seguiremo lo stesso pattern.

Per trovare le classi base, cerca in `scripts/4_world/entities/itembase/clothing_base.c` (definisce tutte le basi degli slot) e `scripts/4_world/entities/itembase/clothing/` (un file per famiglia di abbigliamento).

---

## Passo 2: config.cpp per l'Abbigliamento

Crea `MyClothingMod/Data/config.cpp`:

```cpp
class CfgPatches
{
    class MyClothingMod_Data
    {
        units[] = { "MCM_TacticalJacket_Woodland" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgVehicles
{
    class GorkaEJacket_ColorBase;

    class MCM_TacticalJacket_ColorBase : GorkaEJacket_ColorBase
    {
        scope = 0;
        displayName = "";
        descriptionShort = "";

        weight = 1800;
        itemSize[] = { 3, 4 };
        absorbency = 0.3;
        heatIsolation = 0.8;
        visibilityModifier = 0.7;

        repairableWithKits[] = { 5, 2 };
        repairCosts[] = { 30.0, 25.0 };

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 200;
                    healthLevels[] =
                    {
                        { 1.0,  { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.70, { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.50, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.30, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.01, { "DZ\characters\tops\Data\GorkaUpper_destruct.rvmat" } }
                    };
                };
            };
            class GlobalArmor
            {
                class Melee
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
                class Infected
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
            };
        };

        class EnvironmentWetnessIncrements
        {
            class Soaking
            {
                rain = 0.015;
                water = 0.1;
            };
            class Drying
            {
                playerHeat = -0.08;
                fireBarrel = -0.25;
                wringing = -0.15;
            };
        };
    };

    class MCM_TacticalJacket_Woodland : MCM_TacticalJacket_ColorBase
    {
        scope = 2;
        displayName = "$STR_MCM_TacticalJacket_Woodland";
        descriptionShort = "$STR_MCM_TacticalJacket_Woodland_Desc";
        hiddenSelectionsTextures[] =
        {
            "MyClothingMod\Data\Textures\tactical_jacket_g_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa"
        };
    };
};
```

### Campi Specifici dell'Abbigliamento Spiegati

**Termici e furtività:**

| Campo | Valore | Spiegazione |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | Calore fornito (intervallo 0.0-1.0). Il motore moltiplica questo per fattori di salute e umidità. Una giacca integra e asciutta fornisce il massimo calore; una rovinata e bagnata quasi niente. |
| `visibilityModifier` | `0.7` | Visibilità del giocatore per l'IA (più basso = più difficile da rilevare). |
| `absorbency` | `0.3` | Assorbimento d'acqua (0 = impermeabile, 1 = spugna). Più basso è meglio per la resistenza alla pioggia. |

**Riferimento vanilla heatIsolation:** T-shirt 0.2, Felpa 0.5, Giacca Gorka 0.7, Giacca da Campo 0.8, Cappotto di Lana 0.9.

**Riparazione:** `repairableWithKits[] = { 5, 2 }` elenca i tipi di kit (5=Kit da Cucito, 2=Kit da Cucito in Pelle). `repairCosts[]` indica il materiale consumato per riparazione, nello stesso ordine.

**Armatura:** Un valore `damage` di 0.8 significa che il giocatore riceve l'80% del danno in arrivo (20% assorbito). Valori più bassi = più protezione.

**Umidità:** `Soaking` controlla quanto velocemente la pioggia/acqua bagna l'oggetto. I valori negativi di `Drying` rappresentano la perdita di umidità dal calore corporeo, dai fuochi e dallo strizzamento.

**Hidden selections:** Il modello Gorka ha 3 selezioni -- l'indice 0 è il modello a terra, gli indici 1 e 2 sono il modello indossato. Sovrascrivi `hiddenSelectionsTextures[]` con i tuoi percorsi PAA personalizzati.

**Livelli di salute:** Ogni voce è `{ sogliaVita, { percorsoMateriale } }`. Quando la salute scende sotto una soglia, il motore sostituisce il materiale. Gli rvmat di danno vanilla aggiungono segni di usura e strappi.

---

## Passo 3: Creare le Texture

### Trovare e Creare Texture

Le texture della giacca Gorka si trovano in `DZ\characters\tops\data\` -- estrai `gorka_upper_summer_co.paa` (colore), `gorka_upper_nohq.paa` (normal) e `gorka_upper_smdi.paa` (specular) dal drive P: da usare come template.

**Creare il pattern mimetico:**

1. Apri la texture vanilla `_co` in TexView2, esporta come TGA/PNG
2. Dipingi il tuo mimetico woodland nel tuo editor di immagini, seguendo il layout UV
3. Mantieni le stesse dimensioni (tipicamente 2048x2048 o 1024x1024)
4. Salva come TGA, converti in PAA usando TexView2 (File > Save As > .paa)

### Tipi di Texture

| Suffisso | Scopo | Richiesto? |
|--------|---------|-----------|
| `_co` | Colore/pattern principale | Sì |
| `_nohq` | Normal map (dettaglio tessuto) | No -- usa il default vanilla |
| `_smdi` | Specular (lucentezza) | No -- usa il default vanilla |
| `_as` | Maschera alpha/superficie | No |

Per una ritexturizzazione, ti servono solo le texture `_co`. Le mappe normal e specular del modello vanilla continuano a funzionare.

Per il controllo completo dei materiali, crea file `.rvmat` e riferiscili in `hiddenSelectionsMaterials[]`. Vedi il sample `Test_ClothingRetexture` di Bohemia per esempi funzionanti di rvmat con varianti di danno e distruzione.

---

## Passo 4: Aggiungere Spazio Cargo

Quando estendi `GorkaEJacket_ColorBase`, erediti la sua griglia cargo (4x3) e lo slot inventario (`"Body"`) automaticamente. La proprietà `itemSize[] = { 3, 4 }` definisce quanto è grande la giacca quando conservata come bottino -- NON la sua capacità cargo.

Slot comuni per l'abbigliamento: `"Body"` (giacche), `"Legs"` (pantaloni), `"Feet"` (stivali), `"Headgear"` (cappelli), `"Vest"` (chest rig), `"Gloves"`, `"Mask"`, `"Back"` (zaini).

Alcuni capi accettano allegati (come le tasche del Plate Carrier). Aggiungili con `attachments[] = { "Shoulder", "Armband" };`. Per una giacca base, il cargo ereditato è sufficiente.

---

## Passo 5: Localizzazione e Spawning

### Stringtable

Crea `MyClothingMod/Data/Stringtable.csv`:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Spawning (types.xml)

Aggiungi al `types.xml` della cartella missione del tuo server:

```xml
<type name="MCM_TacticalJacket_Woodland">
    <nominal>8</nominal>
    <lifetime>14400</lifetime>
    <restock>3600</restock>
    <min>3</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="clothes" />
    <usage name="Military" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

Usa `category name="clothes"` per tutto l'abbigliamento. Imposta `usage` per corrispondere a dove l'oggetto dovrebbe apparire (Military, Town, Police, ecc.) e `value` per il tier della mappa (Tier1=costa fino a Tier4=entroterra profondo).

---

## Passo 6: Comportamento Script (Opzionale)

Per una semplice ritexturizzazione, non servono script. Ma per aggiungere comportamento quando la giacca viene indossata, crea una classe script.

### Scripts config.cpp

```cpp
class CfgPatches
{
    class MyClothingMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgMods
{
    class MyClothingMod
    {
        dir = "MyClothingMod";
        name = "My Clothing Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "World" };
        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyClothingMod/Scripts/4_World" };
            };
        };
    };
};
```

### Script della Giacca Personalizzata

Crea `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c`:

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player equipped Tactical Jacket");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player removed Tactical Jacket");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### Eventi Chiave dell'Abbigliamento

| Evento | Quando Si Attiva | Uso Comune |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | Il giocatore equipaggia l'oggetto | Applicare buff, mostrare effetti |
| `OnWasDetached(parent, slot_id)` | Il giocatore rimuove l'oggetto | Rimuovere buff, pulizia |
| `EEItemAttached(item, slot_name)` | Oggetto allegato a questo capo | Mostrare/nascondere selezioni del modello |
| `EEItemDetached(item, slot_name)` | Oggetto rimosso da questo capo | Invertire cambiamenti visivi |
| `EEHealthLevelChanged(old, new, zone)` | La salute supera una soglia | Aggiornare stato visivo |

**Importante:** Chiama sempre `super` all'inizio di ogni override. La classe genitore gestisce comportamenti critici del motore.

---

## Passo 7: Build, Test, Rifinitura

### Build e Spawn

Impacchetta `Data/` e `Scripts/` come PBO separati. Avvia DayZ con la tua mod e genera la giacca:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Checklist di Verifica

1. **Appare nell'inventario?** Se no, controlla `scope=2` e che il nome della classe corrisponda.
2. **Texture corretta?** Texture Gorka di default = percorsi sbagliati. Bianco/rosa = file texture mancante.
3. **Puoi equipaggiarla?** Dovrebbe andare nello slot Body. Se no, controlla la catena della classe genitore.
4. **Il nome viene visualizzato?** Se vedi il testo `$STR_` grezzo, la stringtable non si sta caricando.
5. **Fornisce calore?** Controlla `heatIsolation` nel menu debug/inspect.
6. **Il danno degrada la grafica?** Testa con: `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Aggiungere Varianti di Colore

Segui il pattern `_ColorBase` -- aggiungi classi sorelle che differiscono solo nelle texture:

```cpp
class MCM_TacticalJacket_Desert : MCM_TacticalJacket_ColorBase
{
    scope = 2;
    displayName = "$STR_MCM_TacticalJacket_Desert";
    descriptionShort = "$STR_MCM_TacticalJacket_Desert_Desc";
    hiddenSelectionsTextures[] =
    {
        "MyClothingMod\Data\Textures\tactical_jacket_g_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa"
    };
};
```

Ogni variante necessita del proprio `scope=2`, nome visualizzato, texture, voci nella stringtable e voce nel types.xml.

---

## Riferimento Completo del Codice

### Struttura delle Directory

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Definizioni oggetti (vedi Passo 2)
        Stringtable.csv         <-- Nomi visualizzati (vedi Passo 5)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Necessario solo per comportamento script
        config.cpp              <-- Voce CfgMods (vedi Passo 6)
        4_World/
            MyClothingMod/
                MCM_TacticalJacket.c
```

### mod.cpp

```cpp
name = "My Clothing Mod";
author = "YourName";
version = "1.0";
overview = "Adds a tactical jacket with camo variants to DayZ.";
```

Tutti gli altri file sono mostrati integralmente nei rispettivi passi sopra.

---

## Errori Comuni

| Errore | Conseguenza | Soluzione |
|---------|-------------|-----|
| Dimenticare `scope=2` sulle varianti | L'oggetto non appare o non si trova negli strumenti admin | Imposta `scope=0` sulla base, `scope=2` su ogni variante generabile |
| Conteggio errato dell'array texture | Texture bianche/rosa su alcune parti | Fai corrispondere il conteggio di `hiddenSelectionsTextures` alle hidden selections del modello (Gorka ne ha 3) |
| Slash in avanti nei percorsi texture | Le texture non si caricano silenziosamente | Usa i backslash: `"MyMod\Data\tex.paa"` |
| `requiredAddons` mancanti | Il parser del config non riesce a risolvere la classe genitore | Includi `"DZ_Characters_Tops"` per i capi superiori |
| `heatIsolation` sopra 1.0 | Il giocatore si surriscalda con tempo caldo | Mantieni i valori nell'intervallo 0.0-1.0 |
| Materiali `healthLevels` vuoti | Nessuna degradazione visiva del danno | Riferisci sempre almeno gli rvmat vanilla |
| Saltare `super` negli override | Comportamento inventario, danno o allegati rotto | Chiama sempre `super.NomeMetodo()` per primo |

---

## Buone Pratiche

- **Inizia con una semplice ritexturizzazione.** Fai funzionare una mod con uno scambio di texture prima di aggiungere proprietà o script personalizzati. Questo isola i problemi di config da quelli di texture.
- **Usa il pattern _ColorBase.** Proprietà condivise nella base `scope=0`, solo texture e nomi nelle varianti `scope=2`. Nessuna duplicazione.
- **Mantieni i valori di isolamento realistici.** Fai riferimento agli oggetti vanilla con equivalenti reali simili.
- **Testa con la console script prima del types.xml.** Conferma che l'oggetto funziona prima di debuggare le tabelle di spawn.
- **Usa i riferimenti `$STR_` per tutto il testo visibile al giocatore.** Abilita la futura localizzazione senza modifiche al config.
- **Impacchetta Data e Scripts come PBO separati.** Aggiorna le texture senza ricostruire gli script.
- **Fornisci texture a terra.** La texture `_g_` fa apparire correttamente gli oggetti lasciati a terra.

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|---------|--------|---------|
| `heatIsolation` | Un semplice numero di calore | Il calore effettivo dipende dalla salute e dall'umidità. Il motore lo moltiplica per fattori in `MiscGameplayFunctions.GetCurrentItemHeatIsolation()`. |
| Valori `damage` dell'armatura | Più basso = più protezione | Un valore di 0.8 significa che il giocatore riceve l'80% del danno (solo il 20% assorbito). Molti modder leggono 0.9 come "90% di protezione" quando in realtà è il 10%. |
| Ereditarietà di `scope` | I figli ereditano lo scope del genitore | NON lo fanno. Ogni classe deve impostare esplicitamente `scope`. Lo `scope=0` del genitore imposta di default tutti i figli a `scope=0`. |
| `absorbency` | Controlla la protezione dalla pioggia | Controlla l'assorbimento dell'umidità, che RIDUCE il calore. Impermeabile = absorbency BASSA (0.1). Absorbency alta (0.8+) = assorbe come una spugna. |
| Hidden selections | Funzionano su qualsiasi modello | Non tutti i modelli espongono le stesse selezioni. Verifica con Object Builder o il config vanilla prima di scegliere un modello base. |

---

## Cosa Hai Imparato

In questo tutorial hai imparato:

- Come l'abbigliamento DayZ eredita da classi base specifiche per slot (`Top_Base`, `Pants_Base`, ecc.)
- Come definire un capo di abbigliamento in config.cpp con proprietà termiche, armatura e umidità
- Come le hidden selections permettono di ritexturizzare modelli vanilla con pattern mimetici personalizzati
- Come `heatIsolation`, `visibilityModifier` e `absorbency` influenzano il gameplay
- Come il `DamageSystem` controlla la degradazione visiva e la protezione dell'armatura
- Come creare varianti di colore usando il pattern `_ColorBase`
- Come aggiungere voci di spawn con `types.xml` e nomi visualizzati con `Stringtable.csv`
- Come aggiungere opzionalmente comportamento script con gli eventi `OnWasAttached` e `OnWasDetached`

**Successivo:** Applica le stesse tecniche per creare pantaloni (`Pants_Base`), stivali (`Shoes_Base`), o un giubbotto (`Vest_Base`). La struttura del config è identica -- cambiano solo la classe genitore e lo slot inventario.

---

**Precedente:** [Capitolo 8.8: Overlay HUD](08-hud-overlay.md)
**Successivo:** In arrivo
