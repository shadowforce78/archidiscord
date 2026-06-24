/**
 * ═══════════════════════════════════════════════════════════════════
 *  BLUEPRINT JSON SCHEMA - RÉFÉRENTIEL
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Définit le contrat de données strict (le schéma) que le LLM
 *  doit générer et que le Core Engine (interpreter.js) va consumer.
 *
 *  Ce fichier sert à :
 *   - Documenter la structure JSON attendue
 *   - Valider la conformité des blueprints générés par le LLM
 *   - Servir de référence dans le system prompt
 *
 *  L'IA est LIBRE de décider du contenu (quels rôles, quels salons,
 *  quelle structure). Ce schéma ne dicte que le FORMAT, pas le fond.
 */

const { ChannelTypeAliases } = require('./channelTypes');
const { PermissionFlagsBits } = require('./permissions');


// ─────────────────────────────────────────────────────────────────
//  SCHÉMA JSON DU BLUEPRINT (documentation JSDoc)
//  C'est ce format que le LLM doit générer.
//  Seul le FORMAT est imposé, le CONTENU est libre.
// ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} BlueprintSchema
 * @property {string} serverName - Nom du serveur Discord (2-100 chars)
 * @property {string} [serverIcon] - URL de l'icône du serveur (optionnel)
 * @property {string} [description] - Description du serveur (optionnel)
 * @property {RoleSchema[]} roles - Liste des rôles à créer
 * @property {CategorySchema[]} categories - Liste des catégories et leurs salons
 * @property {ChannelSchema[]} [standaloneChannels] - Salons sans catégorie (optionnel)
 * @property {EveryoneConfig} [everyoneConfig] - Config du rôle @everyone (optionnel)
 */

/**
 * @typedef {Object} RoleSchema
 * @property {string} [id] - ID unique Discord du rôle (optionnel)
 * @property {string} name - Nom du rôle
 * @property {string} [color] - Couleur en hex (ex: "#FF5733") ou nom (ex: "RED")
 * @property {boolean} [hoist=false] - Affiché séparément dans la sidebar
 * @property {boolean} [mentionable=false] - Mentionnable par tous
 * @property {string[]} permissions - Liste des noms de permissions (ex: ["VIEW_CHANNEL", "SEND_MESSAGES"])
 * @property {number} [position] - Position dans la hiérarchie (auto-calculé si absent)
 */

/**
 * @typedef {Object} CategorySchema
 * @property {string} [id] - ID unique Discord de la catégorie (optionnel)
 * @property {string} name - Nom de la catégorie (ex: "📢 INFOS")
 * @property {OverwriteSchema[]} [permissionOverwrites] - Overwrites au niveau catégorie
 * @property {ChannelSchema[]} channels - Salons dans cette catégorie
 */

/**
 * @typedef {Object} ChannelSchema
 * @property {string} [id] - ID unique Discord du salon (optionnel)
 * @property {string} name - Nom du salon (ex: "💬-général")
 * @property {string} [type="text"] - Type : text, voice, announcement, stage, forum, media
 * @property {string} [topic] - Sujet du salon (max 1024 chars)
 * @property {boolean} [nsfw=false] - Contenu NSFW
 * @property {number} [rateLimitPerUser=0] - Slowmode en secondes (0-21600)
 * @property {number} [bitrate] - Bitrate pour les vocaux (8000-384000)
 * @property {number} [userLimit] - Limite d'utilisateurs pour les vocaux (0=illimité, max 99)
 * @property {OverwriteSchema[]} [permissionOverwrites] - Overwrites du salon
 * @property {ForumConfig} [forumConfig] - Config spécifique aux forums
 */

/**
 * @typedef {Object} OverwriteSchema
 * @property {string} target - Nom du rôle cible ou "@everyone"
 * @property {string[]} [allow] - Permissions à explicitement autoriser
 * @property {string[]} [deny] - Permissions à explicitement refuser
 */

