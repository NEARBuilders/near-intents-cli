export interface SwapQuoteRequest {
	fromTokenId: string;
	toTokenId: string;
	amount: string;
}

export interface SwapQuoteResponse {
	status: "success" | "error";
	quoteId?: string;
	fromTokenId?: string;
	toTokenId?: string;
	amountIn?: string;
	amountInFormatted?: string;
	amountOut?: string;
	amountOutFormatted?: string;
	exchangeRate?: string;
	expiresAt?: number;
	message?: string;
}

export interface SwapExecuteRequest {
	quoteId: string;
}

export interface SwapExecuteResponse {
	status: "success" | "error";
	txHash?: string;
	explorerLink?: string;
	message?: string;
}
