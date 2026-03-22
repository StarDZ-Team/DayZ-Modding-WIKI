# Hibaelharitasi utmutato

[Fooldal](./README.md) | **Hibaelharitasi utmutato**

---

> Ha valami rosszul sul el, kezdd itt. Ez az utmutato a **lathato tunet** szerint van szervezve, nem rendszer szerint. Talald meg a problemat, olvasd el az okot, alkalmazd a javitast.

---

## Tartalomjegyzek

1. [A mod nem toltodik be](#1-a-mod-nem-toltodik-be)
2. [Script hibak](#2-script-hibak)
3. [RPC es halozati problemak](#3-rpc-es-halozati-problemak)
4. [UI problemak](#4-ui-problemak)
5. [Epitesi es PBO problemak](#5-epitesi-es-pbo-problemak)
6. [Teljesitmeny problemak](#6-teljesitmeny-problemak)
7. [Targy, jarmu es entitas problemak](#7-targy-jarmu-es-entitas-problemak)
8. [Konfiguracios es tipusproblémak](#8-konfiguracios-es-tipusproblémak)
9. [Perzisztencia problemak](#9-perzisztencia-problemak)
10. [Dontesi folyamatabrak](#10-dontesi-folyamatabrak)
11. [Debug parancsok gyors referencziaja](#11-debug-parancsok-gyors-referencziaja)
12. [Log fajlok helye](#12-log-fajlok-helye)
13. [Hol kaphatsz segitseget](#13-hol-kaphatsz-segitseget)

---

## 1. A mod nem toltodik be

| Tunet | Ok | Javitas |
|-------|-----|---------|
| "Addon requires addon X" hiba indulasakor | Hianyzo vagy helytelen `requiredAddons[]` bejegyzes | Add hozza a fuggoseg pontos `CfgPatches` osztalynevet a `requiredAddons[]`-hoz. A nevek kis-/nagybetu erzekynyek. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md). |
| A mod nem lathato a launcherben | A `mod.cpp` fajl hianzik vagy szintaktikai hibas | Hozz letre vagy javitsd a `mod.cpp`-t a mod gyokereben. A `name`, `author` es `dir` mezoket kell tartalmaznia. |
| "Config parse error" indulasakor | Szintaktikai hiba a `config.cpp`-ben | Ellenorizd a hianyzo pontosvesszokat az osztalyzarasok utan (`};`), a le nem zart zarojeleket. |
| Semmilyen bejegyzes a script logban | A `CfgMods` `defs` blokk rossz utvonalra mutat | Ellenorizd, hogy a `config.cpp` `CfgMods` bejegyzese helyes `dir`-rel rendelkezik. A motor csendben figyelmen kivul hagyja a rossz utvonalakat. |
| A mod betoltodik, de semmi sem tortenik | A scriptek lefordulnak, de soha nem futnak le | Ellenorizd, hogy a modod rendelkezik belepesi ponttal: `modded class MissionServer` vagy `MissionGameplay`. Lasd [7.2 Fejezet](07-patterns/02-module-systems.md). |
| A mod csak egyjarekos modban mukodik | A szerver nem rendelkezik a telepitett moddal | Gyozodj meg rola, hogy a szerver `-mod=` parametere tartalmazza a mod utvonalat. |

---

## 2. Script hibak

| Tunet | Ok | Javitas |
|-------|-----|---------|
| `Null pointer access` | `null` valtozho elereese | Adj hozza null ellenorzest haszanalat elott: `if (myVar) { myVar.DoSomething(); }`. Ez a leggyakoribb futasideiú hiba. |
| `Cannot convert type 'X' to type 'Y'` | Kozvetlen tipuskenyszerites osszeegyeztethetetlen tipusok kozott | Hasznald a `Class.CastTo()`-t biztoonsagos lefelé kenyszeriteshez. Lasd [1.9 Fejezet](01-enforce-script/09-casting-reflection.md). |
| `Undefined variable 'X'` | Eliras, rossz hatokur vagy rossz reteg | Ellenorizd a helyesirast. Ha a valtozo mas fajlbol szarmazo osztaly, gyozodj meg rola, hogy ugyanabban vagy alacsonyabb retegben van definalva. Lasd [2.1 Fejezet](02-mod-structure/01-five-layers.md). |
| `Method 'X' not found` | Nem letezo metodus hivasa az adott osztalyon | Ellenorizd a metodus nevet es a szulo osztalyt. Ellenorizd a vanilla scripteket a `P:\DZ\scripts\`-ben. |
| `Division by zero` | Osztas nulla erteku valtozooval | Adj hozza guardot: `if (divisor != 0) result = value / divisor;`. |
| `Redeclaration of variable 'X'` | Ugyanaz a valtozonev deklaralva testver `else if` blokkokban | Deklarald a valtozot egyszer az `if`/`else` lanc elott. Lasd [1.12 Fejezet](01-enforce-script/12-gotchas.md). |
| `Stack overflow` | Vegtelen rekurzio | A metodus megfelelo kilepes nelkul hivja onmagat. Adj hozza melyseg ellenorzest. |
| `Index out of range` | Tomb eleres ervenytelen indexszel | Mindig ellenorizd az `array.Count()`-ot index alapu eleres elott. |
| `JsonFileLoader` null adatot ad vissza | A `JsonLoadFile()` visszateresi ertekenek hozzarendelese | A `JsonLoadFile()` `void`-ot ad vissza. Elore allokald az objektumot es add at referencciakent. Lasd [6.8 Fejezet](06-engine-api/08-file-io.md). |

---

## 3. RPC es halozati problemak

| Tunet | Ok | Javitas |
|-------|-----|---------|
| RPC elkuldve, de soha nem fogadva | Regisztracios elteres | Kuldo es fogado egyarant regisztralnia kell ugyanazt az RPC ID-t. Lasd [6.9 Fejezet](06-engine-api/09-networking.md). |
| RPC fogadva, de az adatok serultek | Olvasasi/irasi parameter elteres | A kuldo `Write()` es a fogado `Read()` hivasainak ugyanazokat a tipusokat kell tartalmazniuk ugyanabban a sorrendben. |
| Adatok nem szinkronizalodnak a kliensekre | Hianyzo `SetSynchDirty()` | Szinkronizaciora regisztralt valtozo modositasa utan hivd meg a `SetSynchDirty()`-t az entitason. |
| Egyjarekos/listen szerveren mukodik, dedikalton nem | Kulonbozo kodutvolnalak listen vs. dedikalt eseten | Listen szerveren a kliens es szerver egy folyamatban fut. Mindig tesztelj dedikalt szerveren. |
| RPC elontezs es szerver lag | RPC-k kuldese minden klatkan | Korlatotd az RPC hivasokat idzitokkal. Csoportositsd a kis frissiteseket. |

---

## 4. UI problemak

| Tunet | Ok | Javitas |
|-------|-----|---------|
| Layout betoltodik, de semmi nem lathato | A widget merete nulla | Ellenorizd a `hexactsize` es `vexactsize` ertekeket. Nincs negativ meret. Lasd [3.3 Fejezet](03-gui-system/03-sizing-positioning.md). |
| `CreateWidgets()` null-t ad vissza | A layout fajl utvonala helytelen vagy a fajl hianzik | Ellenorizd a `.layout` fajl utvonalat. A motor csendben `null`-t ad vissza rossz utvonalaknal. |
| Widgetek leteznek, de nem kattinthatoak | Masik widget takarja a gombot | Ellenorizd a widget `priority`-jat (z-sorrend). |
| Jatek bevitel beragadt a UI bezarasa utan | A `ChangeGameFocus()` hivasok nincsenek egyensulyban | Minden `ChangeGameFocus(1)`-nek megfelelo `ChangeGameFocus(-1)` kell. |
| Szoveg `#STR_some_key` formaaban jelenik meg | Hianyzo stringtable bejegyzes | Add hozza a kulcsot a `stringtable.csv`-hez. |

---

## 5. Epitesi es PBO problemak

| Tunet | Ok | Javitas |
|-------|-----|---------|
| PBO sikeresen epitkezik, de a mod osszeomlik betolteskor | `config.cpp` binarizalasi hiba | Probald meg binarizalas nelkul epiteni. |
| "Signature check failed" szerver csatlakozaskor | A PBO alairas nelkuli vagy rossz kulccsal alairva | Ird ala ujra a PBO-t a privat kulcsoddal. Gyozodj meg rola, hogy a szerver rendelkezik a megfelelo `.bikey`-vel. |
| File patching valtozasai nem ervenytsulek | Nem a diagnosztikai futtathato fajlt hasznalod | A file patching csak a `DayZDiag_x64.exe`-vel mukodik. |

---

## 6. Teljesitmeny problemak

| Tunet | Ok | Javitas |
|-------|-----|---------|
| Alacsony szerver FPS (20 alatt) | Nehez feldolgozas az `OnUpdate()`-ban | Hasznalj delta-ido akkumulatort. Hajtsd vegre a logikaat N masodpercenkent. Lasd [7.7 Fejezet](07-patterns/07-performance.md). |
| A memoria idoben no (memoriaiszivaargas) | `ref` referencia ciklusok | Ha ket objektum `ref`-et tart egymasra, egyik sem szabadul fel. Az egyik oldalt tedd nyers (nem-`ref`) referencia. Lasd [1.8 Fejezet](01-enforce-script/08-memory-management.md). |
| A log fajl nagyon gyorsan no | Tulzott `Print()` | Tavolotsd el vagy guard-old a debug `Print()`-eket `#ifdef DEVELOPER` moge. |

---

## 7. Targy, jarmu es entitas problemak

| Tunet | Ok | Javitas |
|-------|-----|---------|
| A targy nem jelenik meg (admin eszkozok "cannot create") | `scope=0` a konfigban vagy hianzik a `types.xml`-bol | Allitsd `scope=2`-re. Adj hozza bejegyzest a szerver `types.xml`-jehez. |
| A targy megjelenik, de lathatatlan | A modell utvonala (`.p3d`) helytelen | Ellenorizd a `model` utvonalat a `CfgVehicles` osztalyodban. |
| A targy nem veheto fel | Helytelen geometria vagy rossz `inventorySlot` | Ellenorizd a Fire Geometry-t a modellben. Ellenorizd az `itemSize[]`-t. |

---

## 8. Konfiguracios es tipusproblémak

| Tunet | Ok | Javitas |
|-------|-----|---------|
| A konfiguracios ertekek nem ervenytsulek | A binarizalt konfig hasznalata kozben a forras szerkesztese | Epitsd ujra a PBO-t a konfiguracio modositasa utan. |
| A `types.xml` valtozasok figyelmen kivul maradnak | Rossz `types.xml` fajl szerkesztese | A szerver a `mpmissions/a_misszio/db/types.xml`-bol tolti a tipusokat. |
| JSON konfiguracios fajl nem toltodik be | Hibas JSON vagy rossz utvonal | Validald a JSON szintaxist. Hasznald a `$profile:` prefikszet. |

---

## 9. Perzisztencia problemak

| Tunet | Ok | Javitas |
|-------|-----|---------|
| Jatekos adatai elvesznek ujrainditaskor | Nem a `$profile:` konyvtarba ment | Hasznald a `JsonFileLoader<T>.JsonSaveFile()`-t `$profile:` utvonallal. |
| A mentett fajl ures vagy serult | Osszeomlas iras kozben | Irj eloszor ideiglenes fajlba, majd nevezd at a vegleges utvonalra. |

---

## 10. Dontesi folyamatabrak

### "A modom egyaltalan nem mukodik"

1. **Ellenorizd a script logot** `SCRIPT (E)` hibakert. Javitsd az elso hibat. (2. szekció)
2. **A mod megjelenik a launcherben?** Ha nem, ellenorizd a `mod.cpp`-t. (1. szekció)
3. **A log emliti a CfgPatches osztalyodat?** Ha nem, ellenorizd a `config.cpp` szintaxist es a `-mod=` parametert.
4. **A scriptek lefordulnak?** Keresd a forditas hibakat az RPT-ben. (2. szekció)
5. **Van belepesi pont?** Szukseged van `modded class MissionServer`/`MissionGameplay`-re.
6. **Meg semmi?** Adj hozza `Print("MY_MOD: Init reached");`-et a belepesi pontodhoz.

---

## 11. Debug parancsok gyors referencziaja

| Muvelet | Parancs |
|---------|---------|
| Targy spawnolasa a foldon | `GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition());` |
| Teleportals koordinatakra | `GetGame().GetPlayer().SetPosition("6543 0 2114".ToVector());` |
| Teljes gyogyitas | `GetGame().GetPlayer().SetHealth("", "", 5000);` |
| Del beallitasa | `GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);` |
| Ejszaka beallitasa | `GetGame().GetWorld().SetDate(2024, 9, 15, 2, 0);` |
| Tiszta idojaras | `GetGame().GetWeather().GetOvercast().Set(0,0,0); GetGame().GetWeather().GetRain().Set(0,0,0);` |
| Pozicio kiirasa | `Print(GetGame().GetPlayer().GetPosition());` |

**Gyakori Chernarus helyszinek:** Elektro `"10570 0 2354"`, Cherno `"6649 0 2594"`, NWAF `"4494 0 10365"`, Tisy `"1693 0 13575"`, Berezino `"12121 0 9216"`

---

## 12. Log fajlok helye

### Kliens logok

| Log | Hely | Tartalom |
|-----|------|----------|
| Script log | `%localappdata%\DayZ\` (legujabb `.RPT` fajl) | Script hibak, figyelmeztetesek, `Print()` kimenet |

### Szerver logok

| Log | Hely | Tartalom |
|-----|------|----------|
| Script log | `<szerver_gyoker>\profiles\` (legujabb `.RPT` fajl) | Script hibak, szerver oldali `Print()` |
| Admin log | `<szerver_gyoker>\profiles\` (`.ADM` fajl) | Jatekos csatlakozsok, olesek, chat |

---

## 13. Hol kaphatsz segitseget

### Kozossegi forrasok

| Forras | URL | Legjobb ehhez |
|--------|-----|--------------|
| DayZ Modding Discord | `discord.gg/dayzmods` | Valos ideju segitseg |
| Bohemia Interactive Forum | `forums.bohemia.net/forums/forum/231-dayz-modding/` | Hivatalos forumok |
| DayZ Workshop | Steam Workshop (DayZ) | Publikalt modok bonogesese |

### Referenccia forraskod

| Mod | Mit tanulhatsz |
|-----|----------------|
| **Community Framework (CF)** | Modul eletciklus, RPC kezeles, loggolas |
| **DayZ Expansion** | Nagyleputeku mod architektura, piaci rendszer |
| **Community Online Tools (COT)** | Admin eszkozok, jogosultsagok, UI mintak |
| **Dabs Framework** | MVC minta, adat kottes, UI komponens keretrendszer |

---

*A problema meg mindig megoldatlan? Ellenorizd a [FAQ](faq.md)-ot, a [Cheat Sheet](cheatsheet.md)-et, vagy kerdezz a DayZ Modding Discordon.*
