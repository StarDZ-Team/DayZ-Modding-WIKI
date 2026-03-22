# Kapitola 3.7: Styly, písma a obrázky

[Domů](../README.md) | [<< Předchozí: Zpracování událostí](06-event-handling.md) | **Styly, písma a obrázky** | [Další: Dialogy a modální okna >>](08-dialogs-modals.md)

---

Tato kapitola pokrývá vizuální stavební bloky UI DayZ: předdefinované styly, používání písem, rozměry textu, obrázkové widgety s odkazy na imagesety a jak vytvořit vlastní imagesety pro váš mod.

---

## Styly

Styly jsou předdefinované vizuální vzhled, které lze aplikovat na widgety pomocí atributu `style` v souborech layoutu. Řídí vykreslování pozadí, okraje a celkový vzhled bez nutnosti ruční konfigurace barev a obrázků.

### Běžné vestavěné styly

| Název stylu | Popis |
|---|---|
| `blank` | Žádný vizuál -- zcela průhledné pozadí |
| `Empty` | Žádné vykreslování pozadí |
| `Default` | Výchozí styl tlačítka/widgetu se standardním vzhledem DayZ |
| `Colorable` | Styl, který lze tónovat pomocí `SetColor()` |
| `rover_sim_colorable` | Styl barevného panelu, běžně používaný pro pozadí |
| `rover_sim_black` | Tmavé pozadí panelu |
| `rover_sim_black_2` | Tmavší varianta panelu |
| `Outline_1px_BlackBackground` | 1-pixelový obrys s plným černým pozadím |
| `OutlineFilled` | Obrys s vyplněným interiérem |
| `DayZDefaultPanelRight` | Výchozí styl pravého panelu DayZ |
| `DayZNormal` | Normální styl textu/widgetu DayZ |
| `MenuDefault` | Standardní styl tlačítka menu |

### Použití stylů v layoutech

```
ButtonWidgetClass MyButton {
 style Default
 text "Click Me"
 size 120 30
 hexactsize 1
 vexactsize 1
}

PanelWidgetClass Background {
 style rover_sim_colorable
 color 0.2 0.3 0.5 0.9
 size 1 1
}
```

### Vzor styl + barva

Styly `Colorable` a `rover_sim_colorable` jsou navrženy k tónování. Nastavte atribut `color` v layoutu nebo zavolejte `SetColor()` v kódu:

```
PanelWidgetClass TitleBar {
 style rover_sim_colorable
 color 0.4196 0.6471 1 0.9412
 size 1 30
 hexactsize 0
 vexactsize 1
}
```

```c
// Změna barvy za běhu
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Styly v profesionálních modech

Dialogy DabsFrameworku používají `Outline_1px_BlackBackground` pro kontejnery dialogů:

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI rozsáhle používá `rover_sim_colorable` pro tematické panely, kde barvu řídí centralizovaný správce motivů.

---

## Písma

DayZ obsahuje několik vestavěných písem. Cesty k písmům se zadávají v atributu `font`.

### Cesty vestavěných písem

| Cesta k písmu | Popis |
|---|---|
| `"gui/fonts/Metron"` | Standardní UI písmo |
| `"gui/fonts/Metron28"` | Standardní písmo, varianta 28pt |
| `"gui/fonts/Metron-Bold"` | Tučná varianta |
| `"gui/fonts/Metron-Bold58"` | Tučná varianta 58pt |
| `"gui/fonts/sdf_MetronBook24"` | SDF (Signed Distance Field) písmo -- ostré při jakékoli velikosti |

### Použití písem v layoutech

```
TextWidgetClass Title {
 text "Mission Briefing"
 font "gui/fonts/Metron-Bold"
 "text halign" center
 "text valign" center
}

TextWidgetClass Body {
 text "Objective: Secure the airfield"
 font "gui/fonts/Metron"
}
```

### Použití písem v kódu

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// Písmo je nastaveno v layoutu, nelze ho měnit za běhu přes skript
```

### SDF písma

