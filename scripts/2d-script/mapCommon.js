/**by new intruder **/
var map;
var vworldUrl = 'http://map.vworld.kr';
var vworldBaseMapUrl = 'http://xdworld.vworld.kr:8080/2d';
////향후 ... 서버단으로 변경
var vworldApiKey = '80E403B5-D3F1-377E-A24D-A7143492B2F3';
var vworldExtent = ol.proj.transformExtent([123,30,139,48], 'EPSG:4326', 'EPSG:3857');
var vworldVers = { Base: '201512', Hybrid: '201512', Satellite: '201301', Gray: '201512', Midnight: '201512' };
var vworldUrls = {
	base: vworldBaseMapUrl + "/Base/" + vworldVers.Base,
	hybrid: vworldBaseMapUrl + "/Hybrid/" + vworldVers.Hybrid,
	raster: vworldBaseMapUrl + "/Satellite/" + vworldVers.Satellite,
	gray: vworldBaseMapUrl + "/gray/" + vworldVers.Gray,
	midnight: vworldBaseMapUrl + "/midnight/" + vworldVers.Midnight,
	apiCheck: vworldUrl + "/checkAPINum.do?key=" + vworldApiKey + "&type=TMS"
};
/**
 * 5179 프로젝션 등록
 */
proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs");
var proj_5179 = new ol.proj.Projection({
    code : "EPSG:5179"
});
/**
 * 지도 사이즈
 */
function mapResize(){
	map.updateSize(); 
}
/**
 * 지도 객체 받아오기
 * @param title
 * @returns
 */
function getLayer(title){
	var layerArr = map.getLayers().getArray();
	
	for (var i=0; i<layerArr.length; i++){
		if (layerArr[i].get('title') == title) {
			return layerArr[i];
		}	
	}
	return null;
}
/**
 * JSON 값 확인
 * @param str
 * @returns {Boolean}
 */
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
/**
 * 지도 타입 정보 요청
 * @param contextName
 * @param callback
 */
function getMapInfo(contextName, callback){
	var requestUrl = contextName + '/geojson/mapInfo';
	$.ajax({
		url : requestUrl,		
		success : function(res){
			callback(res);
		}
	})
}

/**
 * 지도 타입 변경
 * @param olObj
 * @param key
 * @param type
 */
function changeMapType(olObj, key, type) {
	var normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[15]; 
	var obj = getVectorLayer('seoulBaseMap');
	if (obj != null){
		obj.setVisible(true);
	}
	if (type == 'remove') {
		obj.setVisible(false);
		//obj.setSource(new ol.source.OSM()); 
		return 0;
	}
	if (type == 'en'){
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[16];
	} else if (type =='jp') {
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[17];
	} else if (type == 'chag') {
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[18];
	} else if (type == 'chab') {
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[19];
	} else if (type == 'rsKo') {
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[20];
	} else if (type == 'rsEn') {
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[21];
	} else if (type == 'rsJp') {
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[22];
	} else if (type == 'rsChag') {
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[23];
	} else if (type == 'rsChab') {
		normalMap = seoulMapInfo.tileMapInfos.tileMapInfo[24];
	}
	var tg = new ol.tilegrid.TileGrid({
	    origin : [normalMap.originX, normalMap.originY],
	    extent: [normalMap.mbr.minx, normalMap.mbr.miny, normalMap.mbr.maxx, normalMap.mbr.maxy],
	    resolutions: [128,64,32,16,8,4,2,1,0.5,0.25],
	    tileSize : [256, 256]
	});
	var mapUrlBase = 
		'http://map.seoul.go.kr/smgis/apps/mapsvr.do?cmd=getTileMap&key=' 
		+ key 
		+ '&URL=';
	var xyz = new ol.source.XYZ({
        crossOrigin : 'Anonymous',
	    projection: proj_5179,
	    tileUrlFunction : function (coordinate, pixelRatio, projection) {
	        var url = mapUrlBase + normalMap.url;
	        var z = coordinate[0];
	        var x = coordinate[1];
	        var y = ((coordinate[2]));
	        var xHalf = parseInt(x / 50);
	        var yHalf = parseInt(y / 50);
	        url = url + z + '/' + xHalf + '/' + yHalf + '/' + x + '_' + y + '.png';
	        return url;
	    },
	    tileGrid : tg
	});
	var mapLayers = olObj.getLayers();
	var mapLayer = null;
	mapLayers.forEach(function(obj, i){
		var title = obj.get('title');
		if (title == 'seoulBaseMap'){
			mapLayer = obj;
		}	
	});
	if (mapLayer != null){
		mapLayer.setSource(xyz);
	}
}

/**
 * 서울시 지도 초기화 
 * @param olObj
 * @param key
 */
function initVWorldMap(olObj){
//	var korNorMap = seoulMapInfo.tileMapInfos.tileMapInfo[15];
	function VScript(src){
		var js = document.createElement("script");
		js.type = "text/javascript";
		js.src = src;
		document.body.appendChild(js);
	}
	VScript(vworldUrls.apiCheck);
	var url = vworldUrls.base;
	var imgType = 'png';    //jpeg
	var vWorldMap = new ol.layer.Tile({
        extent: vworldExtent,
        projection : 'EPSG:3857',
        source: new ol.source.XYZ({
            tileUrlFunction : function (coordinate, pixelRatio, projection){
                var z = coordinate[0];
                var x = coordinate[1];
                var y = (-(coordinate[2])) - 1;
                return  url + "/" + z + "/" + x + "/" + y + "." + imgType;
            }
        })
    });
	var center = olObj.getView().getCenter();
	var zoom = olObj.getView().getZoom();
	var view = new ol.View({
        center: center,
        minZoom : 10,
        maxZoom : 23,
        zoom: zoom /*,
        extent : ol.proj.transformExtent(
                [korNorMap.mbr.minx, korNorMap.mbr.miny, korNorMap.mbr.maxx, korNorMap.mbr.maxy],
                "EPSG:5179", "EPSG:3857")*/
    });
	olObj.setView(view);
	olObj.addLayer(vWorldMap);
}