/**
 * ═══════════════════════════════════════════════════════════════════
 *  DISCORD ROLES - RÉFÉRENTIEL FACTUEL
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Données de référence sur les rôles Discord :
 *  couleurs disponibles, flags, structure API, et règles de
 *  hiérarchie. L'IA décide librement quels rôles créer.
 */


// ─────────────────────────────────────────────────────────────────
//  COULEURS DISCORD PRÉDÉFINIES
//  (en format décimal comme attendu par l'API Discord)
//  L'IA peut aussi utiliser n'importe quel hex (#RRGGBB)
// ─────────────────────────────────────────────────────────────────

const RoleColors = {
    DEFAULT:        0x000000,   // Pas de couleur (hérite)
    AQUA:           0x1ABC9C,
    DARK_AQUA:      0x11806A,
    GREEN:          0x57F287,
    DARK_GREEN:     0x1F8B4C,
    BLUE:           0x3498DB,
    DARK_BLUE:      0x206694,
    PURPLE:         0x9B59B6,
    DARK_PURPLE:    0x71368A,
    LUMINOUS_VIVID_PINK: 0xE91E63,
    DARK_VIVID_PINK: 0xAD1457,
    GOLD:           0xF1C40F,
    DARK_GOLD:      0xC27C0E,
    ORANGE:         0xE67E22,
    DARK_ORANGE:    0xA84300,
    RED:            0xED4245,
    DARK_RED:       0x992D22,
    GREY:           0x95A5A6,
    DARK_GREY:      0x979C9F,
    LIGHT_GREY:     0xBCC0C0,
    NAVY:           0x34495E,
    DARK_NAVY:      0x2C3E50,
    YELLOW:         0xFEE75C,
    WHITE:          0xFFFFFF,
    FUCHSIA:        0xEB459E,
    BLURPLE:        0x5865F2,
    GREYPLE:        0x99AAB5,
    NOT_QUITE_BLACK: 0x23272A,
};


// ─────────────────────────────────────────────────────────────────
//  ROLE FLAGS (API Discord)
// ─────────────────────────────────────────────────────────────────

const RoleFlags = {
    IN_PROMPT: 1 << 0,  // Le rôle est sélectionnable dans l'onboarding
};


// ─────────────────────────────────────────────────────────────────
//  STRUCTURE DE L'OBJET ROLE (API Discord)
//  Référence pour le schéma JSON du blueprint
// ─────────────────────────────────────────────────────────────────

const RoleObjectSchema = {
    id:             'snowflake - ID unique du rôle',
    name:           'string - Nom du rôle (max 100 chars)',
    color:          'integer - Couleur en format décimal (0 = pas de couleur)',
    hoist:          'boolean - Si le rôle est affiché séparément dans la sidebar',
    icon:           'string? - Hash de l\'icône du rôle (Nitro Boost requis)',
    unicode_emoji:  'string? - Emoji unicode pour l\'icône du rôle',
    position:       'integer - Position dans la hiérarchie (0 = @everyone)',
    permissions:    'string - Bitfield des permissions en string',
    managed:        'boolean - Si le rôle est géré par une intégration (bot, boost, etc.)',
    mentionable:    'boolean - Si le rôle peut être mentionné par tout le monde',
    tags:           'object? - Tags du rôle (bot_id, integration_id, premium_subscriber, etc.)',
    flags:          'integer - Flags combinés du rôle',
};


// ─────────────────────────────────────────────────────────────────
//  RÈGLES DE HIÉRARCHIE DISCORD (faits techniques)
//  Note : ce sont les CONTRAINTES du système, pas des suggestions.
// ─────────────────────────────────────────────────────────────────

const HierarchyRules = {
    /** @everyone est TOUJOURS en position 0 (la plus basse). Non supprimable. */
    EVERYONE_POSITION: 0,

    /** Plus la position est haute, plus le rôle a de pouvoir */
    DIRECTION: 'HIGHER_IS_MORE_POWERFUL',

    /** Un rôle ne peut gérer (assign/remove) que les rôles en dessous de lui */
    MANAGEMENT_RULE: 'Un rôle ne peut modifier que les rôles dont la position est inférieure à la sienne',

    /** Le bot doit avoir un rôle PLUS HAUT que les rôles qu'il veut créer/assigner */
    BOT_CONSTRAINT: 'Le rôle du bot doit être positionné au-dessus de tous les rôles qu\'il doit gérer',

    /** Le propriétaire du serveur contourne toutes les restrictions de hiérarchie */
    OWNER_BYPASS: 'Le propriétaire du serveur ignore toutes les restrictions de hiérarchie et de permissions',
};


module.exports = {
    RoleColors,
    RoleFlags,
    RoleObjectSchema,
    HierarchyRules,
};
