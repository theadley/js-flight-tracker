import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import './index.scss';
import {getFlights} from './api.js'

let ongoingFlights = [];
let flightMarkers = [];
let selectedFlight = null;

// Map setup
const mapInstance = L.map('map', {
    preferCanvas: true,
    attributionControl: false
}).setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

// UI modification
const updateHeaderStatus = (status) => {
    const headerstatusElement = document.getElementById('header-status');
    if (!!headerstatusElement) {
        headerstatusElement.innerText = status;
    }
}

const renderList = () => {
    const listContainer = document.getElementById('flight-list-container');
    if (listContainer) {
        [...document.getElementsByClassName('list-item')].forEach(li => li.removeEventListener('click', selectFlight))
        listContainer.innerHTML = '';

        ongoingFlights?.forEach(flight => {
            const d = new Date(flight[4] * 1000)
            const isSelectedFlight = selectedFlight && selectedFlight[0] === flight[0];
            listContainer.innerHTML +=
                `<div class="list-item" id="${flight[0]}"${isSelectedFlight ? ' selected=true' : ''}>
                    <div class="call">${flight[1] || flight[0]} <span>${d.toLocaleString()}</span></div>
                    <div class="country">Origin: ${flight[2]}</div>
                    <div class="details">
                        <p><span>Velocity</span><span>${flight[9]}m/s</span></p>
                        <p><span>Altitude</span><span>${flight[8] ? 'Landed' : (flight[13] || 'Unknown') + 'm'}</span></p>
                        <p><span>Climbing</span><span>${flight[8] ? 'Landed' : (flight[11] ? (flight[11] > 0 ? 'Yes' : 'No') : 'Unknown')}</span></p>
                    </div>
                </div>`
            ;
        });

        [...document.getElementsByClassName('list-item')].forEach(li => li.addEventListener("click", selectFlight))
    }
}

const selectFlight = (e) => {
    selectedFlight = ongoingFlights.find(f => f[0] === e.target.id);
    const selectedElement = document.getElementById(e.target.id);

    // Toggle
    if (selectedElement?.hasAttribute('selected')) {
        if (mapInstance) {
            mapInstance.flyTo([0, 0], 2);
        }
        selectedElement.removeAttribute('selected');
    } else {
        if (mapInstance && selectedFlight && !!selectedFlight[6] && !!selectedFlight[5]) {
            mapInstance.flyTo([selectedFlight[6], selectedFlight[5]], 7);
        }
        selectedElement.setAttribute('selected', true);
    }

    // Cleanup other selected flights
    [...document.getElementsByClassName('list-item')].forEach(li => {
        if (li.id !== e.target.id) {
            li.removeAttribute('selected')
        }
    });

};


// Get data
const getLatestFlightData = () => {
    updateHeaderStatus('Updating...');
    getFlights((data) => {

        // If we have a selected flight, update it and make sure it's in the 100 we're tracking
        if (selectedFlight) {
            selectedFlight = data?.states?.find(f => f[0] === selectedFlight[0]);
            ongoingFlights = [selectedFlight, ...data?.states?.filter(f => !!f[5] && !!f[6] && f[0] !== selectedFlight[0]).slice(0, 100)];
        } else {
            // Reset with whatever the first 100 are
            ongoingFlights = data?.states?.filter(f => !!f[5] && !!f[6]).slice(0, 100);
        }

        updateHeaderStatus(`Tracking ${ongoingFlights?.length} flight${ongoingFlights?.length !== 1 ? 's' : ''}`);

        renderList();

        // Cleanup
        if (mapInstance && flightMarkers?.length > 0) {
            flightMarkers.forEach(l => mapInstance.removeLayer(l));
            mapInstance.invalidateSize();
        }
        flightMarkers = [];
        ongoingFlights.forEach(flight => {
            /*
            0   icao24          string  Unique ICAO 24-bit address of the transponder in hex string representation.
            1   callsign        string  Callsign of the vehicle (8 chars). Can be null if no callsign has been received.
            2   origin_country  string  Country name inferred from the ICAO 24-bit address.
            3   time_position   int     Unix timestamp (seconds) for the last position update. Can be null if no position report was received by OpenSky within the past 15s.
            4   last_contact    int     Unix timestamp (seconds) for the last update in general. This field is updated for any new, valid message received from the transponder.
            5   longitude       float   WGS-84 longitude in decimal degrees. Can be null.
            6   latitude        float   WGS-84 latitude in decimal degrees. Can be null.
            7   baro_altitude   float   Barometric altitude in meters. Can be null.
            8   on_ground       boolean Boolean value which indicates if the position was retrieved from a surface position report.
            9   velocity        float   Velocity over ground in m/s. Can be null.
            10  true_track      float   True track in decimal degrees clockwise from north (north=0°). Can be null.
            11  vertical_rate   float   Vertical rate in m/s. A positive value indicates that the airplane is climbing, a negative value indicates that it descends. Can be null.
            12  sensors         int[]   IDs of the receivers which contributed to this state vector. Is null if no filtering for sensor was used in the request.
            13  geo_altitude    float   Geometric altitude in meters. Can be null.
            14  squawk          string  The transponder code aka Squawk. Can be null.
            15  spi             boolean Whether flight status indicates special purpose indicator.
            16  position_source int     Origin of this state’s position: 0 = ADS-B, 1 = ASTERIX, 2 = MLAT
            */

            // DivIcon
            if (!!flight[5] && !!flight[6] && mapInstance) {
                const heading = flight[10] || 0;
                const planeIcon = L.divIcon({html: `<div style="transform: rotate(${heading}deg); transform-origin: center;"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z"></path><path fill="none" d="M0 0h24v24H0V0z"></path></svg></div>`});
                const marker = L.marker([flight[6], flight[5]], {icon: planeIcon}).addTo(mapInstance);
                // const marker = new planeMarker([flight[6], flight[5]]).addTo(mapInstance);
                flightMarkers.push(marker);
            }
        });

        if (selectedFlight) {
            mapInstance.flyTo([selectedFlight[6], selectedFlight[5]], 7);
        }
        
    }, (err) => {
        console.error(err);
        updateHeaderStatus('Error');
    });
}

// Initial call
getLatestFlightData();
// Timer set up and clean up
const timer = setInterval(() => getLatestFlightData(), 30000);
window.onunload = () => clearInterval(timer);
