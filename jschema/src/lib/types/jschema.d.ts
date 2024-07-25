export type BaseJSONSchemaProperty<JSONSchemaType> = {
  title?: string
  description?: string
  "$ref"?: string
  allOf?: Array<Partial<BaseJSONSchemaProperty<JSONSchemaType>>>
  default?: any
} & ({
  type: T,
  enum?: T[]
} | {
  type: null,
  enum: any[]
})

export type JSONSchemaStringProperty = BaseJSONSchemaProperty<'string'>

export type JSONSchemaNumberProperty = BaseJSONSchemaProperty<'number' | 'integer'> & {
  minimum?: number
  exclusiveMinimum?: number
  maximum?: number
  exclusiveMaximum?: number
}

export type JSONSchemaBooleanProperty = BaseJSONSchemaProperty<'boolean'>

export type JSONSchemaObjectProperty = BaseJSONSchemaProperty<'object'> & {
  properties: {
    [key: string]: JSONSchemaProperty
  },
  required?: string[]
  additionalProperties?: JSONSchemaProperty | false
}

export type JSONSchemaArrayProperty = BaseJSONSchemaProperty<'array'> & {
  prefixItems: JSONSchemaProperty[], // draft 2020-12
  items: JSONSchemaProperty | JSONSchemaProperty[],
  minItems?: number
  maxItems?: number
}

export type JSONSchemaProperty =
  JSONSchemaStringProperty | JSONSchemaNumberProperty | JSONSchemaBooleanProperty | JSONSchemaObjectProperty;

export type JSONSchema = JSONSchemaObjectProperty
