(function() {

  /*
  jQuery UI Dialog Extended v1.1alpha-pre
  
  Copyright 2011, Vitaly Rotari (Andrada Developer)
  http://andrada-dev.org
  */

  var $, createDialogElement, dialog;

  $ = this.jQuery;

  dialog = {
    elems: {},
    _init: function() {
      this._createMessageBox();
      if (this.options.autoOpen) return this.open();
    },
    _content: function() {
      if (!this.elems.hasOwnProperty("content") || !this.elems.content.length) {
        this.elems.content = this.uiDialog.find(".ui-dialog-content");
      }
      return this.elems.content;
    },
    _buttonsPane: function() {
      if (!this.elems.hasOwnProperty("buttonsPane") || !this.elems.buttonsPane.length) {
        this.elems.buttonsPane = this.uiDialog.find(".ui-dialog-buttonpane");
      }
      return this.elems.buttonsPane;
    },
    _buttons: function() {
      if (!this.elems.hasOwnProperty("buttons") || !this.elems.buttons.length) {
        this.elems.buttons = this._buttonsPane().find("button");
      }
      return this.elems.buttons;
    },
    _createButtons: function(buttons) {
      var button, buttonsPane, create, hasButtons;
      var _this = this;
      hasButtons = false;
      buttonsPane = $("<div></div>").addClass("ui-dialog-buttonpane ui-widget-content ui-helper-clearfix");
      this._buttonsPane().remove();
      create = function(name, fn) {
        var button, callback, customClass, options;
        customClass = null;
        options = {};
        if ($.type(fn) === "object") {
          callback = fn.callback || (fn.callback = $.noop);
          if (fn.hasOwnProperty("className")) {
            customClass = fn.className;
          } else if (fn.hasOwnProperty("class")) {
            customClass = fn["class"];
          }
          if ($.type(fn.icons) === "object") options.icons = fn.icons;
          if (fn.hasOwnProperty("disabled")) options.disabled = fn.disabled;
        } else {
          callback = fn;
        }
        button = $("<button type=\"button\"></button>").text(name).click(function() {
          return callback.apply(this.element[0], arguments);
        });
        if (customClass) button.addClass(customClass);
        if ($.fn.button) button.button(options);
        return button;
      };
      if ($.type(buttons) === "object") {
        $.each(buttons, function() {
          return !(hasButtons = true);
        });
      }
      if (hasButtons) {
        for (button in buttons) {
          create(button, buttons[button]).appendTo(buttonsPane);
        }
        buttonsPane.appendTo(this.uiDialog);
      }
      this.elems.buttonsPane = buttonsPane;
      return this;
    },
    _createMessageBox: function() {
      if (this.elems.hasOwnProperty("message")) return;
      this.elems.message = $("<div class=\"ui-dialog-message\">" + "<span class=\"ui-dialog-message-icon\"></span>" + "<span class=\"ui-icon ui-icon-close\"></span>" + "<ul></ul>" + "</div>");
      this.elems.message.on("click", ".ui-icon-close", {
        instance: this
      }, function(event) {
        event.preventDefault();
        return event.data.instance.messageClose();
      });
      return this._content().before(this.elems.message);
    },
    _makeDraggable: function() {
      var body, collapse, doc, filteredUi, heightBeforeDrag, instance, options;
      instance = this;
      options = this.options;
      body = $("body");
      doc = $(document);
      heightBeforeDrag = 0;
      filteredUi = function(ui) {
        return {
          position: ui.position,
          offset: ui.offset
        };
      };
      collapse = function(dialog, state) {
        var message;
        dialog = $(dialog);
        message = this.elems.message;
        if (state === true && message.is(":visible")) {
          message.attr("show-after-drag", "true").hide();
        } else if (state === false && message.attr("show-after-drag")) {
          message.removeAttr("show-after-drag").show();
        }
        if (state === false) {
          this._content().show();
          this._buttonsPane().show();
          dialog.find(".ui-resizable-handle").show();
        } else {
          this._content().hide();
          this._buttonsPane().hide();
          dialog.find(".ui-resizable-handle").hide();
        }
        return dialog.css({
          "height": "auto"
        });
      };
      return this.uiDialog.draggable({
        cancel: ".ui-dialog-content, .ui-dialog-titlebar-close",
        handle: ".ui-dialog-titlebar",
        containment: "document",
        start: function(event, ui) {
          var elem;
          elem = $(this);
          heightBeforeDrag = options.height !== "auto" ? elem.height() : "auto";
          elem.height(elem.height()).addClass("ui-dialog-dragging");
          body.addClass("cursor-closehand");
          if (options.dragCollapse) collapse.apply(instance, [this, true]);
          return instance._trigger("dragStart", event, filteredUi(ui));
        },
        drag: function(event, ui) {
          return instance._trigger("drag", event, filteredUi(ui));
        },
        stop: function(event, ui) {
          options.position = [ui.position.left - doc.scrollLeft(), ui.position.top - doc.scrollTop()];
          $(this).removeClass("ui-dialog-dragging").height(heightBeforeDrag);
          body.removeClass("cursor-closehand");
          if (options.dragCollapse) collapse.apply(instance, [this, false]);
          instance._trigger("dragStop", event, filteredUi(ui));
          return $.ui.dialog.overlay.resize();
        }
      });
    },
    _setOption: function(key, value) {
      var isDraggable, isResizable, str;
      switch (key) {
        case "beforeclose":
          key = "beforeClose";
          break;
        case "buttons":
          this._createButtons(value);
          break;
        case "closeText":
          this.uiDialogTitlebarCloseText.text("" + value);
          break;
        case "dialogClass":
          this.uiDialog.removeClass(this.options.dialogClass).addClass(uiDialogClasses + value);
          break;
        case "disabled":
          this.uiDialog[value ? {
            "addClass": "removeClass"
          } : void 0]("ui-dialog-disabled");
          break;
        case "draggable":
          isDraggable = this.uiDialog.is(":data(draggable)");
          if (isDraggable && !value) this.uiDialog.draggable("destroy");
          if (!isDraggable && value) this._makeDraggable();
          break;
        case "position":
          this._position(value);
          break;
        case "resizable":
          isResizable = this.uiDialog.is(":data(resizable)");
          if (isResizable && !value) this.uiDialog.resizable('destroy');
          if (isResizable && $.type(value) === "string") {
            this.uiDialog.resizable("option", "handles", value);
          }
          if (!isResizable && value !== false) this._makeResizable(value);
          break;
        case "title":
          str = value || '&#160;';
          $(".ui-dialog-title", this.uiDialogTitlebar).html("" + str);
      }
      return $.Widget.prototype._setOption.apply(this, arguments);
    },
    close: function(event) {
      var instance, maxZ, thisZ;
      var _this = this;
      if (false === this._trigger("beforeClose", event)) return;
      if (this.overlay) this.overlay.destroy();
      this.uiDialog.unbind("keypress.ui-dialog");
      this._isOpen = false;
      this.closeMessage();
      this.waiting(false);
      if (this.options.hide) {
        this.uiDialog.hide(this.options.hide, function() {
          return _this._trigger("close", event);
        });
      } else {
        this.uiDialog.hide();
        this._trigger("close", event);
      }
      $.ui.dialog.overlay.resize();
      if (this.options.modal) {
        instance = this;
        thisZ = 0;
        maxZ = 0;
        $(".ui-dialog").each(function() {
          if (this !== instance.uiDialog[0]) {
            thisZ = $(this).css("z-index");
            if (!isNaN(thisZ)) return maxZ = Math.max(maxZ, thisZ);
          }
        });
        $.ui.dialog.maxZ = maxZ;
      }
      return this;
    },
    progress: function(value) {
      if (!this.elems.hasOwnProperty("progress")) {
        this.elems.progress = $("<div></div>").progressbar({
          value: value
        }).removeClass('ui-corner-all');
        this._buttonsPane().before(this.elems.progress);
      }
      return this.elems.progress[value > 0 ? "show" : "hide"]().progressbar("value", value);
    },
    buttonsAdd: function(elems, merge) {
      if ($.type(elems) === "object") {
        return this._createButtons(merge ? $.extend(this.options.buttons, elems) : elems);
      }
    },
    buttonsReplace: function(index, elems) {
      var button, buttons_new, buttons_old, i;
      if ($.type(elems) !== "object") return this;
      buttons_old = this.options.buttons;
      buttons_new = {};
      i = 0;
      for (button in buttons_old) {
        if ($.type(index) === "number") {
          if (i === index) {
            delete buttons_old[button];
            buttons_new = $.extend(buttons, elems);
          } else {
            buttons_new[button] = buttons_old[button];
          }
        } else {
          if (button === index) {
            delete buttons_old[button];
            buttons_new = $.extend(buttons, elems);
          } else {
            buttons_new[button] = buttons_old[button];
          }
        }
        ++i;
      }
      return this._createButtons(buttons);
    },
    buttonsRemove: function(targets) {
      var button, buttons_new, buttons_old, num, target, _i, _len;
      if (!$.isArray(targets)) targets = [targets];
      if (targets.length === 0) return;
      buttons_old = this.options.buttons;
      buttons_new = {};
      for (_i = 0, _len = targets.length; _i < _len; _i++) {
        target = targets[_i];
        num = 0;
        for (button in buttons_old) {
          if (target !== num && target !== button) {
            buttons_new[button] = buttons_old[button];
          }
          ++num;
        }
      }
      return this._createButtons(buttons_new);
    },
    button: function(button) {
      if ($.type(target) === "number") {
        button = this._buttonsPane().find("button").eq(target);
      } else {
        button = this._buttonsPane().find("button:contains(" + target + ")");
      }
      if (button.length) {
        return button;
      } else {
        return null;
      }
    },
    buttonSwitch: function(elem, state) {
      if (elem !== null) {
        if ($.type(elem) !== "object") elem = this.button(elem);
        if (elem !== null) elem.button(state === "off" ? "disable" : "enable");
      }
      return this;
    },
    messageShow: function(messages, type, canClose) {
      var elem, message, rows, _i, _len;
      elem = this.elems.message;
      if (elem.is(":visible")) this.messageClose();
      this.uiDialog.addClass("ui-dialog-has-message");
      if (canClose !== false) canClose = true;
      if ($.type(type) !== "string") type = "error";
      if (!$.isArray(messages)) messages = [messages];
      rows = "";
      for (_i = 0, _len = messages.length; _i < _len; _i++) {
        message = messages[_i];
        rows += "<li>" + message + "</li>\n";
      }
      elem.addClass("ui-dialog-message-" + type).find(".ui-icon-close")[canClose ? "show" : "hide"]().end().find("ul").html(rows);
      if (elem.is(":hidden")) {
        return elem.show("slide", {
          direction: "up"
        }, 300);
      }
    },
    messageClose: function() {
      this.uiDialog.removeClass("ui-dialog-has-message");
      return this.elems.message.removeAttr("show-after-drag").removeClass(function(index, className) {
        var matches;
        matches = className.match(/ui\-dialog\-message\-([A-Za-z0-9]+)/g) || [];
        return matches.join(' ');
      }).find('ul').empty().end().hide();
    },
    waiting: function(state) {
      state = state === "off" ? false : true;
      if ((this.uiDialog.hasClass("ui-dialog-spinner") || this.uiDialog.hasClass("ui-dialog-wait")) && state === true) {
        return;
      }
      this.uiDialog.toggleClass("ui-dialog-spinner ui-dialog-wait", state);
      if (this._buttons().length > 0) {
        return this._buttons().button(state ? "disable" : "enable");
      }
    }
  };

  $.extend($.ui.dialog.prototype, dialog);

  createDialogElement = function(id, title, options, dialog) {
    var title_attr;
    if (!dialog) {
      dialog = $("<div/>", {
        id: id
      });
    }
    if ($.type(title) === "string") {
      options.title = title;
    } else {
      title_attr = dialog.attr("title");
      options.title = title_attr ? title_attr : "New dialog";
    }
    dialog.dialog(options).on("dialogopen dialogclose", function(event) {
      var targetButton;
      if (event.type === "dialogopen") {
        window.__openedDialogs++;
      } else {
        window.__openedDialogs--;
      }
      targetButton = $($(this).dialog("option", "targetButton"));
      if (targetButton.length > 0 && targetButton.hasClass("ui-button")) {
        return targetButton.button(event.type === "dialogopen" ? "disable" : "enable");
      }
    });
    return dialog;
  };

  $.makeDialog = function(id, title, options) {
    var def, exists;
    def = {
      autoOpen: false,
      dragCollapse: true,
      resizable: false,
      width: 480,
      position: "center",
      targetButton: null,
      buttons: {
        "Cancel": {
          icons: {
            primary: "ui-icon-circle-close"
          },
          callback: function() {
            return $(this).trigger("dialogcancel").dialog("close");
          }
        }
      }
    };
    options = $.extend(def, options || (options = {}));
    if ($.type(id) !== "string") return null;
    if (id.match(/^#/i)) id = id.replace("#", "");
    dialog = $("#" + id);
    exists = true;
    if (dialog.length > 0) {
      if (!dialog.hasClass("ui-dialog-content")) {
        dialog = createDialogElement(id, title, options, dialog);
        exists = false;
      }
    } else {
      dialog = createDialogElement(id, title, options, null);
      exists = false;
    }
    return dialog.data("exists", exists);
  };

}).call(this);
