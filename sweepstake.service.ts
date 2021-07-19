@Injectable()
export class SweepstakeService {
    public constructor(
    ) { }

    public async sweepstake(auctionArtwork: AuctionArtworkEntity, prizeFund: number): Promise<TransactionEntity[]> {
        try {
            const minPrize = 10000;
            const useRandom = (prizeFund / auctionArtwork.prop_history.length) < minPrize;

            if (prizeFund <= 0) {
                return [];
            }

            const winnerTransactions: TransactionEntity[] = [];

            if (useRandom) {
                const numberPrizes = Math.trunc(prizeFund / minPrize);

                if (numberPrizes == 0) {
                    return [];
                }

                const props = new Map<string, PropHistoryEntity>();

                auctionArtwork.prop_history.forEach(prop => props.set(prop.id, prop));

                for (let i = 0; i < numberPrizes; i++) {
                    const winnerId = weightedRandom(Array.from(props.keys()))();
                    const winner = props.get(winnerId)!;
                    const newTransaction = this.createTransaction(minPrize, winner.user);

                    if (newTransaction != null) {
                        winnerTransactions.push(newTransaction);
                    }

                    props.delete(winnerId);
                }
            } else {
                const prize = Math.trunc(prizeFund / auctionArtwork.prop_history.length);

                for (const winner of auctionArtwork.prop_history) {
                    const newTransaction = this.createTransaction(prize, winner.user);

                    if (newTransaction != null) {
                        winnerTransactions.push(newTransaction);
                    }
                }
            }

            return winnerTransactions;
        } catch (error) {
            return [];
        }
    }

    private createTransaction(amount: number, user: UserEntity): TransactionEntity | null {
        const newTransaction = new TransactionEntity();

        newTransaction.status = TransactionStatus.SUCCESSED;
        newTransaction.type = TransactionType.SWEEPSTAKE;
        newTransaction.wants_amount = amount;
        newTransaction.amount = amount;
        newTransaction.user = user;
        newTransaction.description = 'You have won in a sweepstake';
        newTransaction.total_amount = +user.wants_balance + amount;
        newTransaction.currency = TransactionCurrency.DOLLAR;

        const wallet = user.wallets.find(wallet => wallet.type == WalletType.INNER);

        if (!wallet) {
            return null;
        } else {
            newTransaction.wallet = wallet;

            return newTransaction;
        }
    }
}
