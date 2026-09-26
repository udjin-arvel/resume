export type Stage = {
  key: string;
  label: string;
  detail: string;
  ms: number;
};

export const STAGES: Stage[] = [
  { key: "queued", label: "Заявка создана", detail: "AnalysisRequest сохранён в PostgreSQL", ms: 700 },
  { key: "parsing", label: "Парсинг сайта", detail: "Playwright headless + stealth, обход блокировок", ms: 2200 },
  { key: "extract", label: "Извлечение данных", detail: "title, meta, тексты, ссылки, контакты, цены", ms: 1600 },
  { key: "llm", label: "Анализ через DeepSeek", detail: "deepseek-chat, строгий JSON-ответ", ms: 2400 },
  { key: "done", label: "Отчёт готов", detail: "AnalysisResult записан, статус completed", ms: 600 },
];

export type Report = {
  url: string;
  host: string;
  title: string;
  description: string;
  industry: string;
  segment: string;
  summary: string;
  scores: { label: string; value: number }[];
  products: string[];
  keywords: string[];
  usp: string[];
  risks: { level: "high" | "medium" | "low"; text: string }[];
  contacts: { type: string; value: string }[];
  parsed: { label: string; value: string }[];
  raw: Record<string, unknown>;
};

export function buildMockReport(rawUrl: string): Report {
  let host = rawUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!host) host = "example.com";
  const brand = host.split(".")[0] ?? "site";
  const name = brand.charAt(0).toUpperCase() + brand.slice(1);

  return {
    url: rawUrl,
    host,
    title: `${name} — производство и монтаж под ключ`,
    description: `${name}: изготовление, доставка и монтаж по России. Гарантия 5 лет, расчёт за 15 минут.`,
    industry: "B2B производство / строительные услуги",
    segment: "Средний+ ценовой сегмент",
    summary:
      `Сайт представляет компанию «${name}», работающую в сегменте производства и монтажа под ключ. ` +
      "Основной оффер — полный цикл: замер, изготовление, установка с гарантией 5 лет. " +
      "Коммуникация построена вокруг скорости расчёта и надёжности, но отсутствуют прозрачные цены и кейсы, " +
      "что снижает конверсию холодного трафика. Контактные данные полные, есть офлайн-присутствие.",
    scores: [
      { label: "Полнота контента", value: 78 },
      { label: "Ясность оффера", value: 64 },
      { label: "Доверие / соцдоказательства", value: 41 },
      { label: "Прозрачность цен", value: 33 },
      { label: "SEO-готовность", value: 71 },
    ],
    products: [
      "Изготовление конструкций на заказ",
      "Замер и проектирование",
      "Монтаж под ключ",
      "Сервисное обслуживание",
      "Оптовые поставки для подрядчиков",
    ],
    keywords: [
      "под ключ",
      "производство",
      "монтаж",
      "гарантия 5 лет",
      "расчёт стоимости",
      "доставка по России",
      "опт",
      "замер бесплатно",
    ],
    usp: [
      "Собственное производство — без посредников",
      "Расчёт стоимости за 15 минут",
      "Гарантия 5 лет на монтаж",
      "Работа с юрлицами и по 44-ФЗ",
    ],
    risks: [
      { level: "high", text: "Нет цен и калькулятора — высокий отток на этапе выбора" },
      { level: "medium", text: "Отсутствуют отзывы и кейсы, нет соцдоказательств" },
      { level: "medium", text: "Формы без явной политики обработки данных" },
      { level: "low", text: "Медленная загрузка изображений на мобильных" },
    ],
    contacts: [
      { type: "Телефон", value: "+7 (495) 123-45-67" },
      { type: "E-mail", value: `sales@${host}` },
      { type: "Адрес", value: "г. Москва, ул. Промышленная, 14, стр. 2" },
      { type: "Мессенджеры", value: "Telegram, WhatsApp" },
    ],
    parsed: [
      { label: "Страниц обойдено", value: "14" },
      { label: "Текстовых блоков", value: "212" },
      { label: "Внутренних ссылок", value: "86" },
      { label: "Внешних ссылок", value: "9" },
      { label: "Найдено цен", value: "0" },
      { label: "Время парсинга", value: "6.4 c" },
    ],
    raw: {
      request_id: "a41f9c2e-7d31-4b8a-9f01-2c6d8e5b3a10",
      status: "completed",
      url: rawUrl,
      parsed: {
        title: `${name} — производство и монтаж под ключ`,
        emails: [`sales@${host}`],
        phones: ["+74951234567"],
        prices: [],
        headings: ["Производство под ключ", "Как мы работаем", "Оставить заявку"],
      },
      metrics: {
        industry: "B2B производство / строительные услуги",
        price_segment: "middle+",
        tone: "neutral-professional",
        confidence: 0.82,
      },
      model: "deepseek-chat",
      tokens: { prompt: 8421, completion: 1174 },
    },
  };
}
