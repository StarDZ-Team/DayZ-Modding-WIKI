# 5.4. fejezet: ImageSet formátum

[Főoldal](../README.md) | [<< Előző: Credits.json](03-credits-json.md) | **ImageSet formátum** | [Következő: Szerver konfigurációs fájlok >>](05-server-configs.md)

---

> **Összefoglalás:** Az ImageSet-ek megnevezett sprite régiókat definiálnak egy textúra atlaszon belül. Ezek a DayZ elsődleges mechanizmusa ikonok, UI grafikák és sprite sheet-ek hivatkozásához layout fájlokból és szkriptekből. Ahelyett, hogy több száz egyedi képfájlt töltenél be, az összes ikont egyetlen textúrába csomagolod, és az imageset definíciós fájlban leírod minden ikon pozícióját és méretét.

---

## Tartalomjegyzék

- [Áttekintés](#overview)
- [Hogyan működnek az ImageSet-ek](#how-imagesets-work)
- [DayZ natív ImageSet formátum](#dayz-native-imageset-format)
- [XML ImageSet formátum](#xml-imageset-format)
- [ImageSet-ek regisztrálása a config.cpp-ben](#registering-imagesets-in-configcpp)
- [Képek hivatkozása layoutokban](#referencing-images-in-layouts)
- [Képek hivatkozása szkriptekben](#referencing-images-in-scripts)
- [Kép jelzők](#image-flags)
- [Többfelbontású textúrák](#multi-resolution-textures)
- [Egyéni ikon készletek létrehozása](#creating-custom-icon-sets)
- [Font Awesome integráció minta](#font-awesome-integration-pattern)
- [Valós példák](#real-examples)
- [Gyakori hibák](#common-mistakes)

---

## Áttekintés

A textúra atlasz egyetlen nagy kép (jellemzően `.edds` formátumban), amely sok kisebb ikont tartalmaz rácsban vagy szabadon elrendezve. Az imageset fájl ember által olvasható neveket rendel az atlasz téglalap alakú régióihoz.

Például egy 1024x1024 textúra tartalmazhat 64 ikont, egyenként 64x64 pixelben. Az imageset fájl azt mondja: "az `arrow_down` nevű ikon a (128, 64) pozícióban van és 64x64 pixel." A layout fájljaid és szkriptjeid név szerint hivatkozzák az `arrow_down`-t, és a motor rendereléskor kivonja a megfelelő al-téglalapot az atlaszból.

Ez a megközelítés hatékony: egyetlen GPU textúra betöltés szolgálja ki az összes ikont, csökkentve a rajzolási hívásokat és a memória terhelést.

---

## Hogyan működnek az ImageSet-ek

Az adatfolyam:

1. **Textúra atlasz** (`.edds` fájl) --- egyetlen kép, amely az összes ikont tartalmazza
2. **ImageSet definíció** (`.imageset` fájl) --- neveket rendel az atlasz régióihoz
3. **config.cpp regisztráció** --- megmondja a motornak, hogy töltse be az imageset-et indításkor
4. **Layout/szkript hivatkozás** --- `set:név image:ikonNév` szintaxissal renderel egy adott ikont

Regisztráció után bármely widget bármely layout fájlban név szerint hivatkozhat bármely képre a készletből.

---

## DayZ natív ImageSet formátum

A natív formátum az Enfusion motor osztály-alapú szintaxisát használja (hasonlóan a config.cpp-hez). Ezt a formátumot használja a vanilla játék és a legtöbb kialakult mod.

### Struktúra

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

### Felső szintű mezők

| Mező | Leírás |
|-------|-------------|
| `Name` | A készlet neve. A képhivatkozások `set:` részében használt. Egyedinek kell lennie az összes betöltött mod között. |
| `RefSize` | A textúra referencia méretei (szélesség magasság). Koordináta leképezéshez használt. |
| `Textures` | Egy vagy több `ImageSetTextureClass` bejegyzést tartalmaz különböző felbontású mip szintekhez. |

### Textúra bejegyzés mezők

| Mező | Leírás |
|-------|-------------|
| `mpix` | Minimális pixel szint (mip szint). `0` = legalacsonyabb felbontás, `1` = szabványos felbontás. |
| `path` | A `.edds` textúra fájl elérési útja, a mod gyökerhez képest. Használhat Enfusion GUID formátumot (`{GUID}elérési_út`) vagy egyszerű relatív elérési utakat. |

### Kép bejegyzés mezők

Minden kép egy `ImageSetDefClass` az `Images` blokkon belül:

| Mező | Leírás |
|-------|-------------|
| Osztály név | Meg kell egyeznie a `Name` mezővel (motor keresésekhez használt) |
| `Name` | A kép azonosító. A hivatkozások `image:` részében használt. |
| `Pos` | Bal felső sarok pozíció az atlaszban (x y), pixelben |
| `Size` | Méretek (szélesség magasság), pixelben |
| `Flags` | Csempézési viselkedés jelzők (lásd [Kép jelzők](#image-flags)) |

### Teljes példa (DayZ vanilla)

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

## XML ImageSet formátum

Létezik egy alternatív XML-alapú formátum is, amelyet egyes modok használnak. Egyszerűbb, de kevesebb funkciót kínál (nincs többfelbontású támogatás).

### Struktúra

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### XML attribútumok

**`<imageset>` elem:**

| Attribútum | Leírás |
|-----------|-------------|
| `name` | A készlet neve (a natív `Name` megfelelője) |
| `file` | A textúra fájl elérési útja (a natív `path` megfelelője) |

**`<image>` elem:**

| Attribútum | Leírás |
|-----------|-------------|
| `name` | Kép azonosító |
| `pos` | Bal felső pozíció mint `"x y"` |
| `size` | Méretek mint `"szélesség magasság"` |

### Mikor melyik formátumot használd

| Funkció | Natív formátum | XML formátum |
|---------|---------------|------------|
| Többfelbontás (mip szintek) | Igen | Nem |
| Csempézési jelzők | Igen | Nem |
| Enfusion GUID elérési utak | Igen | Igen |
| Egyszerűség | Alacsonyabb | Magasabb |
| A vanilla DayZ használja | Igen | Nem |
| Expansion, MyMod, VPP használja | Igen | Alkalmanként |

**Ajánlás:** Használd a natív formátumot éles modokhoz. Használd az XML formátumot gyors prototípus készítéshez vagy egyszerű ikon készletekhez, amelyek nem igényelnek csempézést vagy többfelbontású támogatást.

---

## ImageSet-ek regisztrálása a config.cpp-ben

Az ImageSet fájlokat regisztrálni kell a mod `config.cpp` fájljában a `CfgMods` > `class defs` > `class imageSets` blokk alatt. E regisztráció nélkül a motor soha nem tölti be az imageset-et, és a képhivatkozásaid csendben meghiúsulnak.

### Szintaxis

```cpp
class CfgMods
{
    class MyMod
    {
        // ... egyéb mezők ...
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

### Valós példa: MyFramework

A MyFramework hét imageset-et regisztrál, beleértve a Font Awesome ikon készleteket:

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

### Valós példa: VPP Admin Tools

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

### Valós példa: DayZ Editor

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

## Képek hivatkozása layoutokban

A `.layout` fájlokban használd az `image0` tulajdonságot a `set:név image:képNév` szintaxissal:

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### Szintaxis bontás

```
set:KÉSZLETNÉV image:KÉPNÉV
```

- `KÉSZLETNÉV` --- a `Name` mező az imageset definícióból (pl. `dayz_gui`, `solid`, `brands`)
- `KÉPNÉV` --- a `Name` mező egy adott `ImageSetDefClass` bejegyzésből (pl. `icon_refresh`, `arrow_down`)

### Több kép állapot

Egyes widgetek több kép állapotot támogatnak (normál, hover, megnyomott):

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### Példák valós modokból

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod: Font Awesome regular ikon
image0 "set:dayz_gui image:icon_minus"                -- MyMod: vanilla DayZ ikon
image0 "set:dayz_gui image:icon_collapse"             -- MyMod: vanilla DayZ ikon
image0 "set:dayz_gui image:circle"                    -- MyMod: vanilla DayZ alakzat
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor: egyéni ikon
```

---

## Képek hivatkozása szkriptekben

Enforce Scriptben használd az `ImageWidget.LoadImageFile()` metódust vagy állíts be kép tulajdonságokat widgeteken:

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

A `0` paraméter a kép index (amely a layoutok `image0` értékének felel meg).

### Több állapot index szerint

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // Normál állapot
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // Kapcsolt állapot
```

Válts állapotok között a `SetImage(index)` használatával:

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### Sztring változók használata

```c
// DayZ Editorból
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// Később, dinamikus módosítás
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## Kép jelzők

A natív formátumú imageset bejegyzések `Flags` mezője szabályozza a csempézési viselkedést, amikor a kép a természetes méretén túl van nyújtva.

| Jelző | Érték | Leírás |
|------|-------|-------------|
| `0` | 0 | Nincs csempézés. A kép nyúlik, hogy kitöltse a widgetet. |
| `ISHorizontalTile` | 1 | Vízszintesen csempéz, amikor a widget szélesebb a képnél. |
| `ISVerticalTile` | 2 | Függőlegesen csempéz, amikor a widget magasabb a képnél. |
| Mindkettő | 3 | Mindkét irányban csempéz (`ISHorizontalTile` + `ISVerticalTile`). |

### Használat

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

Ez a `Gradient` kép 75x5 pixel. Ha egy 5 pixelnél magasabb widgetben használják, függőlegesen csempéz a magasság kitöltéséhez, ismétlődő gradiens csíkot létrehozva.

A legtöbb ikon `Flags 0`-t használ (nincs csempézés). A csempézési jelzők elsősorban UI elemekhez használatosak, mint szegélyek, elválasztók és ismétlődő minták.

---

## Többfelbontású textúrák

A natív formátum több felbontású textúrákat támogat ugyanahhoz az imageset-hez. Ez lehetővé teszi, hogy a motor magasabb felbontású grafikát használjon magas DPI kijelzőkön.

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

- `mpix 0` --- alacsony felbontás (alacsony minőségű beállításokon vagy távoli UI elemeknél használt)
- `mpix 1` --- szabványos/magas felbontás (alapértelmezett)

A `@2x` elnevezési konvenció az Apple Retina kijelző rendszeréből származik, de nem kötelező --- a fájlt bárhogyan elnevezheted.

### A gyakorlatban

A legtöbb mod csak `mpix 1`-et tartalmaz (egyetlen felbontás). A többfelbontású támogatást elsősorban a vanilla játék használja:

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## Egyéni ikon készletek létrehozása

### Lépésről lépésre munkafolyamat

**1. Textúra atlasz létrehozása**

Használj egy képszerkesztőt (Photoshop, GIMP, stb.) az ikonok egyetlen vászonra rendezéséhez:
- Válassz kettő hatványának megfelelő méretet (256x256, 512x512, 1024x1024, stb.)
- Rendezd az ikonokat rácsba az egyszerű koordináta számításhoz
- Hagyj némi térközt az ikonok között a textúra átszivárgás megelőzéséhez
- Mentsd el `.tga` vagy `.png` formátumban

**2. Konvertálás EDDS-re**

A DayZ `.edds` (Enfusion DDS) formátumot használ textúrákhoz. Használd a DayZ Workbench-et vagy Mikero eszközeit a konvertáláshoz:
- Importáld a `.tga`-dat a DayZ Workbench-be
- Vagy használd a `Pal2PacE.exe` eszközt a `.paa` konvertálásához `.edds`-re
- A kimenetnek `.edds` fájlnak kell lennie

**3. ImageSet definíció megírása**

Rendeld hozzá az ikonokat megnevezett régiókhoz. Ha az ikonjaid 64 pixeles rácson vannak:

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

**4. Regisztrálás a config.cpp-ben**

Add hozzá az imageset elérési útját a mod config.cpp-jéhez:

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. Használat layoutokban és szkriptekben**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Font Awesome integráció minta

A MyFramework (a DabsFramework-ből örökölve) egy hatékony mintát mutat be: a Font Awesome ikon betűtípusok DayZ imageset-ekké konvertálását. Ez hozzáférést biztosít a modoknak több ezer professzionális minőségű ikonhoz egyéni grafika készítése nélkül.

### Hogyan működik

1. A Font Awesome ikonok textúra atlaszra vannak renderelve rögzített rács méretben (64x64 ikonként)
2. Minden ikon stílus saját imageset-et kap: `solid`, `regular`, `light`, `thin`, `brands`
3. Az imageset ikon nevei megegyeznek a Font Awesome ikon nevekkel (pl. `circle`, `arrow_down`, `discord`)
4. Az imageset-ek regisztrálva vannak a config.cpp-ben és bármely layout vagy szkript számára elérhetők

### MyFramework / DabsFramework ikon készletek

```
MyFramework/GUI/icons/
  solid.imageset       -- Kitöltött ikonok (3648x3712 atlasz, 64x64 ikonként)
  regular.imageset     -- Körvonalazott ikonok
  light.imageset       -- Könnyű súlyú körvonalazott ikonok
  thin.imageset        -- Ultra-vékony körvonalazott ikonok
  brands.imageset      -- Márka logók (Discord, GitHub, stb.)
```

### Használat layoutokban

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### Használat szkriptekben

```c
// DayZ Editor a solid készletet használva
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### Miért működik jól ez a minta

- **Hatalmas ikon könyvtár**: Több ezer ikon elérhető grafikai munka nélkül
- **Egységes stílus**: Minden ikon azonos vizuális súlyt és stílust oszt
- **Több vastagság**: Válassz solid, regular, light vagy thin változatot különböző vizuális kontextusokhoz
- **Márka ikonok**: Kész logók a Discord, Steam, GitHub stb. számára
- **Szabványos nevek**: Az ikon nevek a Font Awesome konvenciókat követik, megkönnyítve a felfedezést

### Az atlasz struktúra

A solid imageset például `RefSize` 3648x3712 méretű, az ikonok 64 pixeles intervallumokban rendezve:

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

## Valós példák

### VPP Admin Tools

A VPP az összes admin eszköz ikont egyetlen 1920x1080 atlaszba csomagolja szabadon pozícionálva (nem szigorú rácson):

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

Hivatkozás layoutokban:
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyWeapons Mod

Fegyver és kiegészítő ikonok nagy atlaszokba csomagolva változó ikon méretekkel:

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

Ez megmutatja, hogy az ikonoknak nem kell egyforma méretűnek lenniük --- a leltári ikonok fegyverekhez 300x300-at használnak, míg az UI ikonok jellemzően 64x64-et.

### MyFramework Prefabs

UI primitívek (lekerekített sarkok, alfa gradiensek) kis 256x256 atlaszba csomagolva:

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

Megjegyzés: a kép nevek tartalmazhatnak szóközöket idézőjelezve (pl. `"Alpha 10"`). Mindazonáltal ezek layoutokban való hivatkozása megköveteli a pontos nevet a szóközzel együtt.

### MyMod Market Hub (XML formátum)

Egyszerűbb XML imageset a market hub modulhoz:

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

Hivatkozás:
```
image0 "set:mh_icons image:icon_store"
```

---

## Gyakori hibák

### config.cpp regisztráció elfelejtése

A leggyakoribb probléma. Ha az imageset fájlod létezik, de nincs felsorolva a `class imageSets { files[] = { ... }; };` blokkban a config.cpp-ben, a motor soha nem tölti be. Minden képhivatkozás csendben meghiúsul (a widgetek üresen jelennek meg).

### Készletnév ütközések

Ha két mod azonos `Name`-mel regisztrál imageset-eket, csak az egyik töltődik be (az utolsó nyer). Használj egyedi előtagot:

```
Name "mymod_icons"     -- Jó
Name "icons"           -- Kockázatos, túl általános
```

### Rossz textúra elérési út

A `path`-nak relatívnak kell lennie a PBO gyökérhez (ahogy a fájl megjelenik a csomagolt PBO-ban):

```
path "MyMod/GUI/imagesets/icons.edds"     -- Helyes, ha MyMod a PBO gyökér
path "GUI/imagesets/icons.edds"            -- Helytelen, ha a PBO gyökér MyMod/
path "C:/Users/dev/icons.edds"            -- Helytelen: abszolút elérési utak nem működnek
```

### Eltérő RefSize

A `RefSize`-nak meg kell egyeznie a textúra tényleges pixel méreteivel. Ha `RefSize 512 512`-t adsz meg, de a textúrád 1024x1024, az összes ikon pozíció kétszeres tényezővel el lesz csúszva.

### Pos koordináták eltérése

A `Pos` az ikon régió bal felső sarka. Ha az ikonjaid 64 pixeles intervallumokon vannak, de véletlenül 1 pixellel eltolsz, az ikonok a szomszédos ikon egy vékony szeletét fogják mutatni.

### .png vagy .tga közvetlen használata

A motor `.edds` formátumot igényel az imageset-ek által hivatkozott textúra atlaszokhoz. A nyers `.png` vagy `.tga` fájlok nem töltődnek be. Mindig konvertálj `.edds`-re a DayZ Workbench vagy Mikero eszközei használatával.

### Szóközök a kép nevekben

Bár a motor támogatja a szóközöket a kép nevekben (pl. `"Alpha 10"`), egyes elemzési kontextusokban problémákat okozhatnak. Inkább használj aláhúzásjeleket: `Alpha_10`.
