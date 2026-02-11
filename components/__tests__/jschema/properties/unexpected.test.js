import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/svelte';
import { renderSchema } from './property_test_utils';
import userEvent from '@testing-library/user-event';

describe('Unexpected properties (extra properties)', () => {

  it('Extra string', async function () {
    const user = userEvent.setup();
    const { component } = renderSchema(
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          validProperty: { type: 'string' }
        }
      },
      'pydantic_v2',
      {
        validProperty: 'foo',
        unexpectedProperty: 'bar'
      }
    );
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo',
      unexpectedProperty: 'bar'
    });

    expect(screen.queryAllByText('must NOT have additional properties')).toHaveLength(1);

    await user.type(screen.getByRole('textbox', { name: 'unexpectedProperty' }), 'x');
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo',
      unexpectedProperty: 'barx'
    });

    expect(component.valid).toEqual(false);

    await user.click(screen.getByRole('button', { name: 'Remove Property Block' }));
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo'
    });

    expect(component.valid).toEqual(true);
  });

  it('Extra array', async function () {
    const user = userEvent.setup();
    const { component } = renderSchema(
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          validProperty: { type: 'string' }
        }
      },
      'pydantic_v2',
      {
        validProperty: 'foo',
        unexpectedProperty: ['a', 'b']
      }
    );
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo',
      unexpectedProperty: ['a', 'b']
    });

    expect(screen.queryAllByText('must NOT have additional properties')).toHaveLength(1);

    await user.type(screen.getAllByRole('textbox')[1], 'x');
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo',
      unexpectedProperty: ['ax', 'b']
    });

    expect(component.valid).toEqual(false);

    await user.click(screen.getByRole('button', { name: 'Remove Property Block' }));
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo'
    });

    expect(component.valid).toEqual(true);
  });

  it('Extra object', async function () {
    const user = userEvent.setup();
    const { component } = renderSchema(
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          validProperty: { type: 'string' }
        }
      },
      'pydantic_v2',
      {
        validProperty: 'foo',
        unexpectedProperty: { foo: { bar: 'baz' } }
      }
    );
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo',
      unexpectedProperty: { foo: { bar: 'baz' } }
    });

    expect(screen.queryAllByText('must NOT have additional properties')).toHaveLength(1);

    await user.type(screen.getAllByRole('textbox')[1], 'A');
    await user.type(screen.getAllByRole('textbox')[2], 'B');
    await user.type(screen.getAllByRole('textbox')[3], 'C');
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo',
      unexpectedProperty: { fooA: { barB: 'bazC' } }
    });

    expect(component.valid).toEqual(false);

    await user.click(screen.getByRole('button', { name: 'Remove Property Block' }));
    expect(component.getArguments()).deep.eq({
      validProperty: 'foo'
    });

    expect(component.valid).toEqual(true);
  });
});