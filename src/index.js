import { randLatitude, randLongitude } from "@ngneat/falso";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import './styles.css';
import './index.scss';

const lat = randLatitude();
const lon = randLongitude();

console.log('Setting map to:', lat, lon);

const map = L.map('map').setView([lat, lon], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.circle([lat, lon], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);