import type {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from 'n8n-workflow';

import {
	NodeConnectionTypes,
} from 'n8n-workflow';

import type {
	Incluc0deContextProvider,
	Incluc0deContextResult,
	Incluc0deContextTool,
} from './types';

/**
 * Resultado produzido por uma fonte de contexto IncluC0de.
 *
 * Exemplos futuros:
 * - EEG
 * - Interaction
 * - Profile
 * - LMS
 * - Adaptation History
 */
export interface Incluc0deContextResult {
	contextType: string;

	status:
		| 'success'
		| 'unavailable'
		| 'error';

	context: unknown | null;

	metadata?: Record<string, unknown>;
}

/**
 * Resultado agregado pelo Context Provider.
 */
export interface Incluc0deContextProviderResult {
	status:
		| 'success'
		| 'partial'
		| 'unavailable';

	contexts: Incluc0deContextResult[];
}

/**
 * Interface fornecida pelo Context Provider
 * ao IncluC0de Agent.
 */
export interface Incluc0deContextProvider {
	getContexts(
		input: {
			sessionId?: string | null;
			userId?: string | null;
		},
	): Promise<Incluc0deContextProviderResult>;
}

/**
 * IncluC0de Context Provider
 *
 * Responsável por agregar diferentes fontes
 * de contexto cognitivo e disponibilizá-las
 * ao IncluC0de Agent.
 */
export class ContextProvider implements INodeType {

	description: INodeTypeDescription = {

		displayName: 'IncluC0de Context Provider',

		name: 'incluc0deContextProvider',

		icon: {
			light: 'file:context.svg',
			dark: 'file:context.dark.svg',
		},

		group: ['transform'],

		version: 1,

		description:
			'Aggregates cognitive context sources for the IncluC0de Agent',

		defaults: {
			name: 'Context Provider',
		},

		/**
		 * Context Tools serão conectados aqui.
		 *
		 * Exemplos:
		 *
		 * EEG Context
		 * Interaction Context
		 * Profile Context
		 */
		inputs: [
			{
				type: NodeConnectionTypes.AiTool,
				displayName: 'Context Sources',
				required: false,
			},
		],

		/**
		 * Saída especializada conectada
		 * ao IncluC0de Agent.
		 */
		outputs: [
			{
				type: NodeConnectionTypes.AiTool,
				displayName: 'Context',
			},
		],

		/**
		 * Nesta primeira versão o Provider
		 * não necessita de parâmetros próprios.
		 */
		properties: [],
	};

	/**
	 * supplyData() permite que o Context Provider
	 * funcione como subnode especializado.
	 *
	 * O objeto retornado em "response" será
	 * disponibilizado ao IncluC0de Agent.
	 */
	async supplyData(
		this: ISupplyDataFunctions,
		itemIndex: number,
	): Promise<SupplyData> {

		const provider: Incluc0deContextProvider = {

			/**
			 * Futuramente este método consultará
			 * todos os Context Tools conectados
			 * ao Provider.
			 */
			getContexts: async ({
				sessionId,
				userId,
			}) => {

				/**
				 * Nesta primeira implementação
				 * ainda não existem Context Tools
				 * sendo consultados.
				 *
				 * Portanto, o Provider informa
				 * que nenhum contexto está
				 * disponível.
				 */

				return {
					status: 'unavailable',
					contexts: [],
				};
			},
		};

		return {
			response: provider,
		};
	}
}