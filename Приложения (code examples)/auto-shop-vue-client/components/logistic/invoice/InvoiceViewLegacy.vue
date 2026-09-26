<template>
  <div>
    <div :class="$style.header">
      <div :class="$style.titleRow">
        <CommonBackButton :to="{ name: 'personal-logistic-id-invoice', params: { id: orderId } }" />
        <div>
          <h1 :class="$style.title">
            {{ t('logistic.invoice.title') }}
          </h1>
        </div>
      </div>
      <div :class="$style.actions">
        <Button
          v-if="canEditInvoice"
          kind="white"
          :class="$style.actionButton"
          @click="goToEdit"
        >
          {{ t('logistic.invoice.edit_invoice') }}
        </Button>
        <Button
          kind="black"
          :disabled="!invoice || !isPdfReady || isDownloadingPdf"
          :class="[$style.actionButton, $style.downloadButton]"
          @click="$emit('download-pdf')"
        >
          <Spinner v-if="isPdfGenerating" />
          <ArrowDownTrayIcon
            v-else-if="!isDownloadingPdf"
            :class="$style.buttonIcon"
          />
          {{ downloadPdfButtonLabel }}
        </Button>
        <Button
          v-if="canDownloadExcel"
          kind="black"
          :disabled="!invoice || !isExcelReady || isDownloadingExcel"
          :class="[$style.actionButton, $style.downloadButton]"
          @click="$emit('download-excel')"
        >
          <Spinner v-if="isExcelGenerating" />
          <ArrowDownTrayIcon
            v-else-if="!isDownloadingExcel"
            :class="$style.buttonIcon"
          />
          {{ downloadExcelButtonLabel }}
        </Button>
        <Button
          kind="black"
          :disabled="!invoice"
          :class="$style.actionButton"
          @click="goToLogistics"
        >
          {{ t('logistic.invoice.go_to_logistics') }}
        </Button>
      </div>
    </div>

    <div
      v-if="isPdfGenerating"
      :class="$style.pdfStatus"
    >
      <Spinner />
      {{ t('logistic.invoice.pdf_generating') }}
    </div>
    <div
      v-else-if="isPdfFailed"
      :class="[$style.pdfStatus, $style.pdfStatusError]"
    >
      {{ t('logistic.invoice.pdf_failed') }}
    </div>
    <div
      v-else-if="invoice && !isPdfReady"
      :class="$style.pdfStatus"
    >
      {{ t('logistic.invoice.pdf_not_ready') }}
    </div>
    <div
      v-if="canDownloadExcel && isExcelGenerating"
      :class="$style.pdfStatus"
    >
      <Spinner />
      {{ t('logistic.invoice.excel_generating') }}
    </div>
    <div
      v-else-if="canDownloadExcel && isExcelFailed"
      :class="[$style.pdfStatus, $style.pdfStatusError]"
    >
      {{ t('logistic.invoice.excel_failed') }}
    </div>
    <div
      v-else-if="canDownloadExcel && invoice && !isExcelReady"
      :class="$style.pdfStatus"
    >
      {{ t('logistic.invoice.excel_not_ready') }}
    </div>

    <div :class="$style.wrapper">
      <div :class="$style.container">
        <div
          v-if="invoice"
          :class="$style.invoicePreview"
        >
          <div :class="$style.contractRoot">
            <div :class="$style.docHeader">
              <p :class="$style.companyName">
                DEMO AUTOMOTIVE SERVICE CO., LTD
              </p>
              <p :class="$style.companyNameChinese">
                示例汽车服务有限公司
              </p>
              <p :class="$style.companyAddress">
                ROOM 1, DEMO BUILDING, EXAMPLE STREET,<br>
                DEMO PROVINCE, CHINA
              </p>
              <h2 :class="$style.contractTitle">
                SALES CONTRACT / 销售合同 / КОНТРАКТ
              </h2>
            </div>

            <div :class="$style.section">
              <div :class="$style.row">
                <div :class="$style.col12">
                  <p><strong>No. 编号/Номер контракта:</strong> <span :class="$style.dynamicData">{{ invoice.invoiceNumber }}</span></p>
                </div>
              </div>

              <div :class="$style.row">
                <div :class="$style.col12">
                  <p><strong>Terms 贸易术语/Условия поставки:</strong> <span :class="$style.dynamicData">{{ port?.terms }}</span></p>
                </div>
              </div>
              <div :class="$style.row">
                <div :class="$style.col12">
                  <p><strong>Date 日期/Дата:</strong> <span :class="$style.dynamicData">{{ invoice.invoiceDate }}</span></p>
                </div>
              </div>
              <div :class="$style.row">
                <div :class="$style.col12">
                  <p><strong>TO 买方/Покупатель:</strong> <span :class="$style.dynamicData">{{ invoice.payerFullname }}</span></p>
                </div>
              </div>
              <div :class="$style.row">
                <div :class="$style.col12">
                  <p><strong>Trading Country 贸易国/Страна торговли:</strong> Russia 俄罗斯/Россия</p>
                </div>
              </div>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                This contract is made by and between the buyer and seller. Whereby the buyer agrees to buy and seller agree to sell the under- mentioned goods according to the terms and conditions stipulated below:
              </p>
              <p :class="$style.sectionText">
                本合同由买卖双方签订。在此，买方同意按下列条款购买，卖方同意出售下列货物 :
              </p>
              <p :class="$style.sectionText">
                Настоящий договор заключен между Покупателем и Продавцом . Согласно договору, Покупатель соглашается купить, а Продавец соглашается продать нижеприведенные товары на следующих условиях:
              </p>
            </div>

            <div :class="$style.tableScroll">
              <table :class="$style.goodsTable">
                <thead>
                  <tr>
                    <th width="15%">
                      Brand<br>品牌<br>Марка
                    </th>
                    <th width="40%">
                      Descriptions 描述 Описание
                    </th>
                    <th width="10%">
                      Quantity<br>数量<br>Кол-во
                    </th>
                    <th width="17%">
                      Unit price 单价<br>Цена за единицу<br>(CNY)
                    </th>
                    <th width="18%">
                      Amount 总价<br>Стоимость<br>(CNY)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="center">
                      <span :class="$style.dynamicData">{{ invoice.car }}</span>
                      <br><br>
                      <span :class="$style.dynamicData">{{ invoice.carRu }}</span>
                    </td>
                    <td>
                      产品信息 Used vehicle information<br>
                      VIN: <span :class="$style.dynamicData">{{ invoice.vin }}</span><br>
                      HS: 870323
                    </td>
                    <td class="center">
                      1
                    </td>
                    <td class="center">
                      <span :class="$style.dynamicData">CNY {{ formatPriceWithOptionalDecimals(invoice.invoiceSumCny) }}</span>
                    </td>
                    <td class="center">
                      <span :class="$style.dynamicData">CNY {{ formatPriceWithOptionalDecimals(invoice.invoiceSumCny) }}</span>
                    </td>
                  </tr>
                  <tr :class="$style.totalRow">
                    <td
                      colspan="4"
                      class="right"
                    >
                      <strong>TOTAL 合计 ИТОГО:</strong>
                    </td>
                    <td class="center">
                      <span :class="$style.dynamicData"><strong>{{ formatPriceWithOptionalDecimals(invoice.invoiceSumCny) }} CNY</strong></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Shipping time:</strong> Normally, 30 days after the completion of the goods according to shipping lines arrangement.<br>
                <strong>装运时间:</strong> 按照航线安排，一般情况下，货物完成后 30 天。<br>
                <strong>Срок поставки:</strong> В течение 30 дней после оплаты товара, в соответствии с условиями доставки .
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Purpose of goods:</strong> Usage<br>
                <strong>货物用途：</strong>个人使用。<br>
                <strong>Назначение товара:</strong> Для личного пользования .
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Payment terms:</strong> Departure after buyer pays.<br>
                <strong>买方付款后发货。</strong><br>
                <strong>Условия оплаты:</strong> Отправка после оплаты покупателем .
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Packing:</strong> According to Manufacturer's export packing standards.<br>
                <strong>包装:</strong>按照制造商的出口包装标准。<br>
                <strong>Упаковка:</strong> В соответствии со стандартами экспортной упаковки производителя .
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Port of loading:</strong> <span :class="$style.dynamicData">{{ port?.loadingEn }}</span><br>
                <strong>装运港：</strong><span :class="$style.dynamicData">{{ port?.loadingZh }}</span><br>
                <strong>Порт отгрузки:</strong> <span :class="$style.dynamicData">{{ port?.loadingRu }}</span>
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Port of destination:</strong> <span :class="$style.dynamicData">{{ port?.destinationEn }}</span><br>
                <strong>目的港：</strong><span :class="$style.dynamicData">{{ port?.destinationZh }}</span><br>
                <strong>Порт назначения: </strong><span :class="$style.dynamicData">{{ port?.destinationRu }}</span>
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Inspection:</strong> Factory Inspection according to the People's Republic of China ("PRC") national standards for production.<br>
                <strong>检验:</strong>工厂检验按中华人民共和国（中国） 国家标准进行生产。<br>
                <strong>Инспекция:</strong> Заводская инспекция в соответствии с национальными стандартами производства Китайской Народной Республики («КНР»).
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Insurance:</strong> The party who shall bear the insurance feet according to the international trade term adopted in this contract shall handle the insurance matters promptly.<br>
                <strong>保险:</strong>按照本合同所采用的国际贸易术语承担保险责任的一方应及时处理保险事宜。<br>
                <strong>Страхование:</strong> Сторона, которая должна нести страховую ответственность в соответствии с условиями международной торговли, используемыми в настоящем договоре, обязана своевременно решать вопросы страхования .
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Force Majeure:</strong> The seller shall not be held responsible if they owing to Force Majeure cause or causes , fail to make delivery within the time stipulated in the Contract or cannot deliver the goods. The two parties shall decide by negotiation whether to terminate this contract, whether to give partial immunity in the performance of this contract, and/or whether to extend the performance of this contract.<br>
                <strong>不可抗力:</strong>卖方负责如 因不可抗力原因不能在合同规定期限内交货或不能交货 , 概不负责。双方协商决定是否终止本合同，是否 在履行本合同义务时给予对方部分豁免， 以及/或是否延期履行。<br>
                <strong>Форс-мажор:</strong> Продавец не несет ответственности, если он из-за форс-мажорных обстоятельств или иных причин не может осуществить поставку в течение срока, предусмотренного в договоре, или не может доставить товар . Стороны решают путем переговоров, следует ли расторгнуть настоящий договор, предоставить ли друг другу частичное освобождение при выполнении этого контракта и/или отложить ли выполнение.
              </p>
            </div>

            <div :class="$style.section">
              <p :class="$style.sectionText">
                <strong>Arbitration:</strong> All disputes in connection with this contract or the execution thereof shall be settled amicably by negotiation. In case no settlement can be reached, the case shall then be submitted to the China International Economic Trade Arbitration Commission for settlement by arbitration in accordance with the arbitration rules of the commission. The award of the arbitration commission is final and binding on both parties. The arbitration fee shall be borne by the losing party unless otherwise awarded.<br>
                <strong>仲裁:</strong>凡因执行本合同或与本合同有关事项所发生的一切争执，双方应友好协商解决。协商不成时， 应提 交 中国国际经济贸易仲裁委员会， 根据该会的仲裁规则进行仲裁。仲裁委员会的裁决是终局的，对双 方均有 约束力。仲裁费用除另有规定外，均由败诉一方负担。<br>
                <strong>Арбитраж:</strong> Все споры, связанные с настоящим договором или его исполнением, должны разрешаться мирным путем в ходе переговоров . В случае, если урегулирование не может быть достигнуто, дело передается в Китайскую Международную экономическую и торговую арбитражную комиссию для урегулирования спора в арбитражном порядке в соответствии с арбитражными правилами комиссии. Решение арбитражной комиссии является окончательным и обязательным для обеих сторон. Арбитражный сбор несет проигравшая сторона, если иное не присуждено.
              </p>
            </div>

            <div :class="$style.signatureBlock">
              <div :class="$style.signatureRow">
                <div :class="$style.signatureCell">
                  <strong>THE SELLER / 卖方 / Продавец:</strong><br>
                  示例汽车服务有限公司<br>
                  DEMO AUTOMOTIVE SERVICE<br>
                  CO., LTD<br>
                  <img
                    src="/stamp.png"
                    alt="Company Stamp"
                    :class="$style.stampImage"
                  >
                </div>
                <div :class="$style.signatureCell">
                  <strong>THE BUYER / 买方 / Покупатель:</strong><br>
                  <span :class="$style.dynamicData">{{ invoice.payerFullname }}</span>
                  <span :class="$style.dynamicData">{{ invoice.payerAddress }}</span><br>
                  <strong>护照/Passport/Пасспорт:</strong> <span :class="$style.dynamicData">{{ displayedPassportNumber }}</span><br>
                  <strong>签名 / Signature / Подпись:</strong>
                  <div :class="$style.signatureLine" />
                </div>
              </div>
            </div>

            <div
              :class="$style.section"
              style="margin-top: 30px;"
            >
              <p><strong>4. BANK INFORMATION:</strong></p>
            </div>
            <div :class="$style.bankInfoBox">
              <p><strong>For Crossborder RMB Remittance</strong></p>
              <p><strong>Получатель:</strong> Chengdu Demo Automotive Service Co., Ltd</p>
              <p><strong>Адрес получателя:</strong> Demo Office, Example Road, Demo City</p>
              <p><strong>Счет получателя / IBAN:</strong> 00000000000000000000</p>
              <p><strong>BIC / IFSC / MFO код банка получателя:</strong> DEMOBANKXXX</p>
              <p><strong>Банк получателя:</strong> DEMO BANK BRANCH</p>
              <p><strong>CNAPS код банка получателя:</strong> CN000000000000</p>
              <p><strong>Банк-корреспондент:</strong> DEMO BANK, DEMOCODE</p>
            </div>
          </div>

          <div :class="$style.pageBreak" />

          <div :class="$style.invoiceRoot">
            <div :class="$style.invoiceHeader">
              <p :class="$style.companyName">
                DEMO AUTOMOTIVE SERVICE CO., LTD
              </p>
              <h2 :class="$style.invoiceTitle">
                PROFORMA INVOICE / ИНВОЙС
              </h2>
            </div>

            <div :class="$style.tableScroll">
              <div :class="$style.invoiceInfoGrid">
                <div :class="$style.invoiceInfoRow">
                  <div :class="$style.invoiceInfoCell">
                    <span :class="$style.label">Sold To / Покупатель:</span><br>
                    <span :class="$style.dynamicData">{{ invoice.payerFullname }}</span>
                  </div>
                  <div :class="$style.invoiceInfoCell">
                    <span :class="$style.label">Date / Дата:</span><br>
                    <span :class="$style.dynamicData">{{ invoice.invoiceDate }}</span>
                  </div>
                </div>
                <div :class="$style.invoiceInfoRow">
                  <div :class="$style.invoiceInfoCell" />
                  <div :class="$style.invoiceInfoCell">
                    <span :class="$style.label">PI No / Номер:</span><br>
                    <span :class="$style.dynamicData">{{ invoice.invoiceNumber }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div :class="$style.tableScroll">
              <table :class="$style.invoiceTable">
                <thead>
                  <tr>
                    <th width="8%">
                      Item /<br>Номер
                    </th>
                    <th width="15%">
                      Product /<br>Товар
                    </th>
                    <th width="40%">
                      Description /<br>Наименование
                    </th>
                    <th width="17%">
                      Unit Price (CNY)/<br>Стоимость за единицу
                    </th>
                    <th width="10%">
                      Qty. /<br>Кол-во
                    </th>
                    <th width="10%">
                      Amount /<br>Стоимость (CNY)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="center">
                      1
                    </td>
                    <td class="center">
                      CAR
                    </td>
                    <td>
                      产品信息 Used vehicle information<br>
                      VIN: <span :class="$style.dynamicData">{{ invoice.vin }}</span><br>
                      HS: 870323
                    </td>
                    <td class="center">
                      <span :class="$style.dynamicData">{{ formatPriceWithOptionalDecimals(invoice.invoiceSumCny) }}</span>
                    </td>
                    <td class="center">
                      1
                    </td>
                    <td class="center">
                      <span :class="$style.dynamicData">{{ formatPriceWithOptionalDecimals(invoice.invoiceSumCny) }}</span>
                    </td>
                  </tr>
                  <tr :class="$style.totalRow">
                    <td
                      colspan="5"
                      class="right"
                    >
                      <strong>Total / ИТОГО:</strong>
                    </td>
                    <td class="center">
                      <span :class="$style.dynamicData"><strong>{{ formatPriceWithOptionalDecimals(invoice.invoiceSumCny) }}</strong></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div :class="$style.section">
              <p><strong>Remarks / Примечание:</strong></p>
            </div>

            <div :class="$style.section">
              <p><strong>Total amount / Итоговая сумма:</strong> <span :class="$style.dynamicData">¥{{ formatPriceWithOptionalDecimals(invoice.invoiceSumCny) }}</span></p>
            </div>

            <div :class="$style.section">
              <p><strong>Payment term:</strong> 100% before shipping / <strong>Отправка товара после 100% оплаты</strong></p>
            </div>

            <div :class="$style.bankInfoBox">
              <p><strong>For Crossborder RMB Remittance</strong></p>
              <p><strong>Получатель:</strong> Chengdu Demo Automotive Service Co., Ltd</p>
              <p><strong>Адрес получателя:</strong> Demo Office, Example Road, Demo City</p>
              <p><strong>Счет получателя / IBAN:</strong> 00000000000000000000</p>
              <p><strong>BIC / IFSC / MFO код банка получателя:</strong> DEMOBANKXXX</p>
              <p><strong>Банк получателя:</strong> DEMO BANK BRANCH</p>
              <p><strong>CNAPS код банка получателя:</strong> CN000000000000</p>
              <p><strong>Банк-корреспондент:</strong> DEMO BANK, DEMOCODE</p>
            </div>

            <div :class="$style.signatureBlock">
              <div :class="$style.signatureCell">
                <strong>The Seller:</strong><br>
                DEMO AUTOMOTIVE SERVICE CO., LTD
                <img
                  src="/stamp.png"
                  alt="Company Stamp"
                  :class="$style.stampImage"
                >
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          :class="$style.noInvoice"
        >
          <p>{{ t('logistic.invoice.no_invoice_generated') }}</p>
          <Button
            kind="black"
            @click="goToEdit"
          >
            {{ t('logistic.invoice.create_invoice') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { ArrowDownTrayIcon } from "@heroicons/vue/24/solid"
import Button from "@/components/common/Button.vue"
import Spinner from "@/components/icon/Spinner.vue"
import type { InvoiceExcelStatus, InvoicePdfStatus, InvoiceType } from "@/types/responses/invoice"
import { useMoney } from "~/composables/useMoney"

const props = defineProps<{
  invoice: InvoiceType | null
  canEditInvoice?: boolean
  canDownloadExcel?: boolean
  pdfStatus?: InvoicePdfStatus | null
  isPdfReady?: boolean
  isPdfGenerating?: boolean
  isPdfFailed?: boolean
  isDownloadingPdf?: boolean
  excelStatus?: InvoiceExcelStatus | null
  isExcelReady?: boolean
  isExcelGenerating?: boolean
  isExcelFailed?: boolean
  isDownloadingExcel?: boolean
}>()

defineEmits<{
  "download-pdf": []
  "download-excel": []
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => Number(route.params.id))
const { formatPriceWithOptionalDecimals } = useMoney()
const invoice = computed(() => props.invoice)

const downloadPdfButtonLabel = computed(() => {
  if (props.isDownloadingPdf) {
    return t("logistic.invoice.pdf_downloading")
  }
  if (props.isPdfGenerating) {
    return t("logistic.invoice.pdf_generating")
  }
  if (props.isPdfFailed) {
    return t("logistic.invoice.pdf_failed")
  }
  return t("logistic.invoice.download_pdf")
})

const downloadExcelButtonLabel = computed(() => {
  if (props.isDownloadingExcel) {
    return t("logistic.invoice.excel_downloading")
  }
  if (props.isExcelGenerating) {
    return t("logistic.invoice.excel_generating")
  }
  if (props.isExcelFailed) {
    return t("logistic.invoice.excel_failed")
  }
  return t("logistic.invoice.download_excel")
})

const port = computed(() => invoice.value?.port)
const displayedPassportNumber = computed(() => {
  const passportNumber = invoice.value?.passportNumber
  if (!passportNumber) {
    return passportNumber
  }

  const normalizedPassportNumber = passportNumber.replace(/\s/g, "")
  return /^\d{10}$/.test(normalizedPassportNumber)
    ? normalizedPassportNumber.replace(/^(\d{4})(\d{6})$/, "$1 $2")
    : passportNumber
})

function goToEdit() {
  router.push({
    name: "personal-logistic-id-invoice",
    params: { id: orderId.value },
  })
}

function goToLogistics() {
  router.push({
    name: "personal-logistic-tracking-id",
    params: { id: orderId.value },
  })
}
</script>

<style module>
.header {
  @apply flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6;
}

.titleRow {
  @apply flex items-center gap-3;
}

.title {
  @apply text-2xl sm:text-3xl font-bold leading-tight;
}

.actions {
  @apply flex flex-col sm:flex-row gap-3 w-full sm:w-auto;
}

.pdfStatus {
  @apply mb-4 flex items-center gap-2 text-sm text-gray-600;
}

.pdfStatusError {
  @apply text-red-600;
}

.actionButton {
  @apply w-full sm:w-auto justify-center;
}

.downloadButton {
  @apply inline-flex items-center gap-2;
}

.buttonIcon {
  @apply w-4 h-4 flex-shrink-0;
}

.wrapper {
  @apply flex justify-center;
}

.container {
  @apply w-full max-w-5xl;
}

.invoicePreview {
  @apply bg-white rounded-lg border border-gray-200 p-4 sm:p-8 overflow-hidden;
}

.contractRoot, .invoiceRoot {
  @apply mb-8 font-sans text-sm leading-relaxed;
}

.pageBreak {
  @apply my-12 border-t-2 border-gray-300;
}

.docHeader, .invoiceHeader {
  @apply text-center mb-8;
}

.companyName {
  @apply font-bold text-base mb-2;
}

.companyNameChinese {
  @apply text-sm mb-2;
}

.companyAddress {
  @apply text-xs mb-4 whitespace-normal;
}

.contractTitle, .invoiceTitle {
  @apply text-lg font-bold mb-0 leading-tight mt-4;
}

.tableScroll {
  @apply w-full overflow-x-auto mb-6;
  -webkit-overflow-scrolling: touch;
}

.section {
  @apply mb-4;
}

.sectionText {
  @apply text-xs leading-relaxed mb-2 text-justify;
}

.goodsTable, .invoiceTable {
  @apply w-full border-collapse border border-gray-400 mb-4 min-w-[600px];
}

.goodsTable th, .invoiceTable th {
  @apply bg-gray-100 border border-gray-400 p-2 font-bold text-center text-xs;
}

.goodsTable td, .invoiceTable td {
  @apply border border-gray-400 p-2 text-xs;
}

.goodsTable td.center, .invoiceTable td.center {
  @apply text-center;
}

.goodsTable td.right, .invoiceTable td.right {
  @apply text-right;
}

.totalRow {
  @apply bg-gray-50 font-bold;
}

.valueGreen {
  @apply text-green-600 font-semibold;
}

.dynamicData {
  @apply text-red-600 font-normal;
}

.label {
  @apply font-semibold text-xs;
}

.invoiceInfoGrid {
  @apply border border-gray-300 min-w-[600px] mb-4;
}

.invoiceInfoRow {
  @apply flex border-b border-gray-300 last:border-b-0;
}

.invoiceInfoCell {
  @apply flex-1 border-r border-gray-300 last:border-r-0 p-3 text-sm;
}

.bankInfoBox {
  @apply border border-gray-300 p-4 text-xs leading-relaxed mb-4;
}

.bankInfoBox p {
  @apply mb-1;
}

.signatureBlock {
  @apply mt-8 pt-6 border-t border-gray-300;
}

.signatureRow {
  @apply flex flex-col sm:flex-row justify-between gap-8;
}

.signatureCell {
  @apply flex flex-col items-start gap-2 relative;
}

.signatureLine {
  @apply border-b border-black w-32 mt-16;
}

.stampImage {
  @apply w-64 h-auto mt-4 opacity-80;
}

.noInvoice {
  @apply flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200 p-4 text-center;
}

.noInvoice p {
  @apply text-gray-600 mb-4;
}

.row {
  @apply flex flex-wrap -mx-2;
}

.col6 {
  @apply w-full sm:w-1/2 px-2;
}

.col12 {
  @apply w-full px-2;
}
</style>