/**
 * @typedef {Object} ForumConfig
 * @property {ForumTag[]} [tags] - Tags du forum (max 20)
 * @property {string} [defaultSortOrder] - "LATEST_ACTIVITY" ou "CREATION_DATE"
 * @property {string} [defaultLayout] - "NOT_SET", "LIST_VIEW" ou "GALLERY_VIEW"
 * @property {boolean} [requireTag=false] - Post obligatoire avec tag
 */

/**
 * @typedef {Object} ForumTag
 * @property {string} name - Nom du tag (max 20 chars)
 * @property {string} [emoji] - Emoji du tag (unicode ou custom)
 * @property {boolean} [moderated=false] - Seuls les mods peuvent appliquer ce tag
 */

/**
 * @typedef {Object} EveryoneConfig
 * @property {string[]} permissions - Permissions du rôle @everyone
 */


// ─────────────────────────────────────────────────────────────────
//  VALIDATION DU BLUEPRINT
//  Vérifie que le JSON généré par le LLM respecte les contraintes
//  techniques de l'API Discord (limites, noms de permissions, etc.)
// ─────────────────────────────────────────────────────────────────

/**
 * Valide un objet Blueprint JSON et retourne les erreurs.
 * Ne juge pas le CONTENU (choix de rôles, structure), seulement
 * la conformité technique.
 *
 * @param {Object} blueprint - L'objet JSON à valider
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateBlueprint(blueprint) {
    const errors = [];

    // ── serverName ──────────────────────────────────────────────
    if (!blueprint.serverName || typeof blueprint.serverName !== 'string') {
        errors.push('serverName est requis et doit être une string');
    } else if (blueprint.serverName.length < 2 || blueprint.serverName.length > 100) {
        errors.push('serverName doit faire entre 2 et 100 caractères');
    }

    // ── roles ───────────────────────────────────────────────────
    if (!Array.isArray(blueprint.roles)) {
        errors.push('roles doit être un tableau');
    } else {
        if (blueprint.roles.length > 250) {
            errors.push('Discord limite à 250 rôles maximum par serveur');
        }

        for (const [i, role] of blueprint.roles.entries()) {
            if (role.id !== undefined && typeof role.id !== 'string') {
                errors.push(`roles[${i}].id doit être une string`);
            }
            if (!role.name || typeof role.name !== 'string') {
                errors.push(`roles[${i}].name est requis`);
            } else {
                if (role.name.length > 100) {
                    errors.push(`roles[${i}].name : max 100 caractères`);
                }
            }

            if (role.permissions && Array.isArray(role.permissions)) {
                for (const perm of role.permissions) {
                    if (!PermissionFlagsBits.hasOwnProperty(perm)) {
                        errors.push(`roles[${i}] : permission inconnue "${perm}"`);
                    }
                }
            }

            if (role.color && typeof role.color === 'string') {
                if (!role.color.match(/^#[0-9A-Fa-f]{6}$/)) {
                    errors.push(`roles[${i}].color : format invalide "${role.color}" (attendu: #RRGGBB)`);
                }
            }
        }
    }

    // ── categories ──────────────────────────────────────────────
    if (!Array.isArray(blueprint.categories)) {
        errors.push('categories doit être un tableau');
    } else {
        // Compter le total de salons (catégories incluses)
        let totalChannels = blueprint.categories.length;
        for (const cat of blueprint.categories) {
            if (cat.channels) totalChannels += cat.channels.length;
        }
        if (blueprint.standaloneChannels) totalChannels += blueprint.standaloneChannels.length;

        if (totalChannels > 500) {
            errors.push(`Discord limite à 500 salons maximum (actuellement: ${totalChannels})`);
        }

        for (const [i, cat] of blueprint.categories.entries()) {
            if (cat.id !== undefined && typeof cat.id !== 'string') {
                errors.push(`categories[${i}].id doit être une string`);
            }
            if (!cat.name || typeof cat.name !== 'string') {
                errors.push(`categories[${i}].name est requis`);
            }

            if (!Array.isArray(cat.channels)) {
                errors.push(`categories[${i}].channels doit être un tableau`);
            } else {
                for (const [j, channel] of cat.channels.entries()) {
                    _validateChannel(channel, `categories[${i}].channels[${j}]`, errors);
                }
            }

            if (cat.permissionOverwrites) {
                _validateOverwrites(cat.permissionOverwrites, `categories[${i}]`, errors);
            }
        }
    }

    // ── standaloneChannels ──────────────────────────────────────
    if (blueprint.standaloneChannels && Array.isArray(blueprint.standaloneChannels)) {
        for (const [i, channel] of blueprint.standaloneChannels.entries()) {
            _validateChannel(channel, `standaloneChannels[${i}]`, errors);
        }
    }

    return { valid: errors.length === 0, errors };
}


/**
 * Valide un salon individuel.
 * @private
 */
