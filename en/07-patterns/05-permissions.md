# Chapter 7.5: Permission Systems

[<< Previous: Config Persistence](04-config-persistence.md) | [Home](../../README.md) | [Next: Event-Driven Architecture >>](06-events.md)

---

## Introduction

Every admin tool, every privileged action, and every moderation feature in DayZ needs a permission system. The question is not whether to check permissions but how to structure them. The DayZ modding community has settled on three major patterns: hierarchical dot-separated permissions, user-group role assignment (VPP), and framework-level role-based access (CF/COT). Each has different trade-offs in granularity, complexity, and server-owner experience.

This chapter covers all three patterns, the permission-checking flow, storage formats, and wildcard/superadmin handling.

---

## Table of Contents

- [Why Permissions Matter](#why-permissions-matter)
- [Hierarchical Dot-Separated (MyMod Pattern)](#hierarchical-dot-separated-mymod-pattern)
- [VPP UserGroup Pattern](#vpp-usergroup-pattern)
- [CF Role-Based Pattern (COT)](#cf-role-based-pattern-cot)
- [Permission Checking Flow](#permission-checking-flow)
- [Storage Formats](#storage-formats)
- [Wildcard and Superadmin Patterns](#wildcard-and-superadmin-patterns)
- [Migration Between Systems](#migration-between-systems)
- [Best Practices](#best-practices)

---

## Why Permissions Matter

Without a permission system, you have two options: either every player can do everything (chaos), or you hardcode Steam64 IDs in your scripts (unmaintainable). A permission system lets server owners define who can do what, without modifying code.

The three security rules:

1. **Never trust the client.** The client sends a request; the server decides whether to honor it.
2. **Default deny.** If a player is not explicitly granted a permission, they do not have it.
3. **Fail closed.** If the permission check itself fails (null identity, corrupted data), deny the action.

---

## Hierarchical Dot-Separated (MyMod Pattern)

MyMod uses dot-separated permission strings organized in a tree hierarchy. Each permission is a path like `"MyMod.Admin.Teleport"` or `"MyMod.Missions.Start"`. Wildcards allow granting entire subtrees.

### Permission Format

```
MyMod                           (root namespace)
├── Admin                        (admin tools)
│   ├── Panel                    (open admin panel)
│   ├── Teleport                 (teleport self/others)
│   ├── Kick                     (kick players)
│   ├── Ban                      (ban players)
│   └── Weather                  (change weather)
├── Missions                     (mission system)
│   ├── Start                    (start missions manually)
│   └── Stop                     (stop missions)
└── AI                           (AI system)
    ├── Spawn                    (spawn AI manually)
    └── Config                   (edit AI config)
```

### Data Model

Each player (identified by Steam64 ID) has an array of granted permission strings:

```c
class MyPermissionsData
{
    // key: Steam64 ID, value: array of permission strings
    ref map<string, ref TStringArray> Admins;

    void MyPermissionsData()
    {
        Admins = new map<string, ref TStringArray>();
    }
};
```

### Permission Check

The check walks the player's granted permissions and supports three match types: exact match, full wildcard (`"*"`), and prefix wildcard (`"MyMod.Admin.*"`):

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

        // Full wildcard: superadmin
        if (granted == "*")
            return true;

        // Exact match
        if (granted == permission)
            return true;

        // Prefix wildcard: "MyMod.Admin.*" matches "MyMod.Admin.Teleport"
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

### JSON Storage

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

### Strengths

- **Fine-grained:** you can grant exactly the permissions each admin needs
- **Hierarchical:** wildcards grant entire subtrees without listing every permission
- **Self-documenting:** the permission string tells you what it controls
- **Extensible:** new permissions are just new strings --- no schema changes

### Weaknesses

- **No named roles:** if 10 admins need the same set, you list it 10 times
- **String-based:** typos in permission strings fail silently (they just do not match)

---

## VPP UserGroup Pattern

VPP Admin Tools uses a group-based system. You define named groups (roles) with sets of permissions, then assign players to groups.

### Concept

```
Groups:
  "SuperAdmin"  → [all permissions]
  "Moderator"   → [kick, ban, mute, teleport]
  "Builder"     → [spawn objects, teleport, ESP]

Players:
  "76561198000000001" → "SuperAdmin"
  "76561198000000002" → "Moderator"
  "76561198000000003" → "Builder"
```

### Implementation Pattern

```c
class VPPUserGroup
{
    string GroupName;
    ref array<string> Permissions;
    ref array<string> Members;  // Steam64 IDs

    bool HasPermission(string permission)
    {
        if (!Permissions) return false;

        for (int i = 0; i < Permissions.Count(); i++)
        {
            if (Permissions[i] == permission)
                return true;
            if (Permissions[i] == "*")
                return true;
        }
        return false;
    }
};

class VPPPermissionManager
{
    ref array<ref VPPUserGroup> m_Groups;

    bool PlayerHasPermission(string plainId, string permission)
    {
        for (int i = 0; i < m_Groups.Count(); i++)
        {
            VPPUserGroup group = m_Groups[i];

            // Check if player is in this group
            if (group.Members.Find(plainId) == -1)
                continue;

            if (group.HasPermission(permission))
                return true;
        }
        return false;
    }
};
```

### JSON Storage

```json
{
    "Groups": [
        {
            "GroupName": "SuperAdmin",
            "Permissions": ["*"],
            "Members": ["76561198000000001"]
        },
        {
            "GroupName": "Moderator",
            "Permissions": [
                "admin.kick",
                "admin.ban",
                "admin.mute",
                "admin.teleport"
            ],
            "Members": [
                "76561198000000002",
                "76561198000000003"
            ]
        },
        {
            "GroupName": "Builder",
            "Permissions": [
                "admin.spawn",
                "admin.teleport",
                "admin.esp"
            ],
            "Members": [
                "76561198000000004"
            ]
        }
    ]
}
```

### Strengths

- **Role-based:** define a role once, assign it to many players
- **Familiar:** server owners understand group/role systems from other games
- **Easy bulk changes:** change a group's permissions and all members are updated

### Weaknesses

- **Less granular without extra work:** giving one specific admin one extra permission means creating a new group or adding per-player overrides
- **Group inheritance is complex:** VPP does not natively support group hierarchy (e.g., "Admin" inherits all "Moderator" permissions)

---

## CF Role-Based Pattern (COT)

Community Framework / COT uses a role and permission system where roles are defined with explicit permission sets, and players are assigned to roles.

### Concept

CF's permission system is similar to VPP's groups but integrated into the framework layer, making it available to all CF-based mods:

```c
// COT pattern (simplified)
// Roles are defined in AuthFile.json
// Each role has a name and an array of permissions
// Players are assigned to roles by Steam64 ID

class CF_Permission
{
    string m_Name;
    ref array<ref CF_Permission> m_Children;
    int m_State;  // ALLOW, DENY, INHERIT
};
```

### Permission Tree

CF represents permissions as a tree structure, where each node can be explicitly allowed, denied, or inherit from its parent:

```
Root
├── Admin [ALLOW]
│   ├── Kick [INHERIT → ALLOW]
│   ├── Ban [INHERIT → ALLOW]
│   └── Teleport [DENY]        ← Explicitly denied even though Admin is ALLOW
└── ESP [ALLOW]
```

This three-state system (allow/deny/inherit) is more expressive than the binary (granted/not-granted) systems used by MyMod and VPP. It allows you to grant a broad category and then carve out exceptions.

### JSON Storage

```json
{
    "Roles": {
        "Moderator": {
            "admin": {
                "kick": 2,
                "ban": 2,
                "teleport": 1
            }
        }
    },
    "Players": {
        "76561198000000001": {
            "Role": "SuperAdmin"
        }
    }
}
```

(Where `2 = ALLOW`, `1 = DENY`, `0 = INHERIT`)

### Strengths

- **Three-state permissions:** allow, deny, inherit gives maximum flexibility
- **Tree structure:** mirrors the hierarchical nature of permission paths
- **Framework-level:** all CF mods share the same permission system

### Weaknesses

- **Complexity:** three states are harder for server owners to understand than simple "granted"
- **CF dependency:** only works with Community Framework

---

## Permission Checking Flow

Regardless of which system you use, the server-side permission check follows the same pattern:

```
Client sends RPC request
        │
        ▼
Server RPC handler receives it
        │
        ▼
    ┌─────────────────────────────────┐
    │ Is sender identity non-null?     │
    │ (Network-level validation)       │
    └───────────┬─────────────────────┘
                │ No → return (drop silently)
                │ Yes ▼
    ┌─────────────────────────────────┐
    │ Does sender have the required    │
    │ permission for this action?      │
    └───────────┬─────────────────────┘
                │ No → log warning, optionally send error to client, return
                │ Yes ▼
    ┌─────────────────────────────────┐
    │ Validate request data            │
    │ (read params, check bounds)      │
    └───────────┬─────────────────────┘
                │ Invalid → send error to client, return
                │ Valid ▼
    ┌─────────────────────────────────┐
    │ Execute the privileged action    │
    │ Log the action with admin ID     │
    │ Send success response            │
    └─────────────────────────────────┘
```

### Implementation

```c
void OnRPC_KickPlayer(PlayerIdentity sender, Object target, ParamsReadContext ctx)
{
    // Step 1: Validate sender
    if (!sender) return;

    // Step 2: Check permission
    if (!MyPermissions.GetInstance().HasPermission(sender.GetPlainId(), "MyMod.Admin.Kick"))
    {
        MyLog.Warning("Admin", "Unauthorized kick attempt: " + sender.GetName());
        return;
    }

    // Step 3: Read and validate data
    string targetUid;
    if (!ctx.Read(targetUid)) return;

    if (targetUid == sender.GetPlainId())
    {
        // Cannot kick yourself
        SendError(sender, "Cannot kick yourself");
        return;
    }

    // Step 4: Execute
    PlayerIdentity targetIdentity = FindPlayerByUid(targetUid);
    if (!targetIdentity)
    {
        SendError(sender, "Player not found");
        return;
    }

    GetGame().DisconnectPlayer(targetIdentity);

    // Step 5: Log and respond
    MyLog.Info("Admin", sender.GetName() + " kicked " + targetIdentity.GetName());
    SendSuccess(sender, "Player kicked");
}
```

---

## Storage Formats

All three systems store permissions in JSON. The differences are structural:

### Flat Per-Player

```json
{
    "Admins": {
        "STEAM64_ID": ["perm.a", "perm.b", "perm.c"]
    }
}
```

**File:** One file for all players.
**Pros:** Simple, easy to edit by hand.
**Cons:** Redundant if many players share the same permissions.

### Per-Player File (Expansion / Player Data)

```json
// File: $profile:MyMod/Players/76561198xxxxx.json
{
    "UID": "76561198xxxxx",
    "Permissions": ["perm.a", "perm.b"],
    "LastLogin": "2025-01-15 14:30:00"
}
```

**Pros:** Each player is independent; no locking concerns.
**Cons:** Many small files; searching "who has permission X?" requires scanning all files.

### Group-Based (VPP)

```json
{
    "Groups": [
        {
            "GroupName": "RoleName",
            "Permissions": ["perm.a", "perm.b"],
            "Members": ["STEAM64_ID_1", "STEAM64_ID_2"]
        }
    ]
}
```

**Pros:** Role changes propagate to all members instantly.
**Cons:** A player cannot easily have per-player permission overrides without a dedicated group.

### Choosing a Format

| Factor | Flat Per-Player | Per-Player File | Group-Based |
|--------|----------------|-----------------|-------------|
| **Small server (1-5 admins)** | Best | Overkill | Overkill |
| **Medium server (5-20 admins)** | Good | Good | Best |
| **Large community (20+ roles)** | Redundant | Files multiply | Best |
| **Per-player customization** | Native | Native | Needs workaround |
| **Hand-editing** | Easy | Easy per player | Moderate |

---

## Wildcard and Superadmin Patterns

```mermaid
graph TD
    ROOT["*  (superadmin)"] --> A["MyMod.*"]
    A --> B["MyMod.Admin.*"]
    B --> C["MyMod.Admin.Kick"]
    B --> D["MyMod.Admin.Ban"]
    B --> E["MyMod.Admin.Teleport"]
    A --> F["MyMod.Player.*"]
    F --> G["MyMod.Player.Shop"]
    F --> H["MyMod.Player.Trade"]

    style ROOT fill:#ff4444,color:#fff
    style A fill:#ff8844,color:#fff
    style B fill:#ffaa44,color:#fff
```

### Full Wildcard: `"*"`

Grants all permissions. This is the superadmin pattern. A player with `"*"` can do anything.

```c
if (granted == "*")
    return true;
```

**Convention:** Every permission system in the DayZ modding community uses `"*"` for superadmin. Do not invent a different convention.

### Prefix Wildcard: `"MyMod.Admin.*"`

Grants all permissions that start with `"MyMod.Admin."`. This allows granting an entire subsystem without listing every permission:

```c
// "MyMod.Admin.*" matches:
//   "MyMod.Admin.Teleport"  ✓
//   "MyMod.Admin.Kick"      ✓
//   "MyMod.Admin.Ban"       ✓
//   "MyMod.Missions.Start"  ✗ (different subtree)
```

### Implementation

```c
if (granted.IndexOf("*") > 0)
{
    // "MyMod.Admin.*" → prefix = "MyMod.Admin."
    string prefix = granted.Substring(0, granted.Length() - 1);
    if (permission.IndexOf(prefix) == 0)
        return true;
}
```

### No Negative Permissions (Dot-Separated / VPP)

Both the dot-separated and VPP systems use additive-only permissions. You can grant permissions but not explicitly deny them. If a permission is not in the player's list, it is denied.

CF/COT is the exception with its three-state system (ALLOW/DENY/INHERIT), which supports explicit denials.

### Superadmin Escape Hatch

Provide a way to check if someone is a superadmin without checking a specific permission. This is useful for bypass logic:

```c
bool IsSuperAdmin(string plainId)
{
    return HasPermission(plainId, "*");
}
```

---

## Migration Between Systems

If your mod needs to support servers migrating from one permission system to another (e.g., from a flat admin UID list to hierarchical permissions), implement automatic migration on load:

```c
void Load()
{
    if (!FileExist(PERMISSIONS_FILE))
    {
        CreateDefaultFile();
        return;
    }

    // Try new format first
    if (LoadNewFormat())
        return;

    // Fall back to legacy format and migrate
    LoadLegacyAndMigrate();
}

void LoadLegacyAndMigrate()
{
    // Read old format: { "AdminUIDs": ["uid1", "uid2"] }
    LegacyPermissionData legacyData = new LegacyPermissionData();
    JsonFileLoader<LegacyPermissionData>.JsonLoadFile(PERMISSIONS_FILE, legacyData);

    // Migrate: each legacy admin becomes a superadmin in the new system
    for (int i = 0; i < legacyData.AdminUIDs.Count(); i++)
    {
        string uid = legacyData.AdminUIDs[i];
        GrantPermission(uid, "*");
    }

    // Save in new format
    Save();
    MyLog.Info("Permissions", "Migrated " + legacyData.AdminUIDs.Count().ToString()
        + " admin(s) from legacy format");
}
```

This is a common pattern used to migrate from its original flat `AdminUIDs` array to the hierarchical `Admins` map.

---

## Best Practices

1. **Default deny.** If a permission is not explicitly granted, the answer is "no".

2. **Check on the server, never the client.** Client-side permission checks are for UI convenience only (hiding buttons). The server must always re-verify.

3. **Use `"*"` for superadmin.** It is the universal convention. Do not invent `"all"`, `"admin"`, or `"root"`.

4. **Log every denied privileged action.** This is your security audit trail.

5. **Provide a default permissions file with a placeholder.** New server owners should see a clear example:

```json
{
    "Admins": {
        "PUT_STEAM64_ID_HERE": ["*"]
    }
}
```

6. **Namespace your permissions.** Use `"YourMod.Category.Action"` to avoid collisions with other mods.

7. **Support prefix wildcards.** Server owners should be able to grant `"YourMod.Admin.*"` instead of listing every admin permission individually.

8. **Keep the permissions file human-editable.** Server owners will edit it by hand. Use clear key names, one permission per line in the JSON, and document the available permissions somewhere in your mod's documentation.

9. **Implement migration from day one.** When your permission format changes (and it will), automatic migration prevents support tickets.

10. **Sync permissions to the client on connect.** The client needs to know its own permissions for UI purposes (showing/hiding admin buttons). Send a summary on connect; do not send the entire server permissions file.

---

## Compatibility & Impact

- **Multi-Mod:** Each mod can define its own permission namespace (`"ModA.Admin.Kick"`, `"ModB.Build.Spawn"`). The `"*"` wildcard grants superadmin across *all* mods that share the same permission store. If mods use independent permission files, `"*"` only applies within that mod's scope.
- **Load Order:** Permission files are loaded once during server startup. No cross-mod ordering issues as long as each mod reads its own file. If a shared framework (CF/COT) manages permissions, all mods using that framework share the same permission tree.
- **Listen Server:** Permission checks should always run server-side. On listen servers, client-side code may call `HasPermission()` for UI gating (showing/hiding admin buttons), but the server-side check is the authoritative one.
- **Performance:** Permission checks are a string-array linear scan per player. With typical admin counts (1--20 admins, 5--30 permissions each), this is negligible. For extremely large permission sets, consider a `set<string>` instead of an array for O(1) lookups.
- **Migration:** Adding new permission strings is non-breaking --- existing admins simply do not have the new permission until granted. Renaming permissions breaks existing grants silently. Use config versioning to auto-migrate renamed permission strings.

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Trusting client-sent permission data | Exploited clients send `"I am admin"` and the server believes them; full server compromise | Never read permissions from an RPC payload; always look up `sender.GetPlainId()` in the server-side permission store |
| Missing default deny | A missing permission check grants access to everyone; accidental privilege escalation | Every RPC handler for a privileged action must check `HasPermission()` and return early on failure |
| Typo in permission string fails silently | `"MyMod.Amin.Kick"` (typo) never matches --- admin cannot kick, no error is logged | Define permission strings as `static const` variables; reference the constant, never a raw string literal |
| Sending the full permissions file to the client | Exposes all admin Steam64 IDs and their permission sets to any connected client | Send only the requesting player's own permission list, never the full server file |
| No wildcard support in HasPermission | Server owners must list every single permission per admin; tedious and error-prone | Implement prefix wildcards (`"MyMod.Admin.*"`) and full wildcard (`"*"`) from day one |

---

## Theory vs Practice

| Textbook Says | DayZ Reality |
|---------------|-------------|
| Use RBAC (role-based access control) with group inheritance | Only CF/COT supports three-state permissions; most mods use flat per-player grants for simplicity |
| Permissions should be stored in a database | No database access; JSON files in `$profile:` are the only option |
| Use cryptographic tokens for authorization | No crypto libraries in Enforce Script; trust is based on `PlayerIdentity.GetPlainId()` (Steam64 ID) verified by the engine |

---

[<< Previous: Config Persistence](04-config-persistence.md) | [Home](../../README.md) | [Next: Event-Driven Architecture >>](06-events.md)
