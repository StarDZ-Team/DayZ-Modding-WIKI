# Gyakran ismetelt kerdesek

[Fooldal](./README.md) | **FAQ**

---

## Kezdo lepesek

### K: Mire van szuksegem a DayZ moddolashoz?
**V:** Szukseged van Steamre, DayZ-re (kiskereskedelmi peldany), DayZ Tools-ra (ingyenes a Steamen az Eszkozok alatt) es egy szovegszerkesztore (VS Code ajanlott). Programozasi tapasztalat nem feltetlenul szukseges -- kezdd a [8.1 Fejezet: Az elso modod](08-tutorials/01-first-mod.md) resznel. A DayZ Tools tartalmazza az Object Buildert, Addon Buildert, TexView2-t es a Workbench IDE-t.

### K: Milyen programozasi nyelvet hasznal a DayZ?
**V:** A DayZ az **Enforce Script**-et hasznalja, ami a Bohemia Interactive tulajdonosi nyelve. C-szeru szintaxissal rendelkezik, hasonlo a C#-hoz, de sajat szabalyokkal es korlatozasokkal (nincs ternaris operator, nincs try/catch, nincsenek lambdak). Lasd az [1. Resz: Enforce Script](01-enforce-script/01-variables-types.md) teljes nyelvi utmutatot.

### K: Hogyan allitom be a P: meghajtot?
**V:** Nyisd meg a DayZ Tools-t a Steambol, kattints a "Workdrive" vagy "Setup Workdrive" gombra a P: meghajto csatlakozatasahoz. Ez letrehoz egy virtualis meghajtot, amely a moddolasi munkateruletedre mutat, ahol a motor a forrasfajlokat keresi fejlesztes kozben. Hasznalhatod a `subst P: "C:\Az\Utad"` parancsot is a parancssorbol. Lasd a [4.5 Fejezet](04-file-formats/05-dayz-tools.md)-et.

### K: Tesztelhetem a modomat dedikalt szerver nelkul?
**V:** Igen. Inditsd el a DayZ-t a `-filePatching` parameterrel es a betoltott moddal. Gyors teszteleshez hasznalj Listen Servert (a jatek menubol hosztolva). Produkcio teszteleshez mindig ellenorizd dedikalt szerveren is, mivel egyes kodutvolonalak elternek. Lasd a [8.1 Fejezet](08-tutorials/01-first-mod.md)-et.

