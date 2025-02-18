import { Schema } from "@/types/schema"
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

  /** actions */

  function openModal(id: string) {
    modal.value = true
    pageId.value = id
  }

  function setSchema(data: Schema) {
    schema.value = data

    console.info('schema', schema.value)
  }

  return {
    ...state,
    openModal,
    setSchema,
  }
}
