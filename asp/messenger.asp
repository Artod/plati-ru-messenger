<%@ Language=VBScript %><%
Response.Expires = 0
'Session.CodePage = 1251
'Response.CharSet = "windows-1251"
'Session.CodePage = 65001
'Response.CharSet = "utf-8"
%><%
Who = LCase(CStr(Request("mode")))
If not Who = "s" Then
	Who = "g"
End If
%><% if Who = "s" then %><!-- #include file="../inc/cookies_s.inc"--><% Else %><!-- #include file="../inc/cookies_g.inc"--><% End If %><%
If Who = "s" Then
	If ID_S = 0 Or ID_S <> ID_S_enter Then
		Response.Redirect "start.asp?fr=s"
	End If
Else
	If ID_G = 0 And ID_GA = 0 Then
		Response.Redirect "start.asp?fr=g"
	End If
End If

If Request("archiv") = "0" Or Request("archiv") = "1" Then
	if Request("archiv") = "0" then Response.Cookies("s_Archiv") = "0"
	if Request("archiv") = "1" then Response.Cookies("s_Archiv") = "1"
	Response.Cookies("s_Archiv").Expires  = DateAdd("d", 3, Date())
	Archiv = CBool(Request("archiv"))
End If

%><!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=9; IE=8" />
		<meta charset="utf-8" />

		<title><% If Who = "g" Then Response.Write "Internet Support" Else Response.Write "Веб Мессенджер" %></title>

		<link rel="stylesheet" href="/css/main.css?5" />

		<script src="/js/json2.js"></script>
		<script src="/js/jquery-1.7.2.min.js"></script>
		<script src="/js/underscore-1.3.3.min.js"></script>
		<script src="/js/backbone-0.9.2.min.js"></script>
		<script src="/js/jquery.draggable-0.9.js"></script>
		<script src="/js/jquery.scroll-1.0.js"></script>
		<script src="/js/soundmanager2.js"></script>		
		<script src="/js/messenger.js?7"></script>
		<script>
			window.messenger = {
				id_s: <%= ID_S %>,
				id_g: <%= ID_G %>,
				id_ga: <%= ID_GA %>,
				//sign: '< Sign %>',
				archive: <% If Archiv Then Response.Write 1 Else Response.Write 0 End If %>,
				who: '<%= Who %>'
			}
		</script>
	</head>
	<body>
		<div id="top">
			<ul id="tabs">
				<li class="tabs tabs-selected" id="tab-contacts"><a href="#!/contacts"><% If Who = "s" Then Response.Write "Посетители" Else Response.Write "Продавцы" End IF %></a></li>
				<li class="tabs" id="tab-archive"><a href="#!/archive">Архив</a></li>

				<% If Who = "s" Then %>
					<li class="tabs" id="tab-settings"><a href="/asp/s_options.asp">Настройки</a></li>
				<% End If %>
			</ul>

			<ul id="more">
				<% If Who = "s" Then %>
					<li><a href="https://my.digiseller.ru/inside/new_message.asp?id_to=0" target="_blank"><img src="../img/help.gif" title="Задать вопрос" alt="Задать вопрос" /></a></li>
					<li><a href="/asp/s_news.asp"><img src="../img/inf.gif" title="Новости" alt="Новости" /></a></li>
					<li><a href="#" class="more-refresh"><img src="../img/refresh.gif" title="Обновить" alt="Обновить" /></a></li>
					<li><a href="#" class="more-close"><img src="../img/close.gif" title="Закрыть" alt="Закрыть" /></a></li>
				<% Else %>
					<li><a href="#" class="more-refresh"><img src="../img/refresh.gif" title="Обновить" alt="Обновить" /></a></li>
				<% End If %>
			</ul>
		</div>

		<div id="left">
			<div class="contacts-scroll-viewport">
				<div class="contacts-scroll-walker">
					<div id="contacts-notify" style="display:none;">
						список ваших посетителей пуст
					</div>
					<div id="loader">
						<img src="../img/loading.gif" alt="loading..." />
					</div>
					<ul id="contacts"<% If Who = "g" Then Response.Write " class=""contacts-support""" Else Response.Write "" %>></ul>
				</div>
			</div>
		</div>

		<div id="main">
			<div id="history">
				<div class="messages-wrap">
					<ul id="messages"></ul>
				</div>
			</div>

			<div id="bottom">
				<div id="soundmanager-debug" style="display:none;"></div>
				<div id="message">
					<form name="message-form" method="POST">
						<textarea class="message-textarea" id="message-textarea" name="message"></textarea>

						<div class="message-send-wrap">
							<input class="message-send" name="button_send" value="Отправить" disabled="disabled" type="submit" />
							<span class="message-ctrl-enter">Ctrl + Enter</span>
						</div>

						<div class="message-state" id="message-state" name="guest_state"></div>


						<% If Who = "g" and ID_G = 0 Then %>
							<a href="/asp/g_reg.asp" id="registration" title="Сохранить историю переписки">сохранить историю (зарегистрироваться)</a>&nbsp;&nbsp;
						<% End If %>
					</form>
				</div>

				<% If Who = "g" Then %>
					<div id="sendOffLine" style="display:none;">
						<div class="sendOffLine-message">Последнее сообщение было отправлено продавцу в offline. Пожалуйста укажите своё имя и email, для того чтобы он смог связаться с вами и ответить на интересующий вас вопрос.</div>
						
						<input type="button" class="text_button sendOffLine-ok" value="Указать" onClick="Registration()" />
						<input type="button" class="text_button sendOffLine-cancel" value="Отказаться" />
					</div>
				<% End If %>
			</div>
		</div>

		<script type="text/template" id="template-contacts">
			<div class="contacts-status"></div>
			<div class="contacts-avatar"></div>

			<<%= "%" %> if (isNewMessage) { %>
				<img class="contacts-new-message" src="/img/msg_new.gif" alt="Новое сообщение" />
			<<%= "%" %> } %>
			
			<<%= "%" %> if (isOnline) { %>
				<span class="contacts-ip" title="Текущий IP-адрес посетителя"><<%= "%" %>= ip %></span>
			<<%= "%" %> } else { %>
				<span class="contacts-date" title="Последнее посещение"><<%= "%" %>= lastConnect %></span>
			<<%= "%" %> } %>

			<a class="contacts-name" title="<<%= "%" %>= name %>"><<%= "%" %>= name %></a>
			<ul class="contacts-menu">
				<li>
					<a class="contacts-move contacts-<<%= "%" %>= isArchive ? 'from' : 'to' %>-archive" title="<<%= "%" %>= isArchive ? 'Восстановить из архива' : 'Убрать в архив' %>"></a>
				</li>
				<li<<%= "%" %>= isArchive ? '' : ' style="display:none;"' %>>
					<a class="contacts-remove" title="Удалить переписку"></a>
				</li>
			</ul>

			<<%= "%" %> if (isActive) { %>
				<div class="contacts-active-shadow"></div>
			<<%= "%" %> } %>

			<% If Who = "g" Then %>
				<a href="http://shop.digiseller.ru/my/goods.asp?shop=<<%= "%" %>= shop %>&user=<<%= "%" %>= user %>" class="contacts-goods" title="Показать список товаров продавца" target="_blank"></a>
			<% End If %>
		</script>

		<script type="text/template" id="template-messages">
			<span class="messages-date">
				<<%= "%" %> if (date_view == 'no' && sender != '<%= Who %>') { %>
					<img src="/img/msg_new_small.gif" alt="Новое сообщение" />
				<<%= "%" %> } %>				
				<<%= "%" %>= date_write %>
			</span>

			<<%= "%" %> if (name) { %>
				<span class="messages-author<<%= "%" %>= sender == '<%= Who %>' ? ' messages-my' : '' %>"><<%= "%" %>= name %></span>:
			<<%= "%" %> } %>

			<span class="messages-<<%= "%" %>= name ? 'guest' : 'support' %>"><<%= "%" %>= message %></span>
		</script>
	</body>
</html> 