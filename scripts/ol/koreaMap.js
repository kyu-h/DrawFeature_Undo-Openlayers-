/**
 * by intruder 2016-11-04
 * baseMap title : seoulBaseMap
 */
var map;									//지도 객체
var prjId = null, bldId = null, bldName = null, setId = null, categoryName = null, categoryList = null;
var vectorLayers = new Array();				//벡터 레이어 배열
//var seoulKey = '51b32cf8444d4b6592a290bc64a88dc8';	//서울 지도 키 값 
/** 시각화 객체 이름 **/
var objsName = ["Wall", "Space", "Column", "Door", "Stair", "Window", "Elevator", "Escalator"];
/** 좌표 보정 정보 변수 **/
var correctionInfo =null, changeCorrectionInfo =null;
var correctionInfoArr = ["LATITUDE", "LONGTITUDE", "ROTATION"];
var datumCoordnate, transDatumCoordnate, minusInfo;
var context;
var buildingPOIObj = null;	//건물 POI
var outdoorPOIs = null, outdoorPOIVec = null;
var indoorPOIs = null, indoorPOIVec = null;
var unClickSize = 0.4, clickSize = 1.0;
var prjInfo = null;
/**
 * 5179 프로젝션 등록
 */
proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs");
var proj_5179 = new ol.proj.Projection({
    code : "EPSG:5179"
});

/**
 * 지도 타입 선택 이벤트
 */
$(function(){
	$('#mapTypeSelect').change(function () {
		var selected = $('#mapTypeSelect option:selected').val();
		changeMapType(map, seoulKey, selected);
	});	
})

function mapResize(){
	map.updateSize(); 
}

/**
 * 레이어 기준점 이동
 * @param geoJson
 * @param transInfo
 * @param datumCoord
 */
function transGeometry(geoJson, transInfo, datumCoord){
	if (typeof(transInfo) === 'undefined') {
		return 0;
	}
	for(var j =0; j<geoJson.length; j++){
		geoJson[j].getGeometry().translate(transInfo[0], transInfo[1]);
		geoJson[j].getGeometry().rotate(transInfo[2], datumCoord);
	}
}
/**
 * 객체 색상 
 * @param obj
 * @param type
 * @returns {String}
 */
