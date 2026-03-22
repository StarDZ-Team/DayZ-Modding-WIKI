# Rozdział 4.4: Audio (.ogg, .wss)

[Strona główna](../README.md) | [<< Poprzedni: Materiały](03-materials.md) | **Audio** | [Dalej: Przebieg pracy DayZ Tools >>](05-dayz-tools.md)

---

## Wprowadzenie

Projektowanie dźwięku jest jednym z najbardziej immersyjnych aspektów moddingu DayZ. Od huku karabinu po otaczający wiatr w lesie, audio ożywia świat gry. DayZ używa **OGG Vorbis** jako podstawowego formatu audio i konfiguruje odtwarzanie dźwięku przez warstwowy system **CfgSoundShaders** i **CfgSoundSets** definiowanych w `config.cpp`. Zrozumienie tego pipeline'u -- od surowego pliku audio do zpacjalizowanego dźwięku w grze -- jest niezbędne dla każdego moda wprowadzającego niestandardową broń, pojazdy, efekty otoczenia lub informacje zwrotne UI.

Ten rozdział opisuje formaty audio, system dźwięku sterowany konfiguracją, audio pozycyjne 3D, tłumienie głośności i odległości, zapętlanie oraz kompletny przebieg pracy dodawania niestandardowych dźwięków do moda DayZ.

---

## Formaty audio

### OGG Vorbis (Główny format)

**OGG Vorbis** to główny format audio DayZ. Wszystkie niestandardowe dźwięki powinny być eksportowane jako pliki `.ogg`.

| Właściwość | Wartość |
|----------|-------|
| **Rozszerzenie** | `.ogg` |
| **Kodek** | Vorbis (kompresja stratna) |
| **Częstotliwość próbkowania** | 44100 Hz (standard), 22050 Hz (akceptowalne dla otoczenia) |
| **Kanały** | Mono (dla dźwięków 3D) lub Stereo (dla muzyki/UI) |
| **Zakres jakości** | -1 do 10 (5-7 zalecane dla audio gier) |

### Kluczowe zasady OGG w DayZ

- **Dźwięki pozycyjne 3D MUSZĄ być mono.** Jeśli dostarczysz plik stereo dla dźwięku 3D, silnik może nie zpacjalizować go poprawnie lub zignorować jeden kanał.
- **Dźwięki UI i muzyka mogą być stereo.** Dźwięki niepozycyjne (menu, informacje zwrotne HUD, muzyka w tle) działają poprawnie w stereo.
- **Częstotliwość próbkowania powinna wynosić 44100 Hz** dla większości dźwięków.

### WSS (Format starszy)

**WSS** to starszy format dźwięku z wcześniejszych tytułów Bohemii (seria Arma). DayZ nadal może ładować pliki WSS, ale nowe mody powinny używać wyłącznie OGG.

---

## CfgSoundShaders i CfgSoundSets

System audio DayZ używa dwuwarstwowej konfiguracji definiowanej w `config.cpp`. **SoundShader** definiuje, jaki plik audio odtwarzać i jak, podczas gdy **SoundSet** definiuje, gdzie i jak dźwięk jest słyszany w świecie.

### Relacja

```
config.cpp
  |
  |--> CfgSoundShaders     (CO odtwarzać: plik, głośność, częstotliwość)
  |      |
  |      |--> MyShader      references --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         (JAK odtwarzać: pozycja 3D, odległość, przestrzenność)
         |
         |--> MySoundSet    references --> MyShader
```

Kod gry i inne konfiguracje odwołują się do **SoundSetów**, nigdy do SoundShaderów bezpośrednio.

### CfgSoundShaders

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {path (no extension), probability weight}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;
        range = 300;
        rangeCurve[] = {{0, 1.0}, {300, 0.0}};
    };
};
```

> **Ważne:** Ścieżka w `samples[]` NIE zawiera rozszerzenia pliku. Silnik automatycznie dopisuje `.ogg` (lub `.wss`) na podstawie tego, co znajdzie na dysku.

### CfgSoundSets

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;                  // 1 = pozycyjne 3D, 0 = 2D (HUD/menu)
        doppler = 0;
        loop = 0;
    };
};
```

#### Właściwości SoundSet

| Właściwość | Typ | Opis |
|----------|------|-------------|
| `soundShaders[]` | tablica | Lista nazw klas SoundShader do łączenia. |
| `volumeFactor` | float | Dodatkowy mnożnik głośności. |
| `frequencyRandomizer` | float | Losowa wariacja wysokości tonu (0.0 = brak, 0.1 = +/- 10%). |
| `spatial` | int | `1` dla audio pozycyjnego 3D, `0` dla 2D (UI, muzyka). |
| `doppler` | int | `1` aby włączyć przesunięcie tonalne Dopplera. |
| `loop` | int | `1` dla ciągłego zapętlania, `0` dla jednorazowego odtworzenia. |
| `distanceFilter` | int | `1` aby zastosować filtr dolnoprzepustowy na odległość. |

