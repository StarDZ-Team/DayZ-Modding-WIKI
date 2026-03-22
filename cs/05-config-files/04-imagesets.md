# Kapitola 5.4: Formát ImageSet

[Domů](../README.md) | [<< Předchozí: Credits.json](03-credits-json.md) | **Formát ImageSet** | [Další: Konfigurační soubory serveru >>](05-server-configs.md)

---

> **Shrnutí:** ImageSety definují pojmenované oblasti spritů v texturovém atlasu. Jsou primárním mechanismem DayZ pro odkazování na ikony, UI grafiku a sprite sheety ze souborů layoutů a skriptů. Místo načítání stovek jednotlivých obrazových souborů zabalíte všechny ikony do jediné textury a popíšete pozici a velikost každé ikony v definičním souboru imagesetů.

---

## Obsah

- [Přehled](#přehled)
- [Jak ImageSety fungují](#jak-imagesety-fungují)
- [Nativní formát ImageSet DayZ](#nativní-formát-imageset-dayz)
- [XML formát ImageSet](#xml-formát-imageset)
- [Registrace ImageSetů v config.cpp](#registrace-imagesetů-v-configcpp)
- [Odkazování na obrázky v layoutech](#odkazování-na-obrázky-v-layoutech)
- [Odkazování na obrázky ve skriptech](#odkazování-na-obrázky-ve-skriptech)
- [Příznaky obrázků](#příznaky-obrázků)
- [Textury s více rozlišeními](#textury-s-více-rozlišeními)
- [Vytváření vlastních sad ikon](#vytváření-vlastních-sad-ikon)
- [Vzor integrace Font Awesome](#vzor-integrace-font-awesome)
- [Reálné příklady](#reálné-příklady)
- [Časté chyby](#časté-chyby)

---

## Přehled

Texturový atlas je jeden velký obrázek (typicky ve formátu `.edds`) obsahující mnoho menších ikon uspořádaných v mřížce nebo volném rozložení. Soubor imagesetu mapuje lidsky čitelné názvy na obdélníkové oblasti v tomto atlasu.

Například textura 1024x1024 může obsahovat 64 ikon po 64x64 pixelech. Soubor imagesetu říká "ikona pojmenovaná `arrow_down` je na pozici (128, 64) a má 64x64 pixelů." Vaše soubory layoutů a skripty odkazují na `arrow_down` podle názvu a engine extrahuje správný pod-obdélník z atlasu při vykreslování.

Tento přístup je efektivní: jedno načtení GPU textury obslouží všechny ikony, čímž se snižuje počet draw callů a paměťová režie.

---

## Jak ImageSety fungují

Tok dat:

1. **Texturový atlas** (soubor `.edds`) --- jeden obrázek obsahující všechny ikony
2. **Definice ImageSetu** (soubor `.imageset`) --- mapuje názvy na oblasti v atlasu
3. **Registrace v config.cpp** --- říká enginu, aby načetl imageset při startu
4. **Reference v layoutu/skriptu** --- používá syntaxi `set:name image:iconName` pro vykreslení konkrétní ikony

Jakmile je registrován, jakýkoli widget v jakémkoli souboru layoutu může odkazovat na jakýkoli obrázek ze sady podle názvu.

---

## Nativní formát ImageSet DayZ

Nativní formát používá třídově založenou syntaxi enginu Enfusion (podobnou config.cpp). Tento formát používá vanilková hra a většina zavedených modů.

### Struktura

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

### Pole nejvyšší úrovně

| Pole | Popis |
|------|-------|
| `Name` | Název sady. Používá se v části `set:` odkazu na obrázek. Musí být unikátní napříč všemi načtenými mody. |
| `RefSize` | Referenční rozměry textury (šířka výška). Používá se pro mapování souřadnic. |
| `Textures` | Obsahuje jednu nebo více položek `ImageSetTextureClass` pro různé úrovně rozlišení. |

### Pole položky textury

| Pole | Popis |
|------|-------|
| `mpix` | Minimální pixelová úroveň (mip level). `0` = nejnižší rozlišení, `1` = standardní rozlišení. |
| `path` | Cesta k souboru textury `.edds`, relativní ke kořenu modu. Může používat formát Enfusion GUID (`{GUID}path`) nebo prosté relativní cesty. |

### Pole položky obrázku

Každý obrázek je `ImageSetDefClass` uvnitř bloku `Images`:

| Pole | Popis |
|------|-------|
| Název třídy | Musí odpovídat poli `Name` (používá se pro vyhledávání enginem) |
| `Name` | Identifikátor obrázku. Používá se v části `image:` odkazů. |
| `Pos` | Pozice levého horního rohu v atlasu (x y), v pixelech |
| `Size` | Rozměry (šířka výška), v pixelech |
| `Flags` | Příznaky dlaždicování (viz [Příznaky obrázků](#příznaky-obrázků)) |

### Kompletní příklad (DayZ Vanilla)

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

## XML formát ImageSet

Existuje alternativní formát založený na XML, který používají některé mody. Je jednodušší, ale nabízí méně funkcí (bez podpory více rozlišení).

### Struktura

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### XML atributy

**Element `<imageset>`:**

| Atribut | Popis |
|---------|-------|
| `name` | Název sady (ekvivalent nativního `Name`) |
| `file` | Cesta k souboru textury (ekvivalent nativního `path`) |

**Element `<image>`:**

| Atribut | Popis |
|---------|-------|
| `name` | Identifikátor obrázku |
| `pos` | Pozice levého horního rohu jako `"x y"` |
| `size` | Rozměry jako `"šířka výška"` |

### Kdy použít který formát

| Funkce | Nativní formát | XML formát |
|--------|----------------|------------|
| Více rozlišení (mip úrovně) | Ano | Ne |
| Příznaky dlaždicování | Ano | Ne |
| Cesty Enfusion GUID | Ano | Ano |
| Jednoduchost | Nižší | Vyšší |
| Používá vanilková DayZ | Ano | Ne |
| Používá Expansion, MyMod, VPP | Ano | Příležitostně |

**Doporučení:** Používejte nativní formát pro produkční mody. Používejte XML formát pro rychlé prototypování nebo jednoduché sady ikon, které nepotřebují dlaždicování nebo podporu více rozlišení.

---

## Registrace ImageSetů v config.cpp

Soubory ImageSet musí být registrovány v `config.cpp` vašeho modu pod blokem `CfgMods` > `class defs` > `class imageSets`. Bez této registrace engine imageset nikdy nenačte a vaše odkazy na obrázky tiše selžou.

### Syntaxe

```cpp
class CfgMods
{
    class MyMod
    {
        // ... další pole ...
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

### Reálný příklad: MyMod Core

MyMod Core registruje sedm imagesetů včetně sad ikon Font Awesome:

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

### Reálný příklad: VPP Admin Tools

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

### Reálný příklad: DayZ Editor

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

## Odkazování na obrázky v layoutech

V souborech `.layout` použijte vlastnost `image0` se syntaxí `set:name image:imageName`:

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### Rozklad syntaxe

```
set:NAZEVJMENA image:NAZEVIKONKY
```

- `NAZEVJMENA` --- pole `Name` z definice imagesetu (např. `dayz_gui`, `solid`, `brands`)
- `NAZEVIKONKY` --- pole `Name` z konkrétní položky `ImageSetDefClass` (např. `icon_refresh`, `arrow_down`)

### Více stavů obrázku

Některé widgety podporují více stavů obrázku (normální, hover, stisknutý):

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### Příklady z reálných modů

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod: ikona Font Awesome regular
image0 "set:dayz_gui image:icon_minus"                -- MyMod: vanilková ikona DayZ
image0 "set:dayz_gui image:icon_collapse"             -- MyMod: vanilková ikona DayZ
image0 "set:dayz_gui image:circle"                    -- MyMod: vanilkový tvar DayZ
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor: vlastní ikona
```

---

## Odkazování na obrázky ve skriptech

V Enforce Scriptu použijte `ImageWidget.LoadImageFile()` nebo nastavte vlastnosti obrázku na widgetech:

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

Parametr `0` je index obrázku (odpovídající `image0` v layoutech).

### Více stavů přes index

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // Normální stav
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // Přepnutý stav
```

Přepínání mezi stavy pomocí `SetImage(index)`:

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### Použití řetězcových proměnných

```c
// Z DayZ Editoru
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// Později, dynamická změna
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## Příznaky obrázků

Pole `Flags` v položkách imagesetu nativního formátu řídí chování dlaždicování, když je obrázek roztažen za svou přirozenou velikost.

| Příznak | Hodnota | Popis |
|---------|---------|-------|
| `0` | 0 | Bez dlaždicování. Obrázek se roztáhne, aby vyplnil widget. |
| `ISHorizontalTile` | 1 | Dlaždicuje horizontálně, když je widget širší než obrázek. |
| `ISVerticalTile` | 2 | Dlaždicuje vertikálně, když je widget vyšší než obrázek. |
| Oba | 3 | Dlaždicuje v obou směrech (`ISHorizontalTile` + `ISVerticalTile`). |

### Použití

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

Tento obrázek `Gradient` je 75x5 pixelů. Když je použit ve widgetu vyšším než 5 pixelů, dlaždicuje se vertikálně pro vyplnění výšky, čímž vytváří opakující se gradientní proužek.

Většina ikon používá `Flags 0` (bez dlaždicování). Příznaky dlaždicování jsou primárně pro UI prvky jako okraje, oddělovače a opakující se vzory.

---

## Textury s více rozlišeními

Nativní formát podporuje více textur s různým rozlišením pro stejný imageset. To umožňuje enginu používat grafiku ve vyšším rozlišení na displejích s vysokým DPI.

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

- `mpix 0` --- nízké rozlišení (používá se při nastavení nízké kvality nebo pro vzdálené UI prvky)
- `mpix 1` --- standardní/vysoké rozlišení (výchozí)

Konvence pojmenování `@2x` je převzata ze systému Retina displeje Apple, ale není vynucována --- soubor můžete pojmenovat jakkoli.

### V praxi

Většina modů zahrnuje pouze `mpix 1` (jedno rozlišení). Podpora více rozlišení je primárně používána vanilkovou hrou:

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## Vytváření vlastních sad ikon

### Postup krok za krokem

**1. Vytvořte texturový atlas**

Použijte editor obrázků (Photoshop, GIMP atd.) k uspořádání ikon na jediném plátně:
- Zvolte velikost mocniny dvou (256x256, 512x512, 1024x1024 atd.)
- Uspořádejte ikony do mřížky pro snadný výpočet souřadnic
- Ponechte určitý padding mezi ikonami pro prevenci prolínání textur
- Uložte jako `.tga` nebo `.png`

**2. Konvertujte do EDDS**

DayZ používá formát `.edds` (Enfusion DDS) pro textury. Použijte DayZ Workbench nebo Mikero's tools pro konverzi:
- Importujte váš `.tga` do DayZ Workbench
- Nebo použijte `Pal2PacE.exe` pro konverzi `.paa` do `.edds`
- Výstup musí být soubor `.edds`

**3. Napište definici ImageSetu**

Namapujte každou ikonu na pojmenovanou oblast. Pokud jsou vaše ikony na mřížce 64 pixelů:

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

**4. Zaregistrujte v config.cpp**

Přidejte cestu k imagesetu do config.cpp vašeho modu:

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. Použijte v layoutech a skriptech**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Vzor integrace Font Awesome

MyMod Core (zděděný z DabsFramework) demonstruje silný vzor: konverzi fontů ikon Font Awesome do imagesetů DayZ. To dává modům přístup k tisícům profesionálních ikon bez vytváření vlastní grafiky.

### Jak to funguje

1. Ikony Font Awesome se vykreslí do texturového atlasu v pevné velikosti mřížky (64x64 na ikonu)
2. Každý styl ikon má vlastní imageset: `solid`, `regular`, `light`, `thin`, `brands`
3. Názvy ikon v imagesetu odpovídají názvům ikon Font Awesome (např. `circle`, `arrow_down`, `discord`)
4. ImageSety se zaregistrují v config.cpp a jsou dostupné jakémukoli layoutu nebo skriptu

### Sady ikon MyMod Core / DabsFramework

```
MyFramework/GUI/icons/
  solid.imageset       -- Plné ikony (atlas 3648x3712, 64x64 na ikonu)
  regular.imageset     -- Obrysové ikony
  light.imageset       -- Lehce obrysové ikony
  thin.imageset        -- Ultra tenké obrysové ikony
  brands.imageset      -- Loga značek (Discord, GitHub atd.)
```

### Použití v layoutech

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### Použití ve skriptech

```c
// DayZ Editor používající sadu solid
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### Proč tento vzor funguje dobře

- **Obrovská knihovna ikon**: Tisíce ikon dostupných bez jakékoli tvorby grafiky
- **Konzistentní styl**: Všechny ikony sdílejí stejnou vizuální váhu a styl
- **Více variant**: Volba mezi solid, regular, light nebo thin pro různé vizuální kontexty
- **Ikony značek**: Hotová loga pro Discord, Steam, GitHub atd.
- **Standardní názvy**: Názvy ikon následují konvence Font Awesome, což usnadňuje hledání

### Struktura atlasu

Imageset solid má například `RefSize` 3648x3712 s ikonami uspořádanými v intervalech 64 pixelů:

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

## Reálné příklady

### VPP Admin Tools

VPP balí všechny ikony admin nástrojů do jediného atlasu 1920x1080 s volným umístěním (ne striktní mřížka):

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

V layoutech se odkazuje jako:
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyMod Weapons

Ikony zbraní a příslušenství zabalené do velkých atlasů s různými velikostmi ikon:

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

To ukazuje, že ikony nemusí mít jednotnou velikost --- ikony inventáře pro zbraně používají 300x300, zatímco UI ikony typicky používají 64x64.

### MyMod Core Prefabs

UI primitivy (zaoblené rohy, alfa gradienty) zabalené do malého atlasu 256x256:

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

Pozoruhodné: názvy obrázků mohou obsahovat mezery, když jsou v uvozovkách (např. `"Alpha 10"`). Odkazování na ně v layoutech však vyžaduje přesný název včetně mezery.

### MyMod Market Hub (XML formát)

Jednodušší XML imageset pro modul market hub:

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

Odkazuje se jako:
```
image0 "set:mh_icons image:icon_store"
```

---

## Časté chyby

### Zapomenutí registrace v config.cpp

Nejčastější problém. Pokud váš soubor imagesetu existuje, ale není uveden v `class imageSets { files[] = { ... }; };` v config.cpp, engine ho nikdy nenačte. Všechny odkazy na obrázky tiše selžou (widgety se zobrazí prázdné).

### Kolize názvů sad

Pokud dva mody zaregistrují imagesety se stejným `Name`, načte se pouze jeden (vyhraje ten poslední). Používejte unikátní prefix:

```
Name "mymod_icons"     -- Dobře
Name "icons"           -- Riskantní, příliš obecné
```

### Špatná cesta k textuře

`path` musí být relativní ke kořenu PBO (jak soubor vypadá uvnitř zabaleného PBO):

```
path "MyMod/GUI/imagesets/icons.edds"     -- Správně, pokud MyMod je kořen PBO
path "GUI/imagesets/icons.edds"            -- Špatně, pokud kořen PBO je MyMod/
path "C:/Users/dev/icons.edds"            -- Špatně: absolutní cesty nefungují
```

### Neshodující se RefSize

`RefSize` musí odpovídat skutečným pixelovým rozměrům vaší textury. Pokud specifikujete `RefSize 512 512`, ale vaše textura je 1024x1024, všechny pozice ikon budou posunuté o faktor dvou.

### Souřadnice Pos posunuté o jedničku

`Pos` je levý horní roh oblasti ikony. Pokud jsou vaše ikony v intervalech 64 pixelů, ale náhodně posunete o 1 pixel, ikony budou mít viditelný tenký proužek sousední ikony.

### Použití .png nebo .tga přímo

Engine vyžaduje formát `.edds` pro texturové atlasy odkazované imagesety. Surové soubory `.png` nebo `.tga` se nenačtou. Vždy konvertujte do `.edds` pomocí DayZ Workbench nebo Mikero's tools.

### Mezery v názvech obrázků

Ačkoli engine podporuje mezery v názvech obrázků (např. `"Alpha 10"`), mohou způsobit problémy v některých kontextech parsování. Preferujte podtržítka: `Alpha_10`.

---

## Osvědčené postupy

- Vždy používejte unikátní, modem prefixovaný název sady (např. `"mymod_icons"` místo `"icons"`). Kolize názvů sad mezi mody způsobí, že jedna sada tiše přepíše druhou.
- Používejte rozměry textur mocniny dvou (256x256, 512x512, 1024x1024). Textury, které nejsou mocninou dvou, fungují, ale mohou mít snížený výkon vykreslování na některých GPU.
- Přidejte 1-2 pixely paddingu mezi ikony v atlasu pro prevenci prolínání textur na okrajích, zejména když je textura zobrazena v jiné než nativní velikosti.
- Preferujte nativní formát `.imageset` před XML pro produkční mody. Podporuje textury s více rozlišeními a příznaky dlaždicování, které XML formát postrádá.
- Ověřte, že `RefSize` přesně odpovídá skutečným rozměrům textury. Nesoulad způsobí, že všechny souřadnice ikon budou chybné o proporcionální faktor.

---

## Teorie vs. praxe

> Co říká dokumentace versus jak věci skutečně fungují za běhu.

| Koncept | Teorie | Realita |
|---------|--------|---------|
| Registrace v config.cpp je povinná | ImageSety musí být uvedeny v `class imageSets` | Správně, a toto je nejčastější zdroj chyb s "prázdnou ikonou". Engine nedá žádnou chybu, pokud registrace chybí -- widgety se jednoduše vykreslí prázdné |
| `RefSize` mapuje souřadnice | Souřadnice jsou v prostoru `RefSize` | `RefSize` musí odpovídat skutečným rozměrům textury v pixelech. Pokud je textura 1024x1024, ale `RefSize` říká 512x512, všechny hodnoty `Pos` jsou interpretovány v dvojnásobném měřítku |
| XML formát je jednodušší | Méně funkcí, ale funguje stejně | XML imagesety nemohou specifikovat příznaky dlaždicování ani mip úrovně více rozlišení. Pro ikony je to v pořádku, ale pro opakující se UI prvky (okraje, gradienty) potřebujete nativní formát |
| Více `mpix` položek | Engine vybírá podle nastavení kvality | V praxi většina modů dodává pouze `mpix 1`. Engine se elegantně přizpůsobí, pokud je poskytnuta pouze jedna mip úroveň -- žádná vizuální závada, jen žádná optimalizace pro vysoké DPI |
| Názvy obrázků rozlišují velikost písmen | `"MyIcon"` a `"myicon"` jsou odlišné | Pravda v definici imagesetu, ale `LoadImageFile()` ve skriptu provádí vyhledávání bez rozlišení velikosti písmen v některých verzích enginu. Vždy přesně shodujte velikost písmen pro jistotu |

---

## Kompatibilita a dopad

- **Více modů:** Kolize názvů sad jsou hlavní riziko. Pokud dva mody definují imageset pojmenovaný `"icons"`, načte se pouze jeden (vyhraje poslední PBO). Všechny odkazy na `set:icons` v prohrávajícím modu tiše selžou. Vždy používejte prefix specifický pro mod.
- **Výkon:** Každá unikátní textura imagesetu je jedno načtení GPU textury. Konsolidace ikon do méně, větších atlasů snižuje draw cally. Mod s 10 oddělenými texturami 64x64 má horší výkon než jeden atlas 512x512 s 10 ikonami.
- **Verze:** Nativní formát `.imageset` a referenční syntaxe `set:name image:name` jsou stabilní od DayZ 1.0. XML formát byl dostupný jako alternativa od raných verzí, ale není oficiálně dokumentován Bohemií.

---

## Pozorováno v reálných modech

| Vzor | Mod | Detail |
|------|-----|--------|
| Atlasy ikon Font Awesome | DabsFramework / StarDZ Core | Vykresluje ikony Font Awesome do velkých atlasů (3648x3712), poskytující tisíce profesionálních ikon přes `set:solid`, `set:regular`, `set:brands` |
| Volné rozložení atlasu | VPP Admin Tools | Ikony uspořádány nerovnoměrně na atlasu 1920x1080 s různými velikostmi, maximalizující využití prostoru textury |
| Malé atlasy per funkce | Expansion | Každý pod-modul Expansion má vlastní malý imageset místo jednoho masivního atlasu, čímž udržuje velikosti PBO minimální |
| Inventářové ikony 300x300 | SNAFU Weapons | Velké velikosti ikon pro sloty inventáře zbraní/příslušenství, kde záleží na detailech, na rozdíl od UI ikon 64x64 |
