const { ChatInputCommandInteraction, AttachmentBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { buildBlueprint, countChannels } = require("../../utils/blueprintBuilder");

module.exports = new ApplicationCommand({
    command: {
        name: 'fetch',
        description: 'Exporte la structure actuelle du serveur en blueprint JSON',
        type: 1,
        options: []
    },
    options: {
        cooldown: 10000
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un serveur.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;

            // Fetch toutes les données nécessaires en parallèle
            await Promise.all([
                guild.channels.fetch(),
                guild.roles.fetch(),
            ]);

            const blueprint = buildBlueprint(guild);

            // Sérialiser en JSON formaté
            const jsonString = JSON.stringify(blueprint, null, 2);

            // Si le JSON est trop long pour un message, on l'envoie en fichier
            if (jsonString.length > 1900) {
                const attachment = new AttachmentBuilder(
                    Buffer.from(jsonString, 'utf-8'),
                    { name: `blueprint-${guild.name.replace(/[^a-zA-Z0-9]/g, '_')}.json` }
                );

                await interaction.editReply({
                    content: `✅ **Blueprint exporté** — ${blueprint.roles.length} rôles, ${countChannels(blueprint)} salons, ${blueprint.categories.length} catégories`,
                    files: [attachment]
                });
            } else {
                await interaction.editReply({
                    content: `✅ **Blueprint exporté** :\n\`\`\`json\n${jsonString}\n\`\`\``
                });
            }

        } catch (err) {
            console.error('[fetch] Erreur :', err);
            await interaction.editReply({
                content: `❌ Erreur lors de l'export : ${err.message}`
            });
        }
    }
}).toJSON();
