const { ChatInputCommandInteraction, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { buildBlueprint, countChannels, stringifyToASCII } = require("../../utils/blueprintBuilder");
const { applyBlueprint, previewBlueprint, formatReport } = require("../../utils/serverBuilder");
const { validateBlueprint } = require("../../referentiel/blueprintSchema");
const { PermissionFlagsBits } = require("../../referentiel/permissions");
const { ChannelTypeAliases } = require("../../referentiel/channelTypes");
const ollama = require("ollama").default;

module.exports = new ApplicationCommand({
    command: {
        name: 'ollama',
        description: 'Modifie ou génère le blueprint du serveur via Ollama',
        type: 1,
        options: [
            {
                name: 'instruction',
                description: 'L\'instruction en français (ex: ajoute un salon images et un rôle...)',
                type: 3, // String
                required: true
            }
        ]
    },
    options: {
        cooldown: 15000 // Cooldown de 15 secondes pour les requêtes LLM
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un serveur.', ephemeral: true });
        }

        const instruction = interaction.options.getString('instruction', true);

        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;

            // 1. Détecter le modèle Ollama disponible
            let model = 'gemma4:e4b';
            try {
                const list = await ollama.list();
                if (list.models && list.models.length > 0) {
                    model = list.models[0].name;
                }
            } catch (err) {
                console.warn('[ollama] Impossible de lister les modèles localement, tentative d\'utilisation du modèle par défaut.', err);
            }

            // 2. Préparer les données de référence dynamiques
            const validPermissions = Object.keys(PermissionFlagsBits).join(", ");
            const validChannelTypes = Object.keys(ChannelTypeAliases).join(", ");

            // 3. Générer le blueprint actuel
            await Promise.all([
                guild.channels.fetch(),
                guild.roles.fetch(),
            ]);
            const currentBlueprint = cleanObjectEncoding(buildBlueprint(guild));

            // 4. Construire le prompt système
            const systemPrompt = `Tu es un assistant IA spécialisé dans la conception et la modification d'architectures de serveurs Discord.
Tu reçois en entrée le blueprint actuel d'un serveur Discord sous forme de JSON, ainsi qu'une instruction de modification en langage naturel.
Ton rôle est de générer le blueprint JSON final mis à jour selon l'instruction de l'utilisateur.

Voici les règles strictes de format et de validation à respecter :

1. SCHEMA DU BLUEPRINT :
Le JSON doit respecter la structure suivante :
- "serverName": string (nom du serveur, 2-100 caractères)
- "description": string (optionnel)
- "roles": tableau d'objets rôle :
  * "name": string (requis, unique)
  * "color": string (optionnel, ex: "#FF5733")
  * "hoist": boolean (optionnel, afficher séparément dans la sidebar)
  * "mentionable": boolean (optionnel)
  * "permissions": tableau de strings (noms de permissions)
- "everyoneConfig": objet (optionnel) :
  * "permissions": tableau de strings (permissions du rôle @everyone)
- "categories": tableau d'objets catégorie :
  * "name": string (requis)
  * "permissionOverwrites": tableau d'objets overwrite (optionnel)
  * "channels": tableau d'objets salon (requis)
- "standaloneChannels": tableau d'objets salon hors catégorie (optionnel)

Chaque objet salon ("channels" ou "standaloneChannels") :
- "name": string (requis, ex: "salon-de-test")
- "type": string (optionnel, défaut "text"). Valeurs autorisées : ${validChannelTypes}
- "topic": string (optionnel, sujet du salon)
- "nsfw": boolean (optionnel)
- "rateLimitPerUser": nombre en secondes (optionnel, 0 à 21600)
- "bitrate": nombre (optionnel, 8000 à 384000, pour salons vocaux/stage)
- "userLimit": nombre (optionnel, 0 à 99, pour salons vocaux/stage)
- "permissionOverwrites": tableau d'objets overwrite (optionnel)

Chaque objet overwrite ("permissionOverwrites") :
- "target": string (nom du rôle ciblé ou "@everyone")
- "allow": tableau de strings (permissions autorisées)
- "deny": tableau de strings (permissions refusées)

2. PERMISSIONS AUTORISÉES (sensible à la casse, utilise uniquement ces noms exacts) :
${validPermissions}

3. INSTRUCTIONS IMPORTANTES :
- Ne crée pas de nouvelles permissions. Utilise exclusivement celles listées ci-dessus.
- Ne crée pas de rôles en doublon (le nom des rôles doit être unique).
- Ne crée pas de types de salons non autorisés.
- Ne modifie que ce qui est demandé dans l'instruction de l'utilisateur, tout en conservant le reste de la structure existante.
- Retourne UNIQUEMENT le code JSON mis à jour dans le format demandé.
- Ne rajoute pas d'explication textuelle avant ou après le JSON.`;

            const userPrompt = `Voici le blueprint de serveur actuel :
\`\`\`json
${stringifyToASCII(currentBlueprint)}
\`\`\`

Instruction de modification :
${instruction}

Modifie le blueprint selon cette instruction et retourne le JSON résultant.`;

            // 5. Appeler Ollama
            await interaction.editReply({ content: `🤖 **Ollama** (${model}) est en train de réfléchir...` });

            const response = await ollama.chat({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                options: {
                    temperature: 0.1, // Température basse pour le respect du schéma
                    num_ctx: 32768    // Augmenter la taille du contexte pour les gros serveurs
                }
            });

            const content = response.message.content;

            // 6. Extraction et parsing du JSON
            let updatedBlueprint;
            try {
                const parsed = extractJSON(content);
                updatedBlueprint = cleanObjectEncoding(parsed);
            } catch (parseErr) {
                console.error('[ollama] Erreur de parsing JSON :', parseErr);
                const rawAttachment = new AttachmentBuilder(
                    Buffer.from(content, 'utf-8'),
                    { name: 'response-brute.txt' }
                );
                return interaction.editReply({
                    content: `❌ Le modèle a renvoyé un contenu qui n'a pas pu être parsé comme du JSON valide.`,
                    files: [rawAttachment]
                });
            }

            // 7. Validation du Blueprint
            const validation = validateBlueprint(updatedBlueprint);
            if (!validation.valid) {
                console.warn('[ollama] Le blueprint généré est invalide :', validation.errors);
                const invalidAttachment = new AttachmentBuilder(
                    Buffer.from(stringifyToASCII(updatedBlueprint), 'utf-8'),
                    { name: 'blueprint-invalide.json' }
                );
                return interaction.editReply({
                    content: `⚠️ **Blueprint généré mais invalide technique** :\n` +
                        `L'IA a généré un blueprint contenant des erreurs de validation :\n` +
                        validation.errors.map(err => `- \`${err}\``).slice(0, 10).join('\n') +
                        (validation.errors.length > 10 ? `\n*... et ${validation.errors.length - 10} autres erreurs.*` : '') +
                        `\n\nVous trouverez le blueprint erroné en pièce jointe pour débogage.`,
                    files: [invalidAttachment]
                });
            }

            // 8. Succès ! Demander confirmation avec un aperçu des changements
            const previewReport = previewBlueprint(guild, updatedBlueprint, interaction.channelId);
            const previewText = formatReport(previewReport);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_blueprint')
                    .setLabel('Confirmer et appliquer')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_blueprint')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Danger)
            );

            const message = await interaction.editReply({
                content: `✅ **Blueprint généré par Ollama** (${model}) !\n\n` +
                    `Voici l'aperçu des modifications qui seront apportées au serveur :\n` +
                    `${previewText}\n\n` +
                    `⚠️ **Attention** : L'application du blueprint va modifier l'architecture du serveur (suppression des anciens salons, création des nouveaux, etc.). Veuillez confirmer.`,
                components: [row]
            });

            // 9. Attendre la confirmation
            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000 // 1 minute pour confirmer
            });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: "Vous ne pouvez pas utiliser ces boutons.", ephemeral: true });
                }

                if (i.customId === 'cancel_blueprint') {
                    await i.update({ content: '❌ **Action annulée.** Le blueprint n\'a pas été appliqué.', components: [], files: [] });
                    collector.stop('cancelled');
                } else if (i.customId === 'confirm_blueprint') {
                    await i.update({ content: '⚙️ **Application du blueprint en cours...** Cela peut prendre un moment.', components: [], files: [] });
                    
                    try {
                        const report = await applyBlueprint(guild, updatedBlueprint, interaction.channelId);
                        const reportText = formatReport(report);
                        
                        await interaction.editReply({
                            content: `✅ **Blueprint appliqué avec succès !**\n\n${reportText}`
                        });
                    } catch (err) {
                        console.error('[ollama] Erreur lors de l\'application :', err);
                        await interaction.editReply({
                            content: `❌ **Erreur lors de l'application du blueprint :** ${err.message}`
                        });
                    }
                    collector.stop('applied');
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    interaction.editReply({ content: '⏳ **Délai expiré.** Action annulée.', components: [] }).catch(() => {});
                }
            });

        } catch (err) {
            console.error('[ollama] Erreur :', err);
            if (err.message && err.message.includes('fetch failed')) {
                await interaction.editReply({
                    content: `❌ Impossible de se connecter à Ollama (http://localhost:11434). Assurez-vous que l'application Ollama est démarrée localement.`
                });
            } else {
                await interaction.editReply({
                    content: `❌ Une erreur est survenue lors de l'exécution d'Ollama : ${err.message}`
                });
            }
        }
    }
}).toJSON();