SDF (Signed Distance Field) písma se vykreslují ostře při jakékoli úrovni přiblížení, což je činí ideálními pro UI prvky, které se mohou zobrazovat v různých velikostech. Písmo `sdf_MetronBook24` je nejlepší volbou pro text, který musí vypadat ostře napříč různými nastaveními škálování UI.

---

## Rozměry textu: "exact text" vs. proporcionální

Textové widgety DayZ podporují dva režimy rozměrování, řízené atributem `"exact text"`:

### Proporcionální text (výchozí)

Když `"exact text" 0` (výchozí), velikost písma je určena výškou widgetu. Text se škáluje s widgetem. Toto je výchozí chování.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### Přesná velikost textu

Když `"exact text" 1`, velikost písma je pevná pixelová hodnota nastavená pomocí `"exact text size"`:

```
TextWidgetClass FixedText {
 size 1 30
 hexactsize 0
 vexactsize 1
 text "I am always 16 pixels"
 "exact text" 1
 "exact text size" 16
}
```

### Co použít?

| Scénář | Doporučení |
|---|---|
| HUD prvky, které se škálují s velikostí obrazovky | Proporcionální (výchozí) |
| Text menu ve specifické velikosti | `"exact text" 1` s `"exact text size"` |
| Text, který musí odpovídat specifické pixelové velikosti písma | `"exact text" 1` |
| Text uvnitř spacerů/mřížek | Často proporcionální, určen výškou buňky |

### Atributy související s rozměry textu

| Atribut | Efekt |
|---|---|
| `"size to text h" 1` | Šířka widgetu se přizpůsobí textu |
| `"size to text v" 1` | Výška widgetu se přizpůsobí textu |
| `"text sharpness"` | Plovoucí hodnota řídící ostrost vykreslování |
| `wrap 1` | Povolit zalamování slov pro text přesahující šířku widgetu |

Atributy `"size to text"` jsou užitečné pro popisky a štítky, kde by widget měl být přesně tak velký jako jeho textový obsah.

---

## Zarovnání textu

Řiďte, kde se text zobrazí v rámci svého widgetu, pomocí atributů zarovnání:

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| Atribut | Hodnoty | Efekt |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Horizontální pozice textu v rámci widgetu |
| `"text valign"` | `top`, `center`, `bottom` | Vertikální pozice textu v rámci widgetu |

---

## Obrys textu

Přidejte obrysy k textu pro čitelnost na rušných pozadích:

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // 1px černý obrys

int size = tw.GetOutlineSize();           // Čtení velikosti obrysu
int color = tw.GetOutlineColor();         // Čtení barvy obrysu (ARGB)
```

---

## ImageWidget

`ImageWidget` zobrazuje obrázky ze dvou zdrojů: odkazů na imagesety a dynamicky načtených souborů.

### Odkazy na imagesety

Nejběžnější způsob zobrazení obrázků. Imageset je sprite atlas -- jeden soubor textury s více pojmenovanými podobrázky.

V souboru layoutu:

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

Formát je `"set:<název_imagesetu> image:<název_obrázku>"`.

Běžné vanilla imagesety a obrázky:

```
"set:dayz_gui image:icon_pin"           -- Ikona špendlíku mapy
"set:dayz_gui image:icon_refresh"       -- Ikona obnovení
"set:dayz_gui image:icon_x"            -- Ikona zavřít/X
"set:dayz_gui image:icon_missing"      -- Ikona varování/chybějící
"set:dayz_gui image:iconHealth0"       -- Ikona zdraví/plus
"set:dayz_gui image:DayZLogo"          -- Logo DayZ
"set:dayz_gui image:Expand"            -- Šipka rozbalit
"set:dayz_gui image:Gradient"          -- Přechodový pruh
```

### Více slotů obrázků

Jeden `ImageWidget` může držet více obrázků v různých slotech (`image0`, `image1` atd.) a přepínat mezi nimi:

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // Zobrazit image0 (ikona chybějící)
icon.SetImage(1);    // Zobrazit image1 (ikona zdraví)
```

### Načítání obrázků ze souborů

Načtení obrázků dynamicky za běhu:

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

