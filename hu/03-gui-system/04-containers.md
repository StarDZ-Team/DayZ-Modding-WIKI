# 3.4. fejezet: Konténer widgetek

[Kezdőlap](../README.md) | [<< Előző: Méretezés és pozícionálás](03-sizing-positioning.md) | **Konténer widgetek** | [Következő: Programozott widgetek >>](05-programmatic-widgets.md)

---

A konténer widgetek szervezik a bennük lévő gyermek widgeteket. Míg a `FrameWidget` a legegyszerűbb (láthatatlan doboz, manuális pozícionálás), a DayZ három specializált konténert kínál, amelyek automatikusan kezelik az elrendezést: `WrapSpacerWidget`, `GridSpacerWidget` és `ScrollWidget`.


```mermaid
graph LR
    subgraph "FrameWidget (Absolute)"
        FA["Child A<br/>pos: 10,10"]
        FB["Child B<br/>pos: 200,10"]
        FC["Child C<br/>pos: 10,100"]
    end

    subgraph "WrapSpacer (Flow)"
        WA["Item 1"] --> WB["Item 2"] --> WC["Item 3"]
        WC --> WD["Item 4<br/>(wraps to next row)"]
    end

    subgraph "GridSpacer (Grid)"
        GA["Cell 0,0"] --- GB["Cell 1,0"] --- GC["Cell 2,0"]
        GD["Cell 0,1"] --- GE["Cell 1,1"] --- GF["Cell 2,1"]
    end

    style FA fill:#4A90D9,color:#fff
    style WA fill:#2D8A4E,color:#fff
    style GA fill:#D97A4A,color:#fff
```

---

## FrameWidget -- Strukturális konténer

A `FrameWidget` a legalapvetőbb konténer. Nem rajzol semmit a képernyőre és nem rendezi a gyermekeit -- minden gyermeket manuálisan kell pozícionálnod.

**Mikor használd:**
- Kapcsolódó widgetek csoportosítása, hogy együtt lehessen megjeleníteni/elrejteni őket
- Egy panel vagy párbeszédablak gyökér widgetje
- Bármilyen strukturális csoportosítás, ahol te kezeled a pozícionálást

```
FrameWidgetClass MyPanel {
 size 0.5 0.5
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
 {
  TextWidgetClass Header {
   position 0 0
   size 1 0.1
   text "Panel Title"
   "text halign" center
  }
  PanelWidgetClass Divider {
   position 0 0.1
   size 1 2
   hexactsize 0
   vexactsize 1
   color 1 1 1 0.3
  }
  FrameWidgetClass Content {
   position 0 0.12
   size 1 0.88
  }
 }
}
```

**Fő jellemzők:**
- Nincs vizuális megjelenése (átlátszó)
- A gyermekek a keret határaihoz viszonyítva pozícionáltak
- Nincs automatikus elrendezés -- minden gyermeknek explicit pozícióra/méretre van szüksége
- Könnyűsúlyú -- nulla renderelési költség a gyermekein túl

---

## WrapSpacerWidget -- Folyam elrendezés

A `WrapSpacerWidget` automatikusan rendezi a gyermekeit folyam sorozatban. A gyermekek egymás után kerülnek vízszintesen, és a következő sorba törnek, amikor meghaladják az elérhető szélességet. Ez a widget használandó olyan dinamikus listákhoz, ahol a gyermekek száma futásidőben változik.

### Layout attribútumok
| Attribútum | Értékek | Leírás |
|---|---|---|
| `Padding` | egész szám (pixelek) | A spacer széle és a gyermekei közötti távolság |
| `Margin` | egész szám (pixelek) | Az egyes gyermekek közötti távolság |
| `"Size To Content H"` | `0` vagy `1` | Szélesség átméretezése az összes gyermek befogadásához |
| `"Size To Content V"` | `0` vagy `1` | Magasság átméretezése az összes gyermek befogadásához |
| `content_halign` | `left`, `center`, `right` | A gyermekcsoport vízszintes igazítása |
| `content_valign` | `top`, `center`, `bottom` | A gyermekcsoport függőleges igazítása |

