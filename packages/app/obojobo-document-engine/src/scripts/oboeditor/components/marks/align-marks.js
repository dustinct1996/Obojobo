import { Editor, Element, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'

import LeftIcon from '../../assets/left-icon'
import RightIcon from '../../assets/right-icon'
import CenterIcon from '../../assets/center-icon'

const ALIGN_RIGHT = 'right'
const ALIGN_CENTER = 'center'
const ALIGN_LEFT = 'left'

const AlignMarks = {
	plugins: {
		onKeyDown(event, editor, next) {
			if (!(event.ctrlKey || event.metaKey)) return

			switch (event.key) {
				case 'l':
					event.preventDefault()
					return editor.setAlign(ALIGN_LEFT)
				case 'r':
					event.preventDefault()
					return editor.setAlign(ALIGN_RIGHT)
				case 'e':
					event.preventDefault()
					return editor.setAlign(ALIGN_CENTER)
			}
		},
		commands: {
			setAlign: (editor, align) => {
				const list = Array.from(Editor.nodes(editor, {
					mode: 'lowest',
					match: node => Element.isElement(node) && !editor.isInline(node)
				}))

				list.forEach(([child, path]) => Transforms.setNodes(
					editor, 
					{ content: {...child.content, align }}, 
					{ at: path }
				))

				ReactEditor.focus(editor)
			}
		}
	},
	marks: [
		{
			name: 'Left Align',
			type: ALIGN_LEFT,
			icon: LeftIcon,
			action: editor => editor.setAlign(ALIGN_LEFT)
		},
		{
			name: 'Center Align',
			type: ALIGN_CENTER,
			icon: CenterIcon,
			action: editor => editor.setAlign(ALIGN_CENTER)
		},
		{
			name: 'Right Align',
			type: ALIGN_RIGHT,
			icon: RightIcon,
			action: editor => editor.setAlign(ALIGN_RIGHT)
		}
	]
}

export default AlignMarks
