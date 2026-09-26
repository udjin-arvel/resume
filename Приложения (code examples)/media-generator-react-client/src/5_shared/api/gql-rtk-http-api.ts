import { GraphQLClient } from 'graphql-request'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import { createApi } from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'
import { API_URL } from '../сonstants/constants'
import type { IContentFactoryProject, IContentFactoryEdge, IContentFactoryNode, IContentFactoryTemplate } from '../models/models'

// --- GraphQL Client
const gqlHttpClient = new GraphQLClient(`${API_URL}/graphql`, {
  headers: () => ({
    Authorization: `JWT ${Cookies.get('radar')}`,
  }),
  // middleware to add operation name to the url (for better visual identification inside devtools)
  requestMiddleware: (request) => {
    const { operationName } = request
    return operationName ? { ...request, url: `${request.url}?gqlOperationName=${operationName}` } : request
  },
})

// --- GraphQL Base Query (for RTK Query)
export const graphqlBaseQuery: BaseQueryFn<
  { document: string; variables?: Record<string, unknown> }
> = async ({ document, variables }) => {
  try {
    const data = await gqlHttpClient.request(document, variables)
    return { data }
  } catch (error) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

// --- Content Factory API RTK-Query
export const CONTENT_FACTORY_API = createApi({
  reducerPath: 'CONTENT_FACTORY_API',
  baseQuery: graphqlBaseQuery,
  tagTypes: ['ContentFactoryProjects', 'ContentFactoryProject', 'ContentFactoryNodes', 'ContentFactoryEdges', 'ContentFactoryTemplates'],
  endpoints: (builder) => ({
    // --- templates
    getContentFactoryTemplates: builder.query<IContentFactoryTemplate[], void>({
      query: () => ({
        document: `
          query GetContentFactoryTemplates {
            contentFactoryTemplates {
              id
              name
              previewUrl
              previewThumbnailUrl
            }
          }
        `,
      }),
      transformResponse: (response: { contentFactoryTemplates: IContentFactoryTemplate[] }) =>
        response.contentFactoryTemplates,
      providesTags: ['ContentFactoryTemplates'],
    }),
    // --- projects
    getContentFactoryProjects: builder.query<IContentFactoryProject[], void>({
      query: () => ({
        document: `
          query GetContentFactoryProjects {
            contentFactoryProjects {
              id
              name
              canvasMetadata
              createdAt
              isPublic
              publicId
            }
          }
        `,
      }),
      transformResponse: (response: { contentFactoryProjects: IContentFactoryProject[] }) =>
        response.contentFactoryProjects,
      providesTags: ['ContentFactoryProjects'],
    }),
    getContentFactoryProjectById: builder.query<IContentFactoryProject, string>({
      query: (projectId) => ({
        document: `
          query GetContentFactoryProjectById($projectId: ID!) {
            contentFactoryProject(projectId: $projectId) {
              id
              name
              canvasMetadata
              createdAt
              publicId
              isPublic
            }
          }
        `,
        variables: { projectId },
      }),
      providesTags: ['ContentFactoryProject'],
      transformResponse: (response: { contentFactoryProject: IContentFactoryProject }) =>
        response.contentFactoryProject,
    }),
    updateContentFactoryProjectName: builder.mutation<IContentFactoryProject, { projectId: string; name: string }>({
      query: (variables) => ({
        document: `
          mutation UpdateContentFactoryProjectName($projectId: ID!, $name: String!) {
            updateContentFactoryProjectName(projectId: $projectId, name: $name) {
              id
              name
            }
          }
        `,
        variables,
      }),
      invalidatesTags: ['ContentFactoryProjects'],
      transformResponse: (response: { renameContentFactoryProject: IContentFactoryProject }) =>
        response.renameContentFactoryProject,
    }),
    deleteContentFactoryProject: builder.mutation<boolean, { projectId: string }>({
      query: (variables) => ({
        document: `
          mutation DeleteContentFactoryProject($projectId: ID!) {
            deleteContentFactoryProject(projectId: $projectId)
          }
        `,
        variables,
      }),
      invalidatesTags: ['ContentFactoryProjects'],
      transformResponse: (response: { deleteContentFactoryProject: boolean }) =>
        response.deleteContentFactoryProject,
    }),
    duplicateContentFactoryProject: builder.mutation<IContentFactoryProject, { projectId: string }>({
      query: (variables) => ({
        document: `
          mutation DuplicateContentFactoryProject($projectId: ID!) {
            duplicateContentFactoryProject(projectId: $projectId) {
              id
              name
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { duplicateContentFactoryProject: IContentFactoryProject }) =>
        response.duplicateContentFactoryProject,
      invalidatesTags: ['ContentFactoryProjects'],
    }),
    createContentFactoryProject: builder.mutation<IContentFactoryProject, { name: string; canvasMetadata?: string }>({
      query: (variables) => ({
        document: `
          mutation CreateContentFactoryProject($name: String!, $canvasMetadata: JSON) {
            createContentFactoryProject(input: { name: $name, canvasMetadata: $canvasMetadata }) {
              id
              name
              canvasMetadata
              createdAt
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { createContentFactoryProject: IContentFactoryProject }) =>
        response.createContentFactoryProject,
      invalidatesTags: ['ContentFactoryProjects'],
    }),
    createContentFactoryProjectFromTemplate: builder.mutation<IContentFactoryProject, { templateId: string; name: string }>({
      query: (variables) => ({
        document: `
          mutation CreateContentFactoryProjectFromTemplate($templateId: ID!, $name: String!) {
            createContentFactoryProjectFromTemplate(templateId: $templateId, name: $name) {
              id
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { createContentFactoryProjectFromTemplate: IContentFactoryProject }) =>
        response.createContentFactoryProjectFromTemplate,
      invalidatesTags: ['ContentFactoryProjects'],
    }),
    // --- current project
    getContentFactoryNodes: builder.query<IContentFactoryNode[], string>({
      query: (projectId) => ({
        document: `
          query GetContentFactoryNodes($projectId: ID!) {
            contentFactoryNodes(projectId: $projectId) {
              id
              positionX
              positionY
              type
              pinType
              contentType
              zIndex
              prompt
              data
              status
              resultUrl
              resultUrlThumbnail
              cacheKey
              aiModel
              aspectRatio
              lastTaskId
              updatedAt
              generation {
                id
                status
                prompt
                reference
                referenceThumbnails
                result
                resultThumbnail
                createdAt
                completedAt
                generationTimings
              }
            }
          }
        `,
        variables: { projectId },
      }),
      providesTags: ['ContentFactoryNodes'],
      transformResponse: (response: { contentFactoryNodes: IContentFactoryNode[] }) =>
        response.contentFactoryNodes

    }),
    getContentFactoryEdges: builder.query<IContentFactoryEdge[], string>({
      query: (projectId) => ({
        document: `
          query GetContentFactoryEdges($projectId: ID!) {
            contentFactoryEdges(projectId: $projectId) {
              id
              sourceNodeId
              targetNodeId
              sourceHandle
              targetHandle
              status
              staleSince
              createdAt
              updatedAt
            }
          }
        `,
        variables: { projectId },
      }),
      providesTags: ['ContentFactoryEdges'],
      transformResponse: (response: { contentFactoryEdges: IContentFactoryEdge[] }) =>
        response.contentFactoryEdges,
    }),
    createContentFactoryNode: builder.mutation<{ id: string }, { projectId: string; aiModel?: string; aspectRatio?: string; pinType: string; contentType: string; positionX: number; positionY: number; zIndex: number; data?: Record<string, unknown> }>({
      query: (variables) => ({
        document: `
          mutation CreateContentFactoryNode($projectId: ID!, $aiModel: String, $aspectRatio: String, $pinType: String!, $contentType: String!, $positionX: Float!, $positionY: Float!, $zIndex: Int!, $data: JSON) {
            createContentFactoryNode(input: { projectId: $projectId, aiModel: $aiModel, aspectRatio: $aspectRatio, pinType: $pinType, contentType: $contentType, positionX: $positionX, positionY: $positionY, zIndex: $zIndex, data: $data }) {
              id
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { createContentFactoryNode: { id: string } }) =>
        response.createContentFactoryNode,
    }),
    duplicateContentFactoryNode: builder.mutation<{ id: string }, { nodeId: string; positionX?: number; positionY?: number }>({
      query: (variables) => ({
        document: `
          mutation duplicateContentFactoryNode($nodeId: ID!, $positionX: Float!, $positionY: Float!) {
            duplicateContentFactoryNode(nodeId: $nodeId, positionX: $positionX, positionY: $positionY) {
              id
            }
          }
        `,
        variables,
      }),
      invalidatesTags: ['ContentFactoryNodes', 'ContentFactoryEdges'],
      transformResponse: (response: { duplicateContentFactoryNode: { id: string } }) =>
        response.duplicateContentFactoryNode,
    }),
    updateContentFactoryNodeData: builder.mutation<unknown, { nodeId: string; data?: Record<string, unknown> }>({
      query: (variables) => ({
        document: `
          mutation UpdateContentFactoryNodeData($nodeId: ID!, $data: JSON) {
            updateContentFactoryNodeData(nodeId: $nodeId, data: $data) {
              id
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { updateContentFactoryNodeData: unknown }) =>
        response.updateContentFactoryNodeData,
    }),
    updateContentFactoryNodeAiModel: builder.mutation<unknown, { nodeId: string; aiModel: string }>({
      query: (variables) => ({
        document: `
          mutation UpdateContentFactoryNodeAiModel($nodeId: ID!, $aiModel: String!) {
            updateContentFactoryNodeAiModel(nodeId: $nodeId, aiModel: $aiModel) {
              id
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { updateContentFactoryNodeAiModel: unknown }) =>
        response.updateContentFactoryNodeAiModel,
    }),
    updateContentFactoryNodeAspectRatio: builder.mutation<unknown, { nodeId: string; aspectRatio: string }>({
      query: (variables) => ({
        document: `
          mutation UpdateContentFactoryNodeAspectRatio($nodeId: ID!, $aspectRatio: String!) {
            updateContentFactoryNodeAspectRatio(nodeId: $nodeId, aspectRatio: $aspectRatio) {
              id
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { updateContentFactoryNodeAspectRatio: unknown }) =>
        response.updateContentFactoryNodeAspectRatio,
    }),
    updateContentFactoryNodePrompt: builder.mutation<unknown, { nodeId: string; prompt: string }>({
      query: (variables) => ({
        document: `
          mutation UpdateContentFactoryNodePrompt($nodeId: ID!, $prompt: String!) {
            updateContentFactoryNodePrompt(nodeId: $nodeId, prompt: $prompt) {
              id
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { updateContentFactoryNodePrompt: unknown }) =>
        response.updateContentFactoryNodePrompt,
    }),
    updateContentFactoryNodePosition: builder.mutation<unknown, { nodeId: string; positionX: number; positionY: number }>({
      query: (variables) => ({
        document: `
          mutation updateContentFactoryNodePosition($nodeId: ID!, $positionX: Float!, $positionY: Float!) {
            updateContentFactoryNodePosition(nodeId: $nodeId, x: $positionX, y: $positionY) {
              id
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { updateContentFactoryNodePosition: unknown }) =>
        response.updateContentFactoryNodePosition,
    }),
    createContentFactoryEdge: builder.mutation<{ id: string }, { projectId: string; sourceNodeId: string; targetNodeId: string; sourceHandle?: string; targetHandle?: string }>({
      query: (variables) => ({
        document: `
          mutation CreateContentFactoryEdge($projectId: ID!, $sourceNodeId: ID!, $targetNodeId: ID!, $sourceHandle: String, $targetHandle: String) {
            createContentFactoryEdge(input: { projectId: $projectId, sourceNodeId: $sourceNodeId, targetNodeId: $targetNodeId, sourceHandle: $sourceHandle, targetHandle: $targetHandle }) {
              id
            }
          }
        `,
        variables,
      }),
      invalidatesTags: ['ContentFactoryEdges'],
      transformResponse: (response: { createContentFactoryEdge: { id: string } }) =>
        response.createContentFactoryEdge,
    }),
    deleteContentFactoryEdge: builder.mutation<unknown, { edgeId: string }>({
      query: (variables) => ({
        document: `
          mutation DeleteContentFactoryEdge($edgeId: ID!) {
            deleteContentFactoryEdge(edgeId: $edgeId)
          }
        `,
        variables,
      }),
      invalidatesTags: ['ContentFactoryEdges'],
      transformResponse: (response: { deleteContentFactoryEdge: boolean }) =>
        response.deleteContentFactoryEdge,
    }),
    generateContentFactoryNode: builder.mutation<{ id: string }, { nodeId: string }>({
      query: (variables) => ({
        document: `
          mutation GenerateContentFactoryNode($nodeId: ID!) {
            generateContentFactoryNode(nodeId: $nodeId) {
              id
            }
          }
        `,
        variables,
      }),
      transformResponse: (response: { generateContentFactoryNode: { id: string } }) =>
        response.generateContentFactoryNode,
    }),
    deleteContentFactoryNode: builder.mutation<unknown, { nodeId: string }>({
      query: (variables) => ({
        document: `
          mutation DeleteContentFactoryNode($nodeId: ID!) {
            deleteContentFactoryNode(nodeId: $nodeId)
          }
        `,
        variables,
      }),
      transformResponse: (response: { deleteContentFactoryNode: unknown }) =>
        response.deleteContentFactoryNode,
    }),
    // --- sharing
    publishContentFactoryProject: builder.mutation<Pick<IContentFactoryProject, 'id' | 'isPublic' | 'publicId'>, string>({
      query: (projectId) => ({
        document: `
          mutation PublishContentFactoryProject($projectId: ID!) {
            publishContentFactoryProject(projectId: $projectId) {
              id
              isPublic
              publicId
            }
          }
        `,
        variables: { projectId },
      }),
      invalidatesTags: ['ContentFactoryProjects', 'ContentFactoryProject'],
      transformResponse: (response: {
        publishContentFactoryProject: Pick<IContentFactoryProject, 'id' | 'isPublic' | 'publicId'>
      }) => response.publishContentFactoryProject,
    }),
    unPublishContentFactoryProject: builder.mutation<Pick<IContentFactoryProject, 'id' | 'isPublic' | 'publicId'>, string>({
      query: (projectId) => ({
        document: `
          mutation UnpublishContentFactoryProject($projectId: ID!) {
            unpublishContentFactoryProject(projectId: $projectId) {
              id
              isPublic
              publicId
            }
          }
        `,
        variables: { projectId },
      }),
      invalidatesTags: ['ContentFactoryProjects', 'ContentFactoryProject'],
      transformResponse: (response: {
        publishContentFactoryProject: Pick<IContentFactoryProject, 'id' | 'isPublic' | 'publicId'>
      }) => response.publishContentFactoryProject,
    }),
  }),
})