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
	Incluc0deContextResult,
	Incluc0deContextTool,
} from '../ContextProvider/types';

interface ProfileServiceResponse {
	userId?: string;

	profileContext?: {
		age?: number | null;

		education?: {
			level?: string | null;
			stage?: string | null;
		};

		conditionStatus?: string;

		conditions?: Array<{
			condition?: string;
			status?: string;
		}>;

		professionalContext?: {
			available?: boolean;
			documentsAvailable?: number;
			functionalObservations?: unknown[];
			adaptationRecommendations?: unknown[];
			otherRelevantInformation?: unknown[];
		};
	};
}

export class ProfileContext implements INodeType {

	description: INodeTypeDescription = {

		displayName: 'IncluC0de Profile Context',

		name: 'incluc0deProfileContext',

		icon: {
			light: 'file:context.svg',
			dark: 'file:context.dark.svg',
		},

		group: ['transform'],

		version: 1,

		description:
			'Provides user profile context to the IncluC0de Context Provider',

		defaults: {
			name: 'Profile Context',
		},

		inputs: [],

		outputs: [
			{
				type: NodeConnectionTypes.AiTool,
				displayName: 'Profile Context',
			},
		],

		properties: [

			{
				displayName: 'Service URL',

				name: 'serviceUrl',

				type: 'string',

				default:
					'http://n8n.incluc0de.com.br/webhook/profile',

				required: true,

				description:
					'Base URL of the IncluC0de Profile Service',
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

		const profileContextTool:
			Incluc0deContextTool = {

			contextType:
				'profile',

			getContext: async ({
				userId,
			}): Promise<Incluc0deContextResult> => {

				const normalizedUserId =
					userId?.trim() || null;

				if (!normalizedUserId) {

					return {

						contextType:
							'profile',

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

				const normalizedServiceUrl =
					serviceUrl.replace(/\/+$/, '');

				const requestUrl =
					`${normalizedServiceUrl}/${encodeURIComponent(normalizedUserId)}/context`;

				try {

					const response =
						await this.helpers.httpRequest({

							method:
								'GET',

							url:
								requestUrl,

							headers: {
								Accept:
									'application/json',
							},

							encoding:
								'json',
						});

					let responseData:
						| ProfileServiceResponse
						| undefined;

					if (
						Array.isArray(response)
					) {

						responseData =
							response[0] as
								ProfileServiceResponse;

					} else {

						responseData =
							response as
								ProfileServiceResponse;
					}

					if (
						!responseData ||
						!responseData.profileContext
					) {

						return {

							contextType:
								'profile',

							status:
								'unavailable',

							context:
								null,

							metadata: {
								reason:
									'profile_not_found',
							},
						};
					}

					return {

						contextType:
							'profile',

						status:
							'success',

						context:
							responseData.profileContext,

						metadata: {
							userId:
								responseData.userId ??
								normalizedUserId,
						},
					};

				} catch (error) {

					return {

						contextType:
							'profile',

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
				profileContextTool,
		};
	}
}