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

export class Incluc0deLogs implements INodeType {

	description: INodeTypeDescription = {

		displayName: 'IncluC0de Logs',

		name: 'incluc0deLogs',

		icon: {
			light: 'file:logs.svg',
			dark: 'file:logs.dark.svg',
		},

		group: ['transform'],

		version: 1,

		description:
			'Registers IncluC0de adaptation events in the Adaptation Logs service',

		defaults: {
			name: 'IncluC0de Logs',
		},

		inputs: [
			NodeConnectionTypes.Main,
		],

		outputs: [
			NodeConnectionTypes.Main,
		],

		properties: [

			{
				displayName: 'Application ID',
				name: 'applicationId',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. mentoria-neuroadaptativo',
				description:
					'Unique identifier of the application generating the adaptation log',
			},

			{
				displayName: 'Application Name',
				name: 'applicationName',
				type: 'string',
				default: '',
				placeholder: 'e.g. MentorIA NeuroAdaptativo',
				description:
					'Human-readable name of the application generating the adaptation log',
			},

			{
				displayName: 'Experiment ID',
				name: 'experimentId',
				type: 'string',
				default: '',
				placeholder: 'e.g. piloto-2026',
				description:
					'Optional identifier of the experiment associated with this adaptation',
			},

			{
				displayName: 'Condition',
				name: 'experimentCondition',
				type: 'string',
				default: '',
				placeholder: 'e.g. C1',
				description:
					'Optional experimental condition associated with this adaptation',
			},

			{
				displayName: 'Fail-Safe',
				name: 'failSafe',
				type: 'boolean',
				default: true,
				description:
					'Whether to continue the workflow if the Adaptation Logs service is unavailable',
			},
		],
	};

	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][]> {

		const items =
			this.getInputData();

		const returnData:
			INodeExecutionData[] = [];

		/*
		 * ---------------------------------------------------------
		 * Adaptation Logs Service
		 *
		 * Nesta primeira versão o endpoint é interno ao node.
		 *
		 * Futuramente a autenticação será realizada através
		 * das Credentials do IncluC0de.
		 * ---------------------------------------------------------
		 */
		const serviceUrl =
			'https://n8n.incluc0de.com.br/webhook/log';

		for (
			let itemIndex = 0;
			itemIndex < items.length;
			itemIndex++
		) {

			const item =
				items[itemIndex];

			/*
			 * -----------------------------------------------------
			 * Parâmetros do node
			 * -----------------------------------------------------
			 */

			const applicationId =
				this.getNodeParameter(
					'applicationId',
					itemIndex,
				) as string;

			const applicationName =
				this.getNodeParameter(
					'applicationName',
					itemIndex,
					'',
				) as string;

			const experimentId =
				this.getNodeParameter(
					'experimentId',
					itemIndex,
					'',
				) as string;

			const experimentCondition =
				this.getNodeParameter(
					'experimentCondition',
					itemIndex,
					'',
				) as string;

			const failSafe =
				this.getNodeParameter(
					'failSafe',
					itemIndex,
					true,
				) as boolean;

			/*
			 * -----------------------------------------------------
			 * Normalização
			 * -----------------------------------------------------
			 */

			const normalizedApplicationId =
				applicationId.trim();

			const normalizedApplicationName =
				applicationName?.trim() || null;

			const normalizedExperimentId =
				experimentId?.trim() || null;

			const normalizedExperimentCondition =
				experimentCondition?.trim() || null;

			/*
			 * -----------------------------------------------------
			 * Application ID é obrigatório.
			 * -----------------------------------------------------
			 */

			if (
				!normalizedApplicationId
			) {

				throw new NodeOperationError(
					this.getNode(),
					'Application ID is required.',
					{
						itemIndex,
					},
				);
			}

			/*
			 * -----------------------------------------------------
			 * Contrato enviado ao Adaptation Logs Service
			 *
			 * O conteúdo original recebido do IncluC0de Agent
			 * é preservado.
			 *
			 * Incluímos apenas os metadados referentes à
			 * aplicação e, quando informados, ao experimento.
			 * -----------------------------------------------------
			 */

			const requestBody:
				IDataObject = {

				...item.json,

				application: {
					id:
						normalizedApplicationId,

					name:
						normalizedApplicationName,
				},
			};

			/*
			 * -----------------------------------------------------
			 * Experiment
			 *
			 * Só incluímos o objeto quando pelo menos uma
			 * informação experimental tiver sido fornecida.
			 * -----------------------------------------------------
			 */

			if (
				normalizedExperimentId ||
				normalizedExperimentCondition
			) {

				requestBody.experiment = {

					id:
						normalizedExperimentId,

					condition:
						normalizedExperimentCondition,
				};
			}

			try {

				/*
				 * -------------------------------------------------
				 * Envio para Adaptation Logs
				 * -------------------------------------------------
				 */

				await this.helpers
					.httpRequest({

						method:
							'POST',

						url:
							serviceUrl,

						headers: {
							'Content-Type':
								'application/json',

							Accept:
								'application/json',
						},

						body:
							requestBody,

						encoding:
							'json',
					});

				/*
				 * -------------------------------------------------
				 * PASS-THROUGH
				 *
				 * O registro do log não modifica a saída original
				 * do IncluC0de Agent.
				 * -------------------------------------------------
				 */

				returnData.push({

					json: {
						...item.json,
					},

					pairedItem: {
						item:
							itemIndex,
					},
				});

			} catch (error) {

				/*
				 * -------------------------------------------------
				 * FAIL-SAFE
				 *
				 * Por padrão uma falha no serviço de logs
				 * não interrompe o fluxo principal.
				 * -------------------------------------------------
				 */

				if (
					!failSafe
				) {

					throw new NodeOperationError(
						this.getNode(),
						error as Error,
						{
							itemIndex,
						},
					);
				}

				/*
				 * Mesmo em caso de falha no serviço de logs,
				 * preservamos o item original.
				 */

				returnData.push({

					json: {
						...item.json,
					},

					pairedItem: {
						item:
							itemIndex,
					},
				});
			}
		}

		return [
			returnData,
		];
	}
}