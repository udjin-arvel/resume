import { prisma } from './config/database.js';
import { hashPassword } from './middleware/auth.js';
import { UserStatus, CompositionType, StoryType, NotionType } from '@prisma/client';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Очищаем базу данных
  await prisma.achievement.deleteMany();
  await prisma.completedTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.image.deleteMany();
  await prisma.audio.deleteMany();
  await prisma.correction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.fragment.deleteMany();
  await prisma.story.deleteMany();
  await prisma.composition.deleteMany();
  await prisma.note.deleteMany();
  await prisma.loreItem.deleteMany();
  await prisma.notion.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Database cleaned');

  // Создаем пользователей
  const arvelovPassword = await hashPassword('1234');
  const adminPassword = await hashPassword('admin123');
  const writerPassword = await hashPassword('writer123');
  const readerPassword = await hashPassword('reader123');

  const arvelov = await prisma.user.create({
    data: {
      login: 'arvelov',
      email: 'author@thebook.local',
      password: arvelovPassword,
      status: UserStatus.ADMIN,
      info: 'Администратор',
      level: 100,
      experience: 100000,
      tokens: 1000,
    },
  });

  const admin = await prisma.user.create({
    data: {
      login: 'admin',
      email: 'admin@thebook.com',
      password: adminPassword,
      status: UserStatus.ADMIN,
      info: 'Главный администратор сайта',
      level: 100,
      experience: 100000,
      tokens: 1000,
    },
  });

  const writer = await prisma.user.create({
    data: {
      login: 'writer',
      email: 'writer@thebook.com',
      password: writerPassword,
      status: UserStatus.WRITER,
      info: 'Опытный писатель',
      level: 25,
      experience: 25000,
      tokens: 150,
    },
  });

  const reader = await prisma.user.create({
    data: {
      login: 'reader',
      email: 'reader@thebook.com',
      password: readerPassword,
      status: UserStatus.READER,
      info: 'Активный читатель',
      level: 5,
      experience: 5000,
      tokens: 50,
    },
  });

  console.log('👥 Users created');

  // Создаем композиции
  const composition1 = await prisma.composition.create({
    data: {
      title: 'Хроники Забытого Королевства',
      userId: writer.id,
      description: 'Эпическая сага о забытом королевстве и его обитателях',
      type: CompositionType.BOOK,
      isPublic: true,
    },
  });

  const composition2 = await prisma.composition.create({
    data: {
      title: 'Сборник коротких историй',
      userId: writer.id,
      description: 'Различные истории из разных миров',
      type: CompositionType.CHAPTER_COLLECTION,
      isPublic: true,
    },
  });

  console.log('📚 Compositions created');

  // Создаем истории
  const story1 = await prisma.story.create({
    data: {
      title: 'Пробуждение',
      userId: writer.id,
      compositionId: composition1.id,
      type: StoryType.STORY,
      chapter: 1,
      accessLevel: 1,
      epigraph: 'В начале было слово...',
      isPublic: true,
      notes: JSON.stringify(['Король', 'Королевство', 'Магия']),
    },
  });

  const story2 = await prisma.story.create({
    data: {
      title: 'Новые главы в разработке',
      userId: writer.id,
      compositionId: composition1.id,
      type: StoryType.ANNOUNCEMENT,
      accessLevel: 1,
      isPublic: true,
      notes: JSON.stringify(['Обновление', 'Новые главы']),
    },
  });

  const story3 = await prisma.story.create({
    data: {
      title: 'Тайны древнего храма',
      userId: writer.id,
      compositionId: composition2.id,
      type: StoryType.STORY,
      accessLevel: 10,
      isPublic: true,
      notes: JSON.stringify(['Храм', 'Древности', 'Артефакты']),
    },
  });

  console.log('📖 Stories created');

  // Создаем фрагменты
  await prisma.fragment.create({
    data: {
      storyId: story1.id,
      order: 1,
      authorNote: 'Этот фрагмент задаёт тон всей истории.',
      text: 'В далеком королевстве, где магия была повседневностью, а драконы летали над замками, жил молодой король по имени Эдриан. Его правление началось в трудные времена, когда древние пророчества предсказывали великие перемены...',
    },
  });

  await prisma.fragment.create({
    data: {
      storyId: story1.id,
      order: 2,
      text: 'Эдриан сидел в своем тронном зале, размышляя о будущем своего королевства. Стены замка хранили множество тайн, и он чувствовал, что пришло время раскрыть их...',
    },
  });

  await prisma.fragment.create({
    data: {
      storyId: story3.id,
      order: 1,
      text: 'Древний храм возвышался над джунглями, его каменные стены покрыты мхом и лианами. Археолог Сара Митчелл стояла перед его входом, сердце билось от волнения...',
    },
  });

  console.log('📝 Fragments created');

  // Создаем понятия
  await prisma.notion.create({
    data: {
      title: 'Король Эдриан',
      userId: writer.id,
      text: 'Молодой король Забытого Королевства. Известен своей мудростью и справедливостью. Владеет древней магией, переданной ему предками.',
      type: NotionType.CHARACTER,
      accessLevel: 1,
      isPublic: true,
    },
  });

  await prisma.notion.create({
    data: {
      title: 'Забытое Королевство',
      userId: writer.id,
      text: 'Древнее королевство, расположенное в долине между горами. Известно своими магическими традициями и богатой историей.',
      type: NotionType.PLACE,
      accessLevel: 1,
      isPublic: true,
    },
  });

  await prisma.notion.create({
    data: {
      title: 'Древняя магия',
      userId: writer.id,
      text: 'Особая форма магии, доступная только потомкам королевской семьи. Позволяет управлять стихиями и видеть будущее.',
      type: NotionType.DEFINITION,
      accessLevel: 5,
      isPublic: true,
    },
  });

  console.log('📖 Notions created');

  // Создаем элементы лора
  await prisma.loreItem.create({
    data: {
      title: 'Пророчество о Возвращении',
      userId: writer.id,
      text: 'Древнее пророчество гласит, что однажды вернется истинный наследник трона и восстановит былое величие королевства. Это событие будет сопровождаться знамениями в небесах.',
      accessLevel: 15,
      isPublic: true,
    },
  });

  await prisma.loreItem.create({
    data: {
      title: 'Орден Хранителей',
      userId: writer.id,
      text: 'Тайная организация, охраняющая древние знания и артефакты королевства. Члены ордена обладают особыми способностями и дают клятву молчания.',
      accessLevel: 10,
      isPublic: true,
    },
  });

  console.log('🏛️ Lore items created');

  // Создаем заметки
  await prisma.note.create({
    data: {
      title: 'Секреты королевской библиотеки',
      userId: writer.id,
      text: 'В глубинах королевской библиотеки хранятся древние манускрипты, содержащие секреты создания эликсира бессмертия. Доступ к ним имеют только избранные...',
      price: 25,
      importance: 9,
      isContent: true,
    },
  });

  await prisma.note.create({
    data: {
      title: 'Заметки о магических существах',
      userId: writer.id,
      text: 'Личные наблюдения за различными магическими существами, обитающими в окрестностях королевства. Включает описания их повадок и способностей.',
      price: 15,
      importance: 7,
      isContent: false,
    },
  });

  await prisma.note.create({
    data: {
      title: 'Карта сокровищ',
      userId: writer.id,
      text: 'Древняя карта, указывающая на местонахождение легендарных сокровищ королевства. Содержит зашифрованные подсказки и ловушки.',
      price: 50,
      importance: 10,
      isContent: true,
    },
  });

  await prisma.note.create({
    data: {
      title: 'Рецепты зелий',
      userId: writer.id,
      text: 'Коллекция рецептов магических зелий, собранная алхимиком королевства. Включает как простые, так и сложные составы.',
      price: 20,
      importance: 6,
      isContent: false,
    },
  });

  console.log('📝 Notes created');

  // Создаем задания
  await prisma.task.create({
    data: {
      title: 'Написать первую историю',
      description: 'Создайте свою первую историю и получите награду',
      tokens: 50,
      experience: 500,
      isPublic: true,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Создать 5 понятий',
      description: 'Создайте 5 различных понятий для расширения вселенной',
      tokens: 100,
      experience: 1000,
      isPublic: true,
    },
  });

  console.log('🎯 Tasks created');

  // Создаем комментарии
  await prisma.comment.create({
    data: {
      text: 'Отличная история! Очень интересно читать о приключениях короля Эдриана.',
      userId: reader.id,
      storyId: story1.id,
    },
  });

  await prisma.comment.create({
    data: {
      text: 'Жду продолжения! Хочу узнать больше о древней магии.',
      userId: reader.id,
      storyId: story1.id,
    },
  });

  console.log('💬 Comments created');

  // Создаем достижения
  await prisma.achievement.create({
    data: {
      title: 'Первый писатель',
      description: 'Создал свою первую историю',
      userId: writer.id,
    },
  });

  await prisma.achievement.create({
    data: {
      title: 'Создатель миров',
      description: 'Создал композицию с историями',
      userId: writer.id,
    },
  });

  console.log('🏆 Achievements created');

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Test accounts:');
  console.log('👑 Admin: arvelov / 1234');
  console.log('👑 Admin: admin / admin123');
  console.log('✍️ Writer: writer / writer123');
  console.log('👤 Reader: reader / reader123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 