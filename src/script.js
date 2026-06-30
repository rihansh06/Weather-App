const apiKey = "5dfd1b16228a4edb80f162222262306";
const timezoneEl=document.getElementById("time-zone");
const input = document.getElementById("cityInput");
const suggestionsList = document.getElementById("suggestions");
const searchButton = document.getElementById("searchButton");
const statusMessageEl = document.getElementById("statusMessage");
const cityOptionButtons = document.querySelectorAll(".city-option");
const cityNameEl = document.getElementById("cityName");
const changeCityButton = document.getElementById("changeCityButton");
const lastUpdatedEl = document.getElementById("lastUpdated");
const dateEl = document.getElementById("dateLabel");
const conditionTextEl = document.getElementById("conditionText");
const tempEl = document.getElementById("temp");
const feelsLikeEl = document.getElementById("feelsLike");
const windEl = document.getElementById("wind");
const humidityEl = document.getElementById("humidity");
const uvEl = document.getElementById("uv");
const aqiEl = document.getElementById("aqi");
const appBackground = document.getElementById("appBackground");

let debounceTimer;

input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = input.value.trim();

  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  debounceTimer = setTimeout(()=>fetchSuggestions(query), 300);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    selectCity(input.value);
  }
});

searchButton.addEventListener("click", () => {
  selectCity(input.value);
});

cityOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const cityName = button.dataset.city;
    input.value = cityName;
    selectCity(cityName);
  });
});

if (changeCityButton) {
  changeCityButton.addEventListener("click", () => {
    input.focus();
    input.select();
  });
}

async function fetchSuggestions(query) {
  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(query)}`,
    );
    if (!res.ok) throw new Error("Search Failed");
    const cities = await res.json();
    renderSuggestions(cities);
  } catch (error) {
    console.error(error);
  }
}

function renderSuggestions(cities) {
  suggestionsList.innerHTML = "";
  if (!cities) {
    hideSuggestions();
    return;
  }
  cities.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = `${city.name}${city.region ?","+ city.region : ""},${city.country}`;
    li.className =
      "px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 cursor-pointer";
    li.addEventListener("click", () => {
      const selectedLabel = li.textContent.trim();
      input.value = selectedLabel;
      hideSuggestions();
      setStatus(`Showing weather for ${selectedLabel}.`);
      getWeatherDataByName(selectedLabel);
    });
    suggestionsList.appendChild(li);
  });

  suggestionsList.classList.remove("hidden");
}

function hideSuggestions() {
  suggestionsList.classList.add("hidden");
  suggestionsList.innerHTML = "";
}

function setStatus(message, isError = false) {
  if (!statusMessageEl) return;
  statusMessageEl.textContent = message;
  statusMessageEl.classList.toggle("hidden", !message);
  statusMessageEl.classList.toggle("text-red-400", isError);
  statusMessageEl.classList.toggle("text-zinc-500", !isError);
}

function selectCity(query) {
  const cityName = query.trim();

  if (!cityName) {
    setStatus("Please enter a city name.", true);
    return;
  }

  hideSuggestions();
  input.value = cityName;
  setStatus(`Loading weather for ${cityName}...`);
  getWeatherDataByName(cityName);
}

document.addEventListener("DOMContentLoaded", () => {
  const defaultCity = "Delhi";
  input.value = defaultCity;
  setStatus(`Loading weather for ${defaultCity}...`);
  getWeatherDataByName(defaultCity);
});

async function getWeatherDataByName(cityName) {
  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(cityName)}&aqi=yes`,
    );
    if (!res.ok) throw new Error("City not found");
    const data = await res.json();
    renderWeather(data);
    setStatus(`Showing weather for ${data.location.name}, ${data.location.country}.`);
  } catch (error) {
    console.error(error);
    setStatus(`Could not find weather for ${cityName}.`, true);
  }
}