### K: Hol talalom a vanilla DayZ script fajlokat tanulmanyozasra?
**V:** A P: meghajto csatlakoztatasa utan a DayZ Tools-on keresztul a vanilla scriptek a `P:\DZ\scripts\` konyvtarban talalhatoak retegek szerint rendezve (`3_Game`, `4_World`, `5_Mission`). Ez a megiranyadoja referenciaforras minden motor osztalyhoz, metodushoz es esemenyhez. Lasd meg a [Cheat Sheet](cheatsheet.md)-et es az [API Quick Reference](06-engine-api/quick-reference.md)-t.

---

## Gyakori hibak es javitasok

### K: A modom betoltodik, de semmi sem tortenik. Nincs hiba a logban.
**V:** Legvaloszinubben a `config.cpp`-dben helytelen `requiredAddons[]` bejegyzes van, igy a scriptek tul koran vagy egyaltalan nem toltodnek be. Ellenorizd, hogy minden addon nev a `requiredAddons`-ban pontosan megegyezik egy letezo `CfgPatches` osztalynevvel (kis-/nagybetu erzenykeny). Ellenorizd a script logot a `%localappdata%/DayZ/` helyen a csendes figyelmeztetesekert. Lasd a [2.2 Fejezet](02-mod-structure/02-config-cpp.md)-et.

### K: "Cannot find variable" vagy "Undefined variable" hibakat kapok.
**V:** Ez altalaban azt jelenti, hogy egy magasabb script retegbol hivatkozol egy osztalyra vagy valtozora. Az alacsonyabb retegek (`3_Game`) nem lathatjak a magasabb retegekben (`4_World`, `5_Mission`) definialt tipusokat. Mozditsd at az osztalydefiniciot a megfelelo retegbe, vagy hasznald a `typename` refleksziyt laza kapcsolashoz. Lasd a [2.1 Fejezet](02-mod-structure/01-five-layers.md)-et.

### K: Miert nem adja vissza a `JsonFileLoader<T>.JsonLoadFile()` az adataimat?
**V:** A `JsonLoadFile()` `void`-ot ad vissza, nem a betoltott objektumot. Elore le kell foglalnod az objektumot es referenciaparameterkent kell atadnod: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. A visszateresi ertek hozzarendelese csendben `null`-t ad. Lasd a [6.8 Fejezet](06-engine-api/08-file-io.md)-et.

### K: Az RPC-m el van kuldve, de soha nem erkezik meg a masik oldalon.
**V:** Ellenorizd ezeket a gyakori okokat: (1) Az RPC ID nem egyezik a kuldo es a fogado kozott. (2) Kliensrol kuldesz, de a kliensen figyelsz (vagy szerver-a-szerverre). (3) Elfelejtetted regisztralni az RPC kezelot az `OnRPC()`-ben vagy az egyedi kezelodben. (4) A cel entitas `null` vagy nincs halozatilag szinkronizalva. Lasd a [6.9 Fejezet](06-engine-api/09-networking.md)-et es a [7.3 Fejezet](07-patterns/03-rpc-patterns.md)-et.

### K: "Error: Member already defined" hibat kapok egy else-if blokkban.
**V:** Az Enforce Script nem engedlyezi a valtozo ujradeklaralasat testver `else if` blokkokban ugyanabban a hatakorben. Deklarald a valtozot egyszer az `if`/`else` lanc elott, vagy hasznalj kulon hatakoroket kapcsos zarojelekkel. Lasd az [1.12 Fejezet](01-enforce-script/12-gotchas.md)-et.

### K: A UI layout-om nem jelenit meg semmit / a widgetek lathatatlanok.
**V:** Gyakori okok: (1) A widget merete nulla -- ellenorizd, hogy a szelesseg/magassag helyesen van beallitva (nincsenek negativ ertekek). (2) A widget nincs `Show(true)` allapotban. (3) A szoveg szinenek alfa erteke 0 (teljesen atlatszo). (4) A layout utvonala a `CreateWidgets()`-ben helytelen (nem dob hibat, egyszeruen `null`-t ad vissza). Lasd a [3.3 Fejezet](03-gui-system/03-sizing-positioning.md)-et.

### K: A modom osszeomlast okoz a szerver indulaskor.
**V:** Ellenorizd: (1) Csak kliensoldali metodusok hivasa (`GetGame().GetPlayer()`, UI kod) a szerveren. (2) `null` referencia az `OnInit`-ben vagy `OnMissionStart`-ban mielott a vilag keszen allna. (3) Vegtelen rekurzio egy `modded class` felulirasan, ahol elfelejtetted meghivni a `super`-t. Mindig adj hozza vedo zaradekokat, mivel nincs try/catch. Lasd az [1.11 Fejezet](01-enforce-script/11-error-handling.md)-et.

### K: A fordított per jel vagy idezojel karakterek a szovegekben elemzesi hibakat okoznak.
**V:** Az Enforce Script elemzoje (CParser) nem tamogatja a `\\` vagy `\"` escape szekvenciakat szovegliteralokban. Kerult el a fordtott per jeleket teljesen. Fajl utvonalakhoz hasznalj per jeleket (`"my/path/file.json"`). Idezowjelekhez a szovegekben hasznalj egyes idezowjeleket vagy szoveg osszeillesztest. Lasd az [1.12 Fejezet](01-enforce-script/12-gotchas.md)-et.

---

## Architekturalis dontesek

### K: Mi az otretegu script hierarchia es miert fontos?
**V:** A DayZ scriptek ot szamozott retegben fordulnak le: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Minden reteg csak az ugyanolyan vagy alacsonyabb szamu reteg tipusaira hivatkozhat. Ez architekturalis hatarokat kenyszerit ki -- a megosztott enumokat es konstansokat a `3_Game`-be, az entitas logikajat a `4_World`-be, a UI/mission hookokat az `5_Mission`-ba helyezd. Lasd a [2.1 Fejezet](02-mod-structure/01-five-layers.md)-et.

