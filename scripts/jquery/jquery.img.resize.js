/**
 * 이미지 크기가 컨텐즈 영역을 벗어날 만큼 클 경우 레이아웃 깨짐 방지를 위하여 사용한다.
 * 사용 예) <img src="/path/to/file.jpg" onload="$(this).resize({maxWidth: 467});">
 */
(function($) {
    $.fn.resize = function(options) {
 
        var settings = $.extend({
            scale: 1,
            maxWidth: null,
			maxHeight: null
        }, options);
 
        return this.each(function() {
			
			if(this.tagName.toLowerCase() != "img") {
				// Only images can be resized
				return $(this);
			} 

			var width = this.naturalWidth;
			var height = this.naturalHeight;
			if(!width || !height) {
				// Ooops you are an IE user, let's fix it.
				var img = document.createElement('img');
				img.src = this.src;
				
				width = img.width;
				height = img.height;
			}
			
			if(settings.scale != 1) {
				width = width*settings.scale;
				height = height*settings.scale;
			}
			
			var pWidth = 1;
			if(settings.maxWidth != null) {
				pWidth = width/settings.maxWidth;
			}
			var pHeight = 1;
			if(settings.maxHeight != null) {
				pHeight = height/settings.maxHeight;
			}
			var reduce = 1;
			
			if(pWidth < pHeight) {
				reduce = pHeight;
			} else {
				reduce = pWidth;
			}
			
			if(reduce < 1) {
				reduce = 1;
			}
			
			var newWidth = width/reduce;
			var newHeight = height/reduce;
			
			return $(this)
				.attr("width", newWidth)
				.attr("height", newHeight);
			
        });
    }
})(jQuery);
