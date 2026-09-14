import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';

import {
	NodeConnectionTypes,
} from 'n8n-workflow';

import type {
	Incluc0deContextResult,
	Incluc0deContextTool,
} from '../ContextProvider/types';

interface EEGServiceResponse {
	status?: string;

	contextType?: string;

	context?: unknown | null;

	evidence?: unknown;

	metrics?: unknown;

	metadata?: Record<string, unknown>;

	message?: string;

	note?: string;
}

export class EEGContext implements INodeType {

	description: INodeTypeDescription = {

		displayName: 'IncluC0de EEG Context',

		name: 'incluc0deEegContext',

		icon: {
			light: 'file:context.svg',
			dark: 'file:context.dark.svg',
		},

		group: ['transform'],

		version: 1,

		description:
			'Provides EEG context to the IncluC0de Context Provider',

		defaults: {
			name: 'EEG Context',
		},

		inputs: [],

		outputs: [
			{
				type: NodeConnectionTypes.AiTool,
				displayName: 'EEG Context',
			},
		],

		properties: [

			{
				displayName: 'Service URL',

				name: 'serviceUrl',

				type: 'string',

				default:
					'http://localhost:5678/webhook/eegtool/status',

				required: true,

				description:
					'URL of the IncluC0de EEG Context Service',
			},

			{
				displayName: 'Time Window',

				name: 'timeWindow',

				type: 'options',

				options: [

					{
						name: '1 Minute',
						value: '1m',
					},

					{
						name: '5 Minutes',
						value: '5m',
					},

					{
						name: '10 Minutes',
						value: '10m',
					},

					{
						name: '30 Minutes',
						value: '30m',
					},

					{
						name: 'Current Session',
						value: 'session',
					},
				],

				default:
					'5m',

				description:
					'Time window used by the EEG analysis service',
			},

			{
				displayName: 'Activity ID',

				name: 'activityId',

				type: 'string',

				default: '',

				placeholder:
					'e.g. atividade_01',

				description:
					'Optional identifier of the current activity',
			},
		],
	};

	async supplyData(
		this: ISupplyDataFunctions,
		itemIndex: number,
	): Promise<SupplyData> {

		const serviceUrl =
			this.getNodeParameter(
				'serviceUrl',
				itemIndex,
			) as string;

		const timeWindow =
			this.getNodeParameter(
				'timeWindow',
				itemIndex,
				'5m',
			) as string;

		const activityId =
			this.getNodeParameter(
				'activityId',
				itemIndex,
				'',
			) as string;

		const eegContextTool:
			Incluc0deContextTool = {

			contextType:
				'eeg',

			getContext: async ({
				sessionId,
				userId,
			}): Promise<Incluc0deContextResult> => {

				const normalizedUserId =
					userId?.trim() || null;

				const normalizedSessionId =
					sessionId?.trim() || null;

				const normalizedActivityId =
					activityId?.trim() || null;

				if (!normalizedUserId) {

					return {

						contextType:
							'eeg',

						status:
							'unavailable',

						context:
							null,

						metadata: {
							reason:
								'missing_user_id',
						},
					};
				}

				if (
					timeWindow === 'session' &&
					!normalizedSessionId
				) {

					return {

						contextType:
							'eeg',

						status:
							'unavailable',

						context:
							null,

						metadata: {
							reason:
								'missing_session_id',
						},
					};
				}

				const requestBody:
					IDataObject = {

					userId:
						normalizedUserId,

					time_window:
						timeWindow,
				};

				if (
					normalizedSessionId
				) {

					requestBody.session_id =
						normalizedSessionId;
				}

				if (
					normalizedActivityId
				) {

					requestBody.activity_id =
						normalizedActivityId;
				}

				try {

					const response =
						await this.helpers.httpRequest({

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

					let responseData:
						| EEGServiceResponse
						| undefined;

					if (
						Array.isArray(response)
					) {

						responseData =
							response[0] as
								EEGServiceResponse;

					} else {

						responseData =
							response as
								EEGServiceResponse;
					}

					if (!responseData) {

						return {

							contextType:
								'eeg',

							status:
								'unavailable',

							context:
								null,

							metadata: {
								reason:
									'invalid_response',
							},
						};
					}

					if (
						responseData.status ===
							'success' &&
						responseData.context
					) {

						return {

							contextType:
								'eeg',

							status:
								'success',

							context:
								responseData.context,

							evidence:
								responseData.evidence,

							metrics:
								responseData.metrics,

							metadata: {

								...(responseData.metadata ??
									{}),

								timeWindow,

								activityId:
									normalizedActivityId,
							},

							note:
								responseData.note ??
								null,
						};
					}

					if (
						responseData.status ===
						'empty'
					) {

						return {

							contextType:
								'eeg',

							status:
								'unavailable',

							context:
								null,

							metadata: {

								...(responseData.metadata ??
									{}),

								reason:
									'no_readings',

								message:
									responseData.message ??
									null,
							},
						};
					}

					if (
						responseData.status ===
						'unavailable'
					) {

						return {

							contextType:
								'eeg',

							status:
								'unavailable',

							context:
								null,

							metadata: {

								...(responseData.metadata ??
									{}),

								reason:
									'eeg_unavailable',

								message:
									responseData.message ??
									null,
							},
						};
					}

					return {

						contextType:
							'eeg',

						status:
							'unavailable',

						context:
							null,

						metadata: {

							reason:
								'unexpected_response',

							serviceStatus:
								responseData.status ??
								null,
						},
					};

				} catch (error) {

					return {

						contextType:
							'eeg',

						status:
							'unavailable',

						context:
							null,

						metadata: {

							reason:
								'service_unavailable',

							error:
								error instanceof Error
									? error.message
									: String(error),
						},
					};
				}
			},
		};

		return {
			response:
				eegContextTool,
		};
	}
}