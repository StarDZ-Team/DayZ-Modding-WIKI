# Kapitola 4.1: Textury (.paa, .edds, .tga)

[Domů](../../README.md) | **Textury** | [Další: 3D modely >>](02-models.md)

---

## Úvod

Každý povrch, který vidíte v DayZ -- skiny zbraní, oblečení, terén, ikony UI -- je definován soubory textur. Engine používá proprietární komprimovaný formát nazvaný **PAA** za běhu, ale během vývoje pracujete s několika zdrojovými formáty, které se převádějí během procesu sestavení. Pochopení těchto formátů, konvencí pojmenování, které je váží na materiály, a pravidel rozlišení, která engine vynucuje, je zásadní pro tvorbu vizuálního obsahu pro DayZ mody.

Tato kapitola pokrývá každý formát textur, se kterým se setkáte, systém pojmenování příponami, který enginu říká, jak interpretovat každou texturu, požadavky na rozlišení a alfa kanál, a praktický pracovní postup pro konverzi mezi formáty.

---

## Obsah

- [Přehled formátů textur](#přehled-formátů-textur)
- [Formát PAA](#formát-paa)
- [Formát EDDS](#formát-edds)
- [Formát TGA](#formát-tga)
- [Formát PNG](#formát-png)
- [Konvence pojmenování textur](#konvence-pojmenování-textur)
- [Požadavky na rozlišení](#požadavky-na-rozlišení)
- [Podpora alfa kanálu](#podpora-alfa-kanálu)
- [Konverze mezi formáty](#konverze-mezi-formáty)
- [Kvalita a komprese textur](#kvalita-a-komprese-textur)
- [Příklady z praxe](#příklady-z-praxe)
- [Časté chyby](#časté-chyby)
- [Osvědčené postupy](#osvědčené-postupy)

---

## Přehled formátů textur

DayZ používá čtyři formáty textur v různých fázích vývojového pipeline:

| Formát | Přípona | Role | Podpora alfy | Používáno |
|--------|---------|------|---------------|---------|
| **PAA** | `.paa` | Runtime herní formát (komprimovaný) | Ano | Finální sestavení, dodáváno v PBO |
| **EDDS** | `.edds` | Editační/meziúrovňová DDS varianta | Ano | Náhled v Object Builderu, automatická konverze |
| **TGA** | `.tga` | Nekomprimovaný zdrojový artwork | Ano | Pracovní prostor umělce, export z Photoshopu/GIMPu |
| **PNG** | `.png` | Přenosný zdrojový formát | Ano | UI textury, externí nástroje |

Obecný pracovní postup je: **Zdroj (TGA/PNG) --> konverze DayZ Tools --> PAA (připraveno pro hru)**.

---

## Formát PAA

**PAA** (PAcked Arma) je nativní komprimovaný formát textur používaný enginem Enfusion za běhu. Každá textura dodávaná v PBO musí být ve formátu PAA (nebo bude na něj převedena během binarizace).

### Vlastnosti

- **Komprimovaný:** Používá interně kompresi DXT1, DXT5 nebo ARGB8888 v závislosti na přítomnosti alfa kanálu a nastavení kvality.
- **Mipmapovaný:** Soubory PAA obsahují úplný řetězec mipmap, generovaný automaticky během konverze. To je kritické pro výkon vykreslování -- engine vybírá vhodnou úroveň mip na základě vzdálenosti.
- **Rozměry mocnin dvou:** Engine vyžaduje, aby textury PAA měly rozměry, které jsou mocninami 2 (256, 512, 1024, 2048, 4096).
- **Za běhu pouze pro čtení:** Engine načítá soubory PAA přímo z PBO. Nikdy neupravujte soubor PAA -- upravte zdrojový soubor a znovu převeďte.

### Interní typy komprese

| Typ | Alfa | Kvalita | Případ použití |
|------|-------|---------|----------|
| **DXT1** | Ne (1-bit) | Dobrá, poměr 6:1 | Neprůhledné textury, terén |
| **DXT5** | Plná 8-bit | Dobrá, poměr 4:1 | Textury s hladkou alfou (sklo, listí) |
| **ARGB4444** | Plná 4-bit | Střední | UI textury, malé ikony |
| **ARGB8888** | Plná 8-bit | Bezztrátová | Ladění, nejvyšší kvalita (velká velikost souboru) |
| **AI88** | Šedotón + alfa | Dobrá | Normálové mapy, šedotónové masky |

### Kdy uvidíte soubory PAA

- Uvnitř rozbalených vanilla herních dat (adresář `dta/` a addon PBO)
- Jako výstup konverze TexView2
- Jako výstup Binarize při zpracování zdrojových textur
- V konečném PBO vašeho modu po sestavení

---

## Formát EDDS

**EDDS** je meziúrovňový formát textur používaný primárně **Object Builderem** DayZ a editorovými nástroji. Je v podstatě variantou standardního formátu DirectDraw Surface (DDS) s metadaty specifickými pro engine.

### Vlastnosti

- **Formát pro náhled:** Object Builder může zobrazovat textury EDDS přímo, což je činí užitečnými během tvorby modelů.
- **Automatická konverze na PAA:** Když spustíte Binarize nebo AddonBuilder (bez `-packonly`), soubory EDDS ve vašem zdrojovém stromu jsou automaticky převedeny na PAA.
- **Větší než PAA:** Soubory EDDS nejsou optimalizovány pro distribuci -- existují pro pohodlí editoru.
- **Formát DayZ-Samples:** Oficiální DayZ-Samples poskytované Bohemií používají textury EDDS rozsáhle.

### Pracovní postup s EDDS

```
Umělec vytvoří zdrojový TGA/PNG
    --> Plugin Photoshopu pro DDS exportuje EDDS pro náhled
        --> Object Builder zobrazuje EDDS na modelu
            --> Binarize převede EDDS na PAA pro PBO
```

> **Tip:** EDDS můžete zcela přeskočit, pokud chcete. Převeďte své zdrojové textury přímo na PAA pomocí TexView2 a odkazujte cesty PAA ve vašich materiálech. EDDS je pohodlí, ne nutnost.

---

## Formát TGA

**TGA** (Truevision TGA / Targa) je tradiční nekomprimovaný zdrojový formát pro práci s texturami v DayZ. Mnoho vanilla DayZ textur bylo původně vytvořeno jako soubory TGA.

### Vlastnosti

- **Nekomprimovaný:** Žádná ztráta kvality, plná barevná hloubka (24-bit nebo 32-bit s alfou).
- **Velké soubory:** 2048x2048 TGA s alfou je přibližně 16 MB.
- **Alfa ve vyhrazeném kanálu:** TGA podporuje správný 8-bitový alfa kanál (32-bit TGA), který se přímo mapuje na průhlednost v PAA.
- **Kompatibilní s TexView2:** TexView2 může otevírat soubory TGA přímo a převádět je na PAA.

### Kdy použít TGA

- Jako hlavní zdrojový soubor pro textury, které vytváříte od nuly.
- Při exportu ze Substance Painteru nebo Photoshopu pro DayZ.
- Když dokumentace DayZ-Samples nebo komunitní tutoriály specifikují TGA jako zdrojový formát.

### Nastavení exportu TGA

Při exportu TGA pro konverzi DayZ:

- **Bitová hloubka:** 32-bit (pokud je potřeba alfa) nebo 24-bit (neprůhledné textury)
- **Komprese:** Žádná (nekomprimovaný)
- **Orientace:** Levý dolní počátek (standardní orientace TGA)
- **Rozlišení:** Musí být mocnina 2 (viz [Požadavky na rozlišení](#požadavky-na-rozlišení))

---

## Formát PNG

**PNG** (Portable Network Graphics) je široce podporovaný a lze ho použít jako alternativní zdrojový formát, zejména pro UI textury.

### Vlastnosti

- **Bezztrátová komprese:** Menší než TGA, ale zachovává plnou kvalitu.
- **Plný alfa kanál:** 32-bit PNG podporuje 8-bitovou alfu.
- **Kompatibilní s TexView2:** TexView2 může otevírat a převádět PNG na PAA.
- **Přátelský pro UI:** Mnoho UI imagesetů a ikon v modech používá PNG jako zdrojový formát.

### Kdy použít PNG

- **UI textury a ikony:** PNG je praktická volba pro imagesety a HUD prvky.
- **Jednoduché retextury:** Když potřebujete pouze barevnou/difuzní mapu bez složité alfy.
- **Pracovní postupy napříč nástroji:** PNG je univerzálně podporovaný napříč editory obrázků, webovými nástroji a skripty.

> **Poznámka:** PNG není oficiální zdrojový formát Bohemie -- preferují TGA. Nicméně konverzní nástroje zpracovávají PNG bez problémů a mnoho modderů ho úspěšně používá.

---

## Konvence pojmenování textur

DayZ používá přísný systém přípon k identifikaci role každé textury. Engine a materiály odkazují na textury podle názvu souboru a přípona říká jak enginu, tak ostatním modderům, jaký typ dat textura obsahuje.

### Povinné přípony

| Přípona | Celý název | Účel | Typický formát |
|--------|-----------|---------|----------------|
| `_co` | **Color / Diffuse** | Základní barva (albedo) povrchu | RGB, volitelná alfa |
| `_nohq` | **Normal Map (High Quality)** | Normály povrchových detailů, definuje nerovnosti a drážky | RGB (normála v tangent-space) |
| `_smdi` | **Specular / Metallic / Detail Index** | Řídí lesklost a kovové vlastnosti | RGB kanály kódují oddělená data |
| `_ca` | **Color with Alpha** | Barevná textura, kde alfa kanál nese významná data (průhlednost, maska) | RGBA |
| `_as` | **Ambient Shadow** | Okolní zastínění / pečený stín | Šedotón |
| `_mc` | **Macro** | Velkoplošná barevná variace viditelná na dálku | RGB |
| `_li` | **Light / Emissive** | Mapa samozáření (svítící části) | RGB |
| `_no` | **Normal Map (Standard)** | Varianta normálové mapy nižší kvality | RGB |
| `_mca` | **Macro with Alpha** | Makro textura s alfa kanálem | RGBA |
| `_de` | **Detail** | Dlaždicová detailní textura pro variaci povrchu zblízka | RGB |

### Konvence pojmenování v praxi

Jeden předmět má typicky více textur, všechny sdílející základní název:

```
data/
  my_rifle_co.paa          <-- Základní barva (co vidíte)
  my_rifle_nohq.paa        <-- Normálová mapa (nerovnosti povrchu)
  my_rifle_smdi.paa         <-- Spekulární/kovová (lesklost)
  my_rifle_as.paa           <-- Okolní stín (pečená AO)
  my_rifle_ca.paa           <-- Barva s alfou (pokud je potřeba průhlednost)
```

### Kanály _smdi

Textura spekulární/kovová/detail balí tři datové toky do jednoho RGB obrázku:

| Kanál | Data | Rozsah | Efekt |
|---------|------|-------|--------|
| **R** | Kovový | 0-255 | 0 = nekov, 255 = plný kov |
| **G** | Drsnost (invertovaný spekulár) | 0-255 | 0 = drsný/matný, 255 = hladký/lesklý |
| **B** | Index detailu / AO | 0-255 | Dlaždicování detailu nebo okolní zastínění |

### Kanály _nohq

Normálové mapy v DayZ používají kódování v tangent-space:

| Kanál | Data |
|---------|------|
| **R** | Normála osy X (vlevo-vpravo) |
| **G** | Normála osy Y (nahoru-dolů) |
| **B** | Normála osy Z (směrem k divákovi) |
| **A** | Mapa spekulárního výkonu (volitelné, závisí na materiálu) |

---

## Požadavky na rozlišení

Engine Enfusion vyžaduje, aby všechny textury měly **rozměry mocnin dvou**. Šířka i výška musí nezávisle být mocninou 2, ale nemusí být stejné (netvercové textury jsou platné).

### Platné rozměry

| Velikost | Typické použití |
|------|-------------|
| **64x64** | Drobné ikony, UI prvky |
| **128x128** | Malé ikony, inventářové miniatury |
| **256x256** | UI panely, malé textury předmětů |
| **512x512** | Standardní textury předmětů, oblečení |
| **1024x1024** | Zbraně, detailní oblečení, díly vozidel |
| **2048x2048** | Zbraně s vysokým detailem, modely postav |
| **4096x4096** | Textury terénu, velké textury vozidel |

### Netvercové textury

Netvercové textury s mocninami dvou jsou platné:

```
256x512    -- Platné (obě jsou mocniny 2)
512x1024   -- Platné
1024x2048  -- Platné
300x512    -- NEPLATNÉ (300 není mocnina 2)
```

### Doporučení pro rozlišení

- **Zbraně:** 2048x2048 pro hlavní tělo, 1024x1024 pro příslušenství.
- **Oblečení:** 1024x1024 nebo 2048x2048 v závislosti na pokrytí plochy.
- **UI ikony:** 128x128 nebo 256x256 pro inventářové ikony, 64x64 pro HUD prvky.
- **Terén:** 4096x4096 pro satelitní mapy, 512x512 nebo 1024x1024 pro dlaždice materiálů.
- **Normálové mapy:** Stejné rozlišení jako odpovídající barevná textura.
- **SMDI mapy:** Stejné rozlišení jako odpovídající barevná textura.

> **Varování:** Pokud má textura rozměry, které nejsou mocninami dvou, engine ji buď odmítne načíst, nebo zobrazí magentovou chybovou texturu. TexView2 zobrazí varování během konverze.

---

## Podpora alfa kanálu

Alfa kanál v textuře nese další data nad rámec barvy. Jak je interpretován, závisí na příponě textury a shaderu materiálu.

### Role alfa kanálu

| Přípona | Interpretace alfy |
|--------|---------------------|
| `_co` | Obvykle nepoužitá; pokud je přítomna, může definovat průhlednost pro jednoduché materiály |
| `_ca` | Maska průhlednosti (0 = plně průhledné, 255 = plně neprůhledné) |
| `_nohq` | Mapa spekulárního výkonu (vyšší = ostřejší spekulární odlesk) |
| `_smdi` | Obvykle nepoužitá |
| `_li` | Maska intenzity vyzařování |

### Vytváření textur s alfou

Ve vašem editoru obrázků (Photoshop, GIMP, Krita):

1. Vytvořte RGB obsah jako normálně.
2. Přidejte alfa kanál.
3. Malujte bílou (255), kde chcete plnou opacitu/efekt, černou (0), kde nechcete žádný.
4. Exportujte jako 32-bit TGA nebo PNG.
5. Převeďte na PAA pomocí TexView2 -- automaticky detekuje alfa kanál.

### Ověření alfy v TexView2

Otevřete PAA v TexView2 a použijte tlačítka zobrazení kanálů:

- **RGBA** -- Zobrazí finální kompozici
- **RGB** -- Zobrazí pouze barvu
- **A** -- Zobrazí pouze alfa kanál (bílá = neprůhledná, černá = průhledná)

---

## Konverze mezi formáty

### TexView2 (primární nástroj)

**TexView2** je součástí DayZ Tools a je standardním nástrojem pro konverzi textur.

**Otevření souboru:**
1. Spusťte TexView2 z DayZ Tools nebo přímo z `DayZ Tools\Bin\TexView2\TexView2.exe`.
2. Otevřete svůj zdrojový soubor (TGA, PNG nebo EDDS).
3. Ověřte, že obrázek vypadá správně, a zkontrolujte rozměry.

**Konverze na PAA:**
1. Otevřete zdrojovou texturu v TexView2.
2. Přejděte na **File --> Save As**.
3. Vyberte **PAA** jako výstupní formát.
4. Zvolte typ komprese:
   - **DXT1** pro neprůhledné textury (alfa není potřeba)
   - **DXT5** pro textury s alfa průhledností
   - **ARGB4444** pro malé UI textury, kde záleží na velikosti souboru
5. Klikněte na **Save**.

**Dávková konverze přes příkazový řádek:**

```bash
# Konverze jednoho TGA na PAA
"P:\DayZ Tools\Bin\TexView2\TexView2.exe" -i "source.tga" -o "output.paa"

# TexView2 automaticky vybere kompresi na základě přítomnosti alfa kanálu
```

### Binarize (automatizovaný)

Když Binarize zpracovává zdrojový adresář vašeho modu, automaticky převádí všechny rozpoznané formáty textur (TGA, PNG, EDDS) na PAA. K tomu dochází jako součást pipeline AddonBuilderu.

**Tok konverze Binarize:**
```
source/mod_name/data/texture_co.tga
    --> Binarize detekuje TGA
        --> Převede na PAA s automatickým výběrem komprese
            --> Výstup: build/mod_name/data/texture_co.paa
```

### Tabulka manuální konverze

| Z | Na | Nástroj | Poznámky |
|------|----|------|-------|
| TGA --> PAA | TexView2 | Standardní pracovní postup |
| PNG --> PAA | TexView2 | Funguje identicky jako TGA |
| EDDS --> PAA | TexView2 nebo Binarize | Automaticky během sestavení |
| PAA --> TGA | TexView2 (Uložit jako TGA) | Pro úpravu existujících textur |
| PAA --> PNG | TexView2 (Uložit jako PNG) | Pro extrakci do přenosného formátu |
| PSD --> TGA/PNG | Photoshop/GIMP | Export z editoru, poté konverze |

---

## Kvalita a komprese textur

### Výběr typu komprese

| Scénář | Doporučená komprese | Důvod |
|----------|------------------------|--------|
| Neprůhledná difuzní (`_co`) | DXT1 | Nejlepší poměr, alfa není potřeba |
| Průhledná difuzní (`_ca`) | DXT5 | Plná podpora alfy |
| Normálové mapy (`_nohq`) | DXT5 | Alfa kanál nese spekulární výkon |
| Spekulární mapy (`_smdi`) | DXT1 | Obvykle neprůhledné, pouze RGB kanály |
| UI textury | ARGB4444 nebo DXT5 | Malá velikost, čisté hrany |
| Emisivní mapy (`_li`) | DXT1 nebo DXT5 | DXT5 pokud alfa nese intenzitu |

### Kvalita vs. velikost souboru

```
Formát        2048x2048 přibl. velikost
-----------------------------------------
ARGB8888      16.0 MB    (nekomprimovaný)
DXT5           5.3 MB    (komprese 4:1)
DXT1           2.7 MB    (komprese 6:1)
ARGB4444       8.0 MB    (komprese 2:1)
```

### Nastavení kvality ve hře

Hráči mohou upravit kvalitu textur v nastavení videa DayZ. Engine vybírá nižší úrovně mip, když je kvalita snížena, takže vaše textury budou vypadat postupně rozmazaněji při nižších nastaveních. Toto je automatické -- nemusíte vytvářet oddělené úrovně kvality.

---

## Příklady z praxe

### Sada textur zbraně

Typický mod zbraní obsahuje tyto soubory textur:

```
MyMod_Weapons/data/weapons/m4a1/
  my_weapon_co.paa           <-- 2048x2048, DXT1, základní barva
  my_weapon_nohq.paa         <-- 2048x2048, DXT5, normálová mapa
  my_weapon_smdi.paa          <-- 2048x2048, DXT1, spekulární/kovová
  my_weapon_as.paa            <-- 1024x1024, DXT1, okolní stín
```

Soubor materiálu (`.rvmat`) odkazuje na tyto textury a přiřazuje je fázím shaderu.

### UI textura (zdroj imagesetu)

```
MyFramework/data/gui/icons/
  my_icons_co.paa           <-- 512x512, ARGB4444, sprite atlas
```

UI textury jsou často zabaleny do jednoho atlasu (imageset) a odkazovány názvem v souborech layoutu. Komprese ARGB4444 je běžná pro UI, protože zachovává čisté hrany při zachování malých velikostí souborů.

### Textury terénu

```
terrain/
  grass_green_co.paa         <-- 1024x1024, DXT1, dlaždicová barva
  grass_green_nohq.paa       <-- 1024x1024, DXT5, dlaždicová normála
  grass_green_smdi.paa        <-- 1024x1024, DXT1, dlaždicový spekulár
  grass_green_mc.paa          <-- 512x512, DXT1, makro variace
  grass_green_de.paa          <-- 512x512, DXT1, dlaždicový detail
```

Textury terénu se dlaždicují přes krajinu. Makro textura `_mc` přidává velkoplošnou barevnou variaci pro prevenci opakování.

---

## Časté chyby

### 1. Rozměry, které nejsou mocninou dvou

**Příznak:** Magentová textura ve hře, varování TexView2.
**Oprava:** Změňte velikost zdroje na nejbližší mocninu 2 před konverzí.

### 2. Chybějící přípona

**Příznak:** Materiál nemůže najít texturu nebo se vykresluje nesprávně.
**Oprava:** Vždy zahrňte správnou příponu (`_co`, `_nohq` atd.) v názvu souboru.

### 3. Špatná komprese pro alfu

**Příznak:** Průhlednost vypadá blokově nebo binárně (zapnuto/vypnuto bez přechodu).
**Oprava:** Použijte DXT5 místo DXT1 pro textury, které potřebují hladké alfa přechody.

### 4. Zapomenutí mipmap

**Příznak:** Textura vypadá dobře zblízka, ale na dálku třpytí/jiskří.
**Oprava:** Soubory PAA generované TexView2 automaticky zahrnují mipmapy. Pokud používáte nestandardní nástroj, ujistěte se, že je generování mipmap povoleno.

### 5. Nesprávný formát normálové mapy

**Příznak:** Osvětlení na modelu vypadá invertovaně nebo ploše.
**Oprava:** Ujistěte se, že vaše normálová mapa je ve formátu tangent-space s konvencí osy Y ve stylu DirectX (zelený kanál: nahoru = světlejší). Některé nástroje exportují ve stylu OpenGL (invertovaný Y) -- musíte invertovat zelený kanál.

### 6. Nesoulad cest po konverzi

**Příznak:** Model nebo materiál zobrazuje magentu, protože odkazuje na cestu `.tga`, ale PBO obsahuje `.paa`.
**Oprava:** Materiály by měly odkazovat na finální cestu `.paa`. Binarize zpracovává přemapování cest automaticky, ale pokud balíte s `-packonly` (bez binarizace), musíte zajistit, aby cesty přesně odpovídaly.

---

## Osvědčené postupy

1. **Uchovávejte zdrojové soubory ve správě verzí.** Ukládejte TGA/PNG mastery vedle svého modu. Soubory PAA jsou generovaný výstup -- zdrojové soubory jsou to, na čem záleží.

2. **Přizpůsobte rozlišení důležitosti.** Puška, na kterou se hráč dívá hodiny, si zaslouží 2048x2048. Konzerva fazolí vzadu na polici může použít 512x512.

3. **Vždy poskytněte normálovou mapu.** I plochá normálová mapa (128, 128, 255 jednolitá výplň) je lepší než žádná -- chybějící normálové mapy způsobují chyby materiálů.

4. **Pojmenovávejte konzistentně.** Jeden základní název, více přípon: `myitem_co.paa`, `myitem_nohq.paa`, `myitem_smdi.paa`. Nikdy nemíchejte schémata pojmenování.

5. **Náhled v TexView2 před sestavením.** Otevřete svůj PAA výstup a ověřte, že vypadá správně. Zkontrolujte každý kanál jednotlivě.

6. **Používejte DXT1 ve výchozím nastavení, DXT5 pouze když je potřeba alfa.** DXT1 má poloviční velikost souboru oproti DXT5 a vypadá identicky pro neprůhledné textury.

7. **Testujte při nastavení nízké kvality.** Co vypadá skvěle na Ultra může být nečitelné na Low, protože engine agresivně zahazuje úrovně mip.

---

## Pozorováno v reálných modech

| Vzor | Mod | Detail |
|---------|-----|--------|
| Atlas `_co` textur pro mřížky ikon | Colorful UI | Balí více UI ikon do jednoho 512x512 `_co.paa` atlasu odkazovaného imagesety |
| Sprite sheety ikon tržiště | Expansion Market | Používá velké atlas PAA textury s desítkami miniatur předmětů pro obchodní UI |
| Retextura hiddenSelections bez nového P3D | DayZ-Samples (Test_ClothingRetexture) | Zaměňuje `_co.paa` přes `hiddenSelectionsTextures[]` pro vytvoření barevných variant z jednoho modelu |
| ARGB4444 pro malé HUD prvky | VPP Admin Tools | Používá soubory PAA komprimované ARGB4444 64x64 pro ikony panelu nástrojů a panelů pro minimalizaci velikosti souboru |

---

## Kompatibilita a dopad

- **Více modů:** Kolize cest textur jsou vzácné, protože každý mod používá svůj vlastní PBO prefix, ale dva mody retexturující stejný vanilla předmět přes `hiddenSelectionsTextures[]` budou v konfliktu -- poslední načtený vyhraje.
- **Výkon:** Jedna 4096x4096 DXT5 textura používá ~21 MB GPU paměti s mipmapami. Nadměrné používání velkých textur napříč mnoha modovými předměty může vyčerpat VRAM na slabším hardwaru. Preferujte 1024 nebo 2048 pro většinu předmětů.
- **Verze:** Formát PAA a pipeline TexView2 jsou stabilní od DayZ 1.0. Mezi verzemi DayZ nedošlo k žádným zlomovým změnám.

---

## Navigace

| Předchozí | Nahoru | Další |
|----------|----|------|
| [Část 3: GUI systém](../03-gui-system/07-styles-fonts.md) | [Část 4: Formáty souborů a DayZ Tools](../04-file-formats/01-textures.md) | [4.2 3D modely](02-models.md) |
