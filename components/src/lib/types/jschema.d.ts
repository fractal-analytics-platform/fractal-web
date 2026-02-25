export type BaseJSONSchemaProperty<T> = {
	title?: string;
	description?: string;
	$ref?: string;
	allOf?: Array<JSONSchemaProperty>;
	default?: any;
	definitions?: Record<string, JSONSchemaObjectProperty>;
	$defs?: Record<string, JSONSchemaObjectProperty>;
} & (
	| {
			type: T;
			enum?: T[];
	  }
	| {
			type: null;
			enum: any[];
	  }
);

export type JSONSchemaStringProperty = BaseJSONSchemaProperty<'string'> & {
	const?: string;
};

export type JSONSchemaNumberProperty = BaseJSONSchemaProperty<'number' | 'integer'> & {
	minimum?: number;
	exclusiveMinimum?: number;
	maximum?: number;
	exclusiveMaximum?: number;
};

export type JSONSchemaBooleanProperty = BaseJSONSchemaProperty<'boolean'>;

export type JSONSchemaObjectProperty = BaseJSONSchemaProperty<'object'> & {
	properties: {
		[key: string]: JSONSchemaProperty | { $ref: string; title?: string };
	};
	required?: string[];
	additionalProperties?: JSONSchemaProperty | false;
};

export type JSONSchemaArrayProperty = BaseJSONSchemaProperty<'array'> & {
	prefixItems: JSONSchemaProperty[]; // draft 2020-12
	items: JSONSchemaProperty | JSONSchemaProperty[] | { $ref: string };
	minItems?: number;
	maxItems?: number;
};

export type JSONSchemaOneOfProperty = Omit<BaseJSONSchemaProperty<'object'>, 'type'> & {
	oneOf: Array<JSONSchemaProperty | { $ref: string }>;
	discriminator?: {
		mapping: Record<string, string>;
		propertyName: string;
	};
};

export type JSONSchemaProperty =
	| JSONSchemaStringProperty
	| JSONSchemaNumberProperty
	| JSONSchemaBooleanProperty
	| JSONSchemaArrayProperty
	| JSONSchemaObjectProperty
	| JSONSchemaOneOfProperty;

export type JSONSchema = JSONSchemaObjectProperty;
