<script setup lang="ts">
import type { TargetPosition } from '@/composables/useDnDTree'
import type { Annotation } from '@/types/historymap'
import type { Schema } from '@/types/schema.d'
import Header from '@/components/Canvas/nodes/SchemaNode/Header.vue'
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import { newSchema } from '@/types/schema.d'
import _ from 'lodash'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  type: {
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

const { id, schema, annotations } = toRefs(props)

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

/** create new schema node */
function createSchemaNode() {
  schemaEditor.createSchemaNode()
}

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
function moveNode(nodeName: string, targetName: string, position: TargetPosition) {
  if (position === 'inside') {
    schemaEditor.moveNodeInto(nodeName, targetName)
  }
  else if (position === 'before') {
    schemaEditor.moveNodeBefore(nodeName, targetName)
  }
  else if (position === 'after') {
    schemaEditor.moveNodeAfter(nodeName, targetName)
  }
}

/** add tags to schema tree */
watch(annotations, (newVal, oldVal) => {
  const newTags = newVal.map(a => a.tags ?? []).flat()
  const oldTags = oldVal.map(a => a.tags ?? []).flat()

  const added = _.difference(newTags, oldTags)
  const removed = _.difference(oldTags, newTags)

  // console.log('added', added)
  // console.log('removed', removed)

  added.forEach((tag) => {
    if (schema.value.concepts.find(c => c.name === tag)) {
      return
    }
    schemaEditor.addRoot({ name: tag })
  })

  removed.forEach((tag) => {
    schemaEditor.deleteNode({ name: tag })
  })
}, { deep: true })
</script>

<template>
  <div space-y-1 overflow-auto flex flex-col p="x-2 y-1">
    <div
      shrink-0
      h-4
      truncate text-xs
    >
      <slot name="header">
        <div flex justify-between items-center>
          <Header :schema="schema" />

          <div v-if="mode === 'edit'">
            <BasicToolbarIcon
              plain
              @click="createSchemaNode()"
            >
              <div i-mdi-puzzle-plus-outline />
            </BasicToolbarIcon>
          </div>
        </div>
      </slot>
    </div>

    <div v-if="mode === 'edit'" shrink-0 flex>
      <BasicToolbarIcon plain @click="startEditing">
        <div i-carbon-add />
      </BasicToolbarIcon>
    </div>

    <div flex-auto space-y-1 overflow-auto>
      <SchemaTreeNode
        v-for="root, idx in schema.schemaTree.roots"
        :id="id"
        :key="root.name"
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