---

## Kategorie dźwięków

### Dźwięki broni

Dźwięki broni to najbardziej złożone audio w DayZ, zazwyczaj obejmujące wiele SoundSetów dla różnych aspektów pojedynczego strzału:

```
Shot fired
  |--> Close shot SoundSet       (the "bang" heard nearby)
  |--> Distance shot SoundSet    (the rumble/echo heard far away)
  |--> Tail SoundSet             (reverb/echo that follows)
  |--> Supersonic crack SoundSet (bullet passing overhead)
  |--> Mechanical SoundSet       (bolt cycling, magazine insertion)
```

### Dźwięki otoczenia

Audio środowiskowe dla atmosfery -- `spatial = 0` (niepozycyjne), `loop = 1`.

### Dźwięki interfejsu

Dźwięki informacji zwrotnych interfejsu (kliknięcia przycisków, powiadomienia) -- `spatial = 0`, `loop = 0`.

### Dźwięki pojazdów

Pojazdy używają złożonych konfiguracji dźwięku z wieloma komponentami: silnik na biegu jałowym, przyspieszenie, hałas opon, klakson, zderzenie.

### Dźwięki postaci

Dźwięki związane z graczem: kroki (zależne od materiału powierzchni), oddychanie (zależne od wytrzymałości), głos, ekwipunek.

---

## Audio pozycyjne 3D

### Wymagania dla audio 3D

1. **Plik audio musi być mono.** Pliki stereo nie będą zpacjalizowane poprawnie.
2. **`spatial` w SoundSet musi być `1`.** Włącza system pozycjonowania 3D.
3. **Źródło dźwięku musi mieć pozycję w świecie.** Silnik potrzebuje współrzędnych do obliczenia kierunku i odległości.

### Wyzwalanie dźwięków 3D ze skryptu

```c
// Play a positional sound at a world location
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// Play a sound attached to an object (moves with it)
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## Głośność i tłumienie odległości

### Krzywa zasięgu

`rangeCurve[]` w SoundShaderze definiuje, jak głośność spada z odległością:

```cpp
rangeCurve[] =
{
    {0, 1.0},       // At 0m: full volume
    {50, 0.7},      // At 50m: 70% volume
    {150, 0.3},     // At 150m: 30% volume
    {300, 0.0}      // At 300m: silent
};
```

### Predefiniowane krzywe głośności

| Nazwa krzywej | Zachowanie |
|------------|----------|
| `"InverseSquare"` | Realistyczny spadek (głośność = 1/odległość^2). Naturalne brzmienie. |
| `"Linear"` | Równomierny spadek od maksimum do zera w zasięgu. |
| `"Logarithmic"` | Głośny z bliska, szybko spada na średniej odległości, potem powoli zanika. |

---

## Dźwięki w pętli

Dźwięki w pętli powtarzają się ciągle, aż zostaną jawnie zatrzymane. Używane dla silników, atmosfery otoczenia, alarmów i dowolnego utrzymującego się audio.

### Konfiguracja zapętlonego dźwięku

W SoundSet: `loop = 1;`

### Zapętlanie ze skryptu

```c
EffectSound m_AlarmSound;

void StartAlarm(vector position)
{
    if (!m_AlarmSound)
    {
        m_AlarmSound = SEffectManager.PlaySound("MyMod_Alarm_SoundSet", position);
    }
}

