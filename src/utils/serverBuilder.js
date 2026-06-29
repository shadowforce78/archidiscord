/**
 * SERVER BUILDER - UTILITAIRE (Diff-Based)
 * Applique un DiffBlueprint JSON a un serveur Discord via discord.js
 * Derniere MAJ : Juin 2026
 *
 * Le builder execute exactement les 4 blocs du diff :
 *   create  -> cree les elements
 *   modify  -> modifie les elements (par id)
 *   delete  -> supprime les elements (par id)
 *   keep    -> aucune action (elements conserves)
 */

const { ChannelType } = require('discord.js');
const {
    permissionNamesToBigInt,
    resolveChannelType,
    resolveColor,
    buildOverwrite,
} = require('../referentiel/helpers');
const { ChannelTypeMetadata } = require('../referentiel/channelTypes');

const OP_DELAY_MS = 500;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function newReport() {
    return { created: [], updated: [], skipped: [], deleted: [], errors: [] };
}

// ─────────────────────────────────────────────────────────────────
//  HELPERS INTERNES
// ─────────────────────────────────────────────────────────────────

function resolveOverwrites(overwrites, roleNameToId, everyoneId, report, contextName) {
    if (!Array.isArray(overwrites) || overwrites.length === 0) return [];
    const result = [];
    for (const ow of overwrites) {
        try {
            result.push(buildOverwrite(ow, roleNameToId, everyoneId));
        } catch (err) {
            if (report) report.skipped.push(`[${contextName || 'Inconnu'}] Overwrite ignore : ${err.message}`);
        }
    }
    return result;
}

/**
 * Resout un categoryId fourni par le LLM en ID Discord valide.
 * Gere les cas ou le LLM invente un placeholder (ex: "ID_CATEGORIE_COMMUNAUTE")
 * en cherchant par nom dans les categories nouvellement creees.
 *
 * @param {string|null} categoryId
 * @param {import('discord.js').Guild} guild
 * @param {Map<string, import('discord.js').GuildChannel>} newCategoryMap - name -> channel
 * @returns {string|null|undefined} ID Discord, null (pas de categorie) ou undefined (ne pas toucher)
 */
function resolveCategoryId(categoryId, guild, newCategoryMap) {
    if (categoryId === null || categoryId === undefined) return undefined;
    if (categoryId === '') return null; // deplacer hors categorie

    // Snowflake valide = uniquement des chiffres, 17-20 caracteres
    if (/^\d{17,20}$/.test(categoryId)) {
        return categoryId; // ID Discord reel, Discord API validera
    }

    // L'IA a invente un placeholder : chercher par nom dans les nouvelles categories
    const byName = newCategoryMap.get(categoryId);
    if (byName) return byName.id;

    // Tentative de matching partiel (ex: "ID_CATEGORIE_COMMUNAUTE" -> "Communaute")
    const lowerSearch = categoryId.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [name, cat] of newCategoryMap.entries()) {
        const lowerName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (lowerSearch.includes(lowerName) || lowerName.includes(lowerSearch)) {
            return cat.id;
        }
    }

    return undefined; // Non resolu - ne pas modifier le parent
}

async function _createChannel(guild, chData, parentCat, roleNameToId, report) {
    const type = resolveChannelType(chData.type);
    const metadata = ChannelTypeMetadata[type] || {};
    const overwrites = resolveOverwrites(chData.permissionOverwrites, roleNameToId, guild.id, report, `Salon ${chData.name}`);

    const opts = {
        name: chData.name,
        type,
        parent: parentCat ?? null,
        permissionOverwrites: overwrites,
        reason: 'Blueprint Diff - create',
    };

    if (metadata.supportsTopic && chData.topic !== undefined) opts.topic = chData.topic;
    if (metadata.supportsNSFW && chData.nsfw !== undefined) opts.nsfw = chData.nsfw;
    if (metadata.supportsSlowmode && chData.rateLimitPerUser !== undefined) opts.rateLimitPerUser = chData.rateLimitPerUser;
    if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
        if (chData.bitrate) opts.bitrate = chData.bitrate;
        if (chData.userLimit !== undefined) opts.userLimit = chData.userLimit;
    }

    await guild.channels.create(opts);
    report.created.push(`Channel: ${chData.name} (${chData.type || 'text'})`);
    await sleep(OP_DELAY_MS);
}

