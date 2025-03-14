const apiKey = "75a7e89329586e64789c4a51059f24ba";
const baseUrl = "https://api.themoviedb.org/3";
const imageBaseUrl = "https://image.tmdb.org/t/p/w500";
const mainContent = document.getElementById("mainContent");
const searchBox = document.getElementById("searchBox");
const suggestionsBox = document.getElementById("suggestions");
const goHollywoodBtn = document.getElementById("goHollywoodBtn");
const goBollywoodBtn = document.getElementById("goBollywoodBtn");

// Track current language (default: English)
let currentLanguage = "en";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBheoLlOSdjle4CCZpb1vLtg4R1OWyE5bQ",
  authDomain: "watch-this-f0b71.firebaseapp.com",
  projectId: "watch-this-f0b71",
  storageBucket: "watch-this-f0b71.firebasestorage.app",
  messagingSenderId: "1008946322583",
  appId: "1:1008946322583:web:dee56d71e612d35001ddd2",
  measurementId: "G-6TVXR7Y6QJ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Fetch movie genres
async function fetchGenres() {
  try {
    const response = await fetch(`${baseUrl}/genre/movie/list?api_key=${apiKey}&language=${currentLanguage}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log(`Fetched genres (${currentLanguage}):`, data.genres);
    return data.genres || [];
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

// Fetch movies by genre with language filter
async function fetchMoviesByGenre(genreId, page = 1) {
  try {
    const response = await fetch(`${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genreId}&page=${page}&with_original_language=${currentLanguage}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log(`Movies for genre ${genreId} (${currentLanguage}):`, data.results);
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error);
    return [];
  }
}

