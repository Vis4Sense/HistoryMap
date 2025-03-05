<script setup lang="ts">
import type { Schema } from '@/types/schema.d'
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import { newSchema } from '@/types/schema.d'

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
  sync: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String,
    default: 'edit',
  },
})

const { id, schema } = toRefs(props)

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
</script>

<template>
  <div space-y-1 overflow-auto flex flex-col>
    <div
      shrink-0
      h-6
      p="x-2 y-1"
      truncate text-xs
    >
      <slot :name="type">
        Schema
      </slot>
    </div>

    <div v-if="mode === 'edit'" shrink-0 flex>
      <BasicToolbarIcon plain @click="startEditing">
        <div i-carbon-add />
      </BasicToolbarIcon>
    </div>

    <div flex-auto space-y-1 overflow-auto>
      <SchemaTreeRoot
        v-for="root in schema.schemaTree.roots"
        :id="id"
        :key="root.name"
        :root="root"
        :mode="mode"
        @add-child="addChild"
        @delete-node="deleteNode"
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
