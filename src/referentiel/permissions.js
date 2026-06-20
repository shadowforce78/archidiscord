/**
 * ═══════════════════════════════════════════════════════════════════
 *  DISCORD PERMISSION BITFLAGS - RÉFÉRENTIEL COMPLET
 *  Source : https://docs.discord.com/developers/topics/permissions
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Les permissions Discord sont stockées sous forme de BigInt (entier
 *  de longueur variable) sérialisé en string. On utilise des opérations
 *  bitwise pour les combiner (OR |) et les vérifier (AND &).
 *
 *  Notes :
 *   - Les flags marqués [*] nécessitent le 2FA du propriétaire du
 *     serveur si l'option "Require 2FA for moderation" est activée.
 *   - Les channel types sont abrégés : T=Text, V=Voice, S=Stage
 *   - En API v8+, toutes les permissions sont sérialisées en strings.
 */

// ─────────────────────────────────────────────────────────────────
//  TABLE DES PERMISSIONS (BigInt)
// ─────────────────────────────────────────────────────────────────

const PermissionFlagsBits = {
    CREATE_INSTANT_INVITE:      1n << 0n,   // 0x0000000000000001
    KICK_MEMBERS:               1n << 1n,   // 0x0000000000000002  [*]
    BAN_MEMBERS:                1n << 2n,   // 0x0000000000000004  [*]
    ADMINISTRATOR:              1n << 3n,   // 0x0000000000000008  [*]
    MANAGE_CHANNELS:            1n << 4n,   // 0x0000000000000010  [*]
    MANAGE_GUILD:               1n << 5n,   // 0x0000000000000020  [*]
    ADD_REACTIONS:              1n << 6n,   // 0x0000000000000040
    VIEW_AUDIT_LOG:             1n << 7n,   // 0x0000000000000080
    PRIORITY_SPEAKER:           1n << 8n,   // 0x0000000000000100
    STREAM:                     1n << 9n,   // 0x0000000000000200
    VIEW_CHANNEL:               1n << 10n,  // 0x0000000000000400
    SEND_MESSAGES:              1n << 11n,  // 0x0000000000000800
    SEND_TTS_MESSAGES:          1n << 12n,  // 0x0000000000001000
    MANAGE_MESSAGES:            1n << 13n,  // 0x0000000000002000  [*]
    EMBED_LINKS:                1n << 14n,  // 0x0000000000004000
    ATTACH_FILES:               1n << 15n,  // 0x0000000000008000
    READ_MESSAGE_HISTORY:       1n << 16n,  // 0x0000000000010000
    MENTION_EVERYONE:           1n << 17n,  // 0x0000000000020000
    USE_EXTERNAL_EMOJIS:        1n << 18n,  // 0x0000000000040000
    VIEW_GUILD_INSIGHTS:        1n << 19n,  // 0x0000000000080000
    CONNECT:                    1n << 20n,  // 0x0000000000100000
    SPEAK:                      1n << 21n,  // 0x0000000000200000
    MUTE_MEMBERS:               1n << 22n,  // 0x0000000000400000
    DEAFEN_MEMBERS:             1n << 23n,  // 0x0000000000800000
    MOVE_MEMBERS:               1n << 24n,  // 0x0000000001000000
    USE_VAD:                    1n << 25n,  // 0x0000000002000000
    CHANGE_NICKNAME:            1n << 26n,  // 0x0000000004000000
    MANAGE_NICKNAMES:           1n << 27n,  // 0x0000000008000000
    MANAGE_ROLES:               1n << 28n,  // 0x0000000010000000  [*]
    MANAGE_WEBHOOKS:            1n << 29n,  // 0x0000000020000000  [*]
    MANAGE_GUILD_EXPRESSIONS:   1n << 30n,  // 0x0000000040000000  [*]
    USE_APPLICATION_COMMANDS:   1n << 31n,  // 0x0000000080000000
    REQUEST_TO_SPEAK:           1n << 32n,  // 0x0000000100000000
    MANAGE_EVENTS:              1n << 33n,  // 0x0000000200000000
    MANAGE_THREADS:             1n << 34n,  // 0x0000000400000000  [*]
    CREATE_PUBLIC_THREADS:      1n << 35n,  // 0x0000000800000000
    CREATE_PRIVATE_THREADS:     1n << 36n,  // 0x0000001000000000
    USE_EXTERNAL_STICKERS:      1n << 37n,  // 0x0000002000000000
    SEND_MESSAGES_IN_THREADS:   1n << 38n,  // 0x0000004000000000
    USE_EMBEDDED_ACTIVITIES:    1n << 39n,  // 0x0000008000000000
    MODERATE_MEMBERS:           1n << 40n,  // 0x0000010000000000  [*]
    VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n, // 0x0000020000000000
    USE_SOUNDBOARD:             1n << 42n,  // 0x0000040000000000
    CREATE_GUILD_EXPRESSIONS:   1n << 43n,  // 0x0000080000000000
    CREATE_EVENTS:              1n << 44n,  // 0x0000100000000000
    USE_EXTERNAL_SOUNDS:        1n << 45n,  // 0x0000200000000000
    SEND_VOICE_MESSAGES:        1n << 46n,  // 0x0000400000000000
    SET_VOICE_CHANNEL_STATUS:   1n << 48n,  // 0x0001000000000000
    SEND_POLLS:                 1n << 49n,  // 0x0002000000000000
    USE_EXTERNAL_APPS:          1n << 50n,  // 0x0004000000000000
    PIN_MESSAGES:               1n << 51n,  // 0x0008000000000000
    BYPASS_SLOWMODE:            1n << 52n,  // 0x0010000000000000
};


