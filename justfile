# Zooy Package Development Justfile

# Show available commands
default:
    @just --list

# Clean build artifacts
clean:
    rm -rf dist
    @echo "✓ Cleaned dist/"

# Build the package
build: clean lint lint-fix
    npm run build
    @echo "✓ Built zooy package"

# Build and create tarball for local testing
pack: build
    npm pack
    @echo "✓ Created tarball: zooy-$(npm pkg get version | tr -d '\"').tgz"

# Lint JavaScript code
lint:
    npm run lint

# Fix linting issues
lint-fix:
    npm run lint:fix

# Run all quality checks
qa: lint
    @echo "✓ Quality checks passed"

# Bump version (patch by default)
bump-version TYPE="patch":
    npm version {{ TYPE }} --no-git-tag-version
    @echo "✓ Version bumped to $(npm pkg get version | tr -d '\"')"
    @echo "Next: Update CHANGELOG.md and commit"

# Build, bump version, and publish to npm
publish TYPE="patch": qa
    #!/usr/bin/env bash
    set -e

    echo "=== Publishing to npm ==="
    echo ""
    echo "Current version: $(npm pkg get version | tr -d '\"')"
    echo "Bump type: {{ TYPE }}"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted."
        exit 1
    fi

    echo "Building..."
    just build

    echo "Bumping version..."
    npm version {{ TYPE }} --no-git-tag-version
    NEW_VERSION=$(npm pkg get version | tr -d '"')

    echo "Publishing v$NEW_VERSION to npm..."
    npm publish

    echo ""
    echo "✓ Published v$NEW_VERSION to npm"
    echo ""
    echo "Next steps:"
    echo "  1. Commit version bump: git add package.json && git commit -m \"Bump to v$NEW_VERSION\""
    echo "  2. Tag release: git tag v$NEW_VERSION"
    echo "  3. Push: git push && git push --tags"

# Quick publish without version bump (use with caution)
publish-current:
    #!/usr/bin/env bash
    set -e

    echo "=== Publishing current version to npm ==="
    echo ""
    echo "Version: $(npm pkg get version | tr -d '\"')"
    echo ""
    read -p "Publish WITHOUT version bump? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted."
        exit 1
    fi

    just build
    npm publish
    echo "✓ Published to npm"

# Show current version
version:
    @echo "Current version: $(npm pkg get version | tr -d '\"')"

# Show what files will be included in the package
show-files:
    @echo "Files to be published:"
    @npm pack --dry-run 2>&1 | grep -A 1000 "Tarball Contents"