// Fetch web series by genre with language filter
async function fetchSeriesByGenre(genreId, page = 1) {
  try {
    const response = await fetch(`${baseUrl}/discover/tv?api_key=${apiKey}&with_genres=${genreId}&page=${page}&with_original_language=${currentLanguage}&with_networks=213|8|9`); // Netflix (213), Amazon (8), Hulu (9)
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log(`Series for genre ${genreId} (${currentLanguage}):`, data.results);
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching series for genre ${genreId}:`, error);
    return [];
  }
}

// Fetch latest web series with language and streaming filter
async function fetchLatestSeries(page = 1) {
  try {
    const response = await fetch(`${baseUrl}/discover/tv?api_key=${apiKey}&page=${page}&with_original_language=${currentLanguage}&with_networks=213|8|9&sort_by=popularity.desc`); // Netflix, Amazon, Hulu
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log(`Latest series (${currentLanguage}):`, data.results);
    return data.results || [];
  } catch (error) {
    console.error("Error fetching latest series:", error);
    return [];
  }
}

// Create category section
function createCategorySection(genreName) {
  if (!mainContent) {
    console.error("Cannot create section: mainContent is null");
    return null;
  }

  const section = document.createElement("section");
  section.classList.add("category-section");

  const title = document.createElement("h2");
  title.classList.add("category-title");
  title.textContent = genreName;

  const catalogContainer = document.createElement("div");
  catalogContainer.classList.add("movie-catalog");

  const leftArrow = document.createElement("button");
  leftArrow.classList.add("scroll-arrow", "left");
  leftArrow.innerHTML = "←";
  leftArrow.onclick = () => scrollCatalog(catalogContainer, -200);

  const rightArrow = document.createElement("button");
  rightArrow.classList.add("scroll-arrow", "right");
  rightArrow.innerHTML = "→";
  rightArrow.onclick = () => scrollCatalog(catalogContainer, 200);

  const fadeLeft = document.createElement("div");
  fadeLeft.classList.add("fade", "left");

  const fadeRight = document.createElement("div");
  fadeRight.classList.add("fade", "right");

  section.appendChild(title);
  section.appendChild(catalogContainer);
  section.appendChild(leftArrow);
  section.appendChild(rightArrow);
  section.appendChild(fadeLeft);
  section.appendChild(fadeRight);

  mainContent.appendChild(section);
  console.log(`Created section: ${genreName}`);
  return catalogContainer;
}

// Scroll the catalog horizontally
function scrollCatalog(catalog, distance) {
  if (catalog) catalog.scrollBy({ left: distance, behavior: "smooth" });
}

// Load movies and series into genre category
async function loadMedia(catalog, genreId) {
  if (!catalog) return;

  const movies = await fetchMoviesByGenre(genreId);
  const series = await fetchSeriesByGenre(genreId);
  const combinedItems = [
    ...movies.map(item => ({ ...item, mediaType: 'movie' })),
    ...series.map(item => ({ ...item, mediaType: 'series' }))
  ].slice(0, 20);

  if (combinedItems.length === 0) {
    console.warn(`No media found for genre ${genreId} in ${currentLanguage}`);
    catalog.innerHTML = "<p>No content available in this language.</p>";
    return;
  }

  combinedItems.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.innerHTML = `
      <img src="${imageBaseUrl}${item.poster_path || '/placeholder.jpg'}" alt="${item.title || item.name}" />
      <div class="details">
        <div class="title">${item.title || item.name}</div>
        <div class="year">${new Date(item.release_date || item.first_air_date).getFullYear() || 'N/A'}</div>
        <div class="media-type">${item.mediaType === 'movie' ? 'Movie' : 'Series'}</div>
      </div>
    `;
    card.onclick = () => {
      window.location.href = `movie.html?id=${item.id}&type=${item.mediaType}`;
    };
    catalog.appendChild(card);
  });
}

// Load latest web series
async function loadLatestSeries(catalog) {
  if (!catalog) return;

  const series = await fetchLatestSeries();
  if (series.length === 0) {
    console.warn(`No latest series found in ${currentLanguage}`);
    catalog.innerHTML = "<p>No latest series available in this language.</p>";
    return;
  }

  series.slice(0, 20).forEach(item => {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.innerHTML = `
      <img src="${imageBaseUrl}${item.poster_path || '/placeholder.jpg'}" alt="${item.name}" />
      <div class="details">
        <div class="title">${item.name}</div>
        <div class="year">${new Date(item.first_air_date).getFullYear() || 'N/A'}</div>
        <div class="media-type">Series</div>
      </div>
    `;
    card.onclick = () => {
      window.location.href = `movie.html?id=${item.id}&type=series`;
    };
    catalog.appendChild(card);
  });
}

// Load all genres and latest series
async function loadGenresAndMovies() {
  if (!mainContent) {
    console.error("mainContent is null, cannot load content");
    return;
  }

  // Clear existing content
  mainContent.innerHTML = "";

  try {
    // Load Latest Series
    const latestCatalog = createCategorySection("Latest Series");
    if (latestCatalog) await loadLatestSeries(latestCatalog);
    else console.error("Failed to create Latest Series catalog");

    // Load genre categories
    const genres = await fetchGenres();
    if (genres.length === 0) console.warn("No genres available");
    for (const genre of genres) {
      const catalog = createCategorySection(genre.name);
      if (catalog) await loadMedia(catalog, genre.id);
      else console.error(`Failed to create catalog for ${genre.name}`);
    }
  } catch (error) {
    console.error("Error in loadGenresAndMovies:", error);
    mainContent.innerHTML = "<p>Error loading content. Please try again.</p>";
  }
}

// Fetch suggestions with language filter
async function fetchSuggestions(event) {
  if (!suggestionsBox) return;

  const query = event.target.value.trim();
  if (query.length < 3) {
    suggestionsBox.innerHTML = "";
    return;
  }

  try {
    const movieResponse = await fetch(`${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&with_original_language=${currentLanguage}`);
    const movieData = await movieResponse.json();

    const seriesResponse = await fetch(`${baseUrl}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&with_original_language=${currentLanguage}&with_networks=213|8|9`);
    const seriesData = await seriesResponse.json();

    const combinedResults = [
      ...movieData.results.map(movie => ({ ...movie, mediaType: 'movie' })),
      ...seriesData.results.map(series => ({ ...series, mediaType: 'series' }))
    ];

    suggestionsBox.innerHTML = combinedResults
      .map(item => `
        <div class="suggestion-item" onclick="redirectToSearchPage('${query}')">
          ${item.title || item.name} (${new Date(item.release_date || item.first_air_date).getFullYear() || 'N/A'}) - ${item.mediaType === 'movie' ? 'Movie' : 'Series'}
        </div>
      `)
      .join("");
  } catch (error) {
    console.error("Error fetching suggestions:", error);
  }
}

// Redirect to search page
function redirectToSearchPage(query) {
  window.location.href = `search.html?query=${encodeURIComponent(query)}`;
}

// Perform search on Enter key press
function performSearch(event) {
  if (event.key === "Enter") {
    const query = searchBox.value.trim();
    if (query.length >= 3) {
      window.open(`search.html?query=${encodeURIComponent(query)}`, '_blank');
    }
  }
}

// Display greeting
function displayGreeting() {
  const greetingElement = document.getElementById('greeting');
  if (!greetingElement) return;

  const user = auth.currentUser;
  if (user) {
    const username = user.email.split('@')[0];
    greetingElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: flex-end;">
        <div style="font-size: 1.2rem; font-weight: bold;">Hi, ${username}</div>
        <button onclick="logout()" class="logout-btn">Logout</button>
      </div>
    `;
  } else {
    greetingElement.innerHTML = `
      <a href="login.html" style="color: white; text-decoration: none; font-size: 1.2rem;">Log In</a>
    `;
  }
}

auth.onAuthStateChanged(function(user) {
  displayGreeting();
});

// Logout function
function logout() {
  auth.signOut().then(function() {
    window.location.href = 'login.html';
  }).catch(function(error) {
    alert('Error logging out: ' + error.message);
  });
}

// Modified loadMedia function
async function loadMedia(catalog, genreId) {
  if (!catalog) return;

  const movies = await fetchMoviesByGenre(genreId);
  const series = await fetchSeriesByGenre(genreId);
  const combinedItems = [
      ...movies.map(item => ({ ...item, mediaType: 'movie' })),
      ...series.map(item => ({ ...item, mediaType: 'series' }))
  ].slice(0, 20);

  if (combinedItems.length === 0) {
      console.warn(`No media found for genre ${genreId} in ${currentLanguage}`);
      catalog.innerHTML = "<p>No content available in this language.</p>";
      return;
  }

  combinedItems.forEach(item => {
      const card = document.createElement("div");
      card.classList.add("movie-card");
      card.innerHTML = `
          <img 
              src="${imageBaseUrl}${item.poster_path || '/placeholder.jpg'}" 
              loading="lazy"
              alt="${item.title || item.name}" 
          />
          <div class="details">
              <div class="title">${item.title || item.name}</div>
              <div class="year">${new Date(item.release_date || item.first_air_date).getFullYear() || 'N/A'}</div>
              <div class="media-type">${item.mediaType === 'movie' ? 'Movie' : 'Series'}</div>
          </div>
      `;
      card.onclick = () => {
          window.location.href = `movie.html?id=${item.id}&type=${item.mediaType}`;
      };
      catalog.appendChild(card);
  });
}

// Modified loadLatestSeries function
async function loadLatestSeries(catalog) {
  if (!catalog) return;

  const series = await fetchLatestSeries();
  if (series.length === 0) {
      console.warn(`No latest series found in ${currentLanguage}`);
      catalog.innerHTML = "<p>No latest series available in this language.</p>";
      return;
  }

  series.slice(0, 20).forEach(item => {
      const card = document.createElement("div");
      card.classList.add("movie-card");
      card.innerHTML = `
          <img 
              src="${imageBaseUrl}${item.poster_path || '/placeholder.jpg'}" 
              loading="lazy"
              alt="${item.name}" 
          />
          <div class="details">
              <div class="title">${item.name}</div>
              <div class="year">${new Date(item.first_air_date).getFullYear() || 'N/A'}</div>
              <div class="media-type">Series</div>
          </div>
      `;
      card.onclick = () => {
          window.location.href = `movie.html?id=${item.id}&type=series`;
      };
      catalog.appendChild(card);
  });
}

// Language switch functions
function switchToEnglish() {
  currentLanguage = "en";
  goHollywoodBtn.classList.add("active");
  goBollywoodBtn.classList.remove("active");
  loadGenresAndMovies();
}

function switchToHindi() {
  currentLanguage = "hi";
  goBollywoodBtn.classList.add("active");
  goHollywoodBtn.classList.remove("active");
  loadGenresAndMovies();
}

// Event listeners for buttons
goHollywoodBtn.addEventListener("click", switchToEnglish);
goBollywoodBtn.addEventListener("click", switchToHindi);

// Initial load
loadGenresAndMovies();

