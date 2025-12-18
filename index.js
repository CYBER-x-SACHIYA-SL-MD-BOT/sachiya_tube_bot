const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `👋 Welcome to Downloader Bot!
Send any YouTube or TikTok link.
Commands:
/mp3 <YouTube link> - Download audio
`);
});

// MP3 Download
bot.onText(/\/mp3 (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  bot.sendMessage(chatId, '🎵 Downloading MP3...');

  exec(`yt-dlp -x --audio-format mp3 -o "%(title)s.%(ext)s" ${url}`, (err) => {
    if (err) {
      bot.sendMessage(chatId, '❌ Error downloading audio.');
      return;
    }

    // Find downloaded file
    const files = fs.readdirSync('./').filter(f => f.endsWith('.mp3'));
    if (files.length > 0) {
      const filePath = path.join('./', files[0]);
      bot.sendAudio(chatId, filePath).then(() => {
        fs.unlinkSync(filePath);
      });
    }
  });
});

// Video Download (MP4)
bot.on('message', (msg) => {
  if (!msg.text) return;
  if (msg.text.startsWith('http')) {
    const chatId = msg.chat.id;
    const url = msg.text;

    bot.sendMessage(chatId, '📥 Downloading video...');

    exec(`yt-dlp -f mp4 -o "%(title)s.%(ext)s" ${url}`, (err) => {
      if (err) {
        bot.sendMessage(chatId, '❌ Download failed.');
        return;
      }

      // Find downloaded file
      const files = fs.readdirSync('./').filter(f => f.endsWith('.mp4'));
      if (files.length > 0) {
        const filePath = path.join('./', files[0]);
        bot.sendVideo(chatId, filePath).then(() => {
          fs.unlinkSync(filePath);
        });
      }
    });
  }
});
