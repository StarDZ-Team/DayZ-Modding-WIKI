# Gyakran Ismetelt Kerdesek

[Fooldal](../README.md) | **GYIK**

---

## Kezdo lepesek

### K: Mire van szuksegem a DayZ moddolashoz?
**V:** Szukseged van Steamre, DayZ-re (kiskereskedelmi peldany), DayZ Tools-ra (ingyenes a Steamen az Eszkozok alatt) es egy szovegszerkesztore (VS Code ajanlott). Programozasi tapasztalat nem feltetlenul szukseges — kezdd a [8.1 Fejezet: Az elso modod](08-tutorials/01-first-mod.md) resznel. A DayZ Tools tartalmazza az Object Buildert, Addon Buildert, TexView2-t es a Workbench IDE-t.

### K: Milyen programozasi nyelvet hasznal a DayZ?
**V:** A DayZ az **Enforce Script**-et hasznalja, ami a Bohemia Interactive sajat nyelve. C-szeru szintaxissal rendelkezik, hasonlo a C#-hoz, de sajat szabalyokkal es korlatozasokkal (nincs ternar operator, nincs try/catch, nincsenek lambdak). Lasd [1. Resz: Enforce Script](01-enforce-script/01-variables-types.md) a teljes nyelvi utmutatoert.

### K: Hogyan allitom be a P: meghajto?
**V:** Nyisd meg a DayZ Tools-t a Steamrol, kattints a "Workdrive" vagy "Setup Workdrive" gombra a P: meghajto csatlakozatasahoz. Ez letrehoz egy virtualis meghajtat, amely a moddolasi munkateruletre mutat, ahol a motor a forrasfajlokat keresi fejlesztes kozben. Hasznalhatod a `subst P: "C:\Az\Utad"` parancsot is a parancssorbol. Lasd [4.5 Fejezet](04-file-formats/05-dayz-tools.md).

### K: Tesztelhetem a modomat dedikalt szerver nelkul?
**V:** Igen. Inditsd el a DayZ-t a `-filePatching` parameterrel es a betoltott moddal. Gyors teszteleshez hasznalj Listen Servert (hosztolas a jatek menubol). Produkcio teszteleshez mindig ellenorizd dedikalt szerveren is, mert egyes kod utak kulonboznek. Lasd [8.1 Fejezet](08-tutorials/01-first-mod.md).

