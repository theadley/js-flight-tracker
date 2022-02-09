import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import './index.scss';
import {getFlights} from './api.js'

// Map setup
const map = L.map('map').setView([0, 0], 1);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Get data
const getLatestFlightData = () => {
    getFlights((data) => {
        console.log(data);
    }, (err) => console.error(err));
}

// Initial call
getLatestFlightData();
// Timer set up and clean up
const timer = setInterval(() => getLatestFlightData(), 30000);
window.onunload = () => clearInterval(timer);