function _validateChannel(channel, path, errors) {
    if (channel.id !== undefined && typeof channel.id !== 'string') {
        errors.push(`${path}.id doit être une string`);
    }
    if (!channel.name || typeof channel.name !== 'string') {
        errors.push(`${path}.name est requis`);
    } else if (channel.name.length > 100) {
        errors.push(`${path}.name : max 100 caractères`);
    }

    if (channel.type) {
        const validTypes = Object.keys(ChannelTypeAliases);
        if (!validTypes.includes(channel.type.toLowerCase())) {
            errors.push(`${path}.type : type inconnu "${channel.type}"`);
        }
    }

    if (channel.topic && channel.topic.length > 1024) {
        errors.push(`${path}.topic : max 1024 caractères`);
    }

    if (channel.rateLimitPerUser !== undefined) {
        if (channel.rateLimitPerUser < 0 || channel.rateLimitPerUser > 21600) {
            errors.push(`${path}.rateLimitPerUser : doit être entre 0 et 21600`);
        }
    }

    if (channel.bitrate !== undefined) {
        if (channel.bitrate < 8000 || channel.bitrate > 384000) {
            errors.push(`${path}.bitrate : doit être entre 8000 et 384000`);
        }
    }

    if (channel.userLimit !== undefined) {
        if (channel.userLimit < 0 || channel.userLimit > 99) {
            errors.push(`${path}.userLimit : doit être entre 0 et 99`);
        }
    }

    if (channel.forumConfig && channel.forumConfig.tags) {
        if (channel.forumConfig.tags.length > 20) {
            errors.push(`${path}.forumConfig.tags : max 20 tags`);
        }
        for (const [k, tag] of channel.forumConfig.tags.entries()) {
            if (!tag.name) {
                errors.push(`${path}.forumConfig.tags[${k}].name est requis`);
            } else if (tag.name.length > 20) {
                errors.push(`${path}.forumConfig.tags[${k}].name : max 20 caractères`);
            }
        }
    }

    if (channel.permissionOverwrites) {
        _validateOverwrites(channel.permissionOverwrites, path, errors);
    }
}


/**
 * Valide un tableau d'overwrites.
 * @private
 */
function _validateOverwrites(overwrites, path, errors) {
    if (!Array.isArray(overwrites)) {
        errors.push(`${path}.permissionOverwrites doit être un tableau`);
        return;
    }

    if (overwrites.length > 100) {
        errors.push(`${path}.permissionOverwrites : max 100 overwrites par salon`);
    }

    for (const [k, ow] of overwrites.entries()) {
        if (!ow.target || typeof ow.target !== 'string') {
            errors.push(`${path}.permissionOverwrites[${k}].target est requis`);
        }

        if (ow.allow && Array.isArray(ow.allow)) {
            for (const perm of ow.allow) {
                if (!PermissionFlagsBits.hasOwnProperty(perm)) {
                    errors.push(`${path}.permissionOverwrites[${k}].allow : permission inconnue "${perm}"`);
                }
            }
        }

        if (ow.deny && Array.isArray(ow.deny)) {
            for (const perm of ow.deny) {
                if (!PermissionFlagsBits.hasOwnProperty(perm)) {
                    errors.push(`${path}.permissionOverwrites[${k}].deny : permission inconnue "${perm}"`);
                }
            }
        }
    }
}


module.exports = {
    validateBlueprint,
};
