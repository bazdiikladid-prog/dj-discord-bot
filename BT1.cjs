const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🤖 Arcadia Bot is active 24/7!');
});

app.listen(PORT, () => {
    console.log(`Web server is running on port ${PORT}`);
});
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ضع معرّفات الغرف الصوتية الأربع هنا
const VERIFICATION_VC_IDS = [
    "1505569518276186303", 
    "ID_TA3_ROUM_2",       
    "ID_TA3_ROUM_3",       
    "ID_TA3_ROUM_4"        
]; 

let currentConnection = null;
let activePlayer = null;

client.once('ready', () => {
    console.log(`Bot khadem b nejah: ${client.user.tag}`);
});

//  أمر الخروج !out للإدارة
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!out') {
        if (currentConnection) {
            try {
                if (activePlayer) activePlayer.stop(true);
                currentConnection.destroy();
                currentConnection = null;
                activePlayer = null;
                await message.reply('✅ تم إخراج البوت من الغرفة بنجاح!');
            } catch (e) {}
        } else {
            await message.reply('⚠️ البوت ليس متصلاً بأي غرفة صوتية حالياً!');
        }
    }
});

// 2. مراقبة حركة الأعضاء (إعادة الاتصال وبدء دورة جديدة نظيفة مع كل عضو جديد)
client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    if (member.user.bot) return;

    const newUserChannel = newState.channelId;
    const oldUserChannel = oldState.channelId;

    if (VERIFICATION_VC_IDS.includes(newUserChannel) && !VERIFICATION_VC_IDS.includes(oldUserChannel)) {
        console.log(`🎉 ${member.user.tag} دخل الغرفة -> إعادة الاتصال وبدء دورة جديدة!`);
        
        try {
            const embed = new EmbedBuilder()
                .setTitle("🚨 Welcome to the Server!")
                .setDescription("مرحباً بك! الرجاء انتظار الإدارة (Staff) لمنحك الرتبة...")
                .setColor(0x00FF00);
            await member.send({ embeds: [embed] });
        } catch (error) {}

        // تنفيذ فكرتك: إعادة الاتصال وتشغيل الدورة كاملة من البداية
        startFullAudioCycle(newState.channel);
    }

    if (VERIFICATION_VC_IDS.includes(oldUserChannel) && !VERIFICATION_VC_IDS.includes(newUserChannel)) {
        const channel = oldState.channel;
        if (channel) {
            const humanMembers = channel.members.filter(m => !m.user.bot);
            if (humanMembers.size === 0 && currentConnection) {
                try {
                    if (activePlayer) activePlayer.stop(true);
                    currentConnection.destroy();
                    currentConnection = null;
                    activePlayer = null;
                } catch (e) {}
            }
        }
    }
});

// دالة بدء الدورة الصوتية الكاملة
async function startFullAudioCycle(channel) {
    try {
        if (activePlayer) {
            activePlayer.stop(true);
            activePlayer = undefined;
        }

        if (currentConnection) {
            try { currentConnection.destroy(); } catch (e) {}
        }

        // مهلة قصيرة جداً لراحة خادم ديسكورد الصوتي بين الخروج والخول
        await new Promise(resolve => setTimeout(resolve, 500));

        currentConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        activePlayer = player;
        currentConnection.subscribe(player);

        const welcomeResource = createAudioResource("welcome.wav", { inlineVolume: true });
        player.play(welcomeResource);

        player.removeAllListeners(AudioPlayerStatus.Idle);
        player.once(AudioPlayerStatus.Idle, () => {
            if (!currentConnection || activePlayer !== player) return;
            playCleanLoop(player);
        });

    } catch (error) {
        activePlayer = null;
    }
}

// دالة حلقة موسيقى الانتظار الآمنة مع فاصل زمني لراحة الذاكرة
function playCleanLoop(player) {
    if (!currentConnection || activePlayer !== player) return;

    try {
        const waitingMusicResource = createAudioResource("waiting_music.mp3", { inlineVolume: true });
        player.play(waitingMusicResource);

        player.removeAllListeners(AudioPlayerStatus.Idle);
        player.once(AudioPlayerStatus.Idle, () => {
            setTimeout(() => {
                if (!currentConnection || activePlayer !== player) return;
                playCleanLoop(player);
            }, 1500); // فاصل زمني 1.5 ثانية لمنع أي تقطيع
        });

    } catch (e) {}
}


// حط التوكن متاعك هنا

client.login("MTU1NDUwMTg1NDAxOTE5NDg4MA.GhWiQ2.NK4ClfdMX5vIp5TAHQUFI8n5x6Mw3_5LAT_LrY");