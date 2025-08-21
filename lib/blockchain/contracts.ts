import { prepareContractCall, getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { Account } from 'thirdweb/wallets';

// Hardcoded ThirdWeb client
const client = createThirdwebClient({
  clientId: '2f654d0179741f6776fa108a9683038e',
});

// Define chain - Using Base Sepolia for testing (cheap transactions)
const chain = defineChain({
  id: 84532, // Base Sepolia
  name: 'Base Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpc: 'https://sepolia.base.org',
  blockExplorers: [
    {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  ],
});

// Trivia Battle smart contract address (mock address for demo)
// TODO: Replace with actual deployed contract address when ready for production
const TRIVIA_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000001';

// Entry fee in Wei (0.01 ETH = 10000000000000000 Wei)
export const ENTRY_FEE_WEI = '10000000000000000'; // 0.01 ETH

// Contract ABI for trivia battle functionality
const TRIVIA_ABI = [
  {
    type: 'function',
    name: 'joinBattle',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'submitScore',
    inputs: [
      { name: 'gameId', type: 'bytes32' },
      { name: 'score', type: 'uint256' },
      { name: 'answers', type: 'bytes32[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'distributePrizes',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPrizePool',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlayerCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'PlayerJoined',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'entryFee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ScoreSubmitted',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'gameId', type: 'bytes32', indexed: true },
      { name: 'score', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PrizesDistributed',
    inputs: [
      { name: 'gameId', type: 'bytes32', indexed: true },
      { name: 'totalPool', type: 'uint256', indexed: false },
      { name: 'winners', type: 'address[]', indexed: false },
    ],
  },
] as const;

export class TriviaContract {
  private static _contract: ReturnType<typeof getContract> | null = null;
  
  private static getContractInstance() {
    if (!this._contract) {
      this._contract = getContract({
        client,
        chain,
        address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
        abi: TRIVIA_ABI,
      });
    }
    return this._contract;
  }

  /**
   * Check if the contract is deployed and accessible
   */
  static async isContractDeployed(): Promise<boolean> {
    try {
      const { readContract } = await import('thirdweb');
      await readContract({
        contract: this.getContractInstance(),
        method: 'function getPrizePool() view returns (uint256)',
        params: [],
      })
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot decode zero data')) {
        return false;
      }
      // For other errors, we assume the contract might be deployed but having issues
      return false;
    }
  }

  /**
   * Safe contract read with fallback for non-deployed contracts
   */
  private static async safeContractRead<T>(
    method: string,
    params: unknown[] = [],
    fallbackValue: T
  ): Promise<T> {
    try {
      const { readContract } = await import('thirdweb');
      const result = await readContract({
        contract: this.getContractInstance(),
        method,
        params,
      });
      return result as T;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot decode zero data')) {
        console.warn(`Contract not deployed or returning empty data for ${method}, using fallback value`);
        return fallbackValue;
      }
      console.error(`Error reading ${method}:`, error);
      return fallbackValue;
    }
  }

  /**
   * Join a trivia battle by paying the entry fee
   */
  static async joinBattle(_account: Account): Promise<ReturnType<typeof prepareContractCall>> {
    const contract = this.getContractInstance()
    return prepareContractCall({
      contract,
      // Use function signature for stricter typing across SDK versions
      method: 'function joinBattle()',
      params: [],
      value: BigInt(ENTRY_FEE_WEI),
    });
  }

  /**
   * Submit game score and answers to the smart contract
   */
  static async submitScore(
    account: Account,
    gameId: string,
    score: number,
    answerHashes: string[]
  ): Promise<ReturnType<typeof prepareContractCall>> {
    // Convert answers to bytes32 format
    const answerBytes32 = answerHashes.map(hash => 
      hash.padStart(66, '0x' + '0'.repeat(64))
    );
    
    const contract = this.getContractInstance()
    return prepareContractCall({
      contract,
      method: 'function submitScore(bytes32 gameId, uint256 score, bytes32[] answers)',
      params: [gameId as `0x${string}`, BigInt(score), answerBytes32 as `0x${string}`[]],
    });
  }

  /**
   * Trigger prize distribution for completed game
   */
  static async distributePrizes(
    account: Account,
    gameId: string
  ): Promise<ReturnType<typeof prepareContractCall>> {
    const contract = this.getContractInstance()
    return prepareContractCall({
      contract,
      method: 'function distributePrizes(bytes32 gameId)',
      params: [gameId as `0x${string}`],
    });
  }

  /**
   * Get current prize pool amount
   */
  static async getPrizePool(): Promise<bigint> {
    return this.safeContractRead('getPrizePool', [], BigInt(0));
  }

  /**
   * Get current number of players in the battle
   */
  static async getPlayerCount(): Promise<number> {
    const result = await this.safeContractRead('getPlayerCount', [], BigInt(0));
    return Number(result);
  }

  /**
   * Convert Wei to ETH for display
   */
  static weiToEth(weiValue: bigint): number {
    return Number(weiValue) / Math.pow(10, 18);
  }

  /**
   * Convert ETH to Wei
   */
  static ethToWei(ethValue: number): bigint {
    return BigInt(Math.floor(ethValue * Math.pow(10, 18)));
  }

  /**
   * Generate a unique game ID
   */
  static generateGameId(playerAddress: string, timestamp: number): string {
    const data = `${playerAddress}_${timestamp}_${Math.random()}`;
    // Simple hash function for demo - in production use proper keccak256
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  }

  /**
   * Hash answer for commitment scheme
   */
  static hashAnswer(
    questionId: string,
    answer: number,
    nonce: string
  ): string {
    const data = `${questionId}_${answer}_${nonce}`;
    // Simple hash function for demo
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  }
}

export { client, chain, TRIVIA_CONTRACT_ADDRESS };