const formatToDollar = require("./formatToDollar");

module.exports = findHighestAndLowest = (prices) => {
  // Initialize variables to keep track of highest and lowest prices
  let highest = null;
  let lowest = null;
  let atLeastOneNonNull = false; // Flag to track if at least one price is not null

  // Iterate through each object in the array
  prices.forEach((priceObj) => {
    // Iterate through each key-value pair in the object
    Object.entries(priceObj).forEach(([exchange, priceString]) => {
      // Extract the numeric value from the price string
      const priceValue = priceString
        ? parseFloat(priceString.replace(/[^\d.]/g, ""))
        : null;
      // Check if the extracted price is a valid number
      if (!isNaN(priceValue)) {
        // Update highest and lowest prices if necessary
        if (highest === null || priceValue > highest.value) {
          highest = { exchange, value: priceValue };
        }
        if (
          priceValue !== null &&
          (lowest === null || priceValue < lowest.value)
        ) {
          lowest = { exchange, value: priceValue };
        }
        atLeastOneNonNull = true; // At least one valid price found
      }
    });
  });

  // If no non-null prices exist, return an empty string
  if (!atLeastOneNonNull) {
    return "";
  }

  if (highest.value == lowest.value) {
    return `\n<b>HIGHEST</b>\n${highest.exchange}: ${formatToDollar(
      highest.value
    )}`;
  }

  // Construct the return string
  let returnString = `\n<b>HIGHEST</b>\n${highest.exchange}: ${formatToDollar(
    highest.value
  )}`;

  // If lowest is not null, include it in the return string
  if (lowest !== null) {
    returnString += `\n\n<b>LOWEST</b>\n${lowest.exchange}: ${formatToDollar(
      lowest.value
    )}`;
  }

  return returnString;
};
