/*!
 * gsndfp
 * version 1.1.0
 * Requires jQuery 1.7.1 or higher
 * git@github.com:gsn/gsndfp.git
 * License: Grocery Shopping Network
 *          MIT from derived work of Copyright (c) 2013 Matt Cooper: https://github.com/coop182/jquery.dfp.js  v1.0.18
 */

/*!
 *  Project: gsnevent triggering
 * ===============================
 */

/* Usage:
 *   For Publisher: 
 *         Gsn.Advertising.clickBrickOffer(clickTrackingUrl, 69);
#
 *   For Consumer:
 *         Gsn.Advertising.on('clickBrickOffer', function(evt)) { alert(evt.OfferCode); });
#
 * The following events are currently available: clickProduct, clickPromotion, clickBrand, clickBrickOffer, clickRecipe, and clickLink
 */
(function($, oldGsn, win, doc, gsnContext) {
  var Plugin, buildQueryString, createFrame, lastRefreshTime, myGsn, myParent$, myPlugin, oldGsnAdvertising, parent$, sessionStorageX, tickerFrame;
  sessionStorageX = win.sessionStorage;
  lastRefreshTime = 0;
  if (typeof sessionStorageX === 'undefined') {
    sessionStorageX = {
      getItem: function() {},
      setItem: function() {}
    };
  }
  tickerFrame = void 0;
  parent$ = void 0;
  myGsn = oldGsn || {};
  oldGsnAdvertising = myGsn.Advertising;
  if (typeof oldGsnAdvertising !== 'undefined') {
    if (oldGsnAdvertising.pluginLoaded) {
      return;
    }
  }
  Plugin = function() {
    this.init();
  };
  Plugin.prototype = {
    init: function() {},
    pluginLoaded: true,
    defaultActionParam: {
      page: '',
      evtname: '',
      dept: '',
      deviceid: '',
      storeid: '',
      consumerid: '',
      isanon: false,
      loyaltyid: '',
      aisle: '',
      category: '',
      shelf: '',
      brand: '',
      pcode: '',
      pdesc: '',
      latlng: [0, 0],
      evtcategory: '',
      evtvalue: 0
    },
    data: {},
    gsnNetworkId: '/6394/digitalstore.test',
    chainId: 0,
    onAllEvents: null,
    oldGsnAdvertising: oldGsnAdvertising,
    isDebug: false,
    minSecondBetweenRefresh: 2,
    trigger: function(eventName, eventData) {
      if (eventName.indexOf('gsnevent') < 0) {
        eventName = 'gsnevent:' + eventName;
      }
      win.setTimeout((function() {
        if (parent$) {
          parent$.event.trigger({
            type: eventName,
            detail: eventData
          });
        } else {
          $.event.trigger({
            type: eventName,
            detail: eventData
          });
        }
        if (typeof this.onAllEvents === 'function') {
          this.onAllEvents({
            type: eventName,
            detail: eventData
          });
        }
      }), 100);
    },
    on: function(eventName, callback) {
      if (eventName.indexOf('gsnevent') < 0) {
        eventName = 'gsnevent:' + eventName;
      }
      $(doc).on(eventName, callback);
    },
    off: function(eventName, callback) {
      if (eventName.indexOf('gsnevent') < 0) {
        eventName = 'gsnevent:' + eventName;
      }
      $(doc).off(eventName, callback);
    },
    log: function(message) {
      if (console) {
        console.log(message);
      }
      return this;
    },
    ajaxFireUrl: function(url, sync) {
      var adUrlIndex, newUrl;
      if (typeof url === 'string') {
        if (url.length < 10) {
          return;
        }
        url = url.replace('%%CACHEBUSTER%%', (new Date).getTime());
        if (sync) {
          $.ajax({
            async: false,
            url: url
          });
          adUrlIndex = url.indexOf('adurl=');
          if (adUrlIndex > 0) {
            newUrl = url.substr(adUrlIndex + 6);
            this.ajaxFireUrl(newUrl, sync);
          }
        } else {
          createFrame();
          tickerFrame.src = url;
        }
      }
    },
    clickProduct: function(click, categoryId, brandName, productDescription, productCode, quantity, displaySize, regularPrice, currentPrice, savingsAmount, savingsStatement, adCode, creativeId) {
      this.ajaxFireUrl(click);
      this.trigger('clickProduct', {
        myPlugin: this,
        CategoryId: categoryId,
        BrandName: brandName,
        Description: productDescription,
        ProductCode: productCode,
        DisplaySize: displaySize,
        RegularPrice: regularPrice,
        CurrentPrice: currentPrice,
        SavingsAmount: savingsAmount,
        SavingsStatement: savingsStatement,
        AdCode: adCode,
        CreativeId: creativeId,
        Quantity: quantity || 1
      });
    },
    clickBrickOffer: function(click, offerCode, checkCode) {
      this.ajaxFireUrl(click);
      this.trigger('clickBrickOffer', {
        myPlugin: this,
        OfferCode: offerCode || 0
      });
    },
    clickBrand: function(click, brandName) {
      this.ajaxFireUrl(click);
      this.setBrand(brandName);
      this.trigger('clickBrand', {
        myPlugin: this,
        BrandName: brandName
      });
    },
    clickPromotion: function(click, adCode) {
      this.ajaxFireUrl(click);
      this.trigger('clickPromotion', {
        myPlugin: this,
        AdCode: adCode
      });
    },
    clickRecipe: function(click, recipeId) {
      this.ajaxFireUrl(click);
      this.trigger('clickRecipe', {
        RecipeId: recipeId
      });
    },
    clickLink: function(click, url, target) {
      if (target === void 0 || target === '') {
        target = '_top';
      }
      this.ajaxFireUrl(click);
      this.trigger('clickLink', {
        myPlugin: this,
        Url: url,
        Target: target
      });
    },
    setBrand: function(brandName) {
      this.data.BrandName = brandName;
      sessionStorageX.setItem('Gsn.Advertisement.data.BrandName', brandName);
    },
    getBrand: function() {
      return this.data.BrandName || sessionStorageX.getItem('Gsn.Advertisement.data.BrandName');
    },
    actionHandler: function(evt) {
      var allData, elem, payLoad, self, target;
      self = myGsn.Advertising;
      elem = evt.target ? evt.target : evt.srcElement;
      target = $(elem);
      payLoad = {};
      allData = target.data();
      $.each(allData, function(index, attr) {
        if (/^gsn/gi.test(index)) {
          payLoad[index.replace('gsn', '').toLowerCase()] = attr;
        }
      });
      self.refreshAdPods(payLoad);
      return self;
    },
    refreshAdPods: function(actionParam) {
      var payLoad, self;
      self = myGsn.Advertising;
      payLoad = {};
      $.extend(payLoad, self.defaultActionParam);
      $.extend(payLoad, actionParam);
      if (self.isDebug) {
        self.log(JSON.stringify(payLoad));
      }
      if ((lastRefreshTime === 0) || (new Date).getSeconds() - lastRefreshTime.getSeconds() >= self.minSecondBetweenRefresh) {
        $.gsnDfp({
          dfpID: self.gsnNetworkId,
          setTargeting: {
            brand: self.getBrand()
          },
          enableSingleRequest: false
        });
        lastRefreshTime = new Date();
      }
      return self;
    },
    setDefault: function(defaultParam) {
      var self;
      self = this;
      return $.extend(self.defaultActionParam, defaultParam);
    },
    load: function(chainId, gsnNetworkId, isDebug, liveDiv) {
      var refreshAdPods, self;
      self = this;
      self.chainId = chainId;
      self.gsnNetworkId = gsnNetworkId;
      self.isDebug = isDebug;
      refreshAdPods = self.refreshAdPods;
      $(liveDiv || 'body').on('click', '.gsnaction', self.actionHandler);
      $.gsnSw2({
        chainId: chainId,
        dfpID: gsnNetworkId,
        displayWhenExists: '.gsnunit',
        enableSingleRequest: false,
        onClose: refreshAdPods
      });
      return self;
    }
  };
  myPlugin = new Plugin;
  myGsn.Advertising = myPlugin;
  myGsn.Advertising.brickRedirect = myPlugin.clickBrickOffer;
  myGsn.Advertising.clickBrand = myPlugin.clickBrand;
  myGsn.Advertising.clickThru = myPlugin.clickProduct;
  myGsn.Advertising.logAdImpression = function() {};
  myGsn.Advertising.logAdRequest = function() {};
  myGsn.Advertising.promotionRedirect = myPlugin.clickPromotion;
  myGsn.Advertising.verifyClickThru = myPlugin.clickLink;
  myGsn.Advertising.recipeRedirect = myPlugin.clickRecipe;
  win.Gsn = myGsn;
  if (typeof gsnContext !== 'undefined') {
    myGsn.Advertising.on('clickRecipe', function(data) {
      if (data.type !== 'gsnevent:clickRecipe') {
        return;
      }
      win.location.replace('/Recipes/RecipeFull.aspx?recipeid=' + data.detail.RecipeId);
    });
    myGsn.Advertising.on('clickProduct', function(data) {
      var product, queryString;
      if (data.type !== 'gsnevent:clickProduct') {
        return;
      }
      product = data.detail;
      if (product) {
        queryString = new String('');
        queryString += buildQueryString('DepartmentID', product.CategoryId);
        queryString += '~';
        queryString += buildQueryString('BrandName', product.BrandName);
        queryString += '~';
        queryString += buildQueryString('ProductDescription', product.Description);
        queryString += '~';
        queryString += buildQueryString('ProductCode', product.ProductCode);
        queryString += '~';
        queryString += buildQueryString('DisplaySize', product.DisplaySize);
        queryString += '~';
        queryString += buildQueryString('RegularPrice', product.RegularPrice);
        queryString += '~';
        queryString += buildQueryString('CurrentPrice', product.CurrentPrice);
        queryString += '~';
        queryString += buildQueryString('SavingsAmount', product.SavingsAmount);
        queryString += '~';
        queryString += buildQueryString('SavingsStatement', product.SavingsStatement);
        queryString += '~';
        queryString += buildQueryString('Quantity', product.Quantity);
        queryString += '~';
        queryString += buildQueryString('AdCode', product.AdCode);
        queryString += '~';
        queryString += buildQueryString('CreativeID', product.CreativeId);
        if (typeof AddAdToShoppingList === 'function') {
          AddAdToShoppingList(queryString);
        }
      }
    });
    myGsn.Advertising.on('clickLink', function(data) {
      var linkData;
      if (data.type !== 'gsnevent:clickLink') {
        return;
      }
      linkData = data.detail;
      if (linkData) {
        if (linkData.Target === void 0 || linkData.Target === '') {
          linkData.Target = '_top';
        }
        if (linkData.Target === '_blank') {
          win.open(linkData.Url);
        } else {
          win.location.replace(linkData.Url);
        }
      }
    });
    myGsn.Advertising.on('clickPromotion', function(data) {
      var linkData;
      if (data.type !== 'gsnevent:clickPromotion') {
        return;
      }
      linkData = data.detail;
      if (linkData) {
        win.location.replace('/Ads/Promotion.aspx?adcode=' + linkData.AdCode);
      }
    });
    myGsn.Advertising.on('clickBrickOffer', function(data) {
      var linkData, url;
      if (data.type !== 'gsnevent:clickBrickOffer') {
        return;
      }
      linkData = data.detail;
      if (linkData) {
        url = 'https://clientapi.gsn2.com/api/v1/profile/BrickOffer/' + gsnContext.ConsumerID + '/' + linkData.OfferCode;
        win.open(url, '');
      }
    });
  }
  if (win.top) {
    myParent$ = null;
    try {
      myParent$ = win.top.$;
    } catch (_error) {
      myParent$ = win.parent.$;
    }
    if (myParent$ !== $) {
      parent$ = myParent$;
    }
  }
  return;
  createFrame = function() {
    var tempIFrame;
    if (typeof tickerFrame === 'undefined') {
      tempIFrame = doc.createElement('iframe');
      tempIFrame.setAttribute('id', 'gsnticker');
      tempIFrame.style.position = 'absolute';
      tempIFrame.style.top = '-9999em';
      tempIFrame.style.left = '-9999em';
      tempIFrame.style.zIndex = '99';
      tempIFrame.style.border = '0px';
      tempIFrame.style.width = '0px';
      tempIFrame.style.height = '0px';
      tickerFrame = doc.body.appendChild(tempIFrame);
      if (doc.frames) {
        tickerFrame = doc.frames['gsnticker'];
      }
    }
  };
  return buildQueryString = function(keyWord, keyValue) {
    if (keyValue !== null) {
      keyValue = new String(keyValue);
      if (keyWord !== 'ProductDescription') {
        keyValue = keyValue.replace(/&/, '`');
      }
      return keyWord + '=' + keyValue.toString();
    } else {
      return '';
    }
  };
})(window.jQuery || window.Zepto || window.tire || window.$, window.Gsn || {}, window, document, window.GSNContext);


