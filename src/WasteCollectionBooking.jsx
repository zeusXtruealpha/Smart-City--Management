import React, { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import "./WasteCollectionBooking.css";

const WasteCollectionBooking = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [currentLocation, setCurrentLocation] = useState({ lat: null, lng: null });
  const [error, setError] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const navigate = useNavigate();

  const handleLocationClick = (e) => {
    setLocation({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error fetching current location:", error);
          setError("Unable to fetch your current location. Please select a location on the map.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhoneNumber(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    const today = new Date();
    const selected = new Date(selectedDate);
    const oneDayPrior = new Date(today.setDate(today.getDate() + 1));

    if (selected < oneDayPrior) {
      setError("You must book at least 1 day prior.");
      return;
    }

    if (!location.lat || !location.lng) {
      setError("Please select a location on the map.");
      return;
    }

    try {
      const bookingData = {
        name,
        phone,
        address,
        date: selectedDate,
        location: {
          lat: location.lat,
          lng: location.lng,
        },
      };
      await addDoc(collection(db, "wasteCollectionBookings"), bookingData);

      setBookingDetails(bookingData);
      setError("");

      setName("");
      setPhone("");
      setAddress("");
      setSelectedDate("");
      setLocation({ lat: null, lng: null });
    } catch (error) {
      console.error("Error adding document: ", error);
      setError("An error occurred. Please try again.");
    }
  };

  const handleViewRoute = () => {
    navigate("/view-route");
  };

  return (
    <div className="waste-booking-container">
      <h2>Waste Collection Booking</h2>
      <button onClick={handleViewRoute} className="view-route-button">View Route</button>
      {bookingDetails ? (
        <div className="booking-success">
          <h3>Booking Successful!</h3>
          <p>Here are your booking details:</p>
          <ul>
            <li><strong>Name:</strong> {bookingDetails.name}</li>
            <li><strong>Phone:</strong> {bookingDetails.phone}</li>
            <li><strong>Address:</strong> {bookingDetails.address}</li>
            <li><strong>Collection Date:</strong> {bookingDetails.date}</li>
            <li>
              <strong>Location:</strong> Latitude: {bookingDetails.location.lat}, Longitude: {bookingDetails.location.lng}
            </li>
          </ul>
          <button onClick={() => setBookingDetails(null)}>Book Another Slot</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Phone:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength="10"
            />
          </div>
          <div>
            <label>Address:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Collection Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>
          <div>
            <button type="button" onClick={handleCurrentLocation} className="current-location-button">
              Use Current Location
            </button>
          </div>
          <div className="map-container">
            <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                zoom={10}
                center={currentLocation.lat ? currentLocation : { lat: 12.9716, lng: 77.5946 }}
                onClick={handleLocationClick}
              >
                {location.lat && <Marker position={location} />}
              </GoogleMap>
            </LoadScript>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-button">Book Slot</button>
        </form>
      )}
    </div>
  );
};

export default WasteCollectionBooking;
