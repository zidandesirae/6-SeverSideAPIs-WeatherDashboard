const APIKEY = "79564d65443999fbd44fa53717a9b123";
populateHistory();

$("#cityLookUpBtn").on("click", function(event) {
  event.preventDefault();
  let cityLookUp = $("#cityLookUpText").val();
  $("#cityLookUpText").val("");
  $("#lookUpResults").fadeIn();
  getWeatherConditions(cityLookUp);
  getFiveDayForecast(cityLookUp);
});

// Previous searches
function populateHistory() {
    $("#historyList").empty();
    let history = getWeatherData().history;
    if (history) {
      for (let i = 0; i < history.length; i++) {
        let item = $("<li class='list-group-item'></li>");
        item.text(history[i].cityName);
        $("#historyList").prepend(item);
      }
      $(".list-group-item").on("click", function() {
        $("#lookUpResults").fadeIn("slow");
        getWeatherConditions($(this).text());
        getFiveDayForecast($(this).text());
      });
    }
  }


function getWeatherData() {
    let weatherData = JSON.parse(localStorage.getItem("weatherData"));
    if (!weatherData) {
      return {
        history: [],
        data: {
          currentWeather: [],
          forecast: []
        }
      };
    } else {
      return weatherData;
    }
  }
  
// local storage look up
function getWeatherConditions(cityLookUp) {
    let queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityLookUp}&units=imperial&appid=${APIKEY}`;
    let weatherData = getWeatherData();
    let history = weatherData.history;
    let timeNow = new Date().getTime();
    cityLookUp = cityLookUp.toLowerCase().trim();
    for (let i = 0; i < history.length; i++) {
      if (
        history[i].cityName.toLowerCase() == cityLookUp &&
        timeNow < history[i].dt * 1000 + 600000
      ) {
        for (let j = 0; j < weatherData.data.currentWeather.length; j++) {
          if (
            weatherData.data.currentWeather[j].name.toLowerCase() ==
            cityLookUp
          ) {
            populateWeatherConditions(
              weatherData.data.currentWeather[j]
            );
            return;
          }
        }
      }
    }
    
// API
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(function(results) {
    populateWeatherConditions(results);
    storeWeather(results);
  });
}

// storing data from API
function storeWeather(results) {
    let weatherData = getWeatherData();
    let historyEntry = {
      cityName: results.name,
      dt: results.dt
    };
    weatherData.history.push(historyEntry);
    weatherData.data.currentWeather.push(results);
    localStorage.setItem("weatherData", JSON.stringify(weatherData));
  }


function populateWeatherConditions(results) {
    let cityName = results.name;
    let date = new Date(results.dt * 1000);
    let description = results.weather[0].main;
    let humidity = results.main.humidity;
    let iconURL = `https://openweathermap.org/img/w/${results.weather[0].icon}.png`;
    let temp = results.main.temp;
    let windSpeed = results.wind.speed;
  
    let lon = results.coord.lon;
    let lat = results.coord.lat;
  
// Adding to page
    $("#currentCity").text(cityName);
    $("#dateNow").text(
      `(${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()})`
    );
    $("#weatherIcon").attr("src", iconURL);
    $("#weatherIcon").attr("alt", description + " icon");
    $("#tempNow").text(temp);
    $("#humidityNow").text(humidity);
    $("#windSpeedNow").text(windSpeed);
  
    populateUVIndex(lon, lat);
  }

// UV Index
function populateUVIndex(lon, lat) {
    let UVIndexURL = `https://api.openweathermap.org/data/2.5/uvi?appid=${APIKEY}&lat=${lat}&lon=${lon}`;
    $.ajax({
      url: UVIndexURL,
      method: "GET"
    }).then(function(results) {
      let UVIndex = results.value;
      let currUVLevel = $("#uvIndexNow").attr("data-uv-level");
      $("#uvIndexNow").removeClass(currUVLevel);
      $("#uvIndexNow").text(UVIndex);
      if (UVIndex < 3) {
        $("#uvIndexNow").attr("data-uv-level", "uv-low");
      } else if (UVIndex < 6) {
        $("#uvIndexNow").attr("data-uv-level", "uv-mod");
      } else if (UVIndex < 8) {
        $("#uvIndexNow").attr("data-uv-level", "uv-high");
      } else if (UVIndex < 11) {
        $("#uvIndexNow").attr("data-uv-level", "uv-very-high");
      } else {
        $("#uvIndexNow").attr("data-uv-level", "uv-ext");
      }
      $("#uvIndexNow").addClass($("#uvIndexNow").attr("data-uv-level"));
    });
  }


function getFiveDayForecast(cityLookUp) {
    let weatherData = getWeatherData();
    let forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${cityLookUp}&units=imperial&appid=ace07f609ddfcf658bcba38cc43237a5`;
    let today = new Date().getDate();
    for (let i = 0; i < weatherData.history.length; i++) {
      let savedDate = new Date(
        weatherData.history[i].dt * 1000
      ).getDate();
      if (
        weatherData.history[i].cityName.toLowerCase() ==
          cityLookUp &&
        savedDate == today
      ) {
        for (let j = 0; j < weatherData.data.forecast.length; j++) {
          if (
            weatherData.data.forecast[j].city.name.toLowerCase() ==
            cityLookUp.toLowerCase()
          ) {
            populateForecast(weatherData.data.forecast[j]);
            return;
          }
        }
      }
    }
    $.ajax({
      url: forecastURL,
      method: "GET"
    }).then(function(results) {
      populateForecast(results);
      storeForecast(results, cityLookUp);
    });
  }
  
// Storing the forecast of the city to local storage if not found.
function storeForecast(results, cityLookUp) {
    cityLookUp = cityLookUp.toLowerCase().trim();
    let weatherData = getWeatherData();
    weatherData.data.forecast.push(results);
    localStorage.setItem("weatherData", JSON.stringify(weatherData));
  }

// Appending
  function populateForecast(results) {
    $("#forecast").empty();
    let list = results.list;
    let daysForecasted = 0;
    for (let i = 0; i < list.length && daysForecasted < 6; i++) {
      let time = list[i].dt_txt.split(" ")[1];
  
      if (time == "12:00:00") {
        let cardDiv = $("<div class='card mr-2 my-2'>");
        let cardBodyDiv = $("<div class='card-body'>");
  
        let dateDiv = $("<div class='forecast-date'>");
        let date = formatDate(list[i].dt_txt.split(" ")[0]);
        dateDiv.text(date);
  
        let imgElem = $("<img>");
        let iconURL = `https://openweathermap.org/img/w/${list[i].weather[0].icon}.png`;
        imgElem.attr("src", iconURL);
        let temp = list[i].main.temp;
        let pTemp = $(`<p>Temp: ${temp} &degF</p>`);
        let humidity = list[i].main.humidity;
        let pHumid = $(`<p>Humidity: ${humidity}%</p>`);
  
        cardBodyDiv.append(dateDiv, imgElem, pTemp, pHumid);
        cardDiv.append(cardBodyDiv);
        $("#forecast").append(cardDiv);
  
        daysForecasted++;
      }
    }
    populateHistory();
  }
  
  // date format
  function formatDate(date) {
    let arr = date.split(" ")[0].split("-");
    let formattedDate = `${arr[1]}/${arr[2]}/${arr[0]}`;
    return formattedDate;
  }

  localStorage.clear();