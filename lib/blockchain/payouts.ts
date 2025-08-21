import { sendTransaction } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { TriviaContract, ENTRY_FEE_WEI } from './contracts';
// import type { LeaderboardEntry } from '@/types/game';

export interface PayoutDistribution {
  first: number;    // 50%
  second: number;   // 30% 
  third: number;    // 15%
  participation: number; // 5%
}

export interface GameResult {
  gameId: string;
  playerAddress: string;
  playerName?: string;
  finalScore: number;
  rank: number;
  timeCompleted: number;
  answersSubmitted: number;
  totalQuestions: number;
}

export class PayoutSystem {
  private static readonly PAYOUT_PERCENTAGES: PayoutDistribution = {
    first: 0.50,
    second: 0.30,
    third: 0.15,
    participation: 0.05,
  };

  /**
   * Process entry fee payment when player joins battle
   */
  static async processEntryFee(account: Account): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      console.log(`💰 Processing $0.01 entry fee payment...`);
      
      const transaction = await TriviaContract.joinBattle(account);
      const result = await sendTransaction({ 
        transaction,
        account,
      });

      console.log('✅ Entry fee paid successfully:', result.transactionHash);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      console.error('❌ Entry fee payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  /**
   * Submit game score to blockchain
   */
  static async submitGameScore(
    account: Account,
    gameId: string,
    finalScore: number,
    answers: Array<{
      questionId: string;
      selectedAnswer: number;
      isCorrect: boolean;
    }>
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      console.log(`📊 Submitting game score: ${finalScore}`);

      // Create answer hashes for commitment
      const answerHashes = answers.map(answer =>
        TriviaContract.hashAnswer(
          answer.questionId,
          answer.selectedAnswer,
          Date.now().toString()
        )
      );

      const transaction = await TriviaContract.submitScore(
        account,
        gameId,
        finalScore,
        answerHashes
      );

      const result = await sendTransaction({ 
        transaction,
        account,
      });

      console.log('✅ Score submitted successfully:', result.transactionHash);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      console.error('❌ Score submission failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Score submission failed',
      };
    }
  }

  /**
   * Calculate payout amounts based on prize pool
   */
  static calculatePayouts(totalPrizePool: number): {
    first: number;
    second: number;
    third: number;
    participation: number;
  } {
    return {
      first: totalPrizePool * this.PAYOUT_PERCENTAGES.first,
      second: totalPrizePool * this.PAYOUT_PERCENTAGES.second,
      third: totalPrizePool * this.PAYOUT_PERCENTAGES.third,
      participation: totalPrizePool * this.PAYOUT_PERCENTAGES.participation,
    };
  }

  /**
   * Distribute prizes to winners (called by game admin)
   */
  static async distributePrizes(
    account: Account,
    gameId: string,
    results: GameResult[]
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    payouts: Array<{
      address: string;
      amount: number;
      rank: number;
    }>;
    error?: string;
  }> {
    try {
      console.log(`🏆 Distributing prizes for game ${gameId}`);

      // Sort results by score (highest first)
      const sortedResults = [...results].sort((a, b) => b.finalScore - a.finalScore);

      const prizePool = await TriviaContract.getPrizePool();
      const totalPrizeEth = TriviaContract.weiToEth(prizePool);
      const payouts = this.calculatePayouts(totalPrizeEth);

      const prizeDistribution = sortedResults.map((result, index) => {
        let amount = 0;
        
        if (index === 0) amount = payouts.first;           // 1st place
        else if (index === 1) amount = payouts.second;     // 2nd place  
        else if (index === 2) amount = payouts.third;      // 3rd place
        else amount = payouts.participation / Math.max(sortedResults.length - 3, 1); // Participation split
        
        return {
          address: result.playerAddress,
          amount,
          rank: index + 1,
        };
      });

      // Execute smart contract prize distribution
      const transaction = await TriviaContract.distributePrizes(account, gameId);
      const result = await sendTransaction({ 
        transaction,
        account,
      });

      console.log('✅ Prizes distributed successfully:', result.transactionHash);
      console.log('💸 Prize breakdown:', prizeDistribution);

      return {
        success: true,
        transactionHash: result.transactionHash,
        payouts: prizeDistribution,
      };
    } catch (error) {
      console.error('❌ Prize distribution failed:', error);
      return {
        success: false,
        payouts: [],
        error: error instanceof Error ? error.message : 'Prize distribution failed',
      };
    }
  }

  /**
   * Get real-time prize pool information
   */
  static async getPrizePoolInfo(): Promise<{
    totalAmount: number;
    entryFee: number;
    participants: number;
    distribution: {
      first: number;
      second: number;
      third: number;
      participation: number;
    };
  }> {
    try {
      // Check if contract is deployed first
      const isDeployed = await TriviaContract.isContractDeployed();
      
      if (!isDeployed) {
        console.warn('Smart contract not deployed, using demo mode with mock data');
        return {
          totalAmount: 0.01,
          entryFee: 0.01,
          participants: 1,
          distribution: {
            first: 0.005,
            second: 0.003,
            third: 0.0015,
            participation: 0.0005,
          },
        };
      }

      const prizePool = await TriviaContract.getPrizePool();
      const playerCount = await TriviaContract.getPlayerCount();
      
      const totalAmount = TriviaContract.weiToEth(prizePool);
      const entryFee = TriviaContract.weiToEth(BigInt(ENTRY_FEE_WEI));
      
      const distribution = this.calculatePayouts(totalAmount);

      return {
        totalAmount,
        entryFee,
        participants: playerCount,
        distribution,
      };
    } catch (error) {
      console.error('Error fetching prize pool info:', error);
      // Fallback to mock data for development
      return {
        totalAmount: 0.01,
        entryFee: 0.01,
        participants: 1,
        distribution: {
          first: 0.005,
          second: 0.003,
          third: 0.0015,
          participation: 0.0005,
        },
      };
    }
  }

  /**
   * Estimate gas costs for transactions
   */
  static async estimateGasCosts(): Promise<{
    joinBattle: string;
    submitScore: string;
    distributePrizes: string;
  }> {
    // Rough estimates for Base Sepolia (very cheap)
    return {
      joinBattle: '0.0001 ETH',    // ~$0.0002
      submitScore: '0.0002 ETH',   // ~$0.0004
      distributePrizes: '0.0005 ETH', // ~$0.001
    };
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number, currency: 'ETH' | 'USD' = 'ETH'): string {
    if (currency === 'ETH') {
      return `${amount.toFixed(4)} ETH`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  }

  /**
   * Check if player can afford entry fee
   */
  static async canAffordEntry(account: Account): Promise<boolean> {
    try {
      // Get account balance using thirdweb
      const { getWalletBalance } = await import('thirdweb/wallets');
      // Access the client exported from contracts to satisfy typing
      const { client, chain } = await import('./contracts');
      const balance = await getWalletBalance({ client, chain, address: account.address });
      
      const balanceWei = BigInt(balance.value);
      const requiredWei = BigInt(ENTRY_FEE_WEI);
      const gasEstimate = BigInt('100000000000000'); // 0.0001 ETH for gas
      
      return balanceWei >= (requiredWei + gasEstimate);
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }
}