// ─────────────────────────────────────────────────────────────────
//  PREVIEW (synchrone - aucune action Discord)
// ─────────────────────────────────────────────────────────────────

/**
 * Genere un rapport de previsualisation a partir du diff, sans toucher au serveur.
 *
 * @param {Object} diff - Le DiffBlueprint
 * @param {string} commandChannelId - ID du salon de la commande (protege)
 * @returns {Object} report
 */
function previewBlueprint(diff, commandChannelId) {
    const report = newReport();

    // ── Creations ──────────────────────────────────────────────
    for (const role of diff.create?.roles || [])
        report.created.push(`Role: ${role.name}`);
    for (const cat of diff.create?.categories || []) {
        report.created.push(`Category: ${cat.name}`);
        for (const ch of cat.channels || [])
            report.created.push(`  + Channel: ${ch.name} (${ch.type || 'text'})`);
    }
    for (const ch of diff.create?.channels || [])
        report.created.push(`Channel: ${ch.name} (${ch.type || 'text'})`);

    // ── Modifications ──────────────────────────────────────────
    if (diff.modify?.serverName)
        report.updated.push(`Serveur -> "${diff.modify.serverName}"`);
    if (diff.modify?.everyoneConfig)
        report.updated.push('Role: @everyone (permissions)');
    for (const role of diff.modify?.roles || [])
        report.updated.push(`Role: ${role.name}`);
    for (const cat of diff.modify?.categories || [])
        report.updated.push(`Category: ${cat.name || cat.id}`);
    for (const ch of diff.modify?.channels || [])
        report.updated.push(`Channel: ${ch.name}`);

    // ── Suppressions ───────────────────────────────────────────
    for (const role of diff.delete?.roles || [])
        report.deleted.push(`Role: ${role.name}`);
    for (const cat of diff.delete?.categories || [])
        report.deleted.push(`Category: ${cat.name}`);
    for (const ch of diff.delete?.channels || []) {
        if (ch.id === commandChannelId) {
            report.skipped.push(`Salon "${ch.name}" conserve (salon de commande, a supprimer manuellement)`);
        } else {
            report.deleted.push(`Channel: ${ch.name}`);
        }
    }

    // ── Conserves (informatif) ─────────────────────────────────
    const keptCount =
        (diff.keep?.roles?.length || 0) +
        (diff.keep?.categories?.length || 0) +
        (diff.keep?.channels?.length || 0);
    if (keptCount > 0)
        report.skipped.push(`${keptCount} element(s) conserves sans modification`);

    return report;
}

// ─────────────────────────────────────────────────────────────────
//  APPLICATION (asynchrone - modifie le serveur Discord)
// ─────────────────────────────────────────────────────────────────

/**
 * Applique un DiffBlueprint sur le serveur Discord.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} diff - Le DiffBlueprint valide
 * @param {string} commandChannelId - ID du salon a proteger de la suppression
 * @param {Function} [onProgress] - Callback de progression
 * @returns {Object} report
 */
