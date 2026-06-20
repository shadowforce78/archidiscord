/**
 * ═══════════════════════════════════════════════════════════════════
 *  RÉFÉRENTIEL DISCORD - INDEX (point d'entrée)
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Ce fichier centralise tous les exports du référentiel Discord.
 *  Le référentiel est un DICTIONNAIRE FACTUEL, pas un livre de
 *  recettes. L'IA décide librement de la structure à créer.
 *
 *   📦 permissions.js    → Bitflags, métadonnées, catégories
 *   📦 channelTypes.js   → Types de salons, aliases, metadata
 *   📦 roles.js          → Couleurs, flags, structure API, hiérarchie
 *   📦 overwrites.js     → Types, structure API, algorithme de calcul
 *   📦 blueprintSchema.js → Schéma JSON du format pivot, validateur
 *   📦 limits.js         → Limites API, rate limits, intents
 *   📦 helpers.js        → Fonctions utilitaires de conversion
 *
 *  Usage :
 *    const ref = require('./referentiel');
 *    // ou destructuré :
 *    const { PermissionFlagsBits, ChannelTypes } = require('./referentiel');
 */

// ─── Permissions ─────────────────────────────────────────────────
const {
    PermissionFlagsBits,
    PermissionMetadata,
    PermissionCategories,
    PermissionPresets,
} = require('./permissions');

// ─── Types de Salons ─────────────────────────────────────────────
const {
    ChannelTypes,
    ChannelTypeMetadata,
    CreatableChannelTypes,
    ChannelTypeAliases,
    VideoQualityModes,
    SortOrderTypes,
    ForumLayoutTypes,
    ChannelFlags,
} = require('./channelTypes');

// ─── Rôles ───────────────────────────────────────────────────────
const {
    RoleColors,
    RoleFlags,
    RoleObjectSchema,
    HierarchyRules,
} = require('./roles');

// ─── Overwrites ──────────────────────────────────────────────────
const {
    OverwriteTypes,
    OverwriteObjectSchema,
    computeChannelPermissions,
} = require('./overwrites');

// ─── Schéma Blueprint ────────────────────────────────────────────
const {
    validateBlueprint,
} = require('./blueprintSchema');

// ─── Limites API ─────────────────────────────────────────────────
const {
    GuildLimits,
    ChannelLimits,
    RoleLimits,
    RateLimits,
    RequiredIntents,
    RequiredBotPermissions,
} = require('./limits');

// ─── Helpers ─────────────────────────────────────────────────────
const {
    permissionNamesToBigInt,
    permissionBigIntToString,
    permissionStringToBigInt,
    bigIntToPermissionNames,
    hasPermission,
    resolveChannelType,
    resolveColor,
    buildOverwrite,
} = require('./helpers');


// ─── Export centralisé ───────────────────────────────────────────
module.exports = {
    // Permissions
    PermissionFlagsBits,
    PermissionMetadata,
    PermissionCategories,
    PermissionPresets,

    // Channel Types
    ChannelTypes,
    ChannelTypeMetadata,
    CreatableChannelTypes,
    ChannelTypeAliases,
    VideoQualityModes,
    SortOrderTypes,
    ForumLayoutTypes,
    ChannelFlags,

    // Roles
    RoleColors,
    RoleFlags,
    RoleObjectSchema,
    HierarchyRules,

    // Overwrites
    OverwriteTypes,
    OverwriteObjectSchema,
    computeChannelPermissions,

    // Blueprint Schema
    validateBlueprint,

    // API Limits
    GuildLimits,
    ChannelLimits,
    RoleLimits,
    RateLimits,
    RequiredIntents,
    RequiredBotPermissions,

    // Helpers
    permissionNamesToBigInt,
    permissionBigIntToString,
    permissionStringToBigInt,
    bigIntToPermissionNames,
    hasPermission,
    resolveChannelType,
    resolveColor,
    buildOverwrite,
};
