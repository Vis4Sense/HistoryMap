<script setup lang="ts">
import type { TargetPosition } from '@/composables/useDnDTree'
import type { Annotation } from '@/types/historymap'
import type { Schema } from '@/types/schema.d'
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import { newSchema } from '@/types/schema.d'
import _ from 'lodash'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  schema: {
    type: Object as PropType<Schema>,
    default: newSchema(),
  },
  mode: {
    type: String,
    default: 'edit',
  },
  annotations: {
    type: Array as PropType<Annotation[]>,
    default: () => [],
  },
})

const emit = defineEmits<{
  updateSchemaTreeHeight: [height: number]
}>()

const { id, schema, annotations } = toRefs(props)

const container = ref<HTMLElement>()

useResizeObserver(container, () => {
  nextTick(() => {
    emit('updateSchemaTreeHeight', container.value?.clientHeight || 0)
  })
})

let schemaEditor = useSchemaEditor(id.value)
watch(id, (newVal) => {
  schemaEditor = useSchemaEditor(newVal)
})

/** temporary div to support adding new root */
const newRoot = ref<HTMLDivElement>()
const newConcept = ref('')
const isEditing = ref(false)

function startEditing() {
  isEditing.value = true
  nextTick(() => {
    newRoot.value?.focus()
  })
}

function saveRoot() {
  const newValue = newRoot.value?.textContent?.trim()
  if (newValue) {
    addRoot(newValue)
  }
  newConcept.value = ''
  isEditing.value = false
}

onClickOutside(newRoot, () => {
  newRoot.value?.blur()
  newConcept.value = ''
  isEditing.value = false
})

/** handle tree editing */

// add root
function addRoot(name: string) {
  schemaEditor.addRoot({ name })
}

// add child
function addChild(childName: string, parentName: string) {
  schemaEditor.addChild({ name: childName }, parentName)
}

// delete node
function deleteNode(name: string) {
  schemaEditor.deleteNode({ name })
}

// move node
function moveNode(
  sourceId: string,
  sourceName: string,
  targetId: string,
  targetName: string,
  position: TargetPosition,
) {
  if (position === 'inside') {
    schemaEditor.moveNodeInto(sourceName, targetName, sourceId)
  }
  else if (position === 'before') {
    schemaEditor.moveNodeBefore(sourceName, targetName, sourceId)
  }
  else if (position === 'after') {
    schemaEditor.moveNodeAfter(sourceName, targetName, sourceId)
  }
}

/** add tags to schema tree */
watch(annotations, (newVal, oldVal) => {
  const newTags = newVal.map(a => a.tags ?? []).flat()
  let oldTags = oldVal.map(a => a.tags ?? []).flat()

  // FIXME: when adding the first tag, the changes is not captured by vue
  // Here we manually set oldTags to empty array. What would be a better way?
  if (oldTags.length === 1 && newTags.length > 0) {
    oldTags = []
  }

  // console.log('newTags', newTags)
  // console.log('oldTags', oldTags)

  const added = _.difference(newTags, oldTags)
  const removed = _.difference(oldTags, newTags)

  // console.log('added', added)
  // console.log('removed', removed)

  nextTick(() => {
    added.forEach((tag) => {
      if (schema.value.concepts.find(c => c.name === tag)) {
        return
      }
      schemaEditor.addRoot({ name: tag })
    })

    removed.forEach((tag) => {
      schemaEditor.deleteNode({ name: tag })
    })
  })
}, { deep: true })
</script>

<template>
  <div
    ref="container"
    space-y-1 flex flex-col p="x-2 y-1"
    h-fit
  >
    <div v-if="mode === 'edit'" shrink-0 flex>
      <BasicToolbarIcon plain @click="startEditing">
        <div i-carbon-add />
      </BasicToolbarIcon>
    </div>

    <div flex-auto space-y-1 overflow-auto>
      <SchemaTreeNode
        v-for="root, idx in schema.schemaTree.roots"
        :id="id"
        :key="root && root.name"
        :index="idx"
        :node="root"
        :mode="mode"
        @add-child="addChild"
        @delete-node="deleteNode"
        @move-node="moveNode"
      />

      <div
        v-if="isEditing"
        ref="newRoot"
        contenteditable="true"
        px-1
        @keydown.enter.prevent="saveRoot"
        v-text="newConcept"
      />
    </div>
  </div>
</template>
