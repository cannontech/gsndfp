###!
#  Project: gsnsw2
 * ===============================
###
(($, window, doc) ->
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
  dfpSelector = '.gsnsw'
  dfpOptions = {}
  dfpIsLoaded = false
  $adCollection = undefined
  storeAs = 'gsnsw'
  cssUrl = '//cdn.gsngrocers.com/script/sw2/1.1.0/sw2-override.css'
  advertUrl = '//cdn.gsngrocers.com/script/sw2/1.1.0/advertisement.js'
  didOpen = false

  init = (id, selector, options) ->
    setOptions options
    css = dfpOptions.cssUrl or cssUrl
    advert = dfpOptions.advertUrl or advertUrl
    if dfpOptions.cancel
      onCloseCallback cancel: true
    setResponsiveCss css
    setAdvertisingTester advert
    if getCookie('gsnsw2') == null
      #if the cookies are set, don't show the light-box
      dfpID = id
      dfpLoader()
      getPopup selector
      Gsn.Advertising.on 'clickBrand', (e) ->
        $('.sw-close').click()
        return
    else
      onCloseCallback cancel: true
    return

  setResponsiveCss = (css) ->
    #have we built this element before?
    #insert css that will provide responsiveness      
    el = document.getElementById('respo');
    if el?
      return

    head = document.getElementsByTagName('head').item(0)
    cssTag = document.createElement('link')
    cssTag.setAttribute 'href', css
    cssTag.setAttribute 'rel', 'stylesheet'
    cssTag.setAttribute 'id', 'respo'
    head.appendChild cssTag

  setAdvertisingTester = (advert) ->
    #have we built this element before?
    #insert the advertisement js (fails if an ad-blocker is not present)
    el = document.getElementById('advertScript');
    if el?
      return
      
    body = document.getElementsByTagName('head').item(0)
    scriptTag = document.createElement('script')
    scriptTag.setAttribute 'src', advert   
    scriptTag.setAttribute 'id', 'advertScript'
    body.appendChild scriptTag

  onOpenCallback = (event) ->
    didOpen = true   
    setTimeout (->
      # adblocking detection  
      if typeof(gsnGlobalTester) == 'undefined'
        jQuery('.sw-msg').show()
        jQuery('.sw-header-copy').hide()
        jQuery('.sw-row').hide()   
      return
    ), 150
    return

  onCloseCallback = (event) ->
    $('.sw-pop').remove()
    $('.lean-overlay').remove()
    window.scrollTo 0, 0            
    if getCookie('gsnsw2') == null
      setCookie 'gsnsw2', Gsn.Advertising.gsnNetworkId + ',' +  Gsn.Advertising.enableCircPlus, 1
    if typeof dfpOptions.onClose == 'function'
      dfpOptions.onClose didOpen
    return

  getPopup = (selector) ->
    url = Gsn.Advertising.apiUrl + '/ShopperWelcome/Get/' + Gsn.Advertising.gsnid
    dataType = 'json'
    
    # fallback to jsonp for IE lt 9
    # this allow for better caching on non-IE browser
    if (!doc.addEventListener)
       url += '?callback=?' 
       dataType = 'jsonp'
       
    $.ajax
      url: url
      dataType: dataType
      success: (rsp) ->
        if rsp
          # allow for local value to override remote value
          if (!Gsn.Advertising.gsnNetworkId)
            Gsn.Advertising.gsnNetworkId = rsp.NetworkId

          Gsn.Advertising.enableCircPlus = rsp.EnableCircPlus
          data = rsp.Template
                                               
        dfpID = Gsn.Advertising.gsnNetworkId 
        evt = { data: rsp, cancel: false }                      
        dfpOptions.onData evt
        if evt.cancel
          data = null 
        if data
          #add the random cachebuster
          data = data.replace(/%%CACHEBUSTER%%/g, (new Date).getTime()).replace(/%%CHAINID%%/g, Gsn.Advertising.gsnid)
          if 0 == $('#sw').length
            #have we built this element before?
            #insert the template for the shopper welcome window
            body = document.getElementsByTagName('body').item(0)
            div = document.createElement('div')
            div.setAttribute 'id', 'sw'
            body.appendChild div
          $('#sw').html clean(data)
          $adCollection = $(selector)
          if $adCollection        
            createAds()
            displayAds()          
            #open the modal to show shopper welcome
            $('.sw-pop').easyModal
              autoOpen: true
              closeOnEscape: false
              onClose: onCloseCallback
              onOpen: onOpenCallback
              top: 25
        else
          onCloseCallback cancel: true
        return
    return

  clean = (data) ->
    #use this to get rid of any elements (place-holder images)
    #before we render to reduce the # calls to the server/cdn
    template = $(data.trim())
    #http://bugs.jquery.com/ticket/13223
    $('.remove', template).remove()
    template.prop 'outerHTML'

  getCookie = (NameOfCookie) ->
    if document.cookie.length > 0
      begin = document.cookie.indexOf(NameOfCookie + '=')
      end = 0
      if begin != -1
        begin += NameOfCookie.length + 1
        end = document.cookie.indexOf(';', begin)
        if end == -1
          end = document.cookie.length
        cookieData = decodeURI(document.cookie.substring(begin, end))
        if (cookieData.indexOf(',') > 0)
          cookieDatas = cookieData.split(',')
          Gsn.Advertising.gsnNetworkId = cookieDatas[0]
          Gsn.Advertising.enableCircPlus = cookieData[1]
        return cookieData
    null

  setCookie = (NameOfCookie, value, expiredays) ->
    ExpireDate = new Date
    ExpireDate.setTime ExpireDate.getTime() + expiredays * 24 * 3600 * 1000
    document.cookie = NameOfCookie + '=' + encodeURI(value) + (if expiredays == null then '' else '; expires=' + ExpireDate.toGMTString()) + '; path=/'
    return

  clearCookie = (nameOfCookie) ->
    if nameOfCookie == getCookie(nameOfCookie)
      document.cookie = nameOfCookie + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
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
      adUnitID = getID($adUnit, 'gsnsw', count)
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
          #googleAdUnit.oldRenderEnded();//ecs
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
      if dfpOptions.collapseEmptyDivs
        window.googletag.pubads().collapseEmptyDivs()
      if dfpOptions.disablePublisherConsole == true
        window.googletag.pubads().disablePublisherConsole()
      if dfpOptions.disableInitialLoad == true
        window.googletag.pubads().disableInitialLoad()
      if dfpOptions.noFetch == true
        window.googletag.pubads().noFetch()
      window.googletag.enableServices()
      return
    return

  displayAds = ->
    toPush = []
    # Display each ad
    $adCollection.each ->
      $adUnit = $(this)
      $adUnitData = $adUnit.data(storeAs)
      if dfpOptions.refreshExisting and $adUnitData and $adUnit.data('gsnDfpExisting')
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

    useSSL = 'https:' == document.location.protocol
    gads.src = (if useSSL then 'https:' else 'http:') + '//www.googletagservices.com/tag/js/gpt.js'
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
   - network id
   - chain id
   - store id (optional)
  ###

  $.gsnSw2 =
  $.fn.gsnSw2 = (id, options) ->
    options = options or {}
    if id == undefined
      id = dfpID
    if typeof id == 'object'
      options = id
      id = options.dfpID or dfpID
    selector = this
    if typeof this == 'function'
      selector = dfpSelector
    if $(options.displayWhenExists or '.gsnunit').length
      init id, selector, options
    this

  return
) window.jQuery or window.Zepto or window.tire, window, document