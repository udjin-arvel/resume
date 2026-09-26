import type { UserStatus, CompositionType, StoryType, NotionType, ContentType } from '@prisma/client';
import type { Request } from 'express';

// User types
export interface UserCreateInput {
  login: string;
  email: string;
  password: string;
  status?: UserStatus;
  info?: string;
}

export interface UserUpdateInput {
  login?: string;
  email?: string;
  password?: string;
  status?: UserStatus;
  info?: string;
  level?: number;
  experience?: number;
  tokens?: number;
}

export interface UserResponse {
  id: number;
  login: string;
  status: UserStatus;
  email: string;
  info: string | null;
  avatar: string | null;
  level: number;
  experience: number;
  tokens: number;
  createdAt: Date;
  updatedAt: Date;
}

// Composition types
export interface CompositionCreateInput {
  title: string;
  parentId?: number;
  description?: string;
  type: CompositionType;
  poster?: string;
  isPublic?: boolean;
}

export interface CompositionUpdateInput {
  title?: string;
  parentId?: number;
  description?: string;
  type?: CompositionType;
  poster?: string;
  isPublic?: boolean;
}

// Story types
export interface StoryFragmentInput {
  id?: number;
  order: number;
  text: string;
  authorNote?: string;
}

export interface StoryCreateInput {
  title: string;
  compositionId?: number;
  type: StoryType;
  chapter?: number;
  accessLevel?: number;
  epigraph?: string;
  isPublic?: boolean;
  notes?: string[];
  fragments: StoryFragmentInput[];
}

export interface StoryUpdateInput {
  title?: string;
  compositionId?: number;
  type?: StoryType;
  chapter?: number;
  accessLevel?: number;
  epigraph?: string;
  isPublic?: boolean;
  notes?: string[];
  fragments: StoryFragmentInput[];
}

// Fragment types
export interface FragmentCreateInput {
  storyId: number;
  order: number;
  text: string;
}

export interface FragmentUpdateInput {
  order?: number;
  text?: string;
  authorNote?: string | null;
}

// Notion types
export interface NotionCreateInput {
  title: string;
  text: string;
  poster?: string;
  type: NotionType;
  accessLevel?: number;
  isPublic?: boolean;
}

export interface NotionUpdateInput {
  title?: string;
  text?: string;
  poster?: string;
  type?: NotionType;
  accessLevel?: number;
  isPublic?: boolean;
}

// LoreItem types
export interface LoreItemCreateInput {
  title: string;
  text: string;
  poster?: string;
  accessLevel?: number;
  isPublic?: boolean;
}

export interface LoreItemUpdateInput {
  title?: string;
  text?: string;
  poster?: string;
  accessLevel?: number;
  isPublic?: boolean;
}

// Note types
export interface NoteCreateInput {
  title: string;
  text: string;
  poster?: string;
  price?: number;
  isContent?: boolean;
}

export interface NoteUpdateInput {
  title?: string;
  text?: string;
  poster?: string;
  price?: number;
  isContent?: boolean;
}

// Task types
export interface TaskCreateInput {
  title: string;
  description: string;
  tokens: number;
  experience: number;
  isPublic?: boolean;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  tokens?: number;
  experience?: number;
  isPublic?: boolean;
}

// Comment types
export interface CommentCreateInput {
  text: string;
  contentId?: number;
  contentType?: ContentType;
}

export interface CommentUpdateInput {
  text?: string;
}

// Correction types
export interface CorrectionCreateInput {
  text: string;
  contentId: number;
  contentType: string;
}

// Image types
export interface ImageCreateInput {
  path: string;
  title?: string;
  contentId?: number;
  contentType?: string;
}

// Auth types
export interface LoginInput {
  login: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
}

// JWT payload
export interface JWTPayload {
  userId: number;
  login: string;
  status: UserStatus;
}

// Request with user
export interface AuthenticatedRequest extends Request {
  user?: UserResponse;
  userId?: number;
}

// Experience rewards
export interface ExperienceRewards {
  STORY: number;
  ANNOUNCEMENT: number;
  COMPOSITION: number;
  NOTION: number;
  LORE_ITEM: number;
  NOTE: number;
  COMMENT: number;
}

// Achievement types
export interface AchievementCreateInput {
  title: string;
  description: string;
  userId: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface StoryQuery extends PaginationQuery {
  compositionId?: number;
  type?: StoryType;
  title?: string;
  accessLevel?: number;
  isPublic?: boolean;
}

export interface NotionQuery extends PaginationQuery {
  type?: NotionType;
  accessLevel?: number;
  isPublic?: boolean;
}

export interface LoreItemQuery extends PaginationQuery {
  accessLevel?: number;
  isPublic?: boolean;
} 