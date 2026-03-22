# 3.1. fejezet: Widget típusok

[Kezdőlap](../README.md) | **Widget típusok** | [Következő: Layout fájlok >>](02-layout-files.md)

---

A DayZ GUI rendszere widgetekre épül -- újrafelhasználható UI komponensekre, amelyek az egyszerű konténerektől a komplex interaktív vezérlőkig terjednek. Minden képernyőn látható elem egy widget, és a teljes katalógus ismerete elengedhetetlen a mod UI-k építéséhez.

Ez a fejezet az Enforce Scriptben elérhető összes widget típus teljes referenciáját nyújtja.

---

## Hogyan működnek a widgetek

A DayZ minden widgetje a `Widget` alaposztályból öröklődik. A widgetek szülő-gyermek fa struktúrában szerveződnek, ahol a gyökér jellemzően egy `WorkspaceWidget`, amelyet a `GetGame().GetWorkspace()` hívással kapunk meg.

Minden widget típusnak három azonosítója van:

| Azonosító | Példa | Használat |
|---|---|---|
| **Script osztály** | `TextWidget` | Kódreferenciák, típuskonverzió |
| **Layout osztály** | `TextWidgetClass` | `.layout` fájl deklarációk |
| **TypeID konstans** | `TextWidgetTypeID` | Programozott létrehozás a `CreateWidget()` segítségével |

A `.layout` fájlokban mindig a layout osztálynevet használjuk (amely `Class` végződésű). A szkriptekben a script osztálynévvel dolgozunk.

---

## Konténer / Elrendezés widgetek

A konténer widgetek gyermek widgeteket tartalmaznak és rendszereznek. Önmagukban nem jelenítenek meg tartalmat (kivéve a `PanelWidget`, amely színes téglalapot rajzol).

| Script osztály | Layout osztály | Cél |
|---|---|---|
| `Widget` | `WidgetClass` | Absztrakt alaposztály minden widgethez. Soha ne példányosítsd közvetlenül. |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | Gyökér munkaterület. A `GetGame().GetWorkspace()` hívással kapható meg. Widgetek programozott létrehozásához használatos. |
| `FrameWidget` | `FrameWidgetClass` | Általános célú konténer. A DayZ-ben leggyakrabban használt widget. |
| `PanelWidget` | `PanelWidgetClass` | Egyszínű téglalap. Háttérekhez, elválasztókhoz, szeparátorokhoz. |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | Folyam elrendezés. Gyermekeket sorban rendez el tördeléssel, kitöltéssel és margóval. |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | Rács elrendezés. Gyermekeket `Columns` és `Rows` által meghatározott rácsba rendezi. |
| `ScrollWidget` | `ScrollWidgetClass` | Görgethető nézet. Függőleges/vízszintes görgetést tesz lehetővé a gyermek tartalom számára. |
| `SpacerBaseWidget` | -- | Absztrakt alaposztály a `WrapSpacerWidget` és a `GridSpacerWidget` számára. |

### FrameWidget

A DayZ UI munkálója. Használd a `FrameWidget`-et alapértelmezett konténerként, amikor widgeteket kell csoportosítanod. Nincs vizuális megjelenése -- tisztán strukturális.

**Fő metódusok:**
- Minden alap `Widget` metódus (pozíció, méret, szín, gyermekek, jelzők)

**Mikor használd:** Szinte mindenhol. Kapcsolódó widgetek csoportosítása. Párbeszédablakok, panelek és HUD elemek gyökereként.

```c
// Frame widget keresése név alapján
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

Látható téglalap egyszínű kitöltéssel. A `FrameWidget`-tel ellentétben a `PanelWidget` ténylegesen rajzol valamit a képernyőre.

**Fő metódusok:**
- `SetColor(int argb)` -- Háttérszín beállítása
- `SetAlpha(float alpha)` -- Átlátszóság beállítása

**Mikor használd:** Szöveg mögötti háttér, színes elválasztók, fedő téglalapok, színezési rétegek.

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // Félig átlátszó fekete
```

### WrapSpacerWidget

