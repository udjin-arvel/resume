process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://thebook_user:thebook_password@localhost:5432/thebook_test';

import { prisma } from '../config/database.js';

beforeAll(async () => {
  // DATABASE_URL set at module load
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Очистка базы данных перед каждым тестом
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
}); 