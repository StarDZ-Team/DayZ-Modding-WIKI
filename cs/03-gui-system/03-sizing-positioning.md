# Kapitola 3.3: Rozměry a pozicování

[Domů](../../README.md) | [<< Předchozí: Formát souboru layoutu](02-layout-files.md) | **Rozměry a pozicování** | [Další: Kontejnerové widgety >>](04-containers.md)

---

Layoutový systém DayZ používá **duální souřadnicový režim** -- každý rozměr může být buď proporcionální (relativní k rodiči), nebo pixelový (absolutní pixely obrazovky). Nepochopení tohoto systému je příčinou číslo jedna chyb v rozložení. Tato kapitola ho důkladně vysvětluje.

---

## Základní koncept: Proporcionální vs. pixelový režim

Každý widget má pozici (`x, y`) a velikost (`width, height`). Každá z těchto čtyř hodnot může nezávisle být buď:

- **Proporcionální** (0.0 až 1.0) -- relativní k rozměrům rodičovského widgetu
- **Pixelová** (jakékoli kladné číslo) -- absolutní pixely obrazovky

Režim pro každou osu je řízen čtyřmi příznaky:

| Příznak | Řídí | `0` = Proporcionální | `1` = Pixelový |
|---|---|---|---|
| `hexactpos` | Pozice X | Zlomek šířky rodiče | Pixely zleva |
| `vexactpos` | Pozice Y | Zlomek výšky rodiče | Pixely shora |
| `hexactsize` | Šířka | Zlomek šířky rodiče | Šířka v pixelech |
| `vexactsize` | Výška | Zlomek výšky rodiče | Výška v pixelech |

To znamená, že můžete režimy volně kombinovat. Například widget může mít proporcionální šířku, ale pixelovou výšku -- velmi běžný vzor pro řádky a pruhy.

---

## Pochopení proporcionálního režimu

Když je příznak `0` (proporcionální), hodnota představuje **zlomek rozměru rodiče**:

- `size 1 1` s `hexactsize 0` a `vexactsize 0` znamená "100% šířky rodiče, 100% výšky rodiče" -- potomek vyplní rodiče.
- `size 0.5 0.3` znamená "50% šířky rodiče, 30% výšky rodiče."
- `position 0.5 0` s `hexactpos 0` znamená "začít na 50% šířky rodiče zleva."

Proporcionální režim je nezávislý na rozlišení. Widget se automaticky škáluje, když rodič změní velikost nebo když hra běží v jiném rozlišení.

```
// Widget, který vyplní levou polovinu svého rodiče
FrameWidgetClass LeftHalf {
 position 0 0
 size 0.5 1
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
}
```

---

## Pochopení pixelového režimu

Když je příznak `1` (pixelový/přesný), hodnota je v **pixelech obrazovky**:

- `size 200 40` s `hexactsize 1` a `vexactsize 1` znamená "200 pixelů široký, 40 pixelů vysoký."
- `position 10 10` s `hexactpos 1` a `vexactpos 1` znamená "10 pixelů od levé hrany rodiče, 10 pixelů od horní hrany rodiče."

Pixelový režim vám dává přesnou kontrolu, ale NEŠKÁLUJE se automaticky s rozlišením.

```
// Tlačítko s pevnou velikostí: 120x30 pixelů
ButtonWidgetClass MyButton {
 position 10 10
 size 120 30
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 text "Click Me"
}
```

---

## Kombinování režimů: Nejběžnější vzor

Skutečná síla přichází s kombinací proporcionálního a pixelového režimu. Nejběžnější vzor v profesionálních DayZ modech je:

**Proporcionální šířka, pixelová výška** -- pro pruhy, řádky a záhlaví.

```
// Řádek na celou šířku, přesně 30 pixelů vysoký
FrameWidgetClass Row {
 position 0 0
 size 1 30
 hexactpos 0
 vexactpos 0
 hexactsize 0        // Šířka: proporcionální (100% rodiče)
 vexactsize 1        // Výška: pixelová (30px)
}
```

**Proporcionální šířka a výška, pixelová pozice** -- pro vycentrované panely s pevným odsazením.

```
// Panel 60% x 70%, odsazený 0px od středu
FrameWidgetClass Dialog {
 position 0 0
 size 0.6 0.7
 halign center_ref
 valign center_ref
 hexactpos 1         // Pozice: pixelová (0px odsazení od středu)
 vexactpos 1
 hexactsize 0        // Velikost: proporcionální (60% x 70%)
 vexactsize 0
}
```

---

## Referenční body zarovnání: halign a valign

Atributy `halign` a `valign` mění **referenční bod** pro pozicování:

| Hodnota | Efekt |
|---|---|
| `left_ref` (výchozí) | Pozice se měří od levé hrany rodiče |
| `center_ref` | Pozice se měří od středu rodiče |
| `right_ref` | Pozice se měří od pravé hrany rodiče |
| `top_ref` (výchozí) | Pozice se měří od horní hrany rodiče |
| `center_ref` | Pozice se měří od středu rodiče |
| `bottom_ref` | Pozice se měří od spodní hrany rodiče |

