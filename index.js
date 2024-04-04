const { Telegraf } = require("telegraf");
require("dotenv/config");
const coins = require("./coinNames");
const getPricesOnExchanges = require("./getPricesOnExchanges");
const bot = new Telegraf(process.env.BOT_TOKEN);
let userIsTyping = false

const listCoins = () => {
  let allCoins = [];
  for (let key in coins) {
    allCoins.push([
      {
        text: `${key} (${coins[key]})`,
        callback_data: `show_coin_prices:${key}:${coins[key]}`,
      },
    ]);
  }
  return allCoins;
};

bot.start(async (ctx) => {
  ctx.telegram.sendMessage(
    ctx.chat.id,
    "Hello there!👋\nWelcome to crypto price checker bot✨\nPlease select an option below.",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Select from a list of coins.",
              callback_data: "list_coins",
            },
          ],
          [
            {
              text: "Enter a coin to search.",
              callback_data: "custom_search",
            },
          ],
        ],
      },
    }
  );
});

const showList = (ctx) => {
  ctx.telegram.sendMessage(
    ctx.chat.id,
    "Here is a list of available coins.\nSelect one to view its price on several exchanges.",
    {
      reply_markup: {
        inline_keyboard: listCoins(),
      },
    }
  );
};

const checkCoin = (ctx) => {
  userIsTyping = true;
  ctx.telegram.sendMessage(
    ctx.chat.id,
    "Alright send me a valid token name, i'll find its prices.\nIt must be a valid token name or symbol.\nExample <b>Bitcoin</b> or <b>BTC</b>",
    { parse_mode: "HTML" }
  );
};

const handleManualCoinSearch = async (ctx, userInput) => {
  for (let key in coins) {
    if (userInput == key || userInput == coins[key]) {
      return await showCoinPrices(ctx, key, coins[key]);
    }
  }

  userIsTyping = false
  return ctx.telegram.sendMessage(
    ctx.chat.id,
    'Invalid token name or symbol, or coin isn\'t available.'
  );
};

bot.on("message", async (ctx) => {
  if (ctx.message.text.trim() == "" || ctx.message.text.trim() == null) {
    return;
  }

  if (ctx.message.text.trim() !== "/check_coin" && !userIsTyping) {
    return ctx.telegram.sendMessage(
      ctx.chat.id,
      'To send me a coin to search, please use the command <b>/check_coin</b> or click <b>"Enter a coin to search."</b>',
      { parse_mode: "HTML" }
    );
  }

  await handleManualCoinSearch(ctx, ctx.message.text.trim());
});

bot.command("check_list", (ctx) => showList(ctx));

bot.command("check_coin", (ctx) => checkCoin(ctx));

bot.action("custom_search", (ctx) => checkCoin(ctx));

bot.action("list_coins", (ctx) => showList(ctx));

// Handle action to show coin prices
bot.action(/^show_coin_prices:(.+):(.+)$/, async (ctx) => {
  const [, coinName, coinSymbol] = ctx.match; // Extract coin name and symbol

  // Call your function with the coin name and symbol
  await showCoinPrices(ctx, coinName, coinSymbol);
});

// Function to show coin prices
const showCoinPrices = async (ctx, coinName, coinSymbol) => {
  // Your implementation to show coin prices based on the name and symbol
  const message = await ctx.telegram.sendMessage(
    ctx.chat.id,
    "Fetching prices, please wait 🔴🔴🔴"
  );
  //   let loadingText = "Fetching prices, please wait ";
  //   let stopLoop = false;

  // Loop until stopLoop is set to true
  //   while (!stopLoop) {
  //     if (loadingText == "Fetching prices, please wait 🔴🔴🔴🔴") {
  //       loadingText = "Fetching prices, please wait 🔴";
  //     } else {
  //       loadingText += "🔴";
  //     }

  //     await new Promise((resolve) => setTimeout(resolve, 20)); // Delay for 1 second
  //     if (stopLoop) break;
  //   }

  const pricesData = await getPricesOnExchanges(coinName, coinSymbol);

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    message.message_id,
    null,
    pricesData,
    { parse_mode: "HTML" }
  );
};

// Set bot commands for Telegram
bot.telegram.setMyCommands([
  { command: "start", description: "Start the price-compare bot" },
  {
    command: "check_coin",
    description: "Enter a coin to check it's price",
  },
  {
    command: "check_list",
    description: "View list of coins",
  },
]);

bot.launch();
