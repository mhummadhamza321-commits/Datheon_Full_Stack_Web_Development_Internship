
const API_BASE = "https://api.openweathermap.org/data/2.5";

const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const searchButton = document.querySelector("#search-button");
const statusMessage = document.querySelector("#status-message");
const dashboard = document.querySelector("#weather-dashboard");

const cityName = document.querySelector("#city-name");
const currentDate = document.querySelector("#current-date");
const weatherIcon = document.querySelector("#weather-icon");
const temperature = document.querySelector("#temperature");
const weatherDescription = document.querySelector("#weather-description");
const feelsLike = document.querySelector("#feels-like");
const humidity = document.querySelector("#humidity");
const windSpeed = document.querySelector("#wind-speed");
const pressure = document.querySelector("#pressure");
const forecastList = document.querySelector("#forecast-list");

const weatherConfig = window.WEATHER_CONFIG;
const API_KEY = weatherConfig?.API_KEY?.trim();

const weatherIcons = {
    "01d": "☀️",
    "01n": "🌙",
    "02d": "🌤️",
    "02n": "☁️",
    "03d": "☁️",
    "03n": "☁️",
    "04d": "☁️",
    "04n": "☁️",
    "09d": "🌧️",
    "09n": "🌧️",
    "10d": "🌦️",
    "10n": "🌧️",
    "11d": "⛈️",
    "11n": "⛈️",
    "13d": "❄️",
    "13n": "❄️",
    "50d": "🌫️",
    "50n": "🌫️"
};

