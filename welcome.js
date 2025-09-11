const { Client, GatewayIntentBits,EmbedBuilder, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
  ],
});

client.invites = new Collection();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.guilds.cache.forEach(guild => {
        // Fetch the current invites for each guild when the bot starts
        guild.invites.fetch().then(invites => {
            invites.each(invite => {
                client.invites.set(invite.code, invite);
            });
        }).catch(error => {
            console.error(`Error fetching invites for guild ${guild.name}:`, error);
        });
    });
});

client.on('inviteCreate', (invite) => {
    // Update the invite cache when a new invite is created
    client.invites.set(invite.code, invite);
});

client.on('inviteDelete', (invite) => {
    // Remove the invite from the cache when it's deleted
    client.invites.delete(invite.code);
});

client.on('guildMemberAdd', async (member) => {
    try {
        // Fetch the latest invites when a member joins
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = client.invites;

        // Find the invite used by comparing the usage count
        const usedInvite = newInvites.find(i => i.uses > (oldInvites.get(i.code) ? oldInvites.get(i.code).uses : 0));

        if (!usedInvite) {
            console.log('Could not find the used invite.');
            return;
        }

        // Fetch the inviter's details
        const inviter = usedInvite.inviter;
        const userJoinDate = new Date(member.user.createdAt).toLocaleDateString();
        const serverJoinDate = new Date(member.joinedTimestamp).toLocaleDateString();

        // Create and send the welcome message
        const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'system'); // Replace 'system' with your channel name
        if (!welcomeChannel) {
            console.log('Welcome channel not found!');
            return;
        }

        const welcomeEmbed = new EmbedBuilder()
            .setTitle('Welcome to the Server!')
            .setDescription(`Hello <@${member.user.id}> | ${member.user.username} \n Welcome to Talent 7 Clan server 
             \n **Mod's View Reference Code**: ${inviter.id} (Invite Code: ${usedInvite.code})\n Discord Member Since: ${userJoinDate}\n Server Member Since: ${serverJoinDate}`)
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: `Member Count: ${member.guild.memberCount}` });

        welcomeChannel.send({ embeds: [welcomeEmbed] });

        // Update the invite cache to track the new invite usage
        client.invites.set(usedInvite.code, usedInvite);
    } catch (error) {
        console.error('Error handling member join:', error);
    }
});
