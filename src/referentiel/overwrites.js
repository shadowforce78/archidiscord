/**
 * ═══════════════════════════════════════════════════════════════════
 *  DISCORD PERMISSION OVERWRITES - RÉFÉRENTIEL FACTUEL
 *  Source : https://docs.discord.com/developers/topics/permissions
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Les Permission Overwrites permettent de personnaliser les
 *  permissions d'un rôle ou d'un membre sur un salon spécifique,
 *  en "écrasant" les permissions globales du rôle.
 *
 *  Fonctionnement (algorithme officiel Discord) :
 *   1. On part des permissions de base (combinaison de tous les rôles du membre)
 *   2. On applique l'overwrite de @everyone du salon
 *   3. On applique les overwrites de chaque rôle du membre (combinés)
 *   4. On applique l'overwrite spécifique au membre
 *
 *  Pour chaque étape : deny retire les bits, allow les ajoute.
 *  Overwrites par membre > overwrites par rôle > @everyone.
 *
 *  IMPORTANT : Un overwrite avec allow=0 et deny=0 signifie
 *  "hérité du rôle" (neutre). Ce n'est PAS la même chose que deny.
 */

const { PermissionFlagsBits } = require('./permissions');


// ─────────────────────────────────────────────────────────────────
//  TYPES D'OVERWRITES (valeurs de l'API Discord)
// ─────────────────────────────────────────────────────────────────

const OverwriteTypes = {
    /** Overwrite appliqué à un rôle */
    ROLE: 0,

    /** Overwrite appliqué à un membre individuel */
    MEMBER: 1,
};


// ─────────────────────────────────────────────────────────────────
//  STRUCTURE D'UN OVERWRITE (API Discord)
// ─────────────────────────────────────────────────────────────────

const OverwriteObjectSchema = {
    id:     'snowflake - ID du rôle ou de l\'utilisateur',
    type:   'integer - 0 = rôle, 1 = membre',
    allow:  'string - Bitfield des permissions explicitement autorisées',
    deny:   'string - Bitfield des permissions explicitement refusées',
};


// ─────────────────────────────────────────────────────────────────
//  ALGORITHME DE CALCUL DES PERMISSIONS (algorithme officiel Discord)
//  Reproduit la logique exacte décrite dans la documentation.
// ─────────────────────────────────────────────────────────────────

/**
 * Calcule les permissions effectives d'un membre dans un salon,
 * en tenant compte de :
 * 1. Les permissions de base de chaque rôle
 * 2. L'overwrite @everyone du salon
 * 3. Les overwrites de chaque rôle du membre
 * 4. L'overwrite spécifique au membre
 *
 * @param {BigInt} basePermissions - Permissions combinées de tous les rôles
 * @param {string} guildOwnerId - ID du propriétaire du serveur
 * @param {string} memberId - ID du membre
 * @param {Array} memberRoleIds - IDs des rôles du membre
 * @param {Array} channelOverwrites - Liste des overwrites du salon
 * @param {string} everyoneRoleId - ID du rôle @everyone (= guild ID)
 * @returns {BigInt} Permissions effectives
 */
function computeChannelPermissions(
    basePermissions,
    guildOwnerId,
    memberId,
    memberRoleIds,
    channelOverwrites,
    everyoneRoleId
) {
    // Le propriétaire du serveur a TOUTES les permissions
    if (memberId === guildOwnerId) {
        return Object.values(PermissionFlagsBits).reduce((acc, val) => acc | val, 0n);
    }

    // ADMINISTRATOR bypass tout
    if ((basePermissions & PermissionFlagsBits.ADMINISTRATOR) === PermissionFlagsBits.ADMINISTRATOR) {
        return Object.values(PermissionFlagsBits).reduce((acc, val) => acc | val, 0n);
    }

    let permissions = basePermissions;

    // Étape 1 : Appliquer l'overwrite @everyone
    const everyoneOverwrite = channelOverwrites.find(o => o.id === everyoneRoleId);
    if (everyoneOverwrite) {
        permissions &= ~BigInt(everyoneOverwrite.deny);
        permissions |= BigInt(everyoneOverwrite.allow);
    }

    // Étape 2 : Appliquer les overwrites de chaque rôle (combinés)
    let roleAllow = 0n;
    let roleDeny = 0n;

    for (const overwrite of channelOverwrites) {
        if (overwrite.type === OverwriteTypes.ROLE && memberRoleIds.includes(overwrite.id)) {
            roleAllow |= BigInt(overwrite.allow);
            roleDeny  |= BigInt(overwrite.deny);
        }
    }

    permissions &= ~roleDeny;
    permissions |= roleAllow;

    // Étape 3 : Appliquer l'overwrite spécifique au membre
    const memberOverwrite = channelOverwrites.find(
        o => o.type === OverwriteTypes.MEMBER && o.id === memberId
    );
    if (memberOverwrite) {
        permissions &= ~BigInt(memberOverwrite.deny);
        permissions |= BigInt(memberOverwrite.allow);
    }

    return permissions;
}


module.exports = {
    OverwriteTypes,
    OverwriteObjectSchema,
    computeChannelPermissions,
};
