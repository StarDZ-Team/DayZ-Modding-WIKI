# 3.7. fejezet: Stílusok, betűtípusok és képek

[Kezdőlap](../README.md) | [<< Előző: Események kezelése](06-event-handling.md) | **Stílusok, betűtípusok és képek** | [Következő: Párbeszédablakok és modális ablakok >>](08-dialogs-modals.md)

---

Ez a fejezet a DayZ UI vizuális építőköveit tárgyalja: előre definiált stílusokat, betűtípus használatot, szöveg méretezést, imageset referenciákkal rendelkező kép widgeteket, és hogyan hozhatsz létre egyéni imageseteket a mododhoz.

---

## Stílusok

A stílusok előre definiált vizuális megjelenések, amelyek widgetekre alkalmazhatók a `style` attribútumon keresztül layout fájlokban. Vezérlik a háttér renderelést, kereteket és összhatást manuális szín és kép konfiguráció nélkül.

### Gyakori beépített stílusok

| Stílus neve | Leírás |
|---|---|
| `blank` | Nincs vizuális megjelenés -- teljesen átlátszó háttér |
| `Empty` | Nincs háttér renderelés |
| `Default` | Alapértelmezett gomb/widget stílus szabványos DayZ megjelenéssel |
| `Colorable` | Stílus, amely a `SetColor()` használatával színezhető |
| `rover_sim_colorable` | Színezett panel stílus, háttérekhez gyakran használt |
| `rover_sim_black` | Sötét panel háttér |
| `rover_sim_black_2` | Még sötétebb panel változat |
| `Outline_1px_BlackBackground` | 1 pixeles körvonal fekete háttérrel |
| `OutlineFilled` | Körvonal kitöltött belsővel |
| `DayZDefaultPanelRight` | DayZ alapértelmezett jobb oldali panel stílus |
| `DayZNormal` | DayZ normál szöveg/widget stílus |
| `MenuDefault` | Szabványos menü gomb stílus |

### Stílusok használata layoutokban

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

### Stílus + szín minta

A `Colorable` és `rover_sim_colorable` stílusok színezésre tervezettek. Állítsd be a `color` attribútumot a layoutban vagy hívd meg a `SetColor()` metódust kódban:

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
// Szín módosítása futásidőben
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Stílusok professzionális modokban

A DabsFramework párbeszédablakok az `Outline_1px_BlackBackground` stílust használják párbeszédablak konténerekhez:

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

A Colorful UI kiterjedten használja a `rover_sim_colorable` stílust témázott panelekhez, ahol a színt egy központi téma kezelő vezérli.

---

## Betűtípusok

A DayZ több beépített betűtípust tartalmaz. A betűtípus elérési utak a `font` attribútumban vannak megadva.

### Beépített betűtípus útvonalak

| Betűtípus útvonal | Leírás |
|---|---|
| `"gui/fonts/Metron"` | Szabványos UI betűtípus |
| `"gui/fonts/Metron28"` | Szabványos betűtípus, 28pt változat |
| `"gui/fonts/Metron-Bold"` | Félkövér változat |
| `"gui/fonts/Metron-Bold58"` | Félkövér 58pt változat |
| `"gui/fonts/sdf_MetronBook24"` | SDF (Signed Distance Field) betűtípus -- éles bármilyen méreten |

### Betűtípusok használata layoutokban

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