void StopAlarm()
{
    if (m_AlarmSound)
    {
        m_AlarmSound.Stop();
        m_AlarmSound = null;
    }
}
```

### Przygotowanie pliku audio do pętli

Dla bezszwowego zapętlenia plik audio musi się czysto zapętlać:

1. **Przejście przez zero na początku i końcu.** Fala dźwiękowa powinna przekraczać zerową amplitudę w obu punktach końcowych.
2. **Dopasowany początek i koniec.** Koniec pliku powinien płynnie łączyć się z początkiem.
3. **Brak fade in/out.** Fady byłyby słyszalne przy każdej iteracji pętli.
4. **Przetestuj pętlę w Audacity.** Zaznacz cały klip, włącz odtwarzanie w pętli i nasłuchuj kliknięć lub nieciągłości.

---

## Dodawanie niestandardowych dźwięków do moda

### Kompletny przebieg pracy

**Krok 1: Przygotuj pliki audio**
- Nagraj lub pozyskaj audio.
- Edytuj w Audacity.
- Dla dźwięków 3D: skonwertuj na mono.
- Eksportuj jako OGG Vorbis (jakość 5-7).

**Krok 2: Zorganizuj w katalogu moda**

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

**Krok 3: Zdefiniuj SoundShadery w config.cpp** (patrz przykłady powyżej)

**Krok 4: Odnieś się z konfiguracji broni/przedmiotu**

**Krok 5: Zbuduj i przetestuj** -- pakuj PBO z `-packonly` (pliki OGG nie wymagają binaryzacji).

---

## Narzędzia do produkcji audio

### Audacity (Darmowy, Open Source)

Audacity jest zalecanym narzędziem do produkcji audio DayZ:

- **Eksport OGG:** File --> Export --> Export as OGG
- **Konwersja na mono:** Tracks --> Mix --> Mix Stereo Down to Mono
- **Normalizacja:** Effect --> Normalize (ustaw szczyt na -1 dB)
- **Testowanie pętli:** Transport --> Loop Play (Shift+Space)

### Konwersja wsadowa z FFmpeg

Skonwertuj wszystkie pliki WAV w katalogu na mono OGG:

```bash
for file in *.wav; do
    ffmpeg -i "$file" -ac 1 -codec:a libvorbis -qscale:a 6 "${file%.wav}.ogg"
done
```

---

## Najczęstsze błędy

### 1. Plik stereo dla dźwięku 3D

**Objaw:** Dźwięk nie jest zpacjalizowany, odtwarza się centralnie lub tylko w jednym uchu.
**Rozwiązanie:** Skonwertuj na mono przed eksportem.

### 2. Rozszerzenie pliku w ścieżce samples[]

**Objaw:** Dźwięk nie odtwarza się, brak błędu w logu.
**Rozwiązanie:** Usuń rozszerzenie `.ogg` ze ścieżki w `samples[]`. Silnik dodaje je automatycznie.

```cpp
// WRONG
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// CORRECT
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. Brak requiredAddons w CfgPatches

**Objaw:** SoundShadery lub SoundSety nie rozpoznawane, dźwięki nie odtwarzają się.
**Rozwiązanie:** Dodaj `"DZ_Sounds_Effects"` do `requiredAddons[]` w CfgPatches.

### 4. Za krótki zasięg

**Objaw:** Dźwięk nagle się urywa na krótkiej odległości, brzmi nienaturalnie.
**Rozwiązanie:** Ustaw `range` na realistyczną wartość. Strzały powinny nieść się na 300-800m, kroki 20-40m, głosy 50-100m.

### 5. Brak losowej wariacji

**Objaw:** Dźwięk brzmi powtarzalnie i sztuczne po wielokrotnym usłyszeniu.
**Rozwiązanie:** Dostarcz wiele sampli w SoundShaderze i dodaj `frequencyRandomizer` do SoundSetu.

### 6. Przesterowanie / Zniekształcenie

**Objaw:** Dźwięk trzeszczy lub zniekształca się, szczególnie z bliska.
**Rozwiązanie:** Znormalizuj audio do -1 dB lub -3 dB szczytu w Audacity przed eksportem.

---

## Dobre praktyki

1. **Zawsze eksportuj dźwięki 3D jako mono OGG.** To najważniejsza zasada.

2. **Dostarcz 3-5 wariantów sampli** dla często słyszanych dźwięków (strzały, kroki, uderzenia).

3. **Używaj `frequencyRandomizer`** między 0.03 a 0.08 dla naturalnej wariacji wysokości tonu.

4. **Ustawiaj realistyczne wartości zasięgu.** Strzał karabinowy 600-800m, strzał stłumiony 150-200m, kroki 20-40m.

5. **Warstwuj dźwięki.** Złożone zdarzenia audio (strzały) powinny używać wielu SoundSetów: bliski strzał + odległy grzmot + ogon/echo.

6. **Testuj na wielu odległościach.** Odchodź od źródła dźwięku w grze i sprawdzaj, czy krzywa tłumienia brzmi naturalnie.

7. **Organizuj katalog dźwięków.** Używaj podkatalogów wg kategorii (`weapons/`, `ambient/`, `ui/`, `vehicles/`).

8. **Utrzymuj rozsądne rozmiary plików.** Jakość OGG 5-7 jest wystarczająca. Większość pojedynczych plików dźwiękowych powinna być poniżej 500 KB.

---

## Nawigacja

| Poprzedni | W górę | Dalej |
|----------|----|------|
| [4.3 Materiały](03-materials.md) | [Część 4: Formaty plików i DayZ Tools](01-textures.md) | [4.5 Przebieg pracy DayZ Tools](05-dayz-tools.md) |
