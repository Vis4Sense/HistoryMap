<script setup lang="ts">
import type { Schema } from '@/types/schema.d'
import { useSchemaEditor } from '@/composables/useSchemaEditor'

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
</script>

<template>
  <div p="x-2 y-1">
    <div flex justify-between items-center>
      <div>Schema</div>
      <div>
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
