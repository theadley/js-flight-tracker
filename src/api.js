
export function getFlights (callbackSuccess, callbackFailure) {
    fetch('https://opensky-network.org/api/states/all')
        .then((response) => response.json())
        .then((json) => callbackSuccess(json))
        .catch(err => callbackFailure(err))
}