function extractJSON(text) {
    const trimmed = text.trim();

    // 1. Essayer d'extraire le JSON en trouvant le premier '{' et le dernier '}'
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonCandidate = trimmed.substring(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(jsonCandidate);
        } catch (e) {
            // Si le parsing échoue, on continue avec les autres méthodes
        }
    }

    // 2. Chercher un bloc de code markdown ```json ... ```
    const matchJson = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
    if (matchJson) {
        return JSON.parse(matchJson[1].trim());
    }

    // 3. Chercher n'importe quel bloc de code ``` ... ```
    const matchCode = trimmed.match(/```\s*([\s\S]*?)\s*```/);
    if (matchCode) {
        return JSON.parse(matchCode[1].trim());
    }

    // 4. Essayer de parser le texte entier directement
    return JSON.parse(trimmed);
}

/**
 * Corrige récursivement le double-encodage UTF-8/Latin-1 pour toutes les chaînes d'un objet.
 *
 * @param {any} obj 
 * @returns {any}
 */
function cleanObjectEncoding(obj) {
    if (typeof obj === 'string') {
        return fixUtf8Encoding(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(cleanObjectEncoding);
    }
    if (obj !== null && typeof obj === 'object') {
        const cleaned = {};
        for (const key of Object.keys(obj)) {
            cleaned[key] = cleanObjectEncoding(obj[key]);
        }
        return cleaned;
    }
    return obj;
}

const WIN1252_TO_BYTE = {
    0x20AC: 0x80, // €
    0x201A: 0x82, // ‚
    0x0192: 0x83, // ƒ
    0x201E: 0x84, // „
    0x2026: 0x85, // …
    0x2020: 0x86, // †
    0x2021: 0x87, // ‡
    0x02C6: 0x88, // ˆ
    0x2030: 0x89, // ‰
    0x0160: 0x8A, // Š
    0x2039: 0x8B, // ‹
    0x0152: 0x8C, // Œ
    0x017D: 0x8E, // Ž
    0x2018: 0x91, // ‘
    0x2019: 0x92, // ’
    0x201C: 0x93, // “
    0x201D: 0x94, // ”
    0x2022: 0x95, // •
    0x2013: 0x96, // –
    0x2014: 0x97, // —
    0x02DC: 0x98, // ˜
    0x2122: 0x99, // ™
    0x0161: 0x9A, // š
    0x203A: 0x9B, // ›
    0x0153: 0x9C, // œ
    0x017E: 0x9E, // ž
    0x0178: 0x9F, // Ÿ
};

/**
 * Tente de corriger une chaîne de caractères mal décodée en UTF-8 (double-encodage).
 * Si la chaîne est déjà correcte (ex: contient des émojis ou caractères spéciaux valides), elle est retournée inchangée.
 *
 * @param {string} str 
 * @returns {string}
 */
function fixUtf8Encoding(str) {
    if (typeof str !== 'string') return str;

    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (WIN1252_TO_BYTE[code] !== undefined) {
            bytes.push(WIN1252_TO_BYTE[code]);
        } else if (code <= 255) {
            bytes.push(code);
        } else {
            // Contient un caractère non Windows-1252 (ex: un vrai émoji ou symbole correct).
            // On ne modifie pas cette chaîne pour éviter toute corruption.
            return str;
        }
    }

    try {
        const buf = Buffer.from(bytes);
        const decoded = buf.toString('utf-8');
        // Si le décodage produit une chaîne différente et ne contient pas de caractères de remplacement invalides ()
        if (decoded !== str && !decoded.includes('\uFFFD')) {
            return decoded;
        }
    } catch (e) {
        // En cas d'erreur de conversion, renvoyer la chaîne brute
    }
    return str;
}

