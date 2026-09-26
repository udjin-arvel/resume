import { ref } from "vue"
import type { Ref } from "vue"
import type { FileResponse } from "~/types/form/file"

type DragTarget = "photo" | "nameplate" | "defect"

export function usePhotoDragDrop(
  photoFilesRef: Ref<FileResponse[]>,
  nameplateFilesRef: Ref<FileResponse[]>,
  defectFilesRef: Ref<FileResponse[]>,
) {
  const dragSource = ref<DragTarget | null>(null)
  const dragFromIndex = ref<number | null>(null)
  const dragOverIndex = ref<number | null>(null)
  const dragOverTarget = ref<DragTarget | null>(null)

  function getFilesRef(target: DragTarget): FileResponse[] {
    if (target === "photo") {
      return photoFilesRef.value
    }
    if (target === "nameplate") {
      return nameplateFilesRef.value
    }
    return defectFilesRef.value
  }

  function onDragStart(event: DragEvent, source: DragTarget, fromIndex: number) {
    const files = getFilesRef(source)
    const file = files[fromIndex]
    if (!file) {
      return
    }

    dragSource.value = source
    dragFromIndex.value = fromIndex
    dragOverIndex.value = null
    dragOverTarget.value = null

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/plain", String(file.id))
    }
  }

  function onDragOver(event: DragEvent, target: DragTarget, toIndex: number) {
    if (!dragSource.value || dragFromIndex.value === null) {
      return
    }
    if (dragSource.value !== target) {
      return
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move"
    }
    dragOverTarget.value = target
    dragOverIndex.value = toIndex
  }

  function onDragLeave(target: DragTarget, toIndex: number) {
    if (dragOverTarget.value === target && dragOverIndex.value === toIndex) {
      dragOverIndex.value = null
      dragOverTarget.value = null
    }
  }

  function onDrop(target: DragTarget, toIndex: number) {
    if (!dragSource.value || dragFromIndex.value === null) {
      onDragEnd()
      return
    }

    // Reorder only within the same collection
    if (dragSource.value !== target) {
      onDragEnd()
      return
    }

    const fromIndex = dragFromIndex.value
    if (fromIndex === toIndex) {
      onDragEnd()
      return
    }

    const files = getFilesRef(target)
    if (fromIndex < 0 || fromIndex >= files.length || toIndex < 0 || toIndex >= files.length) {
      onDragEnd()
      return
    }

    const [moved] = files.splice(fromIndex, 1)
    if (!moved) {
      onDragEnd()
      return
    }
    files.splice(toIndex, 0, moved)

    onDragEnd()
  }

  function onDragEnd() {
    dragSource.value = null
    dragFromIndex.value = null
    dragOverIndex.value = null
    dragOverTarget.value = null
  }

  function isDropTarget(target: DragTarget, index: number): boolean {
    return dragOverTarget.value === target
      && dragOverIndex.value === index
      && dragSource.value === target
      && dragFromIndex.value !== index
  }

  return {
    dragSource,
    dragFromIndex,
    dragOverIndex,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDragEnd,
    onDrop,
    isDropTarget,
  }
}
