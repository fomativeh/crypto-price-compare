const { Telegraf } = require("telegraf");
require("dotenv/config");
const coins = require("./coinNames");
const getPricesOnExchanges = require("./getPricesOnExchanges");
const bot = new Telegraf(process.env.BOT_TOKEN);
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello price checker.");
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

let userIsTyping = false;

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

const startBot = async (ctx)=>{
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
}

bot.start((ctx)=>startBot(ctx));

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
    "Alright send me a token name, i'll find its prices.\nIt must be a valid token name or symbol.\nExample: <b>Bitcoin</b> or <b>BTC</b> but not both written together.",
    { parse_mode: "HTML" }
  );
};

const handleManualCoinSearch = async (ctx, userInput) => {
  // if (ctx.message.text.trim() == "/check_coin") {
  //   return checkCoin(ctx);
  // }

  for (let key in coins) {
    if (
      userInput.toLowerCase() == key.toLowerCase() ||
      userInput.toLowerCase() == coins[key].toLowerCase()
    ) {
      return await showCoinPrices(ctx, key, coins[key]);
    }
  }

  // userIsTyping = false;
  return ctx.telegram.sendMessage(
    ctx.chat.id,
    "Invalid token name or symbol, or coin isn't available."
  );
};

bot.on("message", async (ctx) => {
  if (ctx.message.text.trim() == "" || ctx.message.text.trim() == null) {
    return;
  }

  // if (ctx.message.text.trim() !== "/check_coin" && !userIsTyping) {
  //   return ctx.telegram.sendMessage(
  //     ctx.chat.id,
  //     "To send me a coin to search, please use the command <b>/check_coin</b>",
  //     { parse_mode: "HTML" }
  //   );
  // }

  if (ctx.message.text.trim() == "/check_coin") {
    return checkCoin(ctx);
  }

  if (ctx.message.text.trim() == "/start") {
    return startBot(ctx);
  }

  if (ctx.message.text.trim() == "/check_list") {
    return showList(ctx);
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
    `Fetching prices for <b>${coinName} (${coinSymbol})</b>, please wait 🔴🔴🔴`,
    { parse_mode: "HTML" }
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

  const pricesData = await getPricesOnExchanges(coinName, coinSymbol, ctx);

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

// Launch bot function with retry mechanism
const launchBot = async () => {
  let retryCount = 0;
  const maxRetries = 20; // Maximum number of retries

  while (retryCount < maxRetries) {
    try {
      await bot.launch();
      console.log("Bot is running");
      break; // If bot launch is successful, exit the loop
    } catch (error) {
      console.error("Error launching bot:", error);
      retryCount++;
      console.log(
        `Retrying bot launch... (Attempt ${retryCount}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 5 seconds before retrying
    }
  }

  if (retryCount === maxRetries) {
    console.error("Failed to launch bot after maximum retries. Exiting...");
    process.exit(1); // Exit the process if bot launch fails after maximum retries
  }
};

// Call the launchBot function to start the bot
launchBot();
