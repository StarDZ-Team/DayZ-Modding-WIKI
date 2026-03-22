# Capitolo 5.4: Formato ImageSet

[Home](../README.md) | [<< Precedente: Credits.json](03-credits-json.md) | **Formato ImageSet** | [Successivo: File di Configurazione del Server >>](05-server-configs.md)

---

> **Riepilogo:** Gli ImageSet definiscono regioni di sprite nominate all'interno di un atlas di texture. Sono il meccanismo principale di DayZ per referenziare icone, grafica UI e sprite sheet dai file di layout e dagli script. Invece di caricare centinaia di file immagine individuali, si impacchettano tutte le icone in una singola texture e si descrive la posizione e la dimensione di ogni icona in un file di definizione imageset.

---

## Indice dei Contenuti

- [Panoramica](#panoramica)
- [Come Funzionano gli ImageSet](#come-funzionano-gli-imageset)
- [Formato Nativo ImageSet di DayZ](#formato-nativo-imageset-di-dayz)
- [Formato XML ImageSet](#formato-xml-imageset)
- [Registrazione degli ImageSet in config.cpp](#registrazione-degli-imageset-in-configcpp)
- [Referenziare le Immagini nei Layout](#referenziare-le-immagini-nei-layout)
- [Referenziare le Immagini negli Script](#referenziare-le-immagini-negli-script)
- [Flag delle Immagini](#flag-delle-immagini)
- [Texture Multi-Risoluzione](#texture-multi-risoluzione)
- [Creare Set di Icone Personalizzati](#creare-set-di-icone-personalizzati)
- [Pattern di Integrazione Font Awesome](#pattern-di-integrazione-font-awesome)
- [Esempi Reali](#esempi-reali)
- [Errori Comuni](#errori-comuni)

---

## Panoramica

Un atlas di texture è una singola immagine grande (tipicamente in formato `.edds`) che contiene molte icone più piccole disposte in una griglia o in un layout libero. Un file imageset mappa nomi leggibili a regioni rettangolari all'interno di quell'atlas.

Per esempio, una texture 1024x1024 potrebbe contenere 64 icone a 64x64 pixel ciascuna. Il file imageset dice "l'icona chiamata `arrow_down` si trova alla posizione (128, 64) ed è 64x64 pixel." I tuoi file di layout e script referenziano `arrow_down` per nome, e il motore estrae il sotto-rettangolo corretto dall'atlas al momento del rendering.

Questo approccio è efficiente: un singolo caricamento texture GPU serve tutte le icone, riducendo le draw call e il consumo di memoria.

---

## Come Funzionano gli ImageSet

Il flusso dei dati:

1. **Atlas di texture** (file `.edds`) --- una singola immagine contenente tutte le icone
2. **Definizione ImageSet** (file `.imageset`) --- mappa i nomi alle regioni nell'atlas
3. **Registrazione nel config.cpp** --- dice al motore di caricare l'imageset all'avvio
4. **Riferimento nel layout/script** --- usa la sintassi `set:nome image:nomeIcona` per renderizzare un'icona specifica

Una volta registrato, qualsiasi widget in qualsiasi file di layout può referenziare qualsiasi immagine del set per nome.

---

## Formato Nativo ImageSet di DayZ

Il formato nativo utilizza la sintassi basata su classi del motore Enfusion (simile a config.cpp). Questo è il formato usato dal gioco vanilla e dalla maggior parte dei mod affermati.

### Struttura

```
ImageSetClass {
 Name "my_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_name {
   Name "icon_name"
   Pos 0 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Campi di Livello Superiore

| Campo | Descrizione |
|-------|-------------|
| `Name` | Il nome del set. Usato nella parte `set:` dei riferimenti alle immagini. Deve essere unico tra tutti i mod caricati. |
| `RefSize` | Dimensioni di riferimento della texture (larghezza altezza). Usate per la mappatura delle coordinate. |
| `Textures` | Contiene una o più voci `ImageSetTextureClass` per diversi livelli di risoluzione mip. |

### Campi Voce Texture

| Campo | Descrizione |
|-------|-------------|
| `mpix` | Livello minimo di pixel (livello mip). `0` = risoluzione più bassa, `1` = risoluzione standard. |
| `path` | Percorso al file texture `.edds`, relativo alla root del mod. Può usare il formato GUID di Enfusion (`{GUID}percorso`) o percorsi relativi semplici. |

### Campi Voce Immagine

Ogni immagine è un `ImageSetDefClass` all'interno del blocco `Images`:

| Campo | Descrizione |
|-------|-------------|
| Nome della classe | Deve corrispondere al campo `Name` (usato per le ricerche del motore) |
| `Name` | L'identificatore dell'immagine. Usato nella parte `image:` dei riferimenti. |
| `Pos` | Posizione dell'angolo superiore sinistro nell'atlas (x y), in pixel |
| `Size` | Dimensioni (larghezza altezza), in pixel |
| `Flags` | Flag di comportamento del tiling (vedi [Flag delle Immagini](#flag-delle-immagini)) |

### Esempio Completo (DayZ Vanilla)

```
ImageSetClass {
 Name "dayz_gui"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "{534691EE0479871C}Gui/imagesets/dayz_gui.edds"
  }
  ImageSetTextureClass {
   mpix 1
   path "{C139E49FD0ECAF9E}Gui/imagesets/dayz_gui@2x.edds"
  }
 }
 Images {
  ImageSetDefClass Gradient {
   Name "Gradient"
   Pos 0 317
   Size 75 5
   Flags ISVerticalTile
  }
  ImageSetDefClass Expand {
   Name "Expand"
   Pos 121 257
   Size 20 20
   Flags 0
  }
 }
}
```

---

## Formato XML ImageSet

Esiste un formato alternativo basato su XML, usato da alcuni mod. È più semplice ma offre meno funzionalità (nessun supporto multi-risoluzione).

### Struttura

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### Attributi XML

**Elemento `<imageset>`:**

| Attributo | Descrizione |
|-----------|-------------|
| `name` | Il nome del set (equivalente al `Name` nativo) |
| `file` | Percorso al file texture (equivalente al `path` nativo) |

**Elemento `<image>`:**

| Attributo | Descrizione |
|-----------|-------------|
| `name` | Identificatore dell'immagine |
| `pos` | Posizione superiore sinistra come `"x y"` |
| `size` | Dimensioni come `"larghezza altezza"` |

### Quando Usare Quale Formato

| Funzionalità | Formato Nativo | Formato XML |
|--------------|----------------|-------------|
| Multi-risoluzione (livelli mip) | Sì | No |
| Flag di tiling | Sì | No |
| Percorsi GUID Enfusion | Sì | Sì |
| Semplicità | Minore | Maggiore |
| Usato dal DayZ vanilla | Sì | No |
| Usato da Expansion, MyMod, VPP | Sì | Occasionalmente |

**Raccomandazione:** Usa il formato nativo per i mod di produzione. Usa il formato XML per la prototipazione rapida o set di icone semplici che non necessitano di tiling o supporto multi-risoluzione.

---

## Registrazione degli ImageSet in config.cpp

I file ImageSet devono essere registrati nel `config.cpp` del tuo mod sotto il blocco `CfgMods` > `class defs` > `class imageSets`. Senza questa registrazione, il motore non carica mai l'imageset e i tuoi riferimenti alle immagini falliscono silenziosamente.

### Sintassi

```cpp
class CfgMods
{
    class MyMod
    {
        // ... altri campi ...
        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyMod/GUI/imagesets/my_icons.imageset",
                    "MyMod/GUI/imagesets/my_other_icons.imageset"
                };
            };
        };
    };
};
```

### Esempio Reale: MyMod Core

MyMod Core registra sette imageset inclusi i set di icone Font Awesome:

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
};
```

### Esempio Reale: VPP Admin Tools

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "VPPAdminTools/GUI/Textures/dayz_gui_vpp.imageset"
        };
    };
};
```

### Esempio Reale: DayZ Editor

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "DayZEditor/gui/imagesets/dayz_editor_gui.imageset"
        };
    };
};
```

---

## Referenziare le Immagini nei Layout

Nei file `.layout`, usa la proprietà `image0` con la sintassi `set:nome image:nomeImmagine`:

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### Analisi della Sintassi

```
set:NOMESET image:NOMEIMMAGINE
```

- `NOMESET` --- il campo `Name` dalla definizione dell'imageset (es. `dayz_gui`, `solid`, `brands`)
- `NOMEIMMAGINE` --- il campo `Name` da una voce specifica `ImageSetDefClass` (es. `icon_refresh`, `arrow_down`)

### Stati Multipli dell'Immagine

Alcuni widget supportano stati multipli dell'immagine (normale, hover, premuto):

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### Esempi da Mod Reali

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod: icona Font Awesome regular
image0 "set:dayz_gui image:icon_minus"                -- MyMod: icona DayZ vanilla
image0 "set:dayz_gui image:icon_collapse"             -- MyMod: icona DayZ vanilla
image0 "set:dayz_gui image:circle"                    -- MyMod: forma DayZ vanilla
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor: icona personalizzata
```

---

## Referenziare le Immagini negli Script

In Enforce Script, usa `ImageWidget.LoadImageFile()` o imposta le proprietà dell'immagine sui widget:

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

Il parametro `0` è l'indice dell'immagine (corrispondente a `image0` nei layout).

### Stati Multipli tramite Indice

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // Stato normale
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // Stato attivato
```

Cambia tra gli stati usando `SetImage(indice)`:

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### Uso di Variabili Stringa

```c
// Da DayZ Editor
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// Successivamente, cambia dinamicamente
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## Flag delle Immagini

Il campo `Flags` nelle voci dell'imageset in formato nativo controlla il comportamento del tiling quando l'immagine viene allungata oltre la sua dimensione naturale.

| Flag | Valore | Descrizione |
|------|--------|-------------|
| `0` | 0 | Nessun tiling. L'immagine si allunga per riempire il widget. |
| `ISHorizontalTile` | 1 | Ripete orizzontalmente quando il widget è più largo dell'immagine. |
| `ISVerticalTile` | 2 | Ripete verticalmente quando il widget è più alto dell'immagine. |
| Entrambi | 3 | Ripete in entrambe le direzioni (`ISHorizontalTile` + `ISVerticalTile`). |

### Utilizzo

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

Questa immagine `Gradient` è 75x5 pixel. Quando usata in un widget più alto di 5 pixel, si ripete verticalmente per riempire l'altezza, creando una striscia di gradiente ripetuta.

La maggior parte delle icone usa `Flags 0` (nessun tiling). Le flag di tiling sono principalmente per elementi UI come bordi, divisori e pattern ripetuti.

---

## Texture Multi-Risoluzione

Il formato nativo supporta texture a risoluzioni multiple per lo stesso imageset. Questo permette al motore di usare grafica a risoluzione più alta su display ad alto DPI.

```
Textures {
 ImageSetTextureClass {
  mpix 0
  path "Gui/imagesets/dayz_gui.edds"
 }
 ImageSetTextureClass {
  mpix 1
  path "Gui/imagesets/dayz_gui@2x.edds"
 }
}
```

- `mpix 0` --- bassa risoluzione (usata con impostazioni di bassa qualità o elementi UI distanti)
- `mpix 1` --- risoluzione standard/alta (predefinita)

La convenzione di denominazione `@2x` è presa dal sistema Retina Display di Apple ma non è obbligatoria --- puoi nominare il file come preferisci.

### In Pratica

La maggior parte dei mod include solo `mpix 1` (una singola risoluzione). Il supporto multi-risoluzione è usato principalmente dal gioco vanilla:

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## Creare Set di Icone Personalizzati

### Flusso di Lavoro Passo per Passo

**1. Creare l'Atlas di Texture**

Usa un editor di immagini (Photoshop, GIMP, ecc.) per disporre le tue icone su un singolo canvas:
- Scegli una dimensione potenza di due (256x256, 512x512, 1024x1024, ecc.)
- Disponi le icone in una griglia per un facile calcolo delle coordinate
- Lascia un po' di padding tra le icone per prevenire il bleeding della texture
- Salva come `.tga` o `.png`

**2. Convertire in EDDS**

DayZ usa il formato `.edds` (Enfusion DDS) per le texture. Usa il DayZ Workbench o gli strumenti di Mikero per convertire:
- Importa il tuo `.tga` nel DayZ Workbench
- Oppure usa `Pal2PacE.exe` per convertire `.paa` in `.edds`
- L'output deve essere un file `.edds`

**3. Scrivere la Definizione dell'ImageSet**

Mappa ogni icona a una regione nominata. Se le tue icone sono su una griglia da 64 pixel:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass settings {
   Name "settings"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass player {
   Name "player"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass map_marker {
   Name "map_marker"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

**4. Registrare nel config.cpp**

Aggiungi il percorso dell'imageset al config.cpp del tuo mod:

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. Usare nei Layout e negli Script**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Pattern di Integrazione Font Awesome

MyMod Core (ereditato da DabsFramework) dimostra un pattern potente: convertire i font di icone Font Awesome in imageset di DayZ. Questo dà ai mod accesso a migliaia di icone di qualità professionale senza creare grafica personalizzata.

### Come Funziona

1. Le icone Font Awesome vengono renderizzate in un atlas di texture a una dimensione griglia fissa (64x64 per icona)
2. Ogni stile di icona ottiene il proprio imageset: `solid`, `regular`, `light`, `thin`, `brands`
3. I nomi delle icone nell'imageset corrispondono ai nomi delle icone Font Awesome (es. `circle`, `arrow_down`, `discord`)
4. Gli imageset vengono registrati nel config.cpp e sono disponibili per qualsiasi layout o script

### Set di Icone MyMod Core / DabsFramework

```
MyFramework/GUI/icons/
  solid.imageset       -- Icone piene (atlas 3648x3712, 64x64 per icona)
  regular.imageset     -- Icone con contorno
  light.imageset       -- Icone con contorno leggero
  thin.imageset        -- Icone con contorno ultra-sottile
  brands.imageset      -- Loghi di brand (Discord, GitHub, ecc.)
```

### Utilizzo nei Layout

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### Utilizzo negli Script

```c
// DayZ Editor che usa il set solid
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### Perché Questo Pattern Funziona Bene

- **Libreria di icone enorme**: Migliaia di icone disponibili senza creare alcuna grafica
- **Stile coerente**: Tutte le icone condividono lo stesso peso e stile visivo
- **Pesi multipli**: Scegli solid, regular, light o thin per diversi contesti visivi
- **Icone brand**: Loghi pronti all'uso per Discord, Steam, GitHub, ecc.
- **Nomi standard**: I nomi delle icone seguono le convenzioni di Font Awesome, rendendo facile la scoperta

### La Struttura dell'Atlas

L'imageset solid, per esempio, ha un `RefSize` di 3648x3712 con icone disposte a intervalli di 64 pixel:

```
ImageSetClass {
 Name "solid"
 RefSize 3648 3712
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyFramework/GUI/icons/solid.edds"
  }
 }
 Images {
  ImageSetDefClass circle {
   Name "circle"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass 360_degrees {
   Name "360_degrees"
   Pos 320 0
   Size 64 64
   Flags 0
  }
  ...
 }
}
```

---

## Esempi Reali

### VPP Admin Tools

VPP impacchetta tutte le icone degli strumenti admin in un singolo atlas 1920x1080 con posizionamento libero (non una griglia rigida):

```
ImageSetClass {
 Name "dayz_gui_vpp"
 RefSize 1920 1080
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{534691EE0479871E}VPPAdminTools/GUI/Textures/dayz_gui_vpp.edds"
  }
 }
 Images {
  ImageSetDefClass vpp_icon_cloud {
   Name "vpp_icon_cloud"
   Pos 1206 108
   Size 62 62
   Flags 0
  }
  ImageSetDefClass vpp_icon_players {
   Name "vpp_icon_players"
   Pos 391 112
   Size 62 62
   Flags 0
  }
 }
}
```

Referenziato nei layout come:
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyMod Weapons

Icone di armi e accessori impacchettate in grandi atlas con dimensioni di icone variabili:

```
ImageSetClass {
 Name "SNAFU_Weapons_Icons"
 RefSize 2048 2048
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{7C781F3D4B1173D4}SNAFU_Guns_01/gui/Imagesets/SNAFU_Weapons_Icons.edds"
  }
 }
 Images {
  ImageSetDefClass SNAFUFGRIP {
   Name "SNAFUFGRIP"
   Pos 123 19
   Size 300 300
   Flags 0
  }
  ImageSetDefClass SNAFU_M14Optic {
   Name "SNAFU_M14Optic"
   Pos 426 20
   Size 300 300
   Flags 0
  }
 }
}
```

Questo mostra che le icone non devono avere dimensioni uniformi --- le icone dell'inventario per le armi usano 300x300 mentre le icone UI tipicamente usano 64x64.

### Prefab di MyMod Core

Primitive UI (angoli arrotondati, gradienti alfa) impacchettate in un piccolo atlas 256x256:

```
ImageSetClass {
 Name "prefabs"
 RefSize 256 256
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{82F14D6B9D1AA1CE}MyFramework/GUI/imagesets/prefabs.edds"
  }
 }
 Images {
  ImageSetDefClass Round_Outline_TopLeft {
   Name "Round_Outline_TopLeft"
   Pos 24 21
   Size 8 8
   Flags 0
  }
  ImageSetDefClass "Alpha 10" {
   Name "Alpha 10"
   Pos 0 15
   Size 1 1
   Flags 0
  }
 }
}
```

Nota: i nomi delle immagini possono contenere spazi quando sono tra virgolette (es. `"Alpha 10"`). Tuttavia, referenziare queste nei layout richiede il nome esatto incluso lo spazio.

### MyMod Market Hub (Formato XML)

Un imageset XML più semplice per il modulo market hub:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="DayZMarketHub/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
  <image name="icon_vip" pos="192 0" size="64 64" />
  <image name="icon_weapons" pos="0 64" size="64 64" />
  <image name="icon_success" pos="0 192" size="64 64" />
  <image name="icon_error" pos="64 192" size="64 64" />
</imageset>
```

Referenziato come:
```
image0 "set:mh_icons image:icon_store"
```

---

## Errori Comuni

### Dimenticare la Registrazione nel config.cpp

Il problema più comune. Se il tuo file imageset esiste ma non è elencato in `class imageSets { files[] = { ... }; };` nel config.cpp, il motore non lo carica mai. Tutti i riferimenti alle immagini falliranno silenziosamente (i widget appariranno vuoti).

### Collisioni dei Nomi dei Set

Se due mod registrano imageset con lo stesso `Name`, solo uno viene caricato (l'ultimo vince). Usa un prefisso unico:

```
Name "mymod_icons"     -- Bene
Name "icons"           -- Rischioso, troppo generico
```

### Percorso Texture Errato

Il `path` deve essere relativo alla root del PBO (come il file appare all'interno del PBO impacchettato):

```
path "MyMod/GUI/imagesets/icons.edds"     -- Corretto se MyMod è la root del PBO
path "GUI/imagesets/icons.edds"            -- Errato se la root del PBO è MyMod/
path "C:/Users/dev/icons.edds"            -- Errato: i percorsi assoluti non funzionano
```

### RefSize Non Corrispondente

Il `RefSize` deve corrispondere alle dimensioni pixel effettive della tua texture. Se specifichi `RefSize 512 512` ma la tua texture è 1024x1024, tutte le posizioni delle icone saranno sfasate di un fattore due.

### Coordinate Pos Sfasate di Uno

`Pos` è l'angolo superiore sinistro della regione dell'icona. Se le tue icone sono a intervalli di 64 pixel ma accidentalmente sfasi di 1 pixel, le icone avranno una sottile fetta dell'icona adiacente visibile.

### Uso Diretto di .png o .tga

Il motore richiede il formato `.edds` per gli atlas di texture referenziati dagli imageset. File `.png` o `.tga` grezzi non verranno caricati. Converti sempre in `.edds` usando il DayZ Workbench o gli strumenti di Mikero.

### Spazi nei Nomi delle Immagini

Mentre il motore supporta spazi nei nomi delle immagini (es. `"Alpha 10"`), possono causare problemi in alcuni contesti di parsing. Preferisci gli underscore: `Alpha_10`.

---

## Buone Pratiche

- Usa sempre un nome di set unico con prefisso del mod (es. `"mymod_icons"` invece di `"icons"`). Le collisioni dei nomi dei set tra mod causano la sovrascrittura silenziosa di un set sull'altro.
- Usa dimensioni texture potenza di due (256x256, 512x512, 1024x1024). Le texture non potenza di due funzionano ma possono avere prestazioni di rendering ridotte su alcune GPU.
- Aggiungi 1-2 pixel di padding tra le icone nell'atlas per prevenire il bleeding della texture ai bordi, specialmente quando la texture viene visualizzata a dimensioni non native.
- Preferisci il formato nativo `.imageset` rispetto a XML per i mod di produzione. Supporta texture multi-risoluzione e flag di tiling che il formato XML non ha.
- Verifica che il `RefSize` corrisponda esattamente alle dimensioni effettive della texture. Una discrepanza causa coordinate delle icone errate di un fattore proporzionale.

---

## Teoria vs Pratica

> Cosa dice la documentazione rispetto a come le cose funzionano effettivamente a runtime.

| Concetto | Teoria | Realtà |
|----------|--------|--------|
| La registrazione nel config.cpp è obbligatoria | Gli ImageSet devono essere elencati in `class imageSets` | Corretto, e questa è la fonte più comune di bug "icona vuota". Il motore non dà errore se la registrazione manca -- i widget semplicemente si renderizzano vuoti |
| `RefSize` mappa le coordinate | Le coordinate sono nello spazio di `RefSize` | `RefSize` deve corrispondere alle dimensioni pixel effettive della texture. Se la tua texture è 1024x1024 ma `RefSize` dice 512x512, tutti i valori `Pos` vengono interpretati a scala doppia |
| Il formato XML è più semplice | Meno funzionalità ma funziona allo stesso modo | Gli imageset XML non possono specificare flag di tiling o livelli mip multi-risoluzione. Per le icone va bene, ma per elementi UI ripetuti (bordi, gradienti) serve il formato nativo |
| Voci `mpix` multiple | Il motore seleziona per impostazione di qualità | In pratica, la maggior parte dei mod fornisce solo `mpix 1`. Il motore gestisce il fallback in modo elegante se viene fornito un solo livello mip -- nessun glitch visivo, solo nessuna ottimizzazione high-DPI |
| I nomi delle immagini sono case-sensitive | `"MyIcon"` e `"myicon"` sono diversi | Vero nella definizione dell'imageset, ma `LoadImageFile()` nello script effettua una ricerca case-insensitive su alcune build del motore. Fai sempre corrispondere le maiuscole/minuscole per sicurezza |

---

## Compatibilità e Impatto

- **Multi-Mod:** Le collisioni dei nomi dei set sono il rischio principale. Se due mod definiscono entrambi un imageset chiamato `"icons"`, solo uno viene caricato (l'ultimo PBO vince). Tutti i riferimenti a `set:icons` nel mod perdente si rompono silenziosamente. Usa sempre un prefisso specifico del mod.
- **Prestazioni:** Ogni texture imageset unica è un caricamento texture GPU. Consolidare le icone in meno atlas più grandi riduce le draw call. Un mod con 10 texture separate 64x64 ha prestazioni peggiori di un atlas 512x512 con 10 icone.
- **Versione:** Il formato nativo `.imageset` e la sintassi di riferimento `set:nome image:nome` sono stabili da DayZ 1.0. Il formato XML è disponibile come alternativa dalle prime versioni ma non è documentato ufficialmente da Bohemia.

---

## Osservato nei Mod Reali

| Pattern | Mod | Dettaglio |
|---------|-----|-----------|
| Atlas di icone Font Awesome | DabsFramework / StarDZ Core | Renderizza icone Font Awesome in grandi atlas (3648x3712), fornendo migliaia di icone professionali tramite `set:solid`, `set:regular`, `set:brands` |
| Layout atlas a forma libera | VPP Admin Tools | Icone disposte in modo non uniforme su un atlas 1920x1080 con dimensioni variabili, massimizzando l'uso dello spazio texture |
| Piccoli atlas per funzionalità | Expansion | Ogni sotto-modulo di Expansion ha il proprio piccolo imageset invece di un singolo atlas enorme, mantenendo le dimensioni dei PBO minimali |
| Icone inventario 300x300 | SNAFU Weapons | Dimensioni icone grandi per gli slot inventario di armi/accessori dove il dettaglio conta, a differenza delle icone UI 64x64 |
