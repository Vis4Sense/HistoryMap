<script setup lang="ts">
import type { Provenance, Schema } from '@/types/schema.d'
import Node from './Node.vue'
import { TreeNode } from './tree'

const props = defineProps({
  node: {
    type: Object as PropType<TreeNode>,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
  lod: {
    type: String as PropType<Schema['lod']>,
    default: 'detail',
  },
  mode: {
    type: String as PropType<'view' | 'edit'>,
    default: 'view',
  }
})

const emit = defineEmits<{
  addNode: [provenance: Provenance]
  removeNode: [provenance: Provenance]
  updateNode: [provenance: Provenance]
  dragStart: [node: TreeNode]
  dragEnd: []
  dropNode: [node: TreeNode, position: 'inside' | 'before' | 'after']
  toggleNode: [node: TreeNode]
}>()

const { node } = toRefs(props)

/** temporary div to support adding child node */
const newNode = ref<HTMLDivElement>()
const isEditing = ref(false)
const isEditingDesc = ref(false)

/** div of concept name and description */
const conceptNameEle = ref<HTMLElement>()
const conceptDescEle = ref<HTMLElement>()

/** show toolbar of node or not */
const showToolbar = ref(false)

/** dragged over state */
const draggedOver = ref(false)
const draggedOverBefore = ref(false)
const draggedOverAfter = ref(false)
const draggedOverVirtual = ref(false)

function clearDraggedOver() {
  draggedOver.value = false
  draggedOverBefore.value = false
  draggedOverAfter.value = false
  draggedOverVirtual.value = false
}

function startEditing() {
  isEditing.value = true
  nextTick(() => {
    newNode.value?.focus()
  })
}

function startEditingDesc() {
  isEditingDesc.value = true
  nextTick(() => {
    conceptDescEle.value?.focus()
  })
}

function saveNewNode() {
  const newValue = newNode.value?.textContent?.trim()
  if (newValue) {
    const newNode = node.value.addChild(new TreeNode({
      name: newValue,
      parentName: node.value.virtual ? null : node.value.name,
    }))
    const provenance: Provenance = {
      time: Date.now(),
      changeType: 'add',
      diff: {
        old: null,
        new: newNode.toConcept(),
      },
    }
    emit('addNode', provenance)
  }
  isEditing.value = false
}

function removeNode() {
  const provenance: Provenance = {
    time: Date.now(),
    changeType: 'delete',
    diff: {
      old: node.value.toConcepts(),
      new: null,
    },
  }
  node.value.remove()
  emit('removeNode', provenance)
}

function updateName() {
  const newName = conceptNameEle.value?.textContent?.trim()
  if (newName && newName !== node.value.name) {
    const provenance: Provenance = {
      time: Date.now(),
      changeType: 'rename',
      diff: {
        old: node.value.toConcept(),
        new: null,
      },
    }
    node.value.rename(newName)
    provenance.diff.new = node.value.toConcept()
    emit('updateNode', provenance)
  }
}

function updateDesc() {
  const newDesc = conceptDescEle.value?.textContent?.trim()
  if (newDesc !== node.value.description) {
    const provenance: Provenance = {
      time: Date.now(),
      changeType: 'update',
      diff: {
        old: node.value.toConcept(),
        new: null,
      },
    }
    node.value.updateDescription(newDesc)
    provenance.diff.new = node.value.toConcept()
    emit('updateNode', provenance)
  }
  isEditingDesc.value = false
}
</script>

<template>
  <div
    :ml="node.virtual ? 0 : 2"
    relative
  >
    <div
      relative
      draggable="true"
      @dragstart="(e) => {
        e.stopPropagation()
        emit('dragStart', node)
      }"
      @dragend="() => {
        clearDraggedOver()
        emit('dragEnd')
      }"
    >
      <div
        v-if="!node.virtual && index === 0"
        border-1 border-dashed
        :class="{
          'border-transparent': !draggedOverBefore,
          'border-historymap': draggedOverBefore,
        }"
        @dragover.prevent="draggedOverBefore = true"
        @dragleave.prevent="draggedOverBefore = false"
        @drop="() => {
          clearDraggedOver()
          emit('dropNode', node, 'before')
        }"
      />

      <div
        v-if="!node.virtual"
        w-full
        flex justify-between items-start
        relative
        cursor-pointer
        py="0.5"
        :class="{
          'bg-historymap bg-op-10': draggedOver,
        }"
        @mouseenter="showToolbar = true"
        @mouseleave="showToolbar = false"
        @dragover.prevent="draggedOver = true"
        @dragleave.prevent="draggedOver = false"
        @drop="() => {
          clearDraggedOver()
          emit('dropNode', node, 'inside')
        }"
        @click="emit('toggleNode', node)"
        hover:bg-gray-1
        class="group"
      >
        <div
          absolute left-0 translate-x="-100%"
          text-gray-3
        >
          <div v-if="node.children && node.children.length" i-carbon-caret-down />
          <div v-else i-carbon-dot-mark text="0.5rem" mt="0.5" />
        </div>

        <div
          leading-tight text-ellipsis
          :class="{
            'line-clamp-1': lod === 'summary' && !isEditingDesc,
          }"
        >
          <span
            ref="conceptNameEle"
            rounded-lg p="x-1"
            mr-1 font-medium
            :contenteditable="mode === 'edit'"
            :bg="
              node.selected
                ? 'historymap-400'
                : node.highlighted
                  ? 'historymap-100'
                  : node.unincluded
                    ? 'blue-1'
                    : 'gray-1'
            "
            :class="{
              'text-white': node.selected,
              'cursor-text': mode === 'edit',
            }"
            @blur="updateName"
            @keydown.enter.prevent="(e) => e.target?.blur()"
            @click="(e) => {
              if (mode === 'edit') {
                e.stopPropagation()
              }
            }"
          >
            {{ node.name }}
          </span>
          <span
            v-if="lod !== 'concept'"
            ref="conceptDescEle"
            text-gray-5
            :contenteditable="mode === 'edit'"
            :class="{
              'px-1': isEditingDesc,
              'cursor-text': mode === 'edit',
            }"
            @focus="startEditingDesc"
            @blur="updateDesc"
            @keydown.enter.prevent="(e) => e.target?.blur()"
            @click="(e) => {
              if (mode === 'edit') {
                e.stopPropagation()
              }
            }"
          >
            {{ node.description }}
          </span>
          <span
            v-if="!node.description && !isEditingDesc && mode === 'edit'"
            inline-block
            text-gray-3 hover:text-gray-5
            @click="startEditingDesc"
          >
            <div translate-y-0.5 i-mdi-text-box-plus-outline />
          </span>
        </div>

        <div
          v-if="showToolbar"
          flex
          absolute right-1
          px-1
          bg-white bg-op-90
          @click="e => e.stopPropagation()"
        >
          <BasicToolbarIcon plain @click="startEditing">
            <div i-carbon-add />
          </BasicToolbarIcon>
          <BasicToolbarIcon plain @click="removeNode">
            <div i-carbon-delete />
          </BasicToolbarIcon>
        </div>
      </div>

      <div
        v-if="!node.virtual"
        border-1 border-dashed
        :class="{
          'border-transparent': !draggedOverAfter,
          'border-historymap': draggedOverAfter,
        }"
        @dragover.prevent="draggedOverAfter = true"
        @dragleave.prevent="draggedOverAfter = false"
        @drop="() => {
          clearDraggedOver()
          emit('dropNode', node, 'after')
        }"
      />

      <div
        v-if="node.children || isEditing"
        :class="{
          'flex flex-nowrap whitespace-nowrap overflow-auto items-center': lod === 'concept' && node.hasNoBranch(),
        }"
      >
        <Node
          v-for="child, idx in node.children"
          :key="child.name"
          :node="child"
          :index="idx"
          :lod="lod"
          :mode="mode"
          @add-node="emit('addNode', $event)"
          @remove-node="emit('removeNode', $event)"
          @update-node="emit('updateNode', $event)"
          @drag-start="emit('dragStart', $event)"
          @drag-end="emit('dragEnd')"
          @drop-node="(node, pos) => emit('dropNode', node, pos)"
          @toggle-node="emit('toggleNode', $event)"
        />

        <div
          v-if="isEditing"
          ref="newNode"
          w-full
          h-5
          mt-1 mb-1
          :ml="node.virtual ? 0 : 2"
          contenteditable
          @blur="saveNewNode"
          @keydown.enter.prevent="(e) => e.target?.blur()"
        />
      </div>
    </div>

    <div
      v-if="node.virtual"
      border border-dashed rounded flex justify-center
      mt-1
      text-gray
      hover:text-gray-7 hover:border-gray
      cursor-pointer
      :class="{
        'border-historymap text-historymap bg-historymap bg-opacity-10': draggedOverVirtual,
      }"
      @click.prevent="startEditing"
      @dragover.prevent="draggedOverVirtual = true"
      @dragleave.prevent="draggedOverVirtual = false"
      @dragend="() => {
        clearDraggedOver()
        emit('dragEnd')
      }"
      @drop="() => {
        clearDraggedOver()
        emit('dropNode', node, 'inside')
      }"
    >
      <div i-carbon-add-large />
    </div>
  </div>
</template>
