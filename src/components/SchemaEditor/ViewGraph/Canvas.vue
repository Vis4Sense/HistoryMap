<script setup lang="ts">
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import Graph from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'

const { schema } = useSchemaEditor()

const nodePositions = ref({} as Record<string, { x: number, y: number }>)

const nodes = computed(() => {
  if (!schema.value)
    return []
  return schema.value.nodes.map((node) => {
    return {
      id: node.name,
      position: {
        x: node.name in nodePositions.value ? nodePositions.value[node.name].x : Math.random() * 100,
        y: node.name in nodePositions.value ? nodePositions.value[node.name].y : Math.random() * 100,
      },
      data: {
        label: node.name,
      }
    }
  })
})

const edges = computed(() => {
  if (!schema.value)
    return []
  return schema.value.links.map((link) => {
    return {
      id: `${link.source}_${link.target}`,
      source: link.source,
      target: link.target,
      label: link.category,
    }
  })
})

function runLayout() {
  console.log('Running layout')

  const graph = new Graph()

  nodes.value.forEach((node) => {
    try {
      graph.addNode(node.id, { x: node.position.x, y: node.position.y })
    } catch (e) {
      console.error(e)
    }
  })
  edges.value.forEach((edge) => {
    try {
      graph.addEdge(edge.source, edge.target)
    } catch (e) {
      console.error(e)
    }
  })

  const positions = forceAtlas2(graph, {
    iterations: 100,
    settings: {
      adjustSizes: true,
      gravity: 5,
    },
  })

  console.log('Positions', positions)

  for (const node of nodes.value) {
    nodePositions.value[node.id] = positions[node.id]
  }
}

watch(schema, () => {
  runLayout()
}, { deep: true })
</script>

<template>
  <div w-full h-full>
  </div>
</template>
