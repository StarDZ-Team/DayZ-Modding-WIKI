# Chapter 5.3: Credits.json

[Home](../../README.md) | [<< Previous: inputs.xml](02-inputs-xml.md) | **Credits.json** | [Next: ImageSet Format >>](04-imagesets.md)

---

## Sumário

- [Visao Geral](#visao-geral)
- [Localização do Arquivo](#localização-do-arquivo)
- [Estrutura JSON](#estrutura-json)
- [Como o DayZ Exibe os Creditos](#como-o-dayz-exibe-os-creditos)
- [Usando Nomes de Seção Localizados](#usando-nomes-de-seção-localizados)
- [Templatés](#templatés)
- [Exemplos Reais](#exemplos-reais)
- [Erros Comuns](#erros-comuns)

---

## Visao Geral

Quando um jogador seleciona seu mod no launcher do DayZ ou no menu de mods do jogo, o motor procura um arquivo `Credits.json` dentro do PBO do seu mod. Se encontrado, os creditos são exibidos em uma visualizacao com rolagem organizada em departamentos e seções --- similar a creditos de cinema.

O arquivo é opcional. Se ausente, nenhuma seção de creditos aparece para o seu mod. Mas inclui-lo e uma boa prática: reconhece o trabalho da sua equipe e da ao seu mod uma aparência profissional.

---

## Localização do Arquivo

Coloque `Credits.json` dentro de uma subpasta `Data` do seu diretório Scripts, ou diretamente na raiz de Scripts:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- Localizacao comum (COT, Expansion, DayZ Editor)
        Credits.json         <-- Tambem valido (DabsFramework, Colorful-UI)
```

Ambas as localizacoes funcionam. O motor varre o conteúdo do PBO por um arquivo chamado `Credits.json` (case-sensitive em algumas plataformas).

---

## Estrutura JSON

O arquivo usa uma estrutura JSON direta com três níveis de hierarquia:

```json
{
    "Header": "My Mod Name",
    "Departments": [
        {
            "DepartmentName": "Department Title",
            "Sections": [
                {
                    "SectionName": "Section Title",
                    "Names": ["Person 1", "Person 2"]
                }
            ]
        }
    ]
}
```

### Campos de Nivel Superior

| Campo | Tipo | Obrigatorio | Descrição |
|-------|------|-------------|-----------|
| `Header` | string | Não | Titulo principal exibido no topo dos creditos. Se omitido, nenhum cabecalho e mostrado. |
| `Departments` | array | Sim | Array de objetos de departamento |

### Objeto Department

| Campo | Tipo | Obrigatorio | Descrição |
|-------|------|-------------|-----------|
| `DepartmentName` | string | Sim | Texto do cabecalho da seção. Pode ser vazio `""` para agrupamento visual sem cabecalho. |
| `Sections` | array | Sim | Array de objetos de seção dentro deste departamento |

### Objeto Section

Duas variantes existem na prática para listar nomes. O motor suporta ambas.

**Variante 1: Array `Names`** (usada pelo MyFramework)

| Campo | Tipo | Obrigatorio | Descrição |
|-------|------|-------------|-----------|
| `SectionName` | string | Sim | Sub-cabecalho dentro do departamento |
| `Names` | array de strings | Sim | Lista de nomes de colaboradores |

**Variante 2: Array `SectionLines`** (usada pelo COT, Expansion, DabsFramework)

| Campo | Tipo | Obrigatorio | Descrição |
|-------|------|-------------|-----------|
| `SectionName` | string | Sim | Sub-cabecalho dentro do departamento |
| `SectionLines` | array de strings | Sim | Lista de nomes de colaboradores ou linhas de texto |

Tanto `Names` quanto `SectionLines` servem ao mesmo propósito. Use o que preferir --- o motor os renderiza de forma identica.

---

## Como o DayZ Exibe os Creditos

A exibicao dos creditos segue esta hierarquia visual:

```
+==================================+
|         MEU MOD                   |  <-- Header (grande, centralizado)
|                                   |
|     NOME DO DEPARTAMENTO          |  <-- DepartmentName (medio, centralizado)
|                                   |
|     Nome da Secao                 |  <-- SectionName (pequeno, centralizado)
|     Pessoa 1                      |  <-- Names/SectionLines (lista)
|     Pessoa 2                      |
|     Pessoa 3                      |
|                                   |
|     Outra Secao                   |
|     Pessoa A                      |
|     Pessoa B                      |
|                                   |
|     OUTRO DEPARTAMENTO            |
|     ...                           |
+==================================+
```

- O `Header` aparece uma vez no topo
- Cada `DepartmentName` atua como um divisor de seção principal
- Cada `SectionName` atua como um sub-cabecalho
- Nomes rolam verticalmente na visualizacao de creditos

### Strings Vazias para Espacamento

Expansion usa strings vazias em `DepartmentName` e `SectionName`, além de entradas somente com espaco em `SectionLines`, para criar espacamento visual:

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

Este é um truque comum para controlar o layout visual na rolagem de creditos.

---

## Usando Nomes de Seção Localizados

Nomes de seção podem referênciar chaves de stringtable usando o prefixo `#`, assim como texto de UI:

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

Quando o motor renderiza isso, ele resolve `#STR_EXPANSION_CREDITS_SCRIPTERS` para o texto localizado correspondente ao idioma do jogador. Isso é util se seu mod suporta múltiplos idiomas e você quer que os cabecalhos de seção dos creditos sejam traduzidos.

Nomes de departamento também podem usar referências de stringtable:

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## Templatés

### Desenvolvedor Solo

```json
{
    "Header": "My Awesome Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developer",
                    "Names": ["YourName"]
                }
            ]
        }
    ]
}
```

### Equipe Pequena

```json
{
    "Header": "My Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developers",
                    "Names": ["Lead Dev", "Co-Developer"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Modeler1", "Modeler2"]
                },
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (French)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                }
            ]
        }
    ]
}
```

### Estrutura Profissional Completa

```json
{
    "Header": "My Big Mod",
    "Departments": [
        {
            "DepartmentName": "Core Team",
            "Sections": [
                {
                    "SectionName": "Lead Developer",
                    "Names": ["ProjectLead"]
                },
                {
                    "SectionName": "Scripters",
                    "Names": ["Dev1", "Dev2", "Dev3"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Artist1", "Artist2"]
                },
                {
                    "SectionName": "Mapping",
                    "Names": ["Mapper1"]
                }
            ]
        },
        {
            "DepartmentName": "Community",
            "Sections": [
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (Czech)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                },
                {
                    "SectionName": "Testers",
                    "Names": ["Tester1", "Tester2", "Tester3"]
                }
            ]
        },
        {
            "DepartmentName": "Legal Notices",
            "Sections": [
                {
                    "SectionName": "Licenses",
                    "Names": [
                        "Font Awesome - CC BY 4.0 License",
                        "Some assets licensed under ADPL-SA"
                    ]
                }
            ]
        }
    ]
}
```

---

## Exemplos Reais

### MyFramework

Um arquivo de creditos mínimo mas completo usando a variante `Names`:

```json
{
    "Header": "MyFramework",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["MyMod Team"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

Usa a variante `SectionLines` com múltiplas seções e agradecimentos:

```json
{
    "Departments": [
        {
            "DepartmentName": "Community Online Tools",
            "Sections": [
                {
                    "SectionName": "Active Developers",
                    "SectionLines": [
                        "LieutenantMaster",
                        "LAVA (liquidrock)"
                    ]
                },
                {
                    "SectionName": "Inactive Developers",
                    "SectionLines": [
                        "Jacob_Mango",
                        "Arkensor",
                        "DannyDog68",
                        "Thurston",
                        "GrosTon1"
                    ]
                },
                {
                    "SectionName": "Thank you to the following communities",
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

Notavel: COT omite o campo `Header` inteiramente. O nome do mod vem de outros metadados (config.cpp `CfgMods`).

### DabsFramework

```json
{
    "Departments": [{
        "DepartmentName": "Development",
        "Sections": [{
                "SectionName": "Developers",
                "SectionLines": [
                    "InclementDab",
                    "Gormirn"
                ]
            },
            {
                "SectionName": "Translators",
                "SectionLines": [
                    "InclementDab",
                    "DanceOfJesus (French)",
                    "MarioE (Spanish)",
                    "Dubinek (Czech)",
                    "Steve AKA Salutesh (German)",
                    "Yuki (Russian)",
                    ".magik34 (Polish)",
                    "Daze (Hungarian)"
                ]
            }
        ]
    }]
}
```

### DayZ Expansion

Expansion demonstra o uso mais sofisticado de Credits.json, incluindo:
- Nomes de seção localizados via referências de stringtable (`#STR_EXPANSION_CREDITS_SCRIPTERS`)
- Avisos legais como um departamento separado
- Nomes de departamento e seção vazios para espacamento visual
- Uma lista de apoiadores com dezenas de nomes

---

## Erros Comuns

### Sintaxe JSON Invalida

O problema mais comum. JSON e rigoroso sobre:
- **Virgulas finais**: `["a", "b",]` e JSON inválido (a virgula final após `"b"`)
- **Aspas simples**: Use `"aspas duplas"`, não `'aspas simples'`
- **Chaves sem aspas**: `DepartmentName` deve ser `"DepartmentName"`

Use um validador de JSON antes de distribuir.

### Nome de Arquivo Errado

O arquivo deve ser nomeado exatamente `Credits.json` (C maiusculo). Em sistemas de arquivo case-sensitive, `credits.json` ou `CREDITS.JSON` não serão encontrados.

### Misturando Names e SectionLines

Dentro de uma única seção, use um ou outro:

```json
{
    "SectionName": "Developers",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

Isso é ambiguo. Escolha um formato e use-o consistentemente ao longo do arquivo.

### Problemas de Codificacao

Salve o arquivo como UTF-8. Caracteres nao-ASCII (nomes acentuados, caracteres CJK) requerem codificacao UTF-8 para serem exibidos corretamente no jogo.
