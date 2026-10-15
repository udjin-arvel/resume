// import * as cfg from "./../cfg";

export function mapPriceToAttempts(priceId: string): number {
  switch (priceId) {
    case process.env.STRIPE_WEEKLY_ID:
      return 300; // +300 попыток, разово
    case process.env.STRIPE_MONTHLY_ID:
      return 200; // +200 попыток, разово
    case process.env.STRIPE_YEARLY_ID:
      return 70; // +70 попыток, разово
    default:
      return 0; // неизвестная цена — не даём попыток
  }
}
