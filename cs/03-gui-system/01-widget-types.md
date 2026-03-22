# Kapitola 3.1: Typy widgetů

[Domů](../README.md) | **Typy widgetů** | [Další: Soubory layoutů >>](02-layout-files.md)

---

GUI systém DayZ je postaven na widgetech -- znovupoužitelných UI komponentách, které sahají od jednoduchých kontejnerů až po složité interaktivní ovládací prvky. Každý viditelný prvek na obrazovce je widget a pochopení celého katalogu je nezbytné pro tvorbu UI modů.

Tato kapitola poskytuje kompletní referenci všech typů widgetů dostupných v Enforce Scriptu.

---

## Jak widgety fungují

Každý widget v DayZ dědí ze základní třídy `Widget`. Widgety jsou organizovány ve stromové struktuře rodič-potomek, kde kořenem je typicky `WorkspaceWidget` získaný přes `GetGame().GetWorkspace()`.

Každý typ widgetu má tři přidružené identifikátory:

| Identifikátor | Příklad | Použití |
|---|---|---|
| **Skriptová třída** | `TextWidget` | Reference v kódu, přetypování |
| **Layoutová třída** | `TextWidgetClass` | Deklarace v `.layout` souborech |
| **Konstanta TypeID** | `TextWidgetTypeID` | Programatické vytváření pomocí `CreateWidget()` |

V `.layout` souborech vždy používáte název layoutové třídy (končící na `Class`). Ve skriptech pracujete s názvem skriptové třídy.

---

## Kontejnerové / layoutové widgety

Kontejnerové widgety drží a organizují potomkovské widgety. Samy o sobě nezobrazují obsah (s výjimkou `PanelWidget`, který vykresluje barevný obdélník).

| Skriptová třída | Layoutová třída | Účel |
|---|---|---|
| `Widget` | `WidgetClass` | Abstraktní základní třída pro všechny widgety. Nikdy neinstancujte přímo. |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | Kořenový workspace. Získáte přes `GetGame().GetWorkspace()`. Slouží k programatickému vytváření widgetů. |
| `FrameWidget` | `FrameWidgetClass` | Univerzální kontejner. Nejpoužívanější widget v DayZ. |
| `PanelWidget` | `PanelWidgetClass` | Jednobarevný obdélník. Používejte pro pozadí, oddělovače, separátory. |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | Proudové rozložení. Řadí potomky sekvenčně se zalamováním, odsazením a okraji. |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | Mřížkové rozložení. Řadí potomky do mřížky definované parametry `Columns` a `Rows`. |
| `ScrollWidget` | `ScrollWidgetClass` | Posuvný viewport. Umožňuje vertikální/horizontální posouvání obsahu potomků. |
| `SpacerBaseWidget` | -- | Abstraktní základní třída pro `WrapSpacerWidget` a `GridSpacerWidget`. |

### FrameWidget

Hlavní pracovní nástroj UI DayZ. Používejte `FrameWidget` jako výchozí kontejner, když potřebujete seskupit widgety dohromady. Nemá žádný vizuální vzhled -- je čistě strukturální.

**Klíčové metody:**
- Všechny základní metody `Widget` (pozice, velikost, barva, potomci, příznaky)

**Kdy použít:** Téměř všude. Obalujte skupiny souvisejících widgetů. Používejte jako kořen dialogů, panelů a HUD prvků.

```c
// Nalezení frame widgetu podle názvu
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

Viditelný obdélník s jednobarevnou výplní. Na rozdíl od `FrameWidget` `PanelWidget` skutečně vykresluje něco na obrazovku.

**Klíčové metody:**
- `SetColor(int argb)` -- Nastavení barvy pozadí
- `SetAlpha(float alpha)` -- Nastavení průhlednosti

**Kdy použít:** Pozadí za textem, barevné oddělovače, překryvné obdélníky, tónovací vrstvy.

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // Poloprůhledná černá
```

### WrapSpacerWidget

Automaticky rozmisťuje potomky v proudovém rozložení. Potomci jsou umísťováni jeden za druhým a při nedostatku místa se zalamují na další řádek.

**Klíčové atributy layoutu:**
- `Padding` -- Vnitřní odsazení (pixely)
- `Margin` -- Vnější okraj (pixely)
- `"Size To Content H" 1` -- Přizpůsobit šířku obsahu potomků
- `"Size To Content V" 1` -- Přizpůsobit výšku obsahu potomků
- `content_halign` -- Horizontální zarovnání obsahu (`left`, `center`, `right`)
- `content_valign` -- Vertikální zarovnání obsahu (`top`, `center`, `bottom`)

**Kdy použít:** Dynamické seznamy, oblaky štítků, řady tlačítek, jakékoli rozložení kde potomci mají různé velikosti.