### K: `modded class`-t hasznaljak vagy uj osztalyokat hozzak letre?
**V:** Hasznalj `modded class`-t, amikor meglevo vanilla viselkedest kell modositanod vagy bovitened (metodus hozzaadasa a `PlayerBase`-hez, hookoloads a `MissionServer`-be). Hozz letre uj osztalyokat onallo rendszerekhez, amelyeknek nem kell semmit felulirniuk. A moddolt osztalyok automatikusan lancba fuzonek -- mindig hivd meg a `super`-t, hogy ne tord el a tobbi modot. Lasd az [1.4 Fejezet](01-enforce-script/04-modded-classes.md)-et.

### K: Hogyan szervezzem a kliens vs. szerver kodot?
**V:** Hasznalj `#ifdef SERVER` es `#ifdef CLIENT` preproszesszor guardokat olyan kodhoz, amely csak az egyik oldalon futhat. Nagyobb modoknal oszd szet kulon PBO-kra: kliens mod (UI, rendereles, lokalis effektek) es szerver mod (spawnolas, logika, perzisztencia). Ez megakadalyozza a szerver logika kiszivargasat a kliensekhez. Lasd a [2.5 Fejezet](02-mod-structure/05-file-organization.md)-et es a [6.9 Fejezet](06-engine-api/09-networking.md)-et.

### K: Mikor hasznaljak Singleton-t vs. Modul/Plugin-t?
**V:** Hasznalj Modult (a CF `PluginManager`-en vagy sajat modulrendszeren keresztul regisztralva), amikor eletciklus kezelesre van szukseged (`OnInit`, `OnUpdate`, `OnMissionFinish`). Hasznalj onallo Singletont allapotmentes hasznos szolgaltatasokhoz, amelyeknek csak globalis hozzaferesre van szukseguk. A modulok elonyosebbek barmire, aminek allapota vagy takaritasi igenyei vannak. Lasd a [7.1 Fejezet](07-patterns/01-singletons.md)-et es a [7.2 Fejezet](07-patterns/02-module-systems.md)-et.

### K: Hogyan tarolhatok biztonsagosan jatekosonkenti adatokat, amelyek tulelik a szerver ujrainditasat?
**V:** Ments JSON fajlokat a szerver `$profile:` konyvtaraba a `JsonFileLoader` hasznalataval. Hasznald a jatekos Steam UID-jet (a `PlayerIdentity.GetId()`-bol) fajlnevkent. Toltsd be a jatekos csatlakozasakor, mentsd le a lecsatlakozaskor es periodikusan a jatek kozben. Mindig elegansan kezeld a hianyzo/sérult fajlokat vedo zaradekokkal. Lasd a [7.4 Fejezet](07-patterns/04-config-persistence.md)-et es a [6.8 Fejezet](06-engine-api/08-file-io.md)-et.

---

## Publikalas es terjesztes

### K: Hogyan csomagolom be a modomat PBO-ba?
**V:** Hasznald az Addon Builder-t (a DayZ Tools-bol) vagy harmadik feles eszkozoket, mint a PBO Manager. Iranyitsd a mod forrasmappajara, allitsd be a helyes prefixet (a `config.cpp` addon prefixenek megfelelo) es epitsd meg. A kimeneti `.pbo` fajl a mod `Addons/` mappajaba kerul. Lasd a [4.6 Fejezet](04-file-formats/06-pbo-packing.md)-et.

### K: Hogyan irom ala a modomat szerveren valo hasznalathoz?
**V:** Generalj kulcspart a DayZ Tools DSSignFile vagy DSCreateKey segitsegevel: ez egy `.biprivatekey` es `.bikey` fajlt keszit. Ird ala minden PBO-t a privat kulccsal (`.bisign` fajlokat hoz letre minden PBO melle). A `.bikey`-t terjeszd a szerver adminoknak a `keys/` mappajukba. Soha ne oszd meg a `.biprivatekey`-t. Lasd a [4.6 Fejezet](04-file-formats/06-pbo-packing.md)-et.

### K: Hogyan publikalok a Steam Workshop-on?
**V:** Hasznald a DayZ Tools Publisher-t vagy a Steam Workshop feltoltot. Szukseged van egy `mod.cpp` fajlra a mod gyokereben, amely meghataroza a nevet, szerzot es leirast. A publisher feltolti a becsomagolt PBO-kat, es a Steam Workshop ID-t rendel hozza. Frissitsd ujra publikalassal ugyanarrol a fiokrol. Lasd a [2.3 Fejezet](02-mod-structure/03-mod-cpp.md)-et es a [8.7 Fejezet](08-tutorials/07-publishing-workshop.md)-et.

