export type FormBuilderEntryType = 'object' | 'array' | 'string' | 'number' | 'boolean';

export type FormBuilderEntry = ({
  type: 'object' | 'array'
  children: Array<FormBuilderEntry>
} | {
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean'
}) & {
  id: string
  error: string
  key?: string
}