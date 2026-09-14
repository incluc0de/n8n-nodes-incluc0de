import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { NodeConnectionTypes } from 'n8n-workflow';

export class Incluc0deAgent implements INodeType {
	description: INodeTypeDescription = {
		/**
		 * Nome apresentado ao usuário na interface do n8n.
		 */
		displayName: 'IncluC0de Agent',

		/**
		 * Identificador interno do node.
		 * Deve permanecer estável nas versões futuras.
		 */
		name: 'incluc0deAgent',

		/**
		 * Ícones utilizados pelo n8n para os modos claro e escuro.
		 */
		icon: {
			light: 'file:adapter.svg',
			dark: 'file:adapter.dark.svg',
		},

		/**
		 * Categoria do node no n8n.
		 */
		group: ['transform'],

		/**
		 * Versão inicial do node.
		 */
		version: 1,

		/**
		 * Descrição apresentada pelo n8n.
		 */
		description:
			'Adapts generated content according to user information and cognitive context',

		/**
		 * Nome padrão apresentado quando o node é adicionado ao workflow.
		 */
		defaults: {
			name: 'IncluC0de Agent',
		},

		/**
		 * Fluxo principal.
		 *
		 * Neste momento:
		 *
		 * AI Agent
		 *    ↓
		 * IncluC0de Agent
		 *    ↓
		 * Output
		 */
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],

		properties: [
			/**
			 * Conteúdo que deverá ser analisado e posteriormente adaptado.
			 *
			 * Por padrão utilizamos o campo "output", normalmente produzido
			 * pelo AI Agent do n8n.
			 */
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
					'Content to be evaluated and adapted by IncluC0de',
			},

			/**
			 * Identificador opcional do usuário.
			 *
			 * Quando informado, futuramente permitirá:
			 *
			 * - validar o usuário;
			 * - recuperar informações de contexto;
			 * - utilizar histórico;
			 * - produzir adaptações personalizadas.
			 */
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				placeholder: 'e.g. user-123',
				description:
					'Optional identifier of the user for contextual and personalized adaptation',
			},

			/**
			 * Informação fornecida diretamente pelo usuário.
			 *
			 * Pode ser utilizada quando não houver User ID ou como
			 * informação complementar ao contexto recuperado.
			 */
			{
				displayName: 'Self-Declared Neurodivergence',
				name: 'selfDeclaredNeurodivergence',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				placeholder: 'e.g. ADHD, dyslexia, autism',
				description:
					'Optional self-declared information that may be considered during adaptation',
			},
		],
	};

	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		/**
		 * -------------------------------------------------------------
		 * CURRENT IMPLEMENTATION
		 * -------------------------------------------------------------
		 *
		 * Nesta primeira versão o IncluC0de Agent funciona como
		 * pass-through (bypass).
		 *
		 * Nenhuma adaptação é realizada ainda.
		 *
		 * Isso permite validar:
		 *
		 * - carregamento do custom node;
		 * - entrada Main;
		 * - saída Main;
		 * - integração com o AI Agent;
		 * - configuração inicial dos parâmetros.
		 *
		 * -------------------------------------------------------------
		 * FUTURE IMPLEMENTATION
		 * -------------------------------------------------------------
		 *
		 * O IncluC0de Agent deverá futuramente:
		 *
		 * 1. Obter o conteúdo recebido.
		 *
		 * 2. Verificar se existe User ID.
		 *
		 * 3. Validar o usuário quando um User ID for informado.
		 *
		 * 4. Consultar o Context Provider.
		 *
		 * 5. Obter contextos disponíveis, por exemplo:
		 *
		 *    - EEG;
		 *    - interação;
		 *    - perfil;
		 *    - LMS;
		 *    - histórico de adaptação;
		 *    - outros Context Tools.
		 *
		 * 6. Considerar eventual informação de neurodivergência
		 *    autodeclarada.
		 *
		 * 7. Determinar se existe evidência suficiente para adaptação.
		 *
		 * 8. Adaptar o conteúdo quando apropriado.
		 *
		 * 9. Preservar o conteúdo original quando a adaptação não
		 *    for aplicável ou quando o contexto for insuficiente.
		 */

		return [items];
	}
}