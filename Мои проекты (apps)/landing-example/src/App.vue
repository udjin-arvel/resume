<template>
  <div class="bg-gray-900 text-white font-sans">

    <header class="fixed top-0 w-full bg-gray-800 flex items-center justify-between px-4 sm:px-6 py-3 z-50 shadow-lg backdrop-blur-sm">
      <div class="flex items-center space-x-8">
        <div class="text-2xl font-bold text-blue-400 pe-3">Bitcom</div>
        <nav class="space-x-6 hidden md:flex mb-[-4px]">
          <a href="#advantages" class="hover:text-blue-400 transition">Преимущества</a>
          <a href="#price" class="hover:text-blue-400 transition">Цены</a>
          <a href="#reviews" class="hover:text-blue-400 transition">Отзывы</a>
        </nav>
      </div>
      <div class="flex items-center space-x-4">
        <a href="tel:+79000000000" class="hover:text-blue-400 transition text-xs sm:text-base">+7 (900) 000-00-00</a>
        <a href="#contact" class="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-yellow-500/30 transition-all">Записаться</a>
      </div>
    </header>

    <section id="hero" class="relative min-h-screen flex">
      <!-- Левая часть (трапеция с наклоном справа) -->
      <div class="w-full md:w-2/3 relative">
        <!-- Обрезающий контейнер -->
        <div class="absolute inset-0 md:right-[-20%]  clip-path-trapezoid-right">
          <!-- Фоновая картинка -->
          <div class="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-top center"></div>
          <!-- <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920')] bg-cover bg-center"></div>-->
          <!-- Затемнение -->
          <div class="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/60"></div>
        </div>

        <!-- Контент -->
        <div class="relative z-10 p-8 md:p-16 h-full flex flex-col justify-center">
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 max-w-2xl">Bitcom — профессиональный ремонт техники</h1>
          <p class="text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">Ищете надежного мастера? Мы предлагаем полный спектр услуг — быстро и качественно!</p>
          <div class="flex gap-4">
            <a href="#contact" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium shadow-lg transition">Записаться</a>
            <a href="#price" class="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-700 transition">Узнать цены</a>
          </div>
        </div>
      </div>

      <!-- Правая часть (трапеция с наклоном слева) -->
      <div class="hidden md:block w-1/3 relative">
        <!-- Обрезающий контейнер -->
        <div class="absolute inset-0 clip-path-trapezoid-left bg-gradient-to-br from-gray-800 to-gray-900">
          <!-- Контент -->
          <div class="relative z-10 h-full flex flex-col justify-center items-center p-8">
            <div class="promotion-card bg-yellow-500/20 backdrop-blur-lg rounded-r-2xl p-6 ps-12 md:pe-10 border border-yellow-500/30 shadow-xl">
              <span class="text-2xl font-bold text-yellow-400 block mb-2">Акция!</span>
              <p class="text-lg leading-relaxed">Кодовое слово дает скидку 10%!</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="advantages" class="py-16 sm:py-20 md:py-24 px-4 bg-gradient-to-b from-gray-900 to-gray-950">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl sm:text-4xl font-bold mb-16 text-center relative">
          <span class="relative z-10 px-4 bg-gray-900">Преимущества Bitcom</span>
          <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-0"></div>
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-16">
          <div v-for="(item, index) in features" :key="index" class="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl transform hover:-translate-y-2 transition duration-300">
            <div class="text-blue-400 text-3xl mb-4">{{ item.icon }}</div>
            <h3 class="font-bold text-xl mb-2">{{ item.title }}</h3>
            <p class="text-gray-300">{{ item.description }}</p>
          </div>
        </div>

        <div class="max-w-5xl mx-auto mt-20">
          <h3 class="text-2xl font-bold text-center mb-12">Почему клиенты нас любят?</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="(item, index) in whyWeLove" :key="index"
                 class="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition">
              <div class="flex items-start gap-4">
                <div class="bg-blue-500/10 p-2 rounded-lg">
                  <span class="text-blue-500 text-2xl">✓</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg mb-1">{{ item.title }}</h4>
                  <p class="text-gray-300 text-sm">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="price" class="py-16 sm:py-20 md:py-24 px-4 bg-gray-900">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl sm:text-4xl font-bold mb-12 text-center">Наши цены</h2>
        <div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-1 shadow-xl">
          <div class="bg-gray-900 rounded-2xl p-6">
            <div class="service-items grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="(item, index) in displayedItems" :key="index"
                   class="bg-gray-800/50 hover:bg-gray-800 p-6 min-h-[162px] rounded-xl border border-gray-700 transition flex flex-col justify-between overflow-hidden">
                <div class="flex justify-between items-start">
                  <h3 class="font-bold text-lg pe-3">{{ item.name }}</h3>
                  <span :class="`bg-blue-500/10 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold text-center ${item.price === 'Узнать цену' ? '' : 'text-nowrap'}`">
                    {{ item.price === 'Узнать цену' ? 'Зависит от устройства' : `от ${item.price}` }}
                  </span>
                </div>
                <a v-if="item.price === 'Узнать цену'" href="#contact" class="mt-4 bg-blue-600 hover:bg-blue-700 w-full py-2 rounded-lg transition text-center text-white">
                  Узнать цену
                </a>
                <a v-else href="#contact" class="mt-4 bg-blue-600 hover:bg-blue-700 w-full py-2 rounded-lg transition text-center text-white">
                  Записаться
                </a>
              </div>
            </div>
            <div class="mt-8 text-center" v-if="priceList.length > 9">
              <button
                  @click="showAllServices = !showAllServices"
                  class="inline-block bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-yellow-500/30 transition-all"
              >
                {{ showAllServices ? 'Скрыть' : 'Показать все услуги' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="reviews" class="py-16 sm:py-20 md:py-24 px-4 bg-gradient-to-b from-gray-900 to-gray-950">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl sm:text-4xl font-bold mb-16 text-center">Отзывы клиентов</h2>

        <div class="relative">
          <div class="overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 p-1 shadow-xl">
            <div class="bg-gray-900 rounded-2xl p-8">
              <div class="carousel-container relative">
                <div class="carousel-track flex transition-transform duration-500 ease-in-out" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
                  <div v-for="(review, index) in reviews" :key="index" class="carousel-slide flex-shrink-0 w-full items-center flex">
                    <div class="md:h-[250px] mx-auto rounded-2xl overflow-hidden inline-flex" role="button" @click="openModal(index)">
                      <img :src="review" alt="Отзыв" class="w-full h-full">
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-center mt-8 space-x-4">
                <button @click="prevReview" class="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-gray-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div class="flex items-center space-x-2">
                  <span v-for="(review, index) in reviews" :key="index"
                        @click="currentIndex = index"
                        class="w-3 h-3 rounded-full cursor-pointer transition"
                        :class="index === currentIndex ? 'bg-blue-500' : 'bg-gray-700'">
                  </span>
                </div>
                <button @click="nextReview" class="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-gray-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="text-center mt-12">
            <a href="https://www.avito.ru/tomsk/predlozheniya_uslug/tvoy_kompyuternyy_master_1608277545?utm_campaign=native&utm_medium=item_page_android&utm_source=soc_sharing_seller" target="_blank" class="inline-block bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-yellow-500/30 transition-all">
              Посмотреть все отзывы
            </a>
          </div>
        </div>
      </div>

      <!-- Модальное окно -->
      <div v-if="isModalOpen"
           class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
           @click.self="closeModal">
        <div class="relative max-w-4xl w-full mx-4">
          <button @click="closeModal"
                  class="absolute -top-12 right-0 text-white hover:text-yellow-400 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <div class="h-96 md:h-auto w-full">
              <img :src="currentReview"
                   :alt="'Отзыв ' + (currentReviewIndex + 1)"
                   class="w-full h-full object-contain">
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="py-16 sm:py-20 md:py-24 px-4 bg-gray-900">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl sm:text-4xl font-bold mb-12 text-center">Оставьте вашу заявку <br>и мы обязательно перезвоним!</h2>

        <div class="w-full md:w-[62%] mx-auto gap-12 items-center">
          <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-xl">
            <h3 class="text-2xl font-bold mb-6">Обратная связь</h3>
            <form class="space-y-6" @submit.prevent="addCallbackRequest">
              <input v-model="callbackRequest.name" type="text" required placeholder="Ваше имя" name="name" class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <input v-model="callbackRequest.phone" type="tel" required placeholder="Телефон" name="phone" class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <textarea v-model="callbackRequest.comment" placeholder="Опишите вашу проблему" name="comment" class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"></textarea>
              <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold transition">Отправить заявку</button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <footer class="py-12 bg-gray-950 border-t border-gray-800">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center gap-8">
          <div class="text-center md:text-left">
            <div class="text-2xl font-bold text-blue-400 mb-2">Bitcom</div>
            <p class="text-gray-400 max-w-md">Профессиональный ремонт техники с гарантией качества</p>
          </div>

          <div class="flex flex-wrap justify-center gap-6">
            <a href="https://www.avito.ru/tomsk/predlozheniya_uslug/tvoy_kompyuternyy_master_1608277545?utm_campaign=native&utm_medium=item_page_android&utm_source=soc_sharing_seller" target="_blank" class="text-gray-400 hover:text-blue-400 transition">Отзывы на авито</a>
            <a href="mailto:hello@example.com" class="text-gray-400 hover:text-blue-400 transition">hello@example.com</a>
            <a href="tel:+79000000000" class="text-gray-400 hover:text-blue-400 transition">+7 (900) 000-00-00</a>
          </div>

          <div class="flex space-x-4">
            <a href="https://wa.me/79000000000" target="_blank" class="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-gray-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 50 50" fill="currentColor" class="text-blue-400">
                <path d="M25,2C12.318,2,2,12.318,2,25c0,3.96,1.023,7.854,2.963,11.29L2.037,46.73c-0.096,0.343-0.003,0.711,0.245,0.966 C2.473,47.893,2.733,48,3,48c0.08,0,0.161-0.01,0.24-0.029l10.896-2.699C17.463,47.058,21.21,48,25,48c12.682,0,23-10.318,23-23 S37.682,2,25,2z M36.57,33.116c-0.492,1.362-2.852,2.605-3.986,2.772c-1.018,0.149-2.306,0.213-3.72-0.231 c-0.857-0.27-1.957-0.628-3.366-1.229c-5.923-2.526-9.791-8.415-10.087-8.804C15.116,25.235,13,22.463,13,19.594 s1.525-4.28,2.067-4.864c0.542-0.584,1.181-0.73,1.575-0.73s0.787,0.005,1.132,0.021c0.363,0.018,0.85-0.137,1.329,1.001 c0.492,1.168,1.673,4.037,1.819,4.33c0.148,0.292,0.246,0.633,0.05,1.022c-0.196,0.389-0.294,0.632-0.59,0.973 s-0.62,0.76-0.886,1.022c-0.296,0.291-0.603,0.606-0.259,1.19c0.344,0.584,1.529,2.493,3.285,4.039 c2.255,1.986,4.158,2.602,4.748,2.894c0.59,0.292,0.935,0.243,1.279-0.146c0.344-0.39,1.476-1.703,1.869-2.286 s0.787-0.487,1.329-0.292c0.542,0.194,3.445,1.604,4.035,1.896c0.59,0.292,0.984,0.438,1.132,0.681 C37.062,30.587,37.062,31.755,36.57,33.116z"></path>
              </svg>
            </a>
            <a href="https://t.me/sasha_shorohh" target="_blank" class="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center border border-gray-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 50 50" fill="currentColor" class="text-blue-400">
                <path d="M25,2c12.703,0,23,10.297,23,23S37.703,48,25,48S2,37.703,2,25S12.297,2,25,2z M32.934,34.375	c0.423-1.298,2.405-14.234,2.65-16.783c0.074-0.772-0.17-1.285-0.648-1.514c-0.578-0.278-1.434-0.139-2.427,0.219	c-1.362,0.491-18.774,7.884-19.78,8.312c-0.954,0.405-1.856,0.847-1.856,1.487c0,0.45,0.267,0.703,1.003,0.966	c0.766,0.273,2.695,0.858,3.834,1.172c1.097,0.303,2.346,0.04,3.046-0.395c0.742-0.461,9.305-6.191,9.92-6.693	c0.614-0.502,1.104,0.141,0.602,0.644c-0.502,0.502-6.38,6.207-7.155,6.997c-0.941,0.959-0.273,1.953,0.358,2.351	c0.721,0.454,5.906,3.932,6.687,4.49c0.781,0.558,1.573,0.811,2.298,0.811C32.191,36.439,32.573,35.484,32.934,34.375z"></path>
              </svg>
            </a>
          </div>
        </div>

        <div class="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500">
          &copy; 2025 Bitcom. Все права защищены. Сайт разработан <a href="https://arvelov.online" target="_blank" class="hover:underline">ArvelovGroup</a>.
        </div>
      </div>
    </footer>

    <div v-if="isSuccessModalOpen"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
         @click.self="closeSuccessModal">
      <div class="relative max-w-md w-full mx-4">
        <button @click="closeSuccessModal"
                class="absolute -top-12 right-0 text-white hover:text-yellow-400 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="bg-gray-900 rounded-xl overflow-hidden shadow-2xl p-8 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 class="text-lg font-medium text-white mb-2">Ваша заявка успешно отправлена!</h3>
          <p class="text-gray-300 mb-6">Мы свяжемся с вами в ближайшее время</p>

          <button @click="closeSuccessModal"
                  class="w-full md:w-auto px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium rounded-md transition">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BitcomSite",
  data() {
    return {
      isModalOpen: false,
      isSuccessModalOpen: false,
      currentReviewIndex: 0,
      currentIndex: 0,
      callbackRequest: { name: '', phone: '', comment: '' },
      features: [
        { icon: "🚀", title: "Быстрый выезд", description: "Мастер приедет в течение 60 минут по Томску" },
        { icon: "🔧", title: "Оригинальные запчасти", description: "Используем только сертифицированные комплектующие" },
        { icon: "🛡️", title: "Гарантия до 1 года", description: "На все виды работ предоставляем гарантию" },
        { icon: "💼", title: "Профессионалы", description: "Мастера с опытом работы от 5 лет" },
        { icon: "💎", title: "Прозрачные цены", description: "Фиксированная стоимость без скрытых платежей" }
      ],
      reviews: [
        "/reviews/9.jpg",
        "/reviews/8.jpg",
        "/reviews/7.jpg",
        "/reviews/6.jpg",
        "/reviews/5.jpg",
        "/reviews/4.jpg",
        "/reviews/3.jpg",
        "/reviews/2.jpg",
        "/reviews/1.jpg",
      ],
      showAllServices: false,
      priceList: [
        { name: 'Замена аккумулятора', price: '890 ₽' },
        { name: 'Чистка от пыли', price: '1 490 ₽' },
        { name: 'Восстановление после влаги', price: '2 490 ₽' },
        { name: 'Установка Windows', price: '990 ₽' },
        { name: 'Настройка BIOS', price: '1 490 ₽' },
        { name: 'Установка драйверов', price: '890 ₽' },
        { name: 'Восстановление Windows', price: '990 ₽' },
        { name: 'Замена клавиатуры', price: '890 ₽' },
        { name: 'Замена матрицы', price: '1 290 ₽' },
        { name: 'Замена процессора', price: '890 ₽' },
        { name: 'Замена видеокарты', price: '890 ₽' },
        { name: 'Замена жесткого диска', price: '890 ₽' },
        { name: 'Замена кулера', price: '890 ₽' },
        { name: 'Замена оперативной памяти', price: '890 ₽' },
        { name: 'Замена шлейфа', price: '890 ₽' },
        { name: 'Замена материнской платы', price: '890 ₽' },
        { name: 'Замена корпуса', price: '890 ₽' },
        { name: 'Удаление вирусов', price: '890 ₽' },
        { name: 'Замена тачпада', price: '890 ₽' },
        { name: 'Установка программного обеспечения', price: '890 ₽' },
        { name: 'Установка антивируса', price: '890 ₽' },
        { name: 'Настройка Wi-Fi', price: '890 ₽' },
        { name: 'Настройка интернета', price: '890 ₽' },
        { name: 'Установка MS Office', price: '890 ₽' },
        { name: 'Замена звуковой карты', price: '890 ₽' },
        { name: 'Замена CD/DVD привода', price: '890 ₽' },
        { name: 'Ремонт петель', price: '890 ₽' },
        { name: 'Замена термопрокладок (термоинтерфейса)', price: '2 190 ₽' },
        { name: 'Замена динамиков', price: '890 ₽' },
        { name: 'Замена USB-разъемов', price: '890 ₽' },
        { name: 'Замена подсветки экрана', price: 'Узнать цену' },
        { name: 'Замена Wi-Fi модуля', price: 'Узнать цену' },
        { name: 'Замена мультиконтроллера', price: 'Узнать цену' },
        { name: 'Замена северного моста', price: 'Узнать цену' },
        { name: 'Замена батарейки BIOS', price: '790 ₽' },
        { name: 'Замена HDD на SSD', price: '890 ₽' },
        { name: 'Программный ремонт', price: '1 990 ₽' },
        { name: 'Ремонт материнской платы', price: 'Узнать цену' },
        { name: 'Замена разъема зарядки', price: '790 ₽' },
        { name: 'Замена матрицы в сборе с крышкой', price: '1 690 ₽' },
        { name: 'Замена топкейса', price: '890 ₽' }
      ],
      whyWeLove: [
        { title: "Быстрый ремонт", description: "Исправим проблему за минимальное время, иногда в тот же день" },
        { title: "Бесплатная диагностика", description: "Определим неисправность без дополнительных затрат" },
        { title: "Гарантия до 1 года", description: "Клиенты могут быть уверены в качестве работы" },
        { title: "Оригинальные запчасти", description: "Обеспечивает долговечность и надежность ремонта" },
        { title: "Выезд мастера", description: "Удобство — не нужно тратить время на визит в мастерскую" },
        { title: "Прозрачные цены", description: "Клиенты знают, за что платят, без неожиданных расходов" },
        { title: "Профессиональные мастера", description: "Работа выполняется квалифицированными специалистами" },
        { title: "Акции и скидки", description: "Ваша лояльность всегда вознаграждается" },
        { title: "Современное оборудование", description: "Высокое качество и надежность ремонта" },
        { title: "Поддержка после ремонта", description: "Консультации и помощь при возникновении вопросов" }
      ],
    };
  },
  computed: {
    displayedItems() {
      return this.showAllServices ? this.priceList : this.priceList.slice(0, 9)
    },
    currentReview() {
      return this.reviews[this.currentReviewIndex];
    },
  },
  methods: {
    async addCallbackRequest() {
      try {
        const response = await fetch('/send-to-tg.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(this.callbackRequest),
        });

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          console.log('Успешно отправлено!');
          this.isSuccessModalOpen = true;
        } else {
          console.error('Ошибка:', result.error);
        }
      } catch (error) {
        console.error('Ошибка сети:', error);
      }
    },
    nextReview() {
      this.currentIndex = (this.currentIndex + 1) % this.reviews.length;
    },
    prevReview() {
      this.currentIndex = (this.currentIndex - 1 + this.reviews.length) % this.reviews.length;
    },
    openModal(index) {
      this.currentReviewIndex = index;
      this.isModalOpen = true;
      document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
    },
    closeModal() {
      this.isModalOpen = false;
      document.body.style.overflow = ''; // Восстанавливаем скролл
    },
    closeSuccessModal() {
      this.isSuccessModalOpen = false;
      document.body.style.overflow = '';
    },
  },
  mounted() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  },
};
</script>

<style scoped>
html {
  scroll-behavior: smooth;
}

.clip-path-trapezoid-left {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 30% 100%);
}

.carousel-container {
  overflow: hidden;
}

.carousel-track {
  display: flex;
  width: 100%;
}

.carousel-slide {
  flex: 0 0 100%;
}

.promotion-card {
  &::before {
    content: '';
    position: absolute;
    top: -1px;
    right: 100%;
    width: 1000px;
    height: calc(100% + 2px);
    background-color: rgba(234, 179, 8, 0.2);
    border: solid 1px rgb(234 179 8 / 0.3);
    border-right: none;
  }
}

@media (max-width: 768px) {
  .clip-path-trapezoid-left {
    clip-path: none;
  }
}
</style>
