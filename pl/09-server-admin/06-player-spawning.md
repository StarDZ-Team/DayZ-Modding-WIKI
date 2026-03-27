# Chapter 9.6: Spawn graczy

[Strona glowna](../README.md) | [<< Poprzedni: Spawn pojazdow](05-vehicle-spawning.md) | [Dalej: Trwalosc danych >>](07-persistence.md)

---

> **Podsumowanie:** Lokalizacje spawnu graczy sa kontrolowane przez **cfgplayerspawnpoints.xml** (bable pozycji) i **init.c** (startowy ekwipunek). Ten rozdzial omawia oba pliki z prawdziwymi vanillowymi wartosciami z Chernarusa.

---

## Spis tresci

- [Przeglad cfgplayerspawnpoints.xml](#przeglad-cfgplayerspawnpointsxml)
- [Parametry spawnu](#parametry-spawnu)
- [Parametry generatora](#parametry-generatora)
- [Parametry grup](#parametry-grup)
- [Bable swiezego spawnu](#bable-swiezego-spawnu)
- [Spawny hopowe](#spawny-hopowe)
- [init.c -- Startowy ekwipunek](#initc----startowy-ekwipunek)
- [Dodawanie niestandardowych punktow spawnu](#dodawanie-niestandardowych-punktow-spawnu)
- [Typowe bledy](#typowe-bledy)

---

## Przeglad cfgplayerspawnpoints.xml

Ten plik znajduje sie w folderze misji (np. `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Ma dwie sekcje, kazda z wlasnymi parametrami i bablami pozycji:

- **`<fresh>`** -- zupelnie nowe postacie (pierwsze zycie lub po smierci)
- **`<hop>`** -- server hoperzy (gracz mial postac na innym serwerze)

---

## Parametry spawnu

Vanillowe wartosci swiezego spawnu:

```xml
<spawn_params>
    <min_dist_infected>30</min_dist_infected>
    <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>
    <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
</spawn_params>
```

| Parametr | Wartosc | Znaczenie |
|----------|---------|-----------|
| `min_dist_infected` | 30 | Gracz musi pojawic sie co najmniej 30m od najblizszego zarazonego |
| `max_dist_infected` | 70 | Jesli nie istnieje pozycja 30m+ dalej, akceptuj do 70m jako zakres awaryjny |
| `min_dist_player` | 65 | Gracz musi pojawic sie co najmniej 65m od jakiegokolwiek innego gracza |
| `max_dist_player` | 150 | Zakres awaryjny -- akceptuj pozycje do 150m od innych graczy |
| `min_dist_static` | 0 | Minimalna odleglosc od statycznych obiektow (budynki, sciany) |
| `max_dist_static` | 2 | Maksymalna odleglosc od statycznych obiektow -- trzyma graczy blisko budowli |

Silnik najpierw probuje `min_dist_*`; jesli nie istnieje prawidlowa pozycja, luzuje wymagania w kierunku `max_dist_*`.

---

## Parametry generatora

Generator tworzy siatke pozycji kandydackich wokol kazdego babla:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
</generator_params>
```

| Parametr | Wartosc | Znaczenie |
|----------|---------|-----------|
| `grid_density` | 4 | Odstep miedzy punktami siatki w metrach -- nizsza wartosc = wiecej kandydatow, wyzszy koszt CPU |
| `grid_width` | 200 | Siatka rozciaga sie na 200m na osi X wokol srodka babla |
| `grid_height` | 200 | Siatka rozciaga sie na 200m na osi Z wokol srodka babla |
| `min_steepness` / `max_steepness` | -45 / 45 | Zakres nachylenia terenu w stopniach -- odrzuca klify i strome wzgorza |

Kazdy babel otrzymuje siatke 200x200m z punktem co 4m (~2500 kandydatow). Silnik filtruje po nachyleniu i odleglosci od obiektow statycznych, a nastepnie stosuje `spawn_params` w momencie spawnu.

#### Parametr `allow_in_water` (1.28+)

Od DayZ 1.28 do `generator_params` dodano nowy parametr logiczny `allow_in_water` (domyślnie: `false`). Gdy ustawiony na `true`, generator punktów spawnu uznaje pozycje w wodzie za prawidłowe punkty spawnu:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
    <allow_in_water>false</allow_in_water>
</generator_params>
```

Domyślnie silnik odrzuca każdą pozycję kandydacką, która wypada w wodzie (stawy, rzeki, ocean). Ustawienie `allow_in_water` na `true` usuwa ten filtr. Jest to przydatne głównie dla niestandardowych map ze spawnami na wyspach lub scenariuszy, w których spawny w wodzie przybrzeżnej są zamierzone. Dla większości serwerów pozostaw wartość `false`, aby uniknąć spawnowania graczy w jeziorach lub oceanie.

---

## Parametry grup

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Parametr | Wartosc | Znaczenie |
|----------|---------|-----------|
| `enablegroups` | true | Bable pozycji sa organizowane w nazwane grupy |
| `groups_as_regular` | true | Grupy sa traktowane jako zwykle punkty spawnu (kazda grupa moze byc wybrana) |
| `lifetime` | 240 | Sekundy zanim uzyta pozycja spawnu stanie sie ponownie dostepna |
| `counter` | -1 | Ile razy punkt spawnu moze byc uzyty. -1 = bez limitu |

Uzyta pozycja jest zablokowana na 240 sekund, zapobiegajac pojawieniu sie dwoch graczy na sobie.

---

## Bable swiezego spawnu

Vanillowy Chernarus definiuje 11 grup wzdluz wybrzeza dla swiezych spawnow. Kazda grupa skupia 3-8 pozycji wokol miasta:

| Grupa | Pozycje | Obszar |
|-------|---------|--------|
| WestCherno | 4 | Zachodnia strona Chernogorska |
| EastCherno | 4 | Wschodnia strona Chernogorska |
| WestElektro | 5 | Zachodni Elektrozawodsk |
| EastElektro | 4 | Wschodni Elektrozawodsk |
| Kamyshovo | 5 | Wybrzeze Kamyszowo |
| Solnechny | 5 | Okolice fabryki Solniecznego |
| Orlovets | 4 | Miedzy Solniecznym a Nizhnoe |
| Nizhnee | 4 | Wybrzeze Nizhnoe |
| SouthBerezino | 3 | Poludniowe Berezino |
| NorthBerezino | 8 | Polnocne Berezino + rozszerzone wybrzeze |
| Svetlojarsk | 3 | Port Swietlojarsk |

### Prawdziwe przyklady grup

```xml
<generator_posbubbles>
    <group name="WestCherno">
        <pos x="6063.018555" z="1931.907227" />
        <pos x="5933.964844" z="2171.072998" />
        <pos x="6199.782715" z="2241.805176" />
        <pos x="13552.5654" z="5955.893066" />
    </group>
    <group name="WestElektro">
        <pos x="8747.670898" z="2357.187012" />
        <pos x="9363.6533" z="2017.953613" />
        <pos x="9488.868164" z="1898.900269" />
        <pos x="9675.2216" z="1817.324585" />
        <pos x="9821.274414" z="2194.003662" />
    </group>
    <group name="Kamyshovo">
        <pos x="11830.744141" z="3400.428955" />
        <pos x="11930.805664" z="3484.882324" />
        <pos x="11961.211914" z="3419.867676" />
        <pos x="12222.977539" z="3454.867188" />
        <pos x="12336.774414" z="3503.847168" />
    </group>
</generator_posbubbles>
```

Wspolrzedne uzywaja `x` (wschod-zachod) i `z` (polnoc-poludnie). Os Y (wysokosc) jest obliczana automatycznie z mapy wysokosci terenu.

---

## Spawny hopowe

Spawny hopowe sa bardziej liberalne pod wzgledem odleglosci od graczy i uzywaja mniejszych siatek:

```xml
<!-- Roznice spawn_params hopowych od swiezych -->
<min_dist_player>25.0</min_dist_player>   <!-- swieze: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- swieze: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- swieze: 0 -->

<!-- Roznice generator_params hopowych -->
<grid_width>150</grid_width>              <!-- swieze: 200 -->
<grid_height>150</grid_height>            <!-- swieze: 200 -->

<!-- Roznice group_params hopowych -->
<enablegroups>false</enablegroups>        <!-- swieze: true -->
<lifetime>360</lifetime>                  <!-- swieze: 240 -->
```

Grupy hopowe sa rozlozone **w glab ladu**: Balota (6), Cherno (5), Pusta (5), Kamyszowo (4), Solnieczny (5), Nizhnoe (6), Berezino (5), Olsha (4), Swietlojarsk (5), Dobroye (5). Przy `enablegroups=false` silnik traktuje wszystkie 50 pozycji jako plaska pule.

---

## init.c -- Startowy ekwipunek

Plik **init.c** w folderze misji kontroluje tworzenie postaci i startowy ekwipunek. Dwa nadpisania maja znaczenie:

- **`CreateCharacter`** -- wywoluje `GetGame().CreatePlayer()`. Silnik wybiera pozycje z **cfgplayerspawnpoints.xml** zanim to sie uruchomi; nie ustawiasz pozycji spawnu tutaj.
- **`StartingEquipSetup`** -- uruchamia sie po utworzeniu postaci. Gracz ma juz domyslne ubrania (koszula, jeansy, trampki). Ta metoda dodaje przedmioty startowe.

### Vanillowy StartingEquipSetup (Chernarus)

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 zdrowia

        itemEnt = itemClothing.GetInventory().CreateInInventory( "BandageDressing" );
        player.SetQuickBarEntityShortcut(itemEnt, 2);

        string chemlightArray[] = { "Chemlight_White", "Chemlight_Yellow", "Chemlight_Green", "Chemlight_Red" };
        int rndIndex = Math.RandomInt( 0, 4 );
        itemEnt = itemClothing.GetInventory().CreateInInventory( chemlightArray[rndIndex] );
        SetRandomHealth( itemEnt );
        player.SetQuickBarEntityShortcut(itemEnt, 1);

        rand = Math.RandomFloatInclusive( 0.0, 1.0 );
        if ( rand < 0.35 )
            itemEnt = player.GetInventory().CreateInInventory( "Apple" );
        else if ( rand > 0.65 )
            itemEnt = player.GetInventory().CreateInInventory( "Pear" );
        else
            itemEnt = player.GetInventory().CreateInInventory( "Plum" );
        player.SetQuickBarEntityShortcut(itemEnt, 3);
        SetRandomHealth( itemEnt );
    }

    itemClothing = player.FindAttachmentBySlotName( "Legs" );
    if ( itemClothing )
        SetRandomHealth( itemClothing );
}
```

Co to daje kazdemu graczowi: **BandageDressing** (pasek 3), losowy **Chemlight** (pasek 2), losowy owoc -- 35% Apple, 30% Plum, 35% Pear (pasek 1). `SetRandomHealth` ustawia 45-65% stanu na wszystkich przedmiotach.

### Dodawanie niestandardowego ekwipunku startowego

```c
// Dodaj po bloku owocu, wewnatrz sprawdzenia slotu Body
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Dodawanie niestandardowych punktow spawnu

Aby dodac niestandardowa grupe spawnu, edytuj sekcje `<fresh>` pliku **cfgplayerspawnpoints.xml**:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Kroki:

1. Otworz mape w grze lub uzyj iZurvive, aby znalezc wspolrzedne
2. Wybierz 3-5 pozycji rozlozonych na 100-200m w bezpiecznym obszarze (bez klifow, bez wody)
3. Dodaj blok `<group>` wewnatrz `<generator_posbubbles>`
4. Uzyj `x` dla wschod-zachod i `z` dla polnoc-poludnie -- silnik oblicza Y (wysokosc) z terenu
5. Zrestartuj serwer -- czyszczenie trwalosci nie jest wymagane

Dla zrownowazonych spawnow zachowaj co najmniej 4 pozycje na grupe, aby 240-sekundowa blokada nie zablokowala wszystkich pozycji, gdy wielu graczy zginie jednoczesnie.

---

## Typowe bledy

### Gracze pojawiaja sie w oceanie

Pomyliles `z` (polnoc-poludnie) z Y (wysokosc) lub uzyles wspolrzednych spoza zakresu 0-15360. Pozycje na wybrzezu maja niskie wartosci `z` (poludniowy brzeg). Sprawdz z iZurvive.

### Zbyt malo punktow spawnu

Przy zaledwie 2-3 pozycjach 240-sekundowa blokada powoduje skupianie sie. Vanilla uzywa 49 swiezych pozycji w 11 grupach. Cel to co najmniej 20 pozycji w 4+ grupach.

### Zapomnienie o sekcji hop

Pusta sekcja `<hop>` oznacza, ze server hoperzy pojawiaja sie na wspolrzednych 0,0,0 -- w oceanie na Chernarusie. Zawsze definiuj punkty hopowe, nawet jesli skopiujesz je z `<fresh>`.

### Punkty spawnu na stromym terenie

Generator odrzuca nachylenia powyzej 45 stopni. Jesli wszystkie niestandardowe pozycje sa na zboczach, nie istnieja prawidlowi kandydaci. Uzywaj plaskiego terenu blisko drog.

### Gracze zawsze pojawiaja sie w tym samym miejscu

Grupy z 1-2 pozycjami sa blokowane przez 240-sekundowy czas odnowienia. Dodaj wiecej pozycji na grupe.

---

[Strona glowna](../README.md) | [<< Poprzedni: Spawn pojazdow](05-vehicle-spawning.md) | [Dalej: Trwalosc danych >>](07-persistence.md)