### Betűtípusok használata kódban

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// A betűtípus a layoutban van beállítva, futásidőben script által nem módosítható
```

### SDF betűtípusok

Az SDF (Signed Distance Field) betűtípusok bármilyen nagyítási szinten élesen renderelődnek, így ideálisak olyan UI elemekhez, amelyek különböző méretekben jelenhetnek meg. Az `sdf_MetronBook24` betűtípus a legjobb választás olyan szövegekhez, amelyeknek élesen kell kinézniük a különböző UI skálázási beállításokon.

---

## Szöveg méretezés: "exact text" vs. arányos

A DayZ szöveges widgetek két méretezési módot támogatnak, az `"exact text"` attribútum által vezérelve:

### Arányos szöveg (alapértelmezett)

Amikor az `"exact text" 0` (az alapértelmezett), a betűméret a widget magassága határozza meg. A szöveg a widgettel együtt skálázódik. Ez az alapértelmezett viselkedés.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### Pontos szöveg méret

Amikor az `"exact text" 1`, a betűméret egy fix pixel érték, amelyet az `"exact text size"` állít be:

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

### Melyiket használjuk?

| Forgatókönyv | Ajánlás |
|---|---|
| Képernyőmérettel skálázódó HUD elemek | Arányos (alapértelmezett) |
| Menüszöveg adott méretben | `"exact text" 1` az `"exact text size"` beállítással |
| Szöveg, amelynek adott pixel betűméretet kell egyeznie | `"exact text" 1` |
| Szöveg spacerekben/rácsokban | Gyakran arányos, a cella magassága határozza meg |

### Szöveggel kapcsolatos méret attribútumok

| Attribútum | Hatás |
|---|---|
| `"size to text h" 1` | Widget szélessége a szöveghez igazodik |
| `"size to text v" 1` | Widget magassága a szöveghez igazodik |
| `"text sharpness"` | Float érték a renderelési élesség szabályozásához |
| `wrap 1` | Szótördelés engedélyezése a widget szélességét meghaladó szöveghez |

A `"size to text"` attribútumok hasznosak címkékhez és jelölőkhöz, ahol a widget pontosan akkora legyen, mint a szövegtartalma.

---

## Szöveg igazítás

Szabályozd, hol jelenik meg a szöveg a widgetjén belül igazítási attribútumokkal:

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| Attribútum | Értékek | Hatás |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Szöveg vízszintes pozíciója a widgeten belül |
| `"text valign"` | `top`, `center`, `bottom` | Szöveg függőleges pozíciója a widgeten belül |

---

## Szöveg körvonal

Adj körvonalat a szöveghez az olvashatóság érdekében zsúfolt háttéren:

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // 1px fekete körvonal

int size = tw.GetOutlineSize();           // Körvonal méret olvasása
int color = tw.GetOutlineColor();         // Körvonal szín olvasása (ARGB)
```

---

## ImageWidget

Az `ImageWidget` két forrásból jelenít meg képeket: imageset referenciák és dinamikusan betöltött fájlok.

### Imageset referenciák

A képek megjelenítésének leggyakoribb módja. Az imageset egy sprite atlasz -- egyetlen textúra fájl több elnevezett alképpel.

Layout fájlban:

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

A formátum: `"set:<imageset_neve> image:<kep_neve>"`.

Gyakori vanilla imageset képek:

```
"set:dayz_gui image:icon_pin"           -- Térkép tű ikon
"set:dayz_gui image:icon_refresh"       -- Frissítés ikon
"set:dayz_gui image:icon_x"            -- Bezárás/X ikon
"set:dayz_gui image:icon_missing"      -- Figyelmeztetés/hiányzó ikon
"set:dayz_gui image:iconHealth0"       -- Egészség/plusz ikon
"set:dayz_gui image:DayZLogo"          -- DayZ logó
"set:dayz_gui image:Expand"            -- Kibontás nyíl
"set:dayz_gui image:Gradient"          -- Színátmenet csík
```

### Több kép hely

Egyetlen `ImageWidget` több képet tartalmazhat különböző helyeken (`image0`, `image1` stb.) és váltogathat közöttük:

```c
ImageWidget icon;
icon.SetImage(0);    // image0 megjelenítése (hiányzó ikon)
icon.SetImage(1);    // image1 megjelenítése (egészség ikon)
```

### Képek betöltése fájlokból

Képek dinamikus betöltése futásidőben:

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

### Kép keverési módok

A `mode` attribútum szabályozza, hogyan keveredik a kép a mögötte lévővel:

| Mód | Hatás |
|---|---|
| `blend` | Szabványos alfa keverés (leggyakoribb) |
| `additive` | A színek összeadódnak (fény effektek) |
| `stretch` | Nyújtás a kitöltéshez keverés nélkül |

