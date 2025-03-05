<script setup lang="ts">
import type { SchemaTreeNode } from '@/types/schema'
import type { PropType } from 'vue'
import Node from './Node.vue'
import { TargetPosition, useDragAndDropTree } from '@/composables/useDnDTree'

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  node: {
    type: Object as PropType<SchemaTreeNode>,
    required: true,
  },
})

/** define emits */
const emit = defineEmits<{
  addChild: [childName: string, rootName: string]
  deleteNode: [nodeName: string]
  moveNode: [node: string, targetName: string, position: TargetPosition]
}>()

/** props */
const { node } = toRefs(props)

/** drag and drop states and handlers */
const { draggedData, draggedOverData, onDragStart, onDragOver, onDragLeave, onDragEnd } = useDragAndDropTree()
const dragged = computed(() => draggedData.value?.name === node.value?.name)
const draggedOver = computed(() =>
  draggedOverData.value?.data.name === node.value?.name
  && draggedOverData.value?.position === 'inside'
)
const draggedOverBefore = computed(() => {
  return draggedOverData.value?.data.name === node.value?.name
  && draggedOverData.value?.position === 'before'
})
const draggedOverAfter = computed(() =>
  draggedOverData.value?.data.name === node.value?.name
  && draggedOverData.value?.position === 'after'
)

function onDrop(position: TargetPosition = 'inside') {
  if (draggedData.value && draggedOverData.value) {
    emit('moveNode', draggedData.value.name, draggedOverData.value.data.name, position)
  }
}

/** show toolbar of node or not */
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
  if (newValue && node.value) {
    emit('addChild', newValue, node.value.name)
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
    <div>
      <div v-if="index === 0"
        border-1 border-dashed
        :class="{
          'border-transparent': !draggedOverBefore,
          'border-historymap': draggedOverBefore,
        }"
        @dragover.prevent="onDragOver(node, 'before')"
        @dragleave.prevent="onDragLeave()"
        @drop="onDrop('before')"
      />

      <div
        w-full
        flex justify-between items-start
        relative
        cursor-pointer
        draggable="true"
        :class="{
          'bg-gray-1': dragged,
          'bg-historymap bg-op-10': draggedOver && !dragged,
        }"
        @mouseover="showToolbar = true"
        @mouseleave="showToolbar = false"
        @dragstart="onDragStart(node)"
        @dragover.prevent="onDragOver(node)"
        @dragleave.prevent="onDragLeave"
        @drop="onDrop()"
        @dragend="onDragEnd"
      >
        <div
          absolute left-0 translate-x="-100%"
          text-gray-3
        >
          <div v-if="node.children && node.children.length" i-carbon-caret-down />
          <div v-else i-carbon-dot-mark text="0.6rem" mr-1 mt="1.5" />
        </div>

        <div rounded p="x-1" leading-tight>
          {{ node.name }}
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
          <BasicToolbarIcon plain @click="emit('deleteNode', node.name)">
            <div i-carbon-delete />
          </BasicToolbarIcon>
        </div>
      </div>

      <div
        border-1 border-dashed
        :class="{
          'border-transparent': !draggedOverAfter,
          'border-historymap': draggedOverAfter,
        }"
        @dragover.prevent="onDragOver(node, 'after')"
        @dragleave.prevent="onDragLeave()"
        @drop="onDrop('after')"
      />
    </div>

    <div v-if="node.children">
      <Node
        v-for="child, idx in node.children"
        :key="child.name"
        :index="idx"
        :node="child"
        @add-child="(...args) => emit('addChild', ...args)"
        @delete-node="(...args) => emit('deleteNode', ...args)"
        @move-node="(...args) => emit('moveNode', ...args)"
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