### GridSpacerWidget

Rozmisťuje potomky do pevné mřížky. Každá buňka má stejnou velikost.

**Klíčové atributy layoutu:**
- `Columns` -- Počet sloupců
- `Rows` -- Počet řádků
- `Margin` -- Mezera mezi buňkami
- `"Size To Content V" 1` -- Přizpůsobit výšku obsahu

**Kdy použít:** Inventářové mřížky, galerie ikon, panely nastavení s uniformními řádky.

### ScrollWidget

Poskytuje posuvný viewport pro obsah, který přesahuje viditelnou oblast.

**Klíčové atributy layoutu:**
- `"Scrollbar V" 1` -- Povolit vertikální posuvník
- `"Scrollbar H" 1` -- Povolit horizontální posuvník

**Klíčové metody:**
- `VScrollToPos(float pos)` -- Posunutí na vertikální pozici
- `GetVScrollPos()` -- Získání aktuální vertikální pozice posunu
- `GetContentHeight()` -- Získání celkové výšky obsahu
- `VScrollStep(int step)` -- Posunutí o krokovou hodnotu

**Kdy použít:** Dlouhé seznamy, konfigurační panely, chatová okna, prohlížeče logů.

---

## Zobrazovací widgety

Zobrazovací widgety ukazují obsah uživateli, ale nejsou interaktivní.

| Skriptová třída | Layoutová třída | Účel |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | Jednořádkové zobrazení textu |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | Víceřádkový text pouze pro čtení |
| `RichTextWidget` | `RichTextWidgetClass` | Text s vloženými obrázky (tagy `<image>`) |
| `ImageWidget` | `ImageWidgetClass` | Zobrazení obrázku (z imagesetů nebo souborů) |
| `CanvasWidget` | `CanvasWidgetClass` | Programovatelná kreslicí plocha |
| `VideoWidget` | `VideoWidgetClass` | Přehrávání video souborů |
| `RTTextureWidget` | `RTTextureWidgetClass` | Povrch pro vykreslování do textury |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | Cíl vykreslování 3D scény |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | 3D náhled předmětu DayZ |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | 3D náhled modelu hráče |
| `MapWidget` | `MapWidgetClass` | Interaktivní mapa světa |

### TextWidget

Nejběžnější zobrazovací widget. Zobrazuje jeden řádek textu.

**Klíčové metody:**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // Vrací string
tw.GetTextSize(out int w, out int h);   // Rozměry vykreslovaného textu v pixelech
tw.SetTextExactSize(float size);        // Nastavení velikosti písma v pixelech
tw.SetOutline(int size, int color);     // Přidání obrysu textu
tw.GetOutlineSize();                    // Vrací int
tw.GetOutlineColor();                   // Vrací int (ARGB)
tw.SetColor(int argb);                  // Barva textu
```

**Klíčové atributy layoutu:** `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `"size to text h"`, `"size to text v"`, `wrap`.

### MultilineTextWidget

Zobrazuje více řádků textu pouze pro čtení. Text se automaticky zalamuje podle šířky widgetu.

**Kdy použít:** Panely s popisem, nápovědný text, zobrazení logů.

### RichTextWidget

Podporuje vložené obrázky v textu pomocí tagů `<image>`. Také podporuje zalamování textu.

**Klíčové atributy layoutu:**
- `wrap 1` -- Povolit zalamování slov

**Použití v textu:**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**Kdy použít:** Stavový text s ikonami, formátované zprávy, chat s vloženými obrázky.

### ImageWidget

Zobrazuje obrázky z imagesetových sprite sheetů nebo načtené ze souborových cest.

**Klíčové metody:**
```c
ImageWidget iw;
iw.SetImage(int index);                    // Přepnutí mezi image0, image1 atd.
iw.LoadImageFile(int slot, string path);   // Načtení obrázku ze souboru
iw.LoadMaskTexture(string path);           // Načtení maskové textury
iw.SetMaskProgress(float progress);        // 0-1 pro přechodové efekty odhalení
```

**Klíčové atributy layoutu:**
- `image0 "set:dayz_gui image:icon_refresh"` -- Obrázek z imagesetu
- `mode blend` -- Režim prolínání (`blend`, `additive`, `stretch`)
- `"src alpha" 1` -- Použít zdrojový alfa kanál
- `stretch 1` -- Roztáhnout obrázek na celý widget
- `"flip u" 1` -- Horizontální převrácení
- `"flip v" 1` -- Vertikální převrácení

**Kdy použít:** Ikony, loga, pozadí, mapové značky, stavové indikátory.

### CanvasWidget

Kreslicí plocha, na které můžete programaticky vykreslovat čáry.

**Klíčové metody:**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**Kdy použít:** Vlastní grafy, spojovací čáry mezi uzly, ladící překryvy.

