# Capitolo 5.3: Credits.json

[Home](../README.md) | [<< Precedente: inputs.xml](02-inputs-xml.md) | **Credits.json** | [Successivo: Formato ImageSet >>](04-imagesets.md)

---

> **Sommario:** Il file `Credits.json` definisce i crediti che DayZ mostra per la tua mod nel menù mod del gioco. Elenca i membri del team, i contributori e i ringraziamenti organizzati per dipartimenti e sezioni. Sebbene puramente cosmetico, è il modo standard per dare credito al tuo team di sviluppo.

---

## Indice

- [Panoramica](#panoramica)
- [Posizione del File](#posizione-del-file)
- [Struttura JSON](#struttura-json)
- [Come DayZ Mostra i Crediti](#come-dayz-mostra-i-crediti)
- [Usare Nomi di Sezione Localizzati](#usare-nomi-di-sezione-localizzati)
- [Template](#template)
- [Esempi Reali](#esempi-reali)
- [Errori Comuni](#errori-comuni)

---

## Panoramica

Quando un giocatore seleziona la tua mod nel launcher di DayZ o nel menù mod in gioco, il motore cerca un file `Credits.json` all'interno del PBO della tua mod. Se trovato, i crediti vengono mostrati in una vista a scorrimento organizzata in dipartimenti e sezioni --- simile ai titoli di coda di un film.

Il file è opzionale. Se assente, nessuna sezione crediti appare per la tua mod. Ma includerne uno è una buona pratica: riconosce il lavoro del tuo team e dà alla tua mod un aspetto professionale.

---

## Posizione del File

Posiziona `Credits.json` dentro una sottocartella `Data` della tua directory Scripts, o direttamente nella radice degli Script:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- Posizione comune (COT, Expansion, DayZ Editor)
        Credits.json         <-- Anche valida (DabsFramework, Colorful-UI)
```

Entrambe le posizioni funzionano. Il motore scansiona il contenuto del PBO cercando un file chiamato `Credits.json` (case-sensitive su alcune piattaforme).

---

## Struttura JSON

Il file utilizza una struttura JSON semplice con tre livelli di gerarchia:

```json
{
    "Header": "Nome della Mia Mod",
    "Departments": [
        {
            "DepartmentName": "Titolo Dipartimento",
            "Sections": [
                {
                    "SectionName": "Titolo Sezione",
                    "Names": ["Persona 1", "Persona 2"]
                }
            ]
        }
    ]
}
```

### Campi di Livello Superiore

| Campo | Tipo | Richiesto | Descrizione |
|-------|------|-----------|-------------|
| `Header` | stringa | No | Titolo principale mostrato in cima ai crediti. Se omesso, nessun header viene mostrato. |
| `Departments` | array | Sì | Array di oggetti dipartimento |

### Oggetto Dipartimento

| Campo | Tipo | Richiesto | Descrizione |
|-------|------|-----------|-------------|
| `DepartmentName` | stringa | Sì | Testo dell'intestazione di sezione. Può essere vuoto `""` per raggruppamento visivo senza intestazione. |
| `Sections` | array | Sì | Array di oggetti sezione all'interno di questo dipartimento |

### Oggetto Sezione

Esistono due varianti in uso per elencare i nomi. Il motore supporta entrambe.

**Variante 1: array `Names`** (usata da MyMod Core)

| Campo | Tipo | Richiesto | Descrizione |
|-------|------|-----------|-------------|
| `SectionName` | stringa | Sì | Sotto-intestazione all'interno del dipartimento |
| `Names` | array di stringhe | Sì | Lista dei nomi dei contributori |

**Variante 2: array `SectionLines`** (usata da COT, Expansion, DabsFramework)

| Campo | Tipo | Richiesto | Descrizione |
|-------|------|-----------|-------------|
| `SectionName` | stringa | Sì | Sotto-intestazione all'interno del dipartimento |
| `SectionLines` | array di stringhe | Sì | Lista dei nomi dei contributori o righe di testo |

Sia `Names` che `SectionLines` servono allo stesso scopo. Usa quello che preferisci --- il motore li renderizza in modo identico.

---

## Come DayZ Mostra i Crediti

La visualizzazione dei crediti segue questa gerarchia visiva:

```
+==================================+
|         NOME DELLA MIA MOD       |  <-- Header (grande, centrato)
|                                  |
|     NOME DIPARTIMENTO            |  <-- DepartmentName (medio, centrato)
|                                  |
|     Nome Sezione                 |  <-- SectionName (piccolo, centrato)
|     Persona 1                    |  <-- Names/SectionLines (lista)
|     Persona 2                    |
|     Persona 3                    |
|                                  |
|     Altra Sezione                |
|     Persona A                    |
|     Persona B                    |
|                                  |
|     ALTRO DIPARTIMENTO           |
|     ...                          |
+==================================+
```

- L'`Header` appare una volta in cima
- Ogni `DepartmentName` agisce come divisore di sezione principale
- Ogni `SectionName` agisce come sotto-intestazione
- I nomi scorrono verticalmente nella vista dei crediti

### Stringhe Vuote per Spaziatura

Expansion usa stringhe vuote per `DepartmentName` e `SectionName`, più voci con soli spazi in `SectionLines`, per creare spaziatura visiva:

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

Questo è un trucco comune per controllare il layout visivo nello scorrimento dei crediti.

---

## Usare Nomi di Sezione Localizzati

I nomi delle sezioni possono fare riferimento a chiavi della stringtable usando il prefisso `#`, proprio come il testo dell'UI:

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

Quando il motore renderizza questo, risolve `#STR_EXPANSION_CREDITS_SCRIPTERS` nel testo localizzato corrispondente alla lingua del giocatore. Questo è utile se la tua mod supporta più lingue e vuoi che le intestazioni delle sezioni dei crediti siano tradotte.

I nomi dei dipartimenti possono anche usare riferimenti alla stringtable:

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## Template

### Sviluppatore Singolo

```json
{
    "Header": "My Awesome Mod",
    "Departments": [
        {
            "DepartmentName": "Sviluppo",
            "Sections": [
                {
                    "SectionName": "Sviluppatore",
                    "Names": ["TuoNome"]
                }
            ]
        }
    ]
}
```

### Piccolo Team

```json
{
    "Header": "My Mod",
    "Departments": [
        {
            "DepartmentName": "Sviluppo",
            "Sections": [
                {
                    "SectionName": "Sviluppatori",
                    "Names": ["Lead Dev", "Co-Sviluppatore"]
                },
                {
                    "SectionName": "Artisti 3D",
                    "Names": ["Modellatore1", "Modellatore2"]
                },
                {
                    "SectionName": "Traduttori",
                    "Names": [
                        "Traduttore1 (Francese)",
                        "Traduttore2 (Tedesco)",
                        "Traduttore3 (Russo)"
                    ]
                }
            ]
        }
    ]
}
```

### Struttura Professionale Completa

```json
{
    "Header": "My Big Mod",
    "Departments": [
        {
            "DepartmentName": "Team Principale",
            "Sections": [
                {
                    "SectionName": "Sviluppatore Principale",
                    "Names": ["ProjectLead"]
                },
                {
                    "SectionName": "Programmatori",
                    "Names": ["Dev1", "Dev2", "Dev3"]
                },
                {
                    "SectionName": "Artisti 3D",
                    "Names": ["Artista1", "Artista2"]
                },
                {
                    "SectionName": "Mapping",
                    "Names": ["Mapper1"]
                }
            ]
        },
        {
            "DepartmentName": "Comunità",
            "Sections": [
                {
                    "SectionName": "Traduttori",
                    "Names": [
                        "Traduttore1 (Ceco)",
                        "Traduttore2 (Tedesco)",
                        "Traduttore3 (Russo)"
                    ]
                },
                {
                    "SectionName": "Tester",
                    "Names": ["Tester1", "Tester2", "Tester3"]
                }
            ]
        },
        {
            "DepartmentName": "Note Legali",
            "Sections": [
                {
                    "SectionName": "Licenze",
                    "Names": [
                        "Font Awesome - Licenza CC BY 4.0",
                        "Alcuni asset con licenza ADPL-SA"
                    ]
                }
            ]
        }
    ]
}
```

---

## Esempi Reali

### MyMod Core

Un file crediti minimale ma completo che usa la variante `Names`:

```json
{
    "Header": "MyMod Core",
    "Departments": [
        {
            "DepartmentName": "Sviluppo",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["Team Documentazione"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

Usa la variante `SectionLines` con sezioni multiple e ringraziamenti:

```json
{
    "Departments": [
        {
            "DepartmentName": "Community Online Tools",
            "Sections": [
                {
                    "SectionName": "Sviluppatori Attivi",
                    "SectionLines": [
                        "LieutenantMaster",
                        "LAVA (liquidrock)"
                    ]
                },
                {
                    "SectionName": "Sviluppatori Inattivi",
                    "SectionLines": [
                        "Jacob_Mango",
                        "Arkensor",
                        "DannyDog68",
                        "Thurston",
                        "GrosTon1"
                    ]
                },
                {
                    "SectionName": "Grazie alle seguenti comunità",
                    "SectionLines": [
                        "PIPSI.NET AU/NZ",
                        "1SKGaming",
                        "AWG",
                        "Expansion Mod Team",
                        "Bohemia Interactive"
                    ]
                }
            ]
        }
    ]
}
```

Da notare: COT omette completamente il campo `Header`. Il nome della mod proviene da altri metadati (`CfgMods` in config.cpp).

### DabsFramework

```json
{
    "Departments": [{
        "DepartmentName": "Sviluppo",
        "Sections": [{
                "SectionName": "Sviluppatori",
                "SectionLines": [
                    "InclementDab",
                    "Gormirn"
                ]
            },
            {
                "SectionName": "Traduttori",
                "SectionLines": [
                    "InclementDab",
                    "DanceOfJesus (Francese)",
                    "MarioE (Spagnolo)",
                    "Dubinek (Ceco)",
                    "Steve AKA Salutesh (Tedesco)",
                    "Yuki (Russo)",
                    ".magik34 (Polacco)",
                    "Daze (Ungherese)"
                ]
            }
        ]
    }]
}
```

### DayZ Expansion

Expansion dimostra l'uso più sofisticato di Credits.json, inclusi:
- Nomi di sezione localizzati tramite riferimenti alla stringtable (`#STR_EXPANSION_CREDITS_SCRIPTERS`)
- Note legali come dipartimento separato
- Nomi di dipartimento e sezione vuoti per spaziatura visiva
- Una lista di sostenitori con decine di nomi

---

## Errori Comuni

### Sintassi JSON Non Valida

Il problema più comune. Il JSON è rigoroso riguardo a:
- **Virgole finali**: `["a", "b",]` è JSON non valido (la virgola finale dopo `"b"`)
- **Virgolette singole**: Usa `"virgolette doppie"`, non `'virgolette singole'`
- **Chiavi non quotate**: `DepartmentName` deve essere `"DepartmentName"`

Usa un validatore JSON prima della distribuzione.

### Nome File Errato

Il file deve chiamarsi esattamente `Credits.json` (C maiuscola). Su file system case-sensitive, `credits.json` o `CREDITS.JSON` non verranno trovati.

### Mescolare Names e SectionLines

All'interno di una singola sezione, usa l'uno o l'altro:

```json
{
    "SectionName": "Sviluppatori",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

Questo è ambiguo. Scegli un formato e usalo in modo coerente in tutto il file.

### Problemi di Codifica

Salva il file come UTF-8. Caratteri non-ASCII (nomi accentati, caratteri CJK) richiedono la codifica UTF-8 per essere visualizzati correttamente in gioco.

---

## Buone Pratiche

- Valida il tuo JSON con uno strumento esterno prima di impacchettarlo in un PBO -- il motore non fornisce messaggi di errore utili per JSON malformato.
- Usa la variante `SectionLines` per coerenza, dato che è il formato usato da COT, Expansion e DabsFramework.
- Includi un dipartimento "Note Legali" se la tua mod include asset di terze parti (font, icone, suoni) con requisiti di attribuzione.
- Mantieni il campo `Header` corrispondente al `name` della tua mod in `mod.cpp` e `config.cpp` per un'identità coerente.
- Usa stringhe vuote per `DepartmentName` e `SectionName` con parsimonia per spaziatura visiva -- l'uso eccessivo rende i crediti frammentati.

---

## Compatibilità e Impatto

- **Multi-Mod:** Ogni mod ha il proprio `Credits.json` indipendente. Non c'è rischio di collisione -- il motore legge il file dall'interno del PBO di ogni mod separatamente.
- **Prestazioni:** I crediti vengono caricati solo quando il giocatore apre la schermata dei dettagli della mod. La dimensione del file non ha impatto sulle prestazioni di gioco.
