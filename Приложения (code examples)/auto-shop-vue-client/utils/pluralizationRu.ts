export const pluralizationRu = (choice: number, _choicesLength: number) => {
  const absChoice = Math.abs(choice)
  const mod10 = absChoice % 10
  const mod100 = absChoice % 100

  if (mod10 === 1 && mod100 !== 11) {
    return 0
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return 1
  }
  return 2
}
