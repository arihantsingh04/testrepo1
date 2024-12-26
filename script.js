const apiKey = "75a7e89329586e64789c4a51059f24ba";
const baseUrl = "https://api.themoviedb.org/3";
const imageBaseUrl = "https://image.tmdb.org/t/p/w500";
const mainContent = document.getElementById("mainContent");
const searchBox = document.getElementById("searchBox");
const suggestionsBox = document.getElementById("suggestions");

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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Fetch and display genres
async function fetchGenres() {
  const response = await fetch(`${baseUrl}/genre/movie/list?api_key=${apiKey}`);
  const data = await response.json();
  return data.genres; // Returns an array of genres with id and name
}

// Fetch movies by genre
async function fetchMoviesByGenre(genreId, page = 1) {
  const response = await fetch(`${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genreId}&page=${page}`);
  const data = await response.json();
  return data.results; // Returns an array of movies
}

// Create category section
function createCategorySection(genreName) {
  const section = document.createElement("section");
  section.classList.add("category-section");

  const title = document.createElement("h2");
  title.classList.add("category-title");
  title.textContent = genreName;

  const catalogContainer = document.createElement("div");
  catalogContainer.classList.add("movie-catalog");

  const leftArrow = document.createElement("button");
  leftArrow.classList.add("scroll-arrow", "left");
  leftArrow.innerHTML = "&larr;";
  leftArrow.onclick = () => scrollCatalog(catalogContainer, -200);

  const rightArrow = document.createElement("button");
  rightArrow.classList.add("scroll-arrow", "right");
  rightArrow.innerHTML = "&rarr;";
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
  return catalogContainer;
}

// Scroll the catalog horizontally
function scrollCatalog(catalog, distance) {
  catalog.scrollBy({ left: distance, behavior: "smooth" });
}

// Load movies into category
async function loadMovies(catalog, genreId) {
  const movies = await fetchMoviesByGenre(genreId);
  movies.forEach(movie => {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");
    movieCard.innerHTML = `
      <img src="${imageBaseUrl}${movie.poster_path}" alt="${movie.title}" />
      <div class="details">
        <div class="title">${movie.title}</div>
        <div class="year">${new Date(movie.release_date).getFullYear()}</div>
      </div>
    `;
    movieCard.onclick = () => {
      window.location.href = `movie.html?id=${movie.id}`;
    };

    catalog.appendChild(movieCard);
  });
}

// Load all genres and their movies
async function loadGenresAndMovies() {
  const genres = await fetchGenres();
  for (const genre of genres) {
    const catalog = createCategorySection(genre.name);
    await loadMovies(catalog, genre.id);
  }
}

// Fetch suggestions for search box
async function fetchSuggestions(event) {
  const query = event.target.value.trim();
  if (query.length < 3) {
    suggestionsBox.innerHTML = "";
    return;
  }

  const response = await fetch(`${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`);
  const data = await response.json();
  suggestionsBox.innerHTML = data.results
    .map(movie => `
      <div class="suggestion-item" onclick="redirectToSearchPage('${query}')">
        ${movie.title} (${new Date(movie.release_date).getFullYear()})
      </div>
    `)
    .join("");
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

// Function to update the greeting with the username (before '@' in email)
function displayGreeting() {
  const user = auth.currentUser;

  if (user) {
    // Extract the part before '@' from the email as the username
    const username = user.email.split('@')[0];
    const greetingElement = document.getElementById('greeting');
    greetingElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: flex-end;">
        <div style="font-size: 1.2rem; font-weight: bold;">Hi, ${username}</div>
        <button onclick="logout()" class="logout-btn">Logout</button>
      </div>
    `;
  } else {
    // If no user is logged in, show a prompt to log in
    const greetingElement = document.getElementById('greeting');
    greetingElement.innerHTML = `
      <a href="login.html" style="color: white; text-decoration: none; font-size: 1.2rem;">Log In</a>
    `;
  }
}

// Listen for changes in authentication state
auth.onAuthStateChanged(function(user) {
  displayGreeting(); // Update the greeting when the user state changes
});

// Logout function
function logout() {
  auth.signOut().then(function() {
    window.location.href = 'login.html'; // Redirect to login page after logout
  }).catch(function(error) {
    alert('Error logging out: ' + error.message);
  });
}

// Load genres and movies on page load
loadGenresAndMovies();
