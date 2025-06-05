const crypto = require('crypto');


class CryptoService {
    constructor() {
        this.HASH_ALGORITHM = 'sha256';
    }

    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    sha256(data) {
        return crypto.createHash(this.HASH_ALGORITHM).update(data).digest('hex');
    }

    generateRaffleSeed(masterSeed, raffleUuid, nonce) {
        const combined = `${masterSeed}${raffleUuid}${nonce}`;
        return this.sha256(combined);
    }

    /**
     * Generate hash chain lazily (on-demand) by seed and chain length
     * @param {string} seed
     * @param {num} length
     * @returns {string[]} Array of hashes
     */
    generateHashChain(seed, length) {
        const chain = [];
        let currentHash = seed;
        
        for (let i = 0; i < length; i++) {
            chain.push(currentHash);
            currentHash = this.sha256(currentHash);
        }
        
        return chain;
    }

    /**
     * Map hash to ticket index with bias prevention using rejection sampling
     * @param {string} hash
     * @param {num} totalTickets
     * @returns {num|null}
     */
    mapHashToTicketIndex(hash, totalTickets) {
        const hashInt = BigInt('0x' + hash);
        const maxFairValue = BigInt(2) ** BigInt(256) - (BigInt(2) ** BigInt(256) % BigInt(totalTickets));

        // Simulate rejection for testing
        if (Math.random() < 0.1) {
            return null;
        }

        if (hashInt >= maxFairValue) {
            return null;
        }
        return Number(hashInt % BigInt(totalTickets));
    }

}

module.exports = CryptoService;