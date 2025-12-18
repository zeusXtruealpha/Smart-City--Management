import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import "./TrafficAnalysis.css";

const TrafficAnalysis = () => {
  const [trafficData, setTrafficData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historicalTrends, setHistoricalTrends] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [cityCongestionData, setCityCongestionData] = useState([]); // City-wide congestion data
  const [worstTrafficAreas, setWorstTrafficAreas] = useState([]); // Areas with the worst traffic

  const tomTomApiKey = "ovnUbVfKiM7ylSKhZJDvxQT6VrgTVyUu"; // Your TomTom API key

  // Popular areas in Bangalore for traffic analysis
  const popularAreas = [
    { name: "MG Road", coordinates: "12.9758,77.5998" },
    { name: "Silk Board JN", coordinates: "12.9176,77.6233" },
    { name: "Koramangala", coordinates: "12.9279,77.6271" },
    { name: "Whitefield", coordinates: "12.9698,77.7499" },
    { name: "Electronic City", coordinates: "12.8456,77.6603" },
  ];

  // Fetch real-time traffic data using TomTom Traffic Flow API
  const fetchTrafficData = async () => {
    try {
      const trafficDataPromises = popularAreas.map(async (area) => {
        const response = await fetch(
          `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${area.coordinates}&unit=KMPH&key=${tomTomApiKey}`
        );
        const data = await response.json();
        return {
          name: area.name,
          currentSpeed: data.flowSegmentData?.currentSpeed || 0,
          freeFlowSpeed: data.flowSegmentData?.freeFlowSpeed || 0,
          congestionLevel: (data.flowSegmentData?.currentSpeed / data.flowSegmentData?.freeFlowSpeed) * 100 || 0,
        };
      });

      const trafficDataResults = await Promise.all(trafficDataPromises);
      setTrafficData(trafficDataResults);

      // Calculate congestion level for the whole city (average of all areas)
      const totalCongestion = trafficDataResults.reduce((sum, area) => sum + area.congestionLevel, 0);
      const averageCongestion = totalCongestion / trafficDataResults.length;

      // Simulate city-wide congestion data over time (for demonstration)
      const cityData = [
        { time: "12:00 PM", congestion: averageCongestion * 0.8 },
        { time: "1:00 PM", congestion: averageCongestion * 0.85 },
        { time: "2:00 PM", congestion: averageCongestion * 0.9 },
        { time: "3:00 PM", congestion: averageCongestion * 0.95 },
        { time: "4:00 PM", congestion: averageCongestion },
        { time: "5:00 PM", congestion: averageCongestion * 1.1 },
        { time: "6:00 PM", congestion: averageCongestion * 1.2 },
      ];
      setCityCongestionData(cityData);

      // Identify areas with the worst traffic (top 3 areas with highest congestion)
      const sortedAreas = [...trafficDataResults].sort((a, b) => b.congestionLevel - a.congestionLevel);
      setWorstTrafficAreas(sortedAreas.slice(0, 3));

      analyzeTrafficData(trafficDataResults);
    } catch (error) {
      console.error("Error fetching traffic data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Analyze traffic data to identify trends and peak hours
  const analyzeTrafficData = (data) => {
    // Historical trends (example: last 7 days)
    setHistoricalTrends([
      { day: "Monday", density: 75 },
      { day: "Tuesday", density: 80 },
      { day: "Wednesday", density: 78 },
      { day: "Thursday", density: 85 },
      { day: "Friday", density: 90 },
      { day: "Saturday", density: 110 },
      { day: "Sunday", density: 120 },
    ]);

    // Peak hours (example: 8 AM - 10 AM and 5 PM - 7 PM)
    setPeakHours([
      { hour: "8 AM - 10 AM", trafficLevel: "High" },
      { hour: "5 PM - 7 PM", trafficLevel: "High" },
    ]);
  };

  useEffect(() => {
    fetchTrafficData();
  }, []);

  if (loading) {
    return <div>Loading traffic data...</div>;
  }

  return (
    <div className="traffic-analysis-container">
      <h2>Real-Time Traffic Density for Bangalore</h2>
      <p className="page-description">
        This page provides real-time traffic density for popular areas in Bangalore, city-wide congestion levels, historical trends, and peak traffic hours.
      </p>

      {/* Real-Time Traffic Density for Specific Areas */}
      <div className="real-time-density">
        <h3>Real-Time Traffic Density (Specific Areas)</h3>
        <BarChart width={600} height={300} data={trafficData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="congestionLevel" fill="#82ca9d" name="Congestion Level (%)" />
        </BarChart>
      </div>

      {/* City-Wide Congestion Level */}
      <div className="city-congestion">
        <h3>City-Wide Congestion Level Over Time</h3>
        <AreaChart width={600} height={300} data={cityCongestionData}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="congestion" stroke="#8884d8" fill="#8884d8" name="Congestion Level (%)" />
        </AreaChart>
      </div>

      {/* Areas with the Worst Traffic */}
      <div className="worst-traffic-areas">
        <h3>Areas with the Worst Traffic</h3>
        <ul>
          {worstTrafficAreas.map((area, index) => (
            <li key={index}>
              <strong>Area:</strong> {area.name} <br />
              <strong>Congestion Level:</strong> {area.congestionLevel.toFixed(2)}%
            </li>
          ))}
        </ul>
      </div>

      {/* Historical Trends */}
      <div className="historical-trends">
        <h3>Historical Traffic Trends (Last 7 Days)</h3>
        <LineChart width={600} height={300} data={historicalTrends}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="density" stroke="#8884d8" name="Traffic Density" />
        </LineChart>
      </div>

      {/* Peak Hour Analysis */}
      <div className="peak-hour-analysis">
        <h3>Peak Hour Analysis</h3>
        <ul>
          {peakHours.map((peak, index) => (
            <li key={index}>
              <strong>Time:</strong> {peak.hour} <br />
              <strong>Traffic Level:</strong> {peak.trafficLevel}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TrafficAnalysis;
