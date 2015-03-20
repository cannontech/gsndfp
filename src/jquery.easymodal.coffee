###*
# gsn.easyModal.js v1.0.1
# A minimal jQuery modal that works with your CSS.
# Author: Flavius Matis - http://flaviusmatis.github.com/
# URL: https://github.com/flaviusmatis/easyModal.js
# Modified: Eric Schmit - GSN
 *========================================================
###

(($) ->
  'use strict'
  methods = init: (options) ->
    defaults = 
      top: 'auto'
      autoOpen: false
      overlayOpacity: 0.5
      overlayColor: '#000'
      overlayClose: true
      overlayParent: 'body'
      closeOnEscape: true
      closeButtonClass: '.close'
      transitionIn: ''
      transitionOut: ''
      onOpen: false
      onClose: false
      zIndex: ->
        ((value) ->
          if value == -Infinity then 0 else value + 1
        ) Math.max.apply(Math, $.makeArray($('*').map(->
          $(this).css 'z-index'
        ).filter(->
          $.isNumeric this
        ).map(->
          parseInt this, 10
        )))
      updateZIndexOnOpen: false
      adClass: 'gsnsw'
    options = $.extend(defaults, options)
    @each ->
      o = options
      $overlay = $('<div class="lean-overlay"></div>')
      $modal = $(this)
      $overlay.css(
        'display': 'none'
        'position': 'absolute'
        'z-index': 2147483640
        'top': 0
        'left': 0
        'height': '100%'
        'width': '100%'
        'background': o.overlayColor
        'opacity': o.overlayOpacity
        'overflow': 'auto').appendTo o.overlayParent
      $modal.css
        'display': 'none'
        'position': 'absolute'
        'z-index': 2147483647
        'left': if window.devicePixelRatio >= 2 then 33 + '%' else 50 + '%'
        'top': if parseInt(o.top, 10) > -1 then o.top + 'px' else 50 + '%'
      $modal.bind 'openModal', ->
        overlayZ = if o.updateZIndexOnOpen then o.zIndex() else parseInt($overlay.css('z-index'), 10)
        modalZ = overlayZ + 1
        if o.transitionIn != '' and o.transitionOut != ''
          $modal.removeClass(o.transitionOut).addClass o.transitionIn
        $modal.css
          'display': 'block'
          'margin-left': if window.devicePixelRatio >= 2 then 0 else -($modal.outerWidth() / 2) + 'px'
          'margin-top': (if parseInt(o.top, 10) > -1 then 0 else -($modal.outerHeight() / 2)) + 'px'
          'z-index': modalZ
        $overlay.css
          'z-index': overlayZ
          'display': 'block'
        if o.onOpen and typeof o.onOpen == 'function'
          # onOpen callback receives as argument the modal window
          o.onOpen $modal[0]
        return
      $modal.bind 'closeModal', ->
        if o.transitionIn != '' and o.transitionOut != ''
          $modal.removeClass(o.transitionIn).addClass o.transitionOut
          $modal.one 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', ->
            $modal.css 'display', 'none'
            $overlay.css 'display', 'none'
            return
        else
          $modal.css 'display', 'none'
          $overlay.css 'display', 'none'
        if o.onClose and typeof o.onClose == 'function'
          # onClose callback receives as argument the modal window
          o.onClose $modal[0]
        return
      # Close on overlay click
      $overlay.click ->
        if o.overlayClose
          #$modal.trigger('closeModal');	//ecs - want to force the user to click
        else
        return
      $(document).keydown (e) ->
        # ESCAPE key pressed
        if o.closeOnEscape and e.keyCode == 27
          $modal.trigger 'closeModal'
        return
      #close when adpod pressed
      $modal.on 'click', o.adClass, (e) ->
        $modal.trigger 'closeModal'
        e.preventDefault()
        return
      # Close when button pressed
      $modal.on 'click', o.closeButtonClass, (e) ->
        $modal.trigger 'closeModal'
        e.preventDefault()
        return
      # Automatically open modal if option set
      if o.autoOpen
        $modal.trigger 'openModal'
      return

  $.fn.easyModal = (method) ->
    # Method calling logic
    if methods[method]
      return methods[method].apply(this, Array::slice.call(arguments, 1))
    if typeof method == 'object' or !method
      return methods.init.apply(this, arguments)
    $.error 'Method ' + method + ' does not exist on jQuery.easyModal'
    return

  return
) window.jQuery or window.Zepto or window.tire