### Alapvető folyam elrendezés

```
WrapSpacerWidgetClass TagList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Padding 5
 Margin 3
 {
  ButtonWidgetClass Tag1 {
   size 80 24
   hexactsize 1
   vexactsize 1
   text "Weapons"
  }
  ButtonWidgetClass Tag2 {
   size 60 24
   hexactsize 1
   vexactsize 1
   text "Food"
  }
  ButtonWidgetClass Tag3 {
   size 90 24
   hexactsize 1
   vexactsize 1
   text "Medical"
  }
 }
}
```

Ebben a példában:
- A spacer teljes szülő szélességű (`size 1`), de a magassága a gyermekekhez igazodik (`"Size To Content V" 1`).
- A gyermekek 80px, 60px és 90px széles gombok.
- Ha az elérhető szélesség nem elegendő mindhárom befogadásához egy sorban, a spacer a következő sorba töri őket.
- A `Padding 5` 5px-nyi helyet ad a spacer szélein belül.
- A `Margin 3` 3px-nyi távolságot ad az egyes gyermekek között.

### Függőleges lista WrapSpacerrel

Függőleges lista létrehozásához (egy elem soronként) tedd teljes szélességűvé a gyermekeket:

```
WrapSpacerWidgetClass ItemList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Margin 2
 {
  FrameWidgetClass Item1 {
   size 1 30
   hexactsize 0
   vexactsize 1
  }
  FrameWidgetClass Item2 {
   size 1 30
   hexactsize 0
   vexactsize 1
  }
 }
}
```

Minden gyermek 100% szélességű (`size 1` a `hexactsize 0` beállítással), így soronként csak egy fér el, függőleges halmazt létrehozva.

### Dinamikus gyermekek

A `WrapSpacerWidget` ideális programozottan hozzáadott gyermekekhez. Gyermekek hozzáadásakor vagy eltávolításakor hívd meg az `Update()` metódust a spaceren az újrarendezés kiváltásához:

```c
WrapSpacerWidget spacer;

// Gyermek hozzáadása layout fájlból
Widget child = GetGame().GetWorkspace().CreateWidgets("MyMod/gui/layouts/ListItem.layout", spacer);

// A spacer újraszámolásának kényszerítése
spacer.Update();
```

---

## GridSpacerWidget -- Rács elrendezés

A `GridSpacerWidget` egyenletes rácsba rendezi a gyermekeket. Meghatározod az oszlopok és sorok számát, és minden cella egyenlő helyet kap.

### Layout attribútumok

| Attribútum | Értékek | Leírás |
|---|---|---|
| `Columns` | egész szám | Rács oszlopainak száma |
| `Rows` | egész szám | Rács sorainak száma |
| `Margin` | egész szám (pixelek) | Rács cellák közötti távolság |
| `"Size To Content V"` | `0` vagy `1` | Magasság átméretezése a tartalomhoz igazítva |

### Alapvető rács

```
GridSpacerWidgetClass InventoryGrid {
 size 0.5 0.5
 hexactsize 0
 vexactsize 0
 Columns 4
 Rows 3
 Margin 2
 {
  // 12 cella (4 oszlop x 3 sor)
  // A gyermekek sorrendben kerülnek elhelyezésre: balról jobbra, felülről lefelé
  FrameWidgetClass Slot1 { }
  FrameWidgetClass Slot2 { }
  FrameWidgetClass Slot3 { }
  FrameWidgetClass Slot4 { }
  FrameWidgetClass Slot5 { }
  FrameWidgetClass Slot6 { }
  FrameWidgetClass Slot7 { }
  FrameWidgetClass Slot8 { }
  FrameWidgetClass Slot9 { }
  FrameWidgetClass Slot10 { }
  FrameWidgetClass Slot11 { }
  FrameWidgetClass Slot12 { }
 }
}
```

### Egyoszlopos rács (függőleges lista)

A `Columns 1` beállítás egyszerű függőleges halmazt hoz létre, ahol minden gyermek teljes szélességet kap:

