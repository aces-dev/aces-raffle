# ACES-Raffle System Architecture
Platform features three types of raffle games, each powered by a SHA-256-based hash chain PRNG. This setup ensures cryptographically secure randomness and allows players to verify fairness.

## Raffle types
* Single Winner Raffle A classic raffle where one winner is randomly selected from all participants.
* Multi-Winner RaffleMultiple winners are selected randomly without replacement. Winners are chosen without repeats.
* Progressive Jackpot RaffleA jackpot that grows over time and is awarded to a single winner once the prize pool hits a set threshold. 

## Algorithm
We use a SHA-256-based hash chain PRNG with lazy evaluation. The system generates hashes sequentially on-demand during winner selection, using FIFO order for simplicity and efficiency.
Key Details:
* Algorithm: SHA-256
* Chain generation: Deterministic - each raffle gets unique chain derived from master seed + raffle ID
* Usage order: FIFO
* Mapping Method: Hashes are converted to ticket indices using modular arithmetic with bias prevention
* Fairness: Fully transparent and provable, using a pre-commitment system

## Workflow
### 1. Pre-Commitment Phase

The chain is computed on-demand during the raffle, starting from raffle_seed. Only the final hash is published upfront. 

```
raffle_seed = SHA256(master_seed + raffle_id + nonce)
commitment_hash = SHA256(raffle_seed)
```

Chain construction:
* Master seed: Generated using cryptographically secure random number generator (CSPRNG)
* Chain generation: Each hash is created by hashing the previous one: 
```
hash_chain[i] = SHA256(hash_chain[i-1]), starting with raffle_seed as hash_chain[0]
```
* No pre-storage: To prevent fraud, the chain is generated on-demand ("lazy evaluation") starting from raffle_seed


### 2. Game Execution Phase

When a raffle closes, we generate the specific hash chain for that raffle and select winners.
* Chain computation: The system computes hashes sequentially from raffle_seed to select winners
* Map to winner: 
``` winning_ticket = int(hash, 16) % total_tickets```
* For multi-winner raffles: repeat with next hash from chain, excluding already selected tickets* Ticket list is frozen when raffle closes, before any hash calculations begin

### 3. Bias Prevention

To ensure fair distribution when hash range doesn't divide evenly by ticket count, we use rejection sampling: if the hash value falls outside the fair range, we use the next hash in the chain.

### 4. Verification Phase

After the raffle, we reveal the “master_seed”, “raffle_id”, and “nonce”. 
So anyone can recompute raffle_seed = SHA256(master_seed + raffle_id + nonce), rebuild the hash chain, and validate all winners.
