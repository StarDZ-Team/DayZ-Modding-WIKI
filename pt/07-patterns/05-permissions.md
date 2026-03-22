# Chapter 7.5: Permission Systems

[Home](../README.md) | [<< Previous: Config Persistence](04-config-persistence.md) | **Permission Systems** | [Next: Event-Driven Architecture >>](06-events.md)

---

## Introdução

Toda ferramenta admin, toda ação privilegiada e toda feature de moderação no DayZ precisa de um sistema de permissão. A questão não é se verificar permissões mas como estruturá-las. A comunidade de modding DayZ se estabeleceu em três padrões principais: permissões hierárquicas separadas por ponto (MyMod), atribuição de grupos de usuário por função (VPP) e acesso baseado em função em nível de framework (CF/COT). Cada um tem diferentes trade-offs em granularidade, complexidade e experiência do dono do servidor.

Este capítulo cobre os três padrões, o fluxo de verificação de permissão, formatos de armazenamento e tratamento de wildcard/superadmin.

---

## Por que Permissões Importam

Sem um sistema de permissão, você tem duas opções: ou todo jogador pode fazer tudo (caos), ou você hardcoda Steam64 IDs nos seus scripts (insustentável). Um sistema de permissão permite que donos de servidor definam quem pode fazer o quê, sem modificar código.

As três regras de segurança:

1. **Nunca confie no cliente.** O cliente envia uma requisição; o servidor decide se a honra.
2. **Negação padrão.** Se um jogador não recebeu explicitamente uma permissão, ele não a tem.
3. **Falhe fechado.** Se a própria verificação de permissão falhar (identidade null, dados corrompidos), negue a ação.

---

## Hierárquica Separada por Ponto (Padrão MyMod)

MyMod usa strings de permissão separadas por ponto organizadas em uma hierarquia de árvore. Cada permissão é um caminho como `"MyMod.Admin.Teleport"` ou `"MyMod.Missions.Start"`. Wildcards permitem conceder subárvores inteiras.

### Formato de Permissão

```
MyMod                           (namespace raiz)
├── Admin                        (ferramentas admin)
│   ├── Panel                    (abrir painel admin)
│   ├── Teleport                 (teleportar self/outros)
│   ├── Kick                     (kickar jogadores)
│   ├── Ban                      (banir jogadores)
│   └── Weather                  (mudar clima)
├── Missions                     (sistema de missões)
│   ├── Start                    (iniciar missões manualmente)
│   └── Stop                     (parar missões)
└── AI                           (sistema de IA)
    ├── Spawn                    (spawnar IA manualmente)
    └── Config                   (editar config de IA)
```

### Verificação de Permissão

A verificação percorre as permissões concedidas do jogador e suporta três tipos de match: match exato, wildcard total (`"*"`) e wildcard de prefixo (`"MyMod.Admin.*"`):

```c
bool HasPermission(string plainId, string permission)
{
    if (plainId == "" || permission == "")
        return false;

    TStringArray perms;
    if (!m_Permissions.Find(plainId, perms))
        return false;

    for (int i = 0; i < perms.Count(); i++)
    {
        string granted = perms[i];

        // Wildcard total: superadmin
        if (granted == "*")
            return true;

        // Match exato
        if (granted == permission)
            return true;

        // Wildcard de prefixo: "MyMod.Admin.*" corresponde a "MyMod.Admin.Teleport"
        if (granted.IndexOf("*") > 0)
        {
            string prefix = granted.Substring(0, granted.Length() - 1);
            if (permission.IndexOf(prefix) == 0)
                return true;
        }
    }

    return false;
}
```

### Armazenamento JSON

```json
{
    "Admins": {
        "76561198000000001": ["*"],
        "76561198000000002": ["MyMod.Admin.Panel", "MyMod.Admin.Teleport"],
        "76561198000000003": ["MyMod.Missions.*"],
        "76561198000000004": ["MyMod.Admin.Kick", "MyMod.Admin.Ban"]
    }
}
```

---

## Padrão UserGroup do VPP

