import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
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
			'Aggregates context sources for the IncluC0de Agent',

		defaults: {
			name: 'Context Provider',
		},

		/*
		 * Context Tools conectam-se ao Provider
		 * utilizando a conexão especializada AiTool.
		 */
		inputs: [
			{
				type: NodeConnectionTypes.AiTool,
				displayName: 'Context Sources',
				required: false,
			},
		],

		/*
		 * O Provider conecta-se ao IncluC0de Agent.
		 */
		outputs: [
			{
				type: NodeConnectionTypes.AiTool,
				displayName: 'Context',
			},
		],

		properties: [],
	};

	async supplyData(
		this: ISupplyDataFunctions,
		itemIndex: number,
	): Promise<SupplyData> {
		/*
		 * ---------------------------------------------------------
		 * Obtém todos os Context Tools conectados ao Provider.
		 * ---------------------------------------------------------
		 */

		let connectedData: unknown;

		try {
			connectedData =
				await this.getInputConnectionData(
					NodeConnectionTypes.AiTool,
					itemIndex,
				);
		} catch {
			connectedData = [];
		}

		/*
		 * Dependendo da quantidade de conexões,
		 * o n8n pode fornecer um único objeto
		 * ou uma coleção de objetos.
		 */
		const contextTools:
			Incluc0deContextTool[] =
				Array.isArray(connectedData)
					? connectedData as Incluc0deContextTool[]
					: connectedData
						? [
								connectedData as
									Incluc0deContextTool,
							]
						: [];

		/*
		 * ---------------------------------------------------------
		 * Provider disponibilizado ao IncluC0de Agent.
		 * ---------------------------------------------------------
		 */

		const provider:
			Incluc0deContextProvider = {
			getContexts: async ({
				sessionId,
				userId,
			}) => {
				const contexts:
					Incluc0deContextResult[] = [];

				/*
				 * -------------------------------------------------
				 * Consulta todos os Context Tools conectados.
				 * -------------------------------------------------
				 */
				for (
					const contextTool of
						contextTools
				) {
					/*
					 * Proteção contra conexões
					 * incompatíveis com o contrato esperado.
					 */
					if (
						!contextTool ||
						typeof contextTool.getContext !==
							'function'
					) {
						continue;
					}

					try {
						const result =
							await contextTool.getContext({
								sessionId,
								userId,
							});

						contexts.push(
							result,
						);
					} catch (error) {
						/*
						 * A falha de um Context Tool
						 * não deve interromper os demais.
						 */
						contexts.push({
							contextType:
								contextTool.contextType ??
								'unknown',

							status:
								'unavailable',

							context:
								null,

							metadata: {
								reason:
									'context_tool_error',

								error:
									error instanceof Error
										? error.message
										: String(error),
							},
						});
					}
				}

				/*
				 * -------------------------------------------------
				 * Nenhum Context Tool conectado ou válido.
				 * -------------------------------------------------
				 */
				if (
					contexts.length === 0
				) {
					return {
						status:
							'unavailable',

						contexts: [],
					};
				}

				/*
				 * -------------------------------------------------
				 * Calcula o status agregado.
				 *
				 * success:
				 *   todos os contexts responderam com sucesso
				 *
				 * partial:
				 *   pelo menos um contexto disponível
				 *   e pelo menos um indisponível
				 *
				 * unavailable:
				 *   nenhum contexto disponível
				 * -------------------------------------------------
				 */

				const successfulContexts =
					contexts.filter(
						(context) =>
							context.status ===
							'success',
					);

				let status:
					| 'success'
					| 'partial'
					| 'unavailable';

				if (
					successfulContexts.length ===
					contexts.length
				) {
					status =
						'success';
				} else if (
					successfulContexts.length > 0
				) {
					status =
						'partial';
				} else {
					status =
						'unavailable';
				}

				/*
				 * -------------------------------------------------
				 * Resultado agregado retornado ao IncluC0de Agent.
				 * -------------------------------------------------
				 */
				return {
					status,
					contexts,
				};
			},
		};

		return {
			response:
				provider,
		};
	}
}