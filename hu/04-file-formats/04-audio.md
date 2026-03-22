# 4.4. fejezet: Hang (.ogg, .wss)

[Kezdőlap](../README.md) | [<< Előző: Anyagok](03-materials.md) | **Hang** | [Következő: DayZ Tools munkafolyamat >>](05-dayz-tools.md)

---

## Bevezetés

A hangdizájn a DayZ modolás egyik leginkább belemerülős aspektusa. Egy puska dörrenésétől az erdei szélzúgásig a hang kelti életre a játékvilágot. A DayZ az **OGG Vorbis** formátumot használja elsődleges hangformátumként, és a hanglejátszást a `config.cpp`-ben definiált **CfgSoundShaders** és **CfgSoundSets** réteges rendszerén keresztül konfigurálja. Ennek a csővezetéknek a megértése -- a nyers hangfájltól a térbe helyezett játékbeli hangig -- elengedhetetlen bármilyen modhoz, amely egyéni fegyvereket, járműveket, környezeti effekteket vagy UI visszajelzéseket vezet be.

Ez a fejezet a hangformátumokat, a konfigurációvezérelt hangrendszert, a 3D térbeli hangot, a hangerő és távolság csillapítást, a ciklikus lejátszást és az egyéni hangok DayZ modhoz adásának teljes munkafolyamatát tárgyalja.

---

## Tartalomjegyzék

