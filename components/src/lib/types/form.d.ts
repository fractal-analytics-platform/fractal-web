import { FormManager } from '../jschema/form_manager.js';
import {
	ValueFormElement,
	StringFormElement,
	BooleanFormElement,
	NumberFormElement,
	EnumFormElement,
	ObjectFormElement,
	ArrayFormElement,
	TupleFormElement,
	ConditionalFormElement
} from '../jschema/form_element.js';
import type { JSONSchemaProperty } from './jschema.js';

export type FormElement = (
	| StringFormElement
	| BooleanFormElement
	| EnumFormElement
	| NumberFormElement
	| ObjectFormElement
	| ArrayFormElement
	| TupleFormElement
	| ConditionalFormElement
) & {
	collapsed?: boolean;
};

export type CollapsibleFormElement = ObjectFormElement | ArrayFormElement | TupleFormElement | ValueFormElement;

export type BaseFormElementFields = {
	manager: FormManager;
	id: string;
	key: string | null;
	path: string;
	type: string | null;
	title: string;
	description: string;
	required: boolean;
	removable: boolean;
	property: JSONSchemaProperty;
	notifyChange: () => void;
};

export type ValueFormElementFields<T> = BaseFormElementFields & {
	value: T | null;
};

export type StringFormElementFields = ValueFormElementFields<string>;

export type BooleanFormElementFields = ValueFormElementFields<boolean>;

export type NumberFormElementFields = ValueFormElementFields<number> & {
	min: number | null;
	max: number | null;
};

export type EnumFormElementFields = ValueFormElementFields<any> & {
	options: any[];
};

export type ObjectFormElementFields = BaseFormElementFields & {
	children: FormElement[];
	additionalProperties: JSONSchemaProperty | false;
};

export type ArrayFormElementFields = BaseFormElementFields & {
	children: FormElement[];
	items: JSONSchemaProperty;
	minItems?: number;
	maxItems?: number;
};

export type TupleFormElementFields = BaseFormElementFields & {
	children: FormElement[];
	items: JSONSchemaProperty | JSONSchemaProperty[];
	size: number;
};

export type ConditionalElementFields = BaseFormElementFields & {
	selectedIndex: number;
	selectedItem: FormElement | null;
	discriminator?: {
		key: string;
		values: string[];
		title: string;
		description: string;
		value: string;
	},
	unexpectedChildren: FormElement[];
};

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
