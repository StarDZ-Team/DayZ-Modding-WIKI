# Chapter 7.3: RPC Communication Patterns

[Home](../../README.md) | [<< Previous: Module Systems](02-module-systems.md) | **RPC Communication Patterns** | [Next: Config Persistence >>](04-config-persistence.md)

---

## Introdução

Remote Procedure Calls (RPCs) são a única forma de enviar dados entre cliente e servidor no DayZ. Todo painel admin, toda UI sincronizada, toda notificação servidor-para-cliente e toda requisição de ação cliente-para-servidor flui através de RPCs. Entender como construí-los corretamente --- com ordem de serialização adequada, verificações de permissão e tratamento de erros --- é essencial para qualquer mod que faça mais do que adicionar itens ao CfgVehicles.

Este capítulo cobre o padrão fundamental `ScriptRPC`, o ciclo de vida do roundtrip cliente-servidor, tratamento de erros e depois compara as três principais abordagens de roteamento RPC usadas na comunidade de modding DayZ.

---

## Fundamentos do ScriptRPC

Todo RPC no DayZ usa a classe `ScriptRPC`. O padrão é sempre o mesmo: criar, escrever dados, enviar.

### Lado do Envio

```c
void SendDamageReport(PlayerIdentity target, string weaponName, float damage)
{
    ScriptRPC rpc = new ScriptRPC();

    // Escrever campos em uma ordem específica
    rpc.Write(weaponName);    // campo 1: string
    rpc.Write(damage);        // campo 2: float

    // Enviar pela engine
    rpc.Send(null, MY_RPC_ID, true, target);
}
```

### Lado do Recebimento

O receptor lê campos na **mesma ordem exata** em que foram escritos:

```c
void OnRPC_DamageReport(PlayerIdentity sender, Object target, ParamsReadContext ctx)
{
    string weaponName;
    if (!ctx.Read(weaponName)) return;  // campo 1: string

    float damage;
    if (!ctx.Read(damage)) return;      // campo 2: float

    // Usar os dados
    Print("Hit by " + weaponName + " for " + damage.ToString() + " damage");
}
```

### Quando Usar `guaranteed`

- **`true` (confiável):** Mudanças de config, concessões de permissão, comandos de teleporte, ações de ban --- qualquer coisa onde um pacote perdido deixaria cliente e servidor dessincronizados.
- **`false` (não-confiável):** Atualizações rápidas de posição, efeitos visuais, estado de HUD que atualiza a cada poucos segundos de qualquer forma. Menor overhead, sem fila de retransmissão.

---

## Roundtrip Cliente-Servidor-Cliente

O padrão RPC mais comum é o roundtrip: cliente solicita uma ação, servidor valida e executa, servidor envia de volta o resultado.

```
CLIENT                          SERVER
  │                               │
  │  1. RPC de Requisição ──────► │
  │     (ação + params)          │
  │                               │  2. Validar permissão
  │                               │  3. Executar ação
  │                               │  4. Preparar resposta
  │  ◄──────────── 5. RPC Resposta│
  │     (resultado + dados)      │
  │                               │
  │  6. Atualizar UI              │
```

---

## Verificação de Permissão Antes da Execução

Todo handler RPC server-side que executa uma ação privilegiada **deve** verificar permissões antes de executar. Nunca confie no cliente.

### O Padrão

```c
void OnRPC_AdminAction(PlayerIdentity sender, Object target, ParamsReadContext ctx)
{
    // REGRA 1: Sempre validar que o sender existe
    if (!sender) return;

    // REGRA 2: Verificar permissão antes de ler dados
    if (!MyPermissions.GetInstance().HasPermission(sender.GetPlainId(), "MyMod.Admin.Ban"))
    {
        MyLog.Warning("BanRPC", "Unauthorized ban attempt from " + sender.GetName());
        return;
    }

    // REGRA 3: Só agora ler e executar
    string targetUid;
    if (!ctx.Read(targetUid)) return;

    // ... executar ban
}
```

### Por que Verificar Antes de Ler?

