export interface IAIModelListItem {
    id: string;
    name: string;
    tpr: number;
    tps: number | null;
    size_options: string[] | null;
    aspect_ratio_options: string[] | null;
    ratio_options?: string[] | null;
    duration_options: number[];
    duration_options_by_resolution?: Record<string, number[]>;
    resolution_options: string[];
    audio_toggle_param?: string | null;
    max_input_images?: number;
    icon_path: string | null;
    tokens_per_request: number | null;
    tokens_per_second: number | null;
    tokens_per_sound: number | null;
    tokens_per_improvement: number | null;
    task_type: 'edit_image' | 'improve_quality' | 'video_preview'
    basic_video_duration?: number;
    max_prompt_length: number;
}

export interface IAiChatListItem {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface IAiChatMessage {
    id: number;
    chat_id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
    attachments: IUploadAssetResponse[];
}

export interface ICreateNewAiChatResponse {
    chat_id: number;
    task_id: number;
    title: string;
    message: IAiChatMessage;
}
export type TCurrentChatMessagesResponse = IAiChatListItem & {
    messages: IAiChatMessage[];
    thread_id: string;
}

export interface IUploadAssetResponse {
    storage_path: string;
    thumbnail_path: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    kind: string;
    url: string;
    url_thumbnail: string;
}

export type TChatAttachment = Partial<IUploadAssetResponse> & {
   isLoading: boolean;
}

export interface IAIModelsList {
    images: IAIModelListItem[],
    videos: IAIModelListItem[],
}

export type SampleGender = 'male' | 'female';

export interface ISample {
    id: number;
    gender: SampleGender;
    path: string;
    path_thumbnail: string;
    created_at: string;
    updated_at: string;
}

export interface ISamplesListResponse {
    items: ISample[];
}

export interface IUser {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    telegram_id: number | null;
    save_context: boolean;
    tokens: number;
    balance: number;
    account_id: number;
}

export interface INotification {
    id: number;
    user_id: number;
    title: string;
    text: string;
    status: 'new' | 'read';
    type: 'note' | 'recommendation' | 'warning';
    created_at: string;
}

export interface INotificationsResponse {
    items: INotification[];
    unread_count: number;
}

export interface IGenerationResponse {
    success: boolean;
    message: string;
    image_paths: string[];
    image_count: number;
    user_id: number;
    task_id: number;
    message_id: number;
    thread_id: string;
    task_type: number;
    is_new_task: boolean;
    ai_model: string | null;
}

export type TGenerationType = 'edit_image' | 'video_preview' | 'improve_quality' | null;

export interface IGenerationStatusMessage {
    id: number;
    text: string;
    references: string[];
    created_at: string;
}

export interface IGenerationStatusGeneration {
    id: number;
    filepath: string;
    result: string;
    created_at: string;
    prompt?: string;
    reference?: string[];
    result_thumbnail?: string | null;
    reference_thumbnails?: string[];
    sample?: ISample | null;
}

export interface IGenerationStatusResponse {
    success: boolean;
    task_id: number;
    task_type: Omit<TGenerationType, 'null'>;
    task_status: 'launched' | 'pending' | 'closed' | 'error' | 'waiting';
    messages?: IGenerationStatusMessage[];
    generations?: IGenerationStatusGeneration[];
    references?: string[];
    source?: string | null;
    result: string | null;
    generation_id?: number;
    prompt?: string;
    result_thumbnail?: string | null;
    reference_thumbnails?: string[];
    error_message?: string;
    error_unread?: boolean;
}

export interface IGenerationHistoryResponse {
    task_id: number;
    ai_model: string;
    status: string;
    task_type: number;
    created_at: string;
    message_id: number;
    prompt: string;
    references: string[];
    generation_id: number;
    result: string | null;
    generations?: IGenerationStatusGeneration[];
}

export interface IGenerationHistoryResponseDTO {
    generation_id: number;
    task_id: number;
    prompt?: string;
    reference?: string[];
    created_at: string;
    result: string | null;
    ai_model: string;
    result_thumbnail?: string | null;
    reference_thumbnails?: string[];
    sample?: ISample | null;
}

export interface IContentFactoryTemplate {
    id: string
    name: string
    previewUrl: string
    previewThumbnailUrl: string
}

export interface IContentFactoryProject {
    id: string
    name: string
    canvasMetadata?: string | null
    createdAt: string
    isPublic?: boolean
    publicId?: string
  }
  
  export interface IContentFactoryEdge {
    id: string
    sourceNodeId: string
    targetNodeId: string
    sourceHandle: TContentFactoryPin['contentType'] | null
    targetHandle: TContentFactoryPin['contentType'] | null
    status: 'active' | 'stale' | 'broken'
    staleSince: string
    createdAt: string
    updatedAt: string
  }
  
  export interface IContentFactoryNode {
    id: string
    positionX: number
    positionY: number
    type: string        // формат "PINTYPE:CONTENTTYPE", например "USER_CONTENT:TEXT"
    pinType?: 'USER_CONTENT' | 'GENERATED_CONTENT'
    contentType?: 'IMAGE' | 'VIDEO' | 'TEXT'
    zIndex: number
    prompt?: string | null
    data: Record<string, any> | null
    status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed'
    resultUrl: string | null
    resultUrlThumbnail?: string | null
    cacheKey: string | null
    aiModel?: string | null
    aspectRatio?: string | null
    generation?: {
      id: string
      status: string
      prompt?: string | null
      reference?: string[] | null
      referenceThumbnails?: (string | null)[] | null
      result?: string | null
      resultThumbnail?: string | null
      createdAt?: string | null
      completedAt?: string | null
      generationTimings?: Record<string, unknown> | null
    } | null
    lastTaskId: string | null
    updatedAt: string
  }

export type TContentFactoryPinGeneratedContent = {
    pinType: 'GENERATED_CONTENT';
    contentType: 'IMAGE' | 'VIDEO';
}
export type TContentFactoryPinUserContent = {
    pinType: 'USER_CONTENT';
    contentType: 'IMAGE' | 'TEXT';
}

export type TContentFactoryPin = (TContentFactoryPinGeneratedContent | TContentFactoryPinUserContent) & {
    id: string;
    position?: { x: number; y: number };
    prompt?: string | null;
    user_image_thumbnail_path?: string | null;
    user_image_path?: string | null;
    user_image_thumbnail_url?: string | null;
    user_image_url?: string | null;
    isNote?: boolean;
    note?: string | null;
    resultUrl?: string | null;
    aspect_ratio?: string | null;
    ai_model?: string | null;
    [key: string]: unknown;
}

export type TSocketMessageEventTypes = 
'project.updated' | 
'edge.updated' | 
'node.status_changed' |
'node.result_ready' |
'node.failed' | 
'connected'

export type TSocketMessagePayloadActionTypes = 
'created' |
'renamed' |
'canvas_metadata_updated' |
'deleted' |
'node_created' |
'node_deleted' |
'node_position_updated' |
'node_z_index_updated' |
'node_pin_kind_updated' |
'node_prompt_updated' |
'node_ai_model_updated' |
'node_data_updated' |
'node_image_uploaded' |
'node_video_uploaded'

export interface ISocketMessageData {
    eventType: TSocketMessageEventTypes;
    message: string;
    payload: {
      action?: TSocketMessagePayloadActionTypes;
      node_id: number;
      project_id: number;
      [key: string]: unknown;
    };
    projectId: string;
}