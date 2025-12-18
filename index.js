const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 Welcome to Sachiya Downloader Bot

📥 Send a YouTube or TikTok link
👇 Choose format using buttons`,
  );
});

// Store user links
const userLinks = {};

// When user sends a link
bot.on('message', (msg) => {
  if (!msg.text) return;
  if (!msg.text.startsWith('http')) return;

  const chatId = msg.chat.id;
  userLinks[chatId] = msg.text;

  bot.sendMessage(chatId, '👇 Select download type:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎥 Video', callback_data: 'video' },
          { text: '🎵 MP3', callback_data: 'mp3' }
        ],
        [
          { text: '❌ Cancel', callback_data: 'cancel' }
        ]
      ]
    }
  });
});

// Handle button clicks
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;
  const url = userLinks[chatId];

  if (action === 'cancel') {
    bot.sendMessage(chatId, '❌ Cancelled');
    return;
  }

  if (!url) {
    bot.sendMessage(chatId, '⚠️ Please send a link first');
    return;
  }

  // VIDEO
  if (action === 'video') {
    bot.sendMessage(chatId, '📥 Downloading video...');

    exec(`yt-dlp -f mp4 -o "%(title)s.%(ext)s" ${url}`, (err) => {
      if (err) {
        bot.sendMessage(chatId, '❌ Video download failed');
        return;
      }

      const file = fs.readdirSync('./').find(f => f.endsWith('.mp4'));
      if (file) {
        bot.sendVideo(chatId, file).then(() => fs.unlinkSync(file));
      }
    });
  }

  // MP3
  if (action === 'mp3') {
    bot.sendMessage(chatId, '🎵 Downloading MP3...');

    exec(`yt-dlp -x --audio-format mp3 -o "%(title)s.%(ext)s" ${url}`, (err) => {
      if (err) {
        bot.sendMessage(chatId, '❌ MP3 download failed');
        return;
      }

      const file = fs.readdirSync('./').find(f => f.endsWith('.mp3'));
      if (file) {
        bot.sendAudio(chatId, file).then(() => fs.unlinkSync(file));
      }
    });
  }
});