### Kép maszk átmenetek

Az `ImageWidget` támogatja a maszk-alapú feltárási átmeneteket:

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% feltárva
```

Ez hasznos töltősávokhoz, egészségmegjelenítőkhöz és feltárási animációkhoz.

---

## ImageSet formátum

Az imageset fájl (`.imageset`) elnevezett régiókat definiál egy sprite atlasz textúrán belül. A DayZ két imageset formátumot támogat.

### DayZ natív formátum

A vanilla DayZ és a legtöbb mod által használt. Ez **nem** XML -- ugyanazt a kapcsos zárójelekkel tagolt formátumot használja, mint a layout fájlok.

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
 }
}
```

### XML formátum

Néhány mod (beleértve néhány DayZ Expansion modult) XML-alapú imageset formátumot használ:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
</imageset>
```

Mindkét formátum ugyanazt valósítja meg. A natív formátumot a vanilla DayZ használja; az XML formátum néha könnyebben olvasható és szerkeszthető kézzel.

---

## Egyéni imageset készítése

### 1. lépés: Sprite atlasz textúra létrehozása

Használj képszerkesztőt (Photoshop, GIMP stb.) egyetlen textúra létrehozásához, amely rácson elrendezett ikonjaidat/képeidet tartalmazza. A gyakori méretek 256x256, 512x512 vagy 1024x1024 pixel.

Mentsd el `.tga` fájlként, majd konvertáld `.edds` formátumba DayZ Tools segítségével (TexView2 vagy az ImageTool).

### 2. lépés: Imageset fájl létrehozása

Hozz létre egy `.imageset` fájlt, amely a textúra pozícióihoz rendeli az elnevezett régiókat.

### 3. lépés: Regisztráció a config.cpp-ben

A modod `config.cpp` fájljában regisztráld az imagesetet a `CfgMods` alatt:

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
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... script modulok ...
        };
    };
};
```

### 4. lépés: Használat layoutokban és kódban

Layout fájlokban:

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

---

## Szín téma minta

A professzionális modok központosítják a szín definícióikat egy téma osztályban, majd futásidőben alkalmazzák a színeket. Ez megkönnyíti a teljes UI átszínezését egyetlen fájl módosításával.

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

Alkalmazás kódban:

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

---

## Vizuális attribútumok összefoglalása widget típusonként

| Widget | Fő vizuális attribútumok |
|---|---|
| Bármilyen widget | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Bevált gyakorlatok

1. **Használj imageset referenciákat** közvetlen fájl útvonalak helyett ahol lehetséges -- az imageseteket a motor hatékonyabban kötegelten dolgozza fel.

2. **Használj SDF betűtípusokat** (`sdf_MetronBook24`) olyan szöveghez, amelynek bármilyen méretben élesen kell kinéznie.

3. **Használj `"exact text" 1`-et** adott pixel méretű UI szöveghez; használj arányos szöveget olyan HUD elemekhez, amelyeknek skálázódniuk kell.

4. **Központosítsd a színeket** egy téma osztályban ahelyett, hogy ARGB értékeket kódolnál be a kódodba szétszórva.

5. **Állítsd be a `"src alpha" 1`-et** a kép widgeteken a megfelelő átlátszóság érdekében.

6. **Regisztráld az egyéni imageseteket** a `config.cpp`-ben, hogy globálisan elérhetők legyenek manuális betöltés nélkül.

7. **Tartsd ésszerű méretben a sprite atlaszokat** -- 512x512 vagy 1024x1024 a tipikus. A nagyobb textúrák pazarolják a memóriát, ha a hely nagy része üres.

---

## Következő lépések

- [3.8 Párbeszédablakok és modális ablakok](08-dialogs-modals.md) -- Felugró ablakok, megerősítési felszólítások és fedőpanelek
- [3.1 Widget típusok](01-widget-types.md) -- A teljes widget katalógus áttekintése
- [3.6 Események kezelése](06-event-handling.md) -- A stílusos widgetek interaktívvá tétele
