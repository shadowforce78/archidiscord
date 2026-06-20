/**
 * ═══════════════════════════════════════════════════════════════════
 *  DISCORD CHANNEL TYPES - RÉFÉRENTIEL
 *  Source : https://docs.discord.com/developers/resources/channel
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Définit tous les types de salons Discord disponibles,
 *  leurs propriétés, et les valeurs numériques de l'API.
 */

// ─────────────────────────────────────────────────────────────────
//  TYPES DE SALONS (Channel Types)
// ─────────────────────────────────────────────────────────────────

const ChannelTypes = {
    /** Salon textuel dans un serveur */
    GUILD_TEXT: 0,

    /** Message direct entre utilisateurs */
    DM: 1,

    /** Salon vocal dans un serveur */
    GUILD_VOICE: 2,

    /** Message direct de groupe */
    GROUP_DM: 3,

    /** Catégorie organisationnelle (parent de salons) */
    GUILD_CATEGORY: 4,

    /** Salon d'annonces (ancien "News Channel") */
    GUILD_ANNOUNCEMENT: 5,

    /** Thread temporaire dans un salon d'annonces */
    ANNOUNCEMENT_THREAD: 10,

    /** Thread public */
    PUBLIC_THREAD: 11,

    /** Thread privé */
    PRIVATE_THREAD: 12,

    /** Salon de conférence (Stage Channel) */
    GUILD_STAGE_VOICE: 13,

    /** Salon d'un hub d'annuaire (Directory) */
    GUILD_DIRECTORY: 14,

    /** Salon Forum (les messages créent des threads) */
    GUILD_FORUM: 15,

    /** Salon Média (similaire au forum, optimisé pour le contenu média) */
    GUILD_MEDIA: 16,
};


// ─────────────────────────────────────────────────────────────────
//  MÉTADONNÉES DES TYPES DE SALONS
// ─────────────────────────────────────────────────────────────────

const ChannelTypeMetadata = {
    [ChannelTypes.GUILD_TEXT]: {
        name: 'GUILD_TEXT',
        label: '💬 Salon Textuel',
        description: 'Salon textuel classique pour les messages',
        canBeInCategory: true,
        supportsThreads: true,
        supportsSlowmode: true,
        supportsTopic: true,
        supportsNSFW: true,
        supportsPermissionOverwrites: true,
        abbreviation: 'T',
    },
    [ChannelTypes.GUILD_VOICE]: {
        name: 'GUILD_VOICE',
        label: '🔊 Salon Vocal',
        description: 'Salon pour la communication vocale',
        canBeInCategory: true,
        supportsThreads: false,
        supportsSlowmode: false,
        supportsTopic: false,
        supportsNSFW: false,
        supportsPermissionOverwrites: true,
        abbreviation: 'V',
        extraProperties: {
            bitrate: { min: 8000, max: 384000, default: 64000, unit: 'bps' },
            userLimit: { min: 0, max: 99, default: 0, description: '0 = illimité' },
            rtcRegion: { description: 'Région de l\'API RTC (null = auto)' },
        },
    },
    [ChannelTypes.GUILD_CATEGORY]: {
        name: 'GUILD_CATEGORY',
        label: '📁 Catégorie',
        description: 'Conteneur organisationnel pour regrouper des salons',
        canBeInCategory: false,
        supportsThreads: false,
        supportsSlowmode: false,
        supportsTopic: false,
        supportsNSFW: false,
        supportsPermissionOverwrites: true,
        abbreviation: 'C',
    },
    [ChannelTypes.GUILD_ANNOUNCEMENT]: {
        name: 'GUILD_ANNOUNCEMENT',
        label: '📢 Salon d\'Annonces',
        description: 'Salon d\'annonces avec option de suivi cross-serveur',
        canBeInCategory: true,
        supportsThreads: true,
        supportsSlowmode: false,
        supportsTopic: true,
        supportsNSFW: true,
        supportsPermissionOverwrites: true,
        abbreviation: 'T',
    },
    [ChannelTypes.GUILD_STAGE_VOICE]: {
        name: 'GUILD_STAGE_VOICE',
        label: '🎙️ Salon de Conférence',
        description: 'Salon vocal de type conférence avec orateurs et audience',
        canBeInCategory: true,
        supportsThreads: false,
        supportsSlowmode: false,
        supportsTopic: true,
        supportsNSFW: false,
        supportsPermissionOverwrites: true,
        abbreviation: 'S',
        extraProperties: {
            bitrate: { min: 8000, max: 384000, default: 64000, unit: 'bps' },
            userLimit: { min: 0, max: 10000, default: 0, description: '0 = illimité' },
        },
    },
    [ChannelTypes.GUILD_FORUM]: {
        name: 'GUILD_FORUM',
        label: '📋 Forum',
        description: 'Salon de type forum (chaque "message" crée un thread)',
        canBeInCategory: true,
        supportsThreads: true,
        supportsSlowmode: true,
        supportsTopic: true,
        supportsNSFW: true,
        supportsPermissionOverwrites: true,
        abbreviation: 'T',
        extraProperties: {
            availableTags: { description: 'Tags disponibles pour organiser les posts (max 20)' },
            defaultReactionEmoji: { description: 'Emoji par défaut pour les réactions' },
            defaultSortOrder: { values: ['LATEST_ACTIVITY', 'CREATION_DATE'] },
            defaultForumLayout: { values: ['NOT_SET', 'LIST_VIEW', 'GALLERY_VIEW'] },
            defaultThreadRateLimitPerUser: { min: 0, max: 21600, unit: 'seconds' },
        },
    },
    [ChannelTypes.GUILD_MEDIA]: {
        name: 'GUILD_MEDIA',
        label: '🖼️ Salon Média',
        description: 'Salon de type média (similaire au forum, optimisé pour le contenu visuel)',
        canBeInCategory: true,
        supportsThreads: true,
        supportsSlowmode: true,
        supportsTopic: true,
        supportsNSFW: true,
        supportsPermissionOverwrites: true,
        abbreviation: 'T',
    },
};


// ─────────────────────────────────────────────────────────────────
//  TYPES UTILISABLES POUR LA CRÉATION DE SERVEURS
//  (sous-ensemble pertinent pour le bot)
// ─────────────────────────────────────────────────────────────────

const CreatableChannelTypes = [
    ChannelTypes.GUILD_TEXT,
    ChannelTypes.GUILD_VOICE,
    ChannelTypes.GUILD_CATEGORY,
    ChannelTypes.GUILD_ANNOUNCEMENT,
    ChannelTypes.GUILD_STAGE_VOICE,
    ChannelTypes.GUILD_FORUM,
    ChannelTypes.GUILD_MEDIA,
];

// ─────────────────────────────────────────────────────────────────
//  MAPPING NOM LISIBLE → TYPE NUMÉRIQUE
//  (pour le LLM qui peut écrire "text", "voice", etc.)
// ─────────────────────────────────────────────────────────────────

const ChannelTypeAliases = {
    'text':          ChannelTypes.GUILD_TEXT,
    'texte':         ChannelTypes.GUILD_TEXT,
    'textuel':       ChannelTypes.GUILD_TEXT,
    'voice':         ChannelTypes.GUILD_VOICE,
    'vocal':         ChannelTypes.GUILD_VOICE,
    'voix':          ChannelTypes.GUILD_VOICE,
    'category':      ChannelTypes.GUILD_CATEGORY,
    'catégorie':     ChannelTypes.GUILD_CATEGORY,
    'categorie':     ChannelTypes.GUILD_CATEGORY,
    'announcement':  ChannelTypes.GUILD_ANNOUNCEMENT,
    'annonce':       ChannelTypes.GUILD_ANNOUNCEMENT,
    'annonces':      ChannelTypes.GUILD_ANNOUNCEMENT,
    'news':          ChannelTypes.GUILD_ANNOUNCEMENT,
    'stage':         ChannelTypes.GUILD_STAGE_VOICE,
    'conférence':    ChannelTypes.GUILD_STAGE_VOICE,
    'conference':    ChannelTypes.GUILD_STAGE_VOICE,
    'forum':         ChannelTypes.GUILD_FORUM,
    'media':         ChannelTypes.GUILD_MEDIA,
    'média':         ChannelTypes.GUILD_MEDIA,
};


// ─────────────────────────────────────────────────────────────────
//  VIDEO QUALITY MODES
// ─────────────────────────────────────────────────────────────────

const VideoQualityModes = {
    AUTO: 1,
    FULL: 2,
};


// ─────────────────────────────────────────────────────────────────
//  SORT ORDER TYPES (pour les forums)
// ─────────────────────────────────────────────────────────────────

const SortOrderTypes = {
    LATEST_ACTIVITY: 0,
    CREATION_DATE: 1,
};


// ─────────────────────────────────────────────────────────────────
//  FORUM LAYOUT TYPES
// ─────────────────────────────────────────────────────────────────

const ForumLayoutTypes = {
    NOT_SET: 0,
    LIST_VIEW: 1,
    GALLERY_VIEW: 2,
};


// ─────────────────────────────────────────────────────────────────
//  CHANNEL FLAGS
// ─────────────────────────────────────────────────────────────────

const ChannelFlags = {
    PINNED:                         1 << 1,
    REQUIRE_TAG:                    1 << 4,
    HIDE_MEDIA_DOWNLOAD_OPTIONS:    1 << 15,
};


module.exports = {
    ChannelTypes,
    ChannelTypeMetadata,
    CreatableChannelTypes,
    ChannelTypeAliases,
    VideoQualityModes,
    SortOrderTypes,
    ForumLayoutTypes,
    ChannelFlags,
};
