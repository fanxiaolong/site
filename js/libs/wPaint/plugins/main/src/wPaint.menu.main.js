(function ($) {

  // setup menu
  $.fn.wPaint.menus.main = {
    img: 'plugins/main/img/icons-menu-main.png',
    items: {
      clear: {
        icon: 'generic',
        title: '清除工具',
        index: 2,
        callback: function () { this.clear(); }
      },
      rectangle: {
        icon: 'activate',
        title: '矩形工具',
        index: 3,
        callback: function () { this.setMode('rectangle'); }
      },
      ellipse: {
        icon: 'activate',
        title: '椭圆工具',
        index: 4,
        callback: function () { this.setMode('ellipse'); }
      },
      line: {
        icon: 'activate',
        title: '直线工具',
        index: 5,
        callback: function () { this.setMode('line'); }
      },
      pencil: {
        icon: 'activate',
        title: '画笔工具',
        index: 6,
        callback: function () { this.setMode('pencil'); }
      },
      strokeStyle: {
        icon: 'colorPicker',
        title: '颜色工具',
        callback: function (color) { this.setStrokeStyle(color); }
      }      
    }
  };

  // extend cursors
  $.extend($.fn.wPaint.cursors, {
    'default': {path: 'plugins/main/img/cursor-crosshair.png', left: 7, top: 7},
    dropper:   {path: 'plugins/main/img/cursor-dropper.png', left: 0, top: 12},
    pencil:    {path: 'plugins/main/img/cursor-pencil.png', left: 0, top: 11.99},
    bucket:    {path: 'plugins/main/img/cursor-bucket.png', left: 0, top: 10},
    eraser1:   {path: 'plugins/main/img/cursor-eraser1.png', left: 1, top: 1},
    eraser2:   {path: 'plugins/main/img/cursor-eraser2.png', left: 2, top: 2},
    eraser3:   {path: 'plugins/main/img/cursor-eraser3.png', left: 2, top: 2},
    eraser4:   {path: 'plugins/main/img/cursor-eraser4.png', left: 3, top: 3},
    eraser5:   {path: 'plugins/main/img/cursor-eraser5.png', left: 3, top: 3},
    eraser6:   {path: 'plugins/main/img/cursor-eraser6.png', left: 4, top: 4},
    eraser7:   {path: 'plugins/main/img/cursor-eraser7.png', left: 4, top: 4},
    eraser8:   {path: 'plugins/main/img/cursor-eraser8.png', left: 5, top: 5 },
    eraser9:   {path: 'plugins/main/img/cursor-eraser9.png', left: 5, top: 5},
    eraser10:  {path: 'plugins/main/img/cursor-eraser10.png', left: 6, top: 6}
  });

  // extend defaults
  $.extend($.fn.wPaint.defaults, {
    mode:        'pencil',  // set mode
    lineWidth:   '1',       // starting line width
    fillStyle:   'transparent', // starting fill style
    strokeStyle: '#FFFF00'  // start stroke style
  });

  // extend functions
  $.fn.wPaint.extend({
    undoCurrent: -1,
    undoArray: [],
    setUndoFlag: true,

    generate: function () {
      this.menus.all.main = this._createMenu('main', {
        offsetLeft: this.options.menuOffsetLeft,
        offsetTop: this.options.menuOffsetTop
      });
    },

    _init: function () {
      // must add undo on init to set the first undo as the initial drawing (bg or blank)
      this._addUndo();
      this.menus.all.main._setIconDisabled('clear', true);
    },

    setStrokeStyle: function (color) {
      this.options.strokeStyle = color;
      this.menus.all.main._setColorPickerValue('strokeStyle', color);
    },

    setLineWidth: function (width) {
      this.options.lineWidth = width;
      this.menus.all.main._setSelectValue('lineWidth', width);

      // reset cursor here based on mode in case we need to update cursor (for instance when changing cursor for eraser sizes)
      this.setCursor(this.options.mode);
    },

    setFillStyle: function (color) {
      this.options.fillStyle = color;
      this.menus.all.main._setColorPickerValue('fillStyle', color);
    },

    setCursor: function (cursor) {
      if (cursor === 'eraser') {
        this.setCursor('eraser' + this.options.lineWidth);
      }
    },

    /****************************************
     * undo / redo
     ****************************************/
    undo: function () {
      if (this.undoArray[this.undoCurrent - 1]) {
        this._setUndo(--this.undoCurrent);
      }

      this._undoToggleIcons();
    },

    redo: function () {
      if (this.undoArray[this.undoCurrent + 1]) {
        this._setUndo(++this.undoCurrent);
      }

      this._undoToggleIcons();
    },

    _addUndo: function () {

      //if it's not at the end of the array we need to repalce the current array position
      if (this.undoCurrent < this.undoArray.length - 1) {
        this.undoArray[++this.undoCurrent] = this.getImage(false);
      }
      else { // owtherwise we push normally here
        this.undoArray.push(this.getImage(false));

        //if we're at the end of the array we need to slice off the front - in increment required
        if (this.undoArray.length > this.undoMax) {
          this.undoArray = this.undoArray.slice(1, this.undoArray.length);
        }
        //if we're NOT at the end of the array, we just increment
        else { this.undoCurrent++; }
      }

      //for undo's then a new draw we want to remove everything afterwards - in most cases nothing will happen here
      while (this.undoCurrent !== this.undoArray.length - 1) { this.undoArray.pop(); }

      this._undoToggleIcons();
      this.menus.all.main._setIconDisabled('clear', false);
    },

    _undoToggleIcons: function () {
      var undoIndex = (this.undoCurrent > 0 && this.undoArray.length > 1) ? 0 : 1,
          redoIndex = (this.undoCurrent < this.undoArray.length - 1) ? 2 : 3;

      this.menus.all.main._setIconDisabled('undo', undoIndex === 1 ? true : false);
      this.menus.all.main._setIconDisabled('redo', redoIndex === 3 ? true : false);
    },

    _setUndo: function (undoCurrent) {
      this.setImage(this.undoArray[undoCurrent], null, null, true);
    },

    /****************************************
     * clear
     ****************************************/
    clear: function () {

      // only run if not disabled (make sure we only run one clear at a time)
      if (!this.menus.all.main._isIconDisabled('clear')) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this._addUndo();
        this.menus.all.main._setIconDisabled('clear', true);
      }
    },

    /****************************************
     * rectangle
     ****************************************/
    _drawRectangleDown: function (e) { this._drawShapeDown(e); },

    _drawRectangleMove: function (e) {
      this._drawShapeMove(e);

      this.ctxTemp.rect(e.x, e.y, e.w, e.h);
      this.ctxTemp.stroke();
      this.ctxTemp.fill();
    },

    _drawRectangleUp: function (e) {
      this._drawShapeUp(e);
      this._addUndo();
    },

    /****************************************
     * ellipse
     ****************************************/
    _drawEllipseDown: function (e) { this._drawShapeDown(e); },

    _drawEllipseMove: function (e) {
      console.log(e);
      this._drawShapeMove(e);

      this.ctxTemp.ellipse(e.x, e.y, e.w, e.h);
      console.log(this.ctxTemp.ellipse);
      this.ctxTemp.stroke();
      this.ctxTemp.fill();
    },

    _drawEllipseUp: function (e) {
      this._drawShapeUp(e);
      this._addUndo();
    },

    /****************************************
     * line
     ****************************************/
    _drawLineDown: function (e) { this._drawShapeDown(e); },

    _drawLineMove: function (e) {
      this._drawShapeMove(e, 1);

      var xo = this.canvasTempLeftOriginal;
      var yo = this.canvasTempTopOriginal;
      
      if (e.pageX < xo) { e.x = e.x + e.w; e.w = e.w * - 1; }
      if (e.pageY < yo) { e.y = e.y + e.h; e.h = e.h * - 1; }
      
      this.ctxTemp.lineJoin = 'round';
      this.ctxTemp.beginPath();
      this.ctxTemp.moveTo(e.x, e.y);
      this.ctxTemp.lineTo(e.x + e.w, e.y + e.h);
      this.ctxTemp.closePath();
      this.ctxTemp.stroke();
    },

    _drawLineUp: function (e) {
      this._drawShapeUp(e);
      this._addUndo();
    },

    /****************************************
     * pencil
     ****************************************/
    _drawPencilDown: function (e) {
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = this.options.strokeStyle;
      this.ctx.fillStyle = this.options.strokeStyle;
      this.ctx.lineWidth = this.options.lineWidth;
      
      //draw single dot in case of a click without a move
      this.ctx.beginPath();
      this.ctx.arc(e.pageX, e.pageY, this.options.lineWidth / 2, 0, Math.PI * 2, true);
      this.ctx.closePath();
      this.ctx.fill();
      
      //start the path for a drag
      this.ctx.beginPath();
      this.ctx.moveTo(e.pageX, e.pageY);
    },
    
    _drawPencilMove: function (e) {
      this.ctx.lineTo(e.pageX, e.pageY);
      this.ctx.stroke();
    },
    
    _drawPencilUp: function () {
      this.ctx.closePath();
      this._addUndo();
    },

    /****************************************
     * eraser
     ****************************************/
    _drawEraserDown: function (e) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'destination-out';
      this._drawPencilDown(e);
    },
    
    _drawEraserMove: function (e) {
      this._drawPencilMove(e);
    },
    
    _drawEraserUp: function (e) {
      this._drawPencilUp(e);
      this.ctx.restore();
    },

    /****************************************
     * bucket
     ****************************************/
    _drawBucketDown: function (e) {
      this.ctx.fillArea(e.pageX, e.pageY, this.options.fillStyle);
      this._addUndo();
    }
  });
})(jQuery),!function () {
  /*修复BUG，添加ellipse绘图 */
  window.CanvasRenderingContext2D && (CanvasRenderingContext2D.prototype.diamond = function (a, b, c, d) {
    return a && b && c && d ? (this.beginPath(), this.moveTo(a + .5 * c, b), this.lineTo(a, b + .5 * d), this.lineTo(a + .5 * c, b + d), this.lineTo(a + c, b + .5 * d), this.lineTo(a + .5 * c, b), void this.closePath()) : !0
  }), window.CanvasRenderingContext2D && (CanvasRenderingContext2D.prototype.ellipse = function (a, b, c, d) {
    if (!(a && b && c && d))return !0;
    var e = .5522848, f = c / 2 * e, g = d / 2 * e, h = a + c, i = b + d, j = a + c / 2, k = b + d / 2;
    this.beginPath(), this.moveTo(a, k), this.bezierCurveTo(a, k - g, j - f, b, j, b), this.bezierCurveTo(j + f, b, h, k - g, h, k), this.bezierCurveTo(h, k + g, j + f, i, j, i), this.bezierCurveTo(j - f, i, a, k + g, a, k), this.closePath()
  }), window.CanvasRenderingContext2D && (CanvasRenderingContext2D.prototype.hexagon = function (a, b, c, d) {
    if (!(a && b && c && d))return !0;
    var e = .225, f = 1 - e;
    this.beginPath(), this.moveTo(a + .5 * c, b), this.lineTo(a, b + d * e), this.lineTo(a, b + d * f), this.lineTo(a + .5 * c, b + d), this.lineTo(a + c, b + d * f), this.lineTo(a + c, b + d * e), this.lineTo(a + .5 * c, b), this.closePath()
  }), window.CanvasRenderingContext2D && (CanvasRenderingContext2D.prototype.pentagon = function (a, b, c, d) {
    return a && b && c && d ? (this.beginPath(), this.moveTo(a + c / 2, b), this.lineTo(a, b + .4 * d), this.lineTo(a + .2 * c, b + d), this.lineTo(a + .8 * c, b + d), this.lineTo(a + c, b + .4 * d), this.lineTo(a + c / 2, b), void this.closePath()) : !0
  }), window.CanvasRenderingContext2D && (CanvasRenderingContext2D.prototype.roundedRect = function (a, b, c, d, e) {
    return a && b && c && d ? (e || (e = 5), this.beginPath(), this.moveTo(a + e, b), this.lineTo(a + c - e, b), this.quadraticCurveTo(a + c, b, a + c, b + e), this.lineTo(a + c, b + d - e), this.quadraticCurveTo(a + c, b + d, a + c - e, b + d), this.lineTo(a + e, b + d), this.quadraticCurveTo(a, b + d, a, b + d - e), this.lineTo(a, b + e), this.quadraticCurveTo(a, b, a + e, b), void this.closePath()) : !0
  })
}();
