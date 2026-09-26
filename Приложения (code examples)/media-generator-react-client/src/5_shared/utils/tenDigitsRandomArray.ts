export const getTenDigitsRandomArray = (): Array<number> =>
    Array.from({ length: 10 }, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)