/*\
title: $:/widgets/OokTech/WordCount/word-count.js
type: application/javascript
module-type: widget

A widget to count the number of words or characters in a tiddlr/field/input string

With thanks to Skeeve for the original macro version this is based on

Demo site:

http://ooktech.com/jed/ExampleWikis/WordCount/

Usage:

<$word-count tiddler=SomeTiddler field=some_field mode=word/>
<$word-count text="some text string" mode=character/>
<$word-count tiddler=SomeTiddler mode=character colors="blue:10,green:50,red:100"/>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var WordCount = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
WordCount.prototype = new Widget();

/*
Render this widget into the DOM
*/
WordCount.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var textNode = this.document.createTextNode(this.currentCount);
	var domNode = this.document.createElement("span");
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
WordCount.prototype.execute = function() {
	var color_array = [];
	var count_array = [];
	var i;

	// Get parameters from our attributes
	this.mode = this.getAttribute("mode", "word");
	this.tiddler = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.field = this.getAttribute("field","text");
	this.countText = this.getAttribute("text");
	this.colors = this.getAttribute("colors");
	this.stateTiddler = this.getAttribute("colorState");

	//Find the color cut-offs, if any.
	if(this.colors) {
		var color_array1 = this.colors.split(',');
		color_array1.sort(function sortfunction(a, b){
			return a.split(':')[1] - b.split(':')[1];
		});
		for(i = 0; i < color_array1.length; i++) {
			color_array[i] = color_array1[i].split(':')[0];
			count_array[i] = color_array1[i].split(':')[1];
		}
	}

	// Count letters or words as appropriate.
	if(this.countText) {
		if(this.mode === "character") {
			this.currentCount = this.countText.length.toString();
		} else {
			if (this.countText.match(/\w+/g)) {
				this.currentCount = this.countText.match(/\w+/g).length.toString();
			}
		}
	} else {
		var tiddler = this.wiki.getTiddler(this.tiddler);
		if(tiddler) {
			var text = tiddler.getFieldString(this.field);
			if (text) {
				if(this.mode === "word") {
					if (text.match(/\w+/g)) {
						this.currentCount = text.match(/\w+/g).length.toString();
					}
				} else if(this.mode === "character") {
					this.currentCount = text.length.toString();
				} else {
					this.currentCount = undefined;
				}
			} else {
				this.currentCount = undefined;
			}
		} else {
			this.currentCount = undefined;
		}
	}

	//If this.currentCount is long enough set the color. It is the color with the largest value that is less than this.currentCount.
	//If no color has a large enough value do nothing.
	if(this.currentCount) {
		if(color_array) {
			for(i = 0; i < color_array.length; i++) {
				if(Number(this.currentCount) > Number(count_array[color_array.length - 1 - i])) {
					if(this.stateTiddler) {
						this.wiki.setText(this.stateTiddler,"text",undefined,color_array[color_array.length -1 - i]);
					}
					this.currentCount = '@@color:' + color_array[color_array.length -1 - i] + ';' + this.currentCount + '@@';
					break;
				}
				if(i === color_array.length-1) {
					this.wiki.setText(this.stateTiddler,"text",undefined,'');
				}
			}
		}
	}

	var parser = this.wiki.parseText("text/vnd.tiddlywiki",this.currentCount,{parseAsInline: true});
    var parseTreeNodes = parser ? parser.tree : [];
	this.makeChildWidgets(parseTreeNodes);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
WordCount.prototype.refresh = function(changedTiddlers) {
	// Re-execute the filter to get the count
	this.computeAttributes();
	var oldCount = this.currentCount;
	this.execute();
	if(this.currentCount !== oldCount) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.refreshSelf();
		return true;
	} else {
		return false;
	}

};

exports["word-count"] = WordCount;

})();
