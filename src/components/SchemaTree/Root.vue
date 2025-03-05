<script setup lang="ts">
import type { SchemaTreeNode } from '@/types/schema'
import type { PropType } from 'vue'
import Root from './Root.vue'

const props = defineProps({
  root: {
    type: Object as PropType<SchemaTreeNode>,
    required: true,
  },
})

/** define emits */
const emit = defineEmits<{
  addChild: [childName: string, rootName: string]
  deleteNode: [nodeName: string]
}>()

const { root } = toRefs(props)

/** show toolbar of root node or not */
const showToolbar = ref(false)

/** temporary div to support adding child node */
const newChildEle = ref<HTMLDivElement>()
const newChild = ref('')
const isEditing = ref(false)

function startEditing() {
  isEditing.value = true
  nextTick(() => {
    newChildEle.value?.focus()
  })
}

function saveChild() {
  const newValue = newChildEle.value?.textContent?.trim()
  if (newValue && root.value) {
    emit('addChild', newValue, root.value.name)
  }
  newChild.value = ''
  isEditing.value = false
}

onClickOutside(newChildEle, () => {
  newChildEle.value?.blur()
  newChild.value = ''
  isEditing.value = false
})
</script>

<template>
  <div ml-4>
    <div
      w-full
      flex justify-between items-start
      relative
      @mouseover="showToolbar = true"
      @mouseleave="showToolbar = false"
    >
      <div
        absolute left-0 translate-x="-100%"
        text-gray-3
      >
        <div v-if="root.children && root.children.length" i-carbon-caret-down />
        <div v-else i-carbon-dot-mark text="0.6rem" mr-1 mt="1.5" />
      </div>

      <div rounded p="x-1" leading-tight>
        {{ root.name }}
      </div>

      <div
        v-if="showToolbar"
        flex
        absolute right-1
        px-1
        bg-white bg-op-90
      >
        <BasicToolbarIcon plain @click="startEditing">
          <div i-carbon-add />
        </BasicToolbarIcon>
        <BasicToolbarIcon plain @click="emit('deleteNode', root.name)">
          <div i-carbon-delete />
        </BasicToolbarIcon>
      </div>
    </div>

    <div v-if="root.children">
      <Root
        v-for="child in root.children"
        :key="child.name"
        :root="child"
        @add-child="(...args) => emit('addChild', ...args)"
        @delete-node="(...args) => emit('deleteNode', ...args)"
      />
    </div>

    <div
      v-if="isEditing"
      ref="newChildEle"
      w-full
      h-5
      mt-1
      contenteditable
      @keydown.enter.prevent="saveChild"
    />
  </div>
</template>
