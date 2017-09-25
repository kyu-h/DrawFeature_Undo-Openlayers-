var costomHeight = $(window).height();

$(document).ready(function(){
	
	// 모니터 크기에 맞는 높이값 구하기
    var containerHeight = costomHeight - $("#header").innerHeight();
    var leftareaHeight = containerHeight -98;
    
    $(".leftarea").height(leftareaHeight); //시뮬레이터 높이
    
	var mapWidth = costomWidth- $(".leftarea").innerWidth()-10;
	//$(".maparea").width(mapWidth); //매니저먼트툴 전체 박스 높이
	$(".maparea").height(leftareaHeight); //시뮬레이터 높이

	//END

});


$(window).resize(function() {
    //브라우져 화면 변화시 높이값
    costomHeight = $(window).height();
    containerHeight = costomHeight - $("#header").innerHeight();
	leftareaHeight = containerHeight -98;

	$(".leftarea").height(leftareaHeight); //시뮬레이터 높이
    
    //브라우져 화면 변화시 가로값
    costomWidth = $(window).width();
	mapWidth = costomWidth- $(".leftarea").innerWidth()-10;
	//$(".maparea").width(mapWidth); //매니저먼트툴 전체 박스 높이
	$(".maparea").height(leftareaHeight); //시뮬레이터 높이
    
});

