import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, getDocs, onSnapshot, addDoc } from "firebase/firestore";
import { LoadScript, GoogleMap, DirectionsRenderer, Marker, Polyline } from "@react-google-maps/api";
import "./PublicTransportManagement.css";

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};
const center = {
  lat: 12.9716,
  lng: 77.5946
};

const PublicTransportManagement = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [transportType, setTransportType] = useState("bus");
  const [routes, setRoutes] = useState([]);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState("journeyPlanner");
  const [realTimeVehicles, setRealTimeVehicles] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);

  // Enhanced transport data
  const transportStops = [
    // Bus Stops
    { id: 1, name: "Majestic Bus Station", type: "bus", location: { lat: 12.9774, lng: 77.5661 } },
    { id: 2, name: "Shivajinagar Bus Station", type: "bus", location: { lat: 12.9784, lng: 77.6040 } },
    { id: 3, name: "KR Market Bus Stop", type: "bus", location: { lat: 12.9622, lng: 77.5766 } },
    { id: 4, name: "Silk Board Junction", type: "bus", location: { lat: 12.9176, lng: 77.6233 } },
    { id: 5, name: "Koramangala Depot", type: "bus", location: { lat: 12.9279, lng: 77.6271 } },
    { id: 6, name: "Whitefield Terminal", type: "bus", location: { lat: 12.9698, lng: 77.7499 } },
    
    // Metro Stations
    { id: 7, name: "MG Road Metro", type: "train", location: { lat: 12.9758, lng: 77.5998 } },
    { id: 8, name: "Indiranagar Metro", type: "train", location: { lat: 12.9789, lng: 77.6406 } },
    { id: 9, name: "Byappanahalli Metro", type: "train", location: { lat: 12.9929, lng: 77.6375 } },
    { id: 10, name: "Majestic Metro", type: "train", location: { lat: 12.9774, lng: 77.5661 } },
    { id: 11, name: "Vidhana Soudha Metro", type: "train", location: { lat: 12.9794, lng: 77.5909 } },
    { id: 12, name: "Yelachenahalli Metro", type: "train", location: { lat: 12.8954, lng: 77.5664 } }
  ];

  const busRoutes = [
    {
      id: "bus-501A",
      name: "501A",
      type: "bus",
      from: "Majestic Bus Station",
      to: "Whitefield Terminal",
      path: [
        { lat: 12.9774, lng: 77.5661 },
        { lat: 12.9784, lng: 77.6040 },
        { lat: 12.9758, lng: 77.5998 },
        { lat: 12.9698, lng: 77.7499 }
      ],
      color: "#FF0000",
      vehicles: [
        { id: "bus-501A-1", location: { lat: 12.9784, lng: 77.6040 }, status: "on-time" },
        { id: "bus-501A-2", location: { lat: 12.9774, lng: 77.5661 }, status: "delayed" }
      ]
    },
    {
      id: "bus-345C",
      name: "345C",
      type: "bus",
      from: "KR Market Bus Stop",
      to: "Silk Board Junction",
      path: [
        { lat: 12.9622, lng: 77.5766 },
        { lat: 12.9279, lng: 77.6271 },
        { lat: 12.9176, lng: 77.6233 }
      ],
      color: "#0000FF",
      vehicles: [
        { id: "bus-345C-1", location: { lat: 12.9279, lng: 77.6271 }, status: "on-time" }
      ]
    }
  ];

  const trainRoutes = [
    {
      id: "train-purple",
      name: "Purple Line",
      type: "train",
      from: "Byappanahalli Metro",
      to: "Yelachenahalli Metro",
      path: [
        { lat: 12.9929, lng: 77.6375 },
        { lat: 12.9789, lng: 77.6406 },
        { lat: 12.9758, lng: 77.5998 },
        { lat: 12.9774, lng: 77.5661 },
        { lat: 12.8954, lng: 77.5664 }
      ],
      color: "#800080",
      vehicles: [
        { id: "train-purple-1", location: { lat: 12.9789, lng: 77.6406 }, status: "on-time" },
        { id: "train-purple-2", location: { lat: 12.9758, lng: 77.5998 }, status: "on-time" }
      ]
    },
    {
      id: "train-green",
      name: "Green Line",
      type: "train",
      from: "Majestic Metro",
      to: "Vidhana Soudha Metro",
      path: [
        { lat: 12.9774, lng: 77.5661 },
        { lat: 12.9794, lng: 77.5909 }
      ],
      color: "#008000",
      vehicles: [
        { id: "train-green-1", location: { lat: 12.9774, lng: 77.5661 }, status: "on-time" }
      ]
    }
  ];

  useEffect(() => {
    setAllRoutes([...busRoutes, ...trainRoutes]);
    setRealTimeVehicles([
      ...busRoutes.flatMap(route => route.vehicles),
      ...trainRoutes.flatMap(route => route.vehicles)
    ]);

    const fetchSchedules = async () => {
      const defaultSchedules = [
        { id: "1", route: "501A", type: "bus", from: "Majestic", to: "Whitefield", departure: "08:00 AM", arrival: "09:15 AM", frequency: "Every 15 min", status: "on-time" },
        { id: "2", route: "345C", type: "bus", from: "KR Market", to: "Silk Board", departure: "08:30 AM", arrival: "09:10 AM", frequency: "Every 20 min", status: "on-time" },
        { id: "3", route: "Purple Line", type: "train", from: "Byappanahalli", to: "Yelachenahalli", departure: "08:05 AM", arrival: "08:45 AM", frequency: "Every 10 min", status: "on-time" },
        { id: "4", route: "Green Line", type: "train", from: "Majestic", to: "Vidhana Soudha", departure: "08:15 AM", arrival: "08:25 AM", frequency: "Every 8 min", status: "on-time" }
      ];

      try {
        const querySnapshot = await getDocs(collection(db, "transportSchedules"));
        if (querySnapshot.empty) {
          const batch = [];
          defaultSchedules.forEach(schedule => {
            batch.push(addDoc(collection(db, "transportSchedules"), schedule));
          });
          await Promise.all(batch);
          setSchedules(defaultSchedules);
        } else {
          setSchedules(querySnapshot.docs.map(doc => doc.data()));
        }
        
        const unsubscribe = onSnapshot(collection(db, "transportSchedules"), (snapshot) => {
          setSchedules(snapshot.docs.map(doc => doc.data()));
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading schedules:", error);
        setSchedules(defaultSchedules);
      }
    };
    
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (!mapLoaded) return;

    const interval = setInterval(() => {
      setRealTimeVehicles(prev => 
        prev.map(vehicle => {
          const route = allRoutes.find(r => r.vehicles.some(v => v.id === vehicle.id));
          if (!route) return vehicle;
          
          const currentIdx = route.path.findIndex(p => 
            p.lat === vehicle.location.lat && p.lng === vehicle.location.lng
          );
          const nextIdx = (currentIdx + 1) % route.path.length;
          return { ...vehicle, location: route.path[nextIdx] };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [mapLoaded, allRoutes]);

  const handlePlanJourney = (e) => {
    e.preventDefault();
    if (!window.google?.maps) {
      alert("Maps API loading. Please wait...");
      return;
    }

    setLoading(true);
    const originStop = transportStops.find(stop => stop.name === origin);
    const destStop = transportStops.find(stop => stop.name === destination);

    if (!originStop || !destStop) {
      alert("Please select valid stops");
      setLoading(false);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const transitOptions = {
      modes: [transportType === "bus" ? "BUS" : "RAIL"],
      routingPreference: "FEWER_TRANSFERS"
    };

    directionsService.route(
      {
        origin: originStop.location,
        destination: destStop.location,
        travelMode: window.google.maps.TravelMode.TRANSIT,
        transitOptions: transitOptions,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
          
          const formattedRoutes = result.routes.map((route, index) => {
            const legs = route.legs[0];
            const steps = legs.steps.map(step => {
              if (transportType === "train" && step.travel_mode === "TRANSIT" && 
                  step.transit?.vehicle?.name?.includes("Metro")) {
                return `<strong>${step.instructions}</strong>`;
              }
              return step.instructions;
            });
            
            return {
              id: index,
              type: transportType,
              departure: legs.departure_time?.text || "Now",
              arrival: legs.arrival_time?.text || "Unknown",
              duration: legs.duration.text,
              steps: steps,
              price: transportType === "bus" ? "₹25-50" : "₹40-80"
            };
          });
          
          setRoutes(formattedRoutes);
        } else {
          console.error("Directions error:", status);
          const relevantRoutes = transportType === "bus" 
            ? busRoutes.filter(r => 
                r.from.includes(originStop.name.split(" ")[0]) && 
                r.to.includes(destStop.name.split(" ")[0]))
            : trainRoutes.filter(r => 
                r.from.includes(originStop.name.split(" ")[0]) && 
                r.to.includes(destStop.name.split(" ")[0]));

          if (relevantRoutes.length > 0) {
            setRoutes(relevantRoutes.map(route => ({
              id: route.id,
              type: route.type,
              departure: "08:00 AM",
              arrival: "09:00 AM",
              duration: "1h",
              steps: [
                `Walk to ${route.from}`,
                `Take ${route.type === "bus" ? "Bus" : "Metro"} ${route.name}`,
                `Get off at ${route.to}`,
                `Walk to destination`
              ],
              price: route.type === "bus" ? "₹25" : "₹40"
            })));
          } else {
            setRoutes([{
              id: 1,
              type: transportType,
              departure: "08:00 AM",
              arrival: "09:15 AM",
              duration: "1h 15m",
              steps: [
                `Walk to ${originStop.name}`,
                `Take ${transportType === "bus" ? "Bus" : "Metro"}`,
                `Get off at ${destStop.name}`,
                `Walk to destination`
              ],
              price: transportType === "bus" ? "₹25" : "₹40"
            }]);
          }
        }
        setLoading(false);
      }
    );
  };

  const handleViewRoute = (routeId) => {
    const route = allRoutes.find(r => r.id === routeId);
    setSelectedRoute(route);
    
    if (mapRef.current && route) {
      const bounds = new window.google.maps.LatLngBounds();
      route.path.forEach(point => bounds.extend(point));
      mapRef.current.fitBounds(bounds);
    }
  };

  const filteredSchedules = transportType === "all" 
    ? schedules 
    : schedules.filter(s => s.type === transportType);

  const filteredRoutes = transportType === "all"
    ? allRoutes
    : allRoutes.filter(r => r.type === transportType);

  return (
    <LoadScript 
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      onLoad={() => setMapLoaded(true)}
    >
      <div className="public-transport-container">
        <h2>Bangalore Public Transport</h2>
        <p className="page-description">
          Plan your journey with real-time bus and metro information
        </p>

        <div className="transport-tabs">
          <button 
            className={activeTab === "journeyPlanner" ? "active" : ""}
            onClick={() => setActiveTab("journeyPlanner")}
          >
            Journey Planner
          </button>
          <button 
            className={activeTab === "schedules" ? "active" : ""}
            onClick={() => setActiveTab("schedules")}
          >
            Schedules
          </button>
          <button 
            className={activeTab === "routes" ? "active" : ""}
            onClick={() => setActiveTab("routes")}
          >
            Routes
          </button>
        </div>

        {activeTab === "journeyPlanner" && (
          <>
            <div className="journey-planner-form">
              <form onSubmit={handlePlanJourney}>
                <div className="form-row">
                  <div className="form-group">
                    <label>From:</label>
                    <select 
                      value={origin} 
                      onChange={(e) => setOrigin(e.target.value)}
                      required
                    >
                      <option value="">Select origin</option>
                      {transportStops
                        .filter(stop => transportType === "all" || stop.type === transportType || stop.type === "both")
                        .map(stop => (
                          <option key={stop.id} value={stop.name}>{stop.name}</option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>To:</label>
                    <select 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    >
                      <option value="">Select destination</option>
                      {transportStops
                        .filter(stop => transportType === "all" || stop.type === transportType || stop.type === "both")
                        .map(stop => (
                          <option key={stop.id} value={stop.name}>{stop.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Transport Type:</label>
                    <select 
                      value={transportType} 
                      onChange={(e) => setTransportType(e.target.value)}
                    >
                      <option value="bus">Bus</option>
                      <option value="train">Metro</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? "Planning..." : "Plan Journey"}
                </button>
              </form>
            </div>

            {routes.length > 0 && (
              <div className="journey-results">
                <h3>Suggested Routes</h3>
                <div className="routes-list">
                  {routes.map(route => (
                    <div key={route.id} className="route-card">
                      <div className="route-header">
                        <span className="transport-type">{route.type.toUpperCase()}</span>
                        <span className="route-time">{route.departure} → {route.arrival} ({route.duration})</span>
                        <span className="route-price">{route.price}</span>
                      </div>
                      <div className="route-steps">
                        <ol>
                          {route.steps.map((step, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="journey-map">
              <h3>Route Map</h3>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={12}
                center={center}
                onLoad={map => {
                  mapRef.current = map;
                  setMapLoaded(true);
                }}
              >
                {directions && <DirectionsRenderer directions={directions} />}
                {mapLoaded && transportStops
                  .filter(stop => transportType === "all" || stop.type === transportType || stop.type === "both")
                  .map(stop => (
                    <Marker 
                      key={stop.id} 
                      position={stop.location}
                      icon={{
                        url: stop.type === "bus" ? "/icons/bus-stop.png" : "/icons/train-station.png",
                        scaledSize: new window.google.maps.Size(30, 30)
                      }}
                    />
                  ))}
                {mapLoaded && realTimeVehicles
                  .filter(vehicle => transportType === "all" || 
                    (transportType === "bus" && vehicle.id.includes("bus")) ||
                    (transportType === "train" && vehicle.id.includes("train")))
                  .map(vehicle => (
                    <Marker
                      key={vehicle.id}
                      position={vehicle.location}
                      icon={{
                        url: vehicle.id.includes("bus") ? "/icons/bus.png" : "/icons/train.png",
                        scaledSize: new window.google.maps.Size(32, 32)
                      }}
                    />
                  ))}
              </GoogleMap>
            </div>
          </>
        )}

        {activeTab === "schedules" && (
          <div className="schedules-container">
            <div className="schedule-filters">
              <label>Transport Type:</label>
              <select 
                value={transportType} 
                onChange={(e) => setTransportType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="bus">Bus</option>
                <option value="train">Metro</option>
              </select>
            </div>

            <div className="schedules-list">
              {filteredSchedules.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Departure</th>
                      <th>Arrival</th>
                      <th>Frequency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedules.map((s, i) => (
                      <tr key={i}>
                        <td><strong>{s.route}</strong></td>
                        <td>{s.from}</td>
                        <td>{s.to}</td>
                        <td>{s.departure}</td>
                        <td>{s.arrival}</td>
                        <td>{s.frequency}</td>
                        <td>
                          <span className={`status ${s.status}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No schedules available for selected filters</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "routes" && (
          <div className="routes-container">
            <div className="route-filters">
              <label>Transport Type:</label>
              <select 
                value={transportType} 
                onChange={(e) => setTransportType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="bus">Bus</option>
                <option value="train">Metro</option>
              </select>
            </div>

            <div className="routes-list">
              {filteredRoutes.map(route => (
                <div 
                  key={route.id} 
                  className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                  onClick={() => handleViewRoute(route.id)}
                >
                  <div className="route-header">
                    <span className="transport-type">{route.type.toUpperCase()}</span>
                    <span className="route-name">{route.name}</span>
                  </div>
                  <div className="route-info">
                    <span>{route.from} → {route.to}</span>
                    <span>{route.vehicles.length} vehicles active</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="route-map">
              <h3>{selectedRoute ? `${selectedRoute.name} Route` : "Select a Route"}</h3>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={selectedRoute ? 12 : 11}
                center={selectedRoute ? selectedRoute.path[0] : center}
                onLoad={map => mapRef.current = map}
              >
                {selectedRoute && (
                  <>
                    <Polyline
                      path={selectedRoute.path}
                      options={{
                        strokeColor: selectedRoute.color,
                        strokeOpacity: 1.0,
                        strokeWeight: 4
                      }}
                    />
                    {selectedRoute.vehicles.map(vehicle => (
                      <Marker
                        key={vehicle.id}
                        position={vehicle.location}
                        icon={{
                          url: vehicle.id.includes("bus") ? "/icons/bus.png" : "/icons/train.png",
                          scaledSize: new window.google.maps.Size(32, 32)
                        }}
                      />
                    ))}
                    {transportStops
                      .filter(stop => 
                        stop.name === selectedRoute.from || 
                        stop.name === selectedRoute.to
                      )
                      .map(stop => (
                        <Marker 
                          key={stop.id} 
                          position={stop.location}
                          icon={{
                            url: stop.type === "bus" ? "/icons/bus-stop.png" : "/icons/train-station.png",
                            scaledSize: new window.google.maps.Size(30, 30)
                          }}
                        />
                      ))}
                  </>
                )}
              </GoogleMap>
            </div>
          </div>
        )}
      </div>
    </LoadScript>
  );
};

export default PublicTransportManagement;
