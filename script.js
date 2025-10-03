const apiKey = ""; // Your OpenWeatherMap API key

// ---------------------------------------------------------------------
// --- Helper Functions for Formatting ---
// ---------------------------------------------------------------------
function formatSunTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate() {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function capitalizeWords(text) {
    return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ---------------------------------------------------------------------
// --- Map to your `animated/` SVG set ---
// ---------------------------------------------------------------------
function getLocalIconPath(iconCode = '', weatherId = 0) {
    const base = 'animated/';
    const isDay = iconCode.endsWith('d');

    // Thunderstorms
    if (weatherId >= 200 && weatherId < 300) {
        return base + 'thunderstorms.svg';
    }

    // Drizzle (~light rain)
    if (weatherId >= 300 && weatherId < 400) {
        return base + (isDay ? 'rainy-1-day.svg' : 'rainy-1-night.svg');
    }

    // Rain
    if (weatherId >= 500 && weatherId < 600) {
        if (weatherId === 511) return base + 'rain-and-snow-mix.svg';
        if (weatherId >= 500 && weatherId <= 501) return base + (isDay ? 'rainy-1-day.svg' : 'rainy-1-night.svg');
        if (weatherId >= 502 && weatherId <= 504) return base + (isDay ? 'rainy-2-day.svg' : 'rainy-2-night.svg');
        if (weatherId >= 520 && weatherId <= 531) return base + (isDay ? 'rainy-3-day.svg' : 'rainy-3-night.svg');
        return base + (isDay ? 'rainy-2-day.svg' : 'rainy-2-night.svg');
    }

    // Snow
    if (weatherId >= 600 && weatherId < 700) {
        if (weatherId === 611 || weatherId === 612 || weatherId === 613) return base + 'snow-and-sleet-mix.svg';
        if (weatherId >= 600 && weatherId <= 602) return base + (isDay ? 'snowy-1-day.svg' : 'snowy-1-night.svg');
        if (weatherId >= 611 && weatherId <= 622) return base + (isDay ? 'snowy-2-day.svg' : 'snowy-2-night.svg');
        return base + (isDay ? 'snowy-3-day.svg' : 'snowy-3-night.svg');
    }

    // Atmosphere: mist, smoke, haze, dust, fog...
    if (weatherId >= 700 && weatherId < 800) {
        if (weatherId === 741) return base + (isDay ? 'fog-day.svg' : 'fog-night.svg');
        if (weatherId === 721) return base + (isDay ? 'haze-day.svg' : 'haze-night.svg');
        if (weatherId === 711) return base + 'frost.svg'; 
        if (weatherId === 731 || weatherId === 761 || weatherId === 751) return base + 'dust.svg';
        return base + 'haze.svg';
    }

    // Clear
    if (weatherId === 800) {
        return base + (isDay ? 'clear-day.svg' : 'clear-night.svg');
    }

    // Clouds: few/partly/overcast
    if (weatherId === 801) return base + (isDay ? 'cloudy-1-day.svg' : 'cloudy-1-night.svg');
    if (weatherId === 802) return base + (isDay ? 'cloudy-2-day.svg' : 'cloudy-2-night.svg');
    if (weatherId === 803 || weatherId === 804) return base + (isDay ? 'cloudy-3-day.svg' : 'cloudy-3-night.svg');

    // Fallbacks
    if (weatherId === 781) return base + 'tornado.svg';
    return base + 'cloudy.svg';
}


// ---------------------------------------------------------------------
// --- Update UI functions ---
// ---------------------------------------------------------------------
function updateWeatherUI(data) {
    if (!data || !data.main) return;
    document.getElementById("cityName").innerText = `${data.name || '--'}, ${data.sys?.country || ''}`;
    document.getElementById("temperature").innerText = Math.round(data.main.temp) + "°C";
    document.getElementById("weatherCondition").innerText =
        capitalizeWords(data.weather[0].description);
        
    const iconPath = getLocalIconPath(data.weather[0].icon, data.weather[0].id);
    const mainIcon = document.getElementById("mainWeatherIcon");
    mainIcon.src = iconPath;
    mainIcon.alt = data.weather[0].description || 'weather icon';

    document.getElementById("currentDate").innerText = formatDate();
    document.getElementById("currentTime").innerText = getCurrentTime();
    document.getElementById("pressureValue").innerText = `${data.main.pressure} hPa`;
    document.getElementById("humidityValue").innerText = `${data.main.humidity}%`;
    const windKmH = (data.wind.speed * 3.6).toFixed(1);
    document.getElementById("windValue").innerText = `${windKmH} km/h`;
    document.getElementById("feelsLikeValue").innerText = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById("sunriseTime").innerText = formatSunTime(data.sys.sunrise);
    document.getElementById("sunsetTime").innerText = formatSunTime(data.sys.sunset);
}

function updateForecastUI(data) {
    if (!data || !data.list) {
        document.getElementById("forecast").innerHTML = "";
        return;
    }

    // Logic to select 5 days, prioritizing 12:00:00 entry
    const list = data.list;
    let daily = [];
    for (let i = 0; i < list.length && daily.length < 5; i++) {
        if (list[i].dt_txt.includes("12:00:00")) daily.push(list[i]);
    }
    // Fallback if needed
    if (daily.length < 5) {
        daily = [];
        for (let i = 0; i < list.length && daily.length < 5; i += 8) {
            daily.push(list[i]);
        }
    }


    let forecastHTML = "";
    daily.forEach(item => {
        const dayName = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "long" });
        const iconPath = getLocalIconPath(item.weather[0].icon, item.weather[0].id);
        const temp = Math.round(item.main.temp);
        forecastHTML += `
            <div class="forecast-item">
                <span>${dayName}</span>
                <img src="${iconPath}" alt="${item.weather[0].description}" class="forecast-icon" style="width:30px;height:30px;">
                <span>${temp}°C</span>
            </div>
        `;
    });

    document.getElementById("forecast").innerHTML = forecastHTML;
}