### MapWidget

Kompletní interaktivní mapa světa. Podporuje posouvání, přibližování a konverzi souřadnic.

**Klíčové metody:**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // Vycentrování na pozici ve světě
mw.GetMapPos();                        // Aktuální pozice středu
mw.SetScale(float scale);             // Úroveň přiblížení
mw.GetScale();                        // Aktuální přiblížení
mw.MapToScreen(vector world_pos);     // Světové souřadnice na souřadnice obrazovky
mw.ScreenToMap(vector screen_pos);    // Souřadnice obrazovky na světové souřadnice
```

**Kdy použít:** Mapy misí, GPS systémy, výběr lokací.

### ItemPreviewWidget

Vykresluje 3D náhled jakéhokoli inventářového předmětu DayZ.

**Kdy použít:** Inventářové obrazovky, náhledy lupu, obchodní rozhraní.

### PlayerPreviewWidget

Vykresluje 3D náhled modelu postavy hráče.

**Kdy použít:** Obrazovky vytváření postavy, náhled vybavení, systémy šatníku.

### RTTextureWidget

Vykresluje své potomky na texturový povrch místo přímo na obrazovku.

**Kdy použít:** Vykreslování minimapy, efekty obraz v obraze, mimoscénová kompozice UI.

---

## Interaktivní widgety

Interaktivní widgety reagují na uživatelský vstup a vyvolávají události.

| Skriptová třída | Layoutová třída | Účel |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | Klikací tlačítko |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | Booleovský checkbox |
| `EditBoxWidget` | `EditBoxWidgetClass` | Jednořádkový textový vstup |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | Víceřádkový textový vstup |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | Maskovaný vstup hesla |
| `SliderWidget` | `SliderWidgetClass` | Horizontální posuvník |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | Rozbalovací výběr |
| `TextListboxWidget` | `TextListboxWidgetClass` | Seznam s volitelnými řádky |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | Indikátor průběhu |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | Minimální indikátor průběhu |

### ButtonWidget

Primární interaktivní ovládací prvek. Podporuje jak okamžitý klik, tak přepínací režim.

**Klíčové metody:**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // Vrací bool (pouze přepínací tlačítka)
bw.SetState(bool state);    // Nastavení stavu přepnutí
```

**Klíčové atributy layoutu:**
- `text "Label"` -- Text popisku tlačítka
- `switch toggle` -- Změnit na přepínací tlačítko
- `style Default` -- Vizuální styl

**Vyvolávané události:** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

Booleovský přepínací ovládací prvek.

**Klíčové metody:**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // Vrací bool
cb.SetChecked(bool checked);    // Nastavení stavu
```

**Vyvolávané události:** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

Jednořádkové vstupní textové pole.

**Klíčové metody:**
```c
EditBoxWidget eb;
eb.GetText();               // Vrací string
eb.SetText("default");      // Nastavení textového obsahu
```

**Vyvolávané události:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` je `true` při stisknutí Enter.

### SliderWidget

Horizontální posuvník pro číselné hodnoty.

**Klíčové metody:**
```c
SliderWidget sw;
sw.GetCurrent();            // Vrací float (0-1)
sw.SetCurrent(float val);   // Nastavení pozice
```

**Klíčové atributy layoutu:**
- `"fill in" 1` -- Zobrazit vyplněnou dráhu za jezdcem
- `"listen to input" 1` -- Reagovat na vstup myši

**Vyvolávané události:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` je `true` když uživatel pustí posuvník.

### XComboBoxWidget

Rozbalovací výběrový seznam.

**Klíčové metody:**
```c
XComboBoxWidget xcb;
xcb.AddItem("Option A");
xcb.AddItem("Option B");
xcb.SetCurrentItem(0);         // Výběr podle indexu
xcb.GetCurrentItem();          // Vrací vybraný index
xcb.ClearAll();                // Odstranění všech položek
```

### TextListboxWidget

Posuvný seznam textových řádků. Podporuje výběr a vícesloupcová data.

**Klíčové metody:**
```c
TextListboxWidget tlb;
tlb.AddItem("Row text", null, 0);   // text, userData, sloupec
tlb.GetSelectedRow();               // Vrací int (-1 pokud nic)
tlb.SetRow(int row);                // Výběr řádku
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**Vyvolávané události:** `OnItemSelected`

### ProgressBarWidget

Zobrazuje indikátor průběhu.

**Klíčové metody:**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**Kdy použít:** Ukazatele načítání, ukazatele zdraví, průběh misí, indikátory přebíjení.

---

## Kompletní reference TypeID

Tyto konstanty použijte s `GetGame().GetWorkspace().CreateWidget()` pro programatické vytváření widgetů:

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

## Výběr správného widgetu