/*!
 *  Project: gsndfp
 * ===============================
 */

(function($, window) {
  'use strict';
  var $adCollection, count, createAds, dfpBlocked, dfpID, dfpIsLoaded, dfpLoader, dfpOptions, dfpScript, dfpSelector, displayAds, getDimensions, getID, init, isInView, rendered, sessionStorageX, setOptions, storeAs;
  sessionStorageX = sessionStorage;
  if (typeof sessionStorageX === 'undefined') {
    sessionStorageX = {
      getItem: function() {},
      setItem: function() {}
    };
  }
  dfpScript = this;
  dfpID = '';
  count = 0;
  rendered = 0;
  dfpSelector = '.gsnunit';
  dfpOptions = {};
  dfpIsLoaded = false;
  $adCollection = void 0;
  storeAs = 'gsnUnit';
  init = function(id, selector, options) {
    dfpID = id;
    $adCollection = $(selector);
    dfpLoader();
    setOptions(options);
    $(function() {
      createAds();
      displayAds();
    });
  };
  setOptions = function(options) {
    dfpOptions = {
      setTargeting: {},
      setCategoryExclusion: '',
      setLocation: '',
      enableSingleRequest: true,
      collapseEmptyDivs: true,
      refreshExisting: true,
      disablePublisherConsole: false,
      disableInitialLoad: false,
      inViewOnly: false,
      noFetch: false
    };
    $.extend(true, dfpOptions, options);
    if (dfpOptions.googletag) {
      window.googletag.cmd.push(function() {
        $.extend(true, window.googletag, dfpOptions.googletag);
      });
    }
  };
  createAds = function() {
    $adCollection.each(function() {
      var $adUnit, $existingContent, adUnitID, dimensions;
      $adUnit = $(this);
      count++;
      adUnitID = getID($adUnit, 'gsn', count);
      dimensions = getDimensions($adUnit);
      $existingContent = $adUnit.html();
      $adUnit.html('').addClass('display-none');
      window.googletag.cmd.push(function() {
        var $adUnitData, exclusions, exclusionsGroup, googleAdUnit, targeting, valueTrimmed;
        googleAdUnit = void 0;
        $adUnitData = $adUnit.data(storeAs);
        if ($adUnitData) {
          return;
        }
        dfpID = dfpID.replace(/(\/\/)+/gi, '/').replace(/\s+/gi, '').replace(/(\/)$/, '/');
        if (dfpID.indexOf('/') !== 0) {
          dfpID = '/' + dfpID;
        }
        if ($adUnit.data('outofpage')) {
          googleAdUnit = window.googletag.defineOutOfPageSlot(dfpID, adUnitID).addService(window.googletag.pubads());
        } else {
          googleAdUnit = window.googletag.defineSlot(dfpID, dimensions, adUnitID).addService(window.googletag.pubads());
        }
        targeting = $adUnit.data('targeting');
        if (targeting) {
          if (typeof targeting === 'string') {
            targeting = eval('(' + targeting + ')');
          }
          $.each(targeting, function(k, v) {
            if (k === 'brand') {
              sessionStorageX.setItem('brand', v);
            }
            googleAdUnit.setTargeting(k, v);
          });
        }
        exclusions = $adUnit.data('exclusions');
        if (exclusions) {
          exclusionsGroup = exclusions.split(',');
          valueTrimmed = void 0;
          $.each(exclusionsGroup, function(k, v) {
            valueTrimmed = $.trim(v);
            if (valueTrimmed.length > 0) {
              googleAdUnit.setCategoryExclusion(valueTrimmed);
            }
          });
        }
        googleAdUnit.oldRenderEnded = googleAdUnit.oldRenderEnded || googleAdUnit.renderEnded;
        googleAdUnit.renderEnded = function() {
          var display;
          rendered++;
          display = $adUnit.css('display');
          $adUnit.removeClass('display-none').addClass('display-' + display);
          googleAdUnit.oldRenderEnded();
          if (typeof dfpOptions.afterEachAdLoaded === 'function') {
            dfpOptions.afterEachAdLoaded.call(this, $adUnit);
          }
          if (typeof dfpOptions.afterAllAdsLoaded === 'function' && rendered === count) {
            dfpOptions.afterAllAdsLoaded.call(this, $adCollection);
          }
        };
        $adUnit.data(storeAs, googleAdUnit);
      });
    });
    window.googletag.cmd.push(function() {
      var exclusionsGroup, valueTrimmed;
      if (typeof dfpOptions.setTargeting['brand'] === 'undefined') {
        if (sessionStorageX.getItem('brand')) {
          dfpOptions.setTargeting['brand'] = sessionStorageX.getItem('brand');
        }
      }
      if (dfpOptions.enableSingleRequest === true) {
        window.googletag.pubads().enableSingleRequest();
      }
      $.each(dfpOptions.setTargeting, function(k, v) {
        if (k === 'brand') {
          sessionStorageX.setItem('brand', v);
        }
        window.googletag.pubads().setTargeting(k, v);
      });
      if (typeof dfpOptions.setLocation === 'object') {
        if (typeof dfpOptions.setLocation.latitude === 'number' && typeof dfpOptions.setLocation.longitude === 'number' && typeof dfpOptions.setLocation.precision === 'number') {
          window.googletag.pubads().setLocation(dfpOptions.setLocation.latitude, dfpOptions.setLocation.longitude, dfpOptions.setLocation.precision);
        } else if (typeof dfpOptions.setLocation.latitude === 'number' && typeof dfpOptions.setLocation.longitude === 'number') {
          window.googletag.pubads().setLocation(dfpOptions.setLocation.latitude, dfpOptions.setLocation.longitude);
        }
      }
      if (dfpOptions.setCategoryExclusion.length > 0) {
        exclusionsGroup = dfpOptions.setCategoryExclusion.split(',');
        valueTrimmed = void 0;
        $.each(exclusionsGroup, function(k, v) {
          valueTrimmed = $.trim(v);
          if (valueTrimmed.length > 0) {
            window.googletag.pubads().setCategoryExclusion(valueTrimmed);
          }
        });
      }
      if (dfpOptions.collapseEmptyDivs) {
        window.googletag.pubads().collapseEmptyDivs();
      }
      if (dfpOptions.disablePublisherConsole === true) {
        window.googletag.pubads().disablePublisherConsole();
      }
      if (dfpOptions.disableInitialLoad === true) {
        window.googletag.pubads().disableInitialLoad();
      }
      if (dfpOptions.noFetch === true) {
        window.googletag.pubads().noFetch();
      }
      window.googletag.enableServices();
    });
  };
  isInView = function(elem) {
    var docViewBottom, docViewTop, elemBottom, elemTop;
    docViewTop = $(window).scrollTop();
    docViewBottom = docViewTop + $(window).height();
    elemTop = elem.offset().top;
    elemBottom = elemTop + elem.height();
    return elemTop + (elemBottom - elemTop) / 2 >= docViewTop && elemTop + (elemBottom - elemTop) / 2 <= docViewBottom;
  };
  displayAds = function() {
    var toPush;
    toPush = [];
    $adCollection.each(function() {
      var $adUnit, $adUnitData;
      $adUnit = $(this);
      $adUnitData = $adUnit.data(storeAs);
      if (dfpOptions.refreshExisting && $adUnitData && $adUnit.data('gsnDfpExisting')) {
        if (!dfpOptions.inViewOnly || isInView($adUnit) && $adUnit.is(':visible')) {
          toPush.push($adUnitData);
        }
      } else {
        $adUnit.data('gsnDfpExisting', true);
        window.googletag.cmd.push(function() {
          window.googletag.display($adUnit.attr('id'));
        });
      }
    });
    if (toPush.length > 0) {
      window.googletag.cmd.push(function() {
        window.googletag.pubads().refresh(toPush);
      });
    }
  };
  getID = function($adUnit, adUnitName, count) {
    if (!dfpOptions.refreshExisting) {
      $adUnit.data(storeAs, null);
      $adUnit.data('gsnDfpExisting', null);
      if ($adUnit.attr('id')) {
        $adUnit.attr('id', adUnitName + '-auto-gen-id-' + count);
      }
    }
    return $adUnit.attr('id') || $adUnit.attr('id', adUnitName + '-auto-gen-id-' + count).attr('id');
  };
  getDimensions = function($adUnit) {
    var dimensionGroups, dimensions, dimensionsData;
    dimensions = [];
    dimensionsData = $adUnit.data('dimensions');
    if (dimensionsData) {
      dimensionGroups = dimensionsData.split(',');
      $.each(dimensionGroups, function(k, v) {
        var dimensionSet;
        dimensionSet = v.split('x');
        dimensions.push([parseInt(dimensionSet[0], 10), parseInt(dimensionSet[1], 10)]);
      });
    } else {
      dimensions.push([$adUnit.width(), $adUnit.height()]);
    }
    return dimensions;
  };
  dfpLoader = function() {
    var gads, node, useSsl;
    dfpIsLoaded = dfpIsLoaded || $('script[src*="googletagservices.com/tag/js/gpt.js"]').length;
    if (dfpIsLoaded) {
      return;
    }
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    gads = document.createElement('script');
    gads.async = true;
    gads.type = 'text/javascript';
    gads.onerror = function() {
      dfpBlocked();
    };
    useSsl = 'https:' === document.location.protocol;
    gads.src = (useSsl ? 'https:' : 'http:') + '//www.googletagservices.com/tag/js/gpt.js';
    node = document.getElementsByTagName('script')[0];
    node.parentNode.insertBefore(gads, node);
    if (gads.style.display === 'none') {
      dfpBlocked();
    }
  };
  dfpBlocked = function() {
    var commands;
    commands = window.googletag.cmd;
    setTimeout((function() {
      var _defineSlot;
      _defineSlot = function(name, dimensions, id, oop) {
        window.googletag.ads.push(id);
        window.googletag.ads[id] = {
          renderEnded: function() {},
          addService: function() {
            return this;
          }
        };
        return window.googletag.ads[id];
      };
      window.googletag = {
        cmd: {
          push: function(callback) {
            callback.call(dfpScript);
          }
        },
        ads: [],
        pubads: function() {
          return this;
        },
        noFetch: function() {
          return this;
        },
        disableInitialLoad: function() {
          return this;
        },
        disablePublisherConsole: function() {
          return this;
        },
        enableSingleRequest: function() {
          return this;
        },
        setTargeting: function() {
          return this;
        },
        collapseEmptyDivs: function() {
          return this;
        },
        enableServices: function() {
          return this;
        },
        defineSlot: function(name, dimensions, id) {
          return _defineSlot(name, dimensions, id, false);
        },
        defineOutOfPageSlot: function(name, id) {
          return _defineSlot(name, [], id, true);
        },
        display: function(id) {
          window.googletag.ads[id].renderEnded.call(dfpScript);
          return this;
        }
      };
      $.each(commands, function(k, v) {
        window.googletag.cmd.push(v);
      });
    }), 50);
  };

  /**
   * Add function to the jQuery / Zepto / tire namespace
   * @param  String id      (Optional) The DFP account ID
   * @param  Object options (Optional) Custom options to apply
   */
  $.gsnDfp = $.fn.gsnDfp = function(id, options) {
    var selector;
    options = options || {};
    if (id === void 0) {
      id = dfpID;
    }
    if (typeof id === 'object') {
      options = id;
      id = options.dfpID || dfpID;
    }
    selector = this;
    if (typeof this === 'function') {
      selector = dfpSelector;
    }
    init(id, selector, options);
    return this;
  };
})(window.jQuery || window.Zepto || window.tire || window.$, window);