Automatikusan rendezi a gyermekeket folyam elrendezésben. A gyermekek egymás után kerülnek elhelyezésre, és a következő sorba törnek, amikor a hely elfogy.

**Fő layout attribútumok:**
- `Padding` -- Belső kitöltés (pixelek)
- `Margin` -- Külső margó (pixelek)
- `"Size To Content H" 1` -- Szélesség átméretezése a gyermekekhez igazítva
- `"Size To Content V" 1` -- Magasság átméretezése a gyermekekhez igazítva
- `content_halign` -- A tartalom vízszintes igazítása (`left`, `center`, `right`)
- `content_valign` -- A tartalom függőleges igazítása (`top`, `center`, `bottom`)

**Mikor használd:** Dinamikus listák, címkefelhők, gomborsorok, bármilyen elrendezés ahol a gyermekeknek eltérő méretük van.

### GridSpacerWidget

Gyermekeket fix rácsba rendez. Minden cella egyenlő méretű.

**Fő layout attribútumok:**
- `Columns` -- Oszlopok száma
- `Rows` -- Sorok száma
- `Margin` -- Cellák közötti távolság
- `"Size To Content V" 1` -- Magasság átméretezése a tartalomhoz igazítva

**Mikor használd:** Tárgyrácsok, ikongalériák, egységes sorokkal rendelkező beállítási panelek.

### ScrollWidget

Görgethető nézetet biztosít olyan tartalomhoz, amely meghaladja a látható területet.

**Fő layout attribútumok:**
- `"Scrollbar V" 1` -- Függőleges görgetősáv engedélyezése
- `"Scrollbar H" 1` -- Vízszintes görgetősáv engedélyezése

**Fő metódusok:**
- `VScrollToPos(float pos)` -- Görgetés függőleges pozícióra
- `GetVScrollPos()` -- Aktuális függőleges görgetési pozíció lekérdezése
- `GetContentHeight()` -- Teljes tartalom magasságának lekérdezése
- `VScrollStep(int step)` -- Görgetés lépésértékkel

**Mikor használd:** Hosszú listák, konfigurációs panelek, chat ablakok, naplómegjelenítők.

---

## Megjelenítő widgetek

A megjelenítő widgetek tartalmat mutatnak a felhasználónak, de nem interaktívak.

| Script osztály | Layout osztály | Cél |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | Egysoros szövegmegjelenítés |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | Többsoros, csak olvasható szöveg |
| `RichTextWidget` | `RichTextWidgetClass` | Szöveg beágyazott képekkel (`<image>` címkék) |
| `ImageWidget` | `ImageWidgetClass` | Képmegjelenítés (imagesetekből vagy fájlokból) |
| `CanvasWidget` | `CanvasWidgetClass` | Programozható rajzfelület |
| `VideoWidget` | `VideoWidgetClass` | Videofájl lejátszás |
| `RTTextureWidget` | `RTTextureWidgetClass` | Textúrára renderelő felület |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | 3D jelenet render célpont |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | 3D DayZ tárgy előnézet |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | 3D játékos karakter előnézet |
| `MapWidget` | `MapWidgetClass` | Interaktív világtérkép |

### TextWidget

A leggyakoribb megjelenítő widget. Egyetlen sornyi szöveget mutat.

**Fő metódusok:**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // Stringet ad vissza
tw.GetTextSize(out int w, out int h);   // A renderelt szöveg pixel méretei
tw.SetTextExactSize(float size);        // Betűméret beállítása pixelben
tw.SetOutline(int size, int color);     // Szöveg körvonal hozzáadása
tw.GetOutlineSize();                    // int-et ad vissza
tw.GetOutlineColor();                   // int-et ad vissza (ARGB)
tw.SetColor(int argb);                  // Szöveg színe
```

**Fő layout attribútumok:** `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `"size to text h"`, `"size to text v"`, `wrap`.

### MultilineTextWidget

Több sor csak olvasható szöveget jelenít meg. A szöveg automatikusan törik a widget szélességének megfelelően.

**Mikor használd:** Leíró panelek, súgó szöveg, naplómegjelenítők.

### RichTextWidget

