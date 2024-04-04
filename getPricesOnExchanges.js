const findHighestAndLowestPrices = require("./findHighestAndLowestPrices");
const formatToDollar = require("./formatToDollar");

const fetchWithRetry = async (url, retries) => {
  try {
    const response = await fetch(url);
    return { status: response.status, data: await response.json() }; // Return status code and data if response is okay
  } catch (error) {
    // Returns this during network fails and 20 retries
    if (retries === 0) {
      return { status: "failed" };
    }
    console.log(`Error fetching ${url}. Retrying...`);
    return await fetchWithRetry(url, retries - 1);
  }
};

const listCoin = (name, price) => {
  if (price == null) {
    return "";
  }
  return `${name} ${formatToDollar(price)}\n\n`;
};

const setBybitPrice = (res) => {
  if (res?.data?.result?.length == 0) {
    return null;
  } else {
    // console.log(res)
    return res?.data?.result[0]?.last_price;
  }
};

const setBinancePrice = (res) => {
  if (res?.data?.msg == "Invalid symbol.") {
    return null;
  } else {
    return res.data?.price;
  }
};

const setBitfinexPrice = (res) => {
  if (res?.data?.message == "Unknown symbol") {
    return null;
  } else {
    // console.log(res)
    return res.data.last_price;
  }
};

const getPrices = async (coin, symbol, ctx) => {
  try {
    // Fetch from binance
    const binanceRes = await fetchWithRetry(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`,
      20
    );
    if (binanceRes.status == "failed") {
      return "Network error, please try again later.";
    }

    const binancePrice = setBinancePrice(binanceRes);

    // Fetch from bybit
    const byBitRes = await fetchWithRetry(
      `https://api.bybit.com/v2/public/tickers?symbol=${symbol.toUpperCase()}USD`,
      20
    );

    if (byBitRes.status == "failed") {
      return "Network error, please try again later.";
    }

    const byBitPrice = setBybitPrice(byBitRes);

    // Fetch from bitfinex
    const bitFinexRes = await fetchWithRetry(
      `https://api.bitfinex.com/v1/pubticker/${symbol.toLowerCase()}usd`,
      20
    );

    if (bitFinexRes.status == "failed") {
      return "Network error, please try again later.";
    }

    const bitFinexPrice = setBitfinexPrice(bitFinexRes);

    // Check if all prices are null
    const coinFoundInAnyExchange =
      binancePrice !== null || byBitPrice !== null || bitFinexPrice !== null;

    let telegramResString = "";
    if (coinFoundInAnyExchange) {
      telegramResString = `<b>Prices for ${coin.toUpperCase()} (${symbol.toUpperCase()})</b>\n\n`;
      telegramResString += listCoin("Binance:", binancePrice) + "";
      telegramResString += listCoin("Bybit:", byBitPrice) + "";
      telegramResString += listCoin("BitFinex:", bitFinexPrice) + "";
      telegramResString += findHighestAndLowestPrices([
        { Binance: binancePrice },
        { Bybit: byBitPrice },
        { Bitfinex: bitFinexPrice },
      ]);
    } else {
      telegramResString = `<b>${coin} (${symbol})</b> isn't available on any exchange for now. Check again later.`;
    }

    return telegramResString;
  } catch (error) {
    throw new Error(`Failed to fetch prices: ${error}`);
  }
};

module.exports = getPrices;
