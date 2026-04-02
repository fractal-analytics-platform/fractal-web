import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/svelte';
import { renderSchema } from './property_test_utils';
import userEvent from '@testing-library/user-event';

describe('Conditional properties', () => {
	it('if/then/else', async () => {
		const user = userEvent.setup();
		const { component } = renderSchema({
			"type": "object",
			"properties": {
				"ModelIfThenElse": {
					"additionalProperties": false,
					"else": {
						"properties": {
							"dependent_parameter": {
								"const": 0,
								"type": "number"
							}
						}
					},
					"if": {
						"properties": {
							"control_parameter": {
								"const": true,
								"type": "boolean"
							}
						}
					},
					"properties": {
						"control_parameter": {
							"default": false,
							"title": "Control Parameter",
							"type": "boolean"
						},
						"dependent_parameter": {
							"default": 1,
							"title": "Dependent Parameter",
							"type": "integer"
						}
					},
					"then": {
						"properties": {
							"dependent_parameter": {
								"minimum": 1,
								"type": "number"
							}
						}
					},
					"title": "ModelIfThenElse",
					"type": "object"
				}
			},
			"required": [
				"ModelIfThenElse"
			]
		});

		expect(component.isValid()).toEqual(false);
		expect(component.getArguments()).deep.eq({
			"ModelIfThenElse": {
				"control_parameter": false,
				"dependent_parameter": 1
			}
		});
		expect(screen.getByText('must match "else" schema')).toBeVisible();

		await user.click(screen.getByRole('switch'));
		expect(component.isValid()).toEqual(true);
		expect(component.getArguments()).deep.eq({
			"ModelIfThenElse": {
				"control_parameter": true,
				"dependent_parameter": 1
			}
		});
	});

	it('dependentRequired', async () => {
		const user = userEvent.setup();
		const { component } = renderSchema({
			"type": "object",
			"properties": {
				"ModelDependentRequired": {
					"additionalProperties": false,
					"dependentRequired": {
						"advanced_path": [
							"advanced_1",
							"advanced_2"
						]
					},
					"description": "Model demonstrating dependentRequired constraints.",
					"properties": {
						"advanced_path": {
							"description": "When included, advanced attributes must be set.",
							"title": "Advanced Path",
							"type": "string"
						},
						"advanced_1": {
							"default": "default",
							"description": "Advanced 1 description.",
							"title": "Advanced 1",
							"type": "string"
						},
						"advanced_2": {
							"description": "Advanced 1 description.",
							"title": "Advanced 2",
							"type": "integer"
						}
					},
					"title": "ModelDependentRequired",
					"type": "object"
				}
			},
			"required": ["ModelDependentRequired"]
		});

		expect(component.isValid()).toEqual(true);
		expect(component.getArguments()).deep.eq(
			{
				"ModelDependentRequired": {
					"advanced_path": null,
					"advanced_1": "default",
					"advanced_2": null
				}
			});

		await user.type(screen.getByRole('textbox', { name: 'Advanced Path' }), '/tmp');

		expect(component.isValid()).toEqual(false);
		expect(component.getArguments()).deep.eq(
			{
				"ModelDependentRequired": {
					"advanced_path": "/tmp",
					"advanced_1": "default",
					"advanced_2": null
				}
			});
		expect(screen.getByText('required property')).toBeVisible();

		await user.type(screen.getByRole('textbox', { name: 'Advanced 2' }), '42');
		expect(component.isValid()).toEqual(true);
		expect(component.getArguments()).deep.eq(
			{
				"ModelDependentRequired": {
					"advanced_path": "/tmp",
					"advanced_1": "default",
					"advanced_2": 42
				}
			});
	});

	it('mutually exclusive properties', async () => {
		const user = userEvent.setup();
		const { component } = renderSchema({
			"type": "object",
			"properties": {
				"ModelMutuallyExclusive": {
					"additionalProperties": false,
					"not": {
						"allOf": [
							{
								"properties": {
									"output_path": {
										"type": "string"
									}
								},
								"required": [
									"output_path"
								]
							},
							{
								"properties": {
									"output_url": {
										"type": "string"
									}
								},
								"required": [
									"output_url"
								]
							}
						]
					},
					"properties": {
						"output_path": {
							"title": "Output Path",
							"type": "string"
						},
						"output_url": {
							"title": "Output Url",
							"type": "string"
						}
					},
					"title": "ModelMutuallyExclusive",
					"type": "object"
				}
			},
			"required": ["ModelMutuallyExclusive"]
		});

		expect(component.isValid()).toEqual(false);
		expect(screen.getByText('missing required child value')).toBeVisible();
		expect(component.getArguments()).deep.eq({
			"ModelMutuallyExclusive": {
				"output_path": null,
				"output_url": null
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Output Path' }), '/tmp');
		expect(component.isValid()).toEqual(true);
		expect(component.getArguments()).deep.eq({
			"ModelMutuallyExclusive": {
				"output_path": "/tmp",
				"output_url": null
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Output Url' }), 'foo');
		expect(component.isValid()).toEqual(false);
		expect(component.getArguments()).deep.eq({
			"ModelMutuallyExclusive": {
				"output_path": "/tmp",
				"output_url": "foo"
			}
		});
		expect(screen.getByText('must NOT be valid')).toBeVisible();
	});

	it('multiple if/then', async () => {
		const user = userEvent.setup();
		const { component } = renderSchema({
			"type": "object",
			"properties": {
				"ModelWithMultipleIfThen": {
					"additionalProperties": false,
					"allOf": [
						{
							"if": {
								"properties": {
									"mode": {
										"const": "advanced",
										"type": "string"
									}
								}
							},
							"then": {
								"properties": {
									"advanced_config": {
										"type": "string"
									}
								},
								"required": [
									"advanced_config"
								]
							}
						},
						{
							"if": {
								"properties": {
									"use_cache": {
										"const": true,
										"type": "boolean"
									}
								}
							},
							"then": {
								"properties": {
									"cache_size": {
										"minimum": 1,
										"type": "number"
									}
								}
							}
						}
					],
					"properties": {
						"mode": {
							"default": "simple",
							"enum": [
								"simple",
								"advanced"
							],
							"title": "Mode",
							"type": "string"
						},
						"advanced_config": {
							"title": "Advanced Config",
							"type": "string"
						},
						"use_cache": {
							"default": false,
							"title": "Use Cache",
							"type": "boolean"
						},
						"cache_size": {
							"default": 1,
							"title": "Cache Size",
							"type": "integer"
						}
					},
					"title": "ModelWithMultipleIfThen",
					"type": "object"
				}
			},
			"required": ["ModelWithMultipleIfThen"]
		});

		expect(component.getArguments()).deep.eq({
			"ModelWithMultipleIfThen": {
				"mode": "simple",
				"advanced_config": null,
				"use_cache": false,
				"cache_size": 1
			}
		});
		expect(component.isValid()).toEqual(true);

		await user.selectOptions(screen.getByRole('combobox', { name: 'Mode' }), 'advanced');
		expect(component.isValid()).toEqual(false);
		expect(screen.getByText('must match "then" schema')).toBeVisible();
		expect(screen.getByText('required property')).toBeVisible();

		await user.type(screen.getByRole('textbox', { name: 'Advanced Config' }), 'foo');

		expect(component.getArguments()).deep.eq(
			{
				"ModelWithMultipleIfThen": {
					"mode": "advanced",
					"advanced_config": "foo",
					"use_cache": false,
					"cache_size": 1
				}
			});
		expect(component.isValid()).toEqual(true);

		const cacheSizeInput = screen.getByRole('textbox', { name: 'Cache Size' });
		await user.clear(cacheSizeInput);
		await user.type(cacheSizeInput, '0');
		expect(component.isValid()).toEqual(true);

		await user.click(screen.getByRole('switch'));
		expect(component.getArguments()).deep.eq(
			{
				"ModelWithMultipleIfThen": {
					"mode": "advanced",
					"advanced_config": "foo",
					"use_cache": true,
					"cache_size": 0
				}
			});
		expect(component.isValid()).toEqual(false);
		expect(screen.getByText('must match "then" schema')).toBeVisible();
	});
});