```
GridSpacerWidgetClass SettingsList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Columns 1
 {
  FrameWidgetClass Setting1 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
  FrameWidgetClass Setting2 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
  FrameWidgetClass Setting3 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
 }
}
```

### GridSpacer vs. WrapSpacer

| Funkció | GridSpacer | WrapSpacer |
|---|---|---|
| Cellaméret | Egységes (egyenlő) | Minden gyermek megtartja a saját méretét |
| Elrendezési mód | Fix rács (oszlopok x sorok) | Folyam tördeléssel |
| Legjobb ehhez | Tárgyhelyek, egységes galériák | Dinamikus listák, címkefelhők |
| Gyermekek méretezése | Figyelmen kívül hagyva (a rács vezérli) | Figyelembe véve (a gyermek mérete számít) |

---

## ScrollWidget -- Görgethető nézet

A `ScrollWidget` olyan tartalmat foglal keretbe, amely magasabb (vagy szélesebb) lehet a látható területnél, görgetősávokat biztosítva a navigációhoz.

### Layout attribútumok

| Attribútum | Értékek | Leírás |
|---|---|---|
| `"Scrollbar V"` | `0` vagy `1` | Függőleges görgetősáv megjelenítése |
| `"Scrollbar H"` | `0` vagy `1` | Vízszintes görgetősáv megjelenítése |

### Script API

```c
ScrollWidget sw;
sw.VScrollToPos(float pos);     // Görgetés függőleges pozícióra (0 = teteje)
sw.GetVScrollPos();             // Aktuális görgetési pozíció lekérdezése
sw.GetContentHeight();          // Teljes tartalom magasságának lekérdezése
sw.VScrollStep(int step);       // Görgetés lépésenként
```

### Alapvető görgethető lista

```
ScrollWidgetClass ListScroll {
 size 1 300
 hexactsize 0
 vexactsize 1
 "Scrollbar V" 1
 {
  WrapSpacerWidgetClass ListContent {
   size 1 0
   hexactsize 0
   "Size To Content V" 1
   {
    // Sok gyermek itt...
    FrameWidgetClass Item1 {
     size 1 30
     hexactsize 0
     vexactsize 1
    }
    FrameWidgetClass Item2 {
     size 1 30
     hexactsize 0
     vexactsize 1
    }
    // ... további elemek
   }
  }
 }
}
```

---

## A ScrollWidget + WrapSpacer minta

```mermaid
graph TB
    SCROLL["ScrollWidget<br/>fixed viewport size<br/>Scrollbar V = 1"]
    WRAP["WrapSpacerWidget<br/>size: 1 0<br/>Size To Content V = 1"]
    I1["Item 1"]
    I2["Item 2"]
    I3["Item 3"]
    I4["Item N..."]

    SCROLL --> WRAP
    WRAP --> I1
    WRAP --> I2
    WRAP --> I3
    WRAP --> I4

    style SCROLL fill:#4A90D9,color:#fff
    style WRAP fill:#2D8A4E,color:#fff
```

Ez **az** a minta görgethető dinamikus listákhoz a DayZ modokban. Egy fix magasságú `ScrollWidget`-et kombinál egy `WrapSpacerWidget`-tel, amely a gyermekeihez nő.

```
// Fix magasságú görgetési nézet
ScrollWidgetClass DialogScroll {
 size 0.97 235
 hexactsize 0
 vexactsize 1
 "Scrollbar V" 1
 {
  // A tartalom függőlegesen nő az összes gyermek befogadásához
  WrapSpacerWidgetClass DialogContent {
   size 1 0
   hexactsize 0
   "Size To Content V" 1
  }
 }
}
```

Hogyan működik:

1. A `ScrollWidget`-nek **fix** magassága van (ebben a példában 235 pixel).
2. Benne a `WrapSpacerWidget`-nek `"Size To Content V" 1` van beállítva, így a magassága nő, ahogy gyermekeket adnak hozzá.
3. Amikor a spacer tartalma meghaladja a 235 pixelt, megjelenik a görgetősáv és a felhasználó görgethet.

Ez a minta megjelenik a DabsFramework-ben, a DayZ Editorban, az Expansionben és gyakorlatilag minden professzionális DayZ modban.

