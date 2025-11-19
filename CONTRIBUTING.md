# Contributing to IndexedDB Cache System

First off, thank you for considering contributing to the IndexedDB Cache System! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, demo links)
- **Describe the behavior you observed** and what you expected
- **Include browser version and OS information**

Example bug report:
```
**Title**: Cache not invalidating after POST request

**Description**: When making a POST request to /api/users, the cache for GET /api/users 
is not being invalidated as expected.

**Steps to Reproduce**:
1. Initialize CachedApiClient with default settings
2. Make GET request to https://api.example.com/users
3. Make POST request to https://api.example.com/users with body {name: "Test"}
4. Make another GET request to https://api.example.com/users
5. Observe that cached data is returned instead of fresh data

**Expected**: Cache should be invalidated and fresh data fetched
**Actual**: Cached data is returned

**Browser**: Chrome 120.0.6099.109
**OS**: macOS 14.0
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **Include code examples** if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** with clear, descriptive commits
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request**

#### Pull Request Guidelines

- Keep PRs focused on a single feature/fix
- Write clear commit messages
- Add tests for new features
- Update README.md if adding new functionality
- Follow the existing code style
- Reference relevant issues in your PR description

Example PR structure:
```
## Description
Brief description of what this PR does

## Changes
- Added feature X
- Fixed bug Y
- Updated documentation for Z

## Testing
- Tested in Chrome, Firefox, and Safari
- Added unit tests for new functionality
- All existing tests pass

## Related Issues
Closes #123
```

## Code Style Guidelines

### JavaScript Style

- Use **2 spaces** for indentation
- Use **camelCase** for variable and function names
- Use **PascalCase** for class names
- Add **JSDoc comments** for all public methods
- Keep functions **small and focused**
- Use **async/await** instead of raw promises
- Include **error handling** for all async operations

Example:
```javascript
/**
 * Retrieve data from cache
 * @param {string} cacheKey - The cache key to retrieve
 * @returns {Promise<Object|null>} Cached data or null if not found
 */
async getFromCache(cacheKey) {
  try {
    await this.init();
    // Implementation
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}
```

### Commit Message Format

Use descriptive commit messages following this format:

```
type: brief description

Longer description if needed

- Bullet points for details
- Reference issues: #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat: add support for custom cache key generation

fix: resolve cache invalidation issue for POST requests
Fixes #123

docs: update README with React integration examples

refactor: simplify cache key hashing algorithm
```

## Development Setup

1. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/indexdb-cache-system.git
cd indexdb-cache-system
```

2. Open `demo.html` in a browser to test changes interactively

3. Test your changes thoroughly across different browsers

## Testing

Currently, testing is done manually via `demo.html`. Future contributions to add automated tests are welcome!

### Manual Testing Checklist

- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test cache hits
- [ ] Test cache misses
- [ ] Test cache invalidation (POST/PUT/DELETE)
- [ ] Test with custom TTL
- [ ] Test with otherKeys
- [ ] Test pagination scenario
- [ ] Test request deduplication
- [ ] Test statistics accuracy
- [ ] Test error handling

## Documentation

When adding new features:

1. Update `README.md` with usage examples
2. Add JSDoc comments to new methods
3. Update `usage-examples.js` if applicable
4. Consider adding examples to `demo.html`

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## Code of Conduct

Be respectful and constructive in all interactions. We're all here to learn and improve!

## Recognition

Contributors will be recognized in the README. Thank you for your contributions! 🙏
