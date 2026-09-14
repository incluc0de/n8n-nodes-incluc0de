export interface Incluc0deContextRequest {
	sessionId?: string | null;
	userId?: string | null;
}

export interface Incluc0deContextResult {
	contextType: string;

	status:
		| 'success'
		| 'unavailable'
		| 'error';

	context: unknown | null;

	evidence?: unknown;

	metrics?: unknown;

	metadata?: Record<string, unknown>;

	note?: string | null;
}

export interface Incluc0deContextTool {
	contextType: string;

	getContext(
		input: Incluc0deContextRequest,
	): Promise<Incluc0deContextResult>;
}

export interface Incluc0deContextProviderResult {
	status:
		| 'success'
		| 'partial'
		| 'unavailable';

	contexts: Incluc0deContextResult[];
}

export interface Incluc0deContextProvider {
	getContexts(
		input: Incluc0deContextRequest,
	): Promise<Incluc0deContextProviderResult>;
}