| Potřebuji... | Použít tento widget |
|---|---|
| Seskupit widgety dohromady (neviditelně) | `FrameWidget` |
| Nakreslit barevný obdélník | `PanelWidget` |
| Zobrazit text | `TextWidget` |
| Zobrazit víceřádkový text | `MultilineTextWidget` nebo `RichTextWidget` s `wrap 1` |
| Zobrazit text s vloženými ikonami | `RichTextWidget` |
| Zobrazit obrázek/ikonu | `ImageWidget` |
| Vytvořit klikací tlačítko | `ButtonWidget` |
| Vytvořit přepínač (zapnuto/vypnuto) | `CheckBoxWidget` nebo `ButtonWidget` s `switch toggle` |
| Přijmout textový vstup | `EditBoxWidget` |
| Přijmout víceřádkový textový vstup | `MultilineEditBoxWidget` |
| Přijmout heslo | `PasswordEditBoxWidget` |
| Nechat uživatele vybrat číslo | `SliderWidget` |
| Nechat uživatele vybrat ze seznamu | `XComboBoxWidget` (rozbalovací) nebo `TextListboxWidget` (viditelný seznam) |
| Zobrazit průběh | `ProgressBarWidget` nebo `SimpleProgressBarWidget` |
| Uspořádat potomky v proudu | `WrapSpacerWidget` |
| Uspořádat potomky v mřížce | `GridSpacerWidget` |
| Umožnit posouvání obsahu | `ScrollWidget` |
| Zobrazit 3D model předmětu | `ItemPreviewWidget` |
| Zobrazit model hráče | `PlayerPreviewWidget` |
| Zobrazit mapu světa | `MapWidget` |
| Kreslit vlastní čáry/tvary | `CanvasWidget` |
| Vykreslovat do textury | `RTTextureWidget` |

---

## Další kroky

- [3.2 Formát souboru layoutu](02-layout-files.md) -- Naučte se definovat stromy widgetů v `.layout` souborech
- [3.5 Programatické vytváření widgetů](05-programmatic-widgets.md) -- Vytváření widgetů z kódu místo souborů layoutu

---

## Osvědčené postupy

- Používejte `FrameWidget` jako výchozí kontejner. `PanelWidget` používejte pouze tehdy, když potřebujete viditelné barevné pozadí.
- Upřednostňujte `RichTextWidget` před `TextWidget`, když byste mohli později potřebovat vložené ikony -- přepínání typů v existujícím layoutu je pracné.
- Vždy kontrolujte null po `FindAnyWidget()` a `Cast()`. Chybějící názvy widgetů tiše vrátí `null` a způsobí pád při dalším volání metody.
- Používejte `WrapSpacerWidget` pro dynamické seznamy a `GridSpacerWidget` pro pevné mřížky. Nerozesťávejte potomky ručně v proudovém rozložení.
- Vyhněte se `CanvasWidget` pro produkční UI -- překresluje se každý snímek a nemá dávkování. Používejte ho pouze pro ladící překryvy.

---

## Teorie vs. praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `ScrollWidget` automaticky posouvá k obsahu | Posuvník se objeví, když obsah přesáhne hranice | Musíte ručně volat `VScrollToPos()` pro posunutí k novému obsahu; widget se automaticky neposouvá při přidání potomka |
| `SliderWidget` vyvolává průběžné události | `OnChange` se vyvolá při každém pixelu tažení | Parametr `finished` je `false` během tažení a `true` při uvolnění; aktualizujte náročnou logiku pouze když `finished == true` |
| `XComboBoxWidget` podporuje mnoho položek | Rozbalovací seznam funguje s jakýmkoli počtem | Výkon se znatelně zhoršuje u 100+ položek; pro dlouhé seznamy místo toho použijte `TextListboxWidget` |
| `ItemPreviewWidget` zobrazuje jakýkoli předmět | Předejte jakýkoli classname pro 3D náhled | Widget vyžaduje načtený `.p3d` model předmětu; modované předměty potřebují přítomné datové PBO |
| `MapWidget` je jednoduchý displej | Pouze zobrazuje mapu | Zachycuje veškerý vstup myši ve výchozím nastavení; musíte pečlivě spravovat příznaky `IGNOREPOINTER`, jinak blokuje klikání na překrývající se widgety |

---

## Kompatibilita a dopad

- **Více modů:** ID typů widgetů jsou konstanty enginu sdílené všemi mody. Dva mody vytvářející widgety se stejným názvem pod stejným rodičem budou kolidovat. Používejte unikátní názvy widgetů s prefixem vašeho modu.
- **Výkon:** `TextListboxWidget` a `ScrollWidget` se stovkami potomků způsobují propady snímkové frekvence. Pro seznamy přesahující 50 položek widgety sdružujte a recyklujte.
