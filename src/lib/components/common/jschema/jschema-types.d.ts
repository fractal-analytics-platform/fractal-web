export type JSONSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export type BaseJSONSchemaProperty<JSONSchemaType> = {
  type: T,
  title?: string
  description?: string
  "$ref"?: string
  allOf?: Array<Partial<BaseJSONSchemaProperty<JSONSchemaType>>>
  default?: any
  enum?: string[]
}

export type JSONSchemaStringProperty = BaseJSONSchemaProperty<'string'>

export type JSONSchemaNumberProperty = BaseJSONSchemaProperty<'number' | 'integer'>

export type JSONSchemaBooleanProperty = BaseJSONSchemaProperty<'boolean'>

export type JSONSchemaObjectProperty = BaseJSONSchemaProperty<'object'> & {
  properties: {
    [key: string]: JSONSchemaProperty
  },
  required?: string[]
  additionalProperties?: JSONSchemaProperty | boolean
}

export type JSONSchemaArrayProperty = BaseJSONSchemaProperty<'array'> & {
  items: JSONSchemaProperty
}

export type JSONSchemaProperty =
  JSONSchemaStringProperty | JSONSchemaNumberProperty | JSONSchemaBooleanProperty | JSONSchemaObjectProperty;

export type JSONSchema = JSONSchemaObjectProperty

export type FormProperty = {
  property: JSONSchemaProperty & { key: string },
  required: boolean
}
