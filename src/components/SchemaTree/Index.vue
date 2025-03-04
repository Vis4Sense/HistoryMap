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
})

const { id, schema } = toRefs(props)

const schemaEditor = useSchemaEditor(id.value, schema.value)

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

/** update schema editor parameters */
watch(id, (newVal) => {
  schemaEditor.id(newVal)
})
watch(schema, (newVal) => {
  schemaEditor.schema(newVal)
}, { deep: true })

/** handle tree editing */

// add root
function addRoot(name: string) {
  schemaEditor.addRoot({ name })
}

// add child
function addChild(childName: string, parentName: string) {
  schemaEditor.addChild({ name: childName }, { name: parentName })
}

// delete node
function deleteNode(name: string) {
  console.log('delete node', name)
  schemaEditor.deleteNode({ name })
}
</script>

<template>
  <div p="x-2 y-1" w-full>
    <div flex justify-between items-center gap-2>
      <div flex-auto truncate>
        <slot :name="type">Schema</slot>
      </div>
      <div shrink-0>
        <BasicToolbarIcon @click="startEditing">
          <div i-carbon-add />
        </BasicToolbarIcon>
      </div>
    </div>

    <div space-y-1>
      <SchemaTreeRoot
        v-for="root in schema.schemaTree.roots"
        :id="id"
        :key="root.name"
        :root="root"
        @add-child="addChild"
        @delete-node="deleteNode"
      />
    </div>

    <div
      v-if="isEditing"
      ref="newRoot"
      contenteditable="true"
      px-1
      @keydown.enter.prevent="saveRoot"
      v-text="newConcept"
    />
  </div>
</template>
