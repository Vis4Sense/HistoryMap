import type { Concept, Schema } from './schema'

export enum SchemaType {
  Network = 'network',
  EgoNetwork = 'ego-network',
}

export interface BaseInput {
  schemaType: SchemaType
  sourceText: string
}

export interface NetworkInput extends BaseInput {
  schemaType: SchemaType.Network
}

export interface EgoNetworkInput extends BaseInput {
  schemaType: SchemaType.EgoNetwork
  centralConcept: string
}

export type Input = NetworkInput | EgoNetworkInput

export interface Output {
  schema: Schema
}