function updateHourlyUI(data) {
    if (!data || !data.list) return;
    const hourlyContainer = document.getElementById("hourlyContainer");
    
    // Take the next 8 forecast items (approx 24 hours in 3-hour steps)
    const items = data.list.slice(0, 8);
    let html = "";
    
    items.forEach(it => {
        const timeStr = new Date(it.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const iconPath = getLocalIconPath(it.weather[0].icon, it.weather[0].id);
        const temp = Math.round(it.main.temp);
        
        html += `
            <div class="hourly-item">
                <p>${timeStr}</p>
                <img src="${iconPath}" alt="${it.weather[0].description}" style="width:32px;height:32px;margin:6px 0;">
                <span>${temp}°C</span>
            </div>
        `;
    });
    hourlyContainer.innerHTML = html;
}

// NEW: Function to fetch Air Quality Index
async function fetchAQI(lat, lon) {
    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    try {
        const res = await fetch(aqiUrl);
        const aqiData = await res.json();

        if (aqiData.list && aqiData.list.length > 0) {
            const components = aqiData.list[0].components;
            // Update AQI values dynamically
            document.querySelector(".aqi-item:nth-child(1) span").innerText = components.pm2_5 ? components.pm2_5.toFixed(2) : '--';
            document.querySelector(".aqi-item:nth-child(2) span").innerText = components.so2 ? components.so2.toFixed(2) : '--';
            document.querySelector(".aqi-item:nth-child(3) span").innerText = components.no2 ? components.no2.toFixed(2) : '--';
            document.querySelector(".aqi-item:nth-child(4) span").innerText = components.o3 ? components.o3.toFixed(2) : '--';
        } else {
             document.querySelectorAll(".aqi-item span").forEach(span => span.innerText = 'N/A');
        }
    } catch (error) {
        console.error("Error fetching AQI:", error);
    }
}

// ---------------------------------------------------------------------
// --- Fetch & Wiring (Unified Functions) ---
// ---------------------------------------------------------------------
async function fetchWeatherAndForecast(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;

    try {
        const [weatherRes, forecastRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);
        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        if (weatherData.cod != 200) {
            document.getElementById("cityName").innerText = "City not found!";
            document.getElementById("temperature").innerText = "--°C";
            document.getElementById("weatherCondition").innerText = "Please check city name.";
            document.getElementById("forecast").innerHTML = "";
            document.getElementById("hourlyContainer").innerHTML = "";
            return;
        }

        updateWeatherUI(weatherData);
        updateForecastUI(forecastData);
        updateHourlyUI(forecastData);
        fetchAQI(weatherData.coord.lat, weatherData.coord.lon);
    } catch (error) {
        console.error("Error fetching weather:", error);
    }
}

async function fetchWeatherAndForecastByCoords(lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    try {
        const [weatherRes, forecastRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);
        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        updateWeatherUI(weatherData);
        updateForecastUI(forecastData);
        updateHourlyUI(forecastData);
        fetchAQI(lat, lon);
    } catch (error) {
        console.error("Error fetching weather by coords:", error);
    }
}

// ---------------------------------------------------------------------
// --- Search & Event Listeners ---
// ---------------------------------------------------------------------
const searchHandler = () => {
    let city = document.getElementById("searchCity").value;
    if (city.trim() !== "") {
        fetchWeatherAndForecast(city);
    }
};

document.getElementById("searchCity").addEventListener("keypress", function (e) {
    if (e.key === "Enter") searchHandler();
});
document.getElementById("searchBtn").addEventListener("click", searchHandler);

// ---------------------------------------------------------------------
// --- Geolocation (On-Demand & Initial Load) ---
// ---------------------------------------------------------------------
const defaultCity = "Bengaluru"; 

const handleGeolocation = () => {
    const geoBtn = document.getElementById("liveLocationBtn");
    
    // Set loading state and disable button during fetch
    if (geoBtn) {
        geoBtn.disabled = true;
        geoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 
    }
    document.getElementById("cityName").innerText = "Detecting Location...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            await fetchWeatherAndForecastByCoords(lat, lon);

            // Reverse Geocoding to get the user-friendly city name
            try {
                 const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
                 const res = await fetch(geoUrl);
                 const geoData = await res.json();
                 
                 if (Array.isArray(geoData) && geoData.length > 0) {
                     document.getElementById("cityName").innerText = `${geoData[0].name}, ${geoData[0].country}`;
                 }
            } catch(e) {
                console.error("Reverse Geocoding failed:", e);
            }
            
            // Re-enable button and reset icon
            if (geoBtn) {
                geoBtn.disabled = false;
                geoBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            }

        }, (error) => {
            console.warn("⚠️ Geolocation denied or failed:", error);
            fetchWeatherAndForecast(defaultCity);
            // Re-enable button and reset icon on failure
            if (geoBtn) {
                geoBtn.disabled = false;
                geoBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            }
        });
    } else {
        console.warn("⚠️ Geolocation not supported on this browser.");
        fetchWeatherAndForecast(defaultCity);
        // Re-enable button and reset icon on failure
        if (geoBtn) {
            geoBtn.disabled = false;
            geoBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
        }
    }
};

// Initial Load: Automatically try to get location once on page load
document.addEventListener('DOMContentLoaded', handleGeolocation);

// Wiring the new Live Location button
document.getElementById("liveLocationBtn").addEventListener("click", handleGeolocation);