### Elemek programozott hozzáadása

```c
ScrollWidget m_Scroll;
WrapSpacerWidget m_Content;

void AddItem(string text)
{
    // Új gyermek létrehozása a WrapSpacer belsejében
    Widget item = GetGame().GetWorkspace().CreateWidgets(
        "MyMod/gui/layouts/ListItem.layout", m_Content);

    // Az új elem konfigurálása
    TextWidget tw = TextWidget.Cast(item.FindAnyWidget("Label"));
    tw.SetText(text);

    // Elrendezés újraszámolásának kényszerítése
    m_Content.Update();
}

void ScrollToBottom()
{
    m_Scroll.VScrollToPos(m_Scroll.GetContentHeight());
}

void ClearAll()
{
    // Összes gyermek eltávolítása
    Widget child = m_Content.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();
        child = next;
    }
    m_Content.Update();
}
```

---

## Beágyazási szabályok

A konténerek beágyazhatók komplex elrendezések létrehozásához. Néhány iránymutatás:

1. **FrameWidget bármiben** -- Mindig működik. Használj kereteket alszekciók csoportosítására spacereken vagy rácsokban belül.

2. **WrapSpacer ScrollWidget-ben** -- A szabványos minta görgethető listákhoz. A spacer nő; a scroll vág.

3. **GridSpacer WrapSpacer-ben** -- Működik. Hasznos fix rács elhelyezéséhez egy folyam elrendezés egyik elemeként.

4. **ScrollWidget WrapSpacer-ben** -- Lehetséges, de fix magasságra van szükség a scroll widgetnél (`vexactsize 1`). Fix magasság nélkül a scroll widget megpróbál a tartalmához növekedni (ami ellentmond a görgetés céljának).

5. **Kerüld a mély beágyazást** -- Minden beágyazási szint elrendezés-számítási költséget ad hozzá. Három-négy szint mélység tipikus komplex UI-knál; hat szintet meghaladni azt sugallja, hogy az elrendezést át kellene strukturálni.

---

## Mikor használjuk az egyes konténereket

| Forgatókönyv | Legjobb konténer |
|---|---|
| Statikus panel manuálisan pozícionált elemekkel | `FrameWidget` |
| Változó méretű elemek dinamikus listája | `WrapSpacerWidget` |
| Egységes rács (leltár, galéria) | `GridSpacerWidget` |
| Függőleges lista soronként egy elemmel | `WrapSpacerWidget` (teljes szélességű gyermekek) vagy `GridSpacerWidget` (`Columns 1`) |
| Tartalom magasabb az elérhető helynél | `ScrollWidget` egy spacert csomagolva |
| Fül tartalmi területe | `FrameWidget` (gyermekek láthatóságának váltása) |
| Eszköztár gombok | `WrapSpacerWidget` vagy `GridSpacerWidget` |

---

## Teljes példa: Görgethető beállítások panel

Egy beállítások panel címsorral, rácsba rendezett opciókat tartalmazó görgethető tartalmi területtel és alsó gombsorral:

```
FrameWidgetClass SettingsPanel {
 size 0.4 0.6
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
 {
  // Címsor
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 30
   hexactsize 0
   vexactsize 1
   color 0.2 0.4 0.8 1
  }

  // Görgethető beállítási terület
  ScrollWidgetClass SettingsScroll {
   position 0 30
   size 1 0
   hexactpos 0
   vexactpos 1
   hexactsize 0
   vexactsize 0
   "Scrollbar V" 1
   {
    GridSpacerWidgetClass SettingsGrid {
     size 1 0
     hexactsize 0
     "Size To Content V" 1
     Columns 1
     Margin 2
    }
   }
  }

  // Gombsor alul
  FrameWidgetClass ButtonBar {
   size 1 40
   halign left_ref
   valign bottom_ref
   hexactpos 0
   vexactpos 1
   hexactsize 0
   vexactsize 1
  }
 }
}
```

---

## Bevált gyakorlatok

- Mindig hívd meg az `Update()` metódust a `WrapSpacerWidget`-en vagy `GridSpacerWidget`-en, miután programozottan hozzáadtál vagy eltávolítottál gyermekeket. E hívás nélkül a spacer nem számítja újra az elrendezését, és a gyermekek átfedhetnek vagy láthatatlanok lehetnek.
- Használd a `ScrollWidget` + `WrapSpacerWidget` kombinációt szabványos mintaként bármilyen dinamikus listához. Állítsd a scroll widgetet fix pixel magasságra, a belső spacert pedig `"Size To Content V" 1` értékre.
- Részesítsd előnyben a `WrapSpacerWidget`-et teljes szélességű gyermekekkel a `GridSpacerWidget Columns 1` beállítás helyett olyan függőleges listáknál, ahol az elemek változó magasságúak. A GridSpacer egységes cellaméreteket kényszerít ki.
- Mindig állítsd be a `clipchildren 1` beállítást a `ScrollWidget`-en. E nélkül a túlcsordult tartalom a scroll nézet határain kívül renderelődik.
- Kerüld a 4-5 szintnél mélyebb konténer beágyazást. Minden szint elrendezés-számítási költséget ad hozzá és jelentősen megnehezíti a hibakeresést.

---

## Elmélet vs. gyakorlat

> Amit a dokumentáció mond, és hogyan működnek a dolgok ténylegesen futásidőben.

| Fogalom | Elmélet | Valóság |
|---------|---------|---------|
| A `WrapSpacerWidget.Update()` | Az elrendezés automatikusan újraszámolódik, amikor a gyermekek változnak | Manuálisan kell hívnod az `Update()` metódust a `CreateWidgets()` vagy `Unlink()` után. Ennek elfelejtése a leggyakoribb spacer hiba |
| `"Size To Content V"` | A spacer a gyermekekhez nő | Csak akkor működik, ha a gyermekeknek explicit méretük van (pixel magasság vagy ismert arányos szülő). Ha a gyermekek szintén `Size To Content`, nulla magasságot kapsz |
| `GridSpacerWidget` cellaméretezés | A rács egységesen vezérli a cellaméretet | A gyermekek saját méretattribútumai figyelmen kívül maradnak -- a rács felülírja őket. A `size` beállítása egy rács gyermekén nincs hatása |
| `ScrollWidget` görgetési pozíció | A `VScrollToPos(0)` a tetejére görget | Gyermekek hozzáadása után lehet, hogy egy képkockával el kell halasztanod a `VScrollToPos()` hívását (a `CallLater` segítségével), mert a tartalom magassága még nem lett újraszámolva |
| Beágyazott spacerek | A spacerek szabadon beágyazhatók | Egy `WrapSpacer` egy `WrapSpacer`-ben működik, de a `Size To Content` mindkét szinten végtelen elrendezési ciklusokat okozhat, amelyek lefagyasztják az UI-t |

---

## Kompatibilitás és hatás

- **Több moddal:** A konténer widgetek layoutonkéntileg működnek és nem ütköznek modok között. Azonban ha két mod gyermekeket szúr be ugyanabba a vanilla `ScrollWidget`-be (`modded class` segítségével), a gyermekek sorrendje kiszámíthatatlan.
- **Teljesítmény:** A `WrapSpacerWidget.Update()` újraszámítja az összes gyermek pozícióját. 100+ elemű listáknál hívd meg az `Update()` metódust egyszer a kötegelt műveletek után, nem minden egyes hozzáadás után. A GridSpacer gyorsabb egységes rácsokhoz, mert a cellapozíciók aritmetikusan számítódnak.
- **Verzió:** A `WrapSpacerWidget` és a `GridSpacerWidget` a DayZ 1.0 óta elérhető. A `"Size To Content H/V"` attribútumok kezdettől fogva jelen voltak, de viselkedésük mélyen beágyazott layoutoknál a DayZ 1.10 körül stabilizálódott.

---

## Következő lépések

- [3.5 Programozott widget létrehozás](05-programmatic-widgets.md) -- Widgetek létrehozása kódból
- [3.6 Események kezelése](06-event-handling.md) -- Reagálás kattintásokra, változásokra és egyéb eseményekre