function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`.trim();
}

function setLoading(isLoading) {
    searchButton.disabled = isLoading;
    cityInput.disabled = isLoading;
    searchButton.innerHTML = isLoading
        ? "Loading…"
        : 'Search <span>→</span>';

    if (isLoading) {
        setStatus("Fetching weather data…");
    }
}

function formatDate(timestamp, timezoneOffset, options) {
    // OpenWeather timestamps are Unix seconds.
    // Shift by the city's timezone before formatting in UTC.
    const cityTime = new Date(
        (timestamp + timezoneOffset) * 1000
    );

    return new Intl.DateTimeFormat("en-US", {
        ...options,
        timeZone: "UTC"
    }).format(cityTime);
}

function getWeatherIcon(iconCode) {
    return weatherIcons[iconCode] || "🌡️";
}

function updateBackground(weatherMain, iconCode) {
    document.body.classList.remove(
        "sunny",
        "rainy",
        "cloudy",
        "night"
    );

    // The "n" suffix indicates nighttime in OpenWeather icon codes.
    if (iconCode?.endsWith("n")) {
        document.body.classList.add("night");
        return;
    }

    const condition = weatherMain.toLowerCase();

    if (["thunderstorm", "drizzle", "rain", "snow"].includes(condition)) {
        document.body.classList.add("rainy");
    } else if (["clouds", "mist", "fog", "haze", "smoke", "dust", "sand", "ash", "squall", "tornado"].includes(condition)) {
        document.body.classList.add("cloudy");
    } else {
        document.body.classList.add("sunny");
    }
}

async function fetchWeather(endpoint, params = {}) {
    if (!API_KEY || API_KEY === "YOUR_OPENWEATHER_API_KEY") {
        throw new Error(
            "Add your OpenWeather API key to config.js before searching."
        );
    }

    const query = new URLSearchParams({
        ...params,
        appid: API_KEY
    });

    const response = await fetch(`${API_BASE}/${endpoint}?${query}`);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                "The API key is invalid or not activated yet. Check your OpenWeather account."
            );
        }

        if (response.status === 404) {
            throw new Error(
                "City not found. Check the spelling and try again."
            );
        }

        if (response.status === 429) {
            throw new Error(
                "API request limit reached. Please try again later."
            );
        }

        throw new Error(
            "Unable to retrieve weather data. Please try again."
        );
    }

    return response.json();
}

function renderCurrentWeather(data) {
    const { main, weather, wind, name, sys, timezone, dt } = data;
    const condition = weather[0];
    const iconCode = condition.icon;

    cityName.textContent = `${name}, ${sys.country}`;
    currentDate.textContent = formatDate(dt, timezone, {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });

    weatherIcon.textContent = getWeatherIcon(iconCode);
    temperature.textContent = `${Math.round(main.temp)}°`;
    weatherDescription.textContent = condition.description;
    feelsLike.textContent = `Feels like ${Math.round(main.feels_like)}°C`;
    humidity.textContent = `${main.humidity}%`;
    windSpeed.textContent = `${wind.speed} m/s`;
    pressure.textContent = `${main.pressure} hPa`;

    updateBackground(condition.main, iconCode);
}

function getDailyForecast(forecastData) {
    const { list, city } = forecastData;
    const days = new Map();

    for (const item of list) {
        const localDate = formatDate(item.dt, city.timezone, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });

        if (!days.has(localDate)) {
            days.set(localDate, []);
        }

        days.get(localDate).push(item);
    }

    // Choose the entry closest to noon for each local calendar day.
    const daily = [];

    for (const entries of days.values()) {
        const midday = entries.reduce((closest, item) => {
            const hour = Number(
                formatDate(item.dt, city.timezone, {
                    hour: "2-digit",
                    hourCycle: "h23"
                })
            );

            const closestHour = Number(
                formatDate(closest.dt, city.timezone, {
                    hour: "2-digit",
                    hourCycle: "h23"
                })
            );

            return Math.abs(hour - 12) < Math.abs(closestHour - 12)
                ? item
                : closest;
        });

        daily.push(midday);
    }

    // Skip today so the cards show the next five calendar days.
    const today = formatDate(
        Date.now() / 1000,
        city.timezone,
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    );

    return daily
        .filter((item) => {
            const date = formatDate(item.dt, city.timezone, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });

            return date !== today;
        })
        .slice(0, 5);
}

function renderForecast(forecastData) {
    const dailyForecast = getDailyForecast(forecastData);

    if (dailyForecast.length === 0) {
        forecastList.textContent = "Forecast data is currently unavailable.";
        return;
    }

    forecastList.replaceChildren();

    dailyForecast.forEach((day) => {
        const card = document.createElement("article");
        card.className = "forecast-card";

        const dayName = formatDate(day.dt, forecastData.city.timezone, {
            weekday: "short"
        });

        const icon = getWeatherIcon(day.weather[0].icon);
        const temp = `${Math.round(day.main.temp)}°`;
        const description = day.weather[0].description;

        const dayElement = document.createElement("p");
        dayElement.className = "forecast-day";
        dayElement.textContent = dayName;

        const iconElement = document.createElement("div");
        iconElement.className = "forecast-icon";
        iconElement.textContent = icon;
        iconElement.setAttribute("aria-hidden", "true");

        const tempElement = document.createElement("p");
        tempElement.className = "forecast-temp";
        tempElement.textContent = temp;

        const descriptionElement = document.createElement("p");
        descriptionElement.className = "forecast-condition";
        descriptionElement.textContent = description;

        card.append(
            dayElement,
            iconElement,
            tempElement,
            descriptionElement
        );

        forecastList.appendChild(card);
    });
}

async function searchCity(city) {
    const cityQuery = city.trim();

    if (!cityQuery) {
        setStatus("Please enter a city name.", "error");
        cityInput.focus();
        return;
    }

    setLoading(true);

    try {
        const currentData = await fetchWeather("weather", {
            q: cityQuery,
            units: "metric"
        });

        const forecastData = await fetchWeather("forecast", {
            q: cityQuery,
            units: "metric"
        });

        renderCurrentWeather(currentData);
        renderForecast(forecastData);

        dashboard.hidden = false;
        setStatus(`Weather updated for ${currentData.name}.`, "success");
    } catch (error) {
        setStatus(error.message || "Something went wrong.", "error");
    } finally {
        setLoading(false);
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchCity(cityInput.value);
});

// Display a helpful message until a city is searched.
if (!API_KEY || API_KEY === "YOUR_OPENWEATHER_API_KEY") {
    setStatus("Configure your API key in config.js to get started.");
}
