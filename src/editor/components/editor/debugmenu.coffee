React = require 'react'
DOMSelection = require '../../../dom/domselection'

DebugMenu = React.createClass
	getInitialState: ->
		target: null
		selection: null
		history: null
		listeningForKeyboard: false

	componentWillReceiveProps: (nextProps) ->
		@setState {
			selection:nextProps.selection
			history: nextProps.history
		}

	show: (target) ->
		@setState { target:target }

	hide: (event) ->
		if event.target is document.getElementById('debug-text')
			@setState { target:null }

	componentDidMount: ->
		document.addEventListener 'keydown', ((event) ->
			if @state.target?
				console.log event.keyCode

			if event.keyCode is 192 and not @state.listeningForKeyboard
				event.preventDefault()
				@setState { listeningForKeyboard: true }
			else if @state.listeningForKeyboard
				event.preventDefault()
				@state.listeningForKeyboard = false
				console.clear()

				switch event.keyCode
					when 67 #c
						if @state.target is 'chunk'
							@setState { target:null }
						else
							@setState { target:'chunk' }
					when 83 #s
						if @state.target is 'selection'
							@setState { target:null }
						else
							@setState { target:'selection' }
					when 84 #t
						if @state.target is 'text selection'
							@setState { target:null }
						else
							@setState { target:'text selection'}
					when 72 #h
						if @state.target is 'history'
							@setState { target:null }
						else
							@setState { target:'history' }
					when 77 #m
						if @state.target is 'module'
							@setState { target:null }
						else
							@setState { target:'module' }
					when 68 #d
						sel = new DOMSelection()

						console.log 'window.start =', sel.startContainer
						console.log sel.startOffset
						console.log 'window.end =  ', sel.endContainer
						console.log sel.endOffset

						window.start = sel.startContainer
						window.end = sel.endContainer
		).bind(@)

	render: ->
		text = switch @state.target
			when 'selection'
				selection = @state.selection
				o =
					commands: selection.commands
					textCommands: selection.textCommands
					styles: selection.styles
					futureStart: selection.futureStart
					futureEnd: selection.futureEnd
					selStart: selection.text.start
					selEnd: selection.text.end
				JSON.stringify(o, null, 2)
			when 'text selection'
				JSON.stringify(@state.selection.getSelectionDescriptor(), null, 2)
			when 'chunk'
				t = ''
				for chunk in @state.selection.text.all
					t += JSON.stringify(chunk.toJSON(), null, 2) + "\n"
					# t += JSON.stringify(chunk.callComponentFn('getDataDescriptor'), null, 2) + "\n"
				t
			when 'history'
				h = []
				for o in @state.history.stack
					h.unshift o
					h.unshift '--------------------'
				JSON.stringify(h, null, 2)
			when 'module'
				JSON.stringify @state.selection.text.module.toJSON(), null, 2
			else
				''

		color = if @state.listeningForKeyboard then 'red' else 'black'

		React.createElement 'div', { onMouseOut:@hide, style:{
			position:'fixed'
			zIndex: 99999
			right: 0
			top: 0 }},
			React.createElement('div', { style:{textAlign:'right'}},
				React.createElement('button', { style:{fontWeight:'bold', fontSize:'16pt', color:(if @state.target is 'module' then 'green' else color)}, onMouseOver:@show.bind(@, 'module') }, 'M'),
				React.createElement('button', { style:{fontWeight:'bold', fontSize:'16pt', color:(if @state.target is 'selection' then 'green' else color)}, onMouseOver:@show.bind(@, 'selection') }, 'S'),
				React.createElement('button', { style:{fontWeight:'bold', fontSize:'16pt', color:(if @state.target is 'text selection' then 'green' else color)}, onMouseOver:@show.bind(@, 'text selection') }, 'T'),
				React.createElement('button', { style:{fontWeight:'bold', fontSize:'16pt', color:(if @state.target is 'chunk' then 'green' else color)}, onMouseOver:@show.bind(@, 'chunk') }, 'C'),
				React.createElement('button', { style:{fontWeight:'bold', fontSize:'16pt', color:(if @state.target is 'history' then 'green' else color)}, onMouseOver:@show.bind(@, 'history') }, 'H'),
			),
			React.createElement('pre', { id:'debug-text', style:{
				display: if(text.length > 0) then 'block' else 'none',
				fontSize:'8pt',
				margin:0,
				width:400,
				height: 700,
				overflow:'scroll',
				border:'1px solid black',
				background:'#fffdec'
				}}, @state.target?.toUpperCase() + ":\n" + text.replace(/^\s*[{}]+\s*$/gm, '').replace(/\n\n+/gm, "\n").replace(/}\,/g, ''))


module.exports = DebugMenu