/*> ../m1ke-utils/function-exists.js */
/*> ../m1ke-utils/number.js */
/*> ../m1ke-utils/queries.js */

var easyOverlay={
	count:0
	,overflows:[]
	,mobile:false
	,background:function($foreground,zOffset,callback){
		var $overlay=this.createBackground({},10).click(function(){
			easyOverlay.backgroundClose();
		});
		$overlay.appendTo('body');
		$foreground.data('css',{
			position:$foreground.css('position')
			,'z-index':$foreground.css('z-index')
		}).addClass('overlay-foreground').css({
			position:'relative'
			,'z-index':$overlay.css('z-index')+1
		});
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
	,click:function(e){
		var options=$(this).data();
		e.preventDefault();
		if (!$(this).data('propagate')){
			e.stopPropagation();
		}
		//this.count=$(document).data('easythis.count');
		var query=appendQuery($(this).attr('href'),'ajax=1');
		options.load=query;
		options.data=false;
		easyOverlay.create(options);
		//$(document).data('easythis.count',this.count);
	}
	,close:function($overlay,back,noCheck){
		if ($('div.overlay').length>0){
			if ($('.overlay-foreground').length>0){
				this.backgroundClose();
				return;
			}
			if (!$overlay){
				$overlay=$('div.overlay:last');
			}
			var options=$overlay.children('div').data(),closing=false;
			if (options) {
				if (options.closeCheck && !noCheck && !confirm('Are you sure you wish to close this dialog box?')) {
					return;
				}
				if (options.closeCallback) {
					options.closeCallback($overlay);
				}
				if (options.closeSubmit) {
					this.closeSubmit($overlay);
					closing=true;
				}
			}
			if (!closing) {
				this.closeOverlay($overlay,back);
			}
		}
	}
	,closeButton:function(){
		$('<a href="#">Close this</a>').css({
			position:'absolute'
			,top:'20px'
			,right:'20px'
		}).click(function(){
			$(this).closest('div.overlay').remove();
		}).appendTo($(this));
	}
	,closeOverlay:function($overlay,back){
		if (!back && $overlay.data('history')){
			window.onpopstate=function(e){};
			window.history.back();
		}
		$overlay.remove();
		if (this.count>1){
			$('#overlay'+(this.count-1)).css({overflow:this.overflows[this.count]});
		}
		else {
			$('body').css((this.overflows[1] && this.overflows[1].overflow) ? this.overflows[1] : {overflow:'visible'});
		}
		this.count--;
	}
	,closeSubmit:function($overlay){
		var self=this;
		$overlay.css('cursor','wait').find('form:first').data('callback',function(){
			self.closeOverlay($overlay);
		}).each(this.onSubmit);
	}
	,create:function(options,data,overlayCall,submitCall,css,bg){
		if (typeof options!='object'){
			options={
				load:options
				,data:data
				,overlayCall:overlayCall
				,submitCall:submitCall
				,css:css
				,bg:bg
			};
		}
		this.count++;
		var overlay=this;
		options.css=options.css===false ? {} : $.extend({
			position:'relative'
			,'float':'left'
			,left:'25%'
			,width:'50%'
			,margin:(15+(this.count*10))+'px 0 0 0'
			,cursor:'default'
			,padding:'10px'
		},options.css);
		options.css['z-index']=(this.count*5)+1;
		var $overlay=this.createBackground(options).data(options).click(function(){
			easyOverlay.close($(this),(options && options.history) ? false : true);
		});
		
		if (this.count>1){
			this.overflows[this.count]=$('#overlay'+(this.count-1)).css('overflow');
			$('#overlay'+(this.count-1)).css({overflow:'hidden'});
		}
		else {
			this.overflows[this.count]={
				overflow:$('body').css('overflow')
				,'overflow-x':$('body').css('overflow-x')
				,'overflow-y':$('body').css('overflow-y')
			};
			if (!options.scroll){
				$('body').css({overflow:'hidden'});
			}
		}
		$content=$('<div>').css(options.css).click(function(e){
			e.stopPropagation();
		}).appendTo($overlay);
		if (typeof options.history=='object'){
			$overlay.data('history',true);
			window.history.pushState({title:$('title').text()},'',options.history.url);
			$('title').text(options.history.title);
			window.onpopstate=function(e){
				if (e.state && e.state.title){
					$('title').text(e.state.title);
				}
				easyOverlay.close(false,true);
			};
		}
		if (options.data){
			if (typeof options.data!='object'){
				$content.append(options.data);
			}
			else {
				$content.html(options.data);
			}
			if (typeof options.overlayCall=='function'){
				options.overlayCall($content);
			}
			if (options.submitCall){
				$('form[target!="blank"]',$content).easyOverlaySubmit(options.submitCall);
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
			if (options.foreground){
				this.foreground($(options.foreground),$overlay);
			}
		}
		else  {
			$content.load(options.load,function(App){
				return function(){
					if (typeof options.overlayCall=='function') {
						options.overlayCall.call(false,$(this),options.overlayOptions);
					}
					if (options.submitCall) {
						$('form',$(this)).easyOverlaySubmit(options.submitCall);
					}
					if (typeof options.closeCallback=='function') {
						$(this).data('closeCallback',options.closeCallback);
					}
					if (options.closeCheck) {
						$(this).data('closeCheck',1);
					}
					if (options.closeSubmit) {
						$(this).data('closeSubmit',1);
					}
					$(this).find('a.overlay-close').click(function(e){
						e.preventDefault();
						easyOverlay.close();
					});
					if ($(this).html()=='') {
						$(this).html('Something has gone wrong with your connection to the website and no information was received. Click the outside of this box to close it.');
					}
				};
			}(this));
		}
		if (options.close){
			$('<a href="#" class="close">Close</a>').click(function(e){
				e.preventDefault();
				easyOverlay.close();
			}).appendTo($content);
		}
		$body=$('body');
		$overlay.appendTo($body);
		if (options.scroll){
			var windowHeight=$(window).height();
			$overlay.css('height',($body.height()>windowHeight?$body.height():windowHeight));
			$body.scrollTop(0);
		}
	}
	,createBackground:function(options,zOffset){
		if (typeof options!='object'){
			options={};
		}
		var css={
			position:(options.scroll || this.mobile) ? 'absolute' : 'fixed'
			,width:'100%'
			,height:options.scroll ? 'auto' : '100%'
			,top:this.mobile ? window.pageYOffset+'px' : 0
			,left:0
			,'z-index':(this.count*50)+(zOffset ? zOffset : 0)
			,background:options.bg ? options.bg : 'rgba(0,0,0,0.5)'
			,cursor:'pointer'
			,'overflow-x':'hidden'
			,'overflow-y':'auto'
		};
		var $overlay=$('<div>').css(css).addClass('overlay').attr({id:'overlay'+this.count});
		return $overlay;
	}
	,level:function(noClose){
		if (!noClose){
			this.close();
		}
		return $('#overlay'+this.count);
	}
	,onSubmit:function(e){
		e && e.preventDefault();
		var $form=$(this).css('cursor','wait')
			,$submit=$(this).find('input[type="submit"]').prop('disabled',true).addClass('disabled')
			,ajax=[]
			,url=$form.attr('action').replace('db_','ajax_').appendQuery('easy-overlay-submit=1');
		$form.find('p.error').remove().end()
		.find('div.error').removeClass('error')
			.find('strong').remove().end().end()
		.find('input.error,select.error,textarea.error').removeClass('error').next('strong').remove();
		ajax=$form.find(':not([type="submit"])[name]').serialize();
		var $clickedSubmit=$submit.filter('[clicked="true"]');
		if ($clickedSubmit.length>0){
			ajax+='&'+$clickedSubmit.attr('name')+'='+$clickedSubmit.val();
			$clickedSubmit.attr('clicked','');
		}
		easyOverlay.submit(ajax,url,$form.data('callback'),$submit,$form);
	}
	,reopen:function($overlay,loadExtend,loadReplace){
		if (this.count>0){
			$overlay=$overlay || $('div.overlay:last');
			var data=$overlay.data();
			this.closeOverlay($overlay);
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
	,submit:function(ajax,url,callback,$submit,$form){
		var self=this;
		$.ajax({
			type:'POST'
			,url:url
			,data:ajax
			,success:function(response){
				$submit.prop('disabled',false).removeClass('disabled');
				$form.css('cursor','default');
				var handler='';
				try {
					response=$.parseJSON(response);
					handler='submitSuccessJson';
				}
				catch (e){
					handler='submitSuccess';
				}
				self[handler](response,ajax,callback,$submit,$form);
			}
			,error: function(){
				alert('The website could not be reached; there might be a problem with your connection. Please try again, or check whether you can reach other pages on the website if the problem persists.');
			}
		});
	}
	,parseAjax:function(ajax){
		var temp={};
		ajax=decodeURIComponent(ajax).split('&');
		for (i in ajax){
			if (isNumeric(i)){
				query=ajax[i].split('=');
				query[1] && (temp[query[0]]=query[1].replace(/\+/g,' '));
			}
		}
		return temp;
	}
	,submitSuccessJson:function(response,ajax,callback,$submit,$form){
		if (response.error){
			if (response.error.alert){
				alert('Error: '+response.error.alert);
			}
			else {
				this.submitError(response.error,$form);
			}
		}
		else {
			if (typeof callback=='function'){
				callback.apply(this.parseAjax(ajax),[response,$submit]);
			}
			else if (callback){
				// can't pass APP in and keep response?
				this.close();
			}
		}
	}
	,submitError:function(error,$form){
		$.each(error,function(key,error){
			var $input={};
			if (isNaN(key)){
				key=key.split('-');
				var name=key[0].replace(/([A-Z])/,'_$1').toLowerCase();
				var selector=key[1] ? '[name="'+name+'[]"]:nth('+key[1]+')' : '[name="'+name+'"]';
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
	}
	,submitSuccess:function(response,ajax,callback,$submit,$form){
		response=response.split('|');
		if (response[0]=='success'){
			// temp is passed through as active object "this"
			if (typeof callback=='function'){
				callback.apply(this.parseAjax(ajax),[response,$submit]);
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
				this.submitError(response.error,$form);
			}
			catch (e){
				alert('Error: '+response[1]);
			}
		}
		else {
			alert('The website did not send back the information we expected. Please try again, or contact the site owners if the problem persists.');
		}
	}
};

$.fn.easyOverlay=function(options,submitCall,css){
	if (typeof options!='object'){
		options={
			overlayCall:options
			,submitCall:submitCall
			,css:css
		};
	}
	return this.unbind('click',easyOverlay.click).data(options).click(easyOverlay.click);
};

$.fn.easyOverlaySubmit=function(callback){
	return this.unbind('submit',easyOverlay.onSubmit).submit(easyOverlay.onSubmit).data('callback',callback);
};

$(function(){
	$('body').dblclick(function(){
		$(this).css('overflow','visible');
	});
});