### K: Hol talalom meg a vanilla DayZ szkript fajlokat tanulmanyhozasra?
**V:** A P: meghajto csatlakoztatasa utan a DayZ Tools-szal, a vanilla szkriptek a `P:\DZ\scripts\` helyen talalhatoak, retegek szerint rendezve (`3_Game`, `4_World`, `5_Mission`). Ezek a megiranyadok minden motor osztalyhoz, metodushoz es esemenyhez. Lasd meg a [Puskalapot](cheatsheet.md) es az [API Gyors Referenciat](06-engine-api/quick-reference.md).

---

## Gyakori hibak es javitasok

### K: A modom betoltodik, de semmi nem tortenik. Nincs hiba a logban.
**V:** Legvaloszinubb, hogy a `config.cpp`-ben hibas a `requiredAddons[]` bejegyzes, igy a szkriptjeid tul koran vagy egyaltalan nem toltodnek be. Ellenorizd, hogy minden addon nev a `requiredAddons`-ban pontosan megegyezik egy letezo `CfgPatches` osztaly nevevel (kis- es nagybetu erkezeny). Ellenorizd a szkript logot a `%localappdata%/DayZ/` helyen a csendes figyelmeztetesekert. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md).

### K: "Cannot find variable" vagy "Undefined variable" hibakat kapok.
**V:** Ez altalaban azt jelenti, hogy egy magasabb szkript reteg osztalyara vagy valtozojara hivatkozol. Az alacsonyabb retegek (`3_Game`) nem latjak a magasabb retegekben (`4_World`, `5_Mission`) definialt tipusokat. Mozditsd az osztaly definiciot a megfelelo retegbe, vagy hasznalj `typename` reflekszhiot a laza csatolashoz. Lasd [2.1 Fejezet](02-mod-structure/01-five-layers.md).

### K: Miert nem adja vissza a `JsonFileLoader<T>.JsonLoadFile()` az adataimat?
**V:** A `JsonLoadFile()` `void`-ot ad vissza, nem a betoltott objektumot. Elore le kell foglalnod az objektumot es referenciaparameterkent atadni: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. A visszateresi ertek hozzarendelese csendben `null`-t ad. Lasd [6.8 Fejezet](06-engine-api/08-file-io.md).

### K: Az RPC-m elkuldve, de soha nem fogadja a masik oldal.
**V:** Ellenorizd ezeket a gyakori okokat: (1) Az RPC ID nem egyezik a kuldo es a fogado kozott. (2) Kliensrol kuldod, de kliensen figyeled (vagy szerver-szerver). (3) Elfelejtetted regisztralni az RPC handlert az `OnRPC()`-ben vagy a sajat handlerben. (4) A cel entitas `null` vagy nem halozatilag szinkronizalt. Lasd [6.9 Fejezet](06-engine-api/09-networking.md) es [7.3 Fejezet](07-patterns/03-rpc-patterns.md).

### K: "Error: Member already defined" hibat kapok egy else-if blokkban.
**V:** Az Enforce Script nem engedelyezi a valtozo ujradeklaralasat szomszedos `else if` blokkokban ugyanabban a hatokörben. Deklarald a valtozot egyszer az `if` lanc elott, vagy hasznalj kulon hatokort kapcsos zarojelekkel. Lasd [1.12 Fejezet](01-enforce-script/12-gotchas.md).

### K: A UI layoutom nem mutat semmit / a widgetek lathatatlanok.
**V:** Gyakori okok: (1) A widget merete nulla — ellenorizd, hogy a szelesseg/magassag helyesen van beallitva (nincs negativ ertek). (2) A widget nincs `Show(true)`. (3) A szoveg szinenek alfaja 0 (teljesen atlatszo). (4) A layout utvonal a `CreateWidgets()`-ben hibas (nem keletkezik hiba, egyszeruen `null`-t ad vissza). Lasd [3.3 Fejezet](03-gui-system/03-sizing-positioning.md).

### K: A modom osszeomlik a szerver indulasakor.
**V:** Ellenorizd: (1) Csak kliens oldali metodusok (`GetGame().GetPlayer()`, UI kod) hivasa a szerveren. (2) `null` referencia az `OnInit`-ben vagy `OnMissionStart`-ban, mielott a vilag kesz lenne. (3) Vegtelen rekurzio egy `modded class` feluliraasban, ami elfelejtette hivni a `super`-t. Mindig adj hozza vedo felteteleket, mert nincs try/catch. Lasd [1.11 Fejezet](01-enforce-script/11-error-handling.md).

### K: A fordított per jel vagy idezojel karakterek a sztringjaimben elemzesi hibakat okoznak.
**V:** Az Enforce Script elemzoje (CParser) nem tamogatja a `\\` vagy `\"` escape szekvenciakat sztring literalokban. Kerüld el teljesen a fordított per jeleket. Fajl utvonalakhoz hasznalj normalis per jelet (`"my/path/file.json"`). Idezojelekhez a sztringekben hasznalj egyes idezojel karaktereket vagy sztring osszefsuzest. Lasd [1.12 Fejezet](01-enforce-script/12-gotchas.md).

---

## Architekturalis döntesek

### K: Mi az 5 reteges szkript hierarchia es miert fontos?
**V:** A DayZ szkriptek ot szamozott retegben kompilalodnak: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Minden reteg csak azonos vagy alacsonyabb szamu retegek tipusaira hivatkozhat. Ez architekturalis hatarok kikenyszeriti — a megosztott enumokat es konstantokat a `3_Game`-be, az entitas logikát a `4_World`-be, az UI/misszio hookokat az `5_Mission`-be helyezd. Lasd [2.1 Fejezet](02-mod-structure/01-five-layers.md).

