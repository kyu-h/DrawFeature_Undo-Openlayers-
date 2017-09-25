var ProcessArea = (function (ProcessArea, ol) {
    'use strict';
    var mode = 'square'; // polygon or square of select
    var map = null, destmap = null, visiable_sw = true, destmap_visual_sw = false;
    var vector = null, source = null, draw_interaction = null;
    var area_values = {
        limit : 800000000000000, //
        area : 0.0,		// m^2 
        area_string : '0 km<sup>2</sup>'
    };
    var polygon_style = {
        text_font : '0.6em Malgun Gothic',
        text_color : [50, 50, 50, 1],
        fill_color: 'rgba(255, 255, 255, 0.5)',
        stroke_color : '#185E99',
        stroke_width : 2.5,
        title: '처리영역'
        //img_src : '/static/images/kariCI.png'
    };
    var result_data = {
        extent: null,
        geometry: null
    };
    var click_count = 0, single_click_timer = null;
    var geom_polygon_coordinates = [];
    var drawing_style = {
        circle_fill_color: '#185EFF',
        fill_color: 'rgba(255, 255, 255, 0.5)',
        radius: 5,
        stroke_color : 'rgba(255, 0, 0, 0.0)',
        stroke_width : 2
    };
    var destmapClickEvent = function (e) {
        var coord = e.coordinate;
        if (vector !== null) {
            map.removeLayer(vector);
            if (destmap !== null) {
                destmap.removeLayer(vector);
            }
            vector = null;
        }
        squareDraw(coord);
    };
    var areaClickEvent =  function (e) {
        function singleClickDraw() {
            var coord = e.coordinate;
            if (vector !== null) {
                map.removeLayer(vector);
                if (destmap !== null) {
                    destmap.removeLayer(vector);
                }
                vector = null;
            }
            squareDraw(coord);
        }
        click_count += 1;
        if (click_count === 1) {
            single_click_timer = setTimeout(function () {
                click_count = 0;
                singleClickDraw();
            }, 250);
        } else if (click_count === 2) {
            clearTimeout(single_click_timer);
            click_count = 0;
            return -1;
        }
    };
    var changeArea = function (param) {
        var cal_area = (area_values.area) / 2;
        var centerCoords = null;
        var geometry = vector.getSource().getFeatures()[0].getGeometry();
        centerCoords = geometry.getCoordinates();        
        map.removeLayer(vector);
        if (destmap !== null) {
            destmap.removeLayer(vector);
        }
        vector = null;
        area_values.area = param;
        area_values.area_string = ((area_values.area * area_values.area) / 1000000) + ' ' + 'km<sup>2</sup>';
        if (area_values.area !== 5000) {
        	area_values.area_string = '&nbsp;' + area_values.area_string;
        }
        return centerCoords;
    };
    var calculationArea = function (polygon) {
    	var wgs84Sphere = new ol.Sphere(6378137);
    	var sourceProj = map.getView().getProjection();
    	var geom = /** @type {ol.geom.Polygon} */(polygon.clone().transform(
              sourceProj, 'EPSG:4326'));
    	var coordinates = geom.getLinearRing(0).getCoordinates();
    	var local_area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
    	
    	area_values.area = (Math.round(local_area * 100) / 100);
    	area_values.area_string = (Math.round(local_area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
    };
    var refreshSource = function () {
        source.clear();
        var geom = new ol.geom.Polygon([geom_polygon_coordinates]);
        var feature = new ol.Feature(geom);
        source.addFeature(feature);
        result_data.geometry =  geom_polygon_coordinates;
        result_data.extent = feature.getGeometry().getExtent();
        calculationArea(geom);
    }
    var polygonClickEvent = function (e) {
        geom_polygon_coordinates.splice(geom_polygon_coordinates.length - 1, 1);
        geom_polygon_coordinates.push(e.coordinate);
        geom_polygon_coordinates.push(geom_polygon_coordinates[0]);
        refreshSource();
    };
    var modifyEndEvent = function (evt) {
        var feature = evt.features.getArray()[0];
        var modeify_feature_coords = feature.getGeometry().getCoordinates();
        geom_polygon_coordinates = modeify_feature_coords[0];
        refreshSource();
    };
    var switchInteraction = function (sw) {
        if (mode === 'polygon' || mode === 'free') {
            if (sw === true) {
                map.addInteraction(draw_interaction);
                draw_interaction.on('modifyend', modifyEndEvent);
                map.on('click', polygonClickEvent); 
                if (destmap !== null && destmap_visual_sw === true) {
                    destmap.addInteraction(draw_interaction);
                    destmap.on('click', polygonClickEvent);
                }
            } else {
                draw_interaction.un('modifyend', modifyEndEvent, this);
                map.removeInteraction(draw_interaction);
                map.un('click', polygonClickEvent, this);
                if (destmap !== null && destmap_visual_sw === true) {
                    destmap.removeInteraction(draw_interaction);
                    destmap.un('click', polygonClickEvent, this);
                }
            }    
        } else if (mode === 'square') {
            if (sw === true) {
            	draw_interaction = new Drag();
                map.addInteraction(draw_interaction);
                map.on('click', areaClickEvent);
                if (destmap !== null) {
                    destmap.addInteraction(draw_interaction);
                    destmap.on('click', destmapClickEvent);
                }
            } else {
                map.removeInteraction(draw_interaction);
                map.un('click', areaClickEvent, this);
                if (destmap !== null) {
                    destmap.removeInteraction(draw_interaction);
                    destmap.un('click', destmapClickEvent, this);
                }
                draw_interaction = null;
            }
        }
    }
    var visiableEvent = function (modeChange) {
        vector.setVisible(visiable_sw);
        switchInteraction(visiable_sw);
    };
    var centerToLeftRight = function (coord) {
    	var cal_area = area_values.area / 2;
        var lowerLeft = [coord[0] - cal_area, coord[1] - cal_area];
        var upperRight = [coord[0] + cal_area, coord[1] + cal_area];
        result_data.extent = [coord[0] - cal_area, coord[1] - cal_area, coord[0] + cal_area, coord[1] + cal_area];
        return [[upperRight[0], upperRight[1]],
                [lowerLeft[0], upperRight[1]],
                [lowerLeft[0], lowerLeft[1]],
                [upperRight[0], lowerLeft[1]],
                [upperRight[0], upperRight[1]]];
    };
    var squareDraw = function (coord) {
        function styleSetting (feature, resolution) {
            var zoom = map.getView().getZoom();
            var text_scale = zoom / Math.sqrt(resolution);
            var total_style;
            if (area_values.area === 3000) {
            	polygon_style.title = (resolution > 150) ? '' : polygon_style.title;
                text_scale = (text_scale) / 1.8;
                //image_scale = (image_scale) / 1.7;
            } else if (area_values.area === 2000) {
            	polygon_style.title = (resolution > 150) ? '' : polygon_style.title;
                text_scale = (text_scale) / 2.5;            	
                //image_scale = (image_scale) / 2.5;
            } else if (area_values.area === 1000) {
            	polygon_style.title = (resolution > 40) ? '' : polygon_style.title;
                text_scale = (text_scale) / 5.0;
               // image_scale = (image_scale) /l 5.0;
            }
            var fill_obj = new ol.style.Fill({
                color : polygon_style.fill_color
            });

            var storke_obj = new ol.style.Stroke({
                color : polygon_style.stroke_color,
                width : polygon_style.stroke_width
            });
            var text_obj = new ol.style.Text({
                font : polygon_style.text_font,
                text : polygon_style.title,
                scale : text_scale,
                fill : new ol.style.Fill({
                    color : polygon_style.text_color
                }),
                stroke : new ol.style.Stroke({
                    width : 1,
                    color : polygon_style.text_color
                })
            });
            total_style = new ol.style.Style({
                fill : fill_obj,
                stroke : storke_obj,
                text : text_obj
            });
            return total_style;
        };
        var xy = (typeof (coord) !== 'undefined') ? coord : map.getView().getCenter();
        var feature = [];
        var geom_polygon = new ol.geom.Polygon([centerToLeftRight(xy)]);        
        var geom_point = new ol.geom.Point([xy[0], xy[1]]);
        feature.push(new ol.Feature(geom_point));
        feature.push(new ol.Feature(geom_polygon));
        source = new ol.source.Vector({
            features : feature
        });
        vector = new ol.layer.Vector({
            source : source,
            style : function (feature, resolution) {
                var style = styleSetting(feature, resolution);
                return [style];
            }
        });
        map.addLayer(vector); 
        if (destmap !== null) {
            destmap.addLayer(vector);
        }
        if (draw_interaction === null) {
            draw_interaction = new Drag();
            visiableEvent();
        }
        result_data.geometry =  centerToLeftRight(xy);
    };
    var polygonDraw = function () {
        function styleSetting (feature, resolution) {
            if (area_values.limit < area_values.area || area_values.area === 0.0) {
                polygon_style.stroke_color = '#FF0000';
                polygon_style.fill_color = 'rgba(255, 0, 0, 0.2)';
            } else {
                polygon_style.stroke_color = '#185E99';
                polygon_style.fill_color = 'rgba(255, 255, 255, 0.5)';
            }
            var style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: polygon_style.fill_color
                }),
                stroke: new ol.style.Stroke({
                    color: polygon_style.stroke_color,
                    width: polygon_style.stroke_width
                })
            });
            var multi_point = new ol.style.Style({
                image: new ol.style.Circle({
                    radius : 5,
                    fill: new ol.style.Fill({
                        color: polygon_style.stroke_color
                    })
                }),
                geometry: function(feature){
                    var coords = feature.getGeometry().getCoordinates()[0];
                    return new ol.geom.Point(coords[coords.length-2]);
                } 
            });
            return [style, multi_point];
        }
        if (source === null){
            var collection = new ol.Collection();
            source = new ol.source.Vector({
                features : collection
            });
            vector = new ol.layer.Vector({
                source: source,
                style : styleSetting
            });
            map.addLayer(vector);
            if (destmap !== null) {
                destmap.addLayer(vector);
            }
            draw_interaction = new ol.interaction.Modify({
                features : source.getFeaturesCollection(),
                style : new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: polygon_style.fill_color
                    }),
                    stroke: new ol.style.Stroke({
                        color: polygon_style.stroke_color,
                        width: polygon_style.stroke_width
                    })
                })
            });
        }
        visiableEvent();
    };
    var cancelInteraction = function () {
        map.removeLayer(vector);
        if (destmap !== null) {
            destmap.removeLayer(vector);
        }
        if (mode === 'polygon' || mode === 'free') {
            geom_polygon_coordinates = [];
            draw_interaction.un('modifyend', modifyEndEvent, this);
            map.removeInteraction(draw_interaction);
            map.un('click', polygonClickEvent, this);
            if (destmap !== null) {
            	destmap.removeInteraction(draw_interaction);
                destmap.un('click', polygonClickEvent, this);
            }
        } else if (mode === 'square') {
            map.removeInteraction(draw_interaction);
            map.un('click', areaClickEvent, this);
            if (destmap !== null) {
            	destmap.removeInteraction(draw_interaction);
                destmap.un('click', destmapClickEvent, this);
            }
        }
        source = vector = draw_interaction = null;
        area_values.area = 0.0;
        area_values.area_string = '0 km<sup>2</sup>';
        result_data.extent = result_data.geometry = [];
        polygon_style.stroke_color = '#185E99';
        polygon_style.fill_color = 'rgba(255, 255, 255, 0.5)';
    };
    var registrationInteraction = function (init_area) {
        if (mode === 'polygon' || mode === 'free') {
            polygonDraw();
            if (visiable_sw === true) {
                map.on('click', polygonClickEvent);
                if (destmap !== null) {
                    destmap.on('click', polygonClickEvent);
                }
            }
        } else if (mode === 'square') {
            squareDraw();
            if (visiable_sw === true) {
                map.on('click', areaClickEvent);
                if (destmap !== null) {
                    destmap.on('click', destmapClickEvent);
                }
            }
        }
    };
    ProcessArea = function (map_local, destmap_local, mode_local) {
        destmap_local = (typeof (destmap_local) !== 'undefined') ? destmap_local : null;
        mode_local = (typeof (mode_local) !== 'undefined') ? mode_local : 'square';
        map = map_local;
        destmap = destmap_local;
        mode =mode_local;
        if (mode === 'square') {
            area_values.area = 5000;
            area_values.area_string = ((area_values.area * area_values.area) / 1000000) + ' ' + 'km<sup>2</sup>';
        }
        registrationInteraction();
    };
    ProcessArea.prototype = {
        constructor : ProcessArea,
        version : 3.0,
        getObject : function () {
        	if (vector != null){
        		return vector;
        	} else {
        		console.err('Vector is Null');
        		return -1;
        	}
        },
        setObject : function (obj) {
        	vector = obj;
        },
        getInteraction : function () {
        	return draw_interaction;
        },
        setAreaLimit : function (num) {
            area_values.limit = num;
        },
        getAreaLimit : function () {
            //return area_values.limit;
        	return area_values.limit;
        },
        getMode : function () {
        	return mode;
        },
        changeMode : function (mode_local, force) {
            force = (typeof (force) !== 'undefined') ? force : false;
            if (mode === mode_local && force === false) {
                return 0;
            }
            if (mode_local === 'select') {
                cancelInteraction();
                area_values.area = 0.0;
                area_values.area_string = '0 km<sup>2</sup>';
                mode = mode_local;
                return 0;
            }
          //  cancelInteraction();
            mode = mode_local;
            if (mode === 'polygon' || mode === 'free' || mode_local === 'free') {
                area_values.area = 0.0;
                area_values.area_string = '0 km<sup>2</sup>';
            } else if (mode === 'square') {
                area_values.area = 5000;
                area_values.area_string = '25 km<sup>2</sup>';
            }
            registrationInteraction();
        },
        changeArea : function (local_area) {
            if (mode !== 'square') {
                console.log("Not mode square");
                return -1;
            }
            var centerCoords = changeArea(local_area);
            squareDraw(centerCoords);
        },
        getMBR : function () {
        	if (mode === 'square'){
        		var geometry = vector.getSource().getFeatures()[0].getGeometry();
        		result_data.geometry = centerToLeftRight(geometry.getCoordinates());
        	}
            return result_data.extent;
        },
        getPolygonCoords : function () {
        	if (mode === 'square'){
        		var geometry = vector.getSource().getFeatures()[0].getGeometry();
        		result_data.geometry = centerToLeftRight(geometry.getCoordinates());
        	}
            return result_data.geometry;
        },
        getArea : function () {
        	if (mode === 'square'){
        		return (area_values.area*area_values.area) / 1000000;
        	}        	
        	return (area_values.area / 2) / 100;
        },
        getAreaString : function () {
            return area_values.area_string;
        },
        getGeoJson : function () {
          //var geometry = vector.getSource().getFeatures()[0].getGeometry().getCoordinates();
		  var trans = vector.getSource().getFeatures()[0].getGeometry().transform('EPSG:3857', 'EPSG:4326');
		  var geometry = trans.getCoordinates();
          if (mode === 'square') {
            geometry = [centerToLeftRight(geometry)].slice();
          }
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
        },
        setVisiable : function (sw) {
            visiable_sw = sw;
            visiableEvent(sw);
        },
        setDestMapBoolean : function (sw) {
        	destmap_visual_sw = sw;
        }
    };
    return ProcessArea;
}(window.ProcessArea || {}, ol));



