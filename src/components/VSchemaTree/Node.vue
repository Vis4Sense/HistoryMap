<script setup lang="ts">
import { Provenance } from '@/types/schema.d'
import Node from './Node.vue'
import { TreeNode } from './tree'

const props = defineProps({
  node: {
    type: Object as PropType<TreeNode>,
    required: true,
  },
})

const emit = defineEmits<{
  addNode: [provenance: Provenance]
  removeNode: [provenance: Provenance]
}>()

const { node } = toRefs(props)

/** temporary div to support adding child node */
const newNode = ref<HTMLDivElement>()
const isEditing = ref(false)

/** show toolbar of node or not */
const showToolbar = ref(false)

function startEditing() {
  console.log('start editing')
  isEditing.value = true
  nextTick(() => {
    newNode.value?.focus()
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
      }
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
    }
  }
  node.value.remove()
  emit('removeNode', provenance)
}
</script>

<template>
  <div :ml="node.virtual ? 0 : 2">
    <div
      v-if="!node.virtual"
      w-full
      flex justify-between items-start
      relative
      cursor-pointer
      draggable="true"
      py="0.5"
      @mouseenter="showToolbar = true"
      @mouseleave="showToolbar = false"
    >
      <div
        absolute left-0 translate-x="-100%"
        text-gray-3
      >
        <div v-if="node.children && node.children.length" i-carbon-caret-down />
        <div v-else i-carbon-dot-mark text="0.5rem" mt="0.5" />
      </div>

      <div leading-tight text-ellipsis line-clamp-2>
        <span rounded-lg p="x-1" bg-gray-1 mr-1 font-medium>{{ node.name }} </span>
        <span v-if="node.description" text-gray-5>{{ node.description }}</span>
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
          <BasicToolbarIcon plain @click="removeNode">
            <div i-carbon-delete />
          </BasicToolbarIcon>
        </div>
    </div>

    <div v-if="node.children || isEditing">
      <Node
        v-for="child, idx in node.children"
        :key="child.name"
        :node="child"
        @add-node="emit('addNode', $event)"
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

    <div
      v-if="node.virtual"
      border border-dashed rounded flex justify-center
      mt-1 
      text-gray
      hover:text-gray-7 hover:border-gray
      cursor-pointer
      @click.prevent="startEditing"
    >
      <div i-carbon-add-large></div>
    </div>    
  </div>
</template>
