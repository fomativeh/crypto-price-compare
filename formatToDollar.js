module.exports = formatToDollar = (value) => {
  if (value == null) return null;
  // Convert value to number
  const floatValue =
    typeof value === "string" ? parseFloat(value) : Number(value);

  // Check if value is a valid number
  if (isNaN(floatValue)) {
    return "Invalid number";
  }

  // Format the number with 2 decimal places and add dollar sign
  return (
    "$" +
    floatValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};
