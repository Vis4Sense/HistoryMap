<script setup lang="ts">
import * as d3 from 'd3'
import { useSchemaEditor } from '@/composables/useSchemaEditor'
import Graph from 'graphology'
import Sigma from 'sigma'
import { Concept, Relation } from '@/types/schema'
import { EdgeArrowProgram } from "sigma/rendering"

const { schema } = useSchemaEditor()

const sigmaContainer = ref<HTMLDivElement | null>(null)
let graph = new Graph()
let simulation = null as d3.Simulation | null
let renderer = null as Sigma | null

const nodePositions = ref<{ [key: string]: { x: number; y: number } }>({})

interface NodeAttributes {
  label: string
  x: number
  y: number
  size: number
}

interface EdgeAttributes {
  label: string
}

watch(schema, () => {
  // remove nodes and edges that are not in the schema
  graph.forEachNode((node) => {
    if (!schema.value?.nodes.find((n) => n.name === node)) {
      graph.dropNode(node)
    }
  })
  graph.forEachEdge((edge, attr, source, target) => {
    if (!schema.value?.links.find((l) => l.source === source && l.target === target)) {
      graph.dropEdge(edge)
    }
  })

  // update node attributes
  schema.value?.nodes.forEach((node) => {
    graph.mergeNode(node.name, getNodeAttributes(node))
  })
  schema.value?.links.forEach((link) => {
    if (graph.hasNode(link.source) && graph.hasNode(link.target))
      graph.mergeEdge(link.source, link.target, getEdgeAttributes(link))
  })

  runLayout()
})

function getNodeAttributes(node: Concept): NodeAttributes {
  return {
    label: node.name,
    x: nodePositions.value[node.name]?.x || 0,
    y: nodePositions.value[node.name]?.y || 0,
    size: 6,
  }
}

function getEdgeAttributes(edge: Relation): EdgeAttributes {
  return {
    label: edge.category,
  }
}

function runLayout() {
  console.log('Running layout')

  if (simulation) {
    simulation.stop()
  }

  const nodes = graph.nodes().map((node) => {
    return {
      id: node,
      x: graph.getNodeAttribute(node, 'x'),
      y: graph.getNodeAttribute(node, 'y'),
    }
  })

  const links = graph.mapEdges((edge, attr, source, target) => {
    return {
      source,
      target,
    }
  })

  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d) => d.id).distance(1))
    .force('charge', d3.forceManyBody().strength(-10))
    .force('x', d3.forceX())
    .force('y', d3.forceY())

  simulation.on('tick', () => {
    nodes.forEach((node) => {
      graph.mergeNode(node.id, {
        x: node.x,
        y: node.y,
      })
    })
  })
}

onMounted(() => {
  renderer = new Sigma(graph, sigmaContainer.value!, {
    allowInvalidContainer: true,
    renderEdgeLabels: true,
    defaultEdgeType: "straight",
    edgeProgramClasses: {
      straight: EdgeArrowProgram,
    },
  })
})
</script>

<template>
  <div ref="sigmaContainer" w-full h-full></div>
</template>