- [Hangformátumok](#audio-formats)
- [CfgSoundShaders és CfgSoundSets](#cfgsoundshaders-and-cfgsoundsets)
- [Hang kategóriák](#sound-categories)
- [3D térbeli hang](#3d-positional-audio)
- [Hangerő és távolság csillapítás](#volume-and-distance-attenuation)
- [Ciklikus hangok](#looping-sounds)
- [Egyéni hangok hozzáadása modhoz](#adding-custom-sounds-to-a-mod)
- [Hanggyártó eszközök](#audio-production-tools)
- [Gyakori hibák](#common-mistakes)
- [Bevált gyakorlatok](#best-practices)

---

## Hangformátumok

### OGG Vorbis (elsődleges formátum)

Az **OGG Vorbis** a DayZ elsődleges hangformátuma. Minden egyéni hangot `.ogg` fájlként kell exportálni.

| Tulajdonság | Érték |
|----------|-------|
| **Kiterjesztés** | `.ogg` |
| **Kodek** | Vorbis (veszteséges tömörítés) |
| **Mintavételi frekvenciák** | 44100 Hz (szabványos), 22050 Hz (elfogadható környezeti hangokhoz) |
| **Csatornák** | Monó (3D hangokhoz) vagy Sztereó (zenéhez/UI-hoz) |
| **Minőségi tartomány** | -1 és 10 között (5-7 ajánlott játékhangokhoz) |

### Fő szabályok az OGG-hoz a DayZ-ben

- **A 3D térbeli hangoknak MONO-nak KELL lenniük.** Ha sztereó fájlt adsz meg 3D hangnak, a motor nem biztos, hogy megfelelően térbeli hangot csinál belőle, vagy figyelmen kívül hagyhat egy csatornát.
- **Az UI és zenei hangok lehetnek sztereók.** Nem térbeli hangok (menük, HUD visszajelzés, háttérzene) helyesen működnek sztereóban.
- **A mintavételi frekvencia legyen 44100 Hz** a legtöbb hanghoz.

### WSS (régi formátum)

A **WSS** régi hangformátum a korábbi Bohemia címekből (Arma sorozat). A DayZ még betöltheti a WSS fájlokat, de az új modoknak kizárólag OGG-t kell használniuk.

---

## CfgSoundShaders és CfgSoundSets

A DayZ hangrendszere kétrétegű konfigurációs megközelítést használ, amelyet a `config.cpp`-ben definiálunk. Egy **SoundShader** definiálja, milyen hangfájlt játsszon le és hogyan, míg egy **SoundSet** definiálja, hol és hogyan hallható a hang a világban.

### A kapcsolat

```
config.cpp
  |
  |--> CfgSoundShaders     (MIT játsszon: fájl, hangerő, frekvencia)
  |      |
  |      |--> MyShader      hivatkozik --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         (HOGYAN játsszon: 3D pozíció, távolság, térbeli)
         |
         |--> MySoundSet    hivatkozik --> MyShader
```

A játékkód és más konfigurációk **SoundSet-ekre** hivatkoznak, soha nem közvetlenül SoundShaderekre.

### CfgSoundShaders

A SoundShader a nyers hangos tartalmat és alapvető lejátszási paramétereket definiálja:

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        // Hangfájlok tömbje -- a motor véletlenszerűen választ egyet
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {útvonal (kiterjesztés nélkül), valószínűségi súly}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;                          // Alap hangerő (0.0 - 1.0)
        range = 300;                           // Maximális hallható távolság (méterben)
        rangeCurve[] = {{0, 1.0}, {300, 0.0}}; // Hangerő csökkenési görbe
    };
};
```

#### SoundShader tulajdonságok

| Tulajdonság | Típus | Leírás |
|----------|------|-------------|
| `samples[]` | tömb | `{útvonal, súly}` párok listája. Az útvonal nem tartalmazza a fájl kiterjesztését. |
| `volume` | float | Alap hangerő szorzó (0.0-tól 1.0-ig). |
| `range` | float | Maximális hallható távolság méterben. |
| `rangeCurve[]` | tömb | `{távolság, hangerő}` pontok tömbje, amely a csillapítást definiálja a távolság függvényében. |
| `frequency` | float | Lejátszási sebesség szorzó. 1.0 = normál, 0.5 = fél sebesség (alacsonyabb hangmagasság), 2.0 = dupla sebesség (magasabb hangmagasság). |

> **Fontos:** A `samples[]` útvonal NEM tartalmazza a fájl kiterjesztését. A motor automatikusan hozzáfűzi az `.ogg` (vagy `.wss`) kiterjesztést a lemezen található fájl alapján.

### CfgSoundSets

A SoundSet egy vagy több SoundShadert csomagol be és definiálja a térbeli és viselkedési tulajdonságokat:

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;          // Hangerő skálázás (a shader hangerő felett alkalmazva)
        frequencyFactor = 1.0;       // Frekvencia skálázás
        spatial = 1;                  // 1 = 3D térbeli, 0 = 2D (HUD/menü)
        doppler = 0;                  // 1 = Doppler effekt engedélyezése
        loop = 0;                     // 1 = folyamatos ismétlés
    };
};
```

#### SoundSet tulajdonságok

| Tulajdonság | Típus | Leírás |
|----------|------|-------------|
| `soundShaders[]` | tömb | SoundShader osztálynevek listája a kombináláshoz. |
| `volumeFactor` | float | További hangerő szorzó a shader hangerő felett alkalmazva. |
| `frequencyRandomizer` | float | Véletlenszerű hangmagasság variáció (0.0 = nincs, 0.1 = +/- 10%). |
| `spatial` | int | `1` 3D térbeli hanghoz, `0` 2D-hez (UI, zene). |
| `doppler` | int | `1` a Doppler hangmagasság eltolás engedélyezéséhez mozgó forrásoknál. |
| `loop` | int | `1` folyamatos ismétléshez, `0` egyszeri lejátszáshoz. |
| `distanceFilter` | int | `1` az aluláteresztő szűrő alkalmazásához távolságnál (tompított távoli hangok). |
| `occlusionFactor` | float | Mennyire tompítják a falak/terep a hangot (0.0-tól 1.0-ig). |

---

## Hang kategóriák

### Fegyverhangok

A fegyverhangok a DayZ legösszetettebb hangjai, jellemzően több SoundSet-et tartalmaznak egyetlen lövés különböző aspektusaihoz:

```
Lövés leadva
  |--> Közeli lövés SoundSet     (a "bumm" közelebbről hallva)
  |--> Távoli lövés SoundSet     (a morajlás/visszhang távolról hallva)
  |--> Utózörej SoundSet         (a rákövetkező visszhang)
  |--> Szuperszonikus csattanás SoundSet (golyó átrepül a fej felett)
  |--> Mechanikus SoundSet       (zárciklus, tár behelyezés)
```

### Környezeti hangok

Környezeti hangok az atmoszférához:

```cpp
class MyMod_Wind_SoundSet
{
    soundShaders[] = {"MyMod_Wind_SoundShader"};
    volumeFactor = 0.6;
    spatial = 0;           // Nem térbeli (környezeti surround)
    loop = 1;              // Folyamatos ismétlés
};
```

### UI hangok

Felületi visszajelzési hangok (gomb kattintások, értesítések):

```cpp
class MyMod_ButtonClick_SoundSet
{
    soundShaders[] = {"MyMod_ButtonClick_SoundShader"};
    volumeFactor = 0.8;
    spatial = 0;           // 2D -- a hallgató fejében szól
    loop = 0;
};
```

### Járműhangok

A járművek összetett hangkonfigurációkat használnak több komponenssel:

- **Motor alapjárat** -- ciklikus, hangmagasság változik a fordulatszámmal
- **Motor gyorsulás** -- ciklikus, hangerő és hangmagasság a gázadással skálázódik
- **Gumiabroncs zaj** -- ciklikus, hangerő a sebességgel skálázódik
- **Dudálás** -- kiváltott, ciklikus amíg tartják
- **Ütközés** -- egyszeri az ütközéskor

---

## 3D térbeli hang

A DayZ 3D térbeli hangot használ a hangok játékvilágban való pozícionálásához. Amikor egy fegyver 200 méterre tőled balra dörren, a bal oldali hangszóródból/fülhallgatódból hallod megfelelő hangerő csökkentéssel.

### A 3D hang követelményei

1. **A hangfájlnak monónak kell lennie.** Sztereó fájlok nem térbeli hangként jelennek meg helyesen.
2. **A SoundSet `spatial` értékének `1`-nek kell lennie.** Ez engedélyezi a 3D pozícionáló rendszert.
3. **A hangforrásnak világ pozícióval kell rendelkeznie.** A motornak szüksége van koordinátákra az irány és távolság kiszámításához.

### 3D hangok kiváltása szkriptből

```c
// Térbeli hang lejátszása világ pozícióban
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// Hang lejátszása objektumhoz csatolva (együtt mozog vele)
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## Hangerő és távolság csillapítás

### Tartomány görbe

A SoundShader-ben lévő `rangeCurve[]` definiálja, hogyan csökken a hangerő a távolsággal. `{távolság, hangerő}` párok tömbje:

```cpp
rangeCurve[] =
{
    {0, 1.0},       // 0m-nél: teljes hangerő
    {50, 0.7},      // 50m-nél: 70% hangerő
    {150, 0.3},     // 150m-nél: 30% hangerő
    {300, 0.0}      // 300m-nél: néma
};
```

### Előre definiált hangerő görbék

| Görbe neve | Viselkedés |
|------------|----------|
| `"InverseSquare"` | Valósághű csökkenés (hangerő = 1/távolság^2). Természetes hangzás. |
| `"Linear"` | Egyenletes csökkenés maximumtól nulláig a tartományon. |
| `"Logarithmic"` | Hangos közelről, gyorsan csökken közepes távolságnál, majd lassan halkulik. |

---

## Ciklikus hangok

A ciklikus hangok folyamatosan ismétlődnek, amíg kifejezetten le nem állítják őket. Motorokhoz, környezeti atmoszférához, riasztásokhoz és bármilyen fenntartott hanghoz használatosak.

### Ciklikus lejátszás szkriptből

```c
// Ciklikus hang indítása
EffectSound m_AlarmSound;

void StartAlarm(vector position)
{
    if (!m_AlarmSound)
    {
        m_AlarmSound = SEffectManager.PlaySound("MyMod_Alarm_SoundSet", position);
    }
}

// Ciklikus hang leállítása
void StopAlarm()
{
    if (m_AlarmSound)
    {
        m_AlarmSound.Stop();
        m_AlarmSound = null;
    }
}
```

### Hangfájl előkészítése ciklusokhoz

A zökkenőmentes ciklizáláshoz magának a hangfájlnak is tisztán kell ismétlődnie:

1. **Nulla-átmenet az elején és a végén.** A hullámformának mindkét végponton nulla amplitúdónál kell átmennie, hogy elkerülje a kattanást/pattanást az ismétlési pontnál.
2. **Egyező eleje és vége.** A fájl végének zökkenőmentesen kell keverednie az elejével.
3. **Nincs halkulás be/ki.** A halkulások hallhatók lennének minden ismétlésnél.
4. **Teszteld a ciklust Audacity-ben.** Válaszd ki a teljes klipet, engedélyezd a ciklikus lejátszást, és figyelj kattanásokra vagy megszakításokra.

---

## Egyéni hangok hozzáadása modhoz

### Teljes munkafolyamat

**1. lépés: Hangfájlok előkészítése**
- Rögzítsd vagy szerezd be a hangodat.
- Szerkeszd Audacity-ben (vagy az általad preferált hangszerkesztőben).
- 3D hangokhoz: konvertáld monóvá.
- Exportáld OGG Vorbis formátumban (minőség 5-7).

**2. lépés: Rendezés a mod könyvtárban**

```
MyMod/
  sound/
    weapons/
      rifle_shot_01.ogg
      rifle_shot_02.ogg
    ambient/
      wind_loop.ogg
    ui/
      click_01.ogg
  config.cpp
```

**3. lépés: SoundShaderek definiálása a config.cpp-ben**

**4. lépés: Hivatkozás a fegyver/tárgy konfigurációból**

**5. lépés: Építés és tesztelés**
- Csomagold a PBO-t (használd a `-packonly` opciót, mivel az OGG fájlok nem igényelnek binarizálást).
- Indítsd el a játékot a betöltött moddal.
- Teszteld a hangot a játékban különböző távolságoknál.

---

## Hanggyártó eszközök

### Audacity (ingyenes, nyílt forráskódú)

Az Audacity az ajánlott eszköz DayZ hanggyártáshoz:

- **Letöltés:** [audacityteam.org](https://www.audacityteam.org/)
- **OGG export:** File --> Export --> Export as OGG
- **Monó konverzió:** Tracks --> Mix --> Mix Stereo Down to Mono
- **Normalizálás:** Effect --> Normalize (csúcs beállítása -1 dB-re a vágás megelőzéséhez)
- **Zajeltávolítás:** Effect --> Noise Reduction
- **Ciklus tesztelés:** Transport --> Loop Play (Shift+Space)

### Egyéb hasznos eszközök

| Eszköz | Cél | Ár |
|------|---------|------|
| **Audacity** | Általános hangszerkesztés, formátum konverzió | Ingyenes |
| **Reaper** | Professzionális DAW, haladó szerkesztés | $60 (személyes licenc) |
| **FFmpeg** | Parancssor alapú kötegelt hangkonverzió | Ingyenes |
| **Ocenaudio** | Egyszerű szerkesztő valós idejű előnézettel | Ingyenes |

---

## Gyakori hibák

### 1. Sztereó fájl 3D hanghoz

**Tünet:** A hang nem térbeli, középen szól vagy csak az egyik fülben.
**Javítás:** Konvertáld monóvá exportálás előtt. A 3D térbeli hangokhoz monó hangfájlok szükségesek.

### 2. Fájl kiterjesztés a samples[] útvonalban

**Tünet:** A hang nem szól, nincs hiba a naplóban (a motor csendben nem találja a fájlt).
**Javítás:** Távolítsd el az `.ogg` kiterjesztést a `samples[]`-ban lévő útvonalból. A motor automatikusan hozzáadja.

```cpp
// HELYTELEN
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// HELYES
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. Hiányzó CfgPatches requiredAddons

**Tünet:** A SoundShaderek vagy SoundSetek nem ismertek fel, a hangok nem szólnak.
**Javítás:** Add hozzá a `"DZ_Sounds_Effects"` elemet a CfgPatches `requiredAddons[]` tömbhöz.

### 4. Túl rövid hatótávolság

**Tünet:** A hang hirtelen elnémul rövid távolságnál, természetellenesen hat.
**Javítás:** Állítsd a `range` értéket valósághű értékre. A lövések 300-800m-re hallatszanak, a léptek 20-40m-re, a hangok 50-100m-re.

### 5. Nincs véletlenszerű variáció

**Tünet:** A hang ismétlődőnek és mesterségesnek tűnik többszöri hallgatás után.
**Javítás:** Adj meg több mintát a SoundShader-ben és adj `frequencyRandomizer`-t a SoundSet-hez hangmagasság variációhoz.

### 6. Vágás / torzítás

**Tünet:** A hang recseg vagy torzít, különösen közelről.
**Javítás:** Normalizáld a hanganyagodat -1 dB vagy -3 dB csúcsra az Audacity-ben exportálás előtt.

---

## Bevált gyakorlatok

1. **Mindig exportáld a 3D hangokat monó OGG-ként.** Ez az egyetlen legfontosabb szabály. A sztereó fájlok nem lesznek térbeliek.

2. **Adj meg 3-5 minta változatot** a gyakran hallott hangokhoz (lövések, léptek, becsapódások). A véletlenszerű kiválasztás megelőzi az azonos ismétlődő hangok "géppuska effektusát".

3. **Használj `frequencyRandomizer`-t** 0.03 és 0.08 között természetes hangmagasság variációhoz. Még az enyhe variáció is jelentősen javítja az észlelt hangminőséget.

4. **Állíts be valósághű hatótávolság értékeket.** Tanulmányozd a vanilla DayZ hangokat referenciaként. Puska lövés 600-800m tartomány, hangtompított lövés 150-200m, léptek 20-40m.

5. **Rétegezd a hangjaidat.** Az összetett hangos események (lövések) több SoundSet-et kell használjanak: közeli lövés + távoli morajlás + utózörej/visszhang.

6. **Tesztelj több távolságnál.** Sétálj el a hangforrástól a játékban és ellenőrizd, hogy a csillapítási görbe természetesnek tűnik-e.

7. **Rendezd a hang könyvtáradat.** Használj alkönyvtárakat kategóriánként (`weapons/`, `ambient/`, `ui/`, `vehicles/`). Egy lapos könyvtár 200 OGG fájllal kezelhetetlen.

8. **Tartsd ésszerűen a fájlméreteket.** A játék hang nem igényel stúdió minőséget. Az OGG minőség 5-7 elegendő. A legtöbb egyedi hangfájl 500 KB alatt legyen.

---

## Navigáció

| Előző | Fel | Következő |
|----------|----|------|
| [4.3 Anyagok](03-materials.md) | [4. rész: Fájlformátumok és DayZ Tools](01-textures.md) | [4.5 DayZ Tools munkafolyamat](05-dayz-tools.md) |
