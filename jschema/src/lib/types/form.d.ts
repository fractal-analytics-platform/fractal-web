import { FormManager } from "../components/form_manager.js";
import { StringFormElement, ObjectFormElement, ArrayFormElement, TupleFormElement } from "$lib/components/form_element";
import type { JSONSchemaProperty } from "./jschema.js";

export type FormElement =
  StringFormElement |
  BooleanFormElement |
  EnumFormElement |
  NumberFormElementFields |
  ObjectFormElement |
  ArrayFormElement |
  TupleFormElement;

export type CollapsibleFormElement =
  ObjectFormElement |
  ArrayFormElement |
  TupleFormElement;

export type BaseFormElementFields = {
  manager: FormManager
  id: string
  key: string | null
  type: string | null
  title: string
  description: string
  required: boolean
  removable: boolean
  property: JSONSchemaProperty
  notifyChange: () => void
}

export type ValueFormElementFields<T> = BaseFormElementFields & {
  value: T | null
}

export type StringFormElementFields = ValueFormElementFields<string>

export type BooleanFormElementFields = ValueFormElementFields<boolean>

export type NumberFormElementFields = ValueFormElementFields<number> & {
  min: number | null
  max: number | null
}

export type EnumFormElementFields = ValueFormElementFields<any> & {
  options: any[]
}

export type ObjectFormElementFields = BaseFormElementFields & {
  children: FormElement[]
  additionalProperties: JSONSchemaProperty | false
}

export type ArrayFormElementFields = BaseFormElementFields & {
  children: FormElement[]
  items: JSONSchemaProperty
  minItems?: number
  maxItems?: number
}

export type TupleFormElementFields = BaseFormElementFields & {
  children: FormElement[]
  items: JSONSchemaProperty | JSONSchemaProperty[]
  size: number
}
