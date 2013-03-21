/*
* jquery.scroll 1.0
* (c) 2012 Artod, http://plati.ru
*/

;(function($) {
	'use strict';

    var Scroll = function(options) {
		this.opts = $.extend({
			$wrap: null,
			$viewport: null,
			$walker: null,
			$scrollbar: null,
			scrollbarStyle: {},
			duration: 10
        }, options);

		if (!this.opts.$wrap) {
			this.opts.$viewport.wrap($('<div></div>', { 'class': 'js-sroll-wrap' }).css({
				padding: 0,
				margin: 0,
				position: 'relative',
				'z-index': 1	
			}));

			this.opts.$wrap = this.opts.$viewport.parent().first();
		}

		if (!this.opts.$scrollbar) {
			this.opts.$scrollbar = $('<div></div>').css($.extend({
					right: '2px',
					opacity: 0.2,
					width: '7px',
					padding: 0,
					margin: 0,
					'background-color': '#000',
					'z-index': 1,
					'border-radius': '7px'
				},
				this.opts.scrollbarStyle
			));

			this.opts.$viewport.after(this.opts.$scrollbar);
		}

		this.opts.$scrollbar.css({
			position: 'absolute',
			cursor: 'pointer'
		}).mouseover(function() {
			$(this).css('opacity', 0.5);
		}).mouseout(function() {
			$(this).css('opacity', 0.3);
		});

		this.opts.$viewport.css({
			'overflow-y': 'hidden'
		});

		/*this.opts.$walker.css({
			'overflow': 'hidden'
		});*/

		var self = this;
		var onScroll = function(event) {
			self.onScroll(event);
		};

		this.opts.$viewport.bind('DOMMouseScroll', onScroll).bind('mousewheel', onScroll).scroll(function() {
			self.updateScrollbar();
		});

		if ($.fn.draggable) {
			this.opts.$scrollbar.draggable({
				axisX: false,
				onMouseMove: function() {
					self.updateScroll();
				}
			});
		}

		this.opts.$viewport.scroll(); // init
	};

	Scroll.prototype = {
		getDelta: function(e) {
			var delta; // -1 - скролл вниз; 1 - скролл вверх;

			e = e.originalEvent;
			
			if (e.wheelDelta) { // Opera и IE работают со свойством wheelDelta
				delta = e.wheelDelta / 120;
				/*if ($.browser.opera) { // В Опере значение wheelDelta такое же, но с противоположным знаком
					delta = delta;
				}*/		
			} else if (e.detail) { // В реализации Gecko получим свойство detail
				delta = - e.detail / 2;
			}

			if (e.preventDefault) {
				e.preventDefault(); 
			} else {
				e.returnValue = false;
			}

			return delta;
		},
		updateScrollbar: function() {
			var hVP = this.opts.$viewport.innerHeight(),
				hW = this.opts.$walker.outerHeight(),
				scrollTop = this.opts.$viewport.scrollTop(),
				height = Math.round(hVP * hVP / hW);

			if (height >= hVP) {
				this.opts.$scrollbar.hide();
				return false;
			}

			this.opts.$scrollbar.css({
				height: height + 'px',
				top: Math.round(scrollTop * hVP / hW /* + scrollTop */) + 'px'
			}).show();
		},
		updateScroll: function() {
			var hVP = this.opts.$viewport.innerHeight(),
				hW = this.opts.$walker.outerHeight(),
				positionTop = this.opts.$scrollbar.position().top;

			this.opts.$viewport.scrollTop(positionTop * hW / hVP);
		},
		onScroll: function(event) {
			this.opts.$viewport.scrollTop(this.opts.$viewport.scrollTop() - this.getDelta(event) * this.opts.duration);
		}
	};

    $.scroll = function(options) {		
		return new Scroll(options);
    };
})(jQuery);