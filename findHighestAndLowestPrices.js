const formatToDollar = require("./formatToDollar");

module.exports = findHighestAndLowest = (prices) => {
  // Check if the input array is empty
  if (prices.length === 0) {
    return { highest: null, lowest: null };
  }

  // Initialize variables to keep track of highest and lowest prices
  let highest = null;
  let lowest = null;
  let allNull = true; // Flag to track if all prices are null

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
        if (lowest === null || priceValue < lowest.value) {
          lowest = { exchange, value: priceValue };
        }
        allNull = false; // At least one valid price found
      }
    });
  });

  // If all prices are null, return appropriate message
  if (allNull) {
    return "" 
  }

  console.log(highest, lowest)
  // Return the highest and lowest prices
  return `<b>HIGHEST</b>\n${highest.exchange}: ${formatToDollar(highest.value)}\n\n<b>LOWEST</b>\n${lowest.exchange}: ${formatToDollar(lowest.value)}`
};
