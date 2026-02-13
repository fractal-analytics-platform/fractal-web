import { describe, it, expect, vi } from 'vitest';
import { FormManager } from '../../src/lib/jschema/form_manager';
import { get } from 'svelte/store';

describe('JSchema form errors', () => {
  it('missingProperty error is set to child element', () => {
    const formManager = new FormManager({
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          properties: {
            bar: { type: 'string' }
          }
        }
      },
      required: ['foo']
    }, vi.fn(), 'pydantic_v2');
    const errors = get(formManager.root.children[0].errors);
    expect(errors).deep.eq(["must have required property 'foo'"]);
  });

  it('additionalProperty error is set to child element', () => {
    const formManager = new FormManager({
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          properties: {
            bar: { type: 'string' }
          },
          additionalProperties: false
        }
      },
      required: ['foo']
    }, vi.fn(), 'pydantic_v2', [], {
      foo: {
        bar: 'abc',
        baz: 'xxx'
      }
    });
    const errors = get(formManager.root.children[0].children[1].errors);
    expect(errors).deep.eq(["must NOT have additional properties"]);
  });

  const oneOfSchema = {
    $defs: {
      A: {
        type: 'object',
        properties: {
          discr: { type: 'string', const: 'A' },
          a: { type: 'string' },
        },
        required: ['discr', 'a']
      },
      B: {
        type: 'object',
        properties: {
          discr: { type: 'string', const: 'B' },
          b: { type: 'string' },
        },
        required: ['discr', 'b']
      },

    },
    type: 'object',
    properties: {
      foo: {
        discriminator: {
          mapping: {
            A: '#/$defs/A',
            B: '#/$defs/B'
          },
          propertyName: 'discr'
        },
        oneOf: [
          { $ref: '#/$defs/A' },
          { $ref: '#/$defs/B' }
        ]
      }
    },
    required: ['foo']
  };

  it('oneOf errors with valid discriminator', () => {
    const formManager = new FormManager(oneOfSchema, vi.fn(), 'pydantic_v2');

    expect(formManager.getFormData()).deep.eq({ foo: { a: null, discr: 'A' } });

    const foo = formManager.root.children[0];

    expect(get(foo.errors)).deep.eq(["must match exactly one schema in oneOf"]);
    expect(get(foo.selectedItem.errors)).deep.eq([]);
    expect(get(foo.selectedItem.children[0].errors)).deep.eq(["must have required property 'a'"]);
  });

  it('oneOf errors with invalid discriminator', () => {
    const formManager = new FormManager(oneOfSchema, vi.fn(), 'pydantic_v2', [], { foo: { discr: 'X', u: 'U' } });
    expect(formManager.getFormData()).deep.eq({ foo: { discr: 'X', u: 'U' } });
    const foo = formManager.root.children[0];
    expect(get(foo.errors)).deep.eq(["must match exactly one schema in oneOf"]);
    expect(foo.selectedItem).null;
  });
});