import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

interface Incluc0deAgentResponse {
	sessionId?: string | null;
	userId?: string | null;
	selfDeclaredNeurodivergence?: string | null;
	originalContent?: string;
	adaptedContent?: string;
}

export class Incluc0deAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IncluC0de Agent',
		name: 'incluc0deAgent',

		icon: {
			light: 'file:adapter.svg',
			dark: 'file:adapter.dark.svg',
		},

		group: ['transform'],

		version: 1,

		description:
			'Adapts generated content according to user information and cognitive context',

		defaults: {
			name: 'IncluC0de Agent',
		},

		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],

		properties: [
			{
				displayName: 'Service URL',
				name: 'serviceUrl',
				type: 'string',
				default: 'https://n8n.incluc0de.com.br/webhook/agent',
				required: true,
				description:
					'URL of the IncluC0de Agent adaptation endpoint',
			},

			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '={{ $json.output }}',
				required: true,
				description:
					'Original content to be evaluated and adapted by IncluC0de',
			},

			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '={{ $json.sessionId }}',
				description:
					'Identifier of the current interaction or application session',
			},

			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				placeholder: 'e.g. user-123',
				description:
					'Optional identifier of the user',
			},

			{
				displayName: 'Self-Declared Neurodivergence',
				name: 'selfDeclaredNeurodivergence',
				type: 'string',
				typeOptions: {
					rows: 2,
				},
				default: '',
				placeholder: 'e.g. ADHD, dyslexia, autism',
				description:
					'Optional self-declared information that may be considered during adaptation',
			},

			{
				displayName: 'Fail-Safe',
				name: 'failSafe',
				type: 'boolean',
				default: true,
				description:
					'Whether to preserve the original content if the IncluC0de service is unavailable',
			},
		],
	};

	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];

			const serviceUrl = this.getNodeParameter(
				'serviceUrl',
				itemIndex,
			) as string;

			const content = this.getNodeParameter(
				'content',
				itemIndex,
			) as string;

			const sessionId = this.getNodeParameter(
				'sessionId',
				itemIndex,
				'',
			) as string;

			const userId = this.getNodeParameter(
				'userId',
				itemIndex,
				'',
			) as string;

			const selfDeclaredNeurodivergence =
				this.getNodeParameter(
					'selfDeclaredNeurodivergence',
					itemIndex,
					'',
				) as string;

			const failSafe = this.getNodeParameter(
				'failSafe',
				itemIndex,
				true,
			) as boolean;

			/*
			 * ---------------------------------------------------------
			 * Normalização
			 * ---------------------------------------------------------
			 */

			const normalizedSessionId =
				sessionId?.trim() || null;

			const normalizedUserId =
				userId?.trim() || null;

			const normalizedSelfDeclaration =
				selfDeclaredNeurodivergence?.trim() || null;

			/*
			 * ---------------------------------------------------------
			 * Regra 1:
			 *
			 * Sem userId e sem autoidentificação:
			 * não existe informação suficiente para adaptação.
			 *
			 * O serviço NÃO deve ser chamado.
			 * ---------------------------------------------------------
			 */

			if (
				!normalizedUserId &&
				!normalizedSelfDeclaration
			) {
				returnData.push({
					json: {
						...item.json,

						sessionId: normalizedSessionId,

						userId: null,

						selfDeclaredNeurodivergence: null,

						originalContent: content,

						adaptedContent: content,

						incluc0de: {
							adapted: false,
							mode: 'pass_through',
							reason:
								'no_user_or_self_declaration',
						},
					},
					pairedItem: {
						item: itemIndex,
					},
				});

				continue;
			}

			/*
			 * ---------------------------------------------------------
			 * Montagem do contrato enviado ao IncluC0de Agent Service
			 * ---------------------------------------------------------
			 */

			const requestBody: IDataObject = {
				sessionId: normalizedSessionId,
				content,
			};

			if (normalizedUserId) {
				requestBody.userId =
					normalizedUserId;
			}

			if (normalizedSelfDeclaration) {
				requestBody.selfDeclaredNeurodivergence =
					normalizedSelfDeclaration;
			}

			try {
				/*
				 * -----------------------------------------------------
				 * Chamada ao endpoint IncluC0de
				 * -----------------------------------------------------
				 */

				const response =
					await this.helpers.httpRequest({
						method: 'POST',

						url: serviceUrl,

						headers: {
							'Content-Type':
								'application/json',

							Accept:
								'application/json',
						},

						body: requestBody,

						encoding: 'json',
					});

				/*
				 * -----------------------------------------------------
				 * O endpoint atual do n8n retorna:
				 *
				 * [
				 *   {
				 *     sessionId,
				 *     userId,
				 *     selfDeclaredNeurodivergence,
				 *     originalContent,
				 *     adaptedContent
				 *   }
				 * ]
				 *
				 * Portanto, normalizamos array/objeto aqui.
				 * -----------------------------------------------------
				 */

				let responseData:
					| Incluc0deAgentResponse
					| undefined;

				if (Array.isArray(response)) {
					responseData =
						response[0] as Incluc0deAgentResponse;
				} else {
					responseData =
						response as Incluc0deAgentResponse;
				}

				/*
				 * -----------------------------------------------------
				 * Validação mínima do contrato
				 * -----------------------------------------------------
				 */

				if (
					!responseData ||
					typeof responseData.adaptedContent !==
						'string'
				) {
					throw new NodeOperationError(
						this.getNode(),
						'The IncluC0de service returned an invalid response contract.',
						{
							itemIndex,
						},
					);
				}

				/*
				 * -----------------------------------------------------
				 * Resultado do node
				 * -----------------------------------------------------
				 */

				returnData.push({
					json: {
						...item.json,

						sessionId:
							responseData.sessionId ??
							normalizedSessionId,

						userId:
							responseData.userId ??
							normalizedUserId,

						selfDeclaredNeurodivergence:
							responseData.selfDeclaredNeurodivergence ??
							normalizedSelfDeclaration,

						originalContent:
							responseData.originalContent ??
							content,

						adaptedContent:
							responseData.adaptedContent,

						incluc0de: {
							adapted:
								responseData.adaptedContent !==
								content,

							mode:
								normalizedUserId
									? 'user'
									: 'self_declared',

							service:
								'incluc0de-agent',
						},
					},

					pairedItem: {
						item: itemIndex,
					},
				});
			} catch (error) {
				/*
				 * -----------------------------------------------------
				 * FAIL-SAFE
				 *
				 * Um problema no serviço IncluC0de não deve,
				 * por padrão, interromper a aplicação consumidora.
				 * -----------------------------------------------------
				 */

				if (!failSafe) {
					throw new NodeOperationError(
						this.getNode(),
						error as Error,
						{
							itemIndex,
						},
					);
				}

				returnData.push({
					json: {
						...item.json,

						sessionId:
							normalizedSessionId,

						userId:
							normalizedUserId,

						selfDeclaredNeurodivergence:
							normalizedSelfDeclaration,

						originalContent: content,

						adaptedContent: content,

						incluc0de: {
							adapted: false,

							mode:
								'pass_through',

							reason:
								'service_unavailable',
						},
					},

					pairedItem: {
						item: itemIndex,
					},
				});
			}
		}

		return [returnData];
	}
}