Ler dados de um cliente não autorizado desperdiça ciclos do servidor. Mais importante, dados malformados de um cliente malicioso poderiam causar erros de parsing. Verificar permissão primeiro é uma proteção barata que rejeita maus atores imediatamente.

---

## Serialização: O Contrato de Read/Write

A regra mais importante dos RPCs DayZ: **a ordem de Read deve corresponder exatamente à ordem de Write, tipo por tipo.**

```c
// EMISSOR escreve:
rpc.Write("hello");      // 1. string
rpc.Write(42);           // 2. int
rpc.Write(3.14);         // 3. float
rpc.Write(true);         // 4. bool

// RECEPTOR lê na MESMA ordem:
string s;   ctx.Read(s);     // 1. string
int i;      ctx.Read(i);     // 2. int
float f;    ctx.Read(f);     // 3. float
bool b;     ctx.Read(b);     // 4. bool
```

### Serializando Coleções

Não há serialização de array integrada. Escreva a contagem primeiro, depois cada elemento:

```c
// EMISSOR
array<string> names = {"Alice", "Bob", "Charlie"};
rpc.Write(names.Count());
for (int i = 0; i < names.Count(); i++)
{
    rpc.Write(names[i]);
}

// RECEPTOR
int count;
if (!ctx.Read(count)) return;

array<string> names = new array<string>();
for (int i = 0; i < count; i++)
{
    string name;
    if (!ctx.Read(name)) return;
    names.Insert(name);
}
```

---

## Três Abordagens de RPC Comparadas

### 1. RPCs Nomeados CF

Community Framework fornece `GetRPCManager()` que roteia RPCs por nomes string agrupados por namespace de mod.

**Prós:** Roteamento por string é legível e livre de colisões. Agrupamento por namespace previne conflitos.

**Contras:** Requer CF como dependência. Usa wrappers `Param` que são verbosos.

### 2. RPCs Integer-Range do COT / Vanilla

DayZ vanilla e partes do COT usam IDs inteiros de RPC. Cada mod reserva um range de inteiros e despacha em um override modded de `OnRPC`.

**Prós:** Sem dependências. Comparação de inteiros é rápida. Controle total.

**Contras:** Risco de colisão de ID. Lógica de despacho manual. Sem isolamento de namespace.

### 3. RPCs String-Routed do MyMod

MyMod usa um único ID de engine (83722) e multiplexa escrevendo nome do mod + nome da função como header string em todo RPC.

**Prós:** Zero risco de colisão. Zero dependência do CF. Único ID de engine. Helper `CreateRPC()`.

**Contras:** Duas leituras string extras por RPC. Sistema personalizado.

### Tabela de Comparação

| Feature | CF Nomeado | Integer-Range | MyMod String-Routed |
|---------|----------|---------------|---------------------|
| **Risco de colisão** | Nenhum (namespaced) | Alto | Nenhum (namespaced) |
| **Dependências** | Requer CF | Nenhuma | Nenhuma |
| **Overhead de despacho** | Lookup de string | Switch de inteiro | Lookup de string |
| **Estilo de payload** | Wrappers Param | Raw Write/Read | Raw Write/Read |

### Qual Você Deve Usar?

- **Seu mod depende do CF de qualquer forma** (integração COT/Expansion): use RPCs Nomeados CF
- **Mod standalone, dependências mínimas**: use integer-range ou construa um sistema string-routed
- **Mod do ecossistema MyMod**: use `MyRPC.Register()` / `MyRPC.CreateRPC()`
- **Aprendendo / prototipando**: integer-range é o mais simples de entender

---

## Erros Comuns

### 1. Esquecer de Registrar o Handler

Você envia um RPC mas nada acontece do outro lado. O handler nunca foi registrado.

### 2. Incompatibilidade de Ordem Read/Write

O bug de RPC mais comum. O emissor escreve `(string, int, float)` mas o receptor lê `(string, float, int)`. Sem mensagem de erro --- apenas dados lixo.

**Correção:** Escreva um bloco de comentário documentando a ordem dos campos nos sites de envio e recebimento:

