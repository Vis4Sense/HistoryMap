import type { Concept, SchemaTreeNode } from '@/types/schema'

export type TargetPosition = 'before' | 'after' | 'inside'

interface SourceData {
  id: string // id of the source node
  concepts: Concept[]
}

interface TargetData {
  id: string
  treeNode: SchemaTreeNode | null
  position: TargetPosition
}

const state = {
  sourceData: ref<SourceData | null>(null),
  targetData: ref<TargetData | null>(null),
  isDragging: ref(false),
}

export function useDragAndDropTree() {
  const {
    sourceData,
    targetData,
    isDragging,
  } = state

  function onDragStart(id: string, data: Concept[]) {
    sourceData.value = { id, concepts: data }
    isDragging.value = true
  }

  function onDragOver(
    id: string,
    data: SchemaTreeNode,
    position: TargetPosition = 'inside',
  ) {
    targetData.value = { id, treeNode: data, position }
  }

  function onDragLeave() {
    targetData.value = null
  }

  function onDragEnd() {
    sourceData.value = null
    targetData.value = null
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
