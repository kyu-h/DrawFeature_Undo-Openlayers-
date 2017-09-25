var costomHeight = $(window).height();
var costomWidth = $(window).width();

$(document).ready(function(){
	// HTML5 Placeholder 대체용
	(function(placeholderController){
		var phTarget = $(".placeholder").siblings("input, textarea"),
			ph = phTarget.siblings(".placeholder")
				.attr("id", phTarget.attr("id")+"_ph")
				.parent().css("position", "relative");
			ph_h = $(this).siblings("Input, textarea").outerHeight()+"px";
		
		function phHandler(){
			var valueCheck = $(this).val();
			
	      if(valueCheck == ""){
	    	  $(this).siblings(".placeholder").show();
	    	  $(this).focus(function(){
	    		  $(this).siblings(".placeholder").fadeOut("fast");
	    	  });
	    	  $(this).focusout(function(){
	          	  if($(this).val() == ""){
	          		  $(this).siblings(".placeholder").fadeIn("fast");
	          	  }
	    	  });
			  return false;
	      } else {
	    	  $(this).siblings(".placeholder").hide();
	    	  return false;
	      }
		};
		
		function phActionHandler(){
			if ($(this).is(":hidden")){
				return false;
			} else {
				$(this).fadeOut("fast");
				$(this).siblings("input, textarea").focus();
				return false;
			}
		};
		
		phTarget.show(0, phHandler);
		
		/*for innerHtml*/
		$(document).on("click", "#"+phTarget.siblings(".placeholder").attr("id"), phActionHandler);
		$(document).on("focus", "#"+phTarget.attr("id"), phHandler);
			
	})();

	// 화면의 공통 탭 크기 설정 이벤트
	(function(tabsController){
		
		if(typeof $(".tabs li a").attr("strId") != 'undefined'){
			// 탭의 컨텐츠들을 한 페이지로 작성하거나 인클루드하여 사용할 때
			$(".tabs li:first-child").addClass("active");
			$(".tab-content").hide();
			$(".tab-content:first-child").show();
		
			$(".tabs li a").click(function () {
				$(this).parent().addClass("active").siblings().removeClass("active");
				$(".tab-content").hide();
				$($(this).attr("strId")).show();
				return false;
			});
		} else {
			// 컨텐츠들을 개별 페이지로 나누어놓고 페이지를 이동시키는 네비게이션 형태로 사용할 때
		}
		
		// 탭 버튼을 #Container의 크기에 맞춰 유동적으로 표현할 때 
		if($(".tabs.block-tabs").hasClass("block-tabs")){
			var i = $(".tabs li").length;
			$(".tabs li").css("width", 100 / i + "%")
		}
		
	})();

	function uid_onfocus(obj)
	{
		obj.style.background = "none";                    // 도움말 수정 textarea 클릭시 background 사라지는 부분
	}
	
	
	
	/*
	$(window).resize(function() {
		// 컨텐츠 메뉴 높이
		var contentMenuBarHeight = $(".m_tab").css("height").replace("px","");
		var contentSubMenuBarHeight = $(".item_tab.cf").css("height").replace("px","");
		
	    //브라우져 화면 변화시 높이값
	    costomHeight = $(window).height();
	    containerHeight = costomHeight - $("#header").innerHeight();
	    viewcontainerHeight = containerHeight - 97; 
	    viewtabheight = viewcontainerHeight - (parseInt(contentMenuBarHeight)+parseInt(contentSubMenuBarHeight)+60);
		poitableheight = viewtabheight -80;
		lodtableheight = viewcontainerHeight -30;
		zone_listheight = viewcontainerHeight -33;
	    iconsizesetheight = viewtabheight -120;
	
	    $("#poi_box_resz").height(viewcontainerHeight);
		$(".poi_set_resz").height(viewtabheight);
		$(".lod_set_resz").height(lodtableheight);
		$(".zone_list").height(zone_listheight);
		$("ul[id=l_list_resz]").height(poitableheight);
		$(".iconsizeset_resz").height(iconsizesetheight);
	    
	});
	*/
	$(function() {
	    $('input.white').each(function() {
	        $.data(this, 'default', this.value);
	    }).css("color","#ffffff")
	    .focus(function() {
	        if (!$.data(this, 'edited')) {
	            this.value = "";
	            $(this).css("color","#ffffff");
	        }
	    }).change(function() {
	        $.data(this, 'edited', this.value != "");
	    }).blur(function() {
	        if (!$.data(this, 'edited')) {
	            this.value = $.data(this, 'default');
	            $(this).css("color","#ffffff");
	        }
	    });

	});

});

