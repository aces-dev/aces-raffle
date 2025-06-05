Architecture

```
raffle-rng-system/
├── core/
│   └── CryptoService.js          # Core cryptographic operations
├── services/
│   ├── DatabaseService.js        # DB operations
│   ├── CommitmentManager.js      # Commitment & secret revelation
│   ├── RaffleExecutor.js         # Raffle execution logic
│   └── VerificationService.js    # Verification results
├── tests/
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── RaffleRNGSystem.js           # Main orchestrator
├── package.json
└── README.md
```

# Component Architecture

## Core Components

### `core/CryptoService.js`
Handles all cryptographic operations powering the system:

- **`generateSecureRandom()`** - Cryptographically secure pseudo-random number generator (CSPRNG) for seeds and nonces  
- **`sha256()`** - SHA-256 hashing function  
- **`generateRaffleSeed()`** - Deterministic seed generation algorithm  
- **`generateHashChain()`** - Lazy hash chain generation  
- **`mapHashToTicketIndex()`** - Bias-free hash-to-index mapping  

## Service Layer

### `services/DatabaseService.js`
Manages all database interactions:

- **`getRaffle()`** - Retrieve raffle data  
- **`storeCommitment()`** - Store commitment hash  
- **`storeSecrets()`** - Securely store RNG secrets  
- **`getSecrets()`** - Fetching RNG secrets  
- **`getRaffleTickets()`** - Fetch tickets in FIFO order
- **`updateRaffleResults()`** - Batch update results  
- **`revealSecrets()`** - Reveal secrets for verification  

### `services/CommitmentManager.js`
Handles commitment-reveal scheme:

- **`createPreCommitment()`** - Phase 1: Create cryptographic commitment  
- **`revealSecrets()`** - Phase 3: Reveal secrets for public verification  

### `services/RaffleExecutor.js`
Core raffle execution logic:

- **`validateRaffleExecution()`** - Pre-execution validation checks  
- **`calculateRequiredHashes()`** - Calculate expected rejection rate
- **`selectWinners()`** - Fair winner selection algorithm  
- **`executeRaffle()`** - Phase 2: Main execution workflow  

### `services/VerificationService.js`
Provides public verification capabilities:

- **`verifyCommitment()`** - Verify commitment hash integrity  
- **`regenerateWinners()`** - Recreate winner selection process  
- **`compareWinners()`** - Compare original vs. verified results  
- **`verifyRaffle()`** - Complete end-to-end verification process  

### Main Orchestrator - `RaffleRNGSystem.js`


# Basic Usage

```
const RaffleRNGSystem = require('./RaffleRNGSystem');

const raffleSystem = new RaffleRNGSystem();
const raffleId = '';

enum RafflePhase {
  PreCommitment = 1,
  Execute = 2,
  RevealSecrets = 3,
  Verify = 4
}

// Run individual phases
await raffleSystem.executePhase(1, raffleId); // Pre-commitment
await raffleSystem.executePhase(2, raffleId, 3); // Execute with 3 winners
await raffleSystem.executePhase(3, raffleId); // Reveal secrets
await raffleSystem.executePhase(4, raffleId); // Verify

// Or run complete workflow
const results = await raffleSystem.executeWorkflow(raffleId, 5);
console.log(results);
// Output: { 1: {...}, 2: {...}, 3: {...}, 4: {...} }

// Check verification only
const verification = await raffleSystem.executePhase(4, raffleId);
console.log(verification.verified); // true/false
```


# Algorithm Details

## Hash Chain Generation
```
raffle_seed = SHA256(master_seed + raffle_uuid + nonce)
commitment_hash = SHA256(raffle_seed)

hash_chain[0] = raffle_seed
hash_chain[i] = SHA256(hash_chain[i-1])
```

## Winner Selection
```
for each hash in chain:
  ticket_index = hash % total_tickets (with bias prevention)
  if ticket not already selected:
    add to winners
```

## Verification Process
```
1. Verify: SHA256(master_seed + raffle_uuid + nonce) == raffle_seed
2. Verify: SHA256(raffle_seed) == commitment_hash  
3. Regenerate hash chain and winners
4. Compare original vs regenerated results
```