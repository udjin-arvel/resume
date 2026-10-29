import { Module, Global } from '@nestjs/common';
import { StripeModule } from '@golevelup/nestjs-stripe';

@Global()
@Module({
    imports: [
        StripeModule.forRoot({
            apiKey: process.env.STRIPE_SECRET_KEY,
            webhookConfig: {
                stripeSecrets: {
        		account:process.env.STRIPE_WEBHOOK_SECRET,
                        accountTest: process.env.STRIPE_WEBHOOK_SECRET
                },
            },
        }),
    ],
    exports: [StripeModule], // 🔑 Export it for any module to use
})
export class SharedStripeModule {}
