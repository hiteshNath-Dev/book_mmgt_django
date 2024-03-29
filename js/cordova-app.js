var cordovaApp = {
  f7: null,
  /*
  This method hides splashscreen after 2 seconds
  */
  handleSplashscreen: function() {
    var f7 = cordovaApp.f7;
    if (!window.navigator.splashscreen || f7.device.electron) return;

    f7.request.get(f7.params.API_URL+'/app_configuration', (data) => {
      var dataObj = JSON.parse(data);
      dataObj = dataObj.data;
      var styles = '';
        var stylesheet = document.createElement('style');
        document.head.appendChild(stylesheet);
        const colorThemeProperties = f7.utils.colorThemeCSSProperties(dataObj.app_theme_color);
        if (Object.keys(colorThemeProperties).length) {
          styles += `
          @import url('https://fonts.googleapis.com/css?family=${dataObj.app_font_family}:400,600,700&display=swap');
          :root {
          ${Object.keys(colorThemeProperties)
              .map(key => `${key}: ${colorThemeProperties[key]};`)
              .join('\n  ')}
          --f7-font-family : ${dataObj.app_font_family}, sans-serif, system-ui, Noto, Helvetica, Arial, sans-serif !important
          }`;
        }
        stylesheet.innerHTML = styles;

      if( localStorage.getItem("app_strings") == '' || localStorage.getItem("app_strings") == undefined || localStorage.getItem("app_strings") == null){
        f7.request.get(f7.params.API_URL+'/app_configuration', (data) => {
          var dataObj = JSON.parse(data);
          dataObj = dataObj.data;
          f7.app_strings = dataObj.app_strings;
          localStorage.setItem('app_strings', JSON.stringify(dataObj.app_strings));
          localStorage.setItem('app_config', JSON.stringify(dataObj));
        });
      }



      setTimeout(() => {
        window.navigator.splashscreen.hide();
      }, 2000);

    });
  },
  /*
  This method prevents back button tap to exit from app on android.
  And allows to exit app on backbutton double tap
  */
  handleAndroidBackButton: function () {
    var f7 = cordovaApp.f7;
    if (f7.device.electron) return;
    cordovaApp.backButtonTimestamp = new Date().getTime();
    document.addEventListener('backbutton', function (e) {
      if (new Date().getTime() - cordovaApp.backButtonTimestamp < 250) {
        cordovaApp.backButtonTimestamp = new Date().getTime();
        if (window.navigator.app && window.navigator.app.exitApp) {
          window.navigator.app.exitApp();
        }
        return true;
      }
      cordovaApp.backButtonTimestamp = new Date().getTime();
      e.preventDefault();
      return false;
    }, false);
  },
  /*
  This method does the following:
    - provides cross-platform view "shrinking" on keyboard open/close
    - hides keyboard accessory bar for all inputs except where it required
  */
  handleKeyboard: function () {
    var f7 = cordovaApp.f7;

    if (!window.Keyboard || !window.Keyboard.shrinkView || f7.device.electron) return;
    var $ = f7.$;
    window.Keyboard.shrinkView(false);
    window.Keyboard.disableScrollingInShrinkView(true);
    window.Keyboard.hideFormAccessoryBar(true);
    window.addEventListener('keyboardWillShow', () => {
      f7.input.scrollIntoView(document.activeElement, 0, true, true);
    });
    window.addEventListener('keyboardDidShow', () => {
      f7.input.scrollIntoView(document.activeElement, 0, true, true);
    });
    window.addEventListener('keyboardDidHide', () => {
      if (document.activeElement && $(document.activeElement).parents('.messagebar').length) {
        return;
      }
      window.Keyboard.hideFormAccessoryBar(false);
    });
    window.addEventListener('keyboardHeightWillChange', (event) => {
      var keyboardHeight = event.keyboardHeight;
      if (keyboardHeight > 0) {
        // Keyboard is going to be opened
        document.body.style.height = `calc(100% - ${keyboardHeight}px)`;
        $('html').addClass('device-with-keyboard');
      } else {
        // Keyboard is going to be closed
        document.body.style.height = '';
        $('html').removeClass('device-with-keyboard');
      }

    });
    $(document).on('touchstart', 'input, textarea, select', function (e) {
      var nodeName = e.target.nodeName.toLowerCase();
      var type = e.target.type;
      var showForTypes = ['datetime-local', 'time', 'date', 'datetime'];
      if (nodeName === 'select' || showForTypes.indexOf(type) >= 0) {
        window.Keyboard.hideFormAccessoryBar(false);
      } else {
        window.Keyboard.hideFormAccessoryBar(true);
      }
    }, true);
  },
  init: function (f7) {
    // Save f7 instance
    cordovaApp.f7 = f7;

    // Handle Android back button
    cordovaApp.handleAndroidBackButton();

    // Handle Statusbar
    cordovaApp.handleSplashscreen();

    // Handle Keyboard
    cordovaApp.handleKeyboard();
  },
};
export default cordovaApp;