VPP Admin Tools usa um sistema baseado em grupos. Você define grupos nomeados (funções) com conjuntos de permissões, depois atribui jogadores a grupos.

### Conceito

```
Grupos:
  "SuperAdmin"  → [todas as permissões]
  "Moderator"   → [kick, ban, mute, teleport]
  "Builder"     → [spawn objects, teleport, ESP]

Jogadores:
  "76561198000000001" → "SuperAdmin"
  "76561198000000002" → "Moderator"
  "76561198000000003" → "Builder"
```

---

## Padrão Baseado em Função do CF (COT)

Community Framework / COT usa um sistema de funções e permissões onde funções são definidas com conjuntos explícitos de permissão, e jogadores são atribuídos a funções.

CF representa permissões como uma estrutura de árvore, onde cada nó pode ser explicitamente permitido, negado ou herdar do pai:

```
Root
├── Admin [ALLOW]
│   ├── Kick [INHERIT → ALLOW]
│   ├── Ban [INHERIT → ALLOW]
│   └── Teleport [DENY]        ← Explicitamente negado mesmo com Admin sendo ALLOW
└── ESP [ALLOW]
```

Este sistema de três estados (allow/deny/inherit) é mais expressivo que os sistemas binários (concedido/não-concedido) usados por MyMod e VPP.

---

## Fluxo de Verificação de Permissão

Independentemente de qual sistema você usa, a verificação server-side segue o mesmo padrão:

```
Cliente envia requisição RPC
        │
        ▼
Handler RPC do servidor recebe
        │
        ▼
    ┌─────────────────────────────────┐
    │ Identidade do sender é não-null? │
    └───────────┬─────────────────────┘
                │ Não → return (descartar silenciosamente)
                │ Sim ▼
    ┌─────────────────────────────────┐
    │ Sender tem a permissão          │
    │ necessária para esta ação?      │
    └───────────┬─────────────────────┘
                │ Não → log warning, opcionalmente enviar erro ao cliente, return
                │ Sim ▼
    ┌─────────────────────────────────┐
    │ Validar dados da requisição     │
    │ (ler params, verificar limites) │
    └───────────┬─────────────────────┘
                │ Inválido → enviar erro ao cliente, return
                │ Válido ▼
    ┌─────────────────────────────────┐
    │ Executar a ação privilegiada    │
    │ Fazer log da ação com ID admin  │
    │ Enviar resposta de sucesso      │
    └─────────────────────────────────┘
```

---

## Padrões de Wildcard e Superadmin

### Wildcard Total: `"*"`

Concede todas as permissões. Este é o padrão superadmin. Um jogador com `"*"` pode fazer qualquer coisa.

**Convenção:** Todo sistema de permissão na comunidade de modding DayZ usa `"*"` para superadmin. Não invente uma convenção diferente.

### Wildcard de Prefixo: `"MyMod.Admin.*"`

Concede todas as permissões que começam com `"MyMod.Admin."`. Permite conceder um subsistema inteiro sem listar cada permissão.

---

## Melhores Práticas

1. **Negação padrão.** Se uma permissão não é explicitamente concedida, a resposta é "não".
2. **Verifique no servidor, nunca no cliente.** Verificações de permissão no cliente são apenas para conveniência de UI (esconder botões). O servidor deve sempre re-verificar.
3. **Use `"*"` para superadmin.** É a convenção universal. Não invente `"all"`, `"admin"` ou `"root"`.
4. **Faça log de toda ação privilegiada negada.** Esta é sua trilha de auditoria de segurança.
5. **Forneça um arquivo de permissões padrão com placeholder.**
6. **Namespaceie suas permissões.** Use `"YourMod.Category.Action"` para evitar colisões com outros mods.
7. **Suporte wildcards de prefixo.** Donos de servidor devem poder conceder `"YourMod.Admin.*"` ao invés de listar cada permissão admin individualmente.
8. **Mantenha o arquivo de permissões editável por humanos.** Donos de servidor vão editá-lo à mão.
9. **Implemente migração desde o primeiro dia.** Quando seu formato de permissão mudar (e vai), migração automática previne tickets de suporte.
10. **Sincronize permissões para o cliente no connect.** O cliente precisa saber suas próprias permissões para fins de UI (mostrar/esconder botões admin). Envie um resumo no connect; não envie o arquivo completo de permissões do servidor.

