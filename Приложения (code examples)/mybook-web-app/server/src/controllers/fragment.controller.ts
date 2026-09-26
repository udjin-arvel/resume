import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { checkAccessLevel } from '../utils/experience.js';
import type { FragmentUpdateInput, UserResponse } from '../types/index.js';

const fragmentInclude = {
  images: true,
  audios: true,
  story: {
    select: {
      id: true,
      userId: true,
      isPublic: true,
      accessLevel: true,
    },
  },
};

type FragmentWithStory = NonNullable<Awaited<ReturnType<typeof loadFragment>>>;

async function loadFragment(fragmentId: number) {
  return prisma.fragment.findUnique({
    where: { id: fragmentId },
    include: fragmentInclude,
  });
}

function canReadFragment(
  story: { isPublic: boolean; userId: number; accessLevel: number },
  user: UserResponse | undefined
): boolean {
  if (!story.isPublic && (!user || story.userId !== user.id)) {
    return false;
  }

  return checkAccessLevel(user?.level || 1, story.accessLevel);
}

function canEditFragment(
  story: { userId: number },
  user: UserResponse
): boolean {
  return (
    story.userId === user.id
    || user.status === 'ADMIN'
    || user.status === 'MODERATOR'
  );
}

function toFragmentResponse(fragment: FragmentWithStory) {
  const { story, ...fragmentData } = fragment;
  return fragmentData;
}

export const getFragmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const fragmentId = Number(req.params.id);
    const fragment = await loadFragment(fragmentId);

    if (!fragment) {
      res.status(404).json({ success: false, error: 'Fragment not found' });
      return;
    }

    if (!canReadFragment(fragment.story, req.user)) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: toFragmentResponse(fragment),
    });
  } catch (error) {
    console.error('Get fragment error:', error);
    res.status(500).json({ success: false, error: 'Failed to get fragment' });
  }
};

export const updateFragment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = req.user;

    if (!userId || !user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const fragmentId = Number(req.params.id);
    const updateData: FragmentUpdateInput = req.body;

    if (updateData.text === undefined && updateData.authorNote === undefined) {
      res.status(400).json({
        success: false,
        error: 'At least one field (text or authorNote) is required',
      });
      return;
    }

    if (updateData.text !== undefined && !updateData.text.trim()) {
      res.status(400).json({
        success: false,
        error: 'Fragment text cannot be empty',
      });
      return;
    }

    const fragment = await loadFragment(fragmentId);

    if (!fragment) {
      res.status(404).json({ success: false, error: 'Fragment not found' });
      return;
    }

    if (!canReadFragment(fragment.story, user)) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    if (!canEditFragment(fragment.story, user)) {
      res.status(403).json({
        success: false,
        error: 'You can only update fragments of your own stories',
      });
      return;
    }

    const updatedFragment = await prisma.fragment.update({
      where: { id: fragmentId },
      data: {
        ...(updateData.text !== undefined && { text: updateData.text.trim() }),
        ...(updateData.authorNote !== undefined && {
          authorNote: updateData.authorNote?.trim() || null,
        }),
      },
      include: {
        images: true,
        audios: true,
      },
    });

    res.json({
      success: true,
      data: updatedFragment,
      message: 'Fragment updated successfully',
    });
  } catch (error) {
    console.error('Update fragment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update fragment' });
  }
};