function selectColor(obj, type){
	var result = null;
	if (obj == objsName[0]){ //wall
		(type == 'stroke'? result ="#000000" : result = "rgba(0, 0, 0, 0.8)");
	} else if (obj == objsName[1]){ //space
		(type == 'stroke'? result ="#C0C0C0" : result = "rgba(192, 192, 192, 0.8)");
	} else if (obj == objsName[2]){ // column
		(type == 'stroke'? result ="#008080" : result = "rgba(0, 128, 128, 0.8)");
	}  else if (obj == objsName[3]){ //Door
		(type == 'stroke'? result ="#FF6347" : result = "rgba(255, 99, 71, 0.8)");
	}  else if (obj == objsName[4]){ //stair
		(type == 'stroke'? result ="#40e0d0" : result = "rgba(64, 224, 208, 0.8)");
	}  else if (obj == objsName[5]){ //Window
		(type == 'stroke'? result ="#F5DEB3" : result = "rgba(245, 222, 179, 0.8)");
	}  else if (obj == objsName[6]){ //Elevator
		(type == 'stroke'? result ="#4169E1" : result = "rgba(65, 105, 225, 0.8)");
	}  else if (obj == objsName[7]){ //Escalator
		(type == 'stroke'? result ="#ff80ff" : result = "rgba(255, 128, 255, 0.8)");
	} 
	return result;
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
function initSeoulMap(olObj, key, con){
	context = con;
	var korNorMap = seoulMapInfo.tileMapInfos.tileMapInfo[15];
	var tg = new ol.tilegrid.TileGrid({
	    origin : [korNorMap.originX, korNorMap.originY],
	    extent: [korNorMap.mbr.minx, korNorMap.mbr.miny, korNorMap.mbr.maxx, korNorMap.mbr.maxy],
	    resolutions: [128,64,32,16,8,4,2,1,0.5,0.25],
	    tileSize : [256, 256]
	});
	proj_5179.setDefaultTileGrid(tg);
	var mapUrlBase = 
		'http://map.seoul.go.kr/smgis/apps/mapsvr.do?cmd=getTileMap&key='  
		+ key 
		+ '&URL=';
	var xyz = new ol.source.XYZ({
        crossOrigin : 'Anonymous',
	    projection: proj_5179,
	    tileUrlFunction : function (coordinate, pixelRatio, projection) {
	        var url = mapUrlBase + korNorMap.url;
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
	
	var seoulKorMap = new ol.layer.Tile({
		title : 'seoulBaseMap',
	    source : xyz
	});
	
	var center = olObj.getView().getCenter();
	var zoom = olObj.getView().getZoom();
	var view = new ol.View({
        center: center,
        minZoom : 10,
        maxZoom : 23,
        zoom: zoom,
        extent : ol.proj.transformExtent(
                    [korNorMap.mbr.minx, korNorMap.mbr.miny, korNorMap.mbr.maxx, korNorMap.mbr.maxy],
                    "EPSG:5179", "EPSG:3857"), 
    });
	
	olObj.setView(view);
	olObj.addLayer(seoulKorMap);
}
/**
 * 
 * @param changeLon
 * @param changeLat
 * @param angle
 */
function calMinus(changeLon, changeLat, angle){
	
	if (correctionInfo !=null){
		datumCoordnate = ol.proj.fromLonLat([ 
				parseFloat(correctionInfo[correctionInfoArr[1]]), 
				parseFloat(correctionInfo[correctionInfoArr[0]]) ]);
		transDatumCoordnate = ol.proj.fromLonLat([ 
				parseFloat(changeLon), 
				parseFloat(changeLat) ]);
		minusInfo = new Array(3);
		minusInfo[0] = (transDatumCoordnate[0]) - datumCoordnate[0];
		minusInfo[1] = (transDatumCoordnate[1]) - datumCoordnate[1];
		minusInfo[2] = angle - correctionInfo[correctionInfoArr[2]];
		minusInfo[2] = -(Math.PI * (minusInfo[2]/180));
		
	}
}

/**
 * 층별 객체 새로 불러오기
 * 적용 가능한 View : geoJsonView / geoJsonCorrection
 * @param jsonArray
 * @param viewType
 * @param init
 */
function refreshfloorObjs(jsonArray, viewType, init){ 
	if (viewType ==='geoJsonView' || viewType === 'radioEvent'){
		var chkBox = $('input[name=chkObj]');
		chkBox.prop('disabled', true);
	}
	for (var i=0; i<vectorLayers.length; i++){
		map.removeLayer(vectorLayers[i]['olObj']);
	}
	vectorLayers = new Array();
	var tmpCollection = new Array();
	for (var i=0; i<jsonArray.length; i++){
		var obj = jsonArray[i]; 
		for (objKey in jsonArray[i]){
			if (objKey =='Facility' || objKey =='GuideLine'){
				continue;
			}
			if (objKey =='Elevator') {
				var searchEv = JSON.parse(jsonArray[i][objKey]);
				var cloneFeature = searchEv.features.slice();
				searchEv.features = [];
				for(var j=0; j<cloneFeature.length; j++){
					var begin = cloneFeature[j].properties.BeginFloor;
					var end = cloneFeature[j].properties.EndFloor;		
					if (Number(begin) <= Number(jsonArray.curFloor) && Number(jsonArray.curFloor) <= Number(end) ){
						searchEv.features.push(cloneFeature[j]);
					}			
				}
				if (searchEv.features.length == 0){
					continue;
				}
			}
			
			geojson = (new ol.format.GeoJSON({
				defaultDataProjection : ol.proj.get('EPSG:5179'),
				featureProjection : ol.proj.get('EPSG:3857')
				}))
			.readFeatures(JSON.parse(jsonArray[i][objKey]), {
				defaultDataProjection : ol.proj.get('EPSG:5179'),
				featureProjection : ol.proj.get('EPSG:3857')
			}); 
			var style = new ol.style.Style({
				stroke : new ol.style.Stroke({
					color : selectColor(objKey, 'stroke'),
					width : 1.5
				}),
				fill : new ol.style.Fill({
					color : selectColor(objKey, 'fill')
				})
			});
			transGeometry(geojson, minusInfo, transDatumCoordnate);
			
			tmpCollection = tmpCollection.concat(geojson);
		 	var geojsonSource = new ol.source.Vector({
				features : geojson
			});
			var vectorLayer = new ol.layer.Vector({
				title : objKey,
		        source: geojsonSource,
		        style: style
		    });
		    var obj = {
			    	name : objKey,
			    	olObj : vectorLayer
			}
			map.addLayer(vectorLayer);
		    vectorLayers.push(obj); 
		    if (viewType == 'geoJsonView') {
			    $('#' + objKey).prop('disabled', false);
			    $('#' + objKey).prop('checked', true);
		    }
		    if (objKey =='Space'){
		    	vectorLayer.setZIndex(3);
		    } else if (objKey =='Wall'){
		    	vectorLayer.setZIndex(4);	
		    } else if (objKey =='Column'){
		    	vectorLayer.setZIndex(5);
		    } else if (objKey =='Window'){
		    	vectorLayer.setZIndex(6);
		    } else if (objKey =='Stair'){
		    	vectorLayer.setZIndex(7);
		    } else if (objKey =='Door'){
		    	vectorLayer.setZIndex(8);
		    } else if (objKey =='Escalator'){
		    	vectorLayer.setZIndex(9);
		    } else {
		    	vectorLayer.setZIndex(9);
		    }
		}
	}
	
	if (viewType=='geoJsonCorrection'){
		collection = new ol.Collection(tmpCollection);
		select = new ol.interaction.Select({
			features : collection
		});
		translate = new ol.interaction.Translate({
			features : collection
		});
		rotate = new ol.interaction.RotateFeature({
			features : collection
		});	
	}

	if (init ==true){
		var obj = (typeof(vectorLayers[0]) !== 'undefined') ? 
				vectorLayers[0].olObj : null;
		var centerLon, centerLat;
		var coordinates;
		if (obj != null){
			var extent = obj.getSource().getExtent();
		    centerLon = (extent[0] + extent[2]) / 2;
		    centerLat = (extent[1] + extent[3]) / 2;
		    coordinates = [centerLon, centerLat];
		    
		} else {
			centerLon = parseFloat(jsonArray.longitude);
			centerLat = parseFloat(jsonArray.latitude);
		    coordinates = [centerLon, centerLat];
			coordinates = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
		}
		map.getView().setCenter(coordinates);
	    map.getView().setZoom(18);
	}
}
/**
 * 층별 레이어 시각화 인터페이스 (chkFloor)
 * @param floorInfo
 * @param floorDetailInfo
 */
function floorRadioInterface(floorDetailInfo, curfloor){
	var floorChk = $('#chkFloor');
	var firstFloor = '';
	floorChk.empty();
	
	for (key in floorDetailInfo){
		if (key == 'prjId' || key =='view'){
			continue;
		}
		var nameObjs = floorDetailInfo[key].split('_');
		var name = '';
		for (var j=0; j<nameObjs.length-1; j++){
			name += nameObjs[j];
			if (nameObjs.length-2 != j){
				name += '_';
			}
		}
		floorChk.prepend('<div class="radio-hover-bottom"><input type="radio" name="floorRadio" id="' + key + 
				'" data-prjId="' + floorDetailInfo.prjId + '" data-view="' + floorDetailInfo.view + '">' +
				'<label for="' + key + '">' + name + '</label></div>');
	} 
	if (typeof(curfloor) === 'undefined') {
		$('#' + firstFloor).prop('checked', true);
	} else {
		$('#' + curfloor).prop('checked', true);
	}
	
	$("#chkFloor").scrollTop($("#chkFloor")[0].scrollHeight);
	
}



/**
 * 현재 시간 받아오기 YYYY-MM-DD hh:mm
 * @returns {String}
 */
function getTimeStamp(){
	function leadingZeros(n, digits) {
		  var zero = '';
		  n = n.toString();

		  if (n.length < digits) {
		    for (i = 0; i < digits - n.length; i++)
		      zero += '0';
		  }
		  return zero + n;
		}
	
	var d = new Date();

	var s =
		leadingZeros(d.getFullYear(), 4) + '-' +
		leadingZeros(d.getMonth() + 1, 2) + '-' +
		leadingZeros(d.getDate(), 2) + ' ' +
		leadingZeros(d.getHours(), 2) + ':' +
		leadingZeros(d.getMinutes(), 2);
  return s;
}



/**
 * 실외 POI 시각화 스위치 
 */
function outdoorPOIVis(sw){
	outdoorPOIVec.setVisible(sw);
}

function searchIndoorFeature(type, id){
	if (type == 'indoor') {
		for(var i=0; i<indoorPOIs.length; i++){
			var featureId = indoorPOIs[i].get('title');
			if (id == featureId){
				return indoorPOIs[i];
			}
		}
	}
}
function searchOutdoorFeature(type, id){
	if (type == 'outdoor') {
		for(var i=0; i<outdoorPOIs.length; i++){
			var featureId = outdoorPOIs[i].get('opoiId');
			if (id == featureId){
				return outdoorPOIs[i];
			}
		}
	}
}

function timestampToDate(time){
	var date = new Date(time);
	var month = date.getMonth() + 1;
	var d = date.getDate();
	if (month < 10){
		month = '0' + month;
	}
	if (d < 10){
		d = '0' + d;
	}
	return date.getFullYear() + '-' + month + '-' + d;
}

function getVectorLayer(title){
	var layerArr = map.getLayers().getArray();
	
	for (var i=0; i<layerArr.length; i++){
		if (layerArr[i].get('title') == title) {
			return layerArr[i];
		}	
	}
	return null;
}
function createGeoJson(vector){
//	var geometry = vector.getSource().getFeatures()[0].getGeometry().getCoordinates();
	var features = vector.getSource().getFeatures()[0].clone();
	var trans = features.getGeometry().transform('EPSG:3857', 'EPSG:4326');
	var geometry = trans.getCoordinates();
	var geojson = {
	    type : "FeatureCollection",
	    features : []
	};
	var feature = {
	    type : "Feature",
	    properties : {
	   _id : "area"
	},
	geometry : {
		type : "Polygon",
		coordinates: geometry
		}
	};
	geojson.features.push(feature);
	return geojson;
}

function routeDataTransform(context, prjId, bldId, type){
	return 0;
	type = ( typeof(type) !== 'undefined') ? type : null;
	callback = ( typeof(callback) !== 'undefined') ? callback : null;
	var requestUrl = context + '/geojson/geoJsonFloorRequest.json?prjId=' + prjId + '&floorInfo=-2';
	$.ajax({
		url : requestUrl,
		success: function(data){
			var correctionInfo = JSON.parse(data.correctionInfo);
			var changeCorrectionInfo = JSON.parse(data.changeCorrectionInfo);
			var correctionVer = data.correctionVer;
			if (correctionInfo !=null){
				datumCoordnate = ol.proj.fromLonLat([ 
						parseFloat(correctionInfo[correctionInfoArr[1]]), 
						parseFloat(correctionInfo[correctionInfoArr[0]]) ]);
				transDatumCoordnate = ol.proj.fromLonLat([ 
						parseFloat(changeCorrectionInfo[correctionInfoArr[1]]), 
						parseFloat(changeCorrectionInfo[correctionInfoArr[0]]) ]);
				minusInfo = new Array(3);
				minusInfo[0] = (transDatumCoordnate[0]) - datumCoordnate[0];
				minusInfo[1] = (transDatumCoordnate[1]) - datumCoordnate[1];
				minusInfo[2] = changeCorrectionInfo[correctionInfoArr[2]] - correctionInfo[correctionInfoArr[2]];
				minusInfo[2] = -(minusInfo[2] * (Math.PI/180));
			}
			requestUrl = context + '/contentLinkerEnv/getList/routeInfoDetail.json';
			var requestObj = {
				bldId : bldId
			};
			$.ajax({
				url : requestUrl,
				data : requestObj,
				type : "GET",
				success: function(data){
					var data = data.result; 
					for (var i=0; i<data.length; i++){
						var routeSpatialList = data[i].routeSpatials;
						for (var j=0; j<routeSpatialList.length; j++){
							if (type == null){
								if (routeSpatialList[j].correctVer == correctionVer){
									continue;
								}
							}
							var geoJsonString =routeSpatialList[j].routeLineString;
							var geojson = (new ol.format.GeoJSON({
								defaultDataProjection : ol.proj.get('EPSG:4326'),
								featureProjection : ol.proj.get('EPSG:3857')
								}))
							.readFeatures(JSON.parse(geoJsonString), {
								defaultDataProjection : ol.proj.get('EPSG:4326'),
								featureProjection : ol.proj.get('EPSG:3857')
							});  
							transGeometry(geojson, minusInfo, transDatumCoordnate);
							var features = geojson[0].clone();
							var trans = features.getGeometry().transform('EPSG:3857', 'EPSG:4326');
							var geometry = trans.getCoordinates();
							var transGeoJson = {
							    type : "FeatureCollection",
							    features : []
							}; 
							var feature = {
							    type : "Feature",
							    properties : {
							    	_id : "route"
							    },
								geometry : {
									type : "LineString",
									coordinates: geometry
								}
							};
							transGeoJson.features.push(feature);
							var obj = {
								routeSpatialId : routeSpatialList[j].routeSpatialId,
								routeLineString : JSON.stringify(transGeoJson),	
								correctVer : correctionVer
							}; 
							requestUrl = context + '/contentLinkerEnv/update/routeSpatial.json';
							$.ajax({
								url : requestUrl,
								data : obj,
								type : "GET",
								success : function(res){
									
								},
								error: function(err){
									console.log(err);
								}
							});
							
						}
					}  
				},
				error: function(err){
					console.log(err);
				}
			});
		},
		error: function(err){
			console.log(err);
		}
	});
}


function dateFormatConfirm(val){
	var format = /^(19[7-9][0-9]|20\d{2})-(0[0-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
    if(!format.test(val))
    {
     return false;
    }
    return true;
}
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

(function (window) {

  // Stores past URLs that failed to load. Used for a quick lookup
  // and because `onerror` is not triggered in some browsers
  // if the response is cached.
  var errors = {};

  // Check the existence of an image file at `url` by creating a
  // temporary Image element. The `success` callback is called
  // if the image loads correctly or the image is already complete.
  // The `failure` callback is called if the image fails to load
  // or has failed to load in the past.
  window.checkImage = function (url, success, failure) {
    var img = new Image(),    // the 
        loaded = false,
        errored = false;

    // Run only once, when `loaded` is false. If `success` is a
    // function, it is called with `img` as the context.
    img.onload = function () {
      if (loaded) {
        return;
      }

      loaded = true;

      if (success && success.call) {
        success.call(img);
      }
    };

    // Run only once, when `errored` is false. If `failure` is a
    // function, it is called with `img` as the context.
    img.onerror = function () {
      if (errored) {
        return;
      }

      errors[url] = errored = true;

      if (failure && failure.call) {
        failure.call(img);
      }
    };

    // If `url` is in the `errors` object, trigger the `onerror`
    // callback.
    if (errors[url]) {
      img.onerror.call(img);
      return;
    }
    
    // Set the img src to trigger loading
    img.src = url;

    // If the image is already complete (i.e. cached), trigger the
    // `onload` callback.
    if (img.complete) {
      img.onload.call(img);
    }
  };

})(this);