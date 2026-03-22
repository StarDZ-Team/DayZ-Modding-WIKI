# Kapitola 4.4: Zvuk (.ogg, .wss)

[Domů](../README.md) | [<< Předchozí: Materiály](03-materials.md) | **Zvuk** | [Další: DayZ Tools Workflow >>](05-dayz-tools.md)

---

## Úvod

Zvukový design je jedním z nejimerzivnějších aspektů moddingu DayZ. Od prasknutí pušky po okolní vítr v lese, zvuk oživuje herní svět. DayZ používá **OGG Vorbis** jako svůj primární zvukový formát a konfiguruje přehrávání zvuku prostřednictvím vrstveného systému **CfgSoundShaders** a **CfgSoundSets** definovaných v `config.cpp`. Pochopení tohoto pipeline -- od surového zvukového souboru po prostorový zvuk ve hře -- je nezbytné pro jakýkoli mod, který zavádí vlastní zbraně, vozidla, okolní efekty nebo zpětnou vazbu UI.

Tato kapitola pokrývá zvukové formáty, konfigurací řízený zvukový systém, 3D polohový zvuk, útlum hlasitosti a vzdálenosti, smyčkování a kompletní pracovní postup pro přidání vlastních zvuků do DayZ modu.

---

## Obsah

- [Zvukové formáty](#zvukové-formáty)
- [CfgSoundShaders a CfgSoundSets](#cfgsoundshaders-a-cfgsoundsets)
- [Kategorie zvuků](#kategorie-zvuků)
- [3D polohový zvuk](#3d-polohový-zvuk)
- [Hlasitost a útlum vzdáleností](#hlasitost-a-útlum-vzdáleností)
- [Smyčkové zvuky](#smyčkové-zvuky)
- [Přidání vlastních zvuků do modu](#přidání-vlastních-zvuků-do-modu)
- [Nástroje pro produkci zvuku](#nástroje-pro-produkci-zvuku)
- [Časté chyby](#časté-chyby)
- [Osvědčené postupy](#osvědčené-postupy)

---

## Zvukové formáty

### OGG Vorbis (primární formát)

**OGG Vorbis** je primární zvukový formát DayZ. Všechny vlastní zvuky by měly být exportovány jako soubory `.ogg`.

| Vlastnost | Hodnota |
|----------|-------|
| **Přípona** | `.ogg` |
| **Kodek** | Vorbis (ztrátová komprese) |
| **Vzorkovací frekvence** | 44100 Hz (standard), 22050 Hz (přijatelné pro okolní zvuky) |
| **Bitová hloubka** | Řízeno enkodérem (nastavení kvality) |
| **Kanály** | Mono (pro 3D zvuky) nebo Stereo (pro hudbu/UI) |
| **Rozsah kvality** | -1 až 10 (5-7 doporučeno pro herní zvuk) |

### Klíčová pravidla pro OGG v DayZ

- **3D polohové zvuky MUSÍ být mono.** Pokud poskytnete stereo soubor pro 3D zvuk, engine ho nemusí správně prostorově umístit nebo může ignorovat jeden kanál.
- **UI a hudební zvuky mohou být stereo.** Nepolohové zvuky (menu, zpětná vazba HUD, hudba na pozadí) fungují správně ve stereu.
- **Vzorkovací frekvence by měla být 44100 Hz** pro většinu zvuků. Nižší frekvence (22050 Hz) lze použít pro vzdálené okolní zvuky k úspoře místa.

### WSS (starší formát)

**WSS** je starší zvukový formát ze starších titulů Bohemie (série Arma). DayZ stále může načítat soubory WSS, ale nové mody by měly používat výhradně OGG.

| Vlastnost | Hodnota |
|----------|-------|
| **Přípona** | `.wss` |
| **Stav** | Starší, nedoporučuje se pro nové mody |
| **Konverze** | Soubory WSS lze převést na OGG pomocí Audacity nebo podobných nástrojů |

Se soubory WSS se setkáte při zkoumání vanilla dat DayZ nebo při portování obsahu ze starších her Bohemie.

---

## CfgSoundShaders a CfgSoundSets

Zvukový systém DayZ používá dvouvrstvý konfigurační přístup definovaný v `config.cpp`. **SoundShader** definuje, jaký zvukový soubor přehrát a jak, zatímco **SoundSet** definuje, kde a jak je zvuk slyšet ve světě.

### Vztah

```
config.cpp
  |
  |--> CfgSoundShaders     (CO přehrát: soubor, hlasitost, frekvence)
  |      |
  |      |--> MyShader      odkazuje na --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         (JAK přehrát: 3D pozice, vzdálenost, prostorový)
         |
         |--> MySoundSet    odkazuje na --> MyShader
```

Herní kód a další konfigurace odkazují na **SoundSety**, nikdy přímo na SoundShadery. SoundSety jsou veřejné rozhraní; SoundShadery jsou implementační detail.

### CfgSoundShaders

SoundShader definuje surový zvukový obsah a základní parametry přehrávání:

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        // Pole zvukových souborů -- engine náhodně vybírá jeden
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {cesta (bez přípony), váha pravděpodobnosti}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;                          // Základní hlasitost (0.0 - 1.0)
        range = 300;                           // Maximální slyšitelná vzdálenost (metry)
        rangeCurve[] = {{0, 1.0}, {300, 0.0}}; // Křivka útlumu hlasitosti
    };
};
```

#### Vlastnosti SoundShaderu

| Vlastnost | Typ | Popis |
|----------|------|-------------|
| `samples[]` | pole | Seznam párů `{cesta, váha}`. Cesta vynechává příponu souboru. |
| `volume` | float | Základní násobič hlasitosti (0.0 až 1.0). |
| `range` | float | Maximální slyšitelná vzdálenost v metrech. |
| `rangeCurve[]` | pole | Pole bodů `{vzdálenost, hlasitost}` definujících útlum přes vzdálenost. |
| `frequency` | float | Násobič rychlosti přehrávání. 1.0 = normální, 0.5 = poloviční rychlost (nižší tón), 2.0 = dvojnásobná rychlost (vyšší tón). |

> **Důležité:** Cesta v `samples[]` NEOBSAHUJE příponu souboru. Engine připojí `.ogg` (nebo `.wss`) automaticky na základě toho, co najde na disku.

### CfgSoundSets

SoundSet obaluje jeden nebo více SoundShaderů a definuje prostorové a behaviorální vlastnosti:

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;          // Škálování hlasitosti (aplikováno nad hlasitost shaderu)
        frequencyFactor = 1.0;       // Škálování frekvence
        volumeCurve = "InverseSquare"; // Název předdefinované křivky útlumu
        spatial = 1;                  // 1 = 3D polohový, 0 = 2D (HUD/menu)
        doppler = 0;                  // 1 = povolit Dopplerův efekt
        loop = 0;                     // 1 = nepřetržitá smyčka
    };
};
```

#### Vlastnosti SoundSetu

| Vlastnost | Typ | Popis |
|----------|------|-------------|
| `soundShaders[]` | pole | Seznam názvů tříd SoundShaderů ke kombinaci. |
| `volumeFactor` | float | Další násobič hlasitosti aplikovaný nad hlasitost shaderu. |
| `frequencyFactor` | float | Další násobič frekvence/tónu. |
| `frequencyRandomizer` | float | Náhodná variace tónu (0.0 = žádná, 0.1 = +/- 10%). |
| `volumeCurve` | string | Pojmenovaná křivka útlumu: `"InverseSquare"`, `"Linear"`, `"Logarithmic"`. |
| `spatial` | int | `1` pro 3D polohový zvuk, `0` pro 2D (UI, hudba). |
| `doppler` | int | `1` pro povolení Dopplerova posunu tónu pro pohybující se zdroje. |
| `loop` | int | `1` pro nepřetržitou smyčku, `0` pro jednorázové přehrání. |
| `distanceFilter` | int | `1` pro aplikaci dolní propusti na dálku (ztlumené vzdálené zvuky). |
| `occlusionFactor` | float | Jak moc zdi/terén tlumí zvuk (0.0 až 1.0). |
| `obstructionFactor` | float | Jak moc překážky mezi zdrojem a posluchačem ovlivňují zvuk. |

---

## Kategorie zvuků

### Zvuky zbraní

Zvuky zbraní jsou nejsložitější zvuk v DayZ, typicky zahrnující více SoundSetů pro různé aspekty jednoho výstřelu:

```
Výstřel
  |--> SoundSet blízkého výstřelu    (rána slyšená nablízku)
  |--> SoundSet vzdáleného výstřelu  (dunění/ozvěna slyšená daleko)
  |--> SoundSet dozvuku              (reverb/ozvěna, která následuje)
  |--> SoundSet nadzvukového prasknutí (kulka prolétající nad hlavou)
  |--> SoundSet mechaniky            (cyklování závěru, vkládání zásobníku)
```

### Okolní zvuky

Zvuky prostředí pro atmosféru:

```cpp
class MyMod_Wind_SoundShader
{
    samples[] = {{"MyMod\sound\ambient\wind_loop", 1}};
    volume = 0.5;
    range = 50;
};

class MyMod_Wind_SoundSet
{
    soundShaders[] = {"MyMod_Wind_SoundShader"};
    volumeFactor = 0.6;
    spatial = 0;           // Nepolohový (okolní surround)
    loop = 1;              // Nepřetržitá smyčka
};
```

### UI zvuky

Zvuky zpětné vazby rozhraní (kliknutí tlačítek, notifikace):

```cpp
class MyMod_ButtonClick_SoundShader
{
    samples[] = {{"MyMod\sound\ui\click_01", 1}};
    volume = 0.7;
    range = 0;             // Nepotřebuje prostorový dosah
};

class MyMod_ButtonClick_SoundSet
{
    soundShaders[] = {"MyMod_ButtonClick_SoundShader"};
    volumeFactor = 0.8;
    spatial = 0;           // 2D -- přehrává se v hlavě posluchače
    loop = 0;
};
```

---

## 3D polohový zvuk

DayZ používá 3D prostorový zvuk k umisťování zvuků v herním světě. Když zbraň vystřelí 200 metrů nalevo od vás, slyšíte ji z levého reproduktoru/sluchátka s odpovídajícím snížením hlasitosti.

### Požadavky pro 3D zvuk

1. **Zvukový soubor musí být mono.** Stereo soubory se nebudou správně prostorově umisťovat.
2. **`spatial` SoundSetu musí být `1`.** To povolí systém 3D polohování.
3. **Zdroj zvuku musí mít pozici ve světě.** Engine potřebuje souřadnice pro výpočet směru a vzdálenosti.

### Spouštění 3D zvuků ze skriptu

```c
// Přehrání polohového zvuku na pozici ve světě
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// Přehrání zvuku připojeného k objektu (pohybuje se s ním)
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## Hlasitost a útlum vzdáleností

### Křivka dosahu

`rangeCurve[]` v SoundShaderu definuje, jak se hlasitost snižuje se vzdáleností. Je to pole párů `{vzdálenost, hlasitost}`:

```cpp
rangeCurve[] =
{
    {0, 1.0},       // Na 0m: plná hlasitost
    {50, 0.7},      // Na 50m: 70% hlasitosti
    {150, 0.3},     // Na 150m: 30% hlasitosti
    {300, 0.0}      // Na 300m: ticho
};
```

Engine interpoluje lineárně mezi definovanými body. Jakoukoliv křivku útlumu můžete vytvořit přidáním více kontrolních bodů.

### Předdefinované křivky hlasitosti

SoundSety mohou odkazovat na pojmenované křivky přes vlastnost `volumeCurve`:

| Název křivky | Chování |
|------------|----------|
| `"InverseSquare"` | Realistický útlum (hlasitost = 1/vzdálenost^2). Přirozeně znějící. |
| `"Linear"` | Rovnoměrný útlum od maxima k nule přes dosah. |
| `"Logarithmic"` | Hlasité zblízka, rychle klesá na střední vzdálenosti, pak se pomalu stlumí. |

---

## Smyčkové zvuky

Smyčkové zvuky se nepřetržitě opakují, dokud nejsou explicitně zastaveny. Používají se pro motory, okolní atmosféru, alarmy a jakýkoli trvalý zvuk.

### Konfigurace smyčkového zvuku

V SoundSetu:
```cpp
class MyMod_Alarm_SoundSet
{
    soundShaders[] = {"MyMod_Alarm_SoundShader"};
    spatial = 1;
    loop = 1;              // Povolení smyčky
};
```

### Smyčkování ze skriptu

```c
// Spuštění smyčkového zvuku
EffectSound m_AlarmSound;

void StartAlarm(vector position)
{
    if (!m_AlarmSound)
    {
        m_AlarmSound = SEffectManager.PlaySound("MyMod_Alarm_SoundSet", position);
    }
}

// Zastavení smyčkového zvuku
void StopAlarm()
{
    if (m_AlarmSound)
    {
        m_AlarmSound.Stop();
        m_AlarmSound = null;
    }
}
```

### Příprava zvukového souboru pro smyčky

Pro bezešvé smyčkování musí samotný zvukový soubor čistě smyčkovat:

1. **Průchod nulou na začátku a konci.** Průběh vlny by měl projít nulovou amplitudou na obou koncových bodech, aby se zabránilo kliknutí/prasknutí v bodě smyčky.
2. **Shodný začátek a konec.** Konec souboru by měl bezešvě navazovat na začátek.
3. **Žádný fade in/out.** Fade by byl slyšitelný při každé iteraci smyčky.
4. **Testujte smyčku v Audacity.** Vyberte celý klip, povolte přehrávání smyčky a poslouchejte, zda neslyšíte kliknutí nebo diskontinuity.

---

## Přidání vlastních zvuků do modu

### Kompletní pracovní postup

**Krok 1: Připravte zvukové soubory**
- Nahrajte nebo získejte svůj zvuk.
- Upravte v Audacity (nebo vašem preferovaném zvukovém editoru).
- Pro 3D zvuky: převeďte na mono.
- Exportujte jako OGG Vorbis (kvalita 5-7).
- Pojmenujte soubory popisně: `rifle_shot_01.ogg`, `rifle_shot_02.ogg`.

**Krok 2: Organizujte v adresáři modu**

```
MyMod/
  sound/
    weapons/
      rifle_shot_01.ogg
      rifle_shot_02.ogg
      rifle_shot_03.ogg
      rifle_tail_01.ogg
      rifle_tail_02.ogg
    ambient/
      wind_loop.ogg
    ui/
      click_01.ogg
      notification_01.ogg
  config.cpp
```

**Krok 3: Definujte SoundShadery v config.cpp**

```cpp
class CfgPatches
{
    class MyMod_Sounds
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Sounds_Effects"};
    };
};

class CfgSoundShaders
{
    class MyMod_RifleShot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 300;
        rangeCurve[] = {{0, 1.0}, {100, 0.6}, {200, 0.2}, {300, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_RifleShot_SoundSet
    {
        soundShaders[] = {"MyMod_RifleShot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

**Krok 4: Odkaz z konfigurace zbraně/předmětu**

Pro zbraně je SoundSet odkazován ve třídě konfigurace zbraně:

```cpp
class CfgWeapons
{
    class MyMod_Rifle: Rifle_Base
    {
        // ... ostatní konfigurace ...

        class Sounds
        {
            class Fire
            {
                soundSet = "MyMod_RifleShot_SoundSet";
            };
        };
    };
};
```

**Krok 5: Sestavte a testujte**
- Zabalte PBO (použijte `-packonly`, protože soubory OGG nepotřebují binarizaci).
- Spusťte hru s načteným modem.
- Testujte zvuk ve hře v různých vzdálenostech.

---

## Nástroje pro produkci zvuku

### Audacity (zdarma, open source)

Audacity je doporučený nástroj pro produkci zvuku DayZ:

- **Stažení:** [audacityteam.org](https://www.audacityteam.org/)
- **Export OGG:** File --> Export --> Export as OGG
- **Konverze na mono:** Tracks --> Mix --> Mix Stereo Down to Mono
- **Normalizace:** Effect --> Normalize (nastavte špičku na -1 dB pro prevenci clippingu)
- **Odstranění šumu:** Effect --> Noise Reduction
- **Testování smyčky:** Transport --> Loop Play (Shift+Space)

### Nastavení exportu OGG v Audacity

1. **File --> Export --> Export as OGG Vorbis**
2. **Kvalita:** 5-7 (5 pro okolní/UI, 7 pro zbraně/důležité zvuky)
3. **Kanály:** Mono pro 3D zvuky, Stereo pro UI/hudbu

### Další užitečné nástroje

| Nástroj | Účel | Cena |
|------|---------|------|
| **Audacity** | Obecná editace zvuku, konverze formátů | Zdarma |
| **Reaper** | Profesionální DAW, pokročilá editace | $60 (osobní licence) |
| **FFmpeg** | Dávková konverze zvuku z příkazového řádku | Zdarma |
| **Ocenaudio** | Jednoduchý editor s náhledem v reálném čase | Zdarma |

### Dávková konverze pomocí FFmpeg

Konverze všech WAV souborů v adresáři na mono OGG:

```bash
for file in *.wav; do
    ffmpeg -i "$file" -ac 1 -codec:a libvorbis -qscale:a 6 "${file%.wav}.ogg"
done
```

---

## Časté chyby

### 1. Stereo soubor pro 3D zvuk

**Příznak:** Zvuk se prostorově neumisťuje, přehrává se centrovaně nebo pouze v jednom uchu.
**Oprava:** Převeďte na mono před exportem. 3D polohové zvuky vyžadují mono zvukové soubory.

### 2. Přípona souboru v cestě samples[]

**Příznak:** Zvuk se nepřehrává, žádná chyba v logu (engine tiše nenajde soubor).
**Oprava:** Odstraňte příponu `.ogg` z cesty v `samples[]`. Engine ji přidává automaticky.

```cpp
// ŠPATNĚ
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// SPRÁVNĚ
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. Chybějící CfgPatches requiredAddons

**Příznak:** SoundShadery nebo SoundSety nejsou rozpoznány, zvuky se nepřehrávají.
**Oprava:** Přidejte `"DZ_Sounds_Effects"` do `requiredAddons[]` vašeho CfgPatches, abyste zajistili, že se základní zvukový systém načte před vašimi definicemi.

### 4. Příliš krátký dosah

**Příznak:** Zvuk se ostře ořízne na krátkou vzdálenost, působí nepřirozeně.
**Oprava:** Nastavte `range` na realistickou hodnotu. Výstřely by měly nést 300-800m, kroky 20-40m, hlasy 50-100m.

### 5. Žádná náhodná variace

**Příznak:** Zvuk po opakovaném poslechu působí repetitivně a uměle.
**Oprava:** Poskytněte více vzorků v SoundShaderu a přidejte `frequencyRandomizer` do SoundSetu pro variaci tónu.

```cpp
// Více vzorků pro rozmanitost
samples[] =
{
    {"MyMod\sound\step_01", 1},
    {"MyMod\sound\step_02", 1},
    {"MyMod\sound\step_03", 1},
    {"MyMod\sound\step_04", 1}
};

// Plus randomizace tónu v SoundSetu
frequencyRandomizer = 0.05;    // +/- 5% variace tónu
```

### 6. Clipping / zkreslení

**Příznak:** Zvuk praská nebo se zkresluje, zejména zblízka.
**Oprava:** Normalizujte svůj zvuk na -1 dB nebo -3 dB špičku v Audacity před exportem. Nikdy nenastavujte `volume` nebo `volumeFactor` nad 1.0, pokud zdrojový zvuk není velmi tichý.

---

## Osvědčené postupy

1. **Vždy exportujte 3D zvuky jako mono OGG.** Toto je nejdůležitější pravidlo. Stereo soubory se nebudou prostorově umisťovat.

2. **Poskytněte 3-5 variant vzorků** pro často slyšené zvuky (výstřely, kroky, nárazy). Náhodný výběr předchází "efektu kulometu" identického opakovaného zvuku.

3. **Používejte `frequencyRandomizer`** mezi 0.03 a 0.08 pro přirozenou variaci tónu. I jemná variace výrazně zlepšuje vnímanou kvalitu zvuku.

4. **Nastavte realistické hodnoty dosahu.** Studujte vanilla zvuky DayZ pro referenci. Výstřel pušky 600-800m dosahu, tlumený výstřel 150-200m, kroky 20-40m.

5. **Vrstvěte své zvuky.** Složité zvukové události (výstřely) by měly používat více SoundSetů: blízký výstřel + vzdálené dunění + dozvuk/ozvěna. To vytváří hloubku, které jeden zvukový soubor nemůže dosáhnout.

6. **Testujte ve více vzdálenostech.** Odejděte od zdroje zvuku ve hře a ověřte, že křivka útlumu působí přirozeně. Iterativně upravujte kontrolní body `rangeCurve[]`.

7. **Organizujte svůj zvukový adresář.** Používejte podadresáře podle kategorie (`weapons/`, `ambient/`, `ui/`, `vehicles/`). Plochý adresář s 200 OGG soubory je nezvládnutelný.

8. **Udržujte velikosti souborů rozumné.** Herní zvuk nepotřebuje studiovou kvalitu. OGG kvalita 5-7 je dostatečná. Většina jednotlivých zvukových souborů by měla být pod 500 KB.

---

## Pozorováno v reálných modech

| Vzor | Mod | Detail |
|---------|-----|--------|
| Vlastní zvuky notifikací přes SoundSety | Expansion (modul notifikací) | Definuje více `CfgSoundSets` pro různé typy notifikací (úspěch, varování, chyba) s `spatial = 0` |
| UI zvuky kliknutí s kešovaným přehráváním | VPP Admin Tools | Používá `SEffectManager.PlaySoundCachedParams()` pro kliknutí tlačítek, aby se předešlo opakovanému parsování konfigurace |
| Vícevrstevný zvuk zbraní (výstřel + dozvuk + prasknutí) | Komunitní balíčky zbraní (RFCP, MuchStuffPack) | Každá zbraň definuje 3-5 oddělených SoundSetů na událost výstřelu pro blízký výstřel, vzdálené dunění, nadzvukové prasknutí |
| `frequencyRandomizer` pro variaci kroků | Vanilla DayZ | Používá randomizaci tónu 0.05-0.08 na SoundSetech kroků pro prevenci robotického opakování |

---

## Kompatibilita a dopad

- **Více modů:** Názvy tříd SoundShader a SoundSet jsou globální. Dva mody definující stejný název třídy budou v konfliktu (poslední načtený vyhraje). Vždy přidávejte prefix názvů identifikátorem vašeho modu (např. `MyMod_Shot_SoundShader`).
- **Výkon:** Soubory OGG se dekomprimují za běhu. Mody se stovkami unikátních zvukových souborů zvyšují využití paměti. Udržujte jednotlivé soubory pod 500 KB a znovupoužívejte vzorky napříč variantami.
- **Verze:** Zvukový systém DayZ (CfgSoundShaders/CfgSoundSets) je stabilní od verze 1.0. Přednastavení `sound3DProcessingType` a `volumeCurve` byly přidány v pozdějších aktualizacích, ale jsou zpětně kompatibilní.

---

## Navigace

| Předchozí | Nahoru | Další |
|----------|----|------|
| [4.3 Materiály](03-materials.md) | [Část 4: Formáty souborů a DayZ Tools](01-textures.md) | [4.5 DayZ Tools Workflow](05-dayz-tools.md) |
