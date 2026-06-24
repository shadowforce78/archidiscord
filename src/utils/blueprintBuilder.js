const { ChannelType } = require("discord.js");
const { bigIntToPermissionNames } = require("../referentiel/helpers");

// ─────────────────────────────────────────────────────────────────
//  Mapping inverse : type numérique Discord → alias lisible blueprint
// ─────────────────────────────────────────────────────────────────
const CHANNEL_TYPE_TO_ALIAS = {
    [ChannelType.GuildText]:          'text',
    [ChannelType.GuildVoice]:         'voice',
    [ChannelType.GuildCategory]:      'category',
    [ChannelType.GuildAnnouncement]:  'announcement',
    [ChannelType.GuildStageVoice]:    'stage',
    [ChannelType.GuildForum]:         'forum',
    [ChannelType.GuildMedia]:         'media',
};

// Types de salons qu'on exporte (pas les threads, DM, etc.)
const EXPORTABLE_CHANNEL_TYPES = new Set(Object.keys(CHANNEL_TYPE_TO_ALIAS).map(Number));

/**
 * Construit un objet Blueprint JSON à partir d'un guild Discord.
 * Le format produit est identique à celui que le LLM doit générer.
 *
 * @param {import("discord.js").Guild} guild
 * @returns {Object} Blueprint JSON
 */
function buildBlueprint(guild) {
    const roles = guild.roles.cache;
    const channels = guild.channels.cache;

    // ── Map ID→Nom pour résoudre les overwrites ──────────────
    const roleIdToName = new Map();
    roles.forEach(role => {
        roleIdToName.set(role.id, role.id === guild.id ? '@everyone' : role.name);
    });

    // ── Rôles ────────────────────────────────────────────────
    const blueprintRoles = [];
    const everyonePerms = [];

    // Trier par position décroissante (plus haut en premier)
    const sortedRoles = [...roles.values()].sort((a, b) => b.position - a.position);

    for (const role of sortedRoles) {
        if (role.id === guild.id) {
            // @everyone → everyoneConfig séparé
            everyonePerms.push(...bigIntToPermissionNames(role.permissions.bitfield));
            continue;
        }

        // Ignorer les rôles gérés par des intégrations (bots, boosts, etc.)
        if (role.managed) continue;

        const roleData = {
            id: role.id,
            name: role.name,
            color: role.color !== 0 ? `#${role.color.toString(16).padStart(6, '0').toUpperCase()}` : undefined,
            hoist: role.hoist || undefined,
            mentionable: role.mentionable || undefined,
            permissions: bigIntToPermissionNames(role.permissions.bitfield),
            position: role.position,
        };

        // Nettoyer les undefined
        Object.keys(roleData).forEach(key => roleData[key] === undefined && delete roleData[key]);

        blueprintRoles.push(roleData);
    }

    // ── Catégories et Salons ─────────────────────────────────
    const categories = [];
    const standaloneChannels = [];

    // Récupérer les catégories triées par position
    const categoryChannels = [...channels.values()]
        .filter(ch => ch.type === ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);

    // Salons sans catégorie
    const orphanChannels = [...channels.values()]
        .filter(ch => !ch.parentId && ch.type !== ChannelType.GuildCategory && EXPORTABLE_CHANNEL_TYPES.has(ch.type))
        .sort((a, b) => a.position - b.position);

    for (const category of categoryChannels) {
        const catData = {
            id: category.id,
            name: category.name,
        };

        // Overwrites de la catégorie
        const catOverwrites = serializeOverwrites(category.permissionOverwrites, roleIdToName);
        if (catOverwrites.length > 0) {
            catData.permissionOverwrites = catOverwrites;
        }

        // Salons enfants triés par position
        const children = [...channels.values()]
            .filter(ch => ch.parentId === category.id && EXPORTABLE_CHANNEL_TYPES.has(ch.type))
            .sort((a, b) => a.position - b.position);

        catData.channels = children.map(ch => serializeChannel(ch, roleIdToName, category));

        categories.push(catData);
    }

    // Salons orphelins
    for (const ch of orphanChannels) {
        standaloneChannels.push(serializeChannel(ch, roleIdToName, null));
    }

    // ── Assemblage ───────────────────────────────────────────
    const blueprint = {
        serverName: guild.name,
    };

    if (guild.description) {
        blueprint.description = guild.description;
    }

    blueprint.roles = blueprintRoles;

    if (everyonePerms.length > 0) {
        blueprint.everyoneConfig = { permissions: everyonePerms };
    }

    blueprint.categories = categories;

    if (standaloneChannels.length > 0) {
        blueprint.standaloneChannels = standaloneChannels;
    }

    return blueprint;
}

/**
 * Sérialise un salon Discord en format ChannelSchema du blueprint.
 *
 * @param {import("discord.js").GuildChannel} channel
 * @param {Map<string, string>} roleIdToName
 * @param {import("discord.js").CategoryChannel|null} parentCategory
 * @returns {Object} ChannelSchema
 */
