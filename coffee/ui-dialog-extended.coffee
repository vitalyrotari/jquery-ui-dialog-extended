###
jQuery UI Dialog Extended v1.1alpha-pre

Copyright 2011, Vitaly Rotari (Andrada Developer)
http://andrada-dev.org
###

$ = @jQuery

#----------------------------------------------------------------------------------------
dialog =
    elems: {}
    _init: () ->
        @_createMessageBox();

        if @options.autoOpen
            @open()

    _content: () ->
        if not @elems.hasOwnProperty("content") or not @elems.content.length
            @elems.content = @uiDialog.find(".ui-dialog-content")
        
        return @elems.content

    _buttonsPane: () ->
        if not @elems.hasOwnProperty("buttonsPane") or not @elems.buttonsPane.length
            @elems.buttonsPane = @uiDialog.find(".ui-dialog-buttonpane")
        
        return @elems.buttonsPane

    _buttons: () ->
        if not @elems.hasOwnProperty("buttons") or not @elems.buttons.length
            @elems.buttons = @_buttonsPane().find("button")

        return @elems.buttons
    
    _createButtons: (buttons) ->
        hasButtons = false
        buttonsPane = $("<div></div>")
            .addClass("ui-dialog-buttonpane ui-widget-content ui-helper-clearfix")

        # if we already have a button pane, remove it
        @_buttonsPane().remove()

        create = (name, fn) =>
            customClass = null
            options = {}

            if $.type(fn) is "object"
                callback = fn.callback or= $.noop

                if fn.hasOwnProperty("className")
                    customClass = fn.className
                else if fn.hasOwnProperty("class")
                    customClass = fn.class

                if $.type(fn.icons) is "object"
                    options.icons = fn.icons

                if fn.hasOwnProperty("disabled")
                    options.disabled = fn.disabled
            else
                callback = fn

            button = $("<button type=\"button\"></button>")
                .text(name)
                .click () ->
                    callback.apply(@element[0], arguments)

            if customClass
                button.addClass(customClass)

            if $.fn.button
                button.button(options)

            return button


        if $.type(buttons) is "object"
            $.each buttons, () ->
                return not (hasButtons = true)

        if hasButtons
            for button of buttons
                create(button, buttons[button]).appendTo(buttonsPane)

            buttonsPane.appendTo(@uiDialog)

        @elems.buttonsPane = buttonsPane
        return @

    _createMessageBox: () ->
        if @elems.hasOwnProperty("message")
            return;

        @elems.message = $("<div class=\"ui-dialog-message\">"+
                "<span class=\"ui-dialog-message-icon\"></span>"+
                "<span class=\"ui-icon ui-icon-close\"></span>"+
                "<ul></ul>"+
                "</div>");

        @elems.message.on "click", ".ui-icon-close", {instance: @}, (event) ->
            event.preventDefault()
            event.data.instance.messageClose()
            
        @_content().before(@elems.message)

    _makeDraggable: () ->
        instance = @
        options = @options
        body = $("body")
        doc = $(document)
        heightBeforeDrag = 0

        filteredUi = (ui) ->
            return {position: ui.position, offset: ui.offset}

        collapse = (dialog, state) ->
            dialog = $(dialog);
            message = @elems.message

            if state is true and message.is(":visible")
                message.attr("show-after-drag", "true").hide()
            else if state is false and message.attr("show-after-drag")
                message.removeAttr("show-after-drag").show()

            if state is false
                @_content().show()
                @_buttonsPane().show()
                dialog.find(".ui-resizable-handle").show()
            else
                @_content().hide()
                @_buttonsPane().hide()
                dialog.find(".ui-resizable-handle").hide()

            dialog.css({"height": "auto"})

        @uiDialog.draggable
            cancel: ".ui-dialog-content, .ui-dialog-titlebar-close"
            handle: ".ui-dialog-titlebar"
            containment: "document"
            start: (event, ui) ->
                elem = $(@)
                heightBeforeDrag = if options.height isnt "auto" then elem.height() else "auto"

                elem.height(elem.height()).addClass("ui-dialog-dragging")
                body.addClass("cursor-closehand")

                if options.dragCollapse
                    collapse.apply(instance, [@, true])

                instance._trigger("dragStart", event, filteredUi(ui))

            drag: (event, ui) ->
                instance._trigger("drag", event, filteredUi(ui))

            stop: (event, ui) ->
                options.position = [
                    ui.position.left - doc.scrollLeft(),
                    ui.position.top - doc.scrollTop()
                ]

                $(@).removeClass("ui-dialog-dragging").height(heightBeforeDrag)
                body.removeClass("cursor-closehand")

                if options.dragCollapse
                    collapse.apply(instance, [@, false])

                instance._trigger("dragStop", event, filteredUi(ui))
                $.ui.dialog.overlay.resize()

    _setOption: (key, value) ->
        switch key
            when "beforeclose"
                key = "beforeClose"
            when "buttons"
                @_createButtons(value)
            when "closeText"
                # ensure that we always pass a string
                @uiDialogTitlebarCloseText.text("#{value}")
            when "dialogClass"
                @uiDialog.removeClass(@options.dialogClass).addClass(uiDialogClasses + value)
            when "disabled"
                @uiDialog[if value then "addClass" : "removeClass"]("ui-dialog-disabled");
            when "draggable"
                isDraggable = @uiDialog.is(":data(draggable)")
                if isDraggable and not value
                    @uiDialog.draggable("destroy")

                if not isDraggable and value
                    @_makeDraggable()
            when "position"
                @_position(value)
            when "resizable"
                # currently resizable, becoming non-resizable
                isResizable = @uiDialog.is(":data(resizable)")
                if isResizable and not value
                    @uiDialog.resizable('destroy')

                # currently resizable, changing handles
                if isResizable and $.type(value) is "string" 
                    @uiDialog.resizable("option", "handles", value)

                # currently non-resizable, becoming resizable
                if not isResizable and value isnt false
                    @_makeResizable(value)
            when "title"
                # convert whatever was passed in o a string, for html() to not throw up
                str = (value or '&#160;')
                $(".ui-dialog-title", @uiDialogTitlebar).html("#{str}")

        $.Widget.prototype._setOption.apply(@, arguments)

    close: (event) ->
        if false is @_trigger("beforeClose", event)
            return

        if @overlay
           @overlay.destroy()

        @uiDialog.unbind("keypress.ui-dialog")

        @_isOpen = false
        @closeMessage()
        @waiting(false)

        if @options.hide
            @uiDialog.hide @options.hide, () =>
                @_trigger("close", event)
        else
            @uiDialog.hide();
            @_trigger("close", event)

        $.ui.dialog.overlay.resize()

        # adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
        if @options.modal
            instance = @
            thisZ = 0
            maxZ = 0

            $(".ui-dialog").each () ->
                if @ isnt instance.uiDialog[0]
                    thisZ = $(this).css("z-index")
                    if !isNaN(thisZ)
                        maxZ = Math.max(maxZ, thisZ)

            $.ui.dialog.maxZ = maxZ;

        return @

    progress: (value) ->
        if not @elems.hasOwnProperty("progress")
            @elems.progress = $("<div></div>")
                .progressbar({value: value})
                .removeClass('ui-corner-all')

            @_buttonsPane().before(@elems.progress)

        @elems.progress[if value > 0 then "show" else "hide"]()
            .progressbar("value", value)

    # Add Buttons
    buttonsAdd: (elems, merge) ->
        if $.type(elems) is "object"
            @_createButtons(if merge then $.extend(@options.buttons, elems) else elems)
        
    # Replace Buttons
    buttonsReplace: (index, elems) ->
        if $.type(elems) isnt "object"
            return @

        buttons_old = @options.buttons
        buttons_new = {}
        i = 0

        for button of buttons_old
            if $.type(index) is "number"
                if i is index
                    delete buttons_old[button]
                    buttons_new = $.extend(buttons, elems)
                else
                    buttons_new[button] = buttons_old[button]
            else
                if button is index
                    delete buttons_old[button]
                    buttons_new = $.extend(buttons, elems)
                else
                    buttons_new[button] = buttons_old[button]
            ++i

        return @_createButtons(buttons)

    # Remove Buttons
    buttonsRemove: (targets) ->
        if not $.isArray(targets) 
            targets = [targets]

        if targets.length is 0
            return

        buttons_old = @options.buttons
        buttons_new = {}

        for target in targets
            num = 0
            for button of buttons_old
                if target isnt num and target isnt button
                    buttons_new[button] = buttons_old[button]
                ++num
        
        return @_createButtons(buttons_new)
    
    # Get Button
    button: (button) ->
        if $.type(target) is "number"
            button = @_buttonsPane().find("button").eq(target)
        else
            button = @_buttonsPane().find("button:contains(#{target})")

        return if button.length then button else null

    # Toggle Button
    buttonSwitch: (elem, state) ->
        if elem isnt null
            if $.type(elem) isnt "object"
                elem = @button(elem)

            if elem isnt null
                elem.button(if state is "off" then "disable" else "enable")
            
        return @

    # Display Message Box
    messageShow: (messages, type, canClose) ->
        elem = @elems.message

        if elem.is(":visible")
            @messageClose()

        @uiDialog.addClass("ui-dialog-has-message");

        if canClose isnt false
            canClose = true

        if $.type(type) isnt "string"
            type = "error"

        if not $.isArray(messages)
            messages = [messages]

        rows = ""
        for message in messages
            rows += "<li>#{message}</li>\n"

        elem
            .addClass("ui-dialog-message-#{type}")
            .find(".ui-icon-close")[if canClose then "show" else "hide"]()
                .end()
            .find("ul")
                .html(rows)

        if elem.is(":hidden")
            elem.show("slide", {direction: "up"}, 300)

    # Close Message Box
    messageClose: () ->
        @uiDialog.removeClass("ui-dialog-has-message")
        @elems.message
            .removeAttr("show-after-drag")
            .removeClass((index, className) ->
                matches = className.match(/ui\-dialog\-message\-([A-Za-z0-9]+)/g) or []
                return(matches.join(' '))
            )
            .find('ul')
                .empty()
                .end()
            .hide()

    # Ajax waiting indicator
    waiting: (state) ->
        state = if state is "off" then false else true
 
        if (@uiDialog.hasClass("ui-dialog-spinner") or @uiDialog.hasClass("ui-dialog-wait")) and state is true 
            return

        @uiDialog.toggleClass("ui-dialog-spinner ui-dialog-wait", state)

        if @_buttons().length > 0
            @_buttons().button(if state then "disable" else "enable")

