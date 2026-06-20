/**
 * ═══════════════════════════════════════════════════════════════════
 *  DISCORD LIMITES & CONTRAINTES API - RÉFÉRENTIEL
 *  Source : https://docs.discord.com/developers
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Toutes les limites de l'API Discord que le bot doit respecter
 *  lors de la création de serveurs.
 */


// ─────────────────────────────────────────────────────────────────
//  LIMITES DU SERVEUR (Guild)
// ─────────────────────────────────────────────────────────────────

const GuildLimits = {
    /** Nom du serveur */
    SERVER_NAME_MIN: 2,
    SERVER_NAME_MAX: 100,

    /** Nombre maximum de salons (catégories incluses) */
    MAX_CHANNELS: 500,

    /** Nombre maximum de catégories */
    MAX_CATEGORIES: 50,

    /** Nombre maximum de rôles */
    MAX_ROLES: 250,

    /** Nombre maximum d'emojis (par palier de boost) */
    MAX_EMOJIS: {
        TIER_0: 50,     // Pas de boost
        TIER_1: 100,    // Boost Niveau 1
        TIER_2: 150,    // Boost Niveau 2
        TIER_3: 250,    // Boost Niveau 3
    },

    /** Nombre maximum de stickers */
    MAX_STICKERS: {
        TIER_0: 5,
        TIER_1: 15,
        TIER_2: 30,
        TIER_3: 60,
    },

    /** Nombre maximum de sons soundboard */
    MAX_SOUNDBOARD_SOUNDS: {
        TIER_0: 8,
        TIER_1: 24,
        TIER_2: 36,
        TIER_3: 48,
    },

    /** Nombre maximum de webhooks par salon */
    MAX_WEBHOOKS_PER_CHANNEL: 15,

    /** Nombre maximum d'overwrites par salon */
    MAX_OVERWRITES_PER_CHANNEL: 100,
};


// ─────────────────────────────────────────────────────────────────
//  LIMITES DES SALONS (Channel)
// ─────────────────────────────────────────────────────────────────

const ChannelLimits = {
    /** Nom du salon */
    NAME_MIN: 1,
    NAME_MAX: 100,

    /** Sujet (topic) du salon */
    TOPIC_MAX: 1024,

    /** Slowmode (rate limit per user) */
    SLOWMODE_MIN: 0,
    SLOWMODE_MAX: 21600,  // 6 heures

    /** Bitrate des salons vocaux */
    BITRATE_MIN: 8000,
    BITRATE_MAX: {
        TIER_0: 96000,
        TIER_1: 128000,
        TIER_2: 256000,
        TIER_3: 384000,
    },
    BITRATE_DEFAULT: 64000,

    /** Limite d'utilisateurs (voice) */
    USER_LIMIT_MIN: 0,
    USER_LIMIT_MAX: 99,
    USER_LIMIT_STAGE_MAX: 10000,

    /** Auto-archive des threads (en minutes) */
    AUTO_ARCHIVE_DURATIONS: [60, 1440, 4320, 10080],

    /** Tags de forum */
    FORUM_TAGS_MAX: 20,
    FORUM_TAG_NAME_MAX: 20,
};


// ─────────────────────────────────────────────────────────────────
//  LIMITES DES RÔLES (Role)
// ─────────────────────────────────────────────────────────────────

const RoleLimits = {
    /** Nom du rôle */
    NAME_MIN: 1,
    NAME_MAX: 100,

    /** Position maximum (théorique = MAX_ROLES) */
    POSITION_MAX: 250,
};


// ─────────────────────────────────────────────────────────────────
//  RATE LIMITS (approximatifs)
//  Important pour séquencer les créations et éviter le 429
// ─────────────────────────────────────────────────────────────────

const RateLimits = {
    /** Délai recommandé entre chaque création de salon (ms) */
    CHANNEL_CREATE_DELAY: 500,

    /** Délai recommandé entre chaque création de rôle (ms) */
    ROLE_CREATE_DELAY: 300,

    /** Délai recommandé entre chaque modification d'overwrite (ms) */
    OVERWRITE_EDIT_DELAY: 250,

    /** Nombre max de requêtes par seconde (global) */
    GLOBAL_RATE_LIMIT: 50,

    /** Fenêtre de rate limit (ms) */
    RATE_LIMIT_WINDOW: 1000,
};


// ─────────────────────────────────────────────────────────────────
//  INTENTS DISCORD REQUIS PAR LE BOT
// ─────────────────────────────────────────────────────────────────

const RequiredIntents = {
    /** Intents minimaux pour le fonctionnement du bot */
    MINIMUM: [
        'Guilds',           // Informations sur les serveurs, salons, rôles
        'GuildMessages',    // Messages dans les serveurs
    ],

    /** Intents recommandés pour toutes les fonctionnalités */
    RECOMMENDED: [
        'Guilds',
        'GuildMessages',
        'GuildMembers',        // Liste et gestion des membres (Privileged)
        'GuildModeration',     // Événements ban/unban
        'MessageContent',      // Contenu des messages (Privileged)
    ],
};


// ─────────────────────────────────────────────────────────────────
//  PERMISSIONS REQUISES PAR LE BOT
//  Le bot a besoin de ces permissions pour fonctionner
// ─────────────────────────────────────────────────────────────────

const RequiredBotPermissions = [
    'MANAGE_GUILD',         // Modifier les paramètres du serveur
    'MANAGE_ROLES',         // Créer et gérer les rôles
    'MANAGE_CHANNELS',      // Créer et gérer les salons
    'VIEW_CHANNEL',         // Voir les salons
    'SEND_MESSAGES',        // Envoyer des messages
    'EMBED_LINKS',          // Intégrer des liens (pour les réponses enrichies)
    'READ_MESSAGE_HISTORY', // Lire l'historique
];


module.exports = {
    GuildLimits,
    ChannelLimits,
    RoleLimits,
    RateLimits,
    RequiredIntents,
    RequiredBotPermissions,
};
