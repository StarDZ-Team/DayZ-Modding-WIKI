# Capitolo 4.4: Audio (.ogg, .wss)

[Home](../README.md) | [<< Precedente: Materiali](03-materials.md) | **Audio** | [Successivo: Flusso di Lavoro DayZ Tools >>](05-dayz-tools.md)

---

## Introduzione

Il sound design è uno degli aspetti più immersivi del modding DayZ. Dallo scoppio di un fucile al vento ambientale in una foresta, l'audio dà vita al mondo di gioco. DayZ usa **OGG Vorbis** come formato audio principale e configura la riproduzione del suono attraverso un sistema a strati di **CfgSoundShaders** e **CfgSoundSets** definiti in `config.cpp`. Comprendere questa pipeline -- dal file audio grezzo al suono spazializzato nel gioco -- è essenziale per qualsiasi mod che introduce armi personalizzate, veicoli, effetti ambientali o feedback dell'interfaccia.

Questo capitolo copre i formati audio, il sistema sonoro guidato dalla configurazione, l'audio posizionale 3D, il volume e l'attenuazione per distanza, il looping e il flusso di lavoro completo per aggiungere suoni personalizzati a una mod DayZ.

---

## Formati Audio

### OGG Vorbis (Formato Principale)

**OGG Vorbis** è il formato audio principale di DayZ. Tutti i suoni personalizzati dovrebbero essere esportati come file `.ogg`.

| Proprietà | Valore |
|----------|-------|
| **Estensione** | `.ogg` |
| **Codec** | Vorbis (compressione con perdita) |
| **Frequenze di campionamento** | 44100 Hz (standard), 22050 Hz (accettabile per ambientale) |
| **Profondità bit** | Gestita dall'encoder (impostazione qualità) |
| **Canali** | Mono (per suoni 3D) o Stereo (per musica/UI) |
| **Intervallo qualità** | -1 a 10 (5-7 consigliato per audio di gioco) |

### Regole Chiave per OGG in DayZ

- **I suoni posizionali 3D DEVONO essere mono.** Se fornisci un file stereo per un suono 3D, il motore potrebbe non spazializzarlo correttamente o ignorare un canale.
- **I suoni UI e musicali possono essere stereo.** I suoni non posizionali (menu, feedback HUD, musica di sottofondo) funzionano correttamente in stereo.
- **La frequenza di campionamento dovrebbe essere 44100 Hz** per la maggior parte dei suoni. Frequenze inferiori (22050 Hz) possono essere usate per suoni ambientali distanti per risparmiare spazio.

### WSS (Formato Legacy)

**WSS** è un formato sonoro legacy dei vecchi titoli Bohemia (serie Arma). DayZ può ancora caricare file WSS, ma le nuove mod dovrebbero usare esclusivamente OGG.

| Proprietà | Valore |
|----------|-------|
| **Estensione** | `.wss` |
| **Stato** | Legacy, non consigliato per nuove mod |
| **Conversione** | I file WSS possono essere convertiti in OGG con Audacity o strumenti simili |

Incontrerai file WSS quando esamini i dati vanilla DayZ o porti contenuto da giochi Bohemia più vecchi.

---

## CfgSoundShaders e CfgSoundSets

Il sistema audio di DayZ usa un approccio di configurazione a due strati definito in `config.cpp`. Un **SoundShader** definisce quale file audio riprodurre e come, mentre un **SoundSet** definisce dove e come il suono viene udito nel mondo.

### La Relazione

```
config.cpp
  |
  |--> CfgSoundShaders     (COSA riprodurre: file, volume, frequenza)
  |      |
  |      |--> MyShader      riferisce --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         (COME riprodurre: posizione 3D, distanza, spaziale)
         |
         |--> MySoundSet    riferisce --> MyShader
```

Il codice di gioco e le altre configurazioni riferiscono i **SoundSet**, mai direttamente i SoundShader. I SoundSet sono l'interfaccia pubblica; i SoundShader sono il dettaglio implementativo.

### CfgSoundShaders

Un SoundShader definisce il contenuto audio grezzo e i parametri base di riproduzione:

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        // Array di file audio -- il motore ne sceglie uno casualmente
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {percorso (senza estensione), peso probabilità}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;                          // Volume base (0.0 - 1.0)
        range = 300;                           // Distanza massima udibile (metri)
        rangeCurve[] = {{0, 1.0}, {300, 0.0}}; // Curva di attenuazione del volume
    };
};
```

> **Importante:** Il percorso `samples[]` NON include l'estensione del file. Il motore aggiunge `.ogg` (o `.wss`) automaticamente in base a ciò che trova su disco.

### CfgSoundSets

Un SoundSet avvolge uno o più SoundShader e definisce le proprietà spaziali e comportamentali:

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;          // Scalatura del volume (applicata sopra il volume dello shader)
        frequencyFactor = 1.0;       // Scalatura della frequenza
        volumeCurve = "InverseSquare"; // Nome curva di attenuazione predefinita
        spatial = 1;                  // 1 = posizionale 3D, 0 = 2D (HUD/menu)
        doppler = 0;                  // 1 = abilita effetto Doppler
        loop = 0;                     // 1 = loop continuo
    };
};
```

