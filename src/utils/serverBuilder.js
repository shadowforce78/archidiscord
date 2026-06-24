/**
 * ═══════════════════════════════════════════════════════════════════
 *  SERVER BUILDER - UTILITAIRE
 *  Applique un Blueprint JSON à un serveur Discord via l'API discord.js
 *  Dernière MAJ : Juin 2026
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Logique d'application :
 *  1. Rôles : crée les manquants, met à jour les existants (par ID ou nom)
 *  2. everyoneConfig : met à jour les permissions du rôle @everyone
 *  3. Catégories : crée les manquantes, met à jour les existantes (par ID)
 *  4. Salons : crée les manquants, met à jour les existants (par ID)
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

function newReport() {
    return { created: [], updated: [], skipped: [], deleted: [], errors: [] };
}

async function applyRoles(guild, roles, report) {
    const roleNameToId = new Map();
    roleNameToId.set('@everyone', guild.id);
    if (!Array.isArray(roles) || roles.length === 0) return roleNameToId;

    for (const roleData of roles) {
        try {
            const permissions = permissionNamesToBigInt(roleData.permissions || []);
            const color = resolveColor(roleData.color);

            let existingRole = null;
            if (roleData.id) existingRole = guild.roles.cache.get(roleData.id) ?? null;
            if (!existingRole) existingRole = guild.roles.cache.find(r => r.name === roleData.name) ?? null;

            if (existingRole) {
                await existingRole.edit({ name: roleData.name, color, hoist: roleData.hoist ?? false, mentionable: roleData.mentionable ?? false, permissions });
                roleNameToId.set(roleData.name, existingRole.id);
                report.updated.push(`Role: ${roleData.name}`);
            } else {
                const created = await guild.roles.create({ name: roleData.name, color, hoist: roleData.hoist ?? false, mentionable: roleData.mentionable ?? false, permissions, reason: 'Blueprint Ollama' });
                roleNameToId.set(roleData.name, created.id);
                report.created.push(`Role: ${roleData.name}`);
            }
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Role "${roleData.name}": ${err.message}`);
        }
    }
    return roleNameToId;
}

async function applyEveryoneConfig(guild, everyoneConfig, report) {
    if (!everyoneConfig || !everyoneConfig.permissions) return;
    try {
        const permissions = permissionNamesToBigInt(everyoneConfig.permissions);
        await guild.roles.everyone.edit({ permissions });
        report.updated.push('Role: @everyone (permissions)');
        await sleep(OP_DELAY_MS);
    } catch (err) {
        report.errors.push(`@everyone: ${err.message}`);
    }
}

async function applyCategories(guild, categories, roleNameToId, processedChannelIds, report) {
    const categoryMap = new Map();
    if (!Array.isArray(categories) || categories.length === 0) return categoryMap;

    for (let i = 0; i < categories.length; i++) {
        const catData = categories[i];
        try {
            const overwrites = resolveOverwrites(catData.permissionOverwrites, roleNameToId, guild.id, report, `Categorie ${catData.name}`);
            let existingCat = null;
            if (catData.id) {
                const found = guild.channels.cache.get(catData.id);
                if (found && found.type === ChannelType.GuildCategory) existingCat = found;
            }
            if (!existingCat) existingCat = guild.channels.cache.find(ch => ch.type === ChannelType.GuildCategory && ch.name === catData.name) ?? null;

            let discordCat;
            if (existingCat) {
                await existingCat.edit({ name: catData.name, position: i, permissionOverwrites: overwrites });
                discordCat = existingCat;
                processedChannelIds.add(discordCat.id);
                report.updated.push(`Category: ${catData.name}`);
            } else {
                discordCat = await guild.channels.create({ name: catData.name, type: ChannelType.GuildCategory, position: i, permissionOverwrites: overwrites, reason: 'Blueprint Ollama' });
                processedChannelIds.add(discordCat.id);
                report.created.push(`Category: ${catData.name}`);
            }
            if (catData.id) categoryMap.set(catData.id, discordCat);
            categoryMap.set(catData.name, discordCat);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Category "${catData.name}": ${err.message}`);
        }
    }
    return categoryMap;
}

async function applyChannels(guild, channels, parentCategory, roleNameToId, processedChannelIds, report) {
    if (!Array.isArray(channels) || channels.length === 0) return;

    for (let i = 0; i < channels.length; i++) {
        const chData = channels[i];
        try {
            const type = resolveChannelType(chData.type);
            const overwrites = resolveOverwrites(chData.permissionOverwrites, roleNameToId, guild.id, report, `Salon ${chData.name}`);
            const metadata = ChannelTypeMetadata[type] || {};
            
            const channelOptions = {
                name: chData.name, type,
                parent: parentCategory ?? null,
                position: i,
                permissionOverwrites: overwrites,
            };

            if (metadata.supportsTopic && chData.topic !== undefined) channelOptions.topic = chData.topic;
            if (metadata.supportsNSFW && chData.nsfw !== undefined) channelOptions.nsfw = chData.nsfw;
            if (metadata.supportsSlowmode && chData.rateLimitPerUser !== undefined) channelOptions.rateLimitPerUser = chData.rateLimitPerUser;
            if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
                if (chData.bitrate) channelOptions.bitrate = chData.bitrate;
                if (chData.userLimit !== undefined) channelOptions.userLimit = chData.userLimit;
            }

            let existingChannel = null;
            if (chData.id) {
                const found = guild.channels.cache.get(chData.id);
                if (found) {
                    if (found.type !== type) { 
                        report.skipped.push(`Channel "${chData.name}" sera recrée (changement de type).`);
                    } else {
                        existingChannel = found;
                    }
                }
            }
            if (!existingChannel) {
                existingChannel = guild.channels.cache.find(ch => {
                    return ch.name === chData.name && ch.type === type;
                }) ?? null;
            }

            if (existingChannel) {
                await existingChannel.edit(channelOptions);
                processedChannelIds.add(existingChannel.id);
                report.updated.push(`Channel: ${chData.name} (${chData.type || 'text'})`);
            } else {
                const created = await guild.channels.create({ ...channelOptions, reason: 'Blueprint Ollama' });
                processedChannelIds.add(created.id);
                report.created.push(`Channel: ${chData.name} (${chData.type || 'text'})`);
            }
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Channel "${chData.name}": ${err.message}`);
        }
    }
}

function previewBlueprint(guild, blueprint, commandChannelId) {
    const report = newReport();
    
    // Roles
    const processedRoleIds = new Set();
    processedRoleIds.add(guild.id);
    if (Array.isArray(blueprint.roles)) {
        for (const roleData of blueprint.roles) {
            let existingRole = null;
            if (roleData.id) existingRole = guild.roles.cache.get(roleData.id);
            if (!existingRole) existingRole = guild.roles.cache.find(r => r.name === roleData.name);
            
            if (existingRole) {
                processedRoleIds.add(existingRole.id);
                report.updated.push(`Role: ${roleData.name}`);
            } else {
                report.created.push(`Role: ${roleData.name}`);
            }
        }
    }
    
    // @everyone
    if (blueprint.everyoneConfig) {
        report.updated.push('Role: @everyone (permissions)');
    }
    
    // Categories & Channels
    const processedChannelIds = new Set();
    if (Array.isArray(blueprint.categories)) {
        for (const catData of blueprint.categories) {
            let existingCat = null;
            if (catData.id) {
                const found = guild.channels.cache.get(catData.id);
                if (found && found.type === ChannelType.GuildCategory) existingCat = found;
            }
            if (!existingCat) existingCat = guild.channels.cache.find(ch => ch.type === ChannelType.GuildCategory && ch.name === catData.name);
            
            if (existingCat) {
                processedChannelIds.add(existingCat.id);
                report.updated.push(`Category: ${catData.name}`);
            } else {
                report.created.push(`Category: ${catData.name}`);
            }
            
            if (Array.isArray(catData.channels)) {
                for (const chData of catData.channels) {
                    const type = resolveChannelType(chData.type);
                    let existingChannel = null;
                    if (chData.id) {
                        const found = guild.channels.cache.get(chData.id);
                        if (found) {
                            if (found.type !== type) {
                                report.skipped.push(`Channel "${chData.name}" sera recrée (changement de type).`);
                            } else {
                                existingChannel = found;
                            }
                        }
                    }
                    if (!existingChannel) {
                        existingChannel = guild.channels.cache.find(ch => {
                            return ch.name === chData.name && ch.type === type;
                        });
                    }
                    
                    if (existingChannel) {
                        processedChannelIds.add(existingChannel.id);
                        report.updated.push(`Channel: ${chData.name} (${chData.type || 'text'})`);
                    } else {
                        report.created.push(`Channel: ${chData.name} (${chData.type || 'text'})`);
                    }
                }
            }
        }
    }
    
    if (Array.isArray(blueprint.standaloneChannels)) {
        for (const chData of blueprint.standaloneChannels) {
            const type = resolveChannelType(chData.type);
            let existingChannel = null;
            if (chData.id) {
                const found = guild.channels.cache.get(chData.id);
                if (found) {
                    if (found.type !== type) {
                        report.skipped.push(`Channel "${chData.name}" sera recrée (changement de type).`);
                    } else {
                        existingChannel = found;
                    }
                }
            }
            if (!existingChannel) {
                existingChannel = guild.channels.cache.find(ch => ch.name === chData.name && ch.type === type);
            }
            
            if (existingChannel) {
                processedChannelIds.add(existingChannel.id);
                report.updated.push(`Channel: ${chData.name} (${chData.type || 'text'})`);
            } else {
                report.created.push(`Channel: ${chData.name} (${chData.type || 'text'})`);
            }
        }
    }
    
    if (blueprint.serverName && blueprint.serverName !== guild.name) {
        report.updated.push('Parametres du serveur (Nom)');
    }
    
    const channelsToDelete = guild.channels.cache.filter(ch => !processedChannelIds.has(ch.id));
    for (const [id, ch] of channelsToDelete) {
        if (id === commandChannelId) {
            report.skipped.push(`Salon de commande "${ch.name}" conserve pour eviter le crash. A supprimer manuellement.`);
        } else {
            report.deleted.push(`Channel: ${ch.name}`);
        }
    }
    
    const rolesToDelete = guild.roles.cache.filter(r => !processedRoleIds.has(r.id) && !r.managed && r.id !== guild.id);
    for (const [id, r] of rolesToDelete) {
        report.deleted.push(`Role: ${r.name}`);
    }
    
    return report;
}

async function applyBlueprint(guild, blueprint, commandChannelId, onProgress) {
    const report = newReport();
    const notif = async (msg) => {
        console.log(`[serverBuilder] ${msg}`);
        if (typeof onProgress === 'function') { try { await onProgress(msg); } catch (_e) {} }
    };

    await Promise.all([guild.roles.fetch(), guild.channels.fetch()]);

    await notif('Phase 0/5 - Configuration du serveur...');
    const editOptions = {};
    if (blueprint.serverName && blueprint.serverName !== guild.name) editOptions.name = blueprint.serverName;
    if (blueprint.description !== undefined && blueprint.description !== guild.description) editOptions.description = blueprint.description;
    
    if (Object.keys(editOptions).length > 0) {
        try {
            await guild.edit(editOptions);
            report.updated.push('Parametres du serveur');
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Parametres du serveur: ${err.message}`);
        }
    }

    await notif('Phase 1/5 - Roles...');
    const roleNameToId = await applyRoles(guild, blueprint.roles, report);

    await notif('Phase 2/5 - @everyone...');
    if (blueprint.everyoneConfig) await applyEveryoneConfig(guild, blueprint.everyoneConfig, report);

    const processedChannelIds = new Set();

    await notif('Phase 3/5 - Categories...');
    const categoryMap = await applyCategories(guild, blueprint.categories, roleNameToId, processedChannelIds, report);

    await notif('Phase 4/5 - Channels...');
    if (Array.isArray(blueprint.categories)) {
        for (const catData of blueprint.categories) {
            const discordCat = categoryMap.get(catData.id) ?? categoryMap.get(catData.name) ?? null;
            if (!discordCat) { report.errors.push(`Category "${catData.name}" not found for channels.`); continue; }
            await applyChannels(guild, catData.channels, discordCat, roleNameToId, processedChannelIds, report);
        }
    }
    if (Array.isArray(blueprint.standaloneChannels)) {
        await applyChannels(guild, blueprint.standaloneChannels, null, roleNameToId, processedChannelIds, report);
    }

    await notif('Phase 5/5 - Nettoyage...');
    
    // Delete unused channels
    const channelsToDelete = guild.channels.cache.filter(ch => !processedChannelIds.has(ch.id));
    for (const [id, ch] of channelsToDelete) {
        if (id === commandChannelId) {
            report.skipped.push(`Salon de commande "${ch.name}" conserve pour eviter le crash. A supprimer manuellement.`);
            continue;
        }
        try {
            await ch.delete('Blueprint Ollama - Nettoyage');
            report.deleted.push(`Channel: ${ch.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Suppression channel "${ch.name}": ${err.message}`);
        }
    }

    // Delete unused roles
    const processedRoleIds = new Set(roleNameToId.values());
    const rolesToDelete = guild.roles.cache.filter(r => !processedRoleIds.has(r.id) && !r.managed && r.id !== guild.id);
    for (const [id, r] of rolesToDelete) {
        try {
            await r.delete('Blueprint Ollama - Nettoyage');
            report.deleted.push(`Role: ${r.name}`);
            await sleep(OP_DELAY_MS);
        } catch (err) {
            report.errors.push(`Suppression role "${r.name}": ${err.message}`);
        }
    }

    await notif('Done!');
    return report;
}

function formatReport(report) {
    const lines = [];
    if (report.created.length > 0) {
        lines.push(`**Crees (${report.created.length}):**`);
        lines.push(...report.created.slice(0, 15).map(l => `  + ${l}`));
        if (report.created.length > 15) lines.push(`  *... et ${report.created.length - 15} de plus*`);
    }
    if (report.updated.length > 0) {
        lines.push(`**Mis a jour (${report.updated.length}):**`);
        lines.push(...report.updated.slice(0, 15).map(l => `  ~ ${l}`));
        if (report.updated.length > 15) lines.push(`  *... et ${report.updated.length - 15} de plus*`);
    }
    if (report.skipped.length > 0) {
        lines.push(`**Ignores (${report.skipped.length}):**`);
        lines.push(...report.skipped.slice(0, 5).map(l => `  ! ${l}`));
    }
    if (report.deleted && report.deleted.length > 0) {
        lines.push(`**Supprimes (${report.deleted.length}):**`);
        lines.push(...report.deleted.slice(0, 15).map(l => `  - ${l}`));
        if (report.deleted.length > 15) lines.push(`  *... et ${report.deleted.length - 15} de plus*`);
    }
    if (report.errors.length > 0) {
        lines.push(`**Erreurs (${report.errors.length}):**`);
        lines.push(...report.errors.slice(0, 10).map(l => `  x ${l}`));
        if (report.errors.length > 10) lines.push(`  *... et ${report.errors.length - 10} autres*`);
    }
    return lines.join('\n') || '*(aucune modification)*';
}

module.exports = { applyBlueprint, previewBlueprint, formatReport };