### K: Hasznaljak a `modded class`-t vagy hozzak letre uj osztalyokat?
**V:** Hasznald a `modded class`-t, amikor meg kell valtoztatnod vagy ki kell terjesztened a meglevo vanilla viselkedest (metodus hozzaadasa a `PlayerBase`-hez, hookalas a `MissionServer`-be). Hozz letre uj osztalyokat onallo rendszerekhez, amelyeknek nem kell semmit felulirniuk. A moddolt osztalyok automatikusan lancolodnak — mindig hivd meg a `super`-t, hogy ne tord el a tobbi modot. Lasd [1.4 Fejezet](01-enforce-script/04-modded-classes.md).

### K: Hogyan szervezzem a kliens vs. szerver kodot?
**V:** Hasznalj `#ifdef SERVER` es `#ifdef CLIENT` preprocesszor felteteleket a kodhoz, amelynek csak az egyik oldalon kell futnia. Nagyobb modoknal oszd szet kulon PBO-kra: kliens mod (UI, rendereles, lokalis effektek) es szerver mod (spawn, logika, perzisztencia). Ez megakadalyozza a szerver logika kiszivargasat a kliensekhez. Lasd [2.5 Fejezet](02-mod-structure/05-file-organization.md) es [6.9 Fejezet](06-engine-api/09-networking.md).

### K: Mikor hasznaljak Singletont vs. Modul/Plugint?
**V:** Hasznalj Modult (regisztralt a CF `PluginManager`-rel vagy sajat modul rendszerrel), amikor eletciklus kezelesr van szukseged (`OnInit`, `OnUpdate`, `OnMissionFinish`). Hasznalj onallo Singletont allapot nelkuli segedszolgaltatasokhoz, amelyeknek csak globalis hozzaferesre van szukseguk. A modulok preferaltak barmihez, ami allapottal rendelkezik vagy takaritast igenyel. Lasd [7.1 Fejezet](07-patterns/01-singletons.md) es [7.2 Fejezet](07-patterns/02-module-systems.md).

### K: Hogyan tarolok biztonsagosan jatekosonkenti adatokat, amelyek tulielik a szerver ujrainditast?
**V:** Mentsd a JSON fajlokat a szerver `$profile:` konyvtaraba a `JsonFileLoader` hasznalataval. Hasznald a jatekos Steam UID-jet (a `PlayerIdentity.GetId()`-bol) fajlnevkent. Toltsd be a jatekos csatlakozasakor, mentsd kilepes es periodikusan. Mindig kezeld a hianyzo/serult fajlokat elegansen vedo feltetelekkel. Lasd [7.4 Fejezet](07-patterns/04-config-persistence.md) es [6.8 Fejezet](06-engine-api/08-file-io.md).

---

## Publikalas es terjesztes

### K: Hogyan csomagolom a modomat PBO-ba?
**V:** Hasznald az Addon Buildert (a DayZ Tools-bol) vagy harmadik feles eszkozoket mint a PBO Manager. Iranyitsd a mod forras mappajara, allitsd be a helyes prefixet (megegyezik a `config.cpp` addon prefixevel) es epitsd. A kimeneti `.pbo` fajl a mod `Addons/` mappajaba kerul. Lasd [4.6 Fejezet](04-file-formats/06-pbo-packing.md).

### K: Hogyan irom ala a modomat szerver hasznalatra?
**V:** Generalj kulcspart a DayZ Tools DSSignFile vagy DSCreateKey segitsegevel: ez letrehoz egy `.biprivatekey` es `.bikey` fajlt. Ird ala minden PBO-t a privat kulccsal (letrehozza a `.bisign` fajlokat minden PBO mellett). Oszd meg a `.bikey`-t a szerver adminisztratorkkal a `keys/` mappajukba. Soha ne oszd meg a `.biprivatekey`-t. Lasd [4.6 Fejezet](04-file-formats/06-pbo-packing.md).

### K: Hogyan publikalom a Steam Workshopon?
**V:** Hasznald a DayZ Tools Publishert vagy a Steam Workshop feltoltot. Szukseged van egy `mod.cpp` fajlra a mod gyokermappajaban, ami definalja a nevet, szerzot es leirast. A publisher feltolti a csomagolt PBO-kat, es a Steam hozzarendel egy Workshop ID-t. Frissitsd ujrapublikalssal ugyanarrol a fiokrol. Lasd [2.3 Fejezet](02-mod-structure/03-mod-cpp.md) es [8.7 Fejezet](08-tutorials/07-publishing-workshop.md).

