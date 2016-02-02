/**
 * raphael.pan-zoom plugin 0.2.1
 * Copyright (c) 2012 @author Juan S. Escobar
 * https://github.com/escobar5
 *
 * licensed under the MIT license
 */
 
(function () {
    'use strict';
    /*jslint browser: true*/
    /*global Raphael, $*/
    
    function findPos(obj) {
        var posX = obj.offsetLeft, posY = obj.offsetTop, posArray;
        while (obj.offsetParent) {
            if (obj === document.getElementsByTagName('body')[0]) {
                break;
            } else {
                posX = posX + obj.offsetParent.offsetLeft;
                posY = posY + obj.offsetParent.offsetTop;
                obj = obj.offsetParent;
            }
        }
        posArray = [posX, posY];
        return posArray;
    }
    
    function getRelativePositions(e, obj) {
        var points = [], i;

        if (e.changedTouches) {
            var touches = e.changedTouches;

            if (!touches) {
                var evt = e.originalEvent;
                touches = evt.changedTouches;
            }

            if (touches && touches.length) {
                for (i = 0; i < touches.length; i++) {
                    points.push({
                        x: touches[i].pageX,
                        y: touches[i].pageY
                    });
                }
            }
        } else if (e.pageX) {
            points.push({
                x: e.pageX,
                y: e.pageY
            });
        }

        if (!points.length) {
            return [
                {
                    x: e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
                    y: e.clientY + document.body.scrollTop + document.documentElement.scrollTop
                }
            ];
        }

        var pos = findPos(obj);
        
        for (i = 0; i < points.length; i++) {
            points[i].x -= pos[0];
            points[i].y -= pos[1];
        }

        return points;
    }

    var panZoomFunctions = {
        enable: function () {
            this.enabled = true;
        },

        disable: function () {
            this.enabled = false;
        },

        zoomIn: function (steps) {
            this.applyZoom(steps);
        },

        zoomOut: function (steps) {
            this.applyZoom(steps > 0 ? steps * -1 : steps);
        },

        setZoom: function(steps) {
            this.currZoom = steps;
            this.repaint();
        },

        pan: function (deltaX, deltaY) {
            this.applyPan(deltaX * -1, deltaY * -1);
        },

        isDragging: function () {
            return this.dragTime > this.dragThreshold;
        },

        getCurrentPosition: function () {
            return this.currPos;
        },

        getCurrentZoom: function () {
            return this.currZoom;
        }
    },

        PanZoom = function (el, options) {
            var paper = el,
                container = paper.canvas.parentNode,
                me = this,
                settings = {},
                initialPos = { x: 0, y: 0 },
                deltaX = 0,
                deltaY = 0,
                mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";

            this.enabled = false;
            this.dragThreshold = 5;
            this.dragTime = 0;
    
            options = options || {};
    
            settings.maxZoom = options.maxZoom || 9;
            settings.minZoom = options.minZoom || 0;
            settings.zoomStep = options.zoomStep || 0.1;
            settings.initialZoom = options.initialZoom || 0;
            settings.initialPosition = options.initialPosition || { x: 0, y: 0 };
            settings.rightMargin = options.rightMargin || 0;
            settings.bottomMargin = options.bottomMargin || 0;
            settings.containerW = container.offsetWidth;
            settings.containerH = container.offsetHeight;
            settings.callback = options.callback || null;

            this.set = function(key, value) {
                settings[key] = value;
            }

            this.get = function (key) {
                return settings[key];
            }

            this.currZoom = settings.initialZoom;
            this.currPos = settings.initialPosition;
            
            function repaint() {
                me.currPos.x = me.currPos.x + deltaX;
                me.currPos.y = me.currPos.y + deltaY;
    
                var zoomFactor = (1 - (me.currZoom * settings.zoomStep)),
                    newWidth = paper.width * zoomFactor,
                    newHeight = paper.height * zoomFactor,
                    visibleWidth = paper.width / zoomFactor,
                    visibleHeight = paper.height / zoomFactor,
                    widthDiff = (visibleWidth - settings.containerW) * zoomFactor + settings.rightMargin,
                    heightDiff = (visibleHeight - settings.containerH) * zoomFactor + settings.bottomMargin,
                    minWLimit = widthDiff < 0 ? widthDiff : 0,
                    minHLimit = heightDiff < 0 ? heightDiff : 0;
                
                if (me.currPos.x < minWLimit) {
                    me.currPos.x = minWLimit;
                } else if (me.currPos.x > widthDiff) {
                    me.currPos.x = widthDiff;
                }

                if (me.currPos.y < minHLimit) {
                    me.currPos.y = minHLimit;
                } else if (me.currPos.y > heightDiff) {
                    me.currPos.y = heightDiff;
                }
                paper.setViewBox(me.currPos.x, me.currPos.y, newWidth, newHeight);

                settings.callback && settings.callback();
            }
            
            this.repaint = repaint;
            
            function centerOn(x, y, zoom) {
                me.currZoom = zoom;

                var zoomFactor = (1 - (me.currZoom * settings.zoomStep));

                var newX = x - (settings.containerW / 2) * zoomFactor;
                me.currPos.x = newX;

                var newY = y - (settings.containerH / 2) * zoomFactor;
                me.currPos.y = newY;

                repaint();
            }

            this.centerOn = centerOn;

            this.getZoomFactor = function() {
                return (1 - (me.currZoom * settings.zoomStep));
            },

            //get CSS coordinates of a point on the SVG canvas
            this.translateToCssCoordinates = function(point) {
                var zoomFactor = (1 - (me.currZoom * settings.zoomStep)),
                    rect = paper.canvas.getBoundingClientRect();
                return {
                    x: (point.x - me.currPos.x) / zoomFactor + rect.left,
                    y: (point.y - me.currPos.y) / zoomFactor + rect.top
                };
            }
                        

            
            function applyZoom(val, centerPoint) {
                if (!me.enabled) {
                    return false;
                }

                me.currZoom += val;

                if (me.currZoom < settings.minZoom) {
                    me.currZoom = settings.minZoom;
                } else if (me.currZoom > settings.maxZoom) {
                    me.currZoom = settings.maxZoom;
                } else {
                    centerPoint = centerPoint || { x: settings.containerW / 2, y: settings.containerH / 2 };

                    deltaX = ((paper.width * settings.zoomStep) * (centerPoint.x / paper.width)) * val;
                    deltaY = (paper.height * settings.zoomStep) * (centerPoint.y / paper.height) * val;

                    repaint();
                }
            }

            this.applyZoom = applyZoom;

            var touchCoordDistance = null,
                pinchCenter = null,
                pinching = false;

            function dragging(e) {
                if (!me.enabled) {
                    return false;
                }

                var evt = window.event || e,
                    zoomFactor = 1 - (me.currZoom * settings.zoomStep),
                    points = getRelativePositions(evt, container),
                    newPoint = points[0];

                if (points.length === 2) {
                    //two point gesture
                    pinching = true;

                    var p1 = points[0],
                        p2 = points[1],
                        a = p1.x - p2.x,
                        b = p1.y - p2.y,
                        newDistance = Math.sqrt(a * a + b * b);

                    if (touchCoordDistance == null) {
                        touchCoordDistance = newDistance;
                        return false;
                    }

                    var delta;

                    var diff = (touchCoordDistance - newDistance);

                    if (pinchCenter == null) {
                        var cx = p1.x + p2.x / 2,
                            cy = p1.y + p2.y / 2;

                        pinchCenter = {
                            x: cx,
                            y: cy
                        };
                    }

                    if (diff > 3) {
                        touchCoordDistance = newDistance;
                        delta = -1;
                        applyZoom(delta, pinchCenter);
                    } else if (diff < -3) {
                        touchCoordDistance = newDistance;
                        delta = 1;
                        applyZoom(delta, pinchCenter);
                    }

                    return false;
                }
                
                if (pinching) {
                    return false;
                }
                
                deltaX = (newPoint.x - initialPos.x) * zoomFactor * -1;
                deltaY = (newPoint.y - initialPos.y) * zoomFactor * -1;

                initialPos = newPoint;

                repaint();
                me.dragTime += 1;
                if (evt.preventDefault) {
                    evt.preventDefault();
                } else {
                    evt.returnValue = false;
                }
                return false;
            }
            
            function handleScroll(e) {
                if (!me.enabled) {
                    return false;
                }
                var evt = window.event || e,
                    delta = evt.detail || evt.wheelDelta * -1,
                    zoomCenter = getRelativePositions(evt, container)[0];
    
                if (delta > 0) {
                    delta = -1;
                } else if (delta < 0) {
                    delta = 1;
                }
                
                applyZoom(delta, zoomCenter);
                if (evt.preventDefault) {
                    evt.preventDefault();
                } else {
                    evt.returnValue = false;
                }
                return false;
            }

            this.handleScroll = handleScroll;

            repaint();
    
            var mousedown = function(e) {
                var evt = window.event || e;
                if (!me.enabled) {
                    return false;
                }

                me.dragTime = 0;
                initialPos = getRelativePositions(evt, container)[0];
                container.className += " grabbing";

                container.onmousemove = dragging;
                $ && $(container).on('touchmove', dragging);

                document.onmousemove = function () { return false; };
                $ && $(document).on('touchmove', function () { return false; });

                if (evt.preventDefault) {
                    evt.preventDefault();
                } else {
                    evt.returnValue = false;
                }

                return false;
            };

            var mouseup = function (e) {
                pinching = false;
                touchCoordDistance = null;
                pinchCenter = null;

                //Remove class framework independent
                document.onmousemove = null;
                $ && $(document).off('touchmove');

                container.className = container.className.replace(/(?:^|\s)grabbing(?!\S)/g, '');

                container.onmousemove = null;
                $ && $(container).off('touchmove');
            };

            $ && $(container).on('touchstart', mousedown);
            container.onmousedown = mousedown;

            container.onmouseup = mouseup;
            $ && $(container).on('touchend', mouseup);

            if (container.attachEvent) {//if IE (and Opera depending on user setting)
                container.attachEvent("on" + mousewheelevt, handleScroll);
            } else if (container.addEventListener) {//WC3 browsers
                container.addEventListener(mousewheelevt, handleScroll, false);
            }
            
            function applyPan(dX, dY) {
                deltaX = dX;
                deltaY = dY;
                repaint();
            }
            
            this.applyPan = applyPan;
        };

    PanZoom.prototype = panZoomFunctions;

    Raphael.fn.panzoom = {};

    Raphael.fn.panzoom = function (options) {
        var paper = this;
        return new PanZoom(paper, options);
    };

}());
