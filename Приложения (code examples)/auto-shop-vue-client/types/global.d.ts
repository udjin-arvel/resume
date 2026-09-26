declare type JsonData<T> = { [key: string]: T }

interface Window {
  jivo_init?: () => void
  jivo_destroy?: () => void
}
