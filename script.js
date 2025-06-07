
var crashData = {};
var dataLoaded = false;
var flashCardData = [];
var map;
var crashMarkers = [];


var boroughColors = {
    'BROOKLYN': '#FF6B6B',
    'QUEENS': '#4ECDC4', 
    'BRONX': '#45B7D1',
    'MANHATTAN': '#FFA07A',
    'STATEN ISLAND': '#98D8C8'
};

function createMap() {

    if (!document.getElementById('map')) return;
    
    try {
     
        map = L.map('map').setView([40.7589, -73.9851], 11);
        
       
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data © OpenStreetMap contributors'
        }).addTo(map);
        
        
        loadCrashLocations();
    } catch (error) {
        console.log('Error creating map:', error);
    }
}

function loadCrashLocations() {
    var apiUrl = 'https://data.cityofnewyork.us/resource/h9gi-nx95.json?$limit=100&$where=latitude IS NOT NULL AND longitude IS NOT NULL';
    
    fetch(apiUrl)
        .then(function(response) {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(function(data) {
            addCrashesToMap(data);
        })
        .catch(function(error) {
            console.log('Could not load crash locations:', error);
        });
}

function addCrashesToMap(crashes) {
    for (var i = 0; i < crashes.length; i++) {
        var crash = crashes[i];
        
       
        if (crash.latitude && crash.longitude) {
            var lat = parseFloat(crash.latitude);
            var lng = parseFloat(crash.longitude);
            
           
            if (isNaN(lat) || isNaN(lng) || lat < 40 || lat > 41 || lng < -75 || lng > -73) {
                continue;
            }
            
           
            var popupText = '<strong>Crash Details</strong><br>';
            if (crash.borough) popupText += 'Borough: ' + crash.borough + '<br>';
            if (crash.crash_date) popupText += 'Date: ' + crash.crash_date.split('T')[0] + '<br>';
            if (crash.number_of_persons_injured) popupText += 'Injured: ' + crash.number_of_persons_injured + '<br>';
            if (crash.contributing_factor_vehicle_1 && crash.contributing_factor_vehicle_1 !== 'Unspecified') {
                popupText += 'Cause: ' + crash.contributing_factor_vehicle_1;
            }
            
            
            var marker = L.circleMarker([lat, lng], {
                color: 'red',
                fillColor: '#ff0000',
                fillOpacity: 0.6,
                radius: 5
            }).addTo(map);
            
           
            marker.bindPopup(popupText);
            
            crashMarkers.push(marker);
        }
    }
}

function loadFlashCards() {
    if (!document.getElementById('flashCardsContainer')) return;
    
    var loadingMsg = document.getElementById('cardsLoadingMessage');
    if (loadingMsg) {
        loadingMsg.textContent = 'Loading crash cards...';
    }
    
    var apiUrl = 'https://data.cityofnewyork.us/resource/h9gi-nx95.json?$limit=50&$where=latitude IS NOT NULL AND longitude IS NOT NULL';
    
    fetch(apiUrl)
        .then(function(response) {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(function(data) {
            flashCardData = data;
            createCrashCards();
        })
        .catch(function(error) {
            console.log('Error loading crash cards:', error);
            if (loadingMsg) {
                loadingMsg.textContent = 'Could not load crash cards. Try again later.';
            }
        });
}

function createCrashCards() {
    var container = document.getElementById('flashCardsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    var filterElement = document.getElementById('boroughFilter');
    var filter = filterElement ? filterElement.value : 'all';
    var cardCount = 0;
    
    for (var i = 0; i < flashCardData.length && cardCount < 12; i++) {
        var crash = flashCardData[i];
        
       
        if (filter !== 'all' && crash.borough !== filter) {
            continue;
        }
        
       
        if (!crash.borough || !crash.latitude || !crash.longitude) {
            continue;
        }
        
       
        var card = document.createElement('div');
        card.className = 'crash-card borough-' + crash.borough.toLowerCase().replace(' ', '-');
        
       
        var header = document.createElement('div');
        header.className = 'card-header';
        header.textContent = 'Crash in ' + fixBoroughName(crash.borough);
        card.appendChild(header);
        
      
        if (crash.crash_date) {
            var dateDetail = document.createElement('div');
            dateDetail.className = 'card-detail';
            dateDetail.innerHTML = '<strong>Date:</strong> ' + crash.crash_date.split('T')[0];
            card.appendChild(dateDetail);
        }
        
        if (crash.crash_time) {
            var timeDetail = document.createElement('div');
            timeDetail.className = 'card-detail';
            timeDetail.innerHTML = '<strong>Time:</strong> ' + crash.crash_time;
            card.appendChild(timeDetail);
        }
        
        if (crash.number_of_persons_injured) {
            var injuredDetail = document.createElement('div');
            injuredDetail.className = 'card-detail';
            injuredDetail.innerHTML = '<strong>Injured:</strong> ' + crash.number_of_persons_injured + ' people';
            card.appendChild(injuredDetail);
        }
        
        if (crash.number_of_persons_killed && crash.number_of_persons_killed > 0) {
            var killedDetail = document.createElement('div');
            killedDetail.className = 'card-detail';
            killedDetail.innerHTML = '<strong>Killed:</strong> ' + crash.number_of_persons_killed + ' people';
            card.appendChild(killedDetail);
        }
        
        if (crash.contributing_factor_vehicle_1 && crash.contributing_factor_vehicle_1 !== 'Unspecified') {
            var causeDetail = document.createElement('div');
            causeDetail.className = 'card-detail';
            var cause = crash.contributing_factor_vehicle_1;
            if (cause.length > 40) cause = cause.substring(0, 40) + '...';
            causeDetail.innerHTML = '<strong>Cause:</strong> ' + cause;
            card.appendChild(causeDetail);
        }
        
        if (crash.on_street_name) {
            var streetDetail = document.createElement('div');
            streetDetail.className = 'card-detail';
            streetDetail.innerHTML = '<strong>Street:</strong> ' + crash.on_street_name;
            card.appendChild(streetDetail);
        }
        
        
        var zoomButton = document.createElement('button');
        zoomButton.className = 'zoom-button';
        zoomButton.textContent = 'View on Map';
        zoomButton.onclick = function(lat, lng) {
            return function() {
                zoomToLocation(lat, lng);
            };
        }(parseFloat(crash.latitude), parseFloat(crash.longitude));
        card.appendChild(zoomButton);
        
        container.appendChild(card);
        cardCount++;
    }
    
    if (cardCount === 0) {
        var noDataMsg = document.createElement('p');
        noDataMsg.id = 'cardsLoadingMessage';
        noDataMsg.textContent = 'No crash data found for ' + (filter === 'all' ? 'any borough' : fixBoroughName(filter)) + '. Try a different filter.';
        container.appendChild(noDataMsg);
    }
}


function zoomToLocation(lat, lng) {
    if (!map) {
        alert('Map not loaded yet. Please wait and try again.');
        return;
    }
    
    
    if (isNaN(lat) || isNaN(lng)) {
        alert('Invalid location data for this crash.');
        return;
    }
    
    
    map.setView([lat, lng], 16);
    
    
    var tempMarker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);
    
    
    setTimeout(function() {
        map.removeLayer(tempMarker);
    }, 5000);
    
    
    tempMarker.bindPopup('Selected Crash Location').openPopup();
}

function filterCards() {
    if (flashCardData.length > 0) {
        createCrashCards();
    }
}

function loadData() {
   
    if (!document.getElementById('loadingMessage')) return;
    
    
    showElement('loadingMessage');
    hideElement('dataLoaded');
    hideElement('errorMessage');
    
    
    fetch('https://data.cityofnewyork.us/resource/h9gi-nx95.json?$limit=500')
        .then(function(response) {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(function(data) {
            processData(data);
            showDataLoaded(data.length);
        })
        .catch(function(error) {
            console.log('Error loading data:', error);
            showError();
        });
}

function processData(rawData) {
    
    crashData = {
        'BROOKLYN': 0,
        'QUEENS': 0,
        'BRONX': 0,
        'MANHATTAN': 0,
        'STATEN ISLAND': 0
    };
    
    
    for (var i = 0; i < rawData.length; i++) {
        var crash = rawData[i];
        var borough = crash.borough;
        
        if (borough && crashData[borough] !== undefined) {
            crashData[borough] = crashData[borough] + 1;
        }
    }
    
    dataLoaded = true;
}

function showDataLoaded(recordCount) {
    hideElement('loadingMessage');
    showElement('dataLoaded');
    hideElement('errorMessage');
    var countElement = document.getElementById('recordCount');
    if (countElement) {
        countElement.textContent = recordCount;
    }
}

function showError() {
    hideElement('loadingMessage');
    hideElement('dataLoaded');
    showElement('errorMessage');
}

function showChart() {
    if (!dataLoaded) {
        alert('Please wait for data to load first!');
        return;
    }
    
    var chartTypeElement = document.getElementById('chartType');
    if (!chartTypeElement) return;
    
    var chartType = chartTypeElement.value;
    
    if (chartType === '') {
        alert('Please choose a chart type first!');
        return;
    }
    
    hideElement('noChart');
    hideElement('barChart');
    hideElement('pieChart');
    hideElement('stats');
    
    if (chartType === 'bar') {
        createBarChart();
        showElement('barChart');
    } else if (chartType === 'pie') {
        createPieChart();
        showElement('pieChart');
    }
    
    updateStats();
    updateExplanation();
    showElement('stats');
}

function createBarChart() {
    var container = document.getElementById('barChartContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    var maxValue = 0;
    for (var borough in crashData) {
        if (crashData[borough] > maxValue) {
            maxValue = crashData[borough];
        }
    }
    
    for (var borough in crashData) {
        var count = crashData[borough];
        var percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
        var height = Math.max(percentage * 2, 20);
        
       
        var bar = document.createElement('div');
        bar.className = 'bar';
        

        var barFill = document.createElement('div');
        barFill.className = 'bar-fill';
        barFill.style.height = height + 'px';
        barFill.style.backgroundColor = boroughColors[borough];
      
	  
        var valueLabel = document.createElement('div');
        valueLabel.className = 'bar-value';
        valueLabel.textContent = count;
        barFill.appendChild(valueLabel);
        
       
        var label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = fixBoroughName(borough);
        
       
        bar.appendChild(barFill);
        bar.appendChild(label);
        
     
        container.appendChild(bar);
    }
}

function createPieChart() {
    var container = document.getElementById('pieChartContainer');
    var legend = document.getElementById('pieLegend');
    if (!container || !legend) return;
    
    var total = 0;
    for (var borough in crashData) {
        total = total + crashData[borough];
    }
    
    if (total === 0) return;
    
    legend.innerHTML = '';
    
 
    var gradientParts = [];
    var currentAngle = 0;
    
    for (var borough in crashData) {
        var count = crashData[borough];
        var percentage = (count / total) * 100;
        var angle = (percentage / 100) * 360;
        
        if (count > 0) {
            gradientParts.push(boroughColors[borough] + ' ' + currentAngle + 'deg ' + (currentAngle + angle) + 'deg');
            
         
            var legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            var colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = boroughColors[borough];
            
            var text = document.createElement('span');
            text.textContent = fixBoroughName(borough) + ' (' + Math.round(percentage) + '%)';
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(text);
            legend.appendChild(legendItem);
            
            currentAngle = currentAngle + angle;
        }
    }
    
    
    if (gradientParts.length > 0) {
        container.style.background = 'conic-gradient(' + gradientParts.join(', ') + ')';
    }
}

function updateStats() {
    var total = 0;
    var topBorough = '';
    var topCount = 0;
    
    
    for (var borough in crashData) {
        total = total + crashData[borough];
        if (crashData[borough] > topCount) {
            topCount = crashData[borough];
            topBorough = borough;
        }
    }
    
    var average = total > 0 ? Math.round(total / 5) : 0;
    
    var totalElement = document.getElementById('totalCrashes');
    var topElement = document.getElementById('topBorough');
    var avgElement = document.getElementById('avgCrashes');
    
    if (totalElement) totalElement.textContent = total;
    if (topElement) topElement.textContent = fixBoroughName(topBorough);
    if (avgElement) avgElement.textContent = average;
}

function updateExplanation() {
    var topBorough = '';
    var topCount = 0;
    var bottomBorough = '';
    var bottomCount = 999999;
    
   
    for (var borough in crashData) {
        if (crashData[borough] > topCount) {
            topCount = crashData[borough];
            topBorough = borough;
        }
        if (crashData[borough] < bottomCount) {
            bottomCount = crashData[borough];
            bottomBorough = borough;
        }
    }
    
    if (topBorough && bottomBorough) {
        var explanation = fixBoroughName(topBorough) + ' has the most crashes with ' + topCount + ' incidents. ' +
                         fixBoroughName(bottomBorough) + ' has the fewest crashes with ' + bottomCount + ' incidents. ' +
                         'This helps the city know where to make roads safer.';
        
        var explanationElement = document.getElementById('explanationText');
        if (explanationElement) {
            explanationElement.textContent = explanation;
        }
    }
}

function fixBoroughName(borough) {
    if (!borough) return '';
    if (borough === 'BROOKLYN') return 'Brooklyn';
    if (borough === 'QUEENS') return 'Queens';
    if (borough === 'BRONX') return 'Bronx';
    if (borough === 'MANHATTAN') return 'Manhattan';
    if (borough === 'STATEN ISLAND') return 'Staten Island';
    return borough;
}

function showElement(id) {
    var element = document.getElementById(id);
    if (element) {
        element.className = element.className.replace('hidden', '').trim();
    }
}

function hideElement(id) {
    var element = document.getElementById(id);
    if (element) {
        if (!element.className.includes('hidden')) {
            element.className += ' hidden';
        }
    }
}

window.onload = function() {
    
    setTimeout(function() {
        
        if (document.getElementById('loadingMessage')) {
            loadData();
        }
        
        
        if (document.getElementById('map')) {
            createMap();
        }
    }, 100);
};