/*!
 *  Project: gsnsw2
 * ===============================
 */

(function($, window) {
  'use strict';
  var $adCollection, advertUrl, apiUrl, chainId, clean, clearCookie, count, createAds, cssUrl, dfpBlocked, dfpID, dfpIsLoaded, dfpLoader, dfpOptions, dfpScript, dfpSelector, didOpen, displayAds, getCookie, getDimensions, getID, getPopup, init, onCloseCallback, onOpenCallback, rendered, sessionStorageX, setAdvertisingTester, setCookie, setOptions, setResponsiveCss, storeAs;
  sessionStorageX = sessionStorage;
  if (typeof sessionStorageX === 'undefined') {
    sessionStorageX = {
      getItem: function() {},
      setItem: function() {}
    };
  }
  dfpScript = this;
  dfpID = '';
  count = 0;
  rendered = 0;
  dfpSelector = '.gsnsw';
  dfpOptions = {};
  dfpIsLoaded = false;
  $adCollection = void 0;
  storeAs = 'gsnsw';
  apiUrl = 'https://clientapi.gsn2.com/api/v1/ShopperWelcome/GetShopperWelcome/';
  cssUrl = '//cdn.gsngrocers.com/script/sw2/1.1.0/sw2-override.css';
  advertUrl = '//cdn.gsngrocers.com/script/sw2/1.1.0/advertisement.js';
  chainId = 0;
  didOpen = false;
  init = function(id, selector, options) {
    var advert, css;
    setOptions(options);
    css = dfpOptions.cssUrl || cssUrl;
    advert = dfpOptions.advertUrl || advertUrl;
    if (dfpOptions.cancel) {
      onCloseCallback({
        cancel: true
      });
    }
    setResponsiveCss(css);
    setAdvertisingTester(advert);
    if (getCookie('shopperwelcome2') === null) {
      dfpID = id;
      dfpLoader();
      getPopup(selector);
      Gsn.Advertising.on('clickBrand', function(e) {
        $('.sw-close').click();
      });
    } else {
      onCloseCallback({
        cancel: true
      });
    }
  };
  setResponsiveCss = function(css) {
    var cssTag, head;
    if (0 === $('.respo').length) {
      head = document.getElementsByTagName('head').item(0);
      cssTag = document.createElement('link');
      cssTag.setAttribute('href', css);
      cssTag.setAttribute('rel', 'stylesheet');
      cssTag.setAttribute('class', 'respo');
      head.appendChild(cssTag);
    }
  };
  setAdvertisingTester = function(advert) {
    var body, scriptTag;
    if (0 === $('.advert').length) {
      body = document.getElementsByTagName('body').item(0);
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('src', advert);
      scriptTag.setAttribute('class', 'advert');
      body.appendChild(scriptTag);
    }
  };
  onOpenCallback = function(event) {
    didOpen = true;
    setTimeout((function() {
      if (typeof gsnGlobalTester === 'undefined') {
        jQuery('.sw-msg').show();
        jQuery('.sw-header-copy').hide();
        jQuery('.sw-row').hide();
      }
    }), 150);
  };
  onCloseCallback = function(event) {
    $('.sw-pop').remove();
    $('.lean-overlay').remove();
    window.scrollTo(0, 0);
    if (getCookie('shopperwelcome2') === null) {
      setCookie('shopperwelcome2', 'shopperwelcome2', 1);
    }
    if (typeof dfpOptions.onClose === 'function') {
      dfpOptions.onClose(didOpen);
    }
  };
  getPopup = function(selector) {
    var chain, url;
    url = dfpOptions.apiUrl || apiUrl;
    chain = dfpOptions.chainId || chainId;
    $.ajax({
      url: url + chain,
      dataType: 'json',
      success: function(data) {
        var body, div;
        if (data) {
          data = data.replace(/%%CACHEBUSTER%%/g, (new Date).getTime()).replace(/%%CHAINID%%/g, chain);
          if (0 === $('#sw').length) {
            body = document.getElementsByTagName('body').item(0);
            div = document.createElement('div');
            div.setAttribute('id', 'sw');
            body.appendChild(div);
          }
          $('#sw').html(clean(data));
          $adCollection = $(selector);
          if ($adCollection) {
            createAds();
            displayAds();
            $('.sw-pop').easyModal({
              autoOpen: true,
              closeOnEscape: false,
              onClose: onCloseCallback,
              onOpen: onOpenCallback,
              top: 25
            });
          }
        } else {
          onCloseCallback({
            cancel: true
          });
        }
      }
    });
  };
  clean = function(data) {
    var template;
    template = $(data.trim());
    $('.remove', template).remove();
    return template.prop('outerHTML');
  };
  getCookie = function(NameOfCookie) {
    var begin, end;
    if (document.cookie.length > 0) {
      begin = document.cookie.indexOf(NameOfCookie + '=');
      end = 0;
      if (begin !== -1) {
        begin += NameOfCookie.length + 1;
        end = document.cookie.indexOf(';', begin);
        if (end === -1) {
          end = document.cookie.length;
        }
        return decodeURI(document.cookie.substring(begin, end));
      }
    }
    return null;
  };
  setCookie = function(NameOfCookie, value, expiredays) {
    var ExpireDate;
    ExpireDate = new Date;
    ExpireDate.setTime(ExpireDate.getTime() + expiredays * 24 * 3600 * 1000);
    document.cookie = NameOfCookie + '=' + encodeURI(value) + (expiredays === null ? '' : '; expires=' + ExpireDate.toGMTString()) + '; path=/';
  };
  clearCookie = function(nameOfCookie) {
    if (nameOfCookie === getCookie(nameOfCookie)) {
      document.cookie = nameOfCookie + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };
  setOptions = function(options) {
    dfpOptions = {
      setTargeting: {},
      setCategoryExclusion: '',
      setLocation: '',
      enableSingleRequest: true,
      collapseEmptyDivs: true,
      refreshExisting: true,
      disablePublisherConsole: false,
      disableInitialLoad: false,
      noFetch: false
    };
    $.extend(true, dfpOptions, options);
    if (dfpOptions.googletag) {
      window.googletag.cmd.push(function() {
        $.extend(true, window.googletag, dfpOptions.googletag);
      });
    }
  };
  createAds = function() {
    $adCollection.each(function() {
      var $adUnit, $existingContent, adUnitID, dimensions;
      $adUnit = $(this);
      count++;
      adUnitID = getID($adUnit, 'gsnsw', count);
      dimensions = getDimensions($adUnit);
      $existingContent = $adUnit.html();
      $adUnit.html('').addClass('display-none');
      window.googletag.cmd.push(function() {
        var $adUnitData, exclusions, exclusionsGroup, googleAdUnit, targeting, valueTrimmed;
        googleAdUnit = void 0;
        $adUnitData = $adUnit.data(storeAs);
        if ($adUnitData) {
          return;
        }
        dfpID = dfpID.replace(/(\/\/)+/gi, '/').replace(/\s+/gi, '').replace(/(\/)$/, '/');
        if (dfpID.indexOf('/') !== 0) {
          dfpID = '/' + dfpID;
        }
        if ($adUnit.data('outofpage')) {
          googleAdUnit = window.googletag.defineOutOfPageSlot(dfpID, adUnitID).addService(window.googletag.pubads());
        } else {
          googleAdUnit = window.googletag.defineSlot(dfpID, dimensions, adUnitID).addService(window.googletag.pubads());
        }
        targeting = $adUnit.data('targeting');
        if (targeting) {
          if (typeof targeting === 'string') {
            targeting = eval('(' + targeting + ')');
          }
          $.each(targeting, function(k, v) {
            if (k === 'brand') {
              sessionStorageX.setItem('brand', v);
            }
            googleAdUnit.setTargeting(k, v);
          });
        }
        exclusions = $adUnit.data('exclusions');
        if (exclusions) {
          exclusionsGroup = exclusions.split(',');
          valueTrimmed = void 0;
          $.each(exclusionsGroup, function(k, v) {
            valueTrimmed = $.trim(v);
            if (valueTrimmed.length > 0) {
              googleAdUnit.setCategoryExclusion(valueTrimmed);
            }
          });
        }
        googleAdUnit.oldRenderEnded = googleAdUnit.oldRenderEnded || googleAdUnit.renderEnded;
        googleAdUnit.renderEnded = function() {
          var display;
          rendered++;
          display = $adUnit.css('display');
          $adUnit.removeClass('display-none').addClass('display-' + display);
          if (typeof dfpOptions.afterEachAdLoaded === 'function') {
            dfpOptions.afterEachAdLoaded.call(this, $adUnit);
          }
          if (typeof dfpOptions.afterAllAdsLoaded === 'function' && rendered === count) {
            dfpOptions.afterAllAdsLoaded.call(this, $adCollection);
          }
        };
        $adUnit.data(storeAs, googleAdUnit);
      });
    });
    window.googletag.cmd.push(function() {
      var exclusionsGroup, valueTrimmed;
      if (typeof dfpOptions.setTargeting['brand'] === 'undefined') {
        if (sessionStorageX.getItem('brand')) {
          dfpOptions.setTargeting['brand'] = sessionStorageX.getItem('brand');
        }
      }
      if (dfpOptions.enableSingleRequest === true) {
        window.googletag.pubads().enableSingleRequest();
      }
      $.each(dfpOptions.setTargeting, function(k, v) {
        if (k === 'brand') {
          sessionStorageX.setItem('brand', v);
        }
        window.googletag.pubads().setTargeting(k, v);
      });
      if (typeof dfpOptions.setLocation === 'object') {
        if (typeof dfpOptions.setLocation.latitude === 'number' && typeof dfpOptions.setLocation.longitude === 'number' && typeof dfpOptions.setLocation.precision === 'number') {
          window.googletag.pubads().setLocation(dfpOptions.setLocation.latitude, dfpOptions.setLocation.longitude, dfpOptions.setLocation.precision);
        } else if (typeof dfpOptions.setLocation.latitude === 'number' && typeof dfpOptions.setLocation.longitude === 'number') {
          window.googletag.pubads().setLocation(dfpOptions.setLocation.latitude, dfpOptions.setLocation.longitude);
        }
      }
      if (dfpOptions.setCategoryExclusion.length > 0) {
        exclusionsGroup = dfpOptions.setCategoryExclusion.split(',');
        valueTrimmed = void 0;
        $.each(exclusionsGroup, function(k, v) {
          valueTrimmed = $.trim(v);
          if (valueTrimmed.length > 0) {
            window.googletag.pubads().setCategoryExclusion(valueTrimmed);
          }
        });
      }
      if (dfpOptions.collapseEmptyDivs) {
        window.googletag.pubads().collapseEmptyDivs();
      }
      if (dfpOptions.disablePublisherConsole === true) {
        window.googletag.pubads().disablePublisherConsole();
      }
      if (dfpOptions.disableInitialLoad === true) {
        window.googletag.pubads().disableInitialLoad();
      }
      if (dfpOptions.noFetch === true) {
        window.googletag.pubads().noFetch();
      }
      window.googletag.enableServices();
    });
  };
  displayAds = function() {
    var toPush;
    toPush = [];
    $adCollection.each(function() {
      var $adUnit, $adUnitData;
      $adUnit = $(this);
      $adUnitData = $adUnit.data(storeAs);
      if (dfpOptions.refreshExisting && $adUnitData && $adUnit.data('gsnDfpExisting')) {
        toPush.push($adUnitData);
      } else {
        $adUnit.data('gsnDfpExisting', true);
        window.googletag.cmd.push(function() {
          window.googletag.display($adUnit.attr('id'));
        });
      }
    });
    if (toPush.length > 0) {
      window.googletag.cmd.push(function() {
        window.googletag.pubads().refresh(toPush);
      });
    }
  };
  getID = function($adUnit, adUnitName, count) {
    if (!dfpOptions.refreshExisting) {
      $adUnit.data(storeAs, null);
      $adUnit.data('gsnDfpExisting', null);
      if ($adUnit.attr('id')) {
        $adUnit.attr('id', adUnitName + '-auto-gen-id-' + count);
      }
    }
    return $adUnit.attr('id') || $adUnit.attr('id', adUnitName + '-auto-gen-id-' + count).attr('id');
  };
  getDimensions = function($adUnit) {
    var dimensionGroups, dimensions, dimensionsData;
    dimensions = [];
    dimensionsData = $adUnit.data('dimensions');
    if (dimensionsData) {
      dimensionGroups = dimensionsData.split(',');
      $.each(dimensionGroups, function(k, v) {
        var dimensionSet;
        dimensionSet = v.split('x');
        dimensions.push([parseInt(dimensionSet[0], 10), parseInt(dimensionSet[1], 10)]);
      });
    } else {
      dimensions.push([$adUnit.width(), $adUnit.height()]);
    }
    return dimensions;
  };
  dfpLoader = function() {
    var gads, node, useSSL;
    dfpIsLoaded = dfpIsLoaded || $('script[src*="googletagservices.com/tag/js/gpt.js"]').length;
    if (dfpIsLoaded) {
      return;
    }
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    gads = document.createElement('script');
    gads.async = true;
    gads.type = 'text/javascript';
    gads.onerror = function() {
      dfpBlocked();
    };
    useSSL = 'https:' === document.location.protocol;
    gads.src = (useSSL ? 'https:' : 'http:') + '//www.googletagservices.com/tag/js/gpt.js';
    node = document.getElementsByTagName('script')[0];
    node.parentNode.insertBefore(gads, node);
    if (gads.style.display === 'none') {
      dfpBlocked();
    }
  };
  dfpBlocked = function() {
    var commands;
    commands = window.googletag.cmd;
    setTimeout((function() {
      var _defineSlot;
      _defineSlot = function(name, dimensions, id, oop) {
        window.googletag.ads.push(id);
        window.googletag.ads[id] = {
          renderEnded: function() {},
          addService: function() {
            return this;
          }
        };
        return window.googletag.ads[id];
      };
      window.googletag = {
        cmd: {
          push: function(callback) {
            callback.call(dfpScript);
          }
        },
        ads: [],
        pubads: function() {
          return this;
        },
        noFetch: function() {
          return this;
        },
        disableInitialLoad: function() {
          return this;
        },
        disablePublisherConsole: function() {
          return this;
        },
        enableSingleRequest: function() {
          return this;
        },
        setTargeting: function() {
          return this;
        },
        collapseEmptyDivs: function() {
          return this;
        },
        enableServices: function() {
          return this;
        },
        defineSlot: function(name, dimensions, id) {
          return _defineSlot(name, dimensions, id, false);
        },
        defineOutOfPageSlot: function(name, id) {
          return _defineSlot(name, [], id, true);
        },
        display: function(id) {
          window.googletag.ads[id].renderEnded.call(dfpScript);
          return this;
        }
      };
      $.each(commands, function(k, v) {
        window.googletag.cmd.push(v);
      });
    }), 50);
  };

  /**
   * Add function to the jQuery / Zepto / tire namespace
   * @param  String id      (Optional) The DFP account ID
   * @param  Object options (Optional) Custom options to apply
   - network id
   - chain id
   - store id (optional)
   */
  $.gsnSw2 = $.fn.gsnSw2 = function(id, options) {
    var selector;
    options = options || {};
    if (id === void 0) {
      id = dfpID;
    }
    if (typeof id === 'object') {
      options = id;
      id = options.dfpID || dfpID;
    }
    selector = this;
    if (typeof this === 'function') {
      selector = dfpSelector;
    }
    if ($(options.displayWhenExists || '.gsnunit').length) {
      init(id, selector, options);
    }
    return this;
  };
})(window.jQuery || window.Zepto || window.tire || window.$, window);


/**
 * gsn.easyModal.js v1.0.1
 * A minimal jQuery modal that works with your CSS.
 * Author: Flavius Matis - http://flaviusmatis.github.com/
 * URL: https://github.com/flaviusmatis/easyModal.js
 * Modified: Eric Schmit - GSN
 *========================================================
 */

(function($) {
  'use strict';
  var methods;
  methods = {
    init: function(options) {
      var defaults;
      defaults = {
        top: 'auto',
        autoOpen: false,
        overlayOpacity: 0.5,
        overlayColor: '#000',
        overlayClose: true,
        overlayParent: 'body',
        closeOnEscape: true,
        closeButtonClass: '.close',
        transitionIn: '',
        transitionOut: '',
        onOpen: false,
        onClose: false,
        zIndex: function() {
          return (function(value) {
            if (value === -Infinity) {
              return 0;
            } else {
              return value + 1;
            }
          })(Math.max.apply(Math, $.makeArray($('*').map(function() {
            return $(this).css('z-index');
          }).filter(function() {
            return $.isNumeric(this);
          }).map(function() {
            return parseInt(this, 10);
          }))));
        },
        updateZIndexOnOpen: false,
        adClass: 'gsnsw'
      };
      options = $.extend(defaults, options);
      return this.each(function() {
        var $modal, $overlay, o;
        o = options;
        $overlay = $('<div class="lean-overlay"></div>');
        $modal = $(this);
        $overlay.css({
          'display': 'none',
          'position': 'absolute',
          'z-index': 2147483640,
          'top': 0,
          'left': 0,
          'height': '100%',
          'width': '100%',
          'background': o.overlayColor,
          'opacity': o.overlayOpacity,
          'overflow': 'auto'
        }).appendTo(o.overlayParent);
        $modal.css({
          'display': 'none',
          'position': 'absolute',
          'z-index': 2147483647,
          'left': window.devicePixelRatio >= 2 ? 33 + '%' : 50 + '%',
          'top': parseInt(o.top, 10) > -1 ? o.top + 'px' : 50 + '%'
        });
        $modal.bind('openModal', function() {
          var modalZ, overlayZ;
          overlayZ = o.updateZIndexOnOpen ? o.zIndex() : parseInt($overlay.css('z-index'), 10);
          modalZ = overlayZ + 1;
          if (o.transitionIn !== '' && o.transitionOut !== '') {
            $modal.removeClass(o.transitionOut).addClass(o.transitionIn);
          }
          $modal.css({
            'display': 'block',
            'margin-left': window.devicePixelRatio >= 2 ? 0 : -($modal.outerWidth() / 2) + 'px',
            'margin-top': (parseInt(o.top, 10) > -1 ? 0 : -($modal.outerHeight() / 2)) + 'px',
            'z-index': modalZ
          });
          $overlay.css({
            'z-index': overlayZ,
            'display': 'block'
          });
          if (o.onOpen && typeof o.onOpen === 'function') {
            o.onOpen($modal[0]);
          }
        });
        $modal.bind('closeModal', function() {
          if (o.transitionIn !== '' && o.transitionOut !== '') {
            $modal.removeClass(o.transitionIn).addClass(o.transitionOut);
            $modal.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
              $modal.css('display', 'none');
              $overlay.css('display', 'none');
            });
          } else {
            $modal.css('display', 'none');
            $overlay.css('display', 'none');
          }
          if (o.onClose && typeof o.onClose === 'function') {
            o.onClose($modal[0]);
          }
        });
        $overlay.click(function() {
          if (o.overlayClose) {

          } else {

          }
        });
        $(document).keydown(function(e) {
          if (o.closeOnEscape && e.keyCode === 27) {
            $modal.trigger('closeModal');
          }
        });
        $modal.on('click', o.adClass, function(e) {
          $modal.trigger('closeModal');
          e.preventDefault();
        });
        $modal.on('click', o.closeButtonClass, function(e) {
          $modal.trigger('closeModal');
          e.preventDefault();
        });
        if (o.autoOpen) {
          $modal.trigger('openModal');
        }
      });
    }
  };
  $.fn.easyModal = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    }
    if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    }
    $.error('Method ' + method + ' does not exist on jQuery.easyModal');
  };
})(window.jQuery || window.Zepto || window.tire || window.$);
