import { /*useRef,*/ useEffect } from 'react'
import { createClient } from 'graphql-ws'
import Cookies from 'js-cookie'
import { WS_API_URL } from '../сonstants/constants'
import type { ISocketMessageData } from '../models/models'

const params = {
  url: WS_API_URL,
  connectionParams: () => {
    const token = Cookies.get('radar')
    return{
    Authorization: `JWT ${token}`,
    keepalive: true,
  }},
}

// --- сlient
export const gqlWsClient = createClient(params)

// --- ws api wrapped in hook
export const useContentFactorySocket = (
  projectId: string,
  options?: {
    onNodeUpdated?: (updateData: ISocketMessageData) => void;
  }
) => {
  // const nodesRef = useRef([])
  const { onNodeUpdated } = options ?? {}

  useEffect(() => {
    if (!projectId) return
    const unsubscribe = gqlWsClient.subscribe(
      {
        query: `subscription ($projectId: ID!) {
          contentFactoryEvents(projectId: $projectId) {
            projectId
            eventType
            message
            payload
          }
        }`,
        variables: { projectId },
      },
      {
        next: ({ data }: { data: { contentFactoryEvents: ISocketMessageData } }) => {
          // console.log('data', data)
          onNodeUpdated?.(data?.contentFactoryEvents)
        },
        error: console.error,
        complete: () => { },
      }
    )
    return () => {
      unsubscribe()
  }
  }, [projectId])
}