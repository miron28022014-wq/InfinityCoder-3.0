# Contributing

Thanks for helping improve InfinityCoder.

## Before opening a pull request

1. Search existing issues and pull requests.
2. Keep changes focused and explain the user-visible problem they solve.
3. Do not commit secrets, API keys, personal data, generated installers, or large model files.
4. Update documentation when behavior, setup, or configuration changes.
5. Include a clear test plan in the pull request.

## Local checks

```bash
npm ci
npm run typecheck
npm test
npm run build
```

For Windows packaging, use the repository's GitHub Actions workflow and verify the resulting NSIS installer on a Windows machine.

## Pull request checklist

- [ ] The change has a clear purpose and scope.
- [ ] Typecheck and relevant tests pass.
- [ ] No credentials or private data are included.
- [ ] Documentation is updated where needed.
- [ ] Limitations and untested behavior are stated honestly.
