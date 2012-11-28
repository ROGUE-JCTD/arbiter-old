//depends on jquery

/*
 * @param params{
 * 		div_id The id of the div for the list
 * 		before_delete Function to be called before deleting the list item - expected to call the delete
 * 		background_color The background color of the list items
 * 		edit_button_id The id of the edit button
 * 		checkbox Include a checkbox?
 * 		checkbox_checked Checkbox checked callback 
 * 			- passed an object containing key:value pairs of the additional info stored in the list-item
 * 		checkbox_unchecked Checkbox unchecked callback 
 * 			- passed an object containing key:value pairs of the additional info stored in the list-item
 *  } 
 */
function ListWidget(params){
	var this_widget = this;
	/*///////////////////////////
	 * Initialize the List Widget
	 *///////////////////////////
	
	/*
	 * Function to be called after appending the list item
	 */
	this.afterAppending = null;
	
	/*
	 * Function to be called before deleting the list item
	 */
	this.beforeDeleting =  null;
	
	/*
	 * Function to be called after deleting the list item
	 */
	this.afterDeleting = null;
	
	/*
	 * 
	 */
	this.afterEditing = null;
	
	/*
	 * Boolean - Include a checkbox? 
	 */
	this.checkbox = null;
	
	/*
	 * Function to be called after checkbox was checked
	 */
	this.checkbox_checked = null;
	
	/*
	 * Function to be called after checkbox was unchecked
	 */
	this.checkbox_unchecked = null;
	
	/*
	 * String - the id of the div being used for the list
	 */
	this.div_id = null;
	
	/*
	 * String - the id of the edit button used for displaying the delete buttons
	 */
	this.edit_button_id = null;
	
	/*
	 * jQuery Obj - the list container
	 */
	this.listContainer = null;
	
	/*
	 * String - the background color of the list items
	 */
	this.background_color = null;
	
	/*
	 * jQuery Obj - the topmost list item
	 */
	this.topListItem = null;
	
	/*
	 * jQuery Obj - the bottommost list item
	 */
	this.bottomListItem = null;
	
	/*
	 * Integer - the next id to use for the list 
	 */
	this.nextId = 0;
	
	for(var key in params){
		this[key] = params[key];
	}
	
	if(this.div_id){
		this.listContainer = $('#' + this.div_id);
	}
	
	/*///////////////////////////////////
	 *	Append to the List
	 *///////////////////////////////////
	this.append = function(display_text, additionalAttributes){
		if(this_widget.bottomListItem){
			this_widget.bottomListItem.find('.bottom-left').removeClass('bottom-left');
			this_widget.bottomListItem.find('.bottom-right').removeClass('bottom-right');
		}
		
		//if are no existingServer-row elements yet, then this is the top
		var contentClass = 'contentColumn';
		var leftClass = 'leftColumn';
		
		var aClass = 'list-item-name';
		
		if(this_widget.listContainer.find('.list-item').length == 0){
			contentClass += ' top-right';
			leftClass += ' top-left';
			aClass += ' top-right';
		}
		
		contentClass += ' bottom-right';
		leftClass += ' bottom-left';
		aClass += ' bottom-right';
		
		var leftplaceholder = '<div class="left-placeholder list-item-delete ui-icon ui-icon-minus"></div>';
		
		if(this_widget.checkbox){
			leftplaceholder += '<input type="checkbox" class="left-placeholder list-item-checkbox" style="width:20px;height:20px;" />';
		}
		
		var aElement = '<a class="' + aClass + '"><span style="position:absolute;top:10px;left:10px;font-weight:bold;">' + display_text + '</span></a>';
		
		// Create string from additonalAttributes to be added to the list-item head
		var extraAttributes = '';
		for(var key in additionalAttributes){
			if(key != 'id' && key != 'class')
				extraAttributes += ' ' + key + '="' + additionalAttributes[key] + '"';
			else
				console.log("ListWidget: the " + key + " attribute is reserved for the widget");
		}
		
		var html = 	'<div class="list-item" id="' + this_widget.div_id + '-' + this_widget.nextId + '"' + extraAttributes + '>' +
						'<div class="contentWrapper">' +
							'<div class="' + contentClass + '">' +
								aElement +
							'</div>' +
						'</div>' +
						'<div class="' + leftClass + '">' +
							'<div class="checkbox-container" style="' +/*left:8px;top:8px;*/'">' +
								leftplaceholder +
							'</div>' +
						'</div>' +
					'</div>';
		
		this_widget.bottomListItem = $(html).appendTo(this_widget.listContainer);
		
		if(!this_widget.topListItem || !this_widget.topListItem.length)
			this_widget.topListItem = this_widget.bottomListItem;
		
		this_widget.nextId++;
		
		if(this_widget.afterAppending)
			this_widget.afterAppending();
	};
	
	/*//////////////////////////////////////////////////////
	 * 	Make the top and bottom corners of the list rounded
	 *//////////////////////////////////////////////////////
	this.setRoundedCorners = function(){
		var rows = this_widget.listContainer.find('.list-item');
		
		//if the top doesn't exist and the list isn't empty
		if(!this_widget.listContainer.find('.top-left').length && rows.length){
			var firstChild = $(rows[0]);
			if(firstChild.length){
				firstChild.find('.contentColumn').addClass('top-right');
				firstChild.find('.leftColumn').addClass('top-left');
				firstChild.find('.list-item-name').addClass('top-right');
			}
		}
		
		//if the bottom doesn't exist and the list isn't empty
		if(!this_widget.listContainer.find('.bottom-left').length && rows.length){
			var lastChild = $(rows[rows.length - 1]);
			if(lastChild.length){
				lastChild.find('.contentColumn').addClass('bottom-right');
				lastChild.find('.leftColumn').addClass('bottom-left');
				lastChild.find('.list-item-name').addClass('bottom-right');
			}	  
		}
	};
	
	/*///////////////////////////////////
	 * 	Delete list item
	 *///////////////////////////////////
	$('#' + this.div_id + ' .ui-icon-minus').live('mouseup', function(){
		var listItem = this;

		var deleteRow = function(){
			var row = $(listItem).parent().parent().parent();
			var rowId = row.attr('id');
			
			if(rowId == this_widget.topListItem.attr('id'))
				this_widget.topListItem = row.next();
			
			if(rowId == this_widget.bottomListItem.attr('id'))
				this_widget.bottomListItem = row.prev();
			
			row.remove();
			
			//if the top or bottom doesn't exist, set them
			this_widget.setRoundedCorners();
			
			if(this_widget.afterDeleting)
				this_widget.afterDeleting();
		};
		
		if(this_widget.before_delete){
			var itemInfo = this_widget.getListItemParams(listItem);
			this_widget.before_delete(itemInfo, deleteRow);
		}else
			deleteRow();
	});
	
	/*/////////////////////////////////////////////////////
	 * 	Get the extra attributes related to the list item
	 */////////////////////////////////////////////////////
	this.getListItemParams = function(element){
		var listItem;
		
		if($(element).hasClass('list-item'))
			listItem = $(element);
		else	//The checkbox, delete button, and <a> element are all 3 levels down from the head of the list item
			listItem = $(element).parent().parent().parent();
		
		var attributes = {};
		
		console.log("listItem: ", listItem);
		
		for (var attr, i=0, attrs=listItem[0].attributes, l=attrs.length; i<l; i++){
			attr = attrs.item(i);
		    
		    if(attr.nodeName != 'id' && attr.nodeName != 'class')
		    	attributes[attr.nodeName] = attr.nodeValue;
		}
		
		return attributes;
	};
	
	/*/////////////////////////////////////////
	 * 	Checkbox checked or unchecked callback
	 */////////////////////////////////////////
	$('#' + this.div_id + ' .list-item-checkbox').live('mouseup', function(){
		//Get the extra params related to the list-item
		var attributes = this_widget.getListItemParams(this);
		
		if($(this).is(':checked')){
			if(this_widget.checkbox_checked){
				this_widget.checkbox_checked(attributes);
			}
		}else{
			if(this_widget.checkbox_unchecked){
				this_widget.checkbox_unchecked(attributes);
			}
		}
	});
	
	/*//////////////////////////////////////
	 * 	Toggle the delete button and call
	 *//////////////////////////////////////
	if(this.edit_button_id){
		$('#' + this.edit_button_id).live('mouseup', function(){
			if(this_widget.checkbox)
				$('.list-item-checkbox').toggle();
			$('.list-item-delete').toggle();
			
			if(!$('.list-item-delete').is(':visible')){
				if(this_widget.afterEditing)
					this_widget.afterEditing();
			}
		});
	}
	
	/*///////////////////////////////////////
	 * 	Clear the list
	 *///////////////////////////////////////
	this.clearList = function(){
		this_widget.listContainer.html('');
		this_widget.bottomListItem = null;
		this_widget.topListItem = null;
		this_widget.nextId = 0;
	};
};