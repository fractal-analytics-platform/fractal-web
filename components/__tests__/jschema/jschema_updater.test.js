import { it, expect } from 'vitest';
import { getUpdatedData } from '../../src/lib/jschema/jschema_updater';
import { adaptJsonSchema } from '../../src/lib/jschema/jschema_adapter';
import { getJsonSchemaData } from '../../src/lib/jschema/jschema_initial_data';

it('should update schema data adding new default and preserving old values', () => {
  const schemaOld = {
    "type": "object",
    "properties": {
      "p1": {
        "type": "string",
        "default": "foo"
      },
      "p2": {
        "type": "string",
        "default": "bar",
      },
      "p3": {
        "type": "array",
        "items": { "type": "string" },
        "default": ["bar"],
      },
      "p4": {
        "type": "string",
      },
      "p5": {
        "type": "object",
        "properties": {
          "p5a": {
            "type": "string",
            "default": "xxx"
          }
        }
      },
      "p6": {
        "type": "string"
      },
      "p7": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "p7a": {
              "type": "string"
            }
          }
        },
        "default": [{ "p7a": "aa1" }, { "p7a": "aa2" }]
      }
    }
  }

  const schemaNew = {
    "type": "object",
    "properties": {
      "p1": {
        "type": "string",
        "default": "FOO2"
      },
      // change of type
      "p2": {
        "type": "object",
        "properties": {
          "p2a": {
            "type": "string"
          }
        },
        "default": { "p2a": "XXX" }
      },
      "p3": {
        "type": "object",
        "properties": {
          "p3a": {
            "type": "string"
          },
          "default": { "p3a": "XXX" }
        }
      },
      "p4": {
        "type": "object",
        "properties": {
          "p4a": {
            "type": "string"
          }
        },
        "default": { "p4a": "XXX" }
      },
      // new nested object
      "p5": {
        "type": "object",
        "properties": {
          "p5a": {
            "type": "string",
            "default": "XXX"
          },
          "p5b": {
            "type": "string",
            "default": "YYY"
          }
        }
      },
      "p6": {
        "type": "string",
        "default": "BAR"
      },
      "p7": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "p7a": {
              "type": "string"
            },
            "p7b": {
              "type": "string"
            }
          }
        },
        "default": [{ "p7a": "AA1", "p7b": "BB1" }, { "p7a": "AA2", "p7b": "BB2" }]
      },
      // new property
      "p8": {
        "type": "number",
        "default": 42
      }
    }
  }

  const oldAdapted = adaptJsonSchema(schemaOld);
  const oldData = getJsonSchemaData(oldAdapted, 'pydantic_v2');

  const newData = getUpdatedData(schemaNew, oldData, 'pydantic_v2');

  expect(newData).deep.eq(
    {
      // old default is preserved
      p1: 'foo',
      // in case of type mismatch, old value is used (user will fix it)
      p2: 'bar',
      p3: ['bar'],
      // when old value is null, new defaults are used
      p4: { p4a: 'XXX' },
      // new values are added to nested object
      p5: { p5a: 'xxx', p5b: 'YYY' },
      // new values are added to nested array
      // new properties are added
      p6: 'BAR',
      // when old value is null, new defaults are used
      p7: [{ p7a: 'aa1', p7b: 'BB1' }, { p7a: 'aa2', p7b: 'BB2' }],
      // new properties are added
      p8: 42
    }
  );
});
