const CryptoService = require('../core/CryptoService');

class CryptoTestSuite {
  constructor() {
    this.crypto = new CryptoService();
    this.tests = 0;
  }

  assert(condition, message) {
    this.tests++;
    if (!condition) throw new Error(message);
  }

  run() {
    console.log('🧪 Running crypto tests...\n');
    
    try {
      this.testDeterminism();
      this.testBiasPrevention();
      this.testWinnerSelection();
      this.testEdgeCases();
      
      console.log(`\n✅ All ${this.tests} tests passed!`);
    } catch (error) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }
  }

  testDeterminism() {
    // Hash chain consistency
    const seed = this.crypto.sha256('test-seed');
    const chain1 = this.crypto.generateHashChain(seed, 5);
    const chain2 = this.crypto.generateHashChain(seed, 5);
    this.assert(JSON.stringify(chain1) === JSON.stringify(chain2), 'Hash chains inconsistent');
    
    // Raffle seed determinism
    const raffleSeed1 = this.crypto.generateRaffleSeed('master', 'raffle', 'nonce');
    const raffleSeed2 = this.crypto.generateRaffleSeed('master', 'raffle', 'nonce');
    this.assert(raffleSeed1 === raffleSeed2, 'Raffle seeds non-deterministic');
    
    // Different inputs = different seeds
    const seedA = this.crypto.generateRaffleSeed('a', 'raffle', 'nonce');
    const seedB = this.crypto.generateRaffleSeed('b', 'raffle', 'nonce');
    this.assert(seedA !== seedB, 'Different inputs produce same seed');
    
    console.log('✓ Determinism tests passed');
  }

  testBiasPrevention() {
    const results = Array.from({ length: 1000 }, (_, i) => {
      const hash = this.crypto.sha256(`bias-test-${i}`);
      return this.crypto.mapHashToTicketIndex(hash, 3); // High bias scenario
    });

    const validResults = results.filter(r => r !== null);
    const rejectedCount = results.length - validResults.length;
    
    this.assert(rejectedCount > 0, 'No bias prevention rejections');
    this.assert(validResults.every(r => r >= 0 && r < 3), 'Invalid ticket indices');
    
    console.log(`✓ Bias prevention passed (${rejectedCount} rejections)`);
  }

  testWinnerSelection() {
    const tickets = Array.from({ length: 100 }, (_, i) => ({
      id: `ticket-${i}`,
      ticket_uid: `uid-${i}`,
      user_uid: `user-${i % 20}`
    }));

    const winners = this.selectWinners(tickets, this.crypto.sha256('test-seed'), 5);
    
    this.assert(winners.length === 5, `Expected 5 winners, got ${winners.length}`);
    this.assert(new Set(winners.map(w => w.ticket_uid)).size === 5, 'Duplicate winners');
    this.assert(winners.every((w, i) => w.winner_place === i + 1), 'Invalid winner places');
    
    console.log('✓ Winner selection passed');
  }

  testEdgeCases() {
    [1, 2, 3, 8, 16, 32, 100].forEach(count => {
      const results = Array.from({ length: 50 }, (_, i) => {
        const hash = this.crypto.sha256(`edge-${count}-${i}`);
        return this.crypto.mapHashToTicketIndex(hash, count);
      });
      
      const validResults = results.filter(r => r !== null);
      this.assert(validResults.every(r => r >= 0 && r < count), `Invalid indices for ${count} tickets`);
    });

    // Test randomness uniqueness
    const randoms = Array.from({ length: 100 }, () => this.crypto.generateSecureRandom(32));
    this.assert(new Set(randoms).size === 100, 'Non-unique random values');
    
    console.log('✓ Edge cases passed');
  }

  selectWinners(tickets, seed, count) {
    const hashChain = this.crypto.generateHashChain(seed, count * 10);
    const winners = [];
    const used = new Set();
    
    for (const hash of hashChain) {
      if (winners.length >= count) break;
      
      const index = this.crypto.mapHashToTicketIndex(hash, tickets.length);
      if (index !== null && !used.has(index)) {
        used.add(index);
        winners.push({
          ticket_uid: tickets[index].ticket_uid,
          winner_place: winners.length + 1
        });
      }
    }
    
    return winners;
  }
}

new CryptoTestSuite().run();