var Drag = (function (Drag, ol) {
    'use strict';
    Drag = function () {
        ol.interaction.Pointer.call(this, {
            handleDownEvent : Drag.prototype.handleDownEvent,
            handleDragEvent : Drag.prototype.handleDragEvent,
            handleUpEvent   : Drag.prototype.handleUpEvent
        });
        this.coordinate = null;
        this.cursor = 'pointer';
        this.feature = null;
        this.previousCursor = undefined;
    };
    Drag.prototype = {
        constructor : Drag,
        version : 1.0
    };
    return Drag;
}(window.Drag || {}, ol));
ol.inherits(Drag, ol.interaction.Pointer);
Drag.prototype.handleDownEvent = function (event) {
    'use strict';
    var map, feature;
    map = event.map;
    feature =
        map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
            return layer;   //return feature
        });
    if (feature) {
        this.coordinate = event.coordinate;
        this.feature = feature;
    }
    return !!feature;
};
Drag.prototype.handleDragEvent = function (event) {
    'use strict';
    var map, feature, deltaX, deltaY, geometry, i;
    map = event.map;
    feature =
        map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
            return layer;   //return feature
        });
    deltaX = event.coordinate[0] - this.coordinate[0];
    deltaY = event.coordinate[1] - this.coordinate[1];
    geometry = (this.feature.getSource().getFeatures());
    for (i = 0; i < geometry.length; i += 1) {
        var obj = geometry[i].getGeometry();
        obj.translate(deltaX, deltaY);
    }
    this.coordinate[0] = event.coordinate[0];
    this.coordinate[1] = event.coordinate[1];
};
Drag.prototype.handleUpEvent = function () {
    'use strict';
    this.coordinate = null;
    this.feature = null;
    return false;
};