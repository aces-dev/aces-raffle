const admin = require('firebase-admin');
const sourceServiceAccountCredentials = require('../firebaseconn.json');

class FirebaseConnection {
    static instance = null;
    static firebaseApp = null;
  
    constructor() {
      if (FirebaseConnection.instance) {
        return FirebaseConnection.instance;
      }
      
      this.db = this.initFirebaseConn();
      FirebaseConnection.instance = this;
    }
  
    initFirebaseConn() {
      if (!FirebaseConnection.firebaseApp) {
        FirebaseConnection.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(sourceServiceAccountCredentials)
        }, 'source');
      }
      
      return FirebaseConnection.firebaseApp.firestore();
    }
  
    static getInstance() {
      if (!FirebaseConnection.instance) {
        FirebaseConnection.instance = new FirebaseConnection();
      }
      return FirebaseConnection.instance;
    }
}


class DatabaseService {
    constructor() {
        this.db = FirebaseConnection.getInstance().db;
    }

    async getRaffle(raffleUuid) {
        const raffleDoc = await this.db.collection('raffles').doc(raffleUuid).get();
        if (!raffleDoc.exists) {
            throw new Error('Raffle not found');
        }
        return raffleDoc.data();
    }

    async storeCommitment(raffleUuid, commitmentHash) {
        const raffleRef = this.db.collection('raffles').doc(raffleUuid);
        await raffleRef.update({
            rng_commitment: {
                commitment_hash: commitmentHash,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                status: 'committed',
                master_seed: null,
                nonce: null,
                raffle_seed: null
            }
        });
    }

    async storeSecrets(raffleUuid, secrets) {
        await this.db.collection('rng_secrets').doc(raffleUuid).set({
            master_seed: secrets.master_seed,
            nonce: secrets.nonce,
            raffle_seed: secrets.raffle_seed,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    async getSecrets(raffleUuid) {
        const secretsDoc = await this.db.collection('rng_secrets').doc(raffleUuid).get();
        if (!secretsDoc.exists) {
            throw new Error('RNG secrets not found');
        }
        return secretsDoc.data();
    }

    async getRaffleTickets(raffleUid) {
        try {
            const ticketsSnapshot = await this.db.collection('tickets')
                .where('raffle_uid', '==', raffleUid)
                .orderBy('purchase_date', 'asc')
                .get();

            const tickets = [];
            let index = 0;
            
            ticketsSnapshot.forEach(doc => {
                const ticketData = doc.data();
                tickets.push({
                    id: doc.id,
                    ticket_index: index, // Sequential index for selection
                    ...ticketData
                });
                index++;
            });

            return tickets;
        } catch (error) {
            console.error('Error getting raffle tickets:', error);
            throw error;
        }
    }


    /**
     * Update raffle and tickets with execution results
     * @param {string} raffleUuid
     * @param {Array} winners - Array of winner objects
     * @param {object} executionStats - Execution statistics
     * @param {object} raffleData - Original raffle data
     * @returns {Promise<void>}
     */
    async updateRaffleResults(raffleUuid, winners, executionStats, raffleData) {
        const batch = this.db.batch();
        
        // Update winning tickets
        for (const winner of winners) {
            const ticketRef = this.db.collection('tickets').doc(winner.ticket_id);
            batch.update(ticketRef, {
                is_winner: true,
                winner_place: winner.winner_place,
                prize: raffleData.main_raffle_prize
            });
        }

        // Update raffle with results
        const raffleRef = this.db.collection('raffles').doc(raffleUuid);
        batch.update(raffleRef, {
            status: 'completed',
            rng_execution: {
                executed_at: admin.firestore.FieldValue.serverTimestamp(),
                total_tickets: executionStats.total_tickets,
                winners_selected: winners.length,
                hashes_used: executionStats.hashes_used,
                rejected_hashes: executionStats.rejected_hashes,
                winners: winners.map(w => ({
                    ticket_uid: w.ticket_uid,
                    user_uid: w.user_uid,
                    winner_place: w.winner_place
                }))
            }
        });

        await batch.commit();
    }

    async revealSecrets(raffleUuid, secrets) {
        const raffleRef = this.db.collection('raffles').doc(raffleUuid);
        await raffleRef.update({
            'rng_commitment.status': 'revealed',
            'rng_commitment.master_seed': secrets.master_seed,
            'rng_commitment.nonce': secrets.nonce,
            'rng_commitment.raffle_seed': secrets.raffle_seed,
            'rng_commitment.revealed_at': admin.firestore.FieldValue.serverTimestamp()
        });
    }
}

module.exports = DatabaseService;