function serializeChannel(channel, roleIdToName, parentCategory) {
    const data = {
        id: channel.id,
        name: channel.name,
        type: CHANNEL_TYPE_TO_ALIAS[channel.type] || 'text',
    };

    // Omettre le type par défaut pour garder le JSON concis
    if (data.type === 'text') delete data.type;

    // Topic
    if (channel.topic) {
        data.topic = channel.topic;
    }

    // NSFW
    if (channel.nsfw) {
        data.nsfw = true;
    }

    // Slowmode
    if (channel.rateLimitPerUser > 0) {
        data.rateLimitPerUser = channel.rateLimitPerUser;
    }

    // Propriétés vocales
    if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
        if (channel.bitrate && channel.bitrate !== 64000) {
            data.bitrate = channel.bitrate;
        }
        if (channel.userLimit > 0) {
            data.userLimit = channel.userLimit;
        }
    }

    // Config Forum
    if (channel.type === ChannelType.GuildForum || channel.type === ChannelType.GuildMedia) {
        const forumConfig = {};

        if (channel.availableTags && channel.availableTags.length > 0) {
            forumConfig.tags = channel.availableTags.map(tag => {
                const tagData = { name: tag.name };
                if (tag.emoji) {
                    tagData.emoji = tag.emoji.name || tag.emoji.id;
                }
                if (tag.moderated) {
                    tagData.moderated = true;
                }
                return tagData;
            });
        }

        if (channel.defaultSortOrder !== null && channel.defaultSortOrder !== undefined) {
            forumConfig.defaultSortOrder = channel.defaultSortOrder === 0 ? 'LATEST_ACTIVITY' : 'CREATION_DATE';
        }

        if (channel.defaultForumLayout !== null && channel.defaultForumLayout !== undefined && channel.defaultForumLayout !== 0) {
            forumConfig.defaultLayout = channel.defaultForumLayout === 1 ? 'LIST_VIEW' : 'GALLERY_VIEW';
        }

        // requireTag (vérifié via les flags du channel)
        if (channel.flags && channel.flags.has(1 << 4)) {
            forumConfig.requireTag = true;
        }

        if (Object.keys(forumConfig).length > 0) {
            data.forumConfig = forumConfig;
        }
    }

    // Permission Overwrites (uniquement ceux qui diffèrent de la catégorie parente)
    const overwrites = serializeOverwrites(channel.permissionOverwrites, roleIdToName, parentCategory);
    if (overwrites.length > 0) {
        data.permissionOverwrites = overwrites;
    }

    return data;
}

/**
 * Sérialise les permission overwrites d'un salon/catégorie
 * en format OverwriteSchema du blueprint.
 *
 * @param {import("discord.js").PermissionOverwriteManager} overwriteManager
 * @param {Map<string, string>} roleIdToName
 * @param {import("discord.js").CategoryChannel|null} [parentCategory]
 * @returns {Object[]} Liste d'OverwriteSchema
 */
function serializeOverwrites(overwriteManager, roleIdToName, parentCategory = null) {
    if (!overwriteManager || !overwriteManager.cache) return [];

    const result = [];

    // Si on a une catégorie parente, on récupère ses overwrites pour comparer
    const parentOverwrites = parentCategory?.permissionOverwrites?.cache;

    overwriteManager.cache.forEach((overwrite) => {
        // On ignore les overwrites de type "member" (type 1) car le blueprint
        // ne gère que les rôles
        if (overwrite.type !== 0) return;

        const allowBits = overwrite.allow.bitfield;
        const denyBits = overwrite.deny.bitfield;

        // Ignorer les overwrites neutres (rien d'autorisé ni de refusé)
        if (allowBits === 0n && denyBits === 0n) return;

        // Si l'overwrite est identique au parent, on le skip (hérité)
        if (parentOverwrites) {
            const parentOw = parentOverwrites.get(overwrite.id);
            if (parentOw && parentOw.allow.bitfield === allowBits && parentOw.deny.bitfield === denyBits) {
                return; // Identique au parent, pas besoin de le redéfinir
            }
        }

        const targetName = roleIdToName.get(overwrite.id);
        if (!targetName) return; // Rôle supprimé ou inconnu

        const owData = {
            target: targetName,
        };

        const allowPerms = bigIntToPermissionNames(allowBits);
        const denyPerms = bigIntToPermissionNames(denyBits);

        if (allowPerms.length > 0) owData.allow = allowPerms;
        if (denyPerms.length > 0) owData.deny = denyPerms;

        result.push(owData);
    });

    return result;
}

/**
 * Compte le nombre total de salons dans un blueprint.
 * @param {Object} blueprint
 * @returns {number}
 */
function countChannels(blueprint) {
    let count = 0;
    for (const cat of blueprint.categories) {
        count += cat.channels.length;
    }
    if (blueprint.standaloneChannels) {
        count += blueprint.standaloneChannels.length;
    }
    return count;
}

module.exports = {
    buildBlueprint,
    countChannels,
    CHANNEL_TYPE_TO_ALIAS,
    EXPORTABLE_CHANNEL_TYPES,
};
