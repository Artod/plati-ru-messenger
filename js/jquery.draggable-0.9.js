/*
* jquery.draggable 0.9
* (c) 2012 Artod, http://plati.ru
*/
;(function($, document) {
	'use strict';

    var Draggable = function($els, options) {
		this.opts = $.extend({
			onMouseMove: function() { },
			axisX: true,
			axisY: true
        }, options);

		this.current = {
			el: null,
			$el: null,
			x: 0,
			y: 0
		};

		this.offset = {
			x: 0,
			y: 0
		};
		
		this.limit = {
			x0: 0,
			y0: 0,
			x1: 0,
			y1: 0
		};
		
		var self = this;
		$els.bind('mousedown.draggable', function(e) {
			self.onMouseDown(e);
				
			if (e.preventDefault) {
				e.preventDefault(); 
			} else {
				e.returnValue = false;
			}
		});
	};

	Draggable.prototype = {
		onMouseDown: function(event) {

			this.current = {
				el: event.target,
				$el: $(event.target),				
				x: 0,
				y: 0
			};	

			var offsetParent = this.current.$el.offsetParent();

			this.offset = {
				x: offsetParent.offset().left + event.pageX - this.current.$el.offset().left,
				y: offsetParent.offset().top + event.pageY - this.current.$el.offset().top
			};
			
			this.limit = {
                x0: 0,
                y0: 0,
                x1: offsetParent.innerWidth() - this.current.$el.outerWidth(),
                y1: offsetParent.innerHeight() - this.current.$el.outerHeight()
            };
			
			var self = this;
            $(document)
				.unbind('.draggable')
                .bind('mousemove.draggable', function(event) { self.onMouseMove(event); })
                .bind('mouseup.draggable', function(event) { self.onMouseUp(event); })
                .bind('dragstart.draggable', function() { return false; })
                .bind('selectstart.draggable', function() { return false; });

            return false;
        },
		onMouseMove: function(event) {
			if (this.opts.axisY) {
				this.current.y = event.pageY - this.offset.y;
				if ( !(this.current.y < this.limit.y0 || this.limit.y1 < this.current.y) ) {
					this.current.el.style.top = this.current.y + 'px';
					this.opts.onMouseMove();
				}
			}

			if (this.opts.axisX) {
				this.current.x = event.pageX - this.offset.x;

				if ( !(this.current.x < this.limit.x0 || this.limit.x1 < this.current.x) ) {
					this.current.el.style.left = this.current.x + 'px';
					this.opts.onMouseMove();			
				}
			}
		},
		onMouseUp: function(event) {
			$(document).unbind('.draggable');
		}
	};

    $.fn.draggable = function(options) {		
		var draggable = new Draggable($(this), options);
		
		return this;
    };

})(jQuery, document);