Támogatja a szövegbe ágyazott képeket `<image>` címkékkel. Szintén támogatja a szövegtördelést.

**Fő layout attribútumok:**
- `wrap 1` -- Szótördelés engedélyezése

**Használat szövegben:**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**Mikor használd:** Ikonos állapotszöveg, formázott üzenetek, beágyazott képekkel ellátott chat.

### ImageWidget

Képeket jelenít meg imageset sprite atlaszokból vagy fájlelérési utakról betöltve.

**Fő metódusok:**
```c
ImageWidget iw;
iw.SetImage(int index);                    // Váltás image0, image1 stb. között
iw.LoadImageFile(int slot, string path);   // Kép betöltése fájlból
iw.LoadMaskTexture(string path);           // Maszk textúra betöltése
iw.SetMaskProgress(float progress);        // 0-1 az áttörés/feltárás átmenetekhez
```

**Fő layout attribútumok:**
- `image0 "set:dayz_gui image:icon_refresh"` -- Kép egy imagesetből
- `mode blend` -- Keverési mód (`blend`, `additive`, `stretch`)
- `"src alpha" 1` -- Forrás alfa csatorna használata
- `stretch 1` -- Kép nyújtása a widget kitöltéséhez
- `"flip u" 1` -- Vízszintes tükrözés
- `"flip v" 1` -- Függőleges tükrözés

**Mikor használd:** Ikonok, logók, háttérképek, térkép jelölők, állapotjelzők.

### CanvasWidget

Rajzfelület, ahol programozottan tudsz vonalakat renderelni.

**Fő metódusok:**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**Mikor használd:** Egyéni grafikonok, csomópontok közötti összekötő vonalak, hibakeresési fedőrétegek.

### MapWidget

A teljes interaktív világtérkép. Támogatja a pásztázást, nagyítást és koordináta-konverziót.

**Fő metódusok:**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // Központosítás világ pozícióra
mw.GetMapPos();                        // Aktuális középpont pozíció
mw.SetScale(float scale);             // Nagyítási szint
mw.GetScale();                        // Aktuális nagyítás
mw.MapToScreen(vector world_pos);     // Világ koordináták képernyő koordinátákká
mw.ScreenToMap(vector screen_pos);    // Képernyő koordináták világ koordinátákká
```

**Mikor használd:** Küldetés térképek, GPS rendszerek, helyszínválasztók.

### ItemPreviewWidget

3D előnézetet renderel bármilyen DayZ leltár tárgyhoz.

**Mikor használd:** Leltár képernyők, zsákmány előnézetek, bolt felületek.

### PlayerPreviewWidget

3D előnézetet renderel a játékos karakter modelljéről.

**Mikor használd:** Karakterkészítő képernyők, felszerelés előnézet, öltöztető rendszerek.

### RTTextureWidget

Gyermekeit textúra felületre rendereli, nem közvetlenül a képernyőre.

**Mikor használd:** Minitérkép renderelés, kép-a-képben effektek, képernyőn kívüli UI kompozíció.

---

## Interaktív widgetek

Az interaktív widgetek reagálnak a felhasználói bevitelre és eseményeket váltanak ki.

| Script osztály | Layout osztály | Cél |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | Kattintható gomb |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | Logikai jelölőnégyzet |
| `EditBoxWidget` | `EditBoxWidgetClass` | Egysoros szövegbevitel |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | Többsoros szövegbevitel |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | Maszkolt jelszóbevitel |
| `SliderWidget` | `SliderWidgetClass` | Vízszintes csúszka vezérlő |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | Legördülő kiválasztás |
| `TextListboxWidget` | `TextListboxWidgetClass` | Kiválasztható sorok listája |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | Folyamatjelző |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | Minimális folyamatjelző |

### ButtonWidget

Az elsődleges interaktív vezérlő. Támogatja mind a pillanatnyi kattintás, mind a kapcsoló módot.

**Fő metódusok:**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // bool-t ad vissza (csak kapcsoló gomboknál)
bw.SetState(bool state);    // Kapcsoló állapot beállítása
```

**Fő layout attribútumok:**
- `text "Label"` -- Gomb felirat szövege
- `switch toggle` -- Kapcsoló gombbá teszi
- `style Default` -- Vizuális stílus

