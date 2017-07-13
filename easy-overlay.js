/*@include ../js-utils/function-exists.js */
/*@include ../js-utils-jq/append-query.js */

/*
 public methods
 		background
 		backgroundClose
 		close
 		create
 		reopen
 		level
 		create
 		get
 			count
 		set
 			css
 		jq
 			click
 			submit
*/
var easyOverlay=(function(){
	var count=0
		,overflows=[]
		,mobile=false
		,css={
			bg:{
				background:'rgba(0,0,0,0.5)'
				,cursor:'pointer'
				,height:'100%'
				,left:0
				,position:'fixed'
				,top:0
				,width:'100%'
				,'overflow-x':'hidden'
				,'overflow-y':'auto'
				,'z-index':50
			}
			,content:{
				cursor:'default'
				,left:'25%'
				,margin:(15+(count*10))+'px 0 0 0'
				,padding:'10px'
				,position:'relative'
				,width:'50%'
				,'float':'left'
			}
			,close:{
				position:'absolute'
				,right:'20px'
				,top:'20px'
			}
		};

// functions
	function closeButton(){
		return $('<a href="#">Close this</a>').css(css.close).click(function(){
			cls.close();
		});
	}

	function closeOverlay($overlay,back){
		if (!back && $overlay.data('history')){
			window.onpopstate=function(e){};
			window.history.back();
		}
		$overlay.remove();
		if (count>1){
			$('#overlay'+(count-1)).css({overflow: overflows[count]});
		}
		else {
			$('body').css((overflows[1] && overflows[1].overflow) ? overflows[1] : {overflow: 'visible', position: 'static'});
		}
		count--;
	}

	function closeSubmit($overlay){
		$overlay.css('cursor','wait').find('form:first').data('callback',function(){
			cls.closeOverlay($overlay);
		}).each(cls.jq.onSubmit);
	}

	function cssBgMake(options,zOffset){
		var cssBg=$.extend({},css.bg);
		if (options.scroll || mobile){
			cssBg.position='absolute';
		}
		if (options.scroll){
			cssBg.height='auto';
		}
		if (mobile){
			cssBg.top=window.pageYOffset+'px';
		}
		cssBg['z-index']=(count*50)+(zOffset ? zOffset : 0);
		if (options.bg){
			cssBg.background=options.bg;
		}
		return cssBg;
	}

	function foreground($foreground,$overlay){
		$foreground.data('css',{
			position:$foreground.css('position')
			,'z-index':1*$foreground.css('z-index')
		}).addClass('overlay-foreground').css({
			position:'relative'
			,'z-index':1*$overlay.css('z-index')+1
		});
	}

	function parseAjax(ajax){
		var temp={};
		ajax=decodeURIComponent(ajax).split('&');
		for (i in ajax){
			if ($.isNumeric(i)){
				query=ajax[i].split('=');
				query[1] && (temp[query[0]]=query[1].replace(/\+/g,' '));
			}
		}
		return temp;
	}

	function submitSuccessJson(response,ajax,callback,$submit,$form){
		if (response.error){
			if (response.error.alert){
				alert('Error: '+response.error.alert);
			}
			else {
				submitError(response.error,$form);
			}
		}
		else {
			if (typeof callback=='function'){
				callback.apply(parseAjax(ajax),[response,$submit]);
			}
			else if (callback){
				// can't pass APP in and keep response?
				cls.close();
			}
		}
	}

	function submitError(errors,$form){
		var callback;

		$.each(errors,function(key,error){
			var $input={};
			if (isNaN(key)){
				key=key.split('-');
				var name=key[0].replace(/([A-Z])/,'_$1').toLowerCase()
					,selector=key[1] ? '[name="'+name+'[]"]:nth('+key[1]+')' : '[name="'+name+'"]';
				$input=$(selector,$form);
			}
			if ($input.length>0){
				$('<strong>'+error+'</strong>').insertAfter($input);
				$input.addClass('error').parent().addClass('error');
			}
			else {
				$form.prepend('<p class="error">'+error+'</p>')
			}
		});
		$('div.overlay:last').scrollTop(0);

		callback = $form.data('callback-error');
		if (typeof callback==='function'){
			callback.call(null, [$form, errors]);
		}
	}

	function submitSuccess(response,ajax,callback,$submit,$form){
		response=response.split('|');
		if (response[0]=='success'){
			// data is passed through as active object "this"
			if (typeof callback=='function'){
				callback.apply(parseAjax(ajax),[response,$submit]);
			}
			else if (callback){
				// can't pass APP in and keep response?
				easyOverlay.close();
			}
		}
		else if (response[0]=='error'){
			response[0]='';
			try {
				response={error:$.parseJSON(response.join(''))};
				submitError(response.error,$form);
			}
			catch (e){
				alert('Error: '+response[1]);
			}
		}
		else {
			alert('The website did not send back the information we expected. Please try again, or contact the site owners if the problem persists.');
		}
	}

	function overlayPrepare($content,options,self){
		if (cls.overlayCallAll){
			cls.overlayCallAll.call(cls,$content);
		}
		if (typeof options.overlayCall=='function') {
			options.overlayCall.call(false,$content,options.overlayOptions);
		}
		if (options.submitCall){
			$('form[target!="_blank"]',$content).easyOverlaySubmit(options.submitCall);
		}
		if (typeof options.closeCallback=='function'){
			$content.data('closeCallback',options.closeCallback);
		}
		if (options.closeCheck) {
			$content.data('closeCheck',1);
		}
		if (options.closeSubmit){
			$content.data('closeSubmit',1);
		}
		$('a.overlay-close',$content).click(function(e){
			self.close();
		});
		if (options.foreground){
			foreground($(options.foreground),$content);
		}
	}

// cls
	var cls={
		background:function($foreground,zOffset,callback){
			var self=this
				,$overlay=this.createBackground({},10).click(function(){
					self.backgroundClose();
				});
			$overlay.appendTo('body');
			foreground($foreground,$overlay);
			if (callback){
				$foreground.data('callback',callback);
			}
		}
		,backgroundClose:function($foreground){
			$('div.overlay').remove();
			$('.overlay-foreground').each(function(){
				if (typeof $(this).data('callback')=='function'){
					$(this).data('callback')($(this));
				}
				$(this).css($(this).data('css')).removeClass('overlay-foreground');
			});
		}
		,close: function($overlay,back,noCheck){
			if ($('div.overlay').length<1){
				return;
			}
			if ($('.overlay-foreground').length>0){
				this.backgroundClose();
				return;
			}
			if (!$overlay){
				$overlay = $('div.overlay:last');
			}
			var options = $overlay.children('div').data()
				,closing = false;
			if (options) {
				if (options.closeCheck && !noCheck && !confirm('Are you sure you wish to close this dialog box?')){
					return;
				}
				if (options.closeCallback){
					var returnValue = options.closeCallback($overlay);
					if (returnValue===false){
						return;
					}
				}
				if (options.closeSubmit){
					closeSubmit($overlay);
					closing = true;
				}
			}
			if (!closing) {
				closeOverlay($overlay,back);
			}
		}
		,create:function(options, data, overlayCall, submitCall, cssContent, bg){
			var self = this;
			if (typeof options!='object'){
				options = {
					load: options
					,data: data
					,overlayCall: overlayCall
					,submitCall: submitCall
					,css: cssContent
					,bg: bg
				};
			}
			count++;
			options.css = options.css===false ? {} : $.extend(css.content, options.css);
			options.css['z-index'] = 50 + (count*5)+1;

			var $overlay = this.createBackground(options).data(options).click(function(){
				self.close($(this), (options && options.history) ? false : true);
			});

			if (count>1){
				overflows[count] = $('#overlay'+(count-1)).css('overflow');
				$('#overlay'+(count-1)).css({overflow: 'hidden'});
			}
			else {
				overflows[count] = {
					overflow: $('body').css('overflow')
					,'overflow-x': $('body').css('overflow-x')
					,'overflow-y': $('body').css('overflow-y')
					,position: $('body').css('position')
				};
				if (!options.scroll){
					var bodyCss = {
						overflow: 'hidden'
					};
					if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)){
						bodyCss.position = 'fixed';
					}
					$('body').css(bodyCss);
				}
			}

			$content = $('<div>').css(options.css).click(function(event){
				event.stopPropagation();
			}).appendTo($overlay);

			if (typeof options.history=='object'){
				$overlay.data('history', true);
				window.history.pushState({
					title: $('title').text()
				}, '', options.history.url);
				$('title').text(options.history.title);
				window.onpopstate = function(e){
					if (e.state && e.state.title){
						$('title').text(e.state.title);
					}
					self.close(false, true);
				};
			}

			if (options.data){
				if (typeof options.data!='object'){
					$content.append(options.data);
				}
				else {
					$content.html(options.data);
				}
				overlayPrepare($content, options, self);
			}
			else  {
				$content.load(options.load,function(){
					overlayPrepare($(this), options, self);
					if ($(this).html()=='') {
						$(this).html('Something has gone wrong with your connection to the website and no information was received. Click the outside of this box to close it.');
					}
				});
			}

			if (options.close){
				$('<a href="#" class="close">Close</a>').click(function(e){
					e.preventDefault();
					self.close();
				}).appendTo($content);
			}
			$body = $('body');
			$overlay.appendTo($body);
			if (options.scroll){
				var windowHeight = $(window).height();
				$overlay.css('height', $body.height()>windowHeight ? $body.height() : windowHeight);
				$body.scrollTop(0);
			}
			self.options = options;
		}
		,createBackground: function(options, zOffset){
			if (typeof options!='object'){
				options = {};
			}
			var cssBg = cssBgMake(options, zOffset)
				,$overlay = $('<div>').css(cssBg).addClass('overlay').attr({id: 'overlay'+count});
			return $overlay;
		}
		,level: function(noClose){
			if (!noClose){
				this.close();
			}
			return $('#overlay'+count);
		}
		,reopen:function($overlay,loadExtend,loadReplace){
			if (count>0){
				$overlay=$overlay || $('div.overlay:last');
				var data=$overlay.data();
				closeOverlay($overlay);
				if (loadExtend){
					data.load+=loadExtend;
				}
				if (loadReplace){
					var found=false
						,query=data.load.split('?')[1];
					query=query.split('&');
					for (i in query){
						if (!isNaN(i) && query[i].search(loadReplace.key+'=')>-1){
							query[i]=query[i].split('=');
							query[i][1]=loadReplace.val;
							query[i]=query[i].join('=');
							found=true;
							break;
						}
					}
					if (!found){
						query.push(loadReplace.key+'='+loadReplace.val);
					}
					query=query.join('&');
					data.load=data.load.split('?')[0]+'?'+query;
				}
				this.create(data);
			}
		}
		,submit:function(ajax, url, callback, $submit, $form){
			var self = this;
			if (self.options && typeof self.options.beforeSubmit==='function'){
				self.options.beforeSubmit($form, $submit, ajax);
			}
			$.ajax({
				type: 'POST'
				,url: url
				,data: ajax
				,success: function(response){
					var handler;
					try {
						response = typeof response==='object' ? response : $.parseJSON(response);
						handler = submitSuccessJson;
					}
					catch (e){ // The response was not parsed correctly as JSON
						handler = submitSuccess;
					}
					handler.apply(self, [response, ajax, callback, $submit, $form]);
				}
				,error: function(jqXHR, textStatus, errorThrown){
					alert('The website could not be reached; there might be a problem with your connection. Please try again, or check whether you can reach other pages on the website if the problem persists.');
				}
				,complete: function(jqXHR, textStatus){
					$form.css('cursor', 'default');
					$submit.prop('disabled', false).removeClass('disabled');
				}
			});
		}
	};

	cls.get = {
		count: function(){
			return count;
		}
		,css: function(){
			return css;
		}
		,overflows:function(){
			return overflows;
		}
	};

	cls.set={
		css:function(setCss,type,extend){
			css[type]=extend ? $.extend(css[type],setCss) : setCss;
		}
	};

	cls.jq={
		click:function(e){
			var options=$(this).data();
			e.preventDefault();
			if (!$(this).data('propagate')){
				e.stopPropagation();
			}
			var query = $(this).attr('href').trim().appendQuery('ajax=1');
			options.load=query;
			options.data=false;
			$(this).blur();
			cls.create(options);
		}
		,submit:function(e){
			e && e.preventDefault();
			var $form=$(this).css('cursor','wait')
				,$submit=$(this).find('input[type="submit"]').prop('disabled',true).addClass('disabled')
				,ajax=[]
				,url=$form.attr('action').replace('db_','ajax_').appendQuery('easy-overlay-submit=1');

			cls.jq.clearErrors($form);

			ajax=$form.find(':not([type="submit"])[name]').serialize();
			var $clickedSubmit = $submit.filter('[clicked="true"]');
			if ($clickedSubmit.length>0){
				ajax += '&'+$clickedSubmit.attr('name')+'='+$clickedSubmit.val();
				$clickedSubmit.attr('clicked', '');
			}
			easyOverlay.submit(ajax,url, $form.data('callback'), $submit, $form);
		}
		,clearErrors: function($form){
			$form.find('p.error').remove().end()
				.find('div.error').removeClass('error')
				.find('strong').remove().end().end()
				.find('input.error,select.error,textarea.error').removeClass('error').next('strong').remove();
		}
	};

	return cls;
})();

$.fn.extend({
	easyOverlay: function(options, submitCall, css){
		// support passing the overlayCall and submitCall as separate params instead of options
		if (typeof options!='object'){
			if (typeof options!='function' && this.data('overlay')){
				options = window[$(this).data('overlay')];
			}
			if (!submitCall && this.data('submit')){
				submitCall = true;
			}
			options = {
				overlayCall: options
				,submitCall: submitCall
				,css: css
			};
		}
		return this.unbind('click', easyOverlay.jq.click).data(options).click(easyOverlay.jq.click);
	}
	,easyOverlaySubmit: function(callback){
		return this.unbind('submit', easyOverlay.jq.submit).submit(easyOverlay.jq.submit).data('callback', callback);
	}
	,easyOverlaySubmitOff: function(){
		return this.unbind('submit', easyOverlay.jq.submit);
	}
});

$(function(){
	$('a.easy-overlay').easyOverlay();
	$('body').dblclick(function(){
		$(this).css('overflow', 'visible');
	});
});
