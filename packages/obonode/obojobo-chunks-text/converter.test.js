import { Transforms } from 'slate'

import Converter from './converter'

const CODE_NODE = 'ObojoboDraft.Chunks.Code'
const CODE_LINE_NODE = 'ObojoboDraft.Chunks.Code.CodeLine'
const HEADING_NODE = 'ObojoboDraft.Chunks.Heading'
const TEXT_NODE = 'ObojoboDraft.Chunks.Text'
const TEXT_LINE_NODE = 'ObojoboDraft.Chunks.Text.TextLine'
const LIST_NODE = 'ObojoboDraft.Chunks.List'

describe('Text editor', () => {
	beforeEach(() => {
		jest.resetAllMocks()
		jest.restoreAllMocks()
	})

	test('slateToObo converts a Slate node to an OboNode with content', () => {
		const slateNode = {
			id: 'mockKey',
			type: 'mockType',
			content: {},
			children: [
				{
					text: 'mockText',
					content: {},
					children: [{ text: 'mockText', b: true }]
				}
			]
		}
		const oboNode = Converter.slateToObo(slateNode)

		expect(oboNode).toMatchSnapshot()
	})

	test('slateToObo converts a Slate node to an OboNode with triggers', () => {
		const slateNode = {
			id: 'mockKey',
			type: 'mockType',
			content: { triggers: 'mock-triggers' },
			children: [
				{
					text: 'mockText',
					content: {},
					children: [{text: 'mockText', b: true}]
				}
			]
		}
		const oboNode = Converter.slateToObo(slateNode)

		expect(oboNode).toMatchSnapshot()
	})

	test('oboToSlate converts an OboNode to a Slate node', () => {
		const oboNode = {
			id: 'mockKey',
			type: 'mockType',
			content: {
				triggers: 'mock-triggers',
				textGroup: [
					{
						data: { indent: 1 },
						text: { value: 'mockText' }
					},
					{
						text: { value: 'mockText2' }
					}
				]
			}
		}
		const slateNode = Converter.oboToSlate(oboNode)

		expect(slateNode).toMatchSnapshot()
	})

	test('switchType[HEADING_NODE] changes leaf blocks to heading nodes', () => {
		jest.spyOn(Transforms, 'setNodes').mockReturnValueOnce(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: TEXT_NODE,
					content: {},
					children: [
						{
							type: TEXT_NODE,
							subtype: TEXT_LINE_NODE,
							content: {},
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: { 
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [0, 0, 0], offset: 1 }
			},
			isVoid: () => false
		}

		Converter.switchType[HEADING_NODE](editor, [editor.children[0], [0]], { headingLevel: 1 })

		expect(Transforms.setNodes).toHaveBeenCalledWith(
			editor,
			{ type: HEADING_NODE, content: { headingLevel: 1 }, subtype: null },
			{ at: [0, 0] }
		)
	})

	test('switchType[CODE_NODE] changes leaf blocks to code nodes', () => {
		jest.spyOn(Transforms, 'setNodes').mockReturnValueOnce(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: TEXT_NODE,
					content: {},
					children: [
						{
							type: TEXT_NODE,
							subtype: TEXT_LINE_NODE,
							content: {},
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: { 
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [0, 0, 0], offset: 1 }
			},
			isVoid: () => false
		}

		Converter.switchType[CODE_NODE](editor, [editor.children[0], [0]])

		expect(Transforms.setNodes).toHaveBeenCalledWith(
			editor,
			{ type: CODE_NODE, subtype: CODE_LINE_NODE, content: {} },
			{ at: [0, 0] }
		)
	})

	test('switchType[LIST_NODE] changes leaf blocks to ordered list nodes', () => {
		jest.spyOn(Transforms, 'removeNodes').mockReturnValueOnce(true)
		jest.spyOn(Transforms, 'insertNodes').mockReturnValueOnce(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: TEXT_NODE,
					content: {},
					children: [
						{
							type: TEXT_NODE,
							subtype: TEXT_LINE_NODE,
							content: { indent: 0 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: { 
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [0, 0, 0], offset: 1 }
			},
			isVoid: () => false
		}

		Converter.switchType[LIST_NODE](editor, [editor.children[0], [0]], { type: 'unordered', bulletStyle: 'disc' })

		expect(Transforms.removeNodes).toHaveBeenCalled()
		expect(Transforms.insertNodes).toHaveBeenCalled()
	})

	test('switchType[LIST_NODE] changes leaf blocks to ordered list nodes with indent', () => {
		jest.spyOn(Transforms, 'removeNodes').mockReturnValue(true)
		jest.spyOn(Transforms, 'insertNodes').mockReturnValue(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: TEXT_NODE,
					content: {},
					children: [
						{
							type: TEXT_NODE,
							subtype: TEXT_LINE_NODE,
							content: { indent: 1 },
							children: [{ text: 'mockCode', b: true }]
						},
						{
							type: TEXT_NODE,
							subtype: TEXT_LINE_NODE,
							content: { indent: 2 },
							children: [{ text: 'mockCode', b: true }]
						},
						{
							type: TEXT_NODE,
							subtype: TEXT_LINE_NODE,
							content: { indent: 1 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: { 
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [0, 2, 0], offset: 1 }
			},
			isVoid: () => false
		}

		Converter.switchType[LIST_NODE](editor, [editor.children[0], [0]], { type: 'ordered', bulletStyle: 'alpha' })

		expect(Transforms.removeNodes).toHaveBeenCalled()
		expect(Transforms.insertNodes).toHaveBeenCalled()
	})
})
