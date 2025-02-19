<script setup lang="ts">
import * as d3 from 'd3'
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import { Edge, Node, VueFlow } from '@vue-flow/core'
import { Concept, Relation } from '@/types/schema'

const { schema } = useSchemaEditor()

let simulation = null as d3.Simulation | null

const nodePositions = ref<{ [key: string]: { x: number; y: number } }>({})

const nodes = computed(() => schema.value?.nodes.map((node) => getNode(node)) || [])
const edges = computed(() => schema.value?.links.map((link) => getEdge(link)) || [])

watch(schema, () => {
  runLayout()
})

function getNode(node: Concept): Node {
  return {
    id: node.name,
    label: node.name,
    position: {
      x: nodePositions.value[node.name]?.x || 0,
      y: nodePositions.value[node.name]?.y || 0,
    },
    data: node,
  }
}

function getEdge(edge: Relation): Edge {
  return {
    id: `${edge.source}-${edge.target}`,
    type: 'straight',
    source: edge.source,
    target: edge.target,
    label: edge.category,
    data: edge,
  }
}

function runLayout() {
  console.log('Running layout')

  if (simulation) {
    simulation.stop()
  }

  const scaleX = 20
  const scaleY = 10

  const nodes_ = nodes.value.map((node) => ({
    id: node.id, x: node.position.x / scaleX, y: node.position.y / scaleY,
  }))
  const edges_ = edges.value
    .filter(e => nodes_.find(n => n.id === e.source) && nodes_.find(n => n.id === e.target))
    .map((edge) => ({ source: edge.source, target: edge.target }))

  simulation = d3.forceSimulation(nodes_)
    .force('link', d3.forceLink(edges_).id((d) => d.id).distance(10))
    .force('charge', d3.forceManyBody().strength(-10))
    .force('x', d3.forceX())
    .force('y', d3.forceY())
    .on('tick', () => {
      nodes_.forEach((node) => {
        nodePositions.value[node.id] = {
          x: node.x * scaleX,
          y: node.y * scaleY,
        }
      })
    })
}
</script>

<template>
  <VueFlow
    w-full h-full
    :nodes="nodes"
    :edges="edges"
  ></VueFlow>
</template>
