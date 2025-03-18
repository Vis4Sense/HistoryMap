<script setup lang="ts">
import type { Provenance, Schema } from '@/types/schema'
import type { TreeNode } from './tree'
import { useDragAndDropTree } from '@/composables/useDnDTree'
import _ from 'lodash'
import { Tree } from './tree'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  schema: {
    type: Object as PropType<Schema>,
    required: true,
  },
})

const emit = defineEmits<{
  updateSchema: [schema: Schema]
}>()

const { id, schema } = toRefs(props)

const { onDragStart, onDragEnd, sourceData } = useDragAndDropTree()

/** convert schema to tree for vis and edit */
const tree = ref(new Tree(schema.value.concepts))
watch(schema, (newVal) => {
  tree.value = new Tree(newVal.concepts)
}, { deep: true })

/** emit tree edit */
function onEdit(provenance: Provenance) {
  const newSchema = {
    ...schema.value,
    concepts: tree.value.toConcepts(),
    provenance: [...(schema.value.provenance ?? []), provenance],
  }
  emit('updateSchema', newSchema)
}

/** handle drag start */
function dragStart(node: TreeNode) {
  const concepts = node.toConcepts()
  onDragStart(id.value, concepts)
}

/** handle drop node */
function onDrop(node: TreeNode, position: 'inside' | 'before' | 'after') {
  if (!sourceData.value)
    return
  const sourceNodes = new Tree(sourceData.value.concepts).root.children ?? []

  const provenance: Provenance = {
    time: Date.now(),
    changeType: sourceData.value.id === id.value
      ? 'move'
      : 'add',
    diff: {
      old: sourceData.value.id === id.value
        ? sourceData.value.concepts
        : null,
      new: null,
    },
  }

  // remove original node if moved within the same tree
  if (sourceData.value.id === id.value) {
    sourceNodes.forEach((node) => {
      tree.value.removeConcept(node.name)
    })
  }
  else {
    provenance.sourcePage = sourceData.value.id
  }

  if (position === 'inside') {
    sourceNodes.forEach((d) => {
      node.addChild(d)
    })
  }
  else if (position === 'before') {
    sourceNodes.forEach((d) => {
      node.insertBefore(d)
    })
  }
  else if (position === 'after') {
    sourceNodes.forEach((d) => {
      node.insertAfter(d)
    })
  }

  provenance.diff.new = sourceNodes
    .map(node => node.toConcept())

  onEdit(provenance)
}
</script>

<template>
  <div
    space-y-1 flex flex-col p="x-2 y-1"
  >
    <VSchemaTreeNode
      :node="tree.root"
      @add-node="onEdit($event)"
      @remove-node="onEdit($event)"
      @update-node="onEdit($event)"
      @drag-start="dragStart"
      @drag-end="onDragEnd"
      @drop-node="onDrop"
    />
  </div>
</template>
