/*
* messenger 1.0
* (c) 2012 Artod, http://plati.ru
*/
;(function(window, $) {
	'use strict';

	var debug = 0;
	function log(name, text, type) {
		if (!debug || !console || !console.log) {
			return false;
		}

		switch(type) {
			case 'error':
				if (typeof text == 'string') {
					console.error(name + ': ' + text);
				} else {
					console.error(name + ': ');
					console.dir(text);
				}
				break;
			case 'log':
			default:
				if (typeof text == 'string') {
					console.log(name + ': ' + text);
				} else {
					console.log(name + ': ');
					console.dir(text);
				}

				break;
		}
	}

	$(function() {
		log('window.messenger', window.messenger);
		log('cookies', document.cookie);

		var Contact = Backbone.Model.extend({
			defaults: function() {
				return {
					ip: ''
				};
			}
		});

		var ContactList = Backbone.Collection.extend({
			model: Contact,
			intervalID: null,
			url: '/asp/xml_guests.aspx',
			prefix: 's'
		});

		var ContactView = Backbone.View.extend({
			tagName: 'li',
			template: _.template( $('#template-contacts').html() ),
			events: {
				'click .contacts-goods': 'showGoods',
				'click .contacts-to-archive': 'toArchive',
				'click .contacts-from-archive': 'fromArchive',
				'click .contacts-remove': 'kill',
				'click': 'activate'
			},
			initialize: function() {
				this.model.on('change', this.render, this);
				this.model.on('remove', this.remove, this);
			},
			render: function() {
				this.$el.html(this.template(_.extend(this.model.toJSON(), {
					isArchive: Messenger && Messenger.state.archive == 1 ? true : false
				})));

				this.$el.attr('id', this.model.id);
				
				if ( this.model.get('isOnline') ) {
					this.$el.addClass('contacts-online');
				} else {
					this.$el.removeClass('contacts-online');
				}

				if ( this.model.get('isActive') ) {
					this.$el.addClass('contacts-active');
				} else {
					this.$el.removeClass('contacts-active');
				}
				
				if ( this.model.get('isNewMessage') ) {
					this.$el.addClass('contacts-alert');
				} else {
					this.$el.removeClass('contacts-alert');
				}

				return this;
			},
			showGoods: function(e) {
				e.stopPropagation();
			},
			toArchive: function(e) {
				if ( confirm('Вы хотите перенести "' + this.model.get('name') + '" в архив?') ) {
					var self = this;
					$.get('/asp/' + Contacts.prefix + '_fr_left.asp?' + this.model.get('type') + '=' + this.model.id, {
						archiv: 1
					}, function() {
						Contacts.remove(self.model);
					});
				}

				e.stopPropagation();

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			},
			fromArchive: function(e) {
				if ( confirm('Вы хотите перенести "' + this.model.get('name') + '" в общий список?') ) {
					var self = this;
					$.get('/asp/' + Contacts.prefix + '_fr_left.asp?' + this.model.get('type') + '=' + this.model.id, {
						archiv: 0						
					}, function() {
						Contacts.remove(self.model);
					});
				}

				e.stopPropagation();

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			},
			kill: function() {
				if ( confirm('Вы действительно хотите УДАЛИТЬ переписку с "' + this.model.get('name') + '"?') ) {
					var self = this;
					$.get('/asp/' + Contacts.prefix + '_fr_left.asp?' + this.model.get('type') + '=' + this.model.id, {
						kill: 1
					}, function() {
						Contacts.remove(self.model);
					});
				}

				e.stopPropagation();

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			},
			remove: function() {
				this.$el.remove();
			},
			activate: function(e) {
				this.model.trigger('activate', this.model);
				Messenger.jq.state.empty();

				e.stopPropagation();
			}
		});

		var Message = Backbone.Model.extend({});

		var MessageList = Backbone.Collection.extend({
			model: Message,
			url: '/asp/xml_messages.asp',
			intervalID: null
		});

		var MessageView = Backbone.View.extend({
			tagName: 'li',
			template: _.template( $('#template-messages').html() ),
			initialize: function() {
				this.model.on('change', this.render, this);
			},
			render: function() {
				this.$el.html( this.template( this.model.toJSON() ) );
				return this;
			}
		});

		var MessageFormView = Backbone.View.extend({
			el: $('#message'),
			events: {
				'keyup textarea': 'keyup',
				'keydown textarea': 'keydown'
			},
			initialize: function() {
				this.jq = {
					wrap: this.$('.message-wrap'),
					form: this.$('form'),
					textarea: this.$('.message-textarea'),
					send: this.$('.message-send')
				};
			},
			keydown: function(e) {
				var code = e.keyCode ? e.keyCode : e.which;

				if (code === 10 || code == 13 && e.ctrlKey) {
					this.jq.form.submit();
				}
			},
			keyup: function(e) {
				log('MessageFormView', 'keyup');
				if (this.jq.textarea.val().length) {
					this.jq.send.removeAttr('disabled');
				} else {
					this.jq.send.attr('disabled', 'disabled');
				}
			}
		});

		var MessengerView = Backbone.View.extend({
			el: $('body'),
			cl: {
				tabsSelected: 'tabs-selected'
			},
			events: {
				'submit #message form': 'messageFormSubmit',
				'keyup #message textarea': 'messageFormKeyup',
				'click .more-refresh': 'refreshWindow',
				'click .more-close': 'closeWindow',
				'click .sendOffLine-ok': 'toRegistration',
				'click .sendOffLine-cancel': 'sendOffLineCancel'
			},
			initialize: function() {
				var self = this;

				this.state = window.messenger;

				this.jq = {
					window: $(window),
					top: this.$('#top'),
					main: this.$('#main'),
					left: this.$('#left'),
					contactsLoader: this.$('#loader'),
					contactsNotify: this.$('#contacts-notify'),
					tabs: this.$('#tabs > li'),
					contacts: this.$('#contacts'),
					messagesWrap: this.$('.messages-wrap'),
					messages: this.$('#messages'),
					contactsScrollViewport: this.$('.contacts-scroll-viewport'),
					bottom: this.$('#bottom'),
					sendOffLine: this.$('#sendOffLine'),
					state: this.$('#message-state')
				};

				this.soundManager = window.soundManager;
				this.soundManager.url = '/js/soundmanager2.swf';
				this.soundManager.debugMode = false;
				this.soundManager.consoleOnly = false;
				this.soundManager.onload = function() {
					self.soundManager.createSound({
						id: 'newMessage',
						url: '/mp3/beep.mp3',
						autoLoad: true
					});
				};

				Contacts.url = '/asp/xml_' + (this.state.who == 'g' ? 'supports' : 'guests') + '.asp';
				Contacts.prefix = this.state.who;

				Contacts.on('add', this.contactsAddOne, this);
				Contacts.on('activate', this.contactsActivate, this);
				Contacts.on('reset', this.contactsAddAll, this);
				Contacts.on('remove', this.contactsRemove, this);
				
				Contacts.on('change:isNewMessage', function(model) {
					self.contactsSort(model);
					self.contactsCheckNewMessage(model);					
				}, this);
				Contacts.on('change:isOnline', this.contactsSort, this);				
				
				Contacts.on('change:isTyping', this.viewState, this);
				//Contacts.on('change:prevId', this.contactsChangeSort, this);
				//Contacts.on('change:isActive', this.checkActiveContact, this);
				/*Contacts.on('all', function(eventType) {
					log('ContactsFireEvent', eventType);
				}, this);*/

				Messages.on('add', this.messagesAddOne, this);
				Messages.on('reset', this.messagesAddAll, this);
				Messages.on('all', function(eventType) {
					log('MessagesFireEvent', eventType);
				}, this);

				this.messagesFetch();
				this.contactsStartRefresh();
				this.messagesStartRefresh();

				this.jq.window.resize(function() {
					var wh = self.jq.window.height(),
						th = self.jq.top.height(),
						mh = wh - th - 10;

					self.jq.contactsScrollViewport.height(wh - th + 'px');
					self.jq.main.height(mh + 'px');
					self.jq.messagesWrap.height(mh - 2 - ( self.jq.bottom.is(':visible') ? self.jq.bottom.height() : 0 ) + 'px');

					self.scrollContacts.updateScrollbar();
					self.scrollMessages.updateScrollbar();
				});

				this.scrollContacts = $.scroll({
					$wrap: this.jq.left,
					$viewport: this.jq.contactsScrollViewport,
					$walker: this.$('.contacts-scroll-walker'),
					scrollbarStyle: {
						right: '',
						left: '1px',
						width: '5px'
					},
					duration: 46
				});

				this.scrollMessages = $.scroll({
					$wrap: this.$('#history'),
					$viewport: this.jq.messagesWrap,
					$walker: this.jq.messages,
					scrollbarStyle: {
						right: '4px',
						width: '5px'
					},
					duration: 20
				});

				this.jq.window.resize();
			},
			getUID: (function() {
				var id = 0;
				return function() {
					return id++;
				};
			})(),
			viewState: function(model) {
				if (model.get('isActive') && this.state.archive != 1) {
					if (model.get('isTyping')) {
						this.jq.state.html('<strong>' + model.get('name') + '</strong> печатает...').show();
					} else {
						this.jq.state.empty();
					}
				}
			},
/** messages */
			messagesStartRefresh: function() {
				var self = this;
				Messages.intervalID = setInterval(function() {
					self.messagesFetch();
				}, 3000);
			},
			messagesFetch: function(reset) {
				var jqUID = this.getUID();
				this.jq.messages.data('jqUID', jqUID);
				
				//var sign = Contacts.where({isActive: 1});
				if (!this.state.sign) {
					return false;
				}

				var self = this;
				Messages.fetch({
					add: (reset ? false : true),
					data: {
						id_s: this.state.id_s,
						id_g: this.state.id_g,
						id_ga: this.state.id_ga,
						sign: this.state.sign,
						who: this.state.who
					},
					dataFilter: function(data, type) {
						if ( jqUID != self.jq.messages.data('jqUID') ) {
							log('Messages dataFilter', jqUID);
							return '[]';
						}

						return data;
					},
					success: function(collection, resp) {
						if ( jqUID != self.jq.messages.data('jqUID') ) {
							return false;
						}
						_.each(resp, function(modelServer) {
							collection.get(modelServer.id).set(modelServer); // if set is success then fire event change
						});
					},
					error: function(model, resp) {
						log('Ошибка (messages)', resp);
					}
				});
			},
			messagesViewReset: function() {
				log('messagesViewReset', '!');
				this.jq.messages.empty();
				this.scrollMessages.updateScrollbar();
			},
			messagesAddOne: function(model) {
				this.jq.messages.append(( new MessageView({model: model}) ).render().el);

				this.jq.messagesWrap.scrollTop(this.jq.messages.height());
				this.scrollMessages.updateScrollbar();
			},
			messagesAddAll: function() {
				log('messagesAddAll', '!');
				var container = $('<div />'); //document.createDocumentFragment()
				Messages.each(function(model) {
					container.append(( new MessageView({model: model}) ).render().el);
				});

				this.jq.messages.append(container.children());

				this.jq.messagesWrap.scrollTop(this.jq.messages.height());
				this.scrollMessages.updateScrollbar();
			},
/* messages **/
/** contacts */
			contactsStartRefresh: function() {
				var self = this;
				Contacts.intervalID = setInterval(function() {
					self.contactsFetch();
				}, 3000);
			},
			contactsFetch: function(reset) {
				var jqUID = this.getUID();
				this.jq.contacts.data('jqUID', jqUID);

				var self = this;
				var ajax = Contacts.fetch({
					add: (reset ? false : true),
					data: {
						archiv: this.state.archive,
						id_g: this.state.id_g,
						id_ga: this.state.id_ga,
						id_s: this.state.id_s
					},
					dataFilter: function(data, type, q) {
						if ( jqUID != self.jq.contacts.data('jqUID') ) {
							log('Contacts dataFilter', jqUID);
							this.abort(); // todo: вызывает error надо что-то придумать
						}

						return data;
					},
					success: function(collection, resp) {
						var presentModelIds = [];
						_.each(resp, function(modelServer) {
							collection.get(modelServer.id).set(modelServer); // if set is success then fire event change
							presentModelIds.push(modelServer.id);
						});

						collection.each(function(model) { // remove contacts that don't present in response
							if ( _.indexOf(presentModelIds, model.id) == -1 ) {
								collection.remove(model);
							}
						});

						self.jq.contactsLoader.hide();

						if (collection.length) {
							self.jq.contactsNotify.hide();
						} else {
							self.jq.contactsNotify.show();
						}
					},
					error: function(model, resp, settings) {
						log('Ошибка (contacts)', resp);
					}
				});
			},
			contactsViewReset: function() {
				this.jq.contacts.empty();
				this.jq.contactsNotify.hide();
				this.jq.contactsLoader.show();
				this.scrollContacts.updateScrollbar();
			},
			contactsCheckNewMessage: function(model) {
				if ( model.get('isNewMessage') ) {
					this.soundManager.play('newMessage');
				}
			},
			contactsSort: function(model, attrOrOptions, options, $element) {
				log('contactsSort', 'fire');
				var isNew = model.get('isNewMessage'),
					isOnline = model.get('isOnline'),
					$el = $element || $('#' + model.id).detach(),
					$mark;
				
				/*
				var $li = this.jq.contacts.find(' > li');
				if (isOnline) {
					if (!isNew) {						
						$mark = $li.filter('.contacts-alert').filter('.contacts-online').last();
					}
				} else {
					if (isNew) {
						$mark = $li.filter('.contacts-online').last();
					} else {
						$mark = $li.filter('.contacts-alert').not('.contacts-online').last();

						if (!$mark.length) {
							$mark = $li.filter('.contacts-online').last();
						}
					}
				}*/				
				
				if (!isNew) {
					if (!isOnline) {
						$mark = this.jq.contacts.find('li.contacts-online').last();
					} 
					
					if (isOnline || (!isOnline && !$mark.length) ) {
						$mark = this.jq.contacts.find('li.contacts-alert').last();
					}
				}

				if ($mark && $mark.length) {
					$mark.after($el);
				} else {
					this.jq.contacts.prepend($el);
				}
			},
			contactsCheckActive: function(model) { // for init this.state.sign
				if (model.get('isActive')) {
					this.state.sign = model.get('sign');
					this.messagesFetch();
				}
			},
			contactsAddOne: function(model) {
				this.contactsSort(model, null, null, ( new ContactView({model: model}) ).render().$el);				
				this.scrollContacts.updateScrollbar();
				this.contactsCheckNewMessage(model);
			},
			contactsAddAll: function() {
				log('contactsAddAll', '\/');

				var self = this;
				var container = $('<div />'); //document.createDocumentFragment()
				Contacts.each(function(model) {
					container.append(( new ContactView({model: model}) ).render().el);
					self.contactsCheckNewMessage(model);
					self.contactsCheckActive(model);					
				});

				this.jq.contacts.append(container.children());

				this.scrollContacts.updateScrollbar();
			},
			contactsRemove: function(model) {
				log('contactsRemove', 'start');
				var type = model.get('type');
				if (this.state[type] == model.id) { // проверяем активен ли контакт, чтобы очистить окно с соообщениями
					if (this.state.who == 's') {
						this.state.id_g = 0;
						this.state.id_ga = 0;
					}
					this.state[type] = 0;
					this.state.sign = '';

					log('contactsRemove change this.state', this.state);

					this.messagesViewReset();
					this.messagesFetch(true);
				}

				this.contactsFetch();
			},
			contactsActivate: function(model) {
				if (this.state.who == 's') {
					this.state.id_g = 0;
					this.state.id_ga = 0;
				}
				this.state[model.get('type')] = model.id;
				this.state.sign = model.get('sign');

				log('this.state', this.state);

				this.messagesViewReset();
				this.messagesFetch(true);
				this.contactsFetch();
			},
/* contacts **/
/** messageForm */
			messageFormKeyup: function(e) {
				log('Messenger messageForm', 'keyup');
				$.get('/asp/typing.asp', {
					who: this.state.who
				});
			},
			messageFormSubmit: function(e) {
				if (this.state.who == 's' && !this.state.id_g && !this.state.id_ga) {
					alert('Необходимо выбрать посетителя,\nкоторому вы хотите отправить сообщение.');
					return false;
				}

				if (this.state.who == 'g' && !this.state.id_s) {
					alert('Необходимо выбрать продавца,\nкоторому вы хотите отправить сообщение.');
					return false;
				}

				var self = this;
				
				$.post('/asp/' + this.state.who + '_fr_right_down.asp', {
					message: MessageForm.jq.textarea.val(),
					sign: this.state.sign
				}, function(data) {
					if (data.error) {
						alert(data.error);
					} else {
						MessageForm.jq.textarea.val('').keyup();
						self.messagesFetch();

						if (data.sendOffLine) {
							MessageForm.$el.hide();
							self.jq.sendOffLine.show();
						}
					}
				});

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			},
/* messageForm **/
			switchTab: function(tab) {
				this.contactsViewReset();
				this.contactsFetch(true);
				this.jq.state.empty();
				this.jq.tabs.removeClass(this.cl.tabsSelected);
				this.$('#tab-' + tab).addClass(this.cl.tabsSelected);
				this.jq.window.resize();
			},
			guestsTabInit: function() {
				this.state.archive = 0;
				this.jq.bottom.show();
				this.switchTab('contacts');
				this.scrollMessages.opts.$viewport.scrollTop(this.scrollMessages.opts.$walker.height()); //скролл вниз
			},
			archiveTabInit: function() {
				this.state.archive = 1;

				MessageForm.$el.show();
				this.jq.sendOffLine.hide();
				this.jq.bottom.hide();

				this.switchTab('archive');
			},
			toRegistration: function() {
				document.location = '/asp/g_reg.asp';
			},
			sendOffLineCancel: function() {
				this.jq.sendOffLine.hide();
				MessageForm.$el.show();
			},
			refreshWindow: function(e) {
				window.location.reload();

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			},
			closeWindow: function(e) {
				if ( confirm('Вы хотите закрыть «Веб Мессенджер»?') ) {
					window.close();
				}

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			}
		});

		var Router = Backbone.Router.extend({
			routes: {
				'': 'contacts',
				'!/': 'contacts',
				'!/contacts': 'contacts',
				'!/archive': 'archive'
			},
			contacts: function() {
				Messenger.guestsTabInit('contacts');
			},
			archive: function() {
				Messenger.archiveTabInit('archive');
			}
		});

		$.ajaxSetup({
			cache: false/*,
			contentType: 'application/x-www-form-urlencoded; charset=windows-1251'*/
		}); 
		
		var Contacts = new ContactList;
		var Messages = new MessageList;
		var MessageForm = new MessageFormView;
		var Messenger = new MessengerView;
		var router = new Router;

		Backbone.history.start();
	});
})(window, window.jQuery);