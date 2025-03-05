import { SchemaTreeNode } from "@/types/schema"

export type TargetPosition = 'before' | 'after' | 'inside'

interface DropTarget {
  data: SchemaTreeNode
  position: TargetPosition
}

const state = {
  draggedData: ref<SchemaTreeNode | null>(null),
  draggedOverData: ref<DropTarget | null>(null),
  isDragging: ref(false),
}

export function useDragAndDropTree() {

  const {
    draggedData,
    draggedOverData,
    isDragging,
  } = state

  function onDragStart(data: SchemaTreeNode) {
    draggedData.value = data
    isDragging.value = true
  }

  function onDragOver(data: SchemaTreeNode, position: TargetPosition = 'inside') {
    draggedOverData.value = { data, position }
  }

  function onDragLeave() {
    draggedOverData.value = null
  }

  function onDragEnd() {
    draggedData.value = null
    draggedOverData.value = null
    isDragging.value = false
  }

  return {
    ...state,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDragEnd,
  }
}