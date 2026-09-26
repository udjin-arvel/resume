// func that format any value to display (e.g, prices, percents...)
export const numberFormatter = (value: number | string | null | undefined, literal?: string, hasPlusSymbol: boolean = false, rounded: boolean = false): string => {
    // define a value to return
    let formattedPriceString = '0';
    // checking if value exists
    if (value !== undefined && value !== null) {
      //in case if value is a string
      let number = typeof value === 'number' ? value : parseFloat(value as string);
  
      if (rounded) {
        number = Math.round(number)
      }
      // checking that number is number
      if (Number.isNaN(number)) {
        if (literal) {
          formattedPriceString += ` ${literal}`;
        }
        return formattedPriceString;
      }
      // formatting the value
      formattedPriceString = number.toLocaleString('ru-RU', {
        maximumFractionDigits: 2,
      });
      // adding a literal (like "шт" or "₽") to the string
      if (literal) {
        formattedPriceString += ` ${literal}`;
      }
  
      if (hasPlusSymbol && number > 0) {
        formattedPriceString = `+${formattedPriceString}`;
      }
    }
    return formattedPriceString.replace(/\s/g, '\u00A0');
  };