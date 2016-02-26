React = require 'react'


Text = require '../../components/text'
TextGroup = require '../../text/textgroup'
TextMethods = require '../../text/textmethods'


SingleText = React.createClass
	statics:
		createNodeDataFromDescriptor: (descriptor) ->
			# console.log 'ST.createNodeDataFromDescriptor', descriptor
			textGroup: TextGroup.fromDescriptor descriptor.content.textGroup, 1
			indent: descriptor.content.indent
			type: descriptor.content.type

		saveSelection: TextMethods.saveSelection
		restoreSelection: TextMethods.restoreSelection
		styleSelection:   TextMethods.styleSelection
		unstyleSelection: TextMethods.unstyleSelection

	render: ->
		data = @props.chunk.componentContent

		React.createElement('p', { style: { marginLeft: (data.indent * 20) + 'px' } },
			Text.createElement data.textGroup.get(0).text, @props.chunk, 0
		)


module.exports = SingleText