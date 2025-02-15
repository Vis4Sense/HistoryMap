/**
 * @fileoverview Layout tree nodes using mxGraph
 */

import type { Node, Edge } from '@vue-flow/core'
import { Graph, CompactTreeLayout, Cell } from '@maxgraph/core'
import { DummyContainer } from './utils'
import { HmPage } from '@/types/historymap'

export function compactTreeLayout({
  levelDistance = 30,
  nodeDistance = 5,
} = {}) {
  let module: {
      run: () => typeof module,
      close: () => typeof module,
      nodes: (nodes: Node<HmPage>[]) => typeof module,
      links: (links: Edge[]) => typeof module
    },
      nodes: Node<HmPage>[],
      links: Edge[],
      roots: Node<HmPage>[],
      nodeDict: Record<string, Cell>,
      dummyContainer: ReturnType<typeof DummyContainer>,
      graph: Graph,
      parentNode: Cell,
      layout: CompactTreeLayout;

  // key functions to bind data
  const nodeKey = (d: Node<HmPage>) => d.data!.pageId

  // function to find parent node
  const parent = (d: Node<HmPage>) => nodes.find(n => n.data!.pageId === d.data!.parentPageId)

  function initialize() {
      dummyContainer = DummyContainer();

      graph = new Graph(dummyContainer.node());
      parentNode = graph.getDefaultParent();
      layout = new CompactTreeLayout(graph, true);

      layout.useBoundingBox = false;
      layout.edgeRouting = false;
      layout.levelDistance = levelDistance;
      layout.nodeDistance = nodeDistance;

      nodeDict = {};

      initializeNodes();
  }

  function initializeNodes() {
      if (!nodes) return;

      roots = nodes.filter(d => !parent(d));

      nodes.forEach(d => {
          nodeDict[nodeKey(d)] = graph.insertVertex(parentNode, null, '', 0, 0, d.width as number, d.height as number);
      });

      // virtual root and edges
      const virtualRoot = graph.insertVertex(parentNode, null, '', 0, 0, -layout.levelDistance - 10, -layout.levelDistance - 10);
      roots.forEach(r => {
        graph.insertEdge(parentNode, null, '', virtualRoot, nodeDict[nodeKey(r)]);
    });
  }

  function initializeEdges() {
      if (!links) return;

      links.forEach(d => {
          graph.insertEdge(parentNode, null, '', nodeDict[d.source], nodeDict[d.target]);
      });
  }

  function setNodeCoordinate() {
      nodes.forEach(d => {
          const m = nodeDict[nodeKey(d)].geometry;
          d.position.x = m?.x ?? 0;
          d.position.y = m?.y ?? 0;
      });
  }

  initialize();

  return module = {
      run: function() {
          layout.execute(parentNode);
          setNodeCoordinate();
          return module;
      },

      close: function() {
          dummyContainer.remove();
          return module;
      },

      nodes: function(_: Node<HmPage>[]) {
          return (nodes = _, initializeNodes(), module)
      },

      links: function(_: Edge[]) {
          return (links = _, initializeEdges(), module)
      }
  }
}
