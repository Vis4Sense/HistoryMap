import { Concept, Schema } from "@/types/schema"
import { useBrowserLocalStorage } from "./useBrowserStorage"

export function useSchemaEditor() {
  /** define state */
  const { data: modal } = useBrowserLocalStorage('schema-editor-modal', false) // whether editor is open
  const { data: pageId } = useBrowserLocalStorage('schema-editor-page-id', null as string | null) // id of the source history map page
  const { data: schema } = useBrowserLocalStorage('schema-editor-schema', null as Schema | null) // schema data

  const state = {
    modal,
    pageId,
    schema,
  }

  /** utils */
  function getConcept(name: string) {
    return schema.value?.nodes.find(c => c.name === name)
  }

  /** actions */

  function openModal(id: string) {
    modal.value = true
    pageId.value = id
  }

  function setSchema(data: Schema) {
    schema.value = data

    console.info('schema', schema.value)
  }

  function addConcept(concept: Concept) {
    schema.value!.nodes.push(concept)
  }

  function toggleConceptBookmark(name: string) {
    const concept = getConcept(name)
    if (!concept) return
    concept.bookmarked = !concept.bookmarked
    if (concept.bookmarked) {
      concept.included = true
    }
  }

  function toggleConceptIncluded(name: string) {
    const concept = getConcept(name)
    if (!concept) return
    concept.included = !concept.included
  }

  return {
    ...state,
    openModal,
    setSchema,
    addConcept,
    toggleConceptBookmark,
    toggleConceptIncluded,
  }
}