**Kiváltott események:** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

Logikai kapcsoló vezérlő.

**Fő metódusok:**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // bool-t ad vissza
cb.SetChecked(bool checked);    // Állapot beállítása
```

**Kiváltott események:** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

Egysoros szövegbeviteli mező.

**Fő metódusok:**
```c
EditBoxWidget eb;
eb.GetText();               // Stringet ad vissza
eb.SetText("default");      // Szövegtartalom beállítása
```

**Kiváltott események:** `OnChange(Widget w, int x, int y, bool finished)` -- a `finished` értéke `true`, amikor az Enter billentyűt megnyomják.

### SliderWidget

Vízszintes csúszka numerikus értékekhez.

**Fő metódusok:**
```c
SliderWidget sw;
sw.GetCurrent();            // float-ot ad vissza (0-1)
sw.SetCurrent(float val);   // Pozíció beállítása
```

**Fő layout attribútumok:**
- `"fill in" 1` -- Kitöltött sáv megjelenítése a fogantyú mögött
- `"listen to input" 1` -- Reagálás egér bemenetre

**Kiváltott események:** `OnChange(Widget w, int x, int y, bool finished)` -- a `finished` értéke `true`, amikor a felhasználó elengedi a csúszkát.

### XComboBoxWidget

Legördülő kiválasztási lista.

**Fő metódusok:**
```c
XComboBoxWidget xcb;
xcb.AddItem("Option A");
xcb.AddItem("Option B");
xcb.SetCurrentItem(0);         // Kiválasztás index alapján
xcb.GetCurrentItem();          // A kiválasztott indexet adja vissza
xcb.ClearAll();                // Összes elem eltávolítása
```

### TextListboxWidget

Görgethető szöveges sorok listája. Támogatja a kiválasztást és többoszlopos adatokat.

**Fő metódusok:**
```c
TextListboxWidget tlb;
tlb.AddItem("Row text", null, 0);   // szöveg, felhasználói adat, oszlop
tlb.GetSelectedRow();               // int-et ad vissza (-1 ha nincs kiválasztva)
tlb.SetRow(int row);                // Sor kiválasztása
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**Kiváltott események:** `OnItemSelected`

### ProgressBarWidget

Folyamatjelzőt jelenít meg.

**Fő metódusok:**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**Mikor használd:** Töltőcsíkok, életerő sávok, küldetés folyamat, lehűlési idő jelzők.

---

## Teljes TypeID referencia

Használd ezeket a konstansokat a `GetGame().GetWorkspace().CreateWidget()` függvénnyel a programozott widget létrehozáshoz:

```
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
MultilineEditBoxWidgetTypeID
RichTextWidgetTypeID
RenderTargetWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
SliderWidgetTypeID
TextListboxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
WorkspaceWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
```

---

## A megfelelő widget kiválasztása

| Szükségem van... | Használd ezt a widgetet |
|---|---|
| Widgetek csoportosítása (láthatatlanul) | `FrameWidget` |
| Színes téglalap rajzolása | `PanelWidget` |
| Szöveg megjelenítése | `TextWidget` |
| Többsoros szöveg megjelenítése | `MultilineTextWidget` vagy `RichTextWidget` `wrap 1` beállítással |
| Szöveg megjelenítése beágyazott ikonokkal | `RichTextWidget` |
| Kép/ikon megjelenítése | `ImageWidget` |
| Kattintható gomb létrehozása | `ButtonWidget` |
| Kapcsoló (be/ki) létrehozása | `CheckBoxWidget` vagy `ButtonWidget` `switch toggle` beállítással |
| Szövegbevitel elfogadása | `EditBoxWidget` |
| Többsoros szövegbevitel elfogadása | `MultilineEditBoxWidget` |
| Jelszó elfogadása | `PasswordEditBoxWidget` |
| Felhasználó számválasztása | `SliderWidget` |
| Felhasználó listából való választása | `XComboBoxWidget` (legördülő) vagy `TextListboxWidget` (látható lista) |
| Folyamat megjelenítése | `ProgressBarWidget` vagy `SimpleProgressBarWidget` |
| Gyermekek elrendezése folyamban | `WrapSpacerWidget` |
| Gyermekek elrendezése rácsban | `GridSpacerWidget` |
| Tartalom görgethetővé tétele | `ScrollWidget` |
| 3D tárgy modell megjelenítése | `ItemPreviewWidget` |
| Játékos modell megjelenítése | `PlayerPreviewWidget` |
| Világtérkép megjelenítése | `MapWidget` |
| Egyéni vonalak/alakzatok rajzolása | `CanvasWidget` |
| Textúrára renderelés | `RTTextureWidget` |