```c
// Wire format: [string weaponName] [int damage] [float distance]
```

### 3. Broadcasting Quando Queria Unicast

```c
// ERRADO: Envia para TODOS os clientes quando queria enviar para um
rpc.Send(null, MY_RPC_ID, true, null);

// CORRETO: Enviar para o cliente específico
rpc.Send(null, MY_RPC_ID, true, targetIdentity);
```

---

## Melhores Práticas

1. **Sempre verifique valores de retorno de `ctx.Read()`.** Toda leitura pode falhar. Retorne imediatamente em caso de falha.
2. **Sempre valide o sender no servidor.** Verifique que `sender` é não-null e tem a permissão necessária antes de fazer qualquer coisa.
3. **Documente o wire format.** Nos sites de envio e recebimento, escreva um comentário listando os campos em ordem com seus tipos.
4. **Use entrega confiável para mudanças de estado.** Entrega não-confiável é apropriada apenas para atualizações rápidas e efêmeras.
5. **Mantenha payloads pequenos.** DayZ tem um limite prático de tamanho por RPC. Para dados grandes, divida em múltiplos RPCs ou use paginação.
6. **Registre handlers cedo.** `OnInit()` é o lugar mais seguro.
7. **Limpe handlers no shutdown.** Desregistre individualmente ou limpe todo o registro em `OnMissionFinish()`.
8. **Use `CreateRPC()` para payloads, `Send()` para sinais.** Se você não tem dados para enviar (apenas um sinal "faça isso"), use o `Send()` apenas com header. Se tem dados, use `CreateRPC()` + writes manuais + `rpc.Send()` manual.

---

## Compatibilidade & Impacto

- **Multi-Mod:** RPCs integer-range são propensos a colisão --- dois mods escolhendo o mesmo ID silenciosamente interceptam as mensagens um do outro. RPCs string-routed ou CF-named evitam isso usando namespace + nome de função como chave.
- **Ordem de Carregamento:** A ordem de registro de handlers RPC importa apenas quando múltiplos mods fazem `modded class DayZGame` e sobrescrevem `OnRPC`. Cada um deve chamar `super.OnRPC()` para IDs não tratados, ou mods downstream nunca recebem seus RPCs. Sistemas string-routed evitam isso usando um único ID de engine.
- **Listen Server:** Em listen servers, tanto cliente quanto servidor rodam no mesmo processo. Um RPC enviado com `identity = null` do lado do servidor também será recebido localmente. Proteja handlers com `if (type != CallType.Server) return;` ou verifique `GetGame().IsServer()` / `GetGame().IsClient()` conforme apropriado.
- **Performance:** Overhead de despacho de RPC é mínimo (lookup de string ou switch de inteiro). O gargalo é o tamanho do payload --- DayZ tem um limite prático por RPC (~64 KB). Para dados grandes (sync de config), pagine entre múltiplos RPCs.
- **Migração:** IDs de RPC são um detalhe interno do mod e não são afetados por atualizações de versão do DayZ. Se você mudar seu wire format de RPC (adicionar/remover campos), clientes antigos falando com um novo servidor vão silenciosamente dessincronizar. Versione seus payloads de RPC ou force atualizações de cliente.

---

## Teoria vs Prática

| Livro-Texto Diz | Realidade do DayZ |
|-----------------|-------------------|
| Use protocol buffers ou serialização baseada em schema | Enforce Script não tem suporte a protobuf; você manualmente faz `Write`/`Read` de primitivos em ordem combinada |
| Valide todos os inputs com aplicação de schema | Nenhuma validação de schema existe; todo valor de retorno de `ctx.Read()` deve ser verificado individualmente |
| RPCs devem ser idempotentes | Prático no DayZ apenas para RPCs de consulta; RPCs de mutação (spawn, delete, teleport) são inerentemente não-idempotentes --- proteja com verificações de permissão ao invés |

---

[<< Anterior: Sistemas de Módulos](02-module-systems.md) | [Início](../../README.md) | [Próximo: Persistência de Config >>](04-config-persistence.md)
