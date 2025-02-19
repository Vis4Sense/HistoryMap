<script setup lang="ts">
import { useSchemaEditor } from '@/composables/useSchemaEditor'

const { addConcept, schema } = useSchemaEditor()

function handleCreateConcept() {
  addConcept({
    name: 'New Concept',
    extractedBy: 'user',
    included: false,
    excitation: {
      level: 0,
    }
  })
}
</script>

<template>
  <!-- <SchemaEditorViewBox>
    <template #header>
      <div>Nested View</div>
      <div>
        <el-button @click="handleCreateConcept">
          <div i-mdi-puzzle-outline></div>
        </el-button>
      </div>
    </template>
  </SchemaEditorViewBox> -->
</template>

<style scoped>
.el-button {
  padding: 0px 6px;
  font-size: 1rem;
}

.el-button.is-text:hover {
  background-color: #d9d9d9;
}

.el-button+.el-button {
  margin-left: 0;
}
</style>
