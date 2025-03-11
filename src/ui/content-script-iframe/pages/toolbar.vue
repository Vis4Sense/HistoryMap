<script setup lang="ts">
import { Annotation } from '@/types/historymap'
import Postmate from 'postmate'

const annotation = ref<Annotation | null>(null)

const handshake = new Postmate.Model({
  setAnnotation: (value: Annotation) => {
    annotation.value = value
  },
})

function onHighlight() {
  handshake.then((parent) => {
    parent.emit('highlight')
  })
}

function onDehighlight() {
  handshake.then((parent) => {
    if (annotation.value) {
      parent.emit('dehighlight')
    }
  })
}

function onClickTag() {
  handshake.then((parent) => {
    parent.emit('tagging-start')
  })
}
</script>

<template>
  <div w-full h-full>
    <div absolute bottom-0 w-full flex justify-center p-1>
      <div
        border shadow bg-white rounded p="x-1 y-0.5"
        flex
      >
        <BasicToolbarIcon>
          <div
            v-if="annotation && annotation.highlighted"
            i-mdi-brush-off
            @click="onDehighlight()"
          />
          <div v-else i-ph-paint-brush
            @click="onHighlight()"
          />
        </BasicToolbarIcon>
        <BasicToolbarIcon @click="onClickTag()">
          <div i-ph-tag />
        </BasicToolbarIcon>
      </div>
    </div>
  </div>
</template>
