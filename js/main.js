var giphyApiRoot = 'http://api.giphy.com/v1/gifs';
var weatherApiRoot = 'http://api.openweathermap.org/data/2.5/forecast';

var weatherApiKey = '2de143494c0b295cca9337e1e96b00e0';
var giphyApiKey = 'dc6zaTOxFJmzC';

var weather = false;
var weatherThreshold = 28;
var giphyNegativeUrl = false;
var giphyPositiveUrl = false;

var preloaded = false;

function getGiphy(query, callback) {
  var param = {
    tag: query,
    api_key: giphyApiKey,
    rating: 'pg'
  };

  var searchUrl = giphyApiRoot + '/random?' + $.param(param);

  $.get(searchUrl, function(res) {
    return preloadImage(res.data.image_url, callback);
  });
}

function preloadImage(url, callback) {
  $('<img/>').attr('src', url).load(function() {
    $(this).remove();
    callback(null, url);
 });
}

function getWeather(lat, lon, callback) {
  var param = {
    lat: lat,
    lon: lon,
    mode: 'json',
    appid: weatherApiKey
  };

  var dailyUrl = weatherApiRoot + '/daily?' + $.param(param);

  $.get(dailyUrl, function(data) {
    return callback(null, data);
  });
}

function getLocation(callback) {
  if(!'geolocation' in navigator)
    return 'No Geolocation Support..';
  
  navigator.geolocation.getCurrentPosition(
    function(position) {
      return callback(null, {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      });
    }, function(error) {
      switch(error.code) {
        case error.PERMISSION_DENIED:
        return callback('User denied the request for Geolocation.');
        case error.POSITION_UNAVAILABLE:
        return callback('Location information is unavailable.');
        case error.TIMEOUT:
        return callback('The request to get user location timed out.');
        case error.UNKNOWN_ERROR:
        return callback('An unknown error occurred.');
      }
    }
  );
}

function isShorts() {
  return weather.temp.celsius >= weatherThreshold;
}

getLocation(function(err, location) {
  if(err)
    return preloader(err);

  getWeather(location.lat, location.lon, function(err, data) {
    weather = {
      time: data.list[0].dt,
      temp: {
        celsius: Math.round(data.list[0].temp.max - 273.15),
        fahrenheit: Math.round((data.list[0].temp.max * 9/5) - 459.67)
      }
    };

    if(isShorts()){
      return getGiphy('shorts', function(err, url) {
        giphyPositiveUrl = url;
        preloader();
      });
    }

    getGiphy('tears', function(err, url) {
      giphyNegativeUrl = url;
      preloader();
    });

  });
});

function preloader(err) {
  preloaded = err;
  $(window).trigger('preloaded', err);
}

$(document).ready(function() {
  var $introPage = $('.pt-page.intro');
  var $loadingPage = $('.pt-page.loading');
  var $positivePage = $('.pt-page.positive');
  var $negativePage = $('.pt-page.negative');
  var $weather = $('[data-weather]');

  function start(err) {
    if(err)
      return $loadingPage.find('h4').text(err);

    $introPage.addClass('pt-page-scaleUpCenter pt-page-current');

    if(giphyNegativeUrl)
      $negativePage.css('background-image', 'url("' + giphyNegativeUrl + '")');

    if(giphyPositiveUrl)
      $positivePage.css('background-image', 'url("' + giphyPositiveUrl + '")');

    var weatherC = weather.temp.celsius + '&deg;C';
    var weatherF = weather.temp.fahrenheit + '&deg;F';

    $weather.html(weatherC + ' / ' + weatherF);
  }

  function showPage($page) {
    $page.addClass('pt-page-moveFromBottom pt-page-current');
  }

  $('a[href=#find-out]').click(function(e) {
    e.preventDefault();

    $introPage.removeClass('pt-page-scaleUpCenter');
    $introPage.addClass('pt-page-scaleDownCenter');

    if(isShorts())
      return showPage($positivePage);

    showPage($negativePage);
  });

  if(preloaded)
    return start(preloaded);

  $(window).on('preloaded', function(e, err) {
    return start(preloaded);
  });
});