#----------------------------------------------------------------------------------------
$.extend($.ui.dialog.prototype, dialog);

#----------------------------------------------------------------------------------------
createDialogElement = (id, title, options, dialog) ->
    if not dialog
        dialog = $("<div/>", {id: id})

    if $.type(title) is "string"
        options.title = title
    else
        title_attr = dialog.attr("title")
        options.title = if title_attr then title_attr else "New dialog"

    

    dialog.dialog(options)
        .on "dialogopen dialogclose", (event) ->
            if (event.type is "dialogopen") then window.__openedDialogs++ else window.__openedDialogs--
                
            targetButton = $($(@).dialog("option", "targetButton"))

            if targetButton.length > 0 and targetButton.hasClass("ui-button")
                targetButton.button(if event.type is "dialogopen" then "disable" else "enable")

    return dialog

#----------------------------------------------------------------------------------------
$.makeDialog = (id, title, options) ->
    def =
        autoOpen: false
        dragCollapse: true
        resizable: false
        width: 480
        position: "center"
        targetButton: null
        buttons: 
            "Cancel": 
                icons: 
                    primary: "ui-icon-circle-close"
                callback: () ->
                    $(this).trigger("dialogcancel").dialog("close")

    options = $.extend(def, options or= {})

    if $.type(id) isnt "string"
        return null

    if id.match(/^#/i)
        id = id.replace("#", "")

    dialog = $("##{id}")
    exists = true

    if dialog.length > 0
        if not dialog.hasClass("ui-dialog-content") 
            dialog = createDialogElement(id, title, options, dialog);
            exists = false;
    else
        dialog = createDialogElement(id, title, options, null)
        exists = false;

    return dialog.data("exists", exists)