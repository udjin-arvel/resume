import { prisma } from '../config/database.js';
import type { ExperienceRewards } from '../types/index.js';

// Опыт за разные типы контента
export const EXPERIENCE_REWARDS: ExperienceRewards = {
  STORY: 100,
  ANNOUNCEMENT: 50,
  COMPOSITION: 200,
  NOTION: 75,
  LORE_ITEM: 80,
  NOTE: 60,
  COMMENT: 10,
};

// Формула расчета уровня: каждые 1000 опыта = новый уровень
export const calculateLevel = (experience: number): number => {
  return Math.floor(experience / 1000) + 1;
};

// Добавление опыта пользователю
export const addExperience = async (userId: number, amount: number): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { experience: true, level: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const newExperience = user.experience + amount;
  const newLevel = calculateLevel(newExperience);

  await prisma.user.update({
    where: { id: userId },
    data: {
      experience: newExperience,
      level: newLevel,
    },
  });

  // Проверяем достижения
  await checkAchievements(userId, newExperience, newLevel);
};

// Проверка достижений
export const checkAchievements = async (
  userId: number,
  experience: number,
  level: number
): Promise<void> => {
  const achievements = [];

  // Достижения за опыт
  if (experience >= 10000 && level >= 10) {
    achievements.push({
      title: 'Опытный писатель',
      description: 'Достиг 10 уровня и набрал 10,000 опыта',
    });
  }

  if (experience >= 50000 && level >= 50) {
    achievements.push({
      title: 'Мастер слова',
      description: 'Достиг 50 уровня и набрал 50,000 опыта',
    });
  }

  // Достижения за количество контента
  const contentCounts = await Promise.all([
    prisma.story.count({ where: { userId } }),
    prisma.composition.count({ where: { userId } }),
    prisma.notion.count({ where: { userId } }),
    prisma.loreItem.count({ where: { userId } }),
    prisma.note.count({ where: { userId } }),
  ]);

  const [storyCount, compositionCount, notionCount, loreCount, noteCount] = contentCounts;

  if (storyCount >= 10) {
    achievements.push({
      title: 'Опытный писатель',
      description: 'Написал 10 историй',
    });
  }

  if (storyCount >= 50) {
    achievements.push({
      title: 'Мастер историй',
      description: 'Написал 50 историй',
    });
  }

  if (compositionCount >= 5) {
    achievements.push({
      title: 'Создатель композиций',
      description: 'Создал 5 композиций',
    });
  }

  if (notionCount >= 20) {
    achievements.push({
      title: 'Энциклопедист',
      description: 'Создал 20 понятий',
    });
  }

  if (loreCount >= 15) {
    achievements.push({
      title: 'Хранитель лора',
      description: 'Создал 15 элементов лора',
    });
  }

  if (noteCount >= 10) {
    achievements.push({
      title: 'Заметочник',
      description: 'Создал 10 заметок',
    });
  }

  // Добавляем новые достижения
  for (const achievement of achievements) {
    const existingAchievement = await prisma.achievement.findFirst({
      where: {
        userId,
        title: achievement.title,
      },
    });

    if (!existingAchievement) {
      await prisma.achievement.create({
        data: {
          ...achievement,
          userId,
        },
      });
    }
  }
};

// Получение награды за контент
export const getContentReward = (contentType: keyof ExperienceRewards): number => {
  return EXPERIENCE_REWARDS[contentType] || 0;
};

// Проверка доступа к контенту по уровню
export const checkAccessLevel = (userLevel: number, contentAccessLevel: number): boolean => {
  return userLevel >= contentAccessLevel;
}; 