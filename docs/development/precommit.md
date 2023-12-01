## pre-commit setup

In your local folder, create a file `.git/hooks/pre-commit` with the following content

```bash
#!/bin/bash
npm run pre-commit
RESULT=$?
[ $RESULT -ne 0 ] && exit 1
exit 0
```

and make this file executable (`chmod +x .git/hooks/pre-commit`).

In this way, `npm run pre-commit` will run before every commit. This script is
defined in `package.json`, and points to
[`lint-staged`](https://github.com/okonet/lint-staged). The configuration is
written in `.lintstagedrc.json`, and it lists the checks to perform on each
kind of file (e.g. `eslint` and then `prettier`).