### K: A modom igenyelheti mas modokat fuggosegkent?
**V:** Igen. A `config.cpp`-ben add hozza a fuggo mod `CfgPatches` osztalynevet a `requiredAddons[]` tombodhoz. A `mod.cpp`-ben nincs formalis fuggosegi rendszer -- a szukseges modokat dokumentald a Workshop leirasban. A jatekosoknak feliratkozniuk kell es be kell tolteniuk az osszes szukseges modot. Lasd a [2.2 Fejezet](02-mod-structure/02-config-cpp.md)-et.

---

## Halado temak

### K: Hogyan hozok letre egyeni jatekos akciokat (interakciokat)?
**V:** Bovitsd az `ActionBase`-t (vagy egy alosztaly, mint az `ActionInteractBase`), definiald a `CreateConditionComponents()`-ot az elofeltetelekhez, ird felul az `OnStart`/`OnExecute`/`OnEnd`-et a logikahoz, es regisztrald a `SetActions()`-ben a cel entitason. Az akciok folyamatos (nyomva tartas) es azonnali (kattintas) modokat tamogatnak. Lasd a [6.12 Fejezet](06-engine-api/12-action-system.md)-et.

### K: Hogyan mukodik a sebzesi rendszer az egyeni targyakhoz?
**V:** Definiald a `DamageSystem` osztalyt az item config.cpp-jeben `DamageZones`-okkal (elnevezett regiok) es `ArmorType` ertekekkel. Minden zona sajat elet pontjait koveti. Ird felul az `EEHitBy()`-t es `EEKilled()`-et a scriptben az egyeni sebes reakciokhoz. A motor a modell Fire Geometry komponenseit a zona nevekhez rendeli. Lasd a [6.1 Fejezet](06-engine-api/01-entity-system.md)-et.

### K: Hogyan adhatok hozza egyeni billentyuparancsokat a modomhoz?
**V:** Keszits egy `inputs.xml` fajlt, amely definalja a bemeneti akcioidat alapertelmezett billentyuhozzarendelesekkel. Regisztrald oket a scriptben a `GetUApi().RegisterInput()` segitsegevel. Kerdezd le az allapotot a `GetUApi().GetInputByName("your_action").LocalPress()` hasznalataval. Adj hozza lokalizalt neveket a `stringtable.csv`-ben. Lasd az [5.2 Fejezet](05-config-files/02-inputs-xml.md)-et es a [6.13 Fejezet](06-engine-api/13-input-system.md)-et.

### K: Hogyan biztositom a modom kompatibilitasat mas modokkal?
**V:** Kovesd ezeket az elveket: (1) Mindig hivd meg a `super`-t modded class felulirasokban. (2) Hasznalj egyedi osztaly neveket mod prefixszel (pl. `MyMod_Manager`). (3) Hasznalj egyedi RPC ID-kat. (4) Ne ird felul a vanilla metodusokat `super` hivas nelkul. (5) Hasznalj `#ifdef`-et opcionalis fuggosegek felismeresehez. (6) Tesztelj nepszeru mod kombinaciokkal (CF, Expansion stb.). Lasd a [7.2 Fejezet](07-patterns/02-module-systems.md)-et.

### K: Hogyan optimalizalom a modomat szerver teljesitmenyhez?
**V:** Fobb strategiak: (1) Keruldd a per-frame (`OnUpdate`) logikat -- hasznalj idzitokot vagy esemenyvezerelt tervezest. (2) Cache-eld a referenciakat ahelyett, hogy ismetelten hivnad a `GetGame().GetPlayer()`-t. (3) Hasznalj `GetGame().IsServer()` / `GetGame().IsClient()` guardokat a felesleges kod athidalasahoz. (4) Profilald `int start = TickCount(0);` benchmarkokkal. (5) Korlatazd a halozati forgalmat -- csoportositsd az RPC-ket es hasznalj Net Sync Variables-t gyarki kis frissitesekhez. Lasd a [7.7 Fejezet](07-patterns/07-performance.md)-et.

---

*Van kerdesed, amit itt nem valaszoltak meg? Nyiss issue-t a repository-ban.*
