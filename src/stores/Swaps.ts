import { createStore } from 'pinia';
import { TransactionDetails as BtcTransactionDetails } from '@nimiq/electrum-client';
import { CryptoCurrency } from '../lib/Constants';
import { Swap as SwapObject } from '../lib/FastSpotApi';

export enum SwapState {
    SIGN_SWAP,
    AWAIT_INCOMING,
    CREATE_OUTGOING,
    AWAIT_SECRET,
    SETTLE_INCOMING,
    COMPLETE,
    EXPIRED,
}

export enum SwapDirection {
    NIM_TO_BTC,
    BTC_TO_NIM,
}

export type SwapNimData = {
    currency: CryptoCurrency.NIM,
    transactionHash: string,
};

export type SwapBtcData = {
    currency: CryptoCurrency.BTC,
    transactionHash: string,
    outputIndex: number,
};

export type Swap = {
    id?: string,
    provider?: 'Fastspot',
    in?: SwapNimData | SwapBtcData,
    out?: SwapNimData | SwapBtcData,
};

export type ActiveSwap<T extends SwapState> = SwapObject & {
    state: T,
} & (T extends SwapState.AWAIT_INCOMING
             | SwapState.CREATE_OUTGOING
             | SwapState.AWAIT_SECRET
             | SwapState.SETTLE_INCOMING
             | SwapState.COMPLETE
    ? {
        fundingSerializedTx: string,
        settlementSerializedTx: string,
    } : {})
& (T extends SwapState.CREATE_OUTGOING
           | SwapState.AWAIT_SECRET
           | SwapState.SETTLE_INCOMING
           | SwapState.COMPLETE
    ? {
        remoteFundingTx: ReturnType<Nimiq.Client.TransactionDetails['toPlain']> | BtcTransactionDetails,
    } : {})
& (T extends SwapState.AWAIT_SECRET
           | SwapState.SETTLE_INCOMING
           | SwapState.COMPLETE
    ? {
        fundingTx: ReturnType<Nimiq.Client.TransactionDetails['toPlain']> | BtcTransactionDetails,
    } : {})
& (T extends SwapState.SETTLE_INCOMING
           | SwapState.COMPLETE
    ? {
        // remoteSettlementTxHash: string,
        secret: string,
    } : {})
& (T extends SwapState.COMPLETE
    ? {
        settlementTx: ReturnType<Nimiq.Client.TransactionDetails['toPlain']> | BtcTransactionDetails,
    } : {});

export type SwapsState = {
    swaps: { [hash: string]: Swap },
    activeSwap: ActiveSwap<any> | null,
};

export const useSwapsStore = createStore({
    id: 'swaps',
    state: (): SwapsState => ({
        swaps: {},
        activeSwap: null,
    }),
    getters: {
        getSwap: (state): ((hash: string) => Swap | undefined) => (hash: string): Readonly<Swap> =>
            state.swaps[hash],
        activeSwap: (state): Readonly<ActiveSwap<any> | null> => state.activeSwap,
    },
    actions: {
        setSwap(hash: string, swap: Swap) {
            this.state.swaps = {
                ...this.state.swaps,
                [hash]: swap,
            };
        },
        addFundingData(hash: string, data: SwapNimData | SwapBtcData) {
            const swap: Swap = this.state.swaps[hash] || {};
            swap.in = data;
            this.setSwap(hash, swap);
        },
        addSettlementData(hash: string, data: SwapNimData | SwapBtcData) {
            const swap: Swap = this.state.swaps[hash] || {};
            swap.out = data;
            this.setSwap(hash, swap);
        },
        setActiveSwap(swap: ActiveSwap<any> | null) {
            this.state.activeSwap = swap;
        },
    },
});
