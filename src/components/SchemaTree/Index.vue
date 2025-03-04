<script setup lang="ts">
import type { Schema } from '@/types/schema.d'
import { useSchemaSync } from '@/composables/useSchemaSync'
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
  }
})

const { id, schema } = toRefs(props)

const {
  commitAddRoot,
  commitAddChild,
  commitDeleteNode,
} = useSchemaSync()

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
  commitAddRoot(id.value, name)
}

// add child
function addChild(childName: string, parentName: string) {
  commitAddChild(id.value, childName, parentName)
}

// delete node
function deleteNode(name: string) {
  commitDeleteNode(id.value, name)
}
</script>

<template>
  <div p="x-2 y-1" space-y-1 overflow-auto flex flex-col>
    <div
      shrink-0
      max-w="3/4" h-5
      w-fit
      p="x-2 y-0.5"
      bg-gray-1 rounded-lg
      truncate text-xs
    >
      <slot :name="type">
        Schema
      </slot>
    </div>

    <div shrink-0 flex v-if="mode === 'edit'">
      <BasicToolbarIcon plain>
        <div i-material-symbols-light-sync
          :class="sync ? 'text-green-6' : 'text-gray-3'"
        />
      </BasicToolbarIcon>
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
