import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/svelte';
import { renderSchema } from './property_test_utils';
import userEvent from '@testing-library/user-event';

describe('Invalid properties (type mismatch)', () => {

  it('String instead of object', async function () {
    const user = userEvent.setup();
    const { component } = renderSchema(
      {
        type: 'object',
        properties: {
          k: {
            type: 'object',
            properties: { foo: { type: 'string' } }
          },
        }
      },
      'pydantic_v2',
      { k: 'xxx' }
    );

    expect(component.getArguments()).deep.eq({ k: 'xxx' });
    expect(component.valid).toEqual(false);
    expect(screen.queryAllByText('must be object')).toHaveLength(1);

    await user.type(screen.getByRole('textbox'), 'y');
    expect(component.getArguments()).deep.eq({ k: 'xxxy' });

    await user.click(screen.getByRole('button', { name: 'Reset to Default Value' }));
    expect(component.getArguments()).deep.eq({
      k: { foo: null }
    });
    expect(screen.queryAllByText('must be object')).toHaveLength(0);
    expect(component.valid).toEqual(true);
  });

  it('Array instead of object', async function () {
    const user = userEvent.setup();
    const { component } = renderSchema(
      {
        type: 'object',
        properties: {
          k: {
            type: 'object',
            properties: { foo: { type: 'string' } }
          },
        }
      },
      'pydantic_v2',
      { k: ['xxx'] }
    );

    expect(component.getArguments()).deep.eq({ k: ['xxx'] });
    expect(component.valid).toEqual(false);
    expect(screen.queryAllByText('must be object')).toHaveLength(1);

    await user.type(screen.getByRole('textbox'), 'y');
    expect(component.getArguments()).deep.eq({ k: ['xxxy'] });

    await user.click(screen.getByRole('button', { name: 'Reset to Default Value' }));
    expect(component.getArguments()).deep.eq({
      k: { foo: null }
    });
    expect(screen.queryAllByText('must be object')).toHaveLength(0);
    expect(component.valid).toEqual(true);
  });

  it('Object instead of array', async function () {
    const user = userEvent.setup();
    const { component } = renderSchema(
      {
        type: 'object',
        properties: {
          k: {
            type: 'array',
            items: { type: 'string' }
          },
        }
      },
      'pydantic_v2',
      { k: { foo: 'bar' } }
    );

    expect(component.getArguments()).deep.eq({ k: { foo: 'bar' } });
    expect(component.valid).toEqual(false);
    expect(screen.queryAllByText('must be array')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Reset to Default Value' }));
    expect(component.getArguments()).deep.eq({ k: [] });
    expect(screen.queryAllByText('must be array')).toHaveLength(0);
    expect(component.valid).toEqual(true);
  });

  it('Object instead of string', async function () {
    const user = userEvent.setup();
    const { component } = renderSchema(
      {
        type: 'object',
        properties: {
          k: { type: 'string' },
        }
      },
      'pydantic_v2',
      { k: { foo: 'bar' } }
    );

    expect(component.getArguments()).deep.eq({ k: { foo: 'bar' } });
    expect(component.valid).toEqual(false);
    expect(screen.queryAllByText('must be string')).toHaveLength(1);

    await user.type(screen.getAllByRole('textbox')[0], 'x');
    await user.type(screen.getAllByRole('textbox')[1], 'y');
    expect(component.getArguments()).deep.eq({ k: { foox: 'bary' } });

    await user.click(screen.getByRole('button', { name: 'Reset to Default Value' }));
    expect(component.getArguments()).deep.eq({ k: null });
    expect(screen.queryAllByText('must be string')).toHaveLength(0);
    expect(component.valid).toEqual(true);
  });

  it('Array instead of string', async function () {
    const user = userEvent.setup();
    const { component } = renderSchema(
      {
        type: 'object',
        properties: {
          k: { type: 'string' },
        }
      },
      'pydantic_v2',
      { k: ['foo'] }
    );

    expect(component.getArguments()).deep.eq({ k: ['foo'] });
    expect(component.valid).toEqual(false);
    expect(screen.queryAllByText('must be string')).toHaveLength(1);

    await user.type(screen.getByRole('textbox'), 'x');
    expect(component.getArguments()).deep.eq({ k: ['foox'] });

    await user.click(screen.getByRole('button', { name: 'Reset to Default Value' }));
    expect(component.getArguments()).deep.eq({ k: null });
    expect(screen.queryAllByText('must be string')).toHaveLength(0);
    expect(component.valid).toEqual(true);
  });
});