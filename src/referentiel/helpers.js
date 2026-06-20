/**
 * ═══════════════════════════════════════════════════════════════════
 *  HELPERS DE PERMISSIONS - RÉFÉRENTIEL
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Fonctions utilitaires pour manipuler les permissions Discord.
 *  Ces helpers sont utilisés par l'interpréteur (Core Engine)
 *  pour convertir le Blueprint JSON en appels API Discord.js.
 */

const { PermissionFlagsBits } = require('./permissions');
const { ChannelTypeAliases, ChannelTypes } = require('./channelTypes');
const { RoleColors } = require('./roles');


// ─────────────────────────────────────────────────────────────────
//  CONVERSION DE PERMISSIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Convertit un tableau de noms de permissions en BigInt.
 *
 * @param {string[]} permissionNames - Liste de noms de permissions
 * @returns {BigInt} Le bitfield combiné
 * @throws {Error} Si un nom de permission est inconnu
 */
function permissionNamesToBigInt(permissionNames) {
    if (!Array.isArray(permissionNames)) return 0n;

    let result = 0n;
    for (const name of permissionNames) {
        const upperName = name.toUpperCase();
        if (PermissionFlagsBits[upperName] === undefined) {
            throw new Error(`Permission inconnue : "${name}". Permissions valides : ${Object.keys(PermissionFlagsBits).join(', ')}`);
        }
        result |= PermissionFlagsBits[upperName];
    }
    return result;
}

/**
 * Convertit un BigInt de permissions en string sérialisé
 * (format attendu par l'API Discord v8+).
 *
 * @param {BigInt} permissions - Le bitfield BigInt
 * @returns {string} La permission sérialisée (ex: "2112")
 */
function permissionBigIntToString(permissions) {
    return permissions.toString();
}

/**
 * Convertit un string de permissions en BigInt.
 *
 * @param {string} permissionString - Le string de l'API Discord
 * @returns {BigInt} Le bitfield BigInt
 */
function permissionStringToBigInt(permissionString) {
    return BigInt(permissionString);
}

/**
 * Décompose un BigInt de permissions en liste de noms.
 *
 * @param {BigInt} permissions - Le bitfield BigInt
 * @returns {string[]} Liste des noms de permissions actives
 */
function bigIntToPermissionNames(permissions) {
    const names = [];
    for (const [name, bit] of Object.entries(PermissionFlagsBits)) {
        if ((permissions & bit) === bit) {
            names.push(name);
        }
    }
    return names;
}

/**
 * Vérifie si un bitfield contient une permission spécifique.
 *
 * @param {BigInt} permissions - Le bitfield à vérifier
 * @param {string} permissionName - Le nom de la permission
 * @returns {boolean}
 */
function hasPermission(permissions, permissionName) {
    const bit = PermissionFlagsBits[permissionName.toUpperCase()];
    if (bit === undefined) return false;
    return (permissions & bit) === bit;
}


// ─────────────────────────────────────────────────────────────────
//  CONVERSION DES TYPES DE SALONS
// ─────────────────────────────────────────────────────────────────

/**
 * Convertit un alias de type de salon (FR/EN) en valeur numérique.
 *
 * @param {string} typeAlias - L'alias (ex: "text", "vocal", "forum")
 * @returns {number} Le type numérique Discord
 * @throws {Error} Si l'alias est inconnu
 */
function resolveChannelType(typeAlias) {
    if (typeAlias === undefined || typeAlias === null) {
        return ChannelTypes.GUILD_TEXT; // Défaut = texte
    }

    const lower = typeAlias.toLowerCase();
    if (ChannelTypeAliases[lower] !== undefined) {
        return ChannelTypeAliases[lower];
    }

    // Tenter le nom API direct
    const upper = typeAlias.toUpperCase();
    if (ChannelTypes[upper] !== undefined) {
        return ChannelTypes[upper];
    }

    throw new Error(`Type de salon inconnu : "${typeAlias}". Types valides : ${Object.keys(ChannelTypeAliases).join(', ')}`);
}


// ─────────────────────────────────────────────────────────────────
//  CONVERSION DES COULEURS
// ─────────────────────────────────────────────────────────────────

/**
 * Convertit une couleur (hex string, nom prédéfini, ou nombre) en nombre décimal.
 *
 * @param {string|number} color - La couleur à convertir
 * @returns {number} La couleur en décimal
 */
function resolveColor(color) {
    if (typeof color === 'number') return color;
    if (typeof color !== 'string') return 0;

    // Hex string (#FF5733 ou FF5733)
    if (color.startsWith('#')) {
        return parseInt(color.slice(1), 16);
    }

    // Nom prédéfini
    const upper = color.toUpperCase().replace(/\s+/g, '_');
    if (RoleColors[upper] !== undefined) {
        return RoleColors[upper];
    }

    // Tenter un parse hex brut
    const parsed = parseInt(color, 16);
    if (!isNaN(parsed)) return parsed;

    return 0; // Défaut : pas de couleur
}


// ─────────────────────────────────────────────────────────────────
//  CONSTRUCTION D'OVERWRITES DEPUIS LE BLUEPRINT
// ─────────────────────────────────────────────────────────────────

/**
 * Convertit un overwrite du Blueprint en format Discord.js.
 * L'IA spécifie librement les allow/deny, cette fonction
 * les convertit en BigInt sérialisés.
 *
 * @param {Object} overwrite - L'overwrite du Blueprint ({ target, allow, deny })
 * @param {Map<string, string>} roleNameToId - Map nom→ID des rôles créés
 * @param {string} everyoneRoleId - ID du rôle @everyone
 * @returns {{ id: string, type: number, allow: string, deny: string }}
 */
function buildOverwrite(overwrite, roleNameToId, everyoneRoleId) {
    let allow = 0n;
    let deny = 0n;

    // Convertir les permissions allow
    if (overwrite.allow && Array.isArray(overwrite.allow)) {
        allow = permissionNamesToBigInt(overwrite.allow);
    }

    // Convertir les permissions deny
    if (overwrite.deny && Array.isArray(overwrite.deny)) {
        deny = permissionNamesToBigInt(overwrite.deny);
    }

    // Résoudre l'ID du target
    let id;
    let type;

    if (overwrite.target === '@everyone') {
        id = everyoneRoleId;
        type = 0; // Role overwrite
    } else {
        id = roleNameToId.get(overwrite.target);
        if (!id) {
            throw new Error(`Rôle introuvable pour l'overwrite : "${overwrite.target}". Vérifiez que ce rôle est défini dans le blueprint.`);
        }
        type = 0; // Role overwrite (par défaut dans le blueprint)
    }

    return {
        id,
        type,
        allow: permissionBigIntToString(allow),
        deny: permissionBigIntToString(deny),
    };
}


module.exports = {
    permissionNamesToBigInt,
    permissionBigIntToString,
    permissionStringToBigInt,
    bigIntToPermissionNames,
    hasPermission,
    resolveChannelType,
    resolveColor,
    buildOverwrite,
};
