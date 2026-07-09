---
title: Workflow page
description: The workflow editor, where you assemble tasks into a workflow and run it on a dataset.
---

# Workflow page

The workflow page is where you build a workflow by adding and ordering tasks,
set their arguments, and run it on a dataset.

!!! info "What is a workflow?"

    --8<-- "workflows.md"

    [Learn more about workflows →](../concepts/workflows.md)

TODO: Figure out how to split this page up into relevant sub-pages that get linked to:

- Task list
- Task arguments
- Workflow submission
- Workflow monitoring
- Log access

## Overview

TODO Screenshot

## Adding and ordering tasks

TODO — adding a [task](../concepts/tasks.md); reordering; removing.
This is the list of task of the current workflow. You can add new tasks with the "+" button, or reorder the existing ones with the "arrows" button.

If a task is marked as non-active, you can try to reactivate it at {{ fractal_link('Tasks management', '/v2/tasks/management') }}, but only if it is a task that you collected yourself.

## Task arguments

TODO — editing arguments; validation.
meta args

## Documentation

Task info
Workflow & task descriptions by the user

## Run a workflow

TODO — selecting a [dataset](dataset.md);

## Monitor running workflows

Status indicators

## Log access

Individual logs
Runs
Warnings

## Common actions

- **Add a task** — TODO.
- **Run on a dataset** — TODO.

## Related

- Concept: [Workflows](../concepts/workflows.md) · [Tasks](../concepts/tasks.md)
- Reference: [Task collection](task-collection.md) · [Jobs](jobs.md)
