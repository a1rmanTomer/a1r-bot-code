import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('nick')
            .setDescription('Update nicknames of a role group')
            .addStringOption(option =>
                option.setName('role')
                    .setDescription('Role name to target')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('nickname')
                    .setDescription('New nickname to set')
                    .setRequired(true)
            )
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Refreshing application commands...');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log('Application commands registered successfully.');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'nick') {
        const roleName = options.getString('role');
        const newNickname = options.getString('nickname');

        try {
            const guild = interaction.guild;
            const role = guild.roles.cache.find(r => r.name === roleName);

            if (!role) {
                await interaction.reply(`Role "${roleName}" not found.`);
                return;
            }

            const members = await guild.members.fetch();
            const roleMembers = members.filter(member => member.roles.cache.has(role.id));

            roleMembers.forEach(async member => {
                if (!member.user.bot) { // Skip bots
                    try {
                        await member.setNickname(newNickname);
                        console.log(`Changed nickname for ${member.user.tag}`);
                    } catch (error) {
                        console.error(`Failed to change nickname for ${member.user.tag}:`, error);
                    }
                }
            });

            await interaction.reply(`Nicknames updated for role "${roleName}".`);
        } catch (error) {
            console.error('Error updating nicknames:', error);
            await interaction.reply('An error occurred while updating nicknames.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
