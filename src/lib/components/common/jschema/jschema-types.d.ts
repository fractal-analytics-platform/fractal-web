export type JSONSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export type BaseJSONSchemaProperty<JSONSchemaType> = {
  type: T,
  title?: string
  description?: string
  "$ref"?: string
  default?: any
}

export type JSONSchemaStringProperty = BaseJSONSchemaProperty<'string'> & {
  enum?: string[]
}

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