async function applyBlueprint(guild, diff, commandChannelId, onProgress) {
    const report = newReport();
    const notif = async (msg) => {
        console.log(`[serverBuilder] ${msg}`);
        if (typeof onProgress === 'function') { try { await onProgress(msg); } catch (_e) { } }
    };

    await Promise.all([guild.roles.fetch(), guild.channels.fetch()]);

    // Construire roleNameToId depuis tous les roles existants (pour resoudre les overwrites)
    const roleNameToId = new Map();
    roleNameToId.set('@everyone', guild.id);
    guild.roles.cache.forEach(r => {
        if (r.id !== guild.id) roleNameToId.set(r.name, r.id);
    });

    // ── Phase 0 : Parametres du serveur ───────────────────────
    await notif('Phase 0 - Configuration du serveur...');
    const editOptions = {};
    if (diff.modify?.serverName && diff.modify.serverName !== guild.name)
        editOptions.name = diff.modify.serverName;
    if (diff.modify?.description !== undefined && diff.modify.description !== null && diff.modify.description !== guild.description)
        editOptions.description = diff.modify.description;

    if (Object.keys(editOptions).length > 0) {
        try {
            await guild.edit(editOptions);
            report.updated.push(`Serveur: ${diff.modify.serverName || guild.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Parametres serveur: ${err.message}`);
        }
    }

    // ── Phase 1 : Creer les roles ──────────────────────────────
    await notif('Phase 1 - Creation des roles...');
    for (const roleData of diff.create?.roles || []) {
        try {
            const permissions = permissionNamesToBigInt(roleData.permissions || []);
            const color = resolveColor(roleData.color);
            const created = await guild.roles.create({
                name: roleData.name, color,
                hoist: roleData.hoist ?? false,
                mentionable: roleData.mentionable ?? false,
                permissions,
                reason: 'Blueprint Diff - create',
            });
            roleNameToId.set(roleData.name, created.id);
            report.created.push(`Role: ${roleData.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Creation role "${roleData.name}": ${err.message}`);
        }
    }

    // ── Phase 2 : Modifier les roles ───────────────────────────
    await notif('Phase 2 - Modification des roles...');
    for (const roleData of diff.modify?.roles || []) {
        try {
            const existing = guild.roles.cache.get(roleData.id);
            if (!existing) { report.errors.push(`Role introuvable (id: ${roleData.id})`); continue; }
            const permissions = permissionNamesToBigInt(roleData.permissions || []);
            const color = resolveColor(roleData.color);
            await existing.edit({
                name: roleData.name, color,
                hoist: roleData.hoist ?? false,
                mentionable: roleData.mentionable ?? false,
                permissions,
            });
            // Mettre a jour la map si le nom a change
            roleNameToId.delete(existing.name);
            roleNameToId.set(roleData.name, existing.id);
            report.updated.push(`Role: ${roleData.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Modification role "${roleData.name}": ${err.message}`);
        }
    }

    // ── Phase 3 : Modifier @everyone ───────────────────────────
    if (diff.modify?.everyoneConfig?.permissions) {
        try {
            const permissions = permissionNamesToBigInt(diff.modify.everyoneConfig.permissions);
            await guild.roles.everyone.edit({ permissions });
            report.updated.push('Role: @everyone (permissions)');
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`@everyone: ${err.message}`);
        }
    }

    // ── Phase 4 : Supprimer les roles ──────────────────────────
    await notif('Phase 4 - Suppression des roles...');
    for (const roleRef of diff.delete?.roles || []) {
        try {
            const existing = roleRef.id
                ? guild.roles.cache.get(roleRef.id)
                : guild.roles.cache.find(r => r.name === roleRef.name);
            if (!existing) { report.skipped.push(`Role a supprimer introuvable: "${roleRef.name}"`); continue; }
            if (existing.managed) { report.skipped.push(`Role gere (bot), non supprime: "${existing.name}"`); continue; }
            await existing.delete('Blueprint Diff - delete');
            roleNameToId.delete(existing.name);
            report.deleted.push(`Role: ${existing.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Suppression role "${roleRef.name}": ${err.message}`);
        }
    }

    // ── Phase 5 : Creer les categories (et leurs salons) ──────
    await notif('Phase 5 - Creation des categories...');
    const newCategoryMap = new Map(); // name -> GuildChannel (pour ref dans create.channels)
    for (const catData of diff.create?.categories || []) {
        try {
            const overwrites = resolveOverwrites(catData.permissionOverwrites, roleNameToId, guild.id, report, `Category ${catData.name}`);
            const discordCat = await guild.channels.create({
                name: catData.name,
                type: ChannelType.GuildCategory,
                permissionOverwrites: overwrites,
                reason: 'Blueprint Diff - create',
            });
            newCategoryMap.set(catData.name, discordCat);
            report.created.push(`Category: ${catData.name}`);
            await sleep(OP_DELAY_MS);

            // Creer les salons a l'interieur de cette nouvelle categorie
            for (const chData of catData.channels || []) {
                try {
                    await _createChannel(guild, chData, discordCat, roleNameToId, report);
                } catch (err) {
                    report.errors.push(`Creation salon "${chData.name}" dans "${catData.name}": ${err.message}`);
                }
            }

            // Deplacer des salons EXISTANTS dans cette nouvelle categorie
            for (const chRef of catData.moveChannels || []) {
                try {
                    const existing = chRef.id
                        ? guild.channels.cache.get(chRef.id)
                        : guild.channels.cache.find(ch => ch.name === chRef.name);
                    if (!existing) { report.skipped.push(`Salon a deplacer introuvable: "${chRef.name}"`); continue; }
                    await existing.edit({ parent: discordCat.id }, 'Blueprint Diff - move to new category');
                    report.updated.push(`Channel: ${existing.name} (deplace dans ${catData.name})`);
                    await sleep(OP_DELAY_MS);
                } catch (err) {
                    report.errors.push(`Deplacement salon "${chRef.name}": ${err.message}`);
                }
            }
        } catch (err) {
            report.errors.push(`Creation category "${catData.name}": ${err.message}`);
        }
    }

    // ── Phase 6 : Modifier les categories existantes ───────────
    await notif('Phase 6 - Modification des categories...');
    for (const catData of diff.modify?.categories || []) {
        try {
            const existing = guild.channels.cache.get(catData.id);
            if (!existing) { report.errors.push(`Categorie introuvable (id: ${catData.id})`); continue; }
            const overwrites = resolveOverwrites(catData.permissionOverwrites, roleNameToId, guild.id, report, `Category ${catData.name || catData.id}`);
            await existing.edit({ name: catData.name ?? existing.name, permissionOverwrites: overwrites });
            report.updated.push(`Category: ${catData.name || catData.id}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Modification category "${catData.id}": ${err.message}`);
        }
    }

    // ── Phase 7 : Creer les salons dans des categories existantes
    await notif('Phase 7 - Creation des salons...');
    for (const chData of diff.create?.channels || []) {
        try {
            let parentCat = null;
            if (chData.categoryId) {
                const resolvedId = resolveCategoryId(chData.categoryId, guild, newCategoryMap);
                if (resolvedId) {
                    parentCat = guild.channels.cache.get(resolvedId) ?? null;
                } else if (resolvedId === undefined) {
                    report.skipped.push(`Salon "${chData.name}": categoryId "${chData.categoryId}" non resolu, cree sans categorie`);
                }
            }
            await _createChannel(guild, chData, parentCat, roleNameToId, report);
        } catch (err) {
            report.errors.push(`Creation salon "${chData.name}": ${err.message}`);
        }
    }

    // ── Phase 8 : Modifier les salons existants ────────────────
    await notif('Phase 8 - Modification des salons...');
    for (const chData of diff.modify?.channels || []) {
        try {
            const existing = guild.channels.cache.get(chData.id);
            if (!existing) { report.errors.push(`Salon introuvable (id: ${chData.id})`); continue; }

            const type = resolveChannelType(chData.type || 'text');
            const metadata = ChannelTypeMetadata[type] || {};
            const overwrites = resolveOverwrites(chData.permissionOverwrites, roleNameToId, guild.id, report, `Salon ${chData.name}`);

            const opts = {
                name: chData.name ?? existing.name,
                permissionOverwrites: overwrites,
            };

            // Resoudre le categoryId de maniere intelligente (gere les placeholders de l'IA)
            if (chData.categoryId !== undefined) {
                const resolvedParentId = resolveCategoryId(chData.categoryId, guild, newCategoryMap);
                if (resolvedParentId !== undefined) {
                    opts.parent = resolvedParentId || null;
                } else {
                    report.skipped.push(`Salon "${chData.name}": categoryId "${chData.categoryId}" non resolu, parent inchange`);
                }
            }
            if (metadata.supportsTopic && chData.topic !== undefined) opts.topic = chData.topic;
            if (metadata.supportsNSFW && chData.nsfw !== undefined) opts.nsfw = chData.nsfw;
            if (metadata.supportsSlowmode && chData.rateLimitPerUser !== undefined) opts.rateLimitPerUser = chData.rateLimitPerUser;
            if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
                if (chData.bitrate) opts.bitrate = chData.bitrate;
                if (chData.userLimit !== undefined) opts.userLimit = chData.userLimit;
            }

            await existing.edit(opts);
            report.updated.push(`Channel: ${chData.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Modification salon "${chData.name || chData.id}": ${err.message}`);
        }
    }

    // ── Phase 9 : Supprimer les categories ────────────────────
    await notif('Phase 9 - Suppression des categories...');
    for (const catRef of diff.delete?.categories || []) {
        if (catRef.id === commandChannelId) {
            report.skipped.push(`Category "${catRef.name}" conservee (salon de commande)`);
            continue;
        }
        try {
            const existing = catRef.id
                ? guild.channels.cache.get(catRef.id)
                : guild.channels.cache.find(ch => ch.type === ChannelType.GuildCategory && ch.name === catRef.name);
            if (!existing) { report.skipped.push(`Category a supprimer introuvable: "${catRef.name}"`); continue; }
            await existing.delete('Blueprint Diff - delete');
            report.deleted.push(`Category: ${existing.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Suppression category "${catRef.name}": ${err.message}`);
        }
    }

    // ── Phase 10 : Supprimer les salons ───────────────────────
    await notif('Phase 10 - Suppression des salons...');
    for (const chRef of diff.delete?.channels || []) {
        if (chRef.id === commandChannelId) {
            report.skipped.push(`Salon "${chRef.name}" conserve (salon de commande, a supprimer manuellement)`);
            continue;
        }
        try {
            const existing = chRef.id
                ? guild.channels.cache.get(chRef.id)
                : guild.channels.cache.find(ch => ch.name === chRef.name);
            if (!existing) { report.skipped.push(`Salon a supprimer introuvable: "${chRef.name}"`); continue; }
            await existing.delete('Blueprint Diff - delete');
            report.deleted.push(`Channel: ${existing.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Suppression salon "${chRef.name}": ${err.message}`);
        }
    }

    await notif('Done!');
    return report;
}