---

## Bevált gyakorlatok

- Használd a `FrameWidget`-et alapértelmezett konténerként. Csak akkor használj `PanelWidget`-et, amikor látható színes háttérre van szükséged.
- Részesítsd előnyben a `RichTextWidget`-et a `TextWidget`-tel szemben, ha később beágyazott ikonokra lehet szükséged -- a típusváltás egy meglévő layoutban fáradságos.
- Mindig ellenőrizd a null értéket a `FindAnyWidget()` és a `Cast()` után. A hiányzó widget nevek csendben `null`-t adnak vissza, és összeomlást okoznak a következő metódushívásnál.
- Használj `WrapSpacerWidget`-et dinamikus listákhoz és `GridSpacerWidget`-et fix rácsokhoz. Ne pozícionáld manuálisan a gyermekeket egy folyam elrendezésben.
- Kerüld a `CanvasWidget`-et éles UI-ban -- minden képkockánál újrarajzol és nincs kötegelt feldolgozása. Csak hibakeresési fedőrétegekhez használd.

---

## Elmélet vs. gyakorlat

| Fogalom | Elmélet | Valóság |
|---------|---------|---------|
| A `ScrollWidget` automatikusan görget a tartalomhoz | A görgetősáv megjelenik, amikor a tartalom meghaladja a határokat | A `VScrollToPos()` függvényt manuálisan kell hívnod az új tartalomhoz görgetéshez; a widget nem görget automatikusan gyermek hozzáadásakor |
| A `SliderWidget` folyamatos eseményeket vált ki | Az `OnChange` minden egyes pixel húzásnál aktiválódik | A `finished` paraméter `false` húzás közben és `true` elengedéskor; a nehéz logikát csak a `finished == true` esetén frissítsd |
| Az `XComboBoxWidget` sok elemet támogat | A legördülő bármennyi elemmel működik | A teljesítmény észrevehetően romlik 100+ elemnél; használj inkább `TextListboxWidget`-et hosszú listákhoz |
| Az `ItemPreviewWidget` bármilyen tárgyat megjelenít | Adj meg bármilyen osztálynevet 3D előnézethez | A widget megköveteli, hogy a tárgy `.p3d` modellje betöltve legyen; moddolt tárgyakhoz az adat PBO-nak jelen kell lennie |
| A `MapWidget` egyszerű megjelenítő | Csak a térképet mutatja | Alapértelmezés szerint minden egér bemenetet elfog; gondosan kell kezelned az `IGNOREPOINTER` jelzőket, különben blokkolja a kattintásokat az átfedő widgeteken |

---

## Kompatibilitás és hatás

- **Több moddal:** A widget típus azonosítók motorkonstansok, amelyeket minden mod megoszt. Két mod, amely azonos nevű widgeteket hoz létre ugyanazon szülő alatt, ütközni fog. Használj egyedi widget neveket a mod előtagoddal.
- **Teljesítmény:** A `TextListboxWidget` és a `ScrollWidget` százas nagyságrendű gyermekekkel képkocka-eséseket okoz. Készíts widget készletet és hasznosítsd újra a widgeteket az 50 elemet meghaladó listáknál.

---

## Következő lépések

- [3.2 Layout fájl formátum](02-layout-files.md) -- Tanuld meg, hogyan definiálj widget fákat `.layout` fájlokban
- [3.5 Programozott widget létrehozás](05-programmatic-widgets.md) -- Widgetek létrehozása kódból layout fájlok helyett
