'use strict';

var units = "imperial";
var appID = "612020997256601092d58964281cb125";
var cities = [];
var cityIds = [];
var curUrlString;
var sevenDay;
var groupUrlString;
var iconURL;
var lastCity = "";
var curLat = '';
var curLong = '';
var latestData = {};
var latestForecastData ={};

$(function(){
  checkLocalStorage();
  var curTime = new Date();
  var time = curTime.getTime();
  var hours = curTime.getHours();
  lastCity = "";
  
  queryRecentWeather();

  $("#metric").click(function(e){
    e.stopPropagation;
    units = "metric";
    console.log(units);
    if(latestData !== {}){
      updateCurrentWeatherWidget(latestData);
    }
  });

  $("#imperial").click(function(e){
    e.stopPropagation;
    units = "imperial";
    console.log(units);
    if(latestData !== {}){
      updateCurrentWeatherWidget(latestData);
    }
  });

  $("#add-City").on("click",inputHandler);

  curUrlString = "//api.openweathermap.org/data/2.5/weather?appid="+appID;
  sevenDay = "//api.openweathermap.org/data/2.5/forecast/daily?mode=json&cnt=8&appid=" +appID;
  groupUrlString = "//api.openweathermap.org/data/2.5/group?appid=" + appID;
  iconURL = "//openweathermap.org/img/w/";

  navigator.geolocation.getCurrentPosition(function(position) {  
    updatedCurrentPosition(position.coords.latitude, position.coords.longitude);
  });

  $(".rec-query-add").click(function(e){
    console.log("click");
    e.stopPropagation;
    var inpVal=$(this).find(".current-city").val();
    console.log(inpVal);
  });

});


function updatedCurrentPosition(lat,long){
  curLat = lat;
  curLong = long;
  queryCurrentWeather();
}

function inputHandler(e){
  e.preventDefault();
  lastCity = $('#city-input').val();
  queryCurrentWeather();
}

function dataUpdate(cityinput){
  var cityIdMove="";
  if(cityinput){
    if(cities.indexOf(cityinput.toLowerCase()) > -1){
      cityIds.shift(0,1);
      var indexCity = cities.indexOf(cityinput.toLowerCase());
      cityIdMove = cityIds[indexCity];
      console.log(cityIdMove);
      cities.splice(cities.indexOf(cityinput.toLowerCase()),1);
      cityIds.splice(indexCity, 1);
      cities.unshift(cityinput.toLowerCase());
      cityIds.unshift(cityIdMove);
      updateLocalStorage();
    }
    else{
      cities.unshift(cityinput.toLowerCase());
      updateLocalStorage();
    }
  }
}

function checkLocalStorage(){
  if(localStorage.cities === undefined){
    localStorage.cities = "[]";
    localStorage.cityIds = "[]";
  } 
  else{
    cities = JSON.parse(localStorage.cities);
    cityIds = JSON.parse(localStorage.cityIds);

  }
}

function updateLocalStorage(){
  if(localStorage.hasOwnProperty("cities") && localStorage.hasOwnProperty("cityIds")){
    localStorage.cities = JSON.stringify(cities);
    localStorage.cityIds = JSON.stringify(cityIds);
    console.log(localStorage.cities,localStorage.cityIds);
    queryRecentWeather();
  }
}

function updateCurrentWeatherWidget(inpObj){
  dataUpdate(inpObj.name.toLowerCase());
  $(".current-city").text(capFirst(inpObj.name));
  $(".current-weather").text(capFirst(inpObj.weather[0].description));
  $("#current-icon").attr("src",iconURL + inpObj.weather[0].icon + ".png");
  $(".current-temp").text(kelvinConversion(inpObj.main.temp,units) + ",");
  queryForecastWeather(capFirst(inpObj.name)); ////REMOVE THIS AFTER TESTING
}

function capFirst(inpVal){
  return inpVal.slice(0,1).toUpperCase()+inpVal.slice(1).toLowerCase();
}

function stringCapFirst(inpVal){
  return inpVal.split(" ").map(function(val){
    return capFirst(val);
  }).join(" ");
}

function kelvinConversion(value,units){
  if(units === "metric"){
    return Math.round(parseFloat(value) -  273.15) + "°C";
  }
  else{
    return Math.round(((parseFloat(value) - 273.15) * 1.8) + 32) + "°F";
  }
}

function queryCurrentWeather(){
  $.ajax({method:"GET",
    url:curUrlString+"&q=" + lastCity +"&lat=" + curLat +"&lon=" +curLong,
    success:function(data){
      console.log(data);
      latestData=data;
      lastCity=data.name;
      cityIds.unshift(data.id);
      console.log(data.id);
      curLat="";
      curLong=""; 
      updateCurrentWeatherWidget(data);
    }});
}

function queryForecastWeather(cityinput){
  $.ajax({method:"GET",
    url:sevenDay+"&q=" + cityinput +"&lat=" + curLat +"&lon=" +curLong,
    success:function(data){
      console.log(data);
      latestForecastData=data;
      console.log(data.id);
      curLat="";
      curLong=""; 
      updateForecastWeatherWidget(data);
    }});
}

function queryRecentWeather(){
  $.ajax({method:"GET",
    url: '//api.openweathermap.org/data/2.5/group?appid=' + appID + '&id=' + cityIds.join(","),
    success:function(data){
      console.log(data);
      latestForecastData=data;
      console.log(data.id);
      curLat="";
      curLong=""; 
      updateRecentWidgets(data);
    }});
}

function updateForecastWeatherWidget(data){
  console.log(data);
  $(".addedWidgets").remove();
  var $widgetRow = $(".widget-row")
  for(var i = 0; i < data.list.length ; i++){
    var $newWidget=$("#forecast-widget-template").clone();

    $newWidget.removeAttr("id");
    $newWidget.addClass("addedWidgets");
    var dateConvert = new Date(data.list[i].dt * 1000).toString().slice(0,11);
    $newWidget.find(".forecast-value").text(dateConvert);
    $newWidget.find(".widg-icon").attr("src",iconURL + data.list[i].weather[0].icon + ".png");
    $newWidget.find(".widg-descrip").text(stringCapFirst(data.list[i].weather[0].description));
    $newWidget.find(".widg-temp").text(kelvinConversion(data.list[i].temp.day,units));
    $newWidget.find(".widg-pressure").text(data.list[i].pressure);
    $newWidget.find(".widg-humidity").text(data.list[i].humidity + "%");
    $newWidget.find(".widg-min-temp").text(kelvinConversion(data.list[i].temp.min,units));
    $newWidget.find(".widg-max-temp").text(kelvinConversion(data.list[i].temp.max,units));
    $newWidget.show();
    $widgetRow.append($newWidget);
  }

}

function updateRecentWidgets(inpData){
  console.log(inpData);
  $(".rec-query-add").remove();
  var $recQuer = $(".recent-queries");
  for(var i = 0; i < inpData.list.length; i ++){
    var $recWidg = $("#recent-template").clone();
    $recWidg.removeAttr("id");
    $recWidg.addClass("rec-query-add");
    $recWidg.find(".recent-name").text(inpData.list[i].name);
    $recWidg.find(".recent-temp").text(kelvinConversion(inpData.list[i].main.temp));
    $recWidg.find(".recent-hum").text(kelvinConversion(inpData.list[i].main.humidity));
    $recWidg.find(".recent-press").text(kelvinConversion(inpData.list[i].main.pressure));
    $recWidg.show();
    $recQuer.append($recWidg);
  }
}

function getDate(inpTime){
  console.log(inpTime);
  var retDate = new Date(inpTime);
  return retDate.toString();
}