Cesta je relativní ke kořenovému adresáři modu. Podporované formáty zahrnují `.edds`, `.paa` a `.tga` (ačkoli `.edds` je standard pro DayZ).

### Režimy prolínání obrázků

Atribut `mode` řídí, jak se obrázek prolíná s tím, co je za ním:

| Režim | Efekt |
|---|---|
| `blend` | Standardní alfa prolínání (nejběžnější) |
| `additive` | Barvy se sčítají (efekty záře) |
| `stretch` | Roztažení na výplň bez prolínání |

### Maskové přechody obrázků

`ImageWidget` podporuje přechodové efekty odhalení založené na masce:

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% odhaleno
```

Toto je užitečné pro ukazatele načítání, zobrazení zdraví a odhalovací animace.

---

## Formát imagesetu

Soubor imagesetu (`.imageset`) definuje pojmenované oblasti v rámci textury sprite atlasu. DayZ podporuje dva formáty imagesetů.

### Nativní formát DayZ

Používaný vanilla DayZ a většinou modů. Toto **není** XML -- používá stejný formát s hranatými závorkami jako soubory layoutu.

```
ImageSetClass {
 Name "my_mod_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_sword {
   Name "icon_sword"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_shield {
   Name "icon_shield"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_potion {
   Name "icon_potion"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

Klíčová pole:
- `Name` -- Název imagesetu (použitý v `"set:<název>"`)
- `RefSize` -- Referenční velikost zdrojové textury v pixelech (šířka výška)
- `path` -- Cesta k souboru textury (`.edds`)
- `mpix` -- Úroveň mipmapy (0 = standardní rozlišení, 1 = 2x rozlišení)
- Každý záznam obrázku definuje `Name`, `Pos` (x y v pixelech) a `Size` (šířka výška v pixelech)

### Formát XML

Některé mody (včetně některých modulů DayZ Expansion) používají formát imagesetu založený na XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

Oba formáty dosahují stejné věci. Nativní formát používá vanilla DayZ; formát XML je někdy snáze čitelný a upravitelný ručně.

---

## Vytváření vlastních imagesetů

Pro vytvoření vlastního imagesetu pro mod:

### Krok 1: Vytvořte texturu sprite atlasu

Použijte editor obrázků (Photoshop, GIMP atd.) k vytvoření jedné textury, která obsahuje všechny vaše ikony/obrázky uspořádané na mřížce. Běžné velikosti jsou 256x256, 512x512 nebo 1024x1024 pixelů.

Uložte jako `.tga`, poté převeďte na `.edds` pomocí DayZ Tools (TexView2 nebo ImageTool).

### Krok 2: Vytvořte soubor imagesetu

Vytvořte soubor `.imageset`, který mapuje pojmenované oblasti na pozice v textuře:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyFramework/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_mission {
   Name "icon_mission"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_waypoint {
   Name "icon_waypoint"
   Pos 64 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Krok 3: Registrace v config.cpp

V `config.cpp` vašeho modu zaregistrujte imageset pod `CfgMods`:

```cpp
class CfgMods
{
    class MyMod
    {
        // ... ostatní pole ...
        class defs
        {
            class imageSets
            {
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... skriptové moduly ...
        };
    };
};
```

### Krok 4: Použití v layoutech a kódu

V souborech layoutu:

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

V kódu:

```c
ImageWidget icon;
// Obrázky z registrovaných imagesetů jsou dostupné přes set:název image:název
// Po registraci v config.cpp není potřeba žádný další krok načítání
```

---

## Vzor barevného motivu

Profesionální mody centralizují své definice barev v třídě motivu a poté aplikují barvy za běhu. To usnadňuje přestylování celého UI změnou jednoho souboru.

```c
class UIColor
{
    static int White()        { return ARGB(255, 255, 255, 255); }
    static int Black()        { return ARGB(255, 0, 0, 0); }
    static int Primary()      { return ARGB(255, 75, 119, 190); }
    static int Secondary()    { return ARGB(255, 60, 60, 60); }
    static int Accent()       { return ARGB(255, 100, 200, 100); }
    static int Danger()       { return ARGB(255, 200, 50, 50); }
    static int Transparent()  { return ARGB(1, 0, 0, 0); }
    static int SemiBlack()    { return ARGB(180, 0, 0, 0); }
}
```

Aplikace v kódu:

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

Tento vzor (používaný Colorful UI, MyMod a dalšími) znamená, že změna celého barevného schématu UI vyžaduje editaci pouze třídy motivu.

---

## Přehled vizuálních atributů podle typu widgetu

| Widget | Klíčové vizuální atributy |
|---|---|
| Jakýkoli widget | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Osvědčené postupy

1. **Používejte odkazy na imagesety** místo přímých cest k souborům, kde je to možné -- imagesety jsou enginem dávkovány efektivněji.

2. **Používejte SDF písma** (`sdf_MetronBook24`) pro text, který potřebuje vypadat ostře při jakémkoli měřítku.

3. **Používejte `"exact text" 1`** pro UI text ve specifických pixelových velikostech; pro HUD prvky, které by se měly škálovat, používejte proporcionální text.

4. **Centralizujte barvy** ve třídě motivu místo hardcodování ARGB hodnot v celém vašem kódu.

5. **Nastavte `"src alpha" 1`** na obrázkových widgetech pro správnou průhlednost.

6. **Registrujte vlastní imagesety** v `config.cpp`, aby byly globálně dostupné bez ručního načítání.

7. **Udržujte sprite atlasy v rozumné velikosti** -- 512x512 nebo 1024x1024 je typické. Větší textury plýtvají pamětí, pokud je většina prostoru prázdná.

---

## Další kroky

- [3.8 Dialogy a modální okna](08-dialogs-modals.md) -- Vyskakovací okna, potvrzovací výzvy a překryvné panely
- [3.1 Typy widgetů](01-widget-types.md) -- Přehled kompletního katalogu widgetů
- [3.6 Zpracování událostí](06-event-handling.md) -- Udělejte své stylizované widgety interaktivními

---

## Teorie vs. praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| SDF písma se škálují na jakoukoli velikost | `sdf_MetronBook24` je ostré ve všech velikostech | Platí pro velikosti nad ~10px. Pod tím mohou SDF písma vypadat rozmazaněji ve srovnání s bitmapovými písmy v jejich nativní velikosti |
| `"exact text" 1` dává pixelově přesné rozměry | Písmo se vykresluje v přesně zadané pixelové velikosti | DayZ aplikuje interní škálování, takže `"exact text size" 16` se může vykreslovat mírně odlišně napříč rozlišeními. Testujte na 1080p a 1440p |
| Vestavěné styly pokrývají všechny potřeby | `Default`, `blank`, `Colorable` jsou dostačující | Většina profesionálních modů definuje vlastní `.styles` soubory, protože vestavěné styly mají omezenou vizuální rozmanitost |
| XML a nativní formáty imagesetů jsou ekvivalentní | Oba definují oblasti sprite | Nativní formát se závorkami je to, co engine zpracovává nejrychleji. XML formát funguje, ale přidává krok parsování; pro produkci používejte nativní formát |
| `SetColor()` přepíše barvu layoutu | Barva za běhu nahradí hodnotu layoutu | `SetColor()` tónuje existující vizuál widgetu. Na stylizovaných widgetech se tón násobí se základní barvou stylu, což produkuje neočekávané výsledky |

---

## Kompatibilita a dopad

- **Více modů:** Názvy stylů jsou globální. Pokud dva mody registrují soubor `.styles` definující stejný název stylu, poslední načtený mod vyhraje. Přidávejte prefix vlastních názvů stylů identifikátorem vašeho modu (např. `MyMod_PanelDark`).
- **Výkon:** Imagesety se načítají jednou do GPU paměti při startu. Přidání velkých sprite atlasů (2048x2048+) zvyšuje využití VRAM. Udržujte atlasy na 512x512 nebo 1024x1024 a rozdělte je napříč více imagesety pokud je potřeba.
