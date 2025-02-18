import type { Schema } from './schema'

export enum SchemaType {
  Network = 'network',
}

export interface Input {
  schemaType: SchemaType
  sourceText: string
}

export interface Output {
  schema: Schema
}
