import { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  TrafficLayer,
  DirectionsRenderer,
  Autocomplete,
} from "@react-google-maps/api";
import "./TrafficMap.css"; // Import the CSS file

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 200px)", // Full screen height
};

const center = {
  lat: 12.9716, // Default center (Example: Bangalore)
  lng: 77.5946,
};

const TrafficMap = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [waypoints, setWaypoints] = useState([]); // List of stops
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [navigationSteps, setNavigationSteps] = useState([]); // Step-by-step navigation
  const [eta, setEta] = useState(""); // Estimated Time of Arrival (ETA)
  const [mode, setMode] = useState("DRIVING"); // Default mode: Car

  const [autocompleteOrigin, setAutocompleteOrigin] = useState(null);
  const [autocompleteDestination, setAutocompleteDestination] = useState(null);
  const [autocompleteWaypoint, setAutocompleteWaypoint] = useState(null);
  const [newWaypoint, setNewWaypoint] = useState("");

  // Handle route calculation with ETA
  const handleRoute = () => {
    if (!origin || !destination) {
      alert("Please enter both starting and destination locations.");
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypoints.map((wp) => ({ location: wp, stopover: true })), // Add waypoints
        optimizeWaypoints: true, // Enable route optimization
        travelMode: window.google.maps.TravelMode[mode], // Mode selection (Car, Bike, Walk)
      },
      (result, status) => {
        if (status === "OK") {
          setDirectionsResponse(result);

          // Extract navigation steps
          const steps = result.routes[0].legs.flatMap((leg) => leg.steps.map((step) => step.instructions));
          setNavigationSteps(steps);

          // Calculate ETA
          const totalTime = result.routes[0].legs.reduce((acc, leg) => acc + leg.duration.value, 0); // Total time in seconds
          const hours = Math.floor(totalTime / 3600);
          const minutes = Math.floor((totalTime % 3600) / 60);
          setEta(`${hours > 0 ? hours + "h " : ""}${minutes} min`); // Format ETA
        } else {
          alert("Could not fetch directions. Try different locations.");
        }
      }
    );
  };

  // Handle place selection from Autocomplete
  const handlePlaceSelect = (type) => {
    if (type === "origin" && autocompleteOrigin) {
      const place = autocompleteOrigin.getPlace();
      setOrigin(place.formatted_address);
    } else if (type === "destination" && autocompleteDestination) {
      const place = autocompleteDestination.getPlace();
      setDestination(place.formatted_address);
    } else if (type === "waypoint" && autocompleteWaypoint) {
      const place = autocompleteWaypoint.getPlace();
      setNewWaypoint(place.formatted_address);
    }
  };

  // Add a new waypoint to the list
  const addWaypoint = () => {
    if (newWaypoint) {
      setWaypoints([...waypoints, newWaypoint]);
      setNewWaypoint("");
    }
  };

  // Delete a waypoint from the list
  const deleteWaypoint = (index) => {
    const updatedWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(updatedWaypoints);
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <div className="traffic-map-container">
        <h2>Real-Time Traffic, ETA, and Route Optimization</h2>
        <p className="page-description">
          Welcome to the Real-Time Traffic Monitoring page. Here, you can view live traffic conditions, calculate the best routes, and get step-by-step navigation instructions. Enter your starting location, destination, and any waypoints to optimize your journey. The system supports driving, walking, and biking modes, and provides an estimated time of arrival (ETA) for your trip.
        </p>

        {/* Input Fields with Autocomplete */}
        <div className="input-container">
          <Autocomplete onLoad={(auto) => setAutocompleteOrigin(auto)} onPlaceChanged={() => handlePlaceSelect("origin")}>
            <input
              type="text"
              placeholder="Enter starting location"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </Autocomplete>

          <Autocomplete onLoad={(auto) => setAutocompleteDestination(auto)} onPlaceChanged={() => handlePlaceSelect("destination")}>
            <input
              type="text"
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </Autocomplete>

          <div className="waypoint-container">
            <Autocomplete onLoad={(auto) => setAutocompleteWaypoint(auto)} onPlaceChanged={() => handlePlaceSelect("waypoint")}>
              <input
                type="text"
                placeholder="Add waypoint (optional)"
                value={newWaypoint}
                onChange={(e) => setNewWaypoint(e.target.value)}
              />
            </Autocomplete>
            <button onClick={addWaypoint}>Add Stop</button>
          </div>

          {/* Select Transport Mode */}
          <div className="mode-selector">
            <label>Select Mode of Transport:</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="DRIVING">Car</option>
              <option value="WALKING">Walking</option>
              <option value="BICYCLING">Bike</option>
            </select>
          </div>

          <button className="route-button" onClick={handleRoute}>Find Best Route</button>
        </div>

        {/* Show Waypoints */}
        <div className="waypoints-list">
          {waypoints.length > 0 && (
            <div>
              <h4>Waypoints:</h4>
              <ul>
                {waypoints.map((wp, index) => (
                  <li key={index}>
                    {wp}
                    <button onClick={() => deleteWaypoint(index)} className="delete-waypoint-button">
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Show ETA */}
        {eta && (
          <div className="eta-container">
            <h3>Estimated Travel Time: {eta}</h3>
          </div>
        )}

        {/* Map with Traffic & Directions */}
        <div className="map-frame">
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
            <TrafficLayer />
            {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
          </GoogleMap>
        </div>

        {/* Display Step-by-Step Navigation */}
        {navigationSteps.length > 0 && (
          <div className="navigation-steps-box">
            <h3>Navigation Steps:</h3>
            <div className="steps-scroll">
              <ul>
                {navigationSteps.map((step, index) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: step }}></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </LoadScript>
  );
};

export default TrafficMap;
