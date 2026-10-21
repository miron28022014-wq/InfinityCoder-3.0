# InfinityCoder 3.0.0

## Summary

Initial public release candidate of InfinityCoder 3.0 for Windows x64.

## Included

- Windows x64 NSIS installer built by GitHub Actions.
- React/TypeScript desktop interface hosted by Tauri.
- Code editor and project file tools.
- AI agent tools and project-memory functionality described in the repository documentation.
- Bundled Vulkan-capable `llama-server` runtime from the upstream runtime distribution.

## Validation

The GitHub Actions workflow passed TypeScript checking, frontend build, installer build, installer existence verification, and artifact upload for the release commit.

**Important:** CI success confirms that the package was built; it does not prove every feature works on every machine. Please report reproducible issues with sanitized logs.

## Installation

Download the `*_x64-setup.exe` asset below and run it on Windows x64. Configure a supported AI provider/model after installation. Model weights may need to be downloaded separately and are not guaranteed to be bundled.

## Known release notes

- This release has not yet been independently signed with a code-signing certificate.
- Windows SmartScreen may show a reputation warning.
- Manual end-to-end testing across different Windows versions and GPU configurations remains necessary.
- Review the repository's license status before redistribution.
