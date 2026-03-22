# DayZ Modding Szotar

[Fooldal](../README.md) | **Szotar**

---

Atfogo referenczia a wikiben es a DayZ moddingban hasznalt kifejezesekrol.

---

## A

**Action (Akcio)** — Jatekos interakcio egy targgyal vagy a vilaggal (eves, ajto nyitas, javitas). Az akciokat az `ActionBase` segitsegevel epitik fel feltetelekkel es callback fazisokkal. Lasd [6.12 Fejezet](06-engine-api/12-action-system.md).

**Addon Builder** — DayZ Tools alkalmazas, amely a mod fajlokat PBO archivumokba csomagolja. Kezeli a binarizalast, fajl alairast es prefix leképezest. Lasd [4.6 Fejezet](04-file-formats/06-pbo-packing.md).

**autoptr** — Hatokoru eros referenczia mutato az Enforce Scriptben. A hivatkozott objektum automatikusan megsemmisul, amikor az `autoptr` elhagyja a hatokort. Ritkán hasznalt a DayZ moddingban (preferald az explicit `ref`-et). Lasd [1.8 Fejezet](01-enforce-script/08-memory-management.md).

---

## B

**Binarize (Binarizalas)** — Forrasfajlok (`config.cpp`, `.p3d`, `.tga`) konvertalasanak folyamata optimalizalt motor-kesz formatumokba (`.bin`, ODOL, `.paa`). Automatikusan vegrehajtja az Addon Builder vagy a Binarize eszkoz a DayZ Tools-ban. Lasd [4.6 Fejezet](04-file-formats/06-pbo-packing.md).

**bikey / biprivatekey / bisign** — Lasd [Kulcs Alairas](#k).

---

## C

**CallQueue** — DayZ motor segedeszkoz keseltetett vagy ismetlodo fuggvenyhivasok utemezesere. Elerheto a `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` segitsegevel. Lasd [6.7 Fejezet](06-engine-api/07-timers.md).

**CastTo** — Lasd [Class.CastTo](#classcasto).

**Central Economy (CE) — Kozponti Gazdasag** — A DayZ loot elosztasi es perzisztencia rendszere. XML fajlokon (`types.xml`, `mapgrouppos.xml`, `cfglimitsdefinition.xml`) keresztul konfiguralhato, amelyek meghatarozzak mit, hol es milyen gyakran spawnol. Lasd [6.10 Fejezet](06-engine-api/10-central-economy.md).

**CfgMods** — A config.cpp legfelso szintu osztalya, amely regisztralja a modot a motorban. Definalja a mod nevet, szkript konyvtarakat, szukseges fuggosegeket es addon betoltesi sorrendet. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md).

**CfgPatches** — Config.cpp osztaly, amely egyedi addonokat (szkript csomagok, modellek, texturak) regisztral egy modon belul. A `requiredAddons[]` tomb szabalyozza a betoltesi sorrendet a modok kozott. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md).

**CfgVehicles** — Config.cpp osztaly hierarchia, amely minden jatek entitast definal: targyak, epuletek, jarmuvek, allatok es jatekosok. A neve ellenere sokkal tobbet tartalmaz mint csak jarmuveket. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md).

**Class.CastTo** — Statikus metodus a biztonsagos lekonverziohoz az Enforce Scriptben. `true`-t ad vissza ha a konverzio sikerult. Szukseges, mert az Enforce Script nem rendelkezik `as` kulcsszoval. Hasznalat: `Class.CastTo(result, source)`. Lasd [1.9 Fejezet](01-enforce-script/09-casting-reflection.md).

**CommunityFramework (CF)** — Harmadik feles framework mod Jacob_Mango-tol, amely modul eletciklus kezelest, logolast, RPC segedleteket, fajl I/O segedeszkoozokat es ketszeresen lancolt lista adatstrukturakat biztosit. Sok nepszeru mod fugg tole. Lasd [7.2 Fejezet](07-patterns/02-module-systems.md).

**config.cpp** — Minden DayZ mod kozponti konfiguracios fajlja. Definalja a `CfgPatches`, `CfgMods`, `CfgVehicles` es mas osztaly hierarchiakat, amelyeket a motor inditaskor olvas. Ez NEM C++ kod a kiterjesztes ellenere. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md).

---

## D