// ─────────────────────────────────────────────────────────────────
//  FORMATAGE DU RAPPORT
// ─────────────────────────────────────────────────────────────────

function formatReport(report) {
    const lines = [];
    if (report.created.length > 0) {
        lines.push(`**Crees (${report.created.length}):**`);
        lines.push(...report.created.slice(0, 20).map(l => `  + ${l}`));
        if (report.created.length > 20) lines.push(`  *... et ${report.created.length - 20} de plus*`);
    }
    if (report.updated.length > 0) {
        lines.push(`**Mis a jour (${report.updated.length}):**`);
        lines.push(...report.updated.slice(0, 20).map(l => `  ~ ${l}`));
        if (report.updated.length > 20) lines.push(`  *... et ${report.updated.length - 20} de plus*`);
    }
    if (report.deleted.length > 0) {
        lines.push(`**Supprimes (${report.deleted.length}):**`);
        lines.push(...report.deleted.slice(0, 20).map(l => `  - ${l}`));
        if (report.deleted.length > 20) lines.push(`  *... et ${report.deleted.length - 20} de plus*`);
    }
    if (report.skipped.length > 0) {
        lines.push(`**Ignores / Conserves (${report.skipped.length}):**`);
        lines.push(...report.skipped.slice(0, 8).map(l => `  ! ${l}`));
    }
    if (report.errors.length > 0) {
        lines.push(`**Erreurs (${report.errors.length}):**`);
        lines.push(...report.errors.slice(0, 10).map(l => `  x ${l}`));
        if (report.errors.length > 10) lines.push(`  *... et ${report.errors.length - 10} autres*`);
    }
    return lines.join('\n') || '*(aucune modification)*';
}

module.exports = { applyBlueprint, previewBlueprint, formatReport };
