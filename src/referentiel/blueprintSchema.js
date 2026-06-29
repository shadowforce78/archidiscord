/**
 * DIFF BLUEPRINT JSON SCHEMA - REFERENTIEL
 * Derniere MAJ : Juin 2026
 *
 * Le LLM retourne un diff avec 4 blocs :
 *   - create  : elements a creer
 *   - modify  : elements a modifier
 *   - delete  : elements a supprimer
 *   - keep    : elements conserves (informatif)
 */

const { ChannelTypeAliases } = require('./channelTypes');
const { PermissionFlagsBits } = require('./permissions');

/**
 * Valide un DiffBlueprint JSON genere par le LLM.
 * @param {Object} diff
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDiffBlueprint(diff) {
    const errors = [];

    if (!diff || typeof diff !== 'object') {
        errors.push('Le diff doit etre un objet JSON valide');
        return { valid: false, errors };
    }

    const hasContent = diff.create || diff.modify || diff.delete;
    if (!hasContent) {
        errors.push('Le diff doit contenir au moins un des blocs: create, modify, delete');
    }

    // ── Bloc create ──────────────────────────────────────────────
    if (diff.create) {
        if (diff.create.roles !== undefined && !Array.isArray(diff.create.roles))
            errors.push('create.roles doit etre un tableau');
        if (diff.create.categories !== undefined && !Array.isArray(diff.create.categories))
            errors.push('create.categories doit etre un tableau');
        if (diff.create.channels !== undefined && !Array.isArray(diff.create.channels))
            errors.push('create.channels doit etre un tableau');

        for (const [i, role] of (diff.create.roles || []).entries()) {
            if (!role.name || typeof role.name !== 'string')
                errors.push(`create.roles[${i}].name est requis`);
            else if (role.name.length > 100)
                errors.push(`create.roles[${i}].name : max 100 caracteres`);
            _validatePermissionList(role.permissions, `create.roles[${i}].permissions`, errors);
            _validateRoleColor(role.color, `create.roles[${i}].color`, errors);
        }

        for (const [i, cat] of (diff.create.categories || []).entries()) {
            if (!cat.name || typeof cat.name !== 'string')
                errors.push(`create.categories[${i}].name est requis`);
            if (cat.permissionOverwrites)
                _validateOverwrites(cat.permissionOverwrites, `create.categories[${i}]`, errors);
            for (const [j, ch] of (cat.channels || []).entries())
                _validateChannel(ch, `create.categories[${i}].channels[${j}]`, errors);
        }

        for (const [i, ch] of (diff.create.channels || []).entries()) {
            _validateChannel(ch, `create.channels[${i}]`, errors);
            if (ch.categoryId !== undefined && typeof ch.categoryId !== 'string')
                errors.push(`create.channels[${i}].categoryId doit etre une string`);
        }
    }

    // ── Bloc modify ──────────────────────────────────────────────
    if (diff.modify) {
        // null est accepte comme "pas de changement" (l'IA peut omettre ou mettre null)
        if (diff.modify.serverName !== undefined && diff.modify.serverName !== null) {
            if (typeof diff.modify.serverName !== 'string')
                errors.push('modify.serverName doit etre une string');
            else if (diff.modify.serverName.length < 2 || diff.modify.serverName.length > 100)
                errors.push('modify.serverName doit faire entre 2 et 100 caracteres');
        }

        if (diff.modify.everyoneConfig && diff.modify.everyoneConfig.permissions)
            _validatePermissionList(diff.modify.everyoneConfig.permissions, 'modify.everyoneConfig.permissions', errors);

        for (const [i, role] of (diff.modify.roles || []).entries()) {
            if (!role.id || typeof role.id !== 'string')
                errors.push(`modify.roles[${i}].id est obligatoire (string)`);
            if (!role.name || typeof role.name !== 'string')
                errors.push(`modify.roles[${i}].name est requis`);
            _validatePermissionList(role.permissions, `modify.roles[${i}].permissions`, errors);
            _validateRoleColor(role.color, `modify.roles[${i}].color`, errors);
        }

        for (const [i, cat] of (diff.modify.categories || []).entries()) {
            if (!cat.id || typeof cat.id !== 'string')
                errors.push(`modify.categories[${i}].id est obligatoire (string)`);
            if (cat.permissionOverwrites)
                _validateOverwrites(cat.permissionOverwrites, `modify.categories[${i}]`, errors);
        }

        for (const [i, ch] of (diff.modify.channels || []).entries()) {
            if (!ch.id || typeof ch.id !== 'string')
                errors.push(`modify.channels[${i}].id est obligatoire (string)`);
            _validateChannel(ch, `modify.channels[${i}]`, errors);
        }
    }

    // ── Bloc delete ──────────────────────────────────────────────
    if (diff.delete) {
        if (diff.delete.roles !== undefined && !Array.isArray(diff.delete.roles))
            errors.push('delete.roles doit etre un tableau');
        if (diff.delete.categories !== undefined && !Array.isArray(diff.delete.categories))
            errors.push('delete.categories doit etre un tableau');
        if (diff.delete.channels !== undefined && !Array.isArray(diff.delete.channels))
            errors.push('delete.channels doit etre un tableau');

        for (const [i, ref] of (diff.delete.roles || []).entries()) {
            if (!ref.id && !ref.name)
                errors.push(`delete.roles[${i}] doit avoir au moins un champ id ou name`);
        }
        for (const [i, ref] of (diff.delete.categories || []).entries()) {
            if (!ref.id && !ref.name)
                errors.push(`delete.categories[${i}] doit avoir au moins un champ id ou name`);
        }
        for (const [i, ref] of (diff.delete.channels || []).entries()) {
            if (!ref.id && !ref.name)
                errors.push(`delete.channels[${i}] doit avoir au moins un champ id ou name`);
        }
    }

    // ── Bloc keep (informatif, validation legere) ────────────────
    if (diff.keep) {
        if (diff.keep.roles !== undefined && !Array.isArray(diff.keep.roles))
            errors.push('keep.roles doit etre un tableau');
        if (diff.keep.categories !== undefined && !Array.isArray(diff.keep.categories))
            errors.push('keep.categories doit etre un tableau');
        if (diff.keep.channels !== undefined && !Array.isArray(diff.keep.channels))
            errors.push('keep.channels doit etre un tableau');
    }

    return { valid: errors.length === 0, errors };
}


// ─────────────────────────────────────────────────────────────────
//  HELPERS PRIVES
// ─────────────────────────────────────────────────────────────────

function _validateChannel(channel, path, errors) {
    if (!channel.name || typeof channel.name !== 'string')
        errors.push(`${path}.name est requis`);
    else if (channel.name.length > 100)
        errors.push(`${path}.name : max 100 caracteres`);

    if (channel.type) {
        const validTypes = Object.keys(ChannelTypeAliases);
        if (!validTypes.includes(channel.type.toLowerCase()))
            errors.push(`${path}.type : type inconnu "${channel.type}"`);
    }

    if (channel.topic && channel.topic.length > 1024)
        errors.push(`${path}.topic : max 1024 caracteres`);

    if (channel.rateLimitPerUser !== undefined) {
        if (channel.rateLimitPerUser < 0 || channel.rateLimitPerUser > 21600)
            errors.push(`${path}.rateLimitPerUser : doit etre entre 0 et 21600`);
    }

    if (channel.bitrate !== undefined) {
        if (channel.bitrate < 8000 || channel.bitrate > 384000)
            errors.push(`${path}.bitrate : doit etre entre 8000 et 384000`);
    }

    if (channel.userLimit !== undefined) {
        if (channel.userLimit < 0 || channel.userLimit > 99)
            errors.push(`${path}.userLimit : doit etre entre 0 et 99`);
    }

    if (channel.permissionOverwrites)
        _validateOverwrites(channel.permissionOverwrites, path, errors);
}

function _validatePermissionList(permissions, path, errors) {
    if (permissions === undefined || permissions === null) return;
    if (!Array.isArray(permissions)) {
        errors.push(`${path} doit etre un tableau`);
        return;
    }
    for (const perm of permissions) {
        if (!Object.prototype.hasOwnProperty.call(PermissionFlagsBits, perm))
            errors.push(`${path} : permission inconnue "${perm}"`);
    }
}

function _validateRoleColor(color, path, errors) {
    if (color && typeof color === 'string') {
        if (!color.match(/^#[0-9A-Fa-f]{6}$/))
            errors.push(`${path} : format invalide "${color}" (attendu: #RRGGBB)`);
    }
}

function _validateOverwrites(overwrites, path, errors) {
    if (!Array.isArray(overwrites)) {
        errors.push(`${path}.permissionOverwrites doit etre un tableau`);
        return;
    }
    if (overwrites.length > 100)
        errors.push(`${path}.permissionOverwrites : max 100 overwrites`);

    for (const [k, ow] of overwrites.entries()) {
        if (!ow.target || typeof ow.target !== 'string')
            errors.push(`${path}.permissionOverwrites[${k}].target est requis`);
        _validatePermissionList(ow.allow, `${path}.permissionOverwrites[${k}].allow`, errors);
        _validatePermissionList(ow.deny, `${path}.permissionOverwrites[${k}].deny`, errors);
    }
}


module.exports = {
    validateDiffBlueprint,
};