### K: Megkovetelheti a modom mas modokat fuggosegkent?
**V:** Igen. A `config.cpp`-ben add hozza a fuggoseg mod `CfgPatches` osztaly nevet a `requiredAddons[]` tombhoz. A `mod.cpp`-ben nincs formalis fuggosegi rendszer — dokumentald a szukseges modokat a Workshop leirasban. A jatekosoknak feliratkozniuk kell es be kell tolteniuk az osszes szukseges modot. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md).

---

## Halado temak

### K: Hogyan hozok letre egyedi jatekos akciiokat (interakciokat)?
**V:** Terjeszd ki az `ActionBase`-t (vagy egy alosztaly mint az `ActionInteractBase`), definiald a `CreateConditionComponents()`-t az eloefeltetelekhez, irjd felul az `OnStart`/`OnExecute`/`OnEnd`-et a logikahoz, es regisztrald a `SetActions()`-ben a cel entitason. Az akciok tamogatjak a folyamatos (tartott) es azonnali (kattintas) modot. Lasd [6.12 Fejezet](06-engine-api/12-action-system.md).

### K: Hogyan mukodik a sebzesi rendszer egyedi targyakhoz?
**V:** Definiald a `DamageSystem` osztalyt a targy config.cpp-jeben `DamageZones`-szal (megnevezett regiok) es `ArmorType` ertekekkel. Minden zona sajat egeszseg erteket koveti. Irjd felul az `EEHitBy()` es `EEKilled()` metodusokat szkriptben egyedi sebzesi reakciokhoz. A motor a modell Fire Geometry komponenseit a zona nevekhez rendeli. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

### K: Hogyan adhatok hozza egyedi billentyukombinaciokat a modomhoz?
**V:** Hozz letre egy `inputs.xml` fajlt, ami definialja a bemeneti akciokat alapertelmezett billentyu hozzarendelessel. Regisztrald oket szkriptben a `GetUApi().RegisterInput()` segitsegevel. Kerdezd le az allapotot a `GetUApi().GetInputByName("sajat_akcio").LocalPress()` hasznalataval. Adj hozza lokalizalt neveket a `stringtable.csv`-ben. Lasd [5.2 Fejezet](05-config-files/02-inputs-xml.md) es [6.13 Fejezet](06-engine-api/13-input-system.md).

### K: Hogyan biztositom a modom kompatibilitasat mas modokkal?
**V:** Tartsd be ezeket az elveket: (1) Mindig hivd meg a `super`-t a moddolt osztaly feluliraasokban. (2) Hasznalj egyedi osztaly neveket mod prefixszel (pl. `SajatMod_Manager`). (3) Hasznalj egyedi RPC ID-kat. (4) Ne irjd felul a vanilla metodusokat `super` hivas nelkul. (5) Hasznalj `#ifdef`-et az opcionalis fuggosegek felismeresehez. (6) Tesztelj nepszeru mod kombinaciokkal (CF, Expansion, stb.). Lasd [7.2 Fejezet](07-patterns/02-module-systems.md).

### K: Hogyan optimalizalom a modomat a szerver teljesitmenyehez?
**V:** Fo strategiak: (1) Kerüld a kockankenti (`OnUpdate`) logikat — hasznalj idozitroket vagy esemeny vezerelt tervezest. (2) Gyorsitotarazd a referenciakat a `GetGame().GetPlayer()` ismetelt hivasa helyett. (3) Hasznalj `GetGame().IsServer()` / `GetGame().IsClient()` vedo felteteleket a felesleges kod kihagyasahoz. (4) Profilozz `int start = TickCount(0);` benchmarkokkal. (5) Korltozd a halozati forgalmat — kosd ossze az RPC-ket es hasznalj Net Sync Variableket a gyakori kis frissitesekhez. Lasd [7.7 Fejezet](07-patterns/07-performance.md).

---

*Olyan kerdesed van, amit itt nem talalsz? Nyiss egy issue-t a repoban.*
