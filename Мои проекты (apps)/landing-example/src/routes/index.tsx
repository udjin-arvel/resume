import { createFileRoute } from '@tanstack/react-router';
import { ArrowUpRight, ArrowDown, Globe2, Smartphone, Blocks, Code2, MoveUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import monolith from '@/assets/arvelov-monolith.jpg';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Arvelov — частная web-студия Евгения Арвелова' },
      { name: 'description', content: 'Сайты, web-приложения и мобильные продукты. От идеи до запуска — напрямую с Евгением Арвеловым. Личный арт-проект TheBook.' },
      { property: 'og:title', content: 'Arvelov — web и мобильная разработка' },
      { property: 'og:description', content: 'Частная web-студия Евгения Арвелова. Сайты, приложения и цифровые идеи, которые становятся реальностью.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Index,
});

const services = [
  { number: '01', title: 'Сайты', description: 'Лендинги, корпоративные сайты и интернет-магазины. Продуманный дизайн, быстрая загрузка и внимание к деталям.', icon: Globe2 },
  { number: '02', title: 'Web-приложения', description: 'Личные кабинеты, сервисы, платформы и внутренние инструменты. От небольшого MVP до полноценного продукта.', icon: Code2 },
  { number: '03', title: 'Мобильные приложения', description: 'Приложения для iOS и Android. Удобный интерфейс и нужные функции для ваших пользователей.', icon: Smartphone },
  { number: '04', title: 'Интеграции и автоматизация', description: 'API, боты, платежи и связь между сервисами. Всё, что избавляет от рутины и помогает вашему проекту работать.', icon: Blocks },
  { number: '05', title: 'Развитие и поддержка', description: 'Доработка существующих проектов, новый функционал и оптимизация. Помогу разобраться в текущем состоянии и двигаться дальше.', icon: MoveUpRight },
];

function Index() {
  return (
    <>
      <header className="site-header">
        <div className="site-width header-inner">
          <a href="#home" className="wordmark" aria-label="Arvelov — начало страницы">arvelov<span className="text-muted-foreground">.</span></a>
          <span className="studio-label">Независимая web-студия</span>
          <nav className="header-nav" aria-label="Навигация">
            <a className="nav-link" href="#services">Что я делаю</a>
            <a className="nav-link" href="#thebook">TheBook <ArrowUpRight className="inline size-3" /></a>
            <Button asChild variant="studioOutline"><a href="#contacts">Связаться <ArrowUpRight /></a></Button>
          </nav>
        </div>
      </header>
      <main>
        <section className="hero" id="home">
          <img src={monolith} alt="Скульптурный серебряный круг с диагональной линией" className="hero-image" width={1920} height={1024} fetchPriority="high" />
          <div className="site-width hero-content reveal">
            <div className="logo-mark" role="img" aria-label="Круглый логотип Arvelov">
              <svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M20 81 50 19 80 81M33 57h34" stroke="currentColor" strokeWidth="3" /><path d="m71 26-42 60" stroke="var(--background)" strokeWidth="5" /></svg>
            </div>
            <p className="eyebrow">Web-разработка & мобильные приложения</p>
            <h1>Arvelov<span className="text-muted-foreground">.</span></h1>
            <p className="hero-description"><strong>Привет, я Евгений.</strong><br />Превращаю идеи в сайты, сервисы<br className="hidden sm:block" /> и приложения. Лично. От начала до запуска.</p>
            <div className="hero-actions">
              <Button asChild variant="studio"><a href="#contacts">Обсудим ваш проект <ArrowUpRight /></a></Button>
              <a href="#services" className="nav-link inline-flex items-center gap-2">Что я делаю <ArrowDown className="size-3" /></a>
            </div>
          </div>
        </section>
        <div className="site-width hero-bottom">
          <span className="eyebrow"><i className="status-dot" /> Напрямую, без посредников</span>
          <a href="#services" className="eyebrow inline-flex items-center gap-3">От идеи к продукту <ArrowDown className="size-3" /></a>
        </div>
        <section id="services" className="section">
          <div className="site-width">
            <div className="section-heading">
              <span className="eyebrow">01 / Что я делаю</span>
              <div><h2>Если это digital —<br />это ко мне.</h2><p>Нужен сайт, сложный сервис или мобильное приложение? Подключусь на любом этапе: помогу с идеей, создам с нуля или доведу до ума то, что уже есть.</p></div>
            </div>
            <div>{services.map(({ number, title, description, icon: Icon }) => <article className="service-row" key={number}><span className="service-number">{number}</span><h3>{title}</h3><p>{description}</p><Icon className="service-icon" strokeWidth={1.3} /></article>)}</div>
          </div>
        </section>
        <section id="thebook" className="section book-section">
          <div className="site-width book-grid">
            <div className="book-stage" role="img" aria-label="Обложка авторского проекта TheBook">
              <div className="book"><div className="book-top"><span>ARVELOV</span><span>ЛИЧНЫЙ АРТ-ПРОЕКТ</span></div><div className="book-title">The<br />Book.</div><div className="book-symbol" /><div className="book-bottom">ИСТОРИЯ, ЧАСТЬЮ КОТОРОЙ<br />МОЖЕШЬ СТАТЬ ТЫ.</div></div>
            </div>
            <div className="book-copy">
              <span className="eyebrow">02 / За пределами разработки</span>
              <h2>TheBook<span className="text-muted-foreground">.</span></h2>
              <p className="book-intro">Мой личный арт-проект<br />в виде сайта-книги.</p>
              <p>Это web-книга (в будущем git-книга) нового формата. Если ты ищешь необычную вселенную, долгоиграющий интересный сюжет и запоминающихся персонажей, а также хочешь принять во всём этом участие, то добро пожаловать.</p>
              <a className="book-link" href="https://thebook.arvelov.online" target="_blank" rel="noopener noreferrer">Открыть TheBook <ArrowUpRight className="size-4" /></a>
            </div>
          </div>
        </section>
        <section id="contacts" className="section">
          <div className="site-width">
            <span className="eyebrow">03 / На связи</span>
            <div className="contacts-heading"><h2>Всё начинается<br />с диалога.</h2><p>Расскажите, что вы задумали.<br />Вместе мы найдём способ как это сделать.</p></div>
            <div>
              <a className="contact-row" href="https://t.me/arvelov" target="_blank" rel="noopener noreferrer"><span className="contact-label">TELEGRAM</span><span className="contact-value">@arvelov</span><ArrowUpRight strokeWidth={1.3} /></a>
              <a className="contact-row" href="mailto:udjin.arvel@gmail.com"><span className="contact-label">EMAIL</span><span className="contact-value">udjin.arvel@gmail.com</span><ArrowUpRight strokeWidth={1.3} /></a>
              <a className="contact-row" href="tel:+79016129022"><span className="contact-label">ТЕЛЕФОН</span><span className="contact-value">+7 901 612 90 22</span><ArrowUpRight strokeWidth={1.3} /></a>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer"><div className="site-width footer-inner"><a className="wordmark" href="#home">arvelov.</a><p>© 2026 Евгений Арвелов</p><a className="eyebrow inline-flex gap-2 items-center" href="#home">Наверх <ArrowUpRight className="size-3" /></a></div></footer>
    </>
  );
}