V kombinaci s pixelovou pozicí (`hexactpos 1`) referenční body zarovnání trivializují centrování:

```
// Vycentrováno na obrazovce bez odsazení
FrameWidgetClass CenteredDialog {
 position 0 0
 size 0.4 0.5
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
}
```

S `center_ref` pozice `0 0` znamená "vycentrováno v rodiči." Pozice `10 0` znamená "10 pixelů napravo od středu."

### Prvky zarovnané vpravo

```
// Ikona připnutá k pravé hraně, 5px od hrany
ImageWidgetClass StatusIcon {
 position 5 5
 size 24 24
 halign right_ref
 valign top_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
}
```

### Prvky zarovnané dole

```
// Stavový pruh na spodku svého rodiče
FrameWidgetClass StatusBar {
 position 0 0
 size 1 30
 halign left_ref
 valign bottom_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 1
}
```

---

## KRITICKÉ: Žádné záporné hodnoty velikosti

**Nikdy nepoužívejte záporné hodnoty pro velikost widgetu v souborech layoutu.** Záporné velikosti způsobují nedefinované chování -- widgety se mohou stát neviditelnými, vykreslovat se nesprávně nebo způsobit pád UI systému. Pokud potřebujete widget skrýt, použijte místo toho `visible 0`.

Toto je jedna z nejběžnějších chyb v rozložení. Pokud se váš widget nezobrazuje, zkontrolujte, zda jste náhodou nenastavili zápornou hodnotu velikosti.

---

## Běžné vzory rozměrů

### Překryv na celou obrazovku

```
FrameWidgetClass Overlay {
 position 0 0
 size 1 1
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
}
```

### Vycentrovaný dialog (60% x 70%)

```
FrameWidgetClass Dialog {
 position 0 0
 size 0.6 0.7
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
}
```

### Boční panel zarovnaný vpravo (25% šířky)

```
FrameWidgetClass SidePanel {
 position 0 0
 size 0.25 1
 halign right_ref
 hexactpos 1
 vexactpos 0
 hexactsize 0
 vexactsize 0
}
```

### Horní pruh (celá šířka, pevná výška)

```
FrameWidgetClass TopBar {
 position 0 0
 size 1 40
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 1
}
```

### Odznak v pravém dolním rohu

```
FrameWidgetClass Badge {
 position 10 10
 size 80 24
 halign right_ref
 valign bottom_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
}
```

### Vycentrovaná ikona s pevnou velikostí

```
ImageWidgetClass Icon {
 position 0 0
 size 64 64
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
}
```

---

## Programatická pozice a velikost

V kódu můžete číst a nastavovat pozici a velikost pomocí proporcionálních i pixelových (obrazovkových) souřadnic:

```c
// Proporcionální souřadnice (rozsah 0-1)
float x, y, w, h;
widget.GetPos(x, y);           // Čtení proporcionální pozice
widget.SetPos(0.5, 0.1);      // Nastavení proporcionální pozice
widget.GetSize(w, h);          // Čtení proporcionální velikosti
widget.SetSize(0.3, 0.2);     // Nastavení proporcionální velikosti

// Pixelové/obrazovkové souřadnice
widget.GetScreenPos(x, y);     // Čtení pixelové pozice
widget.SetScreenPos(100, 50);  // Nastavení pixelové pozice
widget.GetScreenSize(w, h);    // Čtení pixelové velikosti
widget.SetScreenSize(400, 300);// Nastavení pixelové velikosti
```

Pro programatické vycentrování widgetu na obrazovce:

```c
int screen_w, screen_h;
GetScreenSize(screen_w, screen_h);

float w, h;
widget.GetScreenSize(w, h);
widget.SetScreenPos((screen_w - w) / 2, (screen_h - h) / 2);
```

---

## Atribut `scaled`

Když je nastaven `scaled 1`, widget respektuje nastavení škálování UI v DayZ (Nastavení > Video > Velikost HUD). To je důležité pro HUD prvky, které by se měly škálovat podle preference uživatele.

Bez `scaled` budou widgety s pixelovou velikostí mít stejnou fyzickou velikost bez ohledu na nastavení škálování UI.

---

## Atribut `fixaspect`

Použijte `fixaspect` pro zachování poměru stran widgetu:

- `fixaspect fixwidth` -- Výška se přizpůsobí pro zachování poměru stran na základě šířky
- `fixaspect fixheight` -- Šířka se přizpůsobí pro zachování poměru stran na základě výšky

Toto je primárně užitečné pro `ImageWidget` k prevenci zkreslení obrázku.

---

## Z-pořadí a priorita

Atribut `priority` řídí, které widgety se vykreslují navrch, když se překrývají. Vyšší hodnoty se vykreslují nad nižšími.

| Rozsah priority | Typické použití |
|----------------|-------------|
| 0-5 | Prvky pozadí, dekorativní panely |
| 10-50 | Běžné UI prvky, HUD komponenty |
| 50-100 | Překryvné prvky, plovoucí panely |
| 100-200 | Notifikace, tooltipy |
| 998-999 | Modální dialogy, blokující překryvy |

