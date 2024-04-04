const findHighestAndLowestPrices = require("./findHighestAndLowestPrices");
const formatToDollar = require("./formatToDollar");

const fetchWithRetry = async (url, retries = 3) => {
  try {
    const response = await fetch(url);
    return { status: response.status, data: await response.json() }; // Return status code and data if response is okay
  } catch (error) {
    if (retries === 0) {
      throw new Error(`Failed to fetch ${url}: ${error}`);
    }
    console.log(`Error fetching ${url}. Retrying...`);
    return await fetchWithRetry(url, retries - 1);
  }
};

const listCoin = (name, price) => {
  if (price == null) {
    return "";
  }
  return `${name} ${formatToDollar(price)}`;
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

const getPrices = async (coin, symbol) => {
  try {
    // Fetch from binance
    const binanceRes = await fetchWithRetry(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`
    );

    const binancePrice = setBinancePrice(binanceRes);

    // Fetch from bybit
    const byBitRes = await fetchWithRetry(
      `https://api.bybit.com/v2/public/tickers?symbol=${symbol.toUpperCase()}USD`
    );

    const byBitPrice = setBybitPrice(byBitRes);

    // Fetch from bitfinex
    const bitFinexRes = await fetchWithRetry(
      `https://api.bitfinex.com/v1/pubticker/${symbol.toLowerCase()}usd`
    );

    const bitFinexPrice = setBitfinexPrice(bitFinexRes);

    // Check if all prices are null
    const coinFoundInAnyExchange =
      binancePrice !== null ||
      byBitPrice !== null ||
      bitFinexPrice !== null;

    let telegramResString = "";
    if (coinFoundInAnyExchange) {
      telegramResString = `<b>Prices for ${coin.toUpperCase()} (${symbol.toUpperCase()})</b>\n\n`;
      telegramResString += listCoin("Binance:", binancePrice) + "\n\n";
      telegramResString += listCoin("Bybit:", byBitPrice) + "\n\n";
      telegramResString += listCoin("BitFinex:", bitFinexPrice) + "\n\n\n";
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
