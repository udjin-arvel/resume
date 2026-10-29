import fakePaymentObject from "@/assets/fakePaymentObject.json";
import { v4 as uuid } from 'uuid';

const loadCloudPaymentsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        //@ts-ignore
        if (window.cp) {
            resolve();
            return;
        }
        const existing = document.querySelector('script[src="https://widget.cloudpayments.ru/bundles/cloudpayments.js"]');
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', reject);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
    });
};

const removeCloudPaymentsScript = () => {
    const script = document.querySelector('script[src="https://widget.cloudpayments.ru/bundles/cloudpayments.js"]');
    if (script) {
        script.remove();
    }
};

export const payFunction = async (
    amountRubles: number,
    amountTokens: number,
    testPayment: boolean = false,
    user: {id: number, email: string},
    onSuccess: (options: any) => void,
    onError: (reason: any, options: any) => void,
) => {
    await loadCloudPaymentsScript();
    const cp = (window as unknown as { cp: any }).cp;
    if (!cp) {
        return;
    }
    const invoiceId = `radar-${user.id}-${new Date()
        .toLocaleString('ru', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        })
        .replaceAll('.', '')
        .replaceAll(', ', '-')
        .replaceAll(':', '')}`;


    var widget = new cp.CloudPayments({
        language: 'ru-RU',
        email: user.email,
        tinkoffPaySupport: true,
        tinkoffInstallmentSupport: false,
        sberPaySupport: true,
    });
    const receiptFirstPayment = {
        Items: [
            //товарные позиции
            {
                label: 'Токены для генерации', //наименование товара
                price: amountRubles, //цена
                quantity: 1.0, //количество
                amount: amountRubles, //сумма
                vat: 20, //ставка НДС
                method: 0, // тег-1214 признак способа расчета - признак способа расчета
                object: 0, // тег-1212 признак предмета расчета - признак предмета товара, работы, услуги, платежа, выплаты, иного предмета расчета
            },
        ],
        email: user.email, //e-mail покупателя, если нужно отправить письмо с чеком
        phone: '', //телефон покупателя в любом формате, если нужно отправить сообщение со ссылкой на чек
        isBso: false, //чек является бланком строгой отчетности
        amounts: {
            electronic: amountRubles, // Сумма оплаты электронными деньгами
            advancePayment: 0.0, // Сумма из предоплаты (зачетом аванса) (2 знака после точки)
            credit: 0.0, // Сумма постоплатой(в кредит) (2 знака после точки)
            provision: 0.0, // Сумма оплаты встречным предоставлением (сертификаты, др. мат.ценности) (2 знака после точки)
        },
    };

    let data: any = {};
    data = {
        CloudPayments: {
            CustomerReceipt: receiptFirstPayment, //чек для первого платежа
        },
        tokens: amountTokens,
    }

    if (testPayment) {
        let fakeRequestObject = JSON.parse(JSON.stringify(fakePaymentObject))
        fakeRequestObject = {
            ...fakeRequestObject,
            TransactionId: uuid(),
            Amount: amountRubles,
            InvoiceId: invoiceId,
            PaymentAmount: amountRubles,
            AccountId: `radar-${user?.id}`,
            SubscriptionId: `sc_${invoiceId}`,
            Data: data,
            Email: user?.email,
            DateTime: new Date().toISOString(),
            Token: `tk_${invoiceId}`,
        }

        return;
    }
    await widget.charge(
        {
            // options
            publicId: 'pk_ccbb9998223e7fecb19a373264ce4', //id из личного кабинета
            description: 'Оплата подписки в Радар Аналитика', //назначение
            amount: amountRubles, //сумма
            currency: 'RUB', //валюта
            invoiceId: invoiceId, //номер заказа  (необязательно)
            email: user.email,
            accountId: `radar-${user.id}`, //идентификатор плательщика (обязательно для создания подписки)
            data: data,
        },
        function (options: any) {
            // success - действие при успешной оплате
            onSuccess(options);
            removeCloudPaymentsScript();
        },
        function (reason: any, options: any) {
            if (reason === 'User has cancelled') {
                removeCloudPaymentsScript();
                return;
            }
            // fail - действие при неуспешной оплате
            onError(reason, options);
        }
    );
};