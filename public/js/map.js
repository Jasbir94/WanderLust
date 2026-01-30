

function initMap() {
    // Default coordinates (can be dynamic if listing has coordinates)
    let location = { lat: 28.6139, lng: 77.2090 }; // Default: New Delhi
    if (typeof coordinates !== "undefined" && coordinates && coordinates.length === 2) {
        location = { lat: coordinates[1], lng: coordinates[0] };
    }

    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 8,
        center: location,
    });

    // Add a marker at the location
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: typeof listingTitle !== "undefined" ? listingTitle : "Listing"
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
        <div class="map-popup">
            <h4>${listingTitle}</h4>
            <p>Exact Location provided after booking</p>
            <i class="fab fa-airbnb text-danger fs-5"></i>
        </div>`
    });

    marker.addListener("click", () => {
        infoWindow.open(map, marker);
    });

    // Optional: Open by default
    // infoWindow.open(map, marker);
}