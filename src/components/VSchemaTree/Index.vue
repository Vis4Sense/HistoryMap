<script setup lang="ts">
import type { Provenance, Schema } from '@/types/schema'
import type { TreeNode } from './tree'
import { useDragAndDropTree } from '@/composables/useDnDTree'
import { useSelectionState } from '@/composables/useSchemaMap'
import { newSchema } from '@/types/schema.d'
import { Tree } from './tree'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  schema: {
    type: Object as PropType<Schema>,
    default: () => newSchema(),
  },
})

const emit = defineEmits<{
  updateSchema: [schema: Schema]
  addSource: [sourceId: string]
}>()

const { id, schema } = toRefs(props)
const schemaTitle = ref(null as HTMLDivElement | null)
const lod = computed(() => schema.value.lod ?? 'summary')

const modeOptions = ['view', 'edit']
const modeIndex = ref(0)

const { onDragStart, onDragEnd, sourceData } = useDragAndDropTree()

/** convert schema to tree for vis and edit */
const tree = ref(createTree())
watch(schema, () => {
  tree.value = createTree()
}, { deep: true })

function createTree() {
  return new Tree(schema.value.concepts)
}

/** handle schema title update */
function updateSchemaTitle() {
  if (schemaTitle.value) {
    const title = schemaTitle.value.textContent?.trim() || ''
    if (title) {
      emit('updateSchema', { ...schema.value, title })
    }
  }
}

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
  const sourceTree = new Tree(sourceData.value.concepts)
  const sourceNodes = sourceTree.root.children ?? []

  if (sourceData.value.id === id.value
    && sourceTree.toConcepts().some(d => d.name === node.name)
  ) {
    return
  }

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
    emit('addSource', sourceData.value.id)
  }

  if (position === 'inside') {
    sourceNodes.forEach((d) => {
      if (d.name === node.name) {
        node.merge(d)
      }
      else {
        node.addChild(d)
      }
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
    draggable="true"
    @dragstart="dragStart(tree.root)"
    @dragend="onDragEnd"
  >
    <div flex justify-between items-center>
      <div
        flex gap-1 text-transparent hover:text-gray-6
      >
        <BasicButtonCircular
          :bg="lod === 'concept'"
          @click="emit('updateSchema', { ...schema, lod: 'concept' })"
        >
          <div i-mdi-label-outline />
        </BasicButtonCircular>
        <BasicButtonCircular
          :bg="lod === 'summary'"
          @click="emit('updateSchema', { ...schema, lod: 'summary' })"
        >
          <div i-mdi-format-list-bulleted />
        </BasicButtonCircular>
        <BasicButtonCircular
          :bg="lod === 'detail'"
          @click="emit('updateSchema', { ...schema, lod: 'detail' })"
        >
          <div i-mdi-format-list-text />
        </BasicButtonCircular>
      </div>

      <div
        ref="schemaTitle"
        contenteditable
        cursor-auto
        class="nodrag"
        :class="{
          'text-gray-3': !schema.title,
          'font-medium text-base': schema.title,
        }"
        @blur="updateSchemaTitle"
        @keydown.enter.prevent="(e) => e.target.blur()"
      >
        {{ schema?.title ?? 'Schema' }}
      </div>

      <div flex gap-1>
        <BasicToolbarIcon plain @click="() => modeIndex = (modeIndex + 1) % modeOptions.length">
          <div v-if="modeOptions[modeIndex] === 'view'" i-mdi-eye-outline />
          <div v-else i-mdi-pencil-outline />
        </BasicToolbarIcon>
        <BasicToolbarIcon plain>
          <div i-carbon-draggable />
        </BasicToolbarIcon>
      </div>
    </div>

    <VSchemaTreeNode
      :class="{
        'max-h-16 overflow-auto': lod === 'concept',
      }"
      :node="tree.root"
      :lod="lod"
      :mode="modeOptions[modeIndex]!"
      @add-node="onEdit($event)"
      @remove-node="onEdit($event)"
      @update-node="onEdit($event)"
      @drag-start="dragStart"
      @drag-end="onDragEnd"
      @drop-node="onDrop"
      @toggle-node="(node: TreeNode) => {
        const { toggleConcept } = useSelectionState()
        toggleConcept(node.toConcept())
      }"
    />
  </div>
</template>