---

## Audio Posizionale 3D

DayZ usa audio spaziale 3D per posizionare i suoni nel mondo di gioco. Quando un fucile spara a 200 metri alla tua sinistra, lo senti dall'altoparlante/cuffia sinistro con riduzione di volume appropriata.

### Requisiti per l'Audio 3D

1. **Il file audio deve essere mono.** I file stereo non si spazializzeranno correttamente.
2. **`spatial` del SoundSet deve essere `1`.** Questo abilita il sistema di posizionamento 3D.
3. **La sorgente sonora deve avere una posizione nel mondo.** Il motore necessita di coordinate per calcolare direzione e distanza.

### Attivare Suoni 3D da Script

```c
// Riproduci un suono posizionale in una posizione nel mondo
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// Riproduci un suono collegato a un oggetto (si muove con esso)
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## Volume e Attenuazione per Distanza

### Curva di Range

La `rangeCurve[]` in un SoundShader definisce come il volume diminuisce con la distanza. È un array di coppie `{distanza, volume}`:

```cpp
rangeCurve[] =
{
    {0, 1.0},       // A 0m: volume pieno
    {50, 0.7},      // A 50m: 70% del volume
    {150, 0.3},     // A 150m: 30% del volume
    {300, 0.0}      // A 300m: silenzio
};
```

Il motore interpola linearmente tra i punti definiti. Puoi creare qualsiasi curva di attenuazione aggiungendo più punti di controllo.

### Curve di Volume Predefinite

I SoundSet possono riferire curve nominate tramite la proprietà `volumeCurve`:

| Nome Curva | Comportamento |
|------------|----------|
| `"InverseSquare"` | Attenuazione realistica (volume = 1/distanza^2). Suona naturale. |
| `"Linear"` | Attenuazione uniforme dal massimo a zero sull'intero range. |
| `"Logarithmic"` | Forte da vicino, scende rapidamente a distanza media, poi si attenua lentamente. |

---

## Suoni in Loop

I suoni in loop si ripetono continuamente finché non vengono fermati esplicitamente. Vengono usati per motori, atmosfera ambientale, allarmi e qualsiasi audio sostenuto.

### Configurare un Suono in Loop

Nel SoundSet:
```cpp
class MyMod_Alarm_SoundSet
{
    soundShaders[] = {"MyMod_Alarm_SoundShader"};
    spatial = 1;
    loop = 1;              // Abilita il looping
};
```

### Preparazione del File Audio per i Loop

Per un looping senza interruzioni, il file audio stesso deve avere un loop pulito:

1. **Attraversamento dello zero all'inizio e alla fine.** La forma d'onda deve attraversare l'ampiezza zero in entrambi gli estremi per evitare un click/pop al punto di loop.
2. **Inizio e fine corrispondenti.** La fine del file deve fondersi senza soluzione di continuità con l'inizio.
3. **Nessun fade in/out.** I fade sarebbero udibili ad ogni iterazione del loop.
4. **Testa il loop in Audacity.** Seleziona l'intera clip, abilita la riproduzione in loop e ascolta click o discontinuità.

---

## Aggiungere Suoni Personalizzati a una Mod

### Flusso di Lavoro Completo

**Passo 1: Prepara i file audio**
- Registra o procurati il tuo audio.
- Modifica in Audacity (o il tuo editor audio preferito).
- Per suoni 3D: converti in mono.
- Esporta come OGG Vorbis (qualità 5-7).
- Nomina i file in modo descrittivo: `rifle_shot_01.ogg`, `rifle_shot_02.ogg`.

**Passo 2: Organizza nella directory della mod**

```
MyMod/
  sound/
    weapons/
      rifle_shot_01.ogg
      rifle_shot_02.ogg
      rifle_shot_03.ogg
    ambient/
      wind_loop.ogg
    ui/
      click_01.ogg
  config.cpp
```

**Passo 3: Definisci SoundShaders e SoundSets in config.cpp** -- segui gli esempi sopra.

**Passo 4: Riferisci dalla configurazione dell'arma/oggetto**

**Passo 5: Compila e testa**
- Impacchetta il PBO (usa `-packonly` dato che i file OGG non necessitano di binarizzazione).
- Avvia il gioco con la mod caricata.
- Testa il suono nel gioco a varie distanze.

---

## Strumenti di Produzione Audio

### Audacity (Gratuito, Open Source)

Audacity è lo strumento consigliato per la produzione audio DayZ:

- **Download:** [audacityteam.org](https://www.audacityteam.org/)
- **Esportazione OGG:** File --> Export --> Export as OGG
- **Conversione in mono:** Tracks --> Mix --> Mix Stereo Down to Mono
- **Normalizzazione:** Effect --> Normalize (imposta il picco a -1 dB per prevenire il clipping)
- **Rimozione rumore:** Effect --> Noise Reduction
- **Test loop:** Transport --> Loop Play (Shift+Spazio)

---

## Errori Comuni

### 1. File Stereo per Suono 3D

**Sintomo:** Il suono non si spazializza, si sente centrato o solo in un orecchio.
**Soluzione:** Converti in mono prima di esportare. I suoni posizionali 3D richiedono file audio mono.

### 2. Estensione File nel Percorso samples[]

**Sintomo:** Il suono non si riproduce, nessun errore nel log (il motore fallisce silenziosamente nel trovare il file).
**Soluzione:** Rimuovi l'estensione `.ogg` dal percorso in `samples[]`. Il motore la aggiunge automaticamente.

```cpp
// SBAGLIATO
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// CORRETTO
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. requiredAddons CfgPatches Mancante

**Sintomo:** SoundShader o SoundSet non riconosciuti, i suoni non si riproducono.
**Soluzione:** Aggiungi `"DZ_Sounds_Effects"` al `requiredAddons[]` del tuo CfgPatches per assicurarti che il sistema sonoro base si carichi prima delle tue definizioni.

### 4. Range Troppo Corto

**Sintomo:** Il suono si interrompe bruscamente a breve distanza, sembra innaturale.
**Soluzione:** Imposta `range` a un valore realistico. Gli spari dovrebbero portare a 300-800m, i passi a 20-40m, le voci a 50-100m.

### 5. Nessuna Variazione Casuale

**Sintomo:** Il suono sembra ripetitivo e artificiale dopo averlo sentito più volte.
**Soluzione:** Fornisci campioni multipli nel SoundShader e aggiungi `frequencyRandomizer` al SoundSet per la variazione di tonalità.

### 6. Clipping / Distorsione

**Sintomo:** Il suono scoppietta o distorce, specialmente a corto raggio.
**Soluzione:** Normalizza il tuo audio a -1 dB o -3 dB di picco in Audacity prima di esportare. Non impostare mai `volume` o `volumeFactor` sopra 1.0 a meno che l'audio sorgente non sia molto silenzioso.

---

## Buone Pratiche

1. **Esporta sempre i suoni 3D come OGG mono.** Questa è la regola più importante in assoluto. I file stereo non si spazializzeranno.

2. **Fornisci 3-5 varianti di campione** per i suoni sentiti frequentemente (spari, passi, impatti). La selezione casuale previene l'"effetto mitragliatrice" dell'audio identico ripetuto.

3. **Usa `frequencyRandomizer`** tra 0.03 e 0.08 per variazione naturale della tonalità. Anche una variazione sottile migliora significativamente la qualità audio percepita.

4. **Imposta valori di range realistici.** Studia i suoni vanilla DayZ come riferimento. Un colpo di fucile a 600-800m di range, un colpo silenziato a 150-200m, passi a 20-40m.

5. **Stratifica i tuoi suoni.** Eventi audio complessi (spari) dovrebbero usare SoundSet multipli: colpo ravvicinato + rombo distante + coda/eco. Questo crea profondità che un singolo file sonoro non può ottenere.

6. **Testa a distanze multiple.** Allontanati dalla sorgente sonora nel gioco e verifica che la curva di attenuazione sia naturale. Regola i punti di controllo `rangeCurve[]` iterativamente.

7. **Organizza la tua directory dei suoni.** Usa sottodirectory per categoria (`weapons/`, `ambient/`, `ui/`, `vehicles/`). Una directory piatta con 200 file OGG è ingestibile.

8. **Mantieni le dimensioni file ragionevoli.** L'audio di gioco non necessita di qualità da studio. La qualità OGG 5-7 è sufficiente. La maggior parte dei file sonori individuali dovrebbe essere sotto i 500 KB.

---

## Navigazione

| Precedente | Su | Successivo |
|----------|----|------|
| [4.3 Materiali](03-materials.md) | [Parte 4: Formati File e DayZ Tools](01-textures.md) | [4.5 Flusso di Lavoro DayZ Tools](05-dayz-tools.md) |