async function getWeatherData(lat, lon) {
  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=yes`,
    );
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    renderWeather(data);
  } catch (error) {
    console.error(error);
  }
}

function renderWeather(data) {
  const { location, current } = data;

  if (location && location.localtime) {
    dateEl.textContent = formatDate(location.localtime);
  }
  if (timezoneEl && location.tz_id) {
    timezoneEl.textContent = location.tz_id; 
    
  }
  cityNameEl.textContent = `${location.name},${location.country}`;
  lastUpdatedEl.textContent = "Last updated: just now";
  conditionTextEl.textContent = current.condition.text;
  tempEl.textContent = Math.round(current.temp_c);
  feelsLikeEl.textContent = `${Math.round(current.feelslike_c)}°C`;
  windEl.textContent = `${current.wind_dir} ${current.wind_kph} km/h`;
  humidityEl.textContent = `${current.humidity}%`;
  uvEl.innerHTML = `${current.uv} <span class="text-xs text-zinc-500 font-normal ml-1">(${uvLabel(current.uv)})</span>`;
  lastUpdatedEl.textContent = "Last updated: just now";
  
  if (current.air_quality && current.air_quality.pm2_5 != null) {
    const aqi = Math.round(current.air_quality.pm2_5);
    
    aqiEl.innerHTML = `<span id="blink" class="w-1.5 h-1.5 rounded-full animate-pulse"></span> ${aqi} <span class="text-xs text-zinc-500 font-normal">(${aqiLabel(aqi)})</span>`;
    blinkbox(aqi); 
  } else {
    aqiEl.textContent = "N/A";
  }
  changeBackground(current.condition.text, location.localtime);
}

function blinkbox(aqi){
  
  const blinkDot = document.getElementById("blink");
  aqiEl.classList.remove("text-emerald-400","text-yellow-400","text-orange-400","text-red-400");
  blinkDot.classList.remove("bg-red-500","bg-emerald-500","bg-yellow-500","bg-orange-500");
  
  if(aqi<=12){
    aqiEl.classList.add("text-emerald-400");
    blinkDot.classList.add("bg-emerald-500");
  }else if(aqi<=35){
    aqiEl.classList.add("text-yellow-400");
    blinkDot.classList.add("bg-yellow-500");
  }else if(aqi<=55){
    aqiEl.classList.add("text-orange-400");
    blinkDot.classList.add("bg-orange-500");
  }else{
    aqiEl.classList.add("text-red-400");
    blinkDot.classList.add("bg-red-500");
  }
}

function formatDate(localtime) {
  const parts = localtime.split(/[- :]/);
  const date = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function uvLabel(uv) {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Mod";
  if (uv <= 7) return "High";
  return "Very High";
}


function aqiLabel(pm25) {
  if (pm25 <= 12){ return "Good";}
  if (pm25 <= 35){ return "Moderate";}
  if (pm25 <= 55){ return "Unhealthy";}
  
  return "Hazardous";
  
}
function changeBackground(condition, localtime){

    const hour = Number(localtime.split(" ")[1].split(":")[0]);
    const isDay = hour >= 6 && hour < 19;

    const text = condition.toLowerCase();

    let weather;

    if(text.includes("thunder")){
        weather = "thunder";
    }
    else if(
        text.includes("rain") ||
        text.includes("drizzle") ||
        text.includes("shower")
    ){
        weather = "rain";
    }
    else if(
        text.includes("snow") ||
        text.includes("blizzard") ||
        text.includes("sleet") ||
        text.includes("ice")
    ){
        weather = "snow";
    }
    else if(
        text.includes("cloud") ||
        text.includes("overcast")
    ){
        weather = "cloudy";
    }
    else if(
        text.includes("mist") ||
        text.includes("fog")
    ){
        weather = "cloudy";
    }
    else{
        weather = "sunny";
    }

    appBackground.classList.remove(
        "sunny-day",
        "cloudy-day",
        "rain-day",
        "snow-day",
        "thunder-day",
        "clear-night",
        "cloudy-night",
        "rain-night",
        "snow-night",
        "thunder-night"
    );

    if(isDay){
        appBackground.classList.add(`${weather}-day`);
    }
    else{
        appBackground.classList.add(
            weather==="sunny" ? "clear-night" : `${weather}-night`
        );
    }
}