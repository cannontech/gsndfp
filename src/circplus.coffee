###!
#  Project: circplus

 Initialize circplus using the code below:

to init, tag any div with class "circplus"
  $.circPlus({dfpID: '6394/6394.test', setTargeting: {dept: 'beverages'} });
  $.circPlus({ dfpID: '6394/partner-root-3566/123.giantcarlisle', setTargeting: {dept: 'beverages'} });

same command to refresh:
  $.circPlus({ dfpID: '6394/partner-root-3566/123.giantcarlisle', setTargeting: {dept: 'beverages'} });

###

(($, window) ->
  'use strict'
  sessionStorageX = sessionStorage
  if typeof sessionStorageX == 'undefined'
    sessionStorageX =
      getItem: ->
      setItem: ->
  dfpScript = this
  dfpID = ''
  count = 0
  rendered = 0
  dfpSelector = '.circplus'
  dfpOptions = {}
  dfpIsLoaded = false
  $adCollection = undefined
  storeAs = 'circplus'
  bodyTemplate = '<div class="gsn-slot-container"><div class="cpslot cpslot2" data-companion="true" data-dimensions="300x50"></div></div><div class="gsn-slot-container"><div class="cpslot cpslot1" data-dimensions="300x100,300x120"></div></div>'

  init = (id, selector, options) ->
    dfpID = id
    if $(selector).html() == ''
      if options.templateSelector
        $(selector).html $(options.templateSelector).html()
      else
        $(selector).html options.bodyTemplate or bodyTemplate
 
    # real selector is use above to append bodyTemplate
    $adCollection = $($('.cpslot').get().reverse())
    dfpLoader()
    setOptions options
    $ ->
      createAds()
      displayAds()
      return
    return

  setOptions = (options) ->
    # Set default options
    dfpOptions =
      setTargeting: {}
      setCategoryExclusion: ''
      setLocation: ''
      enableSingleRequest: false
      collapseEmptyDivs: true
      refreshExisting: true
      disablePublisherConsole: false
      disableInitialLoad: false
      inViewOnly: true
      noFetch: false
      
    # Merge options objects
    $.extend true, dfpOptions, options
    # If a custom googletag is specified, use it.
    if dfpOptions.googletag
      window.googletag.cmd.push ->
        $.extend true, window.googletag, dfpOptions.googletag
        return
    return

  createAds = ->
    # Loops through on page Ad units and gets ads for them.
    $adCollection.each ->
      $adUnit = $(this)
      count++
      # adUnit id - this will use an existing id or an auto generated one.
      adUnitID = getID($adUnit, 'gsncircplus', count)
      # get dimensions of the adUnit
      dimensions = getDimensions($adUnit)
      # get existing content
      $existingContent = $adUnit.html()
      # wipe html clean ready for ad and set the default display class.
      $adUnit.html('').addClass 'display-none'
      # Push commands to DFP to create ads
      window.googletag.cmd.push ->
        googleAdUnit = undefined
        $adUnitData = $adUnit.data(storeAs)
        if $adUnitData
          return
        # remove double slash and any space, trim ending slash
        dfpID = dfpID.replace(/(\/\/)+/gi, '/').replace(/\s+/gi, '').replace(/(\/)$/, '/')
        # append single front slash
        if dfpID.indexOf('/') != 0
          dfpID = '/' + dfpID
        # Create the ad - out of page or normal
        if $adUnit.data('outofpage')
          googleAdUnit = window.googletag.defineOutOfPageSlot(dfpID, adUnitID).addService(window.googletag.pubads())
        else
          googleAdUnit = window.googletag.defineSlot(dfpID, dimensions, adUnitID).addService(window.googletag.pubads())
        # mark as companion ad
        companion = $adUnit.data('companion')
        if companion
          googleAdUnit.addService window.googletag.companionAds()
        # Sets custom targeting for just THIS ad unit if it has been specified
        targeting = $adUnit.data('targeting')
        if targeting
          if typeof targeting == 'string'
            targeting = eval('(' + targeting + ')')
          $.each targeting, (k, v) ->
            if k == 'brand'
              sessionStorageX.setItem 'brand', v
            googleAdUnit.setTargeting k, v
            return
        # Sets custom exclusions for just THIS ad unit if it has been specified
        exclusions = $adUnit.data('exclusions')
        if exclusions
          exclusionsGroup = exclusions.split(',')
          valueTrimmed = undefined
          $.each exclusionsGroup, (k, v) ->
            valueTrimmed = $.trim(v)
            if valueTrimmed.length > 0
              googleAdUnit.setCategoryExclusion valueTrimmed
            return
        # The following hijacks an internal google method to check if the div has been
        # collapsed after the ad has been attempted to be loaded.
        googleAdUnit.oldRenderEnded = googleAdUnit.oldRenderEnded or googleAdUnit.renderEnded

        googleAdUnit.renderEnded = ->
          rendered++
          display = $adUnit.css('display')
          $adUnit.removeClass('display-none').addClass 'display-' + display
          googleAdUnit.oldRenderEnded()
          # Excute afterEachAdLoaded callback if provided
          if typeof dfpOptions.afterEachAdLoaded == 'function'
            dfpOptions.afterEachAdLoaded.call this, $adUnit
          # Excute afterAllAdsLoaded callback if provided
          if typeof dfpOptions.afterAllAdsLoaded == 'function' and rendered == count
            dfpOptions.afterAllAdsLoaded.call this, $adCollection
          return

        # Store googleAdUnit reference
        $adUnit.data storeAs, googleAdUnit
        return
      return
    # Push DFP config options
    window.googletag.cmd.push ->
      if typeof dfpOptions.setTargeting['brand'] == 'undefined'
        if sessionStorageX.getItem('brand')
          dfpOptions.setTargeting['brand'] = sessionStorageX.getItem('brand')
      if dfpOptions.enableSingleRequest == true
        window.googletag.pubads().enableSingleRequest()
      $.each dfpOptions.setTargeting, (k, v) ->
        if k == 'brand'
          sessionStorageX.setItem 'brand', v
        window.googletag.pubads().setTargeting k, v
        return
      if typeof dfpOptions.setLocation == 'object'
        if typeof dfpOptions.setLocation.latitude == 'number' and typeof dfpOptions.setLocation.longitude == 'number' and typeof dfpOptions.setLocation.precision == 'number'
          window.googletag.pubads().setLocation dfpOptions.setLocation.latitude, dfpOptions.setLocation.longitude, dfpOptions.setLocation.precision
        else if typeof dfpOptions.setLocation.latitude == 'number' and typeof dfpOptions.setLocation.longitude == 'number'
          window.googletag.pubads().setLocation dfpOptions.setLocation.latitude, dfpOptions.setLocation.longitude
      if dfpOptions.setCategoryExclusion.length > 0
        exclusionsGroup = dfpOptions.setCategoryExclusion.split(',')
        valueTrimmed = undefined
        $.each exclusionsGroup, (k, v) ->
          valueTrimmed = $.trim(v)
          if valueTrimmed.length > 0
            window.googletag.pubads().setCategoryExclusion valueTrimmed
          return
      if dfpOptions.collapseEmptyDivs == true or dfpOptions.collapseEmptyDivs == 'original'
        window.googletag.pubads().collapseEmptyDivs()
      if dfpOptions.disablePublisherConsole == true
        window.googletag.pubads().disablePublisherConsole()
      if dfpOptions.disableInitialLoad == true
        window.googletag.pubads().disableInitialLoad()
      if dfpOptions.noFetch == true
        window.googletag.pubads().noFetch()
      #googletag.pubads().enableAsyncRendering(); 
      window.googletag.companionAds().setRefreshUnfilledSlots true
      window.googletag.enableServices()
      return
    return

  isInView = (elem) ->
    docViewTop = $(window).scrollTop()
    docViewBottom = docViewTop + $(window).height()
    elemTop = elem.offset().top
    elemBottom = elemTop + elem.height()
    #Is more than half of the element visible
    elemTop + (elemBottom - elemTop) / 2 >= docViewTop and elemTop + (elemBottom - elemTop) / 2 <= docViewBottom

  displayAds = ->
    toPush = []
    # Display each ad
    $adCollection.each ->
      $adUnit = $(this)
      $adUnitData = $adUnit.data(storeAs)
      if dfpOptions.refreshExisting and $adUnitData and $adUnit.data('gsnDfpExisting')
        # determine if element is in view
        if !dfpOptions.inViewOnly or isInView($adUnit)
          toPush.push $adUnitData
      else
        $adUnit.data 'gsnDfpExisting', true
        window.googletag.cmd.push ->
          window.googletag.display $adUnit.attr('id')
          return
      return
    if toPush.length > 0
      window.googletag.cmd.push ->
        window.googletag.pubads().refresh toPush
        return
    return

  getID = ($adUnit, adUnitName, count) ->
    if !dfpOptions.refreshExisting
      $adUnit.data storeAs, null
      $adUnit.data 'gsnDfpExisting', null
      if $adUnit.attr('id')
        $adUnit.attr 'id', adUnitName + '-auto-gen-id-' + count
    $adUnit.attr('id') or $adUnit.attr('id', adUnitName + '-auto-gen-id-' + count).attr('id')

  getDimensions = ($adUnit) ->
    dimensions = []
    dimensionsData = $adUnit.data('dimensions')
    # Check if data-dimensions are specified. If they aren't, use the dimensions of the ad unit div.
    if dimensionsData
      dimensionGroups = dimensionsData.split(',')
      $.each dimensionGroups, (k, v) ->
        dimensionSet = v.split('x')
        dimensions.push [
          parseInt(dimensionSet[0], 10)
          parseInt(dimensionSet[1], 10)
        ]
        return
    else
      dimensions.push [
        $adUnit.width()
        $adUnit.height()
      ]
    dimensions

  dfpLoader = ->
    # make sure we don't load gpt.js multiple times
    dfpIsLoaded = dfpIsLoaded or $('script[src*="googletagservices.com/tag/js/gpt.js"]').length
    if dfpIsLoaded
      return
    window.googletag = window.googletag or {}
    window.googletag.cmd = window.googletag.cmd or []
    gads = document.createElement('script')
    gads.async = true
    gads.type = 'text/javascript'
    # Adblock blocks the load of Ad scripts... so we check for that

    gads.onerror = ->
      dfpBlocked()
      return

    useSsl = 'https:' == document.location.protocol
    gads.src = (if useSsl then 'https:' else 'http:') + '//www.googletagservices.com/tag/js/gpt.js'
    node = document.getElementsByTagName('script')[0]
    node.parentNode.insertBefore gads, node
    # Adblock plus seems to hide blocked scripts... so we check for that
    if gads.style.display == 'none'
      dfpBlocked()
    return

  dfpBlocked = ->
    # Get the stored dfp commands
    commands = window.googletag.cmd
    # SetTimeout is a bit dirty but the script does not execute in the correct order without it
    setTimeout (->

      _defineSlot = (name, dimensions, id, oop) ->
        window.googletag.ads.push id
        window.googletag.ads[id] =
          renderEnded: ->
          addService: ->
            this
        window.googletag.ads[id]

      # overwrite the dfp object - replacing the command array with a function and defining missing functions
      window.googletag =
        cmd: push: (callback) ->
          callback.call dfpScript
          return
        ads: []
        pubads: ->
          this
        noFetch: ->
          this
        disableInitialLoad: ->
          this
        disablePublisherConsole: ->
          this
        enableSingleRequest: ->
          this
        setTargeting: ->
          this
        collapseEmptyDivs: ->
          this
        enableServices: ->
          this
        defineSlot: (name, dimensions, id) ->
          _defineSlot name, dimensions, id, false
        defineOutOfPageSlot: (name, id) ->
          _defineSlot name, [], id, true
        display: (id) ->
          window.googletag.ads[id].renderEnded.call dfpScript
          this
      # Execute any stored commands
      $.each commands, (k, v) ->
        window.googletag.cmd.push v
        return
      return
    ), 50
    return

  ###*
  # Add function to the jQuery / Zepto / tire namespace
  # @param  String id      (Optional) The DFP account ID
  # @param  Object options (Optional) Custom options to apply
  ###

  $.circPlus =
  $.fn.circPlus = (id, options) ->
    options = options or {}
    if id == undefined
      id = dfpID
    if typeof id == 'object'
      options = id
      id = options.dfpID or dfpID
    selector = this
    if typeof this == 'function'
      selector = dfpSelector
    init id, selector, options
    this

  return
) window.jQuery or window.Zepto or window.tire or window.$, window
