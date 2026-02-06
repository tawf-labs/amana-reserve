# Contributing to AMANA Reserve

Guidelines for contributing to the AMANA Sharia-native reserve system.

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Conventions](#commit-conventions)
- [Release Process](#release-process)

---

## Development Environment Setup

### Prerequisites

- **Node.js** 18+ and pnpm
- **Foundry** (for Ethereum contracts)
- **Rust** and **Anchor** (for Solana programs)
- **Git** for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/tawf-labs/amana-reserve
cd amana-reserve

# Install pnpm if needed
npm install -g pnpm

# Install all dependencies
pnpm install

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundry up

# Install Anchor (Solana)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Build all packages
pnpm build
```

### Development Workflow

```bash
# Start local development environment
pnpm dev

# Run tests for all packages
pnpm test

# Run linting
pnpm lint

# Format code
pnpm format
```

---

## Code Style Guidelines

### Solidity (Ethereum Contracts)

Follow the Solidity style guide:

```solidity
// SPDX-License-Identifier: Apache 2.0
pragma solidity ^0.8.26;

/**
 * @title ContractName
 * @notice Brief description
 */
contract ContractName {
    /// @notice State variable description
    uint256 public variableName;

    // Events come before functions
    event EventName(address indexed param, uint256 value);

    // External functions
    /// @notice Function description
    /// @param param Parameter description
    function functionName(uint256 param) external {
        // Implementation
    }

    // Internal functions
    function _internalFunction() internal pure returns (uint256) {
        // Implementation
    }
}
```

**Style Rules:**
- Max line length: 100 characters
- Indentation: 4 spaces
- Order: constants → events → structs → constructor → functions
- Use NatSpec for all public functions
- Events before the functions that emit them

### Rust (Solana Programs)

Follow Anchor and Rust conventions:

```rust
//! Module documentation

use anchor_lang::prelude::*;

/// Account documentation
#[account]
pub struct AccountName {
    /// Field documentation
    pub field_name: Pubkey,
    pub bump: u8,
}

/// Instruction documentation
#[program]
pub mod module_name {
    use super::*;

    /// Function documentation
    pub fn function_name(
        ctx: Context<InstructionName>,
        param: u64,
    ) -> Result<()> {
        // Implementation
        Ok(())
    }
}
```

**Style Rules:**
- Use `cargo fmt` for formatting
- Max line length: 100 characters
- Use `///` for documentation comments
- Use `//!` for module-level docs

### TypeScript

Follow TypeScript best practices:

```typescript
// Imports first
import { Type } from 'module';

// Interfaces and types
interface InterfaceName {
  property: string;
  readonly readonlyProperty: number;
}

// Classes
class ClassName {
  private privateProperty: string;
  public publicProperty: number;

  constructor(private config: Config) {}

  public async methodName(): Promise<Result> {
    // Implementation
  }
}

// Constants
const CONSTANT_VALUE = 'value';

// Functions
async function functionName(param: Type): Promise<Type> {
  // Implementation
}
```

**Style Rules:**
- Use `prettier` for formatting
- Max line length: 100 characters
- Use `const` by default, `let` only when reassigning
- Explicit return types for public functions

---

## Testing Requirements

### Test Coverage Goals

| Package | Coverage Target | Required |
|---------|----------------|----------|
| ethereum | >80% | Yes |
| solana | >70% | Yes |
| sdk | >80% | Yes |
| backend | >70% | Yes |
| zk | >60% | Yes |
| cross-chain | >60% | Yes |

### Ethereum Tests (Foundry)

```solidity
// SPDX-License-Identifier: Apache 2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { AmanaReserve } from "../src/AmanaReserve.sol";

contract AmanaReserveTest is Test {
    AmanaReserve public reserve;

    function setUp() public {
        reserve = new AmanaReserve();
        reserve.initialize(0.1 ether);
    }

    function testJoinReserve() public {
        vm.deal(address(this), address(this), 1 ether);
        reserve.joinReserve{value: 0.5 ether}();

        (uint256 capital,,,,,,,) = reserve.getParticipant(address(this));
        assertEq(capital, 0.5 ether);
    }

    function testFailJoinInsufficient() public {
        vm.expectRevert("Insufficient capital");
        reserve.joinReserve{value: 0.01 ether}();
    }
}
```

**Run tests:**
```bash
cd packages/ethereum
forge test
forge test --gas-report
forge coverage
```

### Solana Tests (Anchor)

```typescript
import * as anchor from "@coral-xyz/anchor";

describe("amana-reserve", () => {
  it("Initializes the reserve", async () => {
    const program = anchor.workspace.AmanaReserve as Program;

    await program.methods
      .initialize(new anchor.BN(100_000_000), 50)
      .rpc();
  });

  it("Joins the reserve", async () => {
    await program.methods
      .joinReserve(new anchor.BN(1_000_000_000))
      .accounts({
        reserve: reservePDA,
        participant: participantPDA,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });
});
```

**Run tests:**
```bash
cd packages/solana
anchor test
```

### SDK Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { AmanaSDK } from '@amana/sdk';

describe('AmanaSDK', () => {
  it('should initialize for Ethereum', () => {
    const sdk = new AmanaSDK({
      chain: 'ethereum',
      ethereum: { rpcUrl: 'http://localhost:8545', contracts: {} }
    });

    expect(sdk.isEthereum()).toBe(true);
  });

  it('should get reserve stats', async () => {
    const stats = await sdk.ethereum.getReserveStats();
    expect(stats.totalCapital).toBeDefined();
  });
});
```

### Linting

```bash
# Solidity
pnpm lint:sol

# Rust
pnpm lint:rust

# TypeScript
pnpm lint:ts
```

---

## Pull Request Process

### Branch Naming

```
feature/     # New features
fix/         # Bug fixes
refactor/    # Code refactoring
docs/        # Documentation only
test/        # Test additions/changes
release/     # Release preparation
```

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Test coverage meets requirements
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with target branch

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe tests added/updated

## Checklist
- [ ] Style guidelines followed
- [ ] Tests pass
- [ ] Documentation updated
```

---

## Commit Conventions

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, etc.) |
| `refactor` | Refactoring code |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

### Scopes

| Scope | Usage |
|-------|-------|
| `ethereum` | Ethereum contracts |
| `solana` | Solana programs |
| `sdk` | TypeScript SDK |
| `backend` | Backend services |
| `frontend` | Frontend application |
| `zk` | Zero-knowledge circuits |
| `cross-chain` | Cross-chain bridge |
| `docs` | Documentation |

### Examples

```
feat(ethereum): add participant limit check

Implement maximum participants check to prevent gas issues
when too many participants join the reserve.

Closes #123

fix(solana): handle overflow in capital distribution

Add checked arithmetic to prevent overflow when distributing
large amounts of capital.

Fixes #456

docs: update API reference with new functions

Add documentation for the new HAI tracking functions
added in v1.2.0.
```

---

## Release Process

### Version Bumping

```bash
# Update version in package.json files
pnpm version <major|minor|patch>

# This updates all packages in the monorepo
```

### Release Checklist

1. **Pre-Release**
   - [ ] All tests passing
   - [ ] Code coverage meets requirements
   - [ ] Security audit completed (for major releases)
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated

2. **Release**
   - [ ] Create release branch
   - [ ] Update version numbers
   - [ ] Tag release
   - [ ] Push tags

3. **Post-Release**
   - [ ] Deploy contracts (if applicable)
   - [ ] Publish packages to npm
   - [ ] Update website documentation
   - [ ] Announce release

### Publishing to NPM

```bash
# Build all packages
pnpm build

# Publish all packages
pnpm publish -r

# Or publish specific package
cd packages/sdk
pnpm publish
```

---

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Accept feedback gracefully
- Focus on what is best for the community

### Getting Help

- Open a discussion for questions
- Create an issue for bugs
- Join our Discord for real-time help

### Security Issues

For security vulnerabilities, please email security@amana.finance instead of opening a public issue.

---

## Sharia Compliance Guidelines

### Contract Development

All contracts must maintain Sharia compliance:

```solidity
// ✅ ALLOWED: Profit/loss sharing
function distributeProfit(uint256 profit) internal {
    // Distribute proportionally
}

// ❌ NOT ALLOWED: Interest-based returns
function earnInterest(uint256 principal, uint256 rate) {
    // This would be riba - NOT IMPLEMENTED
}
```

### Activity Validation

All activities must pass Sharia compliance checks:

```solidity
function validateActivity(Activity memory activity) internal {
    require(
        !isProhibitedActivity(activity.activityType),
        "Prohibited activity type"
    );
    require(activity.isAssetBacked, "Must be asset-backed");
    require(activity.hasRealEconomicValue, "Must have economic value");
}
```

---

For more information, see:
- [README.md](./README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SHARIA_COMPLIANCE.md](./SHARIA_COMPLIANCE.md)