```
FrameWidget myBackground {
    priority 1
    // ...
}

FrameWidget myDialog {
    priority 999
    // ...
}
```

**Důležité:** Priorita ovlivňuje pouze pořadí vykreslování mezi sourozenci v rámci stejného rodiče. Vnořené potomky se vždy vykreslují nad svým rodičem bez ohledu na hodnoty priority.

---

## Ladění problémů s rozměry

Když se widget nezobrazuje tam, kde očekáváte:

1. **Zkontrolujte příznaky exact** -- Je `hexactsize` nastaveno na `0`, když jste mysleli pixely? Hodnota `200` v proporcionálním režimu znamená 200x šířka rodiče (daleko mimo obrazovku).
2. **Zkontrolujte záporné velikosti** -- Jakákoli záporná hodnota v `size` způsobí problémy.
3. **Zkontrolujte velikost rodiče** -- Proporcionální potomek rodiče s nulovou velikostí má nulovou velikost.
4. **Zkontrolujte `visible`** -- Widgety jsou výchozně viditelné, ale pokud je rodič skrytý, všichni potomci také.
5. **Zkontrolujte `priority`** -- Widget s nižší prioritou může být skrytý za jiným.
6. **Použijte `clipchildren`** -- Pokud má rodič `clipchildren 1`, potomci mimo jeho hranice nejsou viditelní.

---

## Osvědčené postupy

- Vždy specifikujte všechny čtyři příznaky exact explicitně (`hexactpos`, `vexactpos`, `hexactsize`, `vexactsize`). Jejich vynechání vede k nepředvídatelnému chování, protože výchozí hodnoty se liší mezi typy widgetů.
- Používejte vzor proporcionální šířka + pixelová výška pro řádky a pruhy. Toto je nejbezpečnější kombinace pro různá rozlišení a standard v profesionálních modech.
- Centrujte dialogy pomocí `halign center_ref` + `valign center_ref` + pixelová pozice `0 0`, ne s proporcionální pozicí `0.5 0.5`. Přístup s referenčním bodem zarovnání zůstává vycentrovaný bez ohledu na velikost widgetu.
- Vyhněte se pixelovým velikostem pro celoplošné nebo téměř celoplošné prvky. Používejte proporcionální rozměry, aby se UI přizpůsobilo jakémukoli rozlišení (1080p, 1440p, 4K).
- Při použití `SetScreenPos()` / `SetScreenSize()` v kódu je volejte poté, co je widget připojen ke svému rodiči. Volání před připojením může produkovat nesprávné souřadnice.

---

## Teorie vs. praxe

> Co říká dokumentace versus jak věci skutečně fungují za běhu.

| Koncept | Teorie | Realita |
|---------|--------|---------|
| Proporcionální rozměry | Hodnoty 0.0-1.0 se škálují relativně k rodiči | Pokud má rodič pixelovou velikost, proporcionální hodnoty potomka jsou relativní k této pixelové hodnotě, ne k obrazovce -- potomek 200px širokého rodiče s `size 0.5` je 100px |
| Zarovnání `center_ref` | Widget se vycentruje v rámci rodiče | Levý horní roh widgetu se umístí do středového bodu -- widget visí napravo a dolů od středu, pokud pozice není `0 0` v pixelovém režimu |
| Z-pořadí `priority` | Vyšší hodnoty se vykreslují navrch | Priorita ovlivňuje pouze sourozence ve stejném rodiči. Potomek se vždy vykresluje nad svým rodičem bez ohledu na hodnoty priority |
| Atribut `scaled` | Widget respektuje nastavení velikosti HUD | Ovlivňuje pouze rozměry v pixelovém režimu. Proporcionální rozměry se již škálují s rodičem a příznak `scaled` ignorují |
| Záporné hodnoty pozice | Měly by odsadit v opačném směru | Funguje pro pozici (odsazení vlevo/nahoru od referenčního bodu), ale záporné hodnoty velikosti způsobují nedefinované chování vykreslování -- nikdy je nepoužívejte |

---

## Kompatibilita a dopad

- **Více modů:** Rozměry a pozicování jsou per-widget a nemohou kolidovat mezi mody. Nicméně mody, které používají celoplošné překryvy (`size 1 1` na kořeni) s `priority 999`, mohou blokovat UI prvky jiných modů v přijímání vstupu.
- **Výkon:** Proporcionální rozměry vyžadují přepočet relativně k rodiči každý snímek pro animované nebo dynamické widgety. Pro statické rozložení není měřitelný rozdíl mezi proporcionálním a pixelovým režimem.
- **Verze:** Duální souřadnicový systém (proporcionální vs. pixelový) je stabilní od DayZ 0.63 Experimental. Chování atributu `scaled` bylo upřesněno v DayZ 1.14 pro lepší respektování posuvníku velikosti HUD.

---

## Další kroky

- [3.4 Kontejnerové widgety](04-containers.md) -- Jak spacery a scroll widgety zpracovávají rozložení automaticky
- [3.5 Programatické vytváření widgetů](05-programmatic-widgets.md) -- Nastavení velikosti a pozice z kódu