**DamageSystem (Sebzesi rendszer)** — A motor alrendszere, amely kezeli a talalt regisztraciot, sebzesi zonakat, elet/ver/sokk ertekeket es pancelszamitasokat az entitasokon. A config.cpp `DamageSystem` osztalyon keresztul konfiguralhato zonakkal es talalat komponensekkel. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**DayZ Tools** — Ingyenes Steam alkalmazas, amely a hivatalos modding eszkozkettet tartalmazza: Object Builder, Terrain Builder, Addon Builder, TexView2, Workbench es P: meghajto kezeles. Lasd [4.5 Fejezet](04-file-formats/05-dayz-tools.md).

**DayZPlayer** — Alaposztaly minden jatekos entitashoz a motorban. Hozzaferest biztosit a mozgas, animacio, inventar es bemenet rendszerekhez. A `PlayerBase` kiterjeszti ezt az osztalyt es a tipikus moddolasi belepesi pont. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**Dedicated Server (Dedikalt szerver)** — Onallo fej nelkuli szerver folyamat (`DayZServer_x64.exe`), amelyet tobbjaekos hosztolasra hasznalnak. Csak szerver oldali szkripteket futtat. Kontrasztban a [Listen Server](#l)-rel.

---

## E

**EEInit** — Motor esemenymodus, amelyet az entitas inicializalasakor hivnak meg a letrehozas utan. Irjd felul az entitas osztalyodban a beallitasi logika vegrehajtasahoz. Kliensen es szerveren egyarant meghivodik. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**EEKilled** — Motor esemenymodus, amelyet akkor hivnak meg, amikor egy entitas elete eleri a nullat. Hasznalatos halal logikara, loot eldobasra es oles koevetesre. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**EEHitBy** — Motor esemenymodus, amelyet akkor hivnak meg, amikor egy entitas sebzest kap. A parameterek kozet tartozik a sebzes forrasa, a talalt komponens, a sebzes tipusa es a sebzesi zonak. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**EEItemAttached** — Motor esemenymodus, amelyet akkor hivnak meg, amikor egy targyat csatolnak egy entitas inventar slotjahoz (pl. tavcso csatolasa fegyverhez). Parosulva az `EEItemDetached`-del. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**Enforce Script** — A Bohemia Interactive sajat szkriptnyelve, amelyet a DayZ-ben es az Enfusion motoros jatekokban hasznalnak. C-szeru szintaxis, hasonlo a C#-hoz, de egyedi korlatozasokkal (nincs ternar, nincs try/catch, nincsenek lambdak). Lasd [1. Resz](01-enforce-script/01-variables-types.md).

**EntityAI** — Alaposztaly minden "intelligens" entitashoz a DayZ-ben (jatekosok, allatok, zombik, targyak). Kiterjeszti az `Entity`-t inventarral, sebzesi rendszerrel es AI interfeszekkel. A legtobb targy es karakter modding itt kezdodik. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**EventBus (Esemenybusz)** — Publish-subscribe minta szetvalaztott kommunikaciohoz rendszerek kozott. A modulok feliratkoznak megnevezett esemenyekre es callbackeket kapnak az esemenyek kivaaltasakor, kozvetlen fuggosegek nelkul. Lasd [7.6 Fejezet](07-patterns/06-events.md).

---

## F

**File Patching (Fajl foltozas)** — Inditasi parameter (`-filePatching`), amely lehetove teszi a motor szamara, hogy laza fajlokat toltsoen be a P: meghajtrol a csomagolt PBO-k helyett. Nelkulozhetetlen a gyors fejlesztesi iteraciohoz. Kliensen es szerveren egyarant engedelyezni kell. Lasd [4.6 Fejezet](04-file-formats/06-pbo-packing.md).

**Fire Geometry** — Specializalt LOD egy 3D modellben (`.p3d`), amely meghatározza azokat a feluleteket, ahol a golyok becsapodhatnak es sebzest okozhatnak. Kulonbozik a View Geometry-tol es a Geometry LOD-tol. Lasd [4.2 Fejezet](04-file-formats/02-models.md).

---

## G

**GameInventory** — Motor osztaly, amely kezeli egy entitas inventar rendszeret. Metodusokat biztosit targyak hozzaadasahoz, eltavolitasahoz, keresesehez es atszallitasahoz kontenerek es slotok kozott. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**GetGame()** — Globalis fuggveny, amely a `CGame` singletont adja vissza. Belepesi pont a misszio, jatekosok, hivas sorok, RPC, idojaras es mas motor rendszerek eleresehez. Mindenhol elerheto a szkriptben. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**GetUApi()** — Globalis fuggveny, amely a `UAInputAPI` singletont adja vissza a bemenet rendszerhez. Egyedi billentyukombinciok regisztralaasra es lekerdezesere hasznalatos. Lasd [6.13 Fejezet](06-engine-api/13-input-system.md).

**Geometry LOD** — 3D modell reszletessegi szint fizikai utkozeseszleleshez (jatekos mozgas, jarmu fizika). Kulonallo a View Geometry-tol es Fire Geometry-tol. Lasd [4.2 Fejezet](04-file-formats/02-models.md).

**Guard Clause (Vedo feltetel)** — Defenziv programozasi minta: elofeletelek ellenorzese a metodus elejen es korai visszateres ha nem teljesulnek. Nelkulozhetetlen az Enforce Scriptben, mert nincs try/catch. Lasd [1.11 Fejezet](01-enforce-script/11-error-handling.md).

---

## H

**Hidden Selections (Rejtett szelekciok)** — Megnevezett textura/anyag slotok egy 3D modellen, amelyeket futtataskor szkripttel lehet cserelni. Alca valtozatokhoz, csapat szinekhez, sebzesi allapotokhoz es dinamikus megjelenes valtozasokhoz hasznaltak. A config.cpp-ben es a modell nevesitett szelekcioiban definialtjak. Lasd [4.2 Fejezet](04-file-formats/02-models.md).

**HUD** — Heads-Up Display: kepernyonon megjelenitett UI elemek, amelyek a jatekment kozben lathatok (egeszseg jelzok, hotbar, iranytu, ertesitesek). `.layout` fajlok es szkriptelt widget osztalyok segitsegevel epulnek. Lasd [3.1 Fejezet](03-gui-system/01-widget-types.md).

---

## I

**IEntity** — A legalalsobb szintu entitas interfesz az Enfusion motorban. Hozzaferest biztosit a transzformaciohoz (pozicio/rotacio), vizualis elemekhez es fizikához. A legtobb modder `EntityAI`-vel vagy magasabb osztalyokkal dolgozik helyette. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**ImageSet** — XML fajl (`.imageset`), amely megnevezett teglalap alakú regiokat definal egy textura atlaszban (`.edds` vagy `.paa`). Ikonokra, gomb grafikakra es UI elemekre valo hivatkozashoz hasznalt, kulon kep fajlok nelkul. Lasd [5.4 Fejezet](05-config-files/04-imagesets.md).

**InventoryLocation** — Motor osztaly, amely leirja egy konkret poziciot az inventar rendszerben: melyik entitas, melyik slot, melyik cargo sor/oszlop. Preciz inventar manipulaciohoz es transzferekhez hasznalt. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**ItemBase** — A standard alaposztaly minden jatekbeli targyhoz (kiterjeszti az `EntityAI`-t). Fegyverek, eszkozok, etelek, ruhak, kontenerek es csatolmanyok mind az `ItemBase`-bol orokolnek. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

---

## J

**JsonFileLoader** — Motor segedeszkoz osztaly JSON fajlok betoltesehez es mentesehez Enforce Scriptben. Fontos figyelmezetes: a `JsonLoadFile()` `void`-ot ad vissza — elore le kell foglalnod egy objektumot es referenciaval kell atadnod, nem a visszateresi erteket hozzarendelni. Lasd [6.8 Fejezet](06-engine-api/08-file-io.md).

---

## K

**Key Signing — Kulcs Alairas (.bikey, .biprivatekey, .bisign)** — A DayZ mod ellenorzesi rendszere. A `.biprivatekey` a PBO-k alairasara szolgal (`.bisign` fajlokat hoz letre). A megfelelo `.bikey` nyilvanos kulcs a szerver `keys/` mappajaba kerul. A szerverek csak azokat a modokat toltik be, amelyeknek alairasai megegyeznek egy telepitett kulccsal. Lasd [4.6 Fejezet](04-file-formats/06-pbo-packing.md).

---

## L

**Layout (.layout fajl)** — XML-alapu UI definicis fajl, amelyet a DayZ GUI rendszere hasznal. Definialja a widget hierarchiat, pozicionalast, meretezest es stilus tulajdonsagokat. Futasidejuleg toltodik be a `GetGame().GetWorkspace().CreateWidgets()` segitsegevel. Lasd [3.2 Fejezet](03-gui-system/02-layout-files.md).

**Listen Server** — A jatek kliensben hosztolt szerver (a jatekos szervrekent es klienskent is mukodik). Hasznos onallo teszteleshez. Egyes kodpaldyak kulonboznek a dedikalt szerverektol — mindig teszteld mindkettot. Lasd [8.1 Fejezet](08-tutorials/01-first-mod.md).

**LOD (Level of Detail — Reszletessegi szint)** — Egy 3D modell tobb verzioja kulonbozo poligonszammal. A motor koztuk valt a kamera tavolsaga alapjan a teljesitmeny optimalizalasa erdekeben. A DayZ modellek speciális celu LOD-okat is tartalmaznak: Geometry, Fire Geometry, View Geometry, Memory es Shadow. Lasd [4.2 Fejezet](04-file-formats/02-models.md).

---

## M

**Managed** — Enforce Script kulcsszo, amely jelzi, hogy egy osztaly peldanyai referenciaval szamlaltak es automatikusan begyujtottek a garbage collector altal. A legtobb DayZ osztaly a `Managed`-bol orokol. Kontrasztban a `Class`-szal (kezileg kezelt). Lasd [1.8 Fejezet](01-enforce-script/08-memory-management.md).

**Memory Point (Memoria pont)** — Megnevezett pont egy 3D modell Memory LOD-jaba beagyazva. Szkriptek hasznaljak poziciok meghatarozasahoz egy objektumon (csovillas eredete, csatolasi pontok, proxy poziciok). Elerheto a `GetMemoryPointPosition()` segitsegevel. Lasd [4.2 Fejezet](04-file-formats/02-models.md).

**Mission (MissionServer / MissionGameplay)** — A legfelso szintu jatek allapot vezerlo. A `MissionServer` a szerveren fut, a `MissionGameplay` a kliensen. Irjd felul oket a jatek inditasba, jatekos csatlakozasokba es leallasba valo hookolashoz. Lasd [6.11 Fejezet](06-engine-api/11-mission-hooks.md).

**mod.cpp** — A mod gyoker mappajaban elhelyezett fajl, amely definalja a Steam Workshop metaadatokat: nev, szerzo, leiras, ikon es akci URL. Nem keverendo ossze a `config.cpp`-vel. Lasd [2.3 Fejezet](02-mod-structure/03-mod-cpp.md).

**Modded Class (Moddolt osztaly)** — Enforce Script mechanizmus (`modded class X extends X`) meglevo osztalyok kiterjesztesehez vagy felulirasahoz az eredeti fajlok modositasa nelkul. A motor automatikusan lancojla az osszes moddolt osztaly definiciot. Ez az elsodleges modja annak, ahogy a modok interakcioban vannak a vanillaval es mas modokkal. Lasd [1.4 Fejezet](01-enforce-script/04-modded-classes.md).

**Module (Modul)** — Onallo funkcionalitasi egyseg, amelyet egy modul menedzsernel regisztralnak (mint a CF `PluginManager`). A moduloknak eletciklus metodusaik vannak (`OnInit`, `OnUpdate`, `OnMissionFinish`) es a mod rendszerek standard architekturaja. Lasd [7.2 Fejezet](07-patterns/02-module-systems.md).

---

## N

**Named Selection (Nevesitett szelekciok)** — Csucspntok/feluolek megnevezett csoportja egy 3D modellben, az Object Builderben letrehozva. Rejtett szelekciohoz (textura csere), sebzesi zonakhoz es animacios celpontokhoz hasznalt. Lasd [4.2 Fejezet](04-file-formats/02-models.md).

**Net Sync Variable (Halozati szinkronizacios valtozo)** — A motor halozati replikacios rendszere altal automatikusan szinkronizalt valtozo a szerverorol minden kliensre. A `RegisterNetSyncVariable*()` metodusokkal regisztralt es az `OnVariablesSynchronized()`-ben fogadott. Lasd [6.9 Fejezet](06-engine-api/09-networking.md).

**notnull** — Enforce Script parameter modosito, amely kozli a kompilerrel, hogy egy referenczia parameter nem lehet `null`. Kompilalasi ideju biztonsagot nyujt es dokumentalja a szandekot. Hasznalat: `void DoWork(notnull MyClass obj)`. Lasd [1.3 Fejezet](01-enforce-script/03-classes-inheritance.md).

---

## O

**Object Builder** — DayZ Tools alkalmazas 3D modellek (`.p3d`) letrehozasahoz es szerkesztesehez. LOD-ok, megnevezett szelekciok, memoria pontok es geometria komponensek definialasara hasznalt. Lasd [4.5 Fejezet](04-file-formats/05-dayz-tools.md).

**OnInit** — Eletciklus metodus, amelyet egy modul vagy plugin elso inicializalasakor hivnak meg. Regisztraciora, esemenyre valo feliratkozasra es egyszeri beallitasra hasznalt. Lasd [7.2 Fejezet](07-patterns/02-module-systems.md).

**OnUpdate** — Eletciklus metodus, amelyet minden kepkockan (vagy fix intervallumon) hivnak meg modulokon es bizonyos entitasokon. Hasznald takarekosan — a kepkockankenti kod teljesitmeny problema. Lasd [7.7 Fejezet](07-patterns/07-performance.md).

**OnMissionFinish** — Eletciklus metodus, amelyet egy misszio vegeztevel hivnak meg (szerver leallas, kapcsolat bontasa). Takaritasra, allapot mentesre es eroforrasok felszabaditasara hasznalt. Lasd [6.11 Fejezet](06-engine-api/11-mission-hooks.md).

**Override (Feluliras)** — Az `override` kulcsszo az Enforce Scriptben, amely jeloli a szulo osztaly metodus felulirasat. Koteluzo (vagy eroszen ajanlott) virtualis metodusok felulirasanal. Mindig hivd meg a `super.MetodusNev()`-et a szulo viselkedes megorzese erdekeben, kiveve ha szandekosan ki akarod hagyni. Lasd [1.3 Fejezet](01-enforce-script/03-classes-inheritance.md).

---

## P

**P: Drive (Workdrive)** — Virtualis meghajto betu, amelyet a DayZ Tools kepez le a mod projekt konyvtaradra. A motor belsoleeg `P:\` utvonalakat hasznal a forrasfajlok megtalalasahoz fejlesztes soran. A DayZ Tools-szal vagy kezzi `subst` parancsokkal allithato be. Lasd [4.5 Fejezet](04-file-formats/05-dayz-tools.md).

**PAA** — A Bohemia sajat textura formatuma (`.paa`). `.tga` vagy `.png` forrasfajlokbol konvertalva a TexView2 vagy az Addon Builder binarizacios lepesevel. Tamogatja a DXT1, DXT5 es ARGB tomorites t. Lasd [4.1 Fejezet](04-file-formats/01-textures.md).

**PBO** — Packed Bohemia Object (`.pbo`): archivum formatum DayZ mod tartalom terjesztesere. Szkripteket, konfiguraciiokat, textturakat, modelleket es adat fajlokat tartalmaz. Az Addon Builderrel vagy harmadik feles eszkozokkel epul. Lasd [4.6 Fejezet](04-file-formats/06-pbo-packing.md).

**PlayerBase** — Az elsosdleges jatekos entitas osztaly, amellyel a modderek dolgoznak. Kiterjeszti a `DayZPlayer`-t es hozzaferest biztosit az inventarhoz, sebzeshez, statusz effektekhez es minden jatekossal kapcsolatos funkcionalitashoz. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**PlayerIdentity** — Motor osztaly, amely tartalmazza a csatlakozott jatekos metaadatait: Steam UID, nev, halozati ID es ping. Szerver oldalon erheto el a `PlayerBase.GetIdentity()`-bol. Nelkulozhetetlen az admin eszkozokhot es a perzisztenciahoz. Lasd [6.9 Fejezet](06-engine-api/09-networking.md).

**PPE (Post-Process Effects — Utolagos feldolgozasi effektek)** — Motor rendszer kepernyo-ter vizualis effektekhez: blur, szin beallitas, kromatikus aberracio, vignetta, film szemcsezetteseg. `PPERequester` osztalyokkal vezerelt. Lasd [6.5 Fejezet](06-engine-api/05-ppe.md).

**Print** — Beepitett fuggveny szoveg kirasiara a szkript logba (`%localappdata%/DayZ/` log fajlok). Hasznos debugolashoz, de el kell tavolitani vagy vedeni kell produkcios kodban. Lasd [1.11 Fejezet](01-enforce-script/11-error-handling.md).

**Proto Native** — A `proto native`-kal deklaralt fuggvenyek a C++ motorban vannak implementalva, nem szkriptben. Osszekotik az Enforce Scriptet a motor belsejevel es nem irhatoak felul. Lasd [1.3 Fejezet](01-enforce-script/03-classes-inheritance.md).

---

## Q

**Quaternion** — Negy komponensu rotacios reprezentacio, amelyet a motor belsoleeg hasznal. A gyakorlatban a DayZ modderek altalaban Euler szogekkel (`vector` pitch/yaw/roll) dolgoznak es a motor belsoleeg konvertal. Lasd [1.7 Fejezet](01-enforce-script/07-math-vectors.md).

---

## R

**ref** — Enforce Script kulcsszo, amely eros referencia t deklaral egy kezelt objektumra. Megakadalyozza a garbage collection-t amig a referencia letezik. Hasznalj `ref`-et tulajdonlashoz; nyers referenciakat nem-tulajdonosi mutatokhoz. Vigyazz a `ref` ciklusokra (A hivatkozik B-re, B hivatkozik A-ra), amelyek memoriafolyast okoznak. Lasd [1.8 Fejezet](01-enforce-script/08-memory-management.md).

**requiredAddons** — Tomb a `CfgPatches`-ben, amely meghataroza, mely addonoknak kell betoltodniuk a tied elott. Szabalyozza a szkript kompilalasi es konfiguracio orokolesi sorrendet a modok kozott. Helytelen beallitas "missing class"-t vagy csendes betoltesi hibat okoz. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md).

**RPC (Remote Procedure Call — Tavoli eljaras hivas)** — Mechanizmus adatok kuldseere szerver es kliens kozott. A DayZ biztositja a `GetGame().RPCSingleParam()` es `ScriptRPC` eszkozoket egyedi kommunikaciohoz. Megfelelo kuldo es fogado szukseges a megfelelo gepen. Lasd [6.9 Fejezet](06-engine-api/09-networking.md).

**RVMAT** — Anyag definicis fajl (`.rvmat`), amelyet a DayZ rendereloje hasznal. Meghataroza a texturakat, shadereket es feluleti tulajdonsagokat a 3D modellekhez. Lasd [4.3 Fejezet](04-file-formats/03-materials.md).

---

## S

**Scope (config)** — Egesz szam ertek a `CfgVehicles`-ben, amely szabalyozza a targy lathattosagat: `0` = rejtett/absztrakt (soha nem spawnol), `1` = csak szkripttel erheto el, `2` = lathato a jatekban es a Kozponti Gazdasag altal spawnolhato. Lasd [2.2 Fejezet](02-mod-structure/02-config-cpp.md).

**ScriptRPC** — Enforce Script osztaly egyedi RPC uzenetek epitsehez es kuldesehez. Tobb parameter (int, float, string, vector) irasat teszi lehetove egyetlen halozati csomagba. Lasd [6.9 Fejezet](06-engine-api/09-networking.md).

**SEffectManager** — Singleton menedzser vizualis es hang effektekhez. Kezeli a reszecske letrehozast, hang lejatszast es effektus eletciklust. Hasznald a `SEffectManager.PlayInWorld()`-ot pozicionalt effektekhez. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**Singleton** — Tervezesi minta, amely biztositja, hogy egy osztalynak csak egy peldanya letezzen. Az Enforce Scriptben altalaban statikus `GetInstance()` metodussal implementalva, amely az `static ref` valtozoba tarolja a peldanyt. Lasd [7.1 Fejezet](07-patterns/01-singletons.md).

**Slot** — Megnevezett csatolasi pont egy entitason (pl. `"Shoulder"`, `"Hands"`, `"Slot_Magazine"`). A config.cpp-ben van definialva az `InventorySlots` alatt es az entitas `attachments[]` tombjeben. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

**stringtable.csv** — CSV fajl, amely lokalizalt sztringeket biztosit legfeljebb 13 nyelvhez. A kodban `#STR_` prefixu kulcsokkal hivatkozott. A motor automatikusan kivalasztja a megfelelo nyelv oszlopot. Lasd [5.1 Fejezet](05-config-files/01-stringtable.md).

**super** — Kulcsszo, amelyet egy felulirt metoduson belul hasznalnak a szulo osztaly implementaciojanak meghivasahoz. Mindig hivd meg a `super.MetodusNev()`-et felulirt metodusokban, kiveve ha szandekosan ki akarod hagyni a szulo logikat. Lasd [1.3 Fejezet](01-enforce-script/03-classes-inheritance.md).

---

## T

**TexView2** — DayZ Tools segedeszkoz texturak megtekintesehez es konvertaslasahoz `.tga`, `.png`, `.paa` es `.edds` formatumok kozott. PAA tomorites, mipmap-ek es alfa csatornak vizsgalataira is hasznalhato. Lasd [4.5 Fejezet](04-file-formats/05-dayz-tools.md).

**typename** — Enforce Script tipus, amely futasideju osztaly referenciat reprezentral. Refleksziohoz, gyari mintakhoz es dinamikus tipusellenorzeshez hasznalt. Peldanybol a `obj.Type()`-pal vagy kozevetlenul osztaly nevbol: `typename t = PlayerBase;` szerezheto meg. Lasd [1.9 Fejezet](01-enforce-script/09-casting-reflection.md).

**types.xml** — Kozponti Gazdasag XML fajl, amely definialja minden spawnolhato targy nominalis szamat, elettartamat, utantoltesi viselkedeset, spawn kategoriakat es tier zonakat. A misszio `db/` mappajaban talalhato. Lasd [6.10 Fejezet](06-engine-api/10-central-economy.md).

---

## U

**UAInput** — Motor osztaly, amely egyetlen bemeneti akciot (billentyukombinaciot) representral. A `GetUApi().RegisterInput()`-bol jotetre es gomb nyomasok, tartasok es engdesek erzekelersere hasznalt. Az `inputs.xml`-lel egyutt definialva. Lasd [6.13 Fejezet](06-engine-api/13-input-system.md).

**Unlink** — Metodus egy kezelt objektum biztonsagos megsemmisitesehez es dereferncialaesaahoz. `null`-ra allitas helyett preferalt, ha azonnali takaritast kell biztositani. Entitasoknal `GetGame().ObjectDelete(obj)` formaban hivhato. Lasd [1.8 Fejezet](01-enforce-script/08-memory-management.md).

---

## V

**View Geometry** — 3D modell LOD, amelyet vizualis okluzios tesztekre hasznalnak (AI latas ellenorzes, jatekos latovonal). Meghatarozza, hogy egy objektum blokkolja-e a latast. Kulonallo a Geometry LOD-tol (utkozes) es a Fire Geometry-tol (ballisztika). Lasd [4.2 Fejezet](04-file-formats/02-models.md).

---

## W

**Widget** — Alaposztaly minden UI elemhez a DayZ GUI rendszereben. Altipusai kozet tartozik a `TextWidget`, `ImageWidget`, `ButtonWidget`, `EditBoxWidget`, `ScrollWidget` es kontener tipusok mint a `WrapSpacerWidget`. Lasd [3.1 Fejezet](03-gui-system/01-widget-types.md).

**Workbench** — DayZ Tools IDE szkriptek, konfiguraciok szerkesztesehez es a jatek fejlesztesi modban valo futatasahoz. Szkript kompilalast, toreepontookat es Eroforras Bongeszot biztosit. Lasd [4.5 Fejezet](04-file-formats/05-dayz-tools.md).

**WrapSpacer** — Kontener widget, amely gyermekeit sorokba/oszlopokba toeri (mint a CSS flexbox wrap). Dinamikus listakhoz, inventar racsokhoz es barmely elrendzeshez, ahol a gyermekek szama valtozik, nelkulozhetetlen. Lasd [3.4 Fejezet](03-gui-system/04-containers.md).

---

## X

**XML Configs (XML konfiguraciok)** — Gyujtonev a DayZ szerverek altal hasznalt sok XML konfiguracios fajlra: `types.xml`, `globals.xml`, `economy.xml`, `events.xml`, `cfglimitsdefinition.xml`, `mapgrouppos.xml` es masok. Lasd [6.10 Fejezet](06-engine-api/10-central-economy.md).

---

## Z

**Zone (Damage Zone — Sebzesi zona)** — Megnevezett regio egy entitas modelljen, amely fuggetlen egeszseg koovetest kap. A config.cpp-ben definialva a `DamageSystem` alatt `class DamageZones`-szal. Altalanos zonak jatekosokon: `Head`, `Torso`, `LeftArm`, `LeftLeg` stb. Lasd [6.1 Fejezet](06-engine-api/01-entity-system.md).

---

*Hianyzik egy kifejezes? Nyiss egy issue-t vagy kulddj pull requestet.*
