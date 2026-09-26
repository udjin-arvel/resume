import type { Prisma } from '@prisma/client';
import type { StoryFragmentInput } from '../types/index.js';

export async function syncStoryFragments(
  tx: Prisma.TransactionClient,
  storyId: number,
  fragments: StoryFragmentInput[]
): Promise<void> {
  const incomingIds = fragments
    .map((fragment) => fragment.id)
    .filter((id): id is number => id !== undefined);

  if (incomingIds.length > 0) {
    await tx.fragment.deleteMany({
      where: {
        storyId,
        id: { notIn: incomingIds },
      },
    });
  } else {
    await tx.fragment.deleteMany({ where: { storyId } });
  }

  for (const fragment of fragments) {
    const data = {
      order: fragment.order,
      text: fragment.text,
      authorNote: fragment.authorNote?.trim() || null,
    };

    if (fragment.id) {
      await tx.fragment.updateMany({
        where: { id: fragment.id, storyId },
        data,
      });
    } else {
      await tx.fragment.create({
        data: {
          storyId,
          ...data,
        },
      });
    }
  }
}