// ─────────────────────────────────────────────────────────────────
//  MÉTADONNÉES DES PERMISSIONS (pour le LLM / system prompt)
// ─────────────────────────────────────────────────────────────────

const PermissionMetadata = {
    CREATE_INSTANT_INVITE: {
        bit: 0,
        hex: '0x0000000000000001',
        description: 'Permet la création de liens d\'invitation instantanés',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'general',
    },
    KICK_MEMBERS: {
        bit: 1,
        hex: '0x0000000000000002',
        description: 'Permet d\'expulser des membres',
        channelTypes: [],
        requires2FA: true,
        category: 'moderation',
    },
    BAN_MEMBERS: {
        bit: 2,
        hex: '0x0000000000000004',
        description: 'Permet de bannir des membres',
        channelTypes: [],
        requires2FA: true,
        category: 'moderation',
    },
    ADMINISTRATOR: {
        bit: 3,
        hex: '0x0000000000000008',
        description: 'Accorde toutes les permissions et contourne les overwrites de channels',
        channelTypes: [],
        requires2FA: true,
        category: 'general',
    },
    MANAGE_CHANNELS: {
        bit: 4,
        hex: '0x0000000000000010',
        description: 'Permet la gestion et l\'édition de salons',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: true,
        category: 'general',
    },
    MANAGE_GUILD: {
        bit: 5,
        hex: '0x0000000000000020',
        description: 'Permet la gestion et l\'édition du serveur',
        channelTypes: [],
        requires2FA: true,
        category: 'general',
    },
    ADD_REACTIONS: {
        bit: 6,
        hex: '0x0000000000000040',
        description: 'Permet d\'ajouter de nouvelles réactions aux messages',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    VIEW_AUDIT_LOG: {
        bit: 7,
        hex: '0x0000000000000080',
        description: 'Permet de consulter le journal d\'audit',
        channelTypes: [],
        requires2FA: false,
        category: 'general',
    },
    PRIORITY_SPEAKER: {
        bit: 8,
        hex: '0x0000000000000100',
        description: 'Permet d\'utiliser le mode prioritaire dans un salon vocal',
        channelTypes: ['V'],
        requires2FA: false,
        category: 'voice',
    },
    STREAM: {
        bit: 9,
        hex: '0x0000000000000200',
        description: 'Permet de lancer un stream/partage d\'écran',
        channelTypes: ['V', 'S'],
        requires2FA: false,
        category: 'voice',
    },
    VIEW_CHANNEL: {
        bit: 10,
        hex: '0x0000000000000400',
        description: 'Permet de voir un salon (lire les messages texte ou rejoindre les salons vocaux)',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'general',
    },
    SEND_MESSAGES: {
        bit: 11,
        hex: '0x0000000000000800',
        description: 'Permet d\'envoyer des messages dans un salon et de créer des threads dans un forum',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    SEND_TTS_MESSAGES: {
        bit: 12,
        hex: '0x0000000000001000',
        description: 'Permet d\'envoyer des messages TTS (text-to-speech)',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    MANAGE_MESSAGES: {
        bit: 13,
        hex: '0x0000000000002000',
        description: 'Permet de supprimer les messages des autres utilisateurs',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: true,
        category: 'moderation',
    },
    EMBED_LINKS: {
        bit: 14,
        hex: '0x0000000000004000',
        description: 'Les liens envoyés par les utilisateurs avec cette permission seront auto-intégrés',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    ATTACH_FILES: {
        bit: 15,
        hex: '0x0000000000008000',
        description: 'Permet de téléverser des images et fichiers',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    READ_MESSAGE_HISTORY: {
        bit: 16,
        hex: '0x0000000000010000',
        description: 'Permet de lire l\'historique des messages',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    MENTION_EVERYONE: {
        bit: 17,
        hex: '0x0000000000020000',
        description: 'Permet d\'utiliser @everyone et @here',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    USE_EXTERNAL_EMOJIS: {
        bit: 18,
        hex: '0x0000000000040000',
        description: 'Permet d\'utiliser des emojis provenant d\'autres serveurs',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    VIEW_GUILD_INSIGHTS: {
        bit: 19,
        hex: '0x0000000000080000',
        description: 'Permet de voir les statistiques du serveur',
        channelTypes: [],
        requires2FA: false,
        category: 'general',
    },
    CONNECT: {
        bit: 20,
        hex: '0x0000000000100000',
        description: 'Permet de se connecter à un salon vocal',
        channelTypes: ['V', 'S'],
        requires2FA: false,
        category: 'voice',
    },
    SPEAK: {
        bit: 21,
        hex: '0x0000000000200000',
        description: 'Permet de parler dans un salon vocal',
        channelTypes: ['V'],
        requires2FA: false,
        category: 'voice',
    },
    MUTE_MEMBERS: {
        bit: 22,
        hex: '0x0000000000400000',
        description: 'Permet de couper le micro d\'autres membres',
        channelTypes: ['V', 'S'],
        requires2FA: false,
        category: 'voice',
    },
    DEAFEN_MEMBERS: {
        bit: 23,
        hex: '0x0000000000800000',
        description: 'Permet de mettre en sourdine d\'autres membres',
        channelTypes: ['V'],
        requires2FA: false,
        category: 'voice',
    },
    MOVE_MEMBERS: {
        bit: 24,
        hex: '0x0000000001000000',
        description: 'Permet de déplacer des membres entre les salons vocaux',
        channelTypes: ['V', 'S'],
        requires2FA: false,
        category: 'voice',
    },
    USE_VAD: {
        bit: 25,
        hex: '0x0000000002000000',
        description: 'Permet d\'utiliser la détection automatique de voix (Voice Activity Detection)',
        channelTypes: ['V'],
        requires2FA: false,
        category: 'voice',
    },
    CHANGE_NICKNAME: {
        bit: 26,
        hex: '0x0000000004000000',
        description: 'Permet de changer son propre pseudo',
        channelTypes: [],
        requires2FA: false,
        category: 'general',
    },
    MANAGE_NICKNAMES: {
        bit: 27,
        hex: '0x0000000008000000',
        description: 'Permet de changer le pseudo des autres membres',
        channelTypes: [],
        requires2FA: false,
        category: 'general',
    },
    MANAGE_ROLES: {
        bit: 28,
        hex: '0x0000000010000000',
        description: 'Permet de gérer les rôles',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: true,
        category: 'general',
    },
    MANAGE_WEBHOOKS: {
        bit: 29,
        hex: '0x0000000020000000',
        description: 'Permet de gérer les webhooks',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: true,
        category: 'general',
    },
    MANAGE_GUILD_EXPRESSIONS: {
        bit: 30,
        hex: '0x0000000040000000',
        description: 'Permet de gérer les emojis, stickers et soundboard du serveur',
        channelTypes: [],
        requires2FA: true,
        category: 'general',
    },
    USE_APPLICATION_COMMANDS: {
        bit: 31,
        hex: '0x0000000080000000',
        description: 'Permet d\'utiliser les commandes d\'applications (slash commands)',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    REQUEST_TO_SPEAK: {
        bit: 32,
        hex: '0x0000000100000000',
        description: 'Permet de demander la parole dans un salon de conférence (stage)',
        channelTypes: ['S'],
        requires2FA: false,
        category: 'voice',
    },
    MANAGE_EVENTS: {
        bit: 33,
        hex: '0x0000000200000000',
        description: 'Permet de gérer les événements du serveur',
        channelTypes: ['V', 'S'],
        requires2FA: false,
        category: 'general',
    },
    MANAGE_THREADS: {
        bit: 34,
        hex: '0x0000000400000000',
        description: 'Permet de supprimer, archiver et gérer les threads',
        channelTypes: ['T'],
        requires2FA: true,
        category: 'text',
    },
    CREATE_PUBLIC_THREADS: {
        bit: 35,
        hex: '0x0000000800000000',
        description: 'Permet de créer des threads publics',
        channelTypes: ['T'],
        requires2FA: false,
        category: 'text',
    },
    CREATE_PRIVATE_THREADS: {
        bit: 36,
        hex: '0x0000001000000000',
        description: 'Permet de créer des threads privés',
        channelTypes: ['T'],
        requires2FA: false,
        category: 'text',
    },
    USE_EXTERNAL_STICKERS: {
        bit: 37,
        hex: '0x0000002000000000',
        description: 'Permet d\'utiliser des stickers provenant d\'autres serveurs',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    SEND_MESSAGES_IN_THREADS: {
        bit: 38,
        hex: '0x0000004000000000',
        description: 'Permet d\'envoyer des messages dans les threads',
        channelTypes: ['T'],
        requires2FA: false,
        category: 'text',
    },
    USE_EMBEDDED_ACTIVITIES: {
        bit: 39,
        hex: '0x0000008000000000',
        description: 'Permet de lancer des activités intégrées (Activities)',
        channelTypes: ['T', 'V'],
        requires2FA: false,
        category: 'voice',
    },
    MODERATE_MEMBERS: {
        bit: 40,
        hex: '0x0000010000000000',
        description: 'Permet de timeout des membres (les empêcher de communiquer temporairement)',
        channelTypes: [],
        requires2FA: true,
        category: 'moderation',
    },
    VIEW_CREATOR_MONETIZATION_ANALYTICS: {
        bit: 41,
        hex: '0x0000020000000000',
        description: 'Permet de voir les analytics de monétisation du créateur',
        channelTypes: [],
        requires2FA: true,
        category: 'general',
    },
    USE_SOUNDBOARD: {
        bit: 42,
        hex: '0x0000040000000000',
        description: 'Permet d\'utiliser le soundboard dans un salon vocal',
        channelTypes: ['V'],
        requires2FA: false,
        category: 'voice',
    },
    CREATE_GUILD_EXPRESSIONS: {
        bit: 43,
        hex: '0x0000080000000000',
        description: 'Permet de créer des emojis, stickers et sons de soundboard',
        channelTypes: [],
        requires2FA: false,
        category: 'general',
    },
    CREATE_EVENTS: {
        bit: 44,
        hex: '0x0000100000000000',
        description: 'Permet de créer des événements du serveur',
        channelTypes: ['V', 'S'],
        requires2FA: false,
        category: 'general',
    },
    USE_EXTERNAL_SOUNDS: {
        bit: 45,
        hex: '0x0000200000000000',
        description: 'Permet d\'utiliser des sons de soundboard d\'autres serveurs',
        channelTypes: ['V'],
        requires2FA: false,
        category: 'voice',
    },
    SEND_VOICE_MESSAGES: {
        bit: 46,
        hex: '0x0000400000000000',
        description: 'Permet d\'envoyer des messages vocaux',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    SEND_POLLS: {
        bit: 49,
        hex: '0x0002000000000000',
        description: 'Permet d\'envoyer des sondages',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    USE_EXTERNAL_APPS: {
        bit: 50,
        hex: '0x0004000000000000',
        description: 'Permet d\'utiliser des applications externes dans les messages',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
    SET_VOICE_CHANNEL_STATUS: {
        bit: 48,
        hex: '0x0001000000000000',
        description: 'Permet de définir le statut d\'un salon vocal',
        channelTypes: ['V'],
        requires2FA: false,
        category: 'voice',
    },
    PIN_MESSAGES: {
        bit: 51,
        hex: '0x0008000000000000',
        description: 'Permet d\'épingler et désépingler des messages',
        channelTypes: ['T'],
        requires2FA: false,
        category: 'text',
    },
    BYPASS_SLOWMODE: {
        bit: 52,
        hex: '0x0010000000000000',
        description: 'Permet de contourner les restrictions du mode lent (slowmode)',
        channelTypes: ['T', 'V', 'S'],
        requires2FA: false,
        category: 'text',
    },
};


// ─────────────────────────────────────────────────────────────────
//  CATÉGORIES DE PERMISSIONS (pour UI & system prompt)
// ─────────────────────────────────────────────────────────────────

const PermissionCategories = {
    general: {
        label: '🔧 Général',
        permissions: [
            'CREATE_INSTANT_INVITE', 'ADMINISTRATOR', 'MANAGE_CHANNELS',
            'MANAGE_GUILD', 'VIEW_AUDIT_LOG', 'VIEW_CHANNEL',
            'VIEW_GUILD_INSIGHTS', 'CHANGE_NICKNAME', 'MANAGE_NICKNAMES',
            'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'MANAGE_GUILD_EXPRESSIONS',
            'MANAGE_EVENTS', 'VIEW_CREATOR_MONETIZATION_ANALYTICS',
            'CREATE_GUILD_EXPRESSIONS', 'CREATE_EVENTS',
        ],
    },
    text: {
        label: '💬 Texte',
        permissions: [
            'ADD_REACTIONS', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES',
            'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY',
            'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS',
            'USE_APPLICATION_COMMANDS', 'MANAGE_THREADS',
            'CREATE_PUBLIC_THREADS', 'CREATE_PRIVATE_THREADS',
            'USE_EXTERNAL_STICKERS', 'SEND_MESSAGES_IN_THREADS',
            'SEND_VOICE_MESSAGES', 'SEND_POLLS', 'USE_EXTERNAL_APPS',
            'PIN_MESSAGES', 'BYPASS_SLOWMODE',
        ],
    },
    voice: {
        label: '🔊 Voix',
        permissions: [
            'PRIORITY_SPEAKER', 'STREAM', 'CONNECT', 'SPEAK',
            'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS',
            'USE_VAD', 'REQUEST_TO_SPEAK', 'USE_EMBEDDED_ACTIVITIES',
            'USE_SOUNDBOARD', 'USE_EXTERNAL_SOUNDS',
            'SET_VOICE_CHANNEL_STATUS',
        ],
    },
    moderation: {
        label: '🛡️ Modération',
        permissions: [
            'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES',
            'MODERATE_MEMBERS',
        ],
    },
};


// ─────────────────────────────────────────────────────────────────
//  CONSTANTES DE PERMISSIONS (valeurs factuelles Discord)
// ─────────────────────────────────────────────────────────────────

const PermissionPresets = {
    /** Aucune permission (valeur nulle) */
    NONE: 0n,

    /** Toutes les permissions combinées */
    ALL: Object.values(PermissionFlagsBits).reduce((acc, val) => acc | val, 0n),

    /**
     * Permissions par défaut de @everyone sur un nouveau serveur Discord.
     * C'est la valeur factuelle utilisée par Discord lors de la
     * création d'un serveur, pas une suggestion.
     */
    DEFAULT_EVERYONE:
        PermissionFlagsBits.VIEW_CHANNEL |
        PermissionFlagsBits.CREATE_INSTANT_INVITE |
        PermissionFlagsBits.CHANGE_NICKNAME |
        PermissionFlagsBits.ADD_REACTIONS |
        PermissionFlagsBits.SEND_MESSAGES |
        PermissionFlagsBits.READ_MESSAGE_HISTORY |
        PermissionFlagsBits.EMBED_LINKS |
        PermissionFlagsBits.ATTACH_FILES |
        PermissionFlagsBits.USE_EXTERNAL_EMOJIS |
        PermissionFlagsBits.USE_EXTERNAL_STICKERS |
        PermissionFlagsBits.CONNECT |
        PermissionFlagsBits.SPEAK |
        PermissionFlagsBits.USE_VAD |
        PermissionFlagsBits.STREAM |
        PermissionFlagsBits.USE_EMBEDDED_ACTIVITIES |
        PermissionFlagsBits.USE_APPLICATION_COMMANDS |
        PermissionFlagsBits.SEND_VOICE_MESSAGES |
        PermissionFlagsBits.CREATE_PUBLIC_THREADS |
        PermissionFlagsBits.SEND_MESSAGES_IN_THREADS |
        PermissionFlagsBits.USE_EXTERNAL_SOUNDS |
        PermissionFlagsBits.SEND_POLLS |
        PermissionFlagsBits.USE_EXTERNAL_APPS,
};


module.exports = {
    PermissionFlagsBits,
    PermissionMetadata,
    PermissionCategories,
    PermissionPresets,
};