---

## Compatibilidade & Impacto

- **Multi-Mod:** Cada mod pode definir seu próprio namespace de permissão (`"ModA.Admin.Kick"`, `"ModB.Build.Spawn"`). O wildcard `"*"` concede superadmin em *todos* os mods que compartilham o mesmo armazém de permissões. Se mods usam arquivos de permissão independentes, `"*"` só se aplica dentro do escopo daquele mod.
- **Ordem de Carregamento:** Arquivos de permissão são carregados uma vez durante o startup do servidor. Sem problemas de ordem cross-mod desde que cada mod leia seu próprio arquivo. Se um framework compartilhado (CF/COT) gerencia permissões, todos os mods usando esse framework compartilham a mesma árvore de permissões.
- **Listen Server:** Verificações de permissão devem sempre rodar server-side. Em listen servers, código client-side pode chamar `HasPermission()` para gating de UI (mostrar/esconder botões admin), mas a verificação server-side é a autoritativa.
- **Performance:** Verificações de permissão são um scan linear de array de strings por jogador. Com contagens típicas de admin (1--20 admins, 5--30 permissões cada), isso é desprezível. Para conjuntos de permissão extremamente grandes, considere um `set<string>` ao invés de um array para lookups O(1).
- **Migração:** Adicionar novas strings de permissão não é destrutivo --- admins existentes simplesmente não têm a nova permissão até ser concedida. Renomear permissões quebra concessões existentes silenciosamente. Use versionamento de config para auto-migrar strings de permissão renomeadas.

---

## Erros Comuns

| Erro | Impacto | Correção |
|------|---------|----------|
| Confiar em dados de permissão enviados pelo cliente | Clientes exploitados enviam "Eu sou admin" e o servidor acredita; comprometimento total do servidor | Nunca leia permissões de um payload RPC; sempre consulte `sender.GetPlainId()` no armazém de permissões server-side |
| Negação padrão ausente | Uma verificação de permissão ausente concede acesso a todos; escalação acidental de privilégio | Todo handler RPC para ação privilegiada deve verificar `HasPermission()` e retornar cedo em caso de falha |
| Typo em string de permissão falha silenciosamente | `"MyMod.Amin.Kick"` (typo) nunca faz match --- admin não consegue kickar, nenhum erro é logado | Defina strings de permissão como variáveis `static const`; referencie a constante, nunca um string literal cru |
| Enviar arquivo completo de permissões para o cliente | Expõe todos os Steam64 IDs de admin e seus conjuntos de permissão para qualquer cliente conectado | Envie apenas a lista de permissões do próprio jogador requisitante, nunca o arquivo completo do servidor |
| Sem suporte a wildcard em HasPermission | Donos de servidor devem listar cada permissão individualmente por admin; tedioso e propenso a erros | Implemente wildcards de prefixo (`"MyMod.Admin.*"`) e wildcard total (`"*"`) desde o primeiro dia |

---

## Teoria vs Prática

| Livro-Texto Diz | Realidade do DayZ |
|-----------------|-------------------|
| Use RBAC (controle de acesso baseado em funções) com herança de grupos | Apenas CF/COT suporta permissões de três estados; a maioria dos mods usa concessões flat por jogador por simplicidade |
| Permissões devem ser armazenadas em um banco de dados | Sem acesso a banco de dados; arquivos JSON em `$profile:` são a única opção |
| Use tokens criptográficos para autorização | Sem bibliotecas criptográficas no Enforce Script; confiança é baseada em `PlayerIdentity.GetPlainId()` (Steam64 ID) verificado pela engine |

---

[<< Anterior: Persistência de Config](04-config-persistence.md) | [Início](../README.md) | [Próximo: Arquitetura Orientada a Eventos >>](06-events.md)
