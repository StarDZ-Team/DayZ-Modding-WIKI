# Kapitola 8.7: Publikování na Steam Workshop

[Domů](../README.md) | [<< Předchozí: Ladění a testování](06-debugging-testing.md) | **Publikování na Steam Workshop** | [Další: Vytváření HUD overlayi >>](08-hud-overlay.md)

---

> **Shrnutí:** Váš mod je sestaven, otestován a připraven pro svět. Tento tutoriál vás provede kompletním procesem publikování od začátku do konce: příprava složky modu, podepisování PBO pro kompatibilitu s multiplayerem, vytvoření položky na Steam Workshopu, nahrání přes DayZ Tools nebo příkazový řádek a udržování aktualizací v průběhu času. Na konci bude váš mod živě na Workshopu a hratelný kýmkoli.

---

## Obsah

- [Úvod](#introduction)
- [Kontrolní seznam před publikováním](#pre-publishing-checklist)
- [Krok 1: Příprava složky modu](#step-1-prepare-your-mod-folder)
- [Krok 2: Napsání kompletního mod.cpp](#step-2-write-a-complete-modcpp)
- [Krok 3: Příprava loga a náhledových obrázků](#step-3-prepare-logo-and-preview-images)
- [Krok 4: Generování páru klíčů](#step-4-generate-a-key-pair)
- [Krok 5: Podepisování PBO](#step-5-sign-your-pbos)
- [Krok 6: Publikování přes DayZ Tools Publisher](#step-6-publish-via-dayz-tools-publisher)
- [Publikování přes příkazový řádek (alternativa)](#publishing-via-command-line-alternative)
- [Aktualizace vašeho modu](#updating-your-mod)
- [Doporučené postupy pro správu verzí](#version-management-best-practices)
- [Doporučené postupy pro stránku Workshopu](#workshop-page-best-practices)
- [Průvodce pro provozovatele serverů](#guide-for-server-operators)
- [Distribuce bez Workshopu](#distribution-without-the-workshop)
- [Časté problémy a řešení](#common-problems-and-solutions)
- [Kompletní životní cyklus modu](#the-complete-mod-lifecycle)
- [Další kroky](#next-steps)

---

## Úvod

Publikování na Steam Workshop je posledním krokem na cestě k DayZ moddingu. Vše, co jste se naučili v předchozích kapitolách, zde vyvrcholí. Jakmile je váš mod na Workshopu, jakýkoli hráč DayZ se může přihlásit k odběru, stáhnout ho a hrát s ním. Tato kapitola pokrývá kompletní proces: přípravu modu, podepisování PBO, nahrávání a udržování aktualizací.

---

## Kontrolní seznam před publikováním

Než cokoli nahrajete, projděte si tento seznam. Vynechání položek zde způsobuje nejčastější problémy po publikování.

- [ ] Všechny funkce otestovány na **dedikovaném serveru** (ne jen v single-playeru)
- [ ] Multiplayer otestován: jiný klient se může připojit a používat funkce modu
- [ ] Žádné závažné chyby ve skriptových logech (`DayZDiag_x64.RPT` nebo `script_*.log`)
- [ ] Všechny `Print()` ladicí výpisy odstraněny nebo zabaleny v `#ifdef DEVELOPER`
- [ ] Žádné napevno zakódované testovací hodnoty nebo zbytky experimentálního kódu
- [ ] `stringtable.csv` obsahuje všechny řetězce směřující k uživateli s překlady
- [ ] `credits.json` vyplněn informacemi o autorovi a přispěvatelích
- [ ] Obrázek loga připraven (viz [Krok 3](#step-3-prepare-logo-and-preview-images) pro velikosti)
- [ ] Všechny textury převedeny do formátu `.paa` (ne surové `.png`/`.tga` v PBO)
- [ ] Popis na Workshopu a pokyny k instalaci napsány
- [ ] Změnový log zahájen (i kdyby jen "1.0.0 - Počáteční vydání")

---

## Krok 1: Příprava složky modu

Vaše finální složka modu musí přesně odpovídat očekávané struktuře DayZ.

### Požadovaná struktura

```
@MyMod/
├── addons/
│   ├── MyMod_Scripts.pbo
│   ├── MyMod_Scripts.pbo.MyMod.bisign
│   ├── MyMod_Data.pbo
│   └── MyMod_Data.pbo.MyMod.bisign
├── keys/
│   └── MyMod.bikey
├── mod.cpp
└── meta.cpp  (automaticky generováno DayZ Launcherem při prvním načtení)
```

### Popis složek

| Složka / Soubor | Účel |
|---------------|---------|
| `addons/` | Obsahuje všechny `.pbo` soubory (zabalený obsah modu) a jejich `.bisign` soubory podpisů |
| `keys/` | Obsahuje veřejný klíč (`.bikey`), který servery používají k ověření vašich PBO |
| `mod.cpp` | Metadata modu: název, autor, verze, popis, cesty k ikonám |
| `meta.cpp` | Automaticky generováno DayZ Launcherem; obsahuje ID Workshopu po publikování |

### Důležitá pravidla

- Název složky **musí** začínat `@`. Tak DayZ identifikuje adresáře modů.
- Každý `.pbo` v `addons/` musí mít odpovídající `.bisign` soubor vedle sebe.
- Soubor `.bikey` v `keys/` musí odpovídat soukromému klíči použitému k vytvoření `.bisign` souborů.
- **Nezahrnujte** zdrojové soubory (`.c` skripty, surové textury, projekty Workbench) do složky pro nahrání. Patří sem pouze zabalená PBO.

---

## Krok 2: Napsání kompletního mod.cpp

Soubor `mod.cpp` říká DayZ a launcheru vše o vašem modu. Neúplný `mod.cpp` způsobuje chybějící ikony, prázdné popisy a problémy se zobrazením.

### Příklad kompletního mod.cpp

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### Reference polí

| Pole | Povinné | Popis |
|-------|----------|-------------|
| `name` | Ano | Zobrazovaný název v seznamu modů DayZ Launcheru |
| `picture` | Ano | Cesta k hlavnímu obrázku loga (zobrazeno v launcheru). Relativní k P: disku nebo kořenu modu |
| `logo` | Ano | Stejné jako picture ve většině případů; používáno v některých kontextech UI |
| `logoSmall` | Ne | Menší verze loga pro kompaktní zobrazení |
| `logoOver` | Ne | Stav loga při najetí myší (často stejné jako `logo`) |
| `tooltip` | Ano | Krátký jednořádkový popis zobrazený při najetí myší v launcheru |
| `overview` | Ano | Delší popis zobrazený v panelu detailů modu |
| `author` | Ano | Vaše jméno nebo název týmu |
| `overviewPicture` | Ne | Velký obrázek zobrazený v panelu přehledu modu |
| `action` | Ne | URL otevřené při kliknutí na "Website" (typicky vaše stránka Workshopu nebo GitHub) |
| `version` | Ano | Řetězec aktuální verze (např. `"1.0.0"`) |
| `versionPath` | Ne | Cesta k textovému souboru obsahujícímu číslo verze (pro automatizované buildy) |

### Časté chyby

- **Chybějící středníky** na konci každého řádku. Každý řádek musí končit `;`.
- **Špatné cesty k obrázkům.** Cesty jsou relativní ke kořenu P: disku při buildování. Po zabalení by cesta měla odpovídat prefixu PBO. Otestujte načtením modu lokálně před nahráním.
- **Zapomenutí aktualizovat verzi** před opětovným nahráním. Vždy inkrementujte řetězec verze.

---

## Krok 3: Příprava loga a náhledových obrázků

### Požadavky na obrázky

| Obrázek | Velikost | Formát | Použití |
|-------|------|--------|----------|
| Logo modu (`picture` / `logo`) | 512 x 512 px | `.paa` (ve hře) | Seznam modů DayZ Launcheru |
| Malé logo (`logoSmall`) | 128 x 128 px | `.paa` (ve hře) | Kompaktní zobrazení launcheru |
| Náhled Steam Workshopu | 512 x 512 px | `.png` nebo `.jpg` | Miniatura stránky Workshopu |
| Obrázek přehledu | 1024 x 512 px | `.paa` (ve hře) | Panel detailů modu |

### Převod obrázků na PAA

DayZ interně používá textury `.paa`. Pro převod obrázků PNG/TGA:

1. Otevřete **TexView2** (součást DayZ Tools)
2. File > Open váš `.png` nebo `.tga` obrázek
3. File > Save As > zvolte formát `.paa`
4. Uložte do adresáře `Data/Textures/` vašeho modu

Addon Builder může také automaticky převádět textury při balení PBO, pokud je nakonfigurován pro binarizaci.

### Tipy

- Použijte jasnou, rozpoznatelnou ikonu, která je čitelná i v malých velikostech.
- Udržujte text na logách na minimu -- při 128x128 se stává nečitelným.
- Náhledový obrázek Steam Workshopu (`.png`/`.jpg`) je oddělený od herního loga (`.paa`). Nahráváte ho přes Publisher.

---

## Krok 4: Generování páru klíčů

Podepisování klíčem je **nezbytné** pro multiplayer. Téměř všechny veřejné servery mají povoleno ověřování podpisů, takže bez správných podpisů budou hráči vyhoštěni při připojení s vaším modem.

### Jak funguje podepisování klíčem

- Vytvoříte **pár klíčů**: `.biprivatekey` (soukromý) a `.bikey` (veřejný)
- Podepíšete každý `.pbo` soukromým klíčem, čímž vytvoříte `.bisign` soubor
- Distribuujete `.bikey` s vaším modem; provozovatelé serverů ho umístí do složky `keys/`
- Když se hráč připojí, server ověří každý `.pbo` oproti jeho `.bisign` pomocí `.bikey`

### Generování klíčů pomocí DayZ Tools

1. Otevřete **DayZ Tools** ze Steamu
2. V hlavním okně najděte a klikněte na **DS Create Key** (někdy uvedeno pod Tools nebo Utilities)
3. Zadejte **název klíče** -- použijte název vašeho modu (např. `MyMod`)
4. Zvolte, kam soubory uložit
5. Vytvoří se dva soubory:
   - `MyMod.bikey` -- **veřejný klíč** (tento distribuujte)
   - `MyMod.biprivatekey` -- **soukromý klíč** (tento uchovejte v tajnosti)

### Generování klíčů přes příkazový řádek

Můžete také použít nástroj `DSCreateKey` přímo z terminálu:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

Toto vytvoří `MyMod.bikey` a `MyMod.biprivatekey` v aktuálním adresáři.

### Kritické bezpečnostní pravidlo

> **NIKDY nesdílejte soubor `.biprivatekey`.** Kdokoli, kdo má váš soukromý klíč, může podepsat modifikovaná PBO, která servery přijmou jako legitimní. Uložte ho bezpečně a zálohujte. Pokud ho ztratíte, musíte vygenerovat nový pár klíčů, vše znovu podepsat a provozovatelé serverů musí aktualizovat své klíče.

---

## Krok 5: Podepisování PBO

Každý soubor `.pbo` ve vašem modu musí být podepsán vaším soukromým klíčem. Tím se vytvoří soubory `.bisign`, které jsou umístěny vedle PBO.

### Podepisování pomocí DayZ Tools

1. Otevřete **DayZ Tools**
2. Najděte a klikněte na **DS Sign File** (pod Tools nebo Utilities)
3. Vyberte svůj soubor `.biprivatekey`
4. Vyberte soubor `.pbo` k podepsání
5. Vedle PBO se vytvoří soubor `.bisign` (např. `MyMod_Scripts.pbo.MyMod.bisign`)
6. Opakujte pro každý `.pbo` ve složce `addons/`

### Podepisování přes příkazový řádek

Pro automatizaci nebo více PBO použijte příkazový řádek:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

Pro podepsání všech PBO ve složce dávkovým skriptem:

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Signing %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo All PBOs signed.
pause
```

### Po podepsání: ověření složky

Vaše složka `addons/` by měla vypadat takto:

```
addons/
├── MyMod_Scripts.pbo
├── MyMod_Scripts.pbo.MyMod.bisign
├── MyMod_Data.pbo
└── MyMod_Data.pbo.MyMod.bisign
```

Každý `.pbo` musí mít odpovídající `.bisign`. Pokud jakýkoli `.bisign` chybí, hráči budou vyhoštěni ze serverů s ověřováním podpisů.

### Umístění veřejného klíče

Zkopírujte `MyMod.bikey` do složky `@MyMod/keys/`. Toto je to, co provozovatelé serverů zkopírují do adresáře `keys/` svého serveru pro povolení vašeho modu.

---

## Krok 6: Publikování přes DayZ Tools Publisher

DayZ Tools obsahuje vestavěný Workshop publisher -- nejjednodušší způsob, jak dostat váš mod na Steam.

### Otevření Publisheru

1. Otevřete **DayZ Tools** ze Steamu
2. Klikněte na **Publisher** v hlavním okně (může být také označen jako "Workshop Tool")
3. Otevře se okno Publisheru s poli pro detaily vašeho modu

### Vyplnění detailů

| Pole | Co zadat |
|-------|---------------|
| **Title** | Zobrazovaný název vašeho modu (např. "My Awesome Mod") |
| **Description** | Detailní přehled toho, co váš mod dělá. Podporuje formátování Steam BB kódem (viz níže) |
| **Preview Image** | Přejděte k vašemu náhledovému obrázku 512 x 512 `.png` nebo `.jpg` |
| **Mod Folder** | Přejděte k vaší kompletní složce `@MyMod` |
| **Tags** | Vyberte relevantní tagy (např. Weapons, Vehicles, UI, Server, Gear, Maps) |
| **Visibility** | **Public** (kdokoli ho může najít), **Friends Only** nebo **Unlisted** (přístupný pouze přes přímý odkaz) |

### Rychlá reference Steam BB kódu

Popis Workshopu podporuje BB kód:

```
[h1]Features[/h1]
[list]
[*] Feature one
[*] Feature two
[/list]

[b]Bold[/b]  [i]Italic[/i]  [code]Code[/code]
[url=https://example.com]Link text[/url]
[img]https://example.com/image.png[/img]
```

### Publikování

1. Naposledy zkontrolujte všechna pole
2. Klikněte na **Publish** (nebo **Upload**)
3. Počkejte na dokončení nahrávání. Velké mody mohou trvat několik minut v závislosti na vašem připojení.
4. Po dokončení uvidíte potvrzení s vaším **Workshop ID** (dlouhé číselné ID jako `2345678901`)
5. **Uložte si toto Workshop ID.** Potřebujete ho pro odesílání aktualizací.

### Po publikování: ověření

Tento krok nevynechávejte. Otestujte svůj mod jako běžný hráč:

1. Navštivte `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` a ověřte název, popis, náhledový obrázek
2. **Přihlaste se k odběru** vlastního modu na Workshopu
3. Spusťte DayZ, potvrďte, že mod se zobrazuje v launcheru
4. Povolte ho, spusťte hru, připojte se na server (nebo spusťte vlastní testovací server)
5. Potvrďte, že všechny funkce fungují
6. Aktualizujte pole `action` v `mod.cpp` tak, aby odkazovalo na URL vaší stránky Workshopu

Pokud je cokoli nefunkční, aktualizujte a znovu nahrajte před veřejným oznámením.

---

## Publikování přes příkazový řádek (alternativa)

Pro automatizaci, CI/CD nebo dávkové nahrávání poskytuje SteamCMD alternativu přes příkazový řádek.

### Instalace SteamCMD

Stáhněte z [webu pro vývojáře Valve](https://developer.valvesoftware.com/wiki/SteamCMD) a rozbalte do složky jako `C:\SteamCMD\`.

### Vytvoření VDF souboru

SteamCMD používá soubor `.vdf` k popisu toho, co nahrát. Vytvořte soubor s názvem `workshop_publish.vdf`:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### Reference polí

| Pole | Hodnota |
|-------|-------|
| `appid` | Vždy `221100` pro DayZ |
| `publishedfileid` | `0` pro novou položku; pro aktualizace použijte Workshop ID |
| `contentfolder` | Absolutní cesta k vaší složce `@MyMod` |
| `previewfile` | Absolutní cesta k vašemu náhledovému obrázku |
| `visibility` | `0` = Public, `1` = Friends Only, `2` = Unlisted, `3` = Private |
| `title` | Název modu |
| `description` | Popis modu (prostý text) |
| `changenote` | Text zobrazený v historii změn na stránce Workshopu |

### Spuštění SteamCMD

```batch
C:\SteamCMD\steamcmd.exe +login YourSteamUsername +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

SteamCMD vás při prvním použití vyzve k zadání hesla a kódu Steam Guard. Po ověření nahraje mod a vytiskne Workshop ID.

### Kdy použít příkazový řádek

- **Automatizované buildy:** integrace do build skriptu, který zabalí PBO, podepíše je a nahraje v jednom kroku
- **Dávkové operace:** nahrávání více modů najednou
- **Servery bez GUI:** prostředí bez grafického rozhraní
- **CI/CD pipelines:** GitHub Actions nebo podobné mohou volat SteamCMD

---

## Aktualizace vašeho modu

### Postup aktualizace krok za krokem

1. **Proveďte změny v kódu** a důkladně otestujte
2. **Inkrementujte verzi** v `mod.cpp` (např. `"1.0.0"` se změní na `"1.0.1"`)
3. **Znovu sestavte všechna PBO** pomocí Addon Builder nebo vašeho build skriptu
4. **Znovu podepište všechna PBO** **stejným soukromým klíčem**, který jste použili původně
5. **Otevřete DayZ Tools Publisher**
6. Zadejte vaše existující **Workshop ID** (nebo vyberte existující položku)
7. Namiřte na vaši aktualizovanou složku `@MyMod`
8. Napište **poznámku ke změně** popisující, co se změnilo
9. Klikněte na **Publish / Update**

### Použití SteamCMD pro aktualizace

Aktualizujte VDF soubor s vaším Workshop ID a novou poznámkou ke změně:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Fixed item duplication bug, added French translation"
}
```

Poté spusťte SteamCMD jako předtím. `publishedfileid` řekne Steamu, aby aktualizoval existující položku místo vytvoření nové.

### Důležité: Použijte stejný klíč

Aktualizace vždy podepisujte **stejným soukromým klíčem**, který jste použili pro původní vydání. Pokud podepíšete jiným klíčem, provozovatelé serverů musí nahradit starý `.bikey` novým -- což znamená výpadek a zmatek. Nový pár klíčů generujte pouze pokud je váš soukromý klíč kompromitován.

---

## Doporučené postupy pro správu verzí

### Sémantické verzování

Použijte formát **MAJOR.MINOR.PATCH**:

| Komponenta | Kdy inkrementovat | Příklad |
|-----------|-------------------|---------|
| **MAJOR** | Přerušující změny: změny formátu configu, odebrané funkce, přepracování API | `1.0.0` na `2.0.0` |
| **MINOR** | Nové funkce zpětně kompatibilní | `1.0.0` na `1.1.0` |
| **PATCH** | Opravy chyb, drobné úpravy, aktualizace překladů | `1.0.0` na `1.0.1` |

### Formát změnového logu

Udržujte změnový log v popisu Workshopu nebo v samostatném souboru. Čistý formát:

```
v1.2.0 (2025-06-15)
- Added: Night vision toggle keybind
- Added: German and Spanish translations
- Fixed: Inventory crash when dropping stacked items
- Changed: Reduced default spawn rate from 5 to 3

v1.1.0 (2025-05-01)
- Added: New crafting recipes for 4 items
- Fixed: Server crash on player disconnect during trade

v1.0.0 (2025-04-01)
- Initial release
```

### Zpětná kompatibilita

Když váš mod ukládá persistentní data (JSON configy, datové soubory hráčů), pečlivě zvažte před změnou formátu:

- **Přidání nových polí** je bezpečné. Použijte výchozí hodnoty pro chybějící pole při načítání starých souborů.
- **Přejmenování nebo odebrání polí** je přerušující změna. Inkrementujte verzi MAJOR.
- **Zvažte vzor migrace:** detekujte starý formát, převeďte na nový formát, uložte.

Příklad kontroly migrace v Enforce Script:

```csharp
// Ve vaší funkci načítání configu
if (config.configVersion < 2)
{
    // Migrace z v1 na v2: přejmenování "oldField" na "newField"
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrated from v1 to v2");
}
```

### Git tagging

Pokud používáte Git pro správu verzí (a měli byste), označte každé vydání tagem:

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

Toto vytvoří trvalý referenční bod, takže se můžete vždy vrátit k přesnému kódu jakékoli publikované verze.

---

## Doporučené postupy pro stránku Workshopu

### Struktura popisu

Organizujte popis s těmito sekcemi:

1. **Přehled** -- co mod dělá, ve 2-3 větách
2. **Funkce** -- odrážkový seznam klíčových funkcí
3. **Požadavky** -- seznam všech závislostních modů s odkazy na Workshop
4. **Instalace** -- krok za krokem pro hráče (obvykle jen "přihlaste se k odběru a povolte")
5. **Nastavení serveru** -- pokyny pro provozovatele serverů (umístění klíčů, konfigurační soubory)
6. **FAQ** -- běžné otázky zodpovězené preventivně
7. **Známé problémy** -- buďte upřímní ohledně aktuálních omezení
8. **Podpora** -- odkaz na váš Discord, GitHub issues nebo vlákno na fóru
9. **Změnový log** -- nedávná historie verzí
10. **Licence** -- jak ostatní mohou (nebo nemohou) používat vaši práci

### Screenshoty a média

- Zahrňte **3-5 herních screenshotů** ukazujících váš mod v akci
- Pokud váš mod přidává UI, ukažte panely UI jasně
- Pokud váš mod přidává předměty, ukažte je ve hře (ne jen v editoru)
- Krátké video z hraní dramaticky zvyšuje počet odběrů

### Závislosti

Pokud váš mod vyžaduje jiné mody, uveďte je jasně s odkazy na Workshop. Použijte funkci Steam Workshopu "Required Items", aby launcher automaticky načítal závislosti.

### Plán aktualizací

Nastavte očekávání. Pokud aktualizujete týdně, řekněte to. Pokud jsou aktualizace příležitostné, řekněte "aktualizace dle potřeby." Hráči jsou chápavější, když vědí, co očekávat.

---

## Průvodce pro provozovatele serverů

Zahrňte tyto informace do popisu Workshopu pro administrátory serverů.

### Instalace Workshop modu na dedikovaný server

1. **Stáhněte mod** pomocí SteamCMD nebo Steam klienta:
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. **Zkopírujte** (nebo vytvořte symlink) složku `@ModName` do adresáře DayZ Serveru
3. **Zkopírujte soubor `.bikey`** z `@ModName/keys/` do složky `keys/` serveru
4. **Přidejte mod** do spouštěcího parametru `-mod=`

### Syntaxe spouštěcího parametru

Mody se načítají přes parametr `-mod=`, oddělené středníky:

```
-mod=@CF;@VPPAdminTools;@MyMod
```

Použijte **úplnou relativní cestu** od kořene serveru. Na Linuxu jsou cesty citlivé na velikost písmen.

### Pořadí načítání

Mody se načítají v pořadí uvedeném v `-mod=`. To je důležité, když mody závisí na sobě:

- **Závislosti první.** Pokud `@MyMod` vyžaduje `@CF`, uveďte `@CF` před `@MyMod`.
- **Obecné pravidlo:** frameworky první, obsahové mody poslední.
- Pokud váš mod deklaruje `requiredAddons` v `config.cpp`, DayZ se pokusí automaticky vyřešit pořadí načítání, ale explicitní pořadí v `-mod=` je bezpečnější.

### Správa klíčů

- Umístěte **jeden `.bikey` na mod** do adresáře `keys/` serveru
- Když se mod aktualizuje se stejným klíčem, není třeba nic dělat -- existující `.bikey` stále funguje
- Pokud autor modu změní klíče, musíte nahradit starý `.bikey` novým
- Cesta ke složce `keys/` je relativní ke kořenu serveru (např. `DayZServer/keys/`)

---

## Distribuce bez Workshopu

### Kdy vynechat Workshop

- **Soukromé mody** pro vaši vlastní serverovou komunitu
- **Beta testování** s malou skupinou před veřejným vydáním
- **Komerční nebo licencované mody** distribuované jinými kanály
- **Rychlá iterace** během vývoje (rychlejší než opětovné nahrávání pokaždé)

### Vytvoření release ZIP

Zabalte váš mod pro manuální distribuci:

```
MyMod_v1.0.0.zip
└── @MyMod/
    ├── addons/
    │   ├── MyMod_Scripts.pbo
    │   ├── MyMod_Scripts.pbo.MyMod.bisign
    │   ├── MyMod_Data.pbo
    │   └── MyMod_Data.pbo.MyMod.bisign
    ├── keys/
    │   └── MyMod.bikey
    └── mod.cpp
```

Přiložte `README.txt` s pokyny k instalaci:

```
INSTALLATION:
1. Extract the @MyMod folder into your DayZ game directory
2. (Server operators) Copy MyMod.bikey from @MyMod/keys/ to your server's keys/ folder
3. Add @MyMod to your -mod= launch parameter
```

### GitHub Releases

Pokud je váš mod open source, použijte GitHub Releases pro hostování verzovaných stažení:

1. Označte vydání v Git (`git tag v1.0.0`)
2. Sestavte a podepište PBO
3. Vytvořte ZIP složky `@MyMod`
4. Vytvořte GitHub Release a přiložte ZIP
5. Napište poznámky k vydání v popisu release

Toto vám dává historii verzí, počty stažení a stabilní URL pro každé vydání.

---

## Časté problémy a řešení

| Problém | Příčina | Oprava |
|---------|-------|-----|
| "Addon rejected by server" | Na serveru chybí `.bikey` nebo `.bisign` neodpovídá `.pbo` | Potvrďte, že `.bikey` je ve složce `keys/` serveru. Znovu podepište PBO správným `.biprivatekey`. |
| "Signature check failed" | PBO modifikováno po podepsání nebo podepsáno špatným klíčem | Znovu sestavte PBO z čistého zdroje. Znovu podepište **stejným klíčem**, který vygeneroval serverový `.bikey`. |
| Mod se nezobrazuje v DayZ Launcheru | Vadný `mod.cpp` nebo špatná struktura složek | Zkontrolujte `mod.cpp` na syntaktické chyby (chybějící `;`). Ujistěte se, že složka začíná `@`. Restartujte launcher. |
| Nahrání selhává v Publisheru | Problém s autentizací, připojením nebo zámkem souboru | Ověřte přihlášení do Steamu. Zavřete Workbench/Addon Builder. Zkuste spustit DayZ Tools jako správce. |
| Špatná/chybějící ikona Workshopu | Špatná cesta v `mod.cpp` nebo špatný formát obrázku | Ověřte, že cesty `picture`/`logo` vedou na skutečné `.paa` soubory. Náhled Workshopu (`.png`) je samostatný. |
| Konflikty s jinými mody | Předefinování vanilla tříd místo moddování | Použijte `modded class`, volejte `super` v přepsáních, nastavte `requiredAddons` pro pořadí načítání. |
| Hráči padají při načítání | Chyby ve skriptech, poškozená PBO nebo chybějící závislosti | Zkontrolujte `.RPT` logy. Znovu sestavte PBO z čistého zdroje. Ověřte, že se závislosti načítají první. |

---

## Kompletní životní cyklus modu

```
NÁPAD → NASTAVENÍ (8.1) → STRUKTURA (8.1, 8.5) → KÓD (8.2, 8.3, 8.4) → BUILD (8.1)
  → TEST → LADĚNÍ (8.6) → DOLADĚNÍ → PODPIS (8.7) → PUBLIKOVÁNÍ (8.7) → ÚDRŽBA (8.7)
                                    ↑                                    │
                                    └────── zpětná vazba ───────────────┘
```

Po publikování vás zpětná vazba hráčů vrací zpět ke KÓDU, TESTU a LADĚNÍ. Tento cyklus publikování-zpětná vazba-vylepšení je způsob, jak se vytvářejí skvělé mody.

---

## Další kroky

Dokončili jste kompletní sérii tutoriálů DayZ moddingu -- od prázdného workspace až po publikovaný, podepsaný a udržovaný mod na Steam Workshopu. Odtud:

- **Prozkoumejte referenční kapitoly** (Kapitoly 1-7) pro hlubší znalosti o GUI systému, config.cpp a Enforce Script
- **Studujte open-source mody** jako CF, Community Online Tools a Expansion pro pokročilé vzory
- **Připojte se ke komunitě DayZ moddingu** na Discordu a na fórech Bohemia Interactive
- **Stavějte větší věci.** Váš první mod byl Hello World. Další by mohl být kompletní přepracování hratelnosti.

Nástroje máte v rukou. Vytvořte něco skvělého.
