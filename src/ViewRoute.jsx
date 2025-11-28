import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from "@react-google-maps/api";
import "./ViewRoute.css";

const ViewRoute = () => {
  const [bookings, setBookings] = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [totalTime, setTotalTime] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (filterDate) {
      fetchBookings(filterDate);
    }
  }, [filterDate]);

  const fetchBookings = async (date) => {
    const q = query(collection(db, "wasteCollectionBookings"), where("date", "==", date));
    const querySnapshot = await getDocs(q);
    const bookingsData = querySnapshot.docs.map(doc => doc.data());
    setBookings(bookingsData);
    calculateRoute(bookingsData);
  };

  const calculateRoute = (bookings) => {
    if (bookings.length < 2) return;

    const waypoints = bookings.slice(1, -1).map(booking => ({
      location: { lat: booking.location.lat, lng: booking.location.lng },
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: bookings[0].location.lat, lng: bookings[0].location.lng },
        destination: { lat: bookings[bookings.length - 1].location.lat, lng: bookings[bookings.length - 1].location.lng },
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === "OK") {
          setDirectionsResponse(result);
          const totalTimeInSeconds = result.routes[0].legs.reduce((acc, leg) => acc + leg.duration.value, 0);
          const hours = Math.floor(totalTimeInSeconds / 3600);
          const minutes = Math.floor((totalTimeInSeconds % 3600) / 60);
          setTotalTime(`${hours > 0 ? hours + "h " : ""}${minutes} min`);
        } else {
          console.error("Error fetching directions:", status);
        }
      }
    );
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="view-route-container">
        <h2>Waste Collection Route</h2>
        <div className="date-filter">
          <label>Filter by Date:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="map-frame">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "70vh" }}
            zoom={12}
            center={bookings.length > 0 ? { lat: bookings[0].location.lat, lng: bookings[0].location.lng } : { lat: 12.9716, lng: 77.5946 }}
          >
            {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
            {bookings.map((booking, index) => (
              <Marker key={index} position={{ lat: booking.location.lat, lng: booking.location.lng }} />
            ))}
          </GoogleMap>
        </div>
        {totalTime && <div className="total-time">Total Time: {totalTime}</div>}

        {/* Display Booked Slots Data */}
        <div className="booked-slots">
  <h3>Booked Slots for {filterDate}</h3>
  {bookings.length > 0 ? (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Location (Lat, Lng)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, index) => (
            <tr key={index}>
              <td>{booking.name}</td>
              <td>{booking.phone}</td>
              <td>{booking.address}</td>
              <td>{booking.location.lat}, {booking.location.lng}</td>
              <td>{booking.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p>No bookings found for this date.</p>
  )}
</div>
      </div>
    </LoadScript>
  );
};

export default ViewRoute;
