# How Our Raffles Stay Fair and Transparent?

### Starting with a Seed
Every raffle starts with a random seed—a unique code that drives the whole process. Before the raffle begins, we share a secure, hashed version of this seed (called a commitment) publicly. This hash, created using SHA-256, locks in the seed so no one can change it later, ensuring everything stays honest.

### Picking Winners
When the raffle ends, we use the seed to generate a sequence of numbers with SHA-256, a trusted method that produces unpredictable results. Each number picks a winner. For example, if there are 1,000 tickets, a number like 742 selects ticket #742. If there are multiple winners, we use the next numbers in the sequence, making sure no ticket is picked twice.

### How You Can Verify?
After the raffle, we share everything you need to check the results yourself: the original seed, the raffle ID, and a random number called the nonce. You can use a free SHA-256 calculator online to recreate the number sequence and confirm the winning tickets match what we announced. If the numbers line up, you know the raffle was fair.

### What You’ll See on the Raffle Page?
Our raffle page includes all the details you need to trust the process: the commitment hash (shared before the raffle), the seed, raffle ID, and nonce (shared after), and a list of winning tickets with their corresponding hashes. For example, you might see: 
“Raffle #123: Seed = ‘a3f8…’, Nonce = 42. Winner #1: Hash ‘d9e1…’ → Ticket #742.” 
With this information, anyone can verify the results.

## Why This Matters?
Our system is designed so no one—not even us—can predict or influence the winners. By sharing all the details, we make it possible for you to check the math and confirm the raffle is fair. Transparency is at the heart of what we do.


Documentation of code: https://github.com/aces-dev/aces-raffle/blob/np/CODE_ARCHIRECTURE.md

Documentation of algorithm: https://github.com/aces-dev/aces-raffle/blob/np/ALGORITHM_ARCHITECTURE.md

```
----- All Rights Reserved -----

Copyright(c) 2025 - ACES Malawi
This code is for viewing only. Unauthorized use is prohibited.

This code is provided for viewing purposes only. You are NOT permitted to:
- Use this code in any project (commercial or non-commercial).
- Modify, distribute, or sublicense this code.

Unauthorized use, copying, or distribution of this code without explicit written permission from the copyright holder is strictly prohibited and